import { Facture, FactureStats } from '../types';

/**
 * Formate un montant en Dirhams marocains (MAD).
 */
export function formatMAD(amount: number): string {
  if (isNaN(amount)) return '0,00 DH';
  return (
    new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' DH'
  );
}

/**
 * Formate une date au format court francophone (ex: 12 nov. 2026).
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formate une date avec heure (ex: 12 nov. 2026 à 14:30).
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Calcule les indicateurs clés de performance (KPIs) des factures.
 */
export function computeFactureStats(factures: Facture[]): FactureStats {
  const totalCount = factures.length;
  let nonPayeesCount = 0;
  let payeesCount = 0;
  let annuleesCount = 0;
  let montantTotal = 0;
  let montantNonPaye = 0;
  let montantPaye = 0;
  let montantAnnule = 0;

  for (const f of factures) {
    const montant = Number(f.montant_facture || f.montant_total || 0);
    montantTotal += montant;
    if (f.statut_paiement === 'PAYEE') {
      payeesCount++;
      montantPaye += montant;
    } else if (f.statut_paiement === 'ANNULEE') {
      annuleesCount++;
      montantAnnule += montant;
    } else {
      nonPayeesCount++;
      montantNonPaye += montant;
    }
  }

  const actifTotal = montantPaye + montantNonPaye;
  const tauxReglement = actifTotal > 0 ? (montantPaye / actifTotal) * 100 : 0;

  return {
    totalCount,
    nonPayeesCount,
    payeesCount,
    annuleesCount,
    montantTotal,
    montantNonPaye,
    montantPaye,
    montantAnnule,
    tauxReglement: Math.round(tauxReglement * 10) / 10,
  };
}

/**
 * Export CSV standard des factures.
 */
export function exportFacturesCSV(factures: Facture[]): void {
  const headers = [
    'ID',
    'Numéro Facture',
    'Commande ID',
    'Réception ID',
    'Date Facture',
    'Montant MAD',
    'Statut Paiement',
    'Date Création',
  ];

  const rows = factures.map((f) => [
    f.id,
    f.numero_facture || `FAC-${f.id}`,
    f.commande_id,
    f.reception_id,
    f.date_facture ? new Date(f.date_facture).toISOString().split('T')[0] : '',
    Number(f.montant_facture).toFixed(2),
    f.statut_paiement,
    f.created_at ? new Date(f.created_at).toISOString().split('T')[0] : '',
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `factures_procuraflow_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Charge dynamiquement jsPDF et jsPDF-autotable pour éviter d'alourdir le bundle initial.
 */
async function loadPdfLibraries() {
  const jspdfMod = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const jsPDF = jspdfMod.jsPDF || (jspdfMod as any).default;
  const autoTable = (autoTableMod as any).autoTable || (autoTableMod as any).default;
  return { jsPDF, autoTable };
}

/**
 * Export PDF minimaliste et élégant d'une facture individuelle
 * (Style épuré noir & blanc avec typographie moderne, conforme au modèle Description / Totaux).
 */
export async function exportSingleFacturePDF(facture: Facture): Promise<void> {
  const { jsPDF, autoTable } = await loadPdfLibraries();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const refNumber = facture.numero_facture || `FAC-${facture.id}`;
  const totalTTC = Number(facture.montant_facture || facture.montant_total || 0);
  const totalHT = Number((totalTTC / 1.20).toFixed(2));
  const tva20 = Number((totalTTC - totalHT).toFixed(2));

  // --- 1. En-tête : FACTURE à droite & Émetteur à gauche ---
  // Titre FACTURE (en haut à droite, grand et audacieux)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(15, 23, 42); // Noir profond
  doc.text('FACTURE', 192, 28, { align: 'right' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`#${refNumber.replace(/^FAC-/, '')}`, 192, 36, { align: 'right' });

  // Émetteur (en haut à gauche)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('Hamza AIT BENAYAD', 18, 28);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Département Achats & Facturation', 18, 35);
  doc.text('contact@procuraflow.ma', 18, 40);
  doc.text('Université Ibn Zohr, Agadir', 18, 45);

  // --- 2. Métadonnées (Date, Commande, Réception, Statut) alignées à droite ---
  const metaY = 56;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date d'émission : ${formatDate(facture.date_facture)}`, 192, metaY, { align: 'right' });
  doc.text(`Bon de Commande : CMD #${facture.commande_id}`, 192, metaY + 5.5, { align: 'right' });
  doc.text(`Bon de Réception : REC #${facture.reception_id}`, 192, metaY + 11, { align: 'right' });
  doc.text(
    `Statut : ${
      facture.statut_paiement === 'PAYEE'
        ? 'Payée'
        : facture.statut_paiement === 'ANNULEE'
        ? 'Annulée'
        : 'Non Payée'
    }`,
    192,
    metaY + 16.5,
    { align: 'right' }
  );

  // Destinataire (à gauche)
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Facturé à :', 18, metaY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Faculté des Sciences — Agadir', 18, metaY + 5.5);
  doc.text('Campus Universitaire Cité Dakhla', 18, metaY + 11);

  // --- 3. Titre de section "Description" & Ligne épurée ---
  const descY = 88;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('Description', 18, descY);

  // Ligne fine sous Description
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(18, descY + 4, 192, descY + 4);

  // --- 4. Lignes d'articles (Minimalistes, sans bordures lourdes) ---
  const item1HT = Number((totalHT * 0.65).toFixed(2));
  const item2HT = Number((totalHT * 0.25).toFixed(2));
  const item3HT = Number((totalHT - item1HT - item2HT).toFixed(2));

  const items = [
    [`Fournitures & matériels scientifiques (CMD #${facture.commande_id})`, `${item1HT.toFixed(2)} DH`],
    ['Consommables et accessoires techniques conformes', `${item2HT.toFixed(2)} DH`],
    [`Livraison et contrôle de réception (REC #${facture.reception_id})`, `${item3HT.toFixed(2)} DH`],
  ];

  autoTable(doc, {
    startY: descY + 6,
    body: items,
    theme: 'plain',
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 9.5,
      cellPadding: { top: 4.5, bottom: 4.5, left: 0, right: 0 },
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'right', fontStyle: 'normal' },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 135;

  // Ligne fine sous les articles
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(18, finalY + 2, 192, finalY + 2);

  // --- 5. Bloc Totaux (Sous-total, TVA, TOTAL) à droite ---
  const totX = 145;
  const totValX = 192;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Sous total :', totX, finalY + 12);
  doc.text(`${totalHT.toFixed(2)} DH`, totValX, finalY + 12, { align: 'right' });

  doc.text('TVA (20%) :', totX, finalY + 19);
  doc.text(`${tva20.toFixed(2)} DH`, totValX, finalY + 19, { align: 'right' });

  // TOTAL final en grand et gras
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL :', totX, finalY + 30);
  doc.text(formatMAD(totalTTC), totValX, finalY + 30, { align: 'right' });

  // --- 6. Pied de page épuré (Informations de paiement & Conditions) ---
  const bottomY = 248;

  // Gauche : Informations de paiement
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Informations de paiement', 18, bottomY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Hamza AIT BENAYAD', 18, bottomY + 5.5);
  doc.text('RIB : 007 780 0001234567890123 45', 18, bottomY + 10.5);
  doc.text('Attijariwafa Bank — Agadir', 18, bottomY + 15.5);

  // Droite : Conditions et termes
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Conditions et termes', 130, bottomY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Paiement sous 30 jours', 130, bottomY + 5.5);
  doc.text('Pénalités légales applicables', 130, bottomY + 10.5);
  doc.text('si retard de paiement', 130, bottomY + 15.5);

  doc.save(`facture_${refNumber}.pdf`);
}

/**
 * Export PDF professionnel :
 * - Si 1 seule facture : exporte le document officiel individuel de facture (modèle Facture standard).
 * - Si plusieurs factures : exporte le registre officiel récapitulatif des factures.
 */
export async function exportFacturesPDF(factures: Facture[]): Promise<void> {
  if (factures.length === 1) {
    return exportSingleFacturePDF(factures[0]);
  }

  const { jsPDF, autoTable } = await loadPdfLibraries();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // En-tête
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ProcuraFlow — Registre Officiel des Factures', 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Microservice Factures :8084 • Extrait généré le ${new Date().toLocaleDateString('fr-FR')}`,
    14,
    22
  );

  const stats = computeFactureStats(factures);

  // Bloc résumé
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Factures : ${stats.totalCount}`, 14, 38);
  doc.text(`Montant Total : ${formatMAD(stats.montantTotal)}`, 80, 38);
  doc.text(`Taux Règlement : ${stats.tauxReglement}%`, 150, 38);

  const tableBody = factures.map((f) => [
    f.numero_facture || `FAC-${f.id}`,
    `CMD #${f.commande_id}`,
    `REC #${f.reception_id}`,
    formatDate(f.date_facture),
    formatMAD(Number(f.montant_facture)),
    f.statut_paiement === 'PAYEE'
      ? 'Payée'
      : f.statut_paiement === 'ANNULEE'
      ? 'Annulée'
      : 'Non Payée',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['N° Facture', 'Commande', 'Réception', 'Date', 'Montant TTC', 'Statut']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 118, 110], // Teal 700
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`factures_procuraflow_${new Date().toISOString().split('T')[0]}.pdf`);
}
