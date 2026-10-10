// 单位换算引擎测试：精确定义值、往返换算、功率–扭矩–转速。运行：node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUANTITIES, convert, convertAll, powerTorqueSpeed, PTS_CONSTANT,
  UnitsError, formatNumber, groupThousands,
} from '../units.js';

// 相对误差判断（期望值为 0 时用绝对误差）
const near = (actual, expected, tol = 1e-12, label = '') => {
  const err = expected === 0 ? Math.abs(actual) : Math.abs(actual - expected) / Math.abs(expected);
  assert.ok(err <= tol, `${label}: 实际 ${actual}，期望 ${expected}（误差 ${err}）`);
};

test('长度、质量、力的精确定义', () => {
  near(convert('length', 1, 'in', 'mm'), 25.4, 1e-14, 'in→mm');
  near(convert('length', 1, 'ft', 'm'), 0.3048, 1e-14, 'ft→m');
  near(convert('length', 1, 'mi', 'km'), 1.609344, 1e-14, 'mi→km');
  near(convert('mass', 1, 'lb', 'kg'), 0.45359237, 1e-14, 'lb→kg');
  near(convert('force', 1, 'kgf', 'N'), 9.80665, 1e-14, 'kgf→N');
  near(convert('force', 1, 'lbf', 'N'), 4.4482216152605, 1e-13, 'lbf→N');
  near(convert('force', 1, 'kip', 'kN'), 4.4482216152605, 1e-13, 'kip→kN');
});

test('压强与应力', () => {
  near(convert('pressure', 1, 'psi', 'Pa'), 6894.757293168, 1e-12, 'psi→Pa');
  near(convert('pressure', 1, 'ksi', 'MPa'), 6.894757293168, 1e-12, 'ksi→MPa');
  near(convert('pressure', 1, 'bar', 'Pa'), 1e5, 1e-14, 'bar');
  near(convert('pressure', 1, 'atm', 'Pa'), 101325, 1e-14, 'atm');
  near(convert('pressure', 1, 'mmHg', 'Pa'), 133.322387415, 1e-14, 'mmHg');
  near(convert('pressure', 1, 'kgfcm2', 'Pa'), 98066.5, 1e-14, 'kgf/cm²');
  near(convert('pressure', 1, 'kgfmm2', 'MPa'), 9.80665, 1e-14, 'kgf/mm²');
});

test('功率与能量', () => {
  near(convert('power', 1, 'hp', 'W'), 745.6998715823, 1e-12, 'hp→W');
  near(convert('power', 1, 'PS', 'W'), 735.49875, 1e-14, 'PS→W');
  near(convert('energy', 1, 'kcal', 'J'), 4184, 1e-14, 'kcal(th)→J');
  near(convert('energy', 1, 'kWh', 'MJ'), 3.6, 1e-14, 'kWh→MJ');
  near(convert('energy', 1, 'btu', 'J'), 1055.05585262, 1e-14, 'BTU→J');
});

test('扭矩', () => {
  near(convert('torque', 1, 'kgfm', 'Nm'), 9.80665, 1e-14, 'kgf·m→N·m');
  near(convert('torque', 1, 'kgfcm', 'Nm'), 0.0980665, 1e-14, 'kgf·cm→N·m');
  near(convert('torque', 1, 'lbfft', 'Nm'), 1.3558179483, 1e-10, 'lbf·ft→N·m');
  near(convert('torque', 1, 'lbfin', 'Nm'), 0.112984829, 1e-8, 'lbf·in→N·m');
  near(convert('torque', 1, 'Nm', 'Nmm'), 1000, 1e-14, 'N·m→N·mm');
  near(convert('torque', 16, 'ozfin', 'lbfin'), 1, 1e-14, 'ozf·in→lbf·in');
});

test('线速度与转速', () => {
  near(convert('speed', 1, 'mph', 'kmh'), 1.609344, 1e-14, 'mph→km/h');
  near(convert('speed', 1, 'kn', 'ms'), 1852 / 3600, 1e-14, 'kn→m/s');
  near(convert('speed', 3.6, 'kmh', 'ms'), 1, 1e-14, 'km/h→m/s');
  near(convert('rotation', 1, 'rpm', 'rads'), (2 * Math.PI) / 60, 1e-14, 'rpm→rad/s');
  near(convert('rotation', 60, 'rpm', 'rps'), 1, 1e-14, 'rpm→Hz');
  near(convert('rotation', 1, 'rpm', 'degs'), 6, 1e-14, 'rpm→°/s');
});

test('面积、体积、密度、截面参数', () => {
  near(convert('area', 1, 'in2', 'mm2'), 645.16, 1e-13, 'in²→mm²');
  near(convert('volume', 1, 'galus', 'L'), 3.785411784, 1e-13, 'US gal→L');
  near(convert('density', 7.85, 'gcm3', 'kgm3'), 7850, 1e-14, 'g/cm³→kg/m³');
  near(convert('density', 1, 'lbin3', 'kgm3'), 27679.9047, 1e-9, 'lb/in³→kg/m³');
  near(convert('inertia', 1, 'in4', 'mm4'), 416231.4256, 1e-12, 'in⁴→mm⁴');
  near(convert('inertia', 1, 'cm4', 'mm4'), 1e4, 1e-14, 'cm⁴→mm⁴');
  near(convert('modulus', 1, 'in3', 'mm3'), 16387.064, 1e-12, 'in³→mm³');
});

test('温度（仿射换算）', () => {
  near(convert('temperature', 100, 'C', 'F'), 212, 1e-12, '100°C→°F');
  near(convert('temperature', 100, 'C', 'K'), 373.15, 1e-14, '100°C→K');
  near(convert('temperature', 212, 'F', 'K'), 373.15, 1e-12, '212°F→K');
  near(convert('temperature', -40, 'C', 'F'), -40, 1e-12, '-40°C→°F');
  near(convert('temperature', -40, 'F', 'C'), -40, 1e-12, '-40°F→°C');
  near(convert('temperature', 0, 'C', 'R'), 491.67, 1e-12, '0°C→°R');
  near(convert('temperature', 32, 'F', 'C'), 0, 1e-12, '32°F→°C');
  assert.equal(convert('temperature', 0, 'K', 'C'), -273.15);
  assert.throws(() => convert('temperature', -300, 'C', 'K'), (e) => e instanceof UnitsError && e.code === 'RANGE');
});

test('每个物理量的每个单位都能往返换算', () => {
  for (const q of QUANTITIES) {
    const ids = q.units.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `${q.id} 单位 id 重复`);
    for (const a of q.units) {
      assert.ok(a.factor > 0 && Number.isFinite(a.factor), `${q.id}/${a.id} 系数无效`);
      assert.ok(a.name && a.nameZh && a.symbol, `${q.id}/${a.id} 缺少名称`);
      for (const b of q.units) {
        for (const v of [1, 123.456, 0.5]) {
          const back = convert(q.id, convert(q.id, v, a.id, b.id), b.id, a.id);
          near(back, v, 1e-12, `${q.id}: ${v} ${a.id}→${b.id}→${a.id}`);
        }
      }
    }
  }
});

test('convertAll 返回全部单位且与 convert 一致', () => {
  const all = convertAll('torque', 50, 'Nm');
  const q = QUANTITIES.find((x) => x.id === 'torque');
  assert.equal(all.length, q.units.length);
  for (const r of all) near(r.value, convert('torque', 50, 'Nm', r.unit.id), 1e-15, r.unit.id);
  assert.equal(all.find((r) => r.unit.id === 'Nm').value, 50);
});

test('非法输入抛出 UnitsError 及对应 code', () => {
  const code = (fn, c) => assert.throws(fn, (e) => e instanceof UnitsError && e.code === c);
  code(() => convert('nope', 1, 'm', 'mm'), 'QUANTITY');
  code(() => convert('length', 1, 'm', 'parsec'), 'UNIT');
  code(() => convert('length', 1, 'xx', 'mm'), 'UNIT');
  code(() => convert('length', NaN, 'm', 'mm'), 'VALUE');
  code(() => convert('length', Infinity, 'm', 'mm'), 'VALUE');
  code(() => convert('length', '5', 'm', 'mm'), 'VALUE');
  code(() => convertAll('force', 1, 'gram'), 'UNIT');
});

test('功率–扭矩–转速（常数 30000/π）', () => {
  near(PTS_CONSTANT, 9549.296585513721, 1e-15, '常数');
  const r = powerTorqueSpeed({ P: 10, n: 1450 });
  assert.equal(r.solved, 'T');
  near(r.T, 65.857, 1e-4, 'T');               // 精确常数
  assert.ok(Math.abs(r.T - (9550 * 10) / 1450) / r.T < 1e-4, '与 9550 近似式相差 < 0.01%');
  assert.equal(Math.round(r.T * 100) / 100, 65.86);
  // 解 P 与 n，互相校验
  const p = powerTorqueSpeed({ T: r.T, n: 1450 });
  near(p.P, 10, 1e-12, 'P'); assert.equal(p.solved, 'P');
  const n = powerTorqueSpeed({ P: 10, T: r.T });
  near(n.n, 1450, 1e-12, 'n'); assert.equal(n.solved, 'n');
  // T = P/ω 的物理定义
  near(r.T, 10000 / (1450 * 2 * Math.PI / 60), 1e-12, 'P/ω');
});

test('功率–扭矩–转速：非法输入', () => {
  const code = (fn, c) => assert.throws(fn, (e) => e instanceof UnitsError && e.code === c);
  code(() => powerTorqueSpeed({ P: 1 }), 'INPUT');
  code(() => powerTorqueSpeed({ P: 1, T: 2, n: 3 }), 'INPUT');
  code(() => powerTorqueSpeed(), 'INPUT');
  code(() => powerTorqueSpeed({ P: 1, n: 0 }), 'DIV0');
  code(() => powerTorqueSpeed({ P: 1, T: 0 }), 'DIV0');
  code(() => powerTorqueSpeed({ P: Infinity, n: 3 }), 'VALUE');
});

test('数字格式化', () => {
  assert.equal(formatNumber(25.400000000000002), '25.4');
  assert.equal(formatNumber(4.4482216152605), '4.448222');
  assert.equal(formatNumber(6894.757293168), '6894.757');
  assert.equal(formatNumber(1000), '1000');
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(-0), '0');
  assert.equal(formatNumber(-40.00000000001), '-40');
  assert.equal(formatNumber(1e-6), '1e-6');
  assert.equal(formatNumber(1.2345678e12), '1.234568e12');
  assert.equal(formatNumber(0.000123456789), '0.0001234568');
  assert.equal(groupThousands('1234567.891'), '1,234,567.891');
  assert.equal(groupThousands('-98066.5'), '-98,066.5');
  assert.equal(groupThousands('1234.5'), '1234.5');
  assert.equal(groupThousands('1e-6'), '1e-6');
});
