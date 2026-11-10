import React from 'react';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Edit2,
  Power,
  RotateCcw,
  CheckCircle2,
  XCircle,
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
  if (loading && fournisseurs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mb-3" />
        <p className="text-slate-500 text-sm">Chargement des fournisseurs...</p>
      </div>
    );
  }

  if (fournisseurs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-900 mb-1">Aucun fournisseur trouvé</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Aucun fournisseur ne correspond aux critères de recherche actuels.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3.5">Fournisseur</th>
              <th scope="col" className="px-6 py-3.5">Coordonnées</th>
              <th scope="col" className="px-6 py-3.5">Adresse</th>
              <th scope="col" className="px-6 py-3.5 text-center">Statut</th>
              <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fournisseurs.map((fournisseur) => (
              <tr
                key={fournisseur.id}
                className="hover:bg-slate-50/60 transition-colors group"
              >
                {/* Nom & ID */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        fournisseur.actif
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {fournisseur.nom.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                        <span>{fournisseur.nom}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">ID: #{fournisseur.id}</span>
                    </div>
                  </div>
                </td>

                {/* Email & Téléphone */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fournisseur.email}</span>
                    </div>
                    {fournisseur.telephone ? (
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fournisseur.telephone}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Non renseigné</span>
                    )}
                  </div>
                </td>

                {/* Adresse */}
                <td className="px-6 py-4">
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
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {fournisseur.actif ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Actif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <XCircle className="w-3 h-3 text-slate-400" />
                      <span>Inactif</span>
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    {/* Bouton Voir commandes */}
                    <button
                      onClick={() => onViewCommandes(fournisseur)}
                      title="Consulter l'historique des commandes"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>

                    {/* Bouton Modifier */}
                    <button
                      onClick={() => onEdit(fournisseur)}
                      title="Modifier les coordonnées"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Bouton Activer / Désactiver */}
                    {fournisseur.actif ? (
                      <button
                        onClick={() => onToggleStatus(fournisseur)}
                        title="Désactiver le fournisseur"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleStatus(fournisseur)}
                        title="Réactiver le fournisseur"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

