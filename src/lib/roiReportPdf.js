import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const NAVY = [10, 15, 30];
const NAVY_SOFT = [40, 50, 75];
const GREEN = [0, 229, 160];
const TEXT = [25, 32, 45];
const MUTED = [110, 122, 145];
const RULE = [220, 225, 235];

const INDUSTRY_LANDSCAPE = {
  'Financial Services': [
    ['Average cost per call', '$15.80'],
    ['Average abandonment rate', '12%'],
    [
      'Digital deflection opportunity',
      '45% of calls are routine inquiries',
    ],
    [
      'Compliance cost',
      '$4.2M average annual spend on QA and compliance monitoring',
    ],
  ],
  Healthcare: [
    ['Average cost per call', '$18.50'],
    ['Average abandonment rate', '17%'],
    [
      'Patient satisfaction impact',
      '34% of patients cite phone experience as key satisfaction driver',
    ],
    [
      'Scheduling and billing',
      'Account for 60% of inbound call volume',
    ],
  ],
  Retail: [
    ['Average cost per call', '$13.20'],
    ['Average abandonment rate', '9%'],
    ['Seasonal volume spikes', 'Up to 400% during peak periods'],
    [
      'Routine inquiries',
      '52% of retail calls are order status, returns, or routine inquiries',
    ],
  ],
  Telecom: [
    ['Average cost per call', '$14.50'],
    ['Average abandonment rate', '14%'],
    ['First call resolution rate', 'Industry average 71%'],
    ['Agent churn rate', '35% annually, highest of any industry'],
  ],
  Government: [
    ['Average cost per call', '$22.00'],
    ['Average abandonment rate', '19%'],
    ['Average wait time', '8.3 minutes'],
    ['Citizen satisfaction', '63/100 (lowest of any sector)'],
  ],
  Other: [
    ['Average cost per call', '$13.50'],
    ['Average abandonment rate', '11%'],
    ['Industry average FCR', '74%'],
    ['Average AHT', '6.2 minutes'],
  ],
};

const GOAL_NARRATIVES = {
  aht: ({ monthlyCalls, agentsFreed }) =>
    `Organizations deploying real-time AI transcription and agent assist report 20-35% reductions in average handle time. At scale, a 15% AHT reduction across ${formatNumber(monthlyCalls)} monthly calls represents significant agent capacity recaptured — the equivalent of ${agentsFreed.toFixed(1)} full-time agents.`,
  deflection: () =>
    'Gartner research shows the average cost of a human-assisted call is $13.50 versus $1.84 for self-service. With 30% containment, organizations of your scale can redirect millions in annual spend toward higher-value interactions.',
  acw: () =>
    'After-call work accounts for 15-25% of total handle time in most contact centers. AI-generated call summaries eliminate manual note-taking, cutting ACW by 40% and freeing agents to take the next call faster.',
  qa: () =>
    'Most QA teams manually review 3-5% of calls. AI-powered monitoring covers 100% of interactions, surfacing compliance risks, coaching opportunities, and customer sentiment at a scale no human team can match.',
  ramp: () =>
    'BCG research shows AI-assisted onboarding reduces agent ramp time from 9.2 to 5.7 weeks — a 38% improvement. With average industry attrition of 30%, this compounds significantly across your agent base each year.',
  fcr: () =>
    'A 10% improvement in FCR reduces repeat call volume proportionally, cutting cost per resolution and improving customer satisfaction scores. AI-powered guidance and real-time transcription are the most common drivers of FCR improvement.',
};

const PRODUCT_NARRATIVES = {
  'flux-stt': {
    name: 'Flux STT',
    body: "Deepgram's fastest, most accurate streaming model. Built for real-time transcription in live call environments — agent assist, virtual agents, and conversation analytics.",
  },
  'nova-3-batch': {
    name: 'Nova-3 Batch STT',
    body: 'Industry-leading accuracy for post-call processing. Ideal for call recording transcription, QA automation, and compliance monitoring at scale.',
  },
  'flux-tts': {
    name: 'Flux TTS',
    body: 'Natural, low-latency text-to-speech for AI voice agents. Indistinguishable from human speech in live customer interactions.',
  },
  'voice-agent': {
    name: 'Voice Agent API',
    body: 'End-to-end voice agent infrastructure. Build, deploy, and scale AI agents that handle real customer conversations — no stitching required.',
  },
  keyterm: {
    name: 'Keyterm Prompting',
    body: 'Boost transcription accuracy for industry-specific terminology, product names, and compliance language.',
  },
  'diarization-stream': {
    name: 'Speaker Diarization',
    body: 'Automatically identify and label each speaker in a conversation — essential for QA, coaching, and compliance use cases.',
  },
  'diarization-batch': {
    name: 'Speaker Diarization',
    body: 'Automatically identify and label each speaker in a conversation — essential for QA, coaching, and compliance use cases.',
  },
  redaction: {
    name: 'Redaction',
    body: 'Automatically remove PII and sensitive data from transcripts in real time — critical for financial services, healthcare, and government.',
  },
  summarization: {
    name: 'Summarization',
    body: 'AI-generated call summaries delivered instantly after every call. Eliminate after-call work and create a searchable record of every customer interaction.',
  },
  sentiment: {
    name: 'Sentiment Analysis',
    body: 'Real-time detection of caller sentiment across 100% of interactions. Identify at-risk customers, escalation triggers, and coaching opportunities at scale.',
  },
};

export function generateRoiReport(payload) {
  const {
    recipient,
    company,
    industry,
    inputs,
    metrics,
    rows,
    sections,
  } = payload;

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;

  renderCoverPage(doc, {
    pageWidth,
    pageHeight,
    margin,
    recipient,
    company,
    industry,
  });

  doc.addPage();
  renderInsightsPage(doc, {
    pageWidth,
    pageHeight,
    margin,
    company,
    industry,
    inputs,
    rows,
  });

  doc.addPage();
  renderValuePage(doc, {
    pageWidth,
    pageHeight,
    margin,
    inputs,
    rows,
    metrics,
  });

  doc.addPage();
  renderSolutionPage(doc, {
    pageWidth,
    pageHeight,
    margin,
    sections,
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

  // Recipient block
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
      ? `${recipient.name}  ·  ${recipient.email}`
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

  // Footer on cover page (lighter style than interior)
  doc.setFontSize(8);
  doc.setTextColor(170, 180, 200);
  doc.text(
    'Prepared by Kris Korich  ·  Partnerships & BD  ·  Deepgram  ·  kriskorich.com',
    margin,
    pageHeight - 36
  );
}

function renderInsightsPage(doc, { pageWidth, margin, company, industry, inputs, rows }) {
  let y = margin + 8;

  drawHeaderBar(doc, { pageWidth, margin, eyebrow: 'Section 1' });
  y += 24;

  const industryKey = INDUSTRY_LANDSCAPE[industry] ? industry : 'Other';
  const landscapeName = industry || 'Contact Center';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text(`The ${landscapeName} Contact Center Landscape`, margin, y);
  y += 12;

  drawAccentRule(doc, { margin, y });
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const intro = doc.splitTextToSize(
    `Industry-wide benchmarks shaping ${landscapeName.toLowerCase()} customer service operations today. These reflect published research across enterprise contact center programs and inform the value model on the following pages.`,
    pageWidth - margin * 2
  );
  doc.text(intro, margin, y);
  y += intro.length * 13 + 12;

  const landscapeRows = INDUSTRY_LANDSCAPE[industryKey];
  autoTable(doc, {
    startY: y,
    head: [['Benchmark', 'Industry data point']],
    body: landscapeRows,
    theme: 'grid',
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: { fontSize: 10, cellPadding: 8, textColor: TEXT, lineColor: RULE },
    alternateRowStyles: { fillColor: [248, 250, 253] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 200 } },
    margin: { left: margin, right: margin },
  });
  y = doc.lastAutoTable.finalY + 28;

  drawHeaderBar(doc, { pageWidth, margin, eyebrow: 'Section 2', topY: y });
  y += 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Your Strategic Goals & The Data Behind Them', margin, y);
  y += 12;
  drawAccentRule(doc, { margin, y });
  y += 20;

  if (rows.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(
      'No outcomes selected in Step 2 of the calculator.',
      margin,
      y
    );
    return;
  }

  for (const { goal, annualValue } of rows) {
    const narrative = renderGoalNarrative(goal, inputs);
    const lines = doc.splitTextToSize(narrative, pageWidth - margin * 2);
    const blockHeight = 16 + 6 + lines.length * 13 + 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(goal.title, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GREEN);
    doc.text(
      `Projected annual value: ${formatCurrency(annualValue)}`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(lines, margin, y + 16);

    y += blockHeight;
  }
}

function renderValuePage(doc, { pageWidth, pageHeight, margin, inputs, rows, metrics }) {
  let y = margin + 8;

  drawHeaderBar(doc, { pageWidth, margin, eyebrow: 'Section 3' });
  y += 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Your Projected Annual Value from Deepgram', margin, y);
  y += 12;
  drawAccentRule(doc, { margin, y });
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const intro = doc.splitTextToSize(
    `The math behind each projected outcome. Calculations apply industry benchmarks to your inputs: ${formatNumber(inputs.agents)} agents, ${formatNumber(inputs.monthlyCalls)} monthly calls, ${formatNumber(inputs.aht)} min AHT, ${formatCurrency(inputs.agentCost)} fully burdened annual agent cost.`,
    pageWidth - margin * 2
  );
  doc.text(intro, margin, y);
  y += intro.length * 13 + 14;

  if (rows.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(
      'No outcomes selected — return to Step 2 of the calculator to model projected value.',
      margin,
      y
    );
    return;
  }

  for (const { goal } of rows) {
    const calc = buildGoalCalculation(goal.id, inputs);
    if (!calc) continue;
    y = renderCalculationBlock(doc, {
      pageWidth,
      pageHeight,
      margin,
      y,
      title: calc.title,
      lines: calc.lines,
      valueLine: calc.valueLine,
    });
  }

  // Total Annual Value strip at the bottom of Section 3
  const stripHeight = 64;
  if (y + stripHeight > pageHeight - 70) {
    doc.addPage();
    y = margin + 8;
  }
  renderTotalStrip(doc, { pageWidth, margin, y, metrics, stripHeight });
}

function renderSolutionPage(doc, { pageWidth, pageHeight, margin, sections }) {
  let y = margin + 8;

  drawHeaderBar(doc, { pageWidth, margin, eyebrow: 'Section 4' });
  y += 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text('Your Recommended Deepgram Solution', margin, y);
  y += 12;
  drawAccentRule(doc, { margin, y });
  y += 18;

  const recommendedIds = [
    ...sections.realtime.map((p) => p.id),
    ...sections.batch.map((p) => p.id),
  ];
  const seen = new Set();
  const renderable = [];
  for (const id of recommendedIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const meta = PRODUCT_NARRATIVES[id];
    if (meta) renderable.push(meta);
  }

  if (renderable.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(
      'No products recommended — select outcomes in Step 2 to populate this section.',
      margin,
      y
    );
    return;
  }

  for (const item of renderable) {
    const lines = doc.splitTextToSize(item.body, pageWidth - margin * 2 - 14);
    const blockHeight = 18 + lines.length * 13 + 6;
    if (y + blockHeight > pageHeight - 70) {
      doc.addPage();
      y = margin + 8;
    }
    doc.setFillColor(...GREEN);
    doc.rect(margin, y - 9, 4, 14, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(item.name, margin + 14, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT);
    doc.text(lines, margin + 14, y + 14);

    y += blockHeight;
  }
}

function renderCalculationBlock(doc, { pageWidth, pageHeight, margin, y, title, lines, valueLine }) {
  const boxPadding = 10;
  const boxInnerWidth = pageWidth - margin * 2 - boxPadding * 2;

  // Pre-wrap to compute the block height before drawing the background.
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  const wrappedBody = lines.map((line) =>
    doc.splitTextToSize(line, boxInnerWidth)
  );
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  const wrappedValue = doc.splitTextToSize(valueLine, boxInnerWidth);

  const bodyLineHeight = 12;
  const valueLineHeight = 14;
  const bodyHeight = wrappedBody.reduce(
    (sum, w) => sum + w.length * bodyLineHeight,
    0
  );
  const valueHeight = wrappedValue.length * valueLineHeight;
  const boxHeight = boxPadding * 2 + bodyHeight + valueHeight + 4;
  const titleHeight = 8;
  const blockHeight = titleHeight + 6 + boxHeight + 12;

  if (y + blockHeight > pageHeight - 70) {
    doc.addPage();
    y = margin + 8;
  }

  // Goal title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text(title, margin, y);

  // Background box
  const boxY = y + 6;
  doc.setFillColor(245, 247, 251);
  doc.roundedRect(margin, boxY, pageWidth - margin * 2, boxHeight, 6, 6, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(margin, boxY, 3, boxHeight, 'F');

  // Body lines in courier
  let cursorY = boxY + boxPadding + bodyLineHeight - 3;
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  for (const wrapped of wrappedBody) {
    for (const text of wrapped) {
      doc.text(text, margin + boxPadding, cursorY);
      cursorY += bodyLineHeight;
    }
  }

  // Final value line in bold courier green
  cursorY += 2;
  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...GREEN);
  for (const text of wrappedValue) {
    doc.text(text, margin + boxPadding, cursorY);
    cursorY += valueLineHeight;
  }

  return boxY + boxHeight + 14;
}

function renderTotalStrip(doc, { pageWidth, margin, y, metrics, stripHeight }) {
  doc.setFillColor(...NAVY);
  doc.rect(margin, y, pageWidth - margin * 2, stripHeight, 'F');
  doc.setFillColor(...GREEN);
  doc.rect(margin, y, 4, stripHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...GREEN);
  doc.text('TOTAL ANNUAL VALUE', margin + 18, y + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrency(metrics.totalAnnualValue), margin + 18, y + 50);

  const rightX = pageWidth - margin - 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 225);
  doc.text(
    `Payback: ${
      metrics.paybackMonths === null
        ? '—'
        : metrics.paybackMonths < 1
          ? '< 1 month'
          : `${metrics.paybackMonths.toFixed(1)} months`
    }`,
    rightX,
    y + 22,
    { align: 'right' }
  );
  doc.text(
    `${formatNumber(metrics.callsPerYear)} calls/yr  ·  ${formatNumber(Math.round(metrics.annualHours))} audio hrs/yr`,
    rightX,
    y + 38,
    { align: 'right' }
  );
  doc.text(
    `Deepgram annual run-rate: ${formatCurrency(metrics.annualDeepgramCost)}`,
    rightX,
    y + 54,
    { align: 'right' }
  );
}

function buildGoalCalculation(goalId, inputs) {
  const { monthlyCalls, aht, agents, agentCost } = inputs;

  if (goalId === 'aht') {
    const minutesSaved = monthlyCalls * aht * 0.15;
    const hoursSaved = minutesSaved / 60;
    const agentsFreed = hoursSaved / 160;
    const annualValue = agentsFreed * agentCost;
    return {
      title: 'Reduce Average Handle Time',
      lines: [
        `${formatNumber(monthlyCalls)} calls/month × ${formatNumber(aht)} min AHT × 15% reduction = ${formatNumber(Math.round(minutesSaved))} minutes saved/month`,
        `÷ 60 = ${formatNumber(Math.round(hoursSaved))} hrs/month ÷ 160 hrs/agent = ${formatDecimal(agentsFreed)} agent-equivalents`,
      ],
      valueLine: `× ${formatCurrency(agentCost)} = ${formatCurrency(annualValue)} projected annual value`,
    };
  }

  if (goalId === 'deflection') {
    const annualCalls = monthlyCalls * 12;
    const deflected = annualCalls * 0.3;
    const annualValue = deflected * 11.66;
    return {
      title: 'Deflect Calls with Self-Service',
      lines: [
        `${formatNumber(monthlyCalls)} calls/month × 12 months × 30% containment = ${formatNumber(Math.round(deflected))} deflected calls/year`,
        `× $11.66 savings per call ($13.50 human − $1.84 self-service)`,
      ],
      valueLine: `= ${formatCurrency(annualValue)} projected annual value`,
    };
  }

  if (goalId === 'acw') {
    const annualCalls = monthlyCalls * 12;
    const hoursPerCall = (aht * 0.2 * 0.4) / 60;
    const hourlyRate = agentCost / 2080;
    const annualValue = annualCalls * hoursPerCall * hourlyRate;
    return {
      title: 'Reduce After-Call Work',
      lines: [
        `${formatNumber(monthlyCalls)} calls/month × 12 months = ${formatNumber(annualCalls)} calls/year`,
        `× (${formatNumber(aht)} min × 20% ACW × 40% reduction ÷ 60) × (${formatCurrency(agentCost)} ÷ 2,080)`,
      ],
      valueLine: `= ${formatCurrency(annualValue)} projected annual value`,
    };
  }

  if (goalId === 'qa') {
    const totalHours = agents * 2 * 52;
    const hourlyRate = agentCost / 2080;
    const annualValue = totalHours * hourlyRate;
    return {
      title: 'Improve QA & Compliance Coverage',
      lines: [
        `${formatNumber(agents)} agents × 2 hrs/week × 52 weeks = ${formatNumber(totalHours)} QA hours/year`,
        `× (${formatCurrency(agentCost)} ÷ 2,080 hrs) = ${formatCurrencyCents(hourlyRate)}/hr`,
      ],
      valueLine: `= ${formatCurrency(annualValue)} projected annual value`,
    };
  }

  if (goalId === 'ramp') {
    const agentsHired = agents * 0.3;
    const annualValue = agentsHired * (3.5 / 52) * agentCost;
    return {
      title: 'Reduce Agent Ramp Time',
      lines: [
        `${formatNumber(agents)} agents × 30% attrition = ${formatDecimal(agentsHired)} agents hired/year`,
        `× (3.5 weeks ÷ 52 weeks) × ${formatCurrency(agentCost)}`,
      ],
      valueLine: `= ${formatCurrency(annualValue)} projected annual value`,
    };
  }

  if (goalId === 'fcr') {
    const annualCalls = monthlyCalls * 12;
    const eliminated = annualCalls * 0.1;
    const annualValue = eliminated * 13.5;
    return {
      title: 'Improve First Call Resolution',
      lines: [
        `${formatNumber(monthlyCalls)} calls/month × 12 months × 10% FCR improvement = ${formatNumber(eliminated)} fewer repeat calls/year`,
        `× $13.50 cost per call`,
      ],
      valueLine: `= ${formatCurrency(annualValue)} projected annual value`,
    };
  }

  return null;
}

function renderGoalNarrative(goal, inputs) {
  const builder = GOAL_NARRATIVES[goal.id];
  if (!builder) return goal.benchmarkLabel || '';
  if (goal.id === 'aht') {
    const agentsFreed =
      (inputs.monthlyCalls * inputs.aht * 0.15) / 60 / 160;
    return builder({
      monthlyCalls: inputs.monthlyCalls,
      agentsFreed,
    });
  }
  return builder({});
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
    doc.setTextColor(...NAVY_SOFT);
    doc.text(
      '© Deepgram  ·  Prepared by Kris Korich  ·  kriskorich.com  ·  Confidential',
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

function formatDecimal(value) {
  const rounded = Math.round((value || 0) * 10) / 10;
  return Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(1);
}

function formatCurrencyCents(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}
