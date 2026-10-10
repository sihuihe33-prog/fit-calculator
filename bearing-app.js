import { detectLang, saveLang, renderNav } from './site.js?v=bf0267f5';
import {
  BearingError, LIFE_EXPONENT, RELIABILITY_A1, FP_PRESETS, FT_PRESETS, LIFE_GUIDE, DGBB_TABLE,
  dgbbFactors, calcBearing,
} from './bearing.js?v=8b79b71f';

/* ---------- 文案字典 ---------- */
const I18N = {
  en: {
    docTitle: 'Bearing Life Calculator — L10 Rating Life & Equivalent Dynamic Load',
    docDesc: 'Free rolling bearing life calculator: equivalent dynamic load P, basic rating life L10 and L10h per ISO 281, required dynamic load rating C′, load, temperature and reliability factors.',
    h1: 'Bearing Life Calculator',
    subtitle: 'Equivalent dynamic load and L10 rating life (ISO 281)',
    inputsTitle: 'Inputs',
    typeLabel: 'Bearing type',
    typeball: 'Ball bearing (ε = 3)',
    typeroller: 'Roller bearing (ε = 10/3)',
    cLabel: 'Dynamic load rating C <span class="unit">(kN)</span>',
    nLabel: 'Speed n <span class="unit">(r/min)</span>',
    relLabel: 'Reliability',
    relOpt: '{r} % · a₁ = {a}',
    loadTitle: 'Loads and factors X, Y',
    xyLabel: 'X, Y factors',
    xyradial: 'Pure radial (X = 1, Y = 0)',
    xydgbb: 'Deep groove ball bearing (table)',
    xymanual: 'Enter from catalogue',
    frLabel: 'Radial load F<sub>r</sub> <span class="unit">(kN)</span>',
    faLabel: 'Axial load F<sub>a</sub> <span class="unit">(kN)</span>',
    c0Label: 'Static rating C<sub>0</sub> <span class="unit">(kN)</span>',
    xLabel: 'Radial factor X',
    yLabel: 'Axial factor Y',
    hintRadialFa: 'Fa > 0 is ignored with “pure radial”. Choose the deep groove ball bearing table or enter X, Y from the catalogue.',
    hintDgbb: 'Fa/C₀ = {r} → e = {e}; Fa/Fr = {q} {cmp} e → X = {X}, Y = {Y}',
    hintDgbbClamp: ' (Fa/C₀ outside the table — end value used)',
    hintDgbbZero: 'Fa = 0 → X = 1, Y = 0',
    hintManual: 'Compare Fa/Fr with e from the catalogue: Fa/Fr ≤ e → usually X = 1, Y = 0; Fa/Fr > e → X, Y from the table.',
    xyHelpTitle: 'How to get X and Y from the catalogue',
    xyHelpBody: `
      <p>Every bearing type has a limit value <code>e</code> in the catalogue. Compare the load ratio <code>F<sub>a</sub>/F<sub>r</sub></code> with <code>e</code>:</p>
      <ul>
        <li><code>F<sub>a</sub>/F<sub>r</sub> ≤ e</code> — the axial load has little effect: usually <code>X = 1, Y = 0</code>.</li>
        <li><code>F<sub>a</sub>/F<sub>r</sub> &gt; e</code> — take <code>X</code> and <code>Y</code> from the catalogue row for that bearing.</li>
      </ul>
      <p><strong>Deep groove ball bearings:</strong> <code>e</code> depends on the relative axial load. Compute <code>F<sub>a</sub>/C<sub>0</sub></code> (ISO catalogues use <code>f<sub>0</sub>·F<sub>a</sub>/C<sub>0</sub></code>; same rows), read <code>e</code> and <code>Y</code> from the table below (interpolate linearly), and use <code>X = 0.56</code> when <code>F<sub>a</sub>/F<sub>r</sub> &gt; e</code>. <strong>Angular contact and tapered roller bearings</strong> have fixed e, X, Y per series (e.g. tapered: X = 0.4, Y from the catalogue) and their axial load F<sub>a</sub> must include the induced axial forces of the bearing pair.</p>`,
    dgbbCaption: 'Deep groove ball bearings, normal clearance (textbook table, GB/T 6391 / ISO 281). Check with your catalogue.',
    thRatio: 'F<sub>a</sub>/C<sub>0</sub>',
    factorTitle: 'Operating conditions',
    fpPresetLabel: 'Load condition (f<sub>p</sub>)',
    fpLabel: 'Load factor f<sub>p</sub>',
    ftLabel: 'Temperature factor f<sub>t</sub>',
    ftOpt: '{t} °C → {ft}',
    custom: 'Custom',
    fpHint: 'Typical range {lo}–{hi}, e.g. {eg}.',
    fpHintCustom: 'Textbook guide: 1.0–1.2 no/slight impact; 1.2–1.8 moderate impact; 1.8–3.0 heavy impact.',
    ftNote: 'f<sub>t</sub> textbook values for operating temperature.',
    lhPresetLabel: 'Application (guide values)',
    lhLabel: 'Required life L<sub>h</sub>′ <span class="unit">(h)</span>',
    lhHint: 'Guide range {lo}–{hi} h. Course design often specifies years × days × hours/day, e.g. 8 yr × 300 d × 16 h = 38 400 h.',
    lhHintCustom: 'Guide values: 300–3 000 h rarely used; 10 000–25 000 h 8 h/day machines; 40 000–60 000 h 24 h continuous.',
    resultsTitle: 'Results',
    pLabel: 'Equivalent dynamic load P',
    lifeL10h: 'Rating life L<sub>10h</sub>',
    lifeLnah: 'Adjusted life L<sub>{n}h</sub> ({r} %)',
    lLabel: 'L<sub>10</sub> (10⁶ rev)',
    lnaLabel: 'L<sub>{n}a</sub> (10⁶ rev)',
    lnaDetail: 'L₁₀ = {v} · L₁₀h = {h} h',
    y8Label: 'Years at 8 h/day',
    y24Label: 'Years at 24 h/day',
    yr: 'yr',
    creqLabel: 'Required C′',
    creqVs: 'vs C = {c} kN',
    ratioLabel: 'Life ratio L<sub>h</sub> / L<sub>h</sub>′ (L<sub>h</sub>′ = {lh} h)',
    pass: 'C ≥ C′ — OK',
    fail: 'C < C′ — too small',
    summaryTitle: 'Summary',
    copy: 'Copy',
    copied: 'Copied',
    sumBall: 'Ball bearing',
    sumRoller: 'Roller bearing',
    sumOk: 'OK',
    sumFail: 'NOT OK',
    errC: 'Enter a dynamic load rating C greater than 0.',
    errN: 'Enter a speed n greater than 0.',
    errP: 'The equivalent load P is zero — enter Fr and/or Fa (and check X, Y).',
    errLoad: 'Loads Fr and Fa must be 0 or positive numbers.',
    errXY: 'Factors X and Y must be 0 or positive numbers.',
    errFP: 'Load factor fp must be at least 1.0.',
    errLH: 'Enter a required life Lh′ greater than 0.',
    errC0: 'Enter the static load rating C0 (from the catalogue) to use the deep groove ball bearing table.',
    errOther: 'Calculation failed for this input.',
    aboutTitle: 'How it is calculated',
    aboutBody: `
      <p><strong>Equivalent dynamic load.</strong> Combined radial and axial loads are converted into one radial load that gives the same life:</p>
      <p><code>P = f<sub>p</sub> · (X·F<sub>r</sub> + Y·F<sub>a</sub>)</code></p>
      <p>The load factor <code>f<sub>p</sub></code> covers shock and vibration not included in the nominal loads.</p>
      <p><strong>Basic rating life</strong> (life reached or exceeded by 90 % of a large group of identical bearings):</p>
      <p><code>L<sub>10</sub> = (f<sub>t</sub>·C / P)<sup>ε</sup></code> &nbsp;[10⁶ revolutions], &nbsp; <code>L<sub>10h</sub> = 10⁶ / (60·n) · L<sub>10</sub></code> &nbsp;[h]</p>
      <p>with <code>ε = 3</code> for ball bearings and <code>ε = 10/3</code> for roller bearings. <code>f<sub>t</sub></code> reduces the load rating at operating temperatures above 120 °C.</p>
      <p><strong>Required load rating.</strong> Solving for C with the required life <code>L<sub>h</sub>′</code>:</p>
      <p><code>C′ = (P / f<sub>t</sub>) · (60·n·L<sub>h</sub>′ / 10⁶)<sup>1/ε</sup></code></p>
      <p>The bearing is adequate when <code>C ≥ C′</code>, which is the same as <code>L<sub>10h</sub> ≥ L<sub>h</sub>′</code>.</p>
      <h3>Reliability other than 90 %</h3>
      <p><code>L<sub>na</sub> = a<sub>1</sub>·L<sub>10</sub></code> with a<sub>1</sub> = 1, 0.64, 0.55, 0.47, 0.37, 0.25 for 90, 95, 96, 97, 98, 99 % (ISO 281:2007). C′ then uses <code>L<sub>h</sub>′/a<sub>1</sub></code>.</p>
      <h3>Units</h3>
      <p>C, C<sub>0</sub>, F<sub>r</sub>, F<sub>a</sub> and P are all in kN — the life only depends on the ratio C/P. Years assume 365 days per year.</p>`,
    disclaimer: 'Basic rating life per ISO 281 basic method; modified life (aISO), static load check and lubrication effects are not included.',
    footerText: 'Open source, runs entirely in your browser.',
    footerLink: 'GitHub',
  },
  zh: {
    docTitle: '滚动轴承寿命计算器 — 基本额定寿命 L10 与当量动载荷',
    docDesc: '免费的滚动轴承寿命计算器：按 ISO 281 计算当量动载荷 P、基本额定寿命 L10 与 L10h、所需基本额定动载荷 C′，含载荷系数、温度系数和可靠度修正。',
    h1: '滚动轴承寿命计算器',
    subtitle: '当量动载荷与基本额定寿命 L10（ISO 281）',
    inputsTitle: '输入',
    typeLabel: '轴承类型',
    typeball: '球轴承（ε = 3）',
    typeroller: '滚子轴承（ε = 10/3）',
    cLabel: '基本额定动载荷 C <span class="unit">(kN)</span>',
    nLabel: '转速 n <span class="unit">(r/min)</span>',
    relLabel: '可靠度',
    relOpt: '{r} % · a₁ = {a}',
    loadTitle: '载荷与系数 X、Y',
    xyLabel: 'X、Y 系数',
    xyradial: '纯径向载荷（X = 1，Y = 0）',
    xydgbb: '深沟球轴承（查表）',
    xymanual: '按样本手动输入',
    frLabel: '径向载荷 F<sub>r</sub> <span class="unit">(kN)</span>',
    faLabel: '轴向载荷 F<sub>a</sub> <span class="unit">(kN)</span>',
    c0Label: '基本额定静载荷 C<sub>0</sub> <span class="unit">(kN)</span>',
    xLabel: '径向系数 X',
    yLabel: '轴向系数 Y',
    hintRadialFa: '选择“纯径向载荷”时不计 Fa。请改用深沟球轴承查表，或按样本输入 X、Y。',
    hintDgbb: 'Fa/C₀ = {r} → e = {e}；Fa/Fr = {q} {cmp} e → X = {X}，Y = {Y}',
    hintDgbbClamp: '（Fa/C₀ 超出表格范围，取端点值）',
    hintDgbbZero: 'Fa = 0 → X = 1，Y = 0',
    hintManual: '将 Fa/Fr 与样本中的 e 比较：Fa/Fr ≤ e 时一般 X = 1、Y = 0；Fa/Fr > e 时按表取 X、Y。',
    xyHelpTitle: '如何从轴承样本查取 X、Y',
    xyHelpBody: `
      <p>每类轴承在样本中都给出判断系数 <code>e</code>。先算载荷比 <code>F<sub>a</sub>/F<sub>r</sub></code>，再与 <code>e</code> 比较：</p>
      <ul>
        <li><code>F<sub>a</sub>/F<sub>r</sub> ≤ e</code>：轴向载荷影响很小，一般取 <code>X = 1，Y = 0</code>。</li>
        <li><code>F<sub>a</sub>/F<sub>r</sub> &gt; e</code>：按该轴承所在行查取 <code>X</code>、<code>Y</code>。</li>
      </ul>
      <p><strong>深沟球轴承：</strong><code>e</code> 随相对轴向载荷变化。先算 <code>F<sub>a</sub>/C<sub>0</sub></code>（ISO 样本用 <code>f<sub>0</sub>·F<sub>a</sub>/C<sub>0</sub></code>，各行一一对应），从下表查出 <code>e</code> 和 <code>Y</code>（中间值线性插值），<code>F<sub>a</sub>/F<sub>r</sub> &gt; e</code> 时取 <code>X = 0.56</code>。<strong>角接触球轴承和圆锥滚子轴承</strong>的 e、X、Y 按系列取定值（如圆锥滚子轴承 X = 0.4，Y 查样本），且 F<sub>a</sub> 要计入成对安装时的派生轴向力。</p>`,
    dgbbCaption: '深沟球轴承，普通游隙（教材表 13-5，对应 GB/T 6391 / ISO 281）。请以所用样本为准。',
    thRatio: 'F<sub>a</sub>/C<sub>0</sub>',
    factorTitle: '工作条件',
    fpPresetLabel: '载荷性质（f<sub>p</sub>）',
    fpLabel: '载荷系数 f<sub>p</sub>',
    ftLabel: '温度系数 f<sub>t</sub>',
    ftOpt: '{t} °C → {ft}',
    custom: '自定义',
    fpHint: '推荐范围 {lo}–{hi}，例如{eg}。',
    fpHintCustom: '教材推荐：无冲击或轻微冲击 1.0–1.2；中等冲击 1.2–1.8；强大冲击 1.8–3.0。',
    ftNote: 'f<sub>t</sub> 为教材按工作温度给出的表值。',
    lhPresetLabel: '机器类型（参考值）',
    lhLabel: '预期寿命 L<sub>h</sub>′ <span class="unit">(h)</span>',
    lhHint: '参考范围 {lo}–{hi} h。课程设计常按 年 × 天 × 每天小时数 给出，例如 8 年 × 300 天 × 16 h = 38 400 h。',
    lhHintCustom: '参考值：不常用设备 300–3 000 h；每日 8 h 工作的机械 10 000–25 000 h；24 h 连续工作 40 000–60 000 h。',
    resultsTitle: '计算结果',
    pLabel: '当量动载荷 P',
    lifeL10h: '基本额定寿命 L<sub>10h</sub>',
    lifeLnah: '修正额定寿命 L<sub>{n}h</sub>（{r} %）',
    lLabel: 'L<sub>10</sub>（10⁶ r）',
    lnaLabel: 'L<sub>{n}a</sub>（10⁶ r）',
    lnaDetail: 'L₁₀ = {v} · L₁₀h = {h} h',
    y8Label: '每天 8 h 折合年数',
    y24Label: '每天 24 h 折合年数',
    yr: '年',
    creqLabel: '所需动载荷 C′',
    creqVs: '对比 C = {c} kN',
    ratioLabel: '寿命比 L<sub>h</sub> / L<sub>h</sub>′（L<sub>h</sub>′ = {lh} h）',
    pass: 'C ≥ C′，满足',
    fail: 'C < C′，不满足',
    summaryTitle: '摘要',
    copy: '复制',
    copied: '已复制',
    sumBall: '球轴承',
    sumRoller: '滚子轴承',
    sumOk: '满足',
    sumFail: '不满足',
    errC: '请输入大于 0 的基本额定动载荷 C。',
    errN: '请输入大于 0 的转速 n。',
    errP: '当量动载荷 P 为 0，请输入 Fr 和/或 Fa（并检查 X、Y）。',
    errLoad: '载荷 Fr、Fa 须为 0 或正数。',
    errXY: '系数 X、Y 须为 0 或正数。',
    errFP: '载荷系数 fp 不能小于 1.0。',
    errLH: '请输入大于 0 的预期寿命 Lh′。',
    errC0: '使用深沟球轴承查表时，请输入样本中的基本额定静载荷 C0。',
    errOther: '该输入无法计算。',
    aboutTitle: '计算方法',
    aboutBody: `
      <p><strong>当量动载荷。</strong>把同时作用的径向载荷和轴向载荷折算成一个寿命相同的假想径向载荷：</p>
      <p><code>P = f<sub>p</sub> · (X·F<sub>r</sub> + Y·F<sub>a</sub>)</code></p>
      <p>载荷系数 <code>f<sub>p</sub></code> 考虑名义载荷中未计入的冲击和振动。</p>
      <p><strong>基本额定寿命</strong>（一批相同轴承中 90 % 能达到或超过的寿命）：</p>
      <p><code>L<sub>10</sub> = (f<sub>t</sub>·C / P)<sup>ε</sup></code> &nbsp;[10⁶ r]， &nbsp; <code>L<sub>10h</sub> = 10⁶ / (60·n) · L<sub>10</sub></code> &nbsp;[h]</p>
      <p>寿命指数 <code>ε</code>：球轴承取 3，滚子轴承取 10/3。<code>f<sub>t</sub></code> 为温度系数，工作温度高于 120 °C 时折减额定动载荷。</p>
      <p><strong>所需基本额定动载荷。</strong>以预期寿命 <code>L<sub>h</sub>′</code> 反算 C：</p>
      <p><code>C′ = (P / f<sub>t</sub>) · (60·n·L<sub>h</sub>′ / 10⁶)<sup>1/ε</sup></code></p>
      <p>当 <code>C ≥ C′</code> 时轴承满足要求，这与 <code>L<sub>10h</sub> ≥ L<sub>h</sub>′</code> 等价。</p>
      <h3>可靠度不是 90 % 时</h3>
      <p><code>L<sub>na</sub> = a<sub>1</sub>·L<sub>10</sub></code>，可靠度 90、95、96、97、98、99 % 时 a<sub>1</sub> 分别为 1、0.64、0.55、0.47、0.37、0.25（ISO 281:2007）。此时 C′ 按 <code>L<sub>h</sub>′/a<sub>1</sub></code> 计算。</p>
      <h3>单位</h3>
      <p>C、C<sub>0</sub>、F<sub>r</sub>、F<sub>a</sub>、P 统一用 kN，寿命只取决于比值 C/P。折合年数按每年 365 天计。</p>`,
    disclaimer: '本工具按 ISO 281 基本方法计算基本额定寿命；未包括修正额定寿命（aISO）、静载荷校核以及润滑条件的影响。',
    footerText: '开源项目，完全在浏览器中运行。',
    footerLink: 'GitHub',
  },
};

/* ---------- 状态与 DOM ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  type: $('type'), C: $('C'), n: $('n'), rel: $('rel'),
  xy: $('xy'), Fr: $('Fr'), Fa: $('Fa'), C0: $('C0'), C0Field: $('C0-field'), X: $('X'), Y: $('Y'),
  xyHint: $('xy-hint'), dgbbTable: $('dgbb-table'),
  fpPreset: $('fpPreset'), fp: $('fp'), ft: $('ft'), fpHint: $('fp-hint'),
  lhPreset: $('lhPreset'), Lh: $('Lh'), lhHint: $('lh-hint'),
  err: $('err'), body: $('results-body'), badge: $('badge'),
  P: $('r-P'), life: $('r-life'), lifeLabel: $('r-life-label'),
  L: $('r-L'), LLabel: $('r-L-label'), L2: $('r-L2'),
  y8: $('r-y8'), y24: $('r-y24'), creq: $('r-creq'), creq2: $('r-creq2'),
  ratioLabel: $('r-ratio-label'), ratio: $('r-ratio'), bar: $('bar'), barFill: $('bar-fill'),
  summary: $('summary'), copy: $('copy'),
};

const CUSTOM = 'custom';
const XY_MODES = ['radial', 'dgbb', 'manual'];
const DEFAULTS = { t: 'ball', C: '25.5', n: '1450', R: '90', xy: 'radial', Fr: '3', Fa: '0', C0: '15.2', X: '1', Y: '0', fp: '1.1', ft: '1', Lh: '5000' };

let lang = 'en';
let last = null;
let copyTimer = 0;

const t = (k) => I18N[lang][k];
const fill = (s, map) => s.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));

/* ---------- 格式化 ---------- */
// 普通小数：去掉多余的零
const num = (v, d = 3) => String(Math.round(v * 10 ** d) / 10 ** d);
// 带千分位的整数/小数；数值过大时用科学计数法
function big(v, d = 0) {
  if (!Number.isFinite(v)) return '∞';
  if (Math.abs(v) >= 1e9) {
    const [m, e] = v.toExponential(2).split('e');
    return `${m}×10${String(Number(e)).replace(/./g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)] || (c === '-' ? '⁻' : c))}`;
  }
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
// 按数量级自动取有效位
const sig = (v) => (v >= 1000 ? big(v, 0) : v >= 100 ? big(v, 1) : v >= 10 ? big(v, 2) : big(v, 3));

/* ---------- 初始化选择框 ---------- */
function opt(value, html) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = html;
  return o;
}

function renderSelects() {
  const keep = (s, fn) => { const v = s.value; s.innerHTML = ''; fn(); if (v) s.value = v; };
  keep(el.type, () => Object.keys(LIFE_EXPONENT).forEach((k) => el.type.appendChild(opt(k, t('type' + k)))));
  keep(el.rel, () => Object.entries(RELIABILITY_A1).forEach(([r, a]) => el.rel.appendChild(opt(r, fill(t('relOpt'), { r, a })))));
  keep(el.xy, () => XY_MODES.forEach((m) => el.xy.appendChild(opt(m, t('xy' + m)))));
  keep(el.ft, () => FT_PRESETS.forEach((p) => el.ft.appendChild(opt(String(p.ft), fill(t('ftOpt'), { t: p.t, ft: p.ft.toFixed(2) })))));
  keep(el.fpPreset, () => {
    FP_PRESETS.forEach((p) => el.fpPreset.appendChild(opt(p.id, `${lang === 'zh' ? p.nameZh : p.name} (${p.range[0].toFixed(1)}–${p.range[1].toFixed(1)})`)));
    el.fpPreset.appendChild(opt(CUSTOM, t('custom')));
  });
  keep(el.lhPreset, () => {
    LIFE_GUIDE.forEach((g) => el.lhPreset.appendChild(opt(g.id, `${lang === 'zh' ? g.nameZh : g.name} · ${big(g.range[0])}–${big(g.range[1])} h`)));
    el.lhPreset.appendChild(opt(CUSTOM, t('custom')));
  });
}

// 深沟球轴承 X、Y 参考表
function renderDgbbTable() {
  const row = (head, cells) => `<tr><th scope="row">${head}</th>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
  el.dgbbTable.innerHTML = '<tbody>' +
    row(t('thRatio'), DGBB_TABLE.map((r) => r.r)) +
    row('e', DGBB_TABLE.map((r) => r.e.toFixed(2))) +
    row('Y <small>(X = 0.56)</small>', DGBB_TABLE.map((r) => r.Y.toFixed(2))) +
    '</tbody>';
}

/* ---------- 预设与数值联动 ---------- */
function syncFpPreset() {
  const v = parseFloat(el.fp.value);
  const p = FP_PRESETS.find((x) => v >= x.range[0] && v <= x.range[1]);
  // 1.2、1.8 这类边界值保留当前选择
  const cur = FP_PRESETS.find((x) => x.id === el.fpPreset.value);
  el.fpPreset.value = cur && v >= cur.range[0] && v <= cur.range[1] ? cur.id : p ? p.id : CUSTOM;
  const sel = FP_PRESETS.find((x) => x.id === el.fpPreset.value);
  el.fpHint.innerHTML = (sel
    ? fill(t('fpHint'), { lo: sel.range[0].toFixed(1), hi: sel.range[1].toFixed(1), eg: lang === 'zh' ? sel.egZh : sel.eg })
    : t('fpHintCustom')) + ' ' + t('ftNote');
}

function syncLhPreset() {
  const v = parseFloat(el.Lh.value);
  const cur = LIFE_GUIDE.find((x) => x.id === el.lhPreset.value);
  const g = LIFE_GUIDE.find((x) => v >= x.range[0] && v <= x.range[1]);
  el.lhPreset.value = cur && v >= cur.range[0] && v <= cur.range[1] ? cur.id : g ? g.id : CUSTOM;
  const sel = LIFE_GUIDE.find((x) => x.id === el.lhPreset.value);
  el.lhHint.textContent = sel ? fill(t('lhHint'), { lo: big(sel.range[0]), hi: big(sel.range[1]) }) : t('lhHintCustom');
}

// 根据 X、Y 模式决定输入框是否可编辑，并在查表模式下回填 X、Y
function syncXY() {
  const mode = el.xy.value;
  const manual = mode === 'manual';
  el.X.readOnly = !manual;
  el.Y.readOnly = !manual;
  el.C0Field.hidden = mode !== 'dgbb';
  el.xyHint.classList.remove('warn');
  el.xyHint.textContent = '';
  const Fr = parseFloat(el.Fr.value), Fa = parseFloat(el.Fa.value);
  if (mode === 'radial') {
    el.X.value = '1';
    el.Y.value = '0';
    if (Fa > 0) { el.xyHint.textContent = t('hintRadialFa'); el.xyHint.classList.add('warn'); }
    return null;
  }
  if (mode === 'manual') {
    el.xyHint.textContent = t('hintManual');
    return null;
  }
  // 查表模式
  const C0 = parseFloat(el.C0.value);
  let f;
  try {
    f = dgbbFactors({ Fr, Fa, C0 });
  } catch (e) {
    el.X.value = '';
    el.Y.value = '';
    return e;
  }
  el.X.value = num(f.X, 3);
  el.Y.value = num(f.Y, 3);
  if (Fa === 0) {
    el.xyHint.textContent = t('hintDgbbZero');
  } else {
    el.xyHint.textContent = fill(t('hintDgbb'), {
      r: num(f.ratio, 4), e: num(f.e, 3), q: Number.isFinite(f.FaFr) ? num(f.FaFr, 3) : '∞',
      cmp: f.heavyAxial ? '>' : '≤', X: num(f.X, 3), Y: num(f.Y, 3),
    }) + (f.clamped ? t('hintDgbbClamp') : '');
  }
  return null;
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
  renderSelects();
  renderDgbbTable();
}

function setLang(l) {
  lang = l;
  saveLang(l);
  applyLang();
  update(false);
}

/* ---------- 计算与渲染 ---------- */
const val = (n) => {
  const s = n.value.trim();
  return s === '' ? NaN : Number(s);
};

function readInput() {
  return {
    type: el.type.value,
    C: val(el.C), n: val(el.n), reliability: Number(el.rel.value),
    Fr: val(el.Fr), Fa: el.Fa.value.trim() === '' ? 0 : val(el.Fa),
    X: val(el.X), Y: val(el.Y),
    fp: val(el.fp), ft: Number(el.ft.value), Lh: val(el.Lh),
  };
}

const ERR_KEYS = { C: 'errC', N: 'errN', P: 'errP', LOAD: 'errLoad', XY: 'errXY', FP: 'errFP', LH: 'errLH', C0: 'errC0' };

function showError(msg) {
  last = null;
  el.err.textContent = msg;
  el.body.hidden = true;
  el.badge.hidden = true;
}

function update(writeUrl = true) {
  el.err.textContent = '';
  syncFpPreset();
  syncLhPreset();
  const xyErr = syncXY();
  if (writeUrl) writeHash();
  if (xyErr) {
    showError(xyErr instanceof BearingError && ERR_KEYS[xyErr.code] ? t(ERR_KEYS[xyErr.code]) : t('errOther'));
    return;
  }
  let r;
  try {
    r = calcBearing(readInput());
  } catch (e) {
    showError(e instanceof BearingError && ERR_KEYS[e.code] ? t(ERR_KEYS[e.code]) : t('errOther'));
    return;
  }
  last = r;
  el.body.hidden = false;
  el.badge.hidden = false;
  renderResults(r);
  renderSummary(r);
}

function renderResults(r) {
  const R = r.input.reliability;
  const nIdx = String(100 - R); // 失效概率下标，如 95 % → L5
  const adj = R !== 90;
  el.P.textContent = sig(r.P);
  el.lifeLabel.innerHTML = adj ? fill(t('lifeLnah'), { n: nIdx, r: R }) : t('lifeL10h');
  el.life.textContent = big(r.Lnah, 0);
  el.LLabel.innerHTML = adj ? fill(t('lnaLabel'), { n: nIdx }) : t('lLabel');
  el.L.textContent = sig(r.Lna);
  el.L2.textContent = adj ? fill(t('lnaDetail'), { v: sig(r.L10), h: big(r.L10h, 0) }) : '';
  el.y8.textContent = `${sig(r.years8)} ${t('yr')}`;
  el.y24.textContent = `${sig(r.years24)} ${t('yr')}`;
  el.creq.textContent = `${sig(r.Creq)} kN`;
  el.creq.className = 'm-val ' + (r.pass ? 'ok' : 'bad');
  el.creq2.textContent = fill(t('creqVs'), { c: num(r.input.C, 3) });

  el.badge.textContent = r.pass ? t('pass') : t('fail');
  el.badge.className = 'badge ' + (r.pass ? 'pass' : 'fail');

  el.ratioLabel.innerHTML = fill(t('ratioLabel'), { lh: big(r.input.Lh) });
  el.ratio.textContent = r.ratio >= 100 ? big(r.ratio, 0) : num(r.ratio, 2);
  // 标尺 0–2 倍，满格表示 ≥ 2 倍
  el.barFill.style.width = `${Math.min(r.ratio / 2, 1) * 100}%`;
  el.bar.classList.toggle('fail', !r.pass);
  el.bar.setAttribute('aria-label', `Lh/Lh′ = ${num(r.ratio, 2)}`);
}

function renderSummary(r) {
  const i = r.input;
  const R = i.reliability;
  const lifeName = R === 90 ? 'L10h' : `L${100 - R}h (a1=${r.a1})`;
  el.summary.textContent =
    `${i.type === 'ball' ? t('sumBall') : t('sumRoller')}, C=${num(i.C)} kN, n=${num(i.n)} r/min, ` +
    `Fr=${num(i.Fr)} kN, Fa=${num(i.Fa)} kN, X=${num(i.X)}, Y=${num(i.Y)}, fp=${num(i.fp)}, ft=${num(i.ft, 2)} → ` +
    `P=${sig(r.P)} kN, L10=${sig(r.L10)}×10⁶ r, ${lifeName}=${big(r.Lnah, 0)} h; ` +
    `Lh′=${big(i.Lh)} h → C′=${sig(r.Creq)} kN ${r.pass ? '≤' : '>'} C (${r.pass ? t('sumOk') : t('sumFail')})`;
}

/* ---------- URL hash ---------- */
const HASH_FIELDS = { C: 'C', n: 'n', Fr: 'Fr', Fa: 'Fa', C0: 'C0', X: 'X', Y: 'Y', fp: 'fp', Lh: 'Lh' };

function applyState(p) {
  const get = (k) => { const v = p.get(k); return v === null || v === '' ? DEFAULTS[k] : v; };
  const pick = (s, v, ok) => { if (ok) s.value = v; };
  pick(el.type, get('t'), Object.hasOwn(LIFE_EXPONENT, get('t')));
  pick(el.rel, get('R'), Object.hasOwn(RELIABILITY_A1, get('R')));
  pick(el.xy, get('xy'), XY_MODES.includes(get('xy')));
  pick(el.ft, get('ft'), FT_PRESETS.some((x) => String(x.ft) === get('ft')));
  for (const [k, id] of Object.entries(HASH_FIELDS)) el[id].value = get(k);
}

function readHash() {
  applyState(new URLSearchParams(location.hash.replace(/^#/, '')));
}

function writeHash() {
  const q = new URLSearchParams({
    t: el.type.value, C: el.C.value.trim(), n: el.n.value.trim(), R: el.rel.value,
    xy: el.xy.value, Fr: el.Fr.value.trim(), Fa: el.Fa.value.trim(),
  });
  if (el.xy.value === 'dgbb') q.set('C0', el.C0.value.trim());
  if (el.xy.value === 'manual') { q.set('X', el.X.value.trim()); q.set('Y', el.Y.value.trim()); }
  q.set('fp', el.fp.value.trim());
  q.set('ft', el.ft.value);
  q.set('Lh', el.Lh.value.trim());
  try { history.replaceState(null, '', '#' + q.toString()); } catch (e) { /* 忽略 */ }
}

/* ---------- 事件 ---------- */
for (const s of [el.type, el.rel, el.ft]) s.addEventListener('change', () => update());
for (const n of [el.C, el.n, el.Fr, el.Fa, el.C0, el.X, el.Y, el.fp, el.Lh]) n.addEventListener('input', () => update());

el.xy.addEventListener('change', () => {
  // 切到手动模式时保留当前 X、Y 作为起点
  update();
});
el.fpPreset.addEventListener('change', () => {
  const p = FP_PRESETS.find((x) => x.id === el.fpPreset.value);
  if (p) el.fp.value = String(p.value);
  update();
});
el.lhPreset.addEventListener('change', () => {
  const g = LIFE_GUIDE.find((x) => x.id === el.lhPreset.value);
  if (g) el.Lh.value = String(g.value);
  update();
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
  update(false);
});

/* ---------- 启动 ---------- */
lang = detectLang();
applyLang();
readHash();
update(false);
document.documentElement.classList.remove('i18n-pending');
