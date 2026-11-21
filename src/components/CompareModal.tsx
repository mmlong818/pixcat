import React, { useState } from 'react';
import { X, Columns2, SplitSquareHorizontal, ZoomIn, ZoomOut } from 'lucide-react';
import { Language, ReferenceItem } from '../types/library';
import { formatBytes } from '../utils/storage';

interface CompareModalProps {
  open: boolean;
  lang: Language;
  leftItem: ReferenceItem | null;
  rightItem: ReferenceItem | null;
  onClose: () => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  open,
  lang,
  leftItem,
  rightItem,
  onClose,
}) => {
  const [mode, setMode] = useState<'side-by-side' | 'split'>('side-by-side');
  const [splitPct, setSplitPct] = useState(50);
  const [zoom, setZoom] = useState(1);

  if (!open || !leftItem || !rightItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#141619]/95 backdrop-blur-md flex flex-col select-none text-neutral-200">
      <div className="h-12 px-4 bg-[#1E2024] border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
        <div className="font-display font-semibold text-sm text-white">
          {lang === 'zh' ? 'ACDSee 双图对比查看' : 'Compare 2 Images'}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded bg-white/[0.06]">
            <button
              type="button"
              onClick={() => setMode('side-by-side')}
              className={`h-7 px-2.5 rounded text-xs flex items-center gap-1.5 ${
                mode === 'side-by-side'
                  ? 'bg-[#4CC2FF] text-neutral-950 font-semibold'
                  : 'text-neutral-300'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '并排对比' : 'Side-by-Side'}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`h-7 px-2.5 rounded text-xs flex items-center gap-1.5 ${
                mode === 'split'
                  ? 'bg-[#4CC2FF] text-neutral-950 font-semibold'
                  : 'text-neutral-300'
              }`}
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '卷帘对比' : 'Split Wipe'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono tabular-nums w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
            className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-[#C42B1C] flex items-center justify-center ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {mode === 'side-by-side' ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {[leftItem, rightItem].map((item) => (
            <div key={item.id} className="flex flex-col min-h-0">
              <div className="h-9 px-4 bg-[#191B1F] border-b border-white/[0.06] flex items-center justify-between text-xs">
                <span className="font-medium text-white truncate">{item.title}</span>
                <span className="font-mono tabular-nums text-neutral-400 shrink-0 ml-2">
                  {item.dimensions} · {formatBytes(item.fileSizeBytes)}
                </span>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[#121417]">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    style={{ transform: `scale(${zoom})` }}
                    className="max-w-full max-h-full object-contain transition-transform"
                  />
                ) : (
                  <div className="text-xs text-neutral-500">No preview</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="relative flex-1 bg-[#121417] overflow-hidden flex items-center justify-center p-6">
            <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
              {rightItem.imageUrl && (
                <img
                  src={rightItem.imageUrl}
                  alt={rightItem.title}
                  referrerPolicy="no-referrer"
                  style={{ transform: `scale(${zoom})` }}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              {leftItem.imageUrl && (
                <div
                  style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <img
                    src={leftItem.imageUrl}
                    alt={leftItem.title}
                    referrerPolicy="no-referrer"
                    style={{ transform: `scale(${zoom})` }}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="h-12 px-6 bg-[#1E2024] border-t border-white/[0.08] flex items-center gap-4">
            <span className="text-xs text-neutral-300 truncate max-w-[200px]">
              {leftItem.title}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={splitPct}
              onChange={(e) => setSplitPct(Number(e.target.value))}
              className="flex-1 accent-[#4CC2FF]"
            />
            <span className="text-xs text-neutral-300 truncate max-w-[200px] text-right">
              {rightItem.title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
