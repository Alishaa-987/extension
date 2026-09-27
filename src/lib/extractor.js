// Rule-based opportunity extractor.
// Golden rule: only return what the text actually says. Unknown -> null.

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

const DEADLINE_WORDS =
  /(deadline|apply by|applications? (close|closes|due)|closes? on|closing date|last date|due (date|by)|submit by|until|before|ends? on|register by)/i;

const TYPE_KEYWORDS = {
  fellowship: ['fellowship', 'fellow'],
  internship: ['internship', 'intern '],
  hackathon: ['hackathon', 'hack'],
  scholarship: ['scholarship', 'tuition', 'funding'],
  research: ['research program', 'research internship', 'research assistant', 'lab'],
  job: ['full-time', 'full time', 'job', 'hiring', 'position', 'role'],
  competition: ['competition', 'contest', 'challenge'],
};

const SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'React', 'Node.js',
  'Express', 'MongoDB', 'SQL', 'Git', 'GitHub', 'Docker', 'Kubernetes', 'AWS', 'Azure',
  'Machine Learning', 'Deep Learning', 'NLP', 'LLM', 'Data Analysis', 'Figma',
  'HTML', 'CSS', 'Linux', 'TensorFlow', 'PyTorch', 'Communication', 'Leadership',
];

const ELIGIBILITY_HINTS =
  /(eligib|open to|applicants must|must be|who can apply|requirements?:|undergraduate|graduate students|students? (in|from|of)|years? of experience)/i;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Find every date-like string in the text with its position. */
export function findDates(text, today = new Date()) {
  const results = [];
  const monthNames = Object.keys(MONTHS).join('|');

  // 2026-10-15
  for (const m of text.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) {
    results.push({ index: m.index, raw: m[0], date: new Date(+m[1], +m[2] - 1, +m[3]), yearInferred: false });
  }
  // October 15, 2026  |  Oct 15
  const mdy = new RegExp(`\\b(${monthNames})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?\\b`, 'gi');
  for (const m of text.matchAll(mdy)) {
    results.push(build(m, MONTHS[m[1].toLowerCase()], +m[2], m[3], today));
  }
  // 15 October 2026  |  15th Oct
  const dmy = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthNames})\\.?(?:,?\\s+(20\\d{2}))?\\b`, 'gi');
  for (const m of text.matchAll(dmy)) {
    results.push(build(m, MONTHS[m[2].toLowerCase()], +m[1], m[3], today));
  }
  return results.filter((r) => r && !isNaN(r.date));
}

function build(m, month, day, year, today) {
  if (day < 1 || day > 31) return null;
  let yearInferred = false;
  let y = year ? +year : today.getFullYear();
  if (!year) {
    yearInferred = true;
    const candidate = new Date(y, month, day);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (candidate < startOfToday) y += 1; // next occurrence
  }
  return { index: m.index, raw: m[0], date: new Date(y, month, day), yearInferred };
}

/** Pick a deadline ONLY if a date sits next to a deadline keyword. */
export function extractDeadline(text, today = new Date()) {
  const dates = findDates(text, today);
  if (dates.length === 0) return { deadline: null, note: 'No date found in the text.' };

  const lines = text.split(/\n|(?<=[.!?])\s+/);
  let offset = 0;
  for (const line of lines) {
    const start = text.indexOf(line, offset);
    offset = start + line.length;
    if (!DEADLINE_WORDS.test(line)) continue;
    const hit = dates.find((d) => d.index >= start && d.index <= start + line.length);
    if (hit) {
      return {
        deadline: toISO(hit.date),
        note: hit.yearInferred ? `Year not stated — assumed next "${hit.raw}".` : null,
        source: line.trim().slice(0, 160),
      };
    }
  }
  return {
    deadline: null,
    note: `Found ${dates.length} date(s) but none labelled as a deadline — check the official page.`,
  };
}

export function toISO(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function detectType(text) {
  const lower = ` ${text.toLowerCase()} `;
  let best = null;
  let bestScore = 0;
  for (const [type, words] of Object.entries(TYPE_KEYWORDS)) {
    const score = words.reduce((s, w) => s + (lower.split(w).length - 1), 0);
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }
  return best; // null if nothing matched
}

export function detectSkills(text) {
  return SKILLS.filter((s) => new RegExp(`(^|[^a-z])${escapeRe(s.toLowerCase())}([^a-z]|$)`, 'i').test(text));
}

function sentences(text) {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean);
}

export function detectEligibility(text) {
  return sentences(text).filter((s) => ELIGIBILITY_HINTS.test(s)).slice(0, 3).map((s) => s.slice(0, 140));
}

export function detectLocation(text) {
  const label = text.match(/\b(?:location|based in|venue)\s*[:\-]\s*([^\n.]+)/i);
  if (label) return label[1].trim().slice(0, 60);
  if (/\bremote\b|\bonline\b|virtual/i.test(text)) return 'Remote / Online';
  if (/\bhybrid\b/i.test(text)) return 'Hybrid';
  if (/on-?site|in[- ]person/i.test(text)) return 'On-site';
  return null;
}

export function detectOrganization(text) {
  const label = text.match(/\b(?:organi[sz]ation|organi[sz]er|company|host(?:ed by)?|offered by|by)\s*[:\-]\s*([^\n.]+)/i);
  if (label) return label[1].trim().slice(0, 60);
  const hiring = text.match(/\b([A-Z][\w&.]*(?:\s+[A-Z][\w&.]*){0,3})\s+is\s+(?:hiring|looking|inviting|offering)/);
  return hiring ? hiring[1] : null;
}

export function detectTitle(text) {
  const first = text.split('\n').map((l) => l.trim()).find(Boolean);
  if (!first) return null;
  return first.replace(/^(title|role|position)\s*[:\-]\s*/i, '').slice(0, 90);
}

export function summarize(text, title) {
  const body = sentences(text).filter((s) => s !== title && s.length > 30 && !DEADLINE_WORDS.test(s));
  const out = body.slice(0, 2).join(' ');
  if (!out) return null;
  return out.length > 220 ? `${out.slice(0, 217)}…` : out;
}

/** Main entry: text -> structured opportunity (never invents facts). */
export function analyzeOpportunity(rawText, url = '', today = new Date()) {
  const text = (rawText || '').trim();
  if (text.length < 20) {
    throw new Error('Paste a bit more of the opportunity text (at least a sentence or two).');
  }
  const title = detectTitle(text);
  const { deadline, note, source } = extractDeadline(text, today);
  const result = {
    title: title || 'Untitled opportunity',
    organization: detectOrganization(text),
    type: detectType(text),
    deadline,
    deadlineNote: note || null,
    deadlineSource: source || null,
    location: detectLocation(text),
    eligibility: detectEligibility(text),
    skills: detectSkills(text),
    summary: summarize(text, title),
    url: url.trim() || null,
  };
  result.missing = ['organization', 'type', 'deadline', 'location', 'summary']
    .filter((k) => !result[k])
    .concat(result.eligibility.length ? [] : ['eligibility']);
  return result;
}
