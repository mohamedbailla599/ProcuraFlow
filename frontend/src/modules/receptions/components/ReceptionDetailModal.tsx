import React from 'react';
import {
  Modal,
  Badge,
  Button,
} from '../../../components/ui';
import {
  Truck,
  Calendar,
  Package,
  ShoppingBag,
  CheckCircle2,
  AlertTriangle,
  Printer,
  FileText,
  Hash,
} from 'lucide-react';
import type { Reception } from '../types';
import type { Commande } from '../../commandes/types';
import { formatReceptionDate, getTotalUnitesRecues } from '../utils';

interface ReceptionDetailModalProps {
  reception: Reception;
  commande?: Commande | null;
  onClose: () => void;
}

export const ReceptionDetailModal: React.FC<ReceptionDetailModalProps> = ({
  reception,
  commande,
  onClose,
}) => {
  const isConforme = (reception.statutReception || 'CONFORME').toUpperCase() === 'CONFORME';
  const totalUnites = getTotalUnitesRecues(reception);

  // Recherche la désignation d'une ligne de commande si la commande correspondante est disponible
  const getLigneDesignation = (ligneCommandeId: number): string => {
    if (commande?.lignesCommande) {
      const match = commande.lignesCommande.find((l) => Number(l.id) === Number(ligneCommandeId));
      if (match?.designation) return match.designation;
    }
    return `Ligne d'achat #${ligneCommandeId}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Bordereau de Réception #${reception.id}`}
      description={`Contrôle d'entrée en stock pour le bon de commande #${reception.commandeId}`}
      maxWidth="3xl"
      footer={
        <div className="w-full flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrint}
          >
            Imprimer le Bordereau
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-sm text-slate-800 dark:text-slate-100">
        {/* Bandeau d'en-tête synthétique */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-200/80 dark:border-teal-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  Réception #{reception.id}
                </span>
                <Badge
                  variant={isConforme ? 'success' : 'warning'}
                  dot
                  size="sm"
                >
                  {reception.statutReception || 'CONFORME'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatReceptionDate(reception.dateReception)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Bon de Commande
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                #{reception.commandeId}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Métriques Clés du Bordereau */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-teal-600" /> Commande
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
              #{reception.commandeId}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Package className="w-3 h-3 text-emerald-600" /> Lignes
            </span>
            <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
              {reception.lignes?.length || 0} article(s)
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-blue-600" /> Unités reçues
            </span>
            <p className="text-base font-extrabold text-teal-600 dark:text-teal-400 mt-1">
              {totalUnites} unité(s)
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              {isConforme ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-500" />
              )}
              Conformité
            </span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
              {reception.statutReception || 'CONFORME'}
            </p>
          </div>
        </div>

        {/* Détail des lignes réceptionnées */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-teal-600" /> Articles & Quantités Réceptionnées
            </h4>
            <span className="text-xs text-slate-400">
              {reception.lignes?.length || 0} ligne(s)
            </span>
          </div>

          {reception.lignes && reception.lignes.length > 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3.5 font-bold">Réf. Ligne</th>
                    <th className="py-2.5 px-3.5 font-bold">Désignation</th>
                    <th className="py-2.5 px-3.5 font-bold text-right">Quantité Reçue</th>
                    <th className="py-2.5 px-3.5 font-bold">Remarques / Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {reception.lignes.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3.5 font-mono text-slate-500">
                        #{l.ligneCommandeId}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-900 dark:text-white">
                        {getLigneDesignation(l.ligneCommandeId)}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/70">
                          {l.quantiteRecue} unité(s)
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400">
                        {l.remarques ? (
                          <span className="italic">{l.remarques}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 text-xs">
              Cette réception historique ne comporte pas de lignes d'articles détaillées.
            </div>
          )}
        </div>

        {/* Remarques & Observations Générales */}
        {reception.remarques ? (
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5" /> Observations & Remarques Générales
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {reception.remarques}
            </p>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Aucune observation particulière enregistrée. Livraison réceptionnée sans réserve.</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
