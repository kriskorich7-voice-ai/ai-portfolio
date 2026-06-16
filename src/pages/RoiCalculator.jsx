import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import {
  generateRoiReport,
  LANDSCAPE_PROMPT_SYSTEM,
  buildLandscapePrompt,
} from '../lib/roiReportPdf.js';

const INDUSTRIES = [
  'Financial Services',
  'Healthcare',
  'Retail',
  'Telecom',
  'Government',
  'Other',
];

const STT_PROVIDERS = [
  'None / In-house',
  'Google',
  'AWS',
  'Azure',
  'Microsoft',
  'Nuance',
  'Other',
];

const TTS_PROVIDERS = ['None', 'ElevenLabs', 'Google', 'AWS', 'Azure', 'Other'];

const CCAAS_PLATFORMS = [
  'Genesys',
  'Five9',
  'NICE',
  '8x8',
  'Twilio',
  'Avaya',
  'Other',
];

const GOALS = [
  {
    id: 'aht',
    title: 'Reduce Average Handle Time',
    subtitle: 'Agent assist with real-time transcription',
    deepgramHelp:
      'Real-time transcription surfaces answers and next-best actions mid-call.',
    benchmarkLabel: '15% AHT reduction (industry benchmark: 20–35%)',
    products: ['flux-stt', 'keyterm', 'diarization-stream'],
    compute: ({ monthlyCalls, aht, agentCost }) => {
      const agentsFreed = (monthlyCalls * aht * 0.15) / 60 / 160;
      return agentsFreed * agentCost;
    },
  },
  {
    id: 'deflection',
    title: 'Deflect Calls with Self-Service',
    subtitle: 'AI voice agents handling routine calls',
    deepgramHelp:
      'Voice Agent API handles routine inquiries end-to-end — no human agent required.',
    benchmarkLabel:
      '30% containment rate (Gartner: $13.50 human vs $1.84 self-service cost per call)',
    products: ['voice-agent', 'flux-tts'],
    compute: ({ monthlyCalls }) => monthlyCalls * 12 * 0.3 * (13.5 - 1.84),
  },
  {
    id: 'acw',
    title: 'Reduce After-Call Work',
    subtitle: 'Automated call summaries and notes',
    deepgramHelp:
      'AI-generated summaries replace the manual wrap-up at the end of every call.',
    benchmarkLabel: '40% ACW reduction via automated summaries',
    products: ['nova-3-batch', 'summarization'],
    compute: ({ monthlyCalls, aht, agentCost }) =>
      monthlyCalls *
      12 *
      ((aht * 0.2 * 0.4) / 60) *
      (agentCost / 2080),
  },
  {
    id: 'qa',
    title: 'Improve QA & Compliance Coverage',
    subtitle: 'AI monitoring of 100% of calls',
    deepgramHelp:
      'Batch transcription with diarization, redaction, and sentiment scores every call automatically.',
    benchmarkLabel:
      'QA team time redirected from manual sampling to strategic review',
    products: [
      'nova-3-batch',
      'diarization-batch',
      'redaction',
      'sentiment',
    ],
    compute: ({ agents, agentCost }) =>
      agents * 2 * 52 * (agentCost / 2080),
  },
  {
    id: 'ramp',
    title: 'Reduce Agent Ramp Time',
    subtitle: 'AI-assisted onboarding and coaching',
    deepgramHelp:
      'Live transcription and post-call review accelerate new-hire confidence and skill build-up.',
    benchmarkLabel: '3.5 week ramp reduction (BCG benchmark: 9.2 → 5.7 weeks)',
    products: ['flux-stt', 'diarization-stream'],
    compute: ({ agents, agentCost }) => {
      const hired = agents * 0.3;
      return hired * (3.5 / 52) * agentCost;
    },
  },
  {
    id: 'fcr',
    title: 'Improve First Call Resolution',
    subtitle: 'Better routing and real-time guidance',
    deepgramHelp:
      'Real-time keyword detection routes and equips agents to solve problems on the first call.',
    benchmarkLabel: '10% FCR improvement reducing repeat call volume',
    products: ['flux-stt', 'keyterm'],
    compute: ({ monthlyCalls }) => monthlyCalls * 12 * 0.1 * 13.5,
  },
];

const PRODUCT_CATALOG = {
  'flux-stt': {
    name: 'Flux STT',
    description: 'Real-time transcription optimized for conversational AI',
    section: 'realtime',
  },
  'nova-3-batch': {
    name: 'Nova-3 Batch STT',
    description: 'High-accuracy post-call transcription at scale',
    section: 'batch',
  },
  'flux-tts': {
    name: 'Flux TTS',
    description: 'Natural, low-latency voice for AI agents',
    section: 'realtime',
  },
  'voice-agent': {
    name: 'Voice Agent API',
    description: 'End-to-end conversational AI voice agents',
    section: 'realtime',
  },
  keyterm: {
    name: 'Keyterm Prompting',
    description: 'Boost accuracy for industry-specific terminology',
    section: 'realtime',
  },
  'diarization-stream': {
    name: 'Speaker Diarization',
    description: 'Identify and label each speaker in the conversation',
    section: 'realtime',
  },
  'diarization-batch': {
    name: 'Speaker Diarization',
    description: 'Identify and label each speaker in the conversation',
    section: 'batch',
  },
  redaction: {
    name: 'Redaction',
    description: 'Automatically remove sensitive PII from transcripts',
    section: 'batch',
  },
  summarization: {
    name: 'Summarization',
    description: 'AI-generated call summaries eliminating after-call work',
    section: 'batch',
  },
  sentiment: {
    name: 'Sentiment Analysis',
    description:
      'Real-time caller sentiment detection across 100% of calls',
    section: 'batch',
  },
};

const STEPS = [
  { id: 1, label: 'Your Contact Center' },
  { id: 2, label: 'Your Goals' },
  { id: 3, label: 'Current Tech' },
  { id: 'results', label: 'Results' },
];

const INITIAL_CONTACT_CENTER = {
  companyName: '',
  industry: '',
  agents: '',
  monthlyCalls: '',
  aht: '6',
  abandonRate: '8',
  agentCost: '65000',
};

const INITIAL_TECH = {
  stt: '',
  tts: '',
  ccaas: '',
  hasVoiceAgent: false,
};

export default function RoiCalculator() {
  const [step, setStep] = useState(1);
  const [contactCenter, setContactCenter] = useState(INITIAL_CONTACT_CENTER);
  const [goals, setGoals] = useState([]);
  const [tech, setTech] = useState(INITIAL_TECH);

  const canAdvanceStep1 =
    contactCenter.companyName.trim().length > 0 &&
    Number(contactCenter.agents) > 0 &&
    Number(contactCenter.monthlyCalls) > 0;
  const canAdvanceStep2 = goals.length > 0;

  const updateContactCenter = (patch) =>
    setContactCenter((prev) => ({ ...prev, ...patch }));
  const updateTech = (patch) => setTech((prev) => ({ ...prev, ...patch }));

  const toggleGoal = (id) =>
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const handleReset = () => {
    setStep(1);
    setContactCenter(INITIAL_CONTACT_CENTER);
    setGoals([]);
    setTech(INITIAL_TECH);
  };

  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Tool"
        title="Deepgram ROI Calculator"
        description="Estimate the projected annual value of Deepgram for your contact center in a few minutes. Tailored to your agent count, call volume, and the outcomes that matter most."
      />

      <StepProgress current={step} />

      <div className="mt-8">
        {step === 1 && (
          <StepContactCenter
            value={contactCenter}
            onChange={updateContactCenter}
          />
        )}
        {step === 2 && (
          <StepGoals selected={goals} onToggle={toggleGoal} />
        )}
        {step === 3 && <StepTech value={tech} onChange={updateTech} />}
        {step === 'results' && (
          <Results
            contactCenter={contactCenter}
            goals={goals}
            tech={tech}
            onRecalculate={handleReset}
          />
        )}
      </div>

      {step !== 'results' && (
        <StepNav
          step={step}
          canAdvance={
            step === 1
              ? canAdvanceStep1
              : step === 2
                ? canAdvanceStep2
                : true
          }
          onBack={() => setStep((s) => (typeof s === 'number' ? s - 1 : 3))}
          onNext={() =>
            setStep((s) => (s === 3 ? 'results' : s + 1))
          }
        />
      )}
    </section>
  );
}

function StepProgress({ current }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((s, i) => {
        const isActive = current === s.id;
        const currentIdx = STEPS.findIndex((x) => x.id === current);
        const isDone = i < currentIdx;
        return (
          <div key={s.id} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <span
                className={
                  'flex h-7 w-7 flex-none items-center justify-center rounded-full border text-xs font-semibold transition ' +
                  (isActive
                    ? 'border-accent-blue bg-accent-blue text-white shadow-glow'
                    : isDone
                      ? 'border-accent-blue/60 bg-accent-blue/20 text-accent-blue'
                      : 'border-white/15 bg-ink-900/60 text-slate-500')
                }
              >
                {isDone ? (
                  <Check />
                ) : typeof s.id === 'number' ? (
                  s.id
                ) : (
                  <Sparkle />
                )}
              </span>
              <span
                className={
                  'truncate text-xs font-semibold uppercase tracking-[0.14em] sm:text-[11px] ' +
                  (isActive
                    ? 'text-white'
                    : isDone
                      ? 'text-accent-blue/80'
                      : 'text-slate-500')
                }
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={
                  'h-px flex-1 ' +
                  (i < currentIdx ? 'bg-accent-blue/60' : 'bg-white/10')
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepContactCenter({ value, onChange }) {
  return (
    <FormCard
      title="Your Contact Center"
      subtitle="A handful of operating metrics to baseline the model."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Company name" required>
          <input
            type="text"
            value={value.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="Acme Corp"
            className={inputClass}
          />
        </Field>
        <Field label="Industry">
          <select
            value={value.industry}
            onChange={(e) => onChange({ industry: e.target.value })}
            className={inputClass}
          >
            <option value="">Select an industry…</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Number of agents" required>
          <NumberInput
            value={value.agents}
            onChange={(v) => onChange({ agents: v })}
            placeholder="e.g. 250"
          />
        </Field>
        <Field label="Monthly call volume" required>
          <NumberInput
            value={value.monthlyCalls}
            onChange={(v) => onChange({ monthlyCalls: v })}
            placeholder="e.g. 100000"
          />
        </Field>
        <Field label="Average handle time (min)">
          <NumberInput
            value={value.aht}
            onChange={(v) => onChange({ aht: v })}
            placeholder="6"
          />
        </Field>
        <Field label="Average call abandonment %">
          <NumberInput
            value={value.abandonRate}
            onChange={(v) => onChange({ abandonRate: v })}
            placeholder="8"
            suffix="%"
          />
        </Field>
        <Field
          label="Fully burdened annual agent cost"
          className="sm:col-span-2"
        >
          <NumberInput
            value={value.agentCost}
            onChange={(v) => onChange({ agentCost: v })}
            placeholder="65000"
            prefix="$"
          />
        </Field>
      </div>
    </FormCard>
  );
}

function StepGoals({ selected, onToggle }) {
  return (
    <FormCard
      title="Your Goals"
      subtitle="Pick every outcome you care about — projections combine across selections."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GOALS.map((goal) => {
          const active = selected.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onToggle(goal.id)}
              className={
                'group flex h-full items-start gap-3 rounded-xl border p-4 text-left transition ' +
                (active
                  ? 'border-accent-blue/50 bg-accent-blue/10 shadow-glow'
                  : 'border-white/10 bg-ink-900/40 hover:border-white/20 hover:bg-ink-900/70')
              }
            >
              <span
                className={
                  'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border transition ' +
                  (active
                    ? 'border-accent-blue bg-accent-blue text-white'
                    : 'border-white/20 bg-transparent text-transparent group-hover:border-white/40')
                }
              >
                <Check small />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">
                  {goal.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-400">
                  {goal.subtitle}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </FormCard>
  );
}

function StepTech({ value, onChange }) {
  return (
    <FormCard
      title="Current Tech"
      subtitle="Helps us frame the displacement story in your proposal."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current STT provider">
          <select
            value={value.stt}
            onChange={(e) => onChange({ stt: e.target.value })}
            className={inputClass}
          >
            <option value="">Select…</option>
            {STT_PROVIDERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Current TTS provider">
          <select
            value={value.tts}
            onChange={(e) => onChange({ tts: e.target.value })}
            className={inputClass}
          >
            <option value="">Select…</option>
            {TTS_PROVIDERS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Current contact center platform"
          className="sm:col-span-2"
        >
          <select
            value={value.ccaas}
            onChange={(e) => onChange({ ccaas: e.target.value })}
            className={inputClass}
          >
            <option value="">Select…</option>
            {CCAAS_PLATFORMS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Are you currently using a Voice Agent / IVR?"
          className="sm:col-span-2"
        >
          <div className="inline-flex rounded-lg border border-white/10 bg-ink-900/40 p-1">
            {[
              { id: true, label: 'Yes' },
              { id: false, label: 'No' },
            ].map((opt) => {
              const active = value.hasVoiceAgent === opt.id;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onChange({ hasVoiceAgent: opt.id })}
                  className={
                    'rounded-md px-4 py-1.5 text-sm font-semibold transition ' +
                    (active
                      ? 'bg-accent-blue text-white shadow-glow'
                      : 'text-slate-300 hover:text-white')
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Field>
      </div>
    </FormCard>
  );
}

function Results({ contactCenter, goals, tech, onRecalculate }) {
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const inputs = {
    agents: Number(contactCenter.agents) || 0,
    monthlyCalls: Number(contactCenter.monthlyCalls) || 0,
    aht: Number(contactCenter.aht) || 0,
    agentCost: Number(contactCenter.agentCost) || 0,
  };

  const rows = goals
    .map((id) => GOALS.find((g) => g.id === id))
    .filter(Boolean)
    .map((goal) => ({
      goal,
      annualValue: Math.max(0, goal.compute(inputs)),
    }));

  const totalAnnualValue = rows.reduce((sum, r) => sum + r.annualValue, 0);
  const callsPerYear = inputs.monthlyCalls * 12;
  const annualHours = (callsPerYear * inputs.aht) / 60;
  const annualDeepgramCost =
    (0.29 * inputs.monthlyCalls * inputs.aht * 12) / 60;
  const paybackMonths =
    totalAnnualValue > 0
      ? (annualDeepgramCost / totalAnnualValue) * 12
      : null;

  const sections = recommendedSections(goals);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-ink-800/60 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
          Projected outcome
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {contactCenter.companyName || 'Customer'} — Deepgram ROI
        </h2>
        {contactCenter.industry && (
          <p className="mt-1 text-sm text-slate-400">
            {contactCenter.industry} · {inputs.agents.toLocaleString()} agents ·{' '}
            {inputs.monthlyCalls.toLocaleString()} calls/month
          </p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Annual Value"
            value={formatCurrency(totalAnnualValue)}
            sublabel="Combined across selected outcomes"
          />
          <MetricCard
            label="Est. Payback Period"
            value={
              paybackMonths === null
                ? '—'
                : paybackMonths < 1
                  ? '< 1 mo'
                  : `${paybackMonths.toFixed(1)} mo`
            }
            sublabel={`Deepgram annual run-rate ${formatCurrency(annualDeepgramCost)}`}
          />
          <MetricCard
            label="Calls Per Year"
            value={callsPerYear.toLocaleString()}
            sublabel="Volume modeled across the model"
          />
          <MetricCard
            label="Annual Hours of Audio"
            value={`${Math.round(annualHours).toLocaleString()} hrs`}
            sublabel={`At ${inputs.aht || 0} min average handle time`}
          />
        </div>
      </div>

      <div className="card-surface">
        <div className="relative p-6 sm:p-8">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight text-white">
              ROI Breakdown
            </h3>
            <span className="text-xs text-slate-500">
              {rows.length} outcome{rows.length === 1 ? '' : 's'} selected
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              No outcomes selected. Go back to Step 2 to pick what to model.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[720px] text-left text-xs sm:text-sm">
                <thead className="bg-ink-900/80 text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Outcome</th>
                    <th className="px-4 py-3 font-medium">
                      How Deepgram helps
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <span className="text-accent-blue/80">
                        Industry benchmark
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Annual value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-ink-900/40">
                  {rows.map(({ goal, annualValue }) => (
                    <tr key={goal.id}>
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-white">
                          {goal.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {goal.subtitle}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top text-slate-300">
                        {goal.deepgramHelp}
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-slate-400">
                        {goal.benchmarkLabel}
                      </td>
                      <td className="px-4 py-4 text-right align-top">
                        <span className="font-semibold text-emerald-300 tabular-nums">
                          {formatCurrency(annualValue)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-ink-900/60">
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"
                    >
                      Total annual value
                    </td>
                    <td className="px-4 py-3 text-right text-base font-semibold tabular-nums">
                      <span className="gradient-text">
                        {formatCurrency(totalAnnualValue)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(sections.realtime.length > 0 || sections.batch.length > 0) && (
        <div className="card-surface">
          <div className="relative p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
                  Auto-recommended
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">
                  Your Deepgram Solution
                </h3>
              </div>
              {tech.hasVoiceAgent && (
                <span className="rounded-full border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-violet">
                  Existing Voice Agent
                </span>
              )}
            </div>

            <div className="mt-6 space-y-6">
              {sections.realtime.length > 0 && (
                <ProductSection
                  label="Real-Time Processing"
                  description="Powers agent assist, live coaching, and AI voice agents."
                  products={sections.realtime}
                />
              )}
              {sections.batch.length > 0 && (
                <ProductSection
                  label="Post-Call Processing"
                  description="Powers QA, summaries, redaction, and conversation analytics."
                  products={sections.batch}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-accent-blue/15 via-accent-indigo/10 to-accent-violet/15 p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-base font-semibold text-white">
            Take this with you
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Generate a Deepgram-branded research report you can share internally.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRecalculate}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/10"
          >
            <RecalcIcon /> Recalculate
          </button>
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200"
          >
            Download Report <ArrowRight />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        * Projections based on industry benchmarks. Actual results may vary.
      </p>

      {showDownloadModal && (
        <DownloadReportModal
          company={contactCenter.companyName}
          industry={contactCenter.industry}
          onClose={() => setShowDownloadModal(false)}
          onGenerate={async (recipient) => {
            const landscapeProse = await fetchIndustryLandscape(
              contactCenter.industry
            );
            generateRoiReport({
              recipient,
              company: contactCenter.companyName,
              industry: contactCenter.industry,
              inputs,
              metrics: {
                totalAnnualValue,
                paybackMonths,
                callsPerYear,
                annualHours,
                annualDeepgramCost,
              },
              rows,
              sections,
              tech,
              landscapeProse,
            });
          }}
        />
      )}
    </div>
  );
}

async function fetchIndustryLandscape(industry) {
  const res = await fetch('/api/anthropic', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: LANDSCAPE_PROMPT_SYSTEM,
      messages: [
        { role: 'user', content: buildLandscapePrompt(industry) },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Claude API error (${res.status}): ${body.slice(0, 200)}`
    );
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text || '';
  if (!text) {
    throw new Error('Claude returned an empty response.');
  }
  return text.trim();
}

function DownloadReportModal({ company, industry, onClose, onGenerate }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | generating | error
  const [error, setError] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && phase !== 'generating') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, phase]);

  const canSubmit =
    phase !== 'generating' &&
    name.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPhase('generating');
    try {
      await onGenerate({ name: name.trim(), email: email.trim() });
      onClose();
    } catch (err) {
      setError(err?.message || 'Could not generate the report.');
      setPhase('error');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-report-title"
      onClick={onClose}
    >
      <div
        className="card-surface w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="relative p-6 sm:p-7">
          {phase !== 'generating' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <CloseGlyph />
            </button>
          )}

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
            Research report
          </p>
          <h3
            id="download-report-title"
            className="mt-1 text-xl font-semibold tracking-tight text-white"
          >
            Download Your ROI Research Report
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            We&apos;ll personalize the report
            {company ? ` for ${company}` : ''}
            {industry ? ` with a ${industry}-specific industry briefing` : ''}.
          </p>

          {phase === 'generating' ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-ink-900/60 p-6 text-center">
              <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent-blue" />
              <p className="text-sm font-semibold text-white">
                Generating your research report…
              </p>
              <p className="text-xs text-slate-400">
                Drafting the {industry || 'industry'} landscape briefing and
                building your custom PDF. This usually takes 5–10 seconds.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
                    First &amp; last name
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    autoFocus
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
                    Work email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className={inputClass}
                  />
                </label>
              </div>

              {phase === 'error' && error && (
                <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-100">
                  <p className="font-semibold text-red-200">
                    Report generation failed
                  </p>
                  <p className="mt-1 text-red-100/80">{error}</p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-ink-950/60"
                >
                  {phase === 'error' ? 'Try Again' : 'Generate Report'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.7 4.7a1 1 0 0 1 1.4 0L10 8.6l3.9-3.9a1 1 0 1 1 1.4 1.4L11.4 10l3.9 3.9a1 1 0 0 1-1.4 1.4L10 11.4l-3.9 3.9a1 1 0 1 1-1.4-1.4L8.6 10 4.7 6.1a1 1 0 0 1 0-1.4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MetricCard({ label, value, sublabel }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-ink-900/50 p-5">
      <div className="absolute inset-0 -z-10 bg-card-sheen opacity-60" aria-hidden="true" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        <span className="gradient-text">{value}</span>
      </p>
      {sublabel && (
        <p className="mt-2 text-xs text-slate-500">{sublabel}</p>
      )}
    </div>
  );
}

function ProductSection({ label, description, products }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
          {label}
        </h4>
        <span className="text-xs text-slate-500">{description}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {products.map((p) => (
          <span
            key={p.id}
            className="inline-flex max-w-full items-start gap-2 rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-xs"
          >
            <span className="flex-none rounded-md bg-accent-blue/15 px-2 py-0.5 font-semibold text-accent-blue">
              {p.name}
            </span>
            <span className="text-slate-300">{p.description}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function recommendedSections(goalIds) {
  const sections = { realtime: [], batch: [] };
  const seen = { realtime: new Set(), batch: new Set() };
  goalIds.forEach((id) => {
    const goal = GOALS.find((g) => g.id === id);
    if (!goal) return;
    goal.products.forEach((pid) => {
      const product = PRODUCT_CATALOG[pid];
      if (!product) return;
      if (!seen[product.section].has(pid)) {
        seen[product.section].add(pid);
        sections[product.section].push({ id: pid, ...product });
      }
    });
  });
  return sections;
}

function StepNav({ step, canAdvance, onBack, onNext }) {
  const isFirst = step === 1;
  return (
    <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onBack}
        disabled={isFirst}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ArrowLeft /> Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvance}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-ink-950/60"
      >
        {step === 3 ? 'See Results' : 'Next'}
        <ArrowRight />
      </button>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-accent-blue/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/30';

function FormCard({ title, subtitle, children }) {
  return (
    <div className="card-surface">
      <div className="relative p-6 sm:p-8">
        <h2 className="text-base font-semibold tracking-tight text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
        {required && <span className="ml-1 text-accent-blue">*</span>}
      </span>
      {children}
    </label>
  );
}

function NumberInput({ value, onChange, placeholder, prefix, suffix }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          {prefix}
        </span>
      )}
      <input
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          inputClass + (prefix ? ' pl-7' : '') + (suffix ? ' pr-7' : '')
        }
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          {suffix}
        </span>
      )}
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function Check({ small = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Sparkle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M12 2l1.6 5.5L19 9l-5.4 1.5L12 16l-1.6-5.5L5 9l5.4-1.5L12 2zm6 12l.9 2.6L21 17l-2.1.4L18 20l-.9-2.6L15 17l2.1-.4L18 14z" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function RecalcIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15A9 9 0 0 1 5.64 18.36L1 14" />
    </svg>
  );
}
