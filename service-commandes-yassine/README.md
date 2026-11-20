Voici la version entièrement corrigée et proprement mise en forme pour ton fichier **`README.md`**, avec l'intégration correcte du nouvel endpoint dans le tableau et la correction des balises de code Markdown :

```markdown
# ProcuraFlow - Service Commandes (`service-commandes`)

Microservice de gestion des commandes pour la plateforme d'achats **ProcuraFlow**, développé avec **Spring Boot** et **Java 21**, interconnecté avec une base de données **PostgreSQL**.

---

## 🚀 Technologies Utilisées
- **Java 21**
- **Spring Boot 4.1.2** (Spring Web, Spring Data JPA)
- **PostgreSQL 15** (via Docker)
- **Maven** (Gestionnaire de build)

---

## 🛠️ Configuration & Lancement

1. **Lancer la base de données PostgreSQL via Docker :**
   ```bash
   docker-compose up -d postgres-db

```

2. **Lancer le microservice :**
```bash
mvn spring-boot:run

```



Le service tourne par défaut sur le port **`8082`**.

---

## 📋 Documentation des Endpoints

Le chemin de base de l'API est : `/api/commandes`

| Méthode | Endpoint | Description | Payload (Request Body) | Réponse (Response) |
| --- | --- | --- | --- | --- |
| `POST` | `/api/commandes` | Créer une nouvelle commande avec ses lignes | `JSON` | `201 Created` / Objet Commande |
| `GET` | `/api/commandes` | Récupérer la liste de toutes les commandes | *Aucun* | `200 OK` / Liste JSON |
| `GET` | `/api/commandes/{id}` | Récupérer une commande spécifique par son ID | *Aucun* | `200 OK` / Objet Commande |
| `GET` | `/api/commandes/fournisseur/{fournisseurId}` | Récupérer les commandes d'un fournisseur spécifique | *Aucun* | `200 OK` / Liste JSON |
| `PUT` | `/api/commandes/{id}/statut` | Mettre à jour le statut d'une commande | Paramètre (`?statut=...`) | `200 OK` / Commande mise à jour |
| `DELETE` | `/api/commandes/{id}` | Supprimer une commande par son ID | *Aucun* | `204 No Content` / `200 OK` |

---

## 📦 Exemple de Payload (Requête `POST`)

```json
{
  "fournisseurId": 1,
  "montantTotal": 2400.00,
  "lignesCommande": [
    {
      "designation": "PC Portable Gamer",
      "quantite": 1,
      "prixUnitaire": 2000.00
    },
    {
      "designation": "Souris Sans Fil Ergonomique",
      "quantite": 2,
      "prixUnitaire": 200.00
    }
  ]
}

```

```

