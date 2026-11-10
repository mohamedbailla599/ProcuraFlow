import React, { useState } from 'react';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Edit3,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading && fournisseurs.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl skeleton-shimmer" />
              <div className="space-y-2 flex-1">
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

  if (fournisseurs.length === 0) {
    return (
      <div className="glass-panel rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">Aucun fournisseur trouvé</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Aucun fournisseur ne correspond aux critères de recherche actuels.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {fournisseurs.map((fournisseur) => {
        const initials = fournisseur.nom
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0].toUpperCase())
          .join('') || 'FO';

        return (
          <div
            key={fournisseur.id}
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 bg-white hover:-translate-y-1 hover:shadow-lg ${
              fournisseur.actif
                ? 'border-slate-200/90 hover:border-teal-300/80 shadow-xs'
                : 'border-slate-200/70 bg-slate-50/40 opacity-80 hover:opacity-100 shadow-xs'
            }`}
          >
            {/* Top gradient highlight strip */}
            <div
              className={`h-1.5 w-full ${
                fournisseur.actif
                  ? 'bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600'
                  : 'bg-slate-300'
              }`}
            />

            <div className="p-5 flex flex-col h-full justify-between space-y-4">
              {/* Header: Monogram Avatar + Name + Status */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner transition-transform duration-200 group-hover:scale-105 ${
                        fournisseur.actif
                          ? 'bg-gradient-to-tr from-teal-50 to-emerald-100 text-teal-800 border border-teal-200/80'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3
                        className="font-bold text-slate-900 text-sm group-hover:text-teal-700 transition-colors line-clamp-1"
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
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Actif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                      <XCircle className="w-3 h-3 text-slate-400" />
                      <span>Inactif</span>
                    </span>
                  )}
                </div>

                {/* Details List */}
                <div className="mt-4 space-y-2 text-xs">
                  {/* Email with copy button */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group/row hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium truncate" title={fournisseur.email}>
                        {fournisseur.email}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(fournisseur.email, `email-${fournisseur.id}`)}
                      title="Copier l'email"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                    >
                      {copiedKey === `email-${fournisseur.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60 group-hover/row:opacity-100" />
                      )}
                    </button>
                  </div>

                  {/* Phone with copy button */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group/row hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-center space-x-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 font-medium truncate">
                        {fournisseur.telephone || 'Non renseigné'}
                      </span>
                    </div>
                    {fournisseur.telephone && (
                      <button
                        onClick={() => copyToClipboard(fournisseur.telephone!, `phone-${fournisseur.id}`)}
                        title="Copier le téléphone"
                        className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                      >
                        {copiedKey === `phone-${fournisseur.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 opacity-60 group-hover/row:opacity-100" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Address */}
                  {fournisseur.adresse && (
                    <div className="flex items-start space-x-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate" title={fournisseur.adresse}>
                        {fournisseur.adresse}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewCommandes(fournisseur)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100/80 border border-teal-200/80 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                  <span>Commandes</span>
                </button>

                <button
                  onClick={() => onEdit(fournisseur)}
                  title="Modifier les coordonnées"
                  className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {fournisseur.actif ? (
                  <button
                    onClick={() => onToggleStatus(fournisseur)}
                    title="Désactiver le fournisseur"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => onToggleStatus(fournisseur)}
                    title="Réactiver le fournisseur"
                    className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
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
