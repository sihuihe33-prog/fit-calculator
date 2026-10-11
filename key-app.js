import { detectLang, saveLang, renderNav } from './site.js?v=dc76b3df';
import {
  KeyError, KEY_TABLE, LENGTHS, KEY_TYPES, ALLOW_PRESETS, DEFAULT_GAP,
  selectKey, torqueFromPower, suggestLength, checkKey,
} from './key.js?v=d2497bac';

/* ---------- 文案字典 ---------- */
const I18N = {
  en: {
    docTitle: 'Parallel Key Calculator — GB/T 1096 Key Size & Strength Check',
    docDesc: 'Free parallel key calculator: pick the GB/T 1095/1096 key size b×h and keyway depths from the shaft diameter, suggest a standard key length and check bearing pressure. Drawing callouts included.',
    h1: 'Parallel Key Calculator',
    subtitle: 'Key size and bearing-pressure check per GB/T 1095 / 1096',
    inputsTitle: 'Inputs',
    dLabel: 'Shaft diameter d (mm)',
    sizeLabel: 'Key b × h',
    sizeAuto: 'Auto: {s}',
    sizeAutoNone: 'Auto (from d)',
    sizeRow: '{s}  (d {a}–{b})',
    typeLabel: 'Key type',
    typeA: 'A — round ends',
    typeB: 'B — square ends',
    typeC: 'C — one round end',
    keysLabel: 'Number of keys',
    keys1: '1 key',
    keys2: '2 keys at 180°',
    modeLabel: 'Load given as',
    modeT: 'Torque T',
    modePn: 'Power P + speed n',
    TLabel: 'Torque T (N·m)',
    PLabel: 'Power P (kW)',
    nLabel: 'Speed n (r/min)',
    BLabel: 'Hub length B (mm)',
    LLabel: 'Key length L (mm)',
    LAuto: 'Auto: {L} (≤ B − 8)',
    LAutoNone: 'Auto (≤ B − 8)',
    presetLabel: 'Hub material & load',
    custom: 'Custom',
    hubsteel: 'Steel hub',
    hubiron: 'Cast-iron hub',
    loadstatic: 'static',
    loadlight: 'light impact',
    loadimpact: 'impact',
    allowLabel: '[σ<sub>p</sub>] (MPa)',
    hintRange: 'Textbook range for this case: {a}–{b} MPa (static connection).',
    hintT: 'T = 9550·P/n = {T} N·m.',
    resultsTitle: 'Results',
    pass: 'OK',
    fail: 'Too high',
    keyLabel: 'Key b × h × L',
    sigmaLabel: 'Bearing pressure σ<sub>p</sub>',
    utilLabel: 'Utilization σ<sub>p</sub> / [σ<sub>p</sub>]',
    tLabel: 'Shaft keyway depth t',
    t1Label: 'Hub keyway depth t<sub>1</sub>',
    lLabel: 'Working length l',
    lReqLabel: 'Required l',
    lRule: 'type {ty}: {rule}',
    lReqSub: 'for [σp] = {a} MPa',
    reqTitle: 'Minimum key length for [σ<sub>p</sub>]',
    thType: 'Type',
    thRule: 'Working length',
    thLreq: 'Required L',
    thLstd: 'Standard L',
    beyond: '> 500',
    figTitle: 'Cross-section (to scale)',
    figShaft: 'shaft',
    figHub: 'hub',
    figKey: 'key',
    calloutTitle: 'Drawing callouts',
    cKey: 'Key marking: ',
    cShaft: 'Shaft keyway: ',
    cHub: 'Hub keyway: ',
    cFit: 'Normal connection: shaft N9 / hub JS9 (key width h8)',
    copy: 'Copy',
    copied: 'Copied',
    noteMismatch: 'The selected key {s} is not the table size for d = {d} mm (table: {a}). Keyway depths shown are for {s}.',
    noteLB: 'Key length L = {L} mm is longer than the hub (B = {B} mm).',
    noteLong: 'L > 1.8·d. The textbook recommends L ≤ (1.6–1.8)·d; for higher torque consider two keys at 180° or a spline.',
    noteFail: 'Bearing pressure exceeds [σp]. Options: a longer key (standard L ≥ {L} mm for type {ty}), two keys at 180° (counted as 1.5), a longer hub, or a spline.',
    noteFail2: 'Bearing pressure exceeds [σp] even with two keys. Options: longer keys (standard L ≥ {L} mm for type {ty}), a longer hub, or a spline.',
    noteFailNoL: 'Bearing pressure exceeds [σp] even with the longest standard key. Use two keys at 180° or a spline connection.',
    noteFailNoL2: 'Bearing pressure exceeds [σp] even with two keys of the longest standard length. Use a spline connection.',
    noteRange: 'Suggested L follows the standard length series only. Check GB/T 1096 for the length range permitted for this key section.',
    errD: 'Shaft diameter must be over 6 mm and up to 130 mm.',
    errT: 'Please enter a positive torque.',
    errPn: 'Please enter a positive power and speed.',
    errB: 'Hub length must be positive.',
    errBShort: 'Hub too short: no standard key length fits within B − 8 mm. Choose L manually or increase B.',
    errLShort: 'Key length L is too short for this key type (working length l ≤ 0).',
    errAllow: 'Please enter a positive allowable bearing pressure [σp].',
    errOther: 'Calculation failed for this input.',
    aboutTitle: 'How it is calculated',
    aboutBody: `
      <p><strong>Key size.</strong> The key section <code>b × h</code> and the keyway depths in the shaft (<code>t</code>) and hub (<code>t<sub>1</sub></code>) come from the shaft diameter using GB/T 1095-2003. Each row covers shaft diameters <em>over</em> the lower limit <em>up to and including</em> the upper limit, so d = 22 mm takes 6×6 and d = 22.01 mm takes 8×7. (The 2003 standard itself labels the depths t<sub>1</sub> and t<sub>2</sub>; this page uses the textbook letters t and t<sub>1</sub>.)</p>
      <p><strong>Key length.</strong> The key should be a little shorter than the hub. The page proposes the largest standard length <code>L ≤ B − 8 mm</code> (the usual rule is 5–10 mm shorter than the hub); you can pick any standard length instead. The working (load-bearing) length depends on the key type: A (round ends) <code>l = L − b</code>, B (square ends) <code>l = L</code>, C (one round end) <code>l = L − b/2</code>.</p>
      <p><strong>Strength check (Pu Lianggui, <em>Mechanical Design</em>, ch. 6).</strong> For an ordinary parallel key the governing failure is crushing of the weakest working surface, usually the hub. Assuming the pressure is uniform over a contact height <code>k = 0.5h</code>:</p>
      <p><code>σ<sub>p</sub> = 2T·10³ / (k·l·d) = 4000·T / (d·h·l) ≤ [σ<sub>p</sub>]</code></p>
      <p>with T in N·m and d, h, l in mm, giving MPa. If T is not known, <code>T = 9550·P/n</code> (P in kW, n in r/min). Two keys at 180° do not share the load evenly, so they are counted as 1.5 keys: divide σ<sub>p</sub> by 1.5. The required working length is <code>l = 4000·T / (d·h·[σ<sub>p</sub>]·k<sub>n</sub>)</code>, and the minimum key length follows from the type rule above, rounded up to the standard series.</p>
      <h3>Allowable bearing pressure [σ<sub>p</sub>]</h3>
      <p>Textbook values for static connections, taken by the weaker of the hub, shaft and key materials (usually the hub): steel hub 120–150 MPa (static load), 100–120 (light impact), 60–90 (impact); cast-iron hub 70–80, 50–60, 30–45. Sliding (feather) keys are checked with a much lower pressure [p] and are not covered here.</p>
      <h3>Drawing callouts</h3>
      <p>For a normal connection the shaft keyway width is toleranced N9 and the hub keyway width JS9 (key width h8). On the shaft section the keyway depth is dimensioned as <code>d − t</code>, on the hub as <code>d + t<sub>1</sub></code>. Look up the numerical limit deviations in GB/T 1095.</p>`,
    disclaimer: 'Check against the current GB/T 1095/1096 tables before manufacturing. Allowable pressures are textbook guide values.',
    footerText: 'Open source, runs entirely in your browser.',
    footerLink: 'GitHub',
  },
  zh: {
    docTitle: '平键计算器 — GB/T 1096 平键尺寸选择与强度校核',
    docDesc: '免费的普通平键计算器：按轴径查 GB/T 1095/1096 键宽键高与键槽深度，按毂长推荐标准键长并校核挤压强度，附图纸标注。',
    h1: '平键连接计算器',
    subtitle: '按 GB/T 1095 / 1096 选键并校核挤压强度',
    inputsTitle: '输入',
    dLabel: '轴径 d (mm)',
    sizeLabel: '键宽 × 键高 b × h',
    sizeAuto: '自动：{s}',
    sizeAutoNone: '自动（按 d 查表）',
    sizeRow: '{s}（d {a}–{b}）',
    typeLabel: '键型',
    typeA: 'A 型 — 圆头',
    typeB: 'B 型 — 平头',
    typeC: 'C 型 — 单圆头',
    keysLabel: '键的数量',
    keys1: '1 个键',
    keys2: '2 个键（相隔 180°）',
    modeLabel: '载荷输入方式',
    modeT: '扭矩 T',
    modePn: '功率 P + 转速 n',
    TLabel: '扭矩 T (N·m)',
    PLabel: '功率 P (kW)',
    nLabel: '转速 n (r/min)',
    BLabel: '轮毂长度 B (mm)',
    LLabel: '键长 L (mm)',
    LAuto: '自动：{L}（≤ B − 8）',
    LAutoNone: '自动（≤ B − 8）',
    presetLabel: '轮毂材料与载荷性质',
    custom: '自定义',
    hubsteel: '钢制轮毂',
    hubiron: '铸铁轮毂',
    loadstatic: '静载荷',
    loadlight: '轻微冲击',
    loadimpact: '冲击',
    allowLabel: '许用挤压应力 [σ<sub>p</sub>] (MPa)',
    hintRange: '教材推荐范围：{a}–{b} MPa（静连接）。',
    hintT: 'T = 9550·P/n = {T} N·m。',
    resultsTitle: '计算结果',
    pass: '满足',
    fail: '强度不足',
    keyLabel: '键 b × h × L',
    sigmaLabel: '挤压应力 σ<sub>p</sub>',
    utilLabel: '利用率 σ<sub>p</sub> / [σ<sub>p</sub>]',
    tLabel: '轴槽深 t',
    t1Label: '毂槽深 t<sub>1</sub>',
    lLabel: '工作长度 l',
    lReqLabel: '所需工作长度 l',
    lRule: '{ty} 型：{rule}',
    lReqSub: '按 [σp] = {a} MPa',
    reqTitle: '满足 [σ<sub>p</sub>] 所需的最小键长',
    thType: '键型',
    thRule: '工作长度',
    thLreq: '所需 L',
    thLstd: '标准 L',
    beyond: '> 500',
    figTitle: '截面示意（按比例）',
    figShaft: '轴',
    figHub: '轮毂',
    figKey: '键',
    calloutTitle: '图纸标注',
    cKey: '键的标记：',
    cShaft: '轴槽：',
    cHub: '毂槽：',
    cFit: '正常连接：轴槽 N9 / 毂槽 JS9（键宽 h8）',
    copy: '复制',
    copied: '已复制',
    noteMismatch: '所选键 {s} 不是 d = {d} mm 对应的标准尺寸（查表应为 {a}）。键槽深度按 {s} 给出。',
    noteLB: '键长 L = {L} mm 超过了轮毂长度 B = {B} mm。',
    noteLong: 'L > 1.8d。教材建议键长不超过 (1.6~1.8)d；扭矩较大时可考虑相隔 180° 布置两个键或改用花键。',
    noteFail: '挤压应力超过许用值。可以：加长键（{ty} 型标准键长 ≥ {L} mm）、相隔 180° 布置两个键（按 1.5 个计）、加长轮毂，或改用花键。',
    noteFail2: '双键仍不满足。可以：加长键（{ty} 型标准键长 ≥ {L} mm）、加长轮毂，或改用花键。',
    noteFailNoL: '即使取最长标准键长仍不满足，请采用双键（相隔 180°）或花键连接。',
    noteFailNoL2: '双键取最长标准键长仍不满足，请改用花键连接。',
    noteRange: '推荐键长只按标准长度系列给出，该键宽允许的长度范围请查 GB/T 1096。',
    errD: '轴径须大于 6 mm 且不超过 130 mm。',
    errT: '请输入正的扭矩。',
    errPn: '请输入正的功率和转速。',
    errB: '轮毂长度须为正数。',
    errBShort: '轮毂太短：B − 8 mm 以内没有标准键长。请手动选择 L 或加长轮毂。',
    errLShort: '对该键型来说键长 L 太短（工作长度 l ≤ 0）。',
    errAllow: '请输入正的许用挤压应力 [σp]。',
    errOther: '该输入无法计算。',
    aboutTitle: '计算方法',
    aboutBody: `
      <p><strong>键的尺寸。</strong>键的截面 <code>b × h</code> 以及轴槽深 <code>t</code>、毂槽深 <code>t<sub>1</sub></code> 按轴径从 GB/T 1095-2003 查得。每一行适用的轴径为「<strong>大于</strong>下限、<strong>至</strong>上限（含）」，所以 d = 22 mm 取 6×6，d = 22.01 mm 取 8×7。（2003 版标准原文把两个槽深记作 t<sub>1</sub> 和 t<sub>2</sub>，本页沿用教材的 t 和 t<sub>1</sub>。）</p>
      <p><strong>键长。</strong>键长应比轮毂略短，一般短 5~10 mm。本页默认取不超过 <code>B − 8 mm</code> 的最大标准长度，也可以手动选其他标准长度。工作长度（承载长度）与键型有关：A 型（圆头）<code>l = L − b</code>，B 型（平头）<code>l = L</code>，C 型（单圆头）<code>l = L − b/2</code>。</p>
      <p><strong>强度校核（濮良贵《机械设计》第 6 章）。</strong>普通平键连接的主要失效形式是工作面被压溃，通常是轮毂最弱。假设压力沿接触高度 <code>k = 0.5h</code> 均匀分布：</p>
      <p><code>σ<sub>p</sub> = 2T·10³ / (k·l·d) = 4000·T / (d·h·l) ≤ [σ<sub>p</sub>]</code></p>
      <p>T 的单位为 N·m，d、h、l 为 mm，结果为 MPa。已知功率时 <code>T = 9550·P/n</code>（P 单位 kW，n 单位 r/min）。相隔 180° 的两个键载荷分配不均，按 1.5 个键计算，即 σ<sub>p</sub> 除以 1.5。所需工作长度 <code>l = 4000·T / (d·h·[σ<sub>p</sub>]·k<sub>n</sub>)</code>，再按键型换算成键长并向上圆整到标准系列。</p>
      <h3>许用挤压应力 [σ<sub>p</sub>]</h3>
      <p>教材给出的静连接取值，按轮毂、轴、键中最弱的材料选取（通常是轮毂）：钢制轮毂 120~150 MPa（静载荷）、100~120（轻微冲击）、60~90（冲击）；铸铁轮毂 70~80、50~60、30~45。导向平键、滑键等动连接按许用压力 [p] 校核，数值小得多，本页不涉及。</p>
      <h3>图纸标注</h3>
      <p>正常连接时轴槽宽度公差带取 N9，毂槽宽度取 JS9（键宽 h8）。轴的断面图上槽深标注 <code>d − t</code>，轮毂上标注 <code>d + t<sub>1</sub></code>。具体极限偏差数值请查 GB/T 1095。</p>`,
    disclaimer: '用于制造前请对照现行 GB/T 1095/1096 标准表格核实。许用应力为教材参考值。',
    footerText: '开源项目，完全在浏览器中运行。',
    footerLink: 'GitHub',
  },
};

/* ---------- 状态与 DOM ---------- */
const $ = (id) => document.getElementById(id);
const el = {
  d: $('d'), size: $('size'), type: $('type'), keys: $('keys'),
  mode: $('mode'), T: $('T'), P: $('P'), n: $('n'),
  fT: $('f-T'), fP: $('f-P'), fn: $('f-n'),
  B: $('B'), L: $('L'), preset: $('preset'), allow: $('allow'),
  hint: $('hint'), err: $('err'), body: $('results-body'), badge: $('badge'),
  key: $('r-key'), sigma: $('r-sigma'), util: $('r-util'), utilBar: $('util-bar'), utilFill: $('util-fill'),
  t: $('r-t'), t1: $('r-t1'), l: $('r-l'), l2: $('r-l2'), lreq: $('r-lreq'), lreq2: $('r-lreq2'),
  notes: $('notes'), reqBody: $('req-body'), svg: $('svg'),
  summary: $('summary'), copy: $('copy'),
};

const AUTO = 'auto';
const CUSTOM = 'custom';
const RULES = { A: 'L − b', B: 'L', C: 'L − b/2' };
let lang = 'en';
let last = null;
let copyTimer = 0;

const t = (k) => I18N[lang][k];
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));

/* ---------- 格式化 ---------- */
// 去掉多余的 0：44.50 → 44.5，70.00 → 70
const num = (v, d = 2) => String(Math.round(v * 10 ** d) / 10 ** d);
const fix = (v, d) => Number(v).toFixed(d);
const sizeStr = (r) => `${r.b}×${r.h}`;
const sizeVal = (r) => `${r.b}x${r.h}`;

/* ---------- 选择框 ---------- */
function opt(value, text) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = text;
  return o;
}

function fillSelect(sel, items) {
  const cur = sel.value;
  sel.innerHTML = '';
  for (const [v, txt] of items) sel.appendChild(opt(v, txt));
  if (items.some(([v]) => v === cur)) sel.value = cur;
}

function autoRow() {
  try { return selectKey(parseFloat(el.d.value)); } catch (e) { return null; }
}

function autoLength() {
  const B = parseFloat(el.B.value);
  try { return suggestLength(B, DEFAULT_GAP); } catch (e) { return null; }
}

function renderSizeOptions() {
  const a = autoRow();
  fillSelect(el.size, [
    [AUTO, a ? fill(t('sizeAuto'), { s: sizeStr(a) }) : t('sizeAutoNone')],
    ...KEY_TABLE.map((r) => [sizeVal(r), fill(t('sizeRow'), { s: sizeStr(r), a: r.dMin, b: r.dMax })]),
  ]);
}

function renderLengthOptions() {
  const a = autoLength();
  fillSelect(el.L, [
    [AUTO, a ? fill(t('LAuto'), { L: a }) : t('LAutoNone')],
    ...LENGTHS.map((L) => [String(L), String(L)]),
  ]);
}

function renderStaticOptions() {
  fillSelect(el.type, KEY_TYPES.map((ty) => [ty, t('type' + ty)]));
  fillSelect(el.keys, [['1', t('keys1')], ['2', t('keys2')]]);
  fillSelect(el.mode, [['T', t('modeT')], ['Pn', t('modePn')]]);
  fillSelect(el.preset, [
    ...ALLOW_PRESETS.map((p) => [p.id, `${t('hub' + p.hub)}, ${t('load' + p.load)} (${p.min}–${p.max})`]),
    [CUSTOM, t('custom')],
  ]);
}

const presetMid = (p) => (p.min + p.max) / 2;

// 许用应力数值落在当前预设范围内时保留预设，否则改为自定义
function syncPresetFromAllow() {
  const v = parseFloat(el.allow.value);
  const cur = ALLOW_PRESETS.find((p) => p.id === el.preset.value);
  if (cur && v >= cur.min && v <= cur.max) return;
  const p = ALLOW_PRESETS.find((x) => presetMid(x) === v);
  el.preset.value = p ? p.id : CUSTOM;
}

function showMode() {
  const pn = el.mode.value === 'Pn';
  el.fT.hidden = pn;
  el.fP.hidden = !pn;
  el.fn.hidden = !pn;
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
  renderStaticOptions();
  renderSizeOptions();
  renderLengthOptions();
}

function setLang(l) {
  lang = l;
  saveLang(l);
  applyLang();
  update(false);
}

/* ---------- 计算 ---------- */
function showError(msg) {
  last = null;
  el.err.textContent = msg;
  el.body.hidden = true;
  el.badge.textContent = '';
  el.badge.className = 'badge';
}

function errMessage(e) {
  if (!(e instanceof KeyError)) return t('errOther');
  return {
    D_RANGE: t('errD'), T: t('errT'), PN: t('errPn'), B: t('errB'),
    L_SHORT: t('errLShort'), ALLOW: t('errAllow'),
  }[e.code] || t('errOther');
}

function update(writeUrl = true) {
  el.err.textContent = '';
  showMode();
  renderSizeOptions();
  renderLengthOptions();
  if (writeUrl) writeHash();

  const hints = [];
  const preset = ALLOW_PRESETS.find((p) => p.id === el.preset.value);
  if (preset) hints.push(fill(t('hintRange'), { a: preset.min, b: preset.max }));

  try {
    const d = parseFloat(el.d.value);
    selectKey(d);

    let T;
    if (el.mode.value === 'Pn') {
      T = torqueFromPower(parseFloat(el.P.value), parseFloat(el.n.value));
      hints.unshift(fill(t('hintT'), { T: fix(T, 1) }));
    } else {
      T = parseFloat(el.T.value);
      if (!(T > 0)) throw new KeyError('T', '');
    }

    const B = parseFloat(el.B.value);
    if (!(B > 0)) throw new KeyError('B', '');
    let L;
    if (el.L.value === AUTO) {
      L = suggestLength(B, DEFAULT_GAP);
      if (L === null) { el.hint.textContent = hints.join(lang === 'zh' ? '' : ' '); showError(t('errBShort')); return; }
    } else {
      L = parseFloat(el.L.value);
    }

    const input = { d, T, L, type: el.type.value, keys: Number(el.keys.value), allow: parseFloat(el.allow.value) };
    if (el.size.value !== AUTO) {
      const [b, h] = el.size.value.split('x').map(Number);
      input.b = b;
      input.h = h;
    }
    el.hint.textContent = hints.join(lang === 'zh' ? '' : ' ');
    const r = checkKey(input);
    r.B = B;
    last = r;
    el.body.hidden = false;
    render(r);
  } catch (e) {
    el.hint.textContent = hints.join(lang === 'zh' ? '' : ' ');
    showError(errMessage(e));
  }
}

/* ---------- 渲染 ---------- */
function render(r) {
  const i = r.input;
  const row = r.row;
  el.badge.textContent = r.ok ? t('pass') : t('fail');
  el.badge.className = 'badge ' + (r.ok ? 'clearance' : 'interference');

  el.key.textContent = `${row.b}×${row.h}×${i.L}`;
  el.sigma.textContent = fix(r.sigma, 1);
  const pct = r.util * 100;
  el.util.textContent = `${fix(pct, 0)} %`;
  el.utilFill.style.width = `${Math.min(pct, 100)}%`;
  el.utilBar.className = 'util-bar' + (pct > 100 ? ' over' : pct > 90 ? ' warn' : '');
  el.utilBar.setAttribute('aria-label', `${fix(pct, 0)} %`);

  el.t.textContent = `${fix(row.t, 1)} mm`;
  el.t1.textContent = `${fix(row.t1, 1)} mm`;
  el.l.textContent = `${num(r.l, 1)} mm`;
  el.l2.textContent = fill(t('lRule'), { ty: i.type, rule: RULES[i.type] });
  el.lreq.textContent = `${fix(r.lReq, 1)} mm`;
  el.lreq2.textContent = fill(t('lReqSub'), { a: num(i.allow, 1) });

  // 提示
  const notes = [];
  if (!r.ok) {
    const Ls = r.LStd[i.type];
    const two = i.keys === 2 ? '2' : '';
    notes.push(['bad', Ls ? fill(t('noteFail' + two), { L: Ls, ty: i.type }) : t('noteFailNoL' + two)]);
  }
  if (r.mismatch) notes.push(['', fill(t('noteMismatch'), { s: sizeStr(row), d: num(i.d, 2), a: sizeStr(r.autoRow) })]);
  if (i.L > r.B) notes.push(['bad', fill(t('noteLB'), { L: i.L, B: num(r.B, 1) })]);
  if (r.longKey) notes.push(['', t('noteLong')]);
  notes.push(['info', t('noteRange')]);
  el.notes.innerHTML = '';
  for (const [cls, txt] of notes) {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = txt;
    el.notes.appendChild(p);
  }

  // 各键型所需键长
  el.reqBody.innerHTML = KEY_TYPES.map((ty) => {
    const cur = ty === i.type ? ' class="cur"' : '';
    const std = r.LStd[ty] ?? t('beyond');
    return `<tr><td${cur}>${ty}</td><td>l = ${RULES[ty]}</td><td>${fix(r.LReq[ty], 1)}</td><td${cur}>${std}</td></tr>`;
  }).join('');

  el.svg.innerHTML = drawSection(i.d, row);
  renderCallouts(r);
}

function renderCallouts(r) {
  const row = r.row;
  const d = num(r.input.d, 2);
  el.summary.textContent = [
    `${t('cKey')}${r.marking}`,
    `${t('cShaft')}${row.b} N9, d − t = ${num(r.shaftDepth, 2)} (d ${d}, t ${fix(row.t, 1)})`,
    `${t('cHub')}${row.b} JS9, d + t1 = ${num(r.hubDepth, 2)} (d ${d}, t1 ${fix(row.t1, 1)})`,
    t('cFit'),
  ].join('\n');
}

// 截面示意：轴（带键槽）、轮毂（带毂槽）、键，按实际比例绘制
function drawSection(d, row) {
  const W = 320, H = 325, cx = 150, cy = 170;
  const r = d / 2;
  const s = 88 / r; // 轴半径固定画成 88 px
  const R = r * 1.45; // 轮毂外径（示意）
  const { b, h } = row;
  const tt = row.t, t1 = row.t1;
  const X = (x) => fix(cx + x * s, 2);
  const Y = (y) => fix(cy - y * s, 2);
  const yc = Math.sqrt(r * r - (b / 2) ** 2); // 键槽侧边与轴外圆交点高度
  const yBot = r - tt; // 轴槽底
  const yTop = r + t1; // 毂槽顶
  const rp = fix(r * s, 2), Rp = fix(R * s, 2);

  const shaft = `M${X(b / 2)} ${Y(yBot)} L${X(b / 2)} ${Y(yc)} A${rp} ${rp} 0 1 1 ${X(-b / 2)} ${Y(yc)} L${X(-b / 2)} ${Y(yBot)} Z`;
  const hub = `M${X(R)} ${Y(0)} A${Rp} ${Rp} 0 1 0 ${X(-R)} ${Y(0)} A${Rp} ${Rp} 0 1 0 ${X(R)} ${Y(0)} Z ` +
    `M${X(b / 2)} ${Y(yc)} L${X(b / 2)} ${Y(yTop)} L${X(-b / 2)} ${Y(yTop)} L${X(-b / 2)} ${Y(yc)} A${rp} ${rp} 0 1 0 ${X(b / 2)} ${Y(yc)} Z`;
  const key = `M${X(-b / 2)} ${Y(yBot)} H${X(b / 2)} V${Y(yBot + h)} H${X(-b / 2)} Z`;

  // 尺寸线：b 在上方，t 在左侧，t1 在右侧
  const xL = -b / 2 - 10 / s - 14 / s; // 左侧尺寸线位置（mm）
  const xR = b / 2 + 24 / s;
  const yB = R + 14 / s;
  const arrow = (x1, y1, x2, y2) => `<line class="dim" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-start="url(#ka)" marker-end="url(#ka)"/>`;
  const ext = (x1, y1, x2, y2) => `<line class="ext" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;

  const parts = [
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('figTitle')}: d ${num(d, 2)}, b ${b}, t ${tt}, t1 ${t1}">`,
    '<defs><marker id="ka" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0 2 L5 5 L0 8" fill="none" stroke="currentColor" stroke-width="1.4"/></marker></defs>',
    `<path class="hub" d="${hub}"/>`,
    `<path class="shaft" d="${shaft}"/>`,
    `<path class="key" d="${key}"/>`,
    `<line class="cl" x1="${X(-R - 4 / s * 2)}" y1="${Y(0)}" x2="${X(R + 8 / s)}" y2="${Y(0)}"/>`,
    `<line class="cl" x1="${X(0)}" y1="${Y(-R - 8 / s)}" x2="${X(0)}" y2="${Y(R + 26 / s)}"/>`,
    // b
    ext(X(-b / 2), Y(yTop), X(-b / 2), Y(yB + 4 / s)),
    ext(X(b / 2), Y(yTop), X(b / 2), Y(yB + 4 / s)),
    arrow(X(-b / 2), Y(yB), X(b / 2), Y(yB)),
    `<text class="halo" x="${X(b / 2 + 6 / s)}" y="${fix(cy - yB * s + 4, 2)}">b = ${b}</text>`,
    // t：从轴外圆最高点到轴槽底
    ext(X(-b / 2), Y(yBot), X(xL - 4 / s), Y(yBot)),
    ext(X(0), Y(r), X(xL - 4 / s), Y(r)),
    arrow(X(xL), Y(r), X(xL), Y(yBot)),
    `<text class="halo" x="${X(xL) - 6}" y="${fix(cy - (r + yBot) / 2 * s + 4, 2)}" text-anchor="end">t = ${fix(tt, 1)}</text>`,
    // t1：从轴外圆最高点到毂槽顶
    ext(X(b / 2), Y(yTop), X(xR + 4 / s), Y(yTop)),
    ext(X(0), Y(r), X(xR + 4 / s), Y(r)),
    arrow(X(xR), Y(r), X(xR), Y(yTop)),
    `<text class="halo" x="${X(xR) + 6}" y="${fix(cy - (r + yTop) / 2 * s + 4, 2)}">t1 = ${fix(t1, 1)}</text>`,
    // 图例
    `<text class="legend-t halo" x="${cx}" y="${fix(cy + R * s + 18, 2)}" text-anchor="middle">${t('figShaft')} d = ${num(d, 2)} · ${t('figHub')} · ${t('figKey')} ${b}×${h}</text>`,
    '</svg>',
  ];
  return parts.join('');
}

/* ---------- URL hash ---------- */
const FIELDS = ['d', 'size', 'type', 'keys', 'mode', 'T', 'P', 'n', 'B', 'L', 'preset', 'allow'];

function readHash() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  for (const f of ['d', 'T', 'P', 'n', 'B', 'allow']) {
    const v = p.get(f);
    if (v !== null && v !== '') el[f].value = v;
  }
  const setSel = (sel, v, ok) => { if (v !== null && ok(v)) sel.value = v; };
  setSel(el.type, p.get('type'), (v) => KEY_TYPES.includes(v));
  setSel(el.keys, p.get('keys'), (v) => v === '1' || v === '2');
  setSel(el.mode, p.get('mode'), (v) => v === 'T' || v === 'Pn');
  setSel(el.preset, p.get('preset'), (v) => v === CUSTOM || ALLOW_PRESETS.some((x) => x.id === v));
  setSel(el.size, p.get('size'), (v) => v === AUTO || KEY_TABLE.some((r) => sizeVal(r) === v));
  setSel(el.L, p.get('L'), (v) => v === AUTO || LENGTHS.includes(Number(v)));
}

function writeHash() {
  const q = new URLSearchParams();
  for (const f of FIELDS) q.set(f, String(el[f].value).trim());
  try { history.replaceState(null, '', '#' + q.toString()); } catch (e) { /* 忽略 */ }
}

/* ---------- 事件 ---------- */
for (const s of [el.size, el.type, el.keys, el.L]) s.addEventListener('change', () => update());
el.mode.addEventListener('change', () => update());
for (const n of [el.d, el.T, el.P, el.n, el.B]) n.addEventListener('input', () => update());
el.preset.addEventListener('change', () => {
  const p = ALLOW_PRESETS.find((x) => x.id === el.preset.value);
  if (p) el.allow.value = String(presetMid(p));
  update();
});
el.allow.addEventListener('input', () => {
  syncPresetFromAllow();
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
  renderSizeOptions();
  renderLengthOptions();
  readHash();
  update(false);
});

/* ---------- 启动 ---------- */
lang = detectLang();
applyLang();
el.preset.value = 'steel-light';
el.allow.value = String(presetMid(ALLOW_PRESETS.find((p) => p.id === 'steel-light')));
el.size.value = AUTO;
el.L.value = AUTO;
readHash();
update(false);
document.documentElement.classList.remove('i18n-pending');
