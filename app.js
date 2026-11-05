/* Pollinations Prompt Studio — zero-dependency front-end.
 * Calls the free image endpoint (image.pollinations.ai) and, when a user
 * supplies their own secret key, text models through gen.pollinations.ai.
 * No bundler, no framework, no third-party accounts required.
 */
'use strict';

const ENDPOINT_IMAGE = 'https://image.pollinations.ai/prompt/';
const ENDPOINT_MODELS = 'https://gen.pollinations.ai/v1/models';
const ENDPOINT_TEXT = 'https://gen.pollinations.ai/text/';

const TITLE = 'Pollinations Prompt Studio';
const VERSION = '1.0.0';
const HISTORY_KEY = 'pollinations-prompt-studio:history';
const KEY_KEY = 'pollinations-prompt-studio:key';
const REFINE_MODELS = ['openai/gpt-5.4-nano', 'openai/gpt-5.4-mini', 'meta/llama-3.3-70b'];
const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'and', 'on', 'in', 'to', 'for', 'with', 'is', 'are', 'be', 'it', 'that']);
let modelsLoaded = false;
let busy = false;

const $ = (id) => document.getElementById(id);
const el = {
  prompt: $('prompt'), refine: $('refine'), refineStatus: $('refineStatus'),
  keyField: $('keyField'), key: $('key'), model: $('model'), ratio: $('ratio'),
  seed: $('seed'), randomSeed: $('randomSeed'), enhance: $('enhance'), nologo: $('nologo'),
  generate: $('generate'), error: $('error'),
  canvasWrap: $('canvasWrap'), empty: $('empty'), result: $('result'), result2: $('result2'),
  resultActions: $('resultActions'), download: $('download'), copyPrompt: $('copyPrompt'),
  copyUrl: $('copyUrl'), again: $('again'), genMeta: $('genMeta'), history: $('history'),
  clearHistory: $('clearHistory'), modelRefresh: $('modelRefresh'), keyToggle: $('keyToggle'),
};

/* ---------------- image generation ---------------- */
function buildImageUrl() {
  const p = el.prompt.value.trim();
  if (!p) throw new Error('Enter a prompt first.');
  const [w, h] = el.ratio.value.split('x').map((n) => parseInt(n, 10));
  const params = new URLSearchParams();
  params.set('width', String(w));
  params.set('height', String(h));
  params.set('nologo', el.nologo.value);
  params.set('enhance', el.enhance.value);
  const model = el.model.value;
  if (model) params.set('model', model);
  const seedRaw = el.seed.value.trim();
  const seed = seedRaw === '' || seedRaw === 'random' ? Math.floor(Math.random() * 2147483647) : parseInt(seedRaw, 10);
  params.set('seed', String(seed));
  return `${ENDPOINT_IMAGE}${encodeURIComponent(p)}?${params.toString()}`;
}

async function generate() {
  if (busy) return;
  let url;
  const prompt = el.prompt.value.trim();
  try {
    url = buildImageUrl();
    setBusy(true);
    showError('');
    el.empty.hidden = true;
    el.result.hidden = true;
    el.result2.hidden = true;
    // Scoped probe: keep the UI responsive while Pollinations renders.
    const started = performance.now();
    el.result2.src = url;
    await waitForImage(el.result2, 60000);
    el.result.src = url;
    await waitForImage(el.result, 60000);
    el.result.hidden = false;
    el.result2.hidden = true;
    el.result2.onload = null;
    el.result2.onerror = null;
    const ms = Math.round(performance.now() - started);
    el.resultActions.hidden = false;
    el.genMeta.textContent = `${prompt.slice(0, 42)}${prompt.length > 42 ? '…' : ''} · ${el.ratio.value.replace('x', '×')} · ${ms} ms`;
    addHistory({ url, prompt, ratio: el.ratio.value });
  } catch (err) {
    showError(err.message);
  } finally {
    setBusy(false);
  }
}

function waitForImage(img, timeout) {
  return new Promise((resolve, reject) => {
    const done = (ok) => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      ok ? resolve() : reject(new Error('Pollinations did not return an image. Check the prompt or try again.'));
    };
    const timer = setTimeout(() => done(false), timeout);
    img.onload = () => done(true);
    img.onerror = () => done(false);
  });
}

function setBusy(v) {
  busy = v;
  el.generate.disabled = v;
  el.refine.disabled = v;
  el.generate.textContent = v ? '🌤 Rendering on Pollinations…' : '🌿 Generate with Pollinations';
}

function showError(msg) {
  el.error.textContent = msg || '';
  el.error.hidden = Boolean(!msg);
}

/* ---------------- refine via text model (user's own key) ---------------- */
async function refine() {
  const prompt = el.prompt.value.trim();
  if (!prompt) { showError('Enter a rough idea first.'); return; }
  const key = el.key.value.trim();
  if (!key) {
    showError('Enable “API key” and paste a Pollinations secret key (sk_…) to refine. Image generation still needs no key.');
    return;
  }
  try {
    setBusy(true);
    el.refineStatus.textContent = 'refining…';
    const model = REFINE_MODELS.find((m) => m) || REFINE_MODELS[0];
    const res = await fetch(`${ENDPOINT_TEXT}${encodeURIComponent(prompt + ' — rewrite this as a detailed image prompt, comma-separated visual clauses, no preamble.')}?model=${model}&nologo=true`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`refine failed (${res.status})`);
    const text = (await res.text()).trim();
    if (!text) throw new Error('refine returned empty');
    el.prompt.value = text;
    el.refineStatus.textContent = 'refined ✓';
    setTimeout(() => { el.refineStatus.textContent = ''; }, 2000);
  } catch (err) {
    el.refineStatus.textContent = '';
    showError(err.message);
  } finally {
    setBusy(false);
  }
}

/* ---------------- model catalog ---------------- */
async function loadModels() {
  try {
    const res = await fetch(ENDPOINT_MODELS);
    if (!res.ok) throw new Error(`catalog ${res.status}`);
    const data = await res.json();
    const list = Array.isArray(data.data) ? data.data : [];
    // Keep a friendly curated default plus all image-capable models.
    const curated = ['flux.1-schnell', 'flux.1-dev'];
    const imageModels = list.filter((m) => !m.paid_only && m.input_modalities && m.input_modalities.includes('image'));
    const source = [...curated, ...imageModels.map((m) => m.id)];
    el.model.innerHTML = '<option value="">default (flux.1-schnell)</option>' +
      source.filter((v, i, a) => a.indexOf(v) === i).slice(0, 80)
        .map((id) => `<option value="${id}">${id}</option>`).join('');
    modelsLoaded = true;
    localStorage.setItem('pollinations-prompt-studio:catalog', String(list.length));
  } catch (err) {
    // Image generation works without the catalog, so stay usable.
    el.model.innerHTML = '<option value="">default (flux.1-schnell)</option>';
    showError(`model catalog unavailable (${err.message}); using the default image model.`);
  }
}

/* ---------------- history ---------------- */
function addHistory(item) {
  const list = getHistory();
  list.unshift(item);
  saveHistory(list.slice(0, 8));
  renderHistory();
}
function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(list) { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); }
function renderHistory() {
  const list = getHistory();
  if (!list.length) { el.history.innerHTML = '<p class="muted small">Nothing yet.</p>'; return; }
  el.history.innerHTML = list.map((d, i) =>
    `<img src="${d.url}" alt="${escapeHtml(d.prompt)}" title="${escapeHtml(d.prompt)}" data-url="${escapeAttr(d.url)}" data-prompt="${escapeAttr(d.prompt)}">`
  ).join('');
}
function clearHistory() { saveHistory([]); renderHistory(); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeAttr(s) { return escapeHtml(s); }

/* ---------------- wiring ---------------- */
function wire() {
  el.generate.addEventListener('click', generate);
  el.refine.addEventListener('click', refine);
  el.again.addEventListener('click', () => { el.seed.value = ''; el.randomSeed.click(); generate(); });
  el.download.addEventListener('click', async () => {
    const src = el.result.src;
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = `pollinations-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
  el.copyPrompt.addEventListener('click', () => copy(el.prompt.value.trim(), 'prompt'));
  el.copyUrl.addEventListener('click', () => copy(el.result.src || '', 'image URL'));
  el.randomSeed.addEventListener('click', () => {
    el.seed.value = String(Math.floor(Math.random() * 2147483647));
  });
  el.clearHistory.addEventListener('click', clearHistory);
  el.modelRefresh.addEventListener('click', loadModels);
  el.history.addEventListener('click', (e) => {
    const img = e.target.closest('img[data-url]');
    if (!img) return;
    el.result.onerror = null;
    const url = img.dataset.url;
    el.result.src = url;
    el.result.hidden = false;
    el.result2.hidden = true;
    el.resultActions.hidden = false;
    el.genMeta.textContent = img.dataset.prompt ? `${img.dataset.prompt.slice(0, 42)} · loaded from history` : 'loaded from history';
    saveHistory([{ url, prompt: img.dataset.prompt, ratio: el.ratio.value }]);
    renderHistory();
  });
  el.keyToggle.addEventListener('click', () => {
    el.keyField.hidden = !el.keyField.hidden;
    el.key.value = el.key.value || localStorage.getItem(KEY_KEY) || '';
  });
  el.key.addEventListener('change', () => localStorage.setItem(KEY_KEY, el.key.value.trim()));
  el.prompt.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); generate(); }
  });
  // Demo prompt so the first run is one click.
  if (!el.prompt.value) el.prompt.value = 'a red cat, cinematic, golden hour, warm light, soft focus';
  loadModels();
}
function copy(text, label) {
  if (!text) { showError(`Nothing to copy (${label}).`); return; }
  navigator.clipboard.writeText(text).then(
    () => { showError(''); },
    () => showError(`could not copy (${label})`)
  );
}

document.addEventListener('DOMContentLoaded', wire);
window.PollinationsPromptStudio = { version: VERSION, title: TITLE };
