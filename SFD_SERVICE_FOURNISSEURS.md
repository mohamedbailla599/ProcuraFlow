# Dossier des Spécifications Fonctionnelles Détaillées
**Projet :** ProcuraFlow — Service Gestion des Fournisseurs  
**Système de Gestion d'Achats (Module : `service-fournisseurs-mohamed`)**

---

### Historique document

| version | Auteur | date | validation |
|---|---|---|---|
| **1.0** | Mohamed BAILLA | 13/11/2026 | Validé — Version initiale du SFD (Service Fournisseurs) |
| **2.0** | Mohamed BAILLA | 14/11/2026 | **Validé — Version consolidée mise à jour :** Architecture modulaire ProcuraFlow, layout partagé avec mini-sidebar repliable, catalogue national des 88 villes du Maroc (12 régions), fiche 360° avec identifiants légaux marocains (ICE, RC territorial, IF, TP, RIB), sélection multiple et barre d'actions groupées flottante, en-tête de tableau sticky, copie au survol, carte plein écran et file de toasts empilables. |

---

### Table des matières

1. **Introduction**
   - 1.1. Objectif du document
   - 1.2. Portée du système
   - 1.3. Définitions
2. **Fonctionnalités générales**
3. **Description fonctionnelle détaillée**
   - 3.1. F001 – Tableau de bord KPI, Topbar & Navigation Globale Multi-Services
   - 3.2. F002 – Consultation, Recherche, Filtrage et Tri du Répertoire (avec Table Ergonomique & Copie Rapide)
   - 3.3. F003 – Création et Modification d'un Fournisseur (avec Catalogue National 88 Villes & 12 Régions)
   - 3.4. F004 – Désactivation et Réactivation Logique (Gestion d'Éligibilité)
   - 3.5. F005 – Fiche Fournisseur 360° : Identifiants Légaux & Fiscaux (Maroc), Historique d'Achats & Évaluation
   - 3.6. F006 – Import en Masse de Fournisseurs (CSV / Excel)
   - 3.7. F007 – Export du Catalogue (CSV & Rapport PDF)
   - 3.8. F008 – Cartographie Interactive Leaflet, Mode Plein Écran & Géolocalisation Nationale
   - 3.9. F009 – Palette de Commandes Rapides Universelle (Ctrl+K)
   - 3.10. F010 – Sélection Multiple & Barre d'Actions Groupées Flottante (*Bulk Actions*)
   - 3.11. F011 – Système de Notifications Toasts Empilables & File d'Attente Interactive
4. **Contraintes non fonctionnelles**

---

## 1. Introduction

### 1.1. Objectif du document
Ce document décrit en détail les spécifications fonctionnelles, les règles de gestion, les composantes d'interface utilisateur et les flux de données du module **ProcuraFlow — Service Gestion des Fournisseurs (`service-fournisseurs-mohamed`)** au sein du Système de Gestion d'Achats universitaires. Il intègre l'ensemble des évolutions d'architecture globale, les enrichissements de conformité réglementaire marocaine et les optimisations d'expérience utilisateur (UI/UX) pour guider les équipes de développement, d'intégration inter-services et de recette.

### 1.2. Portée du système
ProcuraFlow est une plateforme Single Page Application (SPA React 18.3 / TypeScript 5.7 / Tailwind CSS 3.4 / Vite 6) structurée autour d'un **layout global partagé multi-modules** fédérant 4 microservices :
- **Fournisseurs** — Mohamed (`:8081` — Spring Boot / PostgreSQL Neon `schema_fournisseurs`)
- **Commandes** — Yassine (`:8082` — Spring Boot / `schema_commandes`)
- **Réceptions** — Ali (`:8083` — Spring Boot / `schema_receptions`)
- **Factures** — Hamza (`:8084` — Node.js / `schema_factures`)

Le module Fournisseurs centralise l'administration complète du référentiel : tableau de bord KPI consolidé, recherche multi-critères, pagination serveur, création/édition de fiches, gestion d'éligibilité logique, import/export massif (CSV/Excel/PDF), cartographie Leaflet en plein écran, fiche administrative 360° (ICE, RC par ville, IF, TP, RIB) et pilotage des commandes inter-services avec résilience réseau.

### 1.3. Définitions

| Terme | Définition |
|---|---|
| **ProcuraFlow (service-fournisseurs)** | Microservice maître du référentiel des partenaires commerciaux (port 8081, schéma `schema_fournisseurs`) exposant l'API REST `/api/fournisseurs` et l'interface de pilotage intégrée. |
| **Fournisseur** | Entité partenaire identifiée en base (`id`, `nom`, `email` unique, `telephone`, `adresse`, `actif`, `createdAt`, `updatedAt`) auprès de laquelle l'organisation engage ses commandes d'achats. |
| **Gestionnaire / Responsable Achats** | Utilisateur métier habilité à gérer le référentiel, vérifier les conformités administratives, activer/suspendre les fournisseurs et ordonnancer les dépenses. |
| **Éligibilité (Statut Actif / Inactif)** | État logique booléen (`actif = true/false`). Un fournisseur suspendu conserve l'intégralité de son historique d'achats sans risque de bris d'intégrité référentielle inter-schémas. |
| **Taux d'éligibilité** | Indicateur KPI global calculé par le serveur : `Math.round((actifs * 100.0) / total)` (0% si base vide). |
| **ICE (Identifiant Commun)** | Numéro national d'immatriculation d'entreprise au Maroc à 15 chiffres, obligatoire sur tout document d'achat et facture. |
| **RC (Registre de Commerce)** | Immatriculation auprès du Tribunal de Commerce compétent, dynamiquement rattaché au tribunal de la ville d'implantation de la société. |
| **IF / TP / RIB** | Identifiant Fiscal (8 chiffres), Taxe Professionnelle (8 chiffres) et Relevé d'Identité Bancaire (24 chiffres normalisés) indispensables au rapprochement 3-voies et au décaissement par le service Factures. |
| **Mini-Sidebar repliable** | Barre de navigation latérale permanente basculant entre mode complet (`w-72`) et mode icônes compact (`w-20`), avec raccourci `Ctrl+B` et mémorisation locale. |
| **Bulk Actions (Actions Groupées)** | Mécanisme de sélection multiple par cases à cocher avec barre flottante contextuelle permettant l'export et l'activation/désactivation en lot. |
| **Catalogue 88 Villes du Maroc** | Référentiel géographique national officiel intégrant les 88 villes principales réparties sur les 12 régions administratives du Royaume avec coordonnées GPS WGS84. |

---

## 2. Fonctionnalités générales

| ID | Nom de la fonctionnalité | Priorité | Description |
|---|---|---|---|
| **F001** | **Tableau de bord KPI, Topbar & Navigation Globale** | Haute | Pilotage par 4 indicateurs en temps réel, navigation globale avec Topbar partagée, mini-sidebar repliable (`Ctrl+B`), contrôle de santé API (`/actuator/health`), mode démo et thème Clair/Sombre. |
| **F002** | **Consultation, Recherche, Filtrage et Tri du Répertoire** | Haute | Consultation paginée serveur (5/10/25/50 lignes), recherche textuelle démultipliée (debounce 250 ms), filtres par statut et par ville (88 villes), tri multicritères, en-tête sticky, sélecteur de taille personnalisé et copie rapide au survol. |
| **F003** | **Création et Modification d'un Fournisseur** | Haute | Modale de saisie structurée avec contrôle d'unicité e-mail, sélecteur du catalogue national des 88 villes marocaines par région, saisie libre et notation qualité (1.0 à 5.0). |
| **F004** | **Désactivation et Réactivation Logique (Éligibilité)** | Haute | Suspension et réactivation sécurisées par modale de confirmation d'intégrité (`PATCH /desactiver`, `PATCH /reactiver`), préservant l'historique complet des commandes. |
| **F005** | **Fiche Fournisseur 360°, Identifiants Légaux & Projections** | Haute | Tiroir latéral 3 onglets : Bons de commande (:8082), Fiche administrative avec identifiants fiscaux marocains (ICE, RC géolocalisé, IF, TP, RIB) et Évaluation qualité/SLA avec export dossier PDF. |
| **F006** | **Import en Masse de Fournisseurs (CSV / Excel)** | Moyenne | Assistant d'import en 3 étapes : glisser-déposer multi-formats, détection automatique de séparateurs, contrôle préventif des doublons en base et en fichier, prévisualisation et exécution par lot. |
| **F007** | **Export du Catalogue (CSV & Rapport PDF)** | Moyenne | Extraction intégrale non paginée du catalogue filtré en fichier CSV (UTF-8 avec BOM) ou en Rapport Catalogue PDF A4 Paysage avec synthèse financière. |
| **F008** | **Cartographie Interactive Leaflet & Plein Écran** | Moyenne | Cartographie des fournisseurs avec clustering, résolution des 88 villes marocaines (dont Guelmim), mode plein écran immersif, marqueurs animés par impulsion et géocodage unitaire Nominatim. |
| **F009** | **Palette de Commandes Rapides Universelle** | Basse | Modale d'accès rapide universelle (`Ctrl+K` / `Cmd+K`) pour rechercher des fournisseurs, exécuter des actions métier, replier la barre latérale ou basculer entre les modules ProcuraFlow. |
| **F010** | **Sélection Multiple & Barre d'Actions Groupées** | Haute | Sélection par cases à cocher individuelles/globales et barre flottante d'actions en lot (export ciblé, activation/désactivation collective). |
| **F011** | **Système de Notifications Toasts Empilables** | Moyenne | File d'attente jusqu'à 4 notifications simultanées avec barre de progression de 4,2 secondes et mise en pause automatique au survol de la souris. |

---

## 3. Description fonctionnelle détaillée

### 3.1. F001 – Tableau de bord KPI, Topbar & Navigation Globale

Cette interface constitue le point d'entrée central du système. Elle intègre le bandeau supérieur de navigation globale (**Topbar**), la barre de navigation latérale rétractable (**Sidebar**) connectant les 4 microservices d'achats, ainsi que les 4 cartes d'indicateurs de performance (**KPIs**) consolidés.

![Figure 1. Interface Tableau de bord KPI, Topbar globale et Sidebar multi-services ProcuraFlow](docs/sfd/images/media_1794512424985_f5de45c4.jpg)
*Figure 1. Interface « Tableau de bord KPI, Topbar globale et Sidebar multi-services ProcuraFlow »*

#### 3.1.1 Composantes
| Entrée | Type | Règles de gestion | Remarques |
|---|---|---|---|
| **Sidebar Multi-Modules** | Barre latérale repliable | Navigation permanente vers les 4 modules : Fournisseurs (:8081), Commandes (:8082), Réceptions (:8083), Factures (:8084). Bouton de bascule en pied de barre ou raccourci `Ctrl+B` (ou `Cmd+B`). | Bascule largeur `w-72` <-> `w-20` avec infobulles automatiques |
| **Topbar Partagée** | En-tête applicatif | Affiche l'intitulé du module actif (« Fournisseurs • Mohamed Bailla (:8081) »), la recherche rapide `Ctrl+K`, le commutateur de thème, le statut API et le mode démo. | Composant `Topbar.tsx` unifié |
| **Indicateur Santé API** | Badge interactif | Affiche « API Fournisseurs connectée » (vert) si `GET /actuator/health` répond 200, sinon « API Déconnectée » (rouge). Clic = actualisation de l'état. | Surveillance proactive du backend :8081 |
| **Bascule Mode Démo** | Bouton bascule | Alterne entre les données réelles du backend Spring Boot et un jeu de données de test en mémoire (16 fournisseurs + commandes associées). | Notification toast à la commutation |
| **Switch Thème** | Interrupteur | Bascule entre Thème Clair et Thème Sombre avec mémorisation dans `localStorage['procuraflow-theme']` et respect strict des contrastes WCAG AA. | Classe CSS `.dark` sur `<html>` |
| **KPI 1 : Total Fournisseurs** | Carte numérique cliquable | Affiche `stats.total` (fournisseurs actifs + inactifs en base). Clic = applique le filtre `statusFilter = 'all'`. | Issu de `GET /api/fournisseurs/stats` |
| **KPI 2 : Fournisseurs Actifs** | Carte numérique cliquable | Affiche `stats.actifs`. Mention : « Commandes autorisées ». Clic = filtre sur les actifs. | Issu de `GET /api/fournisseurs/stats` |
| **KPI 3 : Fournisseurs Inactifs** | Carte numérique cliquable | Affiche `stats.inactifs`. Mention : « Désactivés ». Clic = filtre sur les inactifs. | Issu de `GET /api/fournisseurs/stats` |
| **KPI 4 : Taux d'Éligibilité** | Carte numérique + jauge | Formule : `total == 0 ? 0 : Math.round((actifs * 100.0) / total)`. Jauge dynamique colorée en vert émeraude. | Représente la santé du portefeuille |

---

### 3.2. F002 – Consultation, Recherche, Filtrage et Tri du Répertoire

Cette vue présente le répertoire complet sous forme de tableau interactif hautement optimisé, de grille de cartes ou de cartographie, complétée par une barre de filtres avancée.

![Figure 2. Interface Barre de filtrage avancée, Vue Tableau et Actions Groupées Flottantes](docs/sfd/images/media_1794512421661_ede90ceb.jpg)
*Figure 2. Interface « Barre de filtrage avancée, Vue Tableau, En-tête Sticky et Actions Groupées Flottantes »*

![Figure 2bis. Menu déroulant Ville alimenté par le catalogue national des 88 villes du Maroc](docs/sfd/images/media_1794512948570_2a3d075e.png)
*Figure 2bis. Sélecteur de localisation intégrant l'ensemble des 88 villes et régions marocaines*

#### 3.2.1 Composantes
| Entrée | Type | Règles de gestion | Remarques |
|---|---|---|---|
| **Recherche Multi-Champs** | Champ texte | Recherche instantanée insensible à la casse sur nom, e-mail, téléphone et adresse avec temporisation (*debounce*) de 250 ms. Raccourci focus : `/`. | Échappement des caractères réservés SQL |
| **Filtre Statut** | Contrôle segmenté | 3 onglets avec compteurs numériques dynamiques : Tous, Actifs, Inactifs. | Réinitialise la pagination à la page 1 |
| **Menu Déroulant Ville** | Liste avec recherche | Alimenté par le **catalogue officiel des 88 villes du Maroc** (avec régions administratives) + villes personnalisées en base. | Recherche interne textuelle intégrée |
| **En-tête de Tableau Sticky** | En-tête fixé au scroll | Les colonnes (Fournisseur, Coordonnées, Adresse & Ville, Évaluation, Statut, Actions) restent visibles lors du défilement vertical avec flou d'arrière-plan. | Classe `backdrop-blur-md sticky top-0` |
| **Copie Rapide au Survol** | Action en 1 clic | Une icône de copie apparaît au survol de l'e-mail ou du numéro de téléphone. Clic = copie dans le presse-papiers avec notification toast immédiate. | `navigator.clipboard.writeText()` |
| **Bouton Nouveau Fournisseur Compact** | Bouton icône `+` | Bouton carré ergonomique `h-9 w-9` avec infobulle, optimisé pour éviter tout débordement sur 2 lignes de la barre d'outils. | Ouvre la modale F003 (touche `N`) |
| **Bandeau de Filtres Actifs** | Puces catégorisées | Affiche les critères sélectionnés sous forme de badges colorés par catégorie (Statut en vert/gris, Ville en bleu, Tri en violet) avec bouton de suppression unitaire `✕` et « Réinitialiser tout ». | Visibilité conditionnelle |
| **Barre de Pagination** | Pagination serveur & Sélecteur stylisé | Tailles configurables : 5, 10 (défaut), 25, 50 fournisseurs par page. Sélecteur popover moderne avec flèche rotative, libellés en lignes et coche de sélection active. Boutons Précédent/Suivant désactivés aux bornes et navigation directe par numéro. | API 0-based, UI 1-based |

---

### 3.3. F003 – Création et Modification d'un Fournisseur

Fenêtre modale (`FournisseurModal`) permettant l'enregistrement d'un nouveau partenaire commercial (`POST /api/fournisseurs`) ou la mise à jour d'un profil existant (`PUT /api/fournisseurs/{id}`).

![Figure 3. Modale de Création / Modification avec Sélecteur du Catalogue National des Villes](docs/sfd/images/media_1794513649784_52a91b68.jpg)
*Figure 3. Modale d'Édition — Sélection de ville parmi les 88 villes marocaines avec région et prévisualisation d'enregistrement*

#### 3.3.1 Composantes & Règles de Gestion
- **Raison Sociale / Nom \*** : Obligatoire (1 à 150 caractères), non vide après suppression des espaces de tête/queue (`@NotBlank`). Autofocus à l'ouverture.
- **E-mail Professionnel \*** : Obligatoire, format standardisé (regex RFC 5322), converti en minuscules. Contrôle d'unicité strict avec renvoi de l'erreur `HTTP 409 Conflict` si déjà attribué.
- **Numéro de Téléphone** : Optionnel (max 30 caractères), normalisé en `null` si non renseigné.
- **Sélecteur de Ville du Maroc** :
  - Liste complète des **88 villes officielles du Maroc**, affichant pour chacune son **Nom** et sa **Région administrative** (ex: *Guelmim — Guelmim-Oued Noun*, *Agadir — Souss-Massa*, *Casablanca — Casablanca-Settat*).
  - Champ de recherche instantané filtrant sur le nom de ville, la région ou les alias orthographiques.
  - Option d'ajout direct `+ Utiliser « ... » comme ville` ou saisie libre manuelle via l'option `Autre ville`.
  - **Reconnaissance automatique à l'édition** : le moteur `addressParser.ts` analyse l'adresse existante en base et pré-sélectionne automatiquement la bonne ville marocaine dans le menu déroulant.
- **Adresse Physique** : Rue, zone industrielle, numéro de lot (jusqu'à 2000 caractères).
- **Aperçu d'Enregistrement BD** : Présentation dynamique sous le formulaire de la chaîne exacte qui sera persistée en base (ex: *« Zone Industrielle d'Anza, Agadir »*).
- **Évaluation Qualité / Performance** : Sélecteur interactif de 1.0 à 5.0 (étoiles cliquables + champ numérique au dixième de point) avec seuils contractuels (*Recommandé*, *Conforme*, *Sous surveillance*).

---

### 3.4. F004 – Désactivation et Réactivation Logique (Gestion d'Éligibilité)

Boîte de dialogue de confirmation (`ConfirmModal`) protégeant le changement d'état d'éligibilité d'un fournisseur sans perte de données.

![Figure 4. Modale de Confirmation de Désactivation / Réactivation Logique](docs/sfd/images/image4.png)
*Figure 4. Modale de Confirmation — Préservation de l'intégrité référentielle des commandes*

#### 3.4.1 Traitements & Intégrité
- **Désactivation logique (`PATCH /api/fournisseurs/{id}/desactiver`)** :
  - Le serveur bascule `actif = false` et horodate `updatedAt` en UTC.
  - Le fournisseur est immédiatement retiré des listes d'éligibilité pour les nouvelles commandes.
  - L'avertissement informe explicitement que les bons de commande existants restent intacts.
- **Réactivation logique (`PATCH /api/fournisseurs/{id}/reactiver`)** :
  - Le serveur réactive `actif = true`. Le fournisseur redevient éligible à la passation de commandes.
- **Garantie d'intégrité inter-microservices** :
  - L'instruction SQL `DELETE` physique est bloquée ou redirigée vers une désactivation logique afin de ne jamais provoquer d'orphelins dans `schema_commandes` (:8082).

---

### 3.5. F005 – Fiche Fournisseur 360°, Identifiants Légaux & Projections

Le tiroir latéral (`CommandesDrawer`) centralise la vue complète à 360° du fournisseur à travers une architecture à **3 onglets spécialisés**.

![Figure 5. Fiche Fournisseur 360° — Identifiants Légaux Marocains (ICE, RC, IF, TP, RIB) et Conformité](docs/sfd/images/media_1794515005338_90b6dd8a.jpg)
*Figure 5. Tiroir 360° — Onglet Fiche Administrative avec identifiants fiscaux marocains et conformité marchés publics*

#### 3.5.1 Les 3 Onglets Métier

##### Onglet 1 : Bons de Commande
- Consultation des ordres d'achats émis par le microservice distant `service-commandes-yassine` (:8082).
- Synthèse des 4 KPIs financiers calculés : **Total Commandé**, **Total Engagé**, **Service Fait** (réceptionné/facturé), et **Dernière Commande**.
- Accordéon dépliable détaillant chaque bon de commande avec ses lignes d'articles, quantités, prix unitaires et statuts (`EN_ATTENTE`, `VALIDEE`, `RECEPTIONNEE`, `FACTUREE`, `ANNULEE`).
- **Mode Dégradé Résilient (HTTP 502/503)** : si le service Commandes est arrêté ou injoignable, un bandeau d'information s'affiche et les données administratives restent pleinement accessibles.

##### Onglet 2 : Fiche & Coordonnées (Conformité Légale Maroc)
- **Identifiants Légaux & Fiscaux (Maroc)** :
  - **ICE (Identifiant Commun de l'Entreprise)** : 15 chiffres obligatoires sur devis, bons de commande et factures.
  - **RC (Registre de Commerce)** : Immatriculation **dynamiquement reliée au tribunal de la ville réelle du fournisseur** (ex: *Agadir N° 45916*, *Guelmim N° 45807*, *Casablanca N° 45801*).
  - **IF (Identifiant Fiscal)** : Numéro fiscal DGI à 8 chiffres pour le suivi de la TVA et de l'IS.
  - **TP (Taxe Professionnelle / Patente)** : Rôle d'exercice professionnel (8 chiffres).
  - **RIB Bancaire de Règlement** : Coordonnées bancaires marocaines normalisées (24 chiffres) indispensables au service Factures pour l'exécution des virements.
  - Boutons de copie rapide en un clic pour chaque identifiant légal avec coche verte de confirmation.
- **Conformité Réglementaire & Achats Publics** : indicateurs de régularité fiscale DGI, affiliation CNSS et registre commercial certifié.
- **Coordonnées Officielles de Contact** : e-mail, téléphone et adresse postale avec copie en 1 clic.

##### Onglet 3 : Évaluation & Score 360°
- Notation qualitative interactive sur 5 étoiles modifiable directement avec synchronisation locale.
- Suivi des **SLA contractuels** : taux de respect des délais de livraison, conformité des réceptions et suivi des litiges.

##### Export Dossier PDF
- Bouton « Dossier PDF » en en-tête générant un document A4 officiel (`jspdf`) intégrant la fiche d'identité, les scores de performance, l'historique complet des commandes et l'encadré « VISA DU RESPONSABLE ACHATS ».

---

### 3.6. F006 – Import en Masse de Fournisseurs (CSV / Excel)

Module d'importation assistée en 3 étapes (`ImportModal`) pour le téléversement et l'intégration contrôlée de répertoires volumineux.

![Figure 6. Modale d'Import en Masse de Fournisseurs](docs/sfd/images/image6.png)
*Figure 6. Modale d'Import — Validation ligne à ligne, détection des doublons et sélection par lot*

#### 3.6.1 Étapes & Contrôles
1. **Dépôt & Analyse du Fichier** :
   - Support des formats `.csv`, `.xlsx`, `.xls`, `.tsv`, `.txt`.
   - Détection automatique du délimiteur (virgule, point-virgule, tabulation), suppression du BOM UTF-8 et correspondance automatique des colonnes par alias.
   - Lien de téléchargement d'un fichier modèle conforme `modele_import_fournisseurs.csv`.
2. **Prévisualisation & Validation Stricte** :
   - Pré-chargement de l'ensemble des e-mails du référentiel pour détecter immédiatement les doublons par rapport à la base existante (**Doublon base**).
   - Détection des e-mails redondants au sein même du fichier téléversé (**Doublon fichier**).
   - Contrôle syntaxique du nom et du format e-mail.
   - Sélection par lot : *Sélectionner valides*, *Inverser la sélection*, suppression manuelle de ligne avant import.
3. **Exécution & Bilan d'Intégration** :
   - Traitement séquentiel avec barre de progression en temps réel.
   - Compte-rendu final détaillant les fiches créées avec succès et les rejets éventuels avec motif explicite.

---

### 3.7. F007 – Export du Catalogue (CSV & Rapport PDF)

Menu d'exportation permettant d'extraire la totalité des fournisseurs répondant aux critères de recherche et filtres actifs, sans limitation liée à la pagination.

![Figure 7. Menu d'Export du Catalogue](docs/sfd/images/image7.png)
*Figure 7. Menu déroulant d'exportation avec décompte dynamique du lot filtré*

#### 3.7.1 Spécifications des Formats
- **Export CSV UTF-8 avec BOM** :
  - Génère un fichier `.csv` encodé en UTF-8 précédé du marqueur BOM (`\uFEFF`) garantissant l'ouverture sans altération des caractères accentués sous Microsoft Excel.
  - Colonnes : `ID, Nom, Email, Telephone, Adresse, Statut, DateCreation`.
- **Rapport Catalogue PDF (A4 Paysage)** :
  - Mise en page professionnelle générée côté client via `jspdf` et `jspdf-autotable`.
  - En-tête officiel ProcuraFlow avec date et rappel des filtres appliqués.
  - Synthèse des 4 cartes KPI du lot exporté.
  - Tableau récapitulatif à 9 colonnes intégrant les coordonnées, la note qualité et les montants totaux commandés.

---

### 3.8. F008 – Cartographie Interactive, Mode Plein Écran & Géolocalisation Nationale

Vue cartographique interactive (`FournisseurMap`), propulsée par Leaflet et MarkerCluster, offrant une visualisation spatiale complète des partenaires.

![Figure 8. Vue Carte Géographique Interactive Leaflet avec Plein Écran et Géolocalisation](docs/sfd/images/media_1794513023040_65f26e09.jpg)
*Figure 8. Vue Cartographique — Géolocalisation nationale complète (Guelmim inclus), bouton Plein Écran et contrôles de zoom*

#### 3.8.1 Composantes & Fonctionnalités Avancées
- **Intégration du Référentiel National (88 Villes)** :
  - Reconnaissance automatique des villes des 12 régions marocaines.
  - Résolution des coordonnées des fournisseurs du sud marocain (**Guelmim** à `[28.9882, -10.0574]`), supprimant les erreurs de non-localisation.
- **Bouton Plein Écran (*Toggle Fullscreen*)** :
  - Bouton dédié permettant de basculer la carte en mode immersif sur l'intégralité de la fenêtre du navigateur avec réajustement instantané des tuiles cartographiques.
- **Animations Lumineuses (*Pulse Effect*)** :
  - Animation d'onde concentrique sur les marqueurs actifs matérialisant l'activité du réseau en temps réel.
- **Contrôles de Cadrage & Fonds de Carte** :
  - Bouton « Maroc » (recentrage centré sur le Royaume, zoom 6).
  - Bouton « Tout voir » (ajustement automatique `fitBounds` sur tous les marqueurs).
  - Choix du fond de carte : Auto (synchronisé avec le thème Clair/Sombre), OpenStreetMap Standard ou CartoDB Dark.
- **Sécurité Anti-XSS Stricte** :
  - Construction des infobulles (*popups*) par manipulation DOM native (`document.createElement`, `textContent`) avec exclusion totale de `innerHTML`.
- **Tiroir « Sans localisation » & Géocodage OSM Nominatim** :
  - Panneau latéral recensant les adresses nécessitant un ajustement avec bouton de recherche unitaire OpenStreetMap Nominatim à la demande.

---

### 3.9. F009 – Palette de Commandes Rapides Universelle (Ctrl+K)

Modale d'accès universel au clavier (`CommandPalette`), déclenchable via **`Ctrl + K`** (ou `Cmd + K` sur macOS) ou depuis la Topbar.

![Figure 9. Palette de Commandes Rapides Universelle](docs/sfd/images/image9.png)
*Figure 9. Palette de commandes rapides — Navigation clavier, actions directes et bascule de vues*

#### 3.9.1 Fonctionnalités Clavier
- **Recherche Instantanée en Mémoire** : filtrage temps réel sur les noms de fournisseurs, les actions disponibles, les vues et les filtres de statut ou de ville.
- **Actions Métier Immédiates** :
  - Création de fournisseur (`N`), import en masse, exports CSV et PDF.
  - Bascule du thème Clair/Sombre, commutation Mode Démo / API Réel.
  - **Repli / Dépliement de la barre latérale** (*Toggle Sidebar*).
- **Navigation Multi-Modules** : bascule directe vers les modules Commandes, Réceptions ou Factures.
- **Ergonomie Clavier Complète** : déplacement via Flèches Haut/Bas, sélection avec Entrée, fermeture avec Échap.

---

### 3.10. F010 – Sélection Multiple & Barre d'Actions Groupées (*Bulk Actions*)

Dispositif de traitement en masse intégré au tableau principal des fournisseurs pour optimiser la productivité du gestionnaire.

#### 3.10.1 Spécifications Fonctionnelles
- **Sélection Unitaire & Globale** :
  - Case à cocher présente sur chaque ligne du tableau.
  - Case à cocher maîtresse dans l'en-tête permettant de sélectionner/désélectionner l'ensemble des éléments de la page en un seul clic.
- **Barre d'Actions Flottante (*Floating Action Bar*)** :
  - Apparaît automatiquement en bas de l'écran avec une animation fluide dès qu'au moins un fournisseur est coché.
  - Affiche le compteur exact : *« X fournisseur(s) sélectionné(s) »*.
  - **Exportation Sélective** : boutons pour exporter exclusivement les fiches sélectionnées au format CSV ou PDF.
  - **Activation / Désactivation Collective** : passage en lot de l'état d'éligibilité des fournisseurs cochés.
  - Bouton de désélection globale pour refermer la barre.

---

### 3.11. F011 – Système de Notifications Toasts Empilables & File d'Attente Interactive

Système de retour d'information utilisateur (`Toast.tsx` & `AppContext.tsx`) garantissant une communication visuelle claire après chaque opération.

#### 3.11.1 Spécifications Fonctionnelles
- **File d'Attente Multi-Toasts (*Stackable Queue*)** :
  - Affichage empilé jusqu'à **4 notifications simultanées** dans le coin inférieur droit de l'écran, sans superposition ni blocage de l'interface.
  - Typologies distinctes par couleur et icône : Succès (vert), Erreur (rouge), Information (bleu), Avertissement (ambre).
- **Compte à Rebours Visuel** :
  - Chaque toast intègre une **barre de progression animée** s'écoulant sur 4,2 secondes avant disparition automatique.
- **Mise en Pause Interactive au Survol** :
  - Le compte à rebours se fige automatiquement tant que l'utilisateur survole la notification avec le curseur (`onMouseEnter`), et reprend dès qu'il s'en retire (`onMouseLeave`).
- Bouton de fermeture instantanée `✕` sur chaque notification.

---

## 4. Contraintes non fonctionnelles

### 4.1. Architecture & Stack Technique
- **Architecture Microservices Dockerisée** : Déploiement multi-conteneurs sous réseau bridge `reseau-achats`.
  - Frontend SPA : React 18.3.1, TypeScript 5.7.2, Vite 6.0.7 (port 5173), Tailwind CSS 3.4.17.
  - Backend Fournisseurs : Java 17, Spring Boot 3.3.5 (port 8081), Spring Data JPA, Spring Validation, Actuator.
  - Documentation API : OpenAPI v3 / Swagger UI accessible via `/swagger-ui.html` et `/v3/api-docs`.
- **Routage & Isolation Modulaire** : Routage côté client (`react-router`) isolant strictement le code métier du module Fournisseurs (`modules/fournisseurs/`) des trois autres microservices compagnons.

### 4.2. Base de Données & Intégrité Référentielle
- **Persistance** : PostgreSQL 15-alpine local et PostgreSQL 17 Cloud Neon via pilote `NeonJdbcUrlResolver`.
- **Schéma Dédié** : Schéma réservé `schema_fournisseurs` avec isolation stricte.
- **Interdiction de Suppression Physique** : Préservation absolue de l'historique par désactivation logique (`actif = false`). Aucune contrainte de clé étrangère dure entre schémas microservices pour éviter les blocages de déploiement indépendant.

### 4.3. Performance & Ergonomie
- **Pagination Côté Serveur** : Bornage obligatoire entre 1 et 50 éléments (`@Min(1) @Max(50)`), prévenant toute surcharge mémoire.
- **Découpage de Code & Chargement Paresseux (*Lazy Loading*)** : Chargement asynchrone des bibliothèques lourdes (`leaflet`, `jspdf`, `xlsx`) pour garantir un temps de chargement initial minimal de la SPA.
- **Annulation des Requêtes Obsolètes** : Utilisation systématique de contrôleurs d'abandon (`AbortController`) et de numéros de séquence pour éviter les conflits de concurrence lors des frappes rapides de recherche.

### 4.4. Interopérabilité Inter-Services & Tolérance aux Pannes
- **Appels Synchrones Résilients** : Intégration HTTP vers `service-commandes-yassine` (:8082) via Spring `RestClient` configuré avec des délais de garde stricts (connexion : 3000 ms, lecture : 5000 ms).
- **Mode Dégradé Automatique** : Tolérance aux pannes avec interception des codes HTTP 502/503 et bascule visuelle transparente sans interruption de l'administration des fournisseurs.

### 4.5. Sécurité & Conformité Réglementaire
- **Prévention des Injections SQL** : Requêtes paramétrées Spring Data JPA avec échappement systématique des métacaractères `LIKE` (`\`, `%`, `_`).
- **Prévention des Attaques XSS** : Échappement automatique React et construction DOM manuelle sans `innerHTML` pour les composants Leaflet.
- **Conformité Réglementaire Marocaine** : Prise en charge des identifiants commerciaux nationaux (ICE à 15 chiffres, RC rattaché au tribunal territorial, IF, TP, RIB à 24 chiffres).
- **Accessibilité Universelle** : Respect des directives **WCAG 2.1 niveau AA** (contrastes colorimétriques, gestion ARIA, navigation intégrale au clavier et support du mode `prefers-reduced-motion`).
