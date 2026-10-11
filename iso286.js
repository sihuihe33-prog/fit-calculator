// ISO 286-1:2010 / ISO 286-2:2010 公差与配合计算引擎
// 所有偏差单位均为微米（µm），尺寸单位为毫米（mm）。
// 覆盖范围：公称尺寸 0 < D ≤ 500 mm；轴 a–u（含 js/j），孔 A–U（含 JS/J）；IT1–IT18。

export class Iso286Error extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'Iso286Error';
    this.code = code; // 'SIZE_RANGE' | 'NOT_DEFINED' | 'PARSE'
  }
}

export const MAX_SIZE = 500;
export const GRADES = Array.from({ length: 18 }, (_, i) => i + 1);
export const SHAFT_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'js', 'j', 'k', 'm', 'n', 'p', 'r', 's', 't', 'u'];
export const HOLE_LETTERS = SHAFT_LETTERS.map((l) => l.toUpperCase());

// 主尺寸段（"大于 … 至 …"）的上限，共 13 段
const MAIN_STEPS = [3, 6, 10, 18, 30, 50, 80, 120, 180, 250, 315, 400, 500];
// 中间尺寸段的上限，共 25 段（a/b/c 与 r–u 需要用到）
const FINE_STEPS = [3, 6, 10, 14, 18, 24, 30, 40, 50, 65, 80, 100, 120, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500];

// 标准公差数值表（ISO 286-1 表 1），每行对应一个主尺寸段，列为 IT1–IT18
const IT_TABLE = [
  [0.8, 1.2, 2, 3, 4, 6, 10, 14, 25, 40, 60, 100, 140, 250, 400, 600, 1000, 1400],
  [1, 1.5, 2.5, 4, 5, 8, 12, 18, 30, 48, 75, 120, 180, 300, 480, 750, 1200, 1800],
  [1, 1.5, 2.5, 4, 6, 9, 15, 22, 36, 58, 90, 150, 220, 360, 580, 900, 1500, 2200],
  [1.2, 2, 3, 5, 8, 11, 18, 27, 43, 70, 110, 180, 270, 430, 700, 1100, 1800, 2700],
  [1.5, 2.5, 4, 6, 9, 13, 21, 33, 52, 84, 130, 210, 330, 520, 840, 1300, 2100, 3300],
  [1.5, 2.5, 4, 7, 11, 16, 25, 39, 62, 100, 160, 250, 390, 620, 1000, 1600, 2500, 3900],
  [2, 3, 5, 8, 13, 19, 30, 46, 74, 120, 190, 300, 460, 740, 1200, 1900, 3000, 4600],
  [2.5, 4, 6, 10, 15, 22, 35, 54, 87, 140, 220, 350, 540, 870, 1400, 2200, 3500, 5400],
  [3.5, 5, 8, 12, 18, 25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300],
  [4.5, 7, 10, 14, 20, 29, 46, 72, 115, 185, 290, 460, 720, 1150, 1850, 2900, 4600, 7200],
  [6, 8, 12, 16, 23, 32, 52, 81, 130, 210, 320, 520, 810, 1300, 2100, 3200, 5200, 8100],
  [7, 9, 13, 18, 25, 36, 57, 89, 140, 230, 360, 570, 890, 1400, 2300, 3600, 5700, 8900],
  [8, 10, 15, 20, 27, 40, 63, 97, 155, 250, 400, 630, 970, 1550, 2500, 4000, 6300, 9700],
];

// 轴的基本偏差（ISO 286-1 表 2）
// a–g：上极限偏差 es；k–u：下极限偏差 ei。长度 25 的数组按中间尺寸段，长度 13 的按主尺寸段。
const SHAFT_ES = {
  a: [-270, -270, -280, -290, -290, -300, -300, -310, -320, -340, -360, -380, -410, -460, -520, -580, -660, -740, -820, -920, -1050, -1200, -1350, -1500, -1650],
  b: [-140, -140, -150, -150, -150, -160, -160, -170, -180, -190, -200, -220, -240, -260, -280, -310, -340, -380, -420, -480, -540, -600, -680, -760, -840],
  c: [-60, -70, -80, -95, -95, -110, -110, -120, -130, -140, -150, -170, -180, -200, -210, -230, -240, -260, -280, -300, -330, -360, -400, -440, -480],
  d: [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210, -230],
  e: [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125, -135],
  f: [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62, -68],
  g: [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18, -20],
  h: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const SHAFT_EI = {
  // k 在 IT4–IT7 时取此值，其余公差等级 ei = 0
  k: [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5],
  m: [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21, 23],
  n: [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37, 40],
  p: [6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62, 68],
  r: [10, 15, 19, 23, 23, 28, 28, 34, 34, 41, 43, 51, 54, 63, 65, 68, 77, 80, 84, 94, 98, 108, 114, 126, 132],
  s: [14, 19, 23, 28, 28, 35, 35, 43, 43, 53, 59, 71, 79, 92, 100, 108, 122, 130, 140, 158, 170, 190, 208, 232, 252],
  // t 在 24 mm 及以下没有规定值
  t: [null, null, null, null, null, null, 41, 48, 54, 66, 75, 91, 104, 122, 134, 146, 166, 180, 196, 218, 240, 268, 294, 330, 360],
  u: [18, 23, 28, 33, 33, 41, 48, 60, 70, 87, 102, 124, 144, 170, 190, 210, 236, 258, 284, 315, 350, 390, 435, 490, 540],
};

// j 轴的下极限偏差 ei，只规定了 IT5–IT8（IT8 仅 ≤3 mm）
const SHAFT_J_EI = {
  5: [-2, -2, -2, -3, -4, -5, -7, -9, -11, -13, -16, -18, -20],
  6: [-2, -2, -2, -3, -4, -5, -7, -9, -11, -13, -16, -18, -20],
  7: [-4, -4, -5, -6, -8, -10, -12, -15, -18, -21, -26, -28, -32],
  8: [-6, null, null, null, null, null, null, null, null, null, null, null, null],
};

// J 孔的上极限偏差 ES，只规定了 IT6–IT8
const HOLE_J_ES = {
  6: [2, 5, 5, 6, 8, 10, 13, 16, 18, 22, 25, 29, 33],
  7: [4, 6, 8, 10, 12, 14, 18, 22, 26, 30, 36, 39, 43],
  8: [6, 10, 12, 15, 20, 24, 28, 34, 41, 47, 55, 60, 66],
};

// 消除浮点误差，并把 -0 统一成 0（否则界面会显示 "-0"）
const round = (x) => Math.round(x * 1000) / 1000 || 0;

function checkSize(size) {
  if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0 || size > MAX_SIZE) {
    throw new Iso286Error('SIZE_RANGE', `Nominal size must be greater than 0 and at most ${MAX_SIZE} mm.`);
  }
}

function checkGrade(grade) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 18) {
    throw new Iso286Error('NOT_DEFINED', `Tolerance grade IT${grade} is not supported (IT1–IT18).`);
  }
}

// 尺寸段规则："大于下限、至上限（含）"
const stepIndex = (steps, size) => steps.findIndex((upper) => size <= upper);
const mainIndex = (size) => stepIndex(MAIN_STEPS, size);

function lookup(table, size) {
  const steps = table.length === FINE_STEPS.length ? FINE_STEPS : MAIN_STEPS;
  return table[stepIndex(steps, size)];
}

function notDefined(code, size) {
  return new Iso286Error('NOT_DEFINED', `${code} is not defined in ISO 286 for a nominal size of ${size} mm.`);
}

export function itValue(size, grade) {
  checkSize(size);
  checkGrade(grade);
  if (grade >= 14 && size <= 1) {
    throw notDefined(`IT${grade}`, size);
  }
  return IT_TABLE[mainIndex(size)][grade - 1];
}

// 孔的特殊规则所用的 Δ = ITn − IT(n−1)；3 mm 及以下 Δ = 0
function delta(size, grade) {
  if (size <= 3) return 0;
  const row = IT_TABLE[mainIndex(size)];
  return round(row[grade - 1] - row[grade - 2]);
}

export function shaftLimits(size, letter, grade) {
  checkSize(size);
  checkGrade(grade);
  const code = `${letter}${grade}`;
  if (!SHAFT_LETTERS.includes(letter)) {
    throw new Iso286Error('NOT_DEFINED', `Unknown shaft deviation "${letter}".`);
  }
  if ((letter === 'a' || letter === 'b') && size <= 1) throw notDefined(code, size);
  const it = itValue(size, grade);

  if (letter === 'js') {
    // ISO 286-1:2010（GB/T 1800.1—2020）：js 一律为 ±IT/2，奇数公差保留半微米。
    // 1988 版「IT7–IT11 奇数先减 1 再平分」的规则已取消
    const half = it / 2;
    return { upper: round(half), lower: round(-half) };
  }
  if (letter in SHAFT_ES) {
    const es = lookup(SHAFT_ES[letter], size);
    return { upper: es, lower: round(es - it) };
  }
  let ei;
  if (letter === 'j') {
    const table = SHAFT_J_EI[grade];
    ei = table ? table[mainIndex(size)] : null;
  } else if (letter === 'k') {
    ei = grade >= 4 && grade <= 7 ? lookup(SHAFT_EI.k, size) : 0;
  } else {
    ei = lookup(SHAFT_EI[letter], size);
  }
  if (ei == null) throw notDefined(code, size);
  return { upper: round(ei + it), lower: ei };
}

export function holeLimits(size, letter, grade) {
  checkSize(size);
  checkGrade(grade);
  const code = `${letter}${grade}`;
  if (!HOLE_LETTERS.includes(letter)) {
    throw new Iso286Error('NOT_DEFINED', `Unknown hole deviation "${letter}".`);
  }
  if ((letter === 'A' || letter === 'B') && size <= 1) throw notDefined(code, size);
  const it = itValue(size, grade);
  const shaft = letter.toLowerCase();

  if (letter === 'JS') {
    const { upper, lower } = shaftLimits(size, 'js', grade);
    return { upper, lower };
  }
  // A–H：EI = −es（通用规则）
  if (shaft in SHAFT_ES) {
    const ei = round(-lookup(SHAFT_ES[shaft], size));
    return { upper: round(ei + it), lower: ei };
  }

  let es;
  if (letter === 'J') {
    const table = HOLE_J_ES[grade];
    es = table ? table[mainIndex(size)] : null;
  } else {
    // K、M、N（≤IT8）和 P–U（≤IT7）适用特殊规则 ES = −ei + Δ；Δ 只对 IT3 及以上有定义
    const special = (['K', 'M', 'N'].includes(letter) && grade <= 8) || (!['K', 'M', 'N'].includes(letter) && grade <= 7);
    if (special && grade < 3) throw notDefined(code, size);
    const d = special ? delta(size, grade) : 0;
    if (letter === 'K') {
      // K 的特殊规则使用 k 在 IT4–IT7 时的值；IT8 以上 ES = 0，但只对 ≤3 mm 有定义
      if (grade > 8 && size > 3) throw notDefined(code, size);
      es = grade <= 8 ? round(-lookup(SHAFT_EI.k, size) + d) : 0;
    } else if (letter === 'M') {
      es = round(-lookup(SHAFT_EI.m, size) + d);
      // 标准中的特例：M6 在 250–315 mm 段 ES = −9 µm
      if (grade === 6 && size > 250 && size <= 315) es = -9;
    } else if (letter === 'N') {
      if (grade <= 8) es = round(-lookup(SHAFT_EI.n, size) + d);
      else if (size <= 1) throw notDefined(code, size);
      else es = size <= 3 ? -lookup(SHAFT_EI.n, size) : 0;
    } else {
      const ei = lookup(SHAFT_EI[shaft], size);
      es = ei == null ? null : round(-ei + d);
    }
  }
  if (es == null) throw notDefined(code, size);
  return { upper: es, lower: round(es - it) };
}

const FIT_RE = /^\s*([A-Za-z]{1,2})\s*(\d{1,2})\s*\/\s*([A-Za-z]{1,2})\s*(\d{1,2})\s*$/;

export function parseFit(str) {
  const m = FIT_RE.exec(String(str ?? ''));
  if (!m) throw new Iso286Error('PARSE', `Cannot read fit "${str}". Use a format like H7/g6.`);
  const holeLetter = m[1].toUpperCase();
  const shaftLetter = m[3].toLowerCase();
  // 字母大小写有约定：孔用大写、轴用小写；这里放宽，按位置识别
  if (!HOLE_LETTERS.includes(holeLetter) || !SHAFT_LETTERS.includes(shaftLetter)) {
    throw new Iso286Error('PARSE', `Unsupported deviation letter in "${str}". Holes A–U, shafts a–u.`);
  }
  return {
    hole: { letter: holeLetter, grade: Number(m[2]) },
    shaft: { letter: shaftLetter, grade: Number(m[4]) },
  };
}

export function calcFit(size, fit) {
  const spec = typeof fit === 'string' ? parseFit(fit) : fit;
  const h = holeLimits(size, spec.hole.letter, spec.hole.grade);
  const s = shaftLimits(size, spec.shaft.letter, spec.shaft.grade);
  const maxClearance = round(h.upper - s.lower);
  const minClearance = round(h.lower - s.upper);
  const type = minClearance >= 0 ? 'clearance' : maxClearance <= 0 ? 'interference' : 'transition';
  return {
    size,
    hole: { ...spec.hole, code: `${spec.hole.letter}${spec.hole.grade}`, ...h },
    shaft: { ...spec.shaft, code: `${spec.shaft.letter}${spec.shaft.grade}`, ...s },
    maxClearance,
    minClearance,
    type,
  };
}

// ISO 286-2 推荐的基孔制优先配合
export const PREFERRED_FITS = [
  { fit: 'H11/c11', type: 'clearance', name: 'Loose running', nameZh: '松转动配合', use: 'Wide commercial tolerances or allowances on external members.', useZh: '公差宽松，适用于外露零件或要求不高的场合。' },
  { fit: 'H9/d9', type: 'clearance', name: 'Free running', nameZh: '自由转动配合', use: 'Not for accuracy; large temperature variations, high speeds or heavy journal pressures.', useZh: '精度要求不高，用于温差大、转速高或轴颈压力大的场合。' },
  { fit: 'H8/f7', type: 'clearance', name: 'Close running', nameZh: '紧转动配合', use: 'Running on accurate machines and accurate location at moderate speeds.', useZh: '精密机床中速转动，兼顾较准确的定位。' },
  { fit: 'H7/g6', type: 'clearance', name: 'Sliding', nameZh: '滑动配合', use: 'Not intended to run freely, but to move and turn freely and locate accurately.', useZh: '不用于连续转动，零件可自由滑动、转动并准确定位。' },
  { fit: 'H7/h6', type: 'clearance', name: 'Locational clearance', nameZh: '间隙定位配合', use: 'Snug fit for locating stationary parts; can be freely assembled and disassembled.', useZh: '静止零件的紧密定位，可自由装拆。' },
  { fit: 'H7/k6', type: 'transition', name: 'Locational transition', nameZh: '过渡定位配合', use: 'Compromise between clearance and interference for accurate location.', useZh: '介于间隙与过盈之间，用于精确定位。' },
  { fit: 'H7/n6', type: 'transition', name: 'Tight transition', nameZh: '紧过渡配合', use: 'More accurate location where greater interference is permissible.', useZh: '允许较大过盈时的更精确定位。' },
  { fit: 'H7/p6', type: 'interference', name: 'Locational interference', nameZh: '过盈定位配合', use: 'Rigidity and alignment without special bore pressure requirements.', useZh: '保证刚性和对中，对孔壁压力无特殊要求。' },
  { fit: 'H7/s6', type: 'interference', name: 'Medium drive', nameZh: '中等压入配合', use: 'Ordinary steel parts or shrink fits on light sections.', useZh: '普通钢件的压入，或薄壁件的热装。' },
  { fit: 'H7/u6', type: 'interference', name: 'Force fit', nameZh: '强压入配合', use: 'Highly stressed parts, or shrink fits where heavy press forces are impractical.', useZh: '承受大应力的零件，或无法用大压力压装时的热装。' },
];
