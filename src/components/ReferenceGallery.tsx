import React, { useState } from 'react';
import {
  Star,
  Play,
  Pause,
  FileText,
  Globe,
  Check,
  UploadCloud,
  RotateCcw,
} from 'lucide-react';
import { Collection, Language, ReferenceItem, ViewMode } from '../types/library';
import { formatBytes } from '../utils/storage';
import { ACD_LABELS, t } from '../i18n';

interface ReferenceGalleryProps {
  lang: Language;
  items: ReferenceItem[];
  collections: Collection[];
  viewMode: ViewMode;
  gridCols: number;
  selectedId: string | null;
  checkedIds: string[];
  playingAudioId: string | null;
  hasActiveFilters: boolean;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onToggleStar: (id: string) => void;
  onPlayAudio: (item: ReferenceItem) => void;
  onContextMenu: (e: React.MouseEvent, item: ReferenceItem) => void;
  onOpenAddModal: () => void;
  onResetFilters: () => void;
  onDropFiles: (files: FileList) => void;
}

export const ReferenceGallery: React.FC<ReferenceGalleryProps> = ({
  lang,
  items,
  collections,
  viewMode,
  gridCols,
  selectedId,
  checkedIds,
  playingAudioId,
  hasActiveFilters,
  onSelect,
  onDoubleClick,
  onToggleCheck,
  onToggleStar,
  onPlayAudio,
  onContextMenu,
  onOpenAddModal,
  onResetFilters,
  onDropFiles,
}) => {
  const strings = t(lang);
  const [draggingOver, setDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  const getCollectionName = (colId: string) => {
    const col = collections.find((c) => c.id === colId);
    if (!col) return '—';
    return lang === 'zh' ? col.nameZh : col.nameEn;
  };

  const getLabelHex = (item: ReferenceItem) => {
    if (!item.acdLabel || item.acdLabel === 'none') return null;
    return ACD_LABELS.find((l) => l.id === item.acdLabel)?.hex || null;
  };

  const getThumbTransformStyle = (item: ReferenceItem): React.CSSProperties => {
    const adj = item.adjustments;
    if (!adj) return {};
    const sepiaPct = adj.warmth > 0 ? Math.min(45, adj.warmth * 0.7) : 0;
    const hueDeg = adj.warmth < 0 ? Math.max(-25, adj.warmth * 0.45) : 0;
    return {
      filter: [
        `brightness(${adj.brightness}%)`,
        `contrast(${adj.contrast}%)`,
        `saturate(${adj.grayscale ? 0 : adj.saturate}%)`,
        sepiaPct > 0 ? `sepia(${sepiaPct}%)` : '',
        hueDeg !== 0 ? `hue-rotate(${hueDeg}deg)` : '',
      ]
        .filter(Boolean)
        .join(' '),
      transform: `rotate(${adj.rotate}deg) scaleX(${adj.flipH ? -1 : 1}) scaleY(${adj.flipV ? -1 : 1})`,
    };
  };

  const masonryClass =
    gridCols <= 2
      ? 'columns-1 sm:columns-2'
      : gridCols === 3
        ? 'columns-1 sm:columns-2 lg:columns-3'
        : gridCols === 4
          ? 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4'
          : gridCols === 5
            ? 'columns-2 sm:columns-3 lg:columns-4 xl:columns-5'
            : 'columns-2 sm:columns-3 lg:columns-4 xl:columns-6';

  const gridClass =
    gridCols <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : gridCols === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : gridCols === 4
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : gridCols === 5
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';

  const renderThumbnail = (item: ReferenceItem, aspectFixed: boolean) => {
    if (item.imageUrl) {
      return (
        <div
          className={`relative overflow-hidden bg-neutral-100 dark:bg-[#1b1b1b] ${
            aspectFixed ? 'aspect-[4/3]' : ''
          }`}
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            style={getThumbTransformStyle(item)}
            className={`w-full block transition-transform duration-300 group-hover:scale-[1.015] ${
              aspectFixed ? 'h-full object-cover' : 'h-auto object-cover'
            }`}
          />
        </div>
      );
    }

    if (item.mediaUrl && item.mediaMime?.startsWith('video/')) {
      return (
        <div className="relative aspect-video bg-neutral-900 overflow-hidden">
          <video
            src={item.mediaUrl}
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => e.currentTarget.pause()}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    if (item.type === 'audio') {
      const isPlaying = playingAudioId === item.id;
      return (
        <div className="aspect-[16/10] bg-gradient-to-br from-[#F4F6F9] to-[#E6ECF3] dark:from-[#20242A] dark:to-[#191C21] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
              {item.dimensions}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAudio(item);
              }}
              className="w-9 h-9 rounded-full bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
          <div className="flex items-end gap-1 h-10" aria-hidden="true">
            {[28, 52, 74, 42, 90, 64, 38, 82, 55, 70, 44, 62, 32, 48, 22].map(
              (h, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    isPlaying
                      ? 'bg-[#0067C0] dark:bg-[#4CC2FF]'
                      : 'bg-neutral-400/50 dark:bg-neutral-600'
                  }`}
                  style={{
                    height: `${isPlaying ? Math.max(20, (h + idx * 7) % 100) : h}%`,
                  }}
                />
              )
            )}
          </div>
        </div>
      );
    }

    if (item.type === 'doc') {
      return (
        <div className="aspect-[4/3] bg-[#FAF9F6] dark:bg-[#1D1F22] p-5 flex flex-col justify-between border-b border-black/[0.05] dark:border-white/[0.05]">
          <div className="flex items-center justify-between text-neutral-400 dark:text-neutral-500">
            <FileText className="w-5 h-5 text-[#0067C0] dark:text-[#4CC2FF]" />
            <span className="text-[11px] font-mono tabular-nums">MD / PDF</span>
          </div>
          <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300 line-clamp-4 whitespace-pre-line font-sans">
            {item.docContent || item.notes}
          </p>
        </div>
      );
    }

    return (
      <div className="aspect-[4/3] bg-neutral-100 dark:bg-[#1c1f24] p-5 flex flex-col justify-between">
        <Globe className="w-6 h-6 text-[#0067C0] dark:text-[#4CC2FF]" />
        <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate">
          {item.domain || item.sourceUrl || 'pixcat.local'}
        </div>
      </div>
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex-1 overflow-y-auto win-scroll p-5"
    >
      {draggingOver && (
        <div className="fixed inset-0 z-40 pointer-events-none bg-[#0067C0]/10 dark:bg-[#4CC2FF]/10 backdrop-blur-[2px] flex items-center justify-center p-8">
          <div className="bg-white/95 dark:bg-[#2B2B2B]/95 border-2 border-dashed border-[#0067C0] dark:border-[#4CC2FF] rounded-xl px-10 py-8 text-center shadow-2xl max-w-md">
            <UploadCloud className="w-10 h-10 mx-auto mb-3 text-[#0067C0] dark:text-[#4CC2FF]" />
            <p className="font-display font-semibold text-base text-neutral-900 dark:text-white">
              {strings.dropHintTitle}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
              {strings.dropHintSub}
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-6">
          <div className="w-12 h-12 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6 text-neutral-400 dark:text-neutral-500" />
          </div>
          <h3 className="font-display font-semibold text-base text-neutral-900 dark:text-neutral-100">
            {strings.emptyTitle}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-sm leading-relaxed">
            {strings.emptySub}
          </p>
          <div className="flex items-center gap-3 mt-5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="h-8 px-3.5 rounded-[5px] border border-black/10 dark:border-white/15 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{strings.resetFilter}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="h-8 px-4 rounded-[5px] bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              {strings.emptyCta}
            </button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06] text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-50/80 dark:bg-[#252525]">
                <th className="w-9 py-2.5 pl-3 pr-1" />
                <th className="py-2.5 px-3">{lang === 'zh' ? '名称' : 'Name'}</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">{strings.typeLabel}</th>
                <th className="py-2.5 px-3 hidden md:table-cell">
                  {lang === 'zh' ? '评级' : 'Rating'}
                </th>
                <th className="py-2.5 px-3 hidden xl:table-cell">{strings.collectionLabel}</th>
                <th className="py-2.5 px-3 hidden lg:table-cell">{strings.dimensionsLabel}</th>
                <th className="py-2.5 px-3 text-right">{strings.sizeLabel}</th>
                <th className="py-2.5 pl-3 pr-4 text-right w-28">{strings.dateLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05] text-xs">
              {items.map((item) => {
                const isSelected = selectedId === item.id;
                const isChecked = checkedIds.includes(item.id);
                const labelHex = getLabelHex(item);
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    onDoubleClick={() => onDoubleClick(item.id)}
                    onContextMenu={(e) => onContextMenu(e, item)}
                    className={`h-10 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#0067C0]/[0.08] dark:bg-[#4CC2FF]/[0.11]'
                        : 'hover:bg-black/[0.025] dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <td
                      className="pl-3 pr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCheck(item.id);
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Select item"
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                          isChecked
                            ? 'bg-[#0067C0] dark:bg-[#4CC2FF] border-[#0067C0] dark:border-[#4CC2FF] text-white dark:text-neutral-950'
                            : 'border-neutral-300 dark:border-neutral-600'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="px-3 font-medium text-neutral-900 dark:text-neutral-100">
                      <div className="flex items-center gap-2 min-w-0">
                        {labelHex && (
                          <span
                            className="w-2 h-2 rounded-[2px] shrink-0"
                            style={{ backgroundColor: labelHex }}
                          />
                        )}
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-7 h-5 rounded-[3px] object-cover shrink-0 border border-black/10 dark:border-white/10"
                          />
                        ) : (
                          <span className="w-7 h-5 rounded-[3px] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-mono text-neutral-500 shrink-0">
                            {item.type.toUpperCase()}
                          </span>
                        )}
                        <span className="truncate max-w-[240px]">{item.title}</span>
                      </div>
                    </td>
                    <td className="px-3 text-neutral-500 dark:text-neutral-400 hidden sm:table-cell whitespace-nowrap">
                      {strings.typeNames[item.type]}
                    </td>
                    <td className="px-3 hidden md:table-cell font-mono tabular-nums text-amber-500 whitespace-nowrap">
                      {item.rating ? `${item.rating} ★` : '—'}
                    </td>
                    <td className="px-3 text-neutral-500 dark:text-neutral-400 hidden xl:table-cell truncate max-w-[160px]">
                      {item.localFolderId ? item.relativePath : getCollectionName(item.collectionId)}
                    </td>
                    <td className="px-3 text-neutral-500 dark:text-neutral-400 font-mono tabular-nums hidden lg:table-cell whitespace-nowrap">
                      {item.dimensions}
                    </td>
                    <td className="px-3 text-right text-neutral-500 dark:text-neutral-400 font-mono tabular-nums whitespace-nowrap">
                      {formatBytes(item.fileSizeBytes)}
                    </td>
                    <td className="pl-3 pr-4 text-right text-neutral-500 dark:text-neutral-400 font-mono tabular-nums whitespace-nowrap">
                      {item.createdAt.slice(0, 10)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className={
            viewMode === 'masonry'
              ? `${masonryClass} gap-4 space-y-4`
              : `grid ${gridClass} gap-4`
          }
        >
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            const isChecked = checkedIds.includes(item.id);
            const labelHex = getLabelHex(item);
            return (
              <article
                key={item.id}
                onClick={() => onSelect(item.id)}
                onDoubleClick={() => onDoubleClick(item.id)}
                onContextMenu={(e) => onContextMenu(e, item)}
                className={`group relative break-inside-avoid rounded-[8px] overflow-hidden bg-white dark:bg-[#2B2B2B] border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0067C0] dark:border-[#4CC2FF] ring-2 ring-[#0067C0]/20 dark:ring-[#4CC2FF]/20'
                    : 'border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.18] dark:hover:border-white/[0.18]'
                }`}
              >
                <div
                  className={`absolute top-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none transition-opacity ${
                    isChecked || item.starred
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCheck(item.id);
                    }}
                    aria-label="Select item"
                    className={`pointer-events-auto w-5 h-5 rounded-[4px] border flex items-center justify-center backdrop-blur-md transition-colors ${
                      isChecked
                        ? 'bg-[#0067C0] dark:bg-[#4CC2FF] border-[#0067C0] dark:border-[#4CC2FF] text-white dark:text-neutral-950'
                        : 'bg-white/85 dark:bg-black/60 border-black/20 dark:border-white/25 text-transparent hover:border-[#0067C0]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStar(item.id);
                    }}
                    aria-label="Toggle star"
                    className={`pointer-events-auto w-7 h-7 rounded-[5px] flex items-center justify-center backdrop-blur-md transition-colors ${
                      item.starred
                        ? 'bg-white/90 dark:bg-black/70 text-amber-500'
                        : 'bg-white/85 dark:bg-black/60 text-neutral-500 hover:text-amber-500'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${item.starred ? 'fill-amber-500' : ''}`}
                    />
                  </button>
                </div>

                {renderThumbnail(item, viewMode === 'grid')}

                <div className="px-3.5 py-2.5 border-t border-black/[0.05] dark:border-white/[0.05]">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {labelHex && (
                        <span
                          className="w-2.5 h-2.5 rounded-[2px]"
                          style={{ backgroundColor: labelHex }}
                        />
                      )}
                      {(item.rating || 0) > 0 && (
                        <span className="text-[10px] font-mono tabular-nums text-amber-500">
                          {item.rating}★
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    <span>{strings.typeNames[item.type]}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{item.dimensions}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatBytes(item.fileSizeBytes)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
