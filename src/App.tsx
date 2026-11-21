import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ActiveNav,
  AssetType,
  Collection,
  Language,
  LocalFolder,
  PoseWearItemOverride,
  ReferenceItem,
  SortMode,
  ViewMode,
  WindowState,
} from './types/library';
import {
  COLOR_FILTERS,
  INITIAL_COLLECTIONS,
  INITIAL_ITEMS,
} from './data/seedLibrary';
import {
  clearWorkspace,
  extractColorsFromImage,
  getImageDimensions,
  hexDistance,
  loadWorkspace,
  readFileAsDataUrl,
  saveWorkspace,
} from './utils/storage';
import {
  fileToLocalDiskItem,
  pickLocalDirectoryViaFS,
} from './utils/imageOps';
import { loadPoseWearDatasets } from './utils/posewearLoader';
import { playSynthPreset, stopSynthAudio } from './utils/audioSynth';
import { useOnlineStatus, usePWAInstall } from './hooks/usePWA';
import { ACD_LABELS, t } from './i18n';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { CommandBar } from './components/CommandBar';
import { ReferenceGallery } from './components/ReferenceGallery';
import { InspectorPane } from './components/InspectorPane';
import { QuickLookModal } from './components/QuickLookModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { AddReferenceModal } from './components/AddReferenceModal';
import { ContextMenu } from './components/ContextMenu';
import { WindowsEditionView } from './components/WindowsEditionView';
import { CompareModal } from './components/CompareModal';
import { BatchModal } from './components/BatchModal';

export default function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [dark, setDark] = useState<boolean>(false);
  const [windowState, setWindowState] = useState<WindowState>('maximized');

  const { isInstallable, isInstalled, offlineReady, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const [customItems, setCustomItems] = useState<ReferenceItem[]>(INITIAL_ITEMS);
  const [posewearItems, setPosewearItems] = useState<ReferenceItem[]>([]);
  const [posewearOverrides, setPosewearOverrides] = useState<
    Record<string, PoseWearItemOverride>
  >({});
  const [collections, setCollections] =
    useState<Collection[]>(INITIAL_COLLECTIONS);
  const [localFolders, setLocalFolders] = useState<LocalFolder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [navHistory, setNavHistory] = useState<ActiveNav[]>([
    { kind: 'posewear', category: 'pose' },
  ]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const activeNav = navHistory[historyIdx];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeColorId, setActiveColorId] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [showAdult, setShowAdult] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [gridCols, setGridCols] = useState<number>(4);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_ITEMS[0].id);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [quickLookId, setQuickLookId] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: ReferenceItem;
  } | null>(null);

  const dirInputRef = useRef<HTMLInputElement>(null);
  const strings = t(lang);

  const items = useMemo(
    () => [...customItems, ...posewearItems],
    [customItems, posewearItems]
  );

  const notify = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    let mounted = true;
    loadWorkspace().then(async (stored) => {
      if (!mounted) return;
      if (stored && Array.isArray(stored.items) && stored.items.length > 0) {
        setCustomItems(stored.items);
      }
      if (
        stored &&
        Array.isArray(stored.collections) &&
        stored.collections.length > 0
      ) {
        setCollections(stored.collections);
      }
      const overrides = stored?.posewearOverrides || {};
      setPosewearOverrides(overrides);
      setHydrated(true);

      try {
        const bundle = await loadPoseWearDatasets(overrides);
        if (!mounted) return;
        const combined = [
          ...bundle.pose,
          ...bundle.depth,
          ...bundle.costume,
          ...bundle.anime,
          ...bundle.portrait,
        ];
        setPosewearItems(combined);
        const firstSafePose = bundle.pose.find((p) => !p.isAdult) || bundle.pose[0];
        if (firstSafePose) {
          setSelectedId(firstSafePose.id);
        }
      } catch {
        // PoseWear datasets unavailable offline before precache
      }
    });
    return () => {
      mounted = false;
      stopSynthAudio();
    };
  }, []);

  // Persist custom items, collections, and PoseWear user overrides (exclude transient ObjectURL disk mounts)
  useEffect(() => {
    if (!hydrated) return;
    const persistentItems = customItems.filter((i) => !i.localFolderId);
    saveWorkspace({
      items: persistentItems,
      collections,
      posewearOverrides,
      updatedAt: new Date().toISOString(),
    });
  }, [customItems, collections, posewearOverrides, hydrated]);

  const navigateTo = useCallback(
    (next: ActiveNav) => {
      setNavHistory((prev) => {
        const sliced = prev.slice(0, historyIdx + 1);
        return [...sliced, next];
      });
      setHistoryIdx((idx) => idx + 1);
      setCheckedIds([]);
      setSubCategoryFilter('all');
    },
    [historyIdx]
  );

  // Base category items (before 18+ filter and sub-category filter)
  const baseNavItems = useMemo(() => {
    if (activeNav.kind === 'posewear') {
      return items.filter((i) => i.posewearCat === activeNav.category);
    }
    if (activeNav.kind === 'library') {
      if (activeNav.filter === 'starred') {
        return items.filter((i) => i.starred);
      }
      if (activeNav.filter !== 'all') {
        return items.filter((i) => !i.posewearCat && i.type === activeNav.filter);
      }
      return items;
    }
    if (activeNav.kind === 'collection') {
      return items.filter((i) => i.collectionId === activeNav.collectionId);
    }
    if (activeNav.kind === 'local-folder') {
      return items.filter((i) => i.localFolderId === activeNav.folderId);
    }
    if (activeNav.kind === 'rating') {
      return items.filter((i) => (i.rating || 0) >= activeNav.minRating);
    }
    if (activeNav.kind === 'label') {
      return items.filter((i) => i.acdLabel === activeNav.label);
    }
    return items;
  }, [items, activeNav]);

  const adultHiddenCount = useMemo(
    () => baseNavItems.filter((i) => i.isAdult).length,
    [baseNavItems]
  );

  const adultFilteredItems = useMemo(
    () => (showAdult ? baseNavItems : baseNavItems.filter((i) => !i.isAdult)),
    [baseNavItems, showAdult]
  );

  const subCategories = useMemo(() => {
    if (activeNav.kind !== 'posewear') return [];
    const counts = new Map<string, number>();
    for (const item of adultFilteredItems) {
      if (item.subCategory) {
        counts.set(item.subCategory, (counts.get(item.subCategory) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [activeNav.kind, adultFilteredItems]);

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    let list = adultFilteredItems;

    if (activeNav.kind === 'posewear' && subCategoryFilter !== 'all') {
      list = list.filter((i) => i.subCategory === subCategoryFilter);
    }

    if (activeColorId !== 'all') {
      const targetSwatch = COLOR_FILTERS.find((c) => c.id === activeColorId);
      if (targetSwatch?.hex) {
        list = list.filter((item) =>
          item.colors.some((hex) => hexDistance(hex, targetSwatch.hex) < 88)
        );
      }
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.notes.toLowerCase().includes(q) ||
          i.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          (i.keywords && i.keywords.some((kw) => kw.toLowerCase().includes(q))) ||
          (i.itemCode && i.itemCode.toLowerCase().includes(q)) ||
          (i.subCategory && i.subCategory.toLowerCase().includes(q)) ||
          (i.promptZh && i.promptZh.toLowerCase().includes(q)) ||
          (i.promptEn && i.promptEn.toLowerCase().includes(q)) ||
          (i.titleJa && i.titleJa.toLowerCase().includes(q)) ||
          (i.relativePath && i.relativePath.toLowerCase().includes(q)) ||
          (i.domain && i.domain.toLowerCase().includes(q)) ||
          i.colors.some((c) => c.toLowerCase().includes(q))
      );
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortMode === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sortMode === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortMode === 'name') return a.title.localeCompare(b.title);
      if (sortMode === 'size') return b.fileSizeBytes - a.fileSizeBytes;
      return a.type.localeCompare(b.type);
    });

    return sorted;
  }, [
    adultFilteredItems,
    activeNav.kind,
    subCategoryFilter,
    activeColorId,
    searchQuery,
    sortMode,
  ]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId]
  );

  const quickLookIndex = useMemo(
    () =>
      quickLookId
        ? filteredItems.findIndex((i) => i.id === quickLookId)
        : -1,
    [filteredItems, quickLookId]
  );
  const quickLookItem =
    quickLookIndex >= 0 ? filteredItems[quickLookIndex] : null;

  const activeCollectionId =
    activeNav.kind === 'collection'
      ? activeNav.collectionId
      : collections[0]?.id || 'col-saas';

  const handleMountLocalFolder = useCallback(async () => {
    try {
      const result = await pickLocalDirectoryViaFS(activeCollectionId);
      if (result) {
        if (result.items.length === 0) {
          notify(
            lang === 'zh'
              ? '所选文件夹中未发现支持的图片或媒体文件'
              : 'No supported media files found in folder'
          );
          return;
        }
        setLocalFolders((prev) => [result.folder, ...prev]);
        setCustomItems((prev) => [...result.items, ...prev]);
        setSelectedId(result.items[0].id);
        navigateTo({ kind: 'local-folder', folderId: result.folder.id });
        notify(
          lang === 'zh'
            ? `已挂载本地目录「${result.folder.name}」（${result.items.length} 项）`
            : `Mounted "${result.folder.name}" (${result.items.length} items)`
        );
        return;
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      // Fall back to <input webkitdirectory> below if showDirectoryPicker is blocked in iframe
    }
    dirInputRef.current?.click();
  }, [activeCollectionId, lang, navigateTo, notify]);

  const handleFallbackDirectoryFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 200);
    const firstPath = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath || '';
    const folderName = firstPath.split('/')[0] || (lang === 'zh' ? '本地文件夹' : 'Local Folder');
    const folderId = `folder-${Date.now()}`;

    const created: ReferenceItem[] = [];
    for (const file of files) {
      const rel =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;
      const converted = await fileToLocalDiskItem(
        file,
        folderId,
        rel,
        activeCollectionId
      );
      if (converted) created.push(converted);
    }

    if (created.length === 0) {
      notify(lang === 'zh' ? '该目录中无支持的媒体文件' : 'No media files found');
      return;
    }

    const folder: LocalFolder = {
      id: folderId,
      name: folderName,
      itemCount: created.length,
      mountedAt: new Date().toISOString(),
    };
    setLocalFolders((prev) => [folder, ...prev]);
    setCustomItems((prev) => [...created, ...prev]);
    setSelectedId(created[0].id);
    navigateTo({ kind: 'local-folder', folderId });
    notify(
      lang === 'zh'
        ? `已打开目录「${folderName}」（${created.length} 项）`
        : `Opened "${folderName}" (${created.length} items)`
    );
  };

  const handleImportFiles = useCallback(
    async (fileList: FileList | File[], targetColId?: string) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const colId = targetColId || activeCollectionId;
      const created: ReferenceItem[] = [];

      for (const file of files) {
        const mime = file.type;
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        const id = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        if (mime.startsWith('image/')) {
          const dataUrl = await readFileAsDataUrl(file);
          const [dimensions, colors] = await Promise.all([
            getImageDimensions(dataUrl),
            extractColorsFromImage(dataUrl),
          ]);
          created.push({
            id,
            title: cleanName || (lang === 'zh' ? '剪贴板截图' : 'Pasted Image'),
            type: 'ui',
            imageUrl: dataUrl,
            collectionId: colId,
            tags: [lang === 'zh' ? '本地导入' : 'Local Import'],
            colors,
            dimensions,
            fileSizeBytes: file.size,
            createdAt: new Date().toISOString(),
            starred: false,
            rating: 0,
            acdLabel: 'none',
            notes: '',
          });
        } else if (mime.startsWith('video/')) {
          const dataUrl = await readFileAsDataUrl(file);
          created.push({
            id,
            title: cleanName,
            type: 'motion',
            mediaUrl: dataUrl,
            mediaMime: mime,
            collectionId: colId,
            tags: ['Video'],
            colors: ['#1F2428', '#0067C0', '#8A949E'],
            dimensions: 'Video Clip',
            fileSizeBytes: file.size,
            createdAt: new Date().toISOString(),
            starred: false,
            rating: 0,
            acdLabel: 'none',
            notes: '',
          });
        } else if (mime.startsWith('audio/')) {
          const dataUrl = await readFileAsDataUrl(file);
          created.push({
            id,
            title: cleanName,
            type: 'audio',
            mediaUrl: dataUrl,
            mediaMime: mime,
            collectionId: colId,
            tags: ['Audio'],
            colors: ['#0067C0', '#4CC2FF', '#1F2428'],
            dimensions: 'Audio File',
            fileSizeBytes: file.size,
            createdAt: new Date().toISOString(),
            starred: false,
            rating: 0,
            acdLabel: 'none',
            notes: '',
          });
        } else {
          const text = await file.text().catch(() => '');
          created.push({
            id,
            title: cleanName,
            type: 'doc',
            collectionId: colId,
            tags: ['Document'],
            colors: ['#F3F3F3', '#0067C0', '#202020'],
            dimensions: file.name.split('.').pop()?.toUpperCase() || 'DOC',
            fileSizeBytes: file.size,
            createdAt: new Date().toISOString(),
            starred: false,
            rating: 0,
            acdLabel: 'none',
            notes: '',
            docContent: text.slice(0, 4000) || file.name,
          });
        }
      }

      if (created.length > 0) {
        setCustomItems((prev) => [...created, ...prev]);
        setSelectedId(created[0].id);
        notify(
          lang === 'zh'
            ? `已将 ${created.length} 项素材保存至本地库`
            : `Saved ${created.length} asset(s) to local library`
        );
      }
    },
    [activeCollectionId, lang, notify]
  );

  const handleUpdateItem = useCallback(
    (id: string, patch: Partial<ReferenceItem>) => {
      if (id.startsWith('pw-')) {
        setPosewearItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            let nextPatch = { ...patch };
            if (
              patch.activeAngleIndex !== undefined &&
              item.angles &&
              item.angles[patch.activeAngleIndex]
            ) {
              const ang = item.angles[patch.activeAngleIndex];
              nextPatch = {
                ...nextPatch,
                imageUrl: ang.thumbUrl,
                highResUrl: ang.highResUrl,
                originalUrl: ang.originalUrl,
              };
            }
            return { ...item, ...nextPatch };
          })
        );
        setPosewearOverrides((prev) => {
          const cur = prev[id] || {};
          const nextOv: PoseWearItemOverride = { ...cur };
          if (patch.title !== undefined) nextOv.title = patch.title;
          if (patch.starred !== undefined) nextOv.starred = patch.starred;
          if (patch.rating !== undefined) nextOv.rating = patch.rating;
          if (patch.acdLabel !== undefined) nextOv.acdLabel = patch.acdLabel;
          if (patch.tags !== undefined) nextOv.tags = patch.tags;
          if (patch.notes !== undefined) nextOv.notes = patch.notes;
          if (patch.collectionId !== undefined) nextOv.collectionId = patch.collectionId;
          if (patch.activeAngleIndex !== undefined)
            nextOv.activeAngleIndex = patch.activeAngleIndex;
          if (patch.adjustments !== undefined) nextOv.adjustments = patch.adjustments;
          return { ...prev, [id]: nextOv };
        });
      } else {
        setCustomItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
        );
      }
    },
    []
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      if (id.startsWith('pw-')) {
        setPosewearItems((prev) => prev.filter((i) => i.id !== id));
        setPosewearOverrides((prev) => ({
          ...prev,
          [id]: { ...(prev[id] || {}), hidden: true },
        }));
      } else {
        setCustomItems((prev) => prev.filter((i) => i.id !== id));
      }
      if (selectedId === id) setSelectedId(null);
      setCheckedIds((prev) => prev.filter((x) => x !== id));
      notify(lang === 'zh' ? '已从参考库移除' : 'Removed from library');
    },
    [selectedId, lang, notify]
  );

  // Global keyboard shortcuts (Ctrl+K, Space QuickLook, 1-5 Rating, Ctrl+V Paste, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((o) => !o);
        return;
      }

      if (isTyping || quickLookId || compareOpen || batchOpen) return;

      if (e.key === ' ' && !commandOpen && !addModalOpen) {
        if (selectedId && activeNav.kind !== 'windows-info') {
          e.preventDefault();
          setQuickLookId(selectedId);
        }
      } else if (['1', '2', '3', '4', '5'].includes(e.key) && selectedId) {
        const rating = Number(e.key);
        handleUpdateItem(selectedId, { rating });
        notify(lang === 'zh' ? `已设为 ${rating} 星评级` : `Rated ${rating} stars`);
      } else if (e.key === 'Delete' && activeNav.kind !== 'windows-info') {
        if (checkedIds.length > 0) {
          const idsToRemove = [...checkedIds];
          idsToRemove.forEach((id) => handleDeleteItem(id));
          setCheckedIds([]);
          notify(
            lang === 'zh'
              ? `已移除 ${idsToRemove.length} 项`
              : `Removed ${idsToRemove.length} items`
          );
        } else if (selectedId) {
          handleDeleteItem(selectedId);
        }
      }
    };

    const handlePaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isTyping) return;

      const clipItems = e.clipboardData?.items;
      if (!clipItems) return;

      const files: File[] = [];
      for (const item of Array.from(clipItems)) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleImportFiles(files);
        return;
      }

      const text = e.clipboardData?.getData('text/plain')?.trim();
      if (text && /^https?:\/\//i.test(text)) {
        e.preventDefault();
        let domain = 'web';
        try {
          domain = new URL(text).hostname.replace(/^www\./, '');
        } catch {
          // ignore
        }
        const newItem: ReferenceItem = {
          id: `ref-${Date.now()}`,
          title: `${domain} — ${lang === 'zh' ? '网页灵感书签' : 'Web Bookmark'}`,
          type: 'web',
          sourceUrl: text,
          domain,
          collectionId: activeCollectionId,
          tags: [lang === 'zh' ? '剪贴板网页' : 'Pasted URL'],
          colors: ['#0067C0', '#1F2428', '#EAECEF'],
          dimensions: 'URL Bookmark',
          fileSizeBytes: text.length,
          createdAt: new Date().toISOString(),
          starred: false,
          rating: 0,
          acdLabel: 'none',
          notes: '',
        };
        setCustomItems((prev) => [newItem, ...prev]);
        setSelectedId(newItem.id);
        notify(lang === 'zh' ? `已捕获网址 ${domain}` : `Captured URL ${domain}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [
    quickLookId,
    compareOpen,
    batchOpen,
    commandOpen,
    addModalOpen,
    selectedId,
    checkedIds,
    activeNav.kind,
    activeCollectionId,
    handleImportFiles,
    handleUpdateItem,
    handleDeleteItem,
    lang,
    notify,
  ]);

  const handlePlayAudio = useCallback(
    (item: ReferenceItem) => {
      if (playingAudioId === item.id) {
        stopSynthAudio();
        setPlayingAudioId(null);
        return;
      }
      setPlayingAudioId(item.id);
      if (item.mediaUrl) {
        const audio = new Audio(item.mediaUrl);
        audio.onended = () => setPlayingAudioId(null);
        audio.play().catch(() => setPlayingAudioId(null));
      } else {
        playSynthPreset(item.audioPreset || 'fluent-chime', () => {
          setPlayingAudioId(null);
        });
      }
    },
    [playingAudioId]
  );

  const handleSaveEditedCopy = useCallback(
    (source: ReferenceItem, dataUrl: string, sizeBytes: number, dimensions: string) => {
      const copyItem: ReferenceItem = {
        ...source,
        posewearCat: undefined,
        angles: undefined,
        id: `ref-${Date.now()}`,
        title: `${source.title} (${lang === 'zh' ? '已编辑' : 'Edited'})`,
        imageUrl: dataUrl,
        highResUrl: dataUrl,
        localFolderId: undefined,
        dimensions,
        fileSizeBytes: sizeBytes,
        createdAt: new Date().toISOString(),
        adjustments: undefined,
      };
      setCustomItems((prev) => [copyItem, ...prev]);
      setQuickLookId(copyItem.id);
      setSelectedId(copyItem.id);
    },
    [lang]
  );

  const handleCreateCollection = useCallback(
    (name: string) => {
      const id = `col-${Date.now()}`;
      const newCol: Collection = {
        id,
        nameZh: name,
        nameEn: name,
        descriptionZh: '',
        descriptionEn: '',
      };
      setCollections((prev) => [...prev, newCol]);
      navigateTo({ kind: 'collection', collectionId: id });
      notify(lang === 'zh' ? `已创建合集「${name}」` : `Created collection "${name}"`);
    },
    [navigateTo, lang, notify]
  );

  const handleAddUrlBookmark = useCallback(
    (payload: {
      title: string;
      sourceUrl: string;
      type: AssetType;
      collectionId: string;
      tags: string[];
      notes: string;
      docContent?: string;
    }) => {
      let domain = '';
      if (payload.sourceUrl) {
        try {
          domain = new URL(payload.sourceUrl).hostname.replace(/^www\./, '');
        } catch {
          domain = payload.sourceUrl;
        }
      }
      const newItem: ReferenceItem = {
        id: `ref-${Date.now()}`,
        title: payload.title,
        type: payload.type,
        sourceUrl: payload.sourceUrl || undefined,
        domain: domain || undefined,
        collectionId: payload.collectionId,
        tags: payload.tags,
        colors:
          payload.type === 'doc'
            ? ['#F3F3F3', '#0067C0', '#202020']
            : ['#0067C0', '#1E262A', '#E5E9EE'],
        dimensions: payload.type === 'doc' ? 'Markdown Note' : 'Web Bookmark',
        fileSizeBytes: (payload.docContent || payload.notes || payload.title).length * 2,
        createdAt: new Date().toISOString(),
        starred: false,
        rating: 0,
        acdLabel: 'none',
        notes: payload.notes,
        docContent: payload.docContent,
      };
      setCustomItems((prev) => [newItem, ...prev]);
      setSelectedId(newItem.id);
      notify(lang === 'zh' ? '已保存新参考' : 'Reference saved');
    },
    [lang, notify]
  );

  const handleExportBackup = () => {
    const persistentItems = customItems.filter((i) => !i.localFolderId);
    const blob = new Blob(
      [
        JSON.stringify(
          { items: persistentItems, collections, posewearOverrides },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixcat-windows-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(lang === 'zh' ? '已导出本地参考库备份' : 'Exported library backup');
  };

  const handleImportBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.items)) setCustomItems(parsed.items);
      if (Array.isArray(parsed.collections)) setCollections(parsed.collections);
      if (parsed.posewearOverrides && typeof parsed.posewearOverrides === 'object') {
        setPosewearOverrides(parsed.posewearOverrides);
        const bundle = await loadPoseWearDatasets(parsed.posewearOverrides);
        setPosewearItems([
          ...bundle.pose,
          ...bundle.depth,
          ...bundle.costume,
          ...bundle.anime,
          ...bundle.portrait,
        ]);
      }
      notify(lang === 'zh' ? '已恢复备份库数据' : 'Restored library from backup');
    } catch {
      notify(lang === 'zh' ? '备份文件格式无效' : 'Invalid backup JSON');
    }
  };

  const handleResetLibrary = async () => {
    await clearWorkspace();
    setLocalFolders([]);
    setCustomItems(INITIAL_ITEMS);
    setCollections(INITIAL_COLLECTIONS);
    setPosewearOverrides({});
    const bundle = await loadPoseWearDatasets({}).catch(() => null);
    if (bundle) {
      setPosewearItems([
        ...bundle.pose,
        ...bundle.depth,
        ...bundle.costume,
        ...bundle.anime,
        ...bundle.portrait,
      ]);
    }
    setSelectedId(INITIAL_ITEMS[0].id);
    notify(lang === 'zh' ? '已恢复默认示例库' : 'Reset to default library');
  };

  const handleDownloadItem = (item: ReferenceItem) => {
    const href = item.originalUrl || item.highResUrl || item.imageUrl || item.mediaUrl;
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.download = item.title;
      a.click();
    } else if (item.docContent) {
      const blob = new Blob([item.docContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.title}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const comparePair = useMemo(() => {
    if (checkedIds.length === 2) {
      return [
        items.find((i) => i.id === checkedIds[0]) || null,
        items.find((i) => i.id === checkedIds[1]) || null,
      ];
    }
    const imgOnly = filteredItems.filter((i) => !!i.imageUrl);
    return [imgOnly[0] || null, imgOnly[1] || null];
  }, [checkedIds, items, filteredItems]);

  const checkedItemsList = useMemo(
    () => items.filter((i) => checkedIds.includes(i.id)),
    [items, checkedIds]
  );

  const breadcrumb = useMemo(() => {
    if (activeNav.kind === 'windows-info') return strings.windowsEdition;
    if (activeNav.kind === 'posewear') {
      return `${strings.posewearSection} / ${strings.posewearCategories[activeNav.category]}`;
    }
    if (activeNav.kind === 'collection') {
      const col = collections.find((c) => c.id === activeNav.collectionId);
      return col ? (lang === 'zh' ? col.nameZh : col.nameEn) : strings.collections;
    }
    if (activeNav.kind === 'local-folder') {
      const f = localFolders.find((x) => x.id === activeNav.folderId);
      return f ? f.name : strings.localFolders;
    }
    if (activeNav.kind === 'rating') {
      return `${activeNav.minRating}★`;
    }
    if (activeNav.kind === 'label') {
      const l = ACD_LABELS.find((x) => x.id === activeNav.label);
      return l ? (lang === 'zh' ? l.nameZh : l.nameEn) : strings.acdLabelTitle;
    }
    if (activeNav.filter === 'all') return strings.allItems;
    if (activeNav.filter === 'starred') return strings.starred;
    return strings[activeNav.filter];
  }, [activeNav, collections, localFolders, lang, strings]);

  if (windowState === 'minimized' || windowState === 'closed') {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-[#DCE7F5] via-[#E9EEF4] to-[#D2DFEE] dark:from-[#0F1722] dark:via-[#161E29] dark:to-[#11151C] flex flex-col justify-between select-none">
        <div className="p-8">
          <button
            type="button"
            onClick={() => setWindowState('maximized')}
            className="w-24 p-3 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 flex flex-col items-center gap-2 text-center transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#252525] shadow-md border border-black/10 dark:border-white/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1.5" className="fill-[#0067C0] dark:fill-[#4CC2FF]" />
                <rect x="11" y="2" width="7" height="7" rx="1.5" className="fill-neutral-800/80 dark:fill-white/80" />
                <rect x="2" y="11" width="7" height="7" rx="1.5" className="fill-neutral-800/45 dark:fill-white/45" />
                <rect x="11" y="11" width="7" height="7" rx="1.5" className="fill-[#0067C0]/60 dark:fill-[#4CC2FF]/60" />
              </svg>
            </div>
            <span className="text-xs font-medium text-neutral-800 dark:text-neutral-100 drop-shadow-xs">
              PixCat
            </span>
          </button>
        </div>

        <div className="h-12 bg-white/80 dark:bg-[#1E1E1E]/85 backdrop-blur-xl border-t border-black/10 dark:border-white/10 flex items-center justify-center px-4">
          <button
            type="button"
            onClick={() => setWindowState('maximized')}
            className="h-9 px-4 rounded-[6px] bg-black/[0.06] dark:bg-white/[0.1] hover:bg-black/[0.1] dark:hover:bg-white/[0.15] flex items-center gap-2 text-xs font-medium text-neutral-900 dark:text-white transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" className="fill-[#0067C0] dark:fill-[#4CC2FF]" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" className="fill-neutral-800/80 dark:fill-white/80" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" className="fill-neutral-800/45 dark:fill-white/45" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" className="fill-[#0067C0]/60 dark:fill-[#4CC2FF]/60" />
            </svg>
            <span>
              {windowState === 'minimized'
                ? lang === 'zh'
                  ? '还原 PixCat 窗口'
                  : 'Restore PixCat'
                : lang === 'zh'
                  ? '启动 PixCat'
                  : 'Launch PixCat'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex items-center justify-center bg-[#DCE3EC] dark:bg-[#111317] ${
        windowState === 'normal' ? 'p-4 md:p-7' : 'p-0'
      }`}
    >
      {/* Hidden directory picker fallback for environments without File System Access API */}
      <input
        ref={dirInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is standard in Chromium/WebKit
        webkitdirectory=""
        className="hidden"
        onChange={(e) => {
          handleFallbackDirectoryFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div
        className={`w-full h-full flex flex-col overflow-hidden win-mica-bg text-neutral-900 dark:text-neutral-100 ${
          windowState === 'normal'
            ? 'rounded-[10px] border border-black/[0.12] dark:border-white/[0.12] shadow-2xl'
            : ''
        }`}
      >
        <TitleBar
          lang={lang}
          dark={dark}
          windowState={windowState}
          searchQuery={searchQuery}
          canGoBack={historyIdx > 0}
          canGoForward={historyIdx < navHistory.length - 1}
          breadcrumb={breadcrumb}
          isOnline={isOnline}
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          onInstallPWA={() => {
            install();
          }}
          onSearchChange={setSearchQuery}
          onOpenCommandPalette={() => setCommandOpen(true)}
          onToggleDark={() => setDark((d) => !d)}
          onToggleLang={() => setLang((l) => (l === 'zh' ? 'en' : 'zh'))}
          onGoBack={() => setHistoryIdx((i) => Math.max(0, i - 1))}
          onGoForward={() =>
            setHistoryIdx((i) => Math.min(navHistory.length - 1, i + 1))
          }
          onMinimize={() => setWindowState('minimized')}
          onToggleMaximize={() =>
            setWindowState((s) => (s === 'maximized' ? 'normal' : 'maximized'))
          }
          onCloseWindow={() => setWindowState('closed')}
          onToggleMobileSidebar={() => setMobileSidebarOpen((o) => !o)}
        />

        <div className="relative flex-1 min-h-0 flex">
          <div className="hidden md:block h-full">
            <Sidebar
              lang={lang}
              activeNav={activeNav}
              items={items}
              collections={collections}
              localFolders={localFolders}
              activeColorId={activeColorId}
              showAdult={showAdult}
              onSelectNav={navigateTo}
              onSelectColor={setActiveColorId}
              onCreateCollection={handleCreateCollection}
              onMountLocalFolder={handleMountLocalFolder}
            />
          </div>

          {mobileSidebarOpen && (
            <div
              className="md:hidden fixed inset-0 top-11 z-40 bg-black/40 flex"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="h-full bg-[#F6F6F6] dark:bg-[#232323] shadow-2xl"
              >
                <Sidebar
                  lang={lang}
                  activeNav={activeNav}
                  items={items}
                  collections={collections}
                  localFolders={localFolders}
                  activeColorId={activeColorId}
                  showAdult={showAdult}
                  onSelectNav={(nav) => {
                    navigateTo(nav);
                    setMobileSidebarOpen(false);
                  }}
                  onSelectColor={(c) => {
                    setActiveColorId(c);
                    setMobileSidebarOpen(false);
                  }}
                  onCreateCollection={handleCreateCollection}
                  onMountLocalFolder={() => {
                    setMobileSidebarOpen(false);
                    handleMountLocalFolder();
                  }}
                />
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0 flex flex-col h-full">
            {activeNav.kind === 'windows-info' ? (
              <WindowsEditionView
                lang={lang}
                items={items}
                collections={collections}
                isInstallable={isInstallable}
                isInstalled={isInstalled}
                offlineReady={offlineReady}
                onInstallPWA={() => {
                  install();
                }}
                onMountLocalFolder={handleMountLocalFolder}
                onExportBackup={handleExportBackup}
                onImportBackup={handleImportBackup}
                onResetLibrary={handleResetLibrary}
              />
            ) : (
              <>
                <CommandBar
                  lang={lang}
                  viewMode={viewMode}
                  sortMode={sortMode}
                  gridCols={gridCols}
                  inspectorOpen={inspectorOpen}
                  checkedIds={checkedIds}
                  totalCount={filteredItems.length}
                  onOpenAddModal={() => setAddModalOpen(true)}
                  onMountLocalFolder={handleMountLocalFolder}
                  onChangeView={setViewMode}
                  onChangeSort={setSortMode}
                  onChangeGridCols={setGridCols}
                  onToggleInspector={() => setInspectorOpen((o) => !o)}
                  onBulkStar={() => {
                    checkedIds.forEach((id) =>
                      handleUpdateItem(id, { starred: true })
                    );
                    setCheckedIds([]);
                  }}
                  onBulkDelete={() => {
                    checkedIds.forEach((id) => handleDeleteItem(id));
                    setCheckedIds([]);
                  }}
                  onOpenBatchTools={() => setBatchOpen(true)}
                  onOpenCompare={() => setCompareOpen(true)}
                  onClearChecked={() => setCheckedIds([])}
                />

                <ReferenceGallery
                  lang={lang}
                  items={filteredItems}
                  collections={collections}
                  viewMode={viewMode}
                  gridCols={gridCols}
                  selectedId={selectedId}
                  checkedIds={checkedIds}
                  playingAudioId={playingAudioId}
                  hasActiveFilters={
                    searchQuery.trim().length > 0 ||
                    activeColorId !== 'all' ||
                    subCategoryFilter !== 'all'
                  }
                  navKey={`${JSON.stringify(activeNav)}-${searchQuery}-${activeColorId}-${sortMode}`}
                  subCategories={subCategories}
                  activeSubCategory={subCategoryFilter}
                  showAdult={showAdult}
                  adultHiddenCount={adultHiddenCount}
                  onSelectSubCategory={setSubCategoryFilter}
                  onToggleAdult={() => setShowAdult((v) => !v)}
                  onSelect={setSelectedId}
                  onDoubleClick={(id) => setQuickLookId(id)}
                  onToggleCheck={(id) =>
                    setCheckedIds((prev) =>
                      prev.includes(id)
                        ? prev.filter((x) => x !== id)
                        : [...prev, id]
                    )
                  }
                  onToggleStar={(id) => {
                    const target = items.find((x) => x.id === id);
                    if (target) {
                      handleUpdateItem(id, { starred: !target.starred });
                    }
                  }}
                  onPlayAudio={handlePlayAudio}
                  onContextMenu={(e, item) => {
                    e.preventDefault();
                    setSelectedId(item.id);
                    setContextMenu({ x: e.clientX, y: e.clientY, item });
                  }}
                  onOpenAddModal={() => setAddModalOpen(true)}
                  onResetFilters={() => {
                    setSearchQuery('');
                    setActiveColorId('all');
                    setSubCategoryFilter('all');
                  }}
                  onDropFiles={(files) => handleImportFiles(files)}
                />
              </>
            )}
          </main>

          {inspectorOpen && activeNav.kind !== 'windows-info' && (
            <div className="hidden lg:block h-full">
              <InspectorPane
                lang={lang}
                item={selectedItem}
                collections={collections}
                playingAudioId={playingAudioId}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onOpenQuickLook={(id) => setQuickLookId(id)}
                onPlayAudio={handlePlayAudio}
                onNotify={notify}
              />
            </div>
          )}
        </div>
      </div>

      {/* ACDSee Fast Image Viewer & Editor */}
      <QuickLookModal
        lang={lang}
        item={quickLookItem}
        items={filteredItems}
        currentIndex={quickLookIndex}
        playingAudioId={playingAudioId}
        onClose={() => setQuickLookId(null)}
        onJumpTo={(id) => {
          setQuickLookId(id);
          setSelectedId(id);
        }}
        onUpdateItem={handleUpdateItem}
        onSaveEditedCopy={handleSaveEditedCopy}
        onPlayAudio={handlePlayAudio}
        onNotify={notify}
      />

      {/* ACDSee Compare 2 Images */}
      <CompareModal
        open={compareOpen}
        lang={lang}
        leftItem={comparePair[0]}
        rightItem={comparePair[1]}
        onClose={() => setCompareOpen(false)}
      />

      {/* ACDSee Batch Rename & Batch Convert */}
      <BatchModal
        open={batchOpen}
        lang={lang}
        selectedItems={checkedItemsList}
        onClose={() => setBatchOpen(false)}
        onBatchRename={(updates) => {
          updates.forEach((u) => handleUpdateItem(u.id, { title: u.title }));
        }}
        onNotify={notify}
      />

      <CommandPaletteModal
        open={commandOpen}
        lang={lang}
        dark={dark}
        items={items}
        collections={collections}
        onClose={() => setCommandOpen(false)}
        onSelectItem={(id) => {
          const target = items.find((i) => i.id === id);
          setSelectedId(id);
          if (target?.isAdult) setShowAdult(true);
          if (target?.posewearCat) {
            navigateTo({ kind: 'posewear', category: target.posewearCat });
          } else {
            navigateTo({ kind: 'library', filter: 'all' });
          }
        }}
        onSelectNav={navigateTo}
        onToggleDark={() => setDark((d) => !d)}
        onToggleLang={() => setLang((l) => (l === 'zh' ? 'en' : 'zh'))}
        onOpenAddModal={() => setAddModalOpen(true)}
      />

      <AddReferenceModal
        open={addModalOpen}
        lang={lang}
        collections={collections}
        defaultCollectionId={activeCollectionId}
        onClose={() => setAddModalOpen(false)}
        onImportFiles={(files, colId) => handleImportFiles(files, colId)}
        onAddUrlBookmark={handleAddUrlBookmark}
      />

      <ContextMenu
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        item={contextMenu?.item ?? null}
        collections={collections}
        lang={lang}
        onClose={() => setContextMenu(null)}
        onQuickLook={(id) => setQuickLookId(id)}
        onToggleStar={(id) => {
          const target = items.find((x) => x.id === id);
          if (target) handleUpdateItem(id, { starred: !target.starred });
        }}
        onCopyLink={async (item) => {
          if (item.sourceUrl) {
            await navigator.clipboard.writeText(item.sourceUrl).catch(() => {});
            notify(strings.copiedText(strings.sourceUrlLabel));
          }
        }}
        onMoveToCollection={(id, colId) => {
          handleUpdateItem(id, { collectionId: colId });
          notify(lang === 'zh' ? '已移动至目标合集' : 'Moved to collection');
        }}
        onDownload={handleDownloadItem}
        onDelete={handleDeleteItem}
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-[7px] bg-neutral-900/95 dark:bg-[#323232]/95 text-white text-xs font-medium shadow-xl border border-white/10">
          {toast}
        </div>
      )}
    </div>
  );
}
