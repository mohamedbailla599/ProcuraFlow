/**
 * Utilitaires pour le module Réceptions — ProcuraFlow
 */

import type { Reception } from '../types';

/**
 * Formate une date ISO en format français complet : "20 nov. 2026 à 22:22"
 */
export const formatReceptionDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

/**
 * Formate une date courte : "20/11/2026"
 */
export const formatShortDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

/**
 * Calcule le taux de conformité en pourcentage (0-100)
 */
export const calculateConformiteRate = (total: number, conformes: number): number => {
  if (total <= 0) return 100;
  return Math.round((conformes / total) * 100);
};

/**
 * Calcule le nombre total d'unités reçues sur une réception
 */
export const getTotalUnitesRecues = (reception: Reception): number => {
  if (!reception.lignes || !Array.isArray(reception.lignes)) return 0;
  return reception.lignes.reduce((sum, l) => sum + (l.quantiteRecue || 0), 0);
};

/**
 * Exporte les réceptions au format CSV
 */
export const exportReceptionsToCsv = (receptions: Reception[], filename = 'receptions_procuraflow.csv'): void => {
  if (!receptions.length) return;

  const headers = ['ID Reception', 'ID Commande', 'Date Reception', 'Statut Conformite', 'Nombre Lignes', 'Total Unites', 'Remarques'];
  const rows = receptions.map((r) => [
    `#${r.id}`,
    `#${r.commandeId}`,
    formatReceptionDate(r.dateReception),
    r.statutReception || 'CONFORME',
    r.lignes?.length || 0,
    getTotalUnitesRecues(r),
    `"${(r.remarques || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
