#!/usr/bin/env node
// Verify authored UI files against the design system's own token scales.
// Usage: node verify.mjs <file-or-dir...> [--tokens tokens.css] [--strict]
// Exit 0 = clean (or warnings only), 1 = errors, 2 = bad usage.

import fs from 'node:fs';
import path from 'node:path';

const EXTS = new Set(['.html', '.htm', '.css', '.scss', '.less', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage']);
const SKIP_FILES = new Set(['tokens.css']);

const DEFAULT_RADII = ['4px', '6px', '8px', '10px', '12px', '9999px', '50%', '0'];
const DEFAULT_FONTS = [11, 12, 13, 15, 18, 20, 24, 36];
const DEFAULT_SPACES = [0, 1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 48];
const KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'medium', 'normal', 'auto']);

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const tokensFlagIndex = argv.indexOf('--tokens');
const tokensFlag = tokensFlagIndex >= 0 ? argv[tokensFlagIndex + 1] : null;
const tokensValueIndex = tokensFlagIndex >= 0 ? tokensFlagIndex + 1 : -1;
const targets = argv.filter((a, i) => !a.startsWith('--') && i !== tokensValueIndex);

if (!targets.length) {
  console.error('Usage: node verify.mjs <file-or-dir...> [--tokens tokens.css] [--strict]');
  process.exit(2);
}

/* ---------- token scales ---------- */

function parseTokens(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const map = new Map();
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    map.set(`--${m[1].toLowerCase()}`, m[2].trim());
  }
  const resolve = (value, depth = 0) => {
    if (depth > 5) return value;
    const v = value.trim();
    const varMatch = v.match(/^var\(\s*(--[a-z0-9-]+)\s*\)$/i);
    if (varMatch && map.has(varMatch[1].toLowerCase())) {
      return resolve(map.get(varMatch[1].toLowerCase()), depth + 1);
    }
    return v;
  };
  const radii = new Set(DEFAULT_RADII);
  const fonts = new Set(DEFAULT_FONTS);
  const spaces = new Set(DEFAULT_SPACES);
  let found = 0;
  for (const [key, value] of map) {
    const v = resolve(value).toLowerCase();
    if (key.startsWith('--radius-')) {
      if (/^-?[\d.]+px$/.test(v) || v === '50%' || v === '0') {
        radii.add(v);
        found++;
      }
    } else if (key.startsWith('--text-')) {
      const px = toPxNumber(v);
      if (px !== null) {
        fonts.add(px);
        found++;
      }
    } else if (key.startsWith('--space-') || key.startsWith('--pad-')) {
      const px = toPxNumber(v);
      if (px !== null) {
        spaces.add(px);
        found++;
      }
    }
  }
  return { file, radii, fonts, spaces, found };
}

function toPxNumber(value) {
  const v = value.trim().toLowerCase();
  const px = v.match(/^(-?\d*\.?\d+)px$/);
  if (px) return Number(px[1]);
  const rem = v.match(/^(-?\d*\.?\d+)rem$/);
  if (rem) return Math.round(Number(rem[1]) * 16);
  return null;
}

function findTokensFile() {
  if (tokensFlag) return fs.existsSync(tokensFlag) ? tokensFlag : null;
  const candidates = [];
  for (const t of targets) {
    const dir = fs.existsSync(t) && fs.statSync(t).isDirectory() ? t : path.dirname(t);
    candidates.push(path.join(dir, 'tokens.css'));
  }
  candidates.push(path.join(process.cwd(), 'tokens.css'));
  return candidates.find((p) => fs.existsSync(p)) || null;
}

const tokensFile = findTokensFile();
const scales = tokensFile ? parseTokens(tokensFile) : { file: null, radii: new Set(DEFAULT_RADII), fonts: new Set(DEFAULT_FONTS), spaces: new Set(DEFAULT_SPACES), found: 0 };

/* ---------- file collection ---------- */

function walk(p, out) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(p)) {
      if (SKIP_DIRS.has(name)) continue;
      walk(path.join(p, name), out);
    }
    return;
  }
  const ext = path.extname(p).toLowerCase();
  if (!EXTS.has(ext)) return;
  if (SKIP_FILES.has(path.basename(p).toLowerCase())) return;
  out.push(p);
}

const files = [];
for (const t of targets) {
  if (!fs.existsSync(t)) {
    console.error(`skip: ${t} (not found)`);
    continue;
  }
  walk(t, files);
}

/* ---------- rules ---------- */

const findings = [];
const report = (file, line, level, rule, detail) => findings.push({ file, line, level, rule, detail });

function stripComments(text, ext) {
  if (['.css', '.scss', '.less'].includes(ext)) return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (['.html', '.htm', '.vue', '.svelte', '.astro'].includes(ext)) return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function checkDecl(line, re, handler) {
  let m;
  while ((m = re.exec(line)) !== null) handler(m[1]);
}

function isVarOrKeyword(value) {
  const v = value.trim().toLowerCase();
  return v.startsWith('var(') || KEYWORDS.has(v);
}

function checkColor(file, no, line) {
  const hexRe = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})\b/g;
  let m;
  while ((m = hexRe.exec(line)) !== null) report(file, no, 'error', 'R1 raw-color', m[0]);
  const fnRe = /\b(?:rgba?|hsla?)\s*\(/g;
  while ((m = fnRe.exec(line)) !== null) report(file, no, 'error', 'R1 raw-color', m[0] + '…)');
}

function checkRadius(file, no, line) {
  checkDecl(line, /(?<![\w-])border-radius\s*:\s*([^;}"')\\]+)/g, (value) => {
    for (const part of value.split(/[\s/]+/)) {
      const v = part.trim().toLowerCase();
      if (!v || isVarOrKeyword(v)) continue;
      if (!scales.radii.has(v)) report(file, no, 'error', 'R2 radius', v);
    }
  });
}

function checkFontSize(file, no, line) {
  checkDecl(line, /(?<![\w-])font-size\s*:\s*([^;}"')\\]+)/g, (value) => {
    const v = value.trim();
    if (isVarOrKeyword(v)) return;
    const px = toPxNumber(v);
    if (px === null) {
      report(file, no, 'error', 'R3 font-size', v);
      return;
    }
    if (!scales.fonts.has(px)) report(file, no, 'error', 'R3 font-size', v);
  });
}

function checkMotion(file, no, line) {
  checkDecl(line, /(?<![\w-])(?:transition|animation)(?:-[a-z-]+)?\s*:\s*([^;}"')\\]+)/g, (value) => {
    for (const d of value.matchAll(/(\d*\.?\d+)\s*(ms|s)\b/g)) {
      const ms = d[2] === 's' ? Number(d[1]) * 1000 : Number(d[1]);
      if (ms > 200) report(file, no, 'warning', 'R4 motion', `${ms}ms`);
    }
  });
}

function checkSpacing(file, no, line) {
  checkDecl(line, /(?<![\w-])(?:column-gap|row-gap|padding|margin|gap)(?:-[a-z-]+)?\s*:\s*([^;}"')\\]+)/g, (value) => {
    for (const part of value.split(/\s+/)) {
      const v = part.trim();
      if (!v || isVarOrKeyword(v)) continue;
      const px = toPxNumber(v);
      if (px === null) continue;
      if (!scales.spaces.has(px)) report(file, no, 'warning', 'R5 spacing', v);
    }
  });
}

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const text = stripComments(fs.readFileSync(file, 'utf8'), ext);
  text.split(/\r?\n/).forEach((line, i) => {
    const no = i + 1;
    if (/\bds-allow\b/i.test(line)) return;
    checkColor(file, no, line);
    checkRadius(file, no, line);
    checkFontSize(file, no, line);
    checkMotion(file, no, line);
    checkSpacing(file, no, line);
  });
}

const errors = findings.filter((f) => f.level === 'error');
const warnings = findings.filter((f) => f.level === 'warning');

for (const f of findings) {
  const rel = path.relative(process.cwd(), f.file) || f.file;
  console.log(`${rel}:${f.line}  ${f.level.toUpperCase()}  ${f.rule}  ${f.detail}`);
}

const source = scales.file ? path.relative(process.cwd(), scales.file) : 'default scales (no tokens.css found)';
console.log(`\nScales: ${source} — ${scales.radii.size} radii, ${scales.fonts.size} font sizes, ${scales.spaces.size} spacing steps.`);
console.log(`Summary: ${errors.length} error(s), ${warnings.length} warning(s) in ${files.length} file(s).` + (errors.length ? ' Fix errors before shipping.' : ' System rules satisfied.'));

process.exit(errors.length || (strict && warnings.length) ? 1 : 0);
