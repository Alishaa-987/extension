import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateICS } from '../src/lib/calendar.js';

const FIXED_NOW = new Date(2026, 8, 27); // Sep 27 2026 — deterministic DTSTAMP

const OPP = {
  id: 'sample_1',
  title: 'Open Source Fellowship',
  deadline: '2026-10-15',
  url: 'https://example.org/fellowship',
};

test('DTSTART is the deadline date', () => {
  const ics = generateICS(OPP, FIXED_NOW);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261015'));
});

test('DTEND is the day after the deadline', () => {
  const ics = generateICS(OPP, FIXED_NOW);
  assert.ok(ics.includes('DTEND;VALUE=DATE:20261016'));
});

test('SUMMARY contains the opportunity title', () => {
  const ics = generateICS(OPP, FIXED_NOW);
  assert.ok(ics.includes('SUMMARY:Open Source Fellowship'));
});

test('UID matches opp.id', () => {
  const ics = generateICS(OPP, FIXED_NOW);
  assert.ok(ics.includes('UID:sample_1'));
});

test('VALARM trigger is 2 days before', () => {
  const ics = generateICS(OPP, FIXED_NOW);
  assert.ok(ics.includes('TRIGGER:-P2D'));
});

test('DESCRIPTION contains the url when present', () => {
  const ics = generateICS(OPP, FIXED_NOW);
  assert.ok(ics.includes('DESCRIPTION:https://example.org/fellowship'));
});

test('DESCRIPTION line is omitted when url is absent', () => {
  const ics = generateICS({ ...OPP, url: null }, FIXED_NOW);
  // VALARM contains "DESCRIPTION:Reminder" — check url-carrying line specifically
  assert.ok(!ics.includes('DESCRIPTION:https://'));
});

test('null deadline returns null', () => {
  assert.equal(generateICS({ ...OPP, deadline: null }, FIXED_NOW), null);
});

test('null input returns null', () => {
  assert.equal(generateICS(null), null);
});

test('all lines end with CRLF (RFC 5545)', () => {
  const ics = generateICS(OPP, FIXED_NOW);
  // Every line break must be \r\n — no bare \n should appear
  assert.ok(!ics.replace(/\r\n/g, '').includes('\n'));
});

test('DTEND rolls over correctly at month-end', () => {
  const ics = generateICS({ ...OPP, deadline: '2026-10-31' }, FIXED_NOW);
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261031'));
  assert.ok(ics.includes('DTEND;VALUE=DATE:20261101'));
});
