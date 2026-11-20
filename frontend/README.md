# ProcuraFlow — Guide d'Architecture & Contribution Frontend

> **Plateforme Intégrée de Gestion des Achats Universitaires**  
> Frontend Unique Modulaire Multi-Microservices

---

## 1. Vue d'ensemble de l'Architecture

ProcuraFlow adopte une architecture **Frontend Unique Unifié** hébergé à la racine du dépôt (`frontend/`). Il fédère les 4 microservices métier de la plateforme au sein d'une interface utilisateur réactive, cohérente et ergonomique.

```text
frontend/
├── src/
│   ├── app/                      # Configuration applicative globale
│   │   ├── App.tsx               # Point d'entrée React & Providers
│   │   └── router.tsx            # Définition des routes React Router
│   ├── components/               # Composants partagés inter-modules
│   │   ├── layout/               # Shell applicatif (AppLayout, Sidebar, Topbar, GlobalCommandPalette)
│   │   └── ui/                   # Design System & UI Primitives (Button, Badge, Card, Modal, etc.)
│   ├── context/                  # Contextes globaux (ThemeContext, AppContext)
│   ├── modules/                  # Espaces modulaires autonomes par microservice
│   │   ├── fournisseurs/         # [Mohamed] Référentiel, notation & cartographie (:8081)
│   │   ├── commandes/            # [Yassine] Bons de commande & lignes d'achat (:8082)
│   │   ├── receptions/           # [Ali] Suivi livraisons & contrôle conformité (:8083)
│   │   └── factures/             # [Hamza] Facturation & rapprochement 3-voies (:8084)
│   ├── styles/                   # Styles globaux & animations
│   ├── main.tsx                  # Montage React DOM
│   └── index.css                 # Configuration Tailwind CSS & tokens
├── vite.config.ts                # Configuration Vite & Proxies vers les 4 microservices
└── package.json                  # Dépendances & scripts
```

---

## 2. Stack Technique

| Composant | Technologie | Version / Détails |
|---|---|---|
| **Framework UI** | React | `^18.3.1` (Hooks, StrictMode, Suspense) |
| **Typage** | TypeScript | `^5.6.2` (Mode strict activé) |
| **Bundler & Dev Server** | Vite | `^6.4.6` (Hot Module Replacement instantané) |
| **Styles & Responsive** | Tailwind CSS | `^3.4.13` (JIT engine, mode sombre natif) |
| **Routage** | React Router DOM | `^7.18.5` (createBrowserRouter, Data APIs) |
| **Iconographie** | Lucide React | `^0.474.0` (Icônes vectorielles cohérentes) |
| **Visualisation cartographique** | Leaflet & React Leaflet | OpenStreetMap (Fournisseurs) |
| **Exports & Rapports** | jsPDF & SheetJS (xlsx) | Rapports PDF graphiques & classeurs Excel |

---

## 3. Matrice de Responsabilité des Modules

Chaque développeur est pleinement propriétaire de son microservice backend et de son module frontend correspondant :

| Module | Propriétaire | Backend Stack | Port Local | Préfixe API | Statut Actuel |
|---|---|---|---|---|---|
| **Fournisseurs** | Mohamed Bailla | Java 21 / Spring Boot 3 | `:8081` | `/api/fournisseurs` | **Opérationnel** |
| **Commandes** | Yassine | Java 21 / Spring Boot 3 | `:8082` | `/api/commandes` | *En préparation* |
| **Réceptions** | Ali | Java 21 / Spring Boot 3 | `:8083` | `/api/receptions` | *En préparation* |
| **Factures** | Hamza | Node.js / Express | `:8084` | `/api/factures` | *En préparation* |

---

## 4. Démarrage Rapide

### Prérequis
- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`

### Installation & Lancement

```bash
# 1. Se positionner dans le dossier frontend
cd frontend

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement Vite
npm run dev
# -> Disponible sur http://localhost:5173

# 4. Vérifier la compilation TypeScript et le build de production
npm run build
```

---

## 5. Guide Pas-à-Pas pour Développer votre Module

Pour implémenter votre module (par exemple `commandes`, `receptions` ou `factures`), suivez scrupuleusement les étapes ci-dessous.

### Étape 1 : Structurer votre dossier dans `src/modules/{votre-module}/`

Le squelette standard est déjà initialisé pour vous :

```text
src/modules/commandes/
├── api/
│   └── index.ts          # Client API HTTP (fetch ou axios vers /api/commandes)
├── components/           # Composants exclusifs à votre métier
│   ├── CommandeTable.tsx
│   └── CommandeModal.tsx
├── pages/
│   └── CommandesPage.tsx # Page racine connectée au routeur
├── types/
│   └── index.ts          # Interfaces TypeScript métier
└── utils/
    └── index.ts          # Fonctions utilitaires, calculs de totaux, devises
```

### Étape 2 : Définir les types métier (`types/index.ts`)

```typescript
// src/modules/commandes/types/index.ts
export interface Commande {
  id: number;
  numeroCommande: string;
  fournisseurId: number;
  dateCommande: string;
  statut: 'BROUILLON' | 'VALIDEE' | 'EN_COURS' | 'LIVREE' | 'ANNULEE';
  montantTotalHT: number;
  montantTotalTTC: number;
}
```

### Étape 3 : Créer le client API (`api/index.ts`)

Utilisez des chemins relatifs `/api/{module}`. Le proxy Vite se charge de router la requête vers votre port local.

```typescript
// src/modules/commandes/api/index.ts
import { Commande } from '../types';

export const COMMANDES_API_BASE = '/api/commandes';

export async function fetchCommandes(params?: Record<string, string>): Promise<Commande[]> {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const response = await fetch(`${COMMANDES_API_BASE}${query}`);
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status}`);
  }
  return response.json();
}
```

### Étape 4 : Développer la page principale (`pages/{Module}Page.tsx`)

Assemblez votre interface en utilisant les composants du Design System partagé (`src/components/ui/`) :

```tsx
// src/modules/commandes/pages/CommandesPage.tsx
import React, { useState, useEffect } from 'react';
import { PageHeader, Badge, Button, Card, CardContent, LoadingState, EmptyState } from '../../../components/ui';
import { Plus } from 'lucide-react';

export const CommandesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-2 sm:pt-4 pb-8 sm:pb-10 space-y-6">
      <PageHeader
        badge={<Badge variant="teal" dot size="sm">Bons d'Achat</Badge>}
        title="Gestion des Commandes"
        description="Gérez les commandes d'achat universitaire et le suivi des lignes de commande."
        actions={
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
            Nouvelle Commande
          </Button>
        }
      />

      <Card>
        <CardContent>
          {loading ? (
            <LoadingState message="Chargement des commandes en cours..." />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">Votre tableau de commandes ici.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

### Étape 5 : Enregistrer la route dans `src/app/router.tsx`

La route est déjà rattachée à `AppLayout`. Vérifiez simplement que votre composant de page est bien importé :

```tsx
// src/app/router.tsx
import { CommandesPage } from '../modules/commandes/pages/CommandesPage';

// Route active :
{
  path: 'commandes',
  element: <CommandesPage />,
}
```

### Étape 6 : Configurer le proxy de développement (`vite.config.ts`)

Pour que vos appels frontend vers `/api/commandes` atteignent votre microservice sur `:8082` sans problème de CORS, vérifiez `vite.config.ts` :

```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api/fournisseurs': { target: 'http://localhost:8081', changeOrigin: true },
    '/api/commandes':    { target: 'http://localhost:8082', changeOrigin: true },
    '/api/receptions':   { target: 'http://localhost:8083', changeOrigin: true },
    '/api/factures':     { target: 'http://localhost:8084', changeOrigin: true },
    '/actuator':         { target: 'http://localhost:8081', changeOrigin: true },
  },
}
```

---

## 6. Bibliothèque de Composants UI Partagés (`src/components/ui/`)

Pour garantir l'homogénéité visuelle de la plateforme ProcuraFlow, utilisez systématiquement les composants UI pré-configurés :

```typescript
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  PageHeader,
  Modal,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../../components/ui';
```

### 1. `Button`
Boutons standardisés avec micro-interactions, états actifs et spinner intégré.
- **Variantes** : `'primary'` (teal), `'secondary'`, `'outline'`, `'danger'`, `'ghost'`, `'teal-subtle'`
- **Tailles** : `'xs'`, `'sm'`, `'md'`, `'lg'`
- **Props utiles** : `icon={<Plus />} `, `iconPosition="left" | "right"`, `loading={boolean}`

```tsx
<Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
  Enregistrer
</Button>
<Button variant="outline" size="sm" loading={isSubmitting}>
  Actualiser
</Button>
```

### 2. `Badge`
Indicateurs de statut compacts avec pastille lumineuse optionnelle.
- **Variantes** : `'default'`, `'success'`, `'warning'`, `'danger'`, `'info'`, `'teal'`
- **Props utiles** : `dot={true}`, `size="xs" | "sm" | "md"`, `pill={true}`

```tsx
<Badge variant="success" dot size="sm">Validé</Badge>
<Badge variant="warning" dot size="sm">En attente</Badge>
<Badge variant="danger" dot size="sm">Rejeté</Badge>
```

### 3. `Card` & Sous-composants
Conteneurs de contenu avec bordures subtiles et coins arrondis `rounded-2xl`.
- Composants : `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Props utiles** : `hoverable={true}`

```tsx
<Card hoverable>
  <CardHeader>
    <CardTitle>Bordereau #CMD-2026-042</CardTitle>
    <CardDescription>Fournisseur : Atlas Bureautique</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm">Montant Total : 12 500,00 MAD</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline" size="xs">Détails</Button>
  </CardFooter>
</Card>
```

### 4. `PageHeader`
En-tête de page standardisé avec titre, description, badge et zone d'actions.

```tsx
<PageHeader
  badge={<Badge variant="teal" dot size="sm">Module Opérationnel</Badge>}
  title="Titre de la Page"
  description="Explication synthétique du rôle fonctionnel du module."
  actions={<Button variant="primary" size="sm">Action</Button>}
/>
```

### 5. `Modal`
Boîte de dialogue accessible avec backdrop flouté, gestion de la touche `Escape` et défilement confiné.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Nouvelle Commande"
  description="Remplissez les informations d'achat pour générer le bon."
  maxWidth="2xl"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
      <Button variant="primary" onClick={handleSubmit}>Valider</Button>
    </>
  }
>
  <form>{/* Champs du formulaire */}</form>
</Modal>
```

### 6. États : `LoadingState`, `EmptyState`, `ErrorState`
Composants prêts à l'emploi pour les états asynchrones.

```tsx
// Chargement
<LoadingState message="Récupération des données..." />

// Aucun résultat
<EmptyState
  title="Aucune commande trouvée"
  description="Créez votre première commande pour commencer le suivi."
  actionText="Créer une commande"
  onAction={handleCreate}
/>

// Erreur
<ErrorState
  message="Impossible de joindre le serveur Commandes (:8082)."
  onRetry={handleRetry}
/>
```

---

## 7. Règles d'Architecture et Bonnes Pratiques

### 1. Communication exclusivement via HTTP REST + JSON
- Tous les échanges entre le frontend et les microservices doivent se faire via des requêtes REST HTTP avec corps JSON.
- Respecter les conventions REST (`GET`, `POST`, `PUT`, `DELETE`).

### 2. Isolation stricte des schémas et des données
- **Ne jamais effectuer de requêtes SQL inter-schémas.**
- Chaque microservice possède son propre schéma PostgreSQL isolé dans la base Neon (`schema_fournisseurs`, `schema_commandes`, `schema_receptions`, `schema_factures`).
- Si le module Factures a besoin des données d'une commande, il doit interroger l'API REST de Commandes (`GET /api/commandes/:id`), jamais la table directement.

### 3. Isolation modulaire du code frontend
- Le code métier d'un module (`components/`, `api/`, `utils/`, `types/`) doit résider exclusivement dans son propre dossier `src/modules/{nom}`.
- N'importez pas de composants privés d'un autre module (ex: `Commandes` ne doit pas importer un composant interne de `Fournisseurs`).
- Si un composant ou un utilitaire est utile à plusieurs modules, déplacez-le dans `src/components/ui/` ou `src/utils/`.

### 4. Palette de Commandes Globale (Ctrl + K)
Vous pouvez enregistrer dynamiquement des raccourcis propres à votre module grâce au hook `useRegisterCommands` fourni par `AppContext` :

```typescript
import { useRegisterCommands, PaletteCommand } from '../../../context/AppContext';

const myCommands: PaletteCommand[] = [
  {
    id: 'cmd-new',
    category: 'Commandes',
    title: 'Nouveau Bon de Commande',
    icon: <Plus className="w-4 h-4" />,
    shortcut: 'N',
    onSelect: () => handleOpenModal(),
  },
];

useRegisterCommands('commandes', myCommands);
```

---

## 8. Workflow Git et Bonnes Pratiques de Collaboration

1. **Branches dédiées** : Travaillez toujours sur votre branche fonctionnelle, par exemple :
   - `mohamed/service-fournisseurs`
   - `yassine/service-commandes`
   - `ali/service-receptions`
   - `hamza/service-factures`
2. **Ne modifiez pas les fichiers des autres modules** : Limitez vos modifications à votre sous-dossier `src/modules/{votre-nom}/`.
3. **Validez toujours le build avant de soumettre une PR** :
   ```bash
   npm run build
   ```
   Le build doit s'exécuter avec **0 erreur TypeScript** (`tsc`) et générer le bundle Vite sans échec.

