import {
  PoseAngle,
  PoseWearCategory,
  PoseWearItemOverride,
  ReferenceItem,
} from '../types/library';

const ASSET_HOST = 'https://posewear-assets-96b.pages.dev/';

function absUrl(path?: string): string | undefined {
  if (!path) return undefined;
  return path.startsWith('http') ? path : ASSET_HOST + path;
}

interface RawPoseAngle {
  zh: string;
  en: string;
  ja?: string;
  t: string;
  i: string;
  o?: string;
}

interface RawPoseItem {
  id: string;
  no?: string;
  line?: string;
  lineEn?: string;
  cat?: string;
  ja?: string;
  zh: string;
  en: string;
  a?: number | boolean;
  angles: RawPoseAngle[];
}

interface RawCostumeItem {
  id: string;
  cat?: string;
  catEn?: string;
  kw?: string;
  zh: string;
  en: string;
  ti: string;
  t: string;
  m?: string;
  i: string;
  o?: string;
  a?: number | boolean;
}

interface RawPortraitItem {
  id: string;
  no?: string;
  sec?: string;
  len?: string;
  st?: string;
  ti: string;
  zh: string;
  en: string;
  ja?: string;
  t: string;
  m?: string;
  i: string;
  o?: string;
  w?: number;
  h?: number;
  rk?: number;
  a?: number | boolean;
}

export interface PoseWearBundle {
  pose: ReferenceItem[];
  depth: ReferenceItem[];
  costume: ReferenceItem[];
  anime: ReferenceItem[];
  portrait: ReferenceItem[];
}

function mapPoseList(
  rawList: RawPoseItem[],
  category: 'pose' | 'depth',
  overrides: Record<string, PoseWearItemOverride>
): ReferenceItem[] {
  const collectionId =
    category === 'pose' ? 'col-pw-pose' : 'col-pw-depth';
  return rawList
    .filter((raw) => !overrides[`pw-${category}-${raw.id}`]?.hidden)
    .map((raw, idx) => {
      const id = `pw-${category}-${raw.id}`;
      const ov = overrides[id] || {};
      const angles: PoseAngle[] = (raw.angles || []).map((ang) => ({
        zh: ang.zh,
        en: ang.en,
        thumbUrl: absUrl(ang.t) || '',
        highResUrl: absUrl(ang.i) || absUrl(ang.t) || '',
        originalUrl: absUrl(ang.o),
      }));
      const activeAngleIdx = ov.activeAngleIndex ?? 0;
      const activeAngle = angles[activeAngleIdx] || angles[0];
      const tags = [
        raw.no,
        raw.cat,
        raw.line,
        ...angles.map((a) => a.zh),
      ].filter((x): x is string => Boolean(x));

      const keywords = [
        raw.id,
        raw.no,
        raw.zh,
        raw.en,
        raw.ja,
        raw.cat,
        raw.line,
        raw.lineEn,
        ...angles.flatMap((a) => [a.zh, a.en]),
      ].filter((x): x is string => Boolean(x));

      return {
        id,
        title: ov.title || (raw.no ? `${raw.no} · ${raw.zh}` : raw.zh),
        type: 'ui',
        posewearCat: category,
        itemCode: raw.no || raw.id,
        subCategory: raw.cat || '姿势',
        imageUrl: activeAngle?.thumbUrl,
        highResUrl: activeAngle?.highResUrl,
        originalUrl: activeAngle?.originalUrl,
        sourceUrl:
          category === 'pose'
            ? `https://posewear.pages.dev/pose/${raw.id}/`
            : `https://posewear.pages.dev/#depth`,
        domain: 'posewear.pages.dev',
        collectionId: ov.collectionId || collectionId,
        tags: ov.tags || Array.from(new Set(tags)),
        keywords,
        colors:
          category === 'depth'
            ? ['#2B1B4D', '#6D28D9', '#E5E7EB']
            : ['#E6E2DC', '#26292E', '#7D8590'],
        dimensions: `${angles.length} 角度`,
        fileSizeBytes: 320000,
        createdAt: new Date(Date.now() - idx * 1000).toISOString(),
        starred: ov.starred ?? false,
        rating: ov.rating ?? 0,
        acdLabel: ov.acdLabel ?? 'none',
        notes: ov.notes ?? `${raw.zh}\n${raw.en}`,
        promptZh: `${raw.zh}${raw.line ? `，${raw.line}` : ''}`,
        promptEn: `${raw.en}${raw.lineEn ? `, ${raw.lineEn}` : ''}`,
        titleJa: raw.ja,
        angles,
        activeAngleIndex: activeAngleIdx,
        adjustments: ov.adjustments,
        isAdult: Boolean(raw.a),
      };
    });
}

function mapCostumeList(
  rawList: RawCostumeItem[],
  category: 'costume' | 'anime',
  overrides: Record<string, PoseWearItemOverride>
): ReferenceItem[] {
  const collectionId =
    category === 'costume' ? 'col-pw-costume' : 'col-pw-anime';
  return rawList
    .filter((raw) => !overrides[`pw-${category}-${raw.id}`]?.hidden)
    .map((raw, idx) => {
      const id = `pw-${category}-${raw.id}`;
      const ov = overrides[id] || {};
      const kwTokens = (raw.kw || '')
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const tags = [raw.id, raw.cat, ...kwTokens.slice(0, 4)].filter(
        (x): x is string => Boolean(x)
      );
      const keywords = [
        raw.id,
        raw.ti,
        raw.cat,
        raw.catEn,
        raw.kw,
        raw.zh,
        raw.en,
      ].filter((x): x is string => Boolean(x));

      return {
        id,
        title: ov.title || `${raw.id} · ${raw.ti}`,
        type: category === 'anime' ? 'print' : 'web',
        posewearCat: category,
        itemCode: raw.id,
        subCategory: raw.cat || '服装',
        imageUrl: absUrl(raw.t),
        highResUrl: absUrl(raw.i) || absUrl(raw.m) || absUrl(raw.t),
        originalUrl: absUrl(raw.o),
        sourceUrl: `https://posewear.pages.dev/#${category}`,
        domain: 'posewear.pages.dev',
        collectionId: ov.collectionId || collectionId,
        tags: ov.tags || Array.from(new Set(tags)),
        keywords,
        colors:
          category === 'anime'
            ? ['#3B82F6', '#F4F4F5', '#1F2937']
            : ['#D6CFC4', '#1F2428', '#8C7A6B'],
        dimensions: raw.cat || 'Outfit',
        fileSizeBytes: 420000,
        createdAt: new Date(Date.now() - idx * 1000).toISOString(),
        starred: ov.starred ?? false,
        rating: ov.rating ?? 0,
        acdLabel: ov.acdLabel ?? 'none',
        notes: ov.notes ?? `${raw.zh}\n${raw.en}`,
        promptZh: raw.zh,
        promptEn: raw.en,
        adjustments: ov.adjustments,
        isAdult: Boolean(raw.a),
      };
    });
}

function mapPortraitList(
  rawList: RawPortraitItem[],
  overrides: Record<string, PoseWearItemOverride>
): ReferenceItem[] {
  return rawList
    .filter((raw) => !overrides[`pw-portrait-${raw.id}`]?.hidden)
    .map((raw, idx) => {
      const id = `pw-portrait-${raw.id}`;
      const ov = overrides[id] || {};
      const tags = [raw.no, raw.sec, raw.len, raw.st].filter(
        (x): x is string => Boolean(x)
      );
      const keywords = [
        raw.id,
        raw.no,
        raw.ti,
        raw.sec,
        raw.len,
        raw.st,
        raw.zh,
        raw.en,
        raw.ja,
      ].filter((x): x is string => Boolean(x));

      return {
        id,
        title: ov.title || (raw.no ? `${raw.no} · ${raw.ti}` : raw.ti),
        type: 'ui',
        posewearCat: 'portrait',
        itemCode: raw.no || raw.id,
        subCategory: raw.sec || '人像',
        imageUrl: absUrl(raw.t),
        highResUrl: absUrl(raw.i) || absUrl(raw.m) || absUrl(raw.t),
        originalUrl: absUrl(raw.o),
        sourceUrl: 'https://posewear.pages.dev/#portrait',
        domain: 'posewear.pages.dev',
        collectionId: ov.collectionId || 'col-pw-portrait',
        tags: ov.tags || Array.from(new Set(tags)),
        keywords,
        colors: ['#DED8CE', '#3A3530', '#9EA6AE'],
        dimensions:
          raw.w && raw.h ? `${raw.w} × ${raw.h}` : `${raw.sec || ''} · ${raw.len || ''}`,
        fileSizeBytes: 680000,
        createdAt: new Date(Date.now() - idx * 1000).toISOString(),
        starred: ov.starred ?? false,
        rating: ov.rating ?? 0,
        acdLabel: ov.acdLabel ?? 'none',
        notes: ov.notes ?? `${raw.zh}\n${raw.en}`,
        promptZh: raw.zh,
        promptEn: raw.en,
        titleJa: raw.ja,
        adjustments: ov.adjustments,
        isAdult: Boolean(raw.a),
      };
    });
}

export async function loadPoseWearDatasets(
  overrides: Record<string, PoseWearItemOverride> = {}
): Promise<PoseWearBundle> {
  const [posesRes, depthsRes, costumesRes, animeRes, portraitsRes] =
    await Promise.all([
      fetch('/library-data/poses.json'),
      fetch('/library-data/depths.json'),
      fetch('/library-data/costumes.json'),
      fetch('/library-data/anime.json'),
      fetch('/library-data/portraits.json'),
    ]);

  const [posesRaw, depthsRaw, costumesRaw, animeRaw, portraitsRaw] =
    await Promise.all([
      posesRes.json(),
      depthsRes.json(),
      costumesRes.json(),
      animeRes.json(),
      portraitsRes.json(),
    ]);

  const depthItems: RawPoseItem[] = Array.isArray(depthsRaw)
    ? depthsRaw
    : depthsRaw.items || [];

  return {
    pose: mapPoseList(posesRaw, 'pose', overrides),
    depth: mapPoseList(depthItems, 'depth', overrides),
    costume: mapCostumeList(costumesRaw, 'costume', overrides),
    anime: mapCostumeList(animeRaw, 'anime', overrides),
    portrait: mapPortraitList(portraitsRaw, overrides),
  };
}

export const POSEWEAR_CATEGORY_META: Array<{
  id: PoseWearCategory;
  nameZh: string;
  nameEn: string;
}> = [
  { id: 'pose', nameZh: '姿势库', nameEn: 'Poses' },
  { id: 'depth', nameZh: '深度姿势', nameEn: 'Depth Poses' },
  { id: 'costume', nameZh: '服装穿搭', nameEn: 'Costumes' },
  { id: 'anime', nameZh: '动画服装', nameEn: 'Anime Outfits' },
  { id: 'portrait', nameZh: '人像参考', nameEn: 'Portraits' },
];
