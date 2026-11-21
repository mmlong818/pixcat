import React, { useRef, useState } from 'react';
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
  FolderSync,
  PackageOpen,
  FileArchive,
  Unlink,
  RefreshCw,
  AlertCircle,
  Loader2,
  Square,
} from 'lucide-react';
import {
  Collection,
  Language,
  PoseWearCategory,
  ReferenceItem,
  VaultMediaStats,
  VaultStatus,
} from '../types/library';
import { formatBytes } from '../utils/storage';
import { POSEWEAR_CATEGORY_META } from '../utils/posewearLoader';

interface MediaSyncProgress {
  active: boolean;
  done: number;
  total: number;
  currentFile: string;
}

interface WindowsEditionViewProps {
  lang: Language;
  items: ReferenceItem[];
  collections: Collection[];
  isInstallable: boolean;
  isInstalled: boolean;
  offlineReady: boolean;
  vaultStatus: VaultStatus;
  vaultStats: VaultMediaStats | null;
  zipBusyMessage: string | null;
  mediaSync: MediaSyncProgress;
  onInstallPWA: () => void;
  onMountLocalFolder: () => void;
  onMapVaultDirectory: () => void;
  onReconnectVault: () => void;
  onDisconnectVault: () => void;
  onImportVaultFolder: (files: FileList) => void;
  onExportVaultZip: () => void;
  onImportVaultZip: (file: File) => void;
  onDownloadPoseWearToVault: (categories: PoseWearCategory[]) => void;
  onCancelMediaSync: () => void;
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
  vaultStatus,
  vaultStats,
  zipBusyMessage,
  mediaSync,
  onInstallPWA,
  onMountLocalFolder,
  onMapVaultDirectory,
  onReconnectVault,
  onDisconnectVault,
  onImportVaultFolder,
  onExportVaultZip,
  onImportVaultZip,
  onDownloadPoseWearToVault,
  onCancelMediaSync,
  onExportBackup,
  onImportBackup,
  onResetLibrary,
}) => {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const zipImportInputRef = useRef<HTMLInputElement>(null);
  const vaultFolderInputRef = useRef<HTMLInputElement>(null);

  const [selectedCategories, setSelectedCategories] = useState<PoseWearCategory[]>([
    'pose',
    'costume',
  ]);

  const totalBytes = items.reduce((acc, cur) => acc + cur.fileSizeBytes, 0);
  const customAssetsCount = items.filter(
    (i) => !i.posewearCat && !i.localFolderId
  ).length;
  const posewearCount = items.filter((i) => !!i.posewearCat).length;

  const toggleCategory = (cat: PoseWearCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

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

  const vaultStatusBadge = () => {
    if (vaultStatus === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {lang === 'zh'
              ? `已实时绑定目录：${vaultStats?.folderName || 'PixCatVault'}`
              : `Connected (Read/Write): ${vaultStats?.folderName || 'PixCatVault'}`}
          </span>
        </span>
      );
    }
    if (vaultStatus === 'prompt') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-amber-500/12 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/25">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>
            {lang === 'zh'
              ? `等待重新授权目录：${vaultStats?.folderName || 'PixCatVault'}`
              : `Permission Required: ${vaultStats?.folderName || 'PixCatVault'}`}
          </span>
        </span>
      );
    }
    if (vaultStatus === 'readonly-import') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-[#0067C0]/12 text-[#0067C0] dark:text-[#4CC2FF] text-xs font-semibold border border-[#0067C0]/20">
          <PackageOpen className="w-3.5 h-3.5" />
          <span>
            {lang === 'zh'
              ? `已载入只读资源包：${vaultStats?.folderName || 'PixCatVault'}`
              : `Loaded Portable Package: ${vaultStats?.folderName || 'PixCatVault'}`}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 text-xs font-medium border border-black/8 dark:border-white/10">
        <HardDrive className="w-3.5 h-3.5" />
        <span>
          {lang === 'zh'
            ? '未映射外部目录（当前使用浏览器本地库 IndexedDB）'
            : 'No folder mapped (using browser IndexedDB)'}
        </span>
      </span>
    );
  };

  const syncPercent =
    mediaSync.total > 0
      ? Math.min(100, Math.round((mediaSync.done / mediaSync.total) * 100))
      : 0;

  return (
    <div className="flex-1 overflow-y-auto win-scroll p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hidden Inputs for Portable Vault */}
        <input
          ref={zipImportInputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImportVaultZip(f);
            e.target.value = '';
          }}
        />
        <input
          ref={vaultFolderInputRef}
          type="file"
          multiple
          // @ts-expect-error webkitdirectory is standard in Chromium/WebKit
          webkitdirectory=""
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onImportVaultFolder(e.target.files);
            }
            e.target.value = '';
          }}
        />

        {/* Header Summary */}
        <section className="border-b border-black/[0.08] dark:border-white/[0.08] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#0067C0] dark:text-[#4CC2FF] mb-2">
              <Monitor className="w-4 h-4" />
              <span>PixCat · Portable Resource Vault & ACDSee Workspace</span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight text-neutral-900 dark:text-white">
              {lang === 'zh'
                ? '固定资源目录与整包迁移设置'
                : 'Portable Resource Vault & Settings'}
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 max-w-2xl leading-relaxed">
              {lang === 'zh'
                ? '将所有图片原件、合集配置、笔记评分与 PoseWear 索引集中保存在电脑的同一个固定目录中。打包成 ZIP 发给他人，对方解压后只需映射该目录，即可完整还原全部资源与状态。'
                : 'Keep all image files, collections, metadata, and PoseWear datasets inside one fixed folder on disk. Zip the folder to share; anyone can unzip and map it here to restore everything.'}
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
                <span>{lang === 'zh' ? '安装为独立桌面应用' : 'Install Desktop App'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onMountLocalFolder}
              className="h-9 px-4 rounded-[6px] bg-white dark:bg-[#2F2F2F] border border-black/10 dark:border-white/15 text-xs font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 hover:border-[#0067C0]"
            >
              <FolderOpen className="w-4 h-4 text-[#0067C0] dark:text-[#4CC2FF]" />
              <span>{lang === 'zh' ? '临时浏览本地图片文件夹' : 'Browse Local Folder'}</span>
            </button>
          </div>
        </section>

        {/* Primary Section: Portable Resource Vault */}
        <section className="p-5 md:p-6 rounded-xl bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08] shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-semibold text-base text-neutral-900 dark:text-white flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-[#0067C0] dark:text-[#4CC2FF]" />
                <span>
                  {lang === 'zh'
                    ? '固定资源目录映射 (Portable Vault)'
                    : 'Fixed Directory Mapping (Portable Vault)'}
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {lang === 'zh'
                  ? '新导入或编辑保存的资源将直接写入该目录下的 assets/，配置实时同步到 pixcat.config.json。'
                  : 'Newly imported or edited assets write directly to assets/ and sync with pixcat.config.json.'}
              </p>
            </div>
            <div>{vaultStatusBadge()}</div>
          </div>

          {/* Standard Directory Tree Preview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#222222] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="font-mono font-semibold text-neutral-900 dark:text-white">
                pixcat.config.json
              </div>
              <div className="text-neutral-500 dark:text-neutral-400 mt-1">
                {lang === 'zh'
                  ? `合集(${collections.length})、星级、标签、笔记与设定`
                  : `Collections (${collections.length}), ratings, tags & settings`}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#222222] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="font-mono font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                <span>assets/</span>
                <span className="text-[11px] text-[#0067C0] dark:text-[#4CC2FF]">
                  {vaultStats ? `${vaultStats.assetsCount} 文件` : `${customAssetsCount} 项`}
                </span>
              </div>
              <div className="text-neutral-500 dark:text-neutral-400 mt-1">
                {lang === 'zh'
                  ? '用户导入/粘贴/修图原文件实体'
                  : 'Imported, pasted & edited asset files'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#222222] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="font-mono font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                <span>posewear/data/</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                  {vaultStats?.hasPoseWearData
                    ? lang === 'zh'
                      ? '已同步'
                      : 'Synced'
                    : `${posewearCount} 索引`}
                </span>
              </div>
              <div className="text-neutral-500 dark:text-neutral-400 mt-1">
                {lang === 'zh'
                  ? '4,802 条衣姿/深度/服装/人像索引'
                  : '4,802 PoseWear catalog JSON records'}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#222222] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="font-mono font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                <span>posewear/media/</span>
                <span className="text-[11px] text-[#0067C0] dark:text-[#4CC2FF]">
                  {vaultStats?.mediaFilesCount || 0} {lang === 'zh' ? '张' : 'files'}
                </span>
              </div>
              <div className="text-neutral-500 dark:text-neutral-400 mt-1">
                {lang === 'zh'
                  ? '可选缓存的 PoseWear 离线图片'
                  : 'Optional offline PoseWear image cache'}
              </div>
            </div>
          </div>

          {/* Directory Mapping & ZIP Transfer Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {vaultStatus === 'prompt' && (
              <button
                type="button"
                onClick={onReconnectVault}
                className="h-9 px-4 rounded-[6px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-2 shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{lang === 'zh' ? '恢复目录读写授权' : 'Reconnect Vault Folder'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onMapVaultDirectory}
              className="h-9 px-4 rounded-[6px] bg-[#0067C0] hover:bg-[#005BA9] dark:bg-[#4CC2FF] dark:hover:bg-[#3BB5F5] text-white dark:text-neutral-950 text-xs font-semibold flex items-center gap-2 shadow-xs"
            >
              <FolderSync className="w-4 h-4" />
              <span>
                {vaultStatus === 'connected'
                  ? lang === 'zh'
                    ? '更换映射目录'
                    : 'Change Mapped Folder'
                  : lang === 'zh'
                    ? '映射本地资源目录（读写同步）'
                    : 'Map Local Vault Folder (Read/Write)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => vaultFolderInputRef.current?.click()}
              className="h-9 px-3.5 rounded-[6px] bg-neutral-100 dark:bg-[#353535] hover:bg-neutral-200 dark:hover:bg-[#404040] text-xs font-medium text-neutral-800 dark:text-neutral-100 flex items-center gap-2"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#0067C0] dark:text-[#4CC2FF]" />
              <span>
                {lang === 'zh' ? '载入已解压目录（兼容模式）' : 'Load Unzipped Folder'}
              </span>
            </button>

            <button
              type="button"
              disabled={!!zipBusyMessage}
              onClick={onExportVaultZip}
              className="h-9 px-3.5 rounded-[6px] border border-black/12 dark:border-white/15 hover:border-[#0067C0] text-xs font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2 disabled:opacity-60"
            >
              {zipBusyMessage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0067C0] dark:text-[#4CC2FF]" />
              ) : (
                <FileArchive className="w-3.5 h-3.5 text-[#0067C0] dark:text-[#4CC2FF]" />
              )}
              <span>
                {zipBusyMessage
                  ? zipBusyMessage
                  : lang === 'zh'
                    ? '打包导出整目录 (.zip)'
                    : 'Export Entire Vault (.zip)'}
              </span>
            </button>

            <button
              type="button"
              disabled={!!zipBusyMessage}
              onClick={() => zipImportInputRef.current?.click()}
              className="h-9 px-3.5 rounded-[6px] border border-black/12 dark:border-white/15 hover:border-[#0067C0] text-xs font-medium text-neutral-800 dark:text-neutral-100 flex items-center gap-2 disabled:opacity-60"
            >
              <PackageOpen className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '从 .zip 资源包导入' : 'Import from .zip'}</span>
            </button>

            {vaultStatus !== 'none' && (
              <button
                type="button"
                onClick={onDisconnectVault}
                className="h-9 px-3 rounded-[6px] text-xs text-neutral-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1.5 ml-auto"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>{lang === 'zh' ? '断开目录映射' : 'Disconnect'}</span>
              </button>
            )}
          </div>

          {/* PoseWear Offline Media Sync into Vault */}
          <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.06] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                  {lang === 'zh'
                    ? '将 PoseWear 在线缩略图缓存到本地目录（实现彻底离线打包）'
                    : 'Download PoseWear Thumbnails into Mapped Folder'}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {lang === 'zh'
                    ? '先点击上方「映射本地资源目录」，再勾选需要离线带走的分类；已下载的文件会自动跳过。'
                    : 'Map a local writable folder first, select categories, and download images into posewear/media/.'}
                </div>
              </div>
              {mediaSync.active ? (
                <button
                  type="button"
                  onClick={onCancelMediaSync}
                  className="h-8 px-3 rounded-[5px] bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>{lang === 'zh' ? '停止下载' : 'Stop'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={selectedCategories.length === 0}
                  onClick={() => onDownloadPoseWearToVault(selectedCategories)}
                  className="h-8 px-3.5 rounded-[5px] bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'zh'
                      ? '开始下载所选分类到本地目录'
                      : 'Download Selected to Vault'}
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {POSEWEAR_CATEGORY_META.map((cat) => {
                const checked = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    disabled={mediaSync.active}
                    onClick={() => toggleCategory(cat.id)}
                    className={`h-7 px-2.5 rounded-[5px] text-xs font-medium border transition-colors ${
                      checked
                        ? 'bg-[#0067C0]/10 dark:bg-[#4CC2FF]/15 border-[#0067C0] dark:border-[#4CC2FF] text-[#0067C0] dark:text-[#4CC2FF]'
                        : 'border-black/10 dark:border-white/12 text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {checked ? '✓ ' : ''}
                    {lang === 'zh' ? cat.nameZh : cat.nameEn}
                  </button>
                );
              })}
            </div>

            {mediaSync.active && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
                  <span className="truncate max-w-md">
                    {mediaSync.currentFile || (lang === 'zh' ? '正在准备列表…' : 'Preparing…')}
                  </span>
                  <span className="tabular-nums shrink-0">
                    {mediaSync.done} / {mediaSync.total} ({syncPercent}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#0067C0] dark:bg-[#4CC2FF] transition-all duration-150"
                    style={{ width: `${syncPercent}%` }}
                  />
                </div>
              </div>
            )}
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
              <span>{lang === 'zh' ? '当前已加载资源' : 'Loaded Assets'}</span>
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
              <span>{lang === 'zh' ? '轻量配置备份 (JSON)' : 'Lightweight JSON Backup'}</span>
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
                  e.target.value = '';
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

        {/* Keyboard Shortcuts & Portability Guide */}
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
                ? '如何打包发给他人 / 迁移电脑？'
                : 'How to Share & Migrate Your Vault'}
            </h2>
            <div className="p-4 rounded-lg bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-600 dark:text-neutral-300 space-y-2.5 leading-relaxed">
              <p>
                {lang === 'zh'
                  ? '1. 在独立 Chrome / Edge 桌面端（或已安装的 PixCat 应用）中点击「映射本地资源目录」，在硬盘上选一个固定文件夹（如 D:\\PixCatVault）。'
                  : '1. In standalone Chrome/Edge or the installed PixCat app, click "Map Local Vault Folder" and pick a folder on disk.'}
              </p>
              <p>
                {lang === 'zh'
                  ? '2. 你后续导入、粘贴、修图的文件都会直接存到该目录的 assets/ 下，所有收藏评分写入 pixcat.config.json。需要离线图片时可点上方按钮把 PoseWear 缩略图也缓存到该目录。'
                  : '2. All imported/edited files are saved under assets/, and metadata syncs to pixcat.config.json. Optionally download PoseWear thumbnails into posewear/media/.'}
              </p>
              <p>
                {lang === 'zh'
                  ? '3. 分享给别人时：直接把整个文件夹打成 ZIP（或点「打包导出整目录 (.zip)」）。对方解压后在「设置与资源目录」里映射该文件夹（或直接导入 .zip）即可 100% 恢复！'
                  : '3. Zip the whole folder (or click "Export Entire Vault (.zip)"). Recipients simply unzip and map that folder here (or import the .zip) to restore everything.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
