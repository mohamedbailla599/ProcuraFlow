import React from 'react';
import { Receipt, Server, Database, ArrowRight, ShieldAlert, FileCheck2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export const FacturesPage: React.FC = () => {
  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-8 sm:pb-10 space-y-6 animate-fade-in-up">
      {/* Page Header with Shared Component */}
      <PageHeader
        badge={
          <Badge variant="warning" dot size="sm">
            Module en préparation • Phase 3
          </Badge>
        }
        title="Gestion & Rapprochement des Factures"
        description="Enregistrement des factures fournisseurs, contrôle de conformité et rapprochement à 3 voies (Commande - Réception - Facture)."
        actions={
          <Link to="/fournisseurs">
            <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Consulter les Fournisseurs
            </Button>
          </Link>
        }
      />

      {/* Specifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
              <Server className="w-5 h-5" />
            </div>
            <CardTitle>Microservice Dédié</CardTitle>
            <CardDescription>service-factures-hamza</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Responsable :</span> <span className="font-semibold text-slate-800 dark:text-slate-200">Hamza</span></div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Stack :</span> Node.js / Express</div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Port local :</span> <code className="text-teal-600 dark:text-teal-400 font-bold font-mono">:8084</code></div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Statut :</span> <Badge variant="warning" size="xs">En préparation</Badge></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
              <Database className="w-5 h-5" />
            </div>
            <CardTitle>Persistance & Données</CardTitle>
            <CardDescription>schema_factures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Base :</span> Neon PostgreSQL 17</div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Tables :</span> <code className="text-xs font-mono">factures, rapprochements</code></div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Isolation :</span> Schéma propriétaire strict</div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Règle :</span> Aucun accès inter-schéma direct</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
              <Receipt className="w-5 h-5" />
            </div>
            <CardTitle>Contrat d'Intégration</CardTitle>
            <CardDescription>REST API JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Endpoints :</span> <code className="text-xs font-mono text-teal-600 dark:text-teal-400">GET /api/factures</code></div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Rapprochement :</span> <code className="text-xs font-mono">POST /api/factures/:id/rapprocher</code></div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Flux :</span> Rapproche Commande (:8082) & Réception (:8083)</div>
              <div><span className="text-slate-400 dark:text-slate-500 font-medium">Protocole :</span> HTTP REST synchrone</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Notice */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Prêt pour l'implémentation par Hamza
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
              La structure modulaire (<code className="text-xs font-mono">api/</code>, <code className="text-xs font-mono">components/</code>, <code className="text-xs font-mono">types/</code>, <code className="text-xs font-mono">utils/</code>) et les composants UI partagés (<code className="text-xs font-mono">Button</code>, <code className="text-xs font-mono">Badge</code>, <code className="text-xs font-mono">Card</code>, <code className="text-xs font-mono">Modal</code>) sont prêts à l'emploi. Le module <strong>Fournisseurs</strong> reste 100% opérationnel sur le port <code className="text-xs font-mono text-teal-600 dark:text-teal-400">:8081</code>.
            </p>
          </div>
        </div>

        <Link to="/fournisseurs" className="shrink-0">
          <Button variant="outline" size="sm">
            Voir le module actif
          </Button>
        </Link>
      </div>
    </div>
  );
};
