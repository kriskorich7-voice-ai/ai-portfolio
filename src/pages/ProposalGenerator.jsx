import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import {
  INDUSTRIES,
  USE_CASES,
  PRICING,
  DEFAULT_SCENARIOS,
  buildProposal,
  formatCurrency,
  formatVolume,
  useCaseLabel,
} from '../lib/proposalPricing.js';
import { generateProposalPdf } from '../lib/proposalPdf.js';

const INITIAL_USAGE = {
  stt: { annualHours: '' },
  tts: { annualChars: '' },
  voiceAgent: { annualHours: '' },
};

const INITIAL_MODELS = {
  stt: 'nova-3-mono',
  tts: 'aura-2',
  voiceAgent: 'standard',
};

const INITIAL_DISCOUNTS = { stt: 0, tts: 0, voiceAgent: 0 };

export default function ProposalGenerator() {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [useCases, setUseCases] = useState([]);
  const [customUseCase, setCustomUseCase] = useState('');
  const [usageOpen, setUsageOpen] = useState(true);
  const [usage, setUsage] = useState(INITIAL_USAGE);
  const [models, setModels] = useState(INITIAL_MODELS);
  const [discounts, setDiscounts] = useState(INITIAL_DISCOUNTS);
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [proposal, setProposal] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const enabledScenarioCount = scenarios.filter((s) => s.enabled).length;
  const canGenerate =
    companyName.trim().length > 0 && enabledScenarioCount > 0;

  const handleToggleUseCase = (id) => {
    setUseCases((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const updateScenario = (id, patch) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const updateUsage = (product, field, value) => {
    setUsage((prev) => ({
      ...prev,
      [product]: { ...prev[product], [field]: value },
    }));
  };

  const handleGenerate = (e) => {
    e?.preventDefault();
    if (!canGenerate) return;
    setIsGenerating(true);
    setTimeout(() => {
      setProposal(
        buildProposal({
          companyName,
          industry,
          useCases,
          customUseCase,
          usage,
          models,
          discounts,
          scenarios,
        })
      );
      setIsGenerating(false);
    }, 500);
  };

  const handleDownloadPdf = () => {
    if (!proposal) return;
    generateProposalPdf(proposal);
  };

  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Tool"
        title="Customer Proposal Generator"
        description="Build a customer-facing Deepgram pricing proposal in minutes. Configure usage, set per-product discounts, project growth, and export to PDF."
      />

      <div className="space-y-6">
        <form onSubmit={handleGenerate} className="space-y-5">
          <FormCard title="Customer">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company name" required>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corp"
                  className={inputClass}
                />
              </Field>
              <Field label="Industry">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
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
            </div>

            <Field label="Key use cases" className="mt-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {USE_CASES.map((u) => (
                  <CheckboxRow
                    key={u.id}
                    checked={useCases.includes(u.id)}
                    onChange={() => handleToggleUseCase(u.id)}
                    label={u.label}
                  />
                ))}
              </div>
              {useCases.includes('other') && (
                <textarea
                  value={customUseCase}
                  onChange={(e) => setCustomUseCase(e.target.value)}
                  placeholder="Describe the custom use case…"
                  rows={3}
                  className={`${inputClass} mt-3 resize-none`}
                />
              )}
            </Field>
          </FormCard>

          <FormCard
            title="Usage Details"
            subtitle="All optional — leave blank to skip a product."
            collapsible
            open={usageOpen}
            onToggle={() => setUsageOpen((o) => !o)}
          >
            <UsageGroup label="Speech-to-Text">
              <Field label="Annual hours of audio">
                <NumberInput
                  value={usage.stt.annualHours}
                  onChange={(v) => updateUsage('stt', 'annualHours', v)}
                  placeholder="e.g. 50000"
                />
              </Field>
            </UsageGroup>

            <UsageGroup label="Text-to-Speech">
              <Field label="Annual number of characters">
                <NumberInput
                  value={usage.tts.annualChars}
                  onChange={(v) => updateUsage('tts', 'annualChars', v)}
                  placeholder="e.g. 25000000"
                />
              </Field>
            </UsageGroup>

            <UsageGroup label="Voice Agent">
              <Field label="Annual hours">
                <NumberInput
                  value={usage.voiceAgent.annualHours}
                  onChange={(v) =>
                    updateUsage('voiceAgent', 'annualHours', v)
                  }
                  placeholder="e.g. 12000"
                />
              </Field>
            </UsageGroup>
          </FormCard>

          <FormCard title="Models & Discounts">
            <ProductPricingRow
              productKey="stt"
              productLabel="Speech-to-Text"
              modelId={models.stt}
              onChangeModel={(v) => setModels((m) => ({ ...m, stt: v }))}
              discount={discounts.stt}
              onChangeDiscount={(v) =>
                setDiscounts((d) => ({ ...d, stt: v }))
              }
            />
            <ProductPricingRow
              productKey="tts"
              productLabel="Text-to-Speech"
              modelId={models.tts}
              onChangeModel={(v) => setModels((m) => ({ ...m, tts: v }))}
              discount={discounts.tts}
              onChangeDiscount={(v) =>
                setDiscounts((d) => ({ ...d, tts: v }))
              }
            />
            <ProductPricingRow
              productKey="voiceAgent"
              productLabel="Voice Agent"
              modelId={models.voiceAgent}
              onChangeModel={(v) =>
                setModels((m) => ({ ...m, voiceAgent: v }))
              }
              discount={discounts.voiceAgent}
              onChangeDiscount={(v) =>
                setDiscounts((d) => ({ ...d, voiceAgent: v }))
              }
            />
          </FormCard>

          <FormCard
            title="Growth Scenarios"
            subtitle="Enable up to three projections and set a custom month-over-month growth rate for each."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {scenarios.map((s) => (
                <ScenarioEditor
                  key={s.id}
                  scenario={s}
                  onChange={(patch) => updateScenario(s.id, patch)}
                />
              ))}
            </div>
          </FormCard>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!canGenerate || isGenerating}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-ink-950/60"
            >
              {isGenerating ? (
                <>
                  <Spinner /> Generating…
                </>
              ) : (
                'Generate Proposal'
              )}
            </button>
            {!canGenerate && (
              <p className="text-xs text-slate-500">
                Add a company name and enable at least one growth scenario to
                generate.
              </p>
            )}
          </div>
        </form>

        <ProposalPreview
          proposal={proposal}
          isGenerating={isGenerating}
          onDownloadPdf={handleDownloadPdf}
        />
      </div>
    </section>
  );
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-accent-blue/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/30';

function FormCard({
  title,
  subtitle,
  children,
  collapsible = false,
  open = true,
  onToggle,
}) {
  return (
    <div className="card-surface">
      <div className="relative p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          {collapsible && (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={open}
              className="rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              <Chevron open={open} />
            </button>
          )}
        </div>
        {(open || !collapsible) && <div className="mt-5">{children}</div>}
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

function NumberInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClass}
    />
  );
}

function CheckboxRow({ checked, onChange, label }) {
  return (
    <label
      className={
        'flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ' +
        (checked
          ? 'border-accent-blue/40 bg-accent-blue/10 text-white'
          : 'border-white/10 bg-ink-900/40 text-slate-300 hover:border-white/20 hover:bg-ink-900/70')
      }
    >
      <span
        className={
          'flex h-4 w-4 flex-none items-center justify-center rounded border transition ' +
          (checked
            ? 'border-accent-blue bg-accent-blue text-white'
            : 'border-white/20 bg-transparent')
        }
      >
        {checked && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3 w-3"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span>{label}</span>
    </label>
  );
}

function UsageGroup({ label, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-accent-blue/80">
        {label}
      </p>
      {children}
    </div>
  );
}

function ScenarioEditor({ scenario, onChange }) {
  const { label, percent, enabled } = scenario;
  return (
    <div
      className={
        'rounded-xl border p-4 transition ' +
        (enabled
          ? 'border-accent-blue/40 bg-accent-blue/5'
          : 'border-white/10 bg-ink-900/40')
      }
    >
      <label className="flex cursor-pointer items-center gap-2.5">
        <span
          className={
            'flex h-4 w-4 flex-none items-center justify-center rounded border transition ' +
            (enabled
              ? 'border-accent-blue bg-accent-blue text-white'
              : 'border-white/20 bg-transparent')
          }
        >
          {enabled && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3 w-3"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange({ enabled: e.target.checked })}
          className="sr-only"
        />
        <span className="text-sm font-semibold text-white">{label}</span>
      </label>
      <div className="mt-3">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
          Growth %/mo
        </span>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.1"
            value={percent}
            onChange={(e) => onChange({ percent: e.target.value })}
            disabled={!enabled}
            className={`${inputClass} pr-7 disabled:opacity-50`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            %
          </span>
        </div>
      </div>
    </div>
  );
}

function ProductPricingRow({
  productKey,
  productLabel,
  modelId,
  onChangeModel,
  discount,
  onChangeDiscount,
}) {
  const product = PRICING[productKey];
  const model = product.options.find((o) => o.id === modelId);
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-white/5 bg-ink-900/40 p-4 last:mb-0 sm:grid-cols-[1fr_1fr_130px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-blue/80">
          {productLabel}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          List rate: ${model.rate}
          {model.unit}
        </p>
      </div>
      <Field label="Model / tier">
        <select
          value={modelId}
          onChange={(e) => onChangeModel(e.target.value)}
          className={inputClass}
        >
          {product.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} (${o.rate}
              {o.unit})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Discount %">
        <div className="relative">
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={discount}
            onChange={(e) => onChangeDiscount(e.target.value)}
            className={`${inputClass} pr-7`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            %
          </span>
        </div>
      </Field>
    </div>
  );
}

function ProposalPreview({ proposal, isGenerating, onDownloadPdf }) {
  if (isGenerating) {
    return (
      <div className="card-surface">
        <div className="relative flex h-96 flex-col items-center justify-center gap-3 p-6 text-center">
          <Spinner large />
          <p className="text-sm text-slate-400">
            Crunching the numbers…
          </p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="card-surface">
        <div className="relative flex h-72 flex-col items-center justify-center gap-2 p-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-accent-blue">
            <DocumentIcon />
          </div>
          <h3 className="mt-2 text-base font-semibold text-white">
            Proposal preview
          </h3>
          <p className="max-w-xs text-sm text-slate-400">
            Fill in the form and click <span className="text-slate-200">Generate Proposal</span> to see a preview here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-surface">
      <div className="relative flex flex-col gap-6 p-6">
        <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
              Deepgram · Customer Proposal
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {proposal.company || 'Customer'}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {proposal.industry || 'Industry not set'} ·{' '}
              {proposal.useCases.length} use case
              {proposal.useCases.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadPdf}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
          >
            <DownloadIcon /> Generate PDF
          </button>
        </div>

        {proposal.useCases.length > 0 && (
          <div>
            <SectionLabel>Use cases</SectionLabel>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {proposal.useCases.map((id) => (
                <li
                  key={id}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-slate-300"
                >
                  {useCaseLabel(id, proposal.customUseCase)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {proposal.products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-ink-900/40 p-6 text-sm text-slate-400">
            Add usage volumes in the Usage Details section to see pricing.
          </div>
        ) : (
          proposal.products.map((product) => (
            <ProductTable key={product.key} product={product} />
          ))
        )}
      </div>
    </div>
  );
}

function ProductTable({ product }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-white">
          {product.label}{' '}
          <span className="font-normal text-slate-400">
            · {product.model.name}
          </span>
        </h4>
        <span className="text-xs text-slate-500">
          List ${product.model.rate}
          {product.model.unit}
        </span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-ink-900/80 text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium"></th>
              {product.lines.map((line) => (
                <th
                  key={line.scenario.id}
                  className="px-3 py-2 text-right font-medium text-slate-300 whitespace-nowrap"
                >
                  {line.scenario.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-ink-900/40 text-slate-300">
            <Row
              label="Annual volume"
              values={product.lines.map((l) =>
                formatVolume(l.annualVolume, product.volumeUnit)
              )}
            />
            <Row
              label="List rate cost"
              values={product.lines.map((l) => formatCurrency(l.listCost))}
            />
            <Row
              label="Discount"
              values={product.lines.map(() => `${product.discountPct}%`)}
            />
            <Row
              label="Discounted cost"
              values={product.lines.map((l) =>
                formatCurrency(l.discountedCost)
              )}
              highlight
            />
            <Row
              label="Savings vs list"
              values={product.lines.map((l) => formatCurrency(l.savings))}
              accent
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, values, highlight, accent }) {
  return (
    <tr>
      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={
            'px-3 py-2 text-right tabular-nums whitespace-nowrap ' +
            (accent
              ? 'font-semibold text-emerald-300'
              : highlight
                ? 'font-semibold text-white'
                : 'text-slate-200')
          }
        >
          {v}
        </td>
      ))}
    </tr>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
      {children}
    </p>
  );
}

function Chevron({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="14 3 14 9 20 9" />
    </svg>
  );
}

function DownloadIcon() {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Spinner({ large = false }) {
  return (
    <span
      className={
        'inline-block animate-spin rounded-full border-2 border-white/20 border-t-accent-blue ' +
        (large ? 'h-8 w-8' : 'h-3.5 w-3.5')
      }
      aria-hidden="true"
    />
  );
}
