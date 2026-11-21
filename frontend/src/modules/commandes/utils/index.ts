import type { Commande } from '../types';

export function formatMontant(montant: number): string {
  if (montant === null || montant === undefined || isNaN(montant)) {
    return '0,00 MAD';
  }
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'MAD',
  }).format(montant);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
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
}

export function exportCommandesToCsv(commandes: Commande[], filename = 'commandes_procuraflow.csv'): void {
  if (!commandes.length) return;

  const headers = ['Ref BC', 'Fournisseur ID', 'Date Commande', 'Statut', 'Montant Total (MAD)', 'Nombre Articles'];
  const rows = commandes.map((c) => [
    `BC-${String(c.id).padStart(4, '0')}`,
    `#${c.fournisseurId}`,
    formatDate(c.dateCommande),
    c.statut,
    c.montantTotal,
    c.lignesCommande?.length || 0,
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
}
