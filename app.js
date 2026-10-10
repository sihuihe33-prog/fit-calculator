import { renderNav } from './site.js';
import {
  Iso286Error, MAX_SIZE, SHAFT_LETTERS, HOLE_LETTERS, GRADES,
  parseFit, calcFit, PREFERRED_FITS,
} from './iso286.js';

/* ---------- 文案字典 ---------- */
const I18N = {
  en: {
    docTitle: 'ISO Fit & Tolerance Calculator — Hole/Shaft Limits, Clearance, Interference',
    docDesc: 'Free ISO 286 fit and tolerance calculator. Enter a nominal size and a fit such as H7/g6 to get hole and shaft limit deviations, max/min clearance or interference, and a tolerance zone diagram.',
    h1: 'ISO Fit & Tolerance Calculator',
    subtitle: 'ISO 286 hole/shaft limits, clearance and interference',
    inputsTitle: 'Inputs',
    sizeLabel: 'Nominal size (mm)',
    fitLabel: 'Fit (hole/shaft)',
    holeLetter: 'Hole letter',
    holeGrade: 'Hole grade (IT)',
    shaftLetter: 'Shaft letter',
    shaftGrade: 'Shaft grade (IT)',
    quickTitle: 'Preferred fits',
    typicalUse: 'Typical use: ',
    resultsTitle: 'Results',
    hole: 'Hole',
    shaft: 'Shaft',
    rowClass: 'Tolerance class',
    rowUpper: 'Upper deviation',
    rowLower: 'Lower deviation',
    rowTol: 'Tolerance (IT)',
    rowMax: 'Max size',
    rowMin: 'Min size',
    maxClearance: 'Max clearance',
    minClearance: 'Min clearance',
    maxInterference: 'Max interference',
    minInterference: 'Min interference',
    clearance: 'Clearance fit',
    transition: 'Transition fit',
    interference: 'Interference fit',
    summaryTitle: 'Summary',
    sumHole: 'hole',
    sumShaft: 'shaft',
    sumClearance: 'clearance',
    sumInterference: 'interference',
    sumTransition: 'transition fit',
    sumMaxClr: 'max clearance',
    sumMaxInt: 'max interference',
    copy: 'Copy',
    copied: 'Copied',
    diagramTitle: 'Tolerance zone diagram',
    diagramEmpty: 'Enter a valid size and fit to see the diagram.',
    zeroLine: '0 = nominal size',
    errors: {
      SIZE_RANGE: 'Nominal size must be greater than 0 and at most {max} mm.',
      NOT_DEFINED: 'This combination of size, letter and grade is not defined in ISO 286.',
      PARSE: 'Cannot read this fit. Use the form H7/g6 (hole letter + grade / shaft letter + grade).',
      UNKNOWN: 'Calculation failed for this input.',
    },
    aboutTitle: 'About hole-basis fits',
    aboutBody: `
      <p><strong>Hole-basis system.</strong> The hole is kept at a standard tolerance zone (usually <b>H</b>, lower deviation = 0) and the fit is chosen by changing the shaft zone (a–u). Holes are harder to machine than shafts, so this keeps tooling and gauges to a minimum. Fits are written hole/shaft, e.g. <b>H7/g6</b>.</p>
      <p><strong>Reading the result.</strong> Clearance = hole size − shaft size.</p>
      <ul>
        <li><b>Clearance fit</b>: the hole is always larger than the shaft (minimum clearance &ge; 0), e.g. sliding or running parts.</li>
        <li><b>Interference fit</b>: the shaft is always larger than the hole (maximum clearance &le; 0), so the parts are pressed or shrunk together.</li>
        <li><b>Transition fit</b>: depending on the actual sizes you may get either a small clearance or a small interference, e.g. for accurate location.</li>
      </ul>
      <p><strong>Basis.</strong> Fundamental deviations and standard tolerance grades (IT1&ndash;IT18) follow ISO 286-1 and the tables of ISO 286-2, for nominal sizes up to 500 mm.</p>`,
    disclaimer: 'Values follow ISO 286. Always verify against the standard for critical applications.',
    footerText: 'Open source, runs entirely in your browser.',
    footerLink: 'GitHub',
  },
  zh: {
    docTitle: 'ISO 配合与公差计算器 — 孔轴极限偏差、间隙、过盈',
    docDesc: '免费的 ISO 286 配合与公差计算器。输入公称尺寸和配合（如 H7/g6），即可得到孔和轴的极限偏差、最大/最小间隙或过盈，以及公差带图。',
    h1: 'ISO 配合与公差计算器',
    subtitle: 'ISO 286 孔轴极限偏差、间隙与过盈',
    inputsTitle: '输入',
    sizeLabel: '公称尺寸 (mm)',
    fitLabel: '配合（孔/轴）',
    holeLetter: '孔基本偏差代号',
    holeGrade: '孔公差等级 (IT)',
    shaftLetter: '轴基本偏差代号',
    shaftGrade: '轴公差等级 (IT)',
    quickTitle: '优先配合',
    typicalUse: '典型用途：',
    resultsTitle: '计算结果',
    hole: '孔',
    shaft: '轴',
    rowClass: '公差带代号',
    rowUpper: '上偏差',
    rowLower: '下偏差',
    rowTol: '公差 (IT)',
    rowMax: '最大极限尺寸',
    rowMin: '最小极限尺寸',
    maxClearance: '最大间隙',
    minClearance: '最小间隙',
    maxInterference: '最大过盈',
    minInterference: '最小过盈',
    clearance: '间隙配合',
    transition: '过渡配合',
    interference: '过盈配合',
    summaryTitle: '摘要',
    sumHole: '孔',
    sumShaft: '轴',
    sumClearance: '间隙',
    sumInterference: '过盈',
    sumTransition: '过渡配合',
    sumMaxClr: '最大间隙',
    sumMaxInt: '最大过盈',
    copy: '复制',
    copied: '已复制',
    diagramTitle: '公差带图',
    diagramEmpty: '输入有效的尺寸和配合后显示公差带图。',
    zeroLine: '0 = 公称尺寸',
    errors: {
      SIZE_RANGE: '公称尺寸必须大于 0 且不超过 {max} mm。',
      NOT_DEFINED: 'ISO 286 中没有定义该尺寸、代号与等级的组合。',
      PARSE: '无法识别该配合。请用 H7/g6 的形式（孔代号+等级 / 轴代号+等级）。',
      UNKNOWN: '该输入无法计算。',
    },
    aboutTitle: '关于基孔制配合',
    aboutBody: `
      <p><strong>基孔制。</strong>孔的公差带固定（通常为 <b>H</b>，下偏差为 0），通过改变轴的公差带（a–u）来得到不同配合。孔比轴难加工，基孔制可以减少刀具和量规的规格。配合写作 孔/轴，例如 <b>H7/g6</b>。</p>
      <p><strong>如何看结果。</strong>间隙 = 孔尺寸 − 轴尺寸。</p>
      <ul>
        <li><b>间隙配合</b>：孔始终大于轴（最小间隙 &ge; 0），用于滑动、转动件。</li>
        <li><b>过盈配合</b>：轴始终大于孔（最大间隙 &le; 0），零件需压入或热装。</li>
        <li><b>过渡配合</b>：视实际尺寸可能出现小间隙或小过盈，用于精确定位。</li>
      </ul>
      <p><strong>依据。</strong>基本偏差与标准公差等级（IT1&ndash;IT18）依据 ISO 286-1 及 ISO 286-2 的数值表，适用公称尺寸至 500 mm。</p>`,
    disclaimer: '数值依据 ISO 286。关键应用请务必对照标准核实。',
    footerText: '开源项目，完全在浏览器中运行。',
    footerLink: 'GitHub',
  },
};

/* ---------- 状态与 DOM ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  size: $('size'), fit: $('fit'),
  errSize: $('err-size'), errFit: $('err-fit'),
  holeLetter: $('hole-letter'), holeGrade: $('hole-grade'),
  shaftLetter: $('shaft-letter'), shaftGrade: $('shaft-grade'),
  chips: $('chips'), chipUse: $('chip-use'),
  badge: $('badge'), notice: $('notice'), body: $('results-body'),
  tbody: $('tbody'), clearances: $('clearances'),
  summary: $('summary'), copy: $('copy'), diagram: $('diagram'),
};

let lang = 'en';
let last = null; // 最近一次成功的计算结果
let copyTimer = 0;

const t = (k) => I18N[lang][k];

function detectLang() {
  try {
    const saved = localStorage.getItem('fitcalc-lang');
    if (saved === 'en' || saved === 'zh') return saved;
  } catch (e) { /* 忽略 */ }
  const nl = (navigator.language || '').toLowerCase();
  return nl.startsWith('zh') ? 'zh' : 'en';
}

/* ---------- 数字格式化 ---------- */
const MINUS = '−';
const rnd = (v, d) => { const p = 10 ** d; return Math.round(v * p) / p; };

// 至少 3 位小数，必要时第 4 位
function trimMm(n) {
  let s = rnd(n, 4).toFixed(4);
  if (s.endsWith('0')) s = s.slice(0, -1);
  return s;
}
const fmtUm = (v) => {
  const r = rnd(v, 2);
  if (r === 0) return '0';
  return (r > 0 ? '+' : MINUS) + String(Math.abs(r));
};
const fmtDevMm = (um) => {
  if (rnd(um, 2) === 0) return '0';
  return (um > 0 ? '+' : MINUS) + trimMm(Math.abs(um) / 1000);
};
const fmtAbsMm = (um) => trimMm(Math.abs(um) / 1000);
const fmtSizeMm = (size, um) => trimMm(size + um / 1000);

/* ---------- 初始化选择框 ---------- */
function fillSelect(sel, values) {
  sel.innerHTML = '';
  for (const v of values) {
    const o = document.createElement('option');
    o.value = String(v);
    o.textContent = String(v);
    sel.appendChild(o);
  }
}
fillSelect(el.holeLetter, HOLE_LETTERS);
fillSelect(el.shaftLetter, SHAFT_LETTERS);
fillSelect(el.holeGrade, GRADES);
fillSelect(el.shaftGrade, GRADES);

function syncSelects(fit) {
  el.holeLetter.value = fit.hole.letter;
  el.holeGrade.value = String(fit.hole.grade);
  el.shaftLetter.value = fit.shaft.letter;
  el.shaftGrade.value = String(fit.shaft.grade);
}
function fitFromSelects() {
  return `${el.holeLetter.value}${el.holeGrade.value}/${el.shaftLetter.value}${el.shaftGrade.value}`;
}

/* ---------- 快捷配合 chips ---------- */
function normFit(s) { return String(s).replace(/\s+/g, ''); }

function renderChips() {
  el.chips.innerHTML = '';
  for (const p of PREFERRED_FITS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.fit = p.fit;
    b.title = lang === 'zh' ? p.useZh : p.use;
    const code = document.createElement('b');
    code.textContent = p.fit;
    const name = document.createElement('span');
    name.textContent = lang === 'zh' ? p.nameZh : p.name;
    b.append(code, name);
    b.addEventListener('click', () => {
      el.fit.value = p.fit;
      onFitText();
    });
    el.chips.appendChild(b);
  }
  markActiveChip();
}

function markActiveChip() {
  const cur = normFit(el.fit.value);
  let active = null;
  for (const b of el.chips.children) {
    const on = b.dataset.fit === cur;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) active = PREFERRED_FITS.find((p) => p.fit === b.dataset.fit);
  }
  el.chipUse.textContent = active
    ? t('typicalUse') + (lang === 'zh' ? active.useZh : active.use)
    : '';
}

/* ---------- 语言 ---------- */
function applyLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  renderNav(lang);
  document.title = t('docTitle');
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', t('docDesc'));
  const ogt = document.querySelector('meta[property="og:title"]');
  if (ogt) ogt.setAttribute('content', t('docTitle'));
  const ogd = document.querySelector('meta[property="og:description"]');
  if (ogd) ogd.setAttribute('content', t('docDesc'));
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
  for (const b of document.querySelectorAll('.lang button')) {
    b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
  }
  renderChips();
}

function setLang(l) {
  lang = l;
  try { localStorage.setItem('fitcalc-lang', l); } catch (e) { /* 忽略 */ }
  applyLang();
  update(false);
}

/* ---------- 计算与渲染 ---------- */
function errText(e) {
  const code = typeof e === 'string' ? e : (e instanceof Iso286Error ? e.code : 'UNKNOWN');
  const msg = I18N[lang].errors[code] || I18N[lang].errors.UNKNOWN;
  return msg.replace('{max}', String(MAX_SIZE));
}

function clearErrors() {
  el.errSize.textContent = '';
  el.errFit.textContent = '';
  el.size.removeAttribute('aria-invalid');
  el.fit.removeAttribute('aria-invalid');
}

function showFailure(where, e) {
  last = null;
  const msg = errText(e);
  if (where === 'size') {
    el.errSize.textContent = msg;
    el.size.setAttribute('aria-invalid', 'true');
  } else {
    el.errFit.textContent = msg;
    el.fit.setAttribute('aria-invalid', 'true');
  }
  el.badge.hidden = true;
  el.body.hidden = true;
  el.notice.hidden = false;
  el.notice.textContent = msg;
  el.diagram.innerHTML = `<div class="empty">${t('diagramEmpty')}</div>`;
}

function compute() {
  clearErrors();
  const size = parseFloat(el.size.value);
  if (!Number.isFinite(size) || size <= 0 || size > MAX_SIZE) {
    showFailure('size', 'SIZE_RANGE');
    return null;
  }
  const fitStr = normFit(el.fit.value);
  let parsed;
  try { parsed = parseFit(fitStr); } catch (e) { showFailure('fit', e); return null; }
  syncSelects(parsed);
  try { return calcFit(size, parsed); } catch (e) { showFailure('fit', e); return null; }
}

function update(writeUrl = true) {
  markActiveChip();
  const r = compute();
  if (writeUrl) writeHash();
  if (!r) return;
  last = r;
  el.notice.hidden = true;
  el.body.hidden = false;
  renderBadge(r);
  renderTable(r);
  renderClearances(r);
  renderSummary(r);
  renderDiagram();
}

function renderBadge(r) {
  el.badge.hidden = false;
  el.badge.className = 'badge ' + r.type;
  el.badge.textContent = t(r.type);
}

function cellDev(um) {
  return `${fmtUm(um)} µm<span class="sub-v">${fmtDevMm(um)} mm</span>`;
}
function cellTol(um) {
  return `${rnd(um, 2)} µm<span class="sub-v">${trimMm(um / 1000)} mm</span>`;
}

function renderTable(r) {
  const { hole: h, shaft: s, size } = r;
  const tolH = h.upper - h.lower;
  const tolS = s.upper - s.lower;
  const rows = [
    [t('rowClass'), `Ø${size} ${h.code}`, `Ø${size} ${s.code}`, 'code'],
    [t('rowUpper'), cellDev(h.upper), cellDev(s.upper)],
    [t('rowLower'), cellDev(h.lower), cellDev(s.lower)],
    [t('rowTol'), cellTol(tolH), cellTol(tolS)],
    [t('rowMax'), fmtSizeMm(size, h.upper) + ' mm', fmtSizeMm(size, s.upper) + ' mm'],
    [t('rowMin'), fmtSizeMm(size, h.lower) + ' mm', fmtSizeMm(size, s.lower) + ' mm'],
  ];
  el.tbody.innerHTML = rows.map(([label, a, b, cls]) =>
    `<tr><td>${label}</td><td${cls ? ` class="${cls}"` : ''}>${a}</td><td${cls ? ` class="${cls}"` : ''}>${b}</td></tr>`
  ).join('');
}

// maxClearance = 孔上偏差 − 轴下偏差；minClearance = 孔下偏差 − 轴上偏差
function clearanceMetrics(r) {
  const a = r.maxClearance, b = r.minClearance;
  return [
    { label: a >= 0 ? t('maxClearance') : t('minInterference'), um: a },
    { label: b >= 0 ? t('minClearance') : t('maxInterference'), um: b },
  ];
}

function renderClearances(r) {
  const [a, b] = clearanceMetrics(r);
  const items = [a, b];
  el.clearances.innerHTML = items.map((m) =>
    `<div class="metric"><div class="m-label">${m.label}</div>` +
    `<div class="m-val">${fmtAbsMm(m.um)} mm</div>` +
    `<div class="m-um">${rnd(Math.abs(m.um), 2)} µm</div></div>`
  ).join('');
}

function renderSummary(r) {
  const { hole: h, shaft: s, size } = r;
  const sep = lang === 'zh' ? '，' : ', ';
  let tail;
  if (r.type === 'clearance') {
    tail = `${t('sumClearance')} ${fmtAbsMm(r.minClearance)}…${fmtAbsMm(r.maxClearance)} mm`;
  } else if (r.type === 'interference') {
    tail = `${t('sumInterference')} ${fmtAbsMm(r.maxClearance)}…${fmtAbsMm(r.minClearance)} mm`;
  } else {
    tail = `${t('sumTransition')}${sep}${t('sumMaxClr')} ${fmtAbsMm(r.maxClearance)} / ${t('sumMaxInt')} ${fmtAbsMm(r.minClearance)} mm`;
  }
  const sp = lang === 'zh' ? '' : ' ';
  el.summary.textContent =
    `Ø${size} ${h.code}/${s.code} — ${t('sumHole')}${sp}${fmtDevMm(h.upper)}/${fmtDevMm(h.lower)}${sep}` +
    `${t('sumShaft')}${sp}${fmtDevMm(s.upper)}/${fmtDevMm(s.lower)}${sep}${tail}`;
}

/* ---------- 公差带图 ---------- */
function niceStep(range, target) {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const m = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
  return m * mag;
}

function renderDiagram() {
  if (!last) return;
  const r = last;
  const W = Math.max(300, Math.round(el.diagram.clientWidth || 600));
  const H = W < 480 ? 300 : 340;
  const left = 48, right = 12, top = 30, bottom = 40;
  const plotW = W - left - right;
  const plotH = H - top - bottom;

  const vals = [0, r.hole.upper, r.hole.lower, r.shaft.upper, r.shaft.lower];
  let lo = Math.min(...vals), hi = Math.max(...vals);
  const span = hi - lo || 10;
  lo -= span * 0.14; hi += span * 0.14;
  const step = niceStep(hi - lo, 5);
  const t0 = Math.floor(lo / step) * step;
  const t1 = Math.ceil(hi / step) * step;
  const y = (v) => top + ((t1 - v) / (t1 - t0)) * plotH;

  const gap = 24;
  const zw = Math.min(170, (plotW - 3 * gap) / 2);
  const x0 = left + (plotW - (2 * zw + gap)) / 2;
  const xs = [x0, x0 + zw + gap];

  const parts = [];
  // 网格与刻度
  const decimals = step < 1 ? 1 : 0;
  for (let v = t0; v <= t1 + step / 1000; v += step) {
    const vv = rnd(v, 6);
    const yy = y(vv);
    if (vv !== 0) parts.push(`<line class="grid" x1="${left}" x2="${W - right}" y1="${yy}" y2="${yy}"/>`);
    const lab = vv === 0 ? '0' : (vv > 0 ? '+' : MINUS) + Math.abs(vv).toFixed(decimals);
    parts.push(`<text x="${left - 6}" y="${yy + 4}" text-anchor="end">${lab}</text>`);
  }
  parts.push(`<text x="4" y="${top - 14}">µm</text>`);

  const zone = (x, dev, cls, tcls, name) => {
    const yU = y(dev.upper), yL = y(dev.lower);
    const h = Math.max(yL - yU, 2);
    const cx = x + zw / 2;
    parts.push(`<rect class="${cls}" x="${x}" y="${yU}" width="${zw}" height="${h}" rx="2"/>`);
    parts.push(`<text class="halo t-dev" x="${cx}" y="${yU - 6}" text-anchor="middle">${fmtUm(dev.upper)}</text>`);
    parts.push(`<text class="halo t-dev" x="${cx}" y="${yU + h + 14}" text-anchor="middle">${fmtUm(dev.lower)}</text>`);
    parts.push(`<text class="${tcls}" x="${cx}" y="${H - 14}" text-anchor="middle">${name}</text>`);
  };
  // 零线（在区域之前绘制以便区域覆盖其上；再画一次文字）
  const yz = y(0);
  parts.push(`<line class="zero" x1="${left}" x2="${W - right}" y1="${yz}" y2="${yz}"/>`);
  zone(xs[0], r.hole, 'z-hole', 't-hole', `${t('hole')} ${r.hole.code}`);
  zone(xs[1], r.shaft, 'z-shaft', 't-shaft', `${t('shaft')} ${r.shaft.code}`);
  // 零线说明放在图的右上角，避免和贴近零线的偏差数字重叠
  parts.push(`<text class="t-zero" x="${W - right - 2}" y="${top - 14}" text-anchor="end">${t('zeroLine')}</text>`);

  const label = el.summary.textContent;
  el.diagram.innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label.replace(/"/g, '&quot;')}">` +
    parts.join('') + '</svg>';
}

/* ---------- URL hash ---------- */
function readHash() {
  const h = location.hash.replace(/^#/, '');
  if (!h) return;
  const p = new URLSearchParams(h);
  const d = p.get('d'), f = p.get('fit');
  if (d !== null && d !== '') el.size.value = d;
  if (f) el.fit.value = f;
}

function writeHash() {
  const d = el.size.value.trim();
  const f = normFit(el.fit.value);
  const hash = `#d=${encodeURIComponent(d)}&fit=${encodeURIComponent(f).replace(/%2F/gi, '/')}`;
  try { history.replaceState(null, '', hash); } catch (e) { /* 忽略 */ }
}

/* ---------- 事件 ---------- */
function onFitText() {
  update();
}
el.size.addEventListener('input', () => update());
el.fit.addEventListener('input', onFitText);
for (const s of [el.holeLetter, el.holeGrade, el.shaftLetter, el.shaftGrade]) {
  s.addEventListener('change', () => {
    el.fit.value = fitFromSelects();
    update();
  });
}
for (const b of document.querySelectorAll('.lang button')) {
  b.addEventListener('click', () => setLang(b.dataset.lang));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e2) { /* 忽略 */ }
    ta.remove();
    return ok;
  }
}
el.copy.addEventListener('click', async () => {
  if (!last) return;
  const ok = await copyText(el.summary.textContent);
  if (ok) {
    el.copy.textContent = t('copied');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { el.copy.textContent = t('copy'); }, 1500);
  }
});

let lastW = 0;
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => {
    const w = el.diagram.clientWidth;
    if (w !== lastW) { lastW = w; renderDiagram(); }
  }).observe(el.diagram);
} else {
  window.addEventListener('resize', renderDiagram);
}

window.addEventListener('hashchange', () => {
  readHash();
  update(false);
});

/* ---------- 启动 ---------- */
lang = detectLang();
readHash();
applyLang();
update(false);
document.documentElement.classList.remove('i18n-pending');
