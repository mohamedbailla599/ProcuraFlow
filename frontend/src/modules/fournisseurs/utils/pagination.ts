import { Fournisseur, FournisseurStats, PageResponse } from '../types/fournisseur';
import { computeSupplierRating } from './scoring';
import { MOROCCO_CITY_NAMES } from '../../../data/moroccoCities';

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSizeOption = 10;
export const MAX_PAGE_SIZE = 50;
export const ENTRANCE_ITEM_DURATION_MS = 260;

const KNOWN_CITIES = [
  ...MOROCCO_CITY_NAMES,
  'Paris',
  'Lyon',
  'Marseille',
];

const GENERIC_COUNTRIES = new Set([
  'maroc',
  'morocco',
  'france',
  'espagne',
  'spain',
  'allemagne',
  'germany',
  'belgique',
  'suisse',
  'italie',
  'italy',
  'uk',
  'usa',
  'canada',
]);

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function extractCityFromAddress(adresse: string | null | undefined): string | null {
  if (!adresse) return null;
  const trimmed = adresse.trim();
  if (!trimmed) return null;

  const lowerNorm = normalizeText(trimmed);
  for (const city of KNOWN_CITIES) {
    if (lowerNorm.includes(normalizeText(city))) {
      return city;
    }
  }

  const parts = trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  for (let i = parts.length - 1; i >= 0; i--) {
    const cleaned = parts[i].replace(/\b\d{4,6}\b/g, '').trim();
    if (!cleaned || cleaned.length <= 1) continue;
    if (GENERIC_COUNTRIES.has(normalizeText(cleaned))) continue;

    for (const city of KNOWN_CITIES) {
      if (normalizeText(cleaned).includes(normalizeText(city))) {
        return city;
      }
    }
    return cleaned;
  }

  return null;
}

export function mapSortOptionToApiSort(sortBy: string): string {
  switch (sortBy) {
    case 'name-desc':
      return 'nom,desc';
    case 'date-desc':
      return 'createdAt,desc';
    case 'date-asc':
      return 'createdAt,asc';
    case 'status-desc':
    case 'rating-desc':
      return 'actif,desc';
    case 'id-asc':
      return 'id,asc';
    case 'name-asc':
    default:
      return 'nom,asc';
  }
}

export function computeDemoGlobalStats(list: Fournisseur[]): {
  stats: FournisseurStats;
  avgRating: number | null;
} {
  const total = list.length;
  const actifs = list.filter((f) => f.actif).length;
  const inactifs = Math.max(0, total - actifs);
  const tauxEligibilite = total > 0 ? Math.round((actifs * 100) / total) : 0;

  const citySet = new Set<string>();
  for (const f of list) {
    const city = extractCityFromAddress(f.adresse);
    if (city && city.length > 1) {
      citySet.add(city);
    }
  }

  const ratings = list.map((f) => f.rating).filter((r): r is number => typeof r === 'number');
  const avgRating =
    ratings.length > 0
      ? Number((ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1))
      : null;

  return {
    stats: {
      total,
      actifs,
      inactifs,
      tauxEligibilite,
      villes: Array.from(citySet).sort((a, b) => a.localeCompare(b, 'fr')),
    },
    avgRating,
  };
}

export interface FilterSortParams {
  sortBy: string;
  statusFilter: 'all' | 'active' | 'inactive';
  searchTerm: string;
  cityFilter: string;
}

export interface DemoPaginationParams extends FilterSortParams {
  page: number;
  size: number;
}

export function filterAndSortSuppliers(
  list: Fournisseur[],
  params: FilterSortParams
): Fournisseur[] {
  const searchNorm = normalizeText(params.searchTerm || '');
  const rawCity = (params.cityFilter || '').trim();
  const cityNorm =
    rawCity && rawCity.toLowerCase() !== 'all' ? normalizeText(rawCity) : '';

  const filtered = list.filter((f) => {
    if (params.statusFilter === 'active' && !f.actif) return false;
    if (params.statusFilter === 'inactive' && f.actif) return false;

    if (cityNorm) {
      const addrNorm = normalizeText(f.adresse || '');
      const extractedCity = normalizeText(extractCityFromAddress(f.adresse) || '');
      if (!addrNorm.includes(cityNorm) && extractedCity !== cityNorm) {
        return false;
      }
    }

    if (searchNorm) {
      const matchesNom = normalizeText(f.nom || '').includes(searchNorm);
      const matchesEmail = normalizeText(f.email || '').includes(searchNorm);
      const matchesTel = normalizeText(f.telephone || '').includes(searchNorm);
      const matchesAddr = normalizeText(f.adresse || '').includes(searchNorm);
      if (!matchesNom && !matchesEmail && !matchesTel && !matchesAddr) {
        return false;
      }
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (params.sortBy) {
      case 'name-desc':
        cmp = b.nom.localeCompare(a.nom, 'fr', { sensitivity: 'base' });
        break;
      case 'date-desc':
        cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
      case 'date-asc':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'status-desc':
        cmp = (b.actif ? 1 : 0) - (a.actif ? 1 : 0);
        if (cmp === 0) {
          cmp = a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
        }
        break;
      case 'rating-desc':
        cmp = computeSupplierRating(b).score - computeSupplierRating(a).score;
        if (cmp === 0) {
          cmp = a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
        }
        break;
      case 'id-asc':
        cmp = a.id - b.id;
        break;
      case 'name-asc':
      default:
        cmp = a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
        break;
    }
    return cmp !== 0 ? cmp : a.id - b.id;
  });
}

export function paginateDemoSuppliers(
  list: Fournisseur[],
  params: DemoPaginationParams
): PageResponse<Fournisseur> {
  const safeSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.size || DEFAULT_PAGE_SIZE));
  const safePage = Math.max(0, params.page || 0);
  const sorted = filterAndSortSuppliers(list, params);

  const totalElements = sorted.length;
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / safeSize);
  const start = safePage * safeSize;
  const content = sorted.slice(start, start + safeSize);

  return {
    content,
    page: safePage,
    size: safeSize,
    totalElements,
    totalPages,
    first: safePage === 0,
    last: totalPages === 0 || safePage >= totalPages - 1,
    empty: content.length === 0,
  };
}

export function buildPageNumbers(currentPage: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const safeCurrent = Math.min(Math.max(0, currentPage), totalPages - 1);
  const pages = new Set<number>([0, totalPages - 1, safeCurrent]);

  if (safeCurrent - 1 > 0) pages.add(safeCurrent - 1);
  if (safeCurrent + 1 < totalPages - 1) pages.add(safeCurrent + 1);

  // Keep consistent pill density near the start or end boundaries
  if (safeCurrent <= 2) {
    pages.add(1);
    pages.add(2);
    pages.add(3);
  }
  if (safeCurrent >= totalPages - 3) {
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
    pages.add(totalPages - 4);
  }

  const sorted = Array.from(pages)
    .filter((p) => p >= 0 && p < totalPages)
    .sort((a, b) => a - b);

  const items: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push('ellipsis');
    }
    items.push(sorted[i]);
  }
  return items;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getStaggerDelayMs(index: number, itemCount: number): number {
  if (index <= 0 || itemCount <= 1) return 0;
  const stepMs = itemCount <= 10 ? 42 : itemCount <= 25 ? 24 : 14;
  return Math.min(index * stepMs, 460);
}

export function getEntranceWaveDurationMs(itemCount: number): number {
  if (itemCount <= 0) return 0;
  return getStaggerDelayMs(itemCount - 1, itemCount) + ENTRANCE_ITEM_DURATION_MS + 40;
}

