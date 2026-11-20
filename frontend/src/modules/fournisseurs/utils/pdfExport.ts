import { Fournisseur, CommandeSummary } from '../types/fournisseur';
import { SupplierOrderStats, formatMAD, computeOrderStats } from './orderStats';
import { computeSupplierRating } from './scoring';

export interface GlobalExportOptions {
  fournisseurs: Fournisseur[];
  orderStats?: Record<number, SupplierOrderStats>;
  statusFilter?: string;
  cityFilter?: string;
  searchTerm?: string;
}

export interface SupplierExportOptions {
  fournisseur: Fournisseur;
  commandes: CommandeSummary[];
}

/**
 * Lazy-load jsPDF and autoTable so the initial app bundle stays small
 */
async function loadPdfLibraries() {
  const jspdfMod = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const jsPDF = jspdfMod.jsPDF || (jspdfMod as any).default;
  const autoTable = (autoTableMod as any).autoTable || (autoTableMod as any).default;
  return { jsPDF, autoTable };
}

/**
 * Sanitize text for standard PDF Helvetica WinAnsi encoding
 * (converts narrow non-breaking spaces from fr-FR formatting to regular spaces)
 */
function pdfSafe(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return '-';
  return String(text)
    .replace(/[\u202F\u00A0]/g, ' ')
    .replace(/—/g, '-')
    .replace(/★/g, '/5');
}

function formatDateFR(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Add "Page X sur Y" footer to every page of the PDF
 */
function addPageFooters(doc: any, label: string) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(pdfSafe(label), 14, pageHeight - 6.5);
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 14, pageHeight - 6.5, { align: 'right' });
  }
}

/**
 * EXPORT 1 : Rapport Global du Catalogue Fournisseurs (A4 Paysage)
 */
export async function exportCataloguePDF(options: GlobalExportOptions): Promise<void> {
  const { jsPDF, autoTable } = await loadPdfLibraries();
  const { fournisseurs, orderStats, statusFilter, cityFilter, searchTerm } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // 1. Brand Bar
  doc.setFillColor(13, 148, 136); // Teal 600
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  // 2. Header
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.roundedRect(14, 11, 10, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PF', 19, 17.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ProcuraFlow', 27, 17);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Système Intégré de Gestion des Achats & Fournisseurs', 27, 21.5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport du Répertoire Fournisseurs', pageWidth - 14, 16.5, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(pdfSafe(`Édité le ${dateFormatted} à ${timeFormatted} | Port :8081`), pageWidth - 14, 21.5, { align: 'right' });

  // 3. Executive KPIs
  const totalCount = fournisseurs.length;
  const activeCount = fournisseurs.filter((f) => f.actif).length;
  const inactiveCount = totalCount - activeCount;

  let totalCatalogueOrdered = 0;
  let totalRatingSum = 0;
  fournisseurs.forEach((f) => {
    const stats = orderStats?.[f.id];
    if (stats) totalCatalogueOrdered += stats.totalOrderedAmount;
    totalRatingSum += computeSupplierRating(f).score;
  });

  const avgRating = totalCount > 0 ? (totalRatingSum / totalCount).toFixed(1) : '-';

  const startY = 27;
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 16;

  const kpis = [
    { label: 'FOURNISSEURS RÉPERTORIÉS', value: `${totalCount}`, sub: `${activeCount} actifs | ${inactiveCount} inactifs` },
    { label: 'TAUX DE DISPONIBILITÉ', value: `${totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}%`, sub: 'Éligibles aux bons de commande' },
    { label: 'NOTE MOYENNE CATALOGUE', value: `${avgRating} / 5.0`, sub: 'Score qualité & fiabilité' },
    { label: 'TOTAL COMMANDÉ CUMULÉ', value: pdfSafe(formatMAD(totalCatalogueOrdered)), sub: 'Commandes actives (hors annulées)' },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, startY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfSafe(kpi.label), cardX + 3.5, startY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(13, 148, 136);
    doc.text(pdfSafe(kpi.value), cardX + 3.5, startY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(pdfSafe(kpi.sub), cardX + 3.5, startY + 14);
  });

  // 4. Active Filters Notice
  const filterTokens: string[] = [];
  if (statusFilter && statusFilter !== 'all') {
    filterTokens.push(`Statut : ${statusFilter === 'active' ? 'Actifs uniquement' : 'Inactifs uniquement'}`);
  }
  if (cityFilter && cityFilter !== 'all') {
    filterTokens.push(`Ville : ${cityFilter}`);
  }
  if (searchTerm) {
    filterTokens.push(`Recherche : "${searchTerm}"`);
  }

  let tableStartY = startY + cardHeight + 5;
  if (filterTokens.length > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(13, 148, 136);
    doc.text(pdfSafe(`Filtres appliqués : ${filterTokens.join(' | ')}`), 14, tableStartY);
    tableStartY += 4;
  }

  // 5. Table
  const tableHeaders = [
    ['ID', 'Fournisseur / Société', 'E-mail', 'Téléphone', 'Adresse / Ville', 'Note', 'Statut', 'Cdes', 'Total Commandé'],
  ];

  const tableBody = fournisseurs.map((f) => {
    const stats = orderStats?.[f.id];
    const rating = computeSupplierRating(f);
    return [
      `#${f.id}`,
      pdfSafe(f.nom),
      pdfSafe(f.email),
      pdfSafe(f.telephone || '-'),
      pdfSafe(f.adresse || '-'),
      `${rating.score.toFixed(1)} / 5`,
      f.actif ? 'Actif' : 'Inactif',
      stats ? `${stats.activeOrders}` : '0',
      stats && stats.totalOrderedAmount > 0 ? pdfSafe(formatMAD(stats.totalOrderedAmount)) : '-',
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 30 },
      4: { cellWidth: 52 },
      5: { cellWidth: 16, halign: 'center', textColor: [217, 119, 6] },
      6: { cellWidth: 17, halign: 'center' },
      7: { cellWidth: 16, halign: 'center' },
      8: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'Actif') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [148, 163, 184];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 16 },
  });

  addPageFooters(doc, 'ProcuraFlow ERP Achats - Rapport confidentiel à usage interne');

  doc.save(`procuraflow_catalogue_fournisseurs_${now.toISOString().slice(0, 10)}.pdf`);
}

/**
 * EXPORT 2 : Fiche Individuelle Fournisseur (A4 Portrait)
 */
export async function exportSupplierDossierPDF(options: SupplierExportOptions): Promise<void> {
  const { jsPDF, autoTable } = await loadPdfLibraries();
  const { fournisseur, commandes } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const stats = computeOrderStats(commandes);
  const rating = computeSupplierRating(fournisseur);

  // 1. Brand Bar
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  // 2. Header
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 11, 11, 11, 2.5, 2.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('PF', 19.5, 18.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ProcuraFlow', 28, 17);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Dossier Individuel Fournisseur & Suivi des Commandes', 28, 21.5);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dossier Réf : FO-${String(fournisseur.id).padStart(4, '0')}`, pageWidth - 14, 16.5, { align: 'right' });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Édité le ${now.toLocaleDateString('fr-FR')} | Système Achats`, pageWidth - 14, 21.5, { align: 'right' });

  // 3. Identity Box
  const identityY = 27;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, identityY, pageWidth - 28, 29, 2.5, 2.5, 'FD');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(pdfSafe(fournisseur.nom), 18, identityY + 7.5);

  // Status Badge
  const statusX = pageWidth - 56;
  if (fournisseur.actif) {
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(statusX, identityY + 3.5, 38, 6.5, 1.5, 1.5, 'FD');
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIF (ÉLIGIBLE)', statusX + 19, identityY + 7.8, { align: 'center' });
  } else {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(statusX, identityY + 3.5, 38, 6.5, 1.5, 1.5, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('INACTIF (SUSPENDU)', statusX + 19, identityY + 7.8, { align: 'center' });
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('E-mail :', 18, identityY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(pdfSafe(fournisseur.email), 34, identityY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Téléphone :', 110, identityY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(pdfSafe(fournisseur.telephone || 'Non renseigné'), 130, identityY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Adresse :', 18, identityY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(pdfSafe(fournisseur.adresse || 'Non renseignée').slice(0, 48), 34, identityY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Évaluation :', 110, identityY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text(`${rating.score.toFixed(1)} / 5.0 (${pdfSafe(rating.statusLabel)})`, 130, identityY + 22);

  // 4. Financial KPIs
  const kpiSectionY = identityY + 35;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Synthèse des Engagements Achats (Microservice Commandes)', 14, kpiSectionY);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Cycle : EN_ATTENTE -> VALIDEE -> RECEPTIONNEE -> FACTUREE (Commandes annulées exclues)',
    14,
    kpiSectionY + 4
  );

  const kpiCardY = kpiSectionY + 6.5;
  const kpiCardW = (pageWidth - 28 - 6) / 3;
  const kpiCardH = 17;

  const financialCards = [
    {
      title: 'TOTAL COMMANDÉ',
      amount: pdfSafe(formatMAD(stats.totalOrderedAmount)),
      desc: `${stats.activeOrders} cde(s) actives`,
      color: [15, 23, 42],
    },
    {
      title: 'TOTAL ENGAGÉ',
      amount: pdfSafe(formatMAD(stats.totalCommittedAmount)),
      desc: 'Validées, réceptionnées, facturées',
      color: [13, 148, 136],
    },
    {
      title: 'RÉCEPTIONNÉES / FACTURÉES',
      amount: pdfSafe(formatMAD(stats.receivedOrInvoicedAmount)),
      desc: `${stats.completedOrders} cde(s) au service fait`,
      color: [2, 132, 199],
    },
  ];

  financialCards.forEach((card, i) => {
    const cardX = 14 + i * (kpiCardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, kpiCardY, kpiCardW, kpiCardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(card.title, cardX + 3.5, kpiCardY + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.amount, cardX + 3.5, kpiCardY + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(card.desc, cardX + 3.5, kpiCardY + 14.5);
  });

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text(
    '* Note comptable : Les paiements effectifs et décaissements sont gérés exclusivement par le microservice Factures.',
    14,
    kpiCardY + kpiCardH + 4
  );

  // 5. Orders Table
  const ordersTableY = kpiCardY + kpiCardH + 9;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Historique des Bons de Commande (${commandes.length})`, 14, ordersTableY);

  const orderHeaders = [['Réf Cde', 'Date Commande', 'Statut Workflow', 'Articles', 'Montant Total (MAD)']];

  const orderRows =
    commandes.length === 0
      ? [['-', 'Aucune commande répertoriée pour ce fournisseur', '-', '-', '-']]
      : commandes.map((cmd) => {
          const linesCount = cmd.lignes ? cmd.lignes.length : 0;
          return [
            `BC-${String(cmd.id).padStart(4, '0')}`,
            formatDateFR(cmd.dateCommande),
            cmd.statut,
            linesCount > 0 ? `${linesCount} article(s)` : '1 lot',
            pdfSafe(formatMAD(cmd.montantTotal)),
          ];
        });

  autoTable(doc, {
    startY: ordersTableY + 3,
    head: orderHeaders,
    body: orderRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 35 },
      2: { cellWidth: 40, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 44, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = String(data.cell.raw);
        if (val === 'VALIDEE') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'RECEPTIONNEE') {
          data.cell.styles.textColor = [2, 132, 199];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'FACTUREE') {
          data.cell.styles.textColor = [124, 58, 237];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'EN_ATTENTE') {
          data.cell.styles.textColor = [217, 119, 6];
        } else if (val === 'ANNULEE') {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  // 6. Signature Block after table finishes
  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 180;
  let sigY = finalY;
  if (sigY + 28 > pageHeight - 14) {
    doc.addPage();
    sigY = 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(pageWidth - 86, sigY, 72, 24, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('VISA DU RESPONSABLE ACHATS', pageWidth - 82, sigY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Date & Signature pour conformité', pageWidth - 82, sigY + 9.5);

  addPageFooters(doc, `ProcuraFlow - Fiche Fournisseur #${fournisseur.id} - Document officiel`);

  doc.save(`dossier_fournisseur_${fournisseur.id}_${fournisseur.nom.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
}
