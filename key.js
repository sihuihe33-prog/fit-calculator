// 普通平键连接：选型与挤压强度校核（纯计算，无 DOM）
// 数据：GB/T 1095-2003（键槽尺寸）、GB/T 1096-2003（普通型平键）
// 方法：濮良贵《机械设计》第 6 章，σp = 2T·10³/(k·l·d)，k = 0.5h
// 单位：长度 mm，扭矩 N·m，功率 kW，转速 r/min，应力 MPa

export class KeyError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'KeyError';
    this.code = code;
  }
}

// 轴径范围「大于 dMin 至 dMax（含）」→ 键宽 b × 键高 h，轴槽深 t，毂槽深 t1
// 注：GB/T 1095-2003 原文把轴槽深记作 t1、毂槽深记作 t2；这里沿用教材的 t / t1 记法
export const KEY_TABLE = [
  { dMin: 6, dMax: 8, b: 2, h: 2, t: 1.2, t1: 1.0 },
  { dMin: 8, dMax: 10, b: 3, h: 3, t: 1.8, t1: 1.4 },
  { dMin: 10, dMax: 12, b: 4, h: 4, t: 2.5, t1: 1.8 },
  { dMin: 12, dMax: 17, b: 5, h: 5, t: 3.0, t1: 2.3 },
  { dMin: 17, dMax: 22, b: 6, h: 6, t: 3.5, t1: 2.8 },
  { dMin: 22, dMax: 30, b: 8, h: 7, t: 4.0, t1: 3.3 },
  { dMin: 30, dMax: 38, b: 10, h: 8, t: 5.0, t1: 3.3 },
  { dMin: 38, dMax: 44, b: 12, h: 8, t: 5.0, t1: 3.3 },
  { dMin: 44, dMax: 50, b: 14, h: 9, t: 5.5, t1: 3.8 },
  { dMin: 50, dMax: 58, b: 16, h: 10, t: 6.0, t1: 4.3 },
  { dMin: 58, dMax: 65, b: 18, h: 11, t: 7.0, t1: 4.4 },
  { dMin: 65, dMax: 75, b: 20, h: 12, t: 7.5, t1: 4.9 },
  { dMin: 75, dMax: 85, b: 22, h: 14, t: 9.0, t1: 5.4 },
  { dMin: 85, dMax: 95, b: 25, h: 14, t: 9.0, t1: 5.4 },
  { dMin: 95, dMax: 110, b: 28, h: 16, t: 10.0, t1: 6.4 },
  { dMin: 110, dMax: 130, b: 32, h: 18, t: 11.0, t1: 7.4 },
];

export const D_MIN = 6;
export const D_MAX = 130;

// 键长标准系列 L（mm）；各键宽对应的长度范围请查 GB/T 1096，本工具不强制
export const LENGTHS = [
  6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80,
  90, 100, 110, 125, 140, 160, 180, 200, 220, 250, 280, 320, 360, 400, 450, 500,
];

export const KEY_TYPES = ['A', 'B', 'C'];

// 许用挤压应力 [σp]（MPa），静连接，教材表 6-2 的取值范围
export const ALLOW_PRESETS = [
  { id: 'steel-static', hub: 'steel', load: 'static', min: 120, max: 150 },
  { id: 'steel-light', hub: 'steel', load: 'light', min: 100, max: 120 },
  { id: 'steel-impact', hub: 'steel', load: 'impact', min: 60, max: 90 },
  { id: 'iron-static', hub: 'iron', load: 'static', min: 70, max: 80 },
  { id: 'iron-light', hub: 'iron', load: 'light', min: 50, max: 60 },
  { id: 'iron-impact', hub: 'iron', load: 'impact', min: 30, max: 45 },
];

// 键长取「毂长 B 减去 5~10 mm」以内的最大标准长度，默认减 8 mm
export const DEFAULT_GAP = 8;

const isPos = (x) => typeof x === 'number' && Number.isFinite(x) && x > 0;
const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;

// 按轴径查键槽尺寸；区间为「大于下限、至上限（含）」
export function selectKey(d) {
  if (!isPos(d) || d <= D_MIN || d > D_MAX) {
    throw new KeyError('D_RANGE', `Shaft diameter must be over ${D_MIN} mm and up to ${D_MAX} mm.`);
  }
  return KEY_TABLE.find((r) => d > r.dMin && d <= r.dMax);
}

// 按 b × h 查表（手动指定键尺寸时用）
export function keyBySize(b, h) {
  const r = KEY_TABLE.find((x) => x.b === b && x.h === h);
  if (!r) throw new KeyError('SIZE', `Key size ${b}×${h} is not in the table.`);
  return r;
}

// 工作长度：A 型（圆头）l = L − b，B 型（平头）l = L，C 型（单圆头）l = L − b/2
export function workingLength(type, L, b) {
  if (!KEY_TYPES.includes(type)) throw new KeyError('TYPE', `Unknown key type "${type}".`);
  if (!isPos(L)) throw new KeyError('L', 'Key length must be positive.');
  if (!isPos(b)) throw new KeyError('SIZE', 'Key width must be positive.');
  const l = type === 'A' ? L - b : type === 'C' ? L - b / 2 : L;
  if (!(l > 0)) throw new KeyError('L_SHORT', `Key length ${L} mm is too short for type ${type} with b = ${b} mm.`);
  return l;
}

// 由工作长度反推键长
export function lengthFromWorking(type, l, b) {
  if (!KEY_TYPES.includes(type)) throw new KeyError('TYPE', `Unknown key type "${type}".`);
  return type === 'A' ? l + b : type === 'C' ? l + b / 2 : l;
}

// T = 9550·P/n（N·m）
export function torqueFromPower(P, n) {
  if (!isPos(P) || !isPos(n)) throw new KeyError('PN', 'Power and speed must be positive.');
  return (9550 * P) / n;
}

// 不超过 B − gap 的最大标准键长；没有则返回 null
export function suggestLength(B, gap = DEFAULT_GAP) {
  if (!isPos(B)) throw new KeyError('B', 'Hub length must be positive.');
  if (typeof gap !== 'number' || !(gap >= 0)) throw new KeyError('B', 'Gap must be non-negative.');
  const max = B - gap;
  let best = null;
  for (const L of LENGTHS) if (L <= max + 1e-9) best = L;
  return best;
}

// 不小于 x 的最小标准键长；超出系列返回 null
export function roundUpLength(x) {
  for (const L of LENGTHS) if (L >= x - 1e-9) return L;
  return null;
}

// 键的标记：A 型省略 "A"
export function keyMarking(type, b, h, L) {
  return `GB/T 1096 键 ${type === 'A' ? '' : type + ' '}${b}×${h}×${L}`;
}

// 主计算：挤压强度校核
// d 轴径，T 扭矩 N·m，b/h 可省略（按 d 自动选），L 键长，type 键型，keys 键数（1 或 2），allow 许用挤压应力
export function checkKey({ d, T, b, h, L, type = 'A', keys = 1, allow }) {
  const auto = selectKey(d);
  let row = auto;
  if (b !== undefined || h !== undefined) row = keyBySize(b, h);
  if (!isPos(T)) throw new KeyError('T', 'Torque must be positive.');
  if (!KEY_TYPES.includes(type)) throw new KeyError('TYPE', `Unknown key type "${type}".`);
  if (keys !== 1 && keys !== 2) throw new KeyError('KEYS', 'Number of keys must be 1 or 2.');
  if (!isPos(allow)) throw new KeyError('ALLOW', 'Allowable bearing pressure must be positive.');
  if (!isPos(L)) throw new KeyError('L', 'Key length must be positive.');

  const l = workingLength(type, L, row.b);
  // 两个键按 180° 布置时，考虑载荷分配不均，只按 1.5 个键计算
  const kn = keys === 2 ? 1.5 : 1;
  const k = 0.5 * row.h;
  const sigma = (2000 * T) / (k * l * d * kn); // 与 4000T/(d·h·l·kn) 相同
  const util = sigma / allow;

  // 满足强度所需的最小工作长度及各键型对应键长
  const lReq = (2000 * T) / (k * allow * d * kn);
  const LReq = {};
  const LStd = {};
  for (const ty of KEY_TYPES) {
    LReq[ty] = round(lengthFromWorking(ty, lReq, row.b), 2);
    LStd[ty] = roundUpLength(LReq[ty]);
  }

  return {
    input: { d, T, b: row.b, h: row.h, L, type, keys, allow },
    row,
    autoRow: auto,
    mismatch: row !== auto,
    k,
    kn,
    l: round(l, 2),
    sigma: round(sigma, 2),
    util: round(util, 4),
    ok: sigma <= allow + 1e-9,
    lReq: round(lReq, 2),
    LReq,
    LStd,
    // 图纸标注（只给公称值，公差带按正常连接写文字）
    shaftDepth: round(d - row.t, 2), // 轴上标 d − t
    hubDepth: round(d + row.t1, 2), // 毂上标 d + t1
    marking: keyMarking(type, row.b, row.h, L),
    longKey: L > 1.8 * d, // 教材建议键长不超过 (1.6~1.8)d
  };
}
