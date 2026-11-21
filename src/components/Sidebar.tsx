import React, { useState } from 'react';
import {
  Layers,
  Globe,
  LayoutGrid,
  Film,
  Printer,
  Volume2,
  FileText,
  Star,
  Folder,
  FolderOpen,
  Plus,
  Monitor,
  Check,
  X,
  HardDrive,
} from 'lucide-react';
import {
  ActiveNav,
  AssetType,
  Collection,
  Language,
  LocalFolder,
  ReferenceItem,
} from '../types/library';
import { COLOR_FILTERS } from '../data/seedLibrary';
import { ACD_LABELS, t } from '../i18n';

interface SidebarProps {
  lang: Language;
  activeNav: ActiveNav;
  items: ReferenceItem[];
  collections: Collection[];
  localFolders: LocalFolder[];
  activeColorId: string;
  onSelectNav: (nav: ActiveNav) => void;
  onSelectColor: (colorId: string) => void;
  onCreateCollection: (name: string) => void;
  onMountLocalFolder: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lang,
  activeNav,
  items,
  collections,
  localFolders,
  activeColorId,
  onSelectNav,
  onSelectColor,
  onCreateCollection,
  onMountLocalFolder,
}) => {
  const strings = t(lang);
  const [creatingCol, setCreatingCol] = useState(false);
  const [newColName, setNewColName] = useState('');

  const countByFilter = (filter: 'all' | 'starred' | AssetType) => {
    if (filter === 'all') return items.length;
    if (filter === 'starred') return items.filter((i) => i.starred).length;
    return items.filter((i) => i.type === filter).length;
  };

  const libraryRows: Array<{
    filter: 'all' | 'starred' | AssetType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { filter: 'all', label: strings.allItems, icon: Layers },
    { filter: 'web', label: strings.web, icon: Globe },
    { filter: 'ui', label: strings.ui, icon: LayoutGrid },
    { filter: 'motion', label: strings.motion, icon: Film },
    { filter: 'print', label: strings.print, icon: Printer },
    { filter: 'audio', label: strings.audio, icon: Volume2 },
    { filter: 'doc', label: strings.doc, icon: FileText },
    { filter: 'starred', label: strings.starred, icon: Star },
  ];

  const handleSubmitCol = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newColName.trim();
    if (trimmed) {
      onCreateCollection(trimmed);
      setNewColName('');
      setCreatingCol(false);
    }
  };

  return (
    <aside className="w-[248px] shrink-0 border-r border-black/[0.06] dark:border-white/[0.06] bg-[#F6F6F6]/70 dark:bg-[#232323]/75 flex flex-col h-full select-none">
      <div className="flex-1 overflow-y-auto win-scroll px-2.5 py-3 space-y-5">
        {/* Local Disk Folders (ACDSee Folder Browser) */}
        <div>
          <div className="px-2.5 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {strings.localFolders}
            </span>
            <button
              type="button"
              onClick={onMountLocalFolder}
              title={strings.openFolder}
              className="px-1.5 h-5 rounded flex items-center gap-1 text-[11px] font-medium text-[#0067C0] dark:text-[#4CC2FF] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
            >
              <FolderOpen className="w-3 h-3" />
              <span>{lang === 'zh' ? '打开' : 'Open'}</span>
            </button>
          </div>
          {localFolders.length === 0 ? (
            <button
              type="button"
              onClick={onMountLocalFolder}
              className="w-full px-2.5 py-2 rounded-[5px] border border-dashed border-black/[0.12] dark:border-white/[0.12] hover:border-[#0067C0] dark:hover:border-[#4CC2FF] text-left text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2 transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5 shrink-0 text-[#0067C0] dark:text-[#4CC2FF]" />
              <span className="truncate">
                {lang === 'zh' ? '挂载电脑本地图片文件夹…' : 'Mount local image folder…'}
              </span>
            </button>
          ) : (
            <nav className="space-y-0.5">
              {localFolders.map((folder) => {
                const isActive =
                  activeNav.kind === 'local-folder' && activeNav.folderId === folder.id;
                const count = items.filter((i) => i.localFolderId === folder.id).length;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() =>
                      onSelectNav({ kind: 'local-folder', folderId: folder.id })
                    }
                    className={`relative w-full h-8 px-2.5 rounded-[5px] flex items-center justify-between text-[13px] transition-colors ${
                      isActive
                        ? 'bg-black/[0.055] dark:bg-white/[0.08] font-medium text-neutral-950 dark:text-white'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.035] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0.5 top-2 bottom-2 w-[3px] rounded-full bg-[#0067C0] dark:bg-[#4CC2FF]"
                      />
                    )}
                    <span className="flex items-center gap-2.5 min-w-0">
                      <HardDrive
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-[#0067C0] dark:text-[#4CC2FF]'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`}
                      />
                      <span className="truncate">{folder.name}</span>
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-neutral-400 dark:text-neutral-500 ml-2 shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Library Section */}
        <div>
          <div className="px-2.5 mb-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {strings.library}
          </div>
          <nav className="space-y-0.5">
            {libraryRows.map((row) => {
              const Icon = row.icon;
              const isActive =
                activeNav.kind === 'library' && activeNav.filter === row.filter;
              const count = countByFilter(row.filter);
              return (
                <button
                  key={row.filter}
                  type="button"
                  onClick={() =>
                    onSelectNav({ kind: 'library', filter: row.filter })
                  }
                  className={`relative w-full h-8 px-2.5 rounded-[5px] flex items-center justify-between text-[13px] transition-colors ${
                    isActive
                      ? 'bg-black/[0.055] dark:bg-white/[0.08] font-medium text-neutral-950 dark:text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.035] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0.5 top-2 bottom-2 w-[3px] rounded-full bg-[#0067C0] dark:bg-[#4CC2FF]"
                    />
                  )}
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-[#0067C0] dark:text-[#4CC2FF]'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-400 dark:text-neutral-500 ml-2 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ACDSee Ratings & Color Labels */}
        <div>
          <div className="px-2.5 mb-1.5 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {strings.ratingsAndLabels}
          </div>
          <div className="space-y-0.5 mb-2">
            {[5, 4].map((minRating) => {
              const isActive =
                activeNav.kind === 'rating' && activeNav.minRating === minRating;
              const count = items.filter((i) => (i.rating || 0) >= minRating).length;
              return (
                <button
                  key={minRating}
                  type="button"
                  onClick={() => onSelectNav({ kind: 'rating', minRating })}
                  className={`relative w-full h-7 px-2.5 rounded-[5px] flex items-center justify-between text-xs transition-colors ${
                    isActive
                      ? 'bg-black/[0.055] dark:bg-white/[0.08] font-medium text-neutral-950 dark:text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.035] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>
                      {minRating === 5
                        ? lang === 'zh'
                          ? '5 星精选'
                          : '5 Stars'
                        : lang === 'zh'
                          ? '4 星及以上'
                          : '4+ Stars'}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="px-2.5 flex items-center gap-1.5">
            {ACD_LABELS.map((lbl) => {
              const isActive =
                activeNav.kind === 'label' && activeNav.label === lbl.id;
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => onSelectNav({ kind: 'label', label: lbl.id })}
                  title={lang === 'zh' ? lbl.nameZh : lbl.nameEn}
                  className={`w-5 h-5 rounded-[4px] transition-transform ${
                    isActive
                      ? 'ring-2 ring-neutral-900 dark:ring-white ring-offset-2 ring-offset-[#F6F6F6] dark:ring-offset-[#232323] scale-110'
                      : 'hover:scale-105 opacity-85 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: lbl.hex }}
                />
              );
            })}
          </div>
        </div>

        {/* Collections Section */}
        <div>
          <div className="px-2.5 mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {strings.collections}
            </span>
            <button
              type="button"
              onClick={() => setCreatingCol(true)}
              title={strings.newCollection}
              className="w-5 h-5 rounded flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {creatingCol && (
            <form onSubmit={handleSubmitCol} className="px-1 mb-1.5 flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder={strings.collectionPlaceholder}
                className="flex-1 min-w-0 h-7 px-2 text-xs rounded bg-white dark:bg-[#1a1a1a] border border-black/15 dark:border-white/15 focus:outline-none focus:border-[#0067C0] dark:focus:border-[#4CC2FF]"
              />
              <button
                type="submit"
                className="w-6 h-7 rounded flex items-center justify-center bg-[#0067C0] dark:bg-[#4CC2FF] text-white dark:text-neutral-950"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatingCol(false);
                  setNewColName('');
                }}
                className="w-6 h-7 rounded flex items-center justify-center text-neutral-500 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <nav className="space-y-0.5">
            {collections.map((col) => {
              const isActive =
                activeNav.kind === 'collection' && activeNav.collectionId === col.id;
              const count = items.filter((i) => i.collectionId === col.id).length;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() =>
                    onSelectNav({ kind: 'collection', collectionId: col.id })
                  }
                  className={`relative w-full h-8 px-2.5 rounded-[5px] flex items-center justify-between text-[13px] transition-colors ${
                    isActive
                      ? 'bg-black/[0.055] dark:bg-white/[0.08] font-medium text-neutral-950 dark:text-white'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.035] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0.5 top-2 bottom-2 w-[3px] rounded-full bg-[#0067C0] dark:bg-[#4CC2FF]"
                    />
                  )}
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Folder
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-[#0067C0] dark:text-[#4CC2FF]'
                          : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    />
                    <span className="truncate">
                      {lang === 'zh' ? col.nameZh : col.nameEn}
                    </span>
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-neutral-400 dark:text-neutral-500 ml-2 shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Color Filter Swatches */}
        <div className="px-2.5">
          <div className="mb-2 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            {strings.colorIndex}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {COLOR_FILTERS.map((swatch) => {
              const selected = activeColorId === swatch.id;
              return (
                <button
                  key={swatch.id}
                  type="button"
                  onClick={() => onSelectColor(swatch.id)}
                  title={lang === 'zh' ? swatch.labelZh : swatch.labelEn}
                  className={`w-6 h-6 rounded-[5px] flex items-center justify-center transition-transform ${
                    selected
                      ? 'ring-2 ring-[#0067C0] dark:ring-[#4CC2FF] ring-offset-2 ring-offset-[#F6F6F6] dark:ring-offset-[#232323] scale-105'
                      : 'hover:scale-105 border border-black/15 dark:border-white/15'
                  }`}
                  style={
                    swatch.id === 'all'
                      ? {
                          background:
                            'conic-gradient(#1B498B, #DED8CE, #B78448, #1F2428, #1B498B)',
                        }
                      : { backgroundColor: swatch.hex }
                  }
                >
                  {selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Sticky WinUI Navigation Footer */}
      <div className="p-2.5 border-t border-black/[0.06] dark:border-white/[0.06]">
        <button
          type="button"
          onClick={() => onSelectNav({ kind: 'windows-info' })}
          className={`relative w-full h-9 px-2.5 rounded-[5px] flex items-center gap-2.5 text-[13px] transition-colors ${
            activeNav.kind === 'windows-info'
              ? 'bg-black/[0.055] dark:bg-white/[0.08] font-medium text-neutral-950 dark:text-white'
              : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.035] dark:hover:bg-white/[0.05]'
          }`}
        >
          {activeNav.kind === 'windows-info' && (
            <span
              aria-hidden="true"
              className="absolute left-0.5 top-2 bottom-2 w-[3px] rounded-full bg-[#0067C0] dark:bg-[#4CC2FF]"
            />
          )}
          <Monitor
            className={`w-4 h-4 shrink-0 ${
              activeNav.kind === 'windows-info'
                ? 'text-[#0067C0] dark:text-[#4CC2FF]'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          />
          <span className="truncate">{strings.windowsEdition}</span>
        </button>
      </div>
    </aside>
  );
};
