import { useEffect } from 'react';
import { nextAction, STATUS_LABEL } from '../lib/nextAction.js';
import { deadlineText } from './OpportunityCard.jsx';

function why(opp) {
  if (opp.status === 'saved') return "You saved it but haven't opened it since.";
  if (opp.status === 'reviewing') return "You're reviewing it but haven't started applying.";
  if (opp.status === 'started') return "You started — don't let it slip now.";
  return '';
}

export default function RescueMode({ items, onStatus, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal rescue" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Rescue Mode">
        <div className="modal-head">
          <h2>🚨 Rescue Mode</h2>
          <button className="icon" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {items.length === 0 ? (
          <p className="ok">Nothing at risk. You're all caught up. 🎉</p>
        ) : (
          <>
            <p>
              {items.length} opportunit{items.length === 1 ? 'y is' : 'ies are'} at risk. Do one step for each:
            </p>
            <ol className="rescue-list">
              {items.map((o) => {
                const a = nextAction(o);
                return (
                  <li key={o.id}>
                    <div className="rescue-title">
                      <strong>{o.title}</strong>
                      <span className="deadline">⏰ {deadlineText(o.deadline)}</span>
                    </div>
                    <p className="why">{why(o)}</p>
                    <p className="next-inline">→ {a.label}</p>
                    <div className="row">
                      {a.advanceTo && (
                        <button className="btn small primary" onClick={() => onStatus(o.id, a.advanceTo)}>
                          Mark as {STATUS_LABEL[a.advanceTo]} →
                        </button>
                      )}
                      {o.url && (
                        <a className="btn small ghost" href={o.url} target="_blank" rel="noreferrer">
                          Open page ↗
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
