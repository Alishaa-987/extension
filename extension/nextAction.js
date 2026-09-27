// extension/nextAction.js — plain script version (no ES module syntax).
// Logic is identical to src/lib/nextAction.js; importScripts-compatible.

var STATUSES = ['saved', 'reviewing', 'started', 'applied', 'accepted', 'rejected'];

var STATUS_LABEL = {
  saved: 'Saved',
  reviewing: 'Reviewing',
  started: 'Started',
  applied: 'Applied',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

var DONE = ['applied', 'accepted', 'rejected'];
var DAY = 24 * 60 * 60 * 1000;

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysLeft(deadline, today) {
  today = today || new Date();
  if (!deadline) return null;
  var parts = deadline.split('-').map(Number);
  return Math.round((new Date(parts[0], parts[1] - 1, parts[2]) - startOfDay(today)) / DAY);
}

function urgency(opp, today) {
  today = today || new Date();
  if (DONE.includes(opp.status)) return 'done';
  var d = daysLeft(opp.deadline, today);
  if (d === null) return 'unknown';
  if (d < 0) return 'expired';
  if (d <= 2) return 'critical';
  if (d <= 7) return 'high';
  if (d <= 21) return 'medium';
  return 'low';
}

function nextAction(opp, today) {
  today = today || new Date();
  var d = daysLeft(opp.deadline, today);
  var skills = (opp.skills || []).slice(0, 3).join(', ');

  if (opp.status === 'accepted') return { label: 'Celebrate, then confirm next steps with the organizer', advanceTo: null };
  if (opp.status === 'rejected') return { label: 'Note what to improve and look for a similar opportunity', advanceTo: null };
  if (opp.status === 'applied')  return { label: 'Wait for a reply — follow up if silent after 2 weeks', advanceTo: null };
  if (d !== null && d < 0)       return { label: 'Deadline passed — archive it or look for next cycle', advanceTo: null };
  if (d === null && opp.status === 'saved') return { label: 'Find the deadline on the official page', advanceTo: 'reviewing' };

  if (opp.status === 'saved') {
    return d <= 2
      ? { label: 'Decide now: apply today or drop it', advanceTo: 'started' }
      : { label: 'Check eligibility (5 minutes)', advanceTo: 'reviewing' };
  }
  if (opp.status === 'reviewing') {
    return { label: skills ? 'Tailor your resume for ' + skills : 'Prepare your resume / CV', advanceTo: 'started' };
  }
  if (opp.status === 'started') {
    return d !== null && d <= 2
      ? { label: 'Submit the application today', advanceTo: 'applied' }
      : { label: 'Finish the application questions', advanceTo: 'applied' };
  }
  return { label: 'Review this opportunity', advanceTo: 'reviewing' };
}
