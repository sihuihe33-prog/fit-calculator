// 设计手册内容格式检查（格式约定见 handbook/FORMAT.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';

const DIR = new URL('../handbook/', import.meta.url);
const files = readdirSync(DIR).filter((f) => f.endsWith('.js')).sort();
const chapters = [];
for (const f of files) chapters.push({ file: f, ch: (await import(new URL(f, DIR))).default });

const TOOL_IDS = ['fit', 'bolt', 'gear', 'shaft', 'bearing', 'key', 'units'];
const ALLOWED_TAGS = new Set(['b', 'i', 'sub', 'sup', 'br', 'code', 'a']);
const BLOCK_KEYS = ['h', 'ul', 'ol', 'table', 'eq', 'note', 'fig', 'tool'];

const allKeys = new Set();
for (const { ch } of chapters) for (const s of ch.sections) allKeys.add(`${ch.id}/${s.id}`);

// 检查一段内联 HTML：只允许少数标签，站内链接必须指向存在的小节
function checkInline(html, where, links) {
  for (const m of String(html).matchAll(/<\/?([a-zA-Z0-9]+)([^>]*)>/g)) {
    const tag = m[1].toLowerCase();
    assert.ok(ALLOWED_TAGS.has(tag), `${where}：不允许的标签 <${tag}>`);
    assert.ok(!/style\s*=/.test(m[2]), `${where}：不要写 style`);
    if (tag === 'a' && !m[0].startsWith('</')) {
      const href = /href="([^"]*)"/.exec(m[2])?.[1];
      assert.ok(href && href.startsWith('#'), `${where}：<a> 只能链接到手册内部（#章/节）`);
      links.push({ href: href.slice(1), where });
    }
  }
}

// 表格：展开 rowspan/colspan 后每行列数必须等于表头列数
function checkTable(tb, where, links) {
  assert.ok(tb.caption, `${where}：表格缺少 caption`);
  checkInline(tb.caption, where, links);
  const head = Array.isArray(tb.head?.[0]) ? tb.head : [tb.head];
  assert.ok(head[0]?.length, `${where}：表格缺少 head`);
  const width = (rows, label) => {
    const carry = [];  // carry[col] = 还要占掉几行
    let cols = null;
    rows.forEach((row, r) => {
      assert.ok(Array.isArray(row), `${where} ${label}第 ${r + 1} 行不是数组`);
      let col = 0;
      const next = [];
      const skip = () => { while (carry[col] > 0) { next[col] = carry[col] - 1; col++; } };
      for (const c of row) {
        skip();
        const o = c !== null && typeof c === 'object' ? c : { t: c };
        assert.ok(o.t !== undefined, `${where} ${label}第 ${r + 1} 行有空单元格对象`);
        checkInline(o.t, `${where} ${label}第 ${r + 1} 行`, links);
        const cs = o.cs || 1;
        const rs = o.rs || 1;
        for (let k = 0; k < cs; k++) next[col + k] = rs - 1;
        col += cs;
      }
      skip();
      if (cols === null) cols = col;
      assert.equal(col, cols, `${where} ${label}第 ${r + 1} 行列数 ${col}，应为 ${cols}`);
      for (let k = 0; k < Math.max(carry.length, next.length); k++) carry[k] = next[k] || 0;
    });
    assert.ok(carry.every((x) => !x), `${where} ${label}最后有跨行超出表格`);
    return cols;
  };
  const hw = width(head, '表头');
  assert.ok(Array.isArray(tb.rows) && tb.rows.length, `${where}：表格没有数据行`);
  const bw = width(tb.rows, '');
  assert.equal(bw, hw, `${where}：数据列数 ${bw} 与表头列数 ${hw} 不一致`);
  if (tb.note) checkInline(tb.note, where, links);
}

function checkBlock(b, where, links) {
  if (typeof b === 'string') return checkInline(b, where, links);
  assert.ok(b && typeof b === 'object', `${where}：内容块必须是字符串或对象`);
  const key = BLOCK_KEYS.find((k) => k in b);
  assert.ok(key, `${where}：未知的内容块 ${JSON.stringify(b).slice(0, 60)}`);
  if (key === 'h') checkInline(b.h, where, links);
  if (key === 'ul' || key === 'ol') {
    assert.ok(Array.isArray(b[key]) && b[key].length, `${where}：列表为空`);
    b[key].forEach((x) => checkInline(x, where, links));
  }
  if (key === 'table') checkTable(b.table, where, links);
  if (key === 'eq') { checkInline(b.eq, where, links); if (b.where) checkInline(b.where, where, links); }
  if (key === 'note') {
    checkInline(b.note, where, links);
    assert.ok(!b.kind || b.kind === 'tip' || b.kind === 'warn', `${where}：note.kind 只能是 tip 或 warn`);
  }
  if (key === 'fig') {
    assert.match(b.fig, /^<svg[^>]*viewBox="/, `${where}：fig 必须是带 viewBox 的内联 SVG`);
    assert.ok(!/^<svg[^>]*\s(width|height)="/.test(b.fig), `${where}：SVG 根元素不要写 width/height`);
    assert.ok(!/#[0-9a-fA-F]{3,6}\b|rgb\(/.test(b.fig), `${where}：SVG 不要写死颜色，用 currentColor`);
    assert.ok(!/<script|on\w+=/i.test(b.fig), `${where}：SVG 里不能有脚本`);
  }
  if (key === 'tool') assert.ok(TOOL_IDS.includes(b.tool), `${where}：tool 只能是 ${TOOL_IDS.join(' ')}`);
}

test('章节编号连续、id 唯一', () => {
  const ids = new Set();
  chapters.forEach(({ file, ch }, i) => {
    assert.equal(ch.no, i + 1, `${file}：章号应为 ${i + 1}`);
    assert.match(file, new RegExp(`^${String(i + 1).padStart(2, '0')}-`), `${file}：文件名应以章号开头`);
    assert.match(ch.id, /^[a-z]+$/, `${file}：章节 id 只用小写字母`);
    assert.ok(!ids.has(ch.id), `${file}：章节 id 重复`);
    ids.add(ch.id);
    assert.ok(ch.title, `${file}：缺少 title`);
    assert.ok(Array.isArray(ch.sections), `${file}：sections 必须是数组`);
  });
});

for (const { file, ch } of chapters) {
  test(`${file} 内容格式`, () => {
    const ids = new Set();
    const links = [];
    for (const s of ch.sections) {
      const where = `${file} #${ch.id}/${s.id}`;
      assert.match(s.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${where}：节 id 只用小写字母、数字和连字符`);
      assert.ok(!ids.has(s.id), `${where}：节 id 重复`);
      ids.add(s.id);
      assert.ok(s.title, `${where}：缺少 title`);
      assert.ok(Array.isArray(s.src) && s.src.length && s.src.every((x) => typeof x === 'string' && x), `${where}：src 至少写一条出处`);
      assert.ok(Array.isArray(s.body) && s.body.length, `${where}：body 为空`);
      if (s.keywords) assert.ok(Array.isArray(s.keywords), `${where}：keywords 必须是数组`);
      s.body.forEach((b, i) => checkBlock(b, `${where} 第 ${i + 1} 块`, links));
    }
    for (const l of links) assert.ok(allKeys.has(l.href), `${l.where}：链接 #${l.href} 指向不存在的小节`);
  });
}
