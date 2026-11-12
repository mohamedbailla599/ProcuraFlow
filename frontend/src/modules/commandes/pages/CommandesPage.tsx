import React, { useState, useEffect } from 'react';
import {
  PageHeader,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Modal,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../../components/ui';
import { Plus, Trash2, Eye, Search, RefreshCw, Package } from 'lucide-react';
import {
  getAllCommandes,
  getCommandesByFournisseur,
  createCommande,
  updateCommandeStatut,
  deleteCommande,
} from '../api';
import { Commande, LigneCommande } from '../types';
import { formatMontant, formatDate } from '../utils';

export const CommandesPage: React.FC = () => {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fournisseurFilter, setFournisseurFilter] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);

  // Formulaire nouvelle commande
  const [fournisseurId, setFournisseurId] = useState<number>(1);
  const [lignes, setLignes] = useState<Omit<LigneCommande, 'id'>[]>([
    { designation: '', quantite: 1, prixUnitaire: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadCommandes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = fournisseurFilter.trim()
        ? await getCommandesByFournisseur(Number(fournisseurFilter))
        : await getAllCommandes();
      setCommandes(data);
    } catch (err: any) {
      setError(err.message || 'Impossible de joindre le service Commandes (:8082)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommandes();
  }, []);

  const handleAddLigne = () => {
    setLignes([...lignes, { designation: '', quantite: 1, prixUnitaire: 0 }]);
  };

  const handleRemoveLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const handleLigneChange = (index: number, field: keyof Omit<LigneCommande, 'id'>, value: string | number) => {
    const updated = [...lignes];
    updated[index] = { ...updated[index], [field]: value };
    setLignes(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCommande({
        fournisseurId: Number(fournisseurId),
        statut: 'EN_ATTENTE',
        lignesCommande: lignes,
      });
      setIsCreateOpen(false);
      setLignes([{ designation: '', quantite: 1, prixUnitaire: 0 }]);
      loadCommandes();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatutChange = async (id: number, newStatut: string) => {
    try {
      await updateCommandeStatut(id, newStatut);
      loadCommandes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Supprimer la commande #${id} ?`)) return;
    try {
      await deleteCommande(id);
      loadCommandes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'VALIDEE':
      case 'LIVREE':
        return <Badge variant="success" dot size="sm">{statut}</Badge>;
      case 'ANNULEE':
        return <Badge variant="danger" dot size="sm">{statut}</Badge>;
      case 'EN_COURS':
        return <Badge variant="info" dot size="sm">{statut}</Badge>;
      default:
        return <Badge variant="warning" dot size="sm">{statut}</Badge>;
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-8 sm:pb-10 space-y-6">
      <PageHeader
        badge={<Badge variant="teal" dot size="sm">Service Commandes (:8082)</Badge>}
        title="Gestion des Commandes"
        description="Créez, suivez et gérez les bons de commande et leurs lignes d'achat."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="md" icon={<RefreshCw className="w-4 h-4" />} onClick={loadCommandes}>
              Actualiser
            </Button>
            <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
              Nouvelle Commande
            </Button>
          </div>
        }
      />

      {/* Recherche par fournisseur */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                placeholder="Filtrer par ID Fournisseur (ex: 5)..."
                value={fournisseurFilter}
                onChange={(e) => setFournisseurFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <Button variant="secondary" size="md" onClick={loadCommandes}>
              Filtrer
            </Button>
            {fournisseurFilter && (
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setFournisseurFilter('');
                  setTimeout(loadCommandes, 0);
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Bons de commande ({commandes.length})</CardTitle>
          <CardDescription>Données en temps réel depuis le backend Spring Boot (:8082)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Chargement des commandes depuis :8082..." />
          ) : error ? (
            <ErrorState message={error} onRetry={loadCommandes} />
          ) : commandes.length === 0 ? (
            <EmptyState
              title="Aucune commande trouvée"
              description="Créez votre premier bon de commande pour commencer."
              action={
                <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)}>
                  Nouvelle Commande
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Fournisseur ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Articles</th>
                    <th className="py-3 px-4">Montant Total</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {commandes.map((cmd) => (
                    <tr key={cmd.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold">#{cmd.id}</td>
                      <td className="py-3 px-4">Fournisseur #{cmd.fournisseurId}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(cmd.dateCommande)}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                          <Package className="w-3.5 h-3.5" />
                          {cmd.lignesCommande?.length || 0} ligne(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-teal-600 dark:text-teal-400">
                        {formatMontant(cmd.montantTotal)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatutBadge(cmd.statut)}
                          <select
                            value={cmd.statut}
                            onChange={(e) => handleStatutChange(cmd.id, e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 bg-transparent border-slate-200 dark:border-slate-700"
                          >
                            <option value="EN_ATTENTE">EN_ATTENTE</option>
                            <option value="VALIDEE">VALIDEE</option>
                            <option value="EN_COURS">EN_COURS</option>
                            <option value="LIVREE">LIVREE</option>
                            <option value="ANNULEE">ANNULEE</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="xs"
                          icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedCommande(cmd)}
                        >
                          Détails
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => handleDelete(cmd.id)}
                        >
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Détails */}
      <Modal
        isOpen={!!selectedCommande}
        onClose={() => setSelectedCommande(null)}
        title={`Détails de la Commande #${selectedCommande?.id}`}
        description={`Fournisseur #${selectedCommande?.fournisseurId} — Total : ${formatMontant(selectedCommande?.montantTotal || 0)}`}
        maxWidth="2xl"
        footer={
          <Button variant="outline" onClick={() => setSelectedCommande(null)}>
            Fermer
          </Button>
        }
      >
        {selectedCommande && (
          <div className="space-y-4">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500">
                  <th className="py-2">Désignation</th>
                  <th className="py-2 text-center">Quantité</th>
                  <th className="py-2 text-right">Prix Unitaire</th>
                  <th className="py-2 text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedCommande.lignesCommande?.map((ligne, idx) => (
                  <tr key={ligne.id || idx}>
                    <td className="py-2.5 font-medium">{ligne.designation}</td>
                    <td className="py-2.5 text-center">{ligne.quantite}</td>
                    <td className="py-2.5 text-right">{formatMontant(ligne.prixUnitaire)}</td>
                    <td className="py-2.5 text-right font-semibold">
                      {formatMontant(ligne.quantite * ligne.prixUnitaire)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Modal Création */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle Commande"
        description="Renseignez l'ID du fournisseur et ajoutez les lignes d'achat."
        maxWidth="2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleCreateSubmit}>
              Enregistrer la commande
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID du Fournisseur</label>
            <input
              type="number"
              required
              min={1}
              value={fournisseurId}
              onChange={(e) => setFournisseurId(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border rounded-xl bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium">Lignes de commande</label>
              <Button type="button" variant="teal-subtle" size="xs" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddLigne}>
                Ajouter une ligne
              </Button>
            </div>

            {lignes.map((ligne, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                <input
                  type="text"
                  required
                  placeholder="Désignation (ex: PC Portable)"
                  value={ligne.designation}
                  onChange={(e) => handleLigneChange(index, 'designation', e.target.value)}
                  className="col-span-6 px-2.5 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="Qté"
                  value={ligne.quantite}
                  onChange={(e) => handleLigneChange(index, 'quantite', Number(e.target.value))}
                  className="col-span-2 px-2.5 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="Prix U."
                  value={ligne.prixUnitaire}
                  onChange={(e) => handleLigneChange(index, 'prixUnitaire', Number(e.target.value))}
                  className="col-span-3 px-2.5 py-1.5 text-sm border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                />
                <div className="col-span-1 text-right">
                  {lignes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLigne(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </form>
      </Modal>
    </div>
  );
};