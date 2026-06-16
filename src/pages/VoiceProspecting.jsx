import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';

const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const CLAUDE_MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `You are an expert B2B sales and partnerships professional. The user will describe a prospect or partner company. Your job is to:
1. Identify key facts about the company based on the description (industry, size, likely pain points, recent context if mentioned)
2. Generate three outreach assets tailored to this specific prospect:
   - A cold outreach email (subject line + body, 150-200 words, personalized, value-first)
   - A LinkedIn connection message (under 300 characters, conversational, specific)
   - A cold call opening script (30-45 seconds when spoken, natural, not salesy)

The outreach should be from Kris Korich, Partnerships & BD at Deepgram. Deepgram is a voice AI company offering industry-leading speech-to-text, text-to-speech, and Voice Agent API. Position Deepgram's value based on the prospect's likely use case.

Respond with ONLY a JSON object — no prose, no markdown fences — in this exact shape:
{
  "prospectSummary": "one paragraph summary of what you know about this company and why Deepgram is relevant",
  "email": { "subject": "...", "body": "..." },
  "linkedin": "...",
  "callScript": "..."
}`;

export default function VoiceProspecting() {
  const [phase, setPhase] = useState('idle'); // idle | recording | editing | generating | results | error
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('email');
  const [copiedKey, setCopiedKey] = useState(null);

  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => stopRecordingPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopRecordingPipeline() {
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    } catch {
      // ignore
    }
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      }
    } catch {
      // ignore
    }
    try {
      if (wsRef.current) wsRef.current.close();
    } catch {
      // ignore
    }
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    } catch {
      // ignore
    }
    recorderRef.current = null;
    wsRef.current = null;
    streamRef.current = null;
  }

  async function startRecording() {
    if (!DEEPGRAM_KEY) {
      setError(
        'Missing VITE_DEEPGRAM_API_KEY. Add it to your .env to enable transcription.'
      );
      setPhase('error');
      return;
    }
    setError(null);
    setFinalTranscript('');
    setInterimTranscript('');
    setEditedTranscript('');
    setResult(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError(
        'Microphone access denied. Allow mic access in your browser to record.'
      );
      setPhase('error');
      return;
    }
    streamRef.current = stream;

    const url = new URL('wss://api.deepgram.com/v1/listen');
    url.searchParams.set('model', 'nova-3');
    url.searchParams.set('language', 'en-US');
    url.searchParams.set('smart_format', 'true');
    url.searchParams.set('interim_results', 'true');
    url.searchParams.set('endpointing', '500');

    let ws;
    try {
      ws = new WebSocket(url.toString(), ['token', DEEPGRAM_KEY]);
    } catch (err) {
      stopRecordingPipeline();
      setError('Could not open Deepgram WebSocket. Check your API key.');
      setPhase('error');
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ];
      const mime =
        mimeCandidates.find(
          (m) =>
            typeof MediaRecorder !== 'undefined' &&
            MediaRecorder.isTypeSupported(m)
        ) || '';
      let recorder;
      try {
        recorder = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (
          e.data &&
          e.data.size > 0 &&
          wsRef.current &&
          wsRef.current.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(e.data);
        }
      };
      recorder.start(250);
      setPhase('recording');
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type === 'Results') {
        const alt = data.channel?.alternatives?.[0];
        const text = alt?.transcript || '';
        if (!text) return;
        if (data.is_final) {
          setFinalTranscript((prev) =>
            (prev ? prev + ' ' : '') + text.trim()
          );
          setInterimTranscript('');
        } else {
          setInterimTranscript(text);
        }
      }
    };

    ws.onerror = () => {
      setError('Deepgram connection error. Try again.');
      setPhase('error');
      stopRecordingPipeline();
    };
  }

  function handleStop() {
    stopRecordingPipeline();
    setEditedTranscript(
      [finalTranscript, interimTranscript]
        .filter(Boolean)
        .join(' ')
        .trim()
    );
    setInterimTranscript('');
    setPhase('editing');
  }

  async function handleGenerate() {
    const transcript = editedTranscript.trim();
    if (!transcript) return;
    setError(null);
    setPhase('generating');

    try {
      const res = await fetch('/api/anthropic', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: transcript }],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Claude API error (${res.status}): ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      const parsed = extractJson(text);
      if (!parsed || !parsed.email || !parsed.linkedin || !parsed.callScript) {
        throw new Error('Claude response could not be parsed as expected JSON.');
      }
      setResult(parsed);
      setActiveTab('email');
      setPhase('results');
    } catch (err) {
      setError(err?.message || 'Unknown error generating outreach.');
      setPhase('error');
    }
  }

  function handleEditAndRegenerate() {
    setPhase('editing');
  }

  function handleReset() {
    stopRecordingPipeline();
    setFinalTranscript('');
    setInterimTranscript('');
    setEditedTranscript('');
    setResult(null);
    setError(null);
    setPhase('idle');
  }

  async function handleCopy(key, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1500);
    } catch {
      // ignore
    }
  }

  const liveTranscript = [finalTranscript, interimTranscript]
    .filter(Boolean)
    .join(' ')
    .trim();
  const companyHint = extractCompanyHint(editedTranscript || liveTranscript);

  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Tool"
        title="Voice Prospecting Assistant"
        description="Speak your prospect. Get outreach in seconds."
      />

      {(phase === 'idle' || phase === 'recording' || phase === 'editing') && (
        <RecorderHero
          phase={phase}
          liveTranscript={liveTranscript}
          editedTranscript={editedTranscript}
          onStart={startRecording}
          onStop={handleStop}
          onEditChange={setEditedTranscript}
          onGenerate={handleGenerate}
          onReset={handleReset}
        />
      )}

      {phase === 'generating' && (
        <GeneratingState companyHint={companyHint} />
      )}

      {phase === 'results' && result && (
        <Results
          result={result}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          copiedKey={copiedKey}
          onCopy={handleCopy}
          onEdit={handleEditAndRegenerate}
          onReset={handleReset}
        />
      )}

      {phase === 'error' && (
        <ErrorState error={error} onReset={handleReset} />
      )}

      <p className="mt-12 text-center text-xs text-slate-500">
        Powered by Deepgram Nova-3 STT + Claude AI
      </p>
    </section>
  );
}

function RecorderHero({
  phase,
  liveTranscript,
  editedTranscript,
  onStart,
  onStop,
  onEditChange,
  onGenerate,
  onReset,
}) {
  const isRecording = phase === 'recording';
  const isEditing = phase === 'editing';

  return (
    <div className="card-surface">
      <div className="relative flex flex-col items-center gap-6 p-8 sm:p-12">
        <div className="relative flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
              <span className="absolute -inset-2 rounded-full border border-red-500/40" />
              <span className="absolute -inset-5 rounded-full border border-red-500/20" />
            </>
          )}
          {!isRecording && (
            <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent-blue via-accent-indigo to-accent-violet opacity-60 blur-md" />
          )}
          <button
            type="button"
            onClick={isRecording ? onStop : onStart}
            disabled={isEditing}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            className={
              'relative flex h-28 w-28 items-center justify-center rounded-full border text-white transition disabled:cursor-not-allowed disabled:opacity-50 sm:h-32 sm:w-32 ' +
              (isRecording
                ? 'border-red-400/60 bg-red-500/20 shadow-glow'
                : 'border-white/15 bg-ink-900/80 hover:border-white/30 hover:bg-ink-800/90 shadow-glow')
            }
          >
            {isRecording ? <StopGlyph /> : <MicIcon />}
          </button>
        </div>

        <div className="text-center">
          {phase === 'idle' && (
            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Click to speak. Describe your prospect — company, role, industry,
              and why you&apos;re reaching out.
            </p>
          )}
          {isRecording && (
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-red-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              Recording — tap the button to stop
            </p>
          )}
          {isEditing && (
            <p className="text-sm text-slate-400">
              Review the transcript and tweak anything Deepgram missed before
              generating.
            </p>
          )}
        </div>

        {(isRecording || (phase === 'idle' && liveTranscript)) && (
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-ink-900/60 p-4 text-sm leading-relaxed text-slate-200 min-h-[5rem]">
            {liveTranscript || (
              <span className="text-slate-500">
                Listening… start speaking and your words will appear here.
              </span>
            )}
          </div>
        )}

        {isEditing && (
          <div className="w-full max-w-2xl space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
              Edit your prospect briefing
            </label>
            <textarea
              value={editedTranscript}
              onChange={(e) => onEditChange(e.target.value)}
              rows={6}
              placeholder="e.g. I'd like to reach out to Acme Bank — they're a mid-size regional bank in Texas exploring AI-driven contact center modernization…"
              className="w-full rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 transition focus:border-accent-blue/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={onGenerate}
                disabled={!editedTranscript.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-white/40 disabled:text-ink-950/60"
              >
                Generate Outreach
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GeneratingState({ companyHint }) {
  return (
    <div className="card-surface">
      <div className="relative flex flex-col items-center justify-center gap-5 p-12 text-center">
        <div className="relative">
          <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent-blue via-accent-indigo to-accent-violet opacity-70 blur-md" />
          <div className="relative h-14 w-14 animate-spin rounded-full border-2 border-white/20 border-t-accent-blue" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">
            Researching {companyHint || 'your prospect'}…
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Drafting outreach for email, LinkedIn, and a cold call.
          </p>
        </div>
      </div>
    </div>
  );
}

function Results({
  result,
  activeTab,
  setActiveTab,
  copiedKey,
  onCopy,
  onEdit,
  onReset,
}) {
  const tabs = [
    { id: 'email', label: 'Email' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'callScript', label: 'Call Script' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-accent-blue/10 via-accent-indigo/8 to-accent-violet/10 p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-blue/80">
          What I know about your prospect
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {result.prospectSummary}
        </p>
      </div>

      <div className="card-surface">
        <div className="relative p-6 sm:p-8">
          <div
            role="tablist"
            aria-label="Outreach assets"
            className="mb-6 inline-flex items-center gap-1 rounded-xl border border-white/10 bg-ink-900/60 p-1"
          >
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(t.id)}
                  className={
                    'rounded-lg px-4 py-1.5 text-sm font-semibold transition ' +
                    (isActive
                      ? 'bg-gradient-to-r from-accent-blue/30 to-accent-violet/30 text-white shadow-glow ring-1 ring-white/10'
                      : 'text-slate-400 hover:text-white')
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'email' && (
            <EmailPanel
              email={result.email}
              copiedKey={copiedKey}
              onCopy={onCopy}
            />
          )}
          {activeTab === 'linkedin' && (
            <SimplePanel
              copyKey="linkedin"
              label="LinkedIn message"
              value={result.linkedin}
              copiedKey={copiedKey}
              onCopy={onCopy}
              minRows={4}
            />
          )}
          {activeTab === 'callScript' && (
            <SimplePanel
              copyKey="callScript"
              label="Call script"
              value={result.callScript}
              copiedKey={copiedKey}
              onCopy={onCopy}
              minRows={8}
            />
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-5">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
            >
              <MicIcon small /> New prospect
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-slate-200"
            >
              Edit &amp; regenerate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailPanel({ email, copiedKey, onCopy }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Subject line
          </span>
          <CopyButton
            isCopied={copiedKey === 'email-subject'}
            onClick={() => onCopy('email-subject', email.subject)}
          />
        </div>
        <div className="rounded-lg border border-white/10 bg-ink-900/60 px-4 py-2.5 text-sm font-semibold text-white">
          {email.subject}
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Body
          </span>
          <CopyButton
            isCopied={copiedKey === 'email-body'}
            onClick={() => onCopy('email-body', email.body)}
          />
        </div>
        <textarea
          readOnly
          value={email.body}
          rows={Math.min(20, Math.max(8, email.body.split('\n').length + 2))}
          className="w-full whitespace-pre-wrap rounded-lg border border-white/10 bg-ink-900/60 px-4 py-3 text-sm leading-relaxed text-slate-100"
        />
      </div>
    </div>
  );
}

function SimplePanel({
  copyKey,
  label,
  value,
  copiedKey,
  onCopy,
  minRows = 6,
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <CopyButton
          isCopied={copiedKey === copyKey}
          onClick={() => onCopy(copyKey, value)}
        />
      </div>
      <textarea
        readOnly
        value={value}
        rows={Math.max(minRows, Math.min(20, value.split('\n').length + 2))}
        className="w-full whitespace-pre-wrap rounded-lg border border-white/10 bg-ink-900/60 px-4 py-3 text-sm leading-relaxed text-slate-100"
      />
    </div>
  );
}

function CopyButton({ isCopied, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
    >
      {isCopied ? (
        <>
          <Check small /> Copied
        </>
      ) : (
        <>
          <CopyGlyph /> Copy
        </>
      )}
    </button>
  );
}

function ErrorState({ error, onReset }) {
  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
      <p className="text-sm font-semibold text-red-200">Something went wrong</p>
      <p className="mt-2 text-sm text-red-100/80">{error}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
      >
        Start over
      </button>
    </div>
  );
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function extractCompanyHint(transcript) {
  if (!transcript) return null;
  const m = transcript.match(
    /\b(?:at|called|named|company|reach(?:ing)? out to)\s+([A-Z][A-Za-z0-9&\-]+(?:\s+[A-Z][A-Za-z0-9&\-]+){0,3})/
  );
  return m ? m[1] : null;
}

function MicIcon({ small = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={small ? 'h-4 w-4' : 'h-12 w-12'}
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-10 w-10 text-red-200"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function CopyGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function Check({ small = false }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={small ? 'h-3 w-3' : 'h-3.5 w-3.5'}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
