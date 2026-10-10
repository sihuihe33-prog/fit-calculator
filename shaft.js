// 轴的强度计算引擎（按濮良贵《机械设计》教材方法的简化计算）
// 1) 按扭转强度估算最小轴径 d ≥ A0·∛(P/n)
// 2) 按弯扭合成（第三强度理论）校核 σca = √(M² + (αT)²) / W ≤ [σ−1]
// 单位约定（引擎内部）：长度 mm，力矩/扭矩 N·mm，应力 MPa，功率 kW，转速 r/min。
// 界面用 N·m 输入时，请先 ×1000 换成 N·mm 再传进来。

export class ShaftError extends Error {
  constructor(message, code = 'INPUT') {
    super(message);
    this.name = 'ShaftError';
    this.code = code;
  }
}

// 教材表：轴常用材料的许用扭转切应力 [τT] 与系数 A0（A0 范围按"大 → 小"写，与 [τT] 小 → 大对应）
export const MATERIALS = [
  { id: 'q235', name: 'Q235-A, 20', nameZh: 'Q235-A、20', tau: [15, 25], A0: [149, 126] },
  { id: 'q275', name: 'Q275, 35', nameZh: 'Q275、35', tau: [20, 35], A0: [135, 112] },
  { id: 'c45', name: '45', nameZh: '45', tau: [25, 45], A0: [126, 103] },
  { id: 'cr40', name: '40Cr, 35SiMn, 38SiMnMo, 3Cr13', nameZh: '40Cr、35SiMn、38SiMnMo、3Cr13', tau: [35, 55], A0: [112, 97] },
];

// 弯扭合成校核用的许用弯曲应力 [σ−1]（MPa）——教材表中的典型值，仅供参考，请以所用教材/手册为准
export const ALLOW_PRESETS = [
  { id: 'q235', allow: 40, name: 'Q235-A (hot-rolled)', nameZh: 'Q235-A（热轧）' },
  { id: '45n', allow: 55, name: '45 normalized', nameZh: '45 正火' },
  { id: '45qt', allow: 60, name: '45 quenched & tempered', nameZh: '45 调质' },
  { id: '40cr', allow: 70, name: '40Cr quenched & tempered', nameZh: '40Cr 调质' },
];

// 扭转切应力的折合系数 α
export const ALPHA_PRESETS = [
  { id: 'static', alpha: 0.3 },
  { id: 'pulsating', alpha: 0.6 },
  { id: 'reversed', alpha: 1 },
];

// GB/T 1095 普通平键键槽尺寸（按轴径选取）：d 在 (lo, hi] 内时取 b×h，轴槽深 t（教材记作 t 或 t1）
export const KEY_TABLE = [
  { lo: 6, hi: 8, b: 2, h: 2, t: 1.2 },
  { lo: 8, hi: 10, b: 3, h: 3, t: 1.8 },
  { lo: 10, hi: 12, b: 4, h: 4, t: 2.5 },
  { lo: 12, hi: 17, b: 5, h: 5, t: 3.0 },
  { lo: 17, hi: 22, b: 6, h: 6, t: 3.5 },
  { lo: 22, hi: 30, b: 8, h: 7, t: 4.0 },
  { lo: 30, hi: 38, b: 10, h: 8, t: 5.0 },
  { lo: 38, hi: 44, b: 12, h: 8, t: 5.0 },
  { lo: 44, hi: 50, b: 14, h: 9, t: 5.5 },
  { lo: 50, hi: 58, b: 16, h: 10, t: 6.0 },
  { lo: 58, hi: 65, b: 18, h: 11, t: 7.0 },
  { lo: 65, hi: 75, b: 20, h: 12, t: 7.5 },
  { lo: 75, hi: 85, b: 22, h: 14, t: 9.0 },
  { lo: 85, hi: 95, b: 25, h: 14, t: 9.0 },
  { lo: 95, hi: 110, b: 28, h: 16, t: 10.0 },
  { lo: 110, hi: 130, b: 32, h: 18, t: 11.0 },
  { lo: 130, hi: 150, b: 36, h: 20, t: 12.0 },
  { lo: 150, hi: 170, b: 40, h: 22, t: 13.0 },
  { lo: 170, hi: 200, b: 45, h: 25, t: 15.0 },
  { lo: 200, hi: 230, b: 50, h: 28, t: 17.0 },
];

// 按轴径查平键键槽尺寸；超出表格范围返回 null
export function keyForDiameter(d) {
  if (!(typeof d === 'number' && d > 0)) return null;
  const row = KEY_TABLE.find((r) => d > r.lo && d <= r.hi);
  return row ? { b: row.b, h: row.h, t: row.t } : null;
}

const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

function need(cond, message, code = 'INPUT') {
  if (!cond) throw new ShaftError(message, code);
}

function checkBeta(beta) {
  need(isNum(beta) && beta >= 0 && beta <= 0.9, 'β = d_inner/d_outer must be between 0 and 0.9.', 'BETA');
}

// 扭矩 T = 9.55×10⁶·P/n（N·mm）
export function torqueFromPower(P, n) {
  need(isNum(P) && P > 0, 'Power P must be a positive number (kW).', 'POWER');
  need(isNum(n) && n > 0, 'Speed n must be a positive number (r/min).', 'SPEED');
  return (9.55e6 * P) / n;
}

// 键槽加大百分比：d > 100 mm 时单键 3%、双键 7%；d ≤ 100 mm 时单键 5–7%、双键 10–15%（默认取上限）
export function keywayAllowance(d, keyways) {
  need(keyways === 0 || keyways === 1 || keyways === 2, 'Number of keyways must be 0, 1 or 2.', 'KEYWAYS');
  if (keyways === 0) return { pct: 0, range: [0, 0] };
  if (d > 100) return keyways === 1 ? { pct: 3, range: [3, 3] } : { pct: 7, range: [7, 7] };
  return keyways === 1 ? { pct: 7, range: [5, 7] } : { pct: 15, range: [10, 15] };
}

// 建议圆整规则：d ≤ 50 mm 向上取整到整毫米；d > 50 mm 向上取到 5 的倍数
export function roundUpDiameter(d) {
  need(isNum(d) && d > 0, 'Diameter must be positive.');
  const eps = 1e-9; // 避免 24.000000001 这类浮点误差被多进一位
  const whole = Math.ceil(d - eps);
  if (whole <= 50) return whole;
  return Math.ceil(d / 5 - eps) * 5;
}

// 按扭转强度估算最小轴径
// 输入：P (kW)，n (r/min)，A0，beta（空心轴内外径比，实心为 0），keyways（0/1/2），可选 keyPct 覆盖默认加大百分比
export function minDiameter({ P, n, A0, beta = 0, keyways = 0, keyPct } = {}) {
  const T = torqueFromPower(P, n);
  need(isNum(A0) && A0 > 0 && A0 <= 300, 'A0 must be a positive number (typically 97–149).', 'A0');
  checkBeta(beta);
  const dSolid = A0 * Math.cbrt(P / n);
  const hollowFactor = 1 / Math.cbrt(1 - beta ** 4);
  const dRaw = dSolid * hollowFactor;
  const allowance = keywayAllowance(dRaw, keyways);
  let pct = allowance.pct;
  if (keyPct !== undefined && keyPct !== null && keyways > 0) {
    need(isNum(keyPct) && keyPct >= 0 && keyPct <= 30, 'Keyway allowance must be between 0 and 30 %.', 'KEYPCT');
    pct = keyPct;
  }
  const dKey = dRaw * (1 + pct / 100);
  const dStd = roundUpDiameter(dKey);
  // 由 A0 反推的许用切应力：A0 = ∛(9.55×10⁶ / (0.2·[τT]))
  const tauFromA0 = 9.55e6 / (0.2 * A0 ** 3);
  return {
    input: { P, n, A0, beta, keyways },
    T,
    dSolid,
    hollowFactor,
    dRaw,
    keyPct: pct,
    keyRange: allowance.range,
    dKey,
    dStd,
    dInnerStd: beta > 0 ? dStd * beta : 0,
    tauFromA0,
  };
}

// 截面抗弯截面系数 W（mm³）
// 实心 πd³/32；空心 πd³/32·(1−β⁴)；单键槽减去 b·t·(d−t)²/(2d)，双键槽减去 b·t·(d−t)²/d
export function sectionModulus({ d, beta = 0, keyway = null }) {
  need(isNum(d) && d > 0, 'Section diameter d must be positive (mm).', 'DIAMETER');
  checkBeta(beta);
  const W0 = ((Math.PI * d ** 3) / 32) * (1 - beta ** 4);
  let Wk = 0;
  const count = keyway ? keyway.count ?? 1 : 0;
  if (count) {
    need(count === 1 || count === 2, 'Keyway count must be 1 or 2.', 'KEYWAYS');
    const { b, t } = keyway;
    need(isNum(b) && b > 0 && b < d, 'Key width b must be positive and smaller than d.', 'KEY');
    need(isNum(t) && t > 0 && t < d / 2, 'Keyway depth t must be positive and smaller than d/2.', 'KEY');
    if (beta > 0) need(t < (d - beta * d) / 2, 'Keyway depth t exceeds the wall thickness.', 'KEY');
    Wk = (count === 1 ? 1 : 2) * (b * t * (d - t) ** 2) / (2 * d);
  }
  const W = W0 - Wk;
  need(W > 0, 'Section modulus is not positive — check the keyway size.', 'KEY');
  return { W, W0, Wk, Wapprox: 0.1 * d ** 3 * (1 - beta ** 4) };
}

// 按弯扭合成强度校核
// Mh、Mv：水平面、垂直面弯矩（N·mm），或直接给合成弯矩 M（N·mm，给了 M 就忽略 Mh/Mv）
// T：扭矩（N·mm）；alpha：折合系数；d：截面直径（mm）；beta：空心比；keyway：{count, b, t} 或 null；allow：[σ−1]（MPa）
export function combinedCheck({ Mh, Mv, M, T, alpha, d, beta = 0, keyway = null, allow } = {}) {
  let Mt;
  if (M !== undefined && M !== null) {
    need(isNum(M) && M >= 0, 'Bending moment M must be a non-negative number.', 'MOMENT');
    Mt = M;
  } else {
    const h = Mh ?? 0, v = Mv ?? 0;
    need(isNum(h) && isNum(v), 'Bending moments Mh and Mv must be numbers.', 'MOMENT');
    Mt = Math.hypot(h, v);
  }
  need(isNum(T) && T >= 0, 'Torque T must be a non-negative number.', 'TORQUE');
  need(isNum(alpha) && alpha > 0 && alpha <= 1, 'Correction factor α must be between 0 and 1.', 'ALPHA');
  need(isNum(allow) && allow > 0 && allow <= 1000, 'Allowable stress [σ−1] must be a positive number (MPa).', 'ALLOW');
  const sec = sectionModulus({ d, beta, keyway });
  const aT = alpha * T;
  const Mca = Math.hypot(Mt, aT);
  const sigma = Mca / sec.W;
  const util = sigma / allow;
  // 满足强度所需的最小（实心/空心）直径：d ≥ ∛(Mca / (0.1·[σ−1]·(1−β⁴)))，未计键槽
  const dReq = Math.cbrt(Mca / (0.1 * allow * (1 - beta ** 4)));
  return {
    input: { Mh, Mv, M, T, alpha, d, beta, keyway, allow },
    M: Mt,
    aT,
    Mca,
    W: sec.W,
    W0: sec.W0,
    Wk: sec.Wk,
    Wapprox: sec.Wapprox,
    sigma,
    util,
    pass: sigma <= allow,
    dReq,
  };
}
