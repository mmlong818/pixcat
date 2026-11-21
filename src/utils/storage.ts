import { Collection, ReferenceItem } from '../types/refto';

const DB_NAME = 'refto_windows_local_db';
const DB_VERSION = 1;
const STORE_NAME = 'workspace';

export interface StoredWorkspace {
  items: ReferenceItem[];
  collections: Collection[];
  updatedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadWorkspace(): Promise<StoredWorkspace | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('default');
      req.onsuccess = () => resolve((req.result as StoredWorkspace) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveWorkspace(data: StoredWorkspace): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, 'default');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fail quietly if IndexedDB is restricted
  }
}

export async function clearWorkspace(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete('default');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function hexDistance(hexA: string, hexB: string): number {
  const parse = (h: string) => {
    const clean = h.replace('#', '');
    const num = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };
  try {
    const [r1, g1, b1] = parse(hexA);
    const [r2, g2, b2] = parse(hexB);
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  } catch {
    return 999;
  }
}

/**
 * Extracts 5 representative colors from an image DataURL or URL using an offscreen Canvas.
 */
export async function extractColorsFromImage(src: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 24;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(['#1F2428', '#0067C0', '#D9D4CB', '#5C646D', '#F3F3F3']);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;
        const buckets = new Map<string, number>();

        for (let i = 0; i < data.length; i += 4) {
          const r = Math.round(data[i] / 24) * 24;
          const g = Math.round(data[i + 1] / 24) * 24;
          const b = Math.round(data[i + 2] / 24) * 24;
          const hex = `#${[r, g, b]
            .map((v) => Math.min(255, v).toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase()}`;
          buckets.set(hex, (buckets.get(hex) || 0) + 1);
        }

        const sorted = Array.from(buckets.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([hex]) => hex);

        const picked: string[] = [];
        for (const hex of sorted) {
          if (picked.every((existing) => hexDistance(existing, hex) > 48)) {
            picked.push(hex);
          }
          if (picked.length >= 5) break;
        }
        resolve(picked.length > 0 ? picked : ['#1F2428', '#0067C0', '#D9D4CB']);
      } catch {
        resolve(['#1F2428', '#0067C0', '#D9D4CB', '#5C646D', '#F3F3F3']);
      }
    };
    img.onerror = () => resolve(['#1F2428', '#0067C0', '#D9D4CB', '#5C646D', '#F3F3F3']);
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.onerror = () => resolve('—');
    img.src = src;
  });
}
