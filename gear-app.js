import { detectLang, saveLang, renderNav } from './site.js';
import { GearError, MODULES, DEFAULTS, calcGearPair } from './gear.js';

/* ---------- 文案字典 ---------- */
const I18N = {
  en: {
    docTitle: 'Spur Gear Calculator — Geometry, Profile Shift, Contact Ratio',
    docDesc: 'Free spur gear calculator: reference, base, tip and root diameters, profile shift, working centre distance and pressure angle, contact ratio, span measurement Wk and undercut checks for involute gears (ISO / GB basic rack).',
    h1: 'Spur Gear Calculator',
    subtitle: 'Involute spur gear pair geometry with profile shift',
    inputsTitle: 'Inputs',
    mLabel: 'Module m (mm)',
    z1Label: 'Teeth z₁ (pinion)',
    z2Label: 'Teeth z₂ (gear)',
    alphaLabel: 'Pressure angle α (°)',
    x1Label: 'Profile shift x₁',
    x2Label: 'Profile shift x₂',
    haLabel: 'Addendum coeff. h<sub>a</sub>*',
    cLabel: 'Clearance coeff. c*',
    inputHint: 'Defaults: ISO 53 / GB/T 1356 basic rack (α = 20°, h<sub>a</sub>* = 1, c* = 0.25). The module list shows GB/T 1357 first-series values; any positive value is accepted.',
    resultsTitle: 'Results',
    awLabel: 'Centre distance a′',
    epsLabel: 'Contact ratio ε<sub>α</sub>',
    thQty: 'Quantity (mm)',
    thPinion: 'Pinion (1)',
    thGear: 'Gear (2)',
    rowD: 'Reference diameter',
    rowDb: 'Base diameter',
    rowDw: 'Working pitch diameter',
    rowDa: 'Tip diameter',
    rowDf: 'Root diameter',
    rowHa: 'Addendum',
    rowHf: 'Dedendum',
    rowH: 'Tooth depth',
    rowS: 'Tooth thickness (reference)',
    rowSa: 'Tooth thickness (tip)',
    rowAa: 'Pressure angle at tip',
    rowP: 'Pitch',
    rowPb: 'Base pitch',
    rowK: 'Teeth spanned',
    rowWk: 'Base tangent length',
    rowXmin: 'Min. shift (no undercut)',
    pairTitle: 'Gear pair',
    pA: 'Standard centre distance a',
    pAw: 'Working centre distance a′',
    pAlphaW: 'Working pressure angle α′',
    pXsum: 'Sum of shifts x₁ + x₂',
    pY: 'Centre distance mod. coeff. y',
    pDy: 'Addendum reduction coeff. Δy',
    pEps: 'Transverse contact ratio ε<sub>α</sub>',
    pU: 'Gear ratio u = z₂/z₁',
    sketchTitle: 'Sketch (to scale)',
    sketchLegend: 'Solid: working pitch circles · dashed: tip circles · thin: root circles',
    sketchAria: 'Scaled sketch of the two gears: pitch, tip and root circles and centre distance',
    summaryTitle: 'Summary',
    copy: 'Copy',
    copied: 'Copied',
    pinion: 'pinion',
    gear: 'gear',
    lvlError: 'Error:',
    lvlWarn: 'Warning:',
    lvlInfo: 'Note:',
    wUNDERCUT: 'The {g} undercuts: x = {x} is below x<sub>min</sub> = {xmin} (z<sub>min</sub> = {zmin}). Increase x or the number of teeth.',
    wPOINTED: 'The {g} has a pointed tip (s<sub>a</sub> = {sa} mm). Reduce its profile shift.',
    wTHIN_TIP: 'The {g} tip is thin: s<sub>a</sub> = {sa} mm &lt; 0.25·m = {lim} mm (risk of tip breakage / hardening through).',
    wEPS_LT_1: 'Contact ratio ε = {eps} &lt; 1 — the gears cannot mesh continuously.',
    wEPS_LOW: 'Contact ratio ε = {eps} &lt; 1.2 — low; aim for ε ≥ 1.2 (better ≥ 1.4).',
    wDF_LT_DB: 'The {g} root circle (d<sub>f</sub>) is inside its base circle (d<sub>b</sub>): the flank below d<sub>b</sub> is not involute — normal for small tooth numbers.',
    errM: 'Module m must be a positive number.',
    errZ: 'Tooth numbers must be whole numbers from 5 to 10000.',
    errALPHA: 'Pressure angle must be between 10° and 35°.',
    errHA: 'Addendum coefficient h<sub>a</sub>* must be greater than 0 and at most 2.',
    errC: 'Clearance coefficient c* must be between 0 and 1.',
    errX: 'Profile shift coefficients must be between −3 and +3.',
    errXSUM: 'The sum of profile shifts is too negative — no valid working pressure angle.',
    errTIP: 'Tip circle lies inside the base circle — reduce the negative profile shift or increase the tooth number.',
    errROOT: 'Root diameter is not positive — check the inputs.',
    errOther: 'Calculation failed for this input.',
    aboutTitle: 'How it is calculated',
    aboutBody: `
      <p><strong>Basic rack.</strong> Involute external spur gears with the ISO 53 / GB/T 1356 basic rack: pressure angle <code>α</code>, addendum <code>h<sub>a</sub>*·m</code>, dedendum <code>(h<sub>a</sub>* + c*)·m</code>.</p>
      <p><code>d = m·z</code>, <code>d<sub>b</sub> = d·cos α</code>, <code>p = π·m</code>, <code>p<sub>b</sub> = π·m·cos α</code>, <code>s = m(π/2 + 2x·tan α)</code></p>
      <h3>Profile shift</h3>
      <p>Profile shift <code>x·m</code> moves the cutting rack away from (x &gt; 0) or towards (x &lt; 0) the gear centre. A positive shift makes the tooth root thicker and avoids undercut on small pinions, but makes the tip thinner. With shifts, the zero-backlash working pressure angle follows from</p>
      <p><code>inv α′ = 2(x<sub>1</sub>+x<sub>2</sub>)·tan α/(z<sub>1</sub>+z<sub>2</sub>) + inv α</code>, &nbsp;<code>inv α = tan α − α</code></p>
      <p>(solved by Newton iteration), then <code>a = m(z<sub>1</sub>+z<sub>2</sub>)/2</code>, <code>a′ = a·cos α / cos α′</code>, <code>y = (a′ − a)/m</code> and <code>Δy = x<sub>1</sub> + x<sub>2</sub> − y</code>. The tips are shortened by <code>Δy·m</code> so that the bottom clearance stays <code>c*·m</code>:</p>
      <p><code>h<sub>a</sub> = (h<sub>a</sub>* + x − Δy)·m</code>, <code>h<sub>f</sub> = (h<sub>a</sub>* + c* − x)·m</code>, <code>d<sub>a</sub> = d + 2h<sub>a</sub></code>, <code>d<sub>f</sub> = d − 2h<sub>f</sub></code></p>
      <p>If <code>x<sub>1</sub> + x<sub>2</sub> = 0</code> the centre distance is unchanged (“height correction”); a positive sum increases it.</p>
      <h3>Checks</h3>
      <ul>
        <li><strong>Tip thickness</strong> <code>s<sub>a</sub> = d<sub>a</sub>(s/d + inv α − inv α<sub>a</sub>)</code>, <code>cos α<sub>a</sub> = d<sub>b</sub>/d<sub>a</sub></code>; warning below 0.25·m.</li>
        <li><strong>Contact ratio</strong> <code>ε<sub>α</sub> = [z<sub>1</sub>(tan α<sub>a1</sub> − tan α′) + z<sub>2</sub>(tan α<sub>a2</sub> − tan α′)]/2π</code>; should be ≥ 1.2.</li>
        <li><strong>Undercut</strong> (generated by a rack): <code>z<sub>min</sub> = 2h<sub>a</sub>*/sin²α</code> (17.1 for 20°), <code>x<sub>min</sub> = h<sub>a</sub>*(z<sub>min</sub> − z)/z<sub>min</sub></code>.</li>
        <li><strong>Span measurement</strong> <code>k = round(z·α<sub>x</sub>/π + 0.5)</code> with <code>cos α<sub>x</sub> = d<sub>b</sub>/(d + 2xm)</code>, <code>W<sub>k</sub> = m·cos α[(k − 0.5)π + z·inv α] + 2x·m·sin α</code> (nominal, without tolerance / backlash allowance).</li>
      </ul>`,
    disclaimer: 'Geometry only — no strength rating (ISO 6336) yet. Values are nominal (zero backlash, no tooth thickness tolerances).',
    footerText: 'Open source, runs entirely in your browser.',
    footerLink: 'GitHub',
  },
  zh: {
    docTitle: '直齿圆柱齿轮计算器 — 几何尺寸、变位、重合度',
    docDesc: '免费的直齿圆柱齿轮计算器：分度圆、基圆、齿顶圆、齿根圆直径，变位系数，实际中心距与啮合角，重合度，公法线长度 Wk，以及根切检查（ISO / GB 基本齿廓）。',
    h1: '直齿圆柱齿轮计算器',
    subtitle: '渐开线直齿轮副几何尺寸（含变位）',
    inputsTitle: '输入',
    mLabel: '模数 m (mm)',
    z1Label: '齿数 z₁（小齿轮）',
    z2Label: '齿数 z₂（大齿轮）',
    alphaLabel: '压力角 α (°)',
    x1Label: '变位系数 x₁',
    x2Label: '变位系数 x₂',
    haLabel: '齿顶高系数 h<sub>a</sub>*',
    cLabel: '顶隙系数 c*',
    inputHint: '默认值为 ISO 53 / GB/T 1356 标准基本齿廓（α = 20°，h<sub>a</sub>* = 1，c* = 0.25）。模数下拉列表为 GB/T 1357 第一系列，也可输入任意正数。',
    resultsTitle: '计算结果',
    awLabel: '中心距 a′',
    epsLabel: '重合度 ε<sub>α</sub>',
    thQty: '参数 (mm)',
    thPinion: '小齿轮 (1)',
    thGear: '大齿轮 (2)',
    rowD: '分度圆直径',
    rowDb: '基圆直径',
    rowDw: '节圆直径',
    rowDa: '齿顶圆直径',
    rowDf: '齿根圆直径',
    rowHa: '齿顶高',
    rowHf: '齿根高',
    rowH: '全齿高',
    rowS: '分度圆齿厚',
    rowSa: '齿顶圆齿厚',
    rowAa: '齿顶圆压力角',
    rowP: '齿距',
    rowPb: '基圆齿距',
    rowK: '跨齿数',
    rowWk: '公法线长度',
    rowXmin: '不根切最小变位系数',
    pairTitle: '齿轮副',
    pA: '标准中心距 a',
    pAw: '实际中心距 a′',
    pAlphaW: '啮合角 α′',
    pXsum: '变位系数和 x₁ + x₂',
    pY: '中心距变动系数 y',
    pDy: '齿顶高降低系数 Δy',
    pEps: '端面重合度 ε<sub>α</sub>',
    pU: '齿数比 u = z₂/z₁',
    sketchTitle: '示意图（按比例）',
    sketchLegend: '实线：节圆 · 虚线：齿顶圆 · 细线：齿根圆',
    sketchAria: '两齿轮按比例的示意图：节圆、齿顶圆、齿根圆及中心距',
    summaryTitle: '摘要',
    copy: '复制',
    copied: '已复制',
    pinion: '小齿轮',
    gear: '大齿轮',
    lvlError: '错误：',
    lvlWarn: '警告：',
    lvlInfo: '提示：',
    wUNDERCUT: '{g}会发生根切：x = {x} 小于 x<sub>min</sub> = {xmin}（z<sub>min</sub> = {zmin}）。请增大变位系数或齿数。',
    wPOINTED: '{g}齿顶变尖（s<sub>a</sub> = {sa} mm），请减小其变位系数。',
    wTHIN_TIP: '{g}齿顶过薄：s<sub>a</sub> = {sa} mm &lt; 0.25·m = {lim} mm（齿顶易崩、热处理易淬透）。',
    wEPS_LT_1: '重合度 ε = {eps} &lt; 1，齿轮无法连续啮合。',
    wEPS_LOW: '重合度 ε = {eps} &lt; 1.2，偏低；一般应 ε ≥ 1.2（最好 ≥ 1.4）。',
    wDF_LT_DB: '{g}齿根圆 d<sub>f</sub> 小于基圆 d<sub>b</sub>：基圆以下的齿廓不是渐开线——齿数较少时属正常现象。',
    errM: '模数 m 必须是正数。',
    errZ: '齿数必须是 5 到 10000 之间的整数。',
    errALPHA: '压力角必须在 10° 到 35° 之间。',
    errHA: '齿顶高系数 h<sub>a</sub>* 必须大于 0 且不超过 2。',
    errC: '顶隙系数 c* 必须在 0 到 1 之间。',
    errX: '变位系数必须在 −3 到 +3 之间。',
    errXSUM: '变位系数之和过于偏负，求不出有效的啮合角。',
    errTIP: '齿顶圆落在基圆以内——请减小负变位或增加齿数。',
    errROOT: '齿根圆直径不为正，请检查输入。',
    errOther: '该输入无法计算。',
    aboutTitle: '计算方法',
    aboutBody: `
      <p><strong>基本齿廓。</strong>外啮合渐开线直齿圆柱齿轮，采用 ISO 53 / GB/T 1356 基本齿廓：压力角 <code>α</code>，齿顶高 <code>h<sub>a</sub>*·m</code>，齿根高 <code>(h<sub>a</sub>* + c*)·m</code>。</p>
      <p><code>d = m·z</code>，<code>d<sub>b</sub> = d·cos α</code>，<code>p = π·m</code>，<code>p<sub>b</sub> = π·m·cos α</code>，<code>s = m(π/2 + 2x·tan α)</code></p>
      <h3>变位</h3>
      <p>变位就是切齿时把齿条刀具从齿轮中心移远（正变位 x &gt; 0）或移近（负变位 x &lt; 0）<code>x·m</code> 的距离。正变位使齿根变厚，可避免小齿轮根切，但齿顶会变薄。变位后按无侧隙啮合求啮合角：</p>
      <p><code>inv α′ = 2(x<sub>1</sub>+x<sub>2</sub>)·tan α/(z<sub>1</sub>+z<sub>2</sub>) + inv α</code>，&nbsp;<code>inv α = tan α − α</code></p>
      <p>（用牛顿迭代求解），再得 <code>a = m(z<sub>1</sub>+z<sub>2</sub>)/2</code>，<code>a′ = a·cos α / cos α′</code>，<code>y = (a′ − a)/m</code>，<code>Δy = x<sub>1</sub> + x<sub>2</sub> − y</code>。齿顶削去 <code>Δy·m</code>，以保证标准顶隙 <code>c*·m</code>：</p>
      <p><code>h<sub>a</sub> = (h<sub>a</sub>* + x − Δy)·m</code>，<code>h<sub>f</sub> = (h<sub>a</sub>* + c* − x)·m</code>，<code>d<sub>a</sub> = d + 2h<sub>a</sub></code>，<code>d<sub>f</sub> = d − 2h<sub>f</sub></code></p>
      <p><code>x<sub>1</sub> + x<sub>2</sub> = 0</code> 时中心距不变（高度变位）；变位系数和为正时中心距增大（正传动）。</p>
      <h3>校核</h3>
      <ul>
        <li><strong>齿顶厚</strong> <code>s<sub>a</sub> = d<sub>a</sub>(s/d + inv α − inv α<sub>a</sub>)</code>，<code>cos α<sub>a</sub> = d<sub>b</sub>/d<sub>a</sub></code>；小于 0.25·m 时警告。</li>
        <li><strong>重合度</strong> <code>ε<sub>α</sub> = [z<sub>1</sub>(tan α<sub>a1</sub> − tan α′) + z<sub>2</sub>(tan α<sub>a2</sub> − tan α′)]/2π</code>；一般应 ≥ 1.2。</li>
        <li><strong>根切</strong>（齿条型刀具范成加工）：<code>z<sub>min</sub> = 2h<sub>a</sub>*/sin²α</code>（20° 时为 17.1），<code>x<sub>min</sub> = h<sub>a</sub>*(z<sub>min</sub> − z)/z<sub>min</sub></code>。</li>
        <li><strong>公法线</strong> <code>k = round(z·α<sub>x</sub>/π + 0.5)</code>，<code>cos α<sub>x</sub> = d<sub>b</sub>/(d + 2xm)</code>，<code>W<sub>k</sub> = m·cos α[(k − 0.5)π + z·inv α] + 2x·m·sin α</code>（公称值，未计入齿厚公差 / 侧隙）。</li>
      </ul>`,
    disclaimer: '仅计算几何尺寸——暂不含强度校核（ISO 6336）。所有数值为公称值（无侧隙、未计齿厚公差）。',
    footerText: '开源项目，完全在浏览器中运行。',
    footerLink: 'GitHub',
  },
};

/* ---------- 状态与 DOM ---------- */
const $ = (id) => document.getElementById(id);
const FIELDS = ['m', 'z1', 'z2', 'alpha', 'x1', 'x2', 'ha', 'c'];
const el = {
  err: $('err'), body: $('results-body'),
  aw: $('r-aw'), eps: $('r-eps'), notes: $('notes'),
  gearBody: $('gear-body'), pair: $('pair'), sketch: $('sketch'),
  summary: $('summary'), copy: $('copy'), modules: $('modules'),
};
for (const f of FIELDS) el[f] = $(f);

let lang = 'en';
let last = null;
let copyTimer = 0;

const t = (k) => I18N[lang][k];

/* ---------- 格式化 ---------- */
// 去掉 -0，按位数固定小数
const fmt = (v, d = 3) => {
  const s = Number(v).toFixed(d);
  return /^-0\.?0*$/.test(s) ? s.slice(1) : s;
};
// 摘要/提示里的短数字：去掉多余的 0
const short = (v, d = 3) => String(Number(fmt(v, d)));

for (const m of MODULES) {
  const o = document.createElement('option');
  o.value = String(m);
  el.modules.appendChild(o);
}

/* ---------- 语言 ---------- */
function applyLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
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
}

function setLang(l) {
  lang = l;
  saveLang(l);
  applyLang();
  update(false);
}

/* ---------- 计算与渲染 ---------- */
// 空输入回退为 NaN，交给引擎校验报错
const num = (n) => (n.value.trim() === '' ? NaN : Number(n.value));

function readInput() {
  return {
    m: num(el.m), z1: num(el.z1), z2: num(el.z2), alpha: num(el.alpha),
    x1: num(el.x1), x2: num(el.x2), haStar: num(el.ha), cStar: num(el.c),
  };
}

// 根据错误代码把对应输入框标红
const ERR_FIELDS = { M: ['m'], Z: ['z1', 'z2'], ALPHA: ['alpha'], HA: ['ha'], C: ['c'], X: ['x1', 'x2'], XSUM: ['x1', 'x2'] };

function markInvalid(code, inp) {
  for (const f of FIELDS) el[f].removeAttribute('aria-invalid');
  const list = ERR_FIELDS[code] || [];
  for (const f of list) {
    // 只标出真正不合法的那一个
    const v = inp[{ ha: 'haStar', c: 'cStar' }[f] || f];
    let bad = true;
    if (code === 'Z') bad = !(Number.isInteger(v) && v >= 5 && v <= 10000);
    if (code === 'X') bad = !(Number.isFinite(v) && v >= -3 && v <= 3);
    if (bad) el[f].setAttribute('aria-invalid', 'true');
  }
}

function showError(code, inp) {
  last = null;
  markInvalid(code, inp);
  el.err.innerHTML = t('err' + code) || t('errOther');
  el.body.hidden = true;
}

function update(writeUrl = true) {
  el.err.textContent = '';
  if (writeUrl) writeHash();
  const inp = readInput();
  let r;
  try {
    r = calcGearPair(inp);
  } catch (e) {
    showError(e instanceof GearError ? e.code : 'Other', inp);
    return;
  }
  markInvalid('', inp);
  last = r;
  el.body.hidden = false;
  el.aw.textContent = fmt(r.pair.aw, 3);
  el.eps.textContent = fmt(r.pair.eps, 3);
  renderNotes(r);
  renderTable(r);
  renderPair(r);
  renderSketch(r);
  renderSummary(r);
}

function renderNotes(r) {
  const lvl = { error: 'lvlError', warn: 'lvlWarn', info: 'lvlInfo' };
  const order = { error: 0, warn: 1, info: 2 };
  // 齿根圆小于基圆在 z < 42 时几乎总会出现，属正常现象，不在页面上提示，免得盖过根切、变尖等真正的警告
  const ws = r.warnings.filter((w) => w.code !== 'DF_LT_DB').sort((a, b) => order[a.level] - order[b.level]);
  el.notes.innerHTML = ws.map((w) => {
    const msg = t('w' + w.code)
      .replace('{g}', w.gear ? `${t(w.gear === 1 ? 'pinion' : 'gear')} (z${w.gear === 1 ? '₁' : '₂'})` : '')
      .replace('{x}', w.gear ? short(r.gears[w.gear - 1].x) : '')
      .replace('{xmin}', w.xMin !== undefined ? fmt(w.xMin, 3) : '')
      .replace('{zmin}', w.zMin !== undefined ? fmt(w.zMin, 1) : '')
      .replace('{sa}', w.sa !== undefined ? fmt(w.sa, 3) : '')
      .replace('{lim}', w.limit !== undefined ? fmt(w.limit, 3) : '')
      .replace('{eps}', w.eps !== undefined ? fmt(w.eps, 3) : '');
    return `<li class="n-${w.level}" role="${w.level === 'error' ? 'alert' : 'note'}"><b>${t(lvl[w.level])}</b>${msg}</li>`;
  }).join('');
}

function renderTable(r) {
  const [a, b] = r.gears;
  // [标签键, 符号, 取值函数, 单位]
  const rows = [
    ['rowD', 'd', (g) => fmt(g.d), 'mm'],
    ['rowDb', 'd<sub>b</sub>', (g) => fmt(g.db), 'mm'],
    ['rowDw', 'd′', (g) => fmt(g.dw), 'mm'],
    ['rowDa', 'd<sub>a</sub>', (g) => fmt(g.da), 'mm'],
    ['rowDf', 'd<sub>f</sub>', (g) => fmt(g.df), 'mm'],
    ['rowHa', 'h<sub>a</sub>', (g) => fmt(g.ha), 'mm'],
    ['rowHf', 'h<sub>f</sub>', (g) => fmt(g.hf), 'mm'],
    ['rowH', 'h', (g) => fmt(g.h), 'mm'],
    ['rowS', 's', (g) => fmt(g.s), 'mm'],
    ['rowSa', 's<sub>a</sub>', (g) => fmt(g.sa), 'mm'],
    ['rowAa', 'α<sub>a</sub>', (g) => fmt(g.alphaA), '°'],
    ['rowP', 'p', (g) => fmt(g.p), 'mm'],
    ['rowPb', 'p<sub>b</sub>', (g) => fmt(g.pb), 'mm'],
    ['rowK', 'k', (g) => String(g.k), ''],
    ['rowWk', 'W<sub>k</sub>', (g) => fmt(g.Wk), 'mm'],
    ['rowXmin', 'x<sub>min</sub>', (g) => fmt(g.xMin), ''],
  ];
  el.gearBody.innerHTML = rows.map(([k, sym, f, u]) => {
    const deg = u === '°' ? '°' : '';
    return `<tr><td>${t(k)}<span class="sym">${sym}</span></td><td>${f(a)}${deg}</td><td>${f(b)}${deg}</td></tr>`;
  }).join('');
}

function renderPair(r) {
  const p = r.pair;
  const items = [
    ['pA', `${fmt(p.a)} mm`],
    ['pAw', `${fmt(p.aw)} mm`],
    ['pAlphaW', `${fmt(p.alphaW, 4)}°`],
    ['pXsum', fmt(p.xSum, 4)],
    ['pY', fmt(p.y, 4)],
    ['pDy', fmt(p.dy, 4)],
    ['pEps', fmt(p.eps, 3)],
    ['pU', fmt(p.u, 4)],
  ];
  el.pair.innerHTML = items.map(([k, v]) =>
    `<div class="metric"><div class="m-label">${t(k)}</div><div class="m-val">${v}</div></div>`).join('');
}

// 按比例绘制两轮的节圆、齿顶圆、齿根圆与中心距
function renderSketch(r) {
  const [g1, g2] = r.gears;
  const aw = r.pair.aw;
  const W = 640, pad = 16, dimSpace = 40;
  const R1 = g1.da / 2, R2 = g2.da / 2;
  const totalW = R1 + aw + R2;
  const maxD = Math.max(g1.da, g2.da);
  let s = (W - 2 * pad) / totalW;
  const maxH = 360 - 2 * pad - dimSpace;
  if (maxD * s > maxH) s = maxH / maxD;
  const H = Math.round(maxD * s + 2 * pad + dimSpace);
  const cy = pad + (maxD * s) / 2;
  const x1 = (W - totalW * s) / 2 + R1 * s;
  const x2 = x1 + aw * s;
  const c = (cx, rr, cls) => `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${Math.max(rr * s, 0.5).toFixed(2)}" class="${cls}"/>`;
  const dimY = pad + maxD * s + dimSpace * 0.55;
  const ext = (x) => `<line x1="${x.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x.toFixed(1)}" y2="${(dimY + 6).toFixed(1)}" class="axis"/>`;
  const arrow = (x, dir) => `<path d="M${x.toFixed(1)} ${dimY} l${6 * dir} -3.5 v7 z" class="ctr"/>`;
  const mid = (x1 + x2) / 2;
  const dw1 = g1.dw * s, dw2 = g2.dw * s;
  // 小齿轮太小时把标签挪到圆外
  const lab = (x, rr, text, cls) => {
    const y = rr * s > 26 ? cy - 6 : cy - rr * s - 6;
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" class="${cls} halo">${text}</text>`;
  };
  el.sketch.innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('sketchAria')}">` +
    `<line x1="${pad}" y1="${cy.toFixed(1)}" x2="${W - pad}" y2="${cy.toFixed(1)}" class="axis"/>` +
    c(x1, g1.df / 2, 'c-root g1') + c(x2, g2.df / 2, 'c-root g2') +
    `<circle cx="${x1.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(dw1 / 2).toFixed(2)}" class="c-pitch g1"/>` +
    `<circle cx="${x2.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(dw2 / 2).toFixed(2)}" class="c-pitch g2"/>` +
    c(x1, R1, 'c-tip g1') + c(x2, R2, 'c-tip g2') +
    `<circle cx="${x1.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.5" class="ctr"/>` +
    `<circle cx="${x2.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.5" class="ctr"/>` +
    lab(x1, g1.dw / 2, `z₁=${g1.z}`, 't1') + lab(x2, g2.dw / 2, `z₂=${g2.z}`, 't2') +
    ext(x1) + ext(x2) +
    `<line x1="${x1.toFixed(1)}" y1="${dimY}" x2="${x2.toFixed(1)}" y2="${dimY}" class="dim"/>` +
    arrow(x1, 1) + arrow(x2, -1) +
    `<text x="${mid.toFixed(1)}" y="${(dimY - 6).toFixed(1)}" text-anchor="middle" class="halo">a′ = ${fmt(aw, 3)} mm</text>` +
    `</svg><ul class="gear-legend"><li>${t('sketchLegend')}</li></ul>`;
}

function renderSummary(r) {
  const i = r.input;
  const [g1, g2] = r.gears;
  const p = r.pair;
  el.summary.textContent =
    `m=${short(i.m)}, z=${i.z1}/${i.z2}, α=${short(i.alpha)}°, x=${short(i.x1)}/${short(i.x2)}` +
    (i.haStar !== 1 || i.cStar !== 0.25 ? `, ha*=${short(i.haStar)}, c*=${short(i.cStar)}` : '') +
    ` → d=${short(g1.d)}/${short(g2.d)}, da=${short(g1.da)}/${short(g2.da)}, df=${short(g1.df)}/${short(g2.df)} mm, ` +
    `a′=${short(p.aw)} mm, α′=${short(p.alphaW)}°, ε=${fmt(p.eps, 3)}, ` +
    `W${g1.k}=${short(g1.Wk)}, W${g2.k}=${short(g2.Wk)} mm`;
}

/* ---------- URL hash ---------- */
function readHash() {
  const q = new URLSearchParams(location.hash.replace(/^#/, ''));
  for (const f of FIELDS) {
    const v = q.get(f);
    if (v !== null && v !== '' && Number.isFinite(Number(v))) el[f].value = v;
  }
}

function writeHash() {
  const q = new URLSearchParams();
  for (const f of FIELDS) q.set(f, el[f].value.trim());
  try { history.replaceState(null, '', '#' + q.toString()); } catch (e) { /* 忽略 */ }
}

/* ---------- 事件 ---------- */
for (const f of FIELDS) el[f].addEventListener('input', () => update());

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
  update(false);
});

/* ---------- 启动 ---------- */
lang = detectLang();
el.m.value = String(DEFAULTS.m);
el.z1.value = String(DEFAULTS.z1);
el.z2.value = String(DEFAULTS.z2);
el.alpha.value = String(DEFAULTS.alpha);
el.x1.value = String(DEFAULTS.x1);
el.x2.value = String(DEFAULTS.x2);
el.ha.value = String(DEFAULTS.haStar);
el.c.value = String(DEFAULTS.cStar);
readHash();
applyLang();
update(false);
document.documentElement.classList.remove('i18n-pending');
