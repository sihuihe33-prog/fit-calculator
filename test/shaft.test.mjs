// 轴的强度计算引擎：用手算数值校验。运行：node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ShaftError, MATERIALS, ALLOW_PRESETS, torqueFromPower, minDiameter, keywayAllowance,
  roundUpDiameter, sectionModulus, combinedCheck, keyForDiameter,
} from '../shaft.js';

const close = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${label}: 实际 ${actual}，期望 ${expected} ± ${tol}`);

test('扭矩 T = 9.55e6·P/n', () => {
  close(torqueFromPower(10, 960), 99479.17, 0.01, 'T');
  close(torqueFromPower(7.5, 1440), 49739.58, 0.01, 'T');
});

test('最小轴径：P=10 kW, n=960, A0=112 → d ≈ 24.45 mm', () => {
  const r = minDiameter({ P: 10, n: 960, A0: 112 });
  // 112 × ∛(10/960) = 112 × 0.218395 = 24.4603
  close(r.dRaw, 24.4603, 0.001, 'dRaw');
  close(r.dRaw, 24.5, 0.05, 'dRaw 到 0.1 mm');
  close(r.T, 99479.17, 0.01, 'T');
  assert.equal(r.keyPct, 0);
  assert.equal(r.dKey, r.dRaw);
  assert.equal(r.dStd, 25);
});

test('空心轴：β=0.5 时直径放大 1/∛(0.9375)', () => {
  const s = minDiameter({ P: 10, n: 960, A0: 112 });
  const h = minDiameter({ P: 10, n: 960, A0: 112, beta: 0.5 });
  close(h.hollowFactor, 1 / Math.cbrt(0.9375), 1e-12, '放大系数');
  close(h.hollowFactor, 1.02175, 0.00001, '放大系数数值');
  close(h.dRaw / s.dRaw, 1 / Math.cbrt(0.9375), 1e-12, '比值');
  close(h.dInnerStd, h.dStd * 0.5, 1e-12, '内径');
});

test('键槽加大：d ≤ 100 单键 7%（5–7）、双键 15%（10–15）；d > 100 单键 3%、双键 7%', () => {
  assert.deepEqual(keywayAllowance(50, 0), { pct: 0, range: [0, 0] });
  assert.deepEqual(keywayAllowance(50, 1), { pct: 7, range: [5, 7] });
  assert.deepEqual(keywayAllowance(50, 2), { pct: 15, range: [10, 15] });
  assert.deepEqual(keywayAllowance(100, 1), { pct: 7, range: [5, 7] });
  assert.deepEqual(keywayAllowance(120, 1), { pct: 3, range: [3, 3] });
  assert.deepEqual(keywayAllowance(120, 2), { pct: 7, range: [7, 7] });

  const r1 = minDiameter({ P: 10, n: 960, A0: 112, keyways: 1 });
  close(r1.dKey, 24.4603 * 1.07, 0.001, '单键');
  assert.equal(r1.dStd, 27);
  const r2 = minDiameter({ P: 10, n: 960, A0: 112, keyways: 2 });
  close(r2.dKey, 24.4603 * 1.15, 0.001, '双键');
  assert.equal(r2.dStd, 29);
  const r3 = minDiameter({ P: 10, n: 960, A0: 112, keyways: 1, keyPct: 5 });
  close(r3.dKey, 24.4603 * 1.05, 0.001, '自定义 5%');

  // 大轴：P=200 kW, n=100, A0=112 → 112·∛2 = 141.11 mm > 100 → 单键 3%
  const big = minDiameter({ P: 200, n: 100, A0: 112, keyways: 1 });
  close(big.dRaw, 141.111, 0.001, '大轴 dRaw');
  assert.equal(big.keyPct, 3);
  assert.equal(big.dStd, 150); // 145.34 → 下一个 5 的倍数
});

test('圆整规则：≤50 取整毫米，>50 取 5 的倍数', () => {
  assert.equal(roundUpDiameter(24.01), 25);
  assert.equal(roundUpDiameter(24), 24);
  assert.equal(roundUpDiameter(24.0000000001), 24);
  assert.equal(roundUpDiameter(49.3), 50);
  assert.equal(roundUpDiameter(50.2), 55);
  assert.equal(roundUpDiameter(55), 55);
  assert.equal(roundUpDiameter(71), 75);
});

test('A0 范围与许用应力预设', () => {
  const c45 = MATERIALS.find((m) => m.id === 'c45');
  assert.deepEqual(c45.A0, [126, 103]);
  assert.deepEqual(c45.tau, [25, 45]);
  assert.equal(ALLOW_PRESETS.find((m) => m.id === '45qt').allow, 60);
  // A0 与 [τT] 的对应关系 A0 ≈ ∛(9.55e6/(0.2[τT]))：A0=126 → [τT] ≈ 23.9（教材表值为圆整后的经验值）
  close(minDiameter({ P: 1, n: 1, A0: 126 }).tauFromA0, 23.87, 0.01, 'τ 反推');
});

test('弯扭合成：M=200 N·m, T=300 N·m, α=0.6, d=40 → σca ≈ 42.8 MPa', () => {
  // 单位换算：N·m × 1000 = N·mm
  const r = combinedCheck({ M: 200 * 1000, T: 300 * 1000, alpha: 0.6, d: 40, allow: 60 });
  const Mca = Math.sqrt(200 ** 2 + 180 ** 2) * 1000; // 269 072.4 N·mm
  const W = (Math.PI * 40 ** 3) / 32; // 6283.19 mm³
  close(r.Mca, Mca, 1e-6, 'Mca');
  close(r.Mca, 269072.4, 0.1, 'Mca 数值');
  close(r.W, W, 1e-9, 'W');
  close(r.W, 6283.185, 0.001, 'W 数值');
  close(r.sigma, 42.824, 0.001, 'σca');
  assert.equal(r.pass, true);
  close(r.util, 42.824 / 60, 0.0001, '利用率');
  close(r.Wapprox, 6400, 1e-9, '0.1d³');
  // d_req = ∛(32·Mca/(π·60))，与校核用同一 W = πd³/32
  close(r.dReq, 35.747, 0.001, 'dReq');
});

test('两平面弯矩合成 M = √(Mh²+Mv²)', () => {
  const r = combinedCheck({ Mh: 120e3, Mv: 160e3, T: 0, alpha: 0.6, d: 40, allow: 60 });
  close(r.M, 200e3, 1e-6, 'M');
  // T=0 时 σ = M/W
  close(r.sigma, 200e3 / ((Math.PI * 64000) / 32), 1e-9, 'σ');
  // 直接给 M 时忽略 Mh/Mv
  const r2 = combinedCheck({ Mh: 1, Mv: 1, M: 50e3, T: 0, alpha: 1, d: 40, allow: 60 });
  assert.equal(r2.M, 50e3);
});

test('空心与键槽截面的 W', () => {
  const h = sectionModulus({ d: 40, beta: 0.5 });
  close(h.W, ((Math.PI * 64000) / 32) * 0.9375, 1e-9, '空心 W');
  // 单键 b=12, t=5, d=40：W = π·40³/32 − 12·5·35²/(80) = 6283.185 − 918.75 = 5364.435
  const k1 = sectionModulus({ d: 40, keyway: { count: 1, b: 12, t: 5 } });
  close(k1.W, 5364.435, 0.001, '单键 W');
  const k2 = sectionModulus({ d: 40, keyway: { count: 2, b: 12, t: 5 } });
  close(k2.W, 6283.185 - 1837.5, 0.001, '双键 W');
  const r = combinedCheck({ M: 200e3, T: 300e3, alpha: 0.6, d: 40, keyway: { count: 1, b: 12, t: 5 }, allow: 60 });
  close(r.sigma, 269072.4 / 5364.435, 0.001, '键槽 σ');
  assert.equal(r.pass, true); // 50.16 MPa < 60
});

test('GB/T 1095 键槽查表', () => {
  assert.deepEqual(keyForDiameter(40), { b: 12, h: 8, t: 5 });
  assert.deepEqual(keyForDiameter(38), { b: 10, h: 8, t: 5 });
  assert.deepEqual(keyForDiameter(30), { b: 8, h: 7, t: 4 });
  assert.equal(keyForDiameter(5), null);
  assert.equal(keyForDiameter(300), null);
});

test('非法输入报错', () => {
  assert.throws(() => torqueFromPower(0, 960), ShaftError);
  assert.throws(() => torqueFromPower(10, -1), { code: 'SPEED' });
  assert.throws(() => minDiameter({ P: 10, n: 960, A0: 0 }), { code: 'A0' });
  assert.throws(() => minDiameter({ P: NaN, n: 960, A0: 112 }), { code: 'POWER' });
  assert.throws(() => minDiameter({ P: 10, n: 960, A0: 112, beta: 1 }), { code: 'BETA' });
  assert.throws(() => minDiameter({ P: 10, n: 960, A0: 112, keyways: 3 }), { code: 'KEYWAYS' });
  const ok = { M: 1e5, T: 1e5, alpha: 0.6, d: 40, allow: 60 };
  assert.throws(() => combinedCheck({ ...ok, d: 0 }), { code: 'DIAMETER' });
  assert.throws(() => combinedCheck({ ...ok, alpha: 0 }), { code: 'ALPHA' });
  assert.throws(() => combinedCheck({ ...ok, alpha: 1.5 }), { code: 'ALPHA' });
  assert.throws(() => combinedCheck({ ...ok, allow: -5 }), { code: 'ALLOW' });
  assert.throws(() => combinedCheck({ ...ok, T: -1 }), { code: 'TORQUE' });
  assert.throws(() => combinedCheck({ ...ok, M: -1 }), { code: 'MOMENT' });
  assert.throws(() => combinedCheck({ ...ok, keyway: { count: 1, b: 12, t: 25 } }), { code: 'KEY' });
  assert.throws(() => combinedCheck({ ...ok, beta: 0.8, keyway: { count: 1, b: 12, t: 5 } }), { code: 'KEY' });
});

test('性质：反算的最小直径代回校核必须合格', () => {
  // 审查反例：M=162 N·m、T=0、[σ−1]=60，旧算法给 30 mm，代回 61.1 MPa 不合格
  const r = combinedCheck({ M: 162e3, T: 0, alpha: 0.6, d: 40, allow: 60 });
  close(r.dReq, 30.1848, 0.001, 'dReq');
  for (const [M, T, beta] of [[162e3, 0, 0], [200e3, 300e3, 0], [5e5, 8e5, 0.5], [1e4, 2e6, 0]]) {
    const a = combinedCheck({ M, T, alpha: 0.6, d: 40, beta, allow: 60 });
    const b = combinedCheck({ M, T, alpha: 0.6, d: a.dReq, beta, allow: 60 });
    assert.ok(b.sigma <= 60 * (1 + 1e-9), `M=${M} T=${T} β=${beta}: σ=${b.sigma}`);
  }
});
