// 外啮合渐开线直齿圆柱齿轮副几何计算引擎（ISO 53 / GB/T 1356 基本齿廓）
// 纯计算，无 DOM。单位：长度 mm，角度输入为度（°）。
// 变位后按"无侧隙啮合"求啮合角 α'，并按齿顶高降低系数 Δy 修正齿顶圆，保证标准顶隙。

export class GearError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'GearError';
    this.code = code;
  }
}

// GB/T 1357 第一系列模数
export const MODULES = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20];

export const DEFAULTS = { m: 2, z1: 20, z2: 40, alpha: 20, haStar: 1, cStar: 0.25, x1: 0, x2: 0 };

const DEG = Math.PI / 180;

// 渐开线函数 inv α = tan α − α（弧度）
export function inv(a) {
  return Math.tan(a) - a;
}

// 反渐开线函数：已知 inv α = v（v ≥ 0），求 α ∈ [0, π/2)
// 牛顿迭代 + 二分兜底，保证收敛
export function invInverse(v) {
  if (!Number.isFinite(v) || v < 0) throw new GearError('INV_RANGE', `invInverse: value must be ≥ 0, got ${v}`);
  if (v === 0) return 0;
  let lo = 0;
  let hi = Math.PI / 2 - 1e-12;
  // 初值：小角度时 inv α ≈ α³/3
  let a = Math.min(Math.cbrt(3 * v), 1.4);
  for (let i = 0; i < 100; i++) {
    const f = inv(a) - v;
    if (Math.abs(f) < 1e-15 * Math.max(1, v)) return a;
    if (f > 0) hi = a; else lo = a;
    const t = Math.tan(a);
    const d = t * t; // d(inv α)/dα = tan²α
    let next = a - f / d;
    // 牛顿步跑出当前区间时退回二分
    if (!(next > lo && next < hi)) next = (lo + hi) / 2;
    if (Math.abs(next - a) < 1e-16) return next;
    a = next;
  }
  return a;
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function validate({ m, z1, z2, alpha, haStar, cStar, x1, x2 }) {
  if (!isNum(m) || m <= 0 || m > 1000) throw new GearError('M', 'Module m must be a positive number.');
  for (const z of [z1, z2]) {
    if (!isNum(z) || !Number.isInteger(z) || z < 5 || z > 10000) {
      throw new GearError('Z', 'Tooth numbers must be integers from 5 to 10000.');
    }
  }
  if (!isNum(alpha) || alpha < 10 || alpha > 35) throw new GearError('ALPHA', 'Pressure angle must be between 10° and 35°.');
  if (!isNum(haStar) || haStar <= 0 || haStar > 2) throw new GearError('HA', 'Addendum coefficient ha* must be in (0, 2].');
  if (!isNum(cStar) || cStar < 0 || cStar > 1) throw new GearError('C', 'Clearance coefficient c* must be in [0, 1].');
  for (const x of [x1, x2]) {
    if (!isNum(x) || x < -3 || x > 3) throw new GearError('X', 'Profile shift coefficients must be between −3 and +3.');
  }
}

// 消除 -0 和 1e-16 级别的浮点噪声
const clean = (v) => (Math.abs(v) < 1e-12 ? 0 : v);

// 不发生根切的最少齿数 z_min = 2ha*/sin²α
export function zMinUndercut(alphaDeg, haStar = 1) {
  const s = Math.sin(alphaDeg * DEG);
  return (2 * haStar) / (s * s);
}

// 不根切的最小变位系数 x_min = ha*(z_min − z)/z_min
export function xMinUndercut(z, alphaDeg, haStar = 1) {
  const zm = zMinUndercut(alphaDeg, haStar);
  return (haStar * (zm - z)) / zm;
}

// 公法线跨齿数 k 与公法线长度 Wk
export function spanMeasurement({ m, z, alpha, x = 0 }) {
  const a = alpha * DEG;
  const d = m * z;
  const db = d * Math.cos(a);
  const ax = Math.acos(Math.min(1, db / (d + 2 * x * m)));
  let k = Math.round((z * ax) / Math.PI + 0.5);
  k = Math.max(1, Math.min(k, z - 1));
  const Wk = m * Math.cos(a) * ((k - 0.5) * Math.PI + z * inv(a)) + 2 * x * m * Math.sin(a);
  return { k, Wk };
}

export function calcGearPair(input) {
  const p = { ...DEFAULTS, ...input };
  validate(p);
  const { m, z1, z2, alpha, haStar, cStar, x1, x2 } = p;
  const a0 = alpha * DEG;
  const tanA = Math.tan(a0);
  const invA = inv(a0);

  // 啮合角：inv α' = 2(x1+x2)tanα/(z1+z2) + inv α
  const invAw = (2 * (x1 + x2) * tanA) / (z1 + z2) + invA;
  if (!(invAw > 0)) throw new GearError('XSUM', 'Sum of profile shifts is too negative: no valid working pressure angle.');
  const aw = invInverse(invAw);

  const a = (m * (z1 + z2)) / 2;
  const aWork = (a * Math.cos(a0)) / Math.cos(aw);
  const y = (aWork - a) / m;
  const dy = clean(x1 + x2 - y);

  const zMin = zMinUndercut(alpha, haStar);
  const warnings = [];

  const gears = [[z1, x1], [z2, x2]].map(([z, x], i) => {
    const d = m * z;
    const db = d * Math.cos(a0);
    const ha = (haStar + x - dy) * m;
    const hf = (haStar + cStar - x) * m;
    const da = d + 2 * ha;
    const df = d - 2 * hf;
    if (!(da > db)) throw new GearError('TIP', `Tip circle of gear ${i + 1} lies inside its base circle.`);
    if (!(df > 0)) throw new GearError('ROOT', `Root diameter of gear ${i + 1} is not positive.`);
    const alphaA = Math.acos(db / da);
    const s = m * (Math.PI / 2 + 2 * x * tanA);
    const sa = da * (s / d + invA - inv(alphaA));
    const { k, Wk } = spanMeasurement({ m, z, alpha, x });
    const dw = (d * Math.cos(a0)) / Math.cos(aw); // 节圆直径
    const xMin = (haStar * (zMin - z)) / zMin;
    return {
      z, x, d, db, da, df, dw, ha: clean(ha), hf: clean(hf), h: ha + hf,
      s, sa: clean(sa), alphaA: alphaA / DEG, alphaARad: alphaA,
      p: Math.PI * m, pb: Math.PI * m * Math.cos(a0), k, Wk, xMin: clean(xMin),
    };
  });

  const [g1, g2] = gears;
  const tanAw = Math.tan(aw);
  const eps = (z1 * (Math.tan(g1.alphaARad) - tanAw) + z2 * (Math.tan(g2.alphaARad) - tanAw)) / (2 * Math.PI);

  // ---------- 校核 ----------
  gears.forEach((g, i) => {
    const gear = i + 1;
    if (g.x < g.xMin - 1e-9) warnings.push({ level: 'warn', code: 'UNDERCUT', gear, xMin: g.xMin, zMin });
    if (g.sa <= 0) warnings.push({ level: 'error', code: 'POINTED', gear, sa: g.sa });
    else if (g.sa < 0.25 * m) warnings.push({ level: 'warn', code: 'THIN_TIP', gear, sa: g.sa, limit: 0.25 * m });
    if (g.df <= g.db) warnings.push({ level: 'info', code: 'DF_LT_DB', gear });
  });
  if (eps < 1) warnings.push({ level: 'error', code: 'EPS_LT_1', eps });
  else if (eps < 1.2) warnings.push({ level: 'warn', code: 'EPS_LOW', eps });

  return {
    input: { m, z1, z2, alpha, haStar, cStar, x1, x2 },
    gears,
    pair: {
      a, aw: aWork, alphaW: aw / DEG, alphaWRad: aw, invAlphaW: invAw,
      y: clean(y), dy, eps, u: z2 / z1, xSum: x1 + x2, zMin,
    },
    warnings,
  };
}
