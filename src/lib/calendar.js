// Pure function: opportunity -> iCalendar (.ics) string.
// No side-effects, no DOM, no dependencies.
// Returns null if the opportunity has no deadline.

/** Format a Date as YYYYMMDD for all-day iCal events. */
function icsDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}${mm}${dd}`;
}

/** Format a Date as YYYYMMDDTHHmmssZ (UTC) for DTSTAMP. */
function icsStamp(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Build a valid RFC 5545 iCalendar string for a single all-day event
 * on the opportunity's deadline, with a 2-day-before VALARM reminder.
 *
 * @param {object} opp - opportunity object with at least { id, title, deadline, url }
 * @param {Date}   now - injectable for tests; defaults to new Date()
 * @returns {string|null}
 */
export function generateICS(opp, now = new Date()) {
  if (!opp || !opp.deadline) return null;

  const [y, m, d] = opp.deadline.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 1); // all-day: end = next day

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Opportunity Rescue//EN',
    'BEGIN:VEVENT',
    `UID:${opp.id}`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${opp.title}`,
    ...(opp.url ? [`DESCRIPTION:${opp.url}`] : []),
    'BEGIN:VALARM',
    'TRIGGER:-P2D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n') + '\r\n';
}
