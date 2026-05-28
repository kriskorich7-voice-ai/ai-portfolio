import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import {
  insights,
  insightCategories,
  formatInsightDate,
} from '../data/insights.js';

export default function Insights() {
  const [activeFilter, setActiveFilter] = useState('all');

  const visiblePosts =
    activeFilter === 'all'
      ? insights
      : insights.filter((p) => p.category === activeFilter);

  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Writing"
        title="Insights"
        description="Thoughts on voice AI, partnerships, and building things."
      />

      <div
        role="tablist"
        aria-label="Insight categories"
        className="mb-10 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-ink-800/60 p-1 backdrop-blur-sm"
      >
        {insightCategories.map((f) => {
          const isActive = f.id === activeFilter;
          return (
            <button
              key={f.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveFilter(f.id)}
              className={
                'rounded-lg px-4 py-2 text-sm font-medium transition ' +
                (isActive
                  ? 'bg-gradient-to-r from-accent-blue/25 to-accent-violet/25 text-white shadow-glow ring-1 ring-white/10'
                  : 'text-slate-400 hover:text-white')
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {visiblePosts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePosts.map((post) => (
            <PostCard key={post.slug} post={post} />
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
          <PenIcon />
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
          Nothing here yet in this category
        </h3>
        <p className="max-w-sm text-sm text-slate-400">
          Try another filter — or check back soon for new writing.
        </p>
      </div>
    </div>
  );
}

function PostCard({ post }) {
  const cardClass =
    'card-surface group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60';

  const inner = (
    <article className="relative flex h-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-0.5 font-medium tracking-wide text-accent-blue">
            {post.category}
          </span>
          {post.external && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent-violet/30 bg-accent-violet/10 px-2.5 py-0.5 font-medium tracking-wide text-accent-violet">
              <ExternalIcon /> External Article
            </span>
          )}
        </div>
        <time dateTime={post.date}>{formatInsightDate(post.date)}</time>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-white group-hover:text-white">
        {post.title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-300">
        {post.excerpt}
      </p>
      <span className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-accent-blue transition group-hover:gap-2 group-hover:text-white">
        Read more
        {post.external ? <ExternalIcon /> : <Arrow />}
      </span>
    </article>
  );

  if (post.external) {
    return (
      <a
        href={post.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClass}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link to={`/insights/${post.slug}`} className={cardClass}>
      {inner}
    </Link>
  );
}

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M4.25 5.5A.75.75 0 0 1 5 4.75h4a.75.75 0 0 1 0 1.5H5.75v8.5h8.5V11a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-.75.75H5a.75.75 0 0 1-.75-.75v-9.5Zm6.5-.75a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V6.56l-4.97 4.97a.75.75 0 1 1-1.06-1.06l4.97-4.97H11.5a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PenIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
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
