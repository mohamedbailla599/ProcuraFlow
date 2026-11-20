import {
  MOROCCO_CITIES,
  MOROCCO_CITY_NAMES,
  findMoroccoCity,
} from '../../../data/moroccoCities';

// Re-export for convenience
export const MOROCCAN_CITIES = MOROCCO_CITY_NAMES;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Pre-sorted list of cities (longer names first so compound/multi-word names match before substrings)
const ALL_PARSED_CITIES: Array<{ canonical: string; matchText: string }> = [
  ...MOROCCO_CITIES.flatMap((c) => [
    { canonical: c.name, matchText: normalizeText(c.name) },
    ...(c.aliases?.map((a) => ({ canonical: c.name, matchText: normalizeText(a) })) || []),
  ]),
  { canonical: 'Paris', matchText: 'paris' },
  { canonical: 'Lyon', matchText: 'lyon' },
  { canonical: 'Marseille', matchText: 'marseille' },
].sort((a, b) => b.matchText.length - a.matchText.length);

export function parseAddressAndCity(rawAddress?: string | null): {
  street: string;
  ville: string;
  customVille: string;
} {
  if (!rawAddress || !rawAddress.trim()) {
    return { street: '', ville: '', customVille: '' };
  }

  const trimmed = rawAddress.trim();
  const normalizedRaw = normalizeText(trimmed);

  // 1. Check known cities using boundary-aware search
  for (const entry of ALL_PARSED_CITIES) {
    const escaped = entry.matchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-z0-9])(${escaped})(?:$|[^a-z0-9])`, 'i');
    if (regex.test(normalizedRaw)) {
      // Clean out the city and optional country suffix
      const cleanRegex = new RegExp(`[,\\s]*\\b${entry.canonical}\\b[,\\s]*(?:Maroc|France|Morocco)?`, 'i');
      let street = trimmed.replace(cleanRegex, '').trim();
      if (street === trimmed) {
        const rawPartRegex = new RegExp(`[,\\s]*${entry.matchText}[,\\s]*(?:Maroc|France|Morocco)?`, 'i');
        street = trimmed.replace(rawPartRegex, '').trim();
      }
      street = street.replace(/^[,\s]+|[,\s]+$/g, '').trim();
      return {
        street,
        ville: entry.canonical,
        customVille: '',
      };
    }
  }

  // 2. Comma separated fallback
  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    let cityCandidate = parts[parts.length - 1];
    let streetSlice = parts.slice(0, parts.length - 1);

    if (['maroc', 'france', 'morocco'].includes(cityCandidate.toLowerCase()) && parts.length >= 2) {
      cityCandidate = parts[parts.length - 2];
      streetSlice = parts.slice(0, parts.length - 2);
    }

    const matchedMorocco = findMoroccoCity(cityCandidate);
    if (matchedMorocco) {
      return {
        street: streetSlice.join(', '),
        ville: matchedMorocco.name,
        customVille: '',
      };
    }

    return {
      street: streetSlice.join(', '),
      ville: 'Autre',
      customVille: cityCandidate,
    };
  }

  // 3. Fallback: entire string as street
  return {
    street: trimmed,
    ville: '',
    customVille: '',
  };
}

