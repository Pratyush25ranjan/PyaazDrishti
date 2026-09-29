import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Boxes, ChevronRight, FileText, House, LogIn, LogOut, Menu, Search, ScanLine, UserRound, Wifi, WifiOff, X } from 'lucide-react';
import { usePortal } from '../lib/context';
import { ASSETS, BRAND_NAME, BRAND_TAGLINE, DISCLAIMER, go } from '../lib/data';

export const NAV = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'AI Assessment', path: '/assessment' },
  { label: 'Batches', path: '/batches' },
  { label: 'Reports', path: '/reports' },
  { label: 'History', path: '/history' },
  { label: 'Edge AI', path: '/edge' },
  { label: 'Grading', path: '/grading' },
  { label: 'Verify', path: '/verify' },
  { label: 'Standards', path: '/standards' },
  { label: 'Help', path: '/help' },
];

export function Emblem({ small = false }: { small?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? <div className={`emblem-placeholder ${small ? 'small' : ''}`} aria-label="Government emblem placeholder">GOI<small>Emblem<br />placeholder</small></div> : <img className={`national-emblem ${small ? 'small' : ''}`} src={ASSETS.emblem} alt="State Emblem of India, the Ashoka Lion Capital" width="55" height="88" onError={() => setFailed(true)} />;
}

function AuthDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { login, notify } = usePortal();
  const [name, setName] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [center, setCenter] = useState('Lasalgaon, Maharashtra');
  const [error, setError] = useState('');
  useEffect(() => { dialog.current?.showModal(); }, []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) { setError('Please enter your full name.'); return; }
    if (officerId.trim().length < 3) { setError('Please enter a valid Officer ID (minimum 3 characters).'); return; }
    login({ name: name.trim(), id: officerId.trim().toUpperCase(), role: 'Quality Inspector', center });
    notify(`Welcome, ${name.trim()}. You are signed in for this demo session.`);
    onClose();
  };
  return <dialog ref={dialog} className="auth-dialog" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="login-title">
    <div className="dialog-heading"><h2 id="login-title">Inspector Login</h2><button className="icon-button" onClick={onClose} aria-label="Close login"><X size={21} /></button></div>
    <p className="auth-intro"><strong>{BRAND_NAME}</strong> demo sign-in. No password is required for this prototype; your session stays on this device.</p>
    <form onSubmit={submit} className="auth-form">
      <label className="field"><span>Full Name <span className="required">*</span></span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" autoComplete="name" /></label>
      <label className="field"><span>Officer ID <span className="required">*</span></span><input value={officerId} onChange={(e) => setOfficerId(e.target.value)} placeholder="e.g. OFF-1024" autoComplete="off" /></label>
      <label className="field"><span>Procurement Center</span><select value={center} onChange={(e) => setCenter(e.target.value)}><option>Lasalgaon, Maharashtra</option><option>Pimpalgaon, Maharashtra</option><option>Nashik, Maharashtra</option><option>Indore, Madhya Pradesh</option></select></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary full-width" type="submit"><LogIn size={16} />Sign In</button>
      <p className="auth-hint">Demo only. Use any name and ID, e.g. “Demo Officer / OFF-DEMO-01”. <a href="#/login">Open full login page</a></p>
    </form>
  </dialog>;
}

export function Header({ path }: { path: string }) {
  const { t, language, setLanguage, textSize, setTextSize, user, logout, online, notify } = usePortal();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [path]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        menuToggle.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [menuOpen]);
  const active = (target: string) => target === '/' ? path === '/' : path.startsWith(target) || (target === '/assessment' && path.startsWith('/results'));
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!menuOpen) window.requestAnimationFrame(() => document.querySelector<HTMLAnchorElement>('#primary-menu a')?.focus({ preventScroll: true }));
  };
  const doLogout = () => { logout(); notify('You have been signed out of this demo session.'); };
  return <>
    <header className="site-header">
      <div className="utility-bar"><div className="container utility-inner">
        <span className="utility-country"><span className="india-flag" aria-hidden="true"><i /></span>{t('Government of India')}</span>
        <div className="utility-links">
          <span className={`online-indicator ${online ? 'is-online' : 'is-offline'}`} role="status" title={online ? 'Online – sync available' : 'Offline – results will be stored locally'}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}<span>{online ? 'Online' : 'Offline'}</span>
          </span>
          <a href="#main-content" className="skip-link" onClick={(event) => { event.preventDefault(); const main = document.getElementById('main-content'); main?.focus(); main?.scrollIntoView(); }}>{t('Skip to Main Content')}</a>
          <a className="screen-reader-link" href="#/accessibility">{t('Screen Reader Access')}</a>
          <div className="font-controls" aria-label="Text size"><button onClick={() => setTextSize(Math.max(14, textSize - 1))} disabled={textSize <= 14} aria-label="Decrease text size">A-</button><button onClick={() => setTextSize(16)} aria-label="Reset text size">A</button><button onClick={() => setTextSize(Math.min(19, textSize + 1))} disabled={textSize >= 19} aria-label="Increase text size">A+</button></div>
          <div className="language-controls"><button className={language === 'en' ? 'selected' : ''} onClick={() => setLanguage('en')} aria-pressed={language === 'en'} lang="en">English</button><span>|</span><button className={language === 'hi' ? 'selected' : ''} onClick={() => setLanguage('hi')} aria-pressed={language === 'hi'} lang="hi">हिंदी</button></div>
          <button className="utility-search" onClick={() => setSearchOpen(true)} aria-label={t('Search')}><Search size={13} /><span>{t('Search')}</span></button>
        </div>
      </div></div>
      <div className="container identity-header">
        <a className="government-identity" href="#/" aria-label={`${BRAND_NAME} home`}><Emblem /><div className="identity-copy"><span className="government-name">{t('Government of India')}</span><strong>{t('Department of Food & Public Distribution')}</strong><span className="brand-name">{t(BRAND_NAME)}</span><span className="project-name">{t(BRAND_TAGLINE)}</span></div></a>
        <div className="header-portrait"><img src={ASSETS.modiPortrait} alt="Prime Minister of India, Narendra Modi" width="68" height="84" /></div>
      </div>
      <nav className="main-nav" aria-label="Main navigation"><div className="container nav-inner">
        <button ref={menuToggle} className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="primary-menu">{menuOpen ? <X size={20} /> : <Menu size={20} />}<span>{t('Menu')}</span></button>
        <span className="mobile-nav-title">{t(NAV.find((item) => active(item.path))?.label || 'Menu')}</span>
        <div id="primary-menu" className={`nav-links ${menuOpen ? 'is-open' : ''}`}>{NAV.map((item, index) => <a key={item.path} href={`#${item.path}`} onClick={() => setMenuOpen(false)} className={active(item.path) ? 'active' : ''} aria-current={active(item.path) ? 'page' : undefined}>{index === 0 && <House size={15} strokeWidth={1.8} />}{t(item.label)}</a>)}</div>
        <div className="nav-auth">
          {user ? <><span className="nav-user" title={`${user.name} (${user.id})`}><UserRound size={15} /><span>{user.name.split(' ')[0]}</span></span><button className="login-button is-logged" onClick={doLogout} aria-label="Sign out"><LogOut size={15} /><span>{t('Logout')}</span></button></> : <button className="login-button" onClick={() => setAuthOpen(true)}><LogIn size={15} /><span>{t('Login')}</span></button>}
        </div>
      </div></nav>
    </header>
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {[{ label: 'Home', path: '/', icon: House }, { label: 'Assess', path: '/assessment', icon: ScanLine }, { label: 'Batches', path: '/batches', icon: Boxes }, { label: 'Reports', path: '/reports', icon: FileText }].map(({ label, path: target, icon: Icon }) => <a href={`#${target}`} className={active(target) ? 'active' : ''} aria-current={active(target) ? 'page' : undefined} key={target}><Icon size={20} strokeWidth={1.7} /><span>{t(label)}</span></a>)}
      <button onClick={toggleMenu} aria-expanded={menuOpen} aria-controls="primary-menu"><Menu size={20} /><span>{t('Menu')}</span></button>
    </nav>
    {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}
    {authOpen && !user && <AuthDialog onClose={() => setAuthOpen(false)} />}
  </>;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const { t, records } = usePortal();
  useEffect(() => { dialog.current?.showModal(); }, []);
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const pages = NAV.filter((item) => !normalized || `${item.label} ${t(item.label)}`.toLowerCase().includes(normalized)).map((item) => ({ title: t(item.label), description: 'Portal page', path: item.path }));
    const batches = normalized ? records.filter((batch) => `${batch.id} ${batch.center} ${batch.reportId} ${batch.verificationId}`.toLowerCase().includes(normalized)).slice(0, 6).map((batch) => ({ title: batch.id, description: batch.center, path: `/results/${batch.id}` })) : [];
    return [...pages, ...batches].slice(0, 8);
  }, [query, records, t]);
  return <dialog ref={dialog} className="search-dialog" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="search-title">
    <div className="dialog-heading"><h2 id="search-title">{t('Search')} the portal</h2><button className="icon-button" onClick={onClose} aria-label="Close search"><X size={21} /></button></div>
    <form onSubmit={(event) => { event.preventDefault(); if (matches[0]) { go(matches[0].path); onClose(); } }}><label className="search-field"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, batch IDs or centers" aria-label="Search pages, batches and procurement centers" /></label></form>
    <div className="search-results" aria-live="polite">{matches.length ? matches.map((match) => <a href={`#${match.path}`} onClick={onClose} key={match.path}><div><strong>{match.title}</strong><small>{match.description}</small></div><ChevronRight size={17} /></a>) : <p className="search-empty">No results found. Try "assessment", "standards" or a batch ID.</p>}</div>
    <p className="search-hint">Use Tab to select a result. Press Escape to close.</p>
  </dialog>;
}

export function Footer() {
  const { t } = usePortal();
  return <footer className="site-footer"><div className="container">
    <div className="footer-main"><div className="footer-identity"><strong>{BRAND_NAME}</strong><span>{BRAND_TAGLINE}</span><span className="footer-gov">{t('Government of India')} · {t('Department of Food & Public Distribution')}</span></div><nav aria-label="Footer navigation">{[{ label: 'About Project', path: 'about' }, { label: 'Help', path: 'help' }, { label: 'Accessibility', path: 'accessibility' }, { label: 'Contact', path: 'contact' }, { label: 'Privacy', path: 'privacy' }, { label: 'Feedback', path: 'feedback' }].map((link) => <a key={link.path} href={`#/${link.path}`}>{t(link.label)}</a>)}</nav></div>
    <p className="footer-disclaimer">{DISCLAIMER}</p>
    <div className="footer-bottom"><span>Demonstration only; not an official government service.</span><a href="#/about">Image credits & project information<ArrowRight size={12} /></a></div>
  </div></footer>;
}
