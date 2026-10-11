// 滚动轴承基本额定寿命计算引擎（ISO 281 基本方法，对应濮良贵《机械设计》第 13 章）
// 纯计算，不涉及 DOM。
// 单位：载荷 kN（C、C0、Fr、Fa、P 都用 kN，只要一致即可），转速 r/min，寿命 h 或 10⁶ r。

export class BearingError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BearingError';
    this.code = code;
  }
}

// 寿命指数 ε：球轴承 3，滚子轴承 10/3
export const LIFE_EXPONENT = { ball: 3, roller: 10 / 3 };

// 可靠度寿命修正系数 a1（ISO 281:2007 数值）
export const RELIABILITY_A1 = { 90: 1, 95: 0.64, 96: 0.55, 97: 0.47, 98: 0.37, 99: 0.25 };

// 载荷系数 fp（教材推荐范围），value 为选预设时填入的默认值
export const FP_PRESETS = [
  { id: 'light', range: [1.0, 1.2], value: 1.1, name: 'No or slight impact', nameZh: '无冲击或轻微冲击',
    eg: 'electric motors, turbines, fans, pumps', egZh: '电机、汽轮机、通风机、水泵等' },
  { id: 'medium', range: [1.2, 1.8], value: 1.5, name: 'Moderate impact', nameZh: '中等冲击或中等惯性力',
    eg: 'vehicles, power machinery, cranes, metal-cutting machines, gearboxes', egZh: '车辆、动力机械、起重机、冶金设备、减速器等' },
  { id: 'heavy', range: [1.8, 3.0], value: 2.4, name: 'Heavy impact', nameZh: '强大冲击',
    eg: 'crushers, rolling mills, oil rigs, vibrating screens', egZh: '破碎机、轧钢机、钻探机、振动筛等' },
];

// 温度系数 ft（教材表值）
export const FT_PRESETS = [
  { t: '≤120', ft: 1.0 }, { t: '125', ft: 0.95 }, { t: '150', ft: 0.9 }, { t: '175', ft: 0.85 },
  { t: '200', ft: 0.8 }, { t: '225', ft: 0.75 }, { t: '250', ft: 0.7 }, { t: '300', ft: 0.6 }, { t: '350', ft: 0.5 },
];

// 推荐的预期计算寿命 Lh′（参考值，h）
export const LIFE_GUIDE = [
  { id: 'rare', range: [300, 3000], value: 1500,
    name: 'Rarely used instruments / devices', nameZh: '不经常使用的仪器或设备（如闸门开闭装置）' },
  { id: 'short', range: [3000, 8000], value: 5000,
    name: 'Short-term or intermittent use, stoppage not critical (hand-operated machines)', nameZh: '短期或间断使用、中断不致引起严重后果的机械（如手动机械）' },
  { id: 'inter', range: [8000, 12000], value: 10000,
    name: 'Intermittent use, stoppage serious (hoists, workshop cranes, conveyors)', nameZh: '间断使用、中断后果严重的机械（如升降机、车间吊车、自动传送装置）' },
  { id: 'd8low', range: [12000, 20000], value: 15000,
    name: '8 h/day, not fully utilised (general gear drives)', nameZh: '每日 8 h 工作、利用率不高的机械（如一般齿轮传动）' },
  { id: 'd8high', range: [20000, 30000], value: 25000,
    name: '8 h/day, fully utilised (machine tools, printing machines)', nameZh: '每日 8 h 工作、利用率较高的机械（如金属切削机床、印刷机械）' },
  { id: 'd24', range: [40000, 60000], value: 50000,
    name: '24 h continuous (pumps, motors, textile machines)', nameZh: '24 h 连续工作的机械（如泵、电机、纺织机械）' },
  { id: 'd24crit', range: [100000, 200000], value: 100000,
    name: '24 h continuous, stoppage critical (power-station main motors, mine pumps)', nameZh: '24 h 连续工作、中断后果严重的机械（如发电站主电机、矿井水泵）' },
];

// 深沟球轴承径向/轴向系数表（教材表 13-5，相对轴向载荷 Fa/C0）
// Fa/Fr ≤ e 时 X = 1、Y = 0；Fa/Fr > e 时 X = 0.56、Y 按表
export const DGBB_TABLE = [
  { r: 0.014, e: 0.19, Y: 2.30 },
  { r: 0.028, e: 0.22, Y: 1.99 },
  { r: 0.056, e: 0.26, Y: 1.71 },
  { r: 0.084, e: 0.28, Y: 1.55 },
  { r: 0.11, e: 0.30, Y: 1.45 },
  { r: 0.17, e: 0.34, Y: 1.31 },
  { r: 0.28, e: 0.38, Y: 1.15 },
  { r: 0.42, e: 0.42, Y: 1.04 },
  { r: 0.56, e: 0.44, Y: 1.00 },
];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function need(cond, code, msg) {
  if (!cond) throw new BearingError(code, msg);
}

function exponent(type) {
  need(Object.prototype.hasOwnProperty.call(LIFE_EXPONENT, type), 'TYPE', `Unknown bearing type "${type}".`);
  return LIFE_EXPONENT[type];
}

function a1Of(reliability) {
  const a1 = RELIABILITY_A1[reliability];
  need(a1 !== undefined, 'REL', `Reliability must be one of ${Object.keys(RELIABILITY_A1).join(', ')} %.`);
  return a1;
}

function checkFt(ft) {
  need(isNum(ft) && ft > 0 && ft <= 1, 'FT', 'Temperature factor ft must be in (0, 1].');
}

// 深沟球轴承：按 Fa/C0 线性插值求 e、Y，再比较 Fa/Fr 与 e 确定 X、Y
// 超出表格范围时取端点值（clamped = true）
export function dgbbFactors({ Fr, Fa, C0 }) {
  need(isNum(C0) && C0 > 0, 'C0', 'Basic static load rating C0 must be > 0.');
  need(isNum(Fr) && Fr >= 0 && isNum(Fa) && Fa >= 0, 'LOAD', 'Loads Fr and Fa must be ≥ 0.');
  need(Fr > 0 || Fa > 0, 'LOAD', 'Fr and Fa cannot both be zero.');
  const ratio = Fa / C0;
  const T = DGBB_TABLE;
  let e, Ytab, clamped = false;
  if (ratio <= T[0].r) {
    ({ e, Y: Ytab } = T[0]);
    clamped = ratio < T[0].r;
  } else if (ratio >= T[T.length - 1].r) {
    ({ e, Y: Ytab } = T[T.length - 1]);
    clamped = ratio > T[T.length - 1].r;
  } else {
    const i = T.findIndex((row) => row.r >= ratio);
    const a = T[i - 1], b = T[i];
    const k = (ratio - a.r) / (b.r - a.r);
    e = a.e + k * (b.e - a.e);
    Ytab = a.Y + k * (b.Y - a.Y);
  }
  const FaFr = Fr > 0 ? Fa / Fr : Infinity;
  const heavyAxial = FaFr > e;
  // Fa = 0 时与表格无关，直接纯径向
  if (Fa === 0) return { ratio, e, FaFr: 0, heavyAxial: false, clamped: false, X: 1, Y: 0 };
  return { ratio, e, FaFr, heavyAxial, clamped, X: heavyAxial ? 0.56 : 1, Y: heavyAxial ? Ytab : 0 };
}

// 当量动载荷 P = fp·(X·Fr + Y·Fa)
export function equivalentLoad({ Fr, Fa = 0, X = 1, Y = 0, fp = 1 }) {
  need(isNum(Fr) && Fr >= 0, 'LOAD', 'Radial load Fr must be ≥ 0.');
  need(isNum(Fa) && Fa >= 0, 'LOAD', 'Axial load Fa must be ≥ 0.');
  need(isNum(X) && X >= 0 && isNum(Y) && Y >= 0, 'XY', 'Factors X and Y must be ≥ 0.');
  need(isNum(fp) && fp >= 1, 'FP', 'Load factor fp must be ≥ 1.');
  const P = fp * (X * Fr + Y * Fa);
  need(P > 0, 'P', 'Equivalent load P must be > 0.');
  return P;
}

// 基本额定寿命 L10 = (ft·C/P)^ε（10⁶ r），L10h = 10⁶/(60n)·L10（h）；Lna = a1·L10
export function ratingLife({ C, P, n, type = 'ball', ft = 1, reliability = 90 }) {
  need(isNum(C) && C > 0, 'C', 'Basic dynamic load rating C must be > 0.');
  need(isNum(P) && P > 0, 'P', 'Equivalent load P must be > 0.');
  need(isNum(n) && n > 0, 'N', 'Speed n must be > 0.');
  checkFt(ft);
  const eps = exponent(type);
  const a1 = a1Of(reliability);
  const L10 = ((ft * C) / P) ** eps;
  const hPerMrev = 1e6 / (60 * n);
  const L10h = hPerMrev * L10;
  const Lna = a1 * L10;
  const Lnah = a1 * L10h;
  return {
    eps, a1, L10, L10h, Lna, Lnah,
    years8: Lnah / (8 * 365),
    years24: Lnah / (24 * 365),
  };
}

// 所需基本额定动载荷 C′ = (P/ft)·(60·n·Lh′/(10⁶·a1))^(1/ε)
export function requiredC({ P, n, Lh, type = 'ball', ft = 1, reliability = 90 }) {
  need(isNum(P) && P > 0, 'P', 'Equivalent load P must be > 0.');
  need(isNum(n) && n > 0, 'N', 'Speed n must be > 0.');
  need(isNum(Lh) && Lh > 0, 'LH', 'Required life Lh′ must be > 0.');
  checkFt(ft);
  const eps = exponent(type);
  const a1 = a1Of(reliability);
  return (P / ft) * ((60 * n * Lh) / (1e6 * a1)) ** (1 / eps);
}

// 一次算完：页面使用
export function calcBearing({ type = 'ball', C, Fr, Fa = 0, n, X = 1, Y = 0, fp = 1, ft = 1, Lh, reliability = 90 }) {
  const P = equivalentLoad({ Fr, Fa, X, Y, fp });
  const life = ratingLife({ C, P, n, type, ft, reliability });
  const Creq = requiredC({ P, n, Lh, type, ft, reliability });
  return {
    input: { type, C, Fr, Fa, n, X, Y, fp, ft, Lh, reliability },
    P,
    ...life,
    Creq,
    ratio: life.Lnah / Lh,
    pass: C >= Creq,
  };
}
