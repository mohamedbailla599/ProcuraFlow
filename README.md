# 🏛️ ProcuraFlow — Plateforme Intégrée de Gestion des Achats Universitaires

<p align="center">
  <img src="https://img.shields.io/badge/Architecture-Microservices-0ea5e9?style=for-the-badge&logo=apache" alt="Architecture" />
  <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-14b8a6?style=for-the-badge&logo=react" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Spring_Boot_3_%2B_Node.js-10b981?style=for-the-badge&logo=springboot" alt="Backend" />
  <img src="https://img.shields.io/badge/Database-Neon_PostgreSQL_17-8b5cf6?style=for-the-badge&logo=postgresql" alt="Database" />
  <img src="https://img.shields.io/badge/Type_Safety-TypeScript_Strict-3178c6?style=for-the-badge&logo=typescript" alt="TypeScript" />
</p>

---

## 📌 À Propos du Projet

**ProcuraFlow** est une plateforme moderne de dématérialisation et de pilotage du cycle complet des achats pour établissements d'enseignement supérieur et de recherche. Conçue selon une **architecture microservices distribuée**, elle garantit la conformité réglementaire, la transparence des marchés publics et l'automatisation des flux transactionnels.

Elle unifie au sein d'une **interface utilisateur unique et moderne** les 4 grandes étapes du cycle de passation des commandes :

```mermaid
flowchart LR
    A["🏢 1. Fournisseurs<br/>(Mohamed • :8081)"] -->|"Sélection prestataires"| B["🛍️ 2. Commandes<br/>(Yassine • :8082)"]
    B -->|"Suivi livraisons"| C["🚚 3. Réceptions<br/>(Ali • :8083)"]
    C & B -->|"Rapprochement 3-voies"| D["🧾 4. Factures<br/>(Hamza • :8084)"]
    
    style A fill:#0d9488,stroke:#115e59,color:#fff,stroke-width:2px
    style B fill:#3b82f6,stroke:#1d4ed8,color:#fff,stroke-width:2px
    style C fill:#10b981,stroke:#047857,color:#fff,stroke-width:2px
    style D fill:#8b5cf6,stroke:#6d28d9,color:#fff,stroke-width:2px
```

---

## 🧩 Architecture des Microservices & Répartition des Équipes

Chaque développeur est pleinement responsable de son microservice backend et de son module frontend correspondant :

| Module | Responsable | Stack Backend | Port | Schéma BD Dédié | Statut Actuel |
|---|---|---|:---:|---|:---:|
| **Fournisseurs** | **Mohamed Bailla** | Java 21 / Spring Boot 3 / Hibernate / Flyway | `:8081` | `schema_fournisseurs` | 🟢 **Opérationnel** |
| **Commandes** | **Yassine** | Java 21 / Spring Boot 3 / JPA | `:8082` | `schema_commandes` | 🟡 *En préparation* |
| **Réceptions** | **Ali** | Java 21 / Spring Boot 3 / JPA | `:8083` | `schema_receptions` | 🟡 *En préparation* |
| **Factures** | **Hamza** | Node.js / Express / Prisma ou TypeORM | `:8084` | `schema_factures` | 🟡 *En préparation* |
| **Frontend Global** | **Mohamed Bailla** | React 18 / TypeScript / Tailwind / Vite | `:5173` | — | 🟢 **Opérationnel** |

---

## 📂 Structure du Répertoire

```text
ProcuraFlow/
├── frontend/                              # Frontend Unique Unifié de la plateforme
│   ├── src/
│   │   ├── app/                           # App.tsx, router.tsx (React Router 7)
│   │   ├── components/layout/             # AppLayout, Sidebar, Topbar, GlobalCommandPalette
│   │   ├── components/ui/                 # Design System (Button, Badge, Card, Modal, etc.)
│   │   ├── context/                       # AppContext, ThemeContext
│   │   └── modules/                       # Modules métier découpés par microservice
│   │       ├── fournisseurs/              # [Mohamed] Référentiel, cartographie & exports
│   │       ├── commandes/                 # [Yassine] Bons d'achat & lignes de commande
│   │       ├── receptions/                # [Ali] Suivi livraisons & contrôle conformité
│   │       └── factures/                  # [Hamza] Factures & rapprochement 3-voies
│   ├── README.md                          # Guide complet de développement frontend
│   └── vite.config.ts                     # Proxies vers :8081, :8082, :8083, :8084
│
├── service-fournisseurs-mohamed/          # Microservice Fournisseurs (Opérationnel)
│   ├── src/main/java/                     # Entités, Repositories, Services, Contrôleurs REST
│   ├── src/main/resources/                # application.yml, migrations Flyway
│   ├── pom.xml                            # Maven Spring Boot 3
│   └── README.md                          # Documentation technique du microservice
│
├── service-commandes-yassine/             # Microservice Commandes (En développement)
├── service-receptions-ali/                # Microservice Réceptions (En développement)
├── service-factures-hamza/                # Microservice Factures (En développement)
│
├── database/                              # Scripts d'initialisation PostgreSQL
├── docker-compose.yml                     # Déploiement multi-conteneurs Docker
└── README.md                              # Ce fichier (Guide principal ProcuraFlow)
```

---

## ⚡ Démarrage Rapide

### 1. Prérequis
- **Java JDK 21+**
- **Apache Maven 3.8+**
- **Node.js 18+** & **npm 9+**
- Une instance **PostgreSQL 17** (locale ou Neon Cloud)

### 2. Démarrer le Microservice Fournisseurs (`:8081`)

```bash
cd service-fournisseurs-mohamed

# Configurer les variables d'environnement dans .env (ou renseigner DATABASE_URL)
# Exemple : DATABASE_URL=postgresql://user:pass@ep-xyz.neon.tech/procura_flow?sslmode=require

mvn spring-boot:run
# -> Serveur prêt sur http://localhost:8081
# -> Santé : http://localhost:8081/actuator/health
# -> Swagger UI : http://localhost:8081/swagger-ui.html
```

### 3. Démarrer le Frontend Global (`:5173`)

Dans un second terminal :

```bash
cd frontend

# Installation des dépendances
npm install

# Lancement du serveur de développement Vite
npm run dev
# -> Application accessible sur http://localhost:5173
```

---

## 🎨 Fonctionnalités du Frontend (`frontend/`)

- 🧭 **Navigation Globale Intégrée** : Sidebar persistant avec indicateurs visuels d'état (`Opérationnel` vs `En préparation`).
- ⚡ **Palette de Commandes Universelle (Ctrl + K)** : Recherche globale, navigation instantanée (`Alt 1` à `Alt 4`), actions contextuelles et bascule de thème.
- 🌓 **Thème Sombre / Clair Persistant** : Bascule fluide mémorisée dans le stockage local.
- 🏢 **Répertoire Fournisseurs Interactif** :
  - Vue **Tableau** dense avec pagination dynamique et largeur protégée contre le rognage.
  - Vue **Cartes** avec notation par étoiles interactive.
  - Vue **Cartographie OpenStreetMap (Leaflet)** avec géocodage des villes marocaines.
  - Filtres combinables en direct (recherche textuelle, statut actif/inactif, filtre par ville, tri).
  - **Exports professionnels** : Tableur CSV (avec BOM Excel) et Rapport PDF paysage A4 graphique.
  - **Importation en masse** : Fichiers CSV et Excel (`.xlsx`) avec contrôle automatique des doublons.
  - **Mode Démo** : Bascule instantanée avec store mémoire pour démonstrations hors-ligne.

---

## 🔒 Principes d'Architecture & Règles d'Or

1. **Cloisonnement Strict des Schémas de Base de Données** :
   Chaque microservice est le **seul propriétaire** de son schéma PostgreSQL dans la base de données Neon :
   - `schema_fournisseurs` (tables `fournisseurs`, `audit_logs`)
   - `schema_commandes` (tables `commandes`, `lignes_commande`)
   - `schema_receptions` (tables `receptions`, `lignes_reception`)
   - `schema_factures` (tables `factures`, `rapprochements`)
   
   > ⛔ **Interdiction formelle** d'exécuter des requêtes SQL inter-schémas directes. Les échanges de données se font **exclusivement** via des appels HTTP REST.

2. **Routage Unifié par Proxy Vite** :
   Le frontend appelle des URLs relatives `/api/{module}`. Le proxy Vite dans `vite.config.ts` route automatiquement :
   - `/api/fournisseurs/*` ➡️ `http://localhost:8081`
   - `/api/commandes/*` ➡️ `http://localhost:8082`
   - `/api/receptions/*` ➡️ `http://localhost:8083`
   - `/api/factures/*` ➡️ `http://localhost:8084`
   - `/actuator/*` ➡️ `http://localhost:8081`

3. **Indépendance du Code Frontend** :
   Chaque développeur travaille dans son dossier dédié `src/modules/{module}/`. Il réutilise les composants partagés du Design System (`src/components/ui/`) pour garantir l'homogénéité visuelle.

---

## 🛠️ Guide pour les Coéquipiers

Consultez le guide détaillé rédigé pour votre intégration :
👉 [**frontend/README.md**](frontend/README.md)

Ce guide contient des exemples de code pour :
- Créer vos interfaces TypeScript dans `types/index.ts`
- Écrire votre client API dans `api/index.ts`
- Utiliser les composants partagés (`Button`, `Badge`, `Card`, `Modal`, `PageHeader`, `LoadingState`, `EmptyState`, `ErrorState`)
- Enregistrer vos propres raccourcis dans la palette `Ctrl + K` via le hook `useRegisterCommands`

---

## 👥 Équipe Projet

- **Mohamed Bailla** — *Lead Frontend & Service Fournisseurs* ([@mohamedbailla599](https://github.com/mohamedbailla599))
- **Yassine** — *Service Commandes*
- **Ali** — *Service Réceptions*
- **Hamza** — *Service Factures*

---

<p align="center">
  Projet académique — Architecture Microservices Distribuée &bull; 2026
</p>
