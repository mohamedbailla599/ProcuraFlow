import moroccoCitiesData from './moroccoCities.json';

export interface MoroccoCity {
  name: string;
  region: string;
  lat: number;
  lng: number;
  aliases?: string[];
}

export const MOROCCO_CITIES: MoroccoCity[] = moroccoCitiesData as MoroccoCity[];

export const MOROCCO_CITY_NAMES: string[] = MOROCCO_CITIES.map((c) => c.name).sort((a, b) =>
  a.localeCompare(b, 'fr')
);

export const MOROCCO_REGIONS: string[] = Array.from(
  new Set(MOROCCO_CITIES.map((c) => c.region))
).sort((a, b) => a.localeCompare(b, 'fr'));

export function findMoroccoCity(search: string): MoroccoCity | undefined {
  if (!search) return undefined;
  const clean = search.trim().toLowerCase();
  return MOROCCO_CITIES.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.aliases?.some((alias) => alias.toLowerCase() === clean)
  );
}

