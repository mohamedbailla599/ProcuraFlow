import { Fournisseur } from '../types/fournisseur';

export type GeoPrecision = 'exact' | 'city_approximate' | 'unlocalized';

export interface ResolvedLocation {
  fournisseur: Fournisseur;
  precision: GeoPrecision;
  lat?: number;
  lng?: number;
  cityName?: string;
  country?: string;
  sourceLabel: string;
}

interface CityEntry {
  name: string;
  country: string;
  lat: number;
  lng: number;
  aliases?: string[];
}

const EXACT_COORDS_STORAGE_KEY = 'procuraflow-exact-coords';

interface StoredExactCoord {
  lat: number;
  lng: number;
  adresse: string;
  displayName?: string;
  updatedAt: string;
}

/**
 * Gazeteer de référence vérifié (WGS84) pour les principales villes marocaines
 * et pôles d'approvisionnement internationaux.
 * Utilisé uniquement pour des localisations approximatives au niveau de la ville
 * lorsqu'aucune coordonnée GPS exacte n'est fournie.
 */
export const CITY_COORDINATES: CityEntry[] = [
  // --- Maroc ---
  { name: 'Casablanca', country: 'Maroc', lat: 33.5731, lng: -7.5898, aliases: ['casa', 'dar el beida'] },
  { name: 'Rabat', country: 'Maroc', lat: 34.0209, lng: -6.8416 },
  { name: 'Agadir', country: 'Maroc', lat: 30.4278, lng: -9.5981, aliases: ['tassila', 'ait melloul', 'inzegane'] },
  { name: 'Marrakech', country: 'Maroc', lat: 31.6295, lng: -7.9811, aliases: ['marrakesh', 'sidi ghanem'] },
  { name: 'Tanger', country: 'Maroc', lat: 35.7595, lng: -5.8340, aliases: ['tangier'] },
  { name: 'Fès', country: 'Maroc', lat: 34.0181, lng: -5.0078, aliases: ['fes', 'fez'] },
  { name: 'Meknès', country: 'Maroc', lat: 33.8935, lng: -5.5547, aliases: ['meknes'] },
  { name: 'Oujda', country: 'Maroc', lat: 34.6814, lng: -1.9086 },
  { name: 'Kénitra', country: 'Maroc', lat: 34.2610, lng: -6.5802, aliases: ['kenitra'] },
  { name: 'Tétouan', country: 'Maroc', lat: 35.5889, lng: -5.3626, aliases: ['tetouan'] },
  { name: 'Salé', country: 'Maroc', lat: 34.0531, lng: -6.7985, aliases: ['sale'] },
  { name: 'Mohammedia', country: 'Maroc', lat: 33.6861, lng: -7.3830 },
  { name: 'El Jadida', country: 'Maroc', lat: 33.2316, lng: -8.5007 },
  { name: 'Safi', country: 'Maroc', lat: 32.2994, lng: -9.2372 },
  { name: 'Béni Mellal', country: 'Maroc', lat: 32.3373, lng: -6.3498, aliases: ['beni mellal'] },
  { name: 'Nador', country: 'Maroc', lat: 35.1681, lng: -2.9335 },
  { name: 'Settat', country: 'Maroc', lat: 33.0010, lng: -7.6166 },
  { name: 'Berrechid', country: 'Maroc', lat: 33.2655, lng: -7.5875 },
  { name: 'Khouribga', country: 'Maroc', lat: 32.8811, lng: -6.9063 },
  { name: 'Larache', country: 'Maroc', lat: 35.1932, lng: -6.1557 },
  { name: 'Taza', country: 'Maroc', lat: 34.2100, lng: -4.0100 },
  { name: 'Khémisset', country: 'Maroc', lat: 33.8240, lng: -6.0663, aliases: ['khemisset'] },
  { name: 'Essaouira', country: 'Maroc', lat: 31.5085, lng: -9.7595 },
  { name: 'Ouarzazate', country: 'Maroc', lat: 30.9335, lng: -6.9370 },
  { name: 'Errachidia', country: 'Maroc', lat: 31.9314, lng: -4.4266 },
  { name: 'Laâyoune', country: 'Maroc', lat: 27.1536, lng: -13.2033, aliases: ['laayoune'] },
  { name: 'Dakhla', country: 'Maroc', lat: 23.6848, lng: -15.9570 },
  { name: 'Al Hoceïma', country: 'Maroc', lat: 35.2517, lng: -3.9372, aliases: ['al hoceima', 'hoceima'] },
  { name: 'Témara', country: 'Maroc', lat: 33.9287, lng: -6.9066, aliases: ['temara'] },
  { name: 'Taroudant', country: 'Maroc', lat: 30.4703, lng: -8.8770 },

  // --- International (Europe, Maghreb, Moyen-Orient, Amérique, Asie) ---
  { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
  { name: 'Lyon', country: 'France', lat: 45.7640, lng: 4.8357 },
  { name: 'Marseille', country: 'France', lat: 43.2965, lng: 5.3698 },
  { name: 'Lille', country: 'France', lat: 50.6292, lng: 3.0573 },
  { name: 'Toulouse', country: 'France', lat: 43.6047, lng: 1.4442 },
  { name: 'Bordeaux', country: 'France', lat: 44.8378, lng: -0.5792 },
  { name: 'Nantes', country: 'France', lat: 47.2184, lng: -1.5536 },
  { name: 'Madrid', country: 'Espagne', lat: 40.4168, lng: -3.7038 },
  { name: 'Barcelone', country: 'Espagne', lat: 41.3851, lng: 2.1734, aliases: ['barcelona'] },
  { name: 'Valence', country: 'Espagne', lat: 39.4699, lng: -0.3763, aliases: ['valencia'] },
  { name: 'Séville', country: 'Espagne', lat: 37.3891, lng: -5.9845, aliases: ['sevilla', 'seville'] },
  { name: 'Bruxelles', country: 'Belgique', lat: 50.8503, lng: 4.3517, aliases: ['brussels', 'brussel'] },
  { name: 'Anvers', country: 'Belgique', lat: 51.2194, lng: 4.4025, aliases: ['antwerp', 'antwerpen'] },
  { name: 'Genève', country: 'Suisse', lat: 46.2044, lng: 6.1432, aliases: ['geneva', 'geneve'] },
  { name: 'Zurich', country: 'Suisse', lat: 47.3769, lng: 8.5417, aliases: ['zurich'] },
  { name: 'Londres', country: 'Royaume-Uni', lat: 51.5074, lng: -0.1278, aliases: ['london'] },
  { name: 'Manchester', country: 'Royaume-Uni', lat: 53.4808, lng: -2.2426 },
  { name: 'Berlin', country: 'Allemagne', lat: 52.5200, lng: 13.4050 },
  { name: 'Munich', country: 'Allemagne', lat: 48.1351, lng: 11.5820, aliases: ['munchen'] },
  { name: 'Francfort', country: 'Allemagne', lat: 50.1109, lng: 8.6821, aliases: ['frankfurt'] },
  { name: 'Hambourg', country: 'Allemagne', lat: 53.5511, lng: 9.9937, aliases: ['hamburg'] },
  { name: 'Milan', country: 'Italie', lat: 45.4642, lng: 9.1900, aliases: ['milano'] },
  { name: 'Rome', country: 'Italie', lat: 41.9028, lng: 12.4964, aliases: ['roma'] },
  { name: 'Turin', country: 'Italie', lat: 45.0703, lng: 7.6869, aliases: ['torino'] },
  { name: 'Amsterdam', country: 'Pays-Bas', lat: 52.3676, lng: 4.9041 },
  { name: 'Rotterdam', country: 'Pays-Bas', lat: 51.9244, lng: 4.4777 },
  { name: 'Lisbonne', country: 'Portugal', lat: 38.7223, lng: -9.1393, aliases: ['lisbon', 'lisboa'] },
  { name: 'Porto', country: 'Portugal', lat: 41.1579, lng: -8.6291 },
  { name: 'Tunis', country: 'Tunisie', lat: 36.8065, lng: 10.1815 },
  { name: 'Alger', country: 'Algérie', lat: 36.7538, lng: 3.0588, aliases: ['algiers'] },
  { name: 'Le Caire', country: 'Égypte', lat: 30.0444, lng: 31.2357, aliases: ['cairo'] },
  { name: 'Istanbul', country: 'Turquie', lat: 41.0082, lng: 28.9784 },
  { name: 'Dubaï', country: 'Émirats Arabes Unis', lat: 25.2048, lng: 55.2708, aliases: ['dubai'] },
  { name: 'Riyad', country: 'Arabie Saoudite', lat: 24.7136, lng: 46.6753, aliases: ['riyadh'] },
  { name: 'New York', country: 'États-Unis', lat: 40.7128, lng: -74.0060 },
  { name: 'Montréal', country: 'Canada', lat: 45.5017, lng: -73.5673, aliases: ['montreal'] },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Shanghai', country: 'Chine', lat: 31.2304, lng: 121.4737 },
  { name: 'Shenzhen', country: 'Chine', lat: 22.5431, lng: 114.0579 },
  { name: 'Pékin', country: 'Chine', lat: 39.9042, lng: 116.4074, aliases: ['beijing'] },
  { name: 'Tokyo', country: 'Japon', lat: 35.6762, lng: 139.6503 },
  { name: 'Séoul', country: 'Corée du Sud', lat: 37.5665, lng: 126.9780, aliases: ['seoul'] },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Retrieve cached exact coordinates stored in localStorage
 */
export function getExactCoordinatesCache(): Record<number, StoredExactCoord> {
  try {
    const raw = localStorage.getItem(EXACT_COORDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save verified exact coordinates for a supplier ID + address
 */
export function saveExactCoordinates(
  fournisseurId: number,
  adresse: string,
  lat: number,
  lng: number,
  displayName?: string
): void {
  try {
    const cache = getExactCoordinatesCache();
    cache[fournisseurId] = {
      lat,
      lng,
      adresse: adresse.trim(),
      displayName,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(EXACT_COORDS_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Remove cached exact coordinates for a supplier
 */
export function clearExactCoordinates(fournisseurId: number): void {
  try {
    const cache = getExactCoordinatesCache();
    delete cache[fournisseurId];
    localStorage.setItem(EXACT_COORDS_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore
  }
}

/**
 * Extract explicit decimal GPS coordinates if written inside address string
 * Examples: "Bd Zerktouni (33.5898, -7.6038)" or "33.5731, -7.5898"
 */
export function parseExplicitCoordinates(adresse?: string | null): { lat: number; lng: number } | null {
  if (!adresse) return null;
  const match = adresse.match(/(-?\d{1,2}\.\d{3,8})\s*[,;\s]\s*(-?\d{1,3}\.\d{3,8})/);
  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng };
  }
  return null;
}

/**
 * Match a supplier's address against our verified City Gazetteer.
 * Never fabricates coordinates.
 */
export function resolveSupplierLocation(
  fournisseur: Fournisseur,
  exactCache?: Record<number, StoredExactCoord>
): ResolvedLocation {
  const adresse = fournisseur.adresse?.trim() || '';

  // 1. Check optional explicit lat/lng fields on object if present
  const maybeLat = (fournisseur as any).latitude;
  const maybeLng = (fournisseur as any).longitude;
  if (typeof maybeLat === 'number' && typeof maybeLng === 'number' && !isNaN(maybeLat) && !isNaN(maybeLng)) {
    return {
      fournisseur,
      precision: 'exact',
      lat: maybeLat,
      lng: maybeLng,
      sourceLabel: 'Coordonnées GPS enregistrées',
    };
  }

  // 2. Check localStorage cached exact coordinates (valid only if address matches)
  const cache = exactCache ?? getExactCoordinatesCache();
  const cached = cache[fournisseur.id];
  if (cached && cached.adresse === adresse && typeof cached.lat === 'number' && typeof cached.lng === 'number') {
    return {
      fournisseur,
      precision: 'exact',
      lat: cached.lat,
      lng: cached.lng,
      sourceLabel: cached.displayName
        ? `Géocodage exact (${cached.displayName.split(',')[0]})`
        : 'Position GPS exacte vérifiée',
    };
  }

  // 3. Check if address string itself contains explicit GPS coordinates
  const parsed = parseExplicitCoordinates(adresse);
  if (parsed) {
    return {
      fournisseur,
      precision: 'exact',
      lat: parsed.lat,
      lng: parsed.lng,
      sourceLabel: 'Coordonnées GPS extraites de l’adresse',
    };
  }

  // 4. Match against city gazetteer (approximate city centroid)
  // Scan comma-separated segments from right to left so street names like "Route de Rabat, Tanger"
  // resolve to the actual destination city ("Tanger") rather than the street prefix ("Rabat").
  if (adresse) {
    const segments = adresse
      .split(',')
      .map((s) => normalizeText(s))
      .filter(Boolean)
      .reverse();

    const searchSegments = segments.length > 0 ? segments : [normalizeText(adresse)];

    for (const seg of searchSegments) {
      let bestMatch: { city: CityEntry; pos: number; len: number } | null = null;

      for (const city of CITY_COORDINATES) {
        const keywords = [normalizeText(city.name), ...(city.aliases?.map(normalizeText) || [])];
        for (const kw of keywords) {
          const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:$|[^a-z0-9])`, 'gi');
          let m: RegExpExecArray | null;
          while ((m = regex.exec(seg)) !== null) {
            const pos = m.index;
            const len = m[1].length;
            if (
              !bestMatch ||
              pos > bestMatch.pos ||
              (pos === bestMatch.pos && len > bestMatch.len)
            ) {
              bestMatch = { city, pos, len };
            }
          }
        }
      }

      if (bestMatch) {
        return {
          fournisseur,
          precision: 'city_approximate',
          lat: bestMatch.city.lat,
          lng: bestMatch.city.lng,
          cityName: bestMatch.city.name,
          country: bestMatch.city.country,
          sourceLabel: `Localisation approximative (Centre-ville de ${bestMatch.city.name})`,
        };
      }
    }
  }

  // 5. No recognizable city or GPS coordinates -> honestly mark unlocalized
  return {
    fournisseur,
    precision: 'unlocalized',
    sourceLabel: 'Adresse absente ou ville non reconnue',
  };
}

/**
 * User-initiated single-supplier exact geocoding via OpenStreetMap Nominatim.
 * Respects Nominatim Usage Policy:
 * - Strictly invoked manually on user click for 1 supplier (never bulk/automated).
 * - Results are permanently cached in localStorage.
 */
export async function geocodeSingleSupplierAddress(
  fournisseur: Fournisseur
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const adresse = fournisseur.adresse?.trim();
  if (!adresse) return null;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(adresse)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Service Nominatim indisponible (${response.status})`);
  }

  const results = await response.json();
  if (Array.isArray(results) && results.length > 0) {
    const first = results[0];
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      const displayName = first.display_name || adresse;
      saveExactCoordinates(fournisseur.id, adresse, lat, lng, displayName);
      return { lat, lng, displayName };
    }
  }
  return null;
}
