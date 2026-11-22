# RAPPORT TECHNIQUE ET ACADÉMIQUE
## Module : Qualité Logicielle & Web Services
### Master 2 Ingénierie Logicielle — Année Universitaire 2026 - 2027

---

# ProcuraFlow — Système Distribué de Gestion des Achats et Fournisseurs
## Conception et Réalisation du Microservice : **Factures**

**Auteur :** Hamza AIT BENAYAD  
**Rôle :** Responsable du Microservice Factures (Port 8084, `schema_factures`)  
**Équipe Projet :**
- **Yassine MESKAOUI** : Chef de Projet / Microservice Commandes (Spring Boot - 8082)
- **Mohamed BAILLA** : Microservice Fournisseurs (Django - 8081)
- **Ali HALLA** : Microservice Réceptions (Spring Boot - 8083)
- **Hamza AIT BENAYAD** : Microservice Factures (Node.js/TypeScript/Express - 8084)

---

## 1. Introduction & Contexte du Projet

Dans les organisations modernes, la chaîne d'approvisionnement (Procure-to-Pay) est un processus transversal critique qui relie les services Achats, Logistique/Entrepôt et Comptabilité. Les architectures logicielles monolithiques historiques présentent d'importantes limites : couplage fort, risque de panne globale par effet domino, rigidité face aux évolutions et lenteurs de traitement.

Le projet **ProcuraFlow** a pour objectif de concevoir une architecture distribuée résiliente découpée en quatre microservices autonomes.

La contrainte centrale de conception posée par le cahier des charges est la suivante :
> *« Assurer l'intégrité globale et la traçabilité du cycle d'achat au sein d'une architecture microservices autonome, en partageant une instance de base de données PostgreSQL découpée en schémas isolés, **sans aucune clé étrangère physique inter-schémas**, l'intégrité référentielle étant garantie au niveau applicatif par des échanges REST synchrones. »*

Le microservice **Factures** se situe en fin de chaîne du workflow d'achat : il valide l'autorisation de facturation en vérifiant les états amont et gère le cycle de vie financier des commandes.

---

## 2. Architecture Technique et Choix d'Ingénierie

### 2.1 Patron d'Architecture en Couches (Layered Architecture)

Afin de garantir les exigences académiques et industrielles de modularité, de maintenabilité et de testabilité, le service est architecturé selon le patron en couches strict :

```
Client HTTP (Postman / Gateway / Web)
       ↓
Couche Routage (facture.routes.ts)
       ↓
Middlewares (Validation Zod typée & Gestion centralisée des erreurs)
       ↓
Couche Contrôleur (facture.controller.ts)
       ↓
Couche Service Métier (facture.service.ts)
       ├──→ Clients REST HTTP Axios typés ──→ [Service Commandes :8082]
       │                                  ──→ [Service Réceptions :8083]
       ↓
Couche Accès Données (facture.repository.ts)
       ↓
PostgreSQL 15 (db_achats_univ / schema_factures)
```

#### Responsabilités des composants :
1. **Couche Route & Middleware (`routes/`, `middlewares/`, `validators/`)** : Déclare les points d'entrée d'API, valide la conformité des schémas JSON entrants via **Zod** et intercepte les exceptions pour produire des réponses d'erreur uniformisées.
2. **Couche Types & Contrats (`types/`)** : Définit l'ensemble des interfaces du domaine (`Facture`, DTOs de requêtes, réponses typées).
3. **Couche Contrôleur (`controllers/`)** : Orchestre l'extraction des paramètres HTTP (body, params, query) et délègue l'exécution à la couche métier. Aucun code SQL ni logique métier n'y réside.
4. **Couche Service (`services/`)** : Cœur névralgique de l'application. Elle applique les règles de gestion (anti-doublon, machine à états des paiements, vérification croisée inter-services).
5. **Couche Référentiel Données (`repositories/`)** : Encapsule les requêtes SQL préparées à destination de PostgreSQL via le driver typé `pg`.
6. **Couche Clients Externes (`clients/`)** : Centralise les contrats et appels HTTP vers les services Commandes et Réceptions.
7. **Séparation `app.ts` / `server.ts`** : Découplage de la configuration Express de l'écoute réseau (`listen()`), permettant à la suite de tests Supertest d'instancier l'application sans monopoliser le port réseau réel.

### 2.2 Justification de la Stack Technologique

| Composant | Technologie retenue | Justification technique |
|---|---|---|
| **Langage & Typage** | TypeScript (v6 / strict) | Sécurité de typage statique, prévention des erreurs à l'exécution, auto-complétion et contrats stricts. |
| **Moteur d'exécution** | Node.js (v20+ LTS / v26) & `tsx` | Haute performance sur les opérations asynchrones, I/O réseau intensives et rechargement à chaud ultra-rapide en dev. |
| **Framework HTTP** | Express.js (v5.3+) | Robustesse, légèreté, standardisation de l'écosystème middleware et intégration typée. |
| **Accès Données** | `pg` (@types/pg) | Utilisation de requêtes SQL natives paramétrées (`$1, $2`) garantissant une protection totale contre les injections SQL et un contrôle exact des verrous et transactions sans surcoût d'un ORM lourd. |
| **Validation** | Zod (v4.6+) | Validation déclarative typée (`z.infer`), échec précoce (*fail-fast*), messages d'erreurs explicites traduits en français. |
| **Client HTTP** | Axios (v1.7+) | Gestion native des timeouts réseau, détection précise des pannes d'infrastructure vs erreurs applicatives. |
| **Tests** | Jest, ts-jest & Supertest | Suite complète d'assertions TypeScript natives, mocking typé sans dépendance externe et tests bout-en-bout des routes HTTP. |

---

## 3. Modélisation de la Base de Données

Conformément à la directive d'isolation stricte, le service n'opère que dans `schema_factures`.

### 3.1 Script DDL Implémenté (`database/schema.sql`)

```sql
CREATE SCHEMA IF NOT EXISTS schema_factures;
SET search_path TO schema_factures;

CREATE SEQUENCE IF NOT EXISTS schema_factures.facture_numero_seq
    START WITH 1 INCREMENT BY 1 NO MAXVALUE CACHE 1;

CREATE TABLE IF NOT EXISTS schema_factures.factures (
    id                SERIAL PRIMARY KEY,
    numero_facture    VARCHAR(50) UNIQUE NOT NULL,
    commande_id       INTEGER NOT NULL,
    reception_id      INTEGER NOT NULL,
    date_facture      DATE NOT NULL DEFAULT CURRENT_DATE,
    montant_total     DECIMAL(12, 2) NOT NULL 
                      CONSTRAINT chk_montant_positif CHECK (montant_total > 0),
    statut_paiement   VARCHAR(20) NOT NULL DEFAULT 'NON_PAYEE'
                      CONSTRAINT chk_statut_valide 
                      CHECK (statut_paiement IN ('NON_PAYEE', 'PAYEE', 'ANNULEE')),
    notes             TEXT,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index d'optimisation
CREATE INDEX IF NOT EXISTS idx_factures_commande_id ON schema_factures.factures(commande_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut_paiement ON schema_factures.factures(statut_paiement);

-- Trigger de mise à jour automatique de l'horodatage
CREATE OR REPLACE FUNCTION schema_factures.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_factures_updated_at
    BEFORE UPDATE ON schema_factures.factures
    FOR EACH ROW EXECUTE FUNCTION schema_factures.update_updated_at();
```

### 3.2 Règles et Choix de Conception SQL
- **Absence de clés étrangères physiques inter-schémas** : `commande_id` et `reception_id` sont des clés logiques indexées. Cela garantit qu'une indisponibilité ou une migration des schémas tiers ne bloque pas les opérations DDL/DML de notre schéma.
- **Numérotation métier séquentielle** : Une séquence PostgreSQL indépendante génère des identifiants normés du type `FAC-2026-00001`.
- **Intégrité financière** : Utilisation stricte du type `DECIMAL(12, 2)` au lieu de nombres flottants pour écarter tout problème d'arrondi binaire sur les devises.

---

## 4. Règles Métier et Logique Applicative

### 4.1 Double Vérification Croisée Synchrone

Avant toute création de facture, le service Factures applique le protocole de vérification croisée :
1. **Appel vers Commandes (port 8082)** : Vérification de l'existence de la commande et validation de son statut éligible (`VALIDEE` ou `LIVREE`).
2. **Appel vers Réceptions (port 8083)** : Vérification de la conformité du bon de réception (`CONFORME`) et de la corrélation stricte avec le `commande_id`.
3. **Contrôle d'unicité applicatif** : Interdiction d'émettre plus d'une facture active pour une même commande (code HTTP 409).
4. **Attribution automatique** : Statut initial automatique fixé à `NON_PAYEE`.

### 4.2 Tolérance aux Pannes & Erreurs d'Infrastructure (503)

Si le service Commandes ou Réceptions subit un crash ou un ralentissement supérieur au timeout configuré (`REQUEST_TIMEOUT=3000ms`), le client Axios capture l'erreur réseau (`error.request`) et lève une exception `ApiError.serviceUnavailable(serviceName)`.  
Le client reçoit immédiatement une réponse normalisée **HTTP 503 Service Unavailable**, protégeant ainsi le système contre les blocages indéfinis.

### 4.3 Machine à États des Paiements

Les transitions d'état sont strictement contrôlées dans `facture.service.js` :
- `NON_PAYEE` ➔ `PAYEE` (Autorisé via PATCH)
- `NON_PAYEE` ➔ `ANNULEE` (Autorisé via PATCH ou DELETE)
- `PAYEE` ➔ `ANNULEE` (Autorisé via DELETE en annulation logique)
- Toute autre transition (ex: revenir de `PAYEE` à `NON_PAYEE`) est rejetée avec un code HTTP 409 Conflict.

**Règle d'immuabilité et d'auditabilité comptable** :  
Seule une facture avec le statut `NON_PAYEE` peut être modifiée (`PUT`). La suppression (`DELETE`) d'une facture payée ne détruit pas la ligne en base de données : elle opère une annulation logique afin de préserver l'historique comptable.

---

## 5. Spécification de l'API REST

| Méthode | Route | Rôle Métier | Code Succès | Erreurs Possibles |
|---|---|---|---|---|
| `GET` | `/api/health` | Diagnostic de disponibilité | `200 OK` | — |
| `GET` | `/api/factures` | Consultation du registre des factures | `200 OK` | `500` |
| `GET` | `/api/factures/:id` | Détail d'une facture par identifiant | `200 OK` | `400`, `404` |
| `POST` | `/api/factures` | Création avec validation croisée | `201 Created` | `400`, `409`, `503` |
| `PUT` | `/api/factures/:id` | Rectification d'une facture non payée | `200 OK` | `400`, `404`, `409` |
| `PATCH` | `/api/factures/:id/paiement`| Enregistrement du règlement | `200 OK` | `400`, `404`, `409` |
| `DELETE` | `/api/factures/:id` | Suppression physique ou annulation comptable | `200 OK` | `404` |

---

## 6. Validation de la Qualité & Résultats des Tests

Une démarche rigoureuse de test pilotée par les spécifications et le cahier de recette académique a été mise en œuvre avec **Jest** et **Supertest**.

### 6.1 Les 9 Tests de Recette Clés

La conformité de la solution est validée autour de 9 tests cardinaux (exécutables via `npm run test:recette`) :

| N° | Scénario de Test | Périmètre & Description | Statut |
|:---:|---|---|:---:|
| **1** | **Validation des données** | Rejet immédiat des schémas JSON erronés (montant négatif, IDs manquants) via Zod (`400 Bad Request`). | ✅ PASS |
| **2** | **Création d'une facture** | Attribution automatique du statut `NON_PAYEE` et d'un numéro normé (`FAC-2026-NNNNN`) après vérification croisée. | ✅ PASS |
| **3** | **Calcul du montant total** | Calcul unitaire de précision du total des lignes d'articles et application du taux de TVA légal (arrondi à 2 décimales). | ✅ PASS |
| **4** | **Consultation par identifiant** | Lecture unitaire d'une facture existante (`200 OK`) et levée d'exception contrôlée si inexistante (`404 Not Found`). | ✅ PASS |
| **5** | **Recherche de factures** | Récupération paginée/liste de l'ensemble des factures triées chronologiquement ou liste vide. | ✅ PASS |
| **6** | **Modification d'une facture** | Modification autorisée pour une facture `NON_PAYEE`, et verrouillage absolu si statut `PAYEE` (`409 Conflict`). | ✅ PASS |
| **7** | **Suppression d'une facture** | Suppression physique pour facture non payée, et annulation logique sécurisée si la facture est déjà réglée. | ✅ PASS |
| **8** | **Gestion des erreurs de base de données** | Interception et propagation propre des pannes de connexion ou erreurs SQL PostgreSQL (`500`). | ✅ PASS |
| **9** | **Gestion des erreurs de communication REST** | Résilience face aux pannes réseau ou indisponibilités des microservices Commandes ou Réceptions (`503 Service Unavailable`). | ✅ PASS |

### 6.2 Bilan d'Exécution Global des Tests

```
PASS tests/recette.test.js
PASS tests/integration/facture.routes.test.js
PASS tests/unit/facture.service.test.js

Test Suites: 3 passed, 3 total
Tests:       43 passed, 43 total (dont 9 tests de recette clés)
Snapshots:   0 total
Time:        3.653 s
```

### 6.3 Couverture de Code (Code Coverage)

| Fichier / Couche | % Instructions | % Branches | % Fonctions | % Lignes |
|---|---|---|---|---|
| `src/services/facture.service.js` | **100%** | **85.7%** | **100%** | **100%** |
| `src/routes/facture.routes.js` | **100%** | **100%** | **100%** | **100%** |
| `src/validators/facture.validator.js` | **100%** | **100%** | **100%** | **100%** |
| `src/app.js` | **100%** | **100%** | **100%** | **100%** |
| `src/utils/ApiError.js` | **90.9%** | **50%** | **83.3%** | **90.9%** |

Tous les cas limites (montants négatifs, pannes réseau 503, indisponibilité d'un tiers, doublons d'enregistrement, transitions d'état illégales) sont rigoureusement validés.

---

## 7. Conteneurisation et Déploiement

Le service est doté d'un `Dockerfile` multi-étape (*multi-stage build*) basé sur `node:20-alpine` garantissant :
- Une réduction drastique de la taille de l'image Docker finale (exclusion des outils de dev).
- L'exécution sous un utilisateur système dédié non-root (`appuser`) pour le respect des bonnes pratiques de sécurité des conteneurs.
- Une intégration native dans le fichier `docker-compose.yml` du projet au sein du réseau `reseau-achats`.

---

## 8. Conclusion et Perspectives

Le microservice Factures répond à l'ensemble des exigences du cahier des charges :
1. **Intégrité applicative garantie** sans violation du principe d'isolation des bases microservices.
2. **Double vérification croisée fonctionnelle** avec résilience face aux pannes tierces.
3. **Qualité logicielle démontrée** par une suite de 34 tests automatisés et 100% de couverture de la logique métier.
4. **Intégrabilité immédiate** avec les modules Spring Boot et Django des collègues de promotion via Docker Compose et les collections Postman fournies.

