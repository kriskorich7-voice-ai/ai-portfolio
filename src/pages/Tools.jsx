import PageHeader from '../components/PageHeader.jsx';
import ToolCard from '../components/ToolCard.jsx';
import { tools } from '../data/tools.js';

export default function Tools() {
  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Portfolio"
        title="A gallery of AI tools"
        description="Working prototypes and shipped products at the intersection of sales workflows, partnership intelligence, and voice AI."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>
    </section>
  );
}
