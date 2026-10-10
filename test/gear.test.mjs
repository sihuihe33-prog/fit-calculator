// 直齿圆柱齿轮几何：用教材/手算数值校验。运行：node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcGearPair, inv, invInverse, zMinUndercut, xMinUndercut, spanMeasurement, GearError,
} from '../gear.js';

const near = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: 实际 ${actual}，期望 ${expected} ± ${tol}`);

const DEG = Math.PI / 180;

test('渐开线函数与反函数', () => {
  near(inv(20 * DEG), 0.014904384, 1e-9, 'inv 20°');
  near(inv(25 * DEG), 0.029975345, 1e-9, 'inv 25°');
  for (const deg of [0.5, 5, 14.5, 20, 22.5, 30, 45, 60, 80, 89]) {
    near(invInverse(inv(deg * DEG)) / DEG, deg, 1e-9, `往返 ${deg}°`);
  }
  assert.equal(invInverse(0), 0);
  assert.throws(() => invInverse(-0.01), GearError);
});

test('标准齿轮 m=2, z=20, α=20°, x=0', () => {
  const r = calcGearPair({ m: 2, z1: 20, z2: 40 });
  const g = r.gears[0];
  near(g.d, 40, 1e-12, 'd');
  near(g.da, 44, 1e-9, 'da');
  near(g.df, 35, 1e-9, 'df');
  near(g.ha, 2, 1e-9, 'ha');
  near(g.hf, 2.5, 1e-9, 'hf');
  near(g.db, 37.588, 1e-3, 'db');
  near(g.pb, 5.904, 1e-3, 'pb');
  near(g.s, Math.PI, 1e-12, 's = πm/2');
  assert.equal(g.k, 3);
  near(g.Wk, 15.321, 1e-3, 'W3');
  // z=40：k = 40·20/180 + 0.5 ≈ 4.94 → 5
  assert.equal(r.gears[1].k, 5);
  near(r.gears[1].Wk, 27.690, 1e-3, 'W5 (z=40)');
});

test('标准齿轮副 z1=20, z2=40：a=60, α\'=20°, ε≈1.635', () => {
  const r = calcGearPair({ m: 2, z1: 20, z2: 40 });
  near(r.pair.a, 60, 1e-12, 'a');
  near(r.pair.aw, 60, 1e-9, "a'");
  near(r.pair.alphaW, 20, 1e-9, "α'");
  near(r.pair.y, 0, 1e-9, 'y');
  near(r.pair.dy, 0, 1e-9, 'Δy');
  near(r.pair.u, 2, 1e-12, 'u');
  // 手算：αa1=arccos(37.588/44)=31.32°，αa2=arccos(75.175/84)=26.50°
  // ε = [20(0.6085−0.3640)+40(0.4986−0.3640)]/2π ≈ 1.635
  near(r.pair.eps, 1.6352, 1e-3, 'ε');
  // 重合度只与齿数有关，与模数无关
  near(calcGearPair({ m: 5, z1: 20, z2: 40 }).pair.eps, r.pair.eps, 1e-12, 'ε 与 m 无关');
  assert.ok(!r.warnings.some((w) => w.level !== 'info'), '标准齿轮副不应有警告');
});

test('高度变位 x1=+0.3, x2=−0.3：α\'=α, a\'=a', () => {
  const r = calcGearPair({ m: 3, z1: 12, z2: 40, x1: 0.3, x2: -0.3 });
  near(r.pair.alphaW, 20, 1e-9, "α'");
  near(r.pair.aw, 78, 1e-9, "a'");
  near(r.pair.dy, 0, 1e-9, 'Δy');
  const [g1, g2] = r.gears;
  near(g1.da, 36 + 2 * 1.3 * 3, 1e-9, 'da1 = d + 2(1+0.3)m');
  near(g1.df, 36 - 2 * 0.95 * 3, 1e-9, 'df1 = d − 2(1.25−0.3)m');
  near(g2.da, 120 + 2 * 0.7 * 3, 1e-9, 'da2');
  near(g1.s, 3 * (Math.PI / 2 + 0.6 * Math.tan(20 * DEG)), 1e-12, 's1');
  // 两轮分度圆齿厚之和仍等于齿距（无侧隙）
  near(g1.s + g2.s, Math.PI * 3, 1e-12, 's1 + s2 = p');
  // x1=0.3 ≥ x_min(12)=0.298，所以不应报根切
  assert.ok(!r.warnings.some((w) => w.code === 'UNDERCUT'));
});

test('正传动 x1+x2>0：a\'>a, Δy>0, inv α\' 满足无侧隙方程', () => {
  const inp = { m: 2.5, z1: 18, z2: 37, x1: 0.4, x2: 0.2 };
  const r = calcGearPair(inp);
  const tanA = Math.tan(20 * DEG);
  // 手算：inv α' = 2·0.6·tan20°/55 + inv20° = 0.0228456 → α' ≈ 22.935°
  near(r.pair.invAlphaW, 0.0228456, 1e-7, "inv α'");
  near(inv(r.pair.alphaWRad), 2 * 0.6 * tanA / 55 + inv(20 * DEG), 1e-14, "inv α' 方程");
  near(r.pair.alphaW, 22.935, 1e-3, "α'");
  near(r.pair.a, 68.75, 1e-12, 'a');
  near(r.pair.aw, 70.149, 1e-3, "a'");
  near(r.pair.y, 0.5598, 1e-4, 'y');
  near(r.pair.dy, 0.0402, 1e-4, 'Δy');
  assert.ok(r.pair.aw > r.pair.a && r.pair.dy > 0);
  // 顶隙校验：a' − (da1 + df2)/2 = c*·m
  const [g1, g2] = r.gears;
  near(r.pair.aw - (g1.da + g2.df) / 2, 0.25 * 2.5, 1e-9, '顶隙 1→2');
  near(r.pair.aw - (g2.da + g1.df) / 2, 0.25 * 2.5, 1e-9, '顶隙 2→1');
  // 节圆直径之和的一半等于 a'
  near((g1.dw + g2.dw) / 2, r.pair.aw, 1e-9, "dw 与 a'");
  near(r.pair.eps, 1.4328, 1e-3, 'ε');
});

test('根切界限：z_min=17.1，x_min(12)≈0.298', () => {
  near(zMinUndercut(20), 17.097, 1e-3, 'z_min 20°');
  near(zMinUndercut(14.5), 31.9, 0.05, 'z_min 14.5°');
  // 精确 z_min=17.097 时 x_min=0.298；教材取 z_min=17 时为 5/17=0.294
  near(xMinUndercut(12, 20), 0.2981, 1e-4, 'x_min(12)');
  near(xMinUndercut(17, 20), 0.0057, 1e-4, 'x_min(17)');
  const r = calcGearPair({ m: 2, z1: 12, z2: 40 });
  assert.ok(r.warnings.some((w) => w.code === 'UNDERCUT' && w.gear === 1), 'z=12, x=0 应报根切');
  const ok = calcGearPair({ m: 2, z1: 12, z2: 40, x1: 0.3, x2: 0 });
  assert.ok(!ok.warnings.some((w) => w.code === 'UNDERCUT'), 'x=0.3 不应报根切');
});

test('齿顶变尖与重合度警告', () => {
  // 小齿轮大正变位 → 齿顶变尖
  const r = calcGearPair({ m: 2, z1: 10, z2: 40, x1: 1.2, x2: 0 });
  assert.ok(r.warnings.some((w) => w.gear === 1 && (w.code === 'POINTED' || w.code === 'THIN_TIP')), '应报齿顶过薄');
  // 过大的齿顶高降低使重合度 < 1.2
  const lowEps = calcGearPair({ m: 2, z1: 12, z2: 13, x1: 1, x2: 1 });
  assert.ok(lowEps.pair.eps < 1.2);
  assert.ok(lowEps.warnings.some((w) => w.code === 'EPS_LOW' || w.code === 'EPS_LT_1'));
  const lowEpsMsg = lowEps.warnings.find((w) => w.code === 'EPS_LT_1');
  if (lowEps.pair.eps < 1) assert.equal(lowEpsMsg.level, 'error');
});

test('公法线：变位后 Wk 增加 2xm·sinα', () => {
  const a = spanMeasurement({ m: 4, z: 30, alpha: 20, x: 0 });
  near(a.Wk, 4 * Math.cos(20 * DEG) * ((a.k - 0.5) * Math.PI + 30 * inv(20 * DEG)), 1e-12, 'W 定义');
  assert.equal(a.k, 4);
  const b = spanMeasurement({ m: 4, z: 30, alpha: 20, x: 0.1 });
  if (b.k === a.k) near(b.Wk - a.Wk, 2 * 0.1 * 4 * Math.sin(20 * DEG), 1e-12, 'ΔW');
  assert.ok(spanMeasurement({ m: 1, z: 5, alpha: 20, x: 0 }).k >= 1);
});

test('非法输入抛出 GearError 并带 code', () => {
  const base = { m: 2, z1: 20, z2: 40 };
  const cases = [
    [{ m: 0 }, 'M'], [{ m: -1 }, 'M'], [{ m: NaN }, 'M'],
    [{ z1: 4 }, 'Z'], [{ z2: 20.5 }, 'Z'],
    [{ alpha: 5 }, 'ALPHA'], [{ alpha: 40 }, 'ALPHA'],
    [{ haStar: 0 }, 'HA'], [{ cStar: -0.1 }, 'C'], [{ x1: 5 }, 'X'],
    [{ z1: 5, z2: 5, x1: -2, x2: -2 }, 'XSUM'],
  ];
  for (const [patch, code] of cases) {
    assert.throws(() => calcGearPair({ ...base, ...patch }), (e) => e instanceof GearError && e.code === code, JSON.stringify(patch));
  }
});
