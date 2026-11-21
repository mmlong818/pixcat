import React from 'react';
import {
  Plus,
  FolderOpen,
  LayoutGrid,
  Columns3,
  List,
  PanelRight,
  Star,
  Trash2,
  X,
  ArrowUpDown,
  Columns2,
  Wand2,
} from 'lucide-react';
import { Language, SortMode, ViewMode } from '../types/refto';
import { t } from '../i18n';

interface CommandBarProps {
  lang: Language;
  viewMode: ViewMode;
  sortMode: SortMode;
  gridCols: number;
  inspectorOpen: boolean;
  checkedIds: string[];
  totalCount: number;
  onOpenAddModal: () => void;
  onMountLocalFolder: () => void;
  onChangeView: (v: ViewMode) => void;
  onChangeSort: (s: SortMode) => void;
  onChangeGridCols: (cols: number) => void;
  onToggleInspector: () => void;
  onBulkStar: () => void;
  onBulkDelete: () => void;
  onOpenBatchTools: () => void;
  onOpenCompare: () => void;
  onClearChecked: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  lang,
  viewMode,
  sortMode,
  gridCols,
  inspectorOpen,
  checkedIds,
  totalCount,
  onOpenAddModal,
  onMountLocalFolder,
  onChangeView,
  onChangeSort,
  onChangeGridCols,
  onToggleInspector,
  onBulkStar,
  onBulkDelete,
  onOpenBatchTools,
  onOpenCompare,
  onClearChecked,
}) => {
  const strings = t(lang);

  return (
    <div className="h-12 shrink-0 px-4 border-b border-black/[0.06] dark:border-white/[0.06] bg-white/40 dark:bg-[#272727]/60 flex items-center justify-between gap-3 select-none overflow-x-auto">
      {/* Left: Primary Actions OR Multi-Select ACDSee Batch Bar */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        {checkedIds.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 tabular-nums whitespace-nowrap">
              {strings.selectedCount(checkedIds.length)}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">|</span>
            <button
              type="button"
              onClick={onOpenBatchTools}
              className="h-7 px-2.5 rounded-[5px] bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{strings.batchTools}</span>
            </button>
            {checkedIds.length === 2 && (
              <button
                type="button"
                onClick={onOpenCompare}
                className="h-7 px-2.5 rounded-[5px] border border-black/10 dark:border-white/15 text-xs font-medium text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1.5 whitespace-nowrap"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>{strings.compareImages}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBulkStar}
              className="h-7 px-2.5 rounded-[5px] text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center gap-1 whitespace-nowrap"
            >
              <Star className="w-3.5 h-3.5" />
              <span>{strings.starSelected}</span>
            </button>
            <button
              type="button"
              onClick={onBulkDelete}
              className="h-7 px-2.5 rounded-[5px] text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-1 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{strings.deleteSelected}</span>
            </button>
            <button
              type="button"
              onClick={onClearChecked}
              className="h-7 px-2 rounded-[5px] text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddModal}
              className="h-8 px-3 rounded-[5px] bg-[#0067C0] hover:bg-[#005BA9] dark:bg-[#4CC2FF] dark:hover:bg-[#3BB5F5] text-white dark:text-neutral-950 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{strings.importAdd}</span>
            </button>
            <button
              type="button"
              onClick={onMountLocalFolder}
              className="h-8 px-2.5 rounded-[5px] bg-white/80 dark:bg-[#2F2F2F] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 text-xs font-medium text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#0067C0] dark:text-[#4CC2FF]" />
              <span className="hidden sm:inline">{strings.openFolder}</span>
            </button>
            {totalCount >= 2 && (
              <button
                type="button"
                onClick={onOpenCompare}
                title={strings.compareImages}
                className="h-8 px-2.5 rounded-[5px] bg-white/80 dark:bg-[#2F2F2F] border border-black/[0.08] dark:border-white/[0.08] hover:border-black/20 dark:hover:border-white/20 text-xs font-medium text-neutral-700 dark:text-neutral-200 hidden xl:flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>{strings.compareImages}</span>
              </button>
            )}
            <span className="hidden md:inline text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums whitespace-nowrap ml-1">
              {strings.itemsCount(totalCount)}
            </span>
          </div>
        )}
      </div>

      {/* Right: Thumbnail Density Slider + Sort + View Mode + Inspector */}
      <div className="flex items-center gap-2 shrink-0">
        {viewMode !== 'list' && (
          <div className="hidden xl:flex items-center gap-1.5 px-2">
            <span className="text-[10px] font-mono text-neutral-400">
              {lang === 'zh' ? '缩略图' : 'Size'}
            </span>
            <input
              type="range"
              min={2}
              max={6}
              value={8 - gridCols}
              onChange={(e) => onChangeGridCols(8 - Number(e.target.value))}
              aria-label="Thumbnail size"
              className="w-16 accent-[#0067C0] dark:accent-[#4CC2FF] cursor-pointer"
            />
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-[5px] bg-white/80 dark:bg-[#2F2F2F] border border-black/[0.08] dark:border-white/[0.08]">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <select
            value={sortMode}
            onChange={(e) => onChangeSort(e.target.value as SortMode)}
            aria-label="Sort references"
            className="bg-transparent text-xs text-neutral-700 dark:text-neutral-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="newest" className="bg-white dark:bg-[#2B2B2B]">
              {strings.sortNewest}
            </option>
            <option value="rating" className="bg-white dark:bg-[#2B2B2B]">
              {strings.sortRating}
            </option>
            <option value="name" className="bg-white dark:bg-[#2B2B2B]">
              {strings.sortName}
            </option>
            <option value="size" className="bg-white dark:bg-[#2B2B2B]">
              {strings.sortSize}
            </option>
            <option value="type" className="bg-white dark:bg-[#2B2B2B]">
              {strings.sortType}
            </option>
          </select>
        </div>

        <div className="flex items-center p-0.5 rounded-[6px] bg-black/[0.045] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.05]">
          <button
            type="button"
            onClick={() => onChangeView('masonry')}
            title={strings.masonry}
            className={`h-7 px-2.5 rounded-[4px] text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === 'masonry'
                ? 'bg-white dark:bg-[#383838] text-neutral-950 dark:text-white font-medium shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{strings.masonry}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('grid')}
            title={strings.grid}
            className={`h-7 px-2.5 rounded-[4px] text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-[#383838] text-neutral-950 dark:text-white font-medium shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{strings.grid}</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeView('list')}
            title={strings.list}
            className={`h-7 px-2.5 rounded-[4px] text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#383838] text-neutral-950 dark:text-white font-medium shadow-2xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{strings.list}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleInspector}
          title={strings.inspector}
          className={`h-8 px-2.5 rounded-[5px] border text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            inspectorOpen
              ? 'bg-black/[0.06] dark:bg-white/[0.1] border-black/10 dark:border-white/15 text-neutral-950 dark:text-white font-medium'
              : 'bg-white/70 dark:bg-[#2F2F2F] border-black/[0.08] dark:border-white/[0.08] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{strings.inspector}</span>
        </button>
      </div>
    </div>
  );
};
