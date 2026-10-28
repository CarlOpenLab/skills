const SURFACES = [
  { name: 'App', token: '--surface-app', usage: 'window, sidebar' },
  { name: 'Base', token: '--surface-base', usage: 'main panel' },
  { name: 'Raised', token: '--surface-raised', usage: 'cards, dialogs, prompt cards' },
  { name: 'Inset', token: '--surface-inset', usage: 'input well' },
  { name: 'Active', token: '--surface-active', usage: 'selected row, active tab' },
  { name: 'Pill', token: '--surface-pill', usage: 'pills, secondary buttons, kbd' },
];

const BORDERS = [
  { name: 'Subtle', token: '--border-subtle', usage: 'containers, dividers' },
  { name: 'Default', token: '--border-default', usage: 'popovers, dialogs' },
  { name: 'Strong', token: '--border-strong', usage: 'strong separation' },
];

const TEXT = [
  { name: 'Primary', token: '--fg-primary', usage: 'headings, row titles' },
  { name: 'Secondary', token: '--fg-secondary', usage: 'body default' },
  { name: 'Tertiary', token: '--fg-tertiary', usage: 'secondary info, nav' },
  { name: 'Quaternary', token: '--fg-quaternary', usage: 'timestamps, IDs, meta' },
  { name: 'Placeholder', token: '--fg-placeholder', usage: 'input placeholder' },
];

const ACCENT = [
  { name: 'Action', token: '--action', kind: 'fill', usage: 'primary action, selection' },
  { name: 'Hover', token: '--action-hover', kind: 'fill', usage: 'primary hover' },
  { name: 'Pressed', token: '--action-pressed', kind: 'fill', usage: 'primary pressed' },
  { name: 'Focus', token: '--focus', kind: 'ring', usage: '1px focus ring' },
  { name: 'Selection', token: '--selection', kind: 'selection', usage: 'text selection' },
];

const TYPE = [
  { token: '--text-title1', sample: 'Build a system, not a page', weight: 'var(--weight-semibold)', leading: 'var(--leading-tight)' },
  { token: '--text-title2', sample: 'Introducing the design system', weight: 'var(--weight-medium)', leading: 'var(--leading-tight)' },
  { token: '--text-title3', sample: 'Section heading', weight: 'var(--weight-semibold)', leading: 'var(--leading-tight)' },
  { token: '--text-large', sample: 'Dialog and drawer titles', weight: 'var(--weight-semibold)', leading: 'var(--leading-normal)' },
  { token: '--text-regular', sample: 'Body and input content uses the regular step with relaxed leading.', weight: 'var(--weight-normal)', leading: 'var(--leading-relaxed)' },
  { token: '--text-small', sample: 'App UI base: navigation, lists, forms.', weight: 'var(--weight-normal)', leading: 'var(--leading-normal)' },
  { token: '--text-mini', sample: 'Meta, timestamps, shortcut hints', weight: 'var(--weight-medium)', leading: 'var(--leading-normal)' },
  { token: '--text-micro', sample: 'GROUP LABEL / MICRO', weight: 'var(--weight-medium)', leading: 'var(--leading-normal)' },
];

const RADII = ['--radius-xs', '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-full'];
const CONTROLS = ['--control-xs', '--control-sm', '--control-md', '--control-lg'];
const SPACES = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-7', '--space-8', '--space-9'];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function probeColor(token) {
  const el = document.createElement('span');
  el.style.color = `var(${token})`;
  document.body.appendChild(el);
  const v = getComputedStyle(el).color;
  el.remove();
  return v;
}

function probeBox(token, prop) {
  const el = document.createElement('div');
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  el.style[prop] = `var(${token})`;
  document.body.appendChild(el);
  const v = getComputedStyle(el)[prop];
  el.remove();
  return v;
}

function probeFontSize(token) {
  const el = document.createElement('span');
  el.style.fontSize = `var(${token})`;
  document.body.appendChild(el);
  const v = getComputedStyle(el).fontSize;
  el.remove();
  return v;
}

function toHex(rgb) {
  const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!m) return rgb;
  if (m[4] !== undefined && Number(m[4]) < 1) return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${m[4]})`; // ds-allow: display-only rgba
  return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
  return Promise.resolve();
}

function swatchMarkup(item, kind) {
  const chipStyle =
    kind === 'text'
      ? `background: var(--surface-base); color: var(${item.token}); font-size: 20px; display: grid; place-items: center`
      : kind === 'selection'
        ? `background: linear-gradient(var(${item.token}), var(${item.token})), var(--surface-base)`
        : kind === 'ring'
          ? `background: var(--surface-base); box-shadow: inset 0 0 0 1px var(${item.token})`
          : `background: var(${item.token})`;
  return `
    <button class="swatch" data-token="${item.token}" data-kind="${kind}">
      <span class="swatch__chip" style="${chipStyle}">${kind === 'text' ? 'Aa' : ''}</span>
      <span class="swatch__body">
        <span class="swatch__name">${item.name}</span>
        <span class="swatch__token">${item.token}</span>
        <span class="swatch__hex" data-hex="${item.token}"></span>
        <span class="swatch__usage">${item.usage}</span>
      </span>
    </button>`;
}

function fillHexes() {
  $$('[data-hex]').forEach((el) => {
    el.textContent = toHex(probeColor(el.dataset.hex));
  });
}

function renderColors() {
  $('#surface-grid').innerHTML = SURFACES.map((s) => swatchMarkup(s, 'fill')).join('');
  $('#accent-grid').innerHTML = ACCENT.map((s) => swatchMarkup(s, s.kind)).join('');
  $('#text-rows').innerHTML = TEXT.map(
    (t) => `<div class="text-row">
      <span class="aa" style="color: var(${t.token})">Aa</span>
      <span class="sample">${t.usage}</span>
      <span class="meta">${t.token} · <span data-hex="${t.token}"></span></span>
    </div>`
  ).join('');
  $('#border-rows').innerHTML = BORDERS.map(
    (b) => `<div class="border-row">
      <span class="label">${b.name}</span>
      <span class="line" style="background: var(${b.token})"></span>
      <span class="meta">${b.token} · <span data-hex="${b.token}"></span></span>
    </div>`
  ).join('');
  fillHexes();
}

function renderType() {
  $('#type-rows').innerHTML = TYPE.map(
    (t) => `<div class="type-row">
      <div style="font-size: var(${t.token}); font-weight: ${t.weight}; line-height: ${t.leading}">${t.sample}</div>
      <div class="spec">${t.token} · ${probeFontSize(t.token)}</div>
    </div>`
  ).join('');
}

function renderScale() {
  const max = Math.max(...SPACES.map((s) => parseFloat(probeBox(s, 'width')) || 0));
  $('#space-scale').innerHTML = SPACES.map((s) => {
    const px = parseFloat(probeBox(s, 'width')) || 0;
    return `<div class="scale-row">
      <span class="k">${s.replace('--space-', '')}</span>
      <span class="bar" style="width: ${Math.max(2, Math.round((px / max) * 320))}px"></span>
      <span class="v">${Math.round(px)}px</span>
    </div>`;
  }).join('');

  $('#radius-grid').innerHTML = RADII.map((r) => {
    const v = probeBox(r, 'borderRadius');
    return `<div class="radius-item">
      <div class="box" style="border-radius: var(${r})"></div>
      <span class="k">${r.replace('--radius-', '')} · ${v}</span>
    </div>`;
  }).join('');

  $('#control-scale').innerHTML = CONTROLS.map((c) => {
    const v = probeBox(c, 'height');
    return `<div class="item">
      <div class="pillbox" style="height: var(${c})"></div>
      <span class="k">${c.replace('--control-', '')} · ${v}</span>
    </div>`;
  }).join('');
}

function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  $('#theme-toggle').innerHTML = `<svg width="16" height="16"><use href="#i-${html.dataset.theme === 'dark' ? 'moon' : 'sun'}"/></svg>`;
  renderAll();
}

function renderAll() {
  renderColors();
  renderType();
  renderScale();
}

let toastTimer;
function showToast(text) {
  const toast = $('#toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
}

function init() {
  renderAll();
  $('#theme-toggle').addEventListener('click', toggleTheme);

  document.addEventListener('click', (e) => {
    const swatch = e.target.closest('.swatch');
    if (swatch) {
      copyText(`var(${swatch.dataset.token})`).then(() => showToast(`Copied var(${swatch.dataset.token})`));
    }
    if (!e.target.closest('.ds-menu-wrap')) $('#menu').classList.remove('open');
  });

  $$('#tabs .ds-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('#tabs .ds-tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    });
  });

  $('#menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#menu').classList.toggle('open');
  });

  $$('#menu .ds-menu__item').forEach((item) => {
    item.addEventListener('click', () => {
      $('#menu').classList.remove('open');
      if (item.id === 'menu-theme') toggleTheme();
      else showToast(`Menu: ${item.textContent.replace(/\s+/g, ' ').trim()}`);
    });
  });

  const openDialog = () => $('#dialog').classList.add('open');
  const closeDialog = () => $('#dialog').classList.remove('open');
  $('#open-dialog').addEventListener('click', openDialog);
  $$('[data-close-dialog]').forEach((b) => b.addEventListener('click', closeDialog));
  $('#dialog').addEventListener('mousedown', (e) => {
    if (e.target.id === 'dialog') closeDialog();
  });
  $('#show-toast').addEventListener('click', () => showToast('Toast: auto-dismiss in 1.6s'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDialog();
      $('#menu').classList.remove('open');
    }
  });
}

init();
