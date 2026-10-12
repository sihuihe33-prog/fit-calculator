import { detectLang, saveLang, renderNav } from './site.js?v=dc76b3df';
import {
  ShaftError, MATERIALS, ALLOW_PRESETS, ALPHA_PRESETS,
  minDiameter, combinedCheck, keyForDiameter,
} from './shaft.js?v=b156e384';

/* ---------- 文案字典 ---------- */
const I18N = {
  en: {
    docTitle: 'Shaft Diameter & Strength Calculator — Torsion and Combined Bending–Torsion',
    docDesc: 'Free shaft design calculator: minimum shaft diameter from torsional strength d ≥ A0·∛(P/n) with keyway allowance and hollow shafts, plus a combined bending–torsion check (third strength theory) with section modulus and keyways.',
    h1: 'Shaft Strength Calculator',
    subtitle: 'Minimum diameter from torsion, combined bending–torsion check',
    estTitle: '1 · Minimum diameter from torsional strength',
    pLabel: 'Power P (kW)',
    nLabel: 'Speed n (r/min)',
    a0Label: 'Coefficient A<sub>0</sub>',
    matLabel: 'Shaft material',
    customA0: 'Custom A₀',
    secLabel: 'Cross-section',
    secSolid: 'Solid',
    secHollow: 'Hollow',
    betaLabel: 'β = d<sub>i</sub>/d (hollow)',
    kwLabel: 'Keyways at this section',
    kw0: 'None',
    kw1: 'One keyway',
    kw2: 'Two keyways',
    matHint: '[τT] = {tau} MPa, A₀ = {a0} (default: middle {mid}).',
    matHintOut: ' ⚠ A₀ = {v} is outside this material’s range.',
    customHint: 'Custom A₀ — typical textbook values lie between 97 and 149.',
    a0Hint: 'Use a larger A<sub>0</sub> (lower end of [τ<sub>T</sub>]) when bending is relatively large; a smaller A<sub>0</sub> when bending is small or the shaft only transmits torque.',
    dStdLabel: 'Suggested diameter',
    dStdHollow: 'inner ≈ {di} mm (β = {b})',
    tLabel: 'Torque T',
    tNm: '= {v} N·m',
    dRawLabel: 'd<sub>min</sub> from torsion',
    dRawSolid: 'A₀·∛(P/n)',
    dRawHollow: 'solid {s} mm × {f} (hollow)',
    dKeyLabel: 'After keyway allowance',
    dKeyNone: 'no keyway',
    dKeyPct: '+{p} % (range {r} %)',
    dKeyPct1: '+{p} %',
    tauLabel: '[τ<sub>T</sub>] implied by A<sub>0</sub>',
    roundRule: 'Rounding rule: round up to the next whole millimetre for d ≤ 50 mm, and to the next multiple of 5 mm above 50 mm. This is the <em>minimum</em> shaft-end diameter; the final value is usually set by the coupling, pulley or bearing bore.',
    summaryTitle: 'Summary',
    copy: 'Copy',
    copied: 'Copied',
    sendT: 'Use this T and d in the check ↓',
    chkTitle: '2 · Check by combined bending and torsion',
    mmodeLabel: 'Bending moment input',
    mmodePlanes: 'Two planes M<sub>H</sub>, M<sub>V</sub>',
    mmodeTotal: 'Resultant M',
    mhLabel: 'M<sub>H</sub> horizontal (N·m)',
    mvLabel: 'M<sub>V</sub> vertical (N·m)',
    mLabel: 'Resultant M (N·m)',
    t2Label: 'Torque T (N·m)',
    alphaSelLabel: 'Torsional stress type',
    alphastatic: 'Static (α = 0.3)',
    alphapulsating: 'Pulsating (α ≈ 0.6)',
    alphareversed: 'Fully reversed (α = 1)',
    alphaCustom: 'Custom α',
    alphaLabel: 'Correction factor α',
    d2Label: 'Section diameter d (mm)',
    kw2Label: 'Keyway at the section',
    kbLabel: 'Key width b (mm)',
    ktLabel: 'Depth t (mm)',
    keyAuto: 'b and t from GB/T 1095 for d = {d} mm (key {b}×{h}).',
    keyManual: 'Manual b and t. ',
    keyReset: 'Use GB/T 1095 values',
    keyNoTable: 'd is outside the GB/T 1095 table (6–230 mm) — enter b and t.',
    amatLabel: '[σ<sub>−1</sub>] preset (typical textbook values)',
    allowCustom: 'Custom',
    allowLabel: 'Allowable [σ<sub>−1</sub>] (MPa)',
    allowHint: 'Presets are approximate typical values — check the [σ<sub>−1</sub>] table in your textbook or design handbook.',
    chkResults: 'Result',
    pass: 'Passes',
    fail: 'Fails',
    sigmaLabel: 'Combined stress σ<sub>ca</sub>',
    sigmaNote: '[σ−1] = {a} MPa',
    dReqLabel: 'Required diameter d<sub>req</sub>',
    dReqSolid: '∛(32·Mca / (π·[σ−1])), keyway not included',
    dReqHollow: 'hollow β = {b}, keyway not included',
    utilLabel: 'Utilization σ<sub>ca</sub> / [σ<sub>−1</sub>]',
    mResLabel: 'Resultant M',
    aTLabel: 'αT',
    mcaLabel: 'M<sub>ca</sub> = √(M² + (αT)²)',
    wLabel: 'Section modulus W',
    wApprox: '≈ 0.1d³ = {v} mm³',
    wKey: '{w0} − {wk} (keyway)',
    sumSolid: 'solid',
    sumHollow: 'hollow β={b}',
    sumKw1: '1 keyway',
    sumKw2: '2 keyways',
    errInput: 'Please enter valid numbers in all fields.',
    errPOWER: 'Power P must be greater than 0.',
    errSPEED: 'Speed n must be greater than 0.',
    errA0: 'A₀ must be a positive number (typically 97–149).',
    errBETA: 'β must be between 0 and 0.9.',
    errKEYPCT: 'Keyway allowance out of range.',
    errKEYWAYS: 'Invalid number of keyways.',
    errDIAMETER: 'Section diameter d must be greater than 0.',
    errMOMENT: 'Bending moments must be valid numbers (M ≥ 0).',
    errTORQUE: 'Torque T must be 0 or greater.',
    errALPHA: 'α must be greater than 0 and at most 1.',
    errALLOW: '[σ−1] must be a positive number.',
    errKEY: 'Keyway size is not valid for this section (b < d, t < d/2, t less than the wall thickness).',
    errOther: 'Calculation failed for this input.',
    aboutTitle: 'How it is calculated',
    aboutBody: `
      <p>This page follows the method taught in the standard Chinese machine-design textbook (濮良贵《机械设计》, chapter “Shafts”): first estimate the minimum diameter from torsion, lay out the shaft, then check the critical sections under combined bending and torsion.</p>
      <h3>1 · Minimum diameter from torsional strength</h3>
      <p><code>T = 9.55×10⁶ · P / n</code> &nbsp;(N·mm, with P in kW and n in r/min)</p>
      <p><code>τ<sub>T</sub> = T / W<sub>T</sub> ≈ T / (0.2 d³) ≤ [τ<sub>T</sub>]</code> &nbsp;⇒&nbsp; <code>d ≥ A<sub>0</sub> · ∛(P/n)</code> &nbsp;(mm), with <code>A<sub>0</sub> = ∛(9.55×10⁶ / (0.2 [τ<sub>T</sub>]))</code>.</p>
      <p>A reduced [τ<sub>T</sub>] (i.e. a larger A<sub>0</sub>) accounts for the bending that is not yet known at this stage. Hollow shaft: <code>d ≥ A<sub>0</sub> · ∛(P/n) · 1/∛(1 − β⁴)</code>, β = d<sub>i</sub>/d.</p>
      <table class="data"><thead><tr><th>Material</th><th>[τ<sub>T</sub>] (MPa)</th><th>A<sub>0</sub></th></tr></thead><tbody>
        <tr><td>Q235A, 20</td><td>15–25</td><td>149–126</td></tr>
        <tr><td>Q275, 35</td><td>20–35</td><td>135–112</td></tr>
        <tr><td>45</td><td>25–45</td><td>126–103</td></tr>
        <tr><td>40Cr, 35SiMn, 38SiMnMo, 3Cr13</td><td>35–55</td><td>112–97</td></tr>
      </tbody></table>
      <p><strong>Keyway allowance.</strong> For d &gt; 100 mm increase d by 3 % (one keyway) or 7 % (two keyways); for d ≤ 100 mm by 5–7 % (one) or 10–15 % (two). This tool uses the upper value (7 % / 15 %) for d ≤ 100 mm.</p>
      <h3>2 · Combined bending and torsion (third strength theory)</h3>
      <p><code>M = √(M<sub>H</sub>² + M<sub>V</sub>²)</code>, &nbsp;<code>σ<sub>ca</sub> = √(M² + (αT)²) / W = M<sub>ca</sub> / W ≤ [σ<sub>−1</sub>]</code></p>
      <p>The bending stress of a rotating shaft is fully reversed; α converts the torsional stress to the same cycle: <strong>α = 0.3</strong> for static torsion, <strong>α ≈ 0.6</strong> for pulsating torsion (the usual assumption for a shaft that starts and stops), <strong>α = 1</strong> for fully reversed torsion.</p>
      <ul>
        <li>Solid: <code>W = πd³/32 ≈ 0.1 d³</code></li>
        <li>Hollow: <code>W = πd³/32 · (1 − β⁴)</code></li>
        <li>One keyway: <code>W = πd³/32 − b t (d − t)² / (2d)</code>; two keyways (180° apart): <code>W = πd³/32 − b t (d − t)² / d</code>. Key width b and shaft keyway depth t can be taken from GB/T 1095 automatically.</li>
      </ul>
      <p>Required diameter for the given loads (solid, no keyway): <code>d<sub>req</sub> = ∛(M<sub>ca</sub> / (0.1 [σ<sub>−1</sub>]))</code>; for a hollow shaft divide by (1 − β⁴) inside the root.</p>
      <p><strong>Units.</strong> Moments and torque are entered in N·m and converted to N·mm (× 1000) so that stresses come out in MPa (N/mm²).</p>`,
    disclaimer: 'Simplified textbook method — fatigue safety-factor check (with stress concentration, size and surface factors) is not included yet. Allowable stresses are typical values; verify them against your textbook or handbook.',
    footerText: 'Open source, runs entirely in your browser.',
    footerLink: 'GitHub',
  },
  zh: {
    docTitle: '轴径与轴强度计算器 — 按扭转估算与弯扭合成校核',
    docDesc: '免费的轴设计计算器：按扭转强度 d ≥ A0·∛(P/n) 估算最小轴径（含键槽加大与空心轴），并按第三强度理论进行弯扭合成强度校核（含抗弯截面系数与键槽）。',
    h1: '轴的强度计算器',
    subtitle: '按扭转强度估算轴径，按弯扭合成强度校核',
    estTitle: '1 · 按扭转强度估算最小轴径',
    pLabel: '功率 P (kW)',
    nLabel: '转速 n (r/min)',
    a0Label: '系数 A<sub>0</sub>',
    matLabel: '轴的材料',
    customA0: '自定义 A₀',
    secLabel: '截面形式',
    secSolid: '实心',
    secHollow: '空心',
    betaLabel: 'β = d<sub>i</sub>/d（空心）',
    kwLabel: '该截面键槽数',
    kw0: '无键槽',
    kw1: '一个键槽',
    kw2: '两个键槽',
    matHint: '[τT] = {tau} MPa，A₀ = {a0}（默认取中间值 {mid}）。',
    matHintOut: ' ⚠ A₀ = {v} 超出该材料的取值范围。',
    customHint: '自定义 A₀ —— 教材表中的取值一般在 97 到 149 之间。',
    a0Hint: '弯矩相对较大时 A<sub>0</sub> 取较大值（[τ<sub>T</sub>] 取较小值）；弯矩较小或只传递扭矩时 A<sub>0</sub> 取较小值。',
    dStdLabel: '建议轴径',
    dStdHollow: '内径约 {di} mm（β = {b}）',
    tLabel: '扭矩 T',
    tNm: '= {v} N·m',
    dRawLabel: '按扭转算得 d<sub>min</sub>',
    dRawSolid: 'A₀·∛(P/n)',
    dRawHollow: '实心 {s} mm × {f}（空心）',
    dKeyLabel: '计入键槽加大后',
    dKeyNone: '无键槽',
    dKeyPct: '+{p} %（范围 {r} %）',
    dKeyPct1: '+{p} %',
    tauLabel: 'A<sub>0</sub> 对应的 [τ<sub>T</sub>]',
    roundRule: '圆整规则：d ≤ 50 mm 时向上取整到整毫米，d &gt; 50 mm 时向上取到 5 的倍数。这只是轴端的<em>最小</em>直径，最终数值通常还要按联轴器、带轮或轴承的孔径确定。',
    summaryTitle: '摘要',
    copy: '复制',
    copied: '已复制',
    sendT: '把这里的 T 和 d 带入下方校核 ↓',
    chkTitle: '2 · 按弯扭合成强度校核',
    mmodeLabel: '弯矩输入方式',
    mmodePlanes: '两平面 M<sub>H</sub>、M<sub>V</sub>',
    mmodeTotal: '合成弯矩 M',
    mhLabel: '水平面弯矩 M<sub>H</sub> (N·m)',
    mvLabel: '垂直面弯矩 M<sub>V</sub> (N·m)',
    mLabel: '合成弯矩 M (N·m)',
    t2Label: '扭矩 T (N·m)',
    alphaSelLabel: '扭转切应力性质',
    alphastatic: '静应力（α = 0.3）',
    alphapulsating: '脉动循环（α ≈ 0.6）',
    alphareversed: '对称循环（α = 1）',
    alphaCustom: '自定义 α',
    alphaLabel: '折合系数 α',
    d2Label: '截面直径 d (mm)',
    kw2Label: '截面处键槽',
    kbLabel: '键宽 b (mm)',
    ktLabel: '轴槽深 t (mm)',
    keyAuto: 'b、t 按 GB/T 1095 由 d = {d} mm 查得（键 {b}×{h}）。',
    keyManual: '已手动输入 b、t。',
    keyReset: '改用 GB/T 1095 查表值',
    keyNoTable: 'd 超出 GB/T 1095 表格范围（6–230 mm），请手动输入 b 和 t。',
    amatLabel: '[σ<sub>−1</sub>] 预设（教材典型值）',
    allowCustom: '自定义',
    allowLabel: '许用弯曲应力 [σ<sub>−1</sub>] (MPa)',
    allowHint: '预设为近似的典型值——请以所用教材或设计手册中的 [σ<sub>−1</sub>] 表为准。',
    chkResults: '校核结果',
    pass: '满足强度',
    fail: '强度不足',
    sigmaLabel: '计算应力 σ<sub>ca</sub>',
    sigmaNote: '[σ−1] = {a} MPa',
    dReqLabel: '所需最小直径 d<sub>req</sub>',
    dReqSolid: '∛(32·Mca / (π·[σ−1]))，未计键槽',
    dReqHollow: '空心 β = {b}，未计键槽',
    utilLabel: '利用率 σ<sub>ca</sub> / [σ<sub>−1</sub>]',
    mResLabel: '合成弯矩 M',
    aTLabel: 'αT',
    mcaLabel: 'M<sub>ca</sub> = √(M² + (αT)²)',
    wLabel: '抗弯截面系数 W',
    wApprox: '≈ 0.1d³ = {v} mm³',
    wKey: '{w0} − {wk}（键槽）',
    sumSolid: '实心',
    sumHollow: '空心 β={b}',
    sumKw1: '一个键槽',
    sumKw2: '两个键槽',
    errInput: '请在所有输入框中填写有效数字。',
    errPOWER: '功率 P 必须大于 0。',
    errSPEED: '转速 n 必须大于 0。',
    errA0: 'A₀ 必须为正数（一般在 97–149 之间）。',
    errBETA: 'β 必须在 0 到 0.9 之间。',
    errKEYPCT: '键槽加大百分比超出范围。',
    errKEYWAYS: '键槽数量无效。',
    errDIAMETER: '截面直径 d 必须大于 0。',
    errMOMENT: '弯矩必须是有效数字（M ≥ 0）。',
    errTORQUE: '扭矩 T 不能为负。',
    errALPHA: 'α 必须大于 0 且不超过 1。',
    errALLOW: '[σ−1] 必须为正数。',
    errKEY: '键槽尺寸与该截面不匹配（须 b < d、t < d/2，且 t 小于空心轴壁厚）。',
    errOther: '该输入无法计算。',
    aboutTitle: '计算方法',
    aboutBody: `
      <p>本页按濮良贵《机械设计》"轴"一章的方法：先按扭转强度估算最小轴径，完成轴的结构设计后，再对危险截面按弯扭合成强度校核。</p>
      <h3>1 · 按扭转强度估算最小轴径</h3>
      <p><code>T = 9.55×10⁶ · P / n</code>（N·mm，P 单位 kW，n 单位 r/min）</p>
      <p><code>τ<sub>T</sub> = T / W<sub>T</sub> ≈ T / (0.2 d³) ≤ [τ<sub>T</sub>]</code> ⇒ <code>d ≥ A<sub>0</sub> · ∛(P/n)</code>（mm），其中 <code>A<sub>0</sub> = ∛(9.55×10⁶ / (0.2 [τ<sub>T</sub>]))</code>。</p>
      <p>此阶段弯矩尚未知，用降低的许用扭转切应力（即较大的 A<sub>0</sub>）来考虑弯矩的影响。空心轴：<code>d ≥ A<sub>0</sub> · ∛(P/n) · 1/∛(1 − β⁴)</code>，β = d<sub>i</sub>/d。</p>
      <table class="data"><thead><tr><th>轴的材料</th><th>[τ<sub>T</sub>] (MPa)</th><th>A<sub>0</sub></th></tr></thead><tbody>
        <tr><td>Q235A、20</td><td>15–25</td><td>149–126</td></tr>
        <tr><td>Q275、35</td><td>20–35</td><td>135–112</td></tr>
        <tr><td>45</td><td>25–45</td><td>126–103</td></tr>
        <tr><td>40Cr、35SiMn、38SiMnMo、3Cr13</td><td>35–55</td><td>112–97</td></tr>
      </tbody></table>
      <p><strong>键槽加大。</strong>d &gt; 100 mm 时，有一个键槽轴径增大 3 %，两个键槽增大 7 %；d ≤ 100 mm 时，一个键槽增大 5–7 %，两个键槽增大 10–15 %。本工具在 d ≤ 100 mm 时取上限 7 % / 15 %。</p>
      <h3>2 · 按弯扭合成强度校核（第三强度理论）</h3>
      <p><code>M = √(M<sub>H</sub>² + M<sub>V</sub>²)</code>，<code>σ<sub>ca</sub> = √(M² + (αT)²) / W = M<sub>ca</sub> / W ≤ [σ<sub>−1</sub>]</code></p>
      <p>转轴的弯曲应力为对称循环，α 把扭转切应力折合成相同的循环特性：扭转切应力为静应力时 <strong>α = 0.3</strong>；为脉动循环时 <strong>α ≈ 0.6</strong>（常见的启停频繁、单向转动的轴一般按此取）；为对称循环时 <strong>α = 1</strong>。</p>
      <ul>
        <li>实心轴：<code>W = πd³/32 ≈ 0.1 d³</code></li>
        <li>空心轴：<code>W = πd³/32 · (1 − β⁴)</code></li>
        <li>一个键槽：<code>W = πd³/32 − b t (d − t)² / (2d)</code>；两个键槽（相隔 180°）：<code>W = πd³/32 − b t (d − t)² / d</code>。键宽 b、轴槽深 t 可按 GB/T 1095 自动查取。</li>
      </ul>
      <p>按给定载荷所需的最小直径（实心、未计键槽）：<code>d<sub>req</sub> = ∛(M<sub>ca</sub> / (0.1 [σ<sub>−1</sub>]))</code>；空心轴在根号内再除以 (1 − β⁴)。</p>
      <p><strong>单位。</strong>弯矩和扭矩在界面上以 N·m 输入，计算时乘以 1000 换成 N·mm，这样应力的单位就是 MPa（N/mm²）。</p>`,
    disclaimer: '简化的教材计算方法——尚未包含考虑应力集中、尺寸及表面质量系数的疲劳安全系数校核。许用应力为典型值，请对照教材或手册核实。',
    footerText: '开源项目，完全在浏览器中运行。',
    footerLink: 'GitHub',
  },
};

/* ---------- 状态与 DOM ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  P: $('P'), n: $('n'), A0: $('A0'), mat: $('mat'), sec1: $('sec1'), beta1: $('beta1'), kw1: $('kw1'),
  matHint: $('mat-hint'), err1: $('err1'), estBody: $('est-body'),
  dstd: $('r-dstd'), dstdNote: $('r-dstd-note'), T: $('r-T'), Tnm: $('r-T-nm'),
  draw: $('r-draw'), drawNote: $('r-draw-note'), dkey: $('r-dkey'), dkeyNote: $('r-dkey-note'), tau: $('r-tau'),
  summary1: $('summary1'), copy1: $('copy1'), sendT: $('send-t'),
  mmode: $('mmode'), Mh: $('Mh'), Mv: $('Mv'), M: $('M'), fMh: $('f-Mh'), fMv: $('f-Mv'), fM: $('f-M'),
  T2: $('T2'), alphaSel: $('alphaSel'), alpha: $('alpha'), d2: $('d2'),
  sec2: $('sec2'), beta2: $('beta2'), kw2: $('kw2'), kb: $('kb'), kt: $('kt'), keyHint: $('key-hint'),
  amat: $('amat'), allow: $('allow'), err2: $('err2'), chkBody: $('chk-body'),
  badge: $('badge'), sigma: $('r-sigma'), sigmaNote: $('r-sigma-note'), dreq: $('r-dreq'), dreqNote: $('r-dreq-note'),
  util: $('r-util'), bar: $('bar'), barFill: $('bar-fill'),
  rM: $('r-M'), aT: $('r-aT'), Mca: $('r-Mca'), W: $('r-W'), Wnote: $('r-W-note'),
  summary2: $('summary2'), copy2: $('copy2'),
};

const CUSTOM = 'custom';
let lang = 'en';
let est = null; // 第一部分最近一次结果
let chk = null; // 第二部分最近一次结果
let keyAuto = true; // 键槽 b、t 是否自动按 GB/T 1095 查取

const t = (k) => I18N[lang][k];
const tf = (k, vars) => t(k).replace(/\{(\w+)\}/g, (_, v) => vars[v]);

/* ---------- 格式化 ---------- */
const fmt = (v, d) => Number(v).toFixed(d);
// 千位分组（N·mm、mm³ 等大数）
const fmtInt = (v) => Math.round(v).toLocaleString('en-US');
// 去掉多余的小数 0
const fmtNum = (v, d = 3) => String(Math.round(v * 10 ** d) / 10 ** d);
const num = (input) => {
  const s = input.value.trim();
  return s === '' ? NaN : Number(s);
};
const a0Mid = (m) => (m.A0[0] + m.A0[1]) / 2;

/* ---------- 选择框 ---------- */
function opt(value, html) {
  const o = document.createElement('option');
  o.value = value;
  o.innerHTML = html;
  return o;
}
function fill(select, items) {
  const cur = select.value;
  select.innerHTML = '';
  for (const [v, text] of items) select.appendChild(opt(v, text));
  if (cur && items.some(([v]) => v === cur)) select.value = cur;
}
// <option> 里不能显示 <sub>，换成 Unicode 下标形式
const plain = (s) => s.replace(/<sub>H<\/sub>/g, 'H').replace(/<sub>V<\/sub>/g, 'V').replace(/<[^>]+>/g, '');

function renderOptions() {
  fill(el.mat, [
    ...MATERIALS.map((m) => [m.id, lang === 'zh' ? m.nameZh : m.name]),
    [CUSTOM, t('customA0')],
  ]);
  const secs = [['solid', t('secSolid')], ['hollow', t('secHollow')]];
  fill(el.sec1, secs);
  fill(el.sec2, secs);
  const kws = [['0', t('kw0')], ['1', t('kw1')], ['2', t('kw2')]];
  fill(el.kw1, kws);
  fill(el.kw2, kws);
  fill(el.mmode, [['planes', plain(t('mmodePlanes'))], ['total', t('mmodeTotal')]]);
  fill(el.alphaSel, [...ALPHA_PRESETS.map((a) => [a.id, t('alpha' + a.id)]), [CUSTOM, t('alphaCustom')]]);
  fill(el.amat, [
    ...ALLOW_PRESETS.map((a) => [a.id, `${lang === 'zh' ? a.nameZh : a.name} ≈ ${a.allow} MPa`]),
    [CUSTOM, t('allowCustom')],
  ]);
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
  renderOptions();
}

function setLang(l) {
  lang = l;
  saveLang(l);
  applyLang();
  updateAll(false);
}

function errText(e) {
  if (e instanceof ShaftError && I18N[lang]['err' + e.code]) return t('err' + e.code);
  return t('errOther');
}

/* ---------- 第一部分：估算 ---------- */
function syncSecUi() {
  el.beta1.disabled = el.sec1.value !== 'hollow';
  el.beta2.disabled = el.sec2.value !== 'hollow';
  const total = el.mmode.value === 'total';
  el.fM.hidden = !total;
  el.fMh.hidden = total;
  el.fMv.hidden = total;
}

function updateMatHint() {
  const m = MATERIALS.find((x) => x.id === el.mat.value);
  if (!m) { el.matHint.textContent = t('customHint'); return; }
  let s = tf('matHint', { tau: `${m.tau[0]}–${m.tau[1]}`, a0: `${m.A0[0]}–${m.A0[1]}`, mid: fmtNum(a0Mid(m), 1) });
  const v = num(el.A0);
  if (Number.isFinite(v) && (v > m.A0[0] || v < m.A0[1])) s += tf('matHintOut', { v: fmtNum(v, 2) });
  el.matHint.textContent = s;
}

function updateEst() {
  el.err1.textContent = '';
  updateMatHint();
  const inp = {
    P: num(el.P), n: num(el.n), A0: num(el.A0),
    beta: el.sec1.value === 'hollow' ? num(el.beta1) : 0,
    keyways: Number(el.kw1.value),
  };
  if (![inp.P, inp.n, inp.A0, inp.beta].every(Number.isFinite)) return estError(t('errInput'));
  let r;
  try { r = minDiameter(inp); } catch (e) { return estError(errText(e)); }
  est = r;
  el.estBody.hidden = false;
  el.dstd.textContent = String(r.dStd);
  el.dstdNote.textContent = r.input.beta > 0 ? tf('dStdHollow', { di: fmt(r.dInnerStd, 1), b: fmtNum(r.input.beta) }) : '';
  el.T.textContent = fmtInt(r.T);
  el.Tnm.textContent = tf('tNm', { v: fmt(r.T / 1000, 2) });
  el.draw.textContent = `${fmt(r.dRaw, 2)} mm`;
  el.drawNote.textContent = r.input.beta > 0
    ? tf('dRawHollow', { s: fmt(r.dSolid, 2), f: fmt(r.hollowFactor, 4) })
    : t('dRawSolid');
  el.dkey.textContent = `${fmt(r.dKey, 2)} mm`;
  el.dkeyNote.textContent = r.input.keyways === 0 ? t('dKeyNone')
    : r.keyRange[0] === r.keyRange[1] ? tf('dKeyPct1', { p: r.keyPct })
      : tf('dKeyPct', { p: r.keyPct, r: `${r.keyRange[0]}–${r.keyRange[1]}` });
  el.tau.textContent = `≈ ${fmt(r.tauFromA0, 1)} MPa`;

  const matName = (() => {
    const m = MATERIALS.find((x) => x.id === el.mat.value);
    return m ? (lang === 'zh' ? m.nameZh : m.name) + ', ' : '';
  })();
  const sec = r.input.beta > 0 ? tf('sumHollow', { b: fmtNum(r.input.beta) }) : t('sumSolid');
  const kw = r.input.keyways ? ', ' + t('sumKw' + r.input.keyways) : '';
  el.summary1.textContent =
    `P=${fmtNum(r.input.P)} kW, n=${fmtNum(r.input.n)} r/min, ${matName}A0=${fmtNum(r.input.A0, 2)}, ${sec}${kw} → ` +
    `T=${fmtInt(r.T)} N·mm, d_min=${fmt(r.dRaw, 2)} mm` +
    (r.input.keyways ? `, +${r.keyPct}% → ${fmt(r.dKey, 2)} mm` : '') +
    `, d=${r.dStd} mm`;
}

function estError(msg) {
  est = null;
  el.err1.textContent = msg;
  el.estBody.hidden = true;
}

/* ---------- 第二部分：校核 ---------- */
// 键槽 b、t：自动模式下按截面直径查 GB/T 1095
function syncKey() {
  const count = Number(el.kw2.value);
  el.kb.disabled = el.kt.disabled = count === 0;
  if (count === 0) { el.keyHint.textContent = ''; return; }
  const d = num(el.d2);
  const k = Number.isFinite(d) ? keyForDiameter(d) : null;
  el.keyHint.innerHTML = '';
  if (keyAuto) {
    if (k) {
      el.kb.value = fmtNum(k.b);
      el.kt.value = fmtNum(k.t);
      el.keyHint.textContent = tf('keyAuto', { d: fmtNum(d, 2), b: k.b, h: k.h });
    } else {
      // 查不到表时清空，避免沿用上一个直径的 b、t
      el.kb.value = '';
      el.kt.value = '';
      el.keyHint.textContent = t('keyNoTable');
    }
  } else if (k) {
    el.keyHint.append(t('keyManual'));
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sh-link';
    b.textContent = t('keyReset');
    b.addEventListener('click', () => { keyAuto = true; updateAll(); });
    el.keyHint.append(b);
  }
}

function updateChk() {
  el.err2.textContent = '';
  syncKey();
  const total = el.mmode.value === 'total';
  const count = Number(el.kw2.value);
  const vals = {
    Mh: num(el.Mh), Mv: num(el.Mv), M: num(el.M), T: num(el.T2), alpha: num(el.alpha),
    d: num(el.d2), beta: el.sec2.value === 'hollow' ? num(el.beta2) : 0, allow: num(el.allow),
    b: num(el.kb), tk: num(el.kt),
  };
  const needed = [vals.T, vals.alpha, vals.d, vals.beta, vals.allow, ...(total ? [vals.M] : [vals.Mh, vals.Mv]),
    ...(count ? [vals.b, vals.tk] : [])];
  if (!needed.every(Number.isFinite)) return chkError(t('errInput'));
  // 界面单位 N·m → 引擎单位 N·mm
  const inp = {
    T: vals.T * 1000, alpha: vals.alpha, d: vals.d, beta: vals.beta, allow: vals.allow,
    keyway: count ? { count, b: vals.b, t: vals.tk } : null,
  };
  if (total) inp.M = vals.M * 1000; else { inp.Mh = vals.Mh * 1000; inp.Mv = vals.Mv * 1000; }
  let r;
  try { r = combinedCheck(inp); } catch (e) { return chkError(errText(e)); }
  chk = r;
  el.chkBody.hidden = false;

  el.badge.textContent = r.pass ? t('pass') : t('fail');
  el.badge.className = 'badge ' + (r.pass ? 'clearance' : 'interference');
  el.sigma.textContent = fmt(r.sigma, 1);
  el.sigmaNote.textContent = tf('sigmaNote', { a: fmtNum(r.input.allow, 2) });
  el.dreq.textContent = fmt(Math.ceil(r.dReq * 10 - 1e-9) / 10, 1); // 向上取，显示值代回也合格
  el.dreqNote.textContent = r.input.beta > 0 ? tf('dReqHollow', { b: fmtNum(r.input.beta) }) : t('dReqSolid');

  const pct = r.util * 100;
  el.util.textContent = `${fmt(pct, 1)} %`;
  el.barFill.style.width = `${(Math.min(r.util, 1.5) / 1.5) * 100}%`;
  el.bar.classList.toggle('over', r.util > 1);
  el.bar.classList.toggle('warn', r.util > 0.9 && r.util <= 1);
  el.bar.setAttribute('aria-valuenow', fmt(Math.min(pct, 150), 1));
  el.bar.setAttribute('aria-valuetext', `${fmt(pct, 1)} %`);

  el.rM.textContent = `${fmt(r.M / 1000, 2)} N·m`;
  el.aT.textContent = `${fmt(r.aT / 1000, 2)} N·m`;
  el.Mca.textContent = `${fmt(r.Mca / 1000, 2)} N·m`;
  el.W.textContent = `${fmtInt(r.W)} mm³`;
  el.Wnote.textContent = r.Wk > 0
    ? tf('wKey', { w0: fmtInt(r.W0), wk: fmtInt(r.Wk) })
    : tf('wApprox', { v: fmtInt(r.Wapprox) });

  const mPart = total
    ? `M=${fmtNum(vals.M, 2)} N·m`
    : `M=${fmt(r.M / 1000, 2)} N·m (MH=${fmtNum(vals.Mh, 2)}, MV=${fmtNum(vals.Mv, 2)})`;
  const sec = r.input.beta > 0 ? tf('sumHollow', { b: fmtNum(r.input.beta) }) : t('sumSolid');
  const kw = count ? `, ${t('sumKw' + count)} b×t=${fmtNum(vals.b)}×${fmtNum(vals.tk)}` : '';
  el.summary2.textContent =
    `${mPart}, T=${fmtNum(vals.T, 2)} N·m, α=${fmtNum(vals.alpha)}, d=${fmtNum(vals.d, 2)} mm ${sec}${kw} → ` +
    `Mca=${fmt(r.Mca / 1000, 2)} N·m, W=${fmtInt(r.W)} mm³, σca=${fmt(r.sigma, 1)} MPa ` +
    `${r.pass ? '≤' : '>'} [σ-1]=${fmtNum(r.input.allow, 2)} MPa (${fmt(pct, 0)}%) ${r.pass ? 'OK' : 'NOT OK'}, d_req=${fmt(Math.ceil(r.dReq * 10 - 1e-9) / 10, 1)} mm`;
}

function chkError(msg) {
  chk = null;
  el.err2.textContent = msg;
  el.chkBody.hidden = true;
}

/* ---------- 预设同步 ---------- */
function syncAlphaSel() {
  const v = num(el.alpha);
  const p = ALPHA_PRESETS.find((x) => x.alpha === v);
  el.alphaSel.value = p ? p.id : CUSTOM;
}
function syncAllowSel() {
  const v = num(el.allow);
  const cur = ALLOW_PRESETS.find((x) => x.id === el.amat.value);
  if (cur && cur.allow === v) return; // 45 正火与其他预设数值不同，保持当前选择即可
  const p = ALLOW_PRESETS.find((x) => x.allow === v);
  el.amat.value = p ? p.id : CUSTOM;
}

/* ---------- URL hash ---------- */
const HASH_INPUTS = {
  P: 'P', n: 'n', A0: 'A0', mat: 'mat', s1: 'sec1', b1: 'beta1', k1: 'kw1',
  mm: 'mmode', Mh: 'Mh', Mv: 'Mv', M: 'M', T: 'T2', as: 'alphaSel', al: 'alpha', d: 'd2',
  s2: 'sec2', b2: 'beta2', k2: 'kw2', am: 'amat', sa: 'allow',
};

function readHash() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  for (const [key, id] of Object.entries(HASH_INPUTS)) {
    const v = p.get(key);
    if (v === null || v === '') continue;
    const node = el[id];
    if (node.tagName === 'SELECT') {
      if ([...node.options].some((o) => o.value === v)) node.value = v;
    } else {
      node.value = v;
    }
  }
  // 手动键槽尺寸
  const kb = p.get('kb'), kt = p.get('kt');
  if (kb && kt) { keyAuto = false; el.kb.value = kb; el.kt.value = kt; } else keyAuto = true;
}

function writeHash() {
  const q = new URLSearchParams();
  for (const [key, id] of Object.entries(HASH_INPUTS)) q.set(key, el[id].value.trim());
  if (!keyAuto && el.kw2.value !== '0') { q.set('kb', el.kb.value.trim()); q.set('kt', el.kt.value.trim()); }
  try { history.replaceState(null, '', '#' + q.toString()); } catch (e) { /* 忽略 */ }
}

function updateAll(writeUrl = true) {
  syncSecUi();
  updateEst();
  updateChk();
  if (writeUrl) writeHash();
}

/* ---------- 事件 ---------- */
el.mat.addEventListener('change', () => {
  const m = MATERIALS.find((x) => x.id === el.mat.value);
  if (m) el.A0.value = fmtNum(a0Mid(m), 1);
  updateAll();
});
for (const n of [el.P, el.n, el.A0, el.beta1, el.Mh, el.Mv, el.M, el.T2, el.d2, el.beta2]) {
  n.addEventListener('input', () => updateAll());
}
for (const s of [el.sec1, el.kw1, el.sec2, el.kw2, el.mmode]) s.addEventListener('change', () => updateAll());

el.alphaSel.addEventListener('change', () => {
  const p = ALPHA_PRESETS.find((x) => x.id === el.alphaSel.value);
  if (p) el.alpha.value = String(p.alpha);
  updateAll();
});
el.alpha.addEventListener('input', () => { syncAlphaSel(); updateAll(); });

el.amat.addEventListener('change', () => {
  const p = ALLOW_PRESETS.find((x) => x.id === el.amat.value);
  if (p) el.allow.value = String(p.allow);
  updateAll();
});
el.allow.addEventListener('input', () => { syncAllowSel(); updateAll(); });

for (const n of [el.kb, el.kt]) n.addEventListener('input', () => { keyAuto = false; updateAll(); });

// 把估算得到的 T 和建议轴径带到校核部分
el.sendT.addEventListener('click', () => {
  if (!est) return;
  el.T2.value = fmtNum(est.T / 1000, 2);
  el.d2.value = String(est.dStd);
  el.sec2.value = el.sec1.value;
  el.beta2.value = el.beta1.value;
  updateAll();
  $('chk').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
function bindCopy(btn, src, has) {
  let timer = 0;
  btn.addEventListener('click', async () => {
    if (!has()) return;
    if (await copyText(src.textContent)) {
      btn.textContent = t('copied');
      clearTimeout(timer);
      timer = setTimeout(() => { btn.textContent = t('copy'); }, 1500);
    }
  });
}
bindCopy(el.copy1, el.summary1, () => est);
bindCopy(el.copy2, el.summary2, () => chk);

window.addEventListener('hashchange', () => {
  readHash();
  updateAll(false);
});

/* ---------- 启动 ---------- */
lang = detectLang();
renderOptions();
el.mat.value = 'c45';
el.A0.value = fmtNum(a0Mid(MATERIALS.find((m) => m.id === 'c45')), 1);
el.sec1.value = 'solid';
el.kw1.value = '1';
el.mmode.value = 'planes';
el.alphaSel.value = 'pulsating';
el.sec2.value = 'solid';
el.kw2.value = '0';
el.amat.value = '45qt';
readHash();
applyLang();
syncAlphaSel();
syncAllowSel();
updateAll(false);
document.documentElement.classList.remove('i18n-pending');
