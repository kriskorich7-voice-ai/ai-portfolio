import { jsPDF } from 'jspdf';

// Brand palette
const NAVY = [10, 15, 30]; // #0a0f1e
const GREEN = [0, 229, 160]; // #00e5a0
const TEXT = [20, 27, 45]; // dark navy body text
const MUTED = [100, 116, 139];
const LIGHT_BOX = [244, 247, 252];
const BORDER = [221, 228, 238];

const MARGIN = 54;

export function generatePartnerKitPdf(kit) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  const partnerName = kit.partnerName || 'Partner';
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Shared rendering cursor
  const ctx = {
    doc,
    pageWidth,
    pageHeight,
    contentWidth,
    y: 0,
    bottomLimit: pageHeight - 70,
  };

  // ---------- COVER PAGE ----------
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Accent rule near top
  doc.setFillColor(...GREEN);
  doc.rect(MARGIN, 150, 60, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(255, 255, 255);
  doc.text('DEEPGRAM', MARGIN, 130);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...GREEN);
  doc.text('Partner Enablement Kit', MARGIN, 210);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(225, 232, 240);
  doc.text(`Prepared exclusively for ${partnerName}`, MARGIN, 244);

  // Meta line: Partner Type | Industry | Region
  const metaParts = [kit.partnerType, kit.industry, kit.region].filter(Boolean);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  doc.text(metaParts.join('    |    '), MARGIN, 280);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(160, 174, 192);
  doc.text(dateStr, MARGIN, 304);

  // Cover footer block
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, pageHeight - 120, MARGIN + 60, pageHeight - 120);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Your Deepgram Partner Contact', MARGIN, pageHeight - 98);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(180, 192, 208);
  doc.text(
    'Kris Korich  |  kris.korich@deepgram.com  |  kriskorich.com',
    MARGIN,
    pageHeight - 80
  );

  // ---------- INTERIOR PAGES ----------
  startInteriorPage(ctx);

  // Page 2: Welcome + Partnership Overview
  sectionHeader(ctx, 'Welcome to Deepgram');
  bodyText(ctx, kit.welcomeMessage);
  spacer(ctx, 10);
  subHeader(ctx, 'Partnership Overview');
  bodyText(ctx, kit.partnershipOverview);

  // Page 3: Product Overview
  newSection(ctx, 'Deepgram Product Overview');
  const products = kit.productOverview || {};
  productBlock(ctx, 'Speech-to-Text (Nova-3 & Flux)', products.stt);
  productBlock(ctx, 'Text-to-Speech (Aura-2 & Flux TTS)', products.tts);
  productBlock(ctx, 'Voice Agent API', products.voiceAgent);
  productBlock(ctx, 'Audio Intelligence', products.audioIntelligence);

  // Page 4: When To Use What
  newSection(ctx, 'When To Use What');
  const w = kit.whenToUseWhat || {};
  decisionBox(ctx, 'Nova-3 vs. Flux', w.novaVsFlux);
  decisionBox(ctx, 'SaaS vs. Self-Hosted', w.saasVsSelfHosted);
  decisionBox(ctx, 'Streaming vs. Batch', w.streamingVsBatch);

  // Page 5-6: Key Use Cases
  newSection(ctx, 'Key Use Cases');
  (kit.useCases || []).forEach((uc, i) => {
    useCaseBlock(ctx, i + 1, uc);
  });

  // Page 7: Co-Sell Motion + Deal Registration
  newSection(ctx, 'Co-Sell Motion');
  const cs = kit.coSellMotion || {};
  subHeader(ctx, 'Identifying Opportunities');
  bodyText(ctx, cs.howToIdentifyOpportunities);
  spacer(ctx, 8);
  subHeader(ctx, 'Engaging Deepgram');
  bodyText(ctx, cs.engagingDeeepgram || cs.engagingDeepgram);
  spacer(ctx, 8);
  subHeader(ctx, 'Deal Registration');
  bodyText(ctx, cs.dealRegistration);

  // Page 8: Discovery Questions
  newSection(ctx, 'Discovery Questions');
  bodyText(
    ctx,
    'Questions to surface Deepgram opportunities in your customer conversations:'
  );
  spacer(ctx, 6);
  (kit.discoveryQuestions || []).forEach((q, i) => {
    numberedItem(ctx, i + 1, q);
  });

  // Page 9: Objection Handling
  newSection(ctx, 'Objection Handling');
  (kit.objectionHandling || []).forEach((o) => {
    objectionBlock(ctx, o);
  });

  // Page 10: Competitive Positioning
  newSection(ctx, 'Competitive Positioning');
  const cp = kit.competitivePositioning || {};
  competitorBlock(ctx, 'vs. Google Speech-to-Text', cp.vsGoogle);
  competitorBlock(ctx, 'vs. AWS Transcribe', cp.vsAWS);
  competitorBlock(ctx, 'vs. Azure Speech', cp.vsAzure);
  competitorBlock(ctx, 'vs. AssemblyAI', cp.vsAssemblyAI);
  spacer(ctx, 6);
  subHeader(ctx, 'Key Differentiators');
  (cp.keyDifferentiators || []).forEach((d) => bullet(ctx, d));

  // Page 11: GTM Motion + Technical Best Practices
  newSection(ctx, 'Go-To-Market Motion');
  bodyText(ctx, kit.gtmMotion);
  spacer(ctx, 12);
  sectionHeader(ctx, 'Technical Best Practices');
  const tb = kit.technicalBestPractices || {};
  subHeader(ctx, 'Getting Started');
  bodyText(ctx, tb.gettingStarted);
  spacer(ctx, 6);
  subHeader(ctx, 'Key Parameters');
  bodyText(ctx, tb.keyParameters);
  spacer(ctx, 6);
  subHeader(ctx, 'SaaS Setup');
  bodyText(ctx, tb.saasSetup);
  spacer(ctx, 6);
  subHeader(ctx, 'Self-Hosted Considerations');
  bodyText(ctx, tb.selfHostedConsiderations);

  // Page 12: Onboarding Checklist + Next Steps + Resources
  newSection(ctx, 'Onboarding Checklist');
  (kit.onboardingChecklist || []).forEach((item) => {
    checklistItem(ctx, item);
  });
  spacer(ctx, 12);
  sectionHeader(ctx, 'Next Steps');
  bodyText(ctx, kit.nextSteps);
  spacer(ctx, 12);
  sectionHeader(ctx, 'Resources');
  resourceRow(ctx, 'Deepgram Console', 'console.deepgram.com');
  resourceRow(ctx, 'Developer Docs', 'developers.deepgram.com');
  resourceRow(ctx, 'API Reference', 'developers.deepgram.com/reference');
  resourceRow(ctx, 'Support', 'developers.deepgram.com (search for support)');
  resourceRow(ctx, 'Partner Certification', 'Coming Soon');
  resourceRow(ctx, 'Partner Contact', 'Kris Korich | kris.korich@deepgram.com');

  // ---------- FOOTERS + PAGE NUMBERS (interior pages only) ----------
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, pageHeight - 44, pageWidth - MARGIN, pageHeight - 44);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `© Deepgram  |  Confidential — Prepared for ${partnerName}  |  kriskorich.com`,
      MARGIN,
      pageHeight - 30
    );
    doc.text(`Page ${i}`, pageWidth - MARGIN, pageHeight - 30, {
      align: 'right',
    });
  }

  const safeName = partnerName
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '');
  doc.save(`deepgram-partner-enablement-${safeName || 'partner'}.pdf`);
}

// ---------------- layout helpers ----------------

function startInteriorPage(ctx) {
  ctx.doc.addPage();
  ctx.doc.setFillColor(255, 255, 255);
  ctx.doc.rect(0, 0, ctx.pageWidth, ctx.pageHeight, 'F');
  ctx.y = 70;
}

function ensureSpace(ctx, needed) {
  if (ctx.y + needed > ctx.bottomLimit) {
    startInteriorPage(ctx);
  }
}

function spacer(ctx, amount) {
  ctx.y += amount;
}

// Starts a brand-new page with a top-level section header
function newSection(ctx, title) {
  startInteriorPage(ctx);
  sectionHeader(ctx, title);
}

function sectionHeader(ctx, title) {
  if (!title) return;
  ensureSpace(ctx, 40);
  const { doc } = ctx;
  // Green accent tick
  doc.setFillColor(...GREEN);
  doc.rect(MARGIN, ctx.y - 11, 4, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...GREEN);
  doc.text(title, MARGIN + 14, ctx.y + 2);
  ctx.y += 26;
}

function subHeader(ctx, title) {
  if (!title) return;
  ensureSpace(ctx, 28);
  const { doc } = ctx;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...TEXT);
  doc.text(title, MARGIN, ctx.y);
  ctx.y += 16;
}

function bodyText(ctx, text) {
  if (!text) return;
  const { doc } = ctx;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...TEXT);
  const lines = doc.splitTextToSize(String(text), ctx.contentWidth);
  const lineHeight = 15;
  lines.forEach((line) => {
    ensureSpace(ctx, lineHeight);
    doc.text(line, MARGIN, ctx.y);
    ctx.y += lineHeight;
  });
  ctx.y += 4;
}

function bullet(ctx, text) {
  if (!text) return;
  const { doc } = ctx;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...TEXT);
  const indent = 16;
  const lines = doc.splitTextToSize(String(text), ctx.contentWidth - indent);
  const lineHeight = 15;
  ensureSpace(ctx, lineHeight);
  doc.setTextColor(...GREEN);
  doc.text('•', MARGIN + 2, ctx.y);
  doc.setTextColor(...TEXT);
  lines.forEach((line, i) => {
    if (i > 0) ensureSpace(ctx, lineHeight);
    doc.text(line, MARGIN + indent, ctx.y);
    ctx.y += lineHeight;
  });
  ctx.y += 2;
}

function numberedItem(ctx, num, text) {
  if (!text) return;
  const { doc } = ctx;
  doc.setFontSize(10.5);
  const indent = 24;
  const lines = doc.splitTextToSize(String(text), ctx.contentWidth - indent);
  const lineHeight = 15;
  ensureSpace(ctx, lineHeight);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text(`${num}.`, MARGIN + 2, ctx.y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT);
  lines.forEach((line, i) => {
    if (i > 0) ensureSpace(ctx, lineHeight);
    doc.text(line, MARGIN + indent, ctx.y);
    ctx.y += lineHeight;
  });
  ctx.y += 3;
}

function checklistItem(ctx, text) {
  if (!text) return;
  const { doc } = ctx;
  doc.setFontSize(10.5);
  const indent = 22;
  const lines = doc.splitTextToSize(String(text), ctx.contentWidth - indent);
  const lineHeight = 15;
  ensureSpace(ctx, lineHeight + 2);
  // checkbox
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1);
  doc.rect(MARGIN + 2, ctx.y - 9, 10, 10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT);
  lines.forEach((line, i) => {
    if (i > 0) ensureSpace(ctx, lineHeight);
    doc.text(line, MARGIN + indent, ctx.y);
    ctx.y += lineHeight;
  });
  ctx.y += 4;
}

function productBlock(ctx, title, text) {
  ensureSpace(ctx, 50);
  subHeader(ctx, title);
  bodyText(ctx, text);
  spacer(ctx, 6);
}

// Rounded light box for decision guides
function decisionBox(ctx, title, text) {
  if (!text) text = '';
  const { doc } = ctx;
  const padding = 14;
  const innerWidth = ctx.contentWidth - padding * 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const bodyLines = doc.splitTextToSize(String(text), innerWidth);
  const lineHeight = 15;
  const boxHeight = padding * 2 + 20 + bodyLines.length * lineHeight;

  ensureSpace(ctx, boxHeight + 14);

  doc.setFillColor(...LIGHT_BOX);
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, ctx.y, ctx.contentWidth, boxHeight, 6, 6, 'FD');

  // green left edge
  doc.setFillColor(...GREEN);
  doc.rect(MARGIN, ctx.y, 4, boxHeight, 'F');

  let innerY = ctx.y + padding + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...TEXT);
  doc.text(title, MARGIN + padding, innerY);
  innerY += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...TEXT);
  bodyLines.forEach((line) => {
    doc.text(line, MARGIN + padding, innerY);
    innerY += lineHeight;
  });

  ctx.y += boxHeight + 14;
}

function useCaseBlock(ctx, num, uc) {
  if (!uc) return;
  const { doc } = ctx;
  ensureSpace(ctx, 60);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...TEXT);
  const titleLines = doc.splitTextToSize(
    `${num}. ${uc.title || 'Use Case'}`,
    ctx.contentWidth
  );
  titleLines.forEach((line) => {
    ensureSpace(ctx, 16);
    doc.text(line, MARGIN, ctx.y);
    ctx.y += 16;
  });
  ctx.y += 2;

  if (uc.customerPainPoint) {
    labeledLine(ctx, 'Pain point:', uc.customerPainPoint);
  }
  if (uc.description) {
    bodyText(ctx, uc.description);
  }
  if (uc.recommendedProducts && uc.recommendedProducts.length) {
    labeledLine(
      ctx,
      'Recommended:',
      uc.recommendedProducts.join(', ')
    );
  }
  ctx.y += 8;
}

function labeledLine(ctx, label, text) {
  const { doc } = ctx;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GREEN);
  const labelWidth = doc.getTextWidth(label) + 6;
  ensureSpace(ctx, 15);
  doc.text(label, MARGIN, ctx.y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT);
  const lines = doc.splitTextToSize(
    String(text),
    ctx.contentWidth - labelWidth
  );
  const lineHeight = 14;
  lines.forEach((line, i) => {
    if (i > 0) ensureSpace(ctx, lineHeight);
    doc.text(line, MARGIN + labelWidth, ctx.y);
    if (i < lines.length - 1) ctx.y += lineHeight;
  });
  ctx.y += lineHeight + 2;
}

function objectionBlock(ctx, o) {
  if (!o) return;
  const { doc } = ctx;
  ensureSpace(ctx, 40);

  // Objection (Q)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  const qLines = doc.splitTextToSize(
    `Q: ${o.objection || ''}`,
    ctx.contentWidth
  );
  qLines.forEach((line) => {
    ensureSpace(ctx, 15);
    doc.text(line, MARGIN, ctx.y);
    ctx.y += 15;
  });

  // Response (A)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...TEXT);
  const aLines = doc.splitTextToSize(
    `A: ${o.response || ''}`,
    ctx.contentWidth
  );
  aLines.forEach((line) => {
    ensureSpace(ctx, 15);
    doc.text(line, MARGIN, ctx.y);
    ctx.y += 15;
  });
  ctx.y += 10;
}

function competitorBlock(ctx, title, text) {
  ensureSpace(ctx, 40);
  subHeader(ctx, title);
  bodyText(ctx, text);
  spacer(ctx, 4);
}

function resourceRow(ctx, label, value) {
  const { doc } = ctx;
  ensureSpace(ctx, 16);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  doc.text(`${label}:`, MARGIN, ctx.y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(String(value), MARGIN + 150, ctx.y);
  ctx.y += 17;
}
