// Service worker: handles URL fetch and text extraction.
// Runs with host_permissions so no CORS restriction applies.

importScripts('extractor.js', 'nextAction.js');

const STORAGE_KEY = 'opportunity-rescue:v1';

/** Strip HTML tags and collapse whitespace to get readable plain text. */
function htmlToText(html) {
  // Remove script/style blocks entirely
  html = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  // Replace block-level tags with newlines
  html = html.replace(/<\/(p|div|li|h[1-6]|section|article|header|footer|tr)[^>]*>/gi, '\n');
  // Strip all remaining tags
  html = html.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  html = html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&[a-z]+;/gi, ' ');
  // Collapse whitespace
  return html.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FETCH_AND_ANALYZE') {
    handleFetch(msg.url).then(sendResponse).catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'SAVE_OPPORTUNITY') {
    handleSave(msg.opp).then(sendResponse).catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'UPDATE_STATUS') {
    handleUpdateStatus(msg.id, msg.status).then(sendResponse).catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'DELETE_OPPORTUNITY') {
    handleDelete(msg.id).then(sendResponse).catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg.type === 'LOAD_ALL') {
    handleLoadAll().then(sendResponse).catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

async function handleFetch(url) {
  let html;
  try {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error(`Page returned ${res.status}`);
    html = await res.text();
  } catch (e) {
    throw new Error(`Could not load the page: ${e.message}`);
  }

  const text = htmlToText(html);
  if (text.length < 20) throw new Error('Page had too little readable text.');

  let result;
  try {
    result = analyzeOpportunity(text, url);
  } catch (e) {
    throw new Error(e.message);
  }

  return { ok: true, result };
}

async function handleSave(opp) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const existing = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const id = `opp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const newOpp = {
    ...opp,
    id,
    status: 'saved',
    savedAt: new Date().toISOString().slice(0, 10),
  };
  await chrome.storage.local.set({ [STORAGE_KEY]: [newOpp, ...existing] });
  return { ok: true, id };
}

async function handleLoadAll() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const opps = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  return { ok: true, opps };
}

async function handleUpdateStatus(id, status) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const opps = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  const updated = opps.map((o) => o.id === id ? { ...o, status } : o);
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
  return { ok: true };
}

async function handleDelete(id) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const opps = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  await chrome.storage.local.set({ [STORAGE_KEY]: opps.filter((o) => o.id !== id) });
  return { ok: true };
}
