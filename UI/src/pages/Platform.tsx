import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, BadgeCheck, Check, CloudOff, CloudUpload, Cpu, History, LogIn, LogOut, RefreshCw, Save, Search, Settings2, ShieldCheck, UserRound, Wifi, WifiOff } from 'lucide-react';
import { Notice, PageHeading, VerificationBadge } from '../components/Common';
import { usePortal } from '../lib/context';
import { BRAND_NAME, CENTERS, DEFAULT_POLICY, formatDate } from '../lib/data';
import type { GradingPolicy } from '../lib/data';

export function EdgeAI() {
  const { online, edge, syncEdge, notify, records } = usePortal();
  const totalCorrections = edge.corrections + records.reduce((sum, r) => sum + (r.corrections || 0), 0);
  const cards = [
    { title: 'Local Model Status', value: edge.localModel, icon: Cpu, note: 'On-device inference architecture ready. Demo runs simulated inference locally.' },
    { title: 'Regional Adaptation', value: edge.regionalStatus, icon: Settings2, note: 'Onion appearance varies by region and season. Local profiles adapt via inspector corrections.' },
    { title: 'Last Model Update', value: formatDate(edge.lastUpdate, true), icon: History, note: 'Simulated timestamp. A production build would record real aggregation rounds.' },
    { title: 'Inspector Corrections', value: `${totalCorrections} recorded`, icon: Check, note: 'Corrections from result pages improve only the local model state.' },
    { title: 'Federated Sync', value: edge.syncStatus === 'synced' ? 'Synced (simulated)' : `${edge.pendingUploads} update(s) pending`, icon: CloudUpload, note: 'Only model-update signals sync — raw inspection images are never shared.' },
    { title: 'Connectivity', value: online ? 'Online' : 'Offline — edge mode', icon: online ? Wifi : WifiOff, note: online ? 'Sync available. New assessments upload update signals.' : 'Inspection continues on-device; results queue locally until reconnected.' },
  ];
  return <div className="container interior-page page-enter">
    <PageHeading title="Edge AI & Federated Learning" description="Offline-first inspection with regional adaptation — prototype state, honestly labeled."><button className="button button-primary" onClick={() => { syncEdge(); notify(online ? 'Edge sync simulated. Pending model updates marked as synced.' : 'Offline. Updates remain queued on this device.'); }}><RefreshCw size={16} />Sync Now</button></PageHeading>
    <Notice><strong>Prototype architecture, not real federated training. </strong>No actual model training or aggregation runs in this demo. The cards below show realistic frontend state so a real edge-AI service can be integrated later.</Notice>
    <div className="edge-grid">{cards.map(({ title, value, icon: Icon, note }) => <div className="edge-card" key={title}><div className="edge-card-head"><Icon size={20} strokeWidth={1.7} /><span>{title}</span></div><strong>{value}</strong><p>{note}</p></div>)}</div>
    <div className="edge-flow">
      <h2>How regional learning works (concept)</h2>
      <ol className="edge-steps">
        <li><strong>1. Inspect on-device.</strong> The edge model grades the sample locally, even offline.</li>
        <li><strong>2. Inspector corrects.</strong> Wrong boxes or grades are corrected on the result page.</li>
        <li><strong>3. Local model adapts.</strong> Corrections tune the regional profile on this device.</li>
        <li><strong>4. Only updates sync.</strong> Parameter deltas — never raw images — go to the central aggregator.</li>
        <li><strong>5. Regions improve.</strong> The center merges updates and ships an improved regional model.</li>
      </ol>
      <div className="button-row"><a className="button button-secondary" href="#/assessment">Run an Inspection<ArrowRight size={15} /></a><a className="button button-secondary" href="#/grading">Review Grading Policy<ArrowRight size={15} /></a></div>
    </div>
    <div className="offline-panel"><CloudOff size={20} /><div><h3>Offline-First Edge AI</h3><p>AI inspection is designed to run directly on the device. Basic inspection works without internet, results store locally, and data synchronizes when connectivity returns. Current status: <strong>{online ? 'Online' : 'Offline'}</strong> · Pending: <strong>{edge.pendingUploads}</strong>.</p></div></div>
  </div>;
}

function NumberField({ label, value, onChange, min, max, step, hint }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; hint?: string }) {
  return <label className="field"><span>{label}</span><input type="number" value={value} min={min} max={max} step={step || 1} onChange={(e) => onChange(Number(e.target.value))} />{hint && <small>{hint}</small>}</label>;
}

export function GradingPolicyPage() {
  const { policy, updatePolicy, notify, user } = usePortal();
  const [draft, setDraft] = useState<GradingPolicy>({ ...policy });
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof GradingPolicy>(key: K, value: GradingPolicy[K]) => { setDraft((prev) => ({ ...prev, [key]: value })); setSaved(false); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (draft.minDiameterMm >= draft.maxDiameterMm) { notify('Minimum diameter must be smaller than maximum diameter.'); return; }
    if (draft.gradeAMaxDefectPct > draft.defectLimitPct) { notify('Grade A defect limit cannot exceed the overall defect limit.'); return; }
    updatePolicy({ ...draft, updatedBy: user ? `${user.name} (${user.id})` : 'Demo administrator', updatedAt: new Date().toISOString() });
    setSaved(true);
    notify(`Grading policy ${draft.version} activated. The AI model was not modified or retrained.`);
  };
  const reset = () => { setDraft({ ...DEFAULT_POLICY }); setSaved(false); };
  return <div className="container interior-page page-enter">
    <PageHeading title="Grading Policy Configuration" description="Government-configurable thresholds. Policy changes apply instantly — no model retraining."><button className="button button-secondary" onClick={reset}><RefreshCw size={15} />Restore Demo Defaults</button></PageHeading>
    <Notice><strong>Active policy: {policy.version}</strong> (effective {policy.effectiveDate}, updated by {policy.updatedBy}). Reports always record which policy version graded them.</Notice>
    <form className="policy-form" onSubmit={submit}>
      <div className="policy-grid">
        <label className="field"><span>Policy Version <span className="required">*</span></span><input value={draft.version} onChange={(e) => set('version', e.target.value)} required maxLength={40} /></label>
        <label className="field"><span>Effective Date <span className="required">*</span></span><input type="date" value={draft.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} required /></label>
        <NumberField label="Minimum Diameter (mm)" value={draft.minDiameterMm} onChange={(v) => set('minDiameterMm', v)} min={20} max={80} hint="Onions below this are undersized." />
        <NumberField label="Maximum Diameter (mm)" value={draft.maxDiameterMm} onChange={(v) => set('maxDiameterMm', v)} min={50} max={130} hint="Upper bound for the standard band." />
        <NumberField label="Grade A Minimum Share (%)" value={draft.gradeAMinPct} onChange={(v) => set('gradeAMinPct', v)} min={0} max={100} />
        <NumberField label="Grade A Max Defects (%)" value={draft.gradeAMaxDefectPct} onChange={(v) => set('gradeAMaxDefectPct', v)} min={0} max={100} />
        <NumberField label="URS Minimum Share (%)" value={draft.ursMinPct} onChange={(v) => set('ursMinPct', v)} min={0} max={100} />
        <NumberField label="URS Max Defects (%)" value={draft.ursMaxDefectPct} onChange={(v) => set('ursMaxDefectPct', v)} min={0} max={100} />
        <NumberField label="Overall Defect Limit (%)" value={draft.defectLimitPct} onChange={(v) => set('defectLimitPct', v)} min={0} max={100} hint="Above this, batches are held for review." />
        <NumberField label="Undersized Limit (%)" value={draft.undersizedLimitPct} onChange={(v) => set('undersizedLimitPct', v)} min={0} max={100} />
      </div>
      <label className="field"><span>Regional Grading Parameters / Notes</span><textarea value={draft.regionalNote} onChange={(e) => set('regionalNote', e.target.value)} rows={3} maxLength={600} placeholder="e.g. Nashik Rabi lots allow +2% sprouting tolerance during humid weeks." /></label>
      {saved && <p className="form-success" role="status"><Check size={16} />Policy {draft.version} is now active. Future assessments and reports will reference it.</p>}
      <div className="button-row"><button className="button button-primary" type="submit"><Save size={16} />Activate Policy</button><a className="button button-secondary" href="#/assessment">Test with New Assessment<ArrowRight size={15} /></a></div>
      <p className="small-muted">Policy store is versioned locally in this prototype (key <code>pyaaz-policy-v1</code>). A production build would add role-based access, approval workflows and a server-side audit log.</p>
    </form>
  </div>;
}

export function VerifyReport({ preset }: { preset?: string }) {
  const { records } = usePortal();
  const [query, setQuery] = useState(preset || '');
  const match = useMemo(() => {
    const q = (preset || query).trim().toUpperCase();
    if (!q) return undefined;
    return records.find((r) => r.verificationId.toUpperCase() === q || r.reportId.toUpperCase() === q || r.id.toUpperCase() === q);
  }, [query, preset, records]);
  return <div className="container interior-page page-enter">
    <PageHeading title="Verify Report" description="Trace any digital report by its Verification ID." />
    <Notice warning><strong>Prototype verification flow. </strong>Matches are looked up in this device's local records only. No cryptographic signature is verified in this demo.</Notice>
    <form className="verify-form" onSubmit={(e) => e.preventDefault()}>
      <label className="field"><span>Verification ID / Report ID / Batch ID</span><input value={preset || query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. PDV-0128-A3F9" /></label>
      <button className="button button-primary" type="button" onClick={() => setQuery(query)}><Search size={16} />Verify</button>
    </form>
    {(preset || query).trim() && (match ? <div className="verify-result page-enter">
      <div className="verify-found"><BadgeCheck size={26} /><div><h2>Record found (local match)</h2><p>Batch {match.id} · {formatDate(match.date, true)} · {match.center}</p></div></div>
      <dl className="report-metadata">{[['Overall Grade', match.overallGrade], ['Grade A / URS / Defects', `${match.quality.gradeA}% / ${match.quality.urs}% / ${match.quality.damaged + match.quality.rotten + match.quality.sprouted + match.quality.undersized}%`], ['Officer', `${match.officerName} (${match.officerId})`], ['Policy / Model', `${match.ruleVersion} / ${match.modelVersion}`]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <VerificationBadge batch={match} />
      <div className="button-row" style={{ marginTop: 18 }}><a className="button button-primary" href={`#/reports/${match.id}`}>Open Full Report<ArrowRight size={15} /></a><a className="button button-secondary" href={`#/results/${match.id}`}>Open Result</a></div>
    </div> : <div className="verify-result"><Notice warning>No local record matches “{(preset || query).trim()}”. The report may be on another device, or the ID may be mistyped.</Notice></div>)}
    <div className="reading-width" style={{ marginTop: 26 }}><h2 className="sub-section">What verification proves here</h2><ul className="plain-list"><li><strong>Traceability:</strong> the ID resolves to one stored inspection with officer, timestamp and location.</li><li><strong>Version pinning:</strong> the report shows the exact policy and model versions used.</li><li><strong>Not yet:</strong> cryptographic signing, server anchoring or tamper evidence. Those require backend integration.</li></ul></div>
  </div>;
}

export function LoginPage() {
  const { user, login, logout, notify } = usePortal();
  const [name, setName] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [center, setCenter] = useState(CENTERS[0]);
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) { setError('Please enter your full name.'); return; }
    if (officerId.trim().length < 3) { setError('Please enter a valid Officer ID (minimum 3 characters).'); return; }
    login({ name: name.trim(), id: officerId.trim().toUpperCase(), role: 'Quality Inspector', center });
    notify(`Welcome, ${name.trim()}. You are signed in for this demo session.`);
  };
  return <div className="container interior-page page-enter">
    <PageHeading title="Inspector Login" description={`${BRAND_NAME} demo sign-in. Sessions stay on this device.`} />
    <div className="reading-width">
      {user ? <div className="login-card"><UserRound size={34} strokeWidth={1.5} /><h2>Signed in as {user.name}</h2><p>Officer ID: <strong>{user.id}</strong> · Role: {user.role} · Center: {user.center}</p><p>Your name and ID are attached to new assessments and reports automatically.</p><div className="button-row"><a className="button button-primary" href="#/assessment">Start Assessment<ArrowRight size={15} /></a><button className="button button-secondary" onClick={() => { logout(); notify('You have been signed out of this demo session.'); }}><LogOut size={15} />Sign Out</button></div></div>
      : <form className="login-card" onSubmit={submit}><ShieldCheck size={34} strokeWidth={1.5} /><h2>Sign in to {BRAND_NAME}</h2><p className="login-sub">No password is required for this prototype. Use any name and ID.</p>
        <label className="field"><span>Full Name <span className="required">*</span></span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" autoComplete="name" /></label>
        <label className="field"><span>Officer ID <span className="required">*</span></span><input value={officerId} onChange={(e) => setOfficerId(e.target.value)} placeholder="e.g. OFF-1024" autoComplete="off" /></label>
        <label className="field"><span>Procurement Center</span><select value={center} onChange={(e) => setCenter(e.target.value)}>{CENTERS.map((c) => <option key={c}>{c}</option>)}</select></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary full-width" type="submit"><LogIn size={16} />Sign In</button>
        <p className="small-muted">Demo credentials: “Demo Officer / OFF-DEMO-01”. Sessions persist in this browser until you sign out.</p>
      </form>}
      <Notice><strong>Prototype authentication. </strong>There is no backend, password check or role enforcement. A production deployment needs secure identity, session expiry and audit logging.</Notice>
    </div>
  </div>;
}
