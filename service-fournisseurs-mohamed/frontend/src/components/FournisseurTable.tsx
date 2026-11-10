import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Edit2,
  Power,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';

interface FournisseurTableProps {
  fournisseurs: Fournisseur[];
  loading: boolean;
  onEdit: (fournisseur: Fournisseur) => void;
  onToggleStatus: (fournisseur: Fournisseur) => void;
  onViewCommandes: (fournisseur: Fournisseur) => void;
}

export const FournisseurTable: React.FC<FournisseurTableProps> = ({
  fournisseurs,
  loading,
  onEdit,
  onToggleStatus,
  onViewCommandes,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Loading Skeleton State
  if (loading && fournisseurs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <div className="h-4 w-40 rounded-md skeleton-shimmer" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 space-x-4">
              <div className="flex items-center space-x-3 w-1/3">
                <div className="w-8 h-8 rounded-lg skeleton-shimmer shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
                  <div className="h-3 w-1/3 rounded-md skeleton-shimmer" />
                </div>
              </div>
              <div className="h-4 w-1/4 rounded-md skeleton-shimmer" />
              <div className="h-4 w-1/5 rounded-md skeleton-shimmer" />
              <div className="h-6 w-16 rounded-full skeleton-shimmer" />
              <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (fournisseurs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Aucun fournisseur trouvé</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Aucun fournisseur ne correspond aux critères de filtre ou de recherche sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto lg:table-fixed">
          {/* Explicit balanced column proportions for desktop */}
          <colgroup className="hidden lg:table-column-group">
            <col className="w-[30%]" />
            <col className="w-[26%]" />
            <col className="w-[22%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
          </colgroup>

          <thead className="bg-slate-50 border-b border-slate-200/90 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              <th scope="col" className="px-5 py-3">Fournisseur</th>
              <th scope="col" className="px-5 py-3">Coordonnées</th>
              <th scope="col" className="px-5 py-3">Adresse</th>
              <th scope="col" className="px-5 py-3 text-center">Statut</th>
              <th scope="col" className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-xs">
            {fournisseurs.map((fournisseur) => {
              const initials =
                fournisseur.nom
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0].toUpperCase())
                  .join('') || 'FO';

              return (
                <tr
                  key={fournisseur.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Colonne 1: Fournisseur (Avatar + Nom + ID) */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                          fournisseur.actif
                            ? 'bg-teal-50 text-teal-700 border border-teal-200/70'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors truncate"
                          title={fournisseur.nom}
                        >
                          {fournisseur.nom}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          ID: #{fournisseur.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Colonne 2: Coordonnées (Email + Téléphone avec copie) */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="flex flex-col space-y-1 min-w-0">
                      {/* Email */}
                      <div className="flex items-center space-x-1.5 text-slate-700 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={fournisseur.email}>
                          {fournisseur.email}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(fournisseur.email, `mail-${fournisseur.id}`, e)}
                          title="Copier l'adresse e-mail"
                          className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-0.5"
                          aria-label="Copier l'adresse e-mail"
                        >
                          {copiedKey === `mail-${fournisseur.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>

                      {/* Téléphone */}
                      {fournisseur.telephone ? (
                        <div className="flex items-center space-x-1.5 text-slate-500 min-w-0">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{fournisseur.telephone}</span>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(fournisseur.telephone!, `phone-${fournisseur.id}`, e)}
                            title="Copier le numéro de téléphone"
                            className="text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-0.5"
                            aria-label="Copier le numéro de téléphone"
                          >
                            {copiedKey === `phone-${fournisseur.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Téléphone non renseigné</span>
                      )}
                    </div>
                  </td>

                  {/* Colonne 3: Adresse */}
                  <td className="px-5 py-3.5 align-middle">
                    {fournisseur.adresse ? (
                      <div className="flex items-start space-x-1.5 text-slate-600 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={fournisseur.adresse}>
                          {fournisseur.adresse}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Adresse non renseignée</span>
                    )}
                  </td>

                  {/* Colonne 4: Statut (Actif / Inactif) */}
                  <td className="px-5 py-3.5 align-middle text-center whitespace-nowrap">
                    {fournisseur.actif ? (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Actif</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Inactif</span>
                      </span>
                    )}
                  </td>

                  {/* Colonne 5: Actions */}
                  <td className="px-5 py-3.5 align-middle text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end space-x-1">
                      {/* Action Voir Commandes */}
                      <button
                        type="button"
                        onClick={() => onViewCommandes(fournisseur)}
                        title="Consulter les commandes de ce fournisseur"
                        aria-label="Voir les commandes"
                        className="inline-flex items-center space-x-1 h-7.5 px-2 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/70 transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                        <span>Commandes</span>
                      </button>

                      {/* Action Modifier */}
                      <button
                        type="button"
                        onClick={() => onEdit(fournisseur)}
                        title="Modifier la fiche fournisseur"
                        aria-label="Modifier le fournisseur"
                        className="w-7.5 h-7.5 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Action Activer / Désactiver */}
                      {fournisseur.actif ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(fournisseur)}
                          title="Désactiver ce fournisseur"
                          aria-label="Désactiver le fournisseur"
                          className="w-7.5 h-7.5 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(fournisseur)}
                          title="Réactiver ce fournisseur"
                          aria-label="Réactiver le fournisseur"
                          className="w-7.5 h-7.5 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
