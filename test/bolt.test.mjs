// 用 VDI 2230 扭矩表的常见数值（μG = μK = 0.12，ν = 90%，外六角）校验：node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcBolt, yieldStrength, THREADS, CLASSES, BoltError } from '../bolt.js';

const near = (actual, expected, tol, label) =>
  assert.ok(Math.abs(actual - expected) / expected <= tol, `${label}: 实际 ${actual}，期望约 ${expected}`);

const vdi = { muG: 0.12, muK: 0.12, nu: 0.9, head: 'hex' };

test('拧紧扭矩与 VDI 扭矩表一致（±3%）', () => {
  const table = [
    ['M6', '8.8', 10.1], ['M8', '8.8', 25], ['M10', '8.8', 49], ['M12', '8.8', 85],
    ['M16', '8.8', 210], ['M20', '8.8', 410], ['M24', '8.8', 710],
    ['M10', '10.9', 72], ['M12', '10.9', 125], ['M10', '12.9', 84], ['M12', '12.9', 145],
  ];
  for (const [size, cls, MA] of table) {
    near(calcBolt({ size, cls, ...vdi }).torque, MA, 0.03, `${size} ${cls}`);
  }
});

test('螺纹几何：应力截面积', () => {
  near(calcBolt({ size: 'M10', cls: '8.8', ...vdi }).geometry.As, 58.0, 0.005, 'M10 As');
  near(calcBolt({ size: 'M12', cls: '8.8', ...vdi }).geometry.As, 84.3, 0.005, 'M12 As');
  near(calcBolt({ size: 'M20', cls: '8.8', ...vdi }).geometry.As, 245, 0.005, 'M20 As');
});

test('等效应力恰好等于 ν·Rp，扭矩分项之和等于总扭矩', () => {
  for (const { size } of THREADS) {
    for (const cls of CLASSES) {
      const r = calcBolt({ size, cls, ...vdi });
      near(r.stress.sigmaRed, 0.9 * r.Rp, 0.002, `${size} ${cls} σred`);
      const sum = r.torqueParts.pitch + r.torqueParts.thread + r.torqueParts.head;
      assert.ok(Math.abs(sum - r.torque) < 0.03, `${size} ${cls} 分项和`);
    }
  }
});

test('摩擦越大，扭矩越大、允许预紧力越小', () => {
  const lo = calcBolt({ size: 'M12', cls: '8.8', muG: 0.08, muK: 0.08 });
  const hi = calcBolt({ size: 'M12', cls: '8.8', muG: 0.16, muK: 0.16 });
  assert.ok(hi.preload < lo.preload);
  assert.ok(hi.torque > lo.torque);
});

test('支承直径：内六角取头部直径，外六角取 dw', () => {
  assert.equal(calcBolt({ size: 'M5', cls: '8.8', ...vdi, head: 'socket' }).geometry.dw, 8.5);
  assert.equal(calcBolt({ size: 'M5', cls: '8.8', ...vdi }).geometry.dw, 6.88); // 外六角取 ISO 4017 的 dw 最小值
});

test('8.8 级屈服强度以 16 mm 为界', () => {
  assert.equal(yieldStrength('8.8', 16), 640);
  assert.equal(yieldStrength('8.8', 18), 660);
});

test('非法输入报错', () => {
  assert.throws(() => calcBolt({ size: 'M7', cls: '8.8', ...vdi }), BoltError);
  assert.throws(() => calcBolt({ size: 'M10', cls: '9.8', ...vdi }), BoltError);
  assert.throws(() => calcBolt({ size: 'M10', cls: '8.8', ...vdi, muG: 0.6 }), { code: 'INPUT' });
  assert.throws(() => calcBolt({ size: 'M10', cls: '8.8', ...vdi, nu: 1.2 }), { code: 'INPUT' });
  assert.throws(() => calcBolt({ size: 'M10', cls: '8.8', ...vdi, head: 'pan' }), { code: 'INPUT' });
});
