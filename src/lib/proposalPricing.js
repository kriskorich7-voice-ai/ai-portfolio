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
      { id: 'nova-3-mono', name: 'Nova-3 Mono', rate: 0.0048, unit: '/min' },
      { id: 'nova-3-multi', name: 'Nova-3 Multi', rate: 0.0058, unit: '/min' },
      { id: 'flux-english', name: 'Flux English', rate: 0.0065, unit: '/min' },
    ],
  },
  tts: {
    label: 'Text-to-Speech',
    options: [
      { id: 'aura-2', name: 'Aura-2', rate: 0.03, unit: '/1k chars' },
      { id: 'aura-1', name: 'Aura-1', rate: 0.015, unit: '/1k chars' },
    ],
  },
  voiceAgent: {
    label: 'Voice Agent',
    options: [
      { id: 'standard', name: 'Standard', rate: 0.075, unit: '/min' },
      { id: 'standard-byo-tts', name: 'Standard BYO TTS', rate: 0.065, unit: '/min' },
      { id: 'custom-byo-llm', name: 'Custom BYO LLM', rate: 0.056, unit: '/min' },
      { id: 'advanced', name: 'Advanced', rate: 0.163, unit: '/min' },
    ],
  },
};

export const SCENARIOS = [
  { id: 'flat', label: 'Flat (0%)', monthlyRate: 0 },
  { id: '3mom', label: '3% MoM', monthlyRate: 0.03 },
  { id: '5mom', label: '5% MoM', monthlyRate: 0.05 },
];

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

export function buildProposal(input) {
  const scenarios = SCENARIOS.filter((s) => input.scenarios.includes(s.id));
  const products = [];

  const sttHours = Number(input.usage.stt.annualHours) || 0;
  if (sttHours > 0) {
    const model = PRICING.stt.options.find((o) => o.id === input.models.stt);
    const lines = scenarios.map((scenario) => ({
      scenario,
      ...computeLine({
        baseAnnual: sttHours * 60,
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
      volumeUnit: 'minutes',
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
        baseAnnual: vaHours * 60,
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
      volumeUnit: 'minutes',
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
  if (unit === 'minutes') {
    const hours = value / 60;
    return `${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(hours)} hrs`;
  }
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

export function useCaseLabel(id, customUseCase) {
  if (id === 'other' && customUseCase) {
    return `Other — ${customUseCase}`;
  }
  return USE_CASES.find((u) => u.id === id)?.label ?? id;
}
