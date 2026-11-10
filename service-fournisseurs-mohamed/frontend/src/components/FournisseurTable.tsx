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
  CheckCircle2,
  XCircle,
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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading && fournisseurs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-3">
              <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded-md skeleton-shimmer" />
                <div className="h-3 w-1/6 rounded-md skeleton-shimmer" />
              </div>
              <div className="h-4 w-1/5 rounded-md skeleton-shimmer" />
              <div className="h-4 w-1/6 rounded-md skeleton-shimmer" />
              <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fournisseurs.length === 0) {
    return (
      <div className="glass-panel rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">Aucun fournisseur trouvé</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Aucun fournisseur ne correspond aux critères de recherche actuels.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-slate-50/90 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">Fournisseur</th>
              <th scope="col" className="px-6 py-4">Coordonnées</th>
              <th scope="col" className="px-6 py-4">Adresse</th>
              <th scope="col" className="px-6 py-4 text-center">Statut</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fournisseurs.map((fournisseur) => {
              const initials = fournisseur.nom
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0].toUpperCase())
                .join('') || 'FO';

              return (
                <tr
                  key={fournisseur.id}
                  className="hover:bg-teal-50/30 transition-colors group"
                >
                  {/* Nom & ID */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <div className="flex items-center space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-inner transition-transform group-hover:scale-105 ${
                          fournisseur.actif
                            ? 'bg-gradient-to-tr from-teal-50 to-emerald-100 text-teal-800 border border-teal-200/80'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                          {fournisseur.nom}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">ID: #{fournisseur.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Email & Téléphone */}
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{fournisseur.email}</span>
                        <button
                          onClick={() => copyToClipboard(fournisseur.email, `table-email-${fournisseur.id}`)}
                          title="Copier l'email"
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {copiedKey === `table-email-${fournisseur.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      </div>
                      {fournisseur.telephone ? (
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{fournisseur.telephone}</span>
                          <button
                            onClick={() => copyToClipboard(fournisseur.telephone!, `table-phone-${fournisseur.id}`)}
                            title="Copier le téléphone"
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {copiedKey === `table-phone-${fournisseur.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Non renseigné</span>
                      )}
                    </div>
                  </td>

                  {/* Adresse */}
                  <td className="px-6 py-4.5">
                    {fournisseur.adresse ? (
                      <div className="flex items-start space-x-1.5 text-xs text-slate-600 max-w-xs truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={fournisseur.adresse}>
                          {fournisseur.adresse}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Non renseignée</span>
                    )}
                  </td>

                  {/* Statut Badge */}
                  <td className="px-6 py-4.5 whitespace-nowrap text-center">
                    {fournisseur.actif ? (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Actif</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Inactif</span>
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* Bouton Voir commandes */}
                      <button
                        onClick={() => onViewCommandes(fournisseur)}
                        title="Consulter les commandes"
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors shadow-2xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                        <span>Commandes</span>
                      </button>

                      {/* Bouton Modifier */}
                      <button
                        onClick={() => onEdit(fournisseur)}
                        title="Modifier les coordonnées"
                        className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Bouton Activer / Désactiver */}
                      {fournisseur.actif ? (
                        <button
                          onClick={() => onToggleStatus(fournisseur)}
                          title="Désactiver le fournisseur"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onToggleStatus(fournisseur)}
                          title="Réactiver le fournisseur"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
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
