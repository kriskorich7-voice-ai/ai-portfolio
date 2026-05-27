import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';

export default function ProposalGenerator() {
  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Tool"
        title="Proposal Generator"
        description="Turn discovery notes into polished partnership and sales proposals in minutes. The full app shell will live here — for now this is a placeholder layout."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="card-surface lg:col-span-2">
          <div className="relative p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </h2>
            <div className="mt-4 flex h-72 items-center justify-center rounded-xl border border-dashed border-white/10 bg-ink-900/60 text-sm text-slate-500">
              Proposal editor coming soon
            </div>
          </div>
        </div>

        <div className="card-surface">
          <div className="relative p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Inputs
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-lg border border-white/5 bg-ink-900/60 px-3 py-2">
                Discovery notes
              </li>
              <li className="rounded-lg border border-white/5 bg-ink-900/60 px-3 py-2">
                CRM context
              </li>
              <li className="rounded-lg border border-white/5 bg-ink-900/60 px-3 py-2">
                Template &amp; tone
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Link
          to="/tools"
          className="text-sm font-medium text-slate-400 transition hover:text-white"
        >
          ← Back to tools
        </Link>
      </div>
    </section>
  );
}
