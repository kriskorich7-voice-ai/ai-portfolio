import { useEffect, useRef, useState } from 'react';

const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const SILENCE_MS = 1500;

export default function VoiceAgentDemo({ config, onClose }) {
  const [phase, setPhase] = useState('starting'); // starting | speaking | listening | thinking | error
  const [history, setHistory] = useState([]); // user/assistant turns after the opening
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const currentTurnRef = useRef('');
  const hasSpokenRef = useRef(false);
  const cancelledRef = useRef(false);
  const transcriptScrollRef = useRef(null);
  const historyRef = useRef([]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    if (!DEEPGRAM_KEY) {
      setError(
        'Missing VITE_DEEPGRAM_API_KEY. Add it to your .env to run live demos.'
      );
      setPhase('error');
      return undefined;
    }
    cancelledRef.current = false;
    runOpeningTurn();
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
  }, [history, interim, phase]);

  async function runOpeningTurn() {
    try {
      await speak(config.openingLine);
      if (cancelledRef.current) return;
      await startListening();
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err?.message || 'Unknown error.');
        setPhase('error');
      }
    }
  }

  async function speak(text) {
    setPhase('speaking');
    setInterim('');
    const url = await synthesize(text, config.voice);
    if (cancelledRef.current) {
      URL.revokeObjectURL(url);
      return;
    }
    if (audioUrlRef.current) {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch {
        /* ignore */
      }
    }
    audioUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    await new Promise((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed.'));
      audio.play().catch(reject);
    });
  }

  async function startListening() {
    if (cancelledRef.current) return;
    currentTurnRef.current = '';
    hasSpokenRef.current = false;
    setInterim('');

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new Error(
        'Microphone access denied. Allow mic access in your browser to run the demo.'
      );
    }
    if (cancelledRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;

    const url = new URL('wss://api.deepgram.com/v1/listen');
    url.searchParams.set('model', 'flux');
    url.searchParams.set('language', config.language || 'en-US');
    url.searchParams.set('smart_format', 'true');
    url.searchParams.set('interim_results', 'true');
    url.searchParams.set('endpointing', '300');

    const ws = new WebSocket(url.toString(), ['token', DEEPGRAM_KEY]);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelledRef.current) {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        return;
      }
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
          e.data?.size &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          wsRef.current.send(e.data);
        }
      };
      recorder.start(250);
      setPhase('listening');
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
      if (data.type !== 'Results') return;
      const text = data.channel?.alternatives?.[0]?.transcript || '';
      if (!text) return;
      if (data.is_final) {
        currentTurnRef.current = (
          (currentTurnRef.current ? currentTurnRef.current + ' ' : '') +
          text.trim()
        ).trim();
        setInterim('');
      } else {
        setInterim(text);
      }
      hasSpokenRef.current = true;
      resetSilenceTimer();
    };

    ws.onerror = () => {
      if (cancelledRef.current) return;
      setError('Deepgram connection error.');
      setPhase('error');
      stopListening();
    };
  }

  function resetSilenceTimer() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (hasSpokenRef.current && !cancelledRef.current) {
        finishUserTurn();
      }
    }, SILENCE_MS);
  }

  function stopListening() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    try {
      if (
        recorderRef.current &&
        recorderRef.current.state !== 'inactive'
      ) {
        recorderRef.current.stop();
      }
    } catch {
      /* ignore */
    }
    try {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      }
    } catch {
      /* ignore */
    }
    try {
      wsRef.current?.close();
    } catch {
      /* ignore */
    }
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    wsRef.current = null;
    recorderRef.current = null;
    streamRef.current = null;
  }

  async function finishUserTurn() {
    stopListening();
    const userText = currentTurnRef.current.trim();
    if (!userText) {
      if (!cancelledRef.current) {
        try {
          await startListening();
        } catch (err) {
          setError(err?.message || 'Mic restart failed.');
          setPhase('error');
        }
      }
      return;
    }

    setPhase('thinking');
    const updatedHistory = [
      ...historyRef.current,
      { role: 'user', content: userText },
    ];
    setHistory(updatedHistory);
    setInterim('');

    try {
      const reply = await callClaude(updatedHistory);
      if (cancelledRef.current) return;
      setHistory([
        ...updatedHistory,
        { role: 'assistant', content: reply },
      ]);
      await speak(reply);
      if (cancelledRef.current) return;
      await startListening();
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err?.message || 'Unknown error.');
        setPhase('error');
      }
    }
  }

  async function callClaude(historyArr) {
    // Claude requires the first message to be from 'user'.
    // Inject a synthetic conversation-start user turn so the assistant
    // opening line can be passed as memory.
    const messages = [
      { role: 'user', content: '[Conversation begins]' },
      { role: 'assistant', content: config.openingLine },
      ...historyArr,
    ];
    const res = await fetch('/api/anthropic', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        system: config.systemPrompt,
        messages,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Claude API error (${res.status}): ${body.slice(0, 200)}`
      );
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    if (!text) throw new Error('Claude returned an empty response.');
    return text;
  }

  async function synthesize(text, voice) {
    const url = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voice)}&encoding=mp3`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `Deepgram TTS error (${res.status}): ${body.slice(0, 200)}`
      );
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  function teardown() {
    stopListening();
    try {
      audioRef.current?.pause();
    } catch {
      /* ignore */
    }
    audioRef.current = null;
    if (audioUrlRef.current) {
      try {
        URL.revokeObjectURL(audioUrlRef.current);
      } catch {
        /* ignore */
      }
      audioUrlRef.current = null;
    }
  }

  function handleEndDemo() {
    cancelledRef.current = true;
    teardown();
    onClose();
  }

  const STATUS = {
    starting: 'Connecting…',
    speaking: 'Speaking…',
    listening: 'Listening…',
    thinking: 'Thinking…',
    error: 'Error',
  };
  const statusText = STATUS[phase] || '';

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
          className="font-semibold"
          style={{ color: phase === 'error' ? '#f87171' : config.accentHex }}
        >
          {statusText}
        </span>
      </div>

      <div
        ref={transcriptScrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <ChatBubble
            role="assistant"
            text={config.openingLine}
            accentHex={config.accentHex}
            avatarInitial={config.avatarInitial}
          />
          {history.map((msg, i) => (
            <ChatBubble
              key={i}
              role={msg.role}
              text={msg.content}
              accentHex={config.accentHex}
              avatarInitial={config.avatarInitial}
            />
          ))}
          {interim && phase === 'listening' && (
            <ChatBubble
              role="user"
              text={interim}
              accentHex={config.accentHex}
              avatarInitial={config.avatarInitial}
              interim
            />
          )}
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
          <p className="text-xs text-slate-500">
            {phase === 'listening'
              ? 'Mic is open — speak naturally. Pause for 1.5s to send.'
              : phase === 'speaking'
                ? 'Mic re-opens automatically when the agent finishes.'
                : phase === 'thinking'
                  ? 'Generating response…'
                  : phase === 'starting'
                    ? 'Connecting to Deepgram…'
                    : ''}
          </p>
        </div>
      </footer>
    </div>
  );
}

function ChatBubble({ role, text, accentHex, avatarInitial, interim }) {
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
        className={
          'max-w-[80%] rounded-2xl rounded-br-sm border px-4 py-2.5 text-sm leading-relaxed transition ' +
          (interim
            ? 'border-white/10 bg-ink-800/40 text-slate-300 opacity-60'
            : 'text-white')
        }
        style={
          interim
            ? undefined
            : { backgroundColor: accentHex, borderColor: accentHex }
        }
      >
        {text}
      </div>
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-bold text-slate-200">
        You
      </div>
    </div>
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
