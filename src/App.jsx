import { useEffect, useMemo, useState } from 'react';
import { loadOpportunities, saveOpportunities, resetToSamples, newId } from './lib/storage.js';
import { opportunityDebt, rescueList, rescueScore, urgency } from './lib/nextAction.js';
import StartupBrief from './components/StartupBrief.jsx';
import StatsBar from './components/StatsBar.jsx';
import AnalyzePanel from './components/AnalyzePanel.jsx';
import OpportunityCard from './components/OpportunityCard.jsx';
import RescueMode from './components/RescueMode.jsx';

const FILTERS = [
  { id: 'attention', label: 'Needs attention', test: (u) => ['critical', 'high'].includes(u) },
  { id: 'upcoming', label: 'Upcoming', test: (u) => ['medium', 'low', 'unknown'].includes(u) },
  { id: 'done', label: 'Applied', test: (u) => u === 'done' },
  { id: 'expired', label: 'Expired', test: (u) => u === 'expired' },
  { id: 'all', label: 'All', test: () => true },
];

export default function App() {
  const [opps, setOpps] = useState(loadOpportunities);
  const [filter, setFilter] = useState('attention');
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [showRescue, setShowRescue] = useState(false);
  const [showBrief, setShowBrief] = useState(true);

  useEffect(() => saveOpportunities(opps), [opps]);

  const debt = useMemo(() => opportunityDebt(opps), [opps]);
  const rescue = useMemo(() => rescueList(opps, 3), [opps]);

  const visible = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    return opps
      .filter((o) => f.test(urgency(o)))
      .sort((a, b) => rescueScore(b) - rescueScore(a));
  }, [opps, filter]);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, opps.filter((o) => f.test(urgency(o))).length])),
    [opps]
  );

  function addOpportunity(analysis) {
    const opp = { ...analysis, id: newId(), status: 'saved', savedAt: new Date().toISOString().slice(0, 10) };
    setOpps((prev) => [opp, ...prev]);
    setShowAnalyze(false);
    setFilter('all');
  }

  function setStatus(id, status) {
    setOpps((prev) => prev.map((o) => (o.id === id ? { ...o, status, updatedAt: Date.now() } : o)));
  }

  function remove(id) {
    setOpps((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">⛑</span>
          <div>
            <h1>Opportunity Rescue</h1>
            <p className="tagline">Don't just save opportunities. Rescue them before they disappear.</p>
          </div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => setOpps(resetToSamples())} title="Reload demo data">
            Reset demo
          </button>
          <button className="btn primary" onClick={() => setShowAnalyze(true)}>
            + Add opportunity
          </button>
        </div>
      </header>

      {showBrief && (
        <StartupBrief
          debt={debt}
          top={rescue}
          onRescue={() => {
            setShowBrief(false);
            setShowRescue(true);
          }}
          onDismiss={() => setShowBrief(false)}
        />
      )}

      <StatsBar opps={opps} debt={debt} onRescue={() => setShowRescue(true)} />

      <nav className="tabs">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`tab ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label} <span className="count">{counts[f.id]}</span>
          </button>
        ))}
      </nav>

      <main className="grid">
        {visible.length === 0 ? (
          <div className="empty">
            <p>Nothing here.</p>
            <button className="btn primary" onClick={() => setShowAnalyze(true)}>
              Add an opportunity
            </button>
          </div>
        ) : (
          visible.map((o) => (
            <OpportunityCard key={o.id} opp={o} onStatus={setStatus} onRemove={remove} />
          ))
        )}
      </main>

      {showAnalyze && <AnalyzePanel onSave={addOpportunity} onClose={() => setShowAnalyze(false)} />}
      {showRescue && (
        <RescueMode items={rescue} onStatus={setStatus} onClose={() => setShowRescue(false)} />
      )}

      <footer className="footer">
        Built with IBM Bob 2.0 · Data stays in your browser (localStorage)
      </footer>
    </div>
  );
}
