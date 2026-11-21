import { Collection, ReferenceItem } from '../types/refto';

export const COLOR_FILTERS = [
  { id: 'all', hex: '', labelZh: '全部', labelEn: 'All' },
  { id: 'cobalt', hex: '#1B498B', labelZh: '钴蓝', labelEn: 'Cobalt' },
  { id: 'charcoal', hex: '#1F2428', labelZh: '深炭', labelEn: 'Charcoal' },
  { id: 'travertine', hex: '#DED8CE', labelZh: '石灰岩', labelEn: 'Travertine' },
  { id: 'slate', hex: '#6E7A85', labelZh: '冷灰', labelEn: 'Slate' },
  { id: 'amber', hex: '#B78448', labelZh: '暖铜', labelEn: 'Bronze' },
];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-saas',
    nameZh: 'SaaS 着陆页与转化流',
    nameEn: 'SaaS Landing & Flows',
    descriptionZh: '结构清晰的软件官网首屏、功能网格与对比度管理案例',
    descriptionEn: 'Clean product-marketing hero sections and Swiss grid SaaS sites',
  },
  {
    id: 'col-editorial',
    nameZh: '极简建筑与作品集',
    nameEn: 'Editorial & Studios',
    descriptionZh: '衬线大标题、非对称摄影画廊与留白克制的数字展厅',
    descriptionEn: 'Serif display pairings, asymmetric photography grids, and quiet whitespace',
  },
  {
    id: 'col-fluent',
    nameZh: 'Fluent 桌面界面参考',
    nameEn: 'Fluent Desktop UI',
    descriptionZh: 'Windows 11 云母层叠、高密度数据表格与音频交互反馈',
    descriptionEn: 'Mica surface hierarchies, high-density tables, and tactile sound cues',
  },
  {
    id: 'col-swiss',
    nameZh: '瑞士网格与工业美学',
    nameEn: 'Swiss Grid & Industrial',
    descriptionZh: '几何构成海报、精密硬件产品页与 3D 光学折射关键帧',
    descriptionEn: 'Geometric typographic posters, precision hardware specs, and 3D lighting',
  },
];

export const INITIAL_ITEMS: ReferenceItem[] = [
  {
    id: 'ref-01',
    title: 'Strata — B2B 协同平台官网首屏',
    type: 'web',
    imageUrl: '/src/assets/images/ref_saas_landing_1795252543056.jpg',
    sourceUrl: 'https://refto.one/sites/strata-workflow',
    domain: 'strata.design',
    collectionId: 'col-saas',
    tags: ['SaaS', '首屏结构', '黑白对比', '四列特性'],
    colors: ['#1E262A', '#F9FAFB', '#0F1417', '#6C757D', '#DCE1E6'],
    dimensions: '1440 × 900',
    fileSizeBytes: 1842000,
    createdAt: '2026-11-18T09:24:00Z',
    starred: true,
    rating: 5,
    acdLabel: 'green',
    notes:
      '深石板色 Hero 区块右侧嵌入可信产品控制台缩略图，下方接四列等宽图标特性区，整体信息层级非常克制。',
  },
  {
    id: 'ref-02',
    title: 'Aura Architects — 建筑事务所数字展厅',
    type: 'web',
    imageUrl: '/src/assets/images/ref_editorial_portfolio_1795252541494.jpg',
    sourceUrl: 'https://refto.one/sites/aura-architects',
    domain: 'aura-arch.studio',
    collectionId: 'col-editorial',
    tags: ['建筑摄影', '衬线排版', '非对称网格', '暖灰中性色'],
    colors: ['#E6E1D6', '#2B2926', '#7A7367', '#9C8A74', '#4B575E'],
    dimensions: '1440 × 1080',
    fileSizeBytes: 2410000,
    createdAt: '2026-11-17T16:12:00Z',
    starred: true,
    rating: 5,
    acdLabel: 'blue',
    notes:
      '大号紧凑衬线体占据视觉重心，正文仅用 12px 极简说明。右侧索引列配合细分割线形成类似画册目录的浏览节奏。',
  },
  {
    id: 'ref-03',
    title: 'AeroFlow Studio — Windows 11 桌面控制台',
    type: 'ui',
    imageUrl: '/src/assets/images/ref_ai_workspace_1795252541555.jpg',
    sourceUrl: 'https://refto.one/ui/aeroflow-studio',
    domain: 'aeroflow.app',
    collectionId: 'col-fluent',
    tags: ['WinUI 3', '云母侧栏', '数据表格', '单色图表'],
    colors: ['#8BA0B4', '#1A1E22', '#262B30', '#2E78D2', '#E5E9EE'],
    dimensions: '1600 × 900',
    fileSizeBytes: 1965000,
    createdAt: '2026-11-16T11:40:00Z',
    starred: false,
    rating: 4,
    acdLabel: 'blue',
    notes:
      '左侧半透明 Mica 导航栏与主内容深色数据面板形成明确层深对比；底部折线与柱状图采用克制的灰度层级，避免过饱和彩虹色。',
  },
  {
    id: 'ref-04',
    title: 'Aurum Audio — 精密黑胶硬件展示页',
    type: 'web',
    imageUrl: '/src/assets/images/ref_hardware_product_1795252541662.jpg',
    sourceUrl: 'https://refto.one/sites/aurum-turntable',
    domain: 'aurumaudio.com',
    collectionId: 'col-swiss',
    tags: ['硬件电商', '拉丝铝材质', '技术参数表', '暗调光影'],
    colors: ['#161719', '#9BA1A6', '#D4D6D8', '#3C3F42', '#64696E'],
    dimensions: '1440 × 1080',
    fileSizeBytes: 2790000,
    createdAt: '2026-11-15T20:05:00Z',
    starred: true,
    rating: 4,
    acdLabel: 'yellow',
    notes:
      '底部 6 列规格参数网格用极细分割线组织工程数据（转速精度、信噪比、净重），兼顾奢侈品视觉张力与工程师可读性。',
  },
  {
    id: 'ref-05',
    title: 'Zürich 2024 — 瑞士现代主义平面海报',
    type: 'print',
    imageUrl: '/src/assets/images/ref_typography_poster_1795252541875.jpg',
    sourceUrl: 'https://refto.one/print/zurich-grid',
    domain: 'museum-gestaltung.ch',
    collectionId: 'col-swiss',
    tags: ['瑞士网格', '钴蓝与米白', '几何排版', '展览海报'],
    colors: ['#193B80', '#EAE4D7', '#14171A', '#8F897B', '#485E8C'],
    dimensions: '1200 × 1600',
    fileSizeBytes: 2150000,
    createdAt: '2026-11-14T14:30:00Z',
    starred: false,
    rating: 4,
    acdLabel: 'purple',
    notes:
      '严格的模数网格分割线直接作为视觉结构元素，仅使用深钴蓝与碳黑双色印刷，形成高度统一的秩序感。',
  },
  {
    id: 'ref-06',
    title: 'Fluted Titanium — 长虹玻璃与钛金属光学研究',
    type: 'motion',
    imageUrl: '/src/assets/images/ref_motion_3d_frame_1795252540809.jpg',
    sourceUrl: 'https://refto.one/motion/fluted-glass',
    domain: 'studio-refract.io',
    collectionId: 'col-swiss',
    tags: ['3D 渲染', '长虹玻璃', '焦散光影', '材质研究'],
    colors: ['#C9C2B6', '#4E5256', '#8A8378', '#DED8CE', '#25282C'],
    dimensions: '1920 × 1080',
    fileSizeBytes: 3120000,
    createdAt: '2026-11-13T08:15:00Z',
    starred: false,
    rating: 3,
    acdLabel: 'none',
    notes:
      '用于研究 Windows Fluent Acrylic 材质背后的真实物理光学折射：柔和的漫反射阴影与垂直纹理对高光的打散效果。',
  },
  {
    id: 'ref-07',
    title: 'Fluent Chime — Windows 桌面完成提示音',
    type: 'audio',
    audioPreset: 'fluent-chime',
    durationSec: 2,
    collectionId: 'col-fluent',
    tags: ['系统音效', '微交互听觉', '正弦和弦'],
    colors: ['#0067C0', '#4CC2FF', '#1F2428'],
    dimensions: '48 kHz · Stereo',
    fileSizeBytes: 184000,
    createdAt: '2026-11-12T17:45:00Z',
    starred: false,
    rating: 3,
    acdLabel: 'none',
    notes:
      '由大调四音正弦波渐弱包络构成的桌面通知参考音。适合文件入库完成或批处理结束时的非打扰式反馈。',
  },
  {
    id: 'ref-08',
    title: 'WinUI 3 间距与圆角嵌套规范备忘录',
    type: 'doc',
    collectionId: 'col-fluent',
    tags: ['设计规范', 'Fluent 2', '圆角公式', '对比度'],
    colors: ['#F3F3F3', '#0067C0', '#202020'],
    dimensions: 'Markdown · 4 节',
    fileSizeBytes: 42600,
    createdAt: '2026-11-11T10:00:00Z',
    starred: true,
    rating: 5,
    acdLabel: 'green',
    notes:
      '整理 Windows 11 桌面应用的层深、内边距与键盘焦点规范，作为日常 UI 评审的快速检查清单。',
    docContent: `WinUI 3 / Fluent 2 桌面布局核心摘要

1. 云母材质与表面层级 (Mica & Layering)
   - 底层窗口画布采用低对比度 Mica 噪点微调（亮色 #F3F3F3，暗色 #202020）。
   - 工作区卡片表面提升一级（亮色 #FFFFFF，暗色 #2B2B2B），配合 1px 发丝边框。

2. 圆角同心计算 (Nested Corner Radius)
   - 外层窗口与悬浮面板：8px–12px。
   - 内部列表项与输入框：4px–6px（r_inner = r_outer - padding）。

3. ACDSee 风格极速看图与管理快捷键
   - Space / 双击：极速看图模式（支持滚轮缩放、拖拽平移、胶片缩略图带）
   - 1–5 数字键：为当前参考图快速评定星级
   - L / R / H / V：左旋 90°、右旋 90°、水平/垂直镜像翻转
   - E：打开 Canvas 离线修图面板（裁剪、亮度、对比度、格式转换导出）`,
  },
];
