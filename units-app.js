import { detectLang, saveLang, renderNav } from './site.js?v=bf0267f5';
import {
  QUANTITIES, UnitsError, getQuantity, convert, convertAll, powerTorqueSpeed,
  formatNumber, groupThousands,
} from './units.js?v=fbb3b84e';

/* ---------- 文案字典 ---------- */
const I18N = {
  en: {
    docTitle: 'Engineering Unit Converter — Force, Torque, Pressure, Power, Speed',
    docDesc: 'Free engineering unit converter for mechanical design: force (N, kgf, lbf), torque (N·m, kgf·m, lbf·ft), stress and pressure (MPa, bar, psi), power (kW, hp, PS), rpm, temperature and more, plus a power–torque–speed calculator.',
    h1: 'Engineering Unit Converter',
    subtitle: 'Force, torque, pressure, power, speed and more',
    inputsTitle: 'Inputs',
    qtyLabel: 'Quantity',
    valLabel: 'Value',
    fromLabel: 'From unit',
    resultsTitle: 'All units',
    resultsHint: 'Tap a value to copy it. Tap a unit to make it the input unit.',
    thUnit: 'Unit',
    thValue: 'Value',
    copyTitle: 'Copy {v}',
    setTitle: 'Use {u} as input unit',
    copied: 'Copied {v}',
    copyFail: 'Copy failed',
    commonTitle: 'Common conversions',
    errValue: 'Please enter a number.',
    errRange: 'Below absolute zero (0 K).',
    errOther: 'Cannot convert this input.',
    ptsTitle: 'Power ↔ torque ↔ speed',
    solveLabel: 'Solve for',
    solveT: 'Torque T',
    solveP: 'Power P',
    solven: 'Speed n',
    pLabel: 'Power P (kW)',
    tLabel: 'Torque T (N·m)',
    nLabel: 'Speed n (rpm)',
    ptsErrInput: 'Enter the two known values as numbers.',
    ptsErrZero: 'Cannot divide by zero — the divisor must not be 0.',
    ptsExtra: 'P = {hp} hp = {ps} PS · T = {lbft} lbf·ft = {kgfm} kgf·m · ω = {w} rad/s',
    ptsNote: 'T [N·m] = 9549.3 × P [kW] / n [rpm]. The constant is the exact value 30000/π ≈ 9549.297 (from T = P/ω); handbooks often round it to 9550, which differs by only 0.007 %.',
    aboutTitle: 'Definitions used',
    aboutBody: `
      <p>Every unit is defined by an exact factor to its SI base unit, so conversions do not accumulate rounding errors. Results are shown with up to 7 significant digits; very large or small numbers use scientific notation (e.g. <code>1.2e-6</code>).</p>
      <ul>
        <li><strong>Length & mass:</strong> 1 in = 25.4 mm, 1 ft = 0.3048 m, 1 mi = 1609.344 m, 1 lb = 0.45359237 kg (all exact).</li>
        <li><strong>Force:</strong> g<sub>n</sub> = 9.80665 m/s²; 1 kgf = 9.80665 N; 1 lbf = 0.45359237 × 9.80665 N ≈ 4.4482216 N; 1 kip = 1000 lbf.</li>
        <li><strong>Pressure:</strong> 1 MPa = 1 N/mm²; 1 psi = 1 lbf/in² ≈ 6894.757 Pa; 1 ksi = 1000 psi; 1 bar = 10⁵ Pa; 1 atm = 101 325 Pa; 1 mmHg = 133.322387415 Pa; 1 kgf/cm² = 98 066.5 Pa.</li>
        <li><strong>Power:</strong> mechanical horsepower 1 hp = 550 ft·lbf/s ≈ 745.70 W; metric horsepower 1 PS = 75 kgf·m/s = 735.49875 W.</li>
        <li><strong>Energy:</strong> calories are <em>thermochemical</em>: 1 kcal = 4184 J (the International Table kcal is 4186.8 J, 0.07 % larger). BTU is the IT value 1055.056 J. 1 kWh = 3.6 MJ.</li>
        <li><strong>Rotation:</strong> 1 rpm = 2π/60 rad/s = 6 °/s; 1 r/s = 1 Hz = 60 rpm.</li>
        <li><strong>Temperature:</strong> affine scales — K = °C + 273.15, °F = °C × 9/5 + 32, °R = K × 9/5. This converts temperatures, not temperature <em>differences</em> (for a difference, 1 K = 1 °C = 1.8 °F).</li>
        <li><strong>Section properties:</strong> area moment of inertia (mm⁴, cm⁴, in⁴) and section modulus (mm³, cm³, in³); 1 in⁴ = 416 231.4 mm⁴.</li>
      </ul>`,
    footerText: 'Open source, runs entirely in your browser.',
    footerLink: 'GitHub',
  },
  zh: {
    docTitle: '工程单位换算器 — 力、扭矩、压强、功率、转速',
    docDesc: '面向机械设计的免费工程单位换算：力（N、kgf、lbf）、扭矩（N·m、kgf·m、lbf·ft）、应力与压强（MPa、bar、psi）、功率（kW、hp、PS）、转速、温度等，并附功率–扭矩–转速计算。',
    h1: '工程单位换算',
    subtitle: '力、扭矩、压强、功率、转速等常用工程单位',
    inputsTitle: '输入',
    qtyLabel: '物理量',
    valLabel: '数值',
    fromLabel: '原单位',
    resultsTitle: '全部单位',
    resultsHint: '点击数值即可复制；点击单位可把它设为输入单位。',
    thUnit: '单位',
    thValue: '数值',
    copyTitle: '复制 {v}',
    setTitle: '以 {u} 作为输入单位',
    copied: '已复制 {v}',
    copyFail: '复制失败',
    commonTitle: '常用换算',
    errValue: '请输入一个数字。',
    errRange: '低于绝对零度（0 K）。',
    errOther: '该输入无法换算。',
    ptsTitle: '功率 ↔ 扭矩 ↔ 转速',
    solveLabel: '求解',
    solveT: '扭矩 T',
    solveP: '功率 P',
    solven: '转速 n',
    pLabel: '功率 P (kW)',
    tLabel: '扭矩 T (N·m)',
    nLabel: '转速 n (r/min)',
    ptsErrInput: '请把两个已知量填成数字。',
    ptsErrZero: '除数不能为 0。',
    ptsExtra: 'P = {hp} hp（英制马力）= {ps} PS（公制马力）· T = {lbft} lbf·ft = {kgfm} kgf·m · ω = {w} rad/s',
    ptsNote: 'T [N·m] = 9549.3 × P [kW] / n [r/min]。常数取精确值 30000/π ≈ 9549.297（由 T = P/ω 推得）；手册中常取整为 9550，两者仅差 0.007 %。',
    aboutTitle: '采用的定义',
    aboutBody: `
      <p>每个单位都用到 SI 基准单位的精确系数定义，换算不会累积舍入误差。结果最多显示 7 位有效数字，很大或很小的数用科学计数法（如 <code>1.2e-6</code>）。</p>
      <ul>
        <li><strong>长度与质量：</strong>1 in = 25.4 mm，1 ft = 0.3048 m，1 mi = 1609.344 m，1 lb = 0.45359237 kg（均为精确值）。</li>
        <li><strong>力：</strong>标准重力加速度 g<sub>n</sub> = 9.80665 m/s²；1 kgf（千克力）= 9.80665 N；1 lbf（磅力）= 0.45359237 × 9.80665 N ≈ 4.4482216 N；1 kip = 1000 lbf。</li>
        <li><strong>压强：</strong>1 MPa = 1 N/mm²；1 psi = 1 lbf/in² ≈ 6894.757 Pa；1 ksi = 1000 psi；1 bar = 10⁵ Pa；1 atm = 101 325 Pa；1 mmHg = 133.322387415 Pa；1 kgf/cm² = 98 066.5 Pa。</li>
        <li><strong>功率：</strong>英制机械马力 1 hp = 550 ft·lbf/s ≈ 745.70 W；公制马力 1 PS = 75 kgf·m/s = 735.49875 W。</li>
        <li><strong>能量：</strong>卡路里采用<em>热化学卡</em>：1 kcal = 4184 J（国际蒸汽表卡 kcal<sub>IT</sub> = 4186.8 J，大 0.07 %）。BTU 取 IT 值 1055.056 J。1 kWh（度）= 3.6 MJ。</li>
        <li><strong>转速：</strong>1 r/min = 2π/60 rad/s = 6 °/s；1 r/s = 1 Hz = 60 r/min。</li>
        <li><strong>温度：</strong>仿射换算 —— K = °C + 273.15，°F = °C × 9/5 + 32，°R = K × 9/5。这里换算的是温度值，不是<em>温差</em>（温差 1 K = 1 °C = 1.8 °F）。</li>
        <li><strong>截面参数：</strong>截面惯性矩（mm⁴、cm⁴、in⁴）与抗弯截面系数（mm³、cm³、in³）；1 in⁴ = 416 231.4 mm⁴。</li>
      </ul>`,
    footerText: '开源项目，完全在浏览器中运行。',
    footerLink: 'GitHub',
  },
};

// 常用换算快捷项：[物理量, 原单位, 目标单位]，数值固定为 1
const COMMON = [
  ['force', 'kgf', 'N'],
  ['force', 'lbf', 'N'],
  ['torque', 'lbfft', 'Nm'],
  ['torque', 'kgfm', 'Nm'],
  ['pressure', 'psi', 'kPa'],
  ['pressure', 'ksi', 'MPa'],
  ['pressure', 'bar', 'psi'],
  ['power', 'hp', 'kW'],
  ['power', 'PS', 'kW'],
  ['length', 'in', 'mm'],
  ['mass', 'lb', 'kg'],
  ['rotation', 'rpm', 'rads'],
];

/* ---------- 状态与 DOM ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  qtabs: $('qtabs'), val: $('val'), from: $('from'), err: $('err'),
  out: $('out-body'), copyStatus: $('copy-status'), common: $('common'),
  solve: $('solve'), ptsErr: $('pts-err'), ptsExtra: $('pts-extra'),
  pts: { P: $('pts-P'), T: $('pts-T'), n: $('pts-n') },
};

let lang = 'en';
let qid = 'force';
const lastUnit = {};     // 记住每个物理量上次用的单位
let solveFor = 'T';
let copyTimer = 0;

const t = (k) => I18N[lang][k];
const zh = () => lang === 'zh';
const uname = (x) => (zh() ? x.nameZh : x.name);

// 解析用户输入：允许空格、科学计数法；只有一个逗号且没有小数点时把逗号当小数点
function parseNum(s) {
  let x = String(s).trim().replace(/[\s  _]/g, '').replace(/[−–]/g, '-');
  if (!x.includes('.') && (x.match(/,/g) || []).length === 1) x = x.replace(',', '.');
  else x = x.replace(/,/g, '');
  if (x === '' || x === '-' || x === '+') return NaN;
  return Number(x);
}

const fmt = (v) => formatNumber(v, 7);
const fmtShow = (v) => groupThousands(fmt(v), ' '); // 显示时用窄空格分组，复制时不带

/* ---------- 物理量标签与单位下拉 ---------- */
function renderTabs() {
  el.qtabs.innerHTML = QUANTITIES.map((q) =>
    `<button type="button" data-q="${q.id}" aria-pressed="${q.id === qid}">${zh() ? q.nameZh : q.name}</button>`).join('');
  const active = el.qtabs.querySelector('[aria-pressed="true"]');
  if (active && el.qtabs.scrollWidth > el.qtabs.clientWidth) {
    el.qtabs.scrollLeft = active.offsetLeft - el.qtabs.clientWidth / 2 + active.offsetWidth / 2;
  }
}

function renderFromOptions(unitId) {
  const q = getQuantity(qid);
  el.from.innerHTML = '';
  for (const x of q.units) {
    const o = document.createElement('option');
    o.value = x.id;
    o.textContent = `${x.symbol} — ${uname(x)}`;
    el.from.appendChild(o);
  }
  const want = unitId || lastUnit[qid] || defaultUnit(q);
  el.from.value = q.units.some((x) => x.id === want) ? want : defaultUnit(q);
}

// 默认输入单位：优先 SI 符号对应的那个
function defaultUnit(q) {
  const hit = q.units.find((x) => x.symbol === q.si);
  return (hit || q.units[0]).id;
}

function renderCommon() {
  el.common.innerHTML = COMMON.map(([q, a, b], i) => {
    const qq = getQuantity(q);
    const ua = qq.units.find((x) => x.id === a), ub = qq.units.find((x) => x.id === b);
    const v = formatNumber(convert(q, 1, a, b), 6);
    return `<button type="button" class="chip" data-i="${i}" title="${zh() ? qq.nameZh : qq.name}">` +
      `<b>1 ${ua.symbol}</b><span>= ${v} ${ub.symbol}</span></button>`;
  }).join('');
}

/* ---------- 语言 ---------- */
function applyLang() {
  document.documentElement.lang = zh() ? 'zh-CN' : 'en';
  renderNav(lang);
  document.title = t('docTitle');
  const set = (sel, v) => { const n = document.querySelector(sel); if (n) n.setAttribute('content', v); };
  set('meta[name="description"]', t('docDesc'));
  set('meta[property="og:title"]', t('docTitle'));
  set('meta[property="og:description"]', t('docDesc'));
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.innerHTML = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
  for (const b of document.querySelectorAll('.lang button')) {
    b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
  }
  renderTabs();
  renderFromOptions(el.from.value);
  renderCommon();
}

function setLang(l) {
  lang = l;
  saveLang(l);
  applyLang();
  update(false);
  updatePts(false);
}

/* ---------- 换算与渲染 ---------- */
function errText(e) {
  if (e instanceof UnitsError) {
    if (e.code === 'VALUE') return t('errValue');
    if (e.code === 'RANGE') return t('errRange');
  }
  return t('errOther');
}

function update(writeUrl = true) {
  el.err.textContent = '';
  lastUnit[qid] = el.from.value;
  if (writeUrl) writeHash();
  const v = parseNum(el.val.value);
  let rows;
  try {
    rows = convertAll(qid, v, el.from.value);
  } catch (e) {
    el.val.setAttribute('aria-invalid', 'true');
    el.err.textContent = errText(e);
    el.out.innerHTML = '';
    return;
  }
  el.val.removeAttribute('aria-invalid');
  el.out.innerHTML = rows.map(({ unit, value }) => {
    const sel = unit.id === el.from.value;
    const raw = fmt(value);
    return `<tr${sel ? ' class="sel" aria-current="true"' : ''}>` +
      `<td><button type="button" class="u-set" data-u="${unit.id}" title="${t('setTitle').replace('{u}', unit.symbol)}">` +
      `<b>${unit.symbol}</b><small>${uname(unit)}</small></button></td>` +
      `<td><button type="button" class="u-val" data-copy="${raw}" data-full="${formatNumber(value, 12)}" title="${t('copyTitle').replace('{v}', raw + ' ' + unit.symbol)}">${fmtShow(value)}</button></td>` +
      '</tr>';
  }).join('');
}

function selectQuantity(id, unitId) {
  if (!QUANTITIES.some((q) => q.id === id)) return;
  qid = id;
  renderTabs();
  renderFromOptions(unitId);
}

/* ---------- 功率–扭矩–转速 ---------- */
function renderSolve() {
  for (const b of el.solve.querySelectorAll('button')) {
    b.setAttribute('aria-pressed', b.dataset.solve === solveFor ? 'true' : 'false');
  }
  for (const k of ['P', 'T', 'n']) {
    const out = k === solveFor;
    el.pts[k].readOnly = out;
    el.pts[k].closest('.field').classList.toggle('solved', out);
    el.pts[k].tabIndex = out ? -1 : 0;
  }
}

function updatePts(writeUrl = true) {
  el.ptsErr.textContent = '';
  el.ptsExtra.textContent = '';
  const arg = {};
  for (const k of ['P', 'T', 'n']) if (k !== solveFor) arg[k] = parseNum(el.pts[k].value);
  if (writeUrl) writeHash();
  let r;
  try {
    if (Object.values(arg).some((x) => !Number.isFinite(x))) throw new UnitsError('VALUE');
    r = powerTorqueSpeed(arg);
  } catch (e) {
    el.pts[solveFor].value = '';
    el.ptsErr.textContent = e instanceof UnitsError && e.code === 'DIV0' ? t('ptsErrZero') : t('ptsErrInput');
    return;
  }
  el.pts[solveFor].value = formatNumber(r[solveFor], 6);
  el.ptsExtra.textContent = t('ptsExtra')
    .replace('{hp}', formatNumber(convert('power', r.P, 'kW', 'hp'), 5))
    .replace('{ps}', formatNumber(convert('power', r.P, 'kW', 'PS'), 5))
    .replace('{lbft}', formatNumber(convert('torque', r.T, 'Nm', 'lbfft'), 5))
    .replace('{kgfm}', formatNumber(convert('torque', r.T, 'Nm', 'kgfm'), 5))
    .replace('{w}', formatNumber(convert('rotation', r.n, 'rpm', 'rads'), 5));
}

/* ---------- URL hash ---------- */
function readHash() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  const q = p.get('q');
  if (q && QUANTITIES.some((x) => x.id === q)) selectQuantity(q, p.get('u'));
  else if (p.get('u')) renderFromOptions(p.get('u'));
  const v = p.get('v');
  if (v !== null && v !== '') el.val.value = v;
  const s = p.get('s');
  if (s === 'P' || s === 'T' || s === 'n') solveFor = s;
  for (const k of ['P', 'T', 'n']) {
    const x = p.get(k);
    if (x !== null && k !== solveFor) el.pts[k].value = x;
  }
}

function writeHash() {
  const q = new URLSearchParams({ q: qid, v: el.val.value.trim(), u: el.from.value, s: solveFor });
  for (const k of ['P', 'T', 'n']) if (k !== solveFor) q.set(k, el.pts[k].value.trim());
  try { history.replaceState(null, '', '#' + q.toString()); } catch (e) { /* 忽略 */ }
}

/* ---------- 复制 ---------- */
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

function flash(msg) {
  el.copyStatus.textContent = msg;
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { el.copyStatus.textContent = ''; }, 1600);
}

/* ---------- 事件 ---------- */
el.qtabs.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-q]');
  if (!b || b.dataset.q === qid) return;
  selectQuantity(b.dataset.q);
  update();
});
el.val.addEventListener('input', () => update());
el.from.addEventListener('change', () => update());

el.out.addEventListener('click', async (e) => {
  const set = e.target.closest('.u-set');
  if (set) {
    // 把该行的数值连同单位一起设为新的输入，保持物理量不变
    const cp = set.closest('tr').querySelector('.u-val');
    if (cp) el.val.value = cp.dataset.full; // 用 12 位有效数字，避免来回切换时丢精度
    el.from.value = set.dataset.u;
    update();
    const again = el.out.querySelector(`.u-set[data-u="${set.dataset.u}"]`);
    if (again) again.focus();
    return;
  }
  const val = e.target.closest('.u-val');
  if (val) {
    const ok = await copyText(val.dataset.copy);
    flash(ok ? t('copied').replace('{v}', val.dataset.copy) : t('copyFail'));
  }
});

el.common.addEventListener('click', (e) => {
  const b = e.target.closest('.chip[data-i]');
  if (!b) return;
  const [q, a] = COMMON[Number(b.dataset.i)];
  selectQuantity(q, a);
  el.val.value = '1';
  update();
});

el.solve.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-solve]');
  if (!b || b.dataset.solve === solveFor) return;
  solveFor = b.dataset.solve;
  renderSolve();
  updatePts();
});
for (const k of ['P', 'T', 'n']) el.pts[k].addEventListener('input', () => updatePts());

for (const b of document.querySelectorAll('.lang button')) {
  b.addEventListener('click', () => setLang(b.dataset.lang));
}

window.addEventListener('hashchange', () => {
  readHash();
  renderSolve();
  update(false);
  updatePts(false);
});

/* ---------- 启动 ---------- */
lang = detectLang();
renderFromOptions();
readHash();
applyLang();
renderSolve();
update(false);
updatePts(false);
document.documentElement.classList.remove('i18n-pending');
