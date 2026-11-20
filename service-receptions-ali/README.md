# Réceptions

Le service Spring Boot utilise PostgreSQL et écoute sur le port 8083. Le frontend commun expose la page `/receptions`. L’agent choisit une commande validée ou expédiée, consulte ses quantités restantes, saisit les unités conformes livrées et retrouve le bon dans l’historique.

## Démarrage local

Depuis la racine ProcuraFlow, avec Java 21, Maven, Node.js 22 et PostgreSQL disponibles :

1. Pour utiliser la base locale du projet, lancez `docker compose up -d postgres-db`. Une autre base PostgreSQL de développement convient également.
2. Configurez `DB_URL` (URL JDBC), `DB_USERNAME` et `DB_PASSWORD` dans l’environnement du processus Java ou dans la configuration Run d’IntelliJ. Flyway doit pouvoir gérer le schéma `schema_receptions`. Spring Boot ne charge pas automatiquement un fichier `.env`.
3. Lancez le service Commandes de l’équipe sur le port 8082 pour enregistrer des livraisons. Réceptions utilise `COMMANDES_URL`, par défaut `http://localhost:8082`. L’historique des réceptions fonctionne aussi lorsque Commandes est indisponible.
4. Lancez `mvn -f service-receptions-ali/pom.xml spring-boot:run`.
5. Dans `frontend`, lancez `npm ci` puis `npm run dev`. Ouvrez [Réceptions](http://localhost:5173/receptions). Vite redirige les appels vers les ports 8082 et 8083. Ses cibles peuvent être adaptées avec `COMMANDES_URL` et `RECEPTIONS_URL`.

Pour vérifier les builds, lancez `mvn -f service-receptions-ali/pom.xml package` à la racine et `npm run build` dans `frontend`.

## Contrat HTTP

| Route | Résultat |
| --- | --- |
| GET /api/receptions | Liste chronologique décroissante des réceptions avec leurs lignes. |
| GET /api/receptions?commandeId=12 | Réceptions de la commande pour le suivi et le rapprochement par Factures. |
| GET /api/receptions?page=0&size=10 | Page de réceptions avec `contenu` et `nombrePages`. Filtre `commandeId` facultatif. |
| GET /api/receptions/{id} | Détail du bon ou 404. |
| GET /api/receptions/commandes/{id}/soldes | Lignes de la commande recevable, désignations, quantités commandées et restantes. |
| POST /api/receptions | Enregistrement transactionnel. Retourne le bon et son emplacement (201), ou le même bon (200) pour un renvoi identique. |

Exemple de création, en remplaçant les identifiants par ceux d’une commande réelle :

```json
{
  "cleCreation": "4ec4f253-66e1-4682-a517-a68e918b8e3a",
  "commandeId": 12,
  "remarques": "Première livraison",
  "lignes": [{"ligneCommandeId": 25, "quantiteRecue": 6}]
}
```

La clé UUID identifie une demande. Une seconde livraison reçoit une nouvelle clé. Deux écritures sur la même commande sont sérialisées en base avant le calcul du cumul. Une erreur sur une ligne annule toute la demande. Une réception partielle peut être conforme. Les articles refusés ne sont pas comptabilisés dans la quantité déclarée ici. Le statut de la commande reste géré par Commandes.

Le service renvoie 400 pour une saisie invalide, 404 pour une commande inconnue, 409 pour un dépassement, un statut incompatible ou une clé réutilisée avec un autre contenu, 502 pour une réponse distante inexploitable et 503 en cas d’échec de connexion. Une ancienne réception sans lignes reste consultable. Pour sa commande, le calcul du restant nécessite de renseigner les quantités historiques.

## Migrations et essais

Flyway initialise une nouvelle base ou reprend la table de développement existante. V4 conserve les anciennes réceptions, ajoute la clé de création et aligne les types des identifiants. Les anciennes dates sans fuseau sont interprétées en UTC. Les dates déjà en `timestamptz` conservent leur instant.

Importez la collection et l’environnement du répertoire `postman`. Dans le dossier Réceptions, listez les commandes, renseignez `commandeId`, consultez les soldes puis renseignez `ligneCommandeId`. Envoyez la création puis la consultation du détail. La collection conserve la clé pour tester un renvoi. Effacez `cleCreation` dans l’environnement avant une nouvelle livraison.

Pour exécuter les tests d’intégration, lancez les services Commandes et Réceptions sur des bases de test dédiées. Depuis la racine, exécutez `python service-receptions-ali/tests/registration.py`. Les tests créent leurs propres commandes et livraisons et vérifient le cumul, les erreurs, les renvois identiques et les créations concurrentes. Les variables `TEST_COMMANDES_URL` et `TEST_RECEPTIONS_URL` permettent de choisir des instances de test sur d’autres ports.
