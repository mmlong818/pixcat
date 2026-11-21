import React, { useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Keyboard,
  HardDrive,
  Monitor,
  Layers,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';
import { Collection, Language, ReferenceItem } from '../types/refto';
import { formatBytes } from '../utils/storage';

interface WindowsEditionViewProps {
  lang: Language;
  items: ReferenceItem[];
  collections: Collection[];
  isInstallable: boolean;
  isInstalled: boolean;
  offlineReady: boolean;
  onInstallPWA: () => void;
  onMountLocalFolder: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onResetLibrary: () => void;
}

export const WindowsEditionView: React.FC<WindowsEditionViewProps> = ({
  lang,
  items,
  collections,
  isInstallable,
  isInstalled,
  offlineReady,
  onInstallPWA,
  onMountLocalFolder,
  onExportBackup,
  onImportBackup,
  onResetLibrary,
}) => {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const totalBytes = items.reduce((acc, cur) => acc + cur.fileSizeBytes, 0);

  const shortcuts = [
    {
      keys: 'Space / 双击',
      zh: '极速看图模式（支持预加载、滚轮缩放、拖拽平移）',
      en: 'Fast Image Viewer with wheel zoom, pan & preloading',
    },
    {
      keys: '← / → / PageUp / Down',
      zh: '看图器中零延迟切换上/下一张图片',
      en: 'Instant previous / next image switching',
    },
    {
      keys: '1 – 5',
      zh: 'ACDSee 快速评定 1–5 星级（0 适应窗口）',
      en: 'ACDSee 1–5 star rating (0 to fit window)',
    },
    {
      keys: 'L / R / H / V',
      zh: '左旋 90° / 右旋 90° / 水平翻转 / 垂直翻转',
      en: 'Rotate Left / Right / Flip H / Flip V',
    },
    {
      keys: 'E / F / S',
      zh: '打开 Canvas 修图面板 / 切换胶片带 / 幻灯片播放',
      en: 'Open Edit panel / Toggle Filmstrip / Slideshow',
    },
    {
      keys: 'Ctrl + K / Ctrl + V',
      zh: '全局命令搜索 / 直接粘贴剪贴板截图入库',
      en: 'Command Palette / Paste clipboard image or URL',
    },
  ];

  const acdseeCapabilities = [
    {
      titleZh: '本地磁盘文件夹直连',
      titleEn: 'Direct Local Disk Browsing',
      descZh: '通过 Windows 文件系统 API 直接打开电脑本地图片目录，免上传、零拷贝，浏览成百上千张照片。',
      descEn: 'Mount local Windows folders directly via File System Access API without uploading.',
    },
    {
      titleZh: '极速看图 + 胶片缩略图带',
      titleEn: 'Fast Viewer & Filmstrip',
      descZh: '自动后台预加载前后多张图片，支持无级缩放、拖拽平移、透明背景棋盘格、全屏与幻灯片播放。',
      descEn: 'Background preloading, smooth zoom/pan, alpha checkerboard, fullscreen & slideshow.',
    },
    {
      titleZh: '非破坏性修图与批处理',
      titleEn: 'Canvas Adjust, Compare & Batch',
      descZh: '内置亮度/对比度/饱和度/色温/裁剪调整、双图并排/卷帘对比、批量重命名与批量 JPG/PNG/WebP 转换。',
      descEn: 'Brightness/contrast/warmth/crop, 2-image split compare, batch rename & format conversion.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto win-scroll p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Summary */}
        <section className="border-b border-black/[0.08] dark:border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#0067C0] dark:text-[#4CC2FF] mb-2">
              <Monitor className="w-4 h-4" />
              <span>Refto · Windows Offline & ACDSee Edition</span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-neutral-900 dark:text-white">
              {lang === 'zh'
                ? '离线桌面程序：极速看图与 ACDSee 图像管理'
                : 'Offline Desktop App: Fast Viewer & ACDSee Workflow'}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 max-w-2xl leading-relaxed">
              {lang === 'zh'
                ? '本应用已内置 Service Worker 离线缓存与 IndexedDB 本地库。断网状态下依然可启动使用，支持直连 Windows 本地磁盘目录、ACDSee 极速看图、双图对比、图像调整与批量转换。'
                : 'Built with Service Worker offline caching and IndexedDB local storage. Works without internet, mounts local folders, and includes ACDSee-style fast viewing, compare, and batch tools.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {!isInstalled && isInstallable && (
              <button
                type="button"
                onClick={onInstallPWA}
                className="h-9 px-4 rounded-[6px] bg-[#0067C0] hover:bg-[#005BA9] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 text-xs font-semibold flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'zh' ? '安装为离线桌面应用' : 'Install Offline App'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onMountLocalFolder}
              className="h-9 px-4 rounded-[6px] bg-white dark:bg-[#2F2F2F] border border-black/10 dark:border-white/15 text-xs font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 hover:border-[#0067C0]"
            >
              <FolderOpen className="w-4 h-4 text-[#0067C0] dark:text-[#4CC2FF]" />
              <span>{lang === 'zh' ? '打开本地图片文件夹' : 'Open Local Folder'}</span>
            </button>
          </div>
        </section>

        {/* Storage & Offline Status */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'zh' ? '离线引擎状态' : 'Offline Runtime'}</span>
            </div>
            <div className="mt-2 font-display font-bold text-lg text-neutral-900 dark:text-white">
              {isInstalled
                ? lang === 'zh'
                  ? '独立桌面窗口运行'
                  : 'Installed Standalone'
                : offlineReady
                  ? lang === 'zh'
                    ? '离线缓存已就绪'
                    : 'Offline Cache Ready'
                  : lang === 'zh'
                    ? 'Service Worker 激活中'
                    : 'Service Worker Active'}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {lang === 'zh'
                ? '断网后刷新仍可完整打开应用'
                : 'Available offline via PWA cache'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '当前视图资产' : 'Loaded Assets'}</span>
            </div>
            <div className="mt-2 font-display font-bold text-2xl tabular-nums text-neutral-900 dark:text-white">
              {items.length}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono tabular-nums">
              {formatBytes(totalBytes)} · {collections.length}{' '}
              {lang === 'zh' ? '合集' : 'collections'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08] flex flex-col justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              <HardDrive className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '离线库备份与迁移' : 'Backup & Restore'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportBackup}
                className="h-8 px-3 rounded-[5px] bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '导出 JSON' : 'Export'}</span>
              </button>
              <input
                ref={backupInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImportBackup(file);
                }}
              />
              <button
                type="button"
                onClick={() => backupInputRef.current?.click()}
                className="h-8 px-3 rounded-[5px] border border-black/10 dark:border-white/15 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '导入' : 'Import'}</span>
              </button>
              <button
                type="button"
                onClick={onResetLibrary}
                className="h-8 px-2.5 rounded-[5px] text-xs text-neutral-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '重置' : 'Reset'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ACDSee Capabilities Matrix */}
        <section>
          <h2 className="font-display font-semibold text-base text-neutral-900 dark:text-white mb-3">
            {lang === 'zh' ? '内置 ACDSee 核心看图与管理能力' : 'ACDSee Core Capabilities'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {acdseeCapabilities.map((cap) => (
              <div
                key={cap.titleEn}
                className="p-4 rounded-lg bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08]"
              >
                <div className="text-xs font-semibold text-[#0067C0] dark:text-[#4CC2FF] mb-1.5">
                  {lang === 'zh' ? cap.titleZh : cap.titleEn}
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {lang === 'zh' ? cap.descZh : cap.descEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Keyboard Shortcuts & Standalone Windows Desktop Install Guide */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-display font-semibold text-base text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-[#0067C0] dark:text-[#4CC2FF]" />
              <span>{lang === 'zh' ? '看图与管理快捷键' : 'Viewer & Manage Shortcuts'}</span>
            </h2>
            <div className="bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08] rounded-lg divide-y divide-black/[0.06] dark:divide-white/[0.06]">
              {shortcuts.map((s) => (
                <div
                  key={s.keys}
                  className="px-4 py-2.5 flex items-center justify-between gap-4 text-xs"
                >
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {lang === 'zh' ? s.zh : s.en}
                  </span>
                  <kbd className="px-2 py-0.5 rounded-[4px] font-mono text-[11px] bg-neutral-100 dark:bg-[#1e1e1e] border border-black/10 dark:border-white/10 text-neutral-800 dark:text-neutral-200 whitespace-nowrap shrink-0">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-base text-neutral-900 dark:text-white mb-3">
              {lang === 'zh'
                ? '安装为离线 Windows 桌面程序'
                : 'Install as Offline Windows App'}
            </h2>
            <div className="p-4 rounded-lg bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-600 dark:text-neutral-300 space-y-2.5 leading-relaxed">
              <p>
                {lang === 'zh'
                  ? '1. 点击右上角「安装离线桌面版」按钮（或在 Edge/Chrome 地址栏右侧点击安装图标）。'
                  : '1. Click "Install Offline App" in the title bar or browser address bar.'}
              </p>
              <p>
                {lang === 'zh'
                  ? '2. 安装后将在 Windows 开始菜单与桌面生成独立「Refto」程序图标，以独立无地址栏窗口启动，并在完全断网下正常工作。'
                  : '2. Launches as a standalone window from Windows Start Menu and works fully offline.'}
              </p>
              <p>
                {lang === 'zh'
                  ? '3. 在浏览器不支持 File System Access API 的环境（如部分受限 iframe）下点击「打开文件夹」，会自动降级为本地目录选择器，同样可零上传极速看图。'
                  : '3. Supports native File System Access API directory mounting with automatic fallback directory input.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
