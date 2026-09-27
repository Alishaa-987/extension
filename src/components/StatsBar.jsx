export default function StatsBar({ opps, debt, onRescue }) {
  const applied = opps.filter((o) => ['applied', 'accepted', 'rejected'].includes(o.status)).length;
  return (
    <section className="stats">
      <div className="stat">
        <span className="num">{opps.length}</span>
        <span className="lbl">Saved</span>
      </div>
      <div className="stat">
        <span className="num">{applied}</span>
        <span className="lbl">Applied</span>
      </div>
      <div className="stat warn">
        <span className="num">{debt.expiringThisWeek}</span>
        <span className="lbl">Expiring this week</span>
      </div>
      <div className="stat muted">
        <span className="num">{debt.expired}</span>
        <span className="lbl">Already expired</span>
      </div>
      <div className="debt">
        <div>
          <span className="debt-title">⚠️ Opportunity Debt</span>
          <p>
            <strong>{debt.count}</strong> saved opportunit{debt.count === 1 ? 'y has' : 'ies have'} had no real action
            {debt.noDeadline > 0 && ` · ${debt.noDeadline} missing a deadline`}.
          </p>
        </div>
        <button className="btn danger" onClick={onRescue} disabled={debt.count === 0}>
          Rescue now
        </button>
      </div>
    </section>
  );
}
