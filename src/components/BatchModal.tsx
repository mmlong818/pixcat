import React, { useState, useMemo } from 'react';
import { X, FileEdit, RefreshCw } from 'lucide-react';
import { DEFAULT_ADJUSTMENTS, Language, ReferenceItem } from '../types/library';
import {
  canvasToBlob,
  renderAdjustedCanvas,
  triggerBlobDownload,
} from '../utils/imageOps';

interface BatchModalProps {
  open: boolean;
  lang: Language;
  selectedItems: ReferenceItem[];
  onClose: () => void;
  onBatchRename: (updates: Array<{ id: string; title: string }>) => void;
  onNotify: (msg: string) => void;
}

export const BatchModal: React.FC<BatchModalProps> = ({
  open,
  lang,
  selectedItems,
  onClose,
  onBatchRename,
  onNotify,
}) => {
  const [tab, setTab] = useState<'rename' | 'convert'>('rename');
  const [pattern, setPattern] = useState('Ref_{index:3}_{name}');
  const [startNum, setStartNum] = useState(1);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState(90);
  const [maxWidth, setMaxWidth] = useState<number>(0); // 0 = original
  const [processing, setProcessing] = useState(false);

  const renamePreviews = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return selectedItems.map((item, idx) => {
      const seq = String(startNum + idx).padStart(3, '0');
      let baseName = item.title;
      if (findText) {
        baseName = baseName.split(findText).join(replaceText);
      }
      const nextTitle = pattern
        .replace(/\{index:3\}/g, seq)
        .replace(/\{index\}/g, String(startNum + idx))
        .replace(/\{name\}/g, baseName)
        .replace(/\{date\}/g, today)
        .replace(/\{type\}/g, item.type);
      return { id: item.id, before: item.title, after: nextTitle };
    });
  }, [selectedItems, pattern, startNum, findText, replaceText]);

  if (!open) return null;

  const imageItems = selectedItems.filter((i) => !!i.imageUrl);

  const handleApplyRename = () => {
    onBatchRename(renamePreviews.map((p) => ({ id: p.id, title: p.after })));
    onNotify(
      lang === 'zh'
        ? `已完成 ${renamePreviews.length} 项批量重命名`
        : `Renamed ${renamePreviews.length} items`
    );
    onClose();
  };

  const handleBatchConvert = async () => {
    if (imageItems.length === 0) return;
    setProcessing(true);
    try {
      const ext =
        format === 'image/png'
          ? 'png'
          : format === 'image/webp'
            ? 'webp'
            : 'jpg';
      for (const item of imageItems) {
        const canvas = await renderAdjustedCanvas(
          item.imageUrl!,
          item.adjustments || DEFAULT_ADJUSTMENTS,
          'free',
          maxWidth > 0 ? maxWidth : undefined
        );
        const blob = await canvasToBlob(canvas, format, quality / 100);
        triggerBlobDownload(blob, `${item.title}.${ext}`);
      }
      onNotify(
        lang === 'zh'
          ? `已批量转换并导出 ${imageItems.length} 张图片`
          : `Exported ${imageItems.length} converted images`
      );
      onClose();
    } catch {
      onNotify(lang === 'zh' ? '批量处理过程中出错' : 'Batch export error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-[10px] bg-white dark:bg-[#282828] border border-black/[0.1] dark:border-white/[0.1] shadow-2xl overflow-hidden"
      >
        <div className="h-12 px-5 border-b border-black/[0.07] dark:border-white/[0.07] flex items-center justify-between">
          <h2 className="font-display font-semibold text-sm text-neutral-900 dark:text-white">
            {lang === 'zh'
              ? `ACDSee 批量工具（已选 ${selectedItems.length} 项）`
              : `ACDSee Batch Tools (${selectedItems.length} items)`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center text-neutral-500 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-[6px] bg-black/[0.045] dark:bg-white/[0.06]">
            <button
              type="button"
              onClick={() => setTab('rename')}
              className={`h-8 rounded-[4px] text-xs font-medium flex items-center justify-center gap-1.5 ${
                tab === 'rename'
                  ? 'bg-white dark:bg-[#383838] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '批量重命名' : 'Batch Rename'}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('convert')}
              className={`h-8 rounded-[4px] text-xs font-medium flex items-center justify-center gap-1.5 ${
                tab === 'convert'
                  ? 'bg-white dark:bg-[#383838] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '批量转换格式 / 缩放' : 'Batch Convert & Resize'}</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {tab === 'rename' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    {lang === 'zh'
                      ? '命名模板（支持 {name} {index:3} {date} {type}）'
                      : 'Template ({name} {index:3} {date} {type})'}
                  </label>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full h-9 px-3 rounded-[5px] font-mono bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none focus:border-[#0067C0]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    {lang === 'zh' ? '起始编号' : 'Start Index'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={startNum}
                    onChange={(e) => setStartNum(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-[5px] font-mono tabular-nums bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    {lang === 'zh' ? '查找字符（可选）' : 'Find'}
                  </label>
                  <input
                    type="text"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    {lang === 'zh' ? '替换为' : 'Replace'}
                  </label>
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10 focus:outline-none"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto win-scroll border border-black/[0.08] dark:border-white/[0.08] rounded-lg divide-y divide-black/[0.05] dark:divide-white/[0.05] text-xs">
                {renamePreviews.map((row) => (
                  <div key={row.id} className="px-3 py-2 grid grid-cols-2 gap-3">
                    <span className="truncate text-neutral-400">{row.before}</span>
                    <span className="truncate font-medium text-[#0067C0] dark:text-[#4CC2FF]">
                      {row.after}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-4 rounded-[5px] text-xs text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05]"
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleApplyRename}
                  className="h-8 px-4 rounded-[5px] bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 text-xs font-semibold"
                >
                  {lang === 'zh' ? '应用批量重命名' : 'Apply Rename'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    {lang === 'zh' ? '目标格式' : 'Target Format'}
                  </label>
                  <select
                    value={format}
                    onChange={(e) =>
                      setFormat(
                        e.target.value as 'image/jpeg' | 'image/png' | 'image/webp'
                      )
                    }
                    className="w-full h-9 px-2.5 rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10"
                  >
                    <option value="image/jpeg">JPEG (.jpg)</option>
                    <option value="image/png">PNG (.png)</option>
                    <option value="image/webp">WebP (.webp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    {lang === 'zh' ? '最大宽度缩放' : 'Max Width'}
                  </label>
                  <select
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(Number(e.target.value))}
                    className="w-full h-9 px-2.5 rounded-[5px] bg-neutral-50 dark:bg-[#1f1f1f] border border-black/10 dark:border-white/10"
                  >
                    <option value={0}>{lang === 'zh' ? '保持原图尺寸' : 'Original Size'}</option>
                    <option value={1920}>1920 px (FHD)</option>
                    <option value={1280}>1280 px (HD)</option>
                    <option value={800}>800 px (Web)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-500 mb-1">
                    {lang === 'zh' ? '压缩画质' : 'Quality'} ({quality}%)
                  </label>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full mt-2.5 accent-[#0067C0]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-[#202020] text-xs text-neutral-600 dark:text-neutral-300">
                {lang === 'zh'
                  ? `将离线使用本地 Canvas 引擎处理所选中的 ${imageItems.length} 张图片，并自动保留旋转与调色参数后下载。`
                  : `Will process ${imageItems.length} selected images offline via local Canvas engine and download them.`}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-4 rounded-[5px] text-xs text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05]"
                >
                  {lang === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={processing || imageItems.length === 0}
                  onClick={handleBatchConvert}
                  className="h-8 px-4 rounded-[5px] bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 text-xs font-semibold disabled:opacity-50"
                >
                  {processing
                    ? lang === 'zh'
                      ? '正在转换…'
                      : 'Processing…'
                    : lang === 'zh'
                      ? `转换并导出 ${imageItems.length} 张`
                      : `Convert & Export (${imageItems.length})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
