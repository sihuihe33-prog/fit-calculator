import {
  BoltError, THREADS, CLASSES, HEAD_TYPES, FRICTION_PRESETS, calcBolt,
} from './bolt.js';

/* ---------- 文案字典 ---------- */
const I18N = {
  en: {
    docTitle: 'Bolt Torque Calculator — Tightening Torque & Preload (VDI 2230)',
    docDesc: 'Free bolt tightening torque calculator for M3–M36 coarse-thread steel bolts, classes 4.6–12.9. Get preload, torque, K-factor and a friction breakdown based on VDI 2230.',
    navFits: 'Fits & Tolerances',
    navBolt: 'Bolt Torque',
    h1: 'Bolt Torque Calculator',
    subtitle: 'Tightening torque and preload per VDI 2230',
    inputsTitle: 'Inputs',
    sizeLabel: 'Thread size',
    clsLabel: 'Property class',
    headLabel: 'Head type',
    headhex: 'Hex bolt',
    headsocket: 'Socket head',
    nuLabel: 'Utilization ν (%)',
    presetLabel: 'Friction condition',
    custom: 'Custom',
    muGLabel: 'μG (thread)',
    muKLabel: 'μK (head)',
    rangeLabel: 'Typical μ range: ',
    resultsTitle: 'Results',
    torqueLabel: 'Tightening torque M<sub>A</sub>',
    preloadLabel: 'Preload F<sub>M</sub>',
    asLabel: 'Stress area A<sub>s</sub>',
    d2Label: 'Pitch dia. d<sub>2</sub>',
    rpLabel: 'Yield R<sub>p0.2</sub>',
    kLabel: 'K-factor',
    sigLabel: 'Equivalent stress',
    sigDetail: 'σ {s} · τ {t} MPa',
    breakTitle: 'Where does the torque go?',
    segPitch: 'Bolt stretch',
    segThread: 'Thread friction',
    segHead: 'Head friction',
    summaryTitle: 'Summary',
    copy: 'Copy',
    copied: 'Copied',
    refTitle: 'Quick reference',
    refNote: 'All sizes for class {cls}, {head}, μG={g}, μK={k}, ν={nu}%. Click a row to select it.',
    thSize: 'Size',
    thTorque: 'Torque (N·m)',
    thPreload: 'Preload (kN)',
    errInput: 'Please check the inputs: μ must be between 0.04 and 0.5 and ν between 50 and 100 %.',
    errOther: 'Calculation failed for this input.',
    aboutTitle: 'How it is calculated',
    aboutBody: `
      <p><strong>Method (VDI 2230).</strong> The maximum permissible assembly preload <code>F<sub>M</sub></code> is taken from the yield strength <code>R<sub>p0.2</sub></code> of the bolt, the stress area <code>A<sub>s</sub></code> and the utilization <code>ν</code>, accounting for the combined tension and torsion that occurs while tightening (the thread torque twists the shank, so less tension is allowed than in pure tension). The tightening torque is then</p>
      <p><code>M<sub>A</sub> = F<sub>M</sub> · (0.16·P + 0.58·d<sub>2</sub>·μ<sub>G</sub> + D<sub>Km</sub>/2·μ<sub>K</sub>)</code></p>
      <p>with thread pitch <code>P</code>, pitch diameter <code>d<sub>2</sub></code>, thread friction <code>μ<sub>G</sub></code>, head/nut bearing friction <code>μ<sub>K</sub></code> and effective bearing diameter <code>D<sub>Km</sub></code>.</p>
      <h3>Why friction matters</h3>
      <p>Only a small part of the torque stretches the bolt. Most of it is lost to friction in the thread and under the head, so a change of just ±0.02 in μ shifts the preload obtained from a given torque by a large amount. Even with a calibrated torque wrench, the actual preload typically scatters by about ±25 %. Lubricated, plated or re-used fasteners can differ a lot from the presets.</p>
      <h3>Assumptions</h3>
      <p>Metric coarse threads M3–M36, steel bolts of classes 4.6–12.9, medium clearance holes (ISO 273), hex bolts (ISO 4014/4017) or socket head cap screws (ISO 4762), static assembly preload.</p>`,
    disclaimer: 'Guide values. Check against your fastener supplier data and VDI 2230 for critical joints.',
    footerText: 'Open source, runs entirely in your browser.',
    footerLink: 'GitHub',
  },
  zh: {
    docTitle: '螺栓拧紧扭矩计算器 — 预紧力与扭矩（VDI 2230）',
    docDesc: '免费的螺栓拧紧扭矩计算器，适用于 M3–M36 粗牙钢制螺栓，性能等级 4.6–12.9。基于 VDI 2230 给出预紧力、扭矩、扭矩系数 K 以及摩擦损耗分解。',
    navFits: '公差配合',
    navBolt: '螺栓扭矩',
    h1: '螺栓拧紧扭矩计算器',
    subtitle: '基于 VDI 2230 的拧紧扭矩与预紧力',
    inputsTitle: '输入',
    sizeLabel: '螺纹规格',
    clsLabel: '性能等级',
    headLabel: '头部类型',
    headhex: '六角头',
    headsocket: '内六角圆柱头',
    nuLabel: '利用系数 ν (%)',
    presetLabel: '摩擦条件',
    custom: '自定义',
    muGLabel: 'μG（螺纹）',
    muKLabel: 'μK（头部支承面）',
    rangeLabel: '典型 μ 范围：',
    resultsTitle: '计算结果',
    torqueLabel: '拧紧扭矩 M<sub>A</sub>',
    preloadLabel: '预紧力 F<sub>M</sub>',
    asLabel: '应力截面积 A<sub>s</sub>',
    d2Label: '中径 d<sub>2</sub>',
    rpLabel: '屈服强度 R<sub>p0.2</sub>',
    kLabel: '扭矩系数 K',
    sigLabel: '当量应力',
    sigDetail: 'σ {s} · τ {t} MPa',
    breakTitle: '扭矩都用到哪里去了？',
    segPitch: '拉伸螺栓',
    segThread: '螺纹摩擦',
    segHead: '头部摩擦',
    summaryTitle: '摘要',
    copy: '复制',
    copied: '已复制',
    refTitle: '速查表',
    refNote: '等级 {cls}、{head}、μG={g}、μK={k}、ν={nu}% 下的全部规格。点击某一行即可选中。',
    thSize: '规格',
    thTorque: '扭矩 (N·m)',
    thPreload: '预紧力 (kN)',
    errInput: '请检查输入：μ 须在 0.04 到 0.5 之间，ν 须在 50 到 100 % 之间。',
    errOther: '该输入无法计算。',
    aboutTitle: '计算方法',
    aboutBody: `
      <p><strong>方法（VDI 2230）。</strong>根据螺栓屈服强度 <code>R<sub>p0.2</sub></code>、应力截面积 <code>A<sub>s</sub></code> 和利用系数 <code>ν</code>，并考虑拧紧时拉伸与扭转的复合应力（螺纹扭矩会使杆部受扭，所以允许的拉力比纯拉伸时小），得到最大允许装配预紧力 <code>F<sub>M</sub></code>。拧紧扭矩为</p>
      <p><code>M<sub>A</sub> = F<sub>M</sub> · (0.16·P + 0.58·d<sub>2</sub>·μ<sub>G</sub> + D<sub>Km</sub>/2·μ<sub>K</sub>)</code></p>
      <p>其中 <code>P</code> 为螺距，<code>d<sub>2</sub></code> 为中径，<code>μ<sub>G</sub></code> 为螺纹摩擦系数，<code>μ<sub>K</sub></code> 为头部（或螺母）支承面摩擦系数，<code>D<sub>Km</sub></code> 为支承面有效直径。</p>
      <h3>为什么摩擦系数很关键</h3>
      <p>真正用来拉伸螺栓的扭矩只占一小部分，大部分都消耗在螺纹和头部支承面的摩擦上。μ 只变化 ±0.02，同一扭矩得到的预紧力就会有很大差别。即使使用校准过的扭矩扳手，实际预紧力的离散度通常仍有约 ±25 %。润滑、镀层或重复使用的紧固件与预设值可能相差很大。</p>
      <h3>适用假设</h3>
      <p>公制粗牙螺纹 M3–M36，钢制螺栓，性能等级 4.6–12.9，中等系列通孔（ISO 273），六角头螺栓（ISO 4014/4017）或内六角圆柱头螺钉（ISO 4762），静态装配预紧力。</p>`,
    disclaimer: '数值仅供参考。关键连接请对照紧固件供应商数据和 VDI 2230 核实。',
    footerText: '开源项目，完全在浏览器中运行。',
    footerLink: 'GitHub',
  },
};

/* ---------- 状态与 DOM ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  size: $('size'), cls: $('cls'), head: $('head'), nu: $('nu'),
  preset: $('preset'), muG: $('muG'), muK: $('muK'), presetRange: $('preset-range'),
  err: $('err'), body: $('results-body'),
  torque: $('r-torque'), preload: $('r-preload'),
  as: $('r-as'), d2: $('r-d2'), rp: $('r-rp'), k: $('r-k'), sig: $('r-sig'), sig2: $('r-sig2'),
  stack: $('stack'), legend: $('legend'),
  summary: $('summary'), copy: $('copy'),
  refBody: $('ref-body'), refNote: $('ref-note'),
};

const CUSTOM = 'custom';
let lang = 'en';
let last = null;
let copyTimer = 0;

const t = (k) => I18N[lang][k];

function detectLang() {
  try {
    const saved = localStorage.getItem('fitcalc-lang');
    if (saved === 'en' || saved === 'zh') return saved;
  } catch (e) { /* 忽略 */ }
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

/* ---------- 格式化 ---------- */
const fmt = (v, d) => Number(v).toFixed(d);
const fmtMu = (v) => String(Math.round(v * 1000) / 1000);
const fmtNu = (v) => String(Math.round(v * 10) / 10);

/* ---------- 初始化选择框 ---------- */
function opt(value, text) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = text;
  return o;
}
for (const th of THREADS) el.size.appendChild(opt(th.size, th.size));
for (const c of CLASSES) el.cls.appendChild(opt(c, c));
el.size.value = 'M10';
el.cls.value = '8.8';

function renderHeadOptions() {
  const cur = el.head.value || 'hex';
  el.head.innerHTML = '';
  for (const h of HEAD_TYPES) el.head.appendChild(opt(h, t('head' + h)));
  el.head.value = HEAD_TYPES.includes(cur) ? cur : HEAD_TYPES[0];
}

function defaultPreset() {
  return FRICTION_PRESETS.find((p) => p.mu === 0.12) || FRICTION_PRESETS[0];
}

function renderPresetOptions() {
  const cur = el.preset.value || defaultPreset().id;
  el.preset.innerHTML = '';
  for (const p of FRICTION_PRESETS) {
    el.preset.appendChild(opt(p.id, `${lang === 'zh' ? p.nameZh : p.name} (μ=${p.mu})`));
  }
  el.preset.appendChild(opt(CUSTOM, t('custom')));
  el.preset.value = cur;
  updatePresetHint();
}

function updatePresetHint() {
  const p = FRICTION_PRESETS.find((x) => x.id === el.preset.value);
  el.presetRange.textContent = p && p.range ? t('rangeLabel') + p.range : '';
}

// 根据 μG/μK 数值匹配预设，否则为自定义
function syncPresetFromMu() {
  const g = parseFloat(el.muG.value), k = parseFloat(el.muK.value);
  const p = FRICTION_PRESETS.find((x) => x.mu === g && x.mu === k);
  el.preset.value = p ? p.id : CUSTOM;
  updatePresetHint();
}

/* ---------- 语言 ---------- */
function applyLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
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
  renderHeadOptions();
  renderPresetOptions();
}

function setLang(l) {
  lang = l;
  try { localStorage.setItem('fitcalc-lang', l); } catch (e) { /* 忽略 */ }
  applyLang();
  update(false);
}

/* ---------- 计算与渲染 ---------- */
function readInput() {
  return {
    size: el.size.value,
    cls: el.cls.value,
    head: el.head.value,
    muG: parseFloat(el.muG.value),
    muK: parseFloat(el.muK.value),
    nu: parseFloat(el.nu.value) / 100,
  };
}

function showError(msg) {
  last = null;
  el.err.textContent = msg;
  el.body.hidden = true;
  el.refBody.innerHTML = '';
}

function update(writeUrl = true) {
  el.err.textContent = '';
  updatePresetHint();
  const inp = readInput();
  if (writeUrl) writeHash();
  if (![inp.muG, inp.muK, inp.nu].every(Number.isFinite)) { showError(t('errInput')); return; }
  let r;
  try {
    r = calcBolt(inp);
  } catch (e) {
    showError(e instanceof BoltError && e.code === 'INPUT' ? t('errInput') : t('errOther'));
    return;
  }
  last = r;
  el.body.hidden = false;
  renderResults(r);
  renderBreakdown(r);
  renderSummary(r);
  renderRef(r);
}

function renderResults(r) {
  el.torque.textContent = fmt(r.torque, 1);
  el.preload.textContent = fmt(r.preload / 1000, 1);
  el.as.textContent = `${fmt(r.geometry.As, 1)} mm²`;
  el.d2.textContent = `${fmt(r.geometry.d2, 3)} mm`;
  el.rp.textContent = `${fmt(r.Rp, 0)} MPa`;
  el.k.textContent = fmt(r.kFactor, 3);
  el.sig.textContent = `${fmt(r.stress.sigmaRed, 0)} MPa`;
  el.sig2.textContent = t('sigDetail').replace('{s}', fmt(r.stress.sigma, 0)).replace('{t}', fmt(r.stress.tau, 0));
}

function renderBreakdown(r) {
  const p = r.torqueParts;
  const segs = [
    { cls: 'seg-pitch', name: t('segPitch'), v: p.pitch },
    { cls: 'seg-thread', name: t('segThread'), v: p.thread },
    { cls: 'seg-head', name: t('segHead'), v: p.head },
  ];
  const total = segs.reduce((a, s) => a + s.v, 0) || 1;
  segs.forEach((s) => { s.pct = (s.v / total) * 100; });
  el.stack.innerHTML = segs.map((s) => `<span class="${s.cls}" style="width:${s.pct}%"></span>`).join('');
  el.legend.innerHTML = segs.map((s) =>
    `<li><i class="${s.cls}"></i>${s.name} <b>${Math.round(s.pct)}%</b></li>`).join('');
  el.stack.setAttribute('aria-label', segs.map((s) => `${s.name} ${Math.round(s.pct)}%`).join(' · '));
}

function renderSummary(r) {
  const i = r.input;
  const mu = i.muG === i.muK ? `μG=μK=${fmtMu(i.muG)}` : `μG=${fmtMu(i.muG)}, μK=${fmtMu(i.muK)}`;
  el.summary.textContent =
    `${i.size} ${i.cls}, ${i.head}, ${mu}, ν=${fmtNu(i.nu * 100)}% → ` +
    `M_A = ${fmt(r.torque, 1)} N·m, F_M = ${fmt(r.preload / 1000, 1)} kN`;
}

function renderRef(r) {
  const i = r.input;
  el.refNote.textContent = t('refNote')
    .replace('{cls}', i.cls).replace('{head}', i.head)
    .replace('{g}', fmtMu(i.muG)).replace('{k}', fmtMu(i.muK)).replace('{nu}', fmtNu(i.nu * 100));
  const rows = [];
  for (const th of THREADS) {
    let tq = '—', pl = '—';
    try {
      const x = calcBolt({ ...i, size: th.size });
      tq = fmt(x.torque, x.torque < 10 ? 2 : 1);
      pl = fmt(x.preload / 1000, 1);
    } catch (e) { /* 该规格不可算则显示 — */ }
    const sel = th.size === i.size;
    rows.push(`<tr data-size="${th.size}" tabindex="0"${sel ? ' class="sel" aria-selected="true"' : ''}>` +
      `<td>${th.size}</td><td>${tq}</td><td>${pl}</td></tr>`);
  }
  el.refBody.innerHTML = rows.join('');
}

/* ---------- URL hash ---------- */
function setMu(g, k) {
  el.muG.value = fmtMu(g);
  el.muK.value = fmtMu(k);
}

function readHash() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  const size = p.get('size'), cls = p.get('cls'), head = p.get('head');
  if (size && THREADS.some((x) => x.size === size)) el.size.value = size;
  if (cls && CLASSES.includes(cls)) el.cls.value = cls;
  if (head && HEAD_TYPES.includes(head)) el.head.value = head;
  const g = p.get('muG'), k = p.get('muK'), nu = p.get('nu');
  if (g !== null && g !== '') el.muG.value = g;
  if (k !== null && k !== '') el.muK.value = k;
  if (nu !== null && nu !== '') el.nu.value = nu;
}

function writeHash() {
  const q = new URLSearchParams({
    size: el.size.value, cls: el.cls.value, head: el.head.value,
    muG: el.muG.value.trim(), muK: el.muK.value.trim(), nu: el.nu.value.trim(),
  });
  try { history.replaceState(null, '', '#' + q.toString()); } catch (e) { /* 忽略 */ }
}

/* ---------- 事件 ---------- */
for (const s of [el.size, el.cls, el.head]) s.addEventListener('change', () => update());
el.nu.addEventListener('input', () => update());

el.preset.addEventListener('change', () => {
  const p = FRICTION_PRESETS.find((x) => x.id === el.preset.value);
  if (p) setMu(p.mu, p.mu);
  update();
});
for (const n of [el.muG, el.muK]) {
  n.addEventListener('input', () => {
    syncPresetFromMu();
    update();
  });
}

function pickRow(e) {
  const tr = e.target.closest('tr[data-size]');
  if (!tr) return null;
  el.size.value = tr.dataset.size;
  update();
  return tr.dataset.size;
}
el.refBody.addEventListener('click', pickRow);
el.refBody.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  const s = pickRow(e);
  if (s) {
    const again = el.refBody.querySelector(`tr[data-size="${s}"]`);
    if (again) again.focus();
  }
});

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
  if (await copyText(el.summary.textContent)) {
    el.copy.textContent = t('copied');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { el.copy.textContent = t('copy'); }, 1500);
  }
});

window.addEventListener('hashchange', () => {
  readHash();
  syncPresetFromMu();
  update(false);
});

/* ---------- 启动 ---------- */
lang = detectLang();
{
  const d = defaultPreset();
  setMu(d.mu, d.mu);
  el.nu.value = '90';
}
renderHeadOptions();
el.head.value = 'hex';
readHash();
applyLang();
syncPresetFromMu();
update(false);
document.documentElement.classList.remove('i18n-pending');
