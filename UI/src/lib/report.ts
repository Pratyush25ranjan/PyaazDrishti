import type { Batch } from './data';
import { BRAND_NAME, BRAND_TAGLINE, DISCLAIMER, QUALITY_META, defects, formatDate } from './data';

export async function downloadReport(batch: Batch) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const clean = (value: string) => value.replace(/[^\x20-\x7E]/g, '').slice(0, 180);
  doc.setProperties({ title: `${BRAND_NAME} Report ${batch.reportId}`, author: 'Pyaaz Drishti - Student Prototype' });
  // Navy masthead
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFillColor(232, 147, 42);
  doc.rect(0, 6, 210, 1.6, 'F');
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Government of India', 20, 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Department of Food & Public Distribution', 20, 29);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text(`${BRAND_NAME} - Quality Assessment Report`, 20, 43);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 112);
  doc.text(clean(BRAND_TAGLINE), 20, 50);
  doc.setFontSize(8.5);
  doc.setTextColor(176, 116, 30);
  doc.text('STUDENT PROTOTYPE | ILLUSTRATIVE DEMO | NOT AN OFFICIAL CERTIFICATE', 20, 57);
  doc.setDrawColor(217, 225, 236);
  doc.line(20, 62, 190, 62);
  const metadata = [
    ['Report ID', batch.reportId], ['Batch ID', batch.id], ['Date', formatDate(batch.date, true)],
    ['Procurement Center', batch.center], ['Location', batch.location || batch.center],
    ['Officer', `${batch.officerName || 'Demo Officer'} (${batch.officerId || 'OFF-DEMO-01'})`],
    ['Sample Size', `${batch.sampleSize} onions (simulated)`],
    ['Overall Grade', batch.overallGrade || 'Grade A - Accept'],
    ['AI Model', batch.modelVersion || 'PD-Vision v1.2.0 (prototype)'],
    ['Grading Policy', batch.ruleVersion || 'GR-POLICY v1.0'],
    ['Verification ID', batch.verificationId || '-'],
  ];
  metadata.forEach(([label, value], index) => {
    const y = 72 + index * 7.6;
    doc.setTextColor(91, 101, 114);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, 20, y);
    doc.setTextColor(31, 41, 55);
    doc.text(clean(value), 72, y);
  });
  const tableTop = 72 + metadata.length * 7.6 + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 95);
  doc.text('Quality Summary', 20, tableTop);
  doc.setFillColor(239, 243, 249);
  doc.rect(20, tableTop + 4, 170, 10, 'F');
  doc.setFontSize(9);
  doc.setTextColor(31, 41, 55);
  doc.text('Quality Category', 24, tableTop + 11);
  doc.text('Percentage', 128, tableTop + 11);
  doc.text('Count', 170, tableTop + 11);
  QUALITY_META.forEach(({ key, label }, index) => {
    const y = tableTop + 23 + index * 10;
    if (y > 272) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, 24, y);
    doc.text(`${batch.quality[key]}%`, 132, y);
    doc.text(String(Math.round(batch.sampleSize * batch.quality[key] / 100)), 173, y);
    doc.setDrawColor(226, 232, 242);
    doc.line(20, y + 4, 190, y + 4);
  });
  doc.addPage();
  doc.setFillColor(30, 58, 95);
  doc.rect(0, 0, 210, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 95);
  doc.text('Assessment Detail & Traceability', 20, 24);
  doc.setFontSize(9.5);
  doc.setTextColor(60, 70, 84);
  doc.setFont('helvetica', 'normal');
  const lines: string[] = [
    `Total onions inspected: ${batch.sampleSize} (simulated)`,
    `Defective share: ${defects(batch.quality)}% | Undersized share: ${batch.quality.undersized}%`,
    `Size illustration - Small: ${batch.sizeDistribution?.small ?? batch.quality.undersized}%, Medium: ${batch.sizeDistribution?.medium ?? 0}%, Large: ${batch.sizeDistribution?.large ?? 0}%`,
    `Inspection confidence (illustrative): ${batch.confidence ?? 90}%`,
    `Inspector corrections recorded: ${batch.corrections ?? 0}`,
    `Evidence: ${batch.fileName || 'sample image'} | Stored locally on device`,
    `Multimodal: Vision connected (image). Depth sensor: not connected. Weight sensor: not connected (optional manual input only).`,
  ];
  let y = 36;
  lines.forEach((line) => {
    doc.text(doc.splitTextToSize(line, 170), 20, y);
    y += 10;
  });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Why this grade was assigned (rule-based explanation)', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  (batch.gradingNotes && batch.gradingNotes.length ? batch.gradingNotes : ['Graded under the active configurable policy; see on-screen report for the full explanation.']).forEach((note) => {
    const wrapped = doc.splitTextToSize(`- ${note}`, 170);
    doc.text(wrapped, 20, y);
    y += wrapped.length * 5.5 + 2;
  });
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(103, 111, 124);
  doc.text(doc.splitTextToSize('Demo results are simulated, not model predictions. Example classifications and counts are not authorized procurement standards. Verification ID is a prototype traceability mock, not a cryptographic signature.', 170), 20, y);
  y += 22;
  doc.text(doc.splitTextToSize(DISCLAIMER, 170), 20, y);
  doc.setFontSize(8);
  doc.setTextColor(120, 130, 145);
  doc.text(`${BRAND_NAME} | Student project prototype | Generated locally`, 20, 285);
  doc.text('2 / 2', 182, 285);
  doc.save(`${clean(batch.reportId)}-pyaaz-drishti.pdf`);
}
