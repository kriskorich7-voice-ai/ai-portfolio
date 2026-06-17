import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';

const CLAUDE_MODEL = 'claude-sonnet-4-6';

const STORAGE_KEY = 'sportsBets';

const SPORTS = [
  { id: 'soccer', label: 'Soccer', icon: '⚽', endpoint: 'odds/soccer/upcoming' },
  { id: 'nfl', label: 'NFL', icon: '🏈', endpoint: 'odds/americanfootball_nfl/upcoming' },
  {
    id: 'ncaab',
    label: 'College Basketball',
    icon: '🏀',
    endpoint: 'odds/basketball_ncaab/upcoming',
  },
];

const EMPTY_ODDS = {
  mlHome: '',
  mlAway: '',
  spreadHome: '',
  spreadHomeOdds: '',
  spreadAwayOdds: '',
  total: '',
  overOdds: '',
  underOdds: '',
};

const SPORTSBOOKS = ['MGM', 'DraftKings', 'FanDuel', 'Caesars', 'Other'];

const SYSTEM_PROMPT = `You are an expert sports betting analyst with deep knowledge of Soccer, NFL, and College Basketball. Analyze the matchup across ALL bet types — moneyline, spread, and over/under — using the odds provided (or your own fair-odds estimates when odds are missing). Then recommend the SINGLE best bet across all three types: the one offering the most value (largest positive edge at acceptable risk). Explain why that bet type offers the most value.

The top-level "recommendation", "betType", "odds", "confidence", "impliedProbability", "ourProbability", "edge", "potentialPayout", "reasoning", "keyFactors", "risks", "verdict", and "historicalContext" fields must all describe your single best bet.

Return your response as JSON:
{
  "matchup": "string",
  "sport": "string",
  "bestBetType": "Moneyline | Spread | Over | Under",
  "betType": "string (same as bestBetType)",
  "recommendation": "string (Team/Side to bet on for the best bet)",
  "confidence": "number 1-100",
  "odds": "string (American format, e.g. -110)",
  "impliedProbability": "string (e.g. 52.4%)",
  "ourProbability": "string (your estimated true probability)",
  "edge": "string (our probability minus implied probability)",
  "potentialPayout": "number (based on stake)",
  "reasoning": "string (3-4 sentences explaining the pick AND why this bet type offers the most value vs the others)",
  "keyFactors": ["array of 3-5 key factors driving this pick"],
  "risks": ["array of 2-3 risks to this bet"],
  "verdict": "STRONG BET | LEAN | PASS",
  "historicalContext": "string (relevant historical stats or trends)",
  "allBetAnalysis": {
    "moneyline": { "pick": "string", "odds": "string", "edge": "string", "verdict": "STRONG BET | LEAN | PASS" },
    "spread": { "pick": "string", "odds": "string", "edge": "string", "verdict": "STRONG BET | LEAN | PASS" },
    "overUnder": { "pick": "string", "odds": "string", "edge": "string", "verdict": "STRONG BET | LEAN | PASS" }
  }
}

Be analytical, data-driven, and honest. If the edge is not there for a given bet type, mark it PASS. Include relevant recent form, head-to-head records, injuries if known, and situational factors. Return only valid JSON, no markdown.`;

export default function SportsBetting() {
  const [bets, setBets] = useState(() => loadBets());

  // Persist bets to localStorage whenever they change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bets));
    } catch {
      /* ignore quota errors */
    }
  }, [bets]);

  // Analyzer form state
  const [sport, setSport] = useState('soccer');
  const [games, setGames] = useState([]);
  const [gamesState, setGamesState] = useState('idle'); // idle | loading | ready | error
  const [selectedGameId, setSelectedGameId] = useState('');
  const [manualMatchup, setManualMatchup] = useState('');
  const [stake, setStake] = useState(50);

  // Optional manual odds entry
  const [showOdds, setShowOdds] = useState(false);
  const [odds, setOdds] = useState(EMPTY_ODDS);
  const setOddsField = (key) => (e) =>
    setOdds((o) => ({ ...o, [key]: e.target.value }));

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Log-bet modal state
  const [logModal, setLogModal] = useState(null);

  const activeSport = SPORTS.find((s) => s.id === sport) || SPORTS[0];
  const useManual = gamesState === 'error' || (gamesState === 'ready' && games.length === 0);

  // Fetch upcoming games whenever the sport changes.
  useEffect(() => {
    let cancelled = false;
    const target = SPORTS.find((s) => s.id === sport);
    if (!target) return;

    setGames([]);
    setSelectedGameId('');
    setGamesState('loading');

    fetch(`/api/sharp?endpoint=${encodeURIComponent(target.endpoint)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const parsed = parseGames(data);
        setGames(parsed);
        setGamesState('ready');
        if (parsed.length > 0) setSelectedGameId(parsed[0].id);
      })
      .catch(() => {
        if (cancelled) return;
        setGames([]);
        setGamesState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [sport]);

  const selectedGame = games.find((g) => g.id === selectedGameId) || null;

  const currentMatchup = useManual
    ? manualMatchup.trim()
    : selectedGame
      ? selectedGame.matchup
      : '';

  const canAnalyze = currentMatchup.length > 0 && Number(stake) > 0 && !analyzing;

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setAnalysis(null);
    setAnalysisError(null);

    const oddsContext =
      selectedGame && selectedGame.oddsSummary
        ? `\n\nLive odds from the sportsbook feed:\n${selectedGame.oddsSummary}`
        : '';

    const manualOdds = formatManualOdds(odds);
    const oddsInstruction = manualOdds
      ? `\n\nUser-entered current odds (American format):${manualOdds}\nUse these exact listed odds. Base impliedProbability, edge, the "odds" field, and potentialPayout on these actual odds (for the recommended side/bet type).`
      : '\n\nNo odds were provided — use your knowledge to estimate fair market odds, then compute impliedProbability and payout from those estimates.';

    const userMessage = [
      `Sport: ${activeSport.label}`,
      `Matchup: ${currentMatchup}`,
      `Stake: $${Number(stake)}`,
      `Analyze moneyline, spread, and over/under, then recommend the single best bet across all three.`,
      `Calculate the potentialPayout as the total profit (not including stake) for a winning $${Number(
        stake
      )} bet at the recommended best bet's odds.`,
      oddsContext,
      oddsInstruction,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      const res = await fetch('/api/anthropic', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Analysis failed (${res.status}): ${text.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data?.content?.[0]?.text || '';
      const parsed = extractJson(text);
      if (!parsed || !parsed.recommendation) {
        throw new Error('The analysis could not be parsed. Please try again.');
      }
      const bestType = parsed.bestBetType || parsed.betType || 'Best Bet';
      setAnalysis({
        ...parsed,
        sport: activeSport.label,
        matchup: parsed.matchup || currentMatchup,
        bestBetType: bestType,
        betType: parsed.betType || bestType,
        stake: Number(stake),
      });
    } catch (err) {
      setAnalysisError(err?.message || 'Unknown error analyzing this matchup.');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleNewAnalysis() {
    setAnalysis(null);
    setAnalysisError(null);
  }

  function openLogModal() {
    if (!analysis) return;
    setLogModal({
      sport: activeSport.id,
      sportLabel: activeSport.label,
      matchup: analysis.matchup,
      betType: analysis.betType,
      recommendation: analysis.recommendation,
      odds: analysis.odds || '',
      stake: analysis.stake || Number(stake),
      actualOdds: analysis.odds || '',
      sportsbook: 'DraftKings',
      result: 'pending',
      notes: '',
    });
  }

  function saveBet(form) {
    const stakeNum = Number(form.stake) || 0;
    const oddsForCalc = form.actualOdds || form.odds;
    const payout = computePayout(form.result, stakeNum, oddsForCalc);
    const newBet = {
      id: makeId(),
      date: new Date().toISOString(),
      sport: form.sport,
      sportLabel: form.sportLabel,
      matchup: form.matchup,
      betType: form.betType,
      recommendation: form.recommendation,
      odds: form.odds,
      stake: stakeNum,
      actualOdds: form.actualOdds,
      sportsbook: form.sportsbook,
      result: form.result,
      payout,
      notes: form.notes,
    };
    setBets((prev) => [newBet, ...prev]);
    setLogModal(null);
  }

  function updateBet(id, updates) {
    setBets((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const merged = { ...b, ...updates };
        const oddsForCalc = merged.actualOdds || merged.odds;
        merged.payout = computePayout(merged.result, Number(merged.stake) || 0, oddsForCalc);
        return merged;
      })
    );
  }

  function deleteBet(id) {
    setBets((prev) => prev.filter((b) => b.id !== id));
  }

  function clearAllBets() {
    if (window.confirm('Clear all bets? This cannot be undone.')) {
      setBets([]);
    }
  }

  return (
    <section className="container-page py-16 sm:py-20">
      <PageHeader
        eyebrow="Personal Tool"
        title="Sports Betting Analyzer"
        description="AI-powered analysis for Soccer, NFL, and College Basketball"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left: analysis tools (60%) */}
        <div className="space-y-6 lg:col-span-3">
          {!analysis && (
            <div className="card-surface">
              <div className="relative space-y-5 p-6">
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Matchup Analyzer
                </h2>

                {/* Sport tabs */}
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-ink-900/60 p-1">
                  {SPORTS.map((s) => {
                    const active = s.id === sport;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSport(s.id)}
                        className={
                          'flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition ' +
                          (active
                            ? 'bg-gradient-to-r from-accent-blue/30 to-accent-violet/30 text-white ring-1 ring-white/10'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white')
                        }
                      >
                        <span className="text-base">{s.icon}</span>
                        <span className="hidden sm:inline">{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Matchup picker */}
                <Field label="Matchup">
                  {gamesState === 'loading' ? (
                    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-slate-400">
                      <Spinner /> Loading upcoming {activeSport.label} games…
                    </div>
                  ) : useManual ? (
                    <>
                      <input
                        type="text"
                        value={manualMatchup}
                        onChange={(e) => setManualMatchup(e.target.value)}
                        placeholder="Enter matchup (e.g. Real Madrid vs Barcelona)"
                        className={inputClass}
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        Live odds unavailable — enter the matchup manually.
                      </p>
                    </>
                  ) : (
                    <select
                      value={selectedGameId}
                      onChange={(e) => setSelectedGameId(e.target.value)}
                      className={inputClass}
                    >
                      {games.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  )}
                </Field>

                <Field label="Stake ($)">
                  <input
                    type="number"
                    min="1"
                    value={stake}
                    onChange={(e) => setStake(e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Claude analyzes moneyline, spread, and over/under, then
                    recommends the single best bet.
                  </p>
                </Field>

                {/* Optional manual odds */}
                <div className="rounded-xl border border-white/10 bg-ink-900/40">
                  <button
                    type="button"
                    onClick={() => setShowOdds((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                  >
                    <span className="text-sm font-medium text-slate-200">
                      Enter Current Odds{' '}
                      <span className="text-slate-500">(optional)</span>
                    </span>
                    <Chevron open={showOdds} />
                  </button>

                  {showOdds && (
                    <div className="space-y-4 border-t border-white/10 px-4 py-4">
                      <p className="text-xs text-slate-500">
                        Leave blank and Claude will estimate fair market odds.
                        American format.
                      </p>

                      <OddsRow label="Moneyline" icon="💵">
                        <OddsInput
                          label="Home"
                          value={odds.mlHome}
                          onChange={setOddsField('mlHome')}
                          placeholder="e.g. -110"
                        />
                        <OddsInput
                          label="Away"
                          value={odds.mlAway}
                          onChange={setOddsField('mlAway')}
                          placeholder="e.g. +130"
                        />
                      </OddsRow>

                      <OddsRow label="Spread" icon="📊">
                        <OddsInput
                          label="Home spread"
                          value={odds.spreadHome}
                          onChange={setOddsField('spreadHome')}
                          placeholder="e.g. -3.5"
                        />
                        <OddsInput
                          label="Home odds"
                          value={odds.spreadHomeOdds}
                          onChange={setOddsField('spreadHomeOdds')}
                          placeholder="e.g. -110"
                        />
                        <OddsInput
                          label="Away odds"
                          value={odds.spreadAwayOdds}
                          onChange={setOddsField('spreadAwayOdds')}
                          placeholder="e.g. -110"
                        />
                      </OddsRow>

                      <OddsRow label="Over / Under" icon="🎯">
                        <OddsInput
                          label="Total"
                          value={odds.total}
                          onChange={setOddsField('total')}
                          placeholder="e.g. 47.5"
                        />
                        <OddsInput
                          label="Over odds"
                          value={odds.overOdds}
                          onChange={setOddsField('overOdds')}
                          placeholder="e.g. -110"
                        />
                        <OddsInput
                          label="Under odds"
                          value={odds.underOdds}
                          onChange={setOddsField('underOdds')}
                          placeholder="e.g. -110"
                        />
                      </OddsRow>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <Spinner /> Analyzing…
                    </>
                  ) : (
                    <>
                      <ChartIcon /> Analyze Matchup
                    </>
                  )}
                </button>

                {!currentMatchup && !analyzing && (
                  <p className="text-center text-xs text-slate-500">
                    Pick or enter a matchup to analyze.
                  </p>
                )}
              </div>
            </div>
          )}

          {analysisError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {analysisError}
            </div>
          )}

          {analyzing && <AnalyzingPanel matchup={currentMatchup} icon={activeSport.icon} />}

          {analysis && !analyzing && (
            <AnalysisCard
              analysis={analysis}
              icon={activeSport.icon}
              onLog={openLogModal}
              onReset={handleNewAnalysis}
            />
          )}
        </div>

        {/* Right: record / history (40%) */}
        <div className="lg:col-span-2">
          <RecordSidebar
            bets={bets}
            onUpdate={updateBet}
            onDelete={deleteBet}
            onClearAll={clearAllBets}
          />
        </div>
      </div>

      {logModal && (
        <LogBetModal
          initial={logModal}
          onClose={() => setLogModal(null)}
          onSave={saveBet}
        />
      )}
    </section>
  );
}

/* ---------- Analysis output ---------- */

function AnalysisCard({ analysis, icon, onLog, onReset }) {
  const confidence = clampNum(analysis.confidence, 0, 100);
  const stake = Number(analysis.stake) || 0;
  const payout = Number(analysis.potentialPayout);
  const factors = Array.isArray(analysis.keyFactors) ? analysis.keyFactors : [];
  const risks = Array.isArray(analysis.risks) ? analysis.risks : [];

  return (
    <div className="card-surface">
      <div className="relative space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {analysis.matchup}
              </h2>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {analysis.sport}
              </p>
            </div>
          </div>
          <VerdictBadge verdict={analysis.verdict} />
        </div>

        {/* Best bet banner */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent-blue/30 bg-gradient-to-r from-accent-blue/15 to-accent-violet/15 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-blue">
              ★ Best Bet
            </p>
            <p className="mt-0.5 text-lg font-bold text-white">
              {analysis.bestBetType || analysis.betType}
            </p>
          </div>
          <p className="text-right text-xs text-slate-400">
            Best value across all
            <br />
            three bet types
          </p>
        </div>

        {/* All bet types summary */}
        {analysis.allBetAnalysis && (
          <AllBetsSummary
            data={analysis.allBetAnalysis}
            bestBetType={analysis.bestBetType || analysis.betType}
          />
        )}

        {/* Recommendation + confidence */}
        <div className="rounded-xl border border-white/10 bg-ink-900/50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Recommendation · {analysis.bestBetType || analysis.betType}
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            {analysis.recommendation}
          </p>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Confidence</span>
            <span className="font-semibold text-white">{confidence}%</span>
          </div>
          <ConfidenceBar value={confidence} />
        </div>

        {/* Odds grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Listed Odds" value={analysis.odds || '—'} />
          <StatTile label="Implied Prob." value={analysis.impliedProbability || '—'} />
          <StatTile label="Our Prob." value={analysis.ourProbability || '—'} accent />
          <StatTile label="Edge" value={analysis.edge || '—'} accent />
        </div>

        {/* Payout */}
        <div className="flex items-center justify-between rounded-xl border border-accent-blue/25 bg-accent-blue/10 px-4 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent-blue">
              Potential Payout
            </p>
            <p className="text-xs text-slate-400">on a ${stake} stake</p>
          </div>
          <p className="text-xl font-bold text-white">
            {Number.isFinite(payout) ? `+$${payout.toFixed(2)}` : '—'}
          </p>
        </div>

        {/* Reasoning */}
        {analysis.reasoning && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Reasoning
            </p>
            <p className="text-sm leading-relaxed text-slate-300">
              {analysis.reasoning}
            </p>
          </div>
        )}

        {/* Key factors */}
        {factors.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Key Factors
            </p>
            <div className="flex flex-wrap gap-2">
              {factors.map((f, i) => (
                <span
                  key={i}
                  className="rounded-full border border-accent-violet/30 bg-accent-violet/10 px-3 py-1 text-xs font-medium text-violet-100"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {risks.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Risks
            </p>
            {risks.map((r, i) => (
              <div
                key={i}
                className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-100/90"
              >
                <span className="flex-none">⚠️</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Historical context */}
        {analysis.historicalContext && (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
              Historical Context
            </p>
            <p className="text-sm leading-relaxed text-slate-400">
              {analysis.historicalContext}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onLog}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-blue/20 transition hover:brightness-110"
          >
            <PlusIcon /> Log This Bet
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-ink-900/60 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-ink-900/90"
          >
            New Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const v = (verdict || '').toUpperCase();
  const styles =
    v === 'STRONG BET'
      ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
      : v === 'LEAN'
        ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
        : 'border-red-400/40 bg-red-400/15 text-red-300';
  return (
    <span
      className={`flex-none rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${styles}`}
    >
      {verdict || 'PASS'}
    </span>
  );
}

function AllBetsSummary({ data, bestBetType }) {
  const rows = [
    { key: 'moneyline', label: 'Moneyline', types: ['moneyline'], bet: data.moneyline },
    { key: 'spread', label: 'Spread', types: ['spread'], bet: data.spread },
    {
      key: 'overUnder',
      label: 'Over / Under',
      types: ['over', 'under', 'over/under', 'overunder'],
      bet: data.overUnder,
    },
  ];
  const best = (bestBetType || '').toLowerCase();

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        All Bet Types
      </p>
      <div className="space-y-2">
        {rows.map((row) => {
          if (!row.bet) return null;
          const isBest = row.types.includes(best);
          return (
            <div
              key={row.key}
              className={
                'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ' +
                (isBest
                  ? 'border-accent-blue/40 bg-accent-blue/10'
                  : 'border-white/10 bg-ink-900/40')
              }
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {row.label}
                  {isBest && (
                    <span className="rounded-full bg-accent-blue/20 px-1.5 py-0.5 text-[9px] font-bold text-accent-blue">
                      BEST
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-sm text-white">
                  {row.bet.pick || '—'}
                  {row.bet.odds ? (
                    <span className="text-slate-400"> · {row.bet.odds}</span>
                  ) : null}
                  {row.bet.edge ? (
                    <span className="text-slate-500"> · edge {row.bet.edge}</span>
                  ) : null}
                </p>
              </div>
              <VerdictBadge verdict={row.bet.verdict} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfidenceBar({ value }) {
  return (
    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.max(value, 2)}%`,
          background:
            'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
        }}
      />
    </div>
  );
}

function StatTile({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/40 px-3 py-2.5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold ${
          accent ? 'text-accent-blue' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AnalyzingPanel({ matchup, icon }) {
  return (
    <div className="card-surface">
      <div className="relative flex flex-col items-center gap-4 p-10 text-center">
        <Spinner large />
        <div>
          <p className="text-sm font-medium text-white">
            {icon} Analyzing {matchup}…
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Weighing recent form, head-to-head history, and the implied edge.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Record sidebar ---------- */

function RecordSidebar({ bets, onUpdate, onDelete, onClearAll }) {
  const stats = useMemo(() => computeStats(bets), [bets]);

  return (
    <div className="card-surface lg:sticky lg:top-24">
      <div className="relative space-y-5 p-6">
        <h2 className="text-lg font-semibold tracking-tight text-white">My Record</h2>

        {/* Headline stats */}
        <div className="grid grid-cols-2 gap-3">
          <BigStat
            label="Record (W-L-P)"
            value={`${stats.wins}-${stats.losses}-${stats.pending}`}
          />
          <BigStat
            label="ROI"
            value={`${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1)}%`}
            tone={stats.roi >= 0 ? 'pos' : 'neg'}
          />
          <BigStat label="Total Staked" value={`$${stats.totalStaked.toFixed(0)}`} />
          <BigStat
            label="Profit / Loss"
            value={`${stats.profit >= 0 ? '+' : '-'}$${Math.abs(stats.profit).toFixed(0)}`}
            tone={stats.profit >= 0 ? 'pos' : 'neg'}
          />
          <BigStat label="Win Rate" value={`${stats.winRate.toFixed(0)}%`} />
          <BigStat
            label="Best Win"
            value={stats.bestWin > 0 ? `+$${stats.bestWin.toFixed(0)}` : '—'}
            tone={stats.bestWin > 0 ? 'pos' : undefined}
          />
        </div>

        {/* By sport */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            By Sport
          </p>
          <div className="space-y-2">
            {SPORTS.map((s) => {
              const b = stats.bySport[s.id];
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-900/40 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 text-slate-300">
                    <span>{s.icon}</span>
                    <span className="text-xs">{s.label}</span>
                  </span>
                  <span className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      {b.wins}-{b.losses}-{b.pending}
                    </span>
                    <span
                      className={
                        'font-semibold ' +
                        (b.roi > 0
                          ? 'text-emerald-300'
                          : b.roi < 0
                            ? 'text-red-300'
                            : 'text-slate-400')
                      }
                    >
                      {b.staked > 0 ? `${b.roi >= 0 ? '+' : ''}${b.roi.toFixed(0)}%` : '—'}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent bets */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Recent Bets
          </p>
          {bets.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/15 bg-ink-900/40 px-3 py-6 text-center text-xs text-slate-500">
              No bets logged yet. Analyze a matchup and log your first bet.
            </p>
          ) : (
            <div className="space-y-2">
              {bets.map((bet) => (
                <BetRow
                  key={bet.id}
                  bet={bet}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>

        {bets.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/15"
          >
            Clear All Bets
          </button>
        )}
      </div>
    </div>
  );
}

function BigStat({ label, value, tone }) {
  const valueColor =
    tone === 'pos'
      ? 'text-emerald-300'
      : tone === 'neg'
        ? 'text-red-300'
        : 'text-accent-blue';
  return (
    <div className="rounded-xl border border-white/10 bg-ink-900/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${valueColor}`}>{value}</p>
    </div>
  );
}

function BetRow({ bet, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const sportMeta = SPORTS.find((s) => s.id === bet.sport);

  return (
    <div className="rounded-lg border border-white/10 bg-ink-900/40">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{sportMeta?.icon || '🎯'}</span>
            <p className="truncate text-sm font-medium text-white">{bet.matchup}</p>
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {bet.recommendation} · {bet.odds || bet.actualOdds || '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {formatDate(bet.date)} · ${bet.stake}
          </p>
        </div>
        <ResultBadge result={bet.result} />
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-white/10 px-3 py-3">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
            <span>Sportsbook: {bet.sportsbook || '—'}</span>
            <span>Bet type: {bet.betType || '—'}</span>
            <span>Placed odds: {bet.actualOdds || bet.odds || '—'}</span>
            <span>
              P/L:{' '}
              <span
                className={
                  bet.payout > 0
                    ? 'text-emerald-300'
                    : bet.payout < 0
                      ? 'text-red-300'
                      : 'text-slate-400'
                }
              >
                {bet.result === 'pending'
                  ? '—'
                  : `${bet.payout >= 0 ? '+' : '-'}$${Math.abs(bet.payout).toFixed(2)}`}
              </span>
            </span>
          </div>

          {bet.notes && <p className="text-xs italic text-slate-400">“{bet.notes}”</p>}

          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Update Result
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-ink-900/60 p-1">
              {['pending', 'won', 'lost'].map((r) => {
                const active = bet.result === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => onUpdate(bet.id, { result: r })}
                    className={
                      'rounded-md px-2 py-1 text-xs font-medium capitalize transition ' +
                      (active
                        ? r === 'won'
                          ? 'bg-emerald-500 text-ink-950'
                          : r === 'lost'
                            ? 'bg-red-500 text-white'
                            : 'bg-white/15 text-white'
                        : 'text-slate-300 hover:bg-white/5')
                    }
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDelete(bet.id)}
            className="text-xs font-medium text-red-300/80 transition hover:text-red-300"
          >
            Delete bet
          </button>
        </div>
      )}
    </div>
  );
}

function ResultBadge({ result }) {
  const map = {
    won: { label: 'WIN', cls: 'bg-emerald-400/15 text-emerald-300' },
    lost: { label: 'LOSS', cls: 'bg-red-400/15 text-red-300' },
    pending: { label: 'PENDING', cls: 'bg-white/10 text-slate-400' },
  };
  const m = map[result] || map.pending;
  return (
    <span
      className={`flex-none rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

/* ---------- Log bet modal ---------- */

function LogBetModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-base font-semibold tracking-tight text-white">Log This Bet</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 transition hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="rounded-xl border border-white/10 bg-ink-900/50 p-3">
            <p className="text-sm font-semibold text-white">{form.matchup}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {form.recommendation} · {form.betType}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Stake ($)">
              <input
                type="number"
                min="1"
                value={form.stake}
                onChange={set('stake')}
                className={inputClass}
              />
            </Field>
            <Field label="Actual Odds Placed">
              <input
                type="text"
                value={form.actualOdds}
                onChange={set('actualOdds')}
                placeholder="-110"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Sportsbook">
            <select value={form.sportsbook} onChange={set('sportsbook')} className={inputClass}>
              {SPORTSBOOKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Result">
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-ink-900/60 p-1">
              {['pending', 'won', 'lost'].map((r) => {
                const active = form.result === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, result: r }))}
                    className={
                      'rounded-md px-2 py-1.5 text-sm font-medium capitalize transition ' +
                      (active
                        ? r === 'won'
                          ? 'bg-emerald-500 text-ink-950'
                          : r === 'lost'
                            ? 'bg-red-500 text-white'
                            : 'bg-white/15 text-white'
                        : 'text-slate-300 hover:bg-white/5')
                    }
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Notes (optional)">
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Anything you want to remember about this bet…"
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        <div className="flex gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => onSave(form)}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-accent-blue to-accent-violet px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Save Bet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-ink-900/60 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-900/90"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Data helpers ---------- */

function loadBets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Normalize whatever shape the odds feed returns into a list of matchups.
function parseGames(data) {
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return arr
    .map((g, i) => {
      const home = g.home_team || g.homeTeam || g.home || '';
      const away = g.away_team || g.awayTeam || g.away || '';
      if (!home && !away) return null;
      const matchup = away && home ? `${away} vs ${home}` : home || away;
      const time = g.commence_time || g.commenceTime;
      const label = time ? `${matchup} · ${formatGameTime(time)}` : matchup;
      return {
        id: g.id || g.game_id || `${matchup}-${i}`,
        matchup,
        label,
        oddsSummary: summarizeOdds(g),
      };
    })
    .filter(Boolean);
}

function summarizeOdds(game) {
  const books = Array.isArray(game.bookmakers) ? game.bookmakers : [];
  if (books.length === 0) return '';
  const book = books[0];
  const markets = Array.isArray(book.markets) ? book.markets : [];
  const lines = markets
    .map((m) => {
      const outcomes = Array.isArray(m.outcomes) ? m.outcomes : [];
      const parts = outcomes
        .map((o) => {
          const price = o.price != null ? formatAmerican(o.price) : '';
          const point = o.point != null ? ` ${o.point}` : '';
          return `${o.name}${point} ${price}`.trim();
        })
        .join(', ');
      return parts ? `${m.key}: ${parts}` : '';
    })
    .filter(Boolean);
  if (lines.length === 0) return '';
  return `${book.title || book.key}: ${lines.join(' | ')}`;
}

// Build a readable block of any odds the user actually entered. Returns '' if none.
function formatManualOdds(o) {
  const lines = [];

  const ml = [
    o.mlHome.trim() ? `Home ${o.mlHome.trim()}` : null,
    o.mlAway.trim() ? `Away ${o.mlAway.trim()}` : null,
  ].filter(Boolean);
  if (ml.length) lines.push(`Moneyline — ${ml.join(', ')}`);

  const spread = [
    o.spreadHome.trim() ? `Home spread ${o.spreadHome.trim()}` : null,
    o.spreadHomeOdds.trim() ? `Home odds ${o.spreadHomeOdds.trim()}` : null,
    o.spreadAwayOdds.trim() ? `Away odds ${o.spreadAwayOdds.trim()}` : null,
  ].filter(Boolean);
  if (spread.length) lines.push(`Spread — ${spread.join(', ')}`);

  const ou = [
    o.total.trim() ? `Total ${o.total.trim()}` : null,
    o.overOdds.trim() ? `Over ${o.overOdds.trim()}` : null,
    o.underOdds.trim() ? `Under ${o.underOdds.trim()}` : null,
  ].filter(Boolean);
  if (ou.length) lines.push(`Over/Under — ${ou.join(', ')}`);

  return lines.length ? '\n' + lines.map((l) => `- ${l}`).join('\n') : '';
}

function formatAmerican(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return String(price);
  // Decimal odds from the feed → American.
  if (n > 0 && n < 100) {
    const american = n >= 2 ? (n - 1) * 100 : -100 / (n - 1);
    const rounded = Math.round(american);
    return rounded > 0 ? `+${rounded}` : `${rounded}`;
  }
  return n > 0 ? `+${n}` : `${n}`;
}

function computePayout(result, stake, odds) {
  if (result === 'won') return americanProfit(odds, stake);
  if (result === 'lost') return -Math.abs(stake);
  return 0;
}

// Profit (excluding stake) from American odds.
function americanProfit(odds, stake) {
  const n = parseAmerican(odds);
  if (!Number.isFinite(n) || n === 0) return 0;
  return n > 0 ? stake * (n / 100) : stake * (100 / Math.abs(n));
}

function parseAmerican(odds) {
  if (typeof odds === 'number') return odds;
  if (!odds) return NaN;
  return Number(String(odds).replace(/[^0-9.+-]/g, ''));
}

function computeStats(bets) {
  const base = () => ({ wins: 0, losses: 0, pending: 0, staked: 0, profit: 0, roi: 0 });
  const bySport = { soccer: base(), nfl: base(), ncaab: base() };

  let wins = 0;
  let losses = 0;
  let pending = 0;
  let totalStaked = 0;
  let profit = 0;
  let bestWin = 0;

  for (const bet of bets) {
    const stake = Number(bet.stake) || 0;
    const payout = Number(bet.payout) || 0;
    const bucket = bySport[bet.sport];

    if (bet.result === 'won') {
      wins += 1;
      if (bucket) bucket.wins += 1;
      if (payout > bestWin) bestWin = payout;
    } else if (bet.result === 'lost') {
      losses += 1;
      if (bucket) bucket.losses += 1;
    } else {
      pending += 1;
      if (bucket) bucket.pending += 1;
    }

    // Only settled bets count toward staked/ROI.
    if (bet.result !== 'pending') {
      totalStaked += stake;
      profit += payout;
      if (bucket) {
        bucket.staked += stake;
        bucket.profit += payout;
      }
    }
  }

  for (const key of Object.keys(bySport)) {
    const b = bySport[key];
    b.roi = b.staked > 0 ? (b.profit / b.staked) * 100 : 0;
  }

  const settled = wins + losses;
  return {
    wins,
    losses,
    pending,
    totalStaked,
    profit,
    bestWin,
    roi: totalStaked > 0 ? (profit / totalStaked) * 100 : 0,
    winRate: settled > 0 ? (wins / settled) * 100 : 0,
    bySport,
  };
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

function clampNum(value, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function makeId() {
  return `bet-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatGameTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/* ---------- Small UI pieces ---------- */

const inputClass =
  'w-full rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-accent-blue/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/30';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function OddsRow({ label, icon, children }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        <span>{icon}</span>
        {label}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>
    </div>
  );
}

function OddsInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClass}
      />
      <span className="mt-1 block text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

function Chevron({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 flex-none text-slate-400 transition-transform ${
        open ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Spinner({ large = false }) {
  return (
    <span
      className={
        'inline-block animate-spin rounded-full border-2 border-white/20 border-t-accent-blue ' +
        (large ? 'h-8 w-8' : 'h-4 w-4')
      }
      aria-hidden="true"
    />
  );
}

function ChartIcon() {
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
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 5-6" />
    </svg>
  );
}

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
