// 全站共享：工具清单、语言检测与保存、顶部导航
// 新增工具时只需在 TOOLS 里加一项，导航和首页目录会自动更新。

export const LANG_KEY = 'fitcalc-lang';

export const TOOLS = [
  { id: 'fit', href: 'fit.html', tag: 'ISO 286', tagZh: 'ISO 286', name: 'Fits & Tolerances', nameZh: '公差配合', desc: 'ISO 286 hole/shaft limits, clearance and interference.', descZh: 'ISO 286 孔轴极限偏差、间隙与过盈。' },
  { id: 'bolt', href: 'bolt.html', tag: 'VDI 2230', tagZh: 'VDI 2230', name: 'Bolt Torque', nameZh: '螺栓扭矩', desc: 'Tightening torque and preload per VDI 2230.', descZh: '按 VDI 2230 计算拧紧扭矩与预紧力。' },
  { id: 'gear', href: 'gear.html', tag: 'GB/T 1356', tagZh: 'GB/T 1356', name: 'Spur Gears', nameZh: '齿轮参数', desc: 'Spur gear geometry with profile shift and contact ratio.', descZh: '直齿圆柱齿轮几何尺寸、变位与重合度。' },
  { id: 'shaft', href: 'shaft.html', tag: 'Textbook method', tagZh: '濮良贵《机械设计》', name: 'Shaft Strength', nameZh: '轴的强度', desc: 'Minimum diameter from torsion and combined bending–torsion check.', descZh: '按扭转估算轴径，按弯扭合成校核。' },
  { id: 'bearing', href: 'bearing.html', tag: 'ISO 281', tagZh: 'ISO 281', name: 'Bearing Life', nameZh: '轴承寿命', desc: 'Equivalent dynamic load and L10 rating life.', descZh: '当量动载荷与基本额定寿命 L10h。' },
  { id: 'key', href: 'key.html', tag: 'GB/T 1096', tagZh: 'GB/T 1096', name: 'Parallel Keys', nameZh: '平键连接', desc: 'GB/T 1096 key sizes and bearing-pressure check.', descZh: 'GB/T 1096 平键尺寸与挤压强度校核。' },
  { id: 'units', href: 'units.html', tag: 'SI', tagZh: 'SI', name: 'Unit Converter', nameZh: '单位换算', desc: 'Force, torque, stress, power, speed and more.', descZh: '力、扭矩、应力、功率、转速等工程单位。' },
];

export function detectLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch (e) { /* 隐私模式等情况下 localStorage 不可用 */ }
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function saveLang(lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* 忽略 */ }
}

// 填充页面里的 <nav id="site-nav">；当前页由 <body data-tool="..."> 决定
export function renderNav(lang) {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  const current = document.body.dataset.tool || 'home';
  const zh = lang === 'zh';
  const items = [{ id: 'home', href: 'index.html', name: 'Home', nameZh: '首页' }, ...TOOLS];
  nav.setAttribute('aria-label', zh ? '工具' : 'Tools');
  nav.innerHTML = items
    .map((t) => `<a href="${t.href}"${t.id === current ? ' aria-current="page"' : ''}>${zh ? t.nameZh : t.name}</a>`)
    .join('');
  const active = nav.querySelector('[aria-current="page"]');
  // 手机上导航横向滚动时，把当前页滚到可见位置
  if (active && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = active.offsetLeft - nav.clientWidth / 2 + active.offsetWidth / 2;
  }
}
