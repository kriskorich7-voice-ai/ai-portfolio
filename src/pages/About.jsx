const LINKEDIN_URL = 'https://www.linkedin.com/in/kris-korich/';
const CONTACT_EMAIL = 'hello@kriskorich.com';

const bioParagraphs = [
  "I've spent 10 years at the intersection of sales and partnerships, working with companies like Deepgram, Talkdesk, and Vonage to build and scale revenue through direct and indirect channels. Today I lead partnerships and business development at Deepgram — working with Global Systems Integrators on sell-through GTM motions and with CCaaS and Conversational AI platforms on sell-to partnerships.",
  "I've spent the last 6+ years in the contact center space, closing multiple seven-figure deals and building partner programs from the ground up. What sets me apart is the ability to operate on both sides of the table — I understand how to sell directly and how to enable partners to sell for you.",
  "Outside of the day job, I build. I have no formal technical background, but AI has changed what's possible for someone like me. Ideas that used to live only in my head — tools, calculators, demos, automations — I can now actually ship. This portfolio is proof of that.",
];

const whatIDo = [
  "I build and manage strategic partnerships with GSIs, CCaaS platforms, and Conversational AI companies, running both sell-to and sell-through GTM motions measured against a sourced and influenced revenue quota.",
  "I've spent a decade closing complex, multi-stakeholder deals — from six-figure pilots to seven-figure multi-year commits — whether running the cycle directly or through a partner.",
];

const whatIBuild = [
  "AI-powered sales tools — proposal generators, ROI calculators, pricing models, and demo environments that make it easier to sell and enable partners to sell.",
  "Voice AI experiences — real-time voice agents, transcription demos, and TTS showcases built on Deepgram's APIs. If it involves voice, I want to build with it.",
];

const stats = [
  { value: '10', label: 'Years in Partnerships & Sales' },
  { value: '6+', label: 'Years in Contact Center' },
  { value: '7-Figure', label: 'Deals Closed' },
  { value: 'San Diego, CA', label: 'Based In' },
];

export default function About() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent-blue via-accent-indigo to-accent-violet opacity-70 blur-md" />
          <img
            src="/headshot.jpg"
            alt="Kris Korich"
            className="relative h-32 w-32 rounded-full object-cover border border-white/10 shadow-glow sm:h-36 sm:w-36"
          />
        </div>

        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Kris Korich
        </h1>
        <p className="mt-3 text-base font-medium sm:text-lg">
          <span className="gradient-text">
            Partnerships &amp; Business Development | Voice AI | Builder
          </span>
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-400">
          <LocationPin />
          San Diego, CA
        </p>

        <div className="mt-7 max-w-2xl space-y-4 text-left text-base leading-relaxed text-slate-300 sm:text-center">
          {bioParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200"
          >
            Connect on LinkedIn
          </a>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <div className="relative mt-16 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-accent-blue/15 via-accent-indigo/10 to-accent-violet/15 p-6 sm:p-8">
        <div className="absolute inset-0 -z-10 bg-card-sheen opacity-60" aria-hidden="true" />
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center sm:text-left">
              <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                <span className="gradient-text">{s.value}</span>
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-300">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Column
          eyebrow="Day to day"
          title="What I Do"
          items={whatIDo}
          tone="blue"
        />
        <Column
          eyebrow="Side of the desk"
          title="What I Build"
          items={whatIBuild}
          tone="violet"
        />
      </div>
    </section>
  );
}

function Column({ eyebrow, title, items, tone }) {
  const dotClass =
    tone === 'violet' ? 'bg-accent-violet' : 'bg-accent-blue';
  return (
    <div className="card-surface">
      <div className="relative flex flex-col gap-5 p-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {title}
          </h2>
        </div>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-300">
              <span
                className={`mt-2 h-1.5 w-1.5 flex-none rounded-full ${dotClass}`}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LocationPin() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 text-accent-blue"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
