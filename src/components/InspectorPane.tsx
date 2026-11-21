import React, { useState } from 'react';
import {
  Star,
  ExternalLink,
  Copy,
  Maximize2,
  Trash2,
  Plus,
  X,
  Play,
  Pause,
  FileText,
  Download,
} from 'lucide-react';
import { AcdLabel, Collection, Language, ReferenceItem } from '../types/library';
import { formatBytes } from '../utils/storage';
import { ACD_LABELS, t } from '../i18n';

interface InspectorPaneProps {
  lang: Language;
  item: ReferenceItem | null;
  collections: Collection[];
  playingAudioId: string | null;
  onUpdateItem: (id: string, patch: Partial<ReferenceItem>) => void;
  onDeleteItem: (id: string) => void;
  onOpenQuickLook: (id: string) => void;
  onPlayAudio: (item: ReferenceItem) => void;
  onNotify: (msg: string) => void;
}

export const InspectorPane: React.FC<InspectorPaneProps> = ({
  lang,
  item,
  collections,
  playingAudioId,
  onUpdateItem,
  onDeleteItem,
  onOpenQuickLook,
  onPlayAudio,
  onNotify,
}) => {
  const strings = t(lang);
  const [tagInput, setTagInput] = useState('');

  if (!item) {
    return (
      <aside className="w-[312px] shrink-0 border-l border-black/[0.06] dark:border-white/[0.06] bg-[#FAFAFA]/80 dark:bg-[#242424]/85 p-6 flex flex-col items-center justify-center text-center select-none">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {lang === 'zh'
            ? '选择任意图片或参考项以查看色板、评级与 EXIF 属性'
            : 'Select an image or reference to inspect palette, rating, and properties'}
        </p>
        <p className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-2">
          Space · {lang === 'zh' ? '极速看图' : 'Fast Viewer'}
        </p>
      </aside>
    );
  }

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      onNotify(label);
    } catch {
      onNotify(label);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tagInput.trim();
    if (!cleaned) return;
    if (!item.tags.includes(cleaned)) {
      onUpdateItem(item.id, { tags: [...item.tags, cleaned] });
    }
    setTagInput('');
  };

  const isPlaying = playingAudioId === item.id;

  return (
    <aside className="w-[312px] shrink-0 border-l border-black/[0.06] dark:border-white/[0.06] bg-[#FAFAFA]/85 dark:bg-[#242424]/90 flex flex-col h-full overflow-y-auto win-scroll">
      {/* Top Preview Frame */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="relative rounded-[7px] overflow-hidden bg-neutral-100 dark:bg-[#1A1A1A] border border-black/[0.08] dark:border-white/[0.08]">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-48 object-cover block"
            />
          ) : item.mediaUrl && item.mediaMime?.startsWith('video/') ? (
            <video
              src={item.mediaUrl}
              controls
              className="w-full max-h-48 object-cover"
            />
          ) : item.type === 'audio' ? (
            <div className="p-5 flex items-center justify-between bg-gradient-to-br from-[#F2F5F9] to-[#E5ECF4] dark:from-[#1F2329] dark:to-[#181B20]">
              <div>
                <div className="text-xs font-medium text-neutral-800 dark:text-neutral-100">
                  {strings.typeNames.audio}
                </div>
                <div className="text-[11px] font-mono text-neutral-500 mt-0.5 tabular-nums">
                  {item.dimensions}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onPlayAudio(item)}
                className="w-9 h-9 rounded-full bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 flex items-center justify-center"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
          ) : (
            <div className="p-5 flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
              <FileText className="w-5 h-5 text-[#0067C0] dark:text-[#4CC2FF]" />
              <span className="text-xs">{strings.typeNames[item.type]}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenQuickLook(item.id)}
            title={strings.openQuickLook}
            className="absolute bottom-2 right-2 h-7 px-2.5 rounded-[5px] bg-black/70 text-white text-[11px] font-medium flex items-center gap-1 hover:bg-black/90 transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            <span>{lang === 'zh' ? '看图 / 修图' : 'View / Edit'}</span>
          </button>
        </div>

        {/* Editable Title & Star */}
        <div className="mt-3 flex items-start gap-2">
          <input
            type="text"
            value={item.title}
            onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
            className="flex-1 min-w-0 bg-transparent font-display font-semibold text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:bg-white dark:focus:bg-[#1a1a1a] focus:px-1.5 rounded py-0.5"
          />
          <button
            type="button"
            onClick={() => onUpdateItem(item.id, { starred: !item.starred })}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.08] shrink-0"
            title={item.starred ? strings.unstarAction : strings.starAction}
          >
            <Star
              className={`w-4 h-4 ${
                item.starred ? 'fill-amber-500 text-amber-500' : 'text-neutral-400'
              }`}
            />
          </button>
        </div>

        {/* Multi-angle switcher for PoseWear poses */}
        {item.angles && item.angles.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              {strings.anglesLabel}
            </div>
            <div className="flex flex-wrap gap-1">
              {item.angles.map((ang, idx) => {
                const isActive = (item.activeAngleIndex ?? 0) === idx;
                return (
                  <button
                    key={`${ang.zh}-${idx}`}
                    type="button"
                    onClick={() =>
                      onUpdateItem(item.id, { activeAngleIndex: idx })
                    }
                    className={`h-6 px-2 rounded-[4px] text-[11px] font-medium transition-colors ${
                      isActive
                        ? 'bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950'
                        : 'bg-black/[0.05] dark:bg-white/[0.08] text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.09] dark:hover:bg-white/[0.14]'
                    }`}
                  >
                    {lang === 'zh' ? ang.zh : ang.en}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {item.originalUrl && (
          <a
            href={item.originalUrl}
            target="_blank"
            rel="noreferrer"
            download={`${item.itemCode || item.title}.png`}
            className="mt-3 w-full h-8 rounded-[5px] bg-[#0067C0]/10 dark:bg-[#4CC2FF]/15 text-[#0067C0] dark:text-[#4CC2FF] hover:bg-[#0067C0]/20 dark:hover:bg-[#4CC2FF]/25 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{strings.downloadOriginal}</span>
          </a>
        )}
      </div>

      {/* ACDSee Rating & Color Label */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {strings.ratingLabel}
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() =>
                  onUpdateItem(item.id, { rating: item.rating === r ? 0 : r })
                }
                className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    (item.rating || 0) >= r
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-neutral-300 dark:text-neutral-600'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {strings.acdLabelTitle}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateItem(item.id, { acdLabel: 'none' })}
              className={`px-1.5 h-5 rounded text-[10px] border ${
                !item.acdLabel || item.acdLabel === 'none'
                  ? 'border-neutral-800 dark:border-white text-neutral-900 dark:text-white'
                  : 'border-black/15 dark:border-white/15 text-neutral-400'
              }`}
            >
              {lang === 'zh' ? '无' : 'None'}
            </button>
            {ACD_LABELS.map((lbl) => (
              <button
                key={lbl.id}
                type="button"
                onClick={() =>
                  onUpdateItem(item.id, { acdLabel: lbl.id as AcdLabel })
                }
                title={lang === 'zh' ? lbl.nameZh : lbl.nameEn}
                className={`w-4 h-4 rounded-[3px] ${
                  item.acdLabel === lbl.id
                    ? 'ring-2 ring-neutral-900 dark:ring-white ring-offset-1'
                    : ''
                }`}
                style={{ backgroundColor: lbl.hex }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Extracted Color Palette */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-2.5">
          {strings.palette}
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {item.colors.map((hex, i) => (
            <button
              key={`${hex}-${i}`}
              type="button"
              onClick={() => handleCopy(hex, strings.copiedHex(hex))}
              title={hex}
              className="group flex flex-col items-center gap-1"
            >
              <span
                className="w-full h-7 rounded-[4px] border border-black/10 dark:border-white/15 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: hex }}
              />
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white">
                {hex.replace('#', '')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Collection & Source URL */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
            {strings.collectionLabel}
          </label>
          <select
            value={item.collectionId}
            onChange={(e) =>
              onUpdateItem(item.id, { collectionId: e.target.value })
            }
            className="w-full h-8 px-2.5 text-xs rounded-[5px] bg-white dark:bg-[#2F2F2F] border border-black/[0.09] dark:border-white/[0.09] text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-[#0067C0] dark:focus:border-[#4CC2FF]"
          >
            {item.posewearCat && (
              <option value={`col-pw-${item.posewearCat}`}>
                {strings.posewearSection} · {strings.posewearCategories[item.posewearCat]}
              </option>
            )}
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {lang === 'zh' ? col.nameZh : col.nameEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
            {strings.sourceUrlLabel}
          </label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={item.relativePath || item.sourceUrl || ''}
              placeholder="https://..."
              readOnly={!!item.relativePath}
              onChange={(e) =>
                onUpdateItem(item.id, { sourceUrl: e.target.value })
              }
              className="flex-1 min-w-0 h-8 px-2.5 text-xs rounded-[5px] bg-white dark:bg-[#2F2F2F] border border-black/[0.09] dark:border-white/[0.09] text-neutral-700 dark:text-neutral-200 focus:outline-none focus:border-[#0067C0] dark:focus:border-[#4CC2FF]"
            />
            {item.sourceUrl && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      item.sourceUrl!,
                      strings.copiedText(strings.sourceUrlLabel)
                    )
                  }
                  className="w-8 h-8 rounded-[5px] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  title={strings.copyLink}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-[5px] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  title={item.sourceUrl}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tags Editor */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
          {strings.tagsLabel}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {item.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() =>
                onUpdateItem(item.id, {
                  tags: item.tags.filter((x) => x !== tag),
                })
              }
              title={lang === 'zh' ? '点击移除标签' : 'Click to remove tag'}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] bg-black/[0.045] dark:bg-white/[0.07] text-neutral-700 dark:text-neutral-200 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <span>{tag}</span>
              <X className="w-2.5 h-2.5 opacity-60" />
            </button>
          ))}
        </div>
        <form onSubmit={handleAddTag} className="flex items-center gap-1">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder={strings.addTagPlaceholder}
            className="flex-1 min-w-0 h-7 px-2 text-xs rounded-[4px] bg-white dark:bg-[#2F2F2F] border border-black/[0.08] dark:border-white/[0.08] focus:outline-none focus:border-[#0067C0] dark:focus:border-[#4CC2FF]"
          />
          <button
            type="submit"
            className="w-7 h-7 rounded-[4px] bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* PoseWear Original Prompts & Keywords */}
      {(item.promptZh || item.promptEn || item.titleJa || (item.keywords && item.keywords.length > 0)) && (
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] space-y-3">
          {item.promptZh && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {strings.promptZhLabel}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(item.promptZh!, strings.copiedText(strings.promptZhLabel))
                  }
                  className="text-[11px] text-[#0067C0] dark:text-[#4CC2FF] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{lang === 'zh' ? '复制' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-200 select-text">
                {item.promptZh}
              </p>
            </div>
          )}

          {item.promptEn && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {strings.promptEnLabel}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(item.promptEn!, strings.copiedText(strings.promptEnLabel))
                  }
                  className="text-[11px] text-[#0067C0] dark:text-[#4CC2FF] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{lang === 'zh' ? '复制' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs leading-relaxed font-mono text-neutral-600 dark:text-neutral-300 select-text">
                {item.promptEn}
              </p>
            </div>
          )}

          {item.titleJa && (
            <div>
              <span className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-0.5">
                {strings.titleJaLabel}
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 select-text">
                {item.titleJa}
              </p>
            </div>
          )}

          {item.keywords && item.keywords.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                  {strings.keywordsLabel}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      item.keywords!.join(', '),
                      strings.copiedText(strings.keywordsLabel)
                    )
                  }
                  className="text-[11px] text-[#0067C0] dark:text-[#4CC2FF] hover:underline flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{lang === 'zh' ? '复制' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400 select-text break-words">
                {item.keywords.join(' · ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
          {strings.notesLabel}
        </label>
        <textarea
          rows={3}
          value={item.notes}
          onChange={(e) => onUpdateItem(item.id, { notes: e.target.value })}
          placeholder={strings.notesPlaceholder}
          className="w-full p-2.5 text-xs leading-relaxed rounded-[5px] bg-white dark:bg-[#2F2F2F] border border-black/[0.09] dark:border-white/[0.09] text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#0067C0] dark:focus:border-[#4CC2FF] resize-none"
        />
      </div>

      {/* File Properties Table */}
      <div className="p-4 space-y-2 text-xs">
        <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
          {strings.metadataLabel}
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
          <span className="text-neutral-400 dark:text-neutral-500">{strings.typeLabel}</span>
          <span className="text-right text-neutral-700 dark:text-neutral-200">
            {item.posewearCat
              ? strings.posewearCategories[item.posewearCat]
              : strings.typeNames[item.type]}
            {item.subCategory ? ` · ${item.subCategory}` : ''}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500">
            {strings.dimensionsLabel}
          </span>
          <span className="text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-200">
            {item.dimensions}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500">{strings.sizeLabel}</span>
          <span className="text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-200">
            {formatBytes(item.fileSizeBytes)}
          </span>
          <span className="text-neutral-400 dark:text-neutral-500">{strings.dateLabel}</span>
          <span className="text-right font-mono tabular-nums text-neutral-700 dark:text-neutral-200">
            {item.createdAt.slice(0, 10)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDeleteItem(item.id)}
          className="mt-3 w-full h-8 rounded-[5px] border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{strings.deleteAction}</span>
        </button>
      </div>
    </aside>
  );
};
