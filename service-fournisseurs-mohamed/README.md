<div align="center">

# ProcuraFlow — Service Fournisseurs

**Microservice de gestion du référentiel fournisseurs & portail web d'administration**

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=111827)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/Neon%20PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=111827)](http://localhost:8081/swagger-ui.html)

*Port par défaut : `8081` (Backend API) · `5173` (Frontend Vite) · Schéma DB : `schema_fournisseurs` · Responsable : **Mohamed Bailla***

</div>

---

## Sommaire

- [1. Vue d'ensemble et frontières du service](#1-vue-densemble-et-frontières-du-service)
- [2. Architecture & Stack technique](#2-architecture--stack-technique)
- [3. Structure du projet](#3-structure-du-projet)
- [4. Fonctionnalités Frontend](#4-fonctionnalités-frontend)
- [5. Contrat REST API](#5-contrat-rest-api)
- [6. Modèle de données & Configuration Neon PostgreSQL](#6-modèle-de-données--configuration-neon-postgresql)
- [7. Variables d'environnement](#7-variables-denvironnement)
- [8. Démarrage rapide (Local & Docker)](#8-démarrage-rapide-local--docker)
- [9. Tests automatisés](#9-tests-automatisés)
- [10. Dépannage](#10-dépannage)

---

## 1. Vue d'ensemble et frontières du service

Le microservice **Service Fournisseurs** (`service-fournisseurs-mohamed`) est l'unique propriétaire métier et technique du schéma `schema_fournisseurs` au sein de la plateforme distribuée **ProcuraFlow**. Il expose une API REST Spring Boot documentée par OpenAPI 3 ainsi qu'une interface web moderne React/TypeScript.

| Ce que fait ce service | Frontières strictes (architecture microservices) |
|---|---|
| Création, validation et normalisation d'e-mail des fournisseurs (`actif = true` par défaut) | N'accède jamais en SQL aux schémas des autres services (`schema_commandes`, `schema_receptions`, `schema_factures`) |
| Liste paginée et non paginée avec recherche multi-champs, filtre ville/statut et tri côté serveur | N'introduit aucune clé étrangère SQL inter-schémas |
| Statistiques globales du catalogue (`/api/fournisseurs/stats`) | Ne crée ni ne modifie directement les commandes, réceptions ou factures |
| Désactivation logique (`actif = false`) et réactivation sans suppression physique | Communication inter-services exclusivement via REST (`CommandesClient`) |
| Consultation de l'historique des commandes d'un fournisseur via le microservice Commandes | Dégradation maîtrisée (`503` / `502`) si le service aval est indisponible |

---

## 2. Architecture & Stack technique

```mermaid
flowchart LR
    UI["Frontend React 18 + Vite<br/>(Port 5173)"] -->|/api & /actuator proxy| API["Service Fournisseurs<br/>Spring Boot 3.3.5 (Port 8081)"]
    API -->|HikariCP + NeonJdbcUrlResolver| DB[("Neon PostgreSQL 17<br/>schema_fournisseurs.fournisseurs")]
    API -->|RestClient HTTP| CMD["Service Commandes<br/>(Port 8082)"]
```

| Couche | Technologies |
|---|---|
| **Backend** | Java 17+, Spring Boot 3.3.5 (`spring-boot-starter-web`, `data-jpa`, `validation`, `actuator`), Hibernate, PostgreSQL JDBC, Springdoc OpenAPI (`2.6.0`) |
| **Frontend** | React 18.3, TypeScript 5.7, Vite 6.0, Tailwind CSS 3.4, Lucide Icons |
| **Cartographie & Exports** | Leaflet + MarkerCluster (`leaflet.markercluster`), jsPDF + AutoTable, SheetJS (`xlsx`) |
| **Tests** | JUnit 5, Mockito, MockMvc, MockRestServiceServer, H2 (mode PostgreSQL), Testcontainers |

---

## 3. Structure du projet

```text
service-fournisseurs-mohamed/
├── Dockerfile                                  # Build multi-stage (JDK 21 -> JRE 21 Alpine)
├── pom.xml                                     # Dépendances & plugins Maven
├── .env.example                                # Modèle de variables d'environnement
├── README.md
├── frontend/                                   # Interface web React + TypeScript + Vite
│   ├── package.json
│   ├── vite.config.ts                          # Proxy /api et /actuator vers :8081
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx
│       ├── api/fournisseurApi.ts               # Client API REST + fallback mode démo
│       ├── components/
│       │   ├── CommandPalette.tsx              # Palette d'actions rapides (Ctrl+K / Cmd+K)
│       │   ├── CommandesDrawer.tsx             # Tiroir détail, métriques d'achats & onglets
│       │   ├── ConfirmModal.tsx                # Modale de confirmation animée
│       │   ├── ErrorBoundary.tsx
│       │   ├── FilterBar.tsx                   # Recherche, filtre statut/ville et tri
│       │   ├── FournisseurCards.tsx            # Vue grille en cartes
│       │   ├── FournisseurMap.tsx              # Carte géographique interactive Leaflet
│       │   ├── FournisseurModal.tsx            # Formulaire création / édition (ville + adresse)
│       │   ├── FournisseurTable.tsx            # Vue tableau avec notation & actions
│       │   ├── ImportModal.tsx                 # Import en lot CSV & Excel (.xlsx)
│       │   ├── Navbar.tsx                      # Navigation, thème sombre/clair & Ctrl+K
│       │   ├── PaginationBar.tsx               # Contrôles de pagination côté serveur
│       │   ├── StatsBar.tsx                    # KPIs globaux du référentiel
│       │   └── Toast.tsx
│       ├── types/fournisseur.ts
│       └── utils/                              # Géocodage, import CSV/XLSX, PDF, scoring, pagination
└── src/
    ├── main/
    │   ├── java/com/procuraflow/fournisseurs/
    │   │   ├── FournisseursApplication.java
    │   │   ├── client/CommandesClient.java
    │   │   ├── config/                         # CorsConfig, DataSourceConfig, NeonJdbcUrlResolver, OpenApiConfig, RestClientConfig
    │   │   ├── controller/FournisseurController.java
    │   │   ├── dto/                            # FournisseurRequest/Response, PageResponse, FournisseurStatsResponse, ApiErrorResponse...
    │   │   ├── entity/Fournisseur.java
    │   │   ├── exception/                      # GlobalExceptionHandler & exceptions métier
    │   │   ├── repository/FournisseurRepository.java
    │   │   └── service/FournisseurService.java
    │   └── resources/
    │       ├── application.yml
    │       └── db/migration/V1__init_schema_fournisseurs.sql
    └── test/
        ├── java/com/procuraflow/fournisseurs/
        │   ├── client/CommandesClientTest.java
        │   ├── config/NeonJdbcUrlResolverTest.java
        │   ├── controller/FournisseurControllerTest.java
        │   ├── integration/FournisseurIntegrationTest.java
        │   ├── service/FournisseurServiceAtelierTest.java
        │   └── service/FournisseurServiceTest.java
        └── resources/
            ├── application-test.yml
            └── schema-test.sql
```

---

## 4. Fonctionnalités Frontend

L'application React (`frontend/`) consomme l'API Spring Boot via le proxy Vite (`/api` → `http://localhost:8081`) et propose également un **mode démo** de secours lorsque le backend est hors ligne :

- **Trois modes de visualisation** : vue Tableau (`FournisseurTable`), vue Cartes (`FournisseurCards`) et **carte géographique interactive** (`FournisseurMap` avec Leaflet & MarkerCluster, géocodage et choix de fond de carte).
- **Pagination, recherche et tri côté serveur** : recherche multi-champs (`nom`, `email`, `téléphone`, `adresse`), filtrage par statut (`Tous` / `Actifs` / `Inactifs`), filtrage par ville (tolérant aux accents) et taille de page configurable (`1` à `50`).
- **Palette de commandes (`Ctrl+K` / `Cmd+K`)** : recherche instantanée de fournisseurs et déclenchement rapide des actions (créer, exporter, basculer de vue, changer de thème).
- **Import en lot CSV & Excel (`.xlsx`)** : glisser-déposer de fichiers, téléchargement de gabarit CSV, prévisualisation avec validation ligne par ligne (e-mails invalides, doublons) avant insertion.
- **Évaluation, métriques d'achats & exports PDF** : notation par étoiles, tiroir latéral (`CommandesDrawer`) avec suivi des commandes/réceptions/factures, et export PDF du catalogue filtré ou d'une fiche fournisseur complète (`jsPDF` + `AutoTable`).
- **Thème clair / sombre** avec interrupteur animé et notifications toast.

---

## 5. Contrat REST API

Base URL locale : `http://localhost:8081` · Documentation interactive : `http://localhost:8081/swagger-ui.html` (`OpenAPI JSON : /v3/api-docs`).

### Endpoints principaux (`/api/fournisseurs`)

| Méthode | Endpoint | Description | Codes de réponse |
|---|---|---|---|
| `POST` | `/api/fournisseurs` | Crée un fournisseur (`actif = true`, e-mail normalisé en minuscules) | `201`, `400`, `409` |
| `GET` | `/api/fournisseurs` | Liste complète non paginée (sans `page`/`size`), pour compatibilité inter-services | `200`, `400` |
| `GET` | `/api/fournisseurs?page=0&size=10` | Liste paginée (`PageResponse`) avec recherche, filtres et tri côté serveur | `200`, `400` |
| `GET` | `/api/fournisseurs/stats` | Statistiques globales (`total`, `actifs`, `inactifs`, `tauxEligibilite`, `villes`) | `200` |
| `GET` | `/api/fournisseurs/{id}` | Récupère un fournisseur par ID (y compris inactif) | `200`, `404` |
| `PUT` | `/api/fournisseurs/{id}` | Met à jour `nom`, `email`, `telephone`, `adresse` (préserve `id`, `createdAt`, `actif`) | `200`, `400`, `404`, `409` |
| `PATCH` | `/api/fournisseurs/{id}/desactiver` | Désactivation logique (`actif = false`), retourne le fournisseur mis à jour | `200`, `404` |
| `DELETE` | `/api/fournisseurs/{id}` | Désactivation logique (`actif = false`), conforme au contrat d'intégration | `204`, `404` |
| `PATCH` | `/api/fournisseurs/{id}/reactiver` | Réactivation logique (`actif = true`) | `200`, `404` |
| `GET` | `/api/fournisseurs/{id}/commandes` | Historique des commandes via `GET ${COMMANDES_SERVICE_URL}/api/commandes?fournisseurId={id}` | `200`, `404`, `502`, `503` |
| `GET` | `/actuator/health` | Sondes de santé Spring Boot Actuator (`liveness`, `readiness`) | `200` |

### Paramètres de filtrage, pagination et tri (`GET /api/fournisseurs`)

- `actif` (`true` | `false`) : filtre explicite sur le statut. Par défaut (sans `actif` ni `includeInactive=true`), seuls les fournisseurs actifs sont retournés.
- `includeInactive` (`true` | `false`, défaut `false`) : inclut les fournisseurs inactifs lorsque `actif` n'est pas fourni.
- `search` (`string`) : recherche partielle insensible à la casse sur `nom`, `email`, `telephone` et `adresse`.
- `nom`, `email`, `ville` (`string`) : filtres ciblés (le filtre `ville` gère les variantes accentuées comme `Fès`/`Fes`, `Kénitra`/`Kenitra`, etc.).
- `page` (`>= 0`, défaut `0`) et `size` (`1` à `50`, défaut `10`) : activent la réponse paginée `PageResponse`.
- `sort` (`champ,direction`, défaut `nom,asc` en mode paginé) : champs autorisés `nom`, `email`, `createdAt`, `updatedAt`, `id`, `actif`.

<details>
<summary>Exemples de requêtes et format d'erreur JSON standardisé</summary>

**Créer un fournisseur (`POST /api/fournisseurs`) :**
```json
{
  "nom": "Atlas Fournitures",
  "email": "contact@atlas.example",
  "telephone": "+212600000000",
  "adresse": "Zone Industrielle Tassila, Agadir, Maroc"
}
```

**Format d'erreur standard (`ApiErrorResponse`) :**
```json
{
  "timestamp": "2026-10-21T13:30:00Z",
  "status": 404,
  "error": "NOT_FOUND",
  "message": "Fournisseur introuvable avec l'identifiant : 42",
  "path": "/api/fournisseurs/42"
}
```
Lors d'une erreur `400 Bad Request`, un champ additionnel `validationErrors` détaille les champs invalides.

</details>

---

## 6. Modèle de données & Configuration Neon PostgreSQL

Table propriétaire : `schema_fournisseurs.fournisseurs` (script de référence idempotent : [`V1__init_schema_fournisseurs.sql`](src/main/resources/db/migration/V1__init_schema_fournisseurs.sql)).

| Colonne | Type SQL | Contraintes | Champ JPA |
|---|---|---|---|
| `id` | `BIGINT` | `GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY` | `Long id` |
| `nom` | `VARCHAR(150)` | `NOT NULL`, `CHECK (length(btrim(nom)) > 0)` | `String nom` |
| `email` | `VARCHAR(150)` | `NOT NULL UNIQUE` | `String email` (normalisé en minuscules) |
| `telephone` | `VARCHAR(30)` | Optionnel (`NULL`) | `String telephone` |
| `adresse` | `TEXT` | Optionnel (`NULL`) | `String adresse` |
| `actif` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | `Boolean actif` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | `OffsetDateTime createdAt` (UTC) |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | `OffsetDateTime updatedAt` (UTC) |

- Hibernate fonctionne avec `spring.jpa.hibernate.ddl-auto=validate` : aucune table n'est supprimée ou recréée au démarrage.
- `NeonJdbcUrlResolver` accepte aussi bien une URL JDBC (`jdbc:postgresql://...`) qu'une URI Neon (`postgresql://user:pass@ep-...neon.tech/procura_flow?sslmode=require`), extrait les identifiants si `DATABASE_USERNAME` / `DATABASE_PASSWORD` ne sont pas définis séparément, et ajoute automatiquement `currentSchema=schema_fournisseurs`.

---

## 7. Variables d'environnement

Copiez [`.env.example`](.env.example) vers `.env` (ignoré par Git) et renseignez vos identifiants :

| Variable | Obligatoire | Valeur par défaut | Description |
|---|---|---|---|
| `DATABASE_URL` | **Oui** | — | Chaîne PostgreSQL / Neon (`postgresql://...` ou `jdbc:postgresql://...`) |
| `DATABASE_USERNAME` | Oui *(sauf si inclus dans l'URI)* | — | Utilisateur PostgreSQL |
| `DATABASE_PASSWORD` | Oui *(sauf si inclus dans l'URI)* | — | Mot de passe PostgreSQL |
| `DATABASE_SCHEMA` | Non | `schema_fournisseurs` | Schéma PostgreSQL propriétaire |
| `JPA_DDL_AUTO` | Non | `validate` | Stratégie DDL Hibernate |
| `SERVER_PORT` | Non | `8081` | Port HTTP du backend |
| `COMMANDES_SERVICE_URL` | Non | `http://localhost:8082` | URL du service Commandes (`http://service-commandes:8082` sous Docker) |
| `COMMANDES_CONNECT_TIMEOUT_MS` | Non | `3000` | Timeout de connexion HTTP vers Commandes (ms) |
| `COMMANDES_READ_TIMEOUT_MS` | Non | `5000` | Timeout de lecture HTTP vers Commandes (ms) |

---

## 8. Démarrage rapide (Local & Docker)

### Prérequis

- **Java 17+** & **Apache Maven 3.9+** (pour le backend)
- **Node.js 18+** & **npm** (pour le frontend)
- Une base **Neon PostgreSQL** (ou Docker avec le `postgres-db` du `docker-compose.yml` racine)

### 1) Lancer le Backend Spring Boot (`:8081`)

**Linux / macOS (Bash) :**
```bash
cd service-fournisseurs-mohamed
set -a && source .env && set +a
mvn spring-boot:run
```

**Windows (PowerShell) :**
```powershell
cd service-fournisseurs-mohamed
Get-Content .env | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
    $k, $v = $line.Split("=", 2)
    if ($v.Trim() -and -not ($v.Trim() -match '^<neon-.*>$')) {
      [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim(), "Process")
    }
  }
}
mvn spring-boot:run
```

Vérification :
- Health check : `http://localhost:8081/actuator/health`
- Swagger UI : `http://localhost:8081/swagger-ui.html`

### 2) Lancer le Frontend React + Vite (`:5173`)

```bash
cd service-fournisseurs-mohamed/frontend
npm install
npm run dev
```

Ouvrez `http://localhost:5173`. Pour générer le build de production :
```bash
npm run build
```

### 3) Conteneurisation Docker

```bash
# Construction et exécution autonome du service backend
cd service-fournisseurs-mohamed
docker build -t procuraflow/service-fournisseurs:1.0.0 .

docker run --rm -p 8081:8081 \
  --env-file .env \
  -e COMMANDES_SERVICE_URL="http://host.docker.internal:8082" \
  procuraflow/service-fournisseurs:1.0.0
```

Ou depuis la racine du dépôt via Docker Compose :
```bash
docker compose up --build service-fournisseurs
```

---

## 9. Tests automatisés

Les tests unitaires et d'intégration backend s'exécutent de manière hermétique en mémoire via H2 (mode PostgreSQL), sans dépendre de Neon :

```bash
cd service-fournisseurs-mohamed
mvn clean test
```

Pour générer le JAR exécutable :
```bash
mvn clean package
```

---

## 10. Dépannage

| Symptôme | Cause fréquente & Solution |
|---|---|
| `Missing required database configuration: set DATABASE_URL` | Exportez les variables de `.env` dans votre shell avant `mvn spring-boot:run` (Spring Boot ne lit pas `.env` automatiquement). |
| `Invalid PostgreSQL URI format in DATABASE_URL` | Remplacez les valeurs exemples (`user:pass`, `<host>`) dans `.env` par une vraie URL Neon et supprimez les placeholders `<neon-username>` / `<neon-password>`. |
| Erreur SSL Neon | Ajoutez `?sslmode=require` à la fin de votre `DATABASE_URL`. |
| `Schema-validation: missing table [fournisseurs]` | Vérifiez que la base ciblée contient bien le schéma `schema_fournisseurs` (exécutez `V1__init_schema_fournisseurs.sql` si nécessaire). |
| `503 Service Unavailable` sur `GET /api/fournisseurs/{id}/commandes` | Comportement normal lorsque le microservice **Commandes** (`:8082`) n'est pas démarré ; les autres endpoints fournisseurs restent opérationnels. |
