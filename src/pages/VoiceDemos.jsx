import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import VoiceAgentDemo from '../components/VoiceAgentDemo.jsx';
import { VOICE_DEMOS } from '../data/voiceDemos.js';

export default function VoiceDemos() {
  const [activeDemo, setActiveDemo] = useState(null);

  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Live demos"
        title="Voice AI Demos"
        description="Experience Deepgram-powered voice agents across industries. Each demo runs a full conversation in your browser — Deepgram streaming STT, Claude reasoning, Deepgram TTS playback."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {VOICE_DEMOS.map((demo) => (
          <DemoCard
            key={demo.id}
            demo={demo}
            onStart={() => setActiveDemo(demo)}
          />
        ))}
      </div>

      <p className="mt-10 text-xs text-slate-500">
        Demos use your microphone and play synthesized audio. Allow mic access
        when prompted.
      </p>

      {activeDemo && (
        <VoiceAgentDemo
          config={activeDemo}
          onClose={() => setActiveDemo(null)}
        />
      )}
    </section>
  );
}

function DemoCard({ demo, onStart }) {
  return (
    <article className="card-surface flex h-full flex-col">
      <div className="relative flex h-full flex-col gap-5 p-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-14 w-14 flex-none items-center justify-center rounded-full text-xl font-bold text-white shadow-lg"
            style={{ backgroundColor: demo.accentHex }}
            aria-hidden="true"
          >
            {demo.avatarInitial}
          </div>
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: demo.accentHex }}
            >
              {demo.industryEyebrow}
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">
              {demo.agentName}
            </h3>
            <p className="text-xs text-slate-400">{demo.agentTitle}</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-300">
          {demo.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
            {demo.useCase}
          </span>
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-mono"
            style={{
              borderColor: demo.accentHex + '55',
              color: demo.accentHex,
              backgroundColor: demo.accentHex + '14',
            }}
          >
            {demo.voice}
          </span>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-auto inline-flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: demo.accentHex }}
        >
          Start Demo
          <ArrowRight />
        </button>
      </div>
    </article>
  );
}

function ArrowRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
