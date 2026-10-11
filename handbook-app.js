// 设计手册页：左侧章节树 + 搜索，右侧显示一节内容。
// 章节内容在 handbook/ 目录，格式见 handbook/FORMAT.md。地址形如 handbook#gear/material。
import { detectLang, saveLang, renderNav, TOOLS } from './site.js?v=dc76b3df';
import ch01 from './handbook/01-overall.js?v=496f79b6';
import ch02 from './handbook/02-belt.js?v=5fd42397';
import ch03 from './handbook/03-gear.js?v=88b685bf';
import ch04 from './handbook/04-shaft.js?v=50a85daf';
import ch05 from './handbook/05-bearing.js?v=6c491d20';
import ch06 from './handbook/06-key-coupling.js?v=125832d3';
import ch07 from './handbook/07-housing.js?v=81d4e997';
import ch08 from './handbook/08-lube-seal.js?v=132bc645';
import ch09 from './handbook/09-tolerance.js?v=91c29e98';
import ch10 from './handbook/10-fasteners.js?v=5b4ad264';

const CHAPTERS = [ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10];

/* ---------- 界面文字（正文只有中文） ---------- */
const I18N = {
  en: {
    docTitle: 'Machine Design Handbook — Reducer Course Design Reference',
    h1: 'Design Handbook',
    subtitle: 'Reference tables and methods for undergraduate machine design',
    toc: 'Contents',
    search: 'Search the handbook',
    noResult: 'No matching sections.',
    prev: 'Previous',
    next: 'Next',
    source: 'Sources',
    zhOnly: 'This handbook is written in Chinese only.',
    wip: 'This chapter is being written.',
    openTool: 'Open calculator',
    footerText: 'Open source, runs entirely in your browser.',
  },
  zh: {
    docTitle: '机械设计手册 — 减速器课程设计常用资料',
    h1: '设计手册',
    subtitle: '本科机械设计与减速器课程设计常用资料',
    toc: '目录',
    search: '搜索手册',
    noResult: '没有找到相关内容。',
    prev: '上一节',
    next: '下一节',
    source: '出处',
    zhOnly: '',
    wip: '本章正在编写中。',
    openTool: '打开计算器',
    footerText: '开源项目，全部计算在浏览器本地完成。',
  },
};

let lang = detectLang();
const t = (k) => I18N[lang][k];
const $ = (id) => document.getElementById(id);

/* ---------- 索引：所有节按顺序排成一列，方便上一节/下一节和搜索 ---------- */
const FLAT = [];
for (const ch of CHAPTERS) {
  for (const sec of ch.sections) {
    const body = plain(sec.body);
    FLAT.push({ ch, sec, key: `${ch.id}/${sec.id}`, body, text: [sec.title, ...(sec.keywords || []), body].join(' ') });
  }
}

// 把内容块里的文字拼成纯文本（简图和计算器卡片不参与搜索）
function plain(blocks) {
  const parts = [];
  const walk = (v) => {
    if (v == null) return;
    if (typeof v === 'string' || typeof v === 'number') parts.push(String(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (typeof v === 'object') for (const [k, x] of Object.entries(v)) if (k !== 'fig' && k !== 'tool') walk(x);
  };
  walk(blocks);
  return parts.join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
}

/* ---------- 内容块渲染 ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderBlock(b) {
  if (typeof b === 'string') return `<p>${b}</p>`;
  if (b.h) return `<h3>${b.h}</h3>`;
  if (b.ul) return `<ul>${b.ul.map((x) => `<li>${x}</li>`).join('')}</ul>`;
  if (b.ol) return `<ol>${b.ol.map((x) => `<li>${x}</li>`).join('')}</ol>`;
  if (b.table) return renderTable(b.table);
  if (b.eq) {
    return `<div class="hb-eq"><div class="hb-eq-row"><span class="hb-eq-body">${b.eq}</span>${b.no ? `<span class="hb-eq-no">${b.no}</span>` : ''}</div>${b.where ? `<div class="hb-eq-where">式中：${b.where}</div>` : ''}</div>`;
  }
  if (b.note) return `<div class="hb-note hb-note-${b.kind === 'warn' ? 'warn' : 'tip'}">${b.note}</div>`;
  if (b.fig) return `<figure class="hb-fig">${b.fig}${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}</figure>`;
  if (b.tool) {
    const tool = TOOLS.find((x) => x.id === b.tool);
    if (!tool) return '';
    return `<a class="hb-tool" href="${tool.href}"><span class="hb-tool-name">${lang === 'zh' ? tool.nameZh : tool.name}</span><span class="hb-tool-text">${b.text || ''}</span><span class="hb-tool-go">${t('openTool')} →</span></a>`;
  }
  return '';
}

function renderTable(tb) {
  const head = Array.isArray(tb.head[0]) ? tb.head : [tb.head];
  const cell = (c, tag) => {
    const o = c !== null && typeof c === 'object' ? c : { t: c };
    const span = `${o.cs > 1 ? ` colspan="${o.cs}"` : ''}${o.rs > 1 ? ` rowspan="${o.rs}"` : ''}`;
    return `<${tag}${span}>${o.t ?? ''}</${tag}>`;
  };
  return `<div class="hb-table"><div class="table-wrap"><table>
    <caption>${tb.caption}</caption>
    <thead>${head.map((r) => `<tr>${r.map((c) => cell(c, 'th')).join('')}</tr>`).join('')}</thead>
    <tbody>${tb.rows.map((r) => `<tr>${r.map((c) => cell(c, 'td')).join('')}</tr>`).join('')}</tbody>
  </table></div>${tb.note ? `<p class="hb-table-note">注：${tb.note}</p>` : ''}</div>`;
}

/* ---------- 左侧目录 ---------- */
function renderToc(currentKey) {
  const cur = currentKey.split('/')[0];
  $('hb-toc').innerHTML = CHAPTERS.map((ch) => `
    <details class="hb-ch"${ch.id === cur ? ' open' : ''}>
      <summary><span class="hb-ch-no">${ch.no}</span>${ch.title}</summary>
      ${ch.sections.length
        ? `<ul>${ch.sections.map((s) => {
            const key = `${ch.id}/${s.id}`;
            return `<li><a href="#${key}"${key === currentKey ? ' aria-current="true"' : ''}>${s.title}</a></li>`;
          }).join('')}</ul>`
        : `<p class="hb-wip">${t('wip')}</p>`}
    </details>`).join('');
}

/* ---------- 搜索：标题命中排在前面，正文命中附带一小段上下文 ---------- */
function renderSearch(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const hits = [];
  for (const item of FLAT) {
    const text = item.text.toLowerCase();
    if (!words.every((w) => text.includes(w))) continue;
    const inTitle = words.some((w) => item.sec.title.toLowerCase().includes(w));
    // 摘要只从正文里取；只有标题或关键词命中时，显示正文开头
    const pos = Math.max(0, item.body.toLowerCase().indexOf(words[0]));
    const snip = item.body.slice(Math.max(0, pos - 18), pos + 40);
    hits.push({ item, inTitle, snip });
  }
  hits.sort((a, b) => b.inTitle - a.inTitle);
  const mark = (s) => words.reduce((acc, w) => acc.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => `<mark>${m}</mark>`), esc(s));
  $('hb-results').innerHTML = hits.length
    ? `<ul>${hits.map(({ item, snip }) => `<li><a href="#${item.key}"><span class="hb-r-title">${mark(item.sec.title)}</span><span class="hb-r-ch">${item.ch.no} ${item.ch.title}</span><span class="hb-r-snip">…${mark(snip)}…</span></a></li>`).join('')}</ul>`
    : `<p class="hb-wip">${t('noResult')}</p>`;
}

/* ---------- 正文 ---------- */
function currentKey() {
  const key = decodeURIComponent(location.hash.slice(1));
  return FLAT.some((x) => x.key === key) ? key : FLAT[0]?.key || '';
}

function show() {
  const key = currentKey();
  const i = FLAT.findIndex((x) => x.key === key);
  const art = $('hb-article');
  if (i < 0) { art.innerHTML = `<p class="hb-wip">${t('wip')}</p>`; renderToc(''); return; }
  const { ch, sec } = FLAT[i];
  const prev = FLAT[i - 1];
  const next = FLAT[i + 1];
  art.innerHTML = `
    <p class="hb-crumb">${ch.no} ${ch.title}</p>
    <h2>${sec.title}</h2>
    ${sec.body.map(renderBlock).join('')}
    ${sec.src?.length ? `<p class="hb-src"><b>${t('source')}：</b>${sec.src.map(esc).join('；')}</p>` : ''}
    <nav class="hb-pager">
      ${prev ? `<a href="#${prev.key}" class="hb-prev"><small>${t('prev')}</small>${prev.sec.title}</a>` : '<span></span>'}
      ${next ? `<a href="#${next.key}" class="hb-next"><small>${t('next')}</small>${next.sec.title}</a>` : '<span></span>'}
    </nav>`;
  renderToc(key);
  document.title = `${sec.title} · ${t('docTitle')}`;
  // 手机上点了目录里的链接后收起抽屉
  document.body.classList.remove('hb-toc-open');
}

/* ---------- 语言 ---------- */
function applyLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  $('hb-q').placeholder = t('search');
  $('hb-zh-only').hidden = lang === 'zh';
  $('hb-zh-only').textContent = t('zhOnly');
  document.querySelectorAll('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  renderNav(lang);
  show();
  const q = $('hb-q').value.trim();
  if (q) renderSearch(q);
}

document.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => {
  lang = b.dataset.lang;
  saveLang(lang);
  applyLang();
}));

$('hb-q').addEventListener('input', () => {
  const q = $('hb-q').value.trim();
  $('hb-results').hidden = !q;
  $('hb-toc').hidden = !!q;
  if (q) renderSearch(q);
});

$('hb-toc-btn').addEventListener('click', () => document.body.classList.toggle('hb-toc-open'));
$('hb-scrim').addEventListener('click', () => document.body.classList.remove('hb-toc-open'));

window.addEventListener('hashchange', () => {
  show();
  // 切换小节后回到正文顶部（宽屏时侧栏不动）
  $('hb-article').scrollIntoView({ block: 'start' });
});

applyLang();
document.documentElement.classList.remove('i18n-pending');
