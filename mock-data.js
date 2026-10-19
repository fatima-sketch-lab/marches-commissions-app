/**
 * SynapMarchés - Mock Data & State Store
 * Simulation réaliste de marchés publics hospitaliers et commissions d'achat
 */

const INITIAL_MEMBERS = [
  {
    id: "pr_benali",
    name: "Pr. Karim Benali",
    role: "Chef de Service Chirurgie Cardiaque",
    college: "Praticien Hospitalier (Titulaire)",
    email: "k.benali@chu-metropole.fr",
    phone: "+33 6 12 34 56 78",
    avatar: "KB",
    status: "absent", // 'available', 'absent', 'busy_or'
    absenceReason: "En congrès international de cardiologie (Tokyo)",
    suppleantId: "dr_moreau",
    delegationActive: true,
    reputationScore: 72, // score de réactivité
    delaiMoyenJours: 11.2,
    activeVotesCount: 2
  },
  {
    id: "dr_moreau",
    name: "Dr. Claire Moreau",
    role: "Praticien Hospitalier - Chirurgie Vasculaire",
    college: "Praticien Hospitalier (Suppléante)",
    email: "c.moreau@chu-metropole.fr",
    phone: "+33 6 88 44 22 11",
    avatar: "CM",
    status: "available",
    absenceReason: null,
    titulaireId: "pr_benali",
    delegationActive: true,
    reputationScore: 94,
    delaiMoyenJours: 2.8,
    activeVotesCount: 2
  },
  {
    id: "dr_laurent",
    name: "Dr. Hélène Laurent",
    role: "Praticien Hospitalier - Pharmacie & DM",
    college: "Pharmacie & Dispositifs Médicaux",
    email: "h.laurent@chu-metropole.fr",
    phone: "+33 6 45 67 89 01",
    avatar: "HL",
    status: "available",
    absenceReason: null,
    suppleantId: "dr_elamrani",
    delegationActive: false,
    reputationScore: 86,
    delaiMoyenJours: 3.4,
    activeVotesCount: 3
  },
  {
    id: "dr_elamrani",
    name: "Dr. Yassine El Amrani",
    role: "Pharmacien Spécialiste Stérilisation",
    college: "Pharmacie (Suppléant)",
    email: "y.elamrani@chu-metropole.fr",
    phone: "+33 6 77 99 11 33",
    avatar: "YA",
    status: "available",
    absenceReason: null,
    titulaireId: "dr_laurent",
    delegationActive: false,
    reputationScore: 91,
    delaiMoyenJours: 2.5,
    activeVotesCount: 0
  },
  {
    id: "ing_dubois",
    name: "M. Julien Dubois",
    role: "Ingénieur Biomédical Référent Équipements Lourds",
    college: "Ingénierie Biomédicale",
    email: "j.dubois@chu-metropole.fr",
    phone: "+33 6 22 33 44 55",
    avatar: "JD",
    status: "available",
    absenceReason: null,
    suppleantId: "ing_vasseur",
    delegationActive: false,
    reputationScore: 98,
    delaiMoyenJours: 1.9,
    activeVotesCount: 3
  },
  {
    id: "ing_vasseur",
    name: "Mme Élodie Vasseur",
    role: "Ingénieure Biomédicale - Maintenance",
    college: "Ingénierie Biomédicale (Suppléante)",
    email: "e.vasseur@chu-metropole.fr",
    phone: "+33 6 33 11 22 44",
    avatar: "EV",
    status: "available",
    absenceReason: null,
    titulaireId: "ing_dubois",
    delegationActive: false,
    reputationScore: 95,
    delaiMoyenJours: 2.1,
    activeVotesCount: 0
  },
  {
    id: "marches_admin",
    name: "Mme Sophie Lambert",
    role: "Responsable du Service des Marchés Publics",
    college: "Administration & Juridique Marchés",
    email: "s.lambert@chu-metropole.fr",
    phone: "+33 6 99 88 77 66",
    avatar: "SL",
    status: "available",
    absenceReason: null,
    suppleantId: null,
    delegationActive: false,
    reputationScore: 99,
    delaiMoyenJours: 1.0,
    activeVotesCount: 4
  },
  {
    id: "directeur_achats",
    name: "Dr. Marc Villeneuve",
    role: "Directeur des Achats & Équipements Médicaux",
    college: "Direction Générale & CME",
    email: "m.villeneuve@chu-metropole.fr",
    phone: "+33 6 11 55 99 22",
    avatar: "MV",
    status: "available",
    absenceReason: null,
    suppleantId: null,
    delegationActive: false,
    reputationScore: 92,
    delaiMoyenJours: 2.2,
    activeVotesCount: 4
  }
];

const INITIAL_DOSSIERS = [
  {
    id: "dossier_1",
    ref: "MAR-2026-0042",
    title: "Acquisition de 2 Échographes Cardiaques 4D Haute Résolution",
    service: "Chirurgie Cardiaque & USIC",
    budget: 285000,
    publicationDate: "2026-10-10",
    deadline: "2026-10-21", // J-3
    status: "IN_VOTING", // 'IN_VOTING', 'VALIDATED_NO_MEETING', 'MEETING_REQUIRED', 'PV_GENERATED'
    urgent: true,
    description: "Renouvellement urgent de la plateforme échographique interventionnelle pour le bloc opératoire de chirurgie cardiaque.",
    requiredMembers: ["marches_admin", "pr_benali", "dr_laurent", "ing_dubois"],
    votes: [
      {
        memberId: "ing_dubois",
        memberName: "M. Julien Dubois (Biomédical)",
        choice: "FAVORABLE",
        date: "2026-10-12T14:30:00",
        scores: { clinique: 19, ergo: 18, sav: 17 },
        comment: "Conformité électrique et réseau DICOM validée sans réserve sur l'offre Philips Epiq CVx. Garantie constructeur 3 ans confirmée.",
        signatureId: "SIG-EIDAS-9921-BIO"
      },
      {
        memberId: "dr_laurent",
        memberName: "Dr. Hélène Laurent (Pharmacie/DM)",
        choice: "FAVORABLE",
        date: "2026-10-14T09:15:00",
        scores: { clinique: 18, ergo: 17, sav: 18 },
        comment: "Consommables et aiguilles de ponction compatibles avec notre centrale d'achat UniHA. Aucun surcoût de stérilisation.",
        signatureId: "SIG-EIDAS-3382-PHA"
      },
      {
        memberId: "dr_moreau", // suppléant de pr_benali
        memberName: "Dr. Claire Moreau (Suppléante Pr. Benali)",
        choice: "FAVORABLE",
        date: "2026-10-16T16:45:00",
        scores: { clinique: 20, ergo: 19, sav: 16 },
        comment: "Essai clinique concluant en salle hybride. Qualité de reconstruction 4D excellente en temps réel pour plastie mitrale. Vote au nom du Pr. Benali (délégation active).",
        signatureId: "SIG-EIDAS-8812-SURG"
      }
    ],
    documents: [
      { id: "cctp", name: "CCTP_Echographes_v2.pdf", size: "2.4 Mo", type: "pdf", date: "2026-10-08" },
      { id: "comparatif", name: "Matrice_Comparative_Offres.xlsx", size: "1.1 Mo", type: "xlsx", date: "2026-10-10" },
      { id: "biomed", name: "Rapport_Essai_Biomedical.pdf", size: "850 Ko", type: "pdf", date: "2026-10-11" }
    ],
    selectedOffer: "Philips Healthcare - EPIQ CVx Premium",
    reunionEvitee: true,
    joursGagnes: 32
  },
  {
    id: "dossier_2",
    ref: "MAR-2026-0044",
    title: "Renouvellement des Colonnes d'Endoscopie Digestive Vidéo 4K",
    service: "Gastro-Entérologie & Endoscopie",
    budget: 340000,
    publicationDate: "2026-10-05",
    deadline: "2026-10-19", // Demain J-1 (critique)
    status: "RESERVES_ISSUED",
    urgent: true,
    description: "Fourniture de 3 colonnes vidéo 4K et 12 vidéo-endoscopes avec traitement d'image NBI avancé.",
    requiredMembers: ["marches_admin", "pr_benali", "dr_laurent", "ing_dubois"],
    votes: [
      {
        memberId: "ing_dubois",
        memberName: "M. Julien Dubois (Biomédical)",
        choice: "FAVORABLE",
        date: "2026-10-07T11:20:00",
        scores: { clinique: 18, ergo: 17, sav: 19 },
        comment: "Tests de gaine d'insertion et étanchéité conformes.",
        signatureId: "SIG-EIDAS-4412-BIO"
      },
      {
        memberId: "dr_laurent",
        memberName: "Dr. Hélène Laurent (Pharmacie)",
        choice: "RESERVES",
        date: "2026-10-11T17:00:00",
        scores: { clinique: 16, ergo: 15, sav: 14 },
        comment: "RÉSERVE : Le temps de trempage désinfectant préconisé par le soumissionnaire (Olympus) est incompatible avec les cadences du lave-endoscope actuel sans ajout d'un cycle supplémentaire. Demande de validation écrite sous 48h.",
        signatureId: "SIG-EIDAS-7711-PHA"
      }
    ],
    documents: [
      { id: "cctp", name: "CCTP_Endoscopie_4K.pdf", size: "3.1 Mo", type: "pdf", date: "2026-10-05" },
      { id: "comparatif", name: "Offres_Olympus_vs_Fujifilm.pdf", size: "2.8 Mo", type: "pdf", date: "2026-10-06" }
    ],
    selectedOffer: "Olympus Medical EVIS X1",
    reunionEvitee: false,
    joursGagnes: 0
  },
  {
    id: "dossier_3",
    ref: "MAR-2026-0038",
    title: "Centrale de Monitorage Multi-paramétrique Haute Acuité",
    service: "Réanimation Polyvalente & Soins Continus",
    budget: 420000,
    publicationDate: "2026-09-28",
    deadline: "2026-10-15",
    status: "PV_GENERATED",
    urgent: false,
    description: "18 moniteurs de chevet communicants avec transmission télémétrique et passerelle Dossier Patient Informatisé (DPI).",
    requiredMembers: ["marches_admin", "dr_moreau", "dr_laurent", "ing_dubois"],
    votes: [
      {
        memberId: "marches_admin",
        memberName: "Mme Sophie Lambert",
        choice: "FAVORABLE",
        date: "2026-10-02T10:00:00",
        scores: { clinique: 20, ergo: 20, sav: 20 },
        comment: "Procédure administrative irréprochable.",
        signatureId: "SIG-EIDAS-1001-ADM"
      },
      {
        memberId: "dr_moreau",
        memberName: "Dr. Claire Moreau",
        choice: "FAVORABLE",
        date: "2026-10-04T15:20:00",
        scores: { clinique: 19, ergo: 19, sav: 18 },
        comment: "Interface utilisateur très intuitive, alarmes intelligentes réduisant la fatigue sonore en réanimation.",
        signatureId: "SIG-EIDAS-1002-MED"
      },
      {
        memberId: "dr_laurent",
        memberName: "Dr. Hélène Laurent",
        choice: "FAVORABLE",
        date: "2026-10-06T14:10:00",
        scores: { clinique: 18, ergo: 18, sav: 18 },
        comment: "Capteurs de SpO2 et lignes de pression artérielle standardisées avec l'existant.",
        signatureId: "SIG-EIDAS-1003-PHA"
      },
      {
        memberId: "ing_dubois",
        memberName: "M. Julien Dubois",
        choice: "FAVORABLE",
        date: "2026-10-07T09:40:00",
        scores: { clinique: 19, ergo: 18, sav: 19 },
        comment: "Interface HL7 avec le DPI validée par la DSI. Contrat de maintenance niveau 2 inclus.",
        signatureId: "SIG-EIDAS-1004-BIO"
      }
    ],
    documents: [
      { id: "cctp", name: "CCTP_Moniteurs_Rea.pdf", size: "4.2 Mo", type: "pdf", date: "2026-09-28" },
      { id: "pv_signe", name: "PV_Officiel_Signe_MAR-2026-0038.pdf", size: "1.2 Mo", type: "pdf", date: "2026-10-15" }
    ],
    selectedOffer: "Mindray Medical N-Series",
    reunionEvitee: true,
    joursGagnes: 35
  },
  {
    id: "dossier_4",
    ref: "MAR-2026-0046",
    title: "Système de Chirurgie Robot-Assistée de Nouvelle Génération",
    service: "Chirurgie Viscérale, Urologique & Thoracique",
    budget: 1450000,
    publicationDate: "2026-10-14",
    deadline: "2026-10-28", // J+10
    status: "IN_VOTING",
    urgent: false,
    description: "Acquisition en location avec option d'achat d'un robot 4 bras avec double console maître pour formation universitaire.",
    requiredMembers: ["marches_admin", "pr_benali", "dr_laurent", "ing_dubois", "directeur_achats"],
    votes: [
      {
        memberId: "directeur_achats",
        memberName: "Dr. Marc Villeneuve (Dir. Achats)",
        choice: "FAVORABLE",
        date: "2026-10-15T11:00:00",
        scores: { clinique: 19, ergo: 19, sav: 17 },
        comment: "Négociation financière achevée avec une remise de 18% sur le forfait maintenance annuel.",
        signatureId: "SIG-EIDAS-9900-DIR"
      }
    ],
    documents: [
      { id: "cctp", name: "CCTP_Robot_Chirurgical.pdf", size: "6.5 Mo", type: "pdf", date: "2026-10-14" },
      { id: "comparatif", name: "Etude_Medico_Economique.pdf", size: "3.2 Mo", type: "pdf", date: "2026-10-15" }
    ],
    selectedOffer: "Intuitive Surgical da Vinci Xi",
    reunionEvitee: true,
    joursGagnes: 28
  }
];

const INITIAL_REMINDERS_LOG = [
  {
    id: "rem_1",
    destinataire: "Pr. Karim Benali (Chirurgie)",
    dossierRef: "MAR-2026-0044",
    canal: "WhatsApp & SMS",
    niveau: "Niveau 2 (J-2)",
    timestamp: "Aujourd'hui à 08:30",
    status: "Reçu & Ouvert (Lien cliqué)",
    messagePreview: "⚠️ Dr. Benali, votre avis technique pour les Colonnes d'Endoscopie est attendu sous 24h. Votez en 1 clic : synap.chu/v/7812"
  },
  {
    id: "rem_2",
    destinataire: "Dr. Marc Villeneuve (Dir. Achats)",
    dossierRef: "MAR-2026-0044",
    canal: "Alerte Directeur (Escalade)",
    niveau: "Niveau 3 (Échéance)",
    timestamp: "Aujourd'hui à 11:15",
    status: "Transmis & Lu",
    messagePreview: "🚨 Alerte blocage : Délai critique sur MAR-2026-0044. Bascule automatique proposée vers Dr. Moreau (suppléante)."
  },
  {
    id: "rem_3",
    destinataire: "Dr. Hélène Laurent (Pharmacie)",
    dossierRef: "MAR-2026-0046",
    canal: "E-mail Sécurisé",
    niveau: "Niveau 1 (J-5)",
    timestamp: "Hier à 14:00",
    status: "Distribué",
    messagePreview: "Dossier Robot Chirurgical mis à disposition pour consultation asynchrone avant le 28/10."
  },
  {
    id: "rem_4",
    destinataire: "M. Julien Dubois (Biomédical)",
    dossierRef: "MAR-2026-0046",
    canal: "E-mail Sécurisé",
    niveau: "Niveau 1 (J-5)",
    timestamp: "Hier à 14:00",
    status: "Distribué",
    messagePreview: "Dossier Robot Chirurgical : transmission des fiches de sécurité électrique et contraintes fluides."
  }
];

const INITIAL_SMART_SLOTS = [
  {
    id: "slot_1",
    date: "Jeudi 22 Octobre 2026",
    time: "08h15 - 08h45 (30 min)",
    type: "Micro-Visio d'arbitrage ciblée",
    quorumPercent: 100,
    availableMembers: ["Pr. Benali (ou Dr. Moreau)", "Dr. Laurent", "M. Dubois", "Mme Lambert"],
    missingMembers: [],
    recommended: true,
    reason: "Créneau parfait avant les programmes opératoires du matin. Quorum 100% garanti."
  },
  {
    id: "slot_2",
    date: "Vendredi 23 Octobre 2026",
    time: "13h00 - 13h30 (30 min)",
    type: "Réunion Hybride (Salle A + Teams)",
    quorumPercent: 85,
    availableMembers: ["Dr. Moreau (Suppléante)", "Dr. Laurent", "Mme Lambert"],
    missingMembers: ["M. Dubois (représenté par Mme Vasseur)"],
    recommended: false,
    reason: "Quorum suffisant (75% minimum légal respecté avec suppléants)."
  },
  {
    id: "slot_3",
    date: "Lundi 26 Octobre 2026",
    time: "17h30 - 18h00 (30 min)",
    type: "Visio Express",
    quorumPercent: 75,
    availableMembers: ["Dr. Moreau", "M. Dubois", "Mme Lambert"],
    missingMembers: ["Dr. Laurent (garde urgences)"],
    recommended: false,
    reason: "Quorum juste atteint. À privilégier en cas d'urgence absolue."
  }
];

const INITIAL_ARCHIVE_PVS = [
  {
    id: "pv_1",
    pvNumber: "PV-COMTECH-2026-038",
    dossierRef: "MAR-2026-0038",
    marketTitle: "Centrale de Monitorage Multi-paramétrique Haute Acuité",
    validationDate: "15 Octobre 2026",
    meetingType: "Commission 100% Asynchrone (Sans Réunion)",
    signatories: ["Mme Sophie Lambert", "Dr. Claire Moreau", "Dr. Hélène Laurent", "M. Julien Dubois"],
    decision: "Offre Retenue à l'unanimité (Mindray Medical)",
    quorumReached: "100% (4/4 membres votants)",
    daysSaved: 35
  },
  {
    id: "pv_2",
    pvNumber: "PV-COMTECH-2026-035",
    dossierRef: "MAR-2026-0035",
    marketTitle: "Acquisition d'un Scanner Spectral Haute Définition",
    validationDate: "28 Septembre 2026",
    meetingType: "Commission 100% Asynchrone (Sans Réunion)",
    signatories: ["Mme Sophie Lambert", "Pr. Benali", "Dr. Laurent", "M. Dubois"],
    decision: "Offre Retenue avec engagement fournisseur sous 48h (GE Healthcare)",
    quorumReached: "100% (4/4 membres votants)",
    daysSaved: 41
  },
  {
    id: "pv_3",
    pvNumber: "PV-COMTECH-2026-029",
    dossierRef: "MAR-2026-0029",
    marketTitle: "Fourniture de Dispositifs Médicaux d'Ostéosynthèse",
    validationDate: "12 Septembre 2026",
    meetingType: "Micro-Commission d'arbitrage (Visio 20 min)",
    signatories: ["Mme Sophie Lambert", "Dr. Moreau", "Dr. Laurent", "Dr. Villeneuve"],
    decision: "Offre Retenue après levée de réserve technique (Stryker Orthopaedics)",
    quorumReached: "80% (Quorum légal atteint)",
    daysSaved: 19
  }
];
