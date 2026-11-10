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

  // Skeleton loading
  if (loading && fournisseurs.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg skeleton-shimmer shrink-0" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fournisseurs.map((fournisseur) => {
        const initials =
          fournisseur.nom
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0].toUpperCase())
            .join('') || 'FO';

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
            <div className="p-4.5 space-y-3.5">
              {/* Header: Avatar + Nom + Statut */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                      fournisseur.actif
                        ? 'bg-teal-50 text-teal-700 border border-teal-200/70'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="font-bold text-slate-900 text-xs truncate group-hover:text-teal-900 transition-colors"
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
                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Actif</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Inactif</span>
                  </span>
                )}
              </div>

              {/* Details List */}
              <div className="space-y-1.5 text-xs">
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
                {fournisseur.telephone ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    <div className="flex items-center space-x-2 truncate min-w-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{fournisseur.telephone}</span>
                    </div>
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
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-50/60 border border-dashed border-slate-200 text-slate-400 text-[11px] italic">
                    Téléphone non renseigné
                  </div>
                )}

                {/* Adresse */}
                {fournisseur.adresse ? (
                  <div className="flex items-start space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate" title={fournisseur.adresse}>
                      {fournisseur.adresse}
                    </span>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-50/60 border border-dashed border-slate-200 text-slate-400 text-[11px] italic">
                    Adresse non renseignée
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="px-4.5 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-xl flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onViewCommandes(fournisseur)}
                className="flex-1 flex items-center justify-center space-x-1.5 h-8 px-2.5 rounded-lg text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/70 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                <span>Commandes</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(fournisseur)}
                title="Modifier"
                aria-label="Modifier le fournisseur"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {fournisseur.actif ? (
                <button
                  type="button"
                  onClick={() => onToggleStatus(fournisseur)}
                  title="Désactiver"
                  aria-label="Désactiver le fournisseur"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onToggleStatus(fournisseur)}
                  title="Réactiver"
                  aria-label="Réactiver le fournisseur"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
