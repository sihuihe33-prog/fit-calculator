// 给页面里引用的 .js / .css 加上内容指纹（?v=xxxxxxxx），防止浏览器用旧缓存。
// 文件内容一变，指纹就变，引用地址随之改变，浏览器只能重新下载。
// 用法：每次提交前在项目根目录运行 node scripts/stamp.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url);
// 根目录的页面/脚本/样式，加上 handbook/ 目录里的手册章节（章节文件是纯数据，不再引用别的文件）
const files = [
  ...readdirSync(ROOT).filter((f) => /\.(html|js|css)$/.test(f)),
  ...readdirSync(new URL('handbook/', ROOT)).filter((f) => f.endsWith('.js')).map((f) => 'handbook/' + f),
];
const read = (f) => readFileSync(new URL(f, ROOT), 'utf8');

// 匹配 HTML 的 src="x.js" / href="x.css"，以及 JS 的 from './x.js'，已有的 ?v= 会被替换
const REF = /((?:src|href)="|from\s+'\.\/)((?:handbook\/)?[\w-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(["'])/g;

// 指纹要包含被引用文件里的指纹，所以反复计算直到不再变化（依赖层数很浅，几轮就稳定）
const hashOf = (text) => createHash('sha256').update(text.replace(/\?v=[0-9a-f]+/g, '')).digest('hex').slice(0, 8);
let changed = new Set();
for (let pass = 0; pass < 10; pass++) {
  const hashes = Object.fromEntries(files.filter((f) => !f.endsWith('.html')).map((f) => [f, null]));
  // 先算叶子：内容里所有引用都换成当前指纹后再取哈希
  for (const f of Object.keys(hashes)) hashes[f] = hashOf(read(f) + JSON.stringify(depsHashes(read(f))));
  let dirty = false;
  for (const f of files) {
    const before = read(f);
    const after = before.replace(REF, (m, pre, name, post) => (name in hashes ? `${pre}${name}?v=${hashes[name]}${post}` : m));
    if (after !== before) { writeFileSync(new URL(f, ROOT), after); changed.add(f); dirty = true; }
  }
  if (!dirty) break;
}

// 文件引用了哪些本地文件（只看文件名，不看指纹）
function depsHashes(text) {
  return [...text.matchAll(REF)].map((m) => m[2]).sort().map((n) => n + ':' + safeRead(n));
}
function safeRead(n) { try { return hashOf(read(n)); } catch { return ''; } }

console.log(changed.size ? `已更新指纹：${[...changed].join(', ')}` : '指纹已是最新，无需改动');
