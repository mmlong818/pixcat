import {
  DEFAULT_ADJUSTMENTS,
  ImageAdjustments,
  LocalFolder,
  ReferenceItem,
} from '../types/library';
import { extractColorsFromImage, getImageDimensions } from './storage';

export type CropAspect = 'free' | '1:1' | '4:3' | '16:9' | '3:2';

/**
 * Renders an image with ACDSee adjustments (rotation, flips, brightness, contrast,
 * saturation, warmth, grayscale, optional aspect center-crop, and optional maxWidth resize)
 * onto an offscreen HTML5 Canvas.
 */
export async function renderAdjustedCanvas(
  src: string,
  adj: ImageAdjustments = DEFAULT_ADJUSTMENTS,
  cropAspect: CropAspect = 'free',
  maxWidth?: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sw = img.naturalWidth || img.width;
      const sh = img.naturalHeight || img.height;

      // Step 1: Center crop on original coordinates before rotation if aspect requested
      let sx = 0;
      let sy = 0;
      let cw = sw;
      let ch = sh;

      if (cropAspect !== 'free') {
        const [aw, ah] = cropAspect.split(':').map(Number);
        // If rotated 90 or 270, invert target ratio in pre-rotation coordinates
        const targetRatio =
          adj.rotate === 90 || adj.rotate === 270 ? ah / aw : aw / ah;
        const currentRatio = sw / sh;
        if (currentRatio > targetRatio) {
          cw = Math.round(sh * targetRatio);
          sx = Math.round((sw - cw) / 2);
        } else {
          ch = Math.round(sw / targetRatio);
          sy = Math.round((sh - ch) / 2);
        }
      }

      const rotatedSwap = adj.rotate === 90 || adj.rotate === 270;
      let outW = rotatedSwap ? ch : cw;
      let outH = rotatedSwap ? cw : ch;

      if (maxWidth && outW > maxWidth) {
        const scale = maxWidth / outW;
        outW = Math.round(outW * scale);
        outH = Math.round(outH * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, outW);
      canvas.height = Math.max(1, outH);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      // Build CSS-compatible Canvas filter
      const sepiaPct = adj.warmth > 0 ? Math.min(45, adj.warmth * 0.7) : 0;
      const hueDeg = adj.warmth < 0 ? Math.max(-25, adj.warmth * 0.45) : 0;
      ctx.filter = [
        `brightness(${adj.brightness}%)`,
        `contrast(${adj.contrast}%)`,
        `saturate(${adj.grayscale ? 0 : adj.saturate}%)`,
        sepiaPct > 0 ? `sepia(${sepiaPct}%)` : '',
        hueDeg !== 0 ? `hue-rotate(${hueDeg}deg)` : '',
      ]
        .filter(Boolean)
        .join(' ');

      ctx.save();
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((adj.rotate * Math.PI) / 180);
      ctx.scale(adj.flipH ? -1 : 1, adj.flipV ? -1 : 1);

      const drawW = rotatedSwap ? outH : outW;
      const drawH = rotatedSwap ? outW : outH;
      ctx.drawImage(img, sx, sy, cw, ch, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image for processing'));
    img.src = src;
  });
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  mime: 'image/jpeg' | 'image/png' | 'image/webp',
  quality = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas export failed'));
      },
      mime,
      quality
    );
  });
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const IMAGE_EXTS = /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i;
const VIDEO_EXTS = /\.(mp4|webm|mov|mkv)$/i;
const AUDIO_EXTS = /\.(mp3|wav|ogg|flac|m4a)$/i;
const DOC_EXTS = /\.(md|txt|json|pdf)$/i;

/**
 * Converts a File object from a local disk folder into a lightweight ReferenceItem
 * using ObjectURL (zero base64 bloat, fast ACDSee browsing of hundreds of local images).
 */
export async function fileToLocalDiskItem(
  file: File,
  folderId: string,
  relativePath: string,
  collectionId: string
): Promise<ReferenceItem | null> {
  const name = file.name;
  const isImg = file.type.startsWith('image/') || IMAGE_EXTS.test(name);
  const isVid = file.type.startsWith('video/') || VIDEO_EXTS.test(name);
  const isAud = file.type.startsWith('audio/') || AUDIO_EXTS.test(name);
  const isDoc = file.type.startsWith('text/') || DOC_EXTS.test(name);

  if (!isImg && !isVid && !isAud && !isDoc) return null;

  const id = `disk-${folderId}-${Math.random().toString(36).slice(2, 9)}`;
  const cleanTitle = name.replace(/\.[^/.]+$/, '');
  const createdAt = new Date(file.lastModified || Date.now()).toISOString();

  if (isImg) {
    const objectUrl = URL.createObjectURL(file);
    const [dimensions, colors] = await Promise.all([
      getImageDimensions(objectUrl),
      extractColorsFromImage(objectUrl),
    ]);
    return {
      id,
      title: cleanTitle,
      type: 'ui',
      imageUrl: objectUrl,
      collectionId,
      localFolderId: folderId,
      relativePath,
      tags: ['本地磁盘'],
      colors,
      dimensions,
      fileSizeBytes: file.size,
      createdAt,
      starred: false,
      rating: 0,
      acdLabel: 'none',
      notes: relativePath,
    };
  }

  if (isVid) {
    const objectUrl = URL.createObjectURL(file);
    return {
      id,
      title: cleanTitle,
      type: 'motion',
      mediaUrl: objectUrl,
      mediaMime: file.type || 'video/mp4',
      collectionId,
      localFolderId: folderId,
      relativePath,
      tags: ['本地视频'],
      colors: ['#1F2428', '#0067C0', '#8A949E'],
      dimensions: 'Video',
      fileSizeBytes: file.size,
      createdAt,
      starred: false,
      rating: 0,
      acdLabel: 'none',
      notes: relativePath,
    };
  }

  if (isAud) {
    const objectUrl = URL.createObjectURL(file);
    return {
      id,
      title: cleanTitle,
      type: 'audio',
      mediaUrl: objectUrl,
      mediaMime: file.type || 'audio/mpeg',
      collectionId,
      localFolderId: folderId,
      relativePath,
      tags: ['本地音频'],
      colors: ['#0067C0', '#4CC2FF', '#1F2428'],
      dimensions: 'Audio',
      fileSizeBytes: file.size,
      createdAt,
      starred: false,
      rating: 0,
      acdLabel: 'none',
      notes: relativePath,
    };
  }

  const text = await file.text().catch(() => '');
  return {
    id,
    title: cleanTitle,
    type: 'doc',
    collectionId,
    localFolderId: folderId,
    relativePath,
    tags: ['本地文档'],
    colors: ['#F3F3F3', '#0067C0', '#202020'],
    dimensions: name.split('.').pop()?.toUpperCase() || 'DOC',
    fileSizeBytes: file.size,
    createdAt,
    starred: false,
    rating: 0,
    acdLabel: 'none',
    notes: relativePath,
    docContent: text.slice(0, 6000) || relativePath,
  };
}

interface DirectoryHandleLike {
  name: string;
  kind: 'directory' | 'file';
  values?: () => AsyncIterable<DirectoryHandleLike>;
  getFile?: () => Promise<File>;
}

export async function pickLocalDirectoryViaFS(
  collectionId: string,
  maxFiles = 200
): Promise<{ folder: LocalFolder; items: ReferenceItem[] } | null> {
  const picker = (
    window as unknown as {
      showDirectoryPicker?: (opts?: { mode?: string }) => Promise<DirectoryHandleLike>;
    }
  ).showDirectoryPicker;

  if (!picker) return null;

  const dirHandle = await picker({ mode: 'read' });
  const folderId = `folder-${Date.now()}`;
  const collected: Array<{ file: File; path: string }> = [];

  async function walk(handle: DirectoryHandleLike, prefix: string, depth: number) {
    if (depth > 3 || collected.length >= maxFiles || !handle.values) return;
    for await (const entry of handle.values()) {
      if (collected.length >= maxFiles) break;
      const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === 'file' && entry.getFile) {
        const file = await entry.getFile();
        collected.push({ file, path: entryPath });
      } else if (entry.kind === 'directory') {
        await walk(entry, entryPath, depth + 1);
      }
    }
  }

  await walk(dirHandle, dirHandle.name, 0);

  const items: ReferenceItem[] = [];
  for (const { file, path } of collected) {
    const converted = await fileToLocalDiskItem(
      file,
      folderId,
      path,
      collectionId
    );
    if (converted) items.push(converted);
  }

  return {
    folder: {
      id: folderId,
      name: dirHandle.name,
      itemCount: items.length,
      mountedAt: new Date().toISOString(),
    },
    items,
  };
}
