# Audit Charte Graphique & Design System — ProcuraFlow Frontend

> Document d'audit extrait directement du code source de l'application ProcuraFlow (`frontend/`).  
> Toutes les valeurs, chemins de fichiers et numéros de lignes correspondent strictement au code existant.

---

## 1. Project and Stack

### 1.1 Stack technique et versions (`frontend/package.json`)
- **Framework UI** : React `^18.3.1` (ligne 18) & React DOM `^18.3.1` (ligne 19)
- **Routage SPA** : React Router DOM `^7.18.5` (ligne 20) — Routeur déclaratif `createBrowserRouter` (`src/app/router.tsx`)
- **Langage** : TypeScript `^5.7.2` (ligne 33)
- **Bundler & Dev Server** : Vite `^6.0.7` (ligne 34) avec `@vitejs/plugin-react` `^4.3.4` (ligne 29)
- **Moteur CSS** : Tailwind CSS `^3.4.17` (ligne 32) avec PostCSS `^8.4.49` (ligne 31) et Autoprefixer `^10.4.20` (ligne 30)
- **Utilitaires de classes** : `clsx` `^2.1.1` (ligne 12) et `tailwind-merge` `^2.6.0` (ligne 21)
- **Bibliothèque d'icônes** : `lucide-react` `^0.468.0` (ligne 17)
- **Cartographie géographique** : `leaflet` `^1.9.4` (ligne 15) et `leaflet.markercluster` `^1.5.3` (ligne 16)
- **Génération & Export PDF** : `jspdf` `^4.2.1` (ligne 13) et `jspdf-autotable` `^5.0.9` (ligne 14)
- **Traitement Tableurs / Excel** : `xlsx` `^0.18.5` (ligne 22)
- **Bibliothèque de graphiques / charts** : **NOT DEFINED** (Aucune bibliothèque tierce de type Chart.js, Recharts ou ApexCharts n'est installée dans `package.json` ; les visualisations et jauges de progression sont implémentées en pur CSS / HTML / SVG).

### 1.2 Emplacement du Layout partagé et des composants génériques
- **Layout racine** : `frontend/src/components/layout/AppLayout.tsx`
- **Barre supérieure (Topbar)** : `frontend/src/components/layout/Topbar.tsx`
- **Barre latérale (Sidebar & Mobile Drawer)** : `frontend/src/components/layout/Sidebar.tsx`
- **Palette de commandes globale (Ctrl + K)** : `frontend/src/components/layout/GlobalCommandPalette.tsx`
- **Dossier des composants UI réutilisables** : `frontend/src/components/ui/`
  - `Badge.tsx` : Système d'étiquettes et puces de statut
  - `Button.tsx` : Système de boutons unifiés
  - `Card.tsx` : Système de cartes conteneurs (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`)
  - `Modal.tsx` : Boîte de dialogue générique accessible
  - `PageHeader.tsx` : En-tête standardisé de page avec badge, titre, description et actions
  - `EmptyState.tsx` : Vue d'absence de données
  - `ErrorState.tsx` : Vue d'affichage d'erreurs avec action de réessai
  - `LoadingState.tsx` : Indicateur de chargement centré
- **Composants partagés transversaux hors `ui/`** :
  - `frontend/src/components/ConfirmModal.tsx` : Boîte de dialogue modale de confirmation d'action critique (activation/désactivation)
  - `frontend/src/components/Toast.tsx` : Système de notifications flottantes temporisées empilables
  - `frontend/src/components/ErrorBoundary.tsx` : Frontière d'interception d'exceptions React

---

## 2. Logo and Branding

### 2.1 Fichiers de logo, formats et dimensions
- **Favicon & Logo vectoriel** : `frontend/public/favicon.svg` (répliqué au build dans `frontend/dist/favicon.svg`)
  - **Format** : SVG natif vectoriel
  - **Dimensions** : `viewBox="0 0 32 32"` (base 32×32 px)
  - **Structure graphique** :
    - Fond carré aux coins arrondis : `<rect width="32" height="32" rx="8" fill="url(#procura-gradient)" />`
    - Dégradé linéaire `procura-gradient` (`favicon.svg` lignes 3-6) :
      - Stop 0% : `#0D9488` (Teal 600)
      - Stop 100% : `#059669` (Emerald 600)
    - Silhouette d'édifice corporate (tour centrale + aile droite) en blanc (`fill="white"` opacités `0.95` et `0.80`)
    - Fenêtres carrées (`rx="0.5"`) et porche d'entrée teintés en `#0D9488`
  - **Déclaration HTML** (`frontend/index.html` lignes 6-7) :
    - `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
    - `<link rel="apple-touch-icon" href="/favicon.svg" />`
- **Fichiers de logo matriciels (.png, .jpg, .webp)** : **NOT DEFINED** (aucun fichier raster n'est présent dans `frontend/public/` ou `frontend/src/assets/`).

### 2.2 Rendu du Logo / Wordmark dans l'interface
1. **Dans la barre latérale (`Sidebar.tsx` lignes 94-111)** :
   - **Conteneur Icône** : carré arrondi `w-9 h-9 rounded-xl` avec fond dégradé `bg-gradient-to-br from-teal-500 to-emerald-600`, ombre `shadow-md shadow-teal-500/20`, micro-interaction `group-hover:scale-105 duration-200`, contenant l'icône Lucide `<Layers className="w-5 h-5" />` blanche.
   - **Nom de marque (Wordmark)** :
     - `Procura` : `font-extrabold text-base tracking-tight text-slate-900 dark:text-white`
     - `Flow` : `text-teal-600 dark:text-teal-400`
   - **Pill de version** : badge `v1.0` (`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60`)
   - **Tagline sous le logo** : `Plateforme Achats Intégrée` (`text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate`)
2. **Dans la Topbar (`Topbar.tsx` lignes 87-100)** :
   - Le Topbar n'affiche pas le mot "ProcuraFlow" mais le **fil d'ariane contextuel du module actif** :
     - Icône du module actif dans un conteneur carré `w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 text-teal-600 dark:text-teal-400`.
     - Titre du module : `font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight`.
     - Responsable et port : `• {owner} ({port})` en `text-xs text-slate-400 dark:text-slate-500 font-medium`.
3. **Dans les exports PDF (`pdfExport.ts` lignes 107-123)** :
   - Carré d'icône `roundedRect(14, 11, 10, 10, 2, 2)` en `#0F172A` avec initiales `PF` blanches en Helvetica Bold 11pt.
   - Wordmark : `ProcuraFlow` en Helvetica Bold 16pt, couleur `#0F172A`.
   - Sous-titre officiel : `Système Intégré de Gestion des Achats & Fournisseurs` en Helvetica Normal 8.5pt, couleur `#64748B`.

### 2.3 Règles d'usage trouvées dans le code ou la documentation
- **Règles formelles d'exclusion ou zone de sécurité** : **NOT DEFINED** dans le code.
- **Règle de composition observée** : L'association permanente du nom typographique bicolore (`Procura` en Slate + `Flow` en Teal) adossée à l'icône sur fond dégradé Teal/Emerald.

---

## 3. Color Palette

### 3.1 Définitions Tailwind (`frontend/tailwind.config.js`)
Définies dans `theme.extend` :
```javascript
colors: {
  slate: {
    850: '#151f32', // Surface intermédiaire dark mode
  },
  brand: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    500: '#14b8a6',
    600: '#0d9488', // Couleur primaire ProcuraFlow
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  }
}
```

### 3.2 Variables CSS natives (`frontend/src/index.css`)

#### Mode Clair (`:root`, lignes 8-20)
- `--color-primary`: `#0D9488` (Teal 600)
- `--color-primary-hover`: `#0F766E` (Teal 700)
- `--color-primary-light`: `#CCFBF1` (Teal 100)
- `--color-primary-muted`: `#99F6E4` (Teal 200)
- `--color-bg`: `#F8FAFC` (Slate 50)
- `--color-surface`: `#FFFFFF` (Blanc pur)
- `--color-text`: `#0F172A` (Slate 900)
- `--color-text-secondary`: `#64748B` (Slate 500)
- `--color-border`: `#E2E8F0` (Slate 200)
- `--color-border-light`: `#F1F5F9` (Slate 100)
- `--color-success`: `#059669` (Emerald 600)
- `--color-warning`: `#D97706` (Amber 600)
- `--color-danger`: `#DC2626` (Red 600)

#### Mode Sombre (`.dark`, lignes 56-62)
- `--color-bg`: `#0B0F17` (Slate 950 profond)
- `--color-surface`: `#111827` (Slate 900 / Gray 900)
- `--color-text`: `#F8FAFC` (Slate 50)
- `--color-text-secondary`: `#94A3B8` (Slate 400)
- `--color-border`: `#1E293B` (Slate 800)
- `--color-border-light`: `#334155` (Slate 700)

### 3.3 Couleurs fonctionnelles réelles Light vs Dark

| Rôle | Mode Clair (HEX / Tailwind) | Mode Sombre (HEX / Tailwind) | Fichier et Référence |
| :--- | :--- | :--- | :--- |
| **Fond d'application** | `#F8FAFC` (`bg-[#f8fafc]` / `bg-slate-50`) | `#0B0F17` (`bg-[#0B0F17]` / `bg-slate-950`) | `index.css:69,75`, `AppLayout.tsx:13` |
| **Surface Carte / Modal** | `#FFFFFF` (`bg-white`) | `#0F172A` (`dark:bg-slate-900`) | `Card.tsx:12`, `Modal.tsx:68` |
| **Bordure standard** | `#E2E8F0` (`border-slate-200/90`) | `#1E293B` (`dark:border-slate-800`) | `Card.tsx:12`, `Topbar.tsx:74` |
| **Texte principal** | `#0F172A` (`text-slate-900` / `text-slate-800`) | `#FFFFFF` (`dark:text-white` / `text-slate-100`) | `index.html:27`, `FournisseurTable.tsx:362` |
| **Texte secondaire** | `#64748B` (`text-slate-500`) | `#94A3B8` (`dark:text-slate-400`) | `PageHeader.tsx:28`, `Sidebar.tsx:108` |
| **Texte tertiaire / Code** | `#94A3B8` (`text-slate-400`) | `#64748B` (`dark:text-slate-500`) | `FournisseurTable.tsx:367` |
| **Couleur primaire** | `#0D9488` (`bg-teal-600`, `text-teal-600`) | `#14B8A6` (`dark:text-teal-400`, `teal-500`) | `Button.tsx:14`, `Sidebar.tsx:102` |
| **Sélection de texte** | `selection:bg-teal-500/20 selection:text-teal-900` | `selection:bg-teal-500/30 selection:text-teal-200` | `index.css:69,75` |

### 3.4 Couleurs des statuts applicatifs & d'alertes

#### Badges et Puces (`Badge.tsx` lignes 11-24)
- **Success** : `bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/70`, dot `bg-emerald-500`
- **Warning** : `bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/70`, dot `bg-amber-500`
- **Danger** : `bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/70`, dot `bg-rose-500`
- **Info** : `bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/70`, dot `bg-blue-500`
- **Teal / Brand** : `bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/80`, dot `bg-teal-500`
- **Default / Neutre** : `bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700/80`, dot `bg-slate-400 dark:bg-slate-500`

#### Toasts (`Toast.tsx` lignes 45-76)
- **Success** : Icône `CheckCircle2` (`text-emerald-400`), bordure `border-emerald-500/40`, dégradé temporisateur `from-emerald-500 to-teal-400`
- **Warning** : Icône `AlertTriangle` (`text-amber-400`), bordure `border-amber-500/40`, dégradé temporisateur `from-amber-500 to-yellow-400`
- **Info** : Icône `Info` (`text-sky-400`), bordure `border-sky-500/40`, dégradé temporisateur `from-sky-500 to-teal-400`
- **Error** : Icône `AlertCircle` (`text-rose-400`), bordure `border-rose-500/40`, dégradé temporisateur `from-rose-500 to-red-400`

#### Statuts métier des Fournisseurs (`FournisseurTable.tsx` lignes 465-478)
- **Actif** : Badge vert avec pastille pulsée (`bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80`)
- **Inactif** : Badge gris ardoise (`bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200`)

#### Statuts métier des Bons de Commande (`CommandesDrawer.tsx` lignes 185-217)
- `VALIDEE` : `bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/90` (Icône `CheckCircle2` emerald-600)
- `RECEPTIONNEE` : `bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/90` (Icône `Truck` blue-600)
- `FACTUREE` : `bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200/90` (Icône `Receipt` purple-600)
- `EN_ATTENTE` : `bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/90` (Icône `Clock` amber-600)
- `ANNULEE` : `bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200/90` (Icône `Ban` rose-600)

#### Statuts métier des Factures & Réceptions
- `A_VALIDER`, `RAPPROCHEE`, `EN_LITIGE`, `PAYEE`, `REJETEE` (`src/modules/factures/types/index.ts:21`) : **NOT DEFINED** dans l'UI (module Factures :8084 en phase préparatoire, page maquettée avec fiches d'architecture).
- `CONFORME`, `NON_CONFORME`, `PARTIELLE` (`src/modules/receptions/types/index.ts:15`) : **NOT DEFINED** dans l'UI (module Réceptions :8083 en phase préparatoire).

### 3.5 Accents des cartes KPI & Éléments cartographiques
- **KPI StatsBar** (`StatsBar.tsx`) :
  - Total : Fond neutre slate, bordure de focus actif `border-teal-500 ring-2 ring-teal-500/20`
  - Actifs : Accent émeraude `text-emerald-600`, pastille `bg-emerald-50`, bordure active `border-emerald-500 ring-2 ring-emerald-500/20`
  - Inactifs : Accent ardoise `text-slate-600`, pastille `bg-slate-100`, bordure active `border-slate-400 ring-2 ring-slate-400/25`
  - Éligibilité : Accent teal `text-teal-700`, barre de progression `bg-gradient-to-r from-teal-600 to-emerald-500`, note d'évaluation `bg-amber-50 text-amber-500 border-amber-200/80`
- **Marqueurs cartographiques Leaflet** (`FournisseurMap.tsx` lignes 409-438) :
  - Adresse exacte (géocodage GPS) : `bg-teal-600`, anneau `border-white ring-2 ring-teal-500/40`, point témoin `bg-emerald-400`
  - Centroïde ville (approximation) : `bg-sky-600`, anneau tireté `border-dashed border-white ring-2 ring-sky-400/50`
  - Fournisseur inactif : `bg-slate-500`
  - Halo pulsé (si actif) : `bg-teal-400/40 animate-ping`
  - Clusters de marqueurs (`FournisseurMap.tsx` ligne 205) : Cercle dégradé `bg-gradient-to-br from-teal-500 to-emerald-600` avec anneau `ring-4 ring-teal-500/25 border-2 border-white dark:border-slate-900`

### 3.6 Mécanisme de bascule de thème Dark / Light
- **Fichier responsable** : `frontend/src/context/ThemeContext.tsx`
- **Mécanisme** : Ajout / Retrait de la classe CSS `dark` sur `document.documentElement` (`<html>`) et `document.body`.
- **Clé de stockage persistant** : `localStorage.getItem('procuraflow-theme')` (valeurs `'dark'` ou `'light'`).
- **Prévention du flash (FOUC)** : Script inline synchrone dans `frontend/index.html` (lignes 10-21) exécuté avant le rendu DOM.
- **Détection système** : `window.matchMedia('(prefers-color-scheme: dark)').matches` si aucune préférence n'est encore enregistrée.

---

## 4. Typography

### 4.1 Familles de polices
- **Police de corps et titres** : `'Inter', system-ui, -apple-system, sans-serif`
  - Chargement : Google Fonts CDN dans `frontend/index.html` ligne 25 :
    `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">`
  - Graisses chargées : Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)
  - Déclaration CSS (`index.css` lignes 31 et 70-71) :
    ```css
    --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
    font-family: var(--font-sans);
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    ```
- **Police Monospace** : Pile Tailwind par défaut (`font-mono` = `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`). Aucune police monospace personnalisée n'est importée.
- **Polices locales / `@font-face`** : **NOT DEFINED** (aucun fichier de police local `.woff` ou `.woff2` n'est embarqué).

### 4.2 Échelle typographique observée dans les composants

| Élément UI | Classe Tailwind | Taille calculée | Graisse | Interligne | Emplacement dans le code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Titre de page H1** | `text-2xl sm:text-3xl` | 24px / 30px | 800 (`font-extrabold`) | `leading-tight` | `PageHeader.tsx:24` |
| **Titre de modal H3** | `text-base` | 16px | 700 (`font-bold`) | `leading-normal` | `Modal.tsx:76`, `FournisseurModal.tsx:284` |
| **Titre de carte H3** | `text-base sm:text-lg` | 16px / 18px | 700 (`font-bold`) | `tracking-tight` | `Card.tsx:44` |
| **Valeur KPI Stats** | `text-3xl` | 30px | 800 (`font-extrabold`) | `tracking-tight` | `StatsBar.tsx:48,78,108,136` |
| **Sous-titre / Description**| `text-xs sm:text-sm` | 12px / 14px | 400 (`font-normal`) | `leading-relaxed` | `PageHeader.tsx:28`, `Card.tsx:60` |
| **En-tête de tableau TH** | `text-[11px]` | 11px | 700 (`font-bold`) | `uppercase tracking-wider` | `FournisseurTable.tsx:263` |
| **Cellule tableau (Nom)** | `text-sm` | 14px | 600 (`font-semibold`) | `leading-normal` | `FournisseurTable.tsx:362` |
| **Cellule tableau (Email)** | `text-xs` | 12px | 400 (`font-normal`) | `leading-normal` | `FournisseurTable.tsx:378` |
| **Label formulaire** | `text-xs` | 12px | 600 (`font-semibold`) | `leading-normal` | `FournisseurModal.tsx:320` |
| **Erreur / Aide** | `text-xs` | 12px | 400 (`font-normal`) | `leading-relaxed` | `FournisseurModal.tsx:307` |
| **Badges de statut** | `text-[10px]` / `text-[11px]`| 10px / 11px | 600 / 700 | `tracking-tight` | `Badge.tsx:36-38`, `index.css:117` |
| **Bouton standard (md)** | `text-xs sm:text-sm` | 12px / 14px | 600 (`font-semibold`) | `leading-none` | `Button.tsx:30,53` |
| **Identifiants / Ports / Codes**| `text-[10px]` / `text-[11px]`| 10px / 11px | 500 / 700 (`font-mono`) | `tabular-nums` | `Sidebar.tsx:197`, `FournisseurTable.tsx:367` |

---

## 5. Spacing, Layout and Shape

### 5.1 Échelle d'espacement & Grilles
- **Échelle CSS définie** (`index.css` lignes 22-28) :
  - `--space-xs`: `0.25rem` (4px)
  - `--space-sm`: `0.5rem` (8px)
  - `--space-md`: `0.75rem` (12px)
  - `--space-lg`: `1rem` (16px)
  - `--space-xl`: `1.5rem` (24px)
  - `--space-2xl`: `2rem` (32px)
- **Largeur maximale du conteneur de page** :
  `max-w-[1720px] mx-auto` (appliqué systématiquement dans `FournisseursPage.tsx:11`, `CommandesPage.tsx:11`, `ReceptionsPage.tsx:11`, `FacturesPage.tsx:11`).
- **Gouttières de page** : `px-4 sm:px-6 lg:px-8 xl:px-10` avec marge basse `pb-8 sm:pb-10`.
- **Système de grilles** :
  - Barre de KPI : `grid grid-cols-2 lg:grid-cols-4 gap-4` (`StatsBar.tsx:26`)
  - Fiches d'architecture : `grid grid-cols-1 md:grid-cols-3 gap-6` (`CommandesPage.tsx:31`)
  - Vue Cartes Fournisseurs : `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4` (`FournisseurCards.tsx:134`)

### 5.2 Dimensions et comportement du Topbar et du Sidebar
- **Topbar (`Topbar.tsx`)** :
  - Hauteur fixe : `h-16` (64px / 4rem)
  - Positionnement : `shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b`
  - Comportement : Fixé en haut de la colonne principale de l'écran (`z-10`).
- **Sidebar (`Sidebar.tsx`)** :
  - Largeur en mode étendu (Desktop) : `w-72` (288px / 18rem)
  - Largeur en mode compact / réduit (Desktop) : `w-20` (80px / 5rem)
  - Transition de largeur : `transition-all duration-300 ease-in-out` (`Sidebar.tsx:323`)
  - Point de rupture Desktop : `hidden lg:block` (visible à partir de `lg` = 1024px)
  - Tiroir Mobile (`Sidebar.tsx:331-344`) :
    - Overlay plein écran avec flou : `fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs`
    - Tiroir coulissant : `fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50`

### 5.3 Points de rupture responsives (Breakpoints)
Utilise les breakpoints officiels Tailwind CSS :
- `sm` : 640px
- `md` : 768px
- `lg` : 1024px (bascule clé : menu mobile vs barre latérale desktop)
- `xl` : 1280px
- `2xl` : 1536px (utilisé dans `FilterBar.tsx:389` pour le redimensionnement de l'input de recherche)

### 5.4 Rayons de courbure (Border Radius)
- **Déclarations CSS (`index.css` lignes 34-38)** :
  - `--radius-sm`: `0.375rem` (6px)
  - `--radius-md`: `0.5rem` (8px)
  - `--radius-lg`: `0.75rem` (12px)
  - `--radius-xl`: `1rem` (16px)
  - `--radius-2xl`: `1.25rem` (20px)
- **Utilisation par composant dans le code** :
  - Cartes principales, fenêtres modales, tiroirs, palette de commandes : `rounded-2xl` (20px)
  - Cartes KPI StatsBar, cartes grille fournisseurs, conteneur d'avatar : `rounded-xl` (16px)
  - Boutons standards (md/sm), champs de saisie input, segmented control : `rounded-lg` (8px)
  - Boutons très petits (xs), touches de raccourci clavier `<kbd>` : `rounded-md` (6px)
  - Badges de statut, pastilles d'état : `rounded-full` (9999px)

### 5.5 Système d'ombres (Shadows)
- **Déclarations Tailwind (`tailwind.config.js` lignes 27-30)** :
  - `shadow-2xs`: `0 1px 2px 0 rgba(0, 0, 0, 0.03)`
  - `shadow-xs`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **Déclarations CSS (`index.css` lignes 41-45)** :
  - `--shadow-xs`: `0 1px 2px rgba(0, 0, 0, 0.04)`
  - `--shadow-sm`: `0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)`
  - `--shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
  - `--shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)`
  - `--shadow-card-hover`: `0 8px 25px -5px rgba(13, 148, 136, 0.1), 0 4px 10px -3px rgba(0, 0, 0, 0.04)`
- **Ombres spéciales** :
  - Halo lumineux de survol sur le bouton de commandes : `hover:shadow-[0_0_12px_rgba(20,184,166,0.55)] dark:hover:shadow-[0_0_16px_rgba(45,212,191,0.45)]` (`FournisseurTable.tsx:497`)
  - Fenêtres modales et tiroirs latéraux : `shadow-2xl` (`Modal.tsx:68`, `CommandesDrawer.tsx:252`)

### 5.6 Niveaux d'élévation Z-Index
- `z-10` : Entête Topbar (`Topbar.tsx:74`), en-tête fixe `<thead>` du tableau (`FournisseurTable.tsx:263`), conteneur Leaflet (`index.css:304`)
- `z-20` : Barre latérale desktop (`Sidebar.tsx:323`), ligne de progression de chargement du tableau (`FournisseurTable.tsx:239`)
- `z-40` : Arrière-plan sombre du tiroir mobile (`Sidebar.tsx:332`)
- `z-50` : Boîtes modales (`Modal.tsx:53`, `ConfirmModal.tsx:52`, `FournisseurModal.tsx:263`, `ImportModal.tsx:263`), tiroir des commandes (`CommandesDrawer.tsx:243`), palette de commandes (`GlobalCommandPalette.tsx:224`), notifications toast (`Toast.tsx:129`), infobulles de la sidebar réduite (`Sidebar.tsx:210`), menus déroulants flottants (`PaginationBar.tsx:129`, `FilterBar.tsx:512`).

---

## 6. UI Components Catalogue

### 6.1 Boutons (`frontend/src/components/ui/Button.tsx`)
- **Variantes** :
  - `primary` : `bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs border border-teal-600 hover:border-teal-700`
  - `secondary` : `bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs`
  - `outline` : `bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700`
  - `danger` : `bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-600 hover:border-rose-700`
  - `ghost` : `bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent`
  - `teal-subtle` : `bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/80`
- **Tailles** :
  - `xs` : `h-7 px-2 text-[11px] rounded-md gap-1`
  - `sm` : `h-8 px-2.5 text-xs rounded-lg gap-1.5`
  - `md` : `h-9 px-3.5 text-xs sm:text-sm rounded-lg gap-2`
  - `lg` : `h-10 px-4 text-sm rounded-xl gap-2.5`
- **États** :
  - Hover / Active : `active:scale-[0.98] transition-all duration-150`
  - Focus : `focus:outline-none focus:ring-2 focus:ring-teal-500/30`
  - Disabled : `disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100`
  - Loading : icône `<RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />`

### 6.2 Champs de formulaire et filtres
- **Input texte standard** (`FournisseurModal.tsx:340`) :
  - Classes : `w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150`
- **Boîte de recherche avec icône** (`FilterBar.tsx:403`) :
  - Classes : `w-full h-9 pl-9 pr-9 text-xs font-medium bg-slate-50/90 dark:bg-slate-950/60 hover:bg-slate-100/80 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 border border-slate-200/90 dark:border-slate-700/80 focus:border-teal-500 dark:focus:border-teal-400 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all duration-150`
- **Contrôle segmenté (Segmented Control)** (`FilterBar.tsx:425-452`) :
  - Conteneur : `inline-flex h-9 items-center rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-950/70 p-0.5`
  - Onglet actif : `bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-2xs ring-1 ring-slate-200/80 dark:ring-slate-700/80`
  - Onglet inactif : `text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200`
- **Puces de filtres actifs (Filter Chips)** (`FilterBar.tsx:327-376`) :
  - Structure : Conteneur arrondi avec pastille couleur, texte de catégorie, valeur et bouton de suppression `X`.
  - Exemple Recherche : `bg-sky-50/80 dark:bg-sky-950/40 border-sky-200/90 dark:border-sky-800/60 text-sky-900 dark:text-sky-200`
  - Exemple Ville : `bg-teal-50/80 dark:bg-teal-950/40 border-teal-200/90 dark:border-teal-800/60 text-teal-900 dark:text-teal-200`
  - Exemple Tri : `bg-violet-50/80 dark:bg-violet-950/40 border-violet-200/90 dark:border-violet-800/60 text-violet-900 dark:text-violet-200`
- **Checkbox de sélection tableau** (`FournisseurTable.tsx:275-280`) :
  - `CheckSquare` / `MinusSquare` en `text-teal-600 dark:text-teal-400`, case vide `Square` en `text-slate-400`.
- **Toggle Thème animé** (`Topbar.tsx:121-160`) :
  - Pill : `h-8 w-16 rounded-full p-1 bg-slate-200/80 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700/80 shadow-2xs`
  - Curseur coulissant : cercle blanc/sombre `w-6 h-6 rounded-full shadow-md transition-transform duration-300` (`translate-x-0` vers `translate-x-8`).

### 6.3 Tableaux (`frontend/src/modules/fournisseurs/components/FournisseurTable.tsx`)
- **Conteneur** : `bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden`
- **En-tête fixe (`sticky`)** : `sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-850/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider shadow-2xs`
- **Lignes (`<tr>`)** : `transition-colors duration-150 group cursor-pointer hover:bg-teal-50/30 dark:hover:bg-slate-800/50`
- **Ligne sélectionnée** : `bg-teal-50/70 dark:bg-teal-950/40 border-l-4 border-l-teal-600`
- **Bordures de séparation** : `divide-y divide-slate-100/80 dark:divide-slate-800/80`
- **Barre de pagination (`PaginationBar.tsx`)** :
  - Conteneur : `bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs px-4 sm:px-5 py-3.5`
  - Boutons de page numérotés : `min-w-[2.25rem] h-9 px-2 text-xs font-semibold rounded-xl tabular-nums`
  - Page active : `bg-teal-600 text-white shadow-xs border border-teal-600 dark:bg-teal-500 dark:border-teal-500`
  - Menu déroulant "Lignes par page" : bouton personnalisé avec popover vers le haut (`bottom-full mb-1.5 w-36 bg-white dark:bg-slate-900 rounded-xl shadow-xl z-50`).

### 6.4 Cartes (`Card.tsx`, `StatsBar.tsx`, `FournisseurCards.tsx`)
- **Carte générique (`Card.tsx`)** : `bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs`
- **Carte KPI (`StatsBar.tsx`)** : `rounded-xl border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]`
- **Carte Fournisseur Grille (`FournisseurCards.tsx`)** : `rounded-xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-teal-300/60`

### 6.5 Modales et Tiroirs latéraux (Drawers)
- **Modale générique (`Modal.tsx`)** :
  - Arrière-plan : `fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs animate-fade-in`
  - Fenêtre : `relative w-full max-w-md (ou lg/2xl/4xl) bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 animate-scale-in`
  - Entête : `px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between`
  - Pied : `px-6 py-3.5 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5`
- **Tiroir d'historique des commandes (`CommandesDrawer.tsx:252`)** :
  - Emplacement : `fixed inset-0 z-50 overflow-hidden flex justify-end`
  - Panneau : `relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col h-full animate-slide-in-right`
  - Largeur : `w-full max-w-2xl` (672px / 42rem)
  - Onglets internes : 3 onglets avec soulignement `border-b-2 border-teal-600 text-teal-700 dark:text-teal-400`
- **Modale d'import massif (`ImportModal.tsx:263-380`)** :
  - Zone de dépôt Drag & Drop : `border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer border-slate-300 dark:border-slate-700 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-900/50`
  - État glissement actif : `border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 scale-[1.01]`

### 6.6 Toasts & Notifications flottantes (`Toast.tsx`)
- **Positionnement** : `fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none`
- **Structure** : `rounded-2xl shadow-2xl border text-sm bg-slate-900/95 dark:bg-slate-850/95 backdrop-blur-md text-white animate-slide-in-right`
- **Barre de progression** : Hauteur `h-1` avec dégressivité sur 4200 ms, pause automatique au survol de la souris (`onMouseEnter`).

### 6.7 Palette de commandes rapide (Ctrl + K) (`GlobalCommandPalette.tsx`)
- **Conteneur** : `relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden`
- **Champ de recherche** : `h-14 pl-3.5 pr-20 bg-transparent text-sm focus:outline-none` avec icône `Search` et badge `ESC`
- **Résultats** : Liste avec navigation au clavier (`ArrowUp`, `ArrowDown`, `Enter`), séparateurs par catégorie (`Navigation`, `Actions Globales`, `Fournisseurs`), surbrillance active `bg-teal-50 dark:bg-teal-950/60 border-teal-200/70 text-teal-900`.
- **Pied de palette** : Raccourcis clavier d'aide (`↑`, `↓`, `↵`, `ESC`) et décompte de résultats.

### 6.8 États de chargement, d'erreur et vides
- **Squelettes animés** (`index.css:209-218`) :
  - Animation `shimmer 1.5s infinite` avec dégradé `linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)` (en dark : `#1e293b` / `#334155`).
- **Indicateur de chargement (`LoadingState.tsx`)** :
  - Icône `<RefreshCw className="animate-spin text-teal-600 dark:text-teal-400" />`
- **État vide (`EmptyState.tsx`)** :
  - Conteneur `rounded-2xl border border-slate-200/90 p-8 sm:p-14 text-center`, icône `<Inbox className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />` dans un carré `w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800`.
- **État d'erreur (`ErrorState.tsx`)** :
  - Bordure d'alerte `border-rose-200/80 dark:border-rose-900/60`, icône `<AlertCircle className="w-6 h-6 text-rose-600" />` avec bouton d'action `Réessayer`.

### 6.9 Cartographie interactive OpenStreetMap / Leaflet (`FournisseurMap.tsx`)
- **Fournisseurs de tuiles cartographiques** (`FournisseurMap.tsx:44-63`) :
  - `osm` : OpenStreetMap standard (`https://tile.openstreetmap.org/{z}/{x}/{y}.png`)
  - `carto-voyager` : CARTO Voyager épuré (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/...`)
  - `carto-dark` : CARTO Dark Matter (`https://{s}.basemaps.cartocdn.com/dark_all/...`)
- **Infobulles Popup Leaflet (`index.css:310-335`)** :
  - Conteneur `border-radius: 1rem; overflow: hidden; box-shadow: 0 12px 30px -6px rgba(15, 23, 42, 0.22); border: 1px solid #e2e8f0; width: 295px;`
  - Dark mode : fond `#0F172A`, texte `#F8FAFC`, bordure `#1E293B`.

---

## 7. Icons and Illustrations

### 7.1 Bibliothèque et configuration
- **Nom du package** : `lucide-react`
- **Version installée** : `^0.468.0` (`frontend/package.json` ligne 17)
- **Taille par défaut** : `w-4 h-4` (16×16 px) ou `w-3.5 h-3.5` (14×14 px)
- **Épaisseur de trait (Stroke)** : `2px` (valeur native Lucide), avec exceptions explicites comme `stroke-width="2.5"` pour les marqueurs cartographiques SVG (`FournisseurMap.tsx:428`).

### 7.2 Les 25 icônes les plus utilisées dans le code et leur sémantique

| Rang | Nom de l'icône | Occurrences | Signification & Rôle dans ProcuraFlow |
| :---: | :--- | :---: | :--- |
| **1** | `X` | 12 | Fermeture de modales, réinitialisation de recherche, suppression de puce filtre |
| **2** | `RefreshCw` | 10 | Réactualisation de tableau, spinners de chargement, réessai d'appel API |
| **3** | `Building2` | 8 | Symbole du module Fournisseurs, identité des entreprises, siège social |
| **4** | `ShoppingBag` | 8 | Symbole du module Commandes d'achat, bons de commande fournisseur |
| **5** | `CheckCircle2` | 8 | Validation de formulaire, statut d'éligibilité "Actif", commandes "VALIDEE" |
| **6** | `Star` | 8 | Notation d'évaluation fournisseur (1 à 5 étoiles), score qualité |
| **7** | `MapPin` | 8 | Géolocalisation, adresse physique, filtre par ville marocaine |
| **8** | `AlertCircle` | 7 | Messages d'erreurs d'API, alertes bloquantes, état d'échec |
| **9** | `Check` | 7 | Confirmation de copie presse-papiers, option cochée dans sélecteur |
| **10** | `AlertTriangle`| 6 | Avertissement d'impact métier (désactivation), notifications warning |
| **11** | `ArrowRight` | 6 | Navigation entre écrans, redirection vers module, validation |
| **12** | `Truck` | 5 | Symbole du module Réceptions, statut de commande "RECEPTIONNEE" |
| **13** | `Receipt` | 5 | Symbole du module Factures, statut de commande "FACTUREE" |
| **14** | `Database` | 5 | Référence à la base PostgreSQL Neon 17, schémas de données |
| **15** | `Search` | 5 | Barre de recherche, loupe de la palette de commandes Ctrl+K |
| **16** | `Download` | 5 | Export des données (CSV / Excel / PDF), téléchargement de modèle |
| **17** | `FileText` | 5 | Fiche récapitulative, dossiers administratifs, rapports |
| **18** | `RotateCcw` | 4 | Action de réactivation d'un fournisseur désactivé |
| **19** | `Upload` / `UploadCloud` | 4 | Importation massive de fichiers (glisser-déposer CSV/Excel) |
| **20** | `Plus` | 4 | Bouton d'ajout d'un nouveau fournisseur |
| **21** | `Phone` | 4 | Coordonnées téléphoniques du prestataire |
| **22** | `ChevronDown` | 4 | Flèche des sélecteurs déroulants (villes, pagination, filtres) |
| **23** | `Mail` | 4 | Adresse e-mail professionnelle de contact |
| **24** | `Sparkles` | 4 | Mode Démo (données de simulation), indicateur d'action assistée |
| **25** | `Server` | 4 | Architecture microservices, indicateur d'écoute des ports (:8081 à :8084) |

---

## 8. Interaction, Motion and Accessibility

### 8.1 Durées et courbes d'animation (`frontend/src/index.css`)
- **Variables CSS de transitions (`index.css` lignes 48-51)** :
  - `--transition-fast`: `150ms cubic-bezier(0.4, 0, 0.2, 1)`
  - `--transition-base`: `200ms cubic-bezier(0.4, 0, 0.2, 1)`
  - `--transition-slow`: `300ms cubic-bezier(0.4, 0, 0.2, 1)`
  - `--transition-spring`: `400ms cubic-bezier(0.34, 1.56, 0.64, 1)` (déclaré aussi dans `tailwind.config.js:25`)
- **Keyframes personnalisées** :
  - `fadeInUp` (`index.css:166-175`) : Fondu et translation verticale de 8px vers 0px
  - `slideInRight` (`index.css:177-186`) : Arrivée latérale droite pour tiroirs et toasts
  - `scaleIn` (`index.css:188-197`) : Agrandissement élastique de 95% à 100% pour modales et popovers
  - `pulseGlow` (`index.css:199-202`) : Halo circulaire évanescent
  - `supplierEntrance` (`index.css:266-280`) : Vague d'entrée séquentielle échelonnée (`animationDelay` de 0 à 180 ms)

### 8.2 Prise en compte du mouvement réduit (Accessibility Reduced Motion)
- **Règle globale dans `index.css` (lignes 282-297)** :
  ```css
  @media (prefers-reduced-motion: reduce) {
    .supplier-entrance {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
  ```
- **Détection programmatique TypeScript** (`pagination.ts` lignes 66-70) :
  Désactivation des délais d'attente d'animation si `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

### 8.3 Raccourcis clavier (Keyboard Shortcuts)
- **`Ctrl + K` (ou `Cmd + K`)** : Ouverture/fermeture de la palette de commandes globale (`AppContext.tsx:48`, `GlobalCommandPalette.tsx:45`).
- **`Ctrl + B` (ou `Cmd + B`)** : Agrandissement / réduction de la barre latérale desktop (`AppContext.tsx:79`, `Sidebar.tsx:311`).
- **`/` (Slash)** : Raccourci d'accès direct au champ de recherche (`FilterBar.tsx:416`).
- **`Escape` (Échap)** : Fermeture instantanée de toute boîte modale, du tiroir des commandes, des popovers ou annulation de sélection multiple (`Modal.tsx:41`, `ConfirmModal.tsx:37`, `FournisseurTable.tsx:75`).
- **`Flèche Haut` / `Flèche Bas` & `Entrée`** : Navigation et sélection au clavier dans la palette de commandes (`GlobalCommandPalette.tsx:195-207`) et dans le contrôle segmenté (`FilterBar.tsx:294-300`).

### 8.4 Anneau de focus & Accessibilité (Focus Ring & ARIA)
- **Style standardisé du Focus Ring** (`FilterBar.tsx:131-132`, `Button.tsx:53`) :
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 dark:focus-visible:ring-teal-400/40`
- **Attributs ARIA implémentés** :
  - `role="dialog"` et `aria-modal="true"` sur les modales avec `aria-labelledby` et `aria-describedby`
  - `role="tablist"` et `role="tab"` avec `aria-selected` sur les contrôles segmentés et onglets de tiroir
  - `role="listbox"` et `role="option"` sur les menus déroulants personnalisés
  - `aria-live="polite"` et `aria-atomic="true"` sur la pile de notifications toast (`Toast.tsx:127`)

### 8.5 Formats de devises, nombres et dates
- **Langue HTML de base** : `<html lang="fr" class="notranslate" translate="no">` (`index.html:2`)
- **Format monétaire marocain (MAD)** :
  - Implémentation Fournisseurs (`orderStats.ts:167-169`) :
    `amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD'` (Exemple : `15 400,00 MAD`)
  - Implémentation Commandes (`commandes/utils/index.ts:10-15`) :
    `new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount)`
- **Format de date** : Format français conventionnel `DD/MM/YYYY` ou textuel étendu (`15 octobre 2026`).
- **Alignement numérique** : Classe `tabular-nums` systématique sur tous les compteurs, notes et montants pour empêcher les sauts de mise en page.

---

## 9. Content and Tone

### 9.1 Langue et conventions rédactionnelles
- **Langue de l'interface** : Français professionnel à 100%.
- **Terminologie** : Vocabulaire rigoureux d'ERP Achats ("Rapprochement à 3 voies", "Référentiel & Éligibilité", "Lignes d'achat", "Taux d'éligibilité", "Bons de livraison").
- **Conventions des boutons** : Verbe à l'infinitif pour les actions d'engagement ("Ajouter", "Modifier", "Réessayer", "Télécharger", "Exporter en CSV", "Enregistrer le fournisseur").
- **Conventions d'état vide** : Message direct sur le fait constaté suivi d'une explication constructive sur le déblocage ("Aucun fournisseur trouvé — Aucun fournisseur ne correspond aux critères de filtre ou de recherche sélectionnés").

### 9.2 Échantillon de 10 textes réels extraits du code

1. **Tagline d'accueil** (`Sidebar.tsx:109`) :  
   *« Plateforme Achats Intégrée »*
2. **Sous-titre du module Fournisseurs** (`Topbar.tsx:30`) :  
   *« Référentiel & Éligibilité »*
3. **Statut de service actif** (`Topbar.tsx:188`) :  
   *« API Fournisseurs connectée »*
4. **Placeholder de recherche** (`FilterBar.tsx:401`) :  
   *« Rechercher nom, email, ville... »*
5. **Indicateur de pagination** (`PaginationBar.tsx:72-80`) :  
   *« Affichage 1–10 sur 111 fournisseurs »*
6. **Avertissement de désactivation** (`ConfirmModal.tsx:116-118`) :  
   *« Le fournisseur désactivé ne pourra plus être sélectionné pour l'émission de nouveaux bons de commande. »*
7. **Message de confirmation de copie** (`FournisseurTable.tsx:88`) :  
   *« Copié dans le presse-papiers : contact@atlas-fournitures.example »*
8. **Notice d'isolation d'architecture** (`CommandesPage.tsx:63`) :  
   *« Isolation : Schéma propriétaire strict • Règle : Aucun accès inter-schéma direct »*
9. **Placeholder d'import massif** (`ImportModal.tsx:362-365`) :  
   *« Déposez votre fichier ici ou parcourez vos dossiers — Prend en charge les fichiers CSV (séparateur virgule, point-virgule ou tabulation) et Excel (.xlsx, .xls). »*
10. **Avertissement financier strict** (`orderStats.ts:30`) :  
    *« AVERTISSEMENT : Ne constitue PAS le montant décaissé/payé (géré exclusivement par le microservice Factures). »*

---

## 10. Consistency Check (Audit des Incohérences)

L'audit approfondi du code révèle les divergences suivantes à normaliser dans la charte graphique définitive :

1. **Formatage de la devise MAD (`fr-FR` vs `fr-MA`)** :
   - Dans `frontend/src/modules/fournisseurs/utils/orderStats.ts` (ligne 168) : utilise `amount.toLocaleString('fr-FR', ...) + ' MAD'` (produit `15 400,00 MAD`).
   - Dans `frontend/src/modules/commandes/utils/index.ts` (lignes 11-14) : utilise `new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' })` (produit `15 400,00 MAD` ou `MAD 15 400,00` selon le runtime).
   - *Recommandation* : Adopter `fr-MA` ou la fonction unique `formatMAD()` partout.

2. **Ombres et bordures sur les boutons primaires (`index.css` vs `Button.tsx`)** :
   - Dans `src/index.css` (ligne 94, classe `.btn-primary`) : `@apply btn bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-md;`
   - Dans `src/components/ui/Button.tsx` (ligne 14, variante `primary`) : `bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs border border-teal-600 hover:border-teal-700`
   - *Recommandation* : Aligner le composant `Button.tsx` et la classe `.btn-primary`.

3. **Boutons d'action dans les boîtes modales critiques (`ConfirmModal.tsx`)** :
   - `ConfirmModal.tsx` n'utilise pas le composant réutilisable `<Button variant="danger">`, mais réimplémente une balise `<button>` avec `bg-rose-600 hover:bg-rose-700 shadow-rose-600/20` et `bg-emerald-600` pour la réactivation.
   - *Recommandation* : Refactoriser `ConfirmModal` pour consommer le composant unifié `Button`.

4. **Rayons de courbure des cartes (`rounded-2xl` vs `rounded-xl`)** :
   - Cartes du composant `Card.tsx`, du conteneur de tableau `FournisseurTable.tsx`, de `FilterBar.tsx` et des modales : `rounded-2xl` (20px).
   - Cartes individuelles des fournisseurs (`FournisseurCards.tsx:146`) et cartes KPI (`StatsBar.tsx:21`) : `rounded-xl` (16px).
   - *Recommandation* : Définir la règle : `rounded-2xl` pour les grands conteneurs de section, `rounded-xl` pour les cartes intérieures d'une grille.

5. **Double implémentation de la Palette de commandes** :
   - `src/components/layout/GlobalCommandPalette.tsx` (connectée au routeur global et gérant les 4 modules).
   - `src/modules/fournisseurs/components/CommandPalette.tsx` (ancienne version locale autonome).
   - *Recommandation* : Marquer la palette locale comme dépréciée au profit exclusif de `GlobalCommandPalette`.

6. **Avatars Fournisseur : Dégradé vs Teinte unie** :
   - Tableau et Cartes : Fond dégradé subtil `bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/60 text-teal-700`.
   - Palette de commandes (`FournisseursPage.tsx:777`) : Fond plat `bg-teal-100 dark:bg-teal-900/60 text-teal-800`.
   - Tiroir des commandes (`CommandesDrawer.tsx:256`) : Dégradé vif inversé `bg-gradient-to-tr from-teal-600 to-emerald-500 text-white`.

---

## 11. Screenshots Checklist

Pour constituer l'annexe visuelle de votre document de charte graphique, capturez les 14 écrans et états suivants (en **Mode Clair** et en **Mode Sombre**) :

| N° | Écran / Composant | Route URL | Comment le déclencher dans le navigateur |
| :---: | :--- | :--- | :--- |
| **01** | **Tableau Fournisseurs (Vue Liste)** | `http://localhost:5173/fournisseurs` | Vue par défaut. Afficher les badges "Actif"/"Inactif", les étoiles et la sélection multiple. |
| **02** | **Grille Fournisseurs (Vue Cartes)** | `http://localhost:5173/fournisseurs` | Cliquer sur l'icône « Vue Cartes » dans la barre d'outils. |
| **03** | **Carte Géographique OpenStreetMap** | `http://localhost:5173/fournisseurs` | Cliquer sur l'icône « Carte Géographique » dans la barre d'outils (observer les marqueurs teal et sky). |
| **04** | **Sidebar Étendue vs Réduite** | `http://localhost:5173/fournisseurs` | Appuyer sur `Ctrl + B` ou cliquer sur le bouton de réduction en bas de la barre latérale. |
| **05** | **Palette de Commandes (Ctrl + K)** | N'importe quelle route | Appuyer sur `Ctrl + K` pour afficher la fenêtre modale de recherche globale avec raccourcis. |
| **06** | **Tiroir Fiche Fournisseur 360° (Drawer)** | `http://localhost:5173/fournisseurs` | Cliquer sur une ligne fournisseur ou sur l'icône sac d'achat d'une ligne pour ouvrir le panneau latéral droit. |
| **07** | **Modale de Création / Modification** | `http://localhost:5173/fournisseurs` | Cliquer sur le bouton primaire vert « + Nouveau Fournisseur » en haut à droite. |
| **08** | **Modale d'Import Massif Drag & Drop** | `http://localhost:5173/fournisseurs` | Cliquer sur le bouton « Importer » dans les actions de la barre d'outils. |
| **09** | **Modale de Confirmation (Danger)** | `http://localhost:5173/fournisseurs` | Cliquer sur l'icône d'interrupteur d'un fournisseur actif pour déclencher le dialogue de désactivation. |
| **10** | **Notifications Toast empilées** | `http://localhost:5173/fournisseurs` | Cliquer sur le bouton de copie d'e-mail ou lancer un export CSV pour voir apparaître le toast en bas à droite. |
| **11** | **Vue État Vide (Empty State)** | `http://localhost:5173/fournisseurs` | Taper une chaîne inexistante dans la barre de recherche (ex: `zzzzzzz`). |
| **12** | **Fiche Module Commandes (:8082)** | `http://localhost:5173/commandes` | Cliquer sur « Commandes » dans la barre latérale (affiche le badge warning et les cartes d'architecture). |
| **13** | **Fiche Module Réceptions (:8083)** | `http://localhost:5173/receptions` | Cliquer sur « Réceptions » dans la barre latérale. |
| **14** | **Fiche Module Factures (:8084)** | `http://localhost:5173/factures` | Cliquer sur « Factures » dans la barre latérale. |

---

## 12. Files to Send / Attached Archive

Une archive ZIP complète regroupant les **21 fichiers sources déterminants** du design system a été générée :
- **Emplacement de l'archive** : [`docs/charte-graphique-assets.zip`](file:///c:/Users/Utilisateur/procura-flow/docs/charte-graphique-assets.zip) (taille : ~29 Ko).

### Liste des fichiers inclus dans l'archive :
1. `frontend/tailwind.config.js` — Configuration Tailwind (couleurs de marque `brand`, ombres, transitions)
2. `frontend/src/index.css` — Variables CSS `:root` / `.dark`, classes d'élévation, animations et correctifs Leaflet
3. `frontend/package.json` — Dépendances exactes et versions de la stack frontend
4. `frontend/public/favicon.svg` — Fichier vectoriel du logo et de la marque ProcuraFlow
5. `frontend/index.html` — Configuration de la police Inter Google Fonts, méta viewport et script anti-FOUC
6. `frontend/src/components/layout/AppLayout.tsx` — Structure principale d'imbrication du layout
7. `frontend/src/components/layout/Sidebar.tsx` — Barre latérale desktop rétractable et tiroir mobile
8. `frontend/src/components/layout/Topbar.tsx` — En-tête supérieur avec bascule de thème et indicateur de santé
9. `frontend/src/components/layout/GlobalCommandPalette.tsx` — Moteur de recherche globale (Ctrl + K)
10. `frontend/src/components/ui/Badge.tsx` — Composant d'étiquettes de statut
11. `frontend/src/components/ui/Button.tsx` — Composant générique de boutons avec variantes et états
12. `frontend/src/components/ui/Card.tsx` — Composant conteneur de cartes et sections
13. `frontend/src/components/ui/Modal.tsx` — Fenêtre modale générique accessible
14. `frontend/src/components/ui/PageHeader.tsx` — En-tête standardisé de page
15. `frontend/src/components/ui/EmptyState.tsx` — Composant d'état vide
16. `frontend/src/components/ui/ErrorState.tsx` — Composant d'état d'erreur avec bouton de réessai
17. `frontend/src/components/ui/LoadingState.tsx` — Indicateur de chargement
18. `frontend/src/components/ConfirmModal.tsx` — Modale de confirmation des actions critiques
19. `frontend/src/components/Toast.tsx` — Système de notifications flottantes temporisées
20. `frontend/src/context/ThemeContext.tsx` — Contexte de gestion de thème clair/sombre et persistance
21. `frontend/src/context/AppContext.tsx` — Contexte d'état applicatif (mode démo, réduction sidebar, palette)

---

## Final Check: Éléments marqués "NOT DEFINED"

Conformément à la règle stricte de non-extrapolation, voici la liste exhaustive des éléments recherchés qui **ne sont pas définis** dans le code source actuel :
1. **Bibliothèque de graphiques / charts** : Aucune bibliothèque de graphiques (`chart.js`, `recharts`, `d3`, etc.) n'est installée dans `package.json`. Les jauges de statistiques sont codées en pur CSS.
2. **Fichiers de logos matriciels (.PNG, .JPG, .WEBP)** : Aucun logo bitmap n'existe dans le projet ; seul le fichier vectoriel SVG `favicon.svg` est présent.
3. **Charte d'usage formelle du logo** : Aucune règle écrite d'espacement minimal ou d'interdiction de déformation n'est spécifiée dans le code ou la documentation.
4. **Couleurs UI des statuts Factures** : Les statuts TypeScript `A_VALIDER`, `RAPPROCHEE`, `EN_LITIGE`, `PAYEE`, `REJETEE` existent dans `factures/types/index.ts`, mais aucune classe CSS ou couleur d'interface ne leur est encore associée car la page est en attente d'implémentation par Hamza.
5. **Couleurs UI des statuts Réceptions** : Les statuts TypeScript `CONFORME`, `NON_CONFORME`, `PARTIELLE` existent dans `receptions/types/index.ts`, mais aucune classe CSS ou couleur d'interface ne leur est encore associée car la page est en attente d'implémentation par Ali.
6. **Polices locales `@font-face`** : Aucune police n'est hébergée localement dans le projet ; la police Inter est chargée dynamiquement depuis le CDN de Google Fonts.
7. **Police Monospace personnalisée** : Aucune police monospace spécifique (comme JetBrains Mono ou Fira Code) n'est configurée dans `tailwind.config.js` ; le projet utilise la pile monospace native du système d'exploitation.

