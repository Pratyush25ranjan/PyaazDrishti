import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Boxes, CircleCheck, Cpu, Download, FileText, Info, PenLine, Plus, Printer, RotateCcw, Search, Settings2, SlidersHorizontal, TriangleAlert } from 'lucide-react';
import { AnnotatedImage, BatchTable, DetectionList, DownloadButton, EmptyState, GradingExplanation, MultimodalPanel, Notice, PageHeading, QualitySummary, SizeAnalysis, StatGrid, VerificationBadge } from '../components/Common';
import { Emblem } from '../components/Layout';
import { usePortal } from '../lib/context';
import { BRAND_NAME, BRAND_TAGLINE, CENTERS, DISCLAIMER, QUALITY_META, defects, downloadCsv, formatDate, localDate, summarize } from '../lib/data';
import type { Batch } from '../lib/data';

function NewAssessmentLink() {
  const { t } = usePortal();
  return <a className="button button-primary" href="#/assessment"><Plus size={17} />{t('New Assessment')}</a>;
}

export function Dashboard() {
  const { records, t, policy, online, edge } = usePortal();
  const [period, setPeriod] = useState('today');
  const [center, setCenter] = useState('all');
  const filtered = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    if (period === 'week') start.setDate(start.getDate() - 6);
    if (period === 'month') start.setDate(start.getDate() - 29);
    return records.filter((record) => (period === 'all' || new Date(record.date) >= start) && (center === 'all' || record.center === center));
  }, [period, center, records]);
  const { quality, total } = summarize(filtered);
  const parts = [{ label: 'Grade A', value: quality.gradeA, color: '#1E5AA8' }, { label: 'URS', value: quality.urs, color: '#C9962E' }, { label: 'Defects', value: defects(quality), color: '#C96A2C' }];
  const circumference = 2 * Math.PI * 70;
  let offset = 0;
  return <div className="container interior-page page-enter">
    <PageHeading title="Dashboard" description="A clear view of sample quality across procurement centers."><NewAssessmentLink /></PageHeading>
    <div className="dashboard-filters"><span className="demo-data-label"><Info size={15} />Illustrative demonstration data · Policy {policy.version}</span><div><label className="compact-select"><span className="sr-only">Assessment period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="today">{t('Today')}</option><option value="week">{t('Last 7 days')}</option><option value="month">{t('Last 30 days')}</option><option value="all">{t('All time')}</option></select></label><label className="compact-select"><span className="sr-only">Procurement center</span><select value={center} onChange={(event) => setCenter(event.target.value)}><option value="all">{t('All Centers')}</option>{CENTERS.map((item) => <option key={item}>{item}</option>)}</select></label></div></div>
    <StatGrid stats={[
      { label: period === 'today' ? "Today's Assessments" : 'Assessments', value: filtered.length, icon: Boxes },
      { label: 'Grade A', value: Math.round(quality.gradeA), suffix: '%', icon: CircleCheck },
      { label: 'URS', value: Math.round(quality.urs), suffix: '%', icon: SlidersHorizontal },
      { label: 'Defects', value: Math.round(defects(quality)), suffix: '%', icon: TriangleAlert },
    ]} />
    <div className="platform-strip">
      <a className="platform-mini" href="#/edge"><Cpu size={20} /><div><strong>Edge AI · {online ? 'Online' : 'Offline mode'}</strong><span>{edge.corrections} corrections · {edge.syncStatus === 'synced' ? 'Synced' : `${edge.pendingUploads} pending`}</span></div><ArrowRight size={15} /></a>
      <a className="platform-mini" href="#/grading"><Settings2 size={20} /><div><strong>Active Policy · {policy.version}</strong><span>Effective {policy.effectiveDate} · No retraining on change</span></div><ArrowRight size={15} /></a>
    </div>
    <div className="dashboard-charts"><section className="quality-chart-section"><h2>{t('Quality Distribution')}</h2><p>Sample-weighted quality across the selected assessments.</p><div className="donut-layout"><div className="donut-chart"><svg viewBox="0 0 180 180" role="img" aria-label={parts.map((part) => `${part.label}: ${part.value.toFixed(1)} percent`).join(', ')}><circle cx="90" cy="90" r="70" fill="none" stroke="#E7ECF4" strokeWidth="20" />{parts.map((part) => {
      const start = offset; offset += part.value;
      return <circle className="chart-segment" key={`${period}-${center}-${part.label}`} cx="90" cy="90" r="70" fill="none" stroke={part.color} strokeWidth="20" strokeDasharray={`${part.value * circumference / 100} ${circumference}`} strokeDashoffset={-start * circumference / 100} transform="rotate(-90 90 90)" />;
    })}</svg><div className="donut-center"><strong>{total.toLocaleString('en-IN')}</strong><span>onions analysed</span></div></div><ul className="chart-legend">{parts.map((part) => <li key={part.label}><span><i style={{ backgroundColor: part.color }} />{t(part.label)}</span><strong>{part.value.toFixed(1)}%</strong></li>)}</ul></div></section>
    <section className="defect-chart-section"><h2>{t('Defect Distribution')}</h2><p>Share of each category within the flagged defects.</p><div className="defect-bars">{QUALITY_META.slice(2).map(({ key, label, color }) => {
      const value = defects(quality) ? quality[key] / defects(quality) * 100 : 0;
      return <div className="defect-bar" key={key}><div><span>{t(label)}</span><strong>{value.toFixed(0)}%</strong></div><div className="bar-track"><span style={{ width: `${value}%`, backgroundColor: color }} /></div></div>;
    })}</div></section></div>
    <section className="recent-batches"><div className="section-heading"><div><h2>{t('Recent Batches')}</h2><p>The latest assessments for your selected period and center.</p></div><a className="text-link" href="#/batches">{t('View all batches')}<ArrowRight size={15} /></a></div><BatchTable records={filtered} limit={5} /></section>
  </div>;
}

export function RecordList({ kind }: { kind: 'batches' | 'history' | 'reports' }) {
  const { records, t, notify } = usePortal();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [center, setCenter] = useState('all');
  const [batchId, setBatchId] = useState('all');
  const isHistory = kind === 'history';
  const title = isHistory ? 'Assessment History' : kind === 'reports' ? 'Reports' : 'Batches';
  const filtered = useMemo(() => records.filter((batch) => {
    const query = search.trim().toLowerCase();
    return (!query || `${batch.id} ${batch.reportId} ${batch.center} ${batch.verificationId}`.toLowerCase().includes(query)) &&
      (!date || localDate(new Date(batch.date)) === date) && (center === 'all' || batch.center === center) && (batchId === 'all' || batch.id === batchId);
  }), [records, search, date, center, batchId]);
  const reset = () => { setSearch(''); setDate(''); setCenter('all'); setBatchId('all'); };
  const filtering = Boolean(search || date || center !== 'all' || batchId !== 'all');
  return <div className="container interior-page page-enter">
    <PageHeading title={title} description={isHistory ? 'Find and review previous onion quality assessments.' : kind === 'reports' ? 'View, print and download your digital quality assessment reports.' : 'View sample batches and their quality assessment results.'}>{isHistory ? <button className="button button-secondary" disabled={!filtered.length} onClick={() => { downloadCsv(filtered); notify(`${filtered.length} assessment records exported as CSV.`); }}><Download size={16} />{t('Export CSV')}</button> : <NewAssessmentLink />}</PageHeading>
    <div className="records-toolbar"><label className="search-field"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search by batch ID or center')} aria-label={t('Search assessments')} /></label><span>{filtered.length} {kind === 'reports' ? 'reports available' : 'assessment records'}</span></div>
    {isHistory && <div className="history-filters"><label className="field"><span>{t('Date')}</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="field"><span>{t('Batch ID')}</span><select value={batchId} onChange={(event) => setBatchId(event.target.value)}><option value="all">All batches</option>{records.map((batch) => <option key={batch.id} value={batch.id}>{batch.id}</option>)}</select></label><label className="field"><span>{t('Procurement Center')}</span><select value={center} onChange={(event) => setCenter(event.target.value)}><option value="all">{t('All Centers')}</option>{CENTERS.map((item) => <option key={item}>{item}</option>)}</select></label><button className="text-link filter-reset" disabled={!filtering} onClick={reset}><RotateCcw size={15} />{t('Reset Filters')}</button></div>}
    <BatchTable records={filtered} variant={kind} />
    {!filtered.length && filtering && <div className="empty-reset"><button className="button button-secondary" onClick={reset}>{t('Reset Filters')}</button></div>}
    <p className="dataset-note"><Info size={15} />{kind === 'reports' ? 'All reports are marked as demonstrations and are not official quality certificates.' : 'Example records and your locally saved demo assessments are shown together.'}</p>
  </div>;
}

function CorrectionBox({ batch }: { batch: Batch }) {
  const { addCorrection, notify } = usePortal();
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  if (!open) return <button className="button button-secondary" onClick={() => setOpen(true)}><PenLine size={15} />Suggest Correction ({batch.corrections || 0})</button>;
  return <form className="correction-box" onSubmit={(e) => { e.preventDefault(); if (note.trim().length < 3) { notify('Please describe the correction briefly.'); return; } addCorrection(batch.id, note.trim()); setNote(''); setOpen(false); notify('Correction recorded locally. Raw images are never shared — only model-update signals.'); }}>
    <label className="field"><span>Inspector correction (improves the local edge model)</span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. DET-03 looks like Grade A, not damaged" maxLength={200} /></label>
    <div className="button-row"><button className="button button-primary" type="submit">Save Correction</button><button className="button button-secondary" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
  </form>;
}

export function AssessmentResult({ batch }: { batch?: Batch }) {
  const { t } = usePortal();
  if (!batch) return <MissingRecord />;
  const totalDefects = Math.round(batch.sampleSize * defects(batch.quality) / 100);
  return <div className="container interior-page page-enter"><PageHeading title="Assessment Result" description={`Batch ${batch.id} | ${formatDate(batch.date, true)}`}><a className="button button-primary" href={`#/reports/${batch.id}`}><FileText size={17} />{t('Generate Report')}</a></PageHeading>
    <Notice><strong>{t('Demo assessment')}. </strong>Counts, grades and image annotations are simulated. They must not be used for a procurement decision.</Notice>
    <div className="grade-hero"><div><span>Overall Batch Grade</span><strong>{batch.overallGrade}</strong><small>Policy {batch.ruleVersion} · {batch.modelVersion} · Illustrative confidence {batch.confidence}%</small></div><div className="grade-hero-stats"><div><strong>{batch.sampleSize}</strong><span>Total inspected</span></div><div><strong>{totalDefects}</strong><span>Total defects</span></div><div><strong>{batch.quality.undersized}%</strong><span>Undersized</span></div></div></div>
    <div className="result-metadata"><div><span>{t('Batch ID')}</span><strong>{batch.id}</strong></div><div><span>{t('Procurement Center')}</span><strong>{batch.center}</strong></div><div><span>{t('Sample Size')}</span><strong>{batch.sampleSize} onions</strong></div><div><span>Officer</span><strong>{batch.officerName} ({batch.officerId})</strong></div><div><span>Location</span><strong>{batch.location}</strong></div><div><span>Status</span><strong className="status-complete"><CircleCheck size={15} />{t('Assessment Completed')}</strong></div></div>
    <div className="result-detail-layout"><div><AnnotatedImage batch={batch} /><h2 className="sub-section">AI Onion Detection</h2><DetectionList batch={batch} /><CorrectionBox batch={batch} /></div><section className="result-quality-panel"><h2>{t('Quality Summary')}</h2><QualitySummary batch={batch} /><h2 className="sub-section">Size Analysis</h2><SizeAnalysis batch={batch} /><h2 className="sub-section">Why This Grade</h2><GradingExplanation batch={batch} /><p className="small-muted">URS is retained as a demonstration label. Thresholds come from the configurable policy, not the AI model.</p></section></div>
    <h2 className="sub-section" style={{ marginTop: 32 }}>Multimodal Assessment</h2><MultimodalPanel batch={batch} />
    <div className="result-bottom-actions"><a href="#/batches" className="text-link"><ArrowLeft size={16} />Back to batches</a><a href="#/assessment" className="button button-secondary"><Plus size={16} />{t('New Assessment')}</a></div>
  </div>;
}

export function ReportDetail({ batch }: { batch?: Batch }) {
  const { t } = usePortal();
  if (!batch) return <MissingRecord />;
  const totalDefects = Math.round(batch.sampleSize * defects(batch.quality) / 100);
  return <div className="container interior-page report-page page-enter"><div className="no-print"><PageHeading title="Digital Report" description={`Assessment report for batch ${batch.id}`}><button className="button button-secondary" onClick={() => window.print()}><Printer size={17} />{t('Print Report')}</button><DownloadButton batch={batch} /></PageHeading></div>
    <article className="report-sheet" aria-labelledby="report-title"><header className="report-government-header"><Emblem small /><div><strong>Government of India</strong><span>Department of Food & Public Distribution</span></div><span className="report-demo-label">STUDENT PROTOTYPE<br />DEMONSTRATION REPORT</span></header><h1 id="report-title">{BRAND_NAME} — Quality Assessment Report</h1><p className="report-subtitle">{BRAND_TAGLINE} | Digital quality summary | Not an official procurement certificate</p>
      <dl className="report-metadata">{[['Report ID', batch.reportId], ['Batch ID', batch.id], ['Inspection Date & Time', formatDate(batch.date, true)], ['Procurement Center', batch.center], ['Inspection Location', batch.location], ['Officer / Inspector', `${batch.officerName} (${batch.officerId})`], ['Sample Size', `${batch.sampleSize} onions (illustrative)`], ['Overall Grade', batch.overallGrade], ['AI / Model Version', batch.modelVersion], ['Grading-Rule Version', batch.ruleVersion], ['Verification ID', batch.verificationId], ['Inspection Confidence', `${batch.confidence}% (illustrative)`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <h2>Sample Image (Evidence)</h2>
      <div className="report-evidence"><img src={batch.image} alt={`Evidence sample for batch ${batch.id}`} /><div><p><strong>File:</strong> {batch.fileName}</p><p><strong>Detections:</strong> {(batch.detections || []).length} illustrative bounding boxes (see result page for positions).</p><p><strong>Evidence note:</strong> Image stored locally on the inspecting device; reference only.</p></div></div>
      <h2>Quality Summary</h2>
      <table className="report-quality-table"><thead><tr><th>Quality Category</th><th className="text-right">Percentage</th><th className="text-right">Onion Count</th></tr></thead><tbody>{QUALITY_META.map(({ key, label, color }) => <tr key={key}><td><span className="report-category"><span className="legend-dot" style={{ backgroundColor: color }} />{label}</span></td><td className="text-right">{batch.quality[key]}%</td><td className="text-right">{Math.round(batch.sampleSize * batch.quality[key] / 100)}</td></tr>)}</tbody><tfoot><tr><td>Total</td><td className="text-right">100%</td><td className="text-right">{batch.sampleSize}</td></tr></tfoot></table>
      <h2>Batch Assessment</h2>
      <div className="report-batch-grid"><div><span>Total onions inspected</span><strong>{batch.sampleSize}</strong></div><div><span>Grade A</span><strong>{batch.quality.gradeA}%</strong></div><div><span>URS</span><strong>{batch.quality.urs}%</strong></div><div><span>Defective</span><strong>{defects(batch.quality)}% ({totalDefects})</strong></div><div><span>Undersized</span><strong>{batch.quality.undersized}%</strong></div><div><span>Size illustration (S/M/L)</span><strong>{batch.sizeDistribution.small}% / {batch.sizeDistribution.medium}% / {batch.sizeDistribution.large}%</strong></div></div>
      <section className="report-observations"><h3>Grade Explanation (rule-based, policy {batch.ruleVersion})</h3><ul className="plain-list">{batch.gradingNotes.map((note, i) => <li key={i}>{note}</li>)}</ul></section>
      <section className="report-observations"><h3>Assessment Notes</h3><p>This report contains illustrative results from the demonstration prototype, not predictions from a connected AI model. All categories are examples. Multimodal depth/weight sensors were not connected; no fake readings are included.</p><p><strong>Review & authorization:</strong> Not evaluated. Review by an authorized quality officer is required before any operational use.</p></section>
      <section className="report-verify"><VerificationBadge batch={batch} /></section>
      <footer className="report-document-footer"><p>{DISCLAIMER}</p><div><span>{BRAND_NAME} | Student project prototype</span><span>{batch.reportId}</span></div></footer>
    </article><div className="report-back-link no-print"><a className="text-link" href="#/reports"><ArrowLeft size={16} />Back to all reports</a></div>
  </div>;
}

function MissingRecord() {
  return <div className="container interior-page"><PageHeading title="Record not found" /><EmptyState title="This assessment is not available" description="The record may have been removed, or it may be stored on another device."><a className="button button-primary" href="#/batches">View available batches<ArrowRight size={16} /></a></EmptyState></div>;
}
