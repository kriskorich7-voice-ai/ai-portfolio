import { useEffect, useRef, useState } from 'react';
import {
  AgentSession,
  AgentMicrophone,
  AgentPlayer,
} from '@deepgram/agents';

const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

export default function VoiceAgentDemo({ config, onClose }) {
  const [phase, setPhase] = useState('connecting'); // connecting | listening | thinking | responding | error
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const sessionRef = useRef(null);
  const micRef = useRef(null);
  const playerRef = useRef(null);
  const phaseRef = useRef('connecting');
  const cancelledRef = useRef(false);
  const transcriptScrollRef = useRef(null);

  useEffect(() => {
    if (!DEEPGRAM_KEY) {
      setError(
        'Missing VITE_DEEPGRAM_API_KEY. Add it to your .env to run live demos.'
      );
      transitionPhase('error');
      return undefined;
    }
    cancelledRef.current = false;
    start();
    return () => {
      cancelledRef.current = true;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop =
        transcriptScrollRef.current.scrollHeight;
    }
  }, [history, phase]);

  function transitionPhase(next) {
    phaseRef.current = next;
    setPhase(next);
  }

  async function start() {
    try {
      const session = new AgentSession({
        auth: { apiKey: DEEPGRAM_KEY },
        audio: {
          input: { encoding: 'linear16', sampleRate: 16000 },
          output: { encoding: 'linear16', sampleRate: 24000 },
        },
        agent: {
          listen: {
            provider: { type: 'deepgram', model: config.listenModel },
          },
          think: {
            provider: { type: 'anthropic', model: 'claude-sonnet-4-6' },
            prompt: config.systemPrompt,
          },
          speak: {
            provider: { type: 'deepgram', model: config.voice },
          },
        },
      });
      sessionRef.current = session;

      const player = new AgentPlayer();
      playerRef.current = player;

      session.on('audio', (chunk) => {
        if (cancelledRef.current) return;
        player.queue(chunk);
      });

      session.on('conversation-text', (msg) => {
        if (cancelledRef.current) return;
        const role = msg.role === 'user' ? 'user' : 'assistant';
        const raw = msg.content || msg.message || '';
        if (!raw) return;
        const content = role === 'assistant' ? stripMarkdown(raw) : raw;
        setHistory((h) => [...h, { role, content }]);
      });

      session.on('settings-applied', () => {
        if (cancelledRef.current) return;
        try {
          session.injectAgentMessage(config.openingLine);
        } catch {
          /* ignore */
        }
      });

      session.on('user-started-speaking', () => {
        if (cancelledRef.current) return;
        try {
          player.interrupt();
        } catch {
          /* ignore */
        }
        transitionPhase('listening');
      });

      session.on('agent-thinking', () => {
        if (cancelledRef.current) return;
        transitionPhase('thinking');
      });

      session.on('agent-started-speaking', () => {
        if (cancelledRef.current) return;
        transitionPhase('responding');
      });

      session.on('agent-audio-done', () => {
        if (cancelledRef.current) return;
        transitionPhase('listening');
      });

      session.on('error', (msg) => {
        if (cancelledRef.current) return;
        const description =
          msg?.description || msg?.message || 'Agent session error.';
        setError(description);
        transitionPhase('error');
      });

      await session.connect();
      if (cancelledRef.current) return;

      const mic = new AgentMicrophone((data) => {
        if (cancelledRef.current) return;
        try {
          session.sendAudio(data);
        } catch {
          /* ignore */
        }
      });
      micRef.current = mic;
      await mic.start();
      if (cancelledRef.current) return;

      transitionPhase('listening');
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err?.message || 'Failed to start demo.');
        transitionPhase('error');
      }
    }
  }

  function teardown() {
    try {
      micRef.current?.stop();
    } catch {
      /* ignore */
    }
    micRef.current = null;
    try {
      sessionRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    sessionRef.current = null;
    try {
      playerRef.current?.dispose();
    } catch {
      /* ignore */
    }
    playerRef.current = null;
  }

  function handleEndDemo() {
    cancelledRef.current = true;
    teardown();
    onClose();
  }

  function handleSuggestion(text) {
    if (!text || !sessionRef.current) return;
    try {
      sessionRef.current.injectUserMessage(text);
    } catch {
      /* ignore */
    }
  }

  const STATUS = {
    connecting: 'Connecting',
    listening: 'Listening',
    thinking: 'Thinking',
    responding: 'Responding',
    error: 'Error',
  };
  const statusText = STATUS[phase] || '';
  const statusColor = phase === 'error' ? '#f87171' : config.accentHex;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950">
      <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-ink-900/80 p-4 backdrop-blur-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-lg font-bold text-white shadow-lg"
            style={{ backgroundColor: config.accentHex }}
          >
            {config.avatarInitial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white sm:text-base">
              {config.agentName}
              <span className="ml-2 text-xs font-normal text-slate-400 sm:text-sm">
                · {config.agentTitle}
              </span>
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {config.industryEyebrow}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleEndDemo}
          className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
        >
          End Demo
        </button>
      </header>

      <div className="flex items-center justify-center gap-2 border-b border-white/5 bg-ink-900/40 py-2 text-[10px] uppercase tracking-[0.22em]">
        <span className="text-slate-500">Status:</span>
        <span
          className="inline-flex items-center font-semibold"
          style={{ color: statusColor }}
        >
          {statusText}
          {phase !== 'error' && <AnimatedDots color={statusColor} />}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <DemoSidebar
          config={config}
          phase={phase}
          onSelectSuggestion={handleSuggestion}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <div
            ref={transcriptScrollRef}
            className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {history.length === 0 && phase !== 'error' && (
                <p className="self-center text-xs text-slate-500">
                  Setting up your conversation with {config.agentName}…
                </p>
              )}
              {history.map((msg, i) => (
                <ChatBubble
                  key={i}
                  role={msg.role}
                  text={msg.content}
                  accentHex={config.accentHex}
                  avatarInitial={config.avatarInitial}
                />
              ))}
              {phase === 'error' && error && (
                <div className="self-center rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-100">
                  {error}
                </div>
              )}
            </div>
          </div>

          <footer className="border-t border-white/10 bg-ink-900/80 px-4 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-2">
              <div className="relative">
                {phase === 'listening' && (
                  <>
                    <span
                      className="absolute inset-0 animate-ping rounded-full opacity-40"
                      style={{ backgroundColor: config.accentHex }}
                    />
                    <span
                      className="absolute -inset-2 rounded-full border opacity-60"
                      style={{ borderColor: config.accentHex }}
                    />
                  </>
                )}
                <div
                  aria-label={statusText}
                  className="relative flex h-16 w-16 items-center justify-center rounded-full border text-white shadow-lg transition"
                  style={{
                    borderColor: config.accentHex,
                    backgroundColor:
                      phase === 'listening' ? config.accentHex : '#0b0b15',
                  }}
                >
                  {phase === 'thinking' ? <Spinner /> : <MicIcon />}
                </div>
              </div>
              <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                {phase === 'listening' && (
                  <>Mic is open — speak naturally. Interrupt the agent anytime.</>
                )}
                {phase === 'responding' && (
                  <>Agent is speaking. Start talking to interrupt.</>
                )}
                {phase === 'thinking' && (
                  <>
                    <span>Generating reply</span>
                    <AnimatedDots color="#94a3b8" />
                  </>
                )}
                {phase === 'connecting' && (
                  <>
                    <span>Connecting to Deepgram Voice Agent</span>
                    <AnimatedDots color="#94a3b8" />
                  </>
                )}
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function stripMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .trim();
}

function DemoSidebar({ config, phase, onSelectSuggestion }) {
  const sidebar = config.sidebar;
  if (!sidebar) return null;
  const disabled = phase === 'connecting' || phase === 'error';
  return (
    <aside className="hidden w-2/5 flex-col overflow-y-auto border-r border-white/10 bg-ink-900/60 px-6 py-7 lg:flex">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Demo guide
      </p>
      <h2
        className="mt-1 text-lg font-semibold tracking-tight"
        style={{ color: config.accentHex }}
      >
        {sidebar.title}
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        {sidebar.scenario}
      </p>

      {sidebar.fakeData && (
        <div className="mt-5 rounded-lg border border-white/10 bg-ink-950/70 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-slate-300">
          {sidebar.fakeData}
        </div>
      )}

      <div className="mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {sidebar.suggestionsLabel || 'Try saying…'}
        </p>
        <ul className="mt-3 space-y-2">
          {sidebar.suggestions.map((suggestion, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelectSuggestion(suggestion)}
                disabled={disabled}
                className="group w-full rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2 text-left text-xs leading-relaxed text-slate-200 transition hover:bg-ink-800/70 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: disabled ? undefined : `${config.accentHex}33` }}
              >
                <span
                  className="mr-1.5 font-semibold"
                  style={{ color: config.accentHex }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                {suggestion}
                <span
                  className="ml-1 font-semibold"
                  style={{ color: config.accentHex }}
                  aria-hidden="true"
                >
                  &rdquo;
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10px] italic text-slate-500">
          Click a suggestion to inject it as the user.
        </p>
      </div>

      <div
        className="mt-auto rounded-lg border-l-2 bg-white/5 px-3.5 py-3"
        style={{ borderColor: config.accentHex }}
      >
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
          <LightbulbIcon /> Pro tip
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          {sidebar.proTip}
        </p>
      </div>
    </aside>
  );
}

function LightbulbIcon() {
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
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2z" />
    </svg>
  );
}

function ChatBubble({ role, text, accentHex, avatarInitial }) {
  const isAgent = role === 'assistant';
  if (isAgent) {
    return (
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: accentHex }}
          aria-hidden="true"
        >
          {avatarInitial}
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-white/10 bg-ink-800/80 px-4 py-2.5 text-sm leading-relaxed text-slate-100">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start justify-end gap-3">
      <div
        className="max-w-[80%] rounded-2xl rounded-br-sm border px-4 py-2.5 text-sm leading-relaxed text-white"
        style={{ backgroundColor: accentHex, borderColor: accentHex }}
      >
        {text}
      </div>
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-bold text-slate-200">
        You
      </div>
    </div>
  );
}

function AnimatedDots({ color = 'currentColor' }) {
  return (
    <span
      className="ml-1.5 inline-flex items-center gap-0.5"
      aria-hidden="true"
    >
      {[0, 200, 400].map((delay) => (
        <span
          key={delay}
          className="inline-block h-1 w-1 animate-pulse rounded-full"
          style={{
            backgroundColor: color,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </span>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white"
      aria-hidden="true"
    />
  );
}
