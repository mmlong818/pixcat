import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Folder,
  Moon,
  Sun,
  Plus,
  Languages,
  Monitor,
  CornerDownLeft,
} from 'lucide-react';
import { ActiveNav, Collection, Language, ReferenceItem } from '../types/refto';
import { t } from '../i18n';

interface CommandPaletteModalProps {
  open: boolean;
  lang: Language;
  dark: boolean;
  items: ReferenceItem[];
  collections: Collection[];
  onClose: () => void;
  onSelectItem: (id: string) => void;
  onSelectNav: (nav: ActiveNav) => void;
  onToggleDark: () => void;
  onToggleLang: () => void;
  onOpenAddModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  open,
  lang,
  dark,
  items,
  collections,
  onClose,
  onSelectItem,
  onSelectNav,
  onToggleDark,
  onToggleLang,
  onOpenAddModal,
}) => {
  const [query, setQuery] = useState('');
  const strings = t(lang);

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const matchedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 5);
    return items
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          i.notes.toLowerCase().includes(q) ||
          (i.domain && i.domain.toLowerCase().includes(q)) ||
          i.colors.some((c) => c.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [items, query]);

  const matchedCollections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return collections.filter((c) =>
      (lang === 'zh' ? c.nameZh : c.nameEn).toLowerCase().includes(q)
    );
  }, [collections, query, lang]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-start justify-center pt-[14vh] px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-[10px] overflow-hidden bg-white/95 dark:bg-[#282828]/95 backdrop-blur-xl border border-black/[0.1] dark:border-white/[0.12] shadow-2xl"
      >
        <div className="h-12 px-4 border-b border-black/[0.08] dark:border-white/[0.08] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#0067C0] dark:text-[#4CC2FF] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === 'zh'
                ? '输入参考名称、色值 (#1B498B)、合集或命令…'
                : 'Jump to reference, color hex, collection, or command…'
            }
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none"
          />
          <span className="text-[10px] font-mono text-neutral-400 px-1.5 py-0.5 rounded border border-black/10 dark:border-white/10">
            ESC
          </span>
        </div>

        <div className="max-h-[55vh] overflow-y-auto win-scroll p-2 space-y-3">
          {/* Quick Windows Actions */}
          <div>
            <div className="px-2.5 py-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
              {lang === 'zh' ? '快捷操作' : 'Commands'}
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddModal();
                }}
                className="w-full h-9 px-2.5 rounded-[6px] flex items-center justify-between text-xs text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
              >
                <span className="flex items-center gap-2.5">
                  <Plus className="w-3.5 h-3.5 text-[#0067C0] dark:text-[#4CC2FF]" />
                  <span>{strings.importAdd}</span>
                </span>
                <CornerDownLeft className="w-3 h-3 text-neutral-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleDark();
                  onClose();
                }}
                className="w-full h-9 px-2.5 rounded-[6px] flex items-center justify-between text-xs text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
              >
                <span className="flex items-center gap-2.5">
                  {dark ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                  <span>
                    {dark
                      ? lang === 'zh'
                        ? '切换至浅色云母外观'
                        : 'Switch to Light Mica'
                      : lang === 'zh'
                        ? '切换至深色云母外观'
                        : 'Switch to Dark Mica'}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleLang();
                  onClose();
                }}
                className="w-full h-9 px-2.5 rounded-[6px] flex items-center justify-between text-xs text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
              >
                <span className="flex items-center gap-2.5">
                  <Languages className="w-3.5 h-3.5 text-neutral-500" />
                  <span>
                    {lang === 'zh'
                      ? 'Switch Interface to English'
                      : '切换界面为简体中文'}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectNav({ kind: 'windows-info' });
                  onClose();
                }}
                className="w-full h-9 px-2.5 rounded-[6px] flex items-center justify-between text-xs text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
              >
                <span className="flex items-center gap-2.5">
                  <Monitor className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{strings.windowsEdition}</span>
                </span>
              </button>
            </div>
          </div>

          {/* Collections */}
          {matchedCollections.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
                {strings.collections}
              </div>
              <div className="space-y-0.5">
                {matchedCollections.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => {
                      onSelectNav({ kind: 'collection', collectionId: col.id });
                      onClose();
                    }}
                    className="w-full h-8 px-2.5 rounded-[6px] flex items-center gap-2.5 text-xs text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                  >
                    <Folder className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{lang === 'zh' ? col.nameZh : col.nameEn}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* References */}
          {matchedItems.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500">
                {strings.library}
              </div>
              <div className="space-y-0.5">
                {matchedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectItem(item.id);
                      onClose();
                    }}
                    className="w-full h-10 px-2.5 rounded-[6px] flex items-center justify-between gap-3 text-xs text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-7 h-5 rounded-[3px] object-cover shrink-0"
                        />
                      ) : (
                        <span className="w-7 h-5 rounded-[3px] bg-black/5 dark:bg-white/10 text-[9px] font-mono flex items-center justify-center shrink-0">
                          {item.type.toUpperCase()}
                        </span>
                      )}
                      <span className="truncate font-medium">{item.title}</span>
                    </span>
                    <span className="text-[11px] text-neutral-400 shrink-0">
                      {strings.typeNames[item.type]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
