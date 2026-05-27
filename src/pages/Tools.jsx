import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import ToolCard from '../components/ToolCard.jsx';
import { tools, toolCategories } from '../data/tools.js';

export default function Tools() {
  const [activeCategory, setActiveCategory] = useState(toolCategories[0].id);
  const visibleTools = tools.filter((t) => t.category === activeCategory);

  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Portfolio"
        title="A gallery of AI tools"
        description="Working prototypes and shipped products — from sales and partnership workflows to personal projects I'm tinkering on."
      />

      <div
        role="tablist"
        aria-label="Tool categories"
        className="mb-10 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-ink-800/60 p-1 backdrop-blur-sm"
      >
        {toolCategories.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat.id)}
              className={
                'rounded-lg px-4 py-2 text-sm font-medium transition ' +
                (isActive
                  ? 'bg-gradient-to-r from-accent-blue/25 to-accent-violet/25 text-white shadow-glow ring-1 ring-white/10'
                  : 'text-slate-400 hover:text-white')
              }
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {visibleTools.length === 0 ? (
        <p className="text-sm text-slate-500">No tools in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </section>
  );
}
