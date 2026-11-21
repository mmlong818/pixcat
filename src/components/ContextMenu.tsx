import React, { useEffect } from 'react';
import {
  Maximize2,
  Star,
  Copy,
  Download,
  Trash2,
  FolderInput,
} from 'lucide-react';
import { Collection, Language, ReferenceItem } from '../types/refto';
import { t } from '../i18n';

interface ContextMenuProps {
  x: number;
  y: number;
  item: ReferenceItem | null;
  collections: Collection[];
  lang: Language;
  onClose: () => void;
  onQuickLook: (id: string) => void;
  onToggleStar: (id: string) => void;
  onCopyLink: (item: ReferenceItem) => void;
  onMoveToCollection: (id: string, colId: string) => void;
  onDownload: (item: ReferenceItem) => void;
  onDelete: (id: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  item,
  collections,
  lang,
  onClose,
  onQuickLook,
  onToggleStar,
  onCopyLink,
  onMoveToCollection,
  onDownload,
  onDelete,
}) => {
  const strings = t(lang);

  useEffect(() => {
    if (!item) return;
    const handleClick = () => onClose();
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [item, onClose]);

  if (!item) return null;

  const safeLeft = Math.min(x, window.innerWidth - 230);
  const safeTop = Math.min(y, window.innerHeight - 300);

  return (
    <div
      style={{ left: safeLeft, top: safeTop }}
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 w-56 rounded-[8px] py-1.5 bg-white/95 dark:bg-[#2C2C2C]/95 backdrop-blur-xl border border-black/[0.09] dark:border-white/[0.1] shadow-xl text-xs select-none"
    >
      <button
        type="button"
        onClick={() => {
          onQuickLook(item.id);
          onClose();
        }}
        className="w-full h-8 px-3 flex items-center gap-2.5 text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
      >
        <Maximize2 className="w-3.5 h-3.5 text-neutral-500" />
        <span>{strings.openQuickLook}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onToggleStar(item.id);
          onClose();
        }}
        className="w-full h-8 px-3 flex items-center gap-2.5 text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
      >
        <Star
          className={`w-3.5 h-3.5 ${
            item.starred ? 'fill-amber-500 text-amber-500' : 'text-neutral-500'
          }`}
        />
        <span>{item.starred ? strings.unstarAction : strings.starAction}</span>
      </button>

      {item.sourceUrl && (
        <button
          type="button"
          onClick={() => {
            onCopyLink(item);
            onClose();
          }}
          className="w-full h-8 px-3 flex items-center gap-2.5 text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
        >
          <Copy className="w-3.5 h-3.5 text-neutral-500" />
          <span>{strings.copyLink}</span>
        </button>
      )}

      {(item.imageUrl || item.mediaUrl || item.docContent) && (
        <button
          type="button"
          onClick={() => {
            onDownload(item);
            onClose();
          }}
          className="w-full h-8 px-3 flex items-center gap-2.5 text-neutral-800 dark:text-neutral-100 hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
        >
          <Download className="w-3.5 h-3.5 text-neutral-500" />
          <span>{strings.downloadAction}</span>
        </button>
      )}

      <div className="my-1 border-t border-black/[0.06] dark:border-white/[0.06]" />

      <div className="px-3 py-1 text-[10px] font-semibold text-neutral-400 flex items-center gap-1.5">
        <FolderInput className="w-3 h-3" />
        <span>{strings.moveToCollection}</span>
      </div>
      {collections.map((col) => (
        <button
          key={col.id}
          type="button"
          onClick={() => {
            onMoveToCollection(item.id, col.id);
            onClose();
          }}
          className={`w-full h-7 px-3 pl-7 text-left truncate hover:bg-black/[0.05] dark:hover:bg-white/[0.07] ${
            item.collectionId === col.id
              ? 'text-[#0067C0] dark:text-[#4CC2FF] font-medium'
              : 'text-neutral-700 dark:text-neutral-300'
          }`}
        >
          {lang === 'zh' ? col.nameZh : col.nameEn}
        </button>
      ))}

      <div className="my-1 border-t border-black/[0.06] dark:border-white/[0.06]" />

      <button
        type="button"
        onClick={() => {
          onDelete(item.id);
          onClose();
        }}
        className="w-full h-8 px-3 flex items-center gap-2.5 text-red-600 dark:text-red-400 hover:bg-red-500/10"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{strings.deleteAction}</span>
      </button>
    </div>
  );
};
