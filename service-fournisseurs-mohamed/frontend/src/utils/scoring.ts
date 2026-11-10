import { Fournisseur, CommandeSummary } from '../types/fournisseur';

export type RatingStatus = 'recommande' | 'conforme' | 'vigilance';

export interface SupplierRating {
  score: number; // 1.0 to 5.0
  stars: number; // integer 1 to 5 rounded
  fiabilitePct: number; // 0 to 100%
  status: RatingStatus;
  statusLabel: string;
  badgeClass: string;
  commandesCount: number;
}

const RATINGS_STORAGE_KEY = 'procuraflow-supplier-ratings';

// Retrieve user manual rating overrides from localStorage
export function getSavedRatings(): Record<number, number> {
  try {
    const raw = localStorage.getItem(RATINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Save a manual rating for a supplier
export function saveSupplierRating(fournisseurId: number, rating: number): void {
  try {
    const current = getSavedRatings();
    current[fournisseurId] = Math.max(1, Math.min(5, Math.round(rating * 10) / 10));
    localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Computes a deterministic scoring and evaluation for a supplier based on:
 * 1. Saved manual rating (if any).
 * 2. Order fulfillment track record (ratio of completed/valid orders vs cancelled).
 * 3. Profile completeness (valid phone, street address, city, active contract).
 */
export function computeSupplierRating(
  fournisseur: Fournisseur,
  commandes?: CommandeSummary[] | null
): SupplierRating {
  const saved = getSavedRatings();
  const manual = saved[fournisseur.id];

  const cmds = commandes || [];
  const totalCmds = cmds.length;
  const valides = cmds.filter(
    (c) => c.statut === 'VALIDEE' || c.statut === 'RECEPTIONNEE' || c.statut === 'FACTUREE'
  ).length;
  const annulees = cmds.filter((c) => c.statut === 'ANNULEE').length;

  let fiabilitePct = 100;
  if (totalCmds > 0) {
    fiabilitePct = Math.round(((valides) / (totalCmds)) * 100);
  } else if (!fournisseur.actif) {
    fiabilitePct = 60;
  }

  let finalScore: number;

  if (manual !== undefined) {
    finalScore = manual;
  } else {
    // Algorithmic base rating
    let base = 4.2;

    // Bonus for high fulfillment
    if (totalCmds >= 3 && annulees === 0) {
      base += 0.6;
    } else if (totalCmds > 0 && annulees === 0) {
      base += 0.3;
    } else if (annulees > 0) {
      base -= 0.5 * annulees;
    }

    // Profile quality signals
    if (fournisseur.adresse && fournisseur.adresse.length > 10) base += 0.2;
    if (fournisseur.telephone) base += 0.1;
    if (!fournisseur.actif) base -= 1.0;

    // Deterministic pseudo-jitter by ID for realistic demo feel
    const pseudoOffset = ((fournisseur.id * 17) % 7) * 0.05;
    base = Math.max(2.5, Math.min(4.9, base + pseudoOffset));
    finalScore = Math.round(base * 10) / 10;
  }

  // Derive status
  let status: RatingStatus = 'conforme';
  let statusLabel = 'Conforme';
  let badgeClass = 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';

  if (finalScore >= 4.5 && fournisseur.actif) {
    status = 'recommande';
    statusLabel = 'Recommandé';
    badgeClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
  } else if (finalScore < 3.5 || !fournisseur.actif) {
    status = 'vigilance';
    statusLabel = !fournisseur.actif ? 'Inactif' : 'Sous surveillance';
    badgeClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  }

  return {
    score: finalScore,
    stars: Math.round(finalScore),
    fiabilitePct,
    status,
    statusLabel,
    badgeClass,
    commandesCount: totalCmds,
  };
}
