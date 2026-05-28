import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import NotFound from './NotFound.jsx';
import {
  findDealStory,
  formatDealStoryDate,
} from '../data/dealStories.js';

export default function DealStoryPost() {
  const { slug } = useParams();
  const story = findDealStory(slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [slug]);

  if (!story) return <NotFound />;

  const stats = [
    { label: 'Deal Size', value: story.dealSize },
    { label: 'Contract Length', value: story.contractLength },
    { label: 'Industry', value: story.industry },
    { label: 'Motion', value: story.motion },
    { label: 'Outcome', value: story.outcome },
  ];

  return (
    <section className="container-page py-16 sm:py-20">
      <Link
        to="/deal-stories"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
      >
        <BackArrow /> All deal stories
      </Link>

      <article className="mx-auto mt-8 max-w-3xl">
        <header className="border-b border-white/5 pb-8">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-0.5 font-medium tracking-wide text-accent-blue">
              {story.category}
            </span>
            <time dateTime={story.date}>{formatDealStoryDate(story.date)}</time>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {story.title}
          </h1>
          {story.excerpt && (
            <p className="mt-4 text-lg leading-relaxed text-slate-300">
              {story.excerpt}
            </p>
          )}
        </header>

        <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-accent-blue/15 via-accent-indigo/10 to-accent-violet/15 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
            At a Glance
          </p>
          <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {s.label}
                </p>
                <p className="mt-1.5 text-sm font-semibold leading-snug">
                  <span className="gradient-text">{s.value}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 py-10 text-base leading-relaxed text-slate-300">
          {renderBlocks(story.content)}
        </div>

        <footer className="mt-6 flex flex-col gap-4 border-t border-white/5 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs italic text-slate-500">
            Details anonymized to protect customer and partner confidentiality.
          </p>
          <Link
            to="/deal-stories"
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 sm:self-auto"
          >
            <BackArrow /> Back to all deal stories
          </Link>
        </footer>
      </article>
    </section>
  );
}

function renderBlocks(content) {
  const blocks = content.trim().split(/\n{2,}/);
  return blocks.map((raw, i) => {
    const block = raw.trim();
    if (!block) return null;
    if (block.startsWith('## ')) {
      return (
        <h2
          key={i}
          className="pt-4 text-2xl font-semibold tracking-tight text-white sm:text-[26px]"
        >
          {block.slice(3).trim()}
        </h2>
      );
    }
    if (block.startsWith('# ')) {
      return (
        <h1
          key={i}
          className="pt-4 text-3xl font-semibold tracking-tight text-white"
        >
          {block.slice(2).trim()}
        </h1>
      );
    }
    return (
      <p key={i} className="text-slate-300">
        {block}
      </p>
    );
  });
}

function BackArrow() {
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
        d="M14.78 5.22a.75.75 0 0 1 0 1.06L7.06 14h5.44a.75.75 0 0 1 0 1.5H5.25a.75.75 0 0 1-.75-.75V7.5a.75.75 0 0 1 1.5 0v5.44l7.72-7.72a.75.75 0 0 1 1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
