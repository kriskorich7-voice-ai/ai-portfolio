import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'voice-ai', label: 'Voice AI' },
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'personal', label: 'Personal' },
];

const posts = [];

export default function Insights() {
  const [activeFilter, setActiveFilter] = useState('all');

  const visiblePosts =
    activeFilter === 'all'
      ? posts
      : posts.filter((p) => p.category === activeFilter);

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
        {filters.map((f) => {
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
          First post coming soon
        </h3>
        <p className="max-w-sm text-sm text-slate-400">
          I&apos;m drafting the first set of essays now. Check back shortly — or
          follow along on LinkedIn.
        </p>
      </div>
    </div>
  );
}

function PostCard({ post }) {
  return (
    <article className="card-surface">
      <div className="relative flex h-full flex-col gap-4 p-6">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-medium tracking-wide text-slate-300">
            {post.categoryLabel}
          </span>
          <time dateTime={post.date}>{post.dateLabel}</time>
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-white">
          {post.title}
        </h3>
        <p className="text-sm leading-relaxed text-slate-300">{post.excerpt}</p>
        <a
          href={post.href}
          className="mt-auto inline-flex items-center gap-1 pt-1 text-sm font-medium text-accent-blue hover:text-white"
        >
          Read more
          <Arrow />
        </a>
      </div>
    </article>
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
