import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  SlidersHorizontal,
  Play,
  Pause,
  Maximize,
  Minimize,
  Star,
  Download,
  Save,
  Film,
  Grid2x2,
  FileText,
  ExternalLink,
  Eye,
} from 'lucide-react';
import {
  AcdLabel,
  DEFAULT_ADJUSTMENTS,
  ImageAdjustments,
  Language,
  ReferenceItem,
} from '../types/library';
import { formatBytes } from '../utils/storage';
import {
  canvasToBlob,
  CropAspect,
  renderAdjustedCanvas,
  triggerBlobDownload,
} from '../utils/imageOps';
import { ACD_LABELS, t } from '../i18n';

interface QuickLookModalProps {
  lang: Language;
  item: ReferenceItem | null;
  items: ReferenceItem[];
  currentIndex: number;
  playingAudioId: string | null;
  onClose: () => void;
  onJumpTo: (id: string) => void;
  onUpdateItem: (id: string, patch: Partial<ReferenceItem>) => void;
  onSaveEditedCopy: (source: ReferenceItem, dataUrl: string, sizeBytes: number, dimensions: string) => void;
  onPlayAudio: (item: ReferenceItem) => void;
  onNotify: (msg: string) => void;
}

export const QuickLookModal: React.FC<QuickLookModalProps> = ({
  lang,
  item,
  items,
  currentIndex,
  playingAudioId,
  onClose,
  onJumpTo,
  onUpdateItem,
  onSaveEditedCopy,
  onPlayAudio,
  onNotify,
}) => {
  const strings = t(lang);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(1); // 1 = fit, or numeric scale when manual
  const [fitMode, setFitMode] = useState<'fit' | 'actual'>('fit');
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; px: number; py: number }>({
    x: 0,
    y: 0,
    px: 0,
    py: 0,
  });

  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [rightPanel, setRightPanel] = useState<'none' | 'info' | 'edit'>('info');
  const [backdrop, setBackdrop] = useState<'dark' | 'light' | 'checker'>('dark');
  const [slideshow, setSlideshow] = useState(false);
  const [slideSec, setSlideSec] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [compareOriginal, setCompareOriginal] = useState(false);

  const [adj, setAdj] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [cropAspect, setCropAspect] = useState<CropAspect>('free');
  const [exportFormat, setExportFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [exportQuality, setExportQuality] = useState(92);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < items.length - 1;

  // Reset zoom/pan and load item adjustments when switching images
  useEffect(() => {
    setFitMode('fit');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCompareOriginal(false);
    setCropAspect('free');
    setAdj(item?.adjustments ? { ...item.adjustments } : { ...DEFAULT_ADJUSTMENTS });
  }, [item?.id]);

  // Preload adjacent images for 0ms ACDSee switching
  useEffect(() => {
    if (currentIndex < 0) return;
    [currentIndex - 1, currentIndex + 1, currentIndex + 2].forEach((idx) => {
      const target = items[idx];
      if (target?.imageUrl) {
        const pre = new Image();
        pre.src = target.imageUrl;
      }
    });
  }, [currentIndex, items]);

  // Slideshow timer
  useEffect(() => {
    if (!slideshow || !item) return;
    const timer = window.setInterval(() => {
      if (currentIndex < items.length - 1) {
        onJumpTo(items[currentIndex + 1].id);
      } else if (items.length > 0) {
        onJumpTo(items[0].id);
      }
    }, slideSec * 1000);
    return () => window.clearInterval(timer);
  }, [slideshow, slideSec, currentIndex, items, item, onJumpTo]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const rotateBy = useCallback(
    (delta: 90 | -90) => {
      if (!item) return;
      setAdj((prev) => {
        const nextRot = (((prev.rotate + delta) % 360 + 360) % 360) as 0 | 90 | 180 | 270;
        const next = { ...prev, rotate: nextRot };
        onUpdateItem(item.id, { adjustments: next });
        return next;
      });
    },
    [item, onUpdateItem]
  );

  const toggleFlip = useCallback(
    (axis: 'H' | 'V') => {
      if (!item) return;
      setAdj((prev) => {
        const next =
          axis === 'H'
            ? { ...prev, flipH: !prev.flipH }
            : { ...prev, flipV: !prev.flipV };
        onUpdateItem(item.id, { adjustments: next });
        return next;
      });
    },
    [item, onUpdateItem]
  );

  // Keyboard shortcuts for ACDSee Fast Viewer
  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        onClose();
      } else if ((e.key === 'ArrowLeft' || e.key === 'PageUp') && hasPrev) {
        e.preventDefault();
        onJumpTo(items[currentIndex - 1].id);
      } else if ((e.key === 'ArrowRight' || e.key === 'PageDown') && hasNext) {
        e.preventDefault();
        onJumpTo(items[currentIndex + 1].id);
      } else if (e.key === '+' || e.key === '=') {
        setFitMode('actual');
        setZoom((z) => Math.min(8, +(z * 1.25).toFixed(2)));
      } else if (e.key === '-') {
        setFitMode('actual');
        setZoom((z) => Math.max(0.15, +(z / 1.25).toFixed(2)));
      } else if (e.key === '0') {
        setFitMode('fit');
        setZoom(1);
        setPan({ x: 0, y: 0 });
      } else if (e.key === '1' && !e.shiftKey && rightPanel !== 'edit') {
        // Key 1-5 rate image, or Shift+1 for 1:1
        onUpdateItem(item.id, { rating: 1 });
        onNotify(lang === 'zh' ? '评级：1 星' : 'Rated 1 star');
      } else if (['2', '3', '4', '5'].includes(e.key)) {
        const r = Number(e.key);
        onUpdateItem(item.id, { rating: r });
        onNotify(lang === 'zh' ? `评级：${r} 星` : `Rated ${r} stars`);
      } else if (e.key.toLowerCase() === 'l' || e.key === '[') {
        rotateBy(-90);
      } else if (e.key.toLowerCase() === 'r' || e.key === ']') {
        rotateBy(90);
      } else if (e.key.toLowerCase() === 'h') {
        toggleFlip('H');
      } else if (e.key.toLowerCase() === 'v') {
        toggleFlip('V');
      } else if (e.key.toLowerCase() === 'f') {
        setShowFilmstrip((s) => !s);
      } else if (e.key.toLowerCase() === 'e') {
        setRightPanel((p) => (p === 'edit' ? 'none' : 'edit'));
      } else if (e.key.toLowerCase() === 'i') {
        setRightPanel((p) => (p === 'info' ? 'none' : 'info'));
      } else if (e.key.toLowerCase() === 's') {
        setSlideshow((s) => !s);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    item,
    items,
    currentIndex,
    hasPrev,
    hasNext,
    rightPanel,
    lang,
    onClose,
    onJumpTo,
    onUpdateItem,
    onNotify,
    rotateBy,
    toggleFlip,
  ]);

  if (!item) return null;

  const isPlaying = playingAudioId === item.id;

  const handleWheel = (e: React.WheelEvent) => {
    if (!item.imageUrl) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setFitMode('actual');
    setZoom((z) => Math.min(8, Math.max(0.15, +(z * factor).toFixed(2))));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!item.imageUrl || (fitMode === 'fit' && zoom === 1)) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStartRef.current.px + (e.clientX - panStartRef.current.x),
      y: panStartRef.current.py + (e.clientY - panStartRef.current.y),
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const toggleFullscreen = async () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      await viewerContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const handleExportEdited = async (saveToLibrary: boolean) => {
    if (!item.imageUrl) return;
    try {
      const canvas = await renderAdjustedCanvas(item.imageUrl, adj, cropAspect);
      const blob = await canvasToBlob(canvas, exportFormat, exportQuality / 100);
      const ext =
        exportFormat === 'image/png'
          ? 'png'
          : exportFormat === 'image/webp'
            ? 'webp'
            : 'jpg';

      if (saveToLibrary) {
        const reader = new FileReader();
        reader.onload = () => {
          onSaveEditedCopy(
            item,
            reader.result as string,
            blob.size,
            `${canvas.width} × ${canvas.height}`
          );
          onNotify(
            lang === 'zh'
              ? '已将修图结果另存为新副本入库'
              : 'Saved edited copy to library'
          );
        };
        reader.readAsDataURL(blob);
      } else {
        triggerBlobDownload(blob, `${item.title}-edited.${ext}`);
        onNotify(
          lang === 'zh'
            ? `已导出 ${ext.toUpperCase()} 图像`
            : `Exported ${ext.toUpperCase()}`
        );
      }
    } catch {
      onNotify(lang === 'zh' ? '图像处理失败' : 'Image processing error');
    }
  };

  const activeAdj = compareOriginal ? DEFAULT_ADJUSTMENTS : adj;
  const imgFilter = [
    `brightness(${activeAdj.brightness}%)`,
    `contrast(${activeAdj.contrast}%)`,
    `saturate(${activeAdj.grayscale ? 0 : activeAdj.saturate}%)`,
    activeAdj.warmth > 0 ? `sepia(${Math.min(45, activeAdj.warmth * 0.7)}%)` : '',
    activeAdj.warmth < 0 ? `hue-rotate(${Math.max(-25, activeAdj.warmth * 0.45)}deg)` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const backdropStyle: React.CSSProperties =
    backdrop === 'light'
      ? { backgroundColor: '#ECEEF2' }
      : backdrop === 'checker'
        ? {
            backgroundColor: '#222',
            backgroundImage:
              'linear-gradient(45deg, #2d2d2d 25%, transparent 25%), linear-gradient(-45deg, #2d2d2d 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2d2d2d 75%), linear-gradient(-45deg, transparent 75%, #2d2d2d 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
          }
        : { backgroundColor: '#131518' };

  const copyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex).catch(() => {});
    onNotify(strings.copiedHex(hex));
  };

  return (
    <div
      ref={viewerContainerRef}
      className="fixed inset-0 z-50 bg-[#141619]/95 backdrop-blur-md flex flex-col select-none"
    >
      {/* Top ACDSee Viewer Toolbar */}
      <div className="h-12 px-3 bg-[#1E2024] border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0 text-neutral-200">
        {/* Left: Filename + Counter + Quick Rating */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono tabular-nums text-neutral-400 shrink-0">
            {currentIndex + 1} / {items.length}
          </span>
          <h2 className="font-display font-semibold text-sm text-white truncate max-w-[220px] md:max-w-xs">
            {item.title}
          </h2>
          <span className="hidden xl:inline text-xs font-mono tabular-nums text-neutral-400">
            {item.dimensions} · {formatBytes(item.fileSizeBytes)}
          </span>
        </div>

        {/* Center: Fast Viewer Transform & Zoom Controls */}
        {item.imageUrl && (
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setFitMode('actual');
                setZoom((z) => Math.max(0.15, +(z / 1.25).toFixed(2)));
              }}
              title={lang === 'zh' ? '缩小 (-)' : 'Zoom Out (-)'}
              className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (fitMode === 'fit') {
                  setFitMode('actual');
                  setZoom(1);
                } else {
                  setFitMode('fit');
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }
              }}
              title={lang === 'zh' ? '切换适应窗口 / 1:1 (0)' : 'Fit / 1:1 (0)'}
              className="h-7 px-2 rounded bg-white/[0.06] hover:bg-white/15 text-[11px] font-mono tabular-nums whitespace-nowrap"
            >
              {fitMode === 'fit' ? (lang === 'zh' ? '适应' : 'Fit') : `${Math.round(zoom * 100)}%`}
            </button>
            <button
              type="button"
              onClick={() => {
                setFitMode('actual');
                setZoom((z) => Math.min(8, +(z * 1.25).toFixed(2)));
              }}
              title={lang === 'zh' ? '放大 (+)' : 'Zoom In (+)'}
              className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-white/10 mx-1" />

            <button
              type="button"
              onClick={() => rotateBy(-90)}
              title={lang === 'zh' ? '向左旋转 90° (L)' : 'Rotate Left (L)'}
              className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => rotateBy(90)}
              title={lang === 'zh' ? '向右旋转 90° (R)' : 'Rotate Right (R)'}
              className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleFlip('H')}
              title={lang === 'zh' ? '水平翻转 (H)' : 'Flip Horizontal (H)'}
              className={`w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center ${
                adj.flipH ? 'text-[#4CC2FF] bg-white/10' : ''
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleFlip('V')}
              title={lang === 'zh' ? '垂直翻转 (V)' : 'Flip Vertical (V)'}
              className={`w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center ${
                adj.flipV ? 'text-[#4CC2FF] bg-white/10' : ''
              }`}
            >
              <FlipVertical className="w-4 h-4" />
            </button>

            <span className="w-px h-4 bg-white/10 mx-1" />

            <button
              type="button"
              onClick={() =>
                setBackdrop((b) =>
                  b === 'dark' ? 'light' : b === 'light' ? 'checker' : 'dark'
                )
              }
              title={lang === 'zh' ? '切换看图背景（深/浅/透明网格）' : 'Cycle Backdrop'}
              className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"
            >
              <Grid2x2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSlideshow((s) => !s)}
              title={lang === 'zh' ? '幻灯片自动播放 (S)' : 'Slideshow (S)'}
              className={`h-7 px-2.5 rounded flex items-center gap-1.5 text-xs ${
                slideshow
                  ? 'bg-[#4CC2FF] text-neutral-950 font-semibold'
                  : 'hover:bg-white/10 text-neutral-300'
              }`}
            >
              {slideshow ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden lg:inline">
                {slideshow ? `${slideSec}s` : lang === 'zh' ? '幻灯片' : 'Slide'}
              </span>
            </button>

            {slideshow && (
              <select
                value={slideSec}
                onChange={(e) => setSlideSec(Number(e.target.value))}
                className="h-7 px-1.5 rounded bg-white/10 text-[11px] font-mono text-white focus:outline-none"
              >
                <option value={2} className="bg-[#222]">2s</option>
                <option value={3} className="bg-[#222]">3s</option>
                <option value={5} className="bg-[#222]">5s</option>
                <option value={8} className="bg-[#222]">8s</option>
              </select>
            )}
          </div>
        )}

        {/* Right: Edit, Info, Filmstrip, Fullscreen, Close */}
        <div className="flex items-center gap-1 shrink-0">
          {item.imageUrl && (
            <button
              type="button"
              onClick={() => setRightPanel((p) => (p === 'edit' ? 'none' : 'edit'))}
              className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 ${
                rightPanel === 'edit'
                  ? 'bg-[#4CC2FF] text-neutral-950'
                  : 'hover:bg-white/10 text-neutral-200'
              }`}
              title="E"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'zh' ? '修图编辑' : 'Edit'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setRightPanel((p) => (p === 'info' ? 'none' : 'info'))}
            className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 ${
              rightPanel === 'info'
                ? 'bg-white/15 text-white'
                : 'hover:bg-white/10 text-neutral-300'
            }`}
            title="I"
          >
            <span>{lang === 'zh' ? '属性' : 'Info'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFilmstrip((s) => !s)}
            title={lang === 'zh' ? '胶片缩略图带 (F)' : 'Filmstrip (F)'}
            className={`w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center ${
              showFilmstrip ? 'text-[#4CC2FF]' : 'text-neutral-400'
            }`}
          >
            <Film className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={lang === 'zh' ? '全屏看图' : 'Fullscreen'}
            className="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center text-neutral-300"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-[#C42B1C] text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
            title="Esc / Space"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewer Canvas + Right Edit/Info Drawer */}
      <div className="flex-1 min-h-0 flex">
        <div
          style={item.imageUrl ? backdropStyle : undefined}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative flex-1 min-w-0 flex items-center justify-center overflow-hidden ${
            fitMode === 'actual' || zoom > 1 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
          }`}
        >
          {hasPrev && (
            <button
              type="button"
              onClick={() => onJumpTo(items[currentIndex - 1].id)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/15 flex items-center justify-center transition-colors"
              title="←"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {hasNext && (
            <button
              type="button"
              onClick={() => onJumpTo(items[currentIndex + 1].id)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/15 flex items-center justify-center transition-colors"
              title="→"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {item.imageUrl ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={item.imageUrl}
                alt={item.title}
                draggable={false}
                referrerPolicy="no-referrer"
                onDoubleClick={() => {
                  if (fitMode === 'fit') {
                    setFitMode('actual');
                    setZoom(1.5);
                  } else {
                    setFitMode('fit');
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }
                }}
                style={{
                  filter: imgFilter,
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${
                    fitMode === 'fit' ? 1 : zoom
                  }) rotate(${activeAdj.rotate}deg) scaleX(${
                    activeAdj.flipH ? -1 : 1
                  }) scaleY(${activeAdj.flipV ? -1 : 1})`,
                }}
                className={`transition-transform duration-75 select-none shadow-2xl ${
                  fitMode === 'fit'
                    ? 'max-w-full max-h-full object-contain'
                    : 'max-w-none'
                }`}
              />
            </div>
          ) : item.mediaUrl && item.mediaMime?.startsWith('video/') ? (
            <video src={item.mediaUrl} controls autoPlay className="max-w-[90%] max-h-[85%] rounded shadow-2xl" />
          ) : item.type === 'audio' ? (
            <div className="w-full max-w-md p-8 rounded-xl bg-[#22252A] border border-white/10 text-center space-y-5">
              <button
                type="button"
                onClick={() => onPlayAudio(item)}
                className="w-16 h-16 mx-auto rounded-full bg-[#4CC2FF] text-neutral-950 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </button>
              <div className="text-white font-display font-semibold">{item.title}</div>
              <div className="text-xs font-mono text-neutral-400 tabular-nums">
                {item.dimensions} · {formatBytes(item.fileSizeBytes)}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl max-h-[80%] overflow-y-auto win-scroll bg-[#1F2227] border border-white/10 rounded-lg p-8 text-neutral-200">
              <div className="flex items-center gap-2 text-[#4CC2FF] mb-4">
                <FileText className="w-5 h-5" />
                <span className="text-xs font-mono">{strings.typeNames[item.type]}</span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-7">
                {item.docContent || item.notes}
              </pre>
            </div>
          )}
        </div>

        {/* Right Side Drawer: Edit Mode OR Info Mode */}
        {rightPanel !== 'none' && (
          <div className="w-80 shrink-0 bg-[#1E2024] border-l border-white/[0.08] text-neutral-200 overflow-y-auto win-scroll p-4 space-y-5">
            {rightPanel === 'edit' && item.imageUrl ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    {lang === 'zh' ? 'ACDSee 图像调整' : 'Image Adjustments'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onMouseDown={() => setCompareOriginal(true)}
                      onMouseUp={() => setCompareOriginal(false)}
                      onMouseLeave={() => setCompareOriginal(false)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>{lang === 'zh' ? '按住看原图' : 'Original'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdj({ ...DEFAULT_ADJUSTMENTS });
                        setCropAspect('free');
                        onUpdateItem(item.id, { adjustments: { ...DEFAULT_ADJUSTMENTS } });
                      }}
                      className="px-2 py-1 rounded text-[11px] text-neutral-400 hover:text-white"
                    >
                      {lang === 'zh' ? '重置' : 'Reset'}
                    </button>
                  </div>
                </div>

                {/* Sliders */}
                <div className="space-y-3 text-xs">
                  {[
                    {
                      key: 'brightness' as const,
                      label: lang === 'zh' ? '亮度' : 'Brightness',
                      min: 50,
                      max: 150,
                      unit: '%',
                    },
                    {
                      key: 'contrast' as const,
                      label: lang === 'zh' ? '对比度' : 'Contrast',
                      min: 50,
                      max: 150,
                      unit: '%',
                    },
                    {
                      key: 'saturate' as const,
                      label: lang === 'zh' ? '饱和度' : 'Saturation',
                      min: 0,
                      max: 200,
                      unit: '%',
                    },
                    {
                      key: 'warmth' as const,
                      label: lang === 'zh' ? '色温倾向' : 'Warmth',
                      min: -50,
                      max: 50,
                      unit: '',
                    },
                  ].map((ctrl) => (
                    <div key={ctrl.key}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-neutral-400">{ctrl.label}</span>
                        <span className="font-mono tabular-nums text-neutral-200">
                          {adj[ctrl.key]}
                          {ctrl.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        value={adj[ctrl.key]}
                        onChange={(e) => {
                          const next = { ...adj, [ctrl.key]: Number(e.target.value) };
                          setAdj(next);
                          onUpdateItem(item.id, { adjustments: next });
                        }}
                        className="w-full accent-[#4CC2FF]"
                      />
                    </div>
                  ))}

                  <label className="flex items-center justify-between pt-1 cursor-pointer">
                    <span className="text-neutral-300">
                      {lang === 'zh' ? '黑白单色模式' : 'Grayscale'}
                    </span>
                    <input
                      type="checkbox"
                      checked={adj.grayscale}
                      onChange={(e) => {
                        const next = { ...adj, grayscale: e.target.checked };
                        setAdj(next);
                        onUpdateItem(item.id, { adjustments: next });
                      }}
                      className="accent-[#4CC2FF]"
                    />
                  </label>
                </div>

                {/* Aspect Crop */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <div className="text-[11px] font-semibold text-neutral-400 mb-2">
                    {lang === 'zh' ? '导出裁剪比例' : 'Export Crop Ratio'}
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {(['free', '1:1', '4:3', '16:9', '3:2'] as CropAspect[]).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setCropAspect(ratio)}
                        className={`h-7 rounded text-[11px] font-mono ${
                          cropAspect === ratio
                            ? 'bg-[#4CC2FF] text-neutral-950 font-semibold'
                            : 'bg-white/[0.06] text-neutral-300 hover:bg-white/10'
                        }`}
                      >
                        {ratio === 'free' ? (lang === 'zh' ? '原比' : 'Free') : ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Format & Save */}
                <div className="pt-3 border-t border-white/[0.08] space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">
                        {lang === 'zh' ? '导出格式' : 'Format'}
                      </label>
                      <select
                        value={exportFormat}
                        onChange={(e) =>
                          setExportFormat(
                            e.target.value as 'image/jpeg' | 'image/png' | 'image/webp'
                          )
                        }
                        className="w-full h-8 px-2 rounded bg-white/[0.08] border border-white/10 text-xs focus:outline-none"
                      >
                        <option value="image/jpeg" className="bg-[#222]">JPEG</option>
                        <option value="image/png" className="bg-[#222]">PNG</option>
                        <option value="image/webp" className="bg-[#222]">WebP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 mb-1">
                        {lang === 'zh' ? '画质' : 'Quality'} ({exportQuality}%)
                      </label>
                      <input
                        type="range"
                        min={40}
                        max={100}
                        value={exportQuality}
                        onChange={(e) => setExportQuality(Number(e.target.value))}
                        className="w-full mt-2 accent-[#4CC2FF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleExportEdited(true)}
                      className="h-8 rounded bg-white/10 hover:bg-white/20 text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{lang === 'zh' ? '存为副本' : 'Save Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportEdited(false)}
                      className="h-8 rounded bg-[#4CC2FF] hover:bg-[#3BB5F5] text-neutral-950 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'zh' ? '导出文件' : 'Export'}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Info & ACDSee Rating/Label Panel */
              <>
                <div>
                  <div className="text-[11px] font-semibold text-neutral-400 mb-2">
                    {strings.ratingLabel}
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() =>
                          onUpdateItem(item.id, {
                            rating: item.rating === starVal ? 0 : starVal,
                          })
                        }
                        className="p-1 rounded hover:bg-white/10"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            (item.rating || 0) >= starVal
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-neutral-400 mb-2">
                    {strings.acdLabelTitle}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onUpdateItem(item.id, { acdLabel: 'none' })}
                      className={`px-2 py-1 rounded text-[11px] border ${
                        !item.acdLabel || item.acdLabel === 'none'
                          ? 'border-white text-white'
                          : 'border-white/15 text-neutral-400'
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
                        className={`w-6 h-6 rounded-[4px] flex items-center justify-center ${
                          item.acdLabel === lbl.id
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1E2024]'
                            : ''
                        }`}
                        style={{ backgroundColor: lbl.hex }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-neutral-400 mb-2">
                    {strings.palette}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.colors.map((hex, i) => (
                      <button
                        key={`${hex}-${i}`}
                        type="button"
                        onClick={() => copyHex(hex)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.06] hover:bg-white/15 text-[11px] font-mono"
                      >
                        <span
                          className="w-3 h-3 rounded-[2px] border border-white/20"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{hex}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-semibold text-neutral-400 mb-1.5">
                    {strings.notesLabel}
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-300">
                    {item.notes || '—'}
                  </p>
                </div>

                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#4CC2FF] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{item.domain || item.sourceUrl}</span>
                  </a>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom ACDSee Filmstrip Thumbnail Strip */}
      {showFilmstrip && items.length > 1 && (
        <div className="h-20 px-3 bg-[#1A1C20] border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto win-scroll shrink-0">
          {items.map((thumb) => {
            const active = thumb.id === item.id;
            return (
              <button
                key={thumb.id}
                type="button"
                onClick={() => onJumpTo(thumb.id)}
                className={`relative h-14 w-20 rounded-[4px] overflow-hidden shrink-0 border-2 transition-all ${
                  active
                    ? 'border-[#4CC2FF] scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                {thumb.imageUrl ? (
                  <img
                    src={thumb.imageUrl}
                    alt={thumb.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#2A2D34] flex items-center justify-center text-[10px] font-mono text-neutral-300">
                    {thumb.type.toUpperCase()}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
