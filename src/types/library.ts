export type AssetType = 'web' | 'ui' | 'motion' | 'print' | 'audio' | 'doc';

export type PoseWearCategory = 'pose' | 'depth' | 'costume' | 'anime' | 'portrait';

export type AcdLabel = 'none' | 'red' | 'yellow' | 'green' | 'blue' | 'purple';

export type ViewMode = 'masonry' | 'grid' | 'list';

export type SortMode = 'newest' | 'name' | 'size' | 'type' | 'rating';

export type Language = 'zh' | 'en';

export type WindowState = 'normal' | 'maximized' | 'minimized' | 'closed';

export interface ImageAdjustments {
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  brightness: number;
  contrast: number;
  saturate: number;
  warmth: number;
  grayscale: boolean;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  rotate: 0,
  flipH: false,
  flipV: false,
  brightness: 100,
  contrast: 100,
  saturate: 100,
  warmth: 0,
  grayscale: false,
};

export interface LocalFolder {
  id: string;
  name: string;
  itemCount: number;
  mountedAt: string;
}

export interface PoseAngle {
  zh: string;
  en: string;
  thumbUrl: string;
  highResUrl: string;
  originalUrl?: string;
}

export type ActiveNav =
  | { kind: 'library'; filter: 'all' | 'starred' | AssetType }
  | { kind: 'posewear'; category: PoseWearCategory }
  | { kind: 'collection'; collectionId: string }
  | { kind: 'local-folder'; folderId: string }
  | { kind: 'rating'; minRating: number }
  | { kind: 'label'; label: AcdLabel }
  | { kind: 'windows-info' };

export interface ReferenceItem {
  id: string;
  title: string;
  type: AssetType;
  imageUrl?: string;
  highResUrl?: string;
  originalUrl?: string;
  mediaUrl?: string;
  mediaMime?: string;
  sourceUrl?: string;
  domain?: string;
  collectionId: string;
  localFolderId?: string;
  relativePath?: string;
  vaultPath?: string;
  tags: string[];
  keywords?: string[];
  colors: string[];
  dimensions: string;
  fileSizeBytes: number;
  createdAt: string;
  starred: boolean;
  rating?: number;
  acdLabel?: AcdLabel;
  notes: string;
  docContent?: string;
  audioPreset?: 'fluent-chime' | 'ambient-pad' | 'tactile-click';
  durationSec?: number;
  adjustments?: ImageAdjustments;
  // PoseWear extended metadata
  posewearCat?: PoseWearCategory;
  itemCode?: string;
  subCategory?: string;
  promptZh?: string;
  promptEn?: string;
  titleJa?: string;
  angles?: PoseAngle[];
  activeAngleIndex?: number;
  isAdult?: boolean;
}

export interface PoseWearItemOverride {
  title?: string;
  starred?: boolean;
  rating?: number;
  acdLabel?: AcdLabel;
  tags?: string[];
  notes?: string;
  collectionId?: string;
  activeAngleIndex?: number;
  adjustments?: ImageAdjustments;
  hidden?: boolean;
}

export interface Collection {
  id: string;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
}

export type VaultStatus = 'none' | 'prompt' | 'connected' | 'readonly-import';

export interface VaultMediaStats {
  folderName: string;
  assetsCount: number;
  mediaFilesCount: number;
  hasPoseWearData: boolean;
}

export interface VaultConfig {
  version: 1;
  app: 'pixcat';
  updatedAt: string;
  collections: Collection[];
  items: ReferenceItem[];
  posewearOverrides: Record<string, PoseWearItemOverride>;
  settings?: {
    lang?: Language;
    dark?: boolean;
    showAdult?: boolean;
  };
}
