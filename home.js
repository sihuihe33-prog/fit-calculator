// 首页：按 site.js 的工具清单生成卡片目录
import { TOOLS, detectLang, saveLang, renderNav } from './site.js?v=bf0267f5';

const I18N = {
  en: {
    docTitle: 'Mechanical Design Toolbox — Fits, Bolt Torque, Gears, Shafts, Bearings, Keys',
    h1: 'Mechanical Design Toolbox',
    subtitle: 'Everyday machine design calculations',
    eyebrow: 'Free · No sign-up · Works offline',
    heroTitle: 'Machine design calculations,<br>ready when you are',
    heroText: 'Fits, bolt torque, gears, shafts, bearings, keys and units — based on ISO, GB and VDI standards and classic textbook methods. Every result can be copied or shared as a link.',
    stat1: '{n} tools',
    stat2: 'GB · ISO · VDI',
    stat3: 'Runs in your browser',
    gridTitle: 'Tools',
    note: 'All calculations run locally in your browser. Values follow the cited standards and textbook methods — verify critical designs against the original sources.',
    footerText: 'Open source, runs entirely in your browser.',
    open: 'Open',
  },
  zh: {
    docTitle: '机械设计工具箱 — 公差配合、螺栓扭矩、齿轮、轴、轴承、平键',
    h1: '机械设计工具箱',
    subtitle: '机械设计常用计算，打开即用',
    eyebrow: '免费 · 无需注册 · 离线可用',
    heroTitle: '机械设计常用计算，<br>打开就能算',
    heroText: '公差配合、螺栓扭矩、齿轮、轴、轴承、平键、单位换算——依据 ISO、GB、VDI 标准和经典教材方法，每个结果都能一键复制、用链接分享。',
    stat1: '{n} 个工具',
    stat2: 'GB · ISO · VDI',
    stat3: '浏览器本地计算',
    gridTitle: '全部工具',
    note: '所有计算都在你的浏览器本地完成。数值依据页面注明的标准和教材方法，关键设计请对照原始资料核实。',
    footerText: '开源，完全在浏览器中运行。',
    open: '打开',
  },
};

// 每个工具的线条图标（24×24，描边随文字颜色）
const ICONS = {
  fit: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v4M12 17v4"/>',
  bolt: '<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><circle cx="12" cy="12" r="3.4"/>',
  gear: '<circle cx="12" cy="12" r="6.2"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2.5v3.3M12 18.2v3.3M2.5 12h3.3M18.2 12h3.3M5.3 5.3l2.3 2.3M16.4 16.4l2.3 2.3M5.3 18.7l2.3-2.3M16.4 7.6l2.3-2.3"/>',
  shaft: '<path d="M2.5 10.5h3v3h-3zM5.5 8h7v8h-7zM12.5 9.5h6v5h-6zM18.5 11h3v2h-3z"/>',
  bearing: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="3.5"/><circle cx="12" cy="5.6" r="1.4"/><circle cx="12" cy="18.4" r="1.4"/><circle cx="5.6" cy="12" r="1.4"/><circle cx="18.4" cy="12" r="1.4"/>',
  key: '<circle cx="12" cy="13.5" r="8"/><path d="M9.6 3.8h4.8v5.4H9.6z"/><circle cx="12" cy="13.5" r="2.5"/>',
  units: '<path d="M4 8.5h14M14.5 5l3.5 3.5-3.5 3.5M20 15.5H6M9.5 12 6 15.5 9.5 19"/>',
};

// 每个工具的主题色：浅色模式 / 深色模式
const COLORS = {
  fit: ['#2563eb', '#60a5fa'],
  bolt: ['#ea580c', '#fb923c'],
  gear: ['#7c3aed', '#a78bfa'],
  shaft: ['#0d9488', '#2dd4bf'],
  bearing: ['#db2777', '#f472b6'],
  key: ['#16a34a', '#4ade80'],
  units: ['#475569', '#94a3b8'],
};

let lang = detectLang();
const t = (k) => I18N[lang][k];

function renderGrid() {
  const zh = lang === 'zh';
  document.getElementById('tool-grid').innerHTML = TOOLS.map((tool) => {
    const [c, cd] = COLORS[tool.id] || COLORS.units;
    return `
    <li>
      <a class="tool-card" href="${tool.href}" style="--c:${c};--cd:${cd}">
        <span class="tool-head">
          <span class="tool-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[tool.id] || ''}</svg>
          </span>
          <span class="tool-tag">${zh ? tool.tagZh : tool.tag}</span>
        </span>
        <span class="tool-name">${zh ? tool.nameZh : tool.name}</span>
        <span class="tool-desc">${zh ? tool.descZh : tool.desc}</span>
        <span class="tool-open">${t('open')} <span aria-hidden="true">→</span></span>
      </a>
    </li>`;
  }).join('');
}

function applyLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  renderNav(lang);
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n).replace('{n}', TOOLS.length); });
  document.querySelectorAll('[data-i18n-html]').forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
  for (const b of document.querySelectorAll('.lang button')) {
    b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
  }
  renderGrid();
}

for (const b of document.querySelectorAll('.lang button')) {
  b.addEventListener('click', () => {
    lang = b.dataset.lang;
    saveLang(lang);
    applyLang();
  });
}

applyLang();
document.documentElement.classList.remove('i18n-pending');
