import { zip, unzip } from 'fflate';
import {
  PoseWearCategory,
  ReferenceItem,
  VaultConfig,
  VaultMediaStats,
} from '../types/library';
import {
  collectPoseWearMediaTargets,
  POSEWEAR_DATASET_FILES,
} from './posewearLoader';

export interface VaultDirHandleLike extends FileSystemDirectoryHandle {
  queryPermission?: (desc?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  requestPermission?: (desc?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
}

export interface LoadedVaultData {
  config: VaultConfig | null;
  items: ReferenceItem[];
  customPoseWearRaw: Partial<Record<PoseWearCategory, unknown>>;
  localMediaUrls: Map<string, string>;
  stats: VaultMediaStats;
}

const CONFIG_FILE = 'pixcat.config.json';

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 80) || 'asset';
}

function extFromMime(mime?: string): string {
  if (!mime) return 'png';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('svg')) return 'svg';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('markdown')) return 'md';
  return 'png';
}

async function getSubDir(
  root: FileSystemDirectoryHandle,
  segments: string[],
  create = false
): Promise<FileSystemDirectoryHandle | null> {
  let cur: FileSystemDirectoryHandle = root;
  for (const seg of segments) {
    if (!seg) continue;
    try {
      cur = await cur.getDirectoryHandle(seg, { create });
    } catch {
      return null;
    }
  }
  return cur;
}

async function writeFileAt(
  root: FileSystemDirectoryHandle,
  relPath: string,
  data: Blob | Uint8Array | string
): Promise<void> {
  const parts = relPath.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return;
  const dir = await getSubDir(root, parts, true);
  if (!dir) return;
  const fileHandle = await dir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  if (typeof data === 'string') {
    await writable.write(data);
  } else if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    await writable.write(new Blob([copy.buffer]));
  } else {
    await writable.write(data);
  }
  await writable.close();
}

async function fileExistsAt(
  root: FileSystemDirectoryHandle,
  relPath: string
): Promise<boolean> {
  const parts = relPath.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return false;
  const dir = await getSubDir(root, parts, false);
  if (!dir) return false;
  try {
    await dir.getFileHandle(fileName);
    return true;
  } catch {
    return false;
  }
}

async function readTextAt(
  root: FileSystemDirectoryHandle,
  relPath: string
): Promise<string | null> {
  const parts = relPath.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return null;
  const dir = await getSubDir(root, parts, false);
  if (!dir) return null;
  try {
    const fh = await dir.getFileHandle(fileName);
    const file = await fh.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

async function walkDirectoryFiles(
  dir: FileSystemDirectoryHandle,
  prefix = ''
): Promise<Array<{ relPath: string; file: File }>> {
  const results: Array<{ relPath: string; file: File }> = [];
  const iter = (dir as VaultDirHandleLike).values?.();
  if (!iter) return results;

  for await (const entry of iter) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === 'file') {
      const file = await (entry as FileSystemFileHandle).getFile();
      results.push({ relPath: rel, file });
    } else if (entry.kind === 'directory') {
      const sub = await walkDirectoryFiles(
        entry as FileSystemDirectoryHandle,
        rel
      );
      results.push(...sub);
    }
  }
  return results;
}

export async function pickVaultDirectory(): Promise<VaultDirHandleLike | null> {
  const picker = (
    window as unknown as {
      showDirectoryPicker?: (opts?: {
        id?: string;
        mode?: 'read' | 'readwrite';
      }) => Promise<VaultDirHandleLike>;
    }
  ).showDirectoryPicker;
  if (!picker) return null;
  return await picker({ id: 'pixcat-vault', mode: 'readwrite' });
}

export async function verifyVaultPermission(
  handle: VaultDirHandleLike,
  request = false
): Promise<PermissionState> {
  try {
    if (!handle.queryPermission) return 'granted';
    const perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') return 'granted';
    if (request && handle.requestPermission) {
      return await handle.requestPermission({ mode: 'readwrite' });
    }
    return perm;
  } catch {
    return 'denied';
  }
}

function resolveItemsWithAssetsMap(
  rawItems: ReferenceItem[],
  assetsMap: Map<string, string>
): ReferenceItem[] {
  return rawItems.map((item) => {
    if (item.vaultPath && assetsMap.has(item.vaultPath)) {
      const objectUrl = assetsMap.get(item.vaultPath)!;
      if (item.type === 'motion' || item.type === 'audio') {
        return { ...item, mediaUrl: objectUrl };
      }
      return {
        ...item,
        imageUrl: objectUrl,
        highResUrl: objectUrl,
      };
    }
    return item;
  });
}

export async function readVaultFromHandle(
  handle: FileSystemDirectoryHandle
): Promise<LoadedVaultData> {
  const configText = await readTextAt(handle, CONFIG_FILE);
  let config: VaultConfig | null = null;
  if (configText) {
    try {
      const parsed = JSON.parse(configText);
      if (parsed && parsed.app === 'pixcat') {
        config = parsed as VaultConfig;
      }
    } catch {
      config = null;
    }
  }

  const assetsMap = new Map<string, string>();
  const assetsDir = await getSubDir(handle, ['assets'], false);
  if (assetsDir) {
    const assetFiles = await walkDirectoryFiles(assetsDir, 'assets');
    for (const { relPath, file } of assetFiles) {
      assetsMap.set(relPath, URL.createObjectURL(file));
    }
  }

  const customPoseWearRaw: Partial<Record<PoseWearCategory, unknown>> = {};
  let hasPoseWearData = false;
  for (const [cat, fileName] of Object.entries(POSEWEAR_DATASET_FILES) as Array<
    [PoseWearCategory, string]
  >) {
    const text = await readTextAt(handle, `posewear/data/${fileName}`);
    if (text) {
      try {
        customPoseWearRaw[cat] = JSON.parse(text);
        hasPoseWearData = true;
      } catch {
        // fallback to app default
      }
    }
  }

  const localMediaUrls = new Map<string, string>();
  const mediaDir = await getSubDir(handle, ['posewear', 'media'], false);
  if (mediaDir) {
    const mediaFiles = await walkDirectoryFiles(mediaDir);
    for (const { relPath, file } of mediaFiles) {
      localMediaUrls.set(relPath, URL.createObjectURL(file));
    }
  }

  const items = config ? resolveItemsWithAssetsMap(config.items || [], assetsMap) : [];

  return {
    config,
    items,
    customPoseWearRaw,
    localMediaUrls,
    stats: {
      folderName: handle.name,
      assetsCount: assetsMap.size,
      mediaFilesCount: localMediaUrls.size,
      hasPoseWearData,
    },
  };
}

export async function readVaultFromFileList(
  fileList: FileList
): Promise<LoadedVaultData> {
  const files = Array.from(fileList);
  let folderName = 'PixCat-Vault';
  let config: VaultConfig | null = null;
  const assetsMap = new Map<string, string>();
  const localMediaUrls = new Map<string, string>();
  const customPoseWearRaw: Partial<Record<PoseWearCategory, unknown>> = {};
  let hasPoseWearData = false;

  const dataMap = new Map<string, PoseWearCategory>();
  for (const [cat, fileName] of Object.entries(POSEWEAR_DATASET_FILES) as Array<
    [PoseWearCategory, string]
  >) {
    dataMap.set(`posewear/data/${fileName}`, cat);
  }

  for (const file of files) {
    const rawPath =
      (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
      file.name;
    const parts = rawPath.split('/').filter(Boolean);
    if (parts.length > 1) {
      folderName = parts[0];
    }
    const rel = parts.length > 1 ? parts.slice(1).join('/') : parts[0];

    if (rel === CONFIG_FILE) {
      try {
        const parsed = JSON.parse(await file.text());
        if (parsed && parsed.app === 'pixcat') {
          config = parsed as VaultConfig;
        }
      } catch {
        // ignore invalid json
      }
    } else if (rel.startsWith('assets/')) {
      assetsMap.set(rel, URL.createObjectURL(file));
    } else if (dataMap.has(rel)) {
      try {
        customPoseWearRaw[dataMap.get(rel)!] = JSON.parse(await file.text());
        hasPoseWearData = true;
      } catch {
        // ignore
      }
    } else if (rel.startsWith('posewear/media/')) {
      localMediaUrls.set(
        rel.slice('posewear/media/'.length),
        URL.createObjectURL(file)
      );
    }
  }

  const items = config ? resolveItemsWithAssetsMap(config.items || [], assetsMap) : [];

  return {
    config,
    items,
    customPoseWearRaw,
    localMediaUrls,
    stats: {
      folderName,
      assetsCount: assetsMap.size,
      mediaFilesCount: localMediaUrls.size,
      hasPoseWearData,
    },
  };
}

export async function writeAssetFileToVault(
  handle: FileSystemDirectoryHandle,
  itemId: string,
  title: string,
  blobOrFile: Blob | File
): Promise<string> {
  const mime = blobOrFile.type || '';
  const origName =
    blobOrFile instanceof File ? blobOrFile.name : `${title}.${extFromMime(mime)}`;
  const ext = origName.includes('.')
    ? origName.split('.').pop() || extFromMime(mime)
    : extFromMime(mime);
  const cleanTitle = sanitizeFilename(title.replace(/\.[^/.]+$/, ''));
  const relPath = `assets/${itemId}-${cleanTitle}.${ext}`;
  await writeFileAt(handle, relPath, blobOrFile);
  return relPath;
}

export async function deleteAssetFileFromVault(
  handle: FileSystemDirectoryHandle,
  vaultPath?: string
): Promise<void> {
  if (!vaultPath || !vaultPath.startsWith('assets/')) return;
  const parts = vaultPath.split('/').filter(Boolean);
  const fileName = parts.pop();
  if (!fileName) return;
  const dir = await getSubDir(handle, parts, false);
  if (!dir) return;
  try {
    await dir.removeEntry(fileName);
  } catch {
    // ignore missing file
  }
}

function serializeItemsForConfig(items: ReferenceItem[]): ReferenceItem[] {
  return items
    .filter((i) => !i.localFolderId)
    .map((item) => {
      if (item.vaultPath) {
        return {
          ...item,
          imageUrl: undefined,
          highResUrl: undefined,
          mediaUrl: undefined,
        };
      }
      return item;
    });
}

export async function migrateItemsToVaultAssets(
  handle: FileSystemDirectoryHandle,
  items: ReferenceItem[]
): Promise<ReferenceItem[]> {
  const migrated: ReferenceItem[] = [];
  for (const item of items) {
    if (item.localFolderId) continue;
    if (item.vaultPath) {
      migrated.push(item);
      continue;
    }

    const src = item.imageUrl || item.mediaUrl;
    if (src && (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/src/assets/'))) {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const vaultPath = await writeAssetFileToVault(
          handle,
          item.id,
          item.title,
          blob
        );
        const objUrl = URL.createObjectURL(blob);
        if (item.type === 'motion' || item.type === 'audio') {
          migrated.push({ ...item, vaultPath, mediaUrl: objUrl });
        } else {
          migrated.push({
            ...item,
            vaultPath,
            imageUrl: objUrl,
            highResUrl: objUrl,
          });
        }
        continue;
      } catch {
        // keep inline if fetch failed
      }
    }
    migrated.push(item);
  }
  return migrated;
}

export async function writeVaultConfig(
  handle: FileSystemDirectoryHandle,
  config: Omit<VaultConfig, 'version' | 'app' | 'updatedAt'>
): Promise<void> {
  const payload: VaultConfig = {
    version: 1,
    app: 'pixcat',
    updatedAt: new Date().toISOString(),
    collections: config.collections,
    items: serializeItemsForConfig(config.items),
    posewearOverrides: config.posewearOverrides,
    settings: config.settings,
  };
  await writeFileAt(handle, CONFIG_FILE, JSON.stringify(payload, null, 2));
}

export async function syncPoseWearJsonToVault(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  for (const fileName of Object.values(POSEWEAR_DATASET_FILES)) {
    const res = await fetch(`/library-data/${fileName}`);
    const text = await res.text();
    await writeFileAt(handle, `posewear/data/${fileName}`, text);
  }
}

export async function downloadPoseWearMediaToVault(
  handle: FileSystemDirectoryHandle,
  categories: PoseWearCategory[],
  onProgress: (done: number, total: number, currentFile: string) => void,
  signal: AbortSignal
): Promise<{ downloaded: number; skipped: number; failed: number }> {
  await syncPoseWearJsonToVault(handle);
  const targets = await collectPoseWearMediaTargets(categories);
  const total = targets.length;
  let done = 0;
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  let cursor = 0;
  const CONCURRENCY = 6;

  async function worker() {
    while (cursor < targets.length) {
      if (signal.aborted) return;
      const idx = cursor++;
      const { url, relPath } = targets[idx];
      const diskPath = `posewear/media/${relPath}`;

      try {
        const exists = await fileExistsAt(handle, diskPath);
        if (exists) {
          skipped++;
        } else {
          const res = await fetch(url, {
            referrerPolicy: 'no-referrer',
            signal,
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const blob = await res.blob();
          await writeFileAt(handle, diskPath, blob);
          downloaded++;
        }
      } catch {
        if (!signal.aborted) failed++;
      } finally {
        done++;
        onProgress(done, total, relPath);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, Math.max(1, targets.length)) }, () =>
      worker()
    )
  );

  return { downloaded, skipped, failed };
}

export async function exportVaultAsZip(params: {
  vaultHandle?: FileSystemDirectoryHandle | null;
  items: ReferenceItem[];
  collections: VaultConfig['collections'];
  posewearOverrides: VaultConfig['posewearOverrides'];
  settings?: VaultConfig['settings'];
  includePoseWearJson?: boolean;
  onProgress?: (msg: string) => void;
}): Promise<Blob> {
  const {
    vaultHandle,
    items,
    collections,
    posewearOverrides,
    settings,
    includePoseWearJson = true,
    onProgress,
  } = params;

  const files: Record<string, Uint8Array> = {};
  const encoder = new TextEncoder();

  // 1. Prepare items & binary assets
  const exportedItems: ReferenceItem[] = [];
  onProgress?.('正在打包本地资源文件…');

  for (const item of items) {
    if (item.localFolderId) continue;

    if (item.vaultPath && vaultHandle) {
      // Read directly from vault handle if possible
      const parts = item.vaultPath.split('/').filter(Boolean);
      const fileName = parts.pop();
      const dir = fileName ? await getSubDir(vaultHandle, parts, false) : null;
      if (dir && fileName) {
        try {
          const fh = await dir.getFileHandle(fileName);
          const file = await fh.getFile();
          files[item.vaultPath] = new Uint8Array(await file.arrayBuffer());
          exportedItems.push({
            ...item,
            imageUrl: undefined,
            highResUrl: undefined,
            mediaUrl: undefined,
          });
          continue;
        } catch {
          // fallback below
        }
      }
    }

    const src = item.imageUrl || item.mediaUrl;
    if (
      src &&
      (src.startsWith('data:') ||
        src.startsWith('blob:') ||
        src.startsWith('/src/assets/'))
    ) {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const ext = extFromMime(blob.type);
        const cleanTitle = sanitizeFilename(item.title);
        const vaultPath = `assets/${item.id}-${cleanTitle}.${ext}`;
        files[vaultPath] = new Uint8Array(await blob.arrayBuffer());
        exportedItems.push({
          ...item,
          vaultPath,
          imageUrl: undefined,
          highResUrl: undefined,
          mediaUrl: undefined,
        });
        continue;
      } catch {
        // fallback keep inline
      }
    }

    exportedItems.push(item);
  }

  // 2. Write pixcat.config.json
  const config: VaultConfig = {
    version: 1,
    app: 'pixcat',
    updatedAt: new Date().toISOString(),
    collections,
    items: exportedItems,
    posewearOverrides,
    settings,
  };
  files[CONFIG_FILE] = encoder.encode(JSON.stringify(config, null, 2));

  // 3. Include PoseWear JSON datasets
  if (includePoseWearJson) {
    onProgress?.('正在写入 PoseWear 索引数据…');
    for (const fileName of Object.values(POSEWEAR_DATASET_FILES)) {
      const res = await fetch(`/library-data/${fileName}`);
      files[`posewear/data/${fileName}`] = new Uint8Array(
        await res.arrayBuffer()
      );
    }
  }

  // 4. Include cached posewear/media files if mapped directory has them
  if (vaultHandle) {
    const mediaDir = await getSubDir(vaultHandle, ['posewear', 'media'], false);
    if (mediaDir) {
      onProgress?.('正在打包目录内的离线 PoseWear 图片…');
      const mediaFiles = await walkDirectoryFiles(mediaDir, 'posewear/media');
      for (const { relPath, file } of mediaFiles) {
        files[relPath] = new Uint8Array(await file.arrayBuffer());
      }
    }
  }

  onProgress?.('正在生成 ZIP 压缩包…');
  return await new Promise<Blob>((resolve, reject) => {
    zip(files, { level: 1 }, (err, data) => {
      if (err) reject(err);
      else {
        const copy = new Uint8Array(data.byteLength);
        copy.set(data);
        resolve(new Blob([copy.buffer], { type: 'application/zip' }));
      }
    });
  });
}

export async function importVaultFromZip(zipFile: File): Promise<LoadedVaultData> {
  const buffer = new Uint8Array(await zipFile.arrayBuffer());
  const entries = await new Promise<Record<string, Uint8Array>>(
    (resolve, reject) => {
      unzip(buffer, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    }
  );

  const decoder = new TextDecoder();
  let config: VaultConfig | null = null;
  const assetsMap = new Map<string, string>();
  const localMediaUrls = new Map<string, string>();
  const customPoseWearRaw: Partial<Record<PoseWearCategory, unknown>> = {};
  let hasPoseWearData = false;

  const dataMap = new Map<string, PoseWearCategory>();
  for (const [cat, fileName] of Object.entries(POSEWEAR_DATASET_FILES) as Array<
    [PoseWearCategory, string]
  >) {
    dataMap.set(`posewear/data/${fileName}`, cat);
  }

  // Handle zip archives that may wrap contents inside a single top-level folder
  const rawKeys = Object.keys(entries).filter((k) => !k.endsWith('/'));
  const hasRootConfig = rawKeys.includes(CONFIG_FILE);
  const firstPrefix =
    !hasRootConfig && rawKeys.length > 0 && rawKeys[0].includes('/')
      ? rawKeys[0].slice(0, rawKeys[0].indexOf('/') + 1)
      : '';
  const allSharePrefix =
    firstPrefix.length > 0 && rawKeys.every((k) => k.startsWith(firstPrefix));

  for (const key of rawKeys) {
    const rel = allSharePrefix ? key.slice(firstPrefix.length) : key;
    const bytes = entries[key];
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);

    if (rel === CONFIG_FILE) {
      try {
        const parsed = JSON.parse(decoder.decode(copy));
        if (parsed && parsed.app === 'pixcat') {
          config = parsed as VaultConfig;
        }
      } catch {
        // ignore
      }
    } else if (rel.startsWith('assets/')) {
      assetsMap.set(rel, URL.createObjectURL(new Blob([copy.buffer])));
    } else if (dataMap.has(rel)) {
      try {
        customPoseWearRaw[dataMap.get(rel)!] = JSON.parse(decoder.decode(copy));
        hasPoseWearData = true;
      } catch {
        // ignore
      }
    } else if (rel.startsWith('posewear/media/')) {
      localMediaUrls.set(
        rel.slice('posewear/media/'.length),
        URL.createObjectURL(new Blob([copy.buffer]))
      );
    }
  }

  const items = config ? resolveItemsWithAssetsMap(config.items || [], assetsMap) : [];

  return {
    config,
    items,
    customPoseWearRaw,
    localMediaUrls,
    stats: {
      folderName: zipFile.name.replace(/\.zip$/i, ''),
      assetsCount: assetsMap.size,
      mediaFilesCount: localMediaUrls.size,
      hasPoseWearData,
    },
  };
}
