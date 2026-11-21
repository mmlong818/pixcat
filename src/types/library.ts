export type AssetType = 'web' | 'ui' | 'motion' | 'print' | 'audio' | 'doc';

export type AcdLabel = 'none' | 'red' | 'yellow' | 'green' | 'blue' | 'purple';

export type ViewMode = 'masonry' | 'grid' | 'list';

export type SortMode = 'newest' | 'name' | 'size' | 'type' | 'rating';

export type Language = 'zh' | 'en';

export type WindowState = 'normal' | 'maximized' | 'minimized' | 'closed';

export interface ImageAdjustments {
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
  flipV: boolean;
  brightness: number; // 50 - 150 (100 default)
  contrast: number; // 50 - 150 (100 default)
  saturate: number; // 0 - 200 (100 default)
  warmth: number; // -50 - 50 (0 default)
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

export type ActiveNav =
  | { kind: 'library'; filter: 'all' | 'starred' | AssetType }
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
  mediaUrl?: string;
  mediaMime?: string;
  sourceUrl?: string;
  domain?: string;
  collectionId: string;
  localFolderId?: string;
  relativePath?: string;
  tags: string[];
  colors: string[];
  dimensions: string;
  fileSizeBytes: number;
  createdAt: string;
  starred: boolean;
  rating?: number; // 0 - 5
  acdLabel?: AcdLabel;
  notes: string;
  docContent?: string;
  audioPreset?: 'fluent-chime' | 'ambient-pad' | 'tactile-click';
  durationSec?: number;
  adjustments?: ImageAdjustments;
}

export interface Collection {
  id: string;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
}
