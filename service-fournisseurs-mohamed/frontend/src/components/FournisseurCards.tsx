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

interface FournisseurCardsProps {
  fournisseurs: Fournisseur[];
  loading: boolean;
  onEdit: (fournisseur: Fournisseur) => void;
  onToggleStatus: (fournisseur: Fournisseur) => void;
  onViewCommandes: (fournisseur: Fournisseur) => void;
}

export const FournisseurCards: React.FC<FournisseurCardsProps> = ({
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

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'FO';
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Skeleton loading
  if (loading && fournisseurs.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
                <div className="h-3 w-1/3 rounded-md skeleton-shimmer" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full rounded-md skeleton-shimmer" />
              <div className="h-3 w-4/5 rounded-md skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (fournisseurs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-14 text-center shadow-2xs">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
      {fournisseurs.map((fournisseur) => {
        const initials = getInitials(fournisseur.nom);

        return (
          <div
            key={fournisseur.id}
            className={`group rounded-xl border bg-white transition-all duration-150 flex flex-col justify-between ${
              fournisseur.actif
                ? 'border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                : 'border-slate-200/70 bg-slate-50/40 opacity-80 hover:opacity-100 shadow-2xs'
            }`}
          >
            {/* Card Content */}
            <div className="p-5 space-y-3.5">
              {/* Header: Avatar + Nom + Statut */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                      fournisseur.actif
                        ? 'bg-teal-50 text-teal-700 border border-teal-200/80 shadow-2xs'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="font-bold text-slate-900 text-sm truncate group-hover:text-teal-900 transition-colors"
                      title={fournisseur.nom}
                    >
                      {fournisseur.nom}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: #{fournisseur.id}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {fournisseur.actif ? (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Actif</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Inactif</span>
                  </span>
                )}
              </div>

              {/* Details List */}
              <div className="space-y-2 text-xs">
                {/* Email with copy */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                  <div className="flex items-center space-x-2 truncate min-w-0">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={fournisseur.email}>
                      {fournisseur.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(fournisseur.email, `grid-email-${fournisseur.id}`, e)}
                    title="Copier l'email"
                    aria-label="Copier l'email"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                  >
                    {copiedKey === `grid-email-${fournisseur.id}` ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Telephone with copy */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                  <div className="flex items-center space-x-2 truncate min-w-0">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={fournisseur.telephone || 'Non renseigné'}>
                      {fournisseur.telephone || (
                        <span className="text-slate-400 italic">Non renseigné</span>
                      )}
                    </span>
                  </div>
                  {fournisseur.telephone && (
                    <button
                      type="button"
                      onClick={(e) => copyToClipboard(fournisseur.telephone!, `grid-phone-${fournisseur.id}`, e)}
                      title="Copier le téléphone"
                      aria-label="Copier le téléphone"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                    >
                      {copiedKey === `grid-phone-${fournisseur.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>

                {/* Address with copy */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                  <div className="flex items-center space-x-2 truncate min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={fournisseur.adresse || 'Non renseignée'}>
                      {fournisseur.adresse || (
                        <span className="text-slate-400 italic">Non renseignée</span>
                      )}
                    </span>
                  </div>
                  {fournisseur.adresse && (
                    <button
                      type="button"
                      onClick={(e) => copyToClipboard(fournisseur.adresse!, `grid-addr-${fournisseur.id}`, e)}
                      title="Copier l'adresse"
                      aria-label="Copier l'adresse"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                    >
                      {copiedKey === `grid-addr-${fournisseur.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card Actions Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50/70 rounded-b-xl flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onViewCommandes(fournisseur)}
                className="inline-flex items-center space-x-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors shadow-2xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                <span>Commandes</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => onEdit(fournisseur)}
                  title="Modifier le fournisseur"
                  aria-label="Modifier"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {fournisseur.actif ? (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(fournisseur)}
                    title="Désactiver le fournisseur"
                    aria-label="Désactiver"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onToggleStatus(fournisseur)}
                    title="Réactiver le fournisseur"
                    aria-label="Réactiver"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
