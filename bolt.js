// 螺栓拧紧扭矩与预紧力计算引擎（按 VDI 2230 的简化方法）
// 适用：钢制螺栓、ISO 公制粗牙螺纹、中等系列通孔（ISO 273）。
// 单位：长度 mm，力 N，扭矩 N·m，应力 MPa。

export class BoltError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BoltError';
    this.code = 'INPUT';
  }
}

// d 公称直径，P 螺距（ISO 261 粗牙），s 外六角对边宽度（ISO 4014/4017），
// dw 外六角支承面直径最小值（ISO 4014/4017），dk 内六角圆柱头头部直径（ISO 4762），dh 中等系列通孔直径（ISO 273）
export const THREADS = [
  { size: 'M3', d: 3, P: 0.5, s: 5.5, dw: 4.57, dk: 5.5, dh: 3.4 },
  { size: 'M4', d: 4, P: 0.7, s: 7, dw: 5.88, dk: 7, dh: 4.5 },
  { size: 'M5', d: 5, P: 0.8, s: 8, dw: 6.88, dk: 8.5, dh: 5.5 },
  { size: 'M6', d: 6, P: 1, s: 10, dw: 8.88, dk: 10, dh: 6.6 },
  { size: 'M8', d: 8, P: 1.25, s: 13, dw: 11.63, dk: 13, dh: 9 },
  { size: 'M10', d: 10, P: 1.5, s: 16, dw: 14.63, dk: 16, dh: 11 },
  { size: 'M12', d: 12, P: 1.75, s: 18, dw: 16.63, dk: 18, dh: 13.5 },
  { size: 'M14', d: 14, P: 2, s: 21, dw: 19.64, dk: 21, dh: 15.5 },
  { size: 'M16', d: 16, P: 2, s: 24, dw: 22.49, dk: 24, dh: 17.5 },
  { size: 'M18', d: 18, P: 2.5, s: 27, dw: 25.34, dk: 27, dh: 20 },
  { size: 'M20', d: 20, P: 2.5, s: 30, dw: 28.19, dk: 30, dh: 22 },
  { size: 'M22', d: 22, P: 2.5, s: 34, dw: 31.71, dk: 33, dh: 24 },
  { size: 'M24', d: 24, P: 3, s: 36, dw: 33.61, dk: 36, dh: 26 },
  { size: 'M27', d: 27, P: 3, s: 41, dw: 38, dk: 40, dh: 30 },
  { size: 'M30', d: 30, P: 3.5, s: 46, dw: 42.75, dk: 45, dh: 33 },
  { size: 'M36', d: 36, P: 4, s: 55, dw: 51.11, dk: 54, dh: 39 },
];

export const CLASSES = ['4.6', '5.6', '8.8', '10.9', '12.9'];
export const HEAD_TYPES = ['hex', 'socket'];

// 常见工况的摩擦系数（螺纹与支承面取同一值），取各工况典型范围的中间值
export const FRICTION_PRESETS = [
  { id: 'mos2', mu: 0.08, range: '0.06–0.10', name: 'MoS₂ paste / grease', nameZh: '二硫化钼膏 / 润滑脂' },
  { id: 'oiled', mu: 0.12, range: '0.10–0.14', name: 'Lightly oiled steel', nameZh: '钢件轻微涂油' },
  { id: 'zinc', mu: 0.14, range: '0.12–0.18', name: 'Zinc-plated, dry', nameZh: '镀锌件，干燥' },
  { id: 'dry', mu: 0.18, range: '0.14–0.24', name: 'Untreated steel, dry', nameZh: '未处理钢件，干燥' },
];

// ISO 898-1 屈服强度最小值 ReL 或 Rp0.2（MPa）；8.8 级以 16 mm 为界取不同值
export function yieldStrength(cls, d) {
  switch (cls) {
    case '4.6': return 240;
    case '5.6': return 300;
    case '8.8': return d <= 16 ? 640 : 660;
    case '10.9': return 940;
    case '12.9': return 1100;
    default: throw new BoltError(`Unknown property class "${cls}".`);
  }
}

const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;

export function calcBolt({ size, cls, muG, muK, nu = 0.9, head = 'hex' }) {
  const t = THREADS.find((x) => x.size === size);
  if (!t) throw new BoltError(`Unknown thread size "${size}".`);
  if (!HEAD_TYPES.includes(head)) throw new BoltError(`Unknown head type "${head}".`);
  for (const [name, mu] of [['μG', muG], ['μK', muK]]) {
    if (typeof mu !== 'number' || !(mu >= 0.04 && mu <= 0.5)) {
      throw new BoltError(`${name} must be between 0.04 and 0.5.`);
    }
  }
  if (typeof nu !== 'number' || !(nu >= 0.5 && nu <= 1)) {
    throw new BoltError('Utilization ν must be between 50% and 100%.');
  }
  const Rp = yieldStrength(cls, t.d);

  // 螺纹几何（ISO 724）：中径 d2、小径 d3，应力截面按 (d2+d3)/2 计
  const { d, P } = t;
  const d2 = d - 0.649519 * P;
  const d3 = d - 1.226869 * P;
  const d0 = (d2 + d3) / 2;
  const As = (Math.PI / 4) * d0 ** 2;

  // 支承面平均摩擦直径 Dkm = (dw + dh) / 2
  const dw = head === 'hex' ? t.dw : t.dk;
  const Dkm = (dw + t.dh) / 2;

  // 允许装配预紧力：拉应力与螺纹扭转切应力合成的等效应力 = ν·Rp
  const k = 1.5 * (d2 / d0) * (P / (Math.PI * d2) + 1.155 * muG);
  const preload = (As * nu * Rp) / Math.sqrt(1 + 3 * k ** 2);

  // 拧紧扭矩 M_A = F·(0.16P + 0.58·d2·μG + Dkm/2·μK)
  const pitch = (preload * 0.16 * P) / 1000;
  const thread = (preload * 0.58 * d2 * muG) / 1000;
  const headPart = (preload * (Dkm / 2) * muK) / 1000;
  const torque = pitch + thread + headPart;

  // 装配状态应力：螺纹扭矩 M_G 产生的切应力。
  // VDI 2230 允许装配时截面局部进入塑性，取塑性抗扭截面模量 W_p = π·d0³/12（与上面的预紧力公式一致）
  const MG = preload * (d2 / 2) * (P / (Math.PI * d2) + 1.155 * muG);
  const sigma = preload / As;
  const tau = MG / ((Math.PI * d0 ** 3) / 12);

  return {
    input: { size, cls, muG, muK, nu, head },
    geometry: { d, P, d2: round(d2), d3: round(d3), As: round(As, 2), dw, dh: t.dh, Dkm: round(Dkm, 2) },
    Rp,
    preload: round(preload, 1),
    torque: round(torque, 2),
    torqueParts: { pitch: round(pitch, 2), thread: round(thread, 2), head: round(headPart, 2) },
    kFactor: round((torque * 1000) / (preload * d), 4),
    stress: { sigma: round(sigma, 1), tau: round(tau, 1), sigmaRed: round(Math.sqrt(sigma ** 2 + 3 * tau ** 2), 1) },
  };
}
