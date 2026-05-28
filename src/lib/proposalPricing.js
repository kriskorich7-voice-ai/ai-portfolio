export const INDUSTRIES = [
  'Financial Services',
  'Healthcare',
  'Retail',
  'Telecom',
  'Government',
  'Other',
];

export const USE_CASES = [
  { id: 'contact-center', label: 'Contact Center / Call Routing' },
  { id: 'virtual-agent', label: 'Virtual Agent / IVR Replacement' },
  { id: 'agent-assist', label: 'Agent Assist / Real-time Transcription' },
  { id: 'compliance', label: 'Compliance & Call Recording' },
  { id: 'other', label: 'Other' },
];

export const PRICING = {
  stt: {
    label: 'Speech-to-Text',
    options: [
      { id: 'flux-english', name: 'Flux English', rate: 0.39, unit: '/hr' },
      { id: 'flux-multi', name: 'Flux Multilingual', rate: 0.47, unit: '/hr' },
      { id: 'nova-3-mono', name: 'Nova-3 Mono', rate: 0.29, unit: '/hr' },
      { id: 'nova-3-multi', name: 'Nova-3 Multi', rate: 0.35, unit: '/hr' },
      { id: 'nova-3-mono-batch', name: 'Nova-3 Mono Batch', rate: 0.26, unit: '/hr' },
      { id: 'nova-3-multi-batch', name: 'Nova-3 Multi Batch', rate: 0.31, unit: '/hr' },
    ],
  },
  tts: {
    label: 'Text-to-Speech',
    options: [
      { id: 'aura-1', name: 'Aura-1', rate: 0.015, unit: '/1k chars' },
      { id: 'aura-2', name: 'Aura-2', rate: 0.03, unit: '/1k chars' },
      { id: 'flux-tts', name: 'Flux TTS', rate: 0.032, unit: '/1k chars' },
    ],
  },
  voiceAgent: {
    label: 'Voice Agent',
    options: [
      { id: 'standard', name: 'Standard', rate: 4.5, unit: '/hr' },
      { id: 'standard-byo-tts', name: 'Standard BYO TTS', rate: 3.38, unit: '/hr' },
      { id: 'custom-byo-llm', name: 'Custom BYO LLM', rate: 3.9, unit: '/hr' },
      { id: 'custom-byo-llm-tts', name: 'Custom BYO LLM + TTS', rate: 3.0, unit: '/hr' },
      { id: 'advanced', name: 'Advanced', rate: 9.75, unit: '/hr' },
      { id: 'advanced-byo-tts', name: 'Advanced BYO TTS', rate: 7.31, unit: '/hr' },
    ],
  },
};

export const DEFAULT_SCENARIOS = [
  { id: 's1', label: 'Scenario 1', percent: 0, enabled: true },
  { id: 's2', label: 'Scenario 2', percent: 3, enabled: true },
  { id: 's3', label: 'Scenario 3', percent: 5, enabled: true },
];

export function scenarioDisplayLabel(scenario) {
  const pct = Number(scenario.percent) || 0;
  if (pct === 0) return `${scenario.label} (Flat)`;
  return `${scenario.label} (${pct}% MoM)`;
}

function annualMultiplier(monthlyRate) {
  if (!monthlyRate) return 12;
  const r = 1 + monthlyRate;
  return (Math.pow(r, 12) - 1) / (r - 1);
}

function computeLine({ baseAnnual, rate, divisor, discountPct, monthlyRate }) {
  const baseMonthly = baseAnnual / 12;
  const annualVolume = baseMonthly * annualMultiplier(monthlyRate);
  const listCost = (annualVolume / divisor) * rate;
  const discountedCost = listCost * (1 - (discountPct || 0) / 100);
  const savings = listCost - discountedCost;
  return { annualVolume, listCost, discountedCost, savings };
}

function normalizeScenarios(rawScenarios) {
  return rawScenarios
    .filter((s) => s.enabled)
    .map((s) => ({
      id: s.id,
      label: scenarioDisplayLabel(s),
      percent: Number(s.percent) || 0,
      monthlyRate: (Number(s.percent) || 0) / 100,
    }));
}

export function buildProposal(input) {
  const scenarios = normalizeScenarios(input.scenarios);
  const products = [];

  const sttHours = Number(input.usage.stt.annualHours) || 0;
  if (sttHours > 0) {
    const model = PRICING.stt.options.find((o) => o.id === input.models.stt);
    const lines = scenarios.map((scenario) => ({
      scenario,
      ...computeLine({
        baseAnnual: sttHours,
        rate: model.rate,
        divisor: 1,
        discountPct: input.discounts.stt,
        monthlyRate: scenario.monthlyRate,
      }),
    }));
    products.push({
      key: 'stt',
      label: PRICING.stt.label,
      model,
      volumeUnit: 'hours',
      discountPct: Number(input.discounts.stt) || 0,
      lines,
    });
  }

  const ttsChars = Number(input.usage.tts.annualChars) || 0;
  if (ttsChars > 0) {
    const model = PRICING.tts.options.find((o) => o.id === input.models.tts);
    const lines = scenarios.map((scenario) => ({
      scenario,
      ...computeLine({
        baseAnnual: ttsChars,
        rate: model.rate,
        divisor: 1000,
        discountPct: input.discounts.tts,
        monthlyRate: scenario.monthlyRate,
      }),
    }));
    products.push({
      key: 'tts',
      label: PRICING.tts.label,
      model,
      volumeUnit: 'characters',
      discountPct: Number(input.discounts.tts) || 0,
      lines,
    });
  }

  const vaHours = Number(input.usage.voiceAgent.annualHours) || 0;
  if (vaHours > 0) {
    const model = PRICING.voiceAgent.options.find(
      (o) => o.id === input.models.voiceAgent
    );
    const lines = scenarios.map((scenario) => ({
      scenario,
      ...computeLine({
        baseAnnual: vaHours,
        rate: model.rate,
        divisor: 1,
        discountPct: input.discounts.voiceAgent,
        monthlyRate: scenario.monthlyRate,
      }),
    }));
    products.push({
      key: 'voiceAgent',
      label: PRICING.voiceAgent.label,
      model,
      volumeUnit: 'hours',
      discountPct: Number(input.discounts.voiceAgent) || 0,
      lines,
    });
  }

  return {
    company: input.companyName.trim(),
    industry: input.industry,
    useCases: input.useCases,
    customUseCase: input.customUseCase.trim(),
    usage: input.usage,
    scenarios,
    products,
    generatedAt: new Date(),
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatVolume(value, unit) {
  if (unit === 'characters') {
    return `${new Intl.NumberFormat('en-US').format(Math.round(value))} chars`;
  }
  if (unit === 'hours') {
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value)} hrs`;
  }
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function useCaseLabel(id, customUseCase) {
  if (id === 'other' && customUseCase) {
    return `Other — ${customUseCase}`;
  }
  return USE_CASES.find((u) => u.id === id)?.label ?? id;
}
