import { useState, useEffect } from 'react';
import { analyzeOpportunity } from '../lib/extractor.js';
import { nextAction } from '../lib/nextAction.js';
import { SAMPLE_PASTE_TEXT } from '../data/samples.js';
import { deadlineText } from './OpportunityCard.jsx';

const STEPS = ['Reading text…', 'Looking for a labelled deadline…', 'Checking eligibility…', 'Choosing next action…'];

export default function AnalyzePanel({ onSave, onClose }) {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function run() {
    setError('');
    setResult(null);
    let analysis;
    try {
      analysis = analyzeOpportunity(text, url);
    } catch (e) {
      setError(e.message);
      return;
    }
    // Short staged progress so the user can see what is being checked.
    STEPS.forEach((_, i) => setTimeout(() => setStep(i), i * 250));
    setTimeout(() => {
      setStep(-1);
      setResult(analysis);
    }, STEPS.length * 250);
  }

  function update(field, value) {
    setResult((r) => ({ ...r, [field]: value || null }));
  }

  const preview = result ? nextAction({ ...result, status: 'saved' }) : null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Add opportunity">
        <div className="modal-head">
          <h2>Analyze an opportunity</h2>
          <button className="icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!result && (
          <>
            <label className="field">
              Paste the opportunity text (from the official page)
              <textarea
                rows={9}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Title, description, eligibility, deadline…"
              />
            </label>
            <label className="field">
              Link (optional)
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            </label>
            {error && <p className="error">{error}</p>}
            {step >= 0 && <p className="progress">⏳ {STEPS[step]}</p>}
            <div className="row">
              <button className="btn ghost" onClick={() => setText(SAMPLE_PASTE_TEXT)}>
                Use example text
              </button>
              <button className="btn primary" onClick={run} disabled={step >= 0}>
                Analyze
              </button>
            </div>
          </>
        )}

        {result && (
          <div className="result">
            <p className="ok">✓ Analysis complete — edit anything that looks wrong.</p>
            <label className="field">
              Title
              <input value={result.title || ''} onChange={(e) => update('title', e.target.value)} />
            </label>
            <div className="two">
              <label className="field">
                Organization
                <input value={result.organization || ''} onChange={(e) => update('organization', e.target.value)} placeholder="Not found" />
              </label>
              <label className="field">
                Type
                <input value={result.type || ''} onChange={(e) => update('type', e.target.value)} placeholder="Not found" />
              </label>
            </div>
            <div className="two">
              <label className="field">
                Deadline
                <input type="date" value={result.deadline || ''} onChange={(e) => update('deadline', e.target.value)} />
                <small>{deadlineText(result.deadline)}</small>
              </label>
              <label className="field">
                Location
                <input value={result.location || ''} onChange={(e) => update('location', e.target.value)} placeholder="Not found" />
              </label>
            </div>
            {result.deadlineNote && <p className="note">ℹ️ {result.deadlineNote}</p>}
            {result.deadlineSource && <p className="note">Source: “{result.deadlineSource}”</p>}
            {result.eligibility.length > 0 && (
              <div className="block">
                <span className="lbl">Eligibility</span>
                <ul>
                  {result.eligibility.map((e) => (
                    <li key={e}>✓ {e}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.skills.length > 0 && (
              <div className="chips">
                {result.skills.map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {result.summary && <p className="summary">{result.summary}</p>}
            {result.missing.length > 0 && (
              <p className="note">Not stated in the text: {result.missing.join(', ')}.</p>
            )}
            <div className="next">
              <span className="next-lbl">NEXT ACTION</span>
              <p>→ {preview.label}</p>
            </div>
            <div className="row">
              <button className="btn ghost" onClick={() => setResult(null)}>
                Back
              </button>
              <button className="btn primary" onClick={() => onSave(result)}>
                Save opportunity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
