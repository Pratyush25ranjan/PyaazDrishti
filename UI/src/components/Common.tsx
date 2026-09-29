import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, Download, FileText, Info, Loader2, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePortal } from '../lib/context';
import { QUALITY_META, defects, formatDate, hashString } from '../lib/data';
import type { Batch } from '../lib/data';
import { downloadReport } from '../lib/report';

export function PageHeading({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  const { t } = usePortal();
  return <>
    <nav className="breadcrumb" aria-label="Breadcrumb"><a href="#/">{t('Home')}</a><ChevronRight size={13} /><span>{t(title)}</span></nav>
    <div className="page-heading"><div><h1>{t(title)}</h1>{description && <p>{t(description)}</p>}</div>{children && <div className="page-actions">{children}</div>}</div>
  </>;
}

export function Notice({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  const Icon = warning ? TriangleAlert : Info;
  return <div className={`notice ${warning ? 'notice-warning' : ''}`}><Icon size={17} aria-hidden="true" /><div>{children}</div></div>;
}

function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const { reduceMotion } = usePortal();
  useEffect(() => {
    if (reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(value); return; }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const update = (now: number) => {
        const progress = Math.min((now - start) / 700, 1);
        setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(update);
      };
      frame = requestAnimationFrame(update);
      observer.disconnect();
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value, reduceMotion]);
  return <span ref={ref}>{display.toLocaleString('en-IN')}{suffix}</span>;
}

export function StatGrid({ stats }: { stats: { label: string; value: number; suffix?: string; icon: LucideIcon; note?: string }[] }) {
  const { t } = usePortal();
  return <div className="stats-grid">{stats.map(({ label, value, suffix, icon: Icon, note }) => <div className="stat" key={label}>
    <div className="stat-label"><span>{t(label)}</span><Icon size={21} strokeWidth={1.6} aria-hidden="true" /></div>
    <strong><Counter value={value} suffix={suffix} /></strong>
    {note && <span className="stat-note">{t(note)}</span>}
  </div>)}</div>;
}

export function EmptyState({ title = 'No matching assessments', description = 'Try a different search or reset your filters.', children }: { title?: string; description?: string; children?: ReactNode }) {
  const { t } = usePortal();
  return <div className="empty-state"><Search size={32} strokeWidth={1.4} /><h3>{t(title)}</h3><p>{t(description)}</p>{children}</div>;
}

export function QualitySummary({ batch, compact = false }: { batch: Batch; compact?: boolean }) {
  const { t } = usePortal();
  return <div className={`quality-summary ${compact ? 'compact' : ''}`}>
    <div className="quality-total"><span>{t('Total Onions Detected')}<small>Illustrative demo count</small></span><strong>{batch.sampleSize}</strong></div>
    <div className="quality-strip" aria-label="Quality distribution">{QUALITY_META.map(({ key, label, color }) => <span key={key} title={`${label}: ${batch.quality[key]}%`} style={{ width: `${batch.quality[key]}%`, backgroundColor: color }} />)}</div>
    <dl>{QUALITY_META.map(({ key, label, color }) => <div key={key} className="quality-row"><dt><span className="legend-dot" style={{ backgroundColor: color }} />{t(label)}</dt><dd><strong>{batch.quality[key]}<span>%</span></strong>{!compact && <small>{Math.round(batch.sampleSize * batch.quality[key] / 100)} onions</small>}</dd></div>)}</dl>
  </div>;
}

export function AnnotatedImage({ batch }: { batch: Batch }) {
  const [showBoxes, setShowBoxes] = useState(true);
  const { t } = usePortal();
  const boxes = batch.detections && batch.detections.length ? batch.detections.map((d) => ({ key: d.label.toLowerCase().replace(/[^a-z]/g, ''), x: d.x, y: d.y, w: d.w, h: d.h, label: d.label })) : [];
  const colorFor = (label: string) => {
    const found = QUALITY_META.find((m) => m.label.toUpperCase() === label);
    return found ? found.color : '#1E5AA8';
  };
  return <div className="annotated-sample">
    <div className="sample-toolbar"><h3>{t('Sample Image')}</h3><label className="checkbox-label"><input type="checkbox" checked={showBoxes} onChange={(event) => setShowBoxes(event.target.checked)} />{t('Show bounding boxes')}</label></div>
    <div className="annotated-image"><img src={batch.image} alt={`Onion sample for batch ${batch.id}`} />{showBoxes && <div className="bounding-boxes" aria-hidden="true">{boxes.map((box, i) => <div className="detection-box" key={i} style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, borderColor: colorFor(box.label) }}><span style={{ backgroundColor: colorFor(box.label) }}>{box.label}</span></div>)}</div>}</div>
    <p className="image-caption"><Info size={14} />Six example annotations. Positions and categories are illustrative, not actual detections.</p>
  </div>;
}

export function DetectionList({ batch }: { batch: Batch }) {
  const colorFor = (label: string) => QUALITY_META.find((m) => m.label.toUpperCase() === label)?.color || '#1E5AA8';
  return <div className="detection-list">
    {(batch.detections || []).map((d) => <div className="detection-item" key={d.id}>
      <span className="detection-id" style={{ borderColor: colorFor(d.label) }}>{d.id}</span>
      <div className="detection-body"><strong>{d.label}</strong><small>{d.note} {d.sizeMm ? `Illustrative size ~${d.sizeMm} mm.` : ''}</small></div>
      <span className="detection-conf">{d.confidence}%<small>illustrative</small></span>
    </div>)}
    <p className="small-muted">Detections are simulated interface examples. A production build would stream these from the on-device vision model with real confidence scores.</p>
  </div>;
}

export function SizeAnalysis({ batch }: { batch: Batch }) {
  const { policy } = usePortal();
  const dist = batch.sizeDistribution || { small: batch.quality.undersized, medium: 50, large: 30 };
  const rows = [{ label: `Small (< ${policy.minDiameterMm} mm)`, value: dist.small, color: '#6B7A90' }, { label: `Medium (${policy.minDiameterMm}–${policy.maxDiameterMm} mm)`, value: dist.medium, color: '#1E5AA8' }, { label: `Large (> ${policy.maxDiameterMm} mm)`, value: dist.large, color: '#C9962E' }];
  return <div className="size-analysis">
    {rows.map((row) => <div className="defect-bar" key={row.label}><div><span>{row.label}</span><strong>{row.value}%</strong></div><div className="bar-track"><span style={{ width: `${row.value}%`, backgroundColor: row.color }} /></div></div>)}
    <p className="small-muted">Size bands follow the active grading policy ({policy.version}, effective {policy.effectiveDate}). Pixel estimates are illustrative; calibrated measurement requires a reference object.</p>
  </div>;
}

export function GradingExplanation({ batch }: { batch: Batch }) {
  return <div className="grading-explanation">
    <div className="grade-badge-row"><span className="grade-badge">{batch.overallGrade || 'Grade A – Accept'}</span><span className="confidence-badge"><ShieldCheck size={14} />{batch.confidence ?? 90}% illustrative confidence</span></div>
    <ul>{(batch.gradingNotes || []).map((note, i) => <li key={i}>{note}</li>)}</ul>
    <p className="small-muted">Applied policy: {batch.ruleVersion} · Model: {batch.modelVersion}. Policy changes never require model retraining.</p>
  </div>;
}

export function MultimodalPanel({ batch }: { batch: Batch }) {
  const mm = batch.multimodal || { vision: 'connected', depth: 'not-connected', weight: 'not-connected', depthValue: '', weightValue: '' };
  const cards = [
    { title: 'Vision / Image Analysis', status: mm.vision === 'connected' ? 'Connected' : 'Not connected', ok: mm.vision === 'connected', detail: 'Sample image analysed for visible defects and size (simulated).' },
    { title: 'Depth Information', status: mm.depth === 'connected' ? `Connected${mm.depthValue ? ` · ${mm.depthValue}` : ''}` : 'Sensor not connected', ok: mm.depth === 'connected', detail: mm.depth === 'connected' ? 'Depth feed fused into size estimation.' : 'Awaiting measurement. Optional input — no fake readings generated.' },
    { title: 'Weight Information', status: mm.weight === 'connected' ? `Connected${mm.weightValue ? ` · ${mm.weightValue}` : ''}` : 'Sensor not connected', ok: mm.weight === 'connected', detail: mm.weight === 'connected' ? 'Weight feed fused into density checks.' : 'Awaiting measurement. Optional input — no fake readings generated.' },
    { title: 'Visible Defect Analysis', status: 'Available', ok: true, detail: `${defects(batch.quality)}% illustrative defect share across 4 categories.` },
    { title: 'Size Analysis', status: 'Available', ok: true, detail: `${batch.quality.undersized}% undersized against policy minimum.` },
  ];
  return <div className="multimodal-grid">{cards.map((card) => <div className={`multimodal-card ${card.ok ? 'is-ok' : 'is-idle'}`} key={card.title}><span className="multimodal-status">{card.status}</span><h4>{card.title}</h4><p>{card.detail}</p></div>)}
    <p className="small-muted multimodal-note">Combined assessment fuses connected inputs only. Disconnected sensors are shown honestly and never contribute fabricated values.</p>
  </div>;
}

export function VerificationBadge({ batch, compact = false }: { batch: Batch; compact?: boolean }) {
  const seed = hashString(batch.verificationId || batch.id);
  const cells = Array.from({ length: 25 }, (_, i) => ((seed >> (i % 16)) + i * 7) % 3 !== 0);
  return <div className={`verify-badge ${compact ? 'compact' : ''}`}>
    <svg className="mock-qr" viewBox="0 0 5 5" role="img" aria-label={`Prototype verification pattern for ${batch.verificationId}`}>
      {cells.map((filled, i) => filled ? <rect key={i} x={i % 5} y={Math.floor(i / 5)} width="1" height="1" fill="#1E3A5F" /> : null)}
      <rect x="0" y="0" width="5" height="5" fill="none" stroke="#1E3A5F" strokeWidth="0.15" />
    </svg>
    <div><span className="verify-label"><BadgeCheck size={14} />Report Verification ID</span><strong>{batch.verificationId}</strong>{!compact && <small>Prototype traceability mock — not a cryptographic signature. <a href={`#/verify/${batch.verificationId}`}>Verify this report</a></small>}</div>
  </div>;
}

export function DownloadButton({ batch, small = false }: { batch: Batch; small?: boolean }) {
  const [busy, setBusy] = useState(false);
  const { notify, t } = usePortal();
  const download = async () => {
    setBusy(true);
    try { await downloadReport(batch); notify(`Report ${batch.reportId} downloaded.`); }
    catch { notify('The report could not be downloaded. Please try again or use Print Report.'); }
    finally { setBusy(false); }
  };
  return <button className={small ? 'table-link' : 'button button-primary'} onClick={download} disabled={busy} aria-label={`Download report ${batch.reportId}`}>{busy ? <Loader2 size={16} className="spin" /> : <Download size={16} />}{small ? 'PDF' : t('Download Report')}</button>;
}

export function BatchTable({ records, variant = 'batches', limit }: { records: Batch[]; variant?: 'batches' | 'history' | 'reports'; limit?: number }) {
  const [page, setPage] = useState(1);
  const { t } = usePortal();
  const pageSize = limit || 8;
  const pages = Math.max(1, Math.ceil(records.length / pageSize));
  useEffect(() => { setPage(1); }, [records]);
  const shown = records.slice((page - 1) * pageSize, page * pageSize);
  const reporting = variant === 'reports';
  const showCenter = variant !== 'batches';
  if (!records.length) return <EmptyState />;
  return <div className="records-table">
    <div className="table-scroll" tabIndex={0} role="region" aria-label={`${variant} table, scroll horizontally on small screens`}>
      <table><caption className="sr-only">{reporting ? 'Downloadable demonstration assessment reports' : 'Onion assessment batches and quality summaries'}</caption>
        <thead><tr>{reporting && <th>{t('Report ID')}</th>}<th>{t('Batch ID')}</th><th>{t('Date')}</th>{showCenter && <th>{t('Procurement Center')}</th>}<th className="text-right">{t('Sample Size')}</th>{!reporting && <><th className="text-right">{t('Grade A')}</th><th className="text-right">{t('URS')}</th><th className="text-right">{t('Defects')}</th></>}<th className="actions-heading">{t('Report')}</th></tr></thead>
        <tbody>{shown.map((batch) => <tr key={batch.id}>{reporting && <td><a className="id-link" href={`#/reports/${batch.id}`}>{batch.reportId}</a></td>}<td><a className="id-link" href={`#/results/${batch.id}`}>{batch.id}</a></td><td className="nowrap">{formatDate(batch.date)}</td>{showCenter && <td>{batch.center}</td>}<td className="text-right tabular-nums">{batch.sampleSize}</td>{!reporting && <><td className="text-right grade-value">{batch.quality.gradeA}%</td><td className="text-right urs-value">{batch.quality.urs}%</td><td className="text-right">{defects(batch.quality)}%</td></>}<td><div className="row-actions"><a className="table-link" href={`#/${reporting ? 'reports' : 'results'}/${batch.id}`}>{t('View')}<ArrowRight size={13} /></a>{reporting ? <DownloadButton batch={batch} small /> : <a className="table-link muted-link" href={`#/reports/${batch.id}`}><FileText size={14} />{t('Report')}</a>}</div></td></tr>)}</tbody>
      </table>
    </div>
    {!limit && <div className="pagination"><span>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, records.length)} of {records.length} {reporting ? 'reports' : 'batches'}</span><div><button aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} />{t('Previous')}</button><span className="page-indicator">{page} / {pages}</span><button aria-label="Next page" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>{t('Next')}<ChevronRight size={16} /></button></div></div>}
  </div>;
}
