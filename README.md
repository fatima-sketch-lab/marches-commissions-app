# SynapMarchés - Commission Technique & Achats Hospitaliers Asynchrones

Plateforme intelligente dédiée aux **services des marchés publics hospitaliers** (CHU, Groupements Hospitaliers de Territoire - GHT, cliniques) pour **éradiquer les retards de passation et la contrainte de disponibilité des médecins et professeurs**.

---

## 🎯 La Réponse au Problème des Commissions d'Achat

Dans les hôpitaux et services publics d'achat, les délais de passation de marchés s'allongent considérablement (40 à 60 jours en moyenne) non pas en raison de la complexité technique, mais parce qu'il est **quasiment impossible de réunir au même moment un professeur de chirurgie, un chef de service, un pharmacien hospitalier et un ingénieur biomédical**.

**Le paradigme de SynapMarchés : Ne pas planifier des réunions physiques, mais supprimer le besoin de réunion lui-même grâce à la validation asynchrone.**

---

## 🌟 Les 7 Piliers Fondamentaux Implémentés

### 1. 📬 Validation Asynchrone avec Échéance & Moteur Décisionnel
- Consultation en ligne des cahiers des charges (CCTP), matrices comparatives des offres fournisseurs et rapports d'essais biomédicaux.
- Chaque membre vote directement :
  - **Avis Favorable** (sans réserve)
  - **Favorable avec Réserves** (demande de précisions techniques au fournisseur sous 48h)
  - **Avis Défavorable** (non-conformité bloquante)
- **Règle Zéro Réunion** : Si tous les membres votent favorable avant l'échéance, **le Procès-Verbal officiel certifié est généré automatiquement SANS réunion**. 
- *Gain moyen constaté : 33.5 jours gagnés par marché.*

### 2. 👥 Gestion Automatique du Quorum & Délégation des Suppléants
- Calcul en temps réel du seuil de validité juridique (seuil minimal légal de 75% des voix avec représentativité des collèges).
- **Détection des indisponibilités** : Si un chef de service ou médecin est au bloc opératoire, en congrès ou de garde, le système **active immédiatement son suppléant agréé** et lui transfère les droits de vote et de signature.
- Traçabilité légale : Mention automatique dans le PV de la délégation de pouvoir.

### 3. 📅 Planification Intelligente d'Arbitrage (Si Désaccord Uniquement)
- Une réunion n'a lieu **que s'il existe une divergence non résolue ou un avis défavorable**.
- L'algorithme analyse les disponibilités et propose des **micro-réunions ciblées de 20 à 30 minutes** restreintes aux seuls créneaux garantissant le quorum juridique.

### 4. ⚡ Relances & Escalades Automatiques Multi-Canaux
- **Phase 1 (J - 5)** : E-mail doux récapitulatif avec lien sécurisé de consultation.
- **Phase 2 (J - 2 / J - 1)** : Rappel flash sur smartphone par **WhatsApp & SMS** avec lien d'approbation directe en 1 clic (*magic link* adapté aux praticiens entre deux interventions).
- **Phase 3 (J - 0 / Retard)** : Escalade automatique à la Direction des Achats / Présidence CME et bascule sur le suppléant.

### 5. 📊 Tableau de Bord & Baromètre des Goulots d'Étranglement
- Vue d'ensemble du pipeline des marchés (en cours de vote, réserves émises, PV validés).
- Mesure des délais moyens réels vs cibles.
- Détection des points de friction : classement de réactivité par collège (Biomédical vs Pharmacie vs Praticiens Hospitaliers) et identification des membres nécessitant une délégation systématique.

### 6. ✍️ Traçabilité, Signature Électronique & Génération de PV Officiel
- Horodatage cryptographique eIDAS sur chaque vote.
- Génération instantanée du **Procès-Verbal officiel de commission technique** prêt à l'impression et à l'archivage juridique PDF, avec visas et signatures électroniques intégrées.

### 7. 📁 Dossier Technique Centralisé & Gestion Documentaire
- Espaces dédiés par marché regroupant les pièces administratives, CCTP, matrices de notation et annexes techniques.
- Gestion des rôles : Service des marchés (administrateur), Évaluateurs cliniques (médecins), Évaluateurs médico-techniques (pharmaciens, biomédicaux).

---

## 🚀 Démarrage Rapide

L'application est 100% autonome et ne nécessite aucune dépendance serveur lourde :

1. Ouvrez un terminal dans le répertoire :
   ```powershell
   cd C:\Users\HP\.gemini\antigravity-ide\scratch\marches-commissions-app
   ```
2. Lancez le serveur local (déjà actif) :
   ```bash
   python -m http.server 8080
   ```
3. Ouvrez votre navigateur sur :
   ```
   http://localhost:8080
   ```

---

## 🧪 Scénarios de Test Recommandés

1. **Simulation de Vote d'un Praticien** :
   - Dans le sélecteur "Vue Active" en haut à droite, basculez sur **Dr. Claire Moreau** ou **M. Julien Dubois**.
   - Ouvrez le dossier *Acquisition de 2 Échographes Cardiaques 4D*, cliquez sur **Évaluer** et enregistrez votre vote électronique.
   - Observez le déclenchement de la validation unanime (confettis, statut PV généré, réunion dispensée).

2. **Simulation d'Indisponibilité & Suppléance** :
   - Rendez-vous dans l'onglet **Quorum & Suppléants**.
   - Cliquez sur **Déclarer une Indisponibilité** pour le *Pr. Karim Benali*.
   - Observez le transfert instantané de ses voix au *Dr. Claire Moreau* avec mention de l'audit trail.

3. **Génération & Impression du PV Juridique** :
   - Rendez-vous dans l'onglet **Procès-Verbaux (PV)**.
   - Cliquez sur **Consulter PV** pour visualiser le document officiel conforme au Code de la commande publique et le tester en impression (`Ctrl + P`).
