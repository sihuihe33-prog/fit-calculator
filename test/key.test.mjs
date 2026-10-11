// 平键选型与挤压强度校核：node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  KEY_TABLE, LENGTHS, selectKey, keyBySize, workingLength, torqueFromPower,
  suggestLength, roundUpLength, keyMarking, checkKey, KeyError,
} from '../key.js';

const near = (a, e, tol, label) => assert.ok(Math.abs(a - e) <= tol, `${label}: 实际 ${a}，期望 ${e}`);
const size = (r) => `${r.b}×${r.h}`;

test('键槽表自身一致：区间首尾相接、b/h 不减、t + t1 略大于 h', () => {
  for (let i = 0; i < KEY_TABLE.length; i++) {
    const r = KEY_TABLE[i];
    assert.ok(r.dMax > r.dMin);
    near(r.t + r.t1 - r.h, 0.3, 0.11, `${size(r)} 间隙`);
    if (i > 0) {
      const p = KEY_TABLE[i - 1];
      assert.equal(r.dMin, p.dMax);
      assert.ok(r.b > p.b && r.h >= p.h && r.t >= p.t && r.t1 >= p.t1, `${size(r)} 单调`);
    }
  }
  assert.equal(KEY_TABLE[0].dMin, 6);
  assert.equal(KEY_TABLE.at(-1).dMax, 130);
});

test('按轴径查键：边界「大于…至…」', () => {
  assert.equal(size(selectKey(22)), '6×6');
  assert.equal(size(selectKey(22.01)), '8×7');
  assert.equal(size(selectKey(30)), '8×7');
  assert.equal(size(selectKey(30.5)), '10×8');
  assert.equal(size(selectKey(6.5)), '2×2');
  assert.equal(size(selectKey(50)), '14×9');
  assert.equal(size(selectKey(130)), '32×18');
  assert.throws(() => selectKey(6), { code: 'D_RANGE' });
  assert.throws(() => selectKey(130.1), { code: 'D_RANGE' });
  assert.throws(() => selectKey(NaN), { code: 'D_RANGE' });
  const r = selectKey(55);
  assert.deepEqual([r.b, r.h, r.t, r.t1], [16, 10, 6.0, 4.3]);
});

test('按 b×h 查表', () => {
  assert.equal(keyBySize(16, 10).t, 6.0);
  assert.throws(() => keyBySize(16, 11), { code: 'SIZE' });
});

test('工作长度：A = L − b，B = L，C = L − b/2', () => {
  assert.equal(workingLength('A', 70, 14), 56);
  assert.equal(workingLength('B', 70, 14), 70);
  assert.equal(workingLength('C', 70, 14), 63);
  assert.throws(() => workingLength('A', 14, 14), { code: 'L_SHORT' });
  assert.throws(() => workingLength('C', 7, 14), { code: 'L_SHORT' });
  assert.throws(() => workingLength('D', 70, 14), { code: 'TYPE' });
  assert.throws(() => workingLength('A', 0, 14), { code: 'L' });
});

test('手算算例：d=50, 14×9, L=70 A 型, T=500 N·m → σp ≈ 79.4 MPa', () => {
  const r = checkKey({ d: 50, T: 500, L: 70, type: 'A', keys: 1, allow: 110 });
  assert.equal(size(r.row), '14×9');
  assert.equal(r.l, 56);
  near(r.sigma, (4000 * 500) / (50 * 9 * 56), 0.01, 'σp');
  near(r.sigma, 79.37, 0.01, 'σp 数值');
  assert.equal(r.ok, true);
  near(r.util, 79.365 / 110, 0.001, '利用率');
  // 所需工作长度 l = 4000T/(d·h·[σp])
  near(r.lReq, (4000 * 500) / (50 * 9 * 110), 0.01, 'lReq');
  near(r.LReq.A, r.lReq + 14, 0.01, 'A 型所需 L');
  near(r.LReq.C, r.lReq + 7, 0.01, 'C 型所需 L');
  assert.equal(r.LStd.A, 56); // 40.4 + 14 = 54.4 → 56
  assert.equal(r.shaftDepth, 44.5);
  assert.equal(r.hubDepth, 53.8);
  assert.equal(r.marking, 'GB/T 1096 键 14×9×70');
});

test('两个键按 1.5 个计', () => {
  const one = checkKey({ d: 50, T: 500, L: 70, type: 'A', keys: 1, allow: 110 });
  const two = checkKey({ d: 50, T: 500, L: 70, type: 'A', keys: 2, allow: 110 });
  near(two.sigma, one.sigma / 1.5, 0.01, '1.5 倍');
  near(two.lReq, one.lReq / 1.5, 0.01, 'lReq 1.5 倍');
});

test('不通过时 ok = false', () => {
  const r = checkKey({ d: 50, T: 1200, L: 70, type: 'A', keys: 1, allow: 110 });
  assert.equal(r.ok, false);
  assert.ok(r.util > 1);
});

test('手动指定键尺寸与标记', () => {
  const r = checkKey({ d: 50, T: 500, b: 16, h: 10, L: 80, type: 'B', keys: 1, allow: 110 });
  assert.equal(r.mismatch, true);
  assert.equal(r.l, 80);
  near(r.sigma, (4000 * 500) / (50 * 10 * 80), 0.01, 'σp');
  assert.equal(r.marking, 'GB/T 1096 键 B 16×10×80');
  assert.equal(keyMarking('C', 8, 7, 40), 'GB/T 1096 键 C 8×7×40');
});

test('由功率和转速求扭矩', () => {
  near(torqueFromPower(10, 1450), 65.862, 0.001, 'T');
  near(torqueFromPower(5.5, 955), 55, 1e-9, 'T');
  assert.throws(() => torqueFromPower(0, 1000), { code: 'PN' });
  assert.throws(() => torqueFromPower(5, -1), { code: 'PN' });
});

test('键长建议：不超过 B − 8 的最大标准长度', () => {
  assert.equal(suggestLength(80), 70);
  assert.equal(suggestLength(78), 70);
  assert.equal(suggestLength(77), 63);
  assert.equal(suggestLength(60, 5), 50);
  assert.equal(suggestLength(13), null);
  assert.equal(roundUpLength(54.4), 56);
  assert.equal(roundUpLength(600), null);
  assert.equal(LENGTHS.length, 36);
  assert.throws(() => suggestLength(0), { code: 'B' });
});

test('非法输入报错', () => {
  const ok = { d: 50, T: 500, L: 70, type: 'A', keys: 1, allow: 110 };
  assert.throws(() => checkKey({ ...ok, d: 5 }), KeyError);
  assert.throws(() => checkKey({ ...ok, d: 140 }), { code: 'D_RANGE' });
  assert.throws(() => checkKey({ ...ok, T: 0 }), { code: 'T' });
  assert.throws(() => checkKey({ ...ok, L: 14 }), { code: 'L_SHORT' });
  assert.throws(() => checkKey({ ...ok, type: 'X' }), { code: 'TYPE' });
  assert.throws(() => checkKey({ ...ok, keys: 3 }), { code: 'KEYS' });
  assert.throws(() => checkKey({ ...ok, allow: 0 }), { code: 'ALLOW' });
  assert.throws(() => checkKey({ ...ok, b: 15, h: 9 }), { code: 'SIZE' });
});

test('性质：推荐的标准键长代回校核必须合格', () => {
  // 审查反例：所需 L = 20.0014 mm，旧算法先舍入成 20.00 再选档，仍推荐 20 mm（代回 100.01 MPa 不合格）
  const r = checkKey({ d: 25, T: 52.506125, L: 20, type: 'A', keys: 1, allow: 100 });
  assert.equal(r.ok, false);
  assert.equal(r.LStd.A, 22);
  for (const [d, T, keys] of [[25, 52.506125, 1], [50, 500, 1], [50, 500, 2], [80, 1800, 1], [12, 9.7, 1]]) {
    for (const type of ['A', 'B', 'C']) {
      const a = checkKey({ d, T, L: 3 * selectKey(d).b, type, keys, allow: 100 });
      if (a.LStd[type] == null) continue; // 超出键长系列
      const b = checkKey({ d, T, L: a.LStd[type], type, keys, allow: 100 });
      assert.ok(b.ok, `d=${d} T=${T} ${type} ×${keys}: L=${a.LStd[type]} σ=${b.sigma}`);
    }
  }
});
