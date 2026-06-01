import { jsPDF } from 'jspdf';

// Deepgram palette
const NAVY = [10, 15, 30];
const GREEN = [0, 229, 160];
const TEXT = [25, 32, 45];
const MUTED = [110, 122, 145];
const RULE = [220, 225, 235];
const STAT_BG = [245, 245, 245];
const SOFT_GRAY = [85, 95, 115];

export const LANDSCAPE_PROMPT_SYSTEM =
  'You are a research analyst writing an executive briefing on contact center trends. Write in professional, authoritative prose. No bullet points. No headers within your response. 3-4 paragraphs only.';

export function buildLandscapePrompt(industry) {
  const ind = industry || 'general contact center';
  return `Write a 3-4 paragraph industry landscape section for a contact center AI research report targeting the ${ind} industry. Cover: current state of contact center operations in this industry, key challenges they face (cost, staffing, customer expectations, compliance), where AI and voice technology are having the most impact, and what leading organizations in this industry are doing to stay ahead. Be specific to ${ind}. Use real industry context. Write as if this is a page in a Goldman Sachs or McKinsey research brief.`;
}

const GOAL_DETAILS = {
  aht: {
    title: 'Reduce Average Handle Time',
    paragraph:
      'Real-time AI transcription and agent assist are the most proven levers for handle time reduction in modern contact centers. Organizations deploying these capabilities report 20-35% reductions in average handle time — driven by instant access to relevant information, automated call categorization, and guided next-best-action recommendations that eliminate agent search time during live calls.',
    statNumber: '20-35%',
    statLabel: 'Industry benchmark AHT reduction with AI agent assist',
  },
  deflection: {
    title: 'Deflect Calls with Self-Service',
    paragraph:
      'The cost differential between human-assisted and self-service interactions remains one of the most compelling economic arguments for AI investment. Gartner research consistently shows human-assisted calls averaging $13.50 per interaction versus $1.84 for fully self-served interactions — a 7x cost difference. Organizations achieving 30% containment rates through AI voice agents are realizing tens of millions in annual savings at scale.',
    statNumber: '7x',
    statLabel:
      'Cost difference between human-assisted ($13.50) and self-service ($1.84) interactions (Gartner)',
  },
  acw: {
    title: 'Reduce After-Call Work',
    paragraph:
      'After-call work consumes 15-25% of total agent time in most contact centers — time spent manually logging notes, updating CRM records, and summarizing call outcomes. AI-generated call summaries delivered instantly at the end of every interaction eliminate this entirely, reducing ACW by up to 40% and allowing agents to handle more calls per shift without additional headcount.',
    statNumber: '40%',
    statLabel: 'ACW reduction through AI-generated call summaries',
  },
  qa: {
    title: 'Improve QA & Compliance Coverage',
    paragraph:
      'Traditional QA models sample 3-5% of calls — leaving 95% of customer interactions unmonitored and compliance risks undetected. AI-powered speech analytics changes this equation entirely, enabling 100% call coverage at a fraction of the cost of manual review. Organizations in regulated industries are increasingly treating full-coverage AI monitoring not as a cost center but as a risk management imperative.',
    statNumber: '95%',
    statLabel: 'Of calls go unmonitored in traditional QA programs',
  },
  ramp: {
    title: 'Reduce Agent Ramp Time',
    paragraph:
      'Agent attrition averages 30-45% annually in contact centers — making ramp time one of the most significant hidden costs in the industry. BCG research shows AI-assisted onboarding reduces ramp time from 9.2 to 5.7 weeks, a 38% improvement driven by real-time guidance, automated coaching, and instant access to knowledge bases during live calls. At scale, this compounds significantly across a high-attrition workforce.',
    statNumber: '38%',
    statLabel: 'Ramp time reduction with AI-assisted onboarding (BCG)',
  },
  fcr: {
    title: 'Improve First Call Resolution',
    paragraph:
      'First call resolution is the single metric most correlated with customer satisfaction and contact center cost efficiency. Every repeat call represents a failure of the first interaction — and at $13.50 per call, repeat contacts are expensive. AI-powered real-time guidance, dynamic knowledge surfacing, and post-call analytics have been shown to improve FCR by 10-15%, meaningfully reducing repeat call volume and the cost it carries.',
    statNumber: '10-15%',
    statLabel: 'FCR improvement with AI-powered agent guidance',
  },
};

const PRODUCT_NARRATIVES = {
  'flux-stt': {
    name: 'Flux STT',
    body: "Deepgram's fastest, most accurate streaming model. Built for real-time transcription in live call environments — agent assist, virtual agents, and conversation analytics.",
    family: 'stt',
  },
  'nova-3-batch': {
    name: 'Nova-3 Batch STT',
    body: 'Industry-leading accuracy for post-call processing. Ideal for call recording transcription, QA automation, and compliance monitoring at scale.',
    family: 'stt',
  },
  'flux-tts': {
    name: 'Flux TTS',
    body: 'Natural, low-latency text-to-speech for AI voice agents. Indistinguishable from human speech in live customer interactions.',
    family: 'tts',
  },
  'voice-agent': {
    name: 'Voice Agent API',
    body: 'End-to-end voice agent infrastructure. Build, deploy, and scale AI agents that handle real customer conversations — no stitching required.',
    family: 'stt',
  },
  keyterm: {
    name: 'Keyterm Prompting',
    body: 'Boost transcription accuracy for industry-specific terminology, product names, and compliance language.',
    family: 'stt',
  },
  'diarization-stream': {
    name: 'Speaker Diarization',
    body: 'Automatically identify and label each speaker in a conversation — essential for QA, coaching, and compliance use cases.',
    family: 'stt',
  },
  'diarization-batch': {
    name: 'Speaker Diarization',
    body: 'Automatically identify and label each speaker in a conversation — essential for QA, coaching, and compliance use cases.',
    family: 'stt',
  },
  redaction: {
    name: 'Redaction',
    body: 'Automatically remove PII and sensitive data from transcripts in real time — critical for financial services, healthcare, and government.',
    family: 'stt',
  },
  summarization: {
    name: 'Summarization',
    body: 'AI-generated call summaries delivered instantly after every call. Eliminate after-call work and create a searchable record of every customer interaction.',
    family: 'stt',
  },
  sentiment: {
    name: 'Sentiment Analysis',
    body: 'Real-time detection of caller sentiment across 100% of interactions. Identify at-risk customers, escalation triggers, and coaching opportunities at scale.',
    family: 'stt',
  },
};

function sttComparison(provider) {
  switch (provider) {
    case 'Google':
      return 'vs. Google: Deepgram delivers up to 40% lower word error rates on conversational audio, 3x faster processing speeds, and purpose-built models for contact center acoustics that Google\'s general-purpose models were not designed for.';
    case 'AWS':
      return 'vs. AWS: Deepgram\'s Nova-3 and Flux models consistently outperform Amazon Transcribe on accuracy benchmarks for telephony audio, with significantly lower latency — critical for real-time agent assist and voice agent use cases.';
    case 'Azure':
    case 'Microsoft':
      return 'vs. Azure: Deepgram offers superior accuracy on accented speech and noisy call center environments, with a simpler API and faster time-to-value than Microsoft\'s Cognitive Services stack.';
    case 'Nuance':
      return 'vs. Nuance: Deepgram\'s cloud-native architecture delivers the accuracy of legacy Nuance models at a fraction of the cost and without the implementation complexity of on-premise deployments.';
    default:
      return 'Deepgram\'s API-first architecture enables rapid deployment — most customers go from API key to production in under two weeks, with no infrastructure to manage.';
  }
}

function ttsComparison(provider) {
  if (provider === 'ElevenLabs') {
    return 'vs. ElevenLabs: Deepgram\'s Flux TTS delivers comparable voice quality at significantly lower latency — purpose-built for real-time conversational AI where response speed directly impacts customer experience.';
  }
  if (provider === 'Google' || provider === 'AWS' || provider === 'Azure') {
    return `vs. ${provider}: Deepgram\'s Flux TTS produces more natural, conversational speech optimized for contact center interactions — moving beyond the robotic cadence that characterizes legacy cloud TTS providers.`;
  }
  return 'Deepgram\'s Flux TTS can be deployed alongside any existing infrastructure, enabling natural AI voice interactions without replacing current systems.';
}

export function generateRoiReport(payload) {
  const {
    recipient,
    company,
    industry,
    inputs,
    metrics,
    rows,
    sections,
    tech,
    landscapeProse,
  } = payload;

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;

  renderCoverPage(doc, { pageWidth, pageHeight, margin, recipient, company, industry });

  doc.addPage();
  renderIndustryLandscape(doc, {
    pageWidth,
    pageHeight,
    margin,
    industry,
    landscapeProse,
  });

  doc.addPage();
  renderStrategicGoals(doc, {
    pageWidth,
    pageHeight,
    margin,
    rows,
  });

  doc.addPage();
  renderSolution(doc, {
    pageWidth,
    pageHeight,
    margin,
    sections,
    tech: tech || {},
  });

  doc.addPage();
  renderValueSummary(doc, {
    pageWidth,
    pageHeight,
    margin,
    inputs,
    metrics,
    rows,
    company,
  });

  paintInteriorFooters(doc, { pageWidth, pageHeight, margin });

  const safeCompany = (company || 'customer')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase()
    .replace(/^-|-$/g, '');
  doc.save(`deepgram-roi-report-${safeCompany || 'customer'}.pdf`);
}

function renderCoverPage(doc, { pageWidth, pageHeight, margin, recipient, company, industry }) {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text('DEEPGRAM', margin, margin + 12);

  doc.setFillColor(...GREEN);
  doc.rect(margin, margin + 22, 48, 3, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GREEN);
  doc.text('VOICE AI RESEARCH REPORT', pageWidth - margin, margin + 12, {
    align: 'right',
  });

  const titleY = pageHeight / 2 - 80;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(
    `Voice AI ROI Analysis: ${company || 'Customer'}`,
    pageWidth - margin * 2
  );
  doc.text(titleLines, margin, titleY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(200, 210, 225);
  const subtitleLines = doc.splitTextToSize(
    'A Business Case for AI-Powered Contact Center Transformation',
    pageWidth - margin * 2
  );
  doc.text(subtitleLines, margin, titleY + titleLines.length * 32 + 18);

  const blockY = pageHeight - 220;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.8);
  doc.line(margin, blockY - 18, margin + 80, blockY - 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GREEN);
  doc.text('PREPARED FOR', margin, blockY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  const recipientLine = recipient?.name
    ? recipient.email
      ? `${recipient.name}  |  ${recipient.email}`
      : recipient.name
    : '—';
  doc.text(recipientLine, margin, blockY + 18);

  doc.setFontSize(11);
  doc.setTextColor(200, 210, 225);
  doc.text(`Industry: ${industry || 'Contact Center'}`, margin, blockY + 38);
  doc.text(
    `Prepared: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    margin,
    blockY + 56
  );

  doc.setFontSize(8);
  doc.setTextColor(170, 180, 200);
  doc.text(
    'Prepared by Kris Korich  |  Partnerships & BD  |  Deepgram  |  kriskorich.com',
    margin,
    pageHeight - 36
  );
}

function renderIndustryLandscape(doc, { pageWidth, pageHeight, margin, industry, landscapeProse }) {
  let y = margin + 8;
  drawHeaderBar(doc, { pageWidth, margin, eyebrow: 'Section 1' });
  y += 24;

  const landscapeName = industry || 'Contact Center';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text(`The ${landscapeName} Landscape`, margin, y);
  y += 12;
  drawAccentRule(doc, { margin, y });
  y += 22;

  const paragraphs = (landscapeProse || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);

  const lineHeight = 16;
  const maxWidth = pageWidth - margin * 2;

  for (const para of paragraphs) {
    const wrapped = doc.splitTextToSize(para, maxWidth);
    const blockHeight = wrapped.length * lineHeight + 12;
    if (y + blockHeight > pageHeight - 70) {
      doc.addPage();
      y = margin + 8;
    }
    doc.text(wrapped, margin, y);
    y += blockHeight;
  }

  if (paragraphs.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(
      'Industry landscape content could not be generated. Please try again.',
      margin,
      y
    );
  }
}

function renderStrategicGoals(doc, { pageWidth, pageHeight, margin, rows }) {
  let y = margin + 8;
  drawHeaderBar(doc, { pageWidth, margin, eyebrow: 'Section 2' });
  y += 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text('Strategic Goals & The Data Behind Them', margin, y);
  y += 12;
  drawAccentRule(doc, { margin, y });
  y += 22;

  if (rows.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(
      'No outcomes selected — return to Step 2 of the calculator to model strategic goals.',
      margin,
      y
    );
    return;
  }

  for (const { goal } of rows) {
    const details = GOAL_DETAILS[goal.id];
    if (!details) continue;
    y = renderGoalBlock(doc, {
      pageWidth,
      pageHeight,
      margin,
      y,
      details,
    });
  }
}

function renderGoalBlock(doc, { pageWidth, pageHeight, margin, y, details }) {
  const maxWidth = pageWidth - margin * 2;

  // Pre-measure
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const wrappedBody = doc.splitTextToSize(details.paragraph, maxWidth);
  const labelMaxWidth = maxWidth - 130;
  doc.setFontSize(10);
  const wrappedLabel = doc.splitTextToSize(details.statLabel, labelMaxWidth);

  const titleHeight = 14;
  const bodyHeight = wrappedBody.length * 14 + 6;
  const boxHeight = Math.max(56, 18 + wrappedLabel.length * 12 + 14);
  const blockHeight = titleHeight + 8 + bodyHeight + boxHeight + 18;

  if (y + blockHeight > pageHeight - 70) {
    doc.addPage();
    y = margin + 8;
  }

  // Goal title in green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...GREEN);
  doc.text(details.title, margin, y);
  y += 14;

  // Paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text(wrappedBody, margin, y + 4);
  y += bodyHeight;

  // Stat callout box
  doc.setFillColor(...STAT_BG);
  doc.rect(margin, y, maxWidth, boxHeight, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(margin, y, 4, boxHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...GREEN);
  doc.text(details.statNumber, margin + 18, y + boxHeight / 2 + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  const labelY = y + boxHeight / 2 - (wrappedLabel.length - 1) * 6 + 1;
  doc.text(wrappedLabel, margin + 130, labelY);

  return y + boxHeight + 22;
}

function renderSolution(doc, { pageWidth, pageHeight, margin, sections, tech }) {
  let y = margin + 8;
  drawHeaderBar(doc, { pageWidth, margin, eyebrow: 'Section 3' });
  y += 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text('Recommended Deepgram Solution', margin, y);
  y += 12;
  drawAccentRule(doc, { margin, y });
  y += 22;

  // Build de-duped product list across realtime + batch
  const all = [
    ...(sections?.realtime || []),
    ...(sections?.batch || []),
  ];
  const seen = new Set();
  const products = [];
  for (const item of all) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    const meta = PRODUCT_NARRATIVES[item.id];
    if (meta) products.push({ id: item.id, ...meta });
  }

  const maxWidth = pageWidth - margin * 2;

  if (products.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(
      'No products recommended — select outcomes in Step 2 to populate this section.',
      margin,
      y
    );
  }

  for (const p of products) {
    const comparison =
      p.family === 'tts'
        ? ttsComparison(tech.tts || '')
        : sttComparison(tech.stt || '');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const wrappedBody = doc.splitTextToSize(p.body, maxWidth);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    const wrappedComp = doc.splitTextToSize(comparison, maxWidth);

    const blockHeight =
      16 + wrappedBody.length * 14 + 8 + wrappedComp.length * 13 + 18;
    if (y + blockHeight > pageHeight - 70) {
      doc.addPage();
      y = margin + 8;
    }

    // Name in bold green
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...GREEN);
    doc.text(p.name, margin, y);
    y += 16;

    // Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...TEXT);
    doc.text(wrappedBody, margin, y);
    y += wrappedBody.length * 14 + 6;

    // Comparison line (italic gray)
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...SOFT_GRAY);
    doc.text(wrappedComp, margin, y);
    y += wrappedComp.length * 13 + 18;
  }

  // Customer proof point
  const proof =
    "Deepgram powers voice AI for the world's leading contact center platforms, CCaaS providers, and enterprise AI builders — processing billions of minutes of audio annually across financial services, healthcare, retail, telecom, and government.";
  const wrappedProof = doc.splitTextToSize(proof, maxWidth - 28);
  const proofHeight = 24 + wrappedProof.length * 14 + 16;
  if (y + proofHeight > pageHeight - 70) {
    doc.addPage();
    y = margin + 8;
  }
  doc.setFillColor(...NAVY);
  doc.rect(margin, y, maxWidth, proofHeight, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(margin, y, 4, proofHeight, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text('CUSTOMER PROOF', margin + 18, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(wrappedProof, margin + 18, y + 36);
}

function renderValueSummary(doc, { pageWidth, pageHeight, margin, inputs, metrics, rows, company }) {
  let y = margin + 8;
  drawHeaderBar(doc, { pageWidth, margin, eyebrow: 'Section 4' });
  y += 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...NAVY);
  doc.text('Value Summary', margin, y);
  y += 12;
  drawAccentRule(doc, { margin, y });
  y += 22;

  const maxWidth = pageWidth - margin * 2;

  // Hero: Total Annual Value
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text('TOTAL PROJECTED ANNUAL VALUE', margin, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(...GREEN);
  doc.text(formatCurrency(metrics.totalAnnualValue), margin, y + 28);
  y += 50;

  // Secondary metrics row
  const metricsRow = [
    {
      label: 'Payback Period',
      value:
        metrics.paybackMonths === null
          ? '—'
          : metrics.paybackMonths < 1
            ? '< 1 month'
            : `${metrics.paybackMonths.toFixed(1)} months`,
    },
    {
      label: 'Annual Calls Processed',
      value: formatNumber(metrics.callsPerYear),
    },
    {
      label: 'Annual Hours of Audio',
      value: `${formatNumber(Math.round(metrics.annualHours))} hrs`,
    },
  ];

  const colWidth = maxWidth / metricsRow.length;
  metricsRow.forEach((m, i) => {
    const cx = margin + colWidth * i;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(m.label.toUpperCase(), cx, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...NAVY);
    doc.text(m.value, cx, y + 18);
  });
  y += 38;

  // Divider
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  // Deepgram investment estimate
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...NAVY);
  doc.text('Estimated Deepgram Annual Investment', margin, y);
  y += 16;

  const includesDeflection = rows.some(({ goal }) => goal.id === 'deflection');
  const monthlyCalls = inputs.monthlyCalls || 0;
  const aht = inputs.aht || 0;
  const annualAudioHours = (monthlyCalls * aht * 12) / 60;
  const sttCost = annualAudioHours * 0.29;
  const vaCost = includesDeflection
    ? ((monthlyCalls * 0.3 * aht * 12) / 60) * 4.5
    : 0;
  const ttsCost = includesDeflection
    ? (monthlyCalls * aht * 150 * 6 * 12 * 0.03) / 1000
    : 0;
  const totalInvestment = sttCost + vaCost + ttsCost;

  const lineItems = [
    { label: 'STT (Nova-3 Mono)', value: sttCost, note: `${formatNumber(Math.round(annualAudioHours))} hrs × $0.29/hr` },
  ];
  if (includesDeflection) {
    lineItems.push({
      label: 'Voice Agent API',
      value: vaCost,
      note: '30% of calls at $4.50/hr',
    });
    lineItems.push({
      label: 'Flux TTS',
      value: ttsCost,
      note: '~150 wpm × 6 chars/word × $0.030/1k chars',
    });
  }

  // Line items
  doc.setFontSize(10);
  for (const li of lineItems) {
    if (y + 18 > pageHeight - 130) {
      doc.addPage();
      y = margin + 8;
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT);
    doc.text(li.label, margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.setFontSize(8.5);
    doc.text(li.note, margin + 4, y + 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(formatCurrency(li.value), pageWidth - margin - 4, y, {
      align: 'right',
    });
    y += 22;
  }

  // Total investment row
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);
  doc.line(margin, y - 4, pageWidth - margin, y - 4);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text('Total Estimated Investment', margin + 4, y);
  doc.text(formatCurrency(totalInvestment), pageWidth - margin - 4, y, {
    align: 'right',
  });
  y += 14;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    '* Based on list pricing. Volume discounts available.',
    margin + 4,
    y
  );
  y += 22;

  // ROI multiple
  const roi = totalInvestment > 0 ? metrics.totalAnnualValue / totalInvestment : null;
  doc.setFillColor(...STAT_BG);
  doc.rect(margin, y, maxWidth, 56, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(margin, y, 4, 56, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('ESTIMATED ROI MULTIPLE', margin + 18, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...GREEN);
  doc.text(
    roi === null ? '—' : `${roi.toFixed(1)}x return on investment`,
    margin + 18,
    y + 44
  );
  y += 76;

  // Closing paragraph
  const closing =
    "This analysis is based on conservative industry benchmarks. Actual results will vary based on implementation scope, use case complexity, and organizational readiness. Deepgram's team of voice AI specialists is available to conduct a detailed assessment tailored to your environment.";
  const wrappedClosing = doc.splitTextToSize(closing, maxWidth);
  const closingHeight = wrappedClosing.length * 14;
  if (y + closingHeight + 60 > pageHeight - 70) {
    doc.addPage();
    y = margin + 8;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...TEXT);
  doc.text(wrappedClosing, margin, y);
  y += closingHeight + 18;

  // CTA bar
  if (y + 64 > pageHeight - 70) {
    doc.addPage();
    y = margin + 8;
  }
  doc.setFillColor(...NAVY);
  doc.rect(margin, y, maxWidth, 64, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(margin, y, 4, 64, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Ready to build your business case${company ? ` for ${company}` : ''}?`,
    margin + 18,
    y + 22
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(200, 210, 225);
  doc.text(
    'Contact Kris Korich  |  kris.korich@deepgram.com  |  kriskorich.com',
    margin + 18,
    y + 44
  );
}

function drawHeaderBar(doc, { pageWidth, margin, eyebrow, topY }) {
  const y = topY ?? margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text(eyebrow.toUpperCase(), margin, y);

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);
  doc.line(margin + 70, y - 3, pageWidth - margin, y - 3);
}

function drawAccentRule(doc, { margin, y }) {
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.2);
  doc.line(margin, y, margin + 36, y);
}

function paintInteriorFooters(doc, { pageWidth, pageHeight, margin }) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 50, pageWidth - margin, pageHeight - 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      '© Deepgram  |  Prepared by Kris Korich  |  kriskorich.com  |  Confidential',
      margin,
      pageHeight - 32
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 32, {
      align: 'right',
    });
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}
