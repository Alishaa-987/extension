import { daysLeft } from '../lib/nextAction.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// The "pop-up when I open my laptop" moment: a brief shown every time the app opens.
export default function StartupBrief({ debt, top, onRescue, onDismiss }) {
  if (top.length === 0) return null;
  return (
    <section className="brief" role="status">
      <div>
        <h2>{greeting()} 👋 Here's your opportunity brief</h2>
        <p>
          <strong>{top.length}</strong> opportunit{top.length === 1 ? 'y needs' : 'ies need'} attention
          {debt.expiringThisWeek > 0 && (
            <>
              {' '}· <strong>{debt.expiringThisWeek}</strong> expire this week
            </>
          )}
          .
        </p>
        <ul>
          {top.map((o) => {
            const d = daysLeft(o.deadline);
            return (
              <li key={o.id}>
                {o.title} — {d === null ? 'no deadline found' : d === 0 ? 'due today' : `${d} day${d === 1 ? '' : 's'} left`}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="brief-actions">
        <button className="btn danger" onClick={onRescue}>
          🚨 Start Rescue Mode
        </button>
        <button className="btn ghost" onClick={onDismiss}>
          Later
        </button>
      </div>
    </section>
  );
}
