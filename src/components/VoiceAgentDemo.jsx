import { useEffect, useRef, useState } from 'react';

const DEEPGRAM_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const VOICE_SYSTEM_ADDENDUM =
  '\n\nKeep every response under 2 sentences. You are in a voice conversation — be concise.';

export default function VoiceAgentDemo({ config, onClose }) {
  const [phase, setPhase] = useState('starting'); // starting | listening | processing | responding | error
  const [history, setHistory] = useState([
    { role: 'assistant', content: config.openingLine },
  ]);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState(null);

  // Flux STT
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);

  // Streaming TTS
  const ttsWsRef = useRef(null);
  const ttsPlayerRef = useRef(null);
  const audioContextRef = useRef(null);

  // Conversation state
  const currentTurnRef = useRef('');
  const pendingAgentTextRef = useRef(config.openingLine);
  const phaseRef = useRef('starting');
  const cancelledRef = useRef(false);
  const historyRef = useRef([{ role: 'assistant', content: config.openingLine }]);
  const abortControllerRef = useRef(null);
  const transcriptScrollRef = useRef(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (!DEEPGRAM_KEY) {
      setError(
        'Missing VITE_DEEPGRAM_API_KEY. Add it to your .env to run live demos.'
      );
      transitionPhase('error');
      return undefined;
    }
    cancelledRef.current = false;
    startDemo();
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

  function transitionPhase(next) {
    phaseRef.current = next;
    setPhase(next);
  }

  async function startDemo() {
    try {
      await openMic();
      if (cancelledRef.current) return;
      await speakStreaming(config.openingLine);
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err?.message || 'Unknown error.');
        transitionPhase('error');
      }
    }
  }

  // -------- Flux STT (always-on) --------

  async function openMic() {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
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

    const url = new URL('wss://api.deepgram.com/v2/listen');
    url.searchParams.set('model', config.model);
    if (config.languageHints && config.languageHints.length > 0) {
      for (const hint of config.languageHints) {
        url.searchParams.append('language_hints', hint);
      }
    }

    const ws = new WebSocket(url.toString(), ['token', DEEPGRAM_KEY]);
    wsRef.current = ws;

    await new Promise((resolve, reject) => {
      ws.onopen = () => {
        if (cancelledRef.current) {
          try {
            ws.close();
          } catch {
            /* ignore */
          }
          resolve();
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
        resolve();
      };

      ws.onmessage = handleFluxMessage;
      ws.onerror = () => {
        if (!cancelledRef.current) {
          reject(new Error('Deepgram connection error.'));
        }
      };
      ws.onclose = () => {
        // Ignore — teardown handles cleanup
      };
    });
  }

  function handleFluxMessage(event) {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }
    // Flux v2 Results envelope: { type: 'Results', channel: { alternatives: [{ transcript }] }, is_final, speech_final }
    if (data.type !== 'Results') return;
    const text = (data.channel?.alternatives?.[0]?.transcript || '').trim();

    // Barge-in: any transcript while we're not in 'listening' aborts the agent
    if (
      text &&
      (phaseRef.current === 'responding' ||
        phaseRef.current === 'processing')
    ) {
      handleBargeIn();
    }

    if (text) {
      if (data.is_final) {
        const merged = (
          (currentTurnRef.current ? currentTurnRef.current + ' ' : '') +
          text
        ).trim();
        currentTurnRef.current = merged;
        setInterim('');
      } else {
        setInterim(text);
      }
    }

    if (data.speech_final && currentTurnRef.current.trim()) {
      finishUserTurn();
    }
  }

  function handleBargeIn() {
    // Abort any in-flight Claude call
    try {
      abortControllerRef.current?.abort();
    } catch {
      /* ignore */
    }
    abortControllerRef.current = null;

    // Stop TTS playback and close TTS WebSocket
    try {
      ttsPlayerRef.current?.stop();
    } catch {
      /* ignore */
    }
    ttsPlayerRef.current = null;
    try {
      ttsWsRef.current?.close();
    } catch {
      /* ignore */
    }
    ttsWsRef.current = null;

    // pendingAgentText was pushed into history at the START of speakStreaming,
    // so the partial agent response is already in the transcript. Nothing else to add.
    pendingAgentTextRef.current = '';

    transitionPhase('listening');
  }

  async function finishUserTurn() {
    const userText = currentTurnRef.current.trim();
    currentTurnRef.current = '';
    setInterim('');
    if (!userText) {
      transitionPhase('listening');
      return;
    }

    transitionPhase('processing');
    const updatedHistory = [
      ...historyRef.current,
      { role: 'user', content: userText },
    ];
    setHistory(updatedHistory);

    let reply;
    try {
      reply = await callClaude(updatedHistory);
    } catch (err) {
      if (err?.name === 'AbortError') return; // barged in mid-call
      if (!cancelledRef.current) {
        setError(err?.message || 'Claude error.');
        transitionPhase('error');
      }
      return;
    }
    if (cancelledRef.current) return;
    if (phaseRef.current !== 'processing') return; // barged in just after fetch resolved

    try {
      await speakStreaming(reply);
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err?.message || 'TTS error.');
        transitionPhase('error');
      }
    }
  }

  async function callClaude(historyArr) {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const fullSystem = config.systemPrompt + VOICE_SYSTEM_ADDENDUM;
    const messages = [
      { role: 'user', content: '[Conversation begins]' },
      ...historyArr,
    ];

    const res = await fetch('/api/anthropic', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 150,
        system: fullSystem,
        messages,
      }),
      signal: abortController.signal,
    });
    if (abortControllerRef.current === abortController) {
      abortControllerRef.current = null;
    }
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

  // -------- Streaming TTS --------

  async function speakStreaming(text) {
    if (cancelledRef.current) return;

    // Push to history at the start so the bubble appears immediately.
    // (Opening line is already pre-seeded in history, so skip the duplicate.)
    if (text !== config.openingLine) {
      setHistory((prev) => [
        ...prev,
        { role: 'assistant', content: text },
      ]);
    }
    pendingAgentTextRef.current = text;
    transitionPhase('responding');

    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)({ sampleRate: 24000 });
      } catch {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
    }
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch {
        /* ignore */
      }
    }

    const player = createTtsPlayer(audioContextRef.current);
    ttsPlayerRef.current = player;

    const url = new URL('wss://api.deepgram.com/v1/speak');
    url.searchParams.set('model', config.voice);
    url.searchParams.set('encoding', 'linear16');
    url.searchParams.set('sample_rate', '24000');

    const ws = new WebSocket(url.toString(), ['token', DEEPGRAM_KEY]);
    ws.binaryType = 'arraybuffer';
    ttsWsRef.current = ws;

    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        try {
          ws.close();
        } catch {
          /* ignore */
        }
        if (ttsWsRef.current === ws) ttsWsRef.current = null;
        if (ttsPlayerRef.current === player) ttsPlayerRef.current = null;
        // If we weren't already barged in, return to listening.
        if (phaseRef.current === 'responding') {
          pendingAgentTextRef.current = '';
          transitionPhase('listening');
        }
        resolve();
      };

      ws.onopen = () => {
        if (cancelledRef.current) {
          finish();
          return;
        }
        ws.send(JSON.stringify({ type: 'Speak', text }));
        ws.send(JSON.stringify({ type: 'Flush' }));
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          player.appendChunk(event.data);
          return;
        }
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'Flushed' || msg.type === 'Done') {
            player.flush();
          }
        } catch {
          /* ignore */
        }
      };

      ws.onerror = () => {
        if (!cancelledRef.current && !settled) {
          settled = true;
          reject(new Error('TTS WebSocket error.'));
        }
      };
      ws.onclose = () => {
        // If we never got Flushed, treat close as flush trigger
        player.flush();
      };

      player.onEnded(() => finish());
    });
  }

  // -------- Teardown --------

  function teardown() {
    try {
      abortControllerRef.current?.abort();
    } catch {
      /* ignore */
    }
    abortControllerRef.current = null;
    try {
      ttsPlayerRef.current?.stop();
    } catch {
      /* ignore */
    }
    ttsPlayerRef.current = null;
    try {
      ttsWsRef.current?.close();
    } catch {
      /* ignore */
    }
    ttsWsRef.current = null;
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
    recorderRef.current = null;
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
    wsRef.current = null;
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    streamRef.current = null;
    try {
      audioContextRef.current?.close();
    } catch {
      /* ignore */
    }
    audioContextRef.current = null;
  }

  function handleEndDemo() {
    cancelledRef.current = true;
    teardown();
    onClose();
  }

  const STATUS = {
    starting: 'Connecting',
    listening: 'Listening',
    processing: 'Processing',
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
        <span className="font-semibold inline-flex items-center" style={{ color: statusColor }}>
          {statusText}
          {phase !== 'error' && <AnimatedDots color={statusColor} />}
        </span>
      </div>

      <div
        ref={transcriptScrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
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
              {phase === 'processing' ? <Spinner /> : <MicIcon />}
            </div>
          </div>
          <p className="text-xs text-slate-500 inline-flex items-center gap-1">
            {phase === 'listening' && (
              <>Mic is open — speak naturally. Interrupt the agent anytime.</>
            )}
            {phase === 'responding' && (
              <>Agent is speaking. Start talking to interrupt.</>
            )}
            {phase === 'processing' && (
              <>
                <span>Sending to Claude</span>
                <AnimatedDots color="#94a3b8" />
              </>
            )}
            {phase === 'starting' && (
              <>
                <span>Opening mic</span>
                <AnimatedDots color="#94a3b8" />
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}

function createTtsPlayer(audioContext) {
  let nextStartTime = audioContext.currentTime;
  let sources = [];
  let endedCallbacks = [];
  let flushed = false;
  let stopped = false;

  function maybeNotifyEnded() {
    if (stopped) return;
    if (flushed && sources.length === 0) {
      const callbacks = endedCallbacks;
      endedCallbacks = [];
      callbacks.forEach((fn) => {
        try {
          fn();
        } catch {
          /* ignore */
        }
      });
    }
  }

  return {
    appendChunk(arrayBuffer) {
      if (stopped) return;
      const int16 = new Int16Array(arrayBuffer);
      if (int16.length === 0) return;
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }
      const buffer = audioContext.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      const startAt = Math.max(
        audioContext.currentTime + 0.02,
        nextStartTime
      );
      try {
        source.start(startAt);
      } catch {
        /* ignore */
      }
      nextStartTime = startAt + buffer.duration;
      sources.push(source);
      source.onended = () => {
        sources = sources.filter((s) => s !== source);
        maybeNotifyEnded();
      };
    },
    flush() {
      flushed = true;
      maybeNotifyEnded();
    },
    onEnded(fn) {
      if (typeof fn === 'function') endedCallbacks.push(fn);
    },
    stop() {
      stopped = true;
      sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* ignore */
        }
      });
      sources = [];
    },
  };
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
