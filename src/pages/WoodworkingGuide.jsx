import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are an expert woodworker and carpenter with 20 years of experience. Generate a complete, detailed woodworking guide based on the project details provided.

Return your response as JSON with this exact structure:
{
  'projectTitle': 'string',
  'projectDescription': 'string (2-3 sentences about the finished project)',
  'estimatedTime': 'string (e.g. 4-6 hours)',
  'estimatedCost': 'string (e.g. $150-$200)',
  'difficultyRating': 'number 1-5',
  'heroImagePrompt': 'string (detailed DALL-E prompt for the finished project, photorealistic, professional photography style, well-lit workshop or home setting)',
  'toolList': [{ 'tool': 'string', 'purpose': 'string' }],
  'materialsList': [{ 'material': 'string', 'quantity': 'string', 'notes': 'string' }],
  'cutList': [{ 'piece': 'string', 'quantity': 'number', 'length': 'string', 'width': 'string', 'thickness': 'string', 'notes': 'string' }],
  'steps': [
    {
      'stepNumber': 'number',
      'title': 'string',
      'description': 'string (detailed 2-4 sentence instruction)',
      'proTip': 'string (optional expert tip)',
      'imagePrompt': 'string (detailed DALL-E prompt for this specific step, photorealistic, showing hands or tools performing the action)'
    }
  ]
}

Tailor the guide to the skill level, available tools, wood species, and exact dimensions provided. The cut list must use the actual dimensions provided. Steps should be 6-10 steps. Return only valid JSON, no markdown.`;

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const WOOD_SPECIES = [
  'Pine',
  'Oak',
  'Walnut',
  'Maple',
  'Cedar',
  'Plywood',
  'No Preference',
];

const AVAILABLE_TOOLS = [
  'Circular Saw',
  'Miter Saw',
  'Table Saw',
  'Drill/Driver',
  'Orbital Sander',
  'Router',
  'Hand Tools Only',
  'Pocket Hole Jig',
];

const ANALYZING_MESSAGES = [
  'Analyzing your project…',
  'Building your materials list…',
  'Writing step-by-step instructions…',
];

export default function WoodworkingGuide() {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [woodSpecies, setWoodSpecies] = useState('No Preference');
  const [selectedTools, setSelectedTools] = useState([]);
  const [specialNotes, setSpecialNotes] = useState('');

  // 'idle' | 'analyzing' | 'images' | 'done'
  const [phase, setPhase] = useState('idle');
  const [analyzeMsgIndex, setAnalyzeMsgIndex] = useState(0);
  const [imageProgress, setImageProgress] = useState({ done: 0, total: 0 });
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState(null);

  const isBusy = phase === 'analyzing' || phase === 'images';
  const canGenerate =
    projectName.trim().length > 0 && description.trim().length > 0 && !isBusy;

  // Rotate the loading messages while Claude is thinking.
  useEffect(() => {
    if (phase !== 'analyzing') return;
    setAnalyzeMsgIndex(0);
    const id = setInterval(() => {
      setAnalyzeMsgIndex((i) =>
        i < ANALYZING_MESSAGES.length - 1 ? i + 1 : i
      );
    }, 2500);
    return () => clearInterval(id);
  }, [phase]);

  const toggleTool = (tool) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  function buildUserMessage() {
    const dims = [
      width.trim() ? `Width: ${width.trim()} inches` : null,
      height.trim() ? `Height: ${height.trim()} inches` : null,
      depth.trim() ? `Depth/Thickness: ${depth.trim()} inches` : null,
    ]
      .filter(Boolean)
      .join(', ');

    return [
      `Project Name: ${projectName.trim()}`,
      `Project Description: ${description.trim()}`,
      `Dimensions: ${dims || 'Not specified — use sensible defaults'}`,
      `Skill Level: ${skillLevel}`,
      `Wood Species: ${woodSpecies}`,
      `Available Tools: ${
        selectedTools.length ? selectedTools.join(', ') : 'Not specified'
      }`,
      specialNotes.trim() ? `Special Notes: ${specialNotes.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  async function handleGenerate(e) {
    e?.preventDefault();
    if (!canGenerate) return;
    setError(null);
    setGuide(null);
    setPhase('analyzing');

    let parsed;
    try {
      const res = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: buildUserMessage() }],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Guide generation failed (${res.status}): ${text.slice(0, 200)}`
        );
      }
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      parsed = extractJson(text);
      if (!parsed || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        throw new Error('The guide could not be parsed. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Unknown error generating your guide.');
      setPhase('idle');
      return;
    }

    // Phase 2 — generate images in parallel, tolerating individual failures.
    const total = parsed.steps.length + 1;
    setImageProgress({ done: 0, total });
    setPhase('images');

    const bump = () =>
      setImageProgress((p) => ({ ...p, done: p.done + 1 }));

    const safeHeroPrompt = `Professional interior design photography of a beautifully finished ${parsed.projectTitle}. Installed in a modern home, natural lighting, photorealistic, high quality, no people.`;

    const [heroImage, ...stepImages] = await Promise.all([
      generateImage(safeHeroPrompt, '1536x1024', bump),
      ...parsed.steps.map((step) => {
        const safeImagePrompt = `Professional woodworking photography: ${step.imagePrompt}. Clean workshop setting, good lighting, no people, showing the wood pieces and tools arranged to illustrate this step. Photorealistic, high quality.`;
        return generateImage(safeImagePrompt, '1024x1024', bump);
      }),
    ]);

    setGuide({
      ...parsed,
      heroImage,
      steps: parsed.steps.map((step, i) => ({
        ...step,
        image: stepImages[i] || null,
      })),
      meta: { skillLevel, woodSpecies },
    });
    setPhase('done');
  }

  function handleReset() {
    setGuide(null);
    setError(null);
    setPhase('idle');
  }

  return (
    <section className="container-page py-16 sm:py-20">
      <div className="no-print">
        <PageHeader
          eyebrow="Personal Tool"
          title="Woodworking Guide Generator"
          description="Describe your project, add your measurements, get a complete custom build guide with AI-generated images."
        />
      </div>

      {phase !== 'done' && (
        <form onSubmit={handleGenerate} className="no-print space-y-5">
          <div className="card-surface">
            <div className="relative space-y-5 p-6">
              <Field label="Project Name" required>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Sliding Barn Door, Floating Shelves, Workbench…"
                  className={inputClass}
                />
              </Field>

              <Field label="Project Description" required>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you want to build and where it will go in your home…"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <Field label="Dimensions">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <DimensionInput
                    label="Width (in)"
                    value={width}
                    onChange={setWidth}
                    placeholder="e.g. 36"
                  />
                  <DimensionInput
                    label="Height (in)"
                    value={height}
                    onChange={setHeight}
                    placeholder="e.g. 84"
                  />
                  <DimensionInput
                    label="Depth / Thickness (in)"
                    value={depth}
                    onChange={setDepth}
                    placeholder="optional"
                  />
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Skill Level">
                  <SegmentedControl
                    options={SKILL_LEVELS}
                    value={skillLevel}
                    onChange={setSkillLevel}
                  />
                </Field>

                <Field label="Wood Species">
                  <select
                    value={woodSpecies}
                    onChange={(e) => setWoodSpecies(e.target.value)}
                    className={inputClass}
                  >
                    {WOOD_SPECIES.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Available Tools">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <ToolCheckbox
                      key={tool}
                      label={tool}
                      checked={selectedTools.includes(tool)}
                      onChange={() => toggleTool(tool)}
                    />
                  ))}
                </div>
              </Field>

              <Field label="Special Notes">
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  placeholder="Any special requirements, style preferences, or constraints…"
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </Field>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!canGenerate}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-base font-semibold text-ink-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40 disabled:text-ink-950/60 sm:w-auto"
            >
              {isBusy ? (
                <>
                  <Spinner /> Generating…
                </>
              ) : (
                <>
                  <HammerIcon /> Generate Guide
                </>
              )}
            </button>
            {!projectName.trim() || !description.trim() ? (
              <p className="text-xs text-slate-500">
                Add a project name and description to generate your guide.
              </p>
            ) : null}
          </div>
        </form>
      )}

      {error && (
        <div className="no-print mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {isBusy && (
        <LoadingPanel
          phase={phase}
          message={ANALYZING_MESSAGES[analyzeMsgIndex]}
          imageProgress={imageProgress}
        />
      )}

      {phase === 'done' && guide && (
        <GuideOutput guide={guide} onReset={handleReset} />
      )}
    </section>
  );
}

async function generateImage(prompt, size, onDone) {
  if (!prompt) {
    onDone();
    return null;
  }
  try {
    const res = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-image-2',
        prompt,
        n: 1,
        size,
        quality: 'medium',
      }),
    });
    if (!res.ok) {
      onDone();
      return null;
    }
    const data = await res.json();
    const url = data?.data?.[0]?.url || null;
    onDone();
    return url;
  } catch {
    onDone();
    return null;
  }
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* ---------- Loading ---------- */

function LoadingPanel({ phase, message, imageProgress }) {
  const isImages = phase === 'images';
  const pct = isImages
    ? imageProgress.total
      ? Math.round((imageProgress.done / imageProgress.total) * 100)
      : 0
    : 60;
  const label = isImages
    ? `Generating images (${imageProgress.done} of ${imageProgress.total} complete)…`
    : message;

  return (
    <div className="card-surface mt-8">
      <div className="relative flex flex-col items-center gap-5 p-10 text-center">
        <Spinner large />
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-white">{label}</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full bg-emerald-500 transition-all duration-500 ${
                isImages ? '' : 'animate-pulse'
              }`}
              style={{ width: `${Math.max(pct, 8)}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            {isImages
              ? 'Rendering photorealistic build images — this can take a minute.'
              : 'Designing your build plan, cut list, and instructions.'}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Guide output ---------- */

function GuideOutput({ guide, onReset }) {
  const difficulty = clampRating(guide.difficultyRating);

  return (
    <div className="print-guide mt-10 space-y-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
        >
          <ArrowLeft /> Build something else
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
        >
          <PrinterIcon /> Save as PDF
        </button>
      </div>

      {/* Hero */}
      <div className="card-surface overflow-hidden">
        <div className="relative">
          {guide.heroImage ? (
            <div className="relative aspect-[16/9] w-full">
              <img
                src={guide.heroImage}
                alt={guide.projectTitle}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {guide.projectTitle}
                </h2>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <ImagePlaceholder label="Hero image unavailable" />
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {guide.projectTitle}
              </h2>
            </div>
          )}
        </div>

        <div className="relative border-t border-white/5 p-5">
          {guide.projectDescription && (
            <p className="mb-4 text-sm leading-relaxed text-slate-300">
              {guide.projectDescription}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Estimated Time" value={guide.estimatedTime || '—'} />
            <Stat label="Estimated Cost" value={guide.estimatedCost || '—'} />
            <Stat label="Difficulty" value={<Stars rating={difficulty} />} />
            <Stat label="Skill Level" value={guide.meta?.skillLevel || '—'} />
          </div>
        </div>
      </div>

      {/* Tools & Materials */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Tool List" icon={<WrenchIcon />}>
          <ul className="divide-y divide-white/5">
            {(guide.toolList || []).map((t, i) => (
              <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-white/10 bg-white/5 text-emerald-300">
                  <WrenchIcon small />
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{t.tool}</p>
                  {t.purpose && (
                    <p className="text-xs text-slate-400">{t.purpose}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Materials List" icon={<BoardIcon />}>
          <ul className="divide-y divide-white/5">
            {(guide.materialsList || []).map((m, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-white">
                    {m.material}
                  </p>
                  {m.quantity && (
                    <span className="flex-none rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                      {m.quantity}
                    </span>
                  )}
                </div>
                {m.notes && (
                  <p className="mt-0.5 text-xs text-slate-400">{m.notes}</p>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* Cut list */}
      {Array.isArray(guide.cutList) && guide.cutList.length > 0 && (
        <Panel title="Cut List" icon={<RulerIcon />}>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-ink-900/80 text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Piece</th>
                  <th className="px-3 py-2 text-center font-medium">Qty</th>
                  <th className="px-3 py-2 font-medium">Length</th>
                  <th className="px-3 py-2 font-medium">Width</th>
                  <th className="px-3 py-2 font-medium">Thickness</th>
                  <th className="px-3 py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {guide.cutList.map((c, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? 'bg-ink-900/40' : 'bg-ink-900/20'}
                  >
                    <td className="px-3 py-2 font-medium text-white">
                      {c.piece}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">
                      {c.quantity}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{c.length}</td>
                    <td className="px-3 py-2 tabular-nums">{c.width}</td>
                    <td className="px-3 py-2 tabular-nums">{c.thickness}</td>
                    <td className="px-3 py-2 text-slate-400">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Steps */}
      <div className="space-y-5">
        <h3 className="text-lg font-semibold tracking-tight text-white">
          Step-by-Step Guide
        </h3>
        {guide.steps.map((step, i) => (
          <StepCard key={i} step={step} fallbackNumber={i + 1} />
        ))}
      </div>
    </div>
  );
}

function StepCard({ step, fallbackNumber }) {
  const number = step.stepNumber || fallbackNumber;
  return (
    <div className="card-surface break-inside-avoid">
      <div className="relative p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-ink-950">
            {number}
          </span>
          <h4 className="text-base font-semibold tracking-tight text-white">
            {step.title}
          </h4>
        </div>

        {step.image ? (
          <img
            src={step.image}
            alt={step.title}
            className="mb-4 w-full rounded-xl border border-white/10 object-cover"
          />
        ) : (
          <div className="mb-4">
            <ImagePlaceholder label="Image unavailable for this step" />
          </div>
        )}

        <p className="text-sm leading-relaxed text-slate-300">
          {step.description}
        </p>

        {step.proTip && (
          <div className="mt-4 flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
            <span className="mt-0.5 flex-none text-emerald-300">
              <BulbIcon />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                Pro Tip
              </p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-100/90">
                {step.proTip}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Small UI pieces ---------- */

const inputClass =
  'w-full rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-emerald-500/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30';

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
        {required && <span className="ml-1 text-emerald-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function DimensionInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <span className="mt-1 block text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-ink-900/60 p-1">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={
              'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
              (active
                ? 'bg-emerald-500 text-ink-950'
                : 'text-slate-300 hover:bg-white/5 hover:text-white')
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ToolCheckbox({ label, checked, onChange }) {
  return (
    <label
      className={
        'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ' +
        (checked
          ? 'border-emerald-500/40 bg-emerald-500/10 text-white'
          : 'border-white/10 bg-ink-900/40 text-slate-300 hover:border-white/20 hover:bg-ink-900/70')
      }
    >
      <span
        className={
          'flex h-4 w-4 flex-none items-center justify-center rounded border transition ' +
          (checked
            ? 'border-emerald-500 bg-emerald-500 text-ink-950'
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

function Panel({ title, icon, children }) {
  return (
    <div className="card-surface break-inside-avoid">
      <div className="relative p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-emerald-300">{icon}</span>
          <h3 className="text-base font-semibold tracking-tight text-white">
            {title}
          </h3>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/40 px-3 py-2.5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function Stars({ rating }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 ${
            n <= rating ? 'text-emerald-400' : 'text-white/15'
          }`}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.73.99-5.79L1.58 7.62l5.82-.85L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

function ImagePlaceholder({ label }) {
  return (
    <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-ink-900/40 text-slate-500">
      <ImageIcon />
      <p className="text-xs">{label}</p>
    </div>
  );
}

function clampRating(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, n));
}

/* ---------- Icons ---------- */

function Spinner({ large = false }) {
  return (
    <span
      className={
        'inline-block animate-spin rounded-full border-2 border-white/20 border-t-emerald-400 ' +
        (large ? 'h-8 w-8' : 'h-4 w-4')
      }
      aria-hidden="true"
    />
  );
}

function HammerIcon() {
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
      <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
      <path d="M17.64 15L22 10.64" />
      <path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h.86c.85 0 1.65.34 2.25.93l1.25 1.25" />
    </svg>
  );
}

function WrenchIcon({ small = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={small ? 'h-4 w-4' : 'h-5 w-5'}
      aria-hidden="true"
    >
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.1-.4-.4-2.1 2.1-2.1z" />
    </svg>
  );
}

function BoardIcon() {
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
      <rect x="3" y="6" width="18" height="12" rx="1" />
      <path d="M7 6v12M11 6v12M15 6v12" />
    </svg>
  );
}

function RulerIcon() {
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
      <path d="M3 8l5-5 13 13-5 5z" />
      <path d="M7 7l1.5 1.5M10 4l2 2M13 7l1.5 1.5M16 10l2 2" />
    </svg>
  );
}

function BulbIcon() {
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
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.5.5 1 1.2 1 2.5h6c0-1.3.5-2 1-2.5A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function PrinterIcon() {
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
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.24a.75.75 0 0 1 0-1.06l4.25-4.24a.75.75 0 0 1 1.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}
