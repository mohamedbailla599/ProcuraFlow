import React, { useState, useRef, useEffect } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Guarantee that the table is always scrolled to the start on load/update
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [fournisseurs]);

  const copyToClipboard = (text: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'FO';
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Loading Skeleton State
  if (loading && fournisseurs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden animate-fade-in-up">
        <div className="p-4.5 border-b border-slate-100 bg-slate-50/60">
          <div className="h-4 w-48 rounded-md skeleton-shimmer" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`flex items-center justify-between p-5 space-x-6 stagger-${i}`}>
              <div className="flex items-center space-x-3.5 w-1/3">
                <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
                  <div className="h-3 w-1/3 rounded-md skeleton-shimmer" />
                </div>
              </div>
              <div className="h-4 w-1/4 rounded-md skeleton-shimmer" />
              <div className="h-4 w-1/5 rounded-md skeleton-shimmer" />
              <div className="h-6 w-18 rounded-full skeleton-shimmer" />
              <div className="h-8 w-28 rounded-lg skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (fournisseurs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-16 text-center shadow-xs animate-fade-in-up">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1.5">Aucun fournisseur trouvé</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Aucun fournisseur ne correspond aux critères de filtre ou de recherche sélectionnés.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden animate-fade-in-up">
      <div ref={scrollContainerRef} className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse table-fixed min-w-[980px]">
          {/* Explicit balanced column proportions for clean desktop presentation */}
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[25%]" />
            <col className="w-[23%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
          </colgroup>

          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] uppercase font-bold text-slate-500 tracking-wider select-none">
            <tr>
              <th scope="col" className="px-6 py-3.5">
                Fournisseur
              </th>
              <th scope="col" className="px-5 py-3.5">
                Coordonnées
              </th>
              <th scope="col" className="px-5 py-3.5">
                Adresse
              </th>
              <th scope="col" className="px-4 py-3.5 text-center">
                Statut
              </th>
              <th scope="col" className="px-6 py-3.5 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100/80 text-sm">
            {fournisseurs.map((fournisseur, index) => {
              const initials = getInitials(fournisseur.nom);

              return (
                <tr
                  key={fournisseur.id}
                  className="hover:bg-teal-50/30 transition-colors duration-150 group table-row-enter"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Colonne 1: Fournisseur (Avatar + Nom + ID) */}
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none transition-all duration-200 group-hover:scale-105 ${
                          fournisseur.actif
                            ? 'bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 border border-teal-200/80 shadow-xs'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="font-semibold text-slate-900 group-hover:text-teal-900 transition-colors duration-150 truncate text-sm"
                          title={fournisseur.nom}
                        >
                          {fournisseur.nom}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          ID: #{fournisseur.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Colonne 2: Coordonnées (Email + Téléphone avec copie) */}
                  <td className="px-5 py-4 align-middle">
                    <div className="flex flex-col space-y-1.5 min-w-0">
                      {/* Email */}
                      <div className="flex items-center space-x-1.5 text-slate-700 min-w-0 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate" title={fournisseur.email}>
                          {fournisseur.email}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(fournisseur.email, `mail-${fournisseur.id}`, e)}
                          title="Copier l'adresse e-mail"
                          className="text-slate-400 hover:text-slate-700 transition-all duration-150 shrink-0 p-0.5 rounded hover:bg-slate-200/50 active:scale-90"
                          aria-label="Copier l'adresse e-mail"
                        >
                          {copiedKey === `mail-${fournisseur.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                          )}
                        </button>
                      </div>

                      {/* Téléphone */}
                      {fournisseur.telephone ? (
                        <div className="flex items-center space-x-1.5 text-slate-500 min-w-0 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate" title={fournisseur.telephone}>
                            {fournisseur.telephone}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(fournisseur.telephone!, `phone-${fournisseur.id}`, e)}
                            title="Copier le numéro de téléphone"
                            className="text-slate-400 hover:text-slate-700 transition-all duration-150 shrink-0 p-0.5 rounded hover:bg-slate-200/50 active:scale-90"
                            aria-label="Copier le numéro de téléphone"
                          >
                            {copiedKey === `phone-${fournisseur.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Téléphone non renseigné</span>
                      )}
                    </div>
                  </td>

                  {/* Colonne 3: Adresse */}
                  <td className="px-5 py-4 align-middle">
                    {fournisseur.adresse ? (
                      <div className="flex items-start space-x-1.5 text-slate-600 min-w-0 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate flex-1" title={fournisseur.adresse}>
                          {fournisseur.adresse}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => copyToClipboard(fournisseur.adresse!, `addr-${fournisseur.id}`, e)}
                          title="Copier l'adresse"
                          className="text-slate-400 hover:text-slate-700 transition-all duration-150 shrink-0 p-0.5 rounded hover:bg-slate-200/50 active:scale-90"
                          aria-label="Copier l'adresse"
                        >
                          {copiedKey === `addr-${fournisseur.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Adresse non renseignée</span>
                    )}
                  </td>

                  {/* Colonne 4: Statut (Actif / Inactif) */}
                  <td className="px-4 py-4 align-middle text-center whitespace-nowrap">
                    {fournisseur.actif ? (
                      <span className="badge-active">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                        </span>
                        <span>Actif</span>
                      </span>
                    ) : (
                      <span className="badge-inactive">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Inactif</span>
                      </span>
                    )}
                  </td>

                  {/* Colonne 5: Actions */}
                  <td className="px-6 py-4 align-middle text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end space-x-1.5">
                      {/* Action Voir Commandes */}
                      <button
                        type="button"
                        onClick={() => onViewCommandes(fournisseur)}
                        title="Consulter les bons de commande de ce fournisseur"
                        aria-label="Voir les commandes"
                        className="inline-flex items-center space-x-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 shadow-xs transition-all duration-150 active:scale-[0.97]"
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
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-150 active:scale-95"
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
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all duration-150 active:scale-95"
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(fournisseur)}
                          title="Réactiver ce fournisseur"
                          aria-label="Réactiver le fournisseur"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all duration-150 active:scale-95"
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
