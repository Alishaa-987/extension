// Demo data. Deadlines are relative to "today" so the demo always shows urgency.
// Organizations are fictional placeholders — no social-media data is used.
import { toISO } from '../lib/extractor.js';

function inDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export const SAMPLE_OPPORTUNITIES = () => [
  {
    id: 'sample_1',
    title: 'Open Source Contributor Fellowship',
    organization: 'Example Open Source Foundation',
    type: 'fellowship',
    deadline: inDays(2),
    location: 'Remote / Online',
    eligibility: ['Open to undergraduate students worldwide'],
    skills: ['Git', 'Python', 'JavaScript'],
    summary: 'A 10-week paid fellowship where students contribute to real open-source projects with a mentor.',
    url: 'https://example.org/fellowship',
    status: 'saved',
    savedAt: inDays(-12),
  },
  {
    id: 'sample_2',
    title: 'Frontend Engineering Internship',
    organization: 'Acme Labs',
    type: 'internship',
    deadline: inDays(5),
    location: 'Hybrid',
    eligibility: ['Students in their 3rd or 4th year of a CS degree'],
    skills: ['React', 'TypeScript', 'CSS'],
    summary: '12-week summer internship building customer-facing dashboards with the web platform team.',
    url: 'https://example.com/careers/frontend-intern',
    status: 'reviewing',
    savedAt: inDays(-6),
  },
  {
    id: 'sample_3',
    title: 'AI for Good Research Program',
    organization: 'Example University AI Lab',
    type: 'research',
    deadline: inDays(14),
    location: 'Remote / Online',
    eligibility: ['Undergraduate or graduate students with Python experience'],
    skills: ['Python', 'Machine Learning', 'PyTorch'],
    summary: 'Six-week research program pairing students with lab mentors on applied AI projects.',
    url: 'https://example.edu/ai-research',
    status: 'started',
    savedAt: inDays(-3),
  },
  {
    id: 'sample_4',
    title: 'Global Student Scholarship 2027',
    organization: 'Example Education Trust',
    type: 'scholarship',
    deadline: null,
    location: null,
    eligibility: [],
    skills: ['Leadership', 'Communication'],
    summary: 'Merit scholarship covering tuition for one academic year.',
    url: 'https://example.org/scholarship',
    status: 'saved',
    savedAt: inDays(-20),
  },
  {
    id: 'sample_5',
    title: 'Winter Hackathon',
    organization: 'Example Dev Community',
    type: 'hackathon',
    deadline: inDays(35),
    location: 'Remote / Online',
    eligibility: ['Open to all developers'],
    skills: ['JavaScript', 'Node.js'],
    summary: '48-hour online hackathon focused on developer tools.',
    url: 'https://example.dev/hackathon',
    status: 'saved',
    savedAt: inDays(-1),
  },
  {
    id: 'sample_6',
    title: 'Cloud Skills Bootcamp',
    organization: 'Example Cloud Academy',
    type: 'competition',
    deadline: inDays(-4),
    location: 'Remote / Online',
    eligibility: [],
    skills: ['AWS', 'Docker'],
    summary: 'Free cloud bootcamp with a certification voucher.',
    url: 'https://example.com/bootcamp',
    status: 'saved',
    savedAt: inDays(-30),
  },
  {
    id: 'sample_7',
    title: 'Backend Developer Internship',
    organization: 'Example Fintech',
    type: 'internship',
    deadline: inDays(9),
    location: 'On-site',
    eligibility: ['Final-year students'],
    skills: ['Node.js', 'MongoDB', 'SQL'],
    summary: 'Backend internship working on payments APIs.',
    url: 'https://example.com/careers/backend-intern',
    status: 'applied',
    savedAt: inDays(-15),
  },
];

export const SAMPLE_PASTE_TEXT = `Summer Software Engineering Internship 2027
Organization: Example Robotics
Example Robotics is inviting students to join a 12-week paid internship building tools for our robotics platform.
Interns work with React, Python and Git alongside senior engineers.
Eligibility: Open to undergraduate students in Computer Science or Software Engineering.
Location: Remote
Applications close on November 15, 2026.`;
