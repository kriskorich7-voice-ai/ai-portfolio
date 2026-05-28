import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { dealStories, formatDealStoryDate } from '../data/dealStories.js';

export default function DealStories() {
  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Case Studies"
        title="Deal Stories"
        description="Anonymized case studies from real partnership and sales deals."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {dealStories.map((story) => (
          <DealStoryCard key={story.slug} story={story} />
        ))}
      </div>
    </section>
  );
}

function DealStoryCard({ story }) {
  return (
    <Link
      to={`/deal-stories/${story.slug}`}
      className="card-surface group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60"
    >
      <article className="relative flex h-full flex-col gap-5 p-6">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-0.5 font-medium tracking-wide text-accent-blue">
            {story.category}
          </span>
          <time dateTime={story.date}>{formatDealStoryDate(story.date)}</time>
        </div>

        <h3 className="text-lg font-semibold tracking-tight text-white">
          {story.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone="emerald">{story.dealSize}</Badge>
          <Badge tone="violet">{story.motion}</Badge>
          <Badge tone="slate">{story.industry}</Badge>
        </div>

        <p className="text-sm leading-relaxed text-slate-300">
          {story.excerpt}
        </p>

        <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-accent-blue transition group-hover:gap-2 group-hover:text-white">
          Read story
          <Arrow />
        </span>
      </article>
    </Link>
  );
}

function Badge({ children, tone = 'slate' }) {
  const toneClass =
    tone === 'emerald'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
      : tone === 'violet'
        ? 'border-accent-violet/30 bg-accent-violet/10 text-accent-violet'
        : 'border-white/10 bg-white/5 text-slate-300';
  return (
    <span
      className={
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ' +
        toneClass
      }
    >
      {children}
    </span>
  );
}

function Arrow() {
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
        d="M5.22 14.78a.75.75 0 0 1 0-1.06L12.94 6H7.5a.75.75 0 0 1 0-1.5h7.25c.41 0 .75.34.75.75V12.5a.75.75 0 0 1-1.5 0V7.06l-7.72 7.72a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
