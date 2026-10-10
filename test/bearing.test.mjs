// 滚动轴承寿命引擎的手算校验：node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  equivalentLoad, ratingLife, requiredC, calcBearing, dgbbFactors, BearingError, RELIABILITY_A1,
} from '../bearing.js';

const close = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: 实际 ${actual}，期望 ${expected}`);

test('球轴承：C=25.5 kN，P=3 kN，n=1450 r/min', () => {
  const r = ratingLife({ C: 25.5, P: 3, n: 1450, type: 'ball' });
  assert.equal(r.eps, 3);
  close(r.L10, 614.125, 1e-9, 'L10');
  // 10⁶/(60·1450)·614.125 = 614125000/87000
  close(r.L10h, 614125000 / 87000, 1e-9, 'L10h');
  close(r.L10h, 7058.908, 1e-3, 'L10h 数值');
  close(r.years8, 7058.908 / 2920, 1e-5, '8 h/天折合年');
  close(r.years24, 7058.908 / 8760, 1e-5, '24 h/天折合年');
  assert.equal(r.a1, 1);
  assert.equal(r.Lnah, r.L10h);
});

test('滚子轴承 ε = 10/3：C=40 kN，P=4 kN，n=1000 r/min', () => {
  const r = ratingLife({ C: 40, P: 4, n: 1000, type: 'roller' });
  close(r.eps, 10 / 3, 1e-12, 'ε');
  close(r.L10, 10 ** (10 / 3), 1e-9, 'L10');
  close(r.L10, 2154.4347, 1e-3, 'L10 数值');
  close(r.L10h, 2154.4347 * 1e6 / 60000, 0.02, 'L10h');
});

test('所需 C′ 往返：Lh′ 取 L10h 时 C′ 回到 C', () => {
  for (const type of ['ball', 'roller']) {
    for (const reliability of [90, 95, 99]) {
      const life = ratingLife({ C: 33.2, P: 4.7, n: 960, type, ft: 0.9, reliability });
      const Cq = requiredC({ P: 4.7, n: 960, Lh: life.Lnah, type, ft: 0.9, reliability });
      close(Cq, 33.2, 1e-9, `${type} R=${reliability}%`);
    }
  }
});

test('当量动载荷：fp 与 X/Y 组合', () => {
  close(equivalentLoad({ Fr: 5, Fa: 2, X: 0.56, Y: 1.5, fp: 1.2 }), 1.2 * (2.8 + 3), 1e-12, 'P');
  close(equivalentLoad({ Fr: 4 }), 4, 1e-12, '默认纯径向');
  close(equivalentLoad({ Fr: 0, Fa: 3, X: 0, Y: 1 }), 3, 1e-12, '纯轴向');
});

test('温度系数 ft 按 (ft·C)^ε 缩放寿命', () => {
  const a = ratingLife({ C: 20, P: 2, n: 1000, type: 'ball' });
  const b = ratingLife({ C: 20, P: 2, n: 1000, type: 'ball', ft: 0.9 });
  close(b.L10 / a.L10, 0.9 ** 3, 1e-12, 'ft 比值');
  const c = requiredC({ P: 2, n: 1000, Lh: 10000, type: 'ball', ft: 0.8 });
  const d = requiredC({ P: 2, n: 1000, Lh: 10000, type: 'ball' });
  close(c, d / 0.8, 1e-12, 'C′ 随 ft 放大');
});

test('可靠度修正 a1（ISO 281:2007）', () => {
  assert.deepEqual(RELIABILITY_A1, { 90: 1, 95: 0.64, 96: 0.55, 97: 0.47, 98: 0.37, 99: 0.25 });
  const r = ratingLife({ C: 25.5, P: 3, n: 1450, reliability: 99 });
  close(r.Lna, 0.25 * 614.125, 1e-9, 'L1a');
});

test('综合计算与通过判定', () => {
  // 手算：P = 1.1·(1·4) = 4.4 kN；C′ = 4.4·(60·1450·20000/10⁶)^(1/3) = 4.4·1740^(1/3)
  const r = calcBearing({ type: 'ball', C: 25.5, Fr: 4, Fa: 0, n: 1450, X: 1, Y: 0, fp: 1.1, Lh: 20000 });
  close(r.P, 4.4, 1e-12, 'P');
  close(r.Creq, 4.4 * Math.cbrt(1740), 1e-9, 'C′');
  close(r.Creq, 52.922, 0.001, 'C′ 数值');
  assert.equal(r.pass, false);
  assert.ok(r.ratio < 1);
  const ok = calcBearing({ type: 'ball', C: 60, Fr: 4, n: 1450, fp: 1.1, Lh: 20000 });
  assert.equal(ok.pass, true);
  assert.ok(ok.ratio > 1);
});

test('深沟球轴承 X、Y 查表与插值', () => {
  // 表中节点：Fa/C0 = 0.028 → e = 0.22，Y = 1.99
  const a = dgbbFactors({ Fr: 1, Fa: 0.28, C0: 10 });
  close(a.e, 0.22, 1e-12, 'e');
  assert.equal(a.heavyAxial, true);
  assert.equal(a.X, 0.56);
  close(a.Y, 1.99, 1e-12, 'Y');
  // 插值：Fa/C0 = 0.042，位于 0.028 与 0.056 中点
  const b = dgbbFactors({ Fr: 1, Fa: 0.42, C0: 10 });
  close(b.e, 0.24, 1e-12, '插值 e');
  close(b.Y, 1.85, 1e-12, '插值 Y');
  // Fa/Fr ≤ e → X = 1，Y = 0
  const c = dgbbFactors({ Fr: 10, Fa: 0.28, C0: 10 });
  assert.equal(c.X, 1);
  assert.equal(c.Y, 0);
  // 超出表格范围取端点
  const d = dgbbFactors({ Fr: 1, Fa: 8, C0: 10 });
  assert.equal(d.clamped, true);
  close(d.Y, 1.0, 1e-12, '端点 Y');
});

test('非法输入抛出 BearingError 并带 code', () => {
  assert.throws(() => ratingLife({ C: 0, P: 3, n: 1000 }), { code: 'C' });
  assert.throws(() => ratingLife({ C: 20, P: 0, n: 1000 }), { code: 'P' });
  assert.throws(() => ratingLife({ C: 20, P: 3, n: 0 }), { code: 'N' });
  assert.throws(() => ratingLife({ C: 20, P: 3, n: 1000, type: 'needle' }), { code: 'TYPE' });
  assert.throws(() => ratingLife({ C: 20, P: 3, n: 1000, ft: 1.2 }), { code: 'FT' });
  assert.throws(() => ratingLife({ C: 20, P: 3, n: 1000, reliability: 93 }), { code: 'REL' });
  assert.throws(() => requiredC({ P: 3, n: 1000, Lh: 0 }), { code: 'LH' });
  assert.throws(() => equivalentLoad({ Fr: 0, Fa: 0 }), { code: 'P' });
  assert.throws(() => equivalentLoad({ Fr: -1 }), { code: 'LOAD' });
  assert.throws(() => equivalentLoad({ Fr: 1, fp: 0.8 }), { code: 'FP' });
  assert.throws(() => equivalentLoad({ Fr: NaN }), BearingError);
  assert.throws(() => dgbbFactors({ Fr: 1, Fa: 1, C0: 0 }), { code: 'C0' });
});
