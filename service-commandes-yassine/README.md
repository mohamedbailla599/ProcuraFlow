# 📦 ProcuraFlow — Microservice Gestion des Commandes (`:8082`)

Microservice responsable du cycle de vie complet des bons de commande et de leurs lignes d'achat au sein de la plateforme **ProcuraFlow** (Système de Gestion d'Achats Intégré).

* **Responsable & Chef de Projet :** Yassine MESKAOUI
* **Port par défaut :** `8082`
* **Base de données :** PostgreSQL (`schema_commandes`)

---

## 🛠️ Stack Technique

* **Langage :** Java 17
* **Framework :** Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Validation)
* **Base de données :** PostgreSQL 15+
* **Documentation API :** Springdoc OpenAPI / Swagger UI (`/swagger-ui.html`)
* **Conteneurisation :** Docker & Docker Compose

---

## 🚀 Démarrage Rapide (Local)

### 1. Prérequis
* JDK 17+
* Maven 3.8+
* PostgreSQL en cours d'exécution (avec la base de données configurée dans `src/main/resources/application.properties`)

### 2. Lancer l'application
```bash
mvn clean spring-boot:run
```
L'API sera accessible sur : `http://localhost:8082`

---

## 📡 Documentation des Endpoints API REST

Le chemin de base de l'API est : `/api/commandes`

| Méthode | Endpoint | Description | Payload (Request Body) | Réponse (Response) |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/commandes` | Créer une nouvelle commande avec ses lignes | `JSON` | `201 Created` / Objet Commande |
| `GET` | `/api/commandes` | Récupérer la liste de toutes les commandes | *Aucun* | `200 OK` / Liste JSON |
| `GET` | `/api/commandes/{id}` | Récupérer une commande spécifique par son ID | *Aucun* | `200 OK` / Objet Commande |
| `GET` | `/api/commandes/fournisseur/{fournisseurId}` | Récupérer les commandes d'un fournisseur spécifique | *Aucun* | `200 OK` / Liste JSON |
| `PUT` | `/api/commandes/{id}` | Mettre à jour complètement une commande (fournisseur, statut, lignes) | `JSON` | `200 OK` / Commande mise à jour |
| `PUT` | `/api/commandes/{id}/statut` | Mettre à jour rapidement le statut d'une commande | Paramètre (`?statut=...`) | `200 OK` / Commande mise à jour |
| `DELETE` | `/api/commandes/{id}` | Supprimer une commande par son ID | *Aucun* | `204 No Content` / `200 OK` |

---

## 📝 Exemples de Payloads JSON

### Créer ou Modifier une commande (`POST` / `PUT /api/commandes/{id}`)
```json
{
  "fournisseurId": 1,
  "statut": "EN_ATTENTE",
  "lignesCommande": [
    {
      "designation": "PC Portable Gamer",
      "quantite": 2,
      "prixUnitaire": 8500.00
    },
    {
      "designation": "Souris Sans Fil Ergonomique",
      "quantite": 2,
      "prixUnitaire": 250.00
    }
  ]
}
```

### Statuts autorisés (`StatutCommande`)
* `EN_ATTENTE` *(statut par défaut à la création)*
* `VALIDEE`
* `EN_COURS`
* `LIVREE`
* `ANNULEE`

---


## 🔗 Intégration Inter-Services (ProcuraFlow)
* **Service Fournisseurs (`:8081`) :** Liaison logique via `fournisseurId`.
* **Service Réceptions (`:8083`) :** Consomme les commandes au statut `VALIDEE` / `EN_COURS`.
* **Service Factures (`:8084`) :** Rapprochement 3-voies basé sur les commandes `LIVREE`.