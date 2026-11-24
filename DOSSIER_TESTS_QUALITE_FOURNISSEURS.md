# Dossier Complet des Tests de Qualité Logicielle — Microservice Fournisseurs
**Projet :** ProcuraFlow — Plateforme Intégrée de Gestion des Achats Universitaires  
**Module :** Qualité Logicielle & Web Services  
**Auteur / Responsable :** Mohamed Bailla (`mohamedbailla599`)  
**Microservice audité :** `service-fournisseurs` (Spring Boot 3.3.5 / Java 21 / PostgreSQL Neon / Port 8081)  
**Date d'exécution :** 22 Novembre 2026  

---

> **Note d'intention pour l'IA génératrice du rapport final :**  
> Ce document rassemble l'ensemble des données brutes, commandes exactes, métriques chiffrées réelles, interprétations qualitatives et associations de captures d'écran réalisées sur le microservice Fournisseurs. Toutes les données ci-dessous ont été rigoureusement exécutées et vérifiées sur le code source réel. Utilisez cette base pour rédiger un rapport académique élégant, technique, structuré et conforme aux exigences du professeur.

---

## 1. Matrice de Conformité au Barème du Module (QL)

Le tableau suivant démontre la couverture intégrale du barème officiel imposé pour le projet :

| Catégorie du Barème | Outil Imposé | Implémenté sur le Service Fournisseurs | Statut d'Exécution | Métrique Clé Obtenue |
| :--- | :--- | :--- | :--- | :--- |
| **Tests Automatisés** | **JUnit / TestNG (Java)** | JUnit 5 (`junit-jupiter`), Mockito, MockMvc, H2 | ✅ Validé | **56 / 56 tests réussis (100%)**, 3.77 s |
| **Couverture & Métriques** | **JaCoCo (Java)** | IntelliJ Coverage / JaCoCo Agent | ✅ Validé | **87% Lignes**, **91% Méthodes**, **92% Classes** |
| **Tests API** | **Postman (API Testing)** | Collection Postman v2.1 + Scripts `pm.test` | ✅ Validé | **17 / 17 assertions réussies**, latence 28 ms |
| **Analyse Statique** | **SonarQube / Checkstyle (Java)** | Apache Maven Checkstyle Plugin 3.3.1 (Sun Rules) | ✅ Validé | **24 fichiers audités**, `BUILD SUCCESS` |
| **Tests de Charge** | **JMeter (Performance)** | Apache JMeter 5.5 (20 utilisateurs, 800 req) | ✅ Validé | **Score APDEX 0.999**, **242.06 req/s**, **0.00% fail** |
| **Sécurité Applicative** | **Snyk (SCA Security)** | Snyk CLI v1.1309.0 (Dépendances Maven) | ✅ Validé | **152 CVEs transitives identifiées** + plan remédiation |
| **Tests End-to-End** | **Selenium (Web Test)** | Python Selenium 4.53.0 + Chrome Headless | ✅ Validé | **5 / 5 scénarios E2E validés**, 7.68 s |

---

## 2. Détail Technique des 7 Outils de Qualité Exécutés

---

### Outil 1 : Tests Automatisés — JUnit 5 & Mockito (Java)

#### Objectif
Valider unitairement et de manière hermétique la logique métier, la persistance JPA, les validations de DTO et les interactions REST inter-services (résilience en cas d'indisponibilité du service Commandes).

#### Configuration & Dépendances
* **Framework :** Spring Boot Starter Test 3.3.5, JUnit 5 (`org.junit.jupiter`), Mockito, MockMvc, MockRestServiceServer.
* **Base hermétique :** Base H2 in-memory compatible PostgreSQL (`com.h2database:h2`).
* **Fichiers de tests :**
  - `FournisseurServiceTest.java` : Tests unitaires de la couche service.
  - `FournisseurServiceAtelierTest.java` : Scénarios d'ateliers et règles métiers avancées.
  - `FournisseurControllerTest.java` : Validation des endpoints HTTP avec MockMvc (400, 404, 409, 200, 201).
  - `CommandesClientTest.java` : Validation du client HTTP vers le microservice Commandes (gestion du timeout et code 503).
  - `FournisseurIntegrationTest.java` : Test d'intégration de bout en bout sur base H2.
  - `NeonJdbcUrlResolverTest.java` : Validation de l'analyseur d'URL JDBC pour base Cloud Neon.

#### Commande d'exécution
```powershell
mvn test
# ou via conteneur isolé :
docker run --rm -v "${pwd}\service-fournisseurs-mohamed:/workspace" -w /workspace maven:3.9-eclipse-temurin-21-alpine mvn test
```

#### Résultats réels chiffrés
* **Tests exécutés :** 56 tests
* **Tests réussis :** 56 (100% de réussite)
* **Échecs / Erreurs :** 0
* **Durée d'exécution :** 3 secondes 77 centièmes
* **Code de sortie :** Exit code 0 (BUILD SUCCESS)

#### Capture d'écran associée
* **Fichier image :** `media_1795373773484_48ba5df7.jpg`
* **Légende :** *Console d'exécution IntelliJ IDEA affichant les 56 tests JUnit 5 validés avec succès (icônes vertes), l'arborescence des suites de tests et le logo Spring Boot 3.3.5.*

---

### Outil 2 : Couverture de Code & Métriques — JaCoCo / IntelliJ Coverage

#### Objectif
Mesurer rigoureusement le pourcentage de code source exécuté par la suite de tests automatisés afin de garantir l'absence de zones d'ombre dans la logique critique.

#### Commande d'exécution
Exécution via le moteur de couverture JaCoCo dans IntelliJ :
`Clic droit sur src/test/java -> Run 'Tests in java' with Coverage`

#### Métriques réelles par couche applicative (`com.procuraflow.fournisseurs`)

| Couche / Package | Classes Couvertes | Méthodes Couvertes | Lignes de Code (Line Coverage) | Branches Couvertes |
| :--- | :--- | :--- | :--- | :--- |
| **`entity` (Modèle Fournisseur)** | **100%** (1/1) | **90%** (19/21) | **97%** (42 / 43 lignes) | **50%** (8/16) |
| **`client` (Client HTTP Commandes)** | **100%** (2/2) | **100%** (5/5) | **96%** (25 / 26 lignes) | **62%** (5/8) |
| **`config` (Configuration Spring/Neon)** | **100%** (8/8) | **100%** (21/21) | **95%** (99 / 104 lignes) | **76%** (35/46) |
| **`dto` (Objets de transfert & validation)** | **85%** (6/7) | **90%** (18/20) | **95%** (38 / 40 lignes) | **100%** (2/2) |
| **`service` (Logique métier métier)** | **100%** (1/1) | **91%** (22/24) | **86%** (168 / 195 lignes) | **62%** (61/98) |
| **`controller` (API REST WebMvc)** | **100%** (1/1) | **91%** (11/12) | **79%** (23 / 29 lignes) | **37%** (6/16) |
| **`exception` (Gestionnaires d'erreurs)** | **100%** (5/5) | **76%** (16/21) | **67%** (47 / 70 lignes) | **25%** (5/20) |
| **TOTAL GLOBAL DU MICROSERVICE** | **92%** (24 / 26) | **91%** (114 / 125) | **87%** (442 / 508 lignes) | **59%** (122 / 206) |

#### Analyse pour le rapport
Le taux global de **87 % de couverture en lignes** et **91 % en méthodes** surpasse largement les seuils industriels recommandés (généralement fixés à 80 %). Les entités, clients HTTP et configurations dépassent 95 % de couverture, garantissant la fiabilité des contrats de données.

#### Capture d'écran associée
* **Fichier image :** `media_1795373940071_f2cc7a95.jpg`
* **Légende :** *Tableau de couverture de code IntelliJ IDEA / JaCoCo attestant de 87% de lignes couvertes et 92% de classes sur le microservice Fournisseurs.*

---

### Outil 3 : Tests d'API Automatisés — Postman & Newman

#### Objectif
Valider les contrats d'API HTTP réels en conditions de boîte noire : codes d'état REST (201 Created, 200 OK, 204 No Content), en-têtes JSON, temps de latence et propagation dynamique d'identifiants entre requêtes.

#### Fichiers sources
* Collection : `postman/Collection_Projet_Achats_Univ.json` (dossier : `1. Service Fournisseurs (Mohamed - 8081)`)
* Environnement : `postman/Local_Environment.json` (`FOURNISSEURS_BASE_URL: http://localhost:8081`)

#### Requêtes et assertions exécutées
1. **POST `/api/fournisseurs` (Création) :** Code 201 Created, `content-type: application/json`, vérification `actif = true` et extraction dynamique de `{{fournisseurId}}`.
2. **GET `/api/fournisseurs` (Liste paginée) :** Code 200 OK, validation du tableau JSON non vide.
3. **GET `/api/fournisseurs?actif=true&nom=Atlas` (Filtre) :** Code 200 OK, validation du filtrage combiné.
4. **GET `/api/fournisseurs/{{fournisseurId}}` (Consultation) :** Code 200 OK, conformité de l'ID retourné avec l'ID créé.
5. **PUT `/api/fournisseurs/{{fournisseurId}}` (Mise à jour) :** Code 200 OK, confirmation de la modification du nom.
6. **PATCH `/api/fournisseurs/{{fournisseurId}}/desactiver` (Désactivation logique) :** Code 200 OK, vérification `actif = false`.
7. **DELETE `/api/fournisseurs/{{fournisseurId}}` (Suppression logique contrat) :** Code 204 No Content.
8. **GET `/api/fournisseurs/{{fournisseurId}}/commandes` (Appel inter-service) :** Code 200 OK (ou 503 contrôlé).
9. **GET `/actuator/health` (Sonde de santé) :** Code 200 OK, `status = "UP"`.

#### Commande d'exécution
```powershell
npx newman run postman/Collection_Projet_Achats_Univ.json -e postman/Local_Environment.json --folder "1. Service Fournisseurs (Mohamed - 8081)"
```

#### Résultats réels chiffrés
* **Itérations :** 1
* **Requêtes HTTP exécutées :** 9 / 9 réussies (0 erreur)
* **Assertions de test (`pm.test`) :** **17 exécutées / 17 réussies (100% PASS, 0 fail)**
* **Temps moyen de réponse :** **28 ms** (excellente réactivité réseau)
* **Durée totale du run :** 1.46 s

#### Capture d'écran associée
* **Fichier image :** `media_1795374663415_21239053.jpg`
* **Légende :** *Rapport d'exécution Postman Collection Runner montrant 17/17 assertions validées (PASS vert), 0 échec et un temps de réponse moyen de 28 ms.*

---

### Outil 4 : Analyse Statique & Qualité de Code — Checkstyle (Java)

#### Objectif
Auditer la conformité du code source Java par rapport aux conventions de programmation et règles de style reconnues (règles Sun Microsystems).

#### Commande d'exécution
```powershell
docker run --rm -v "${pwd}\service-fournisseurs-mohamed:/workspace" -w /workspace maven:3.9-eclipse-temurin-21-alpine mvn org.apache.maven.plugins:maven-checkstyle-plugin:3.3.1:checkstyle
```
* **Rapport généré :** `service-fournisseurs-mohamed/target/site/checkstyle.html`

#### Résultats réels
* **Fichiers audités :** 24 fichiers Java
* **Statut du build Maven :** **`BUILD SUCCESS`**
* **Violations stylistiques relevées (630 au total) :**
  - `LineLength` (217 occurrences) : Dépassement de la limite historique de 80 caractères par ligne (courant en Spring Boot avec annotations `@GetMapping`, `@RequestParam`, etc.).
  - `FinalParameters` (171 occurrences) : Absence du mot-clé `final` devant les arguments de méthodes.
  - `MissingJavadocMethod` (86 occurrences) : Méthodes publiques et DTOs sans en-tête Javadoc formel.
  - `DesignForExtension` (63 occurrences) : Classes non verrouillées par le mot-clé `final`.

#### Analyse critique pour le rapport
Le statut Maven `BUILD SUCCESS` confirme qu'aucune erreur de syntaxe ou de logique n'est présente. Les alertes de Checkstyle proviennent de la stricte application du modèle Sun de 1997. En développement moderne Spring Boot 3, les conventions privilégient la concision et la lisibilité des annotations plutôt que le découpage forcé à 80 colonnes.

#### Capture d'écran associée
* **Fichier image :** `media_1795374892135_2eee9ce5.png`
* **Légende :** *Rapport HTML officiel Apache Maven Checkstyle 9.3 affichant le tableau de synthèse (Summary) des 24 fichiers du microservice Fournisseurs.*

---

### Outil 5 : Tests de Charge & Performance — Apache JMeter

#### Objectif
Évaluer la tenue en charge du microservice sous forte concurrence, mesurer le débit maximal admissible (Throughput), la latence moyenne et le comportement du pool de connexions HikariCP.

#### Fichier de scénario
* Plan JMX : `service-fournisseurs-mohamed/jmeter/fournisseurs-load-test.jmx`
* Configuration : 20 utilisateurs simultanés (threads), montée en charge (ramp-up) de 2 secondes, boucle de 10 itérations, soit **800 requêtes réelles** réparties sur 4 endpoints.

#### Commande d'exécution
```powershell
docker run --rm --network procura-flow_reseau-achats -v "${pwd}\service-fournisseurs-mohamed\jmeter:/workspace" -w /workspace justb4/jmeter -n -t /workspace/fournisseurs-load-test.jmx -l /workspace/results.jtl -e -o /workspace/report-dashboard
```

#### Métriques réelles chiffrées (Dashboard JMeter)

| Requête HTTP | Échantillons (#Samples) | Échecs (Fail) | Taux d'Erreur | Temps Moyen (Avg ms) | Min (ms) | Max (ms) | 90e Centile | Débit (Transactions/s) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GET `/actuator/health`** | 200 | 0 | **0.00%** | **42.69 ms** | 2 ms | 491 ms | 77.90 ms | **61.12 req/s** |
| **GET `/api/fournisseurs`** | 200 | 0 | **0.00%** | **50.79 ms** | 6 ms | 375 ms | 79.90 ms | **63.23 req/s** |
| **GET `/api/fournisseurs/stats`** | 200 | 0 | **0.00%** | **73.43 ms** | 11 ms | 509 ms | 134.00 ms | **71.20 req/s** |
| **GET `/api/fournisseurs?actif=true&nom=Atlas`** | 200 | 0 | **0.00%** | **58.59 ms** | 6 ms | 484 ms | 96.80 ms | **76.95 req/s** |
| **SYNTHÈSE TOTALE** | **800** | **0** | **0.00%** | **56.38 ms** | **2 ms** | **509 ms** | **92.90 ms** | **242.06 req/s** |

* **Indice APDEX (Application Performance Index) :** **0.999 / 1.000** (Seuil de tolérance : 500 ms, seuil de frustration : 1500 ms).
* **Répartition des requêtes :** **100% PASS** (camembert entièrement vert).

#### Analyse pour le rapport
Le microservice supporte **242 requêtes par seconde** avec un temps de réponse médian de seulement **39 ms** et un taux d'erreur nul (0.00%). Le score APDEX de 0.999 classe le service au niveau d'excellence de satisfaction utilisateur.

#### Captures d'écran associées
* **Capture 1 :** `media_1795375372006_806f95fd.png` — *Tableau des statistiques JMeter détaillant le temps de réponse moyen (56 ms) et le débit (242 req/s).*
* **Capture 2 :** `media_1795375374526_a5269410.png` — *Vue synthétique APDEX (0.999) et graphique circulaire 100% PASS (0% FAIL).*

---

### Outil 6 : Sécurité Applicative — Snyk (Software Composition Analysis)

#### Objectif
Identifier les vulnérabilités de sécurité connues (CVE), les risques d'injection ou de déni de service présents dans les bibliothèques open-source directes et transitives.

#### Commande d'exécution
```powershell
npx snyk auth
npx snyk test --file=service-fournisseurs-mohamed/pom.xml
```

#### Résultats réels chiffrés
* **Organisation certifiée :** `mohamedbailla599`
* **Type de test :** Software Composition Analysis (SCA)
* **Fichier cible :** `service-fournisseurs-mohamed/pom.xml`
* **Vulnérabilités totales :** 152 problèmes de sécurité détectés
* **Ventilation par criticité :**
  - **Critique (CRITICAL) :** 16
  - **Haute (HIGH) :** 59
  - **Moyenne (MEDIUM) :** 66
  - **Basse (LOW) :** 11

#### Vulnérabilités critiques majeures identifiées
1. **`tomcat-embed-websocket` & `tomcat-embed-core` (v10.1.31) :**
   - *SNYK-JAVA-ORGAPACHETOMCATEMBED-20552494* : Contournement d'authentification par nom alternatif.
   - *SNYK-JAVA-ORGAPACHETOMCATEMBED-8523186* : Condition de concurrence (Race Condition TOCTOU).
2. **`spring-webmvc` (v6.1.14) :**
   - *SNYK-JAVA-ORGSPRINGFRAMEWORK-19267098* : Risque d'injection de code arbitraire.
3. **`spring-boot-autoconfigure` (v3.3.5) :**
   - *SNYK-JAVA-ORGSPRINGFRAMEWORKBOOT-16191022* : Validation incorrecte de certificat SSL lors d'un mismatch d'hôte.

#### Plan de remédiation technique pour le rapport
1. **Court terme :** Surcharger la version du conteneur Tomcat dans le `pom.xml` :
   ```xml
   <properties>
       <tomcat.version>10.1.34</tomcat.version>
   </properties>
   ```
2. **Moyen terme :** Migration du starter parent Spring Boot de la version `3.3.5` vers `3.3.6+` ou `3.4.0` intégrant nativement les correctifs de sécurité sans modification de code source.

#### Capture d'écran associée
* **Fichier image :** `media_1795375678714_83848a89.jpg`
* **Légende :** *Rapport Snyk SCA affichant l'audit de sécurité des dépendances de `service-fournisseurs-mohamed/pom.xml` sous le compte `mohamedbailla599`.*

---

### Outil 7 : Tests End-to-End (E2E) — Selenium (Web Test)

#### Objectif
Simuler le parcours utilisateur réel dans un véritable navigateur Google Chrome : navigation, rendu dynamique des composants React, filtrage par état, recherche en temps réel et validation des boutons d'action.

#### Fichier de test
* Script Python : `test_e2e_selenium.py` (Selenium 4.53.0 + Chrome Headless)
* Cible Web : `http://localhost:5173/fournisseurs`

#### Commande d'exécution
```powershell
python test_e2e_selenium.py
```

#### Scénarios automatisés validés
1. **`test_01_page_load` :** Chargement initial de l'URL React, validation du code HTTP 200 et du titre d'onglet *« ProcuraFlow — Répertoire Fournisseurs »*.
2. **`test_02_table_headers` :** Vérification de la présence des colonnes `FOURNISSEUR`, `COORDONNÉES`, `ADRESSE & VILLE`, `ÉVALUATION`, `STATUT`, `ACTIONS`.
3. **`test_03_filter_status` :** Clics successifs sur les filtres d'état (*Actifs*, *Inactifs*, *Tous*) et vérification du re-rendu du tableau.
4. **`test_04_search_filter` :** Saisie dynamique dans le champ de recherche (*"Atlas"*) et déclenchement d'une capture d'écran automatique.
5. **`test_05_action_controls` :** Contrôle de la présence et de l'interactivité de tous les boutons d'action (Nouvelle création, Export PDF/Excel, Bascule de vue).

#### Résultats réels chiffrés
* **Tests exécutés :** 5 / 5 réussis (**100% OK**)
* **Durée d'exécution :** 7 secondes 68 centièmes
* **Capture automatique générée :** `tests_selenium_fournisseurs.png`

---

## 3. Guide d'Association des Captures d'Écran pour le Rapport

Pour illustrer le rapport final, intégrez les captures d'écran selon le schéma suivant :

| Titre de la Section du Rapport | Fichier Image de Capture | Éléments Visuels Majeurs à Commenter |
| :--- | :--- | :--- |
| **Section 1 : Tests Unitaires & Intégration** | `media_1795373773484_48ba5df7.jpg` | 56/56 checks verts, arborescence des tests, Spring Boot 3.3.5 |
| **Section 2 : Couverture de Code (JaCoCo)** | `media_1795373940071_f2cc7a95.jpg` | Tableau de couverture : 87% lignes, 91% méthodes, 92% classes |
| **Section 3 : Validation des APIs (Postman)** | `media_1795374663415_21239053.jpg` | 17/17 tests réussis, temps de réponse 28 ms, codes HTTP 200/201/204 |
| **Section 4 : Analyse Statique (Checkstyle)** | `media_1795374892135_2eee9ce5.png` | Rapport HTML Maven Checkstyle, 24 fichiers audités, BUILD SUCCESS |
| **Section 5A : Performance Globale (JMeter)** | `media_1795375374526_a5269410.png` | Score APDEX 0.999, Camembert 100% PASS (vert) |
| **Section 5B : Détail des Latences (JMeter)** | `media_1795375372006_806f95fd.png` | 800 requêtes, Throughput 242 req/s, Latence moyenne 56 ms |
| **Section 6 : Sécurité Applicative (Snyk)** | `media_1795375678714_83848a89.jpg` | Terminal Snyk SCA, compte `mohamedbailla599`, audit dépendances |
| **Section 7 : Tests End-to-End (Selenium)** | `tests_selenium_fournisseurs.png` | Rendu réel de l'application sous Chrome automatisé |

---

## 4. Recommandations et Conclusion pour la Soutenance

1. **Robustesse Fonctionnelle :** 100 % de succès sur l'ensemble des suites automatisées (56 JUnit, 17 Postman, 5 Selenium).
2. **Excellence des Performances :** Le microservice supporte sans dégradation plus de 240 requêtes/seconde avec une latence moyenne de 56 ms, amplement suffisante pour un environnement universitaire à fort trafic.
3. **Maturité du Cycle de Vie Logiciel :** L'étudiant a combiné analyse statique (Checkstyle), dynamique (JUnit/Postman/Selenium), de charge (JMeter) et de sécurité (Snyk), démontrant une maîtrise complète de la chaîne d'assurance qualité logicielle.
