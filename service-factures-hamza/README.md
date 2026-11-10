# 🧾 Service Factures — ProcuraFlow

> Microservice de gestion des factures d'achat dans le système distribué ProcuraFlow.

## 📋 Table des matières

- [Architecture](#-architecture)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Initialisation de la base de données](#-initialisation-de-la-base-de-données)
- [Lancement](#-lancement)
- [API REST](#-api-rest)
- [Tests](#-tests)
- [Exemples Postman](#-exemples-postman)
- [Docker](#-docker)
- [Structure du projet](#-structure-du-projet)

---

## 🏗 Architecture

Ce microservice suit une **architecture en couches** :

```
Routes → Middlewares (validation Zod) → Controller → Service (logique métier) → Repository (SQL)
                                                        ↓
                                              Clients REST (Axios)
                                                        ↓
                                          Services Commandes & Réceptions
```

**Stack technique :** Node.js, Express, PostgreSQL (`pg`), Zod, Axios, Jest, Supertest.

---

## ✅ Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** ≥ 15 (ou Docker)

---

## 📦 Installation

```bash
# Cloner le dépôt (si ce n'est pas déjà fait)
git clone <url-du-depot>
cd ProcuraFlow/service-factures-hamza

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

---

## ⚙ Configuration

Éditez le fichier `.env` avec vos paramètres :

```env
PORT=8084
NODE_ENV=development
DATABASE_URL=postgresql://admin_achats:pass_secure@localhost:5432/db_achats_univ
COMMANDES_SERVICE_URL=http://localhost:8082
RECEPTIONS_SERVICE_URL=http://localhost:8083
REQUEST_TIMEOUT=3000
```

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port d'écoute du service | `8084` |
| `NODE_ENV` | Environnement (`development`, `production`, `test`) | `development` |
| `DATABASE_URL` | URL de connexion PostgreSQL | — |
| `COMMANDES_SERVICE_URL` | URL du microservice Commandes | — |
| `RECEPTIONS_SERVICE_URL` | URL du microservice Réceptions | — |
| `REQUEST_TIMEOUT` | Timeout des appels REST externes (ms) | `3000` |

---

## 🗄 Initialisation de la base de données

### Option 1 : Via Docker Compose (recommandé)

Depuis la racine du projet ProcuraFlow :

```bash
docker-compose up postgres-db
```

Le script `database/init.sql` est automatiquement exécuté au premier lancement.

### Option 2 : Manuellement

```bash
# Se connecter à PostgreSQL
psql -U admin_achats -d db_achats_univ

# Exécuter le script d'initialisation du schéma factures
\i service-factures-hamza/database/schema.sql
```

---

## 🚀 Lancement

### Mode développement (avec rechargement automatique)

```bash
npm run dev
```

### Mode production

```bash
npm start
```

Le service démarre sur `http://localhost:8084`.

Vérifier l'état : `GET http://localhost:8084/api/health`

---

## 📡 API REST

### Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Vérifier l'état du service |
| `GET` | `/api/factures` | Lister toutes les factures |
| `GET` | `/api/factures/:id` | Consulter une facture |
| `POST` | `/api/factures` | Créer une facture |
| `PUT` | `/api/factures/:id` | Modifier une facture |
| `PATCH` | `/api/factures/:id/paiement` | Mettre à jour le paiement |
| `DELETE` | `/api/factures/:id` | Supprimer ou annuler |

### Codes HTTP

| Code | Signification |
|---|---|
| `200` | Succès |
| `201` | Création réussie |
| `400` | Données invalides |
| `404` | Ressource non trouvée |
| `409` | Conflit (doublon ou transition interdite) |
| `500` | Erreur interne |
| `503` | Service externe indisponible |

### Format de réponse

Toutes les réponses suivent ce format :

```json
{
  "success": true,
  "message": "Description de l'action",
  "data": { ... }
}
```

---

## 🧪 Tests

```bash
# Tous les tests
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests avec couverture de code
npm run test:coverage
```

---

## 📮 Exemples Postman

### 1. Health Check

```
GET http://localhost:8084/api/health
```

### 2. Créer une facture

```
POST http://localhost:8084/api/factures
Content-Type: application/json

{
  "commande_id": 1,
  "reception_id": 1,
  "montant_total": 1500.00,
  "notes": "Facture pour commande de fournitures"
}
```

### 3. Lister toutes les factures

```
GET http://localhost:8084/api/factures
```

### 4. Consulter une facture

```
GET http://localhost:8084/api/factures/1
```

### 5. Modifier une facture

```
PUT http://localhost:8084/api/factures/1
Content-Type: application/json

{
  "montant_total": 1800.00,
  "notes": "Montant corrigé"
}
```

### 6. Marquer comme payée

```
PATCH http://localhost:8084/api/factures/1/paiement
Content-Type: application/json

{
  "statut_paiement": "PAYEE"
}
```

### 7. Supprimer une facture

```
DELETE http://localhost:8084/api/factures/1
```

---

## 🐳 Docker

### Build et lancement isolé

```bash
docker build -t service-factures .
docker run -p 8084:8084 --env-file .env service-factures
```

### Avec Docker Compose (depuis la racine ProcuraFlow)

```bash
docker-compose up service-factures
```

---

## 📁 Structure du projet

```
service-factures-hamza/
├── src/
│   ├── config/
│   │   ├── database.js          # Pool PostgreSQL
│   │   └── env.js               # Variables d'environnement
│   ├── controllers/
│   │   └── facture.controller.js
│   ├── services/
│   │   └── facture.service.js   # Logique métier
│   ├── repositories/
│   │   └── facture.repository.js # Requêtes SQL
│   ├── routes/
│   │   └── facture.routes.js
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   └── validation.middleware.js
│   ├── validators/
│   │   └── facture.validator.js # Schémas Zod
│   ├── clients/
│   │   ├── commande.client.js   # Client REST Commandes
│   │   └── reception.client.js  # Client REST Réceptions
│   ├── utils/
│   │   └── ApiError.js
│   └── app.js
├── tests/
│   ├── unit/
│   │   └── facture.service.test.js
│   └── integration/
│       └── facture.routes.test.js
├── database/
│   └── schema.sql               # DDL PostgreSQL
├── server.js                     # Point d'entrée serveur
├── .env.example
├── .gitignore
├── Dockerfile
├── jest.config.js
├── package.json
└── README.md
```

---

## 👥 Équipe ProcuraFlow

| Membre | Microservice | Technologie | Port |
|---|---|---|---|
| Mohamed BAILLA | Fournisseurs | Django | 8081 |
| Yassine MESKAOUI | Commandes | Spring Boot | 8082 |
| Ali HALLA | Réceptions | Spring Boot | 8083 |
| **Hamza AIT BENAYAD** | **Factures** | **Node.js** | **8084** |
