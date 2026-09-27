// Deadline, urgency, Next Action and Opportunity Debt — pure, rule-based, testable.

export const STATUSES = ['saved', 'reviewing', 'started', 'applied', 'accepted', 'rejected'];

export const STATUS_LABEL = {
  saved: 'Saved',
  reviewing: 'Reviewing',
  started: 'Started',
  applied: 'Applied',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

const DONE = ['applied', 'accepted', 'rejected'];
const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysLeft(deadline, today = new Date()) {
  if (!deadline) return null;
  const [y, m, d] = deadline.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - startOfDay(today)) / DAY);
}

export function isExpired(opp, today = new Date()) {
  const d = daysLeft(opp.deadline, today);
  return d !== null && d < 0 && !DONE.includes(opp.status);
}

/** critical 0–2 · high 3–7 · medium 8–21 · low 22+ · unknown (no deadline) · expired · done */
export function urgency(opp, today = new Date()) {
  if (DONE.includes(opp.status)) return 'done';
  const d = daysLeft(opp.deadline, today);
  if (d === null) return 'unknown';
  if (d < 0) return 'expired';
  if (d <= 2) return 'critical';
  if (d <= 7) return 'high';
  if (d <= 21) return 'medium';
  return 'low';
}

/** One concrete step the user should take right now. */
export function nextAction(opp, today = new Date()) {
  const d = daysLeft(opp.deadline, today);
  const skills = (opp.skills || []).slice(0, 3).join(', ');

  switch (opp.status) {
    case 'accepted':
      return { label: 'Celebrate, then confirm next steps with the organizer', advanceTo: null };
    case 'rejected':
      return { label: 'Note what to improve and look for a similar opportunity', advanceTo: null };
    case 'applied':
      return { label: 'Wait for a reply — follow up if silent after 2 weeks', advanceTo: null };
  }
  if (d !== null && d < 0) return { label: 'Deadline passed — archive it or look for next cycle', advanceTo: null };
  if (d === null && opp.status === 'saved') {
    return { label: 'Find the deadline on the official page', advanceTo: 'reviewing' };
  }

  if (opp.status === 'saved') {
    return d <= 2
      ? { label: 'Decide now: apply today or drop it', advanceTo: 'started' }
      : { label: 'Check eligibility (5 minutes)', advanceTo: 'reviewing' };
  }
  if (opp.status === 'reviewing') {
    return {
      label: skills ? `Tailor your resume for ${skills}` : 'Prepare your resume / CV',
      advanceTo: 'started',
    };
  }
  if (opp.status === 'started') {
    return d !== null && d <= 2
      ? { label: 'Submit the application today', advanceTo: 'applied' }
      : { label: 'Finish the application questions', advanceTo: 'applied' };
  }
  return { label: 'Review this opportunity', advanceTo: 'reviewing' };
}

const URGENCY_WEIGHT = { critical: 100, high: 70, medium: 40, unknown: 25, low: 10, expired: -1, done: -1 };
const STATUS_WEIGHT = { saved: 30, reviewing: 20, started: 10 };

/** Higher = more at risk. Used to sort Rescue Mode. */
export function rescueScore(opp, today = new Date()) {
  const u = urgency(opp, today);
  if (URGENCY_WEIGHT[u] < 0) return -1;
  return URGENCY_WEIGHT[u] + (STATUS_WEIGHT[opp.status] || 0);
}

/** Opportunity Debt: live opportunities saved but not meaningfully acted on. */
export function opportunityDebt(opps, today = new Date()) {
  const live = opps.filter((o) => !DONE.includes(o.status) && !isExpired(o, today));
  const debt = live.filter((o) => o.status === 'saved' || o.status === 'reviewing');
  return {
    count: debt.length,
    expiringThisWeek: debt.filter((o) => {
      const d = daysLeft(o.deadline, today);
      return d !== null && d <= 7;
    }).length,
    noDeadline: debt.filter((o) => !o.deadline).length,
    expired: opps.filter((o) => isExpired(o, today)).length,
  };
}

export function rescueList(opps, limit = 3, today = new Date()) {
  return opps
    .map((o) => ({ o, s: rescueScore(o, today) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.o);
}
