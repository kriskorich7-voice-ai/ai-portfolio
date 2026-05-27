import PageHeader from '../components/PageHeader.jsx';

const stories = [];

export default function DealStories() {
  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Case Studies"
        title="Deal Stories"
        description="Anonymous case studies from the sales floor."
      />

      {stories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {stories.map((story) => (
            <DealStoryCard key={story.slug} story={story} />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="card-surface">
      <div className="relative flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-accent-blue">
          <BriefcaseIcon />
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
          First deal story coming soon
        </h3>
        <p className="max-w-sm text-sm text-slate-400">
          I&apos;m writing up anonymized case studies from real partnership and
          sales deals. The first will land here shortly.
        </p>
      </div>
    </div>
  );
}

export function DealStoryCard({ story }) {
  return (
    <article className="card-surface">
      <div className="relative flex flex-col gap-6 p-6">
        <div className="grid grid-cols-3 gap-4 border-b border-white/5 pb-5">
          <Stat label="Deal Size" value={story.dealSize} />
          <Stat label="Industry" value={story.industry} />
          <Stat label="Partnership Type" value={story.partnershipType} />
        </div>

        <Section heading="Challenge" body={story.challenge} />
        <Section heading="Approach" body={story.approach} />
        <Section heading="Outcome" body={story.outcome} />
      </div>
    </article>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Section({ heading, body }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
        {heading}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{body}</p>
    </div>
  );
}

function BriefcaseIcon() {
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
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}
