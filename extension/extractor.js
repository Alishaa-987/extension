// extension/extractor.js — plain script version (no ES module syntax).
// Logic is identical to src/lib/extractor.js; importScripts-compatible.

var MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8,
  september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

var DEADLINE_WORDS =
  /(deadline|apply by|applications? (close|closes|due)|closes? on|closing date|last date|due (date|by)|submit by|until|before|ends? on|register by)/i;

var TYPE_KEYWORDS = {
  fellowship: ['fellowship', 'fellow'],
  internship: ['internship', 'intern '],
  hackathon: ['hackathon', 'hack'],
  scholarship: ['scholarship', 'tuition', 'funding'],
  research: ['research program', 'research internship', 'research assistant', 'lab'],
  job: ['full-time', 'full time', 'job', 'hiring', 'position', 'role'],
  competition: ['competition', 'contest', 'challenge'],
};

var SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'React', 'Node.js',
  'Express', 'MongoDB', 'SQL', 'Git', 'GitHub', 'Docker', 'Kubernetes', 'AWS', 'Azure',
  'Machine Learning', 'Deep Learning', 'NLP', 'LLM', 'Data Analysis', 'Figma',
  'HTML', 'CSS', 'Linux', 'TensorFlow', 'PyTorch', 'Communication', 'Leadership',
];

var ELIGIBILITY_HINTS =
  /(eligib|open to|applicants must|must be|who can apply|requirements?:|undergraduate|graduate students|students? (in|from|of)|years? of experience)/i;

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toISO(d) {
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

function buildDate(m, month, day, year, today) {
  if (day < 1 || day > 31) return null;
  var yearInferred = false;
  var y = year ? +year : today.getFullYear();
  if (!year) {
    yearInferred = true;
    var candidate = new Date(y, month, day);
    var startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (candidate < startOfToday) y += 1;
  }
  return { index: m.index, raw: m[0], date: new Date(y, month, day), yearInferred: yearInferred };
}

function findDates(text, today) {
  today = today || new Date();
  var results = [];
  var monthNames = Object.keys(MONTHS).join('|');

  // ISO: 2026-10-15
  var isoRe = /\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g;
  var m;
  while ((m = isoRe.exec(text)) !== null) {
    results.push({ index: m.index, raw: m[0], date: new Date(+m[1], +m[2] - 1, +m[3]), yearInferred: false });
  }
  // MDY: October 15, 2026 | Oct 15
  var mdyRe = new RegExp('\\b(' + monthNames + ')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?\\b', 'gi');
  while ((m = mdyRe.exec(text)) !== null) {
    results.push(buildDate(m, MONTHS[m[1].toLowerCase()], +m[2], m[3], today));
  }
  // DMY: 15 October 2026 | 15th Oct
  var dmyRe = new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(' + monthNames + ')\\.?(?:,?\\s+(20\\d{2}))?\\b', 'gi');
  while ((m = dmyRe.exec(text)) !== null) {
    results.push(buildDate(m, MONTHS[m[2].toLowerCase()], +m[1], m[3], today));
  }
  return results.filter(function(r) { return r && !isNaN(r.date); });
}

function extractDeadline(text, today) {
  today = today || new Date();
  var dates = findDates(text, today);
  if (dates.length === 0) return { deadline: null, note: 'No date found in the text.' };

  var lines = text.split(/\n|(?<=[.!?])\s+/);
  var offset = 0;
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var start = text.indexOf(line, offset);
    offset = start + line.length;
    if (!DEADLINE_WORDS.test(line)) continue;
    var hit = dates.find(function(d) { return d.index >= start && d.index <= start + line.length; });
    if (hit) {
      return {
        deadline: toISO(hit.date),
        note: hit.yearInferred ? 'Year not stated — assumed next "' + hit.raw + '".' : null,
        source: line.trim().slice(0, 160),
      };
    }
  }
  return {
    deadline: null,
    note: 'Found ' + dates.length + ' date(s) but none labelled as a deadline — check the official page.',
  };
}

function detectType(text) {
  var lower = ' ' + text.toLowerCase() + ' ';
  var best = null;
  var bestScore = 0;
  for (var type in TYPE_KEYWORDS) {
    var words = TYPE_KEYWORDS[type];
    var score = words.reduce(function(s, w) { return s + (lower.split(w).length - 1); }, 0);
    if (score > bestScore) { best = type; bestScore = score; }
  }
  return best;
}

function detectSkills(text) {
  return SKILLS.filter(function(s) {
    return new RegExp('(^|[^a-z])' + escapeRe(s.toLowerCase()) + '([^a-z]|$)', 'i').test(text);
  });
}

function sentences(text) {
  return text
    .split(/\n+|(?<=[.!?])\s+/)
    .map(function(s) { return s.replace(/^[\s•\-*]+/, '').trim(); })
    .filter(Boolean);
}

function detectEligibility(text) {
  return sentences(text)
    .filter(function(s) { return ELIGIBILITY_HINTS.test(s); })
    .slice(0, 3)
    .map(function(s) { return s.slice(0, 140); });
}

function detectLocation(text) {
  var label = text.match(/\b(?:location|based in|venue)\s*[:\-]\s*([^\n.]+)/i);
  if (label) return label[1].trim().slice(0, 60);
  if (/\bremote\b|\bonline\b|virtual/i.test(text)) return 'Remote / Online';
  if (/\bhybrid\b/i.test(text)) return 'Hybrid';
  if (/on-?site|in[- ]person/i.test(text)) return 'On-site';
  return null;
}

function detectOrganization(text) {
  var label = text.match(/\b(?:organi[sz]ation|organi[sz]er|company|host(?:ed by)?|offered by|by)\s*[:\-]\s*([^\n.]+)/i);
  if (label) return label[1].trim().slice(0, 60);
  var hiring = text.match(/\b([A-Z][\w&.]*(?:\s+[A-Z][\w&.]*){0,3})\s+is\s+(?:hiring|looking|inviting|offering)/);
  return hiring ? hiring[1] : null;
}

function detectTitle(text) {
  var first = text.split('\n').map(function(l) { return l.trim(); }).find(Boolean);
  if (!first) return null;
  return first.replace(/^(title|role|position)\s*[:\-]\s*/i, '').slice(0, 90);
}

function summarize(text, title) {
  var body = sentences(text).filter(function(s) {
    return s !== title && s.length > 30 && !DEADLINE_WORDS.test(s);
  });
  var out = body.slice(0, 2).join(' ');
  if (!out) return null;
  return out.length > 220 ? out.slice(0, 217) + '…' : out;
}

function analyzeOpportunity(rawText, url) {
  var text = (rawText || '').trim();
  if (text.length < 20) {
    throw new Error('Page had too little readable text to extract from.');
  }
  var title = detectTitle(text);
  var dl = extractDeadline(text);
  var result = {
    title: title || 'Untitled opportunity',
    organization: detectOrganization(text),
    type: detectType(text),
    deadline: dl.deadline,
    deadlineNote: dl.note || null,
    deadlineSource: dl.source || null,
    location: detectLocation(text),
    eligibility: detectEligibility(text),
    skills: detectSkills(text),
    summary: summarize(text, title),
    url: (url || '').trim() || null,
  };
  result.missing = ['organization', 'type', 'deadline', 'location', 'summary']
    .filter(function(k) { return !result[k]; })
    .concat(result.eligibility.length ? [] : ['eligibility']);
  return result;
}
