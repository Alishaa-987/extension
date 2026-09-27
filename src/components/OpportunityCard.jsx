import { daysLeft, nextAction, urgency, STATUSES, STATUS_LABEL } from '../lib/nextAction.js';
import { generateICS } from '../lib/calendar.js';

function downloadICS(opp) {
  const ics = generateICS(opp);
  if (!ics) return;
  const a = document.createElement('a');
  a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  a.download = `${opp.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
  a.click();
}

const URGENCY_LABEL = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  unknown: 'No deadline',
  expired: 'Expired',
  done: 'Done',
};

export function deadlineText(deadline) {
  const d = daysLeft(deadline);
  if (d === null) return 'No deadline found';
  if (d < 0) return `Closed ${-d} day${d === -1 ? '' : 's'} ago`;
  if (d === 0) return 'Due today';
  return `${d} day${d === 1 ? '' : 's'} left`;
}

export default function OpportunityCard({ opp, onStatus, onRemove }) {
  const u = urgency(opp);
  const action = nextAction(opp);

  return (
    <article className={`card u-${u}`}>
      <div className="card-head">
        <span className={`pill u-${u}`}>{URGENCY_LABEL[u]}</span>
        {opp.type && <span className="pill type">{opp.type}</span>}
        <button className="icon" onClick={() => onRemove(opp.id)} aria-label="Delete opportunity" title="Delete">
          ×
        </button>
      </div>

      <h3>{opp.title}</h3>
      {opp.organization && <p className="org">{opp.organization}</p>}

      <p className="deadline">
        ⏰ {deadlineText(opp.deadline)}
        {opp.deadline && <span className="date"> · {opp.deadline}</span>}
      </p>

      {opp.summary && <p className="summary">{opp.summary}</p>}

      {opp.skills?.length > 0 && (
        <div className="chips">
          {opp.skills.slice(0, 5).map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      )}

      <div className="next" aria-live="polite">
        <span className="next-lbl">NEXT ACTION</span>
        <p>→ {action.label}</p>
        {action.advanceTo && (
          <button className="btn small primary" onClick={() => onStatus(opp.id, action.advanceTo)}>
            Mark as {STATUS_LABEL[action.advanceTo]} →
          </button>
        )}
      </div>

      <div className="card-foot">
        <select value={opp.status} onChange={(e) => onStatus(opp.id, e.target.value)} aria-label="Status">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {opp.url && (
          <a className="btn small ghost" href={opp.url} target="_blank" rel="noreferrer">
            Open page ↗
          </a>
        )}
        {opp.deadline && (
          <button className="btn small ghost" onClick={() => downloadICS(opp)}>
            📅 Add to calendar
          </button>
        )}
      </div>
    </article>
  );
}
