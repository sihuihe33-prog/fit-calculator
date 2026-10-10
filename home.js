// 首页：按 site.js 的工具清单生成卡片目录
import { TOOLS, detectLang, saveLang, renderNav } from './site.js';

const I18N = {
  en: {
    docTitle: 'Mechanical Design Toolbox — Fits, Bolt Torque, Gears, Shafts, Bearings, Keys',
    h1: 'Mechanical Design Toolbox',
    subtitle: 'Everyday machine design calculations',
    note: 'All calculations run locally in your browser. Values follow the cited standards and textbook methods — verify critical designs against the original sources.',
    footerText: 'Open source, runs entirely in your browser.',
    open: 'Open',
  },
  zh: {
    docTitle: '机械设计工具箱 — 公差配合、螺栓扭矩、齿轮、轴、轴承、平键',
    h1: '机械设计工具箱',
    subtitle: '机械设计常用计算，打开即用',
    note: '所有计算都在你的浏览器本地完成。数值依据页面注明的标准和教材方法，关键设计请对照原始资料核实。',
    footerText: '开源，完全在浏览器中运行。',
    open: '打开',
  },
};

let lang = detectLang();
const t = (k) => I18N[lang][k];

function renderGrid() {
  const zh = lang === 'zh';
  document.getElementById('tool-grid').innerHTML = TOOLS.map((tool) => `
    <li>
      <a class="tool-card" href="${tool.href}">
        <span class="tool-name">${zh ? tool.nameZh : tool.name}</span>
        <span class="tool-desc">${zh ? tool.descZh : tool.desc}</span>
        <span class="tool-open" aria-hidden="true">${t('open')} →</span>
      </a>
    </li>`).join('');
}

function applyLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  renderNav(lang);
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
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
