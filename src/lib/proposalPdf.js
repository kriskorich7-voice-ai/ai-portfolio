import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatVolume, useCaseLabel } from './proposalPricing.js';

const NAVY = [11, 11, 21];
const ACCENT = [91, 140, 255];
const TEXT = [15, 23, 42];
const MUTED = [100, 116, 139];

export function generateProposalPdf(proposal) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;

  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 72, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Deepgram', margin, 46);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...ACCENT);
  doc.text('Customer Proposal', pageWidth - margin, 46, { align: 'right' });

  let y = 110;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...TEXT);
  doc.text(`Proposal for ${proposal.company || 'Customer'}`, margin, y);

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    `Prepared ${proposal.generatedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    margin,
    y
  );

  y += 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text('Industry', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(proposal.industry || '—', margin + 70, y);

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXT);
  doc.text('Use cases', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  const useCaseLines = proposal.useCases.length
    ? proposal.useCases.map((id) => `• ${useCaseLabel(id, proposal.customUseCase)}`)
    : ['—'];
  useCaseLines.forEach((line, i) => {
    doc.text(line, margin + 70, y + i * 14, { maxWidth: pageWidth - margin - 70 - margin });
  });
  y += useCaseLines.length * 14 + 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...TEXT);
  doc.text('Usage Summary', margin, y);
  y += 8;

  const usageRows = [];
  if (Number(proposal.usage.stt.annualHours) > 0) {
    usageRows.push([
      'Speech-to-Text',
      `${Number(proposal.usage.stt.annualHours).toLocaleString()} annual hours`,
      proposal.usage.stt.avgCallMinutes
        ? `${proposal.usage.stt.avgCallMinutes} min avg call`
        : '—',
    ]);
  }
  if (Number(proposal.usage.tts.annualChars) > 0) {
    usageRows.push([
      'Text-to-Speech',
      `${Number(proposal.usage.tts.annualChars).toLocaleString()} annual characters`,
      '—',
    ]);
  }
  if (Number(proposal.usage.voiceAgent.annualHours) > 0) {
    usageRows.push([
      'Voice Agent',
      `${Number(proposal.usage.voiceAgent.annualHours).toLocaleString()} annual hours`,
      proposal.usage.voiceAgent.avgSessionMinutes
        ? `${proposal.usage.voiceAgent.avgSessionMinutes} min avg session`
        : '—',
    ]);
  }
  if (usageRows.length === 0) {
    usageRows.push(['—', 'No usage details provided', '—']);
  }

  autoTable(doc, {
    startY: y + 6,
    head: [['Product', 'Annual Volume', 'Avg Duration']],
    body: usageRows,
    theme: 'grid',
    headStyles: {
      fillColor: [238, 242, 255],
      textColor: NAVY,
      fontStyle: 'bold',
      fontSize: 10,
    },
    styles: { fontSize: 10, cellPadding: 7, lineColor: [226, 232, 240] },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...TEXT);
  doc.text('Pricing & Growth Scenarios', margin, y);

  proposal.products.forEach((product) => {
    if (y > pageHeight - 220) {
      doc.addPage();
      y = 80;
    }

    y += 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT);
    doc.text(`${product.label} — ${product.model.name}`, margin, y);

    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(
      `List rate: $${product.model.rate}${product.model.unit}   ·   Discount applied: ${product.discountPct}%`,
      margin,
      y
    );

    const scenarioLabels = product.lines.map((l) => l.scenario.label);
    const body = [
      ['Annual volume', ...product.lines.map((l) => formatVolume(l.annualVolume, product.volumeUnit))],
      ['List rate cost', ...product.lines.map((l) => formatCurrency(l.listCost))],
      ['Discount %', ...product.lines.map(() => `${product.discountPct}%`)],
      ['Discounted cost', ...product.lines.map((l) => formatCurrency(l.discountedCost))],
      ['Savings vs list', ...product.lines.map((l) => formatCurrency(l.savings))],
    ];

    autoTable(doc, {
      startY: y + 10,
      head: [['', ...scenarioLabels]],
      body,
      theme: 'striped',
      headStyles: {
        fillColor: NAVY,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: { fontSize: 9, cellPadding: 6 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: TEXT, cellWidth: 130 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY;
  });

  if (proposal.products.length === 0) {
    y += 20;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(
      'No usage details provided — add Speech-to-Text, Text-to-Speech, or Voice Agent volumes to see pricing.',
      margin,
      y
    );
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      `Confidential — prepared by Deepgram    ·    Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 24,
      { align: 'center' }
    );
  }

  const safeCompany = (proposal.company || 'customer')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '');
  doc.save(`deepgram-proposal-${safeCompany || 'customer'}.pdf`);
}
