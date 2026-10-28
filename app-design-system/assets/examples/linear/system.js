const SURFACES = [
  { name: 'App', token: '--surface-app', usage: '窗口底、侧边栏' },
  { name: 'Base', token: '--surface-base', usage: '主内容面板' },
  { name: 'Raised', token: '--surface-raised', usage: '卡片、弹窗、输入卡' },
  { name: 'Inset', token: '--surface-inset', usage: '输入框内凹底' },
  { name: 'Active', token: '--surface-active', usage: '选中项、激活 tab' },
  { name: 'Pill', token: '--surface-pill', usage: '属性 pill、次要按钮' },
];

const BORDERS = [
  { name: 'Subtle', token: '--border-subtle', usage: '容器分割' },
  { name: 'Default', token: '--border-default', usage: '弹窗、浮层' },
  { name: 'Strong', token: '--border-strong', usage: '强分隔、输入描边' },
];

const TEXT = [
  { name: 'Primary', token: '--fg-primary', usage: '标题、主要信息' },
  { name: 'Secondary', token: '--fg-secondary', usage: '正文（默认）' },
  { name: 'Tertiary', token: '--fg-tertiary', usage: '辅助说明' },
  { name: 'Quaternary', token: '--fg-quaternary', usage: '时间、编号、元信息' },
  { name: 'Placeholder', token: '--fg-placeholder', usage: '输入占位' },
];

const ACCENT = [
  { name: 'Action', token: '--action', kind: 'fill', usage: '主操作、选中、完成态' },
  { name: 'Hover', token: '--action-hover', kind: 'fill', usage: '主操作 hover' },
  { name: 'Pressed', token: '--action-pressed', kind: 'fill', usage: '主操作 pressed' },
  { name: 'Focus', token: '--focus', kind: 'ring', usage: '键盘焦点 1px' },
  { name: 'Selection', token: '--selection', kind: 'selection', usage: '文本选区 40%' },
];

const SPACES = [2, 4, 6, 8, 12, 16, 24, 32];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function probeColor(token) {
  const el = document.createElement('span');
  el.style.color = `var(${token})`;
  document.body.appendChild(el);
  const value = getComputedStyle(el).color;
  el.remove();
  return value;
}

function toHex(rgb) {
  const m = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!m) return rgb;
  if (m[4] !== undefined && Number(m[4]) < 1) {
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${m[4]})`; // ds-allow: display-only rgba
  }
  return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
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
      ? 'background: var(--surface-base); color: var(' + item.token + '); font-size: 20px; display:grid; place-items:center'
      : kind === 'selection'
        ? 'background: linear-gradient(var(' + item.token + '), var(' + item.token + ')), var(--surface-base)'
        : kind === 'ring'
          ? 'background: var(--surface-base); box-shadow: inset 0 0 0 1px var(' + item.token + ')'
          : 'background: var(' + item.token + ')';
  const chipContent = kind === 'text' ? 'Aa' : '';
  return `
    <button class="swatch" data-token="${item.token}" data-kind="${kind}">
      <span class="swatch__chip" style="${chipStyle}">${chipContent}</span>
      <span class="swatch__body">
        <span class="swatch__name">${item.name}</span>
        <span class="swatch__token">${item.token}</span>
        <span class="swatch__hex" data-hex="${item.token}"></span>
        <span class="swatch__usage">${item.usage}</span>
      </span>
    </button>`;
}

function refreshHexes() {
  $$('[data-hex]').forEach((el) => {
    el.textContent = toHex(probeColor(el.dataset.hex));
  });
  $$('.border-row .meta[data-hex]').forEach(() => {});
}

function renderColors() {
  $('#surface-grid').innerHTML = SURFACES.map((s) => swatchMarkup(s, 'fill')).join('');
  $('#accent-grid').innerHTML = ACCENT.map((s) => swatchMarkup(s, s.kind)).join('');
  $('#text-rows').innerHTML = TEXT.map(
    (t) => `
      <div class="text-row">
        <span class="aa" style="color: var(${t.token})">Aa</span>
        <span class="sample">${t.usage}</span>
        <span class="meta">${t.token} · <span data-hex="${t.token}"></span></span>
      </div>`
  ).join('');
  $('#border-rows').innerHTML = BORDERS.map(
    (b) => `
      <div class="border-row">
        <span class="label">${b.name}</span>
        <span class="line" style="background: var(${b.token})"></span>
        <span class="meta">${b.token} · <span data-hex="${b.token}"></span></span>
      </div>`
  ).join('');
  refreshHexes();
}

function renderSpaces() {
  const max = 32;
  $('#space-scale').innerHTML = SPACES.map(
    (v) => `
      <div class="scale-row">
        <span class="k">${v}</span>
        <span class="bar" style="width: ${Math.round((v / max) * 320)}px"></span>
        <span class="v">${v}px</span>
      </div>`
  ).join('');
}

/* interactions */

function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  const btn = $('#theme-toggle');
  btn.innerHTML = `<svg width="16" height="16"><use href="#i-${html.dataset.theme === 'dark' ? 'moon' : 'sun'}"/></svg>`;
  renderColors();
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
  renderColors();
  renderSpaces();

  $('#theme-toggle').addEventListener('click', toggleTheme);

  document.addEventListener('click', (e) => {
    const swatch = e.target.closest('.swatch');
    if (swatch) {
      const token = swatch.dataset.token;
      copyText(`var(${token})`).then(() => showToast(`已复制 var(${token})`));
    }
    if (!e.target.closest('.ds-menu-wrap')) {
      $('#menu').classList.remove('open');
    }
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
      if (item.id === 'menu-theme') {
        toggleTheme();
      } else {
        showToast(`菜单项：${item.textContent.replace(/\s+/g, ' ').trim()}`);
      }
    });
  });

  const openDialog = () => $('#dialog').classList.add('open');
  const closeDialog = () => $('#dialog').classList.remove('open');

  $('#open-dialog').addEventListener('click', openDialog);
  $$('[data-close-dialog]').forEach((btn) => btn.addEventListener('click', closeDialog));
  $('#dialog').addEventListener('mousedown', (e) => {
    if (e.target.id === 'dialog') closeDialog();
  });

  $('#show-toast').addEventListener('click', () => showToast('Toast：1.6s 自动消失'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDialog();
      $('#menu').classList.remove('open');
    }
  });
}

init();
