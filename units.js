// 工程单位换算引擎（纯数据与计算，不涉及 DOM）
// 每个单位用"换算到 SI 基准单位的系数"定义：SI 值 = (数值 + offset) × factor。
// offset 只有温度这类仿射单位才有（单位自身刻度下的零点偏移），其余单位 offset = 0。
// 所有系数都取自精确定义（如 1 in = 0.0254 m、1 lb = 0.45359237 kg、g_n = 9.80665 m/s²），
// 由这些基础常数推导，避免手抄的近似值带来累积误差。

export class UnitsError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'UnitsError';
    this.code = code;
  }
}

/* ---------- 精确定义的基础常数 ---------- */
const IN = 0.0254;                 // 英寸 m（精确）
const FT = 0.3048;                 // 英尺 m（精确）
const YD = 0.9144;                 // 码 m（精确）
const MI = 1609.344;               // 英里 m（精确）
const NMI = 1852;                  // 海里 m（精确）
const LB = 0.45359237;             // 常衡磅 kg（精确）
const OZ = LB / 16;                // 常衡盎司 kg
const GN = 9.80665;                // 标准重力加速度 m/s²（精确）
const KGF = GN;                    // 千克力 N
const LBF = LB * GN;               // 磅力 N ≈ 4.4482216152605
const OZF = LBF / 16;              // 盎司力 N
const PSI = LBF / (IN * IN);       // 磅力每平方英寸 Pa ≈ 6894.757293168
const HP = 550 * FT * LBF;         // 英制机械马力 W ≈ 745.69987158227
const PS = 75 * GN;                // 公制马力 W = 735.49875（75 kgf·m/s）
const CAL_TH = 4.184;              // 热化学卡 J（精确）
const BTU_IT = 1055.05585262;      // 国际蒸汽表 BTU J（精确定义）
const PI = Math.PI;

// 生成单位对象的小工具；symbol 为符号，name/nameZh 为中英文名称
const u = (id, symbol, factor, name, nameZh, offset = 0) => ({ id, symbol, factor, offset, name, nameZh });

export const QUANTITIES = [
  {
    id: 'length', name: 'Length', nameZh: '长度', si: 'm',
    units: [
      u('um', 'µm', 1e-6, 'micrometre', '微米'),
      u('mm', 'mm', 1e-3, 'millimetre', '毫米'),
      u('cm', 'cm', 1e-2, 'centimetre', '厘米'),
      u('m', 'm', 1, 'metre', '米'),
      u('km', 'km', 1e3, 'kilometre', '千米'),
      u('thou', 'thou', IN / 1000, 'thou (mil)', '密耳 (千分之一英寸)'),
      u('in', 'in', IN, 'inch', '英寸'),
      u('ft', 'ft', FT, 'foot', '英尺'),
      u('yd', 'yd', YD, 'yard', '码'),
      u('mi', 'mi', MI, 'mile', '英里'),
      u('nmi', 'nmi', NMI, 'nautical mile', '海里'),
    ],
  },
  {
    id: 'mass', name: 'Mass', nameZh: '质量', si: 'kg',
    units: [
      u('mg', 'mg', 1e-6, 'milligram', '毫克'),
      u('g', 'g', 1e-3, 'gram', '克'),
      u('kg', 'kg', 1, 'kilogram', '千克'),
      u('t', 't', 1e3, 'tonne', '吨'),
      u('oz', 'oz', OZ, 'ounce', '盎司'),
      u('lb', 'lb', LB, 'pound', '磅'),
      u('slug', 'slug', LBF / FT, 'slug', '斯勒格'),
      u('ton_us', 'sh tn', 2000 * LB, 'short ton (US)', '短吨（美）'),
    ],
  },
  {
    id: 'force', name: 'Force', nameZh: '力', si: 'N',
    units: [
      u('N', 'N', 1, 'newton', '牛'),
      u('kN', 'kN', 1e3, 'kilonewton', '千牛'),
      u('MN', 'MN', 1e6, 'meganewton', '兆牛'),
      u('kgf', 'kgf', KGF, 'kilogram-force', '千克力'),
      u('tf', 'tf', 1000 * KGF, 'tonne-force', '吨力'),
      u('ozf', 'ozf', OZF, 'ounce-force', '盎司力'),
      u('lbf', 'lbf', LBF, 'pound-force', '磅力'),
      u('kip', 'kip', 1000 * LBF, 'kip (1000 lbf)', '千磅力'),
      u('dyn', 'dyn', 1e-5, 'dyne', '达因'),
    ],
  },
  {
    id: 'torque', name: 'Torque / moment', nameZh: '扭矩 / 力矩', si: 'N·m',
    units: [
      u('Nmm', 'N·mm', 1e-3, 'newton-millimetre', '牛·毫米'),
      u('Nm', 'N·m', 1, 'newton-metre', '牛·米'),
      u('kNm', 'kN·m', 1e3, 'kilonewton-metre', '千牛·米'),
      u('kgfcm', 'kgf·cm', KGF / 100, 'kilogram-force centimetre', '千克力·厘米'),
      u('kgfm', 'kgf·m', KGF, 'kilogram-force metre', '千克力·米'),
      u('ozfin', 'ozf·in', OZF * IN, 'ounce-force inch', '盎司力·英寸'),
      u('lbfin', 'lbf·in', LBF * IN, 'pound-force inch', '磅力·英寸'),
      u('lbfft', 'lbf·ft', LBF * FT, 'pound-force foot', '磅力·英尺'),
    ],
  },
  {
    id: 'pressure', name: 'Stress & pressure', nameZh: '应力 / 压强', si: 'Pa',
    units: [
      u('Pa', 'Pa', 1, 'pascal', '帕'),
      u('kPa', 'kPa', 1e3, 'kilopascal', '千帕'),
      u('MPa', 'MPa', 1e6, 'megapascal (N/mm²)', '兆帕 (N/mm²)'),
      u('GPa', 'GPa', 1e9, 'gigapascal', '吉帕'),
      u('mbar', 'mbar', 100, 'millibar', '毫巴'),
      u('bar', 'bar', 1e5, 'bar', '巴'),
      u('atm', 'atm', 101325, 'standard atmosphere', '标准大气压'),
      u('mmHg', 'mmHg', 133.322387415, 'millimetre of mercury', '毫米汞柱'),
      u('kgfcm2', 'kgf/cm²', KGF * 1e4, 'kgf per cm² (at)', '千克力/平方厘米'),
      u('kgfmm2', 'kgf/mm²', KGF * 1e6, 'kgf per mm²', '千克力/平方毫米'),
      u('psi', 'psi', PSI, 'pound-force per in²', '磅力/平方英寸'),
      u('ksi', 'ksi', 1000 * PSI, 'kilo-psi', '千磅力/平方英寸'),
    ],
  },
  {
    id: 'power', name: 'Power', nameZh: '功率', si: 'W',
    units: [
      u('W', 'W', 1, 'watt', '瓦'),
      u('kW', 'kW', 1e3, 'kilowatt', '千瓦'),
      u('MW', 'MW', 1e6, 'megawatt', '兆瓦'),
      u('hp', 'hp', HP, 'horsepower (mechanical, 550 ft·lbf/s)', '英制马力'),
      u('PS', 'PS', PS, 'metric horsepower (PS, cv)', '公制马力'),
      u('ftlbfs', 'ft·lbf/s', FT * LBF, 'foot-pound-force per second', '英尺·磅力/秒'),
      u('kcalh', 'kcal/h', 1000 * CAL_TH / 3600, 'kilocalorie (th) per hour', '千卡(热化学)/时'),
      u('btuh', 'BTU/h', BTU_IT / 3600, 'BTU (IT) per hour', '英热单位(IT)/时'),
    ],
  },
  {
    id: 'energy', name: 'Energy / work', nameZh: '能量 / 功', si: 'J',
    units: [
      u('J', 'J', 1, 'joule (N·m)', '焦耳 (N·m)'),
      u('kJ', 'kJ', 1e3, 'kilojoule', '千焦'),
      u('MJ', 'MJ', 1e6, 'megajoule', '兆焦'),
      u('Wh', 'Wh', 3600, 'watt-hour', '瓦时'),
      u('kWh', 'kWh', 3.6e6, 'kilowatt-hour', '千瓦时（度）'),
      u('cal', 'cal', CAL_TH, 'calorie (thermochemical)', '卡(热化学)'),
      u('kcal', 'kcal', 1000 * CAL_TH, 'kilocalorie (thermochemical, 4184 J)', '千卡(热化学, 4184 J)'),
      u('btu', 'BTU', BTU_IT, 'British thermal unit (IT)', '英热单位(IT)'),
      u('kgfm', 'kgf·m', KGF, 'kilogram-force metre', '千克力·米'),
      u('ftlbf', 'ft·lbf', FT * LBF, 'foot-pound-force', '英尺·磅力'),
    ],
  },
  {
    id: 'speed', name: 'Speed', nameZh: '线速度', si: 'm/s',
    units: [
      u('mms', 'mm/s', 1e-3, 'millimetre per second', '毫米/秒'),
      u('mmin', 'm/min', 1 / 60, 'metre per minute', '米/分'),
      u('ms', 'm/s', 1, 'metre per second', '米/秒'),
      u('kmh', 'km/h', 1000 / 3600, 'kilometre per hour', '千米/时'),
      u('ins', 'in/s', IN, 'inch per second', '英寸/秒'),
      u('ftmin', 'ft/min', FT / 60, 'foot per minute', '英尺/分'),
      u('fts', 'ft/s', FT, 'foot per second', '英尺/秒'),
      u('mph', 'mph', MI / 3600, 'mile per hour', '英里/时'),
      u('kn', 'kn', NMI / 3600, 'knot', '节'),
    ],
  },
  {
    id: 'rotation', name: 'Rotational speed', nameZh: '转速 / 角速度', si: 'rad/s',
    units: [
      u('rpm', 'rpm', (2 * PI) / 60, 'revolution per minute (r/min)', '转/分 (r/min)'),
      u('rps', 'r/s (Hz)', 2 * PI, 'revolution per second', '转/秒 (Hz)'),
      u('rads', 'rad/s', 1, 'radian per second', '弧度/秒'),
      u('radmin', 'rad/min', 1 / 60, 'radian per minute', '弧度/分'),
      u('degs', '°/s', PI / 180, 'degree per second', '度/秒'),
    ],
  },
  {
    id: 'area', name: 'Area', nameZh: '面积', si: 'm²',
    units: [
      u('mm2', 'mm²', 1e-6, 'square millimetre', '平方毫米'),
      u('cm2', 'cm²', 1e-4, 'square centimetre', '平方厘米'),
      u('m2', 'm²', 1, 'square metre', '平方米'),
      u('ha', 'ha', 1e4, 'hectare', '公顷'),
      u('km2', 'km²', 1e6, 'square kilometre', '平方千米'),
      u('in2', 'in²', IN * IN, 'square inch', '平方英寸'),
      u('ft2', 'ft²', FT * FT, 'square foot', '平方英尺'),
      u('acre', 'acre', 4046.8564224, 'acre', '英亩'),
    ],
  },
  {
    id: 'volume', name: 'Volume', nameZh: '体积', si: 'm³',
    units: [
      u('mm3', 'mm³', 1e-9, 'cubic millimetre', '立方毫米'),
      u('cm3', 'cm³ (mL)', 1e-6, 'cubic centimetre / millilitre', '立方厘米 / 毫升'),
      u('L', 'L', 1e-3, 'litre (dm³)', '升 (dm³)'),
      u('m3', 'm³', 1, 'cubic metre', '立方米'),
      u('in3', 'in³', IN ** 3, 'cubic inch', '立方英寸'),
      u('ft3', 'ft³', FT ** 3, 'cubic foot', '立方英尺'),
      u('galus', 'gal (US)', 231 * IN ** 3, 'US gallon', '美制加仑'),
      u('galuk', 'gal (UK)', 4.54609e-3, 'imperial gallon', '英制加仑'),
    ],
  },
  {
    id: 'density', name: 'Density', nameZh: '密度', si: 'kg/m³',
    units: [
      u('kgm3', 'kg/m³', 1, 'kilogram per cubic metre', '千克/立方米'),
      u('gcm3', 'g/cm³', 1e3, 'gram per cm³ (= kg/dm³, t/m³)', '克/立方厘米 (= kg/dm³)'),
      u('kgL', 'kg/L', 1e3, 'kilogram per litre', '千克/升'),
      u('lbin3', 'lb/in³', LB / IN ** 3, 'pound per cubic inch', '磅/立方英寸'),
      u('lbft3', 'lb/ft³', LB / FT ** 3, 'pound per cubic foot', '磅/立方英尺'),
    ],
  },
  {
    id: 'temperature', name: 'Temperature', nameZh: '温度', si: 'K', affine: true,
    units: [
      u('C', '°C', 1, 'degree Celsius', '摄氏度', 273.15),
      u('F', '°F', 5 / 9, 'degree Fahrenheit', '华氏度', 459.67),
      u('K', 'K', 1, 'kelvin', '开尔文'),
      u('R', '°R', 5 / 9, 'degree Rankine', '兰氏度'),
    ],
  },
  {
    id: 'inertia', name: 'Area moment of inertia', nameZh: '截面惯性矩', si: 'm⁴',
    units: [
      u('mm4', 'mm⁴', 1e-12, 'millimetre to the fourth', '毫米⁴'),
      u('cm4', 'cm⁴', 1e-8, 'centimetre to the fourth', '厘米⁴'),
      u('m4', 'm⁴', 1, 'metre to the fourth', '米⁴'),
      u('in4', 'in⁴', IN ** 4, 'inch to the fourth', '英寸⁴'),
    ],
  },
  {
    id: 'modulus', name: 'Section modulus', nameZh: '抗弯截面系数', si: 'm³',
    units: [
      u('mm3', 'mm³', 1e-9, 'cubic millimetre', '毫米³'),
      u('cm3', 'cm³', 1e-6, 'cubic centimetre', '厘米³'),
      u('m3', 'm³', 1, 'cubic metre', '米³'),
      u('in3', 'in³', IN ** 3, 'cubic inch', '英寸³'),
    ],
  },
];

/* ---------- 查找 ---------- */
export function getQuantity(quantityId) {
  const q = QUANTITIES.find((x) => x.id === quantityId);
  if (!q) throw new UnitsError('QUANTITY', `Unknown quantity: ${quantityId}`);
  return q;
}

export function getUnit(quantityId, unitId) {
  const q = getQuantity(quantityId);
  const unit = q.units.find((x) => x.id === unitId);
  if (!unit) throw new UnitsError('UNIT', `Unknown unit "${unitId}" for ${quantityId}`);
  return unit;
}

/* ---------- 换算 ---------- */
// 数值 → SI 基准值
function toSI(unit, value) {
  return (value + unit.offset) * unit.factor;
}
// SI 基准值 → 数值
function fromSI(unit, si) {
  return si / unit.factor - unit.offset;
}

function checkValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new UnitsError('VALUE', `Value must be a finite number, got ${value}`);
  }
}

// 温度不能低于绝对零度（留一点浮点容差）
function checkAbsolute(q, si) {
  if (q.affine && si < -1e-9) throw new UnitsError('RANGE', 'Temperature below absolute zero');
}

export function convert(quantityId, value, fromId, toId) {
  const q = getQuantity(quantityId);
  const from = getUnit(quantityId, fromId);
  const to = getUnit(quantityId, toId);
  checkValue(value);
  const si = toSI(from, value);
  checkAbsolute(q, si);
  if (from === to) return value;
  return fromSI(to, si);
}

// 一次换算到该物理量的全部单位，返回 [{ unit, value }]
export function convertAll(quantityId, value, fromId) {
  const q = getQuantity(quantityId);
  const from = getUnit(quantityId, fromId);
  checkValue(value);
  const si = toSI(from, value);
  checkAbsolute(q, si);
  return q.units.map((unit) => ({ unit, value: unit === from ? value : fromSI(unit, si) }));
}

/* ---------- 功率 – 扭矩 – 转速 ---------- */
// T [N·m] = P [W] / ω [rad/s] = P[kW]·1000 / (n[rpm]·2π/60) = (30000/π)·P / n
// 这里采用精确常数 30000/π ≈ 9549.297，而不是手册里常见的取整值 9550（两者相差约 0.007 %）。
export const PTS_CONSTANT = 30000 / PI;

// 传入 { P (kW), T (N·m), n (rpm) } 中的任意两个（第三个留空 / null / undefined），解出第三个。
export function powerTorqueSpeed({ P, T, n } = {}) {
  const given = (x) => x !== undefined && x !== null && !(typeof x === 'number' && Number.isNaN(x));
  const has = { P: given(P), T: given(T), n: given(n) };
  const count = Object.values(has).filter(Boolean).length;
  if (count !== 2) throw new UnitsError('INPUT', 'Give exactly two of P, T and n');
  for (const [k, v] of Object.entries({ P, T, n })) {
    if (has[k] && (typeof v !== 'number' || !Number.isFinite(v))) {
      throw new UnitsError('VALUE', `${k} must be a finite number`);
    }
  }
  const K = PTS_CONSTANT;
  if (!has.T) {
    if (n === 0) throw new UnitsError('DIV0', 'Speed n must not be zero when solving for T');
    return { P, T: (K * P) / n, n, solved: 'T' };
  }
  if (!has.P) {
    return { P: (T * n) / K, T, n, solved: 'P' };
  }
  if (T === 0) throw new UnitsError('DIV0', 'Torque T must not be zero when solving for n');
  return { P, T, n: (K * P) / T, solved: 'n' };
}

/* ---------- 数字格式化 ---------- */
// 最多 sig 位有效数字；很大或很小的数改用科学计数法；去掉末尾多余的 0。
// 返回不带千位分隔符的纯数字字符串（复制时直接可用）。
export function formatNumber(v, sig = 7) {
  if (!Number.isFinite(v)) return String(v);
  if (v === 0 || Math.abs(v) < 1e-300) return '0';
  const a = Math.abs(v);
  if (a >= 1e9 || a < 1e-5) {
    const [m, e] = v.toExponential(sig - 1).split('e');
    return `${stripZeros(m)}e${e.replace('+', '')}`;
  }
  let s = v.toPrecision(sig);
  if (s.includes('e')) s = Number(s).toString(); // toPrecision 偶尔会回到指数形式
  return stripZeros(s);
}

function stripZeros(s) {
  if (!s.includes('.')) return s;
  return s.replace(/\.?0+$/, '');
}

// 给整数部分加千位分隔符（仅用于显示）
export function groupThousands(s, sep = ',') {
  if (s.includes('e')) return s;
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  const [int, frac] = body.split('.');
  if (int.length < 5) return s;
  const g = int.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return (neg ? '-' : '') + g + (frac ? '.' + frac : '');
}
