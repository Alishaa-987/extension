import { SAMPLE_OPPORTUNITIES } from '../data/samples.js';

const KEY = 'opportunity-rescue:v1';

export function loadOpportunities() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage blocked or corrupt — fall back to samples */
  }
  return SAMPLE_OPPORTUNITIES();
}

export function saveOpportunities(opps) {
  try {
    localStorage.setItem(KEY, JSON.stringify(opps));
  } catch {
    /* ignore — app still works in memory */
  }
}

export function resetToSamples() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return SAMPLE_OPPORTUNITIES();
}

export function newId() {
  return `opp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
