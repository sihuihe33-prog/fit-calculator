// 用 ISO 286-2 表中的已知数值校验计算引擎：node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { itValue, shaftLimits, holeLimits, calcFit, parseFit, Iso286Error, PREFERRED_FITS } from '../iso286.js';

const lim = (upper, lower) => ({ upper, lower });

test('标准公差 IT 值', () => {
  assert.equal(itValue(2, 1), 0.8);
  assert.equal(itValue(25, 7), 21);
  assert.equal(itValue(30, 7), 21); // 30 属于 18–30 段（含上限）
  assert.equal(itValue(30.01, 7), 25);
  assert.equal(itValue(500, 18), 9700);
  assert.throws(() => itValue(0.5, 14), Iso286Error);
});

test('轴：基本偏差 a–h（上偏差 es）', () => {
  assert.deepEqual(shaftLimits(25, 'g', 6), lim(-7, -20));
  assert.deepEqual(shaftLimits(50, 'f', 7), lim(-25, -50));
  assert.deepEqual(shaftLimits(10, 'c', 11), lim(-80, -170));
  assert.deepEqual(shaftLimits(25, 'd', 9), lim(-65, -117));
  assert.deepEqual(shaftLimits(40, 'e', 8), lim(-50, -89));
  assert.deepEqual(shaftLimits(25, 'h', 6), lim(0, -13));
  assert.deepEqual(shaftLimits(100, 'a', 11), lim(-380, -600));
});

test('轴：基本偏差 j–u（下偏差 ei）', () => {
  assert.deepEqual(shaftLimits(40, 'k', 6), lim(18, 2));
  assert.deepEqual(shaftLimits(25, 'k', 8), lim(33, 0)); // IT8 以上 k 的 ei = 0
  assert.deepEqual(shaftLimits(25, 'n', 6), lim(28, 15));
  assert.deepEqual(shaftLimits(25, 'p', 6), lim(35, 22));
  assert.deepEqual(shaftLimits(70, 'r', 6), lim(62, 43));
  assert.deepEqual(shaftLimits(60, 's', 6), lim(72, 53));
  assert.deepEqual(shaftLimits(25, 't', 6), lim(54, 41));
  assert.deepEqual(shaftLimits(120, 'u', 6), lim(166, 144));
  assert.deepEqual(shaftLimits(25, 'j', 6), lim(9, -4));
});

test('轴：js 对称偏差及奇数取整', () => {
  assert.deepEqual(shaftLimits(25, 'js', 6), lim(6.5, -6.5));
  assert.deepEqual(shaftLimits(25, 'js', 7), lim(10, -10)); // IT7 = 21 为奇数，取 20/2
});

test('轴：未定义的组合会报错', () => {
  assert.throws(() => shaftLimits(20, 't', 6), { code: 'NOT_DEFINED' }); // t 只在 24 mm 以上
  assert.throws(() => shaftLimits(25, 'j', 8), { code: 'NOT_DEFINED' });
  assert.throws(() => shaftLimits(25, 'j', 9), { code: 'NOT_DEFINED' });
  assert.throws(() => shaftLimits(0.8, 'a', 11), { code: 'NOT_DEFINED' });
});

test('孔：A–H 通用规则', () => {
  assert.deepEqual(holeLimits(25, 'H', 7), lim(21, 0));
  assert.deepEqual(holeLimits(50, 'H', 8), lim(39, 0));
  assert.deepEqual(holeLimits(10, 'H', 11), lim(90, 0));
  assert.deepEqual(holeLimits(25, 'G', 7), lim(28, 7));
  assert.deepEqual(holeLimits(25, 'F', 8), lim(53, 20));
});

test('孔：J、K、M、N 及 Δ 特殊规则', () => {
  assert.deepEqual(holeLimits(25, 'J', 7), lim(12, -9));
  assert.deepEqual(holeLimits(25, 'K', 7), lim(6, -15));
  assert.deepEqual(holeLimits(25, 'K', 8), lim(10, -23));
  assert.deepEqual(holeLimits(2, 'K', 7), lim(0, -10));
  assert.deepEqual(holeLimits(25, 'M', 7), lim(0, -21));
  assert.deepEqual(holeLimits(300, 'M', 6), lim(-9, -41)); // 标准特例
  assert.deepEqual(holeLimits(25, 'N', 7), lim(-7, -28));
  assert.deepEqual(holeLimits(2, 'N', 9), lim(-4, -29));
  assert.deepEqual(holeLimits(5, 'N', 9), lim(0, -30));
  assert.deepEqual(holeLimits(25, 'JS', 7), lim(10, -10));
});

test('孔：P–U，≤IT7 加 Δ，>IT7 不加', () => {
  assert.deepEqual(holeLimits(25, 'P', 7), lim(-14, -35));
  assert.deepEqual(holeLimits(25, 'P', 8), lim(-22, -55));
  assert.deepEqual(holeLimits(25, 'S', 7), lim(-27, -48));
  assert.deepEqual(holeLimits(25, 'U', 7), lim(-40, -61));
  assert.throws(() => holeLimits(20, 'T', 7), { code: 'NOT_DEFINED' });
});

test('配合计算与类型判定', () => {
  const f = calcFit(25, 'H7/g6');
  assert.equal(f.maxClearance, 41);
  assert.equal(f.minClearance, 7);
  assert.equal(f.type, 'clearance');
  assert.equal(f.hole.code, 'H7');
  assert.equal(f.shaft.code, 'g6');
  assert.equal(calcFit(25, 'H7/h6').type, 'clearance'); // 最小间隙为 0 仍算间隙配合
  assert.equal(calcFit(25, 'H7/k6').type, 'transition');
  assert.equal(calcFit(25, 'H7/s6').type, 'interference');
  assert.equal(calcFit(25, 'H7/s6').maxClearance, -14);
});

test('优先配合在常用尺寸下都能算出且类型一致', () => {
  for (const { fit, type } of PREFERRED_FITS) {
    assert.equal(calcFit(50, fit).type, type, fit);
  }
});

test('输入解析与错误', () => {
  assert.deepEqual(parseFit(' h7 / G6 '), { hole: { letter: 'H', grade: 7 }, shaft: { letter: 'g', grade: 6 } });
  assert.deepEqual(parseFit('JS7/js6').shaft, { letter: 'js', grade: 6 });
  assert.throws(() => parseFit('H7g6'), { code: 'PARSE' });
  assert.throws(() => parseFit('Z7/z6'), { code: 'PARSE' });
  assert.throws(() => calcFit(0, 'H7/g6'), { code: 'SIZE_RANGE' });
  assert.throws(() => calcFit(501, 'H7/g6'), { code: 'SIZE_RANGE' });
  assert.throws(() => calcFit(25, 'H19/g6'), { code: 'NOT_DEFINED' });
});
