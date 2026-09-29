import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Footer, Header, NAV } from './components/Layout';
import { PortalContext } from './lib/context';
import type { PortalUser } from './lib/context';
import { createExamples, loadEdge, loadPolicy, loadRecords, saveEdge, savePolicy } from './lib/data';
import type { Batch, EdgeState, GradingPolicy } from './lib/data';
import { hindi } from './lib/i18n';
import Home from './pages/Home';
import Assessment from './pages/Assessment';
import { AssessmentResult, Dashboard, RecordList, ReportDetail } from './pages/Records';
import { About, Accessibility, Contact, Feedback, Help, NotFound, Privacy, Standards } from './pages/Information';
import { EdgeAI, GradingPolicyPage, LoginPage, VerifyReport } from './pages/Platform';

function getPath() {
  const raw = window.location.hash.slice(1);
  return raw.startsWith('/') ? raw.replace(/\/$/, '') || '/' : '/';
}

function loadSettings(): { language: 'en' | 'hi'; textSize: number; reduceMotion: boolean } {
  try {
    const value = JSON.parse(localStorage.getItem('onion-portal-settings') || '{}');
    return { language: value.language === 'hi' ? 'hi' : 'en', textSize: Number.isFinite(value.textSize) ? Math.max(14, Math.min(19, value.textSize)) : 16, reduceMotion: Boolean(value.reduceMotion) };
  } catch { return { language: 'en', textSize: 16, reduceMotion: false }; }
}

function loadUser(): PortalUser {
  try {
    const value = JSON.parse(localStorage.getItem('pyaaz-session-v1') || 'null');
    if (value && typeof value.name === 'string' && typeof value.id === 'string') return value as PortalUser;
  } catch { /* no session */ }
  return null;
}

export default function App() {
  const [path, setPath] = useState(getPath);
  const [records, setRecords] = useState(loadRecords);
  const [settings] = useState(loadSettings);
  const [language, setLanguage] = useState(settings.language);
  const [textSize, setTextSize] = useState(settings.textSize);
  const [reduceMotion, setReduceMotion] = useState(settings.reduceMotion);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const [user, setUser] = useState<PortalUser>(loadUser);
  const [policy, setPolicy] = useState<GradingPolicy>(loadPolicy);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [edge, setEdge] = useState<EdgeState>(loadEdge);
  const recordsRef = useRef(records);
  const previousPath = useRef(path);
  const notify = useCallback((message: string) => setToast({ id: Date.now(), message }), []);
  const t = useCallback((text: string) => language === 'hi' ? hindi[text] || text : text, [language]);
  useEffect(() => {
    const update = () => setPath(getPath());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    const goOnline = () => { setOnline(true); notify('Back online. Pending edge updates can now sync.'); };
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, [notify]);
  useEffect(() => {
    if (previousPath.current !== path) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.getElementById('main-content')?.focus({ preventScroll: true });
    }
    previousPath.current = path;
    const label = NAV.find((item) => item.path !== '/' && path.startsWith(item.path))?.label || (path === '/' ? 'Home' : path.startsWith('/results') ? 'Assessment Result' : path.slice(1).split('/')[0]);
    document.title = `${label.charAt(0).toUpperCase() + label.slice(1)} | Pyaaz Drishti`;
  }, [path]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.style.fontSize = `${textSize}px`;
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
    try { localStorage.setItem('onion-portal-settings', JSON.stringify({ language, textSize, reduceMotion })); } catch { /* Display controls still work when storage is unavailable. */ }
  }, [language, textSize, reduceMotion]);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 6500);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  const saveBatch = useCallback((batch: Batch) => {
    const next = [batch, ...recordsRef.current.filter((item) => item.id !== batch.id)];
    recordsRef.current = next;
    setRecords(next);
    try { localStorage.setItem('onion-portal-records-v1', JSON.stringify(next)); notify('Assessment completed. Your demo result is saved on this device.'); }
    catch { notify('Assessment completed for this session. Browser storage is full or unavailable; download your report before leaving.'); }
    setEdge((prev) => {
      const queued = !navigator.onLine ? prev.pendingUploads + 1 : prev.pendingUploads;
      const updated: EdgeState = { ...prev, pendingUploads: queued, syncStatus: queued > 0 ? 'pending' : prev.syncStatus, lastUpdate: new Date().toISOString() };
      saveEdge(updated);
      return updated;
    });
  }, [notify]);
  const clearRecords = useCallback(() => {
    try {
      localStorage.removeItem('onion-portal-records-v1');
      localStorage.removeItem('onion-portal-feedback');
      const examples = createExamples();
      recordsRef.current = examples; setRecords(examples);
      notify('Saved project data has been cleared. The example dataset has been restored.');
    } catch { notify('Browser storage could not be cleared. Please use your browser settings to remove this site\'s data.'); }
  }, [notify]);
  const login = useCallback((next: Exclude<PortalUser, null>) => {
    setUser(next);
    try { localStorage.setItem('pyaaz-session-v1', JSON.stringify(next)); } catch { /* session-only */ }
  }, []);
  const logout = useCallback(() => {
    setUser(null);
    try { localStorage.removeItem('pyaaz-session-v1'); } catch { /* ignore */ }
  }, []);
  const updatePolicy = useCallback((next: GradingPolicy) => {
    setPolicy(next);
    savePolicy(next);
  }, []);
  const addCorrection = useCallback((batchId: string, note: string) => {
    const next = recordsRef.current.map((item) => item.id === batchId ? { ...item, corrections: (item.corrections || 0) + 1 } : item);
    recordsRef.current = next;
    setRecords(next);
    try { localStorage.setItem('onion-portal-records-v1', JSON.stringify(next)); } catch { /* ignore */ }
    try {
      const existing = JSON.parse(localStorage.getItem('pyaaz-corrections-v1') || '[]');
      localStorage.setItem('pyaaz-corrections-v1', JSON.stringify([{ batchId, note, date: new Date().toISOString() }, ...(Array.isArray(existing) ? existing : [])].slice(0, 100)));
    } catch { /* ignore */ }
    setEdge((prev) => {
      const updated: EdgeState = { ...prev, corrections: prev.corrections + 1, pendingUploads: prev.pendingUploads + 1, syncStatus: 'pending', lastUpdate: new Date().toISOString() };
      saveEdge(updated);
      return updated;
    });
  }, []);
  const syncEdge = useCallback(() => {
    if (!navigator.onLine) return;
    setEdge((prev) => {
      const updated: EdgeState = { ...prev, pendingUploads: 0, syncStatus: 'synced', lastUpdate: new Date().toISOString() };
      saveEdge(updated);
      return updated;
    });
  }, []);
  const [page, id] = path.slice(1).split('/');
  const batch = id ? records.find((item) => item.id === id) : undefined;
  const content = (() => {
    switch (page) {
      case '': return <Home />;
      case 'assessment': return <Assessment />;
      case 'dashboard': return <Dashboard />;
      case 'batches': return <RecordList kind="batches" key="batches" />;
      case 'history': return <RecordList kind="history" key="history" />;
      case 'reports': return id ? <ReportDetail batch={batch} /> : <RecordList kind="reports" key="reports" />;
      case 'results': return <AssessmentResult batch={batch} />;
      case 'edge': return <EdgeAI />;
      case 'grading': return <GradingPolicyPage />;
      case 'verify': return <VerifyReport preset={id} />;
      case 'login': return <LoginPage />;
      case 'standards': return <Standards />;
      case 'help': return <Help />;
      case 'about': return <About />;
      case 'accessibility': return <Accessibility />;
      case 'privacy': return <Privacy />;
      case 'contact': return <Contact />;
      case 'feedback': return <Feedback />;
      default: return <NotFound />;
    }
  })();
  return <PortalContext.Provider value={{ records, saveBatch, clearRecords, language, setLanguage, textSize, setTextSize, reduceMotion, setReduceMotion, notify, t, user, login, logout, policy, updatePolicy, online, edge, addCorrection, syncEdge }}><div className="portal-shell"><Header path={path} /><main id="main-content" tabIndex={-1}>{content}</main><Footer />{toast && <div className="toast" role="status"><Check size={18} /><span>{toast.message}</span><button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={17} /></button></div>}</div></PortalContext.Provider>;
}
