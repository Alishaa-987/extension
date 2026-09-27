import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeOpportunity, extractDeadline } from '../src/lib/extractor.js';
import { nextAction, urgency, opportunityDebt } from '../src/lib/nextAction.js';

const TODAY = new Date(2026, 8, 27); // Sep 27 2026

test('extracts a labelled deadline', () => {
  const r = analyzeOpportunity(
    'Open Source Fellowship\nOrganization: Example Org\nOpen to undergraduate students.\nApplications close on October 15, 2026. Remote program using Python and Git.',
    '', TODAY);
  assert.equal(r.deadline, '2026-10-15');
  assert.equal(r.type, 'fellowship');
  assert.equal(r.organization, 'Example Org');
  assert.ok(r.skills.includes('Python'));
  assert.equal(r.location, 'Remote / Online');
});

test('never invents a deadline when dates are unlabelled', () => {
  const r = extractDeadline('The program starts on March 3, 2027 and runs 8 weeks.', TODAY);
  assert.equal(r.deadline, null);
  assert.match(r.note, /none labelled/);
});

test('no date at all -> null', () => {
  assert.equal(extractDeadline('Apply soon, spots are limited!', TODAY).deadline, null);
});

test('day-month format and inferred year', () => {
  const r = extractDeadline('Deadline: 5 Jan', TODAY);
  assert.equal(r.deadline, '2027-01-05');
  assert.match(r.note, /Year not stated/);
});

test('ISO date', () => {
  assert.equal(extractDeadline('Apply by 2026-10-01.', TODAY).deadline, '2026-10-01');
});

test('too-short input throws', () => {
  assert.throws(() => analyzeOpportunity('hi'));
});

test('urgency and next action', () => {
  const soon = { deadline: '2026-09-28', status: 'saved' };
  assert.equal(urgency(soon, TODAY), 'critical');
  assert.match(nextAction(soon, TODAY).label, /Decide now/);
  assert.equal(urgency({ deadline: '2026-09-20', status: 'saved' }, TODAY), 'expired');
  assert.equal(urgency({ deadline: null, status: 'saved' }, TODAY), 'unknown');
  assert.match(nextAction({ deadline: null, status: 'saved' }, TODAY).label, /Find the deadline/);
  assert.match(nextAction({ deadline: '2026-09-28', status: 'started' }, TODAY).label, /Submit/);
});

test('opportunity debt', () => {
  const d = opportunityDebt([
    { deadline: '2026-09-29', status: 'saved' },
    { deadline: '2026-12-01', status: 'reviewing' },
    { deadline: '2026-09-29', status: 'applied' },
    { deadline: '2026-09-01', status: 'saved' },
  ], TODAY);
  assert.deepEqual(d, { count: 2, expiringThisWeek: 1, noDeadline: 0, expired: 1 });
});

test('"Deadline: 15th Oct" — ordinal DMY, year inferred', () => {
  const r = extractDeadline('Deadline: 15th Oct', TODAY);
  assert.equal(r.deadline, '2026-10-15');
  assert.match(r.note, /Year not stated/);
});

test('"Apply by Nov 3" — MDY no year, inferred', () => {
  const r = extractDeadline('Apply by Nov 3', TODAY);
  assert.equal(r.deadline, '2026-11-03');
  assert.match(r.note, /Year not stated/);
});

test('two dates in text — only the labelled one is the deadline', () => {
  const r = extractDeadline(
    'The program runs from January 10, 2027 to March 20, 2027. Deadline: February 1, 2027.',
    TODAY
  );
  assert.equal(r.deadline, '2027-02-01');
});

test('date present but not labelled — deadline stays null', () => {
  const r = extractDeadline(
    'The cohort begins on October 5, 2026 and runs for ten weeks.',
    TODAY
  );
  assert.equal(r.deadline, null);
  assert.match(r.note, /none labelled/);
});

test('scholarship with no organization', () => {
  const r = analyzeOpportunity(
    'Global Merit Scholarship\nA scholarship for outstanding undergraduate students worldwide.\nAward covers tuition for one academic year.\nApply by December 15, 2026.',
    '', TODAY
  );
  assert.equal(r.type, 'scholarship');
  assert.equal(r.organization, null);
  assert.ok(r.missing.includes('organization'));
  assert.equal(r.deadline, '2026-12-15');
});
