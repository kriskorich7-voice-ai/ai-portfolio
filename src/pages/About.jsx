const LINKEDIN_URL = 'https://www.linkedin.com/in/kriskorich/';
const CONTACT_EMAIL = 'hello@kriskorich.com';

const whatIDo = [
  'Build and run partnerships at the intersection of AI infrastructure and go-to-market.',
  'Architect channel sales motions that scale from first design partners to repeatable revenue.',
  'Sit at the table where product, sales, and partner teams have to agree on a single story.',
];

const whatIBuild = [
  'Practical AI tools that compress sales workflows — proposals, research, post-call coaching.',
  'Voice AI demos and prototypes that show what real-time conversation can do for a business.',
  'Small personal projects, from rental property assistants to woodworking guides.',
];

export default function About() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent-blue via-accent-indigo to-accent-violet opacity-70 blur-md" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-3xl font-bold tracking-tight text-white shadow-glow sm:h-36 sm:w-36">
            KK
          </div>
        </div>

        <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Kris Korich
        </h1>
        <p className="mt-3 text-base font-medium sm:text-lg">
          <span className="gradient-text">
            Partnerships &amp; Channel Sales | Voice AI | Builder
          </span>
        </p>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">
          I&apos;ve spent my career on the edge of where new technology meets
          real revenue — building partner ecosystems, running channel sales
          motions, and lately, shipping AI tools that change how sales and
          partnership teams work. This site is a living portfolio of the
          things I&apos;m thinking about and building.
        </p>

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

      <div className="mt-20 grid grid-cols-1 gap-5 lg:grid-cols-2">
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
