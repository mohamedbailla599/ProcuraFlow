import React, { useState } from 'react';
import {
  X,
  Receipt,
  ShoppingBag,
  PackageCheck,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileDown,
  Copy,
  Check,
  ArrowRight,
  Database,
  ExternalLink,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Facture } from '../types';
import { formatMAD, formatDate, formatDateTime, exportFacturesPDF, exportSingleFacturePDF } from '../utils';

interface FactureDrawerProps {
  facture: Facture | null;
  isOpen: boolean;
  onClose: () => void;
  onTogglePaiement: (facture: Facture) => void;
  onEdit: (facture: Facture) => void;
}

export const FactureDrawer: React.FC<FactureDrawerProps> = ({
  facture,
  isOpen,
  onClose,
  onTogglePaiement,
  onEdit,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'rapprochement' | 'audit'>('details');

  if (!isOpen || !facture) return null;

  const isPaid = facture.statut_paiement === 'PAYEE';
  const isAnnulee = facture.statut_paiement === 'ANNULEE';
  const refText = facture.numero_facture || `FAC-${facture.id}`;

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleDownloadSinglePDF = () => {
    exportSingleFacturePDF(facture);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    isAnnulee
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
                      : isPaid
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAnnulee
                        ? 'bg-rose-500'
                        : isPaid
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span>
                    {isAnnulee ? 'Facture Annulée' : isPaid ? 'Facture Payée' : 'En attente de paiement'}
                  </span>
                </span>

                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  ID Neon: #{facture.id}
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
                    {refText}
                  </h2>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(refText, 'ref')}
                    title="Copier référence"
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {copiedField === 'ref' ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Émise le {formatDateTime(facture.date_facture)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadSinglePDF}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>PDF</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'details'
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Vue d’ensemble
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rapprochement')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'rapprochement'
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Rapprochement 3-Voies
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'audit'
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Audit & JSON
              </button>
            </div>
          </div>

          {/* Drawer Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {activeTab === 'details' && (
              <>
                {/* Montant Card */}
                <div className="bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20 rounded-xl p-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
                    Montant de la Facture
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                      {formatMAD(facture.montant_facture)}
                    </span>
                    <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                      Toutes Taxes Comprises (TTC)
                    </span>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                      Statut de Paiement
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            PAYÉE
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                            NON PAYÉE
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                      Date d’Émission
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-teal-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formatDate(facture.date_facture)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Microservice Info */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    <Database className="w-4 h-4 text-teal-500" />
                    <span>Origine & Microservice</span>
                  </h4>
                  <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-400 dark:text-slate-500">Service</span>
                      <span className="font-mono font-semibold text-teal-600 dark:text-teal-400">
                        service-factures-hamza (:8084)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-slate-400 dark:text-slate-500">Schéma Base</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        schema_factures.factures
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400 dark:text-slate-500">ORM Utilisé</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Drizzle ORM (PostgreSQL Neon)
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'rapprochement' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20">
                  <div className="flex items-center space-x-2 text-teal-800 dark:text-teal-300 font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Principe du Rapprochement à 3 Voies</span>
                  </div>
                  <p className="text-[11px] text-teal-700/90 dark:text-teal-400/90 leading-relaxed">
                    Pour garantir la conformité financière des achats publics/universitaires, une facture ne peut être liquidée que si le bon de commande initial et le bon de réception de livraison concordent.
                  </p>
                </div>

                {/* 3 Steps */}
                <div className="space-y-3">
                  {/* Step 1: Commande */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          1. Bon de Commande
                        </h4>
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          CMD #{facture.commande_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Service Achats • Commande validée et transmise au fournisseur.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Réception */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          2. Réception Physique
                        </h4>
                        <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                          REC #{facture.reception_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Service Magasin / Logistique • Articles réceptionnés et conformes.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Facture */}
                  <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/20 dark:bg-teal-950/10 flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          3. Facture Définitive
                        </h4>
                        <span className="font-mono text-xs font-bold text-teal-600 dark:text-teal-400">
                          {formatMAD(facture.montant_facture)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Service Comptabilité & Facturation • Prête pour mandatement ou paiement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Horodatage & Traçabilité
                  </h4>
                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Date Création :</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {formatDateTime(facture.created_at)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 dark:text-slate-500">Dernière MAJ :</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {formatDateTime(facture.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Raw JSON Data */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      Payload JSON Réseau
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(JSON.stringify(facture, null, 2), 'json')
                      }
                      className="text-xs text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                    >
                      {copiedField === 'json' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copié</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono overflow-x-auto p-2 bg-slate-950 rounded-lg text-emerald-400 leading-relaxed">
                    {JSON.stringify(facture, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            {isAnnulee ? (
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 italic">
                Cette facture a été annulée et archivée (aucune modification possible).
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(facture);
                  }}
                  disabled={isPaid}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors ${
                    isPaid
                      ? 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Modifier
                </button>

                <button
                  type="button"
                  onClick={() => onTogglePaiement(facture)}
                  className={`inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors ${
                    isPaid
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isPaid ? 'Rétablir Non Payée' : 'Marquer comme Payée'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

