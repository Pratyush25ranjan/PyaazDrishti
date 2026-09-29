export type Quality = {
  gradeA: number;
  urs: number;
  damaged: number;
  rotten: number;
  sprouted: number;
  undersized: number;
};

export type Detection = {
  id: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  sizeMm: number | null;
  note: string;
};

export type SizeDistribution = { small: number; medium: number; large: number };

export type MultimodalState = {
  vision: 'connected' | 'not-connected';
  depth: 'connected' | 'not-connected';
  weight: 'connected' | 'not-connected';
  depthValue: string;
  weightValue: string;
};

export type GradingPolicy = {
  version: string;
  effectiveDate: string;
  minDiameterMm: number;
  maxDiameterMm: number;
  gradeAMinPct: number;
  gradeAMaxDefectPct: number;
  ursMinPct: number;
  ursMaxDefectPct: number;
  defectLimitPct: number;
  undersizedLimitPct: number;
  regionalNote: string;
  updatedBy: string;
  updatedAt: string;
};

export type Batch = {
  id: string;
  reportId: string;
  date: string;
  center: string;
  sampleSize: number;
  quality: Quality;
  image: string;
  fileName: string;
  source: 'example' | 'assessment';
  officerName: string;
  officerId: string;
  location: string;
  ruleVersion: string;
  modelVersion: string;
  verificationId: string;
  overallGrade: string;
  confidence: number;
  gradingNotes: string[];
  sizeDistribution: SizeDistribution;
  detections: Detection[];
  multimodal: MultimodalState;
  corrections: number;
};

export const BRAND_NAME = 'Pyaaz Drishti';
export const BRAND_TAGLINE = 'AI-Powered Onion Quality Assessment & Grading System';
export const MODEL_VERSION = 'PD-Vision v1.2.0 (prototype)';

export const ASSETS = {
  emblem: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg',
  farm: 'https://images.pexels.com/photos/37354232/pexels-photo-37354232.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  market: 'https://images.pexels.com/photos/36776925/pexels-photo-36776925.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  onions: 'https://images.pexels.com/photos/15421637/pexels-photo-15421637.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
  pm: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/The_Prime_Minister%2C_Shri_Narendra_Modi_inaugurating_Nanaji_Deshmukh_Plant_Phenomics_Centre%2C_on_the_Birth_Centenary_Celebrations_of_Nanaji_Deshmukh%2C_at_IARI%2C_in_New_Delhi.jpg',
  modiPortrait: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Official_Photograph_of_Prime_Minister_Narendra_Modi_Portrait.png',
};

export const CENTERS = ['Lasalgaon, Maharashtra', 'Pimpalgaon, Maharashtra', 'Nashik, Maharashtra', 'Indore, Madhya Pradesh'];
export const DEFAULT_QUALITY: Quality = { gradeA: 72, urs: 18, damaged: 4, rotten: 2, sprouted: 2, undersized: 2 };
export const QUALITY_META: { key: keyof Quality; label: string; color: string }[] = [
  { key: 'gradeA', label: 'Grade A', color: '#1E5AA8' },
  { key: 'urs', label: 'URS', color: '#C9962E' },
  { key: 'damaged', label: 'Damaged', color: '#C96A2C' },
  { key: 'rotten', label: 'Rotten', color: '#8E3B3B' },
  { key: 'sprouted', label: 'Sprouted', color: '#2E8B7A' },
  { key: 'undersized', label: 'Undersized', color: '#6B7A90' },
];
export const DISCLAIMER = 'AI-generated assessment is intended as decision-support and should be used according to applicable procurement procedures and authorized quality standards.';

export const DEFAULT_POLICY: GradingPolicy = {
  version: 'GR-POLICY v1.0',
  effectiveDate: '2026-01-15',
  minDiameterMm: 45,
  maxDiameterMm: 90,
  gradeAMinPct: 65,
  gradeAMaxDefectPct: 12,
  ursMinPct: 12,
  ursMaxDefectPct: 22,
  defectLimitPct: 25,
  undersizedLimitPct: 8,
  regionalNote: 'Default demonstration thresholds. Regional variations can be configured per procurement center without retraining the AI model.',
  updatedBy: 'System default',
  updatedAt: new Date().toISOString(),
};

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function makeVerificationId(batchId: string): string {
  const h = hashString(batchId).toString(36).toUpperCase().padStart(7, '0').slice(0, 7);
  return `PDV-${batchId.split('-').pop() || '0000'}-${h.slice(0, 4)}`;
}

export function makeDetections(batchId: string, sampleSize: number): Detection[] {
  const seed = hashString(batchId);
  const boxes = [
    { key: 'GRADE A', x: 8, y: 17, w: 23, h: 29 },
    { key: 'URS', x: 39, y: 12, w: 21, h: 31 },
    { key: 'DAMAGED', x: 69, y: 20, w: 22, h: 28 },
    { key: 'ROTTEN', x: 12, y: 62, w: 22, h: 28 },
    { key: 'SPROUTED', x: 43, y: 58, w: 20, h: 30 },
    { key: 'UNDERSIZED', x: 75, y: 66, w: 16, h: 22 },
  ];
  return boxes.map((box, i) => {
    const pseudo = (seed >> (i * 3)) % 100;
    const conf = 82 + (pseudo % 15);
    const sizeMm = box.key === 'UNDERSIZED' ? 38 + (pseudo % 6) : 48 + (pseudo % 34);
    return {
      id: `DET-${String(i + 1).padStart(2, '0')}`,
      label: box.key,
      confidence: conf,
      x: box.x, y: box.y, w: box.w, h: box.h,
      sizeMm,
      note: box.key === 'GRADE A' ? 'Uniform surface, no visible defect in demo frame.' : box.key === 'URS' ? 'Meets secondary-grade demo criteria.' : `Illustrative ${box.key.toLowerCase()} marker for prototype display.`,
    };
  }).slice(0, Math.min(6, Math.max(4, sampleSize >= 200 ? 6 : 5)));
}

export function makeSizeDistribution(quality: Quality): SizeDistribution {
  const small = Math.round(quality.undersized);
  const large = Math.round(quality.gradeA * 0.42);
  const medium = Math.max(0, 100 - small - large);
  return { small, medium, large };
}

export function defaultMultimodal(): MultimodalState {
  return { vision: 'connected', depth: 'not-connected', weight: 'not-connected', depthValue: '', weightValue: '' };
}

/** Rule-based grading engine. Policies stay configurable; the "AI model" is never edited here. */
export function gradeBatch(quality: Quality, policy: GradingPolicy): { overallGrade: string; confidence: number; notes: string[] } {
  const d = defects(quality);
  const notes: string[] = [];
  notes.push(`Defect share ${d}% checked against Grade A limit ${policy.gradeAMaxDefectPct}% (policy ${policy.version}).`);
  notes.push(`Grade A share ${quality.gradeA}% checked against minimum ${policy.gradeAMinPct}%.`);
  notes.push(`Undersized share ${quality.undersized}% checked against limit ${policy.undersizedLimitPct}% (min diameter ${policy.minDiameterMm} mm).`);
  let overallGrade = 'Grade A – Accept';
  let confidence = 92;
  if (d > policy.defectLimitPct || quality.undersized > policy.undersizedLimitPct + 6) {
    overallGrade = 'Below URS – Hold for Review';
    confidence = 81;
    notes.push(`Defect or undersized share exceeds policy limits, so the batch is held for officer review.`);
  } else if (quality.gradeA >= policy.gradeAMinPct && d <= policy.gradeAMaxDefectPct) {
    overallGrade = 'Grade A – Accept';
    notes.push('Batch satisfies Grade A acceptance rules under the active policy.');
  } else if (quality.gradeA + quality.urs >= policy.ursMinPct + policy.gradeAMinPct - 10 && d <= policy.ursMaxDefectPct) {
    overallGrade = 'URS – Accept with Note';
    confidence = 87;
    notes.push('Batch satisfies secondary (URS) acceptance rules under the active policy.');
  } else {
    overallGrade = 'URS – Hold for Review';
    confidence = 84;
    notes.push('Batch is between thresholds; policy routes it to officer review.');
  }
  return { overallGrade, confidence, notes };
}

export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatDate(date: string, withTime = false) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(date));
}

export function defects(quality: Quality) {
  return quality.damaged + quality.rotten + quality.sprouted + quality.undersized;
}

export function summarize(records: Batch[]) {
  const total = records.reduce((sum, batch) => sum + batch.sampleSize, 0);
  const quality: Quality = { gradeA: 0, urs: 0, damaged: 0, rotten: 0, sprouted: 0, undersized: 0 };
  QUALITY_META.forEach(({ key }) => {
    quality[key] = total ? records.reduce((sum, batch) => sum + batch.quality[key] * batch.sampleSize, 0) / total : 0;
  });
  return { total, quality };
}

export function withDefaults(batch: Partial<Batch> & { id: string; reportId: string; date: string; center: string; sampleSize: number; quality: Quality; image: string; fileName: string; source: 'example' | 'assessment' }): Batch {
  const graded = gradeBatch(batch.quality, DEFAULT_POLICY);
  return {
    officerName: batch.officerName || 'Demo Officer',
    officerId: batch.officerId || 'OFF-DEMO-01',
    location: batch.location || batch.center,
    ruleVersion: batch.ruleVersion || DEFAULT_POLICY.version,
    modelVersion: batch.modelVersion || MODEL_VERSION,
    verificationId: batch.verificationId || makeVerificationId(batch.id),
    overallGrade: batch.overallGrade || graded.overallGrade,
    confidence: batch.confidence ?? graded.confidence,
    gradingNotes: batch.gradingNotes || graded.notes,
    sizeDistribution: batch.sizeDistribution || makeSizeDistribution(batch.quality),
    detections: batch.detections || makeDetections(batch.id, batch.sampleSize),
    multimodal: batch.multimodal || defaultMultimodal(),
    corrections: batch.corrections ?? 0,
    ...batch,
  } as Batch;
}

export function createExamples(): Batch[] {
  const shifts = [0, 4, -4, 2, -2, 6, -3, -3];
  const now = new Date();
  return Array.from({ length: 128 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(index / 8));
    date.setHours(Math.max(8, Math.min(now.getHours(), 16)) - (index % 8), 30, 0, 0);
    const serial = String(128 - index).padStart(4, '0');
    const shift = shifts[index % shifts.length];
    const quality = { ...DEFAULT_QUALITY, gradeA: 72 + shift, urs: 18 - shift };
    const id = `ON-${now.getFullYear()}-${serial}`;
    return withDefaults({
      id,
      reportId: `QA-${now.getFullYear()}-${serial}`,
      date: date.toISOString(),
      center: CENTERS[index % CENTERS.length],
      sampleSize: 100,
      quality,
      image: ASSETS.onions,
      fileName: 'example-onion-sample.jpg',
      source: 'example',
    });
  });
}

export function loadRecords(): Batch[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem('onion-portal-records-v1') || 'null');
    if (Array.isArray(stored) && stored.length && stored.every((row) =>
      row && typeof row.id === 'string' && typeof row.reportId === 'string' &&
      typeof row.date === 'string' && Number.isFinite(Date.parse(row.date)) &&
      typeof row.center === 'string' && Number.isFinite(row.sampleSize) && row.sampleSize > 0 &&
      typeof row.image === 'string' && typeof row.fileName === 'string' &&
      QUALITY_META.every(({ key }) => Number.isFinite(row.quality?.[key]))
    )) return (stored as Batch[]).map((row) => withDefaults(row));
  } catch { /* Private browsing or a stale record must not prevent the portal from opening. */ }
  return createExamples();
}

export function loadPolicy(): GradingPolicy {
  try {
    const stored = JSON.parse(localStorage.getItem('pyaaz-policy-v1') || 'null');
    if (stored && typeof stored.version === 'string' && Number.isFinite(stored.minDiameterMm)) {
      return { ...DEFAULT_POLICY, ...stored };
    }
  } catch { /* fall through to default */ }
  return { ...DEFAULT_POLICY };
}

export function savePolicy(policy: GradingPolicy) {
  try { localStorage.setItem('pyaaz-policy-v1', JSON.stringify(policy)); } catch { /* storage unavailable */ }
}

export type EdgeState = {
  localModel: string;
  regionalStatus: string;
  lastUpdate: string;
  corrections: number;
  syncStatus: 'synced' | 'pending' | 'offline';
  pendingUploads: number;
};

export function loadEdge(): EdgeState {
  try {
    const stored = JSON.parse(localStorage.getItem('pyaaz-edge-v1') || 'null');
    if (stored && typeof stored === 'object') return { localModel: 'PD-Edge v1.2.0 (on-device ready)', regionalStatus: 'Maharashtra – Rabi profile (simulated)', lastUpdate: stored.lastUpdate || new Date().toISOString(), corrections: Number(stored.corrections) || 0, syncStatus: stored.syncStatus || 'synced', pendingUploads: Number(stored.pendingUploads) || 0 };
  } catch { /* ignore */ }
  return { localModel: 'PD-Edge v1.2.0 (on-device ready)', regionalStatus: 'Maharashtra – Rabi profile (simulated)', lastUpdate: new Date().toISOString(), corrections: 0, syncStatus: 'synced', pendingUploads: 0 };
}

export function saveEdge(edge: EdgeState) {
  try { localStorage.setItem('pyaaz-edge-v1', JSON.stringify(edge)); } catch { /* ignore */ }
}

export function go(path: string) {
  window.location.hash = path.startsWith('/') ? path : `/${path}`;
}

export function downloadCsv(records: Batch[]) {
  const rows = [
    ['Batch ID', 'Date', 'Procurement Center', 'Sample Size', 'Grade A (%)', 'URS (%)', 'Defects (%)', 'Overall Grade', 'Report ID', 'Rule Version', 'Mode'],
    ...records.map((b) => [b.id, formatDate(b.date), b.center, b.sampleSize, b.quality.gradeA, b.quality.urs, defects(b.quality), b.overallGrade, b.reportId, b.ruleVersion, 'Illustrative demo']),
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `pyaaz-drishti-history-${localDate(new Date())}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
