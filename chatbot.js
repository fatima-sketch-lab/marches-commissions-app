/**
 * SynapBot - Assistant IA Contextuel des Marchés Publics Hospitaliers
 * Moteur de connaissances exhaustif couvrant l'intégralité des données et processus de l'application.
 */

// État du Chatbot
let chatState = {
  isOpen: false,
  isTyping: false,
  messages: [
    {
      sender: "bot",
      text: "👋 Bonjour ! Je suis **SynapBot**, votre assistant expert de la plateforme **SynapMarchés**.<br><br>Je réponds à **toutes vos questions** sur les marchés en cours, les quorums, les suppléants, les offres fournisseurs, les délais, les relances et le cadre juridique.<br><br>Sélectionnez une catégorie ci-dessous ou posez directement votre question !",
      time: "À l'instant",
      suggestions: [
        "📋 Liste des marchés actifs",
        "⚖️ Quorum & Validité juridique",
        "👨‍⚕️ Statut des praticiens & suppléants",
        "🚨 Alertes & Relances WhatsApp",
        "📊 Délais & Goulots d'étranglement",
        "📑 PV officiel & Signature eIDAS"
      ]
    }
  ]
};

// Initialisation du chatbot
function initChatbot() {
  renderChatMessages();
}

// Ouvrir / Fermer la fenêtre du chatbot
function toggleChatbot(forceState = null) {
  const windowEl = document.getElementById("chatbot-window");
  const toggleBtn = document.getElementById("chatbot-toggle-btn");
  if (!windowEl) return;

  chatState.isOpen = forceState !== null ? forceState : !chatState.isOpen;

  if (chatState.isOpen) {
    windowEl.classList.remove("hidden");
    if (toggleBtn) toggleBtn.classList.add("active");
    setTimeout(() => {
      document.getElementById("chatbot-input")?.focus();
    }, 150);
  } else {
    windowEl.classList.add("hidden");
    if (toggleBtn) toggleBtn.classList.remove("active");
  }

  initLucide();
}

// Rendu des messages
function renderChatMessages() {
  const container = document.getElementById("chatbot-messages");
  if (!container) return;

  container.innerHTML = "";

  chatState.messages.forEach((msg, idx) => {
    const msgEl = document.createElement("div");
    msgEl.className = `chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`;

    if (msg.sender === "bot") {
      msgEl.innerHTML = `
        <div class="chat-avatar bot-avatar">
          <i data-lucide="bot"></i>
        </div>
        <div class="chat-bubble-content">
          <div class="chat-bubble bot-bubble">
            <div class="chat-text">${msg.text}</div>
            ${msg.actionBtn ? `
              <div class="chat-action-container mt-2">
                <button class="btn btn-sm btn-primary" onclick="${msg.actionBtn.onClick}">
                  ${msg.actionBtn.label}
                </button>
              </div>
            ` : ''}
          </div>
          <span class="chat-timestamp">${msg.time}</span>
          ${msg.suggestions && msg.suggestions.length > 0 && idx === chatState.messages.length - 1 ? `
            <div class="chat-suggestions-group">
              ${msg.suggestions.map(s => `
                <button class="suggestion-chip" onclick="handleSuggestionClick('${s.replace(/'/g, "\\'")}')">
                  ${s}
                </button>
              `).join("")}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      msgEl.innerHTML = `
        <div class="chat-bubble-content user-content">
          <div class="chat-bubble user-bubble">
            <div class="chat-text">${escapeHtml(msg.text)}</div>
          </div>
          <span class="chat-timestamp">${msg.time}</span>
        </div>
        <div class="chat-avatar user-avatar-small">
          <i data-lucide="user"></i>
        </div>
      `;
    }

    container.appendChild(msgEl);
  });

  if (chatState.isTyping) {
    const typingEl = document.createElement("div");
    typingEl.className = "chat-bubble-row bot-row";
    typingEl.id = "chat-typing-indicator";
    typingEl.innerHTML = `
      <div class="chat-avatar bot-avatar"><i data-lucide="bot"></i></div>
      <div class="chat-bubble bot-bubble typing-bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;
    container.appendChild(typingEl);
  }

  container.scrollTop = container.scrollHeight;
  initLucide();
}

// Envoi d'un message utilisateur
function handleChatSubmit(event) {
  if (event) event.preventDefault();

  const input = document.getElementById("chatbot-input");
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  chatState.messages.push({
    sender: "user",
    text: text,
    time: getCurrentTimeFormatted()
  });

  input.value = "";
  chatState.isTyping = true;
  renderChatMessages();

  setTimeout(() => {
    const botResponse = generateBotAnswer(text);
    chatState.isTyping = false;
    chatState.messages.push({
      sender: "bot",
      text: botResponse.text,
      time: getCurrentTimeFormatted(),
      actionBtn: botResponse.actionBtn || null,
      suggestions: botResponse.suggestions || [
        "Quels sont les marchés urgents ?",
        "État du quorum",
        "Voir le statut des suppléants"
      ]
    });
    renderChatMessages();
  }, 500);
}

function handleSuggestionClick(text) {
  const input = document.getElementById("chatbot-input");
  if (input) input.value = text;
  handleChatSubmit();
}

// ==========================================================================
// MOTEUR DE CONNAISSANCES COMPLET SYNAPMARCHÉS
// ==========================================================================

function generateBotAnswer(userQuery) {
  const q = userQuery.toLowerCase();
  const dossiers = window.state ? window.state.dossiers : INITIAL_DOSSIERS;
  const members = window.state ? window.state.members : INITIAL_MEMBERS;
  const reminders = window.state ? window.state.remindersLog : INITIAL_REMINDERS_LOG;

  // -------------------------------------------------------------
  // THÈME 1 : LISTE & ÉTAT GÉNÉRAL DES MARCHÉS
  // -------------------------------------------------------------
  if (q.includes("liste") || q.includes("tous les marchés") || q.includes("combien de marchés") || q.includes("dossiers actifs") || q.includes("marchés actifs")) {
    const summary = dossiers.map(d => {
      let st = "En vote";
      if (d.status === "PV_GENERATED") st = "✅ PV Validé";
      if (d.status === "RESERVES_ISSUED") st = "⚠️ Réserves";
      return `• <strong>${d.ref}</strong> : ${d.title} (${formatCurrency(d.budget)} HT) &rarr; <em>${st}</em>`;
    }).join("<br>");

    return {
      text: `📁 <strong>Marchés gérés actuellement (${dossiers.length} au total) :</strong><br><br>${summary}<br><br>Total du portefeuille : <strong>${formatCurrency(dossiers.reduce((acc, d) => acc + d.budget, 0))} HT</strong>.`,
      suggestions: ["Quels sont les marchés urgents ?", "Quel est le marché le plus cher ?", "Voir le marché Endoscopie"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 2 : BUDGETS & ASPECTS FINANCIERS
  // -------------------------------------------------------------
  if (q.includes("budget") || q.includes("montant") || q.includes("cher") || q.includes("prix") || q.includes("coût") || q.includes("finance")) {
    const sorted = [...dossiers].sort((a, b) => b.budget - a.budget);
    const maxD = sorted[0];
    const totalBudget = dossiers.reduce((acc, d) => acc + d.budget, 0);

    return {
      text: `💶 <strong>Données Budgétaires des Marchés :</strong><br><br>• <strong>Enveloppe totale active :</strong> ${formatCurrency(totalBudget)} HT<br>• <strong>Marché le plus important :</strong> ${maxD.ref} - ${maxD.title} (<strong>${formatCurrency(maxD.budget)} HT</strong>)<br>• <strong>Échographes 4D :</strong> 285 000 € HT<br>• <strong>Endoscopie 4K :</strong> 340 000 € HT<br>• <strong>Monitorage Réa :</strong> 420 000 € HT<br>• <strong>Robot Chirurgical :</strong> 1 450 000 € HT`,
      suggestions: ["Où en est le Robot Chirurgical ?", "Quels sont les dossiers urgents ?", "Règles de validation"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 3 : DOSSIERS URGENTS & ÉCHÉANCES
  // -------------------------------------------------------------
  if (q.includes("urgent") || q.includes("échéance") || q.includes("retard") || q.includes("date limite") || q.includes("reste combien")) {
    const urgentDossiers = dossiers.filter(d => d.urgent || d.status === "RESERVES_ISSUED" || d.status === "IN_VOTING");
    let listHtml = urgentDossiers.map(d => {
      const qInfo = calculateQuorum ? calculateQuorum(d) : { percentage: 75 };
      return `🚨 <strong>${d.ref}</strong> - ${d.title}<br>&nbsp;&nbsp;↳ <em>Échéance : ${d.deadline}</em> | Quorum : <strong>${qInfo.percentage}%</strong> | Statut : <strong>${d.status}</strong>`;
    }).join("<br><br>");

    return {
      text: `⏰ <strong>Marchés sous surveillance d'échéance :</strong><br><br>${listHtml}<br><br>Le dossier le plus critique est <strong>MAR-2026-0044 (Endoscopie)</strong> avec une réserve en attente et une échéance imminente.`,
      actionBtn: {
        label: "📲 Déclencher les relances automatiques",
        onClick: "simulateFullReminderCycle()"
      },
      suggestions: ["Voir le problème d'Endoscopie", "Relancer par WhatsApp", "Où en est le Dr. Benali ?"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 4 : FOCUS MARCHÉ ENDOSCOPIE (MAR-2026-0044) & RÉSERVES
  // -------------------------------------------------------------
  if (q.includes("endoscopie") || q.includes("0044") || q.includes("réserve") || q.includes("olympus")) {
    const d = dossiers.find(x => x.ref === "MAR-2026-0044") || dossiers[1];
    return {
      text: `🔬 <strong>Point de situation sur MAR-2026-0044 (${d.title}) :</strong><br><br>• <strong>Budget :</strong> 340 000 € HT (3 colonnes vidéo 4K et 12 vidéo-endoscopes).<br>• <strong>Candidat pressenti :</strong> Olympus Medical (EVIS X1).<br>• ⚠️ <strong>Réserve émise par le Dr. Laurent (Pharmacie/Stérilisation) :</strong> Le temps de trempage désinfectant préconisé par Olympus impose un cycle incompatible avec les lave-endoscopes actuels.<br>• ⏳ <strong>Action en cours :</strong> Demande écrite d'engagement formulée au fabricant sous 48h.`,
      actionBtn: {
        label: "Consulter les avis et voter",
        onClick: `openVoteModal('${d.id}')`
      },
      suggestions: ["Comment lever cette réserve ?", "Planifier une réunion si désaccord", "Quels sont les autres marchés ?"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 5 : FOCUS MARCHÉ ÉCHOGRAPHES 4D (MAR-2026-0042)
  // -------------------------------------------------------------
  if (q.includes("échographe") || q.includes("4d") || q.includes("0042") || q.includes("philips")) {
    const d = dossiers.find(x => x.ref === "MAR-2026-0042") || dossiers[0];
    const qInfo = calculateQuorum ? calculateQuorum(d) : { percentage: 100 };
    return {
      text: `🩺 <strong>Marché ${d.ref} : ${d.title}</strong><br><br>• <strong>Bénéficiaire :</strong> Chirurgie Cardiaque & USIC.<br>• <strong>Budget :</strong> 285 000 € HT.<br>• <strong>Offre retenue :</strong> Philips Healthcare (EPIQ CVx Premium).<br>• <strong>Votes enregistrés :</strong><br>&nbsp;&nbsp;✅ M. Dubois (Biomédical) : 19/20<br>&nbsp;&nbsp;✅ Dr. Laurent (Pharmacie) : 18/20<br>&nbsp;&nbsp;✅ Dr. Moreau (au nom du Pr. Benali) : 20/20<br>• <strong>Quorum atteint :</strong> <strong>${qInfo.percentage}%</strong>. Consensus unanime sans réserve !`,
      actionBtn: {
        label: "Voir le dossier technique & votes",
        onClick: `openVoteModal('${d.id}')`
      },
      suggestions: ["Générer le PV officiel", "Pourquoi Philips a été choisi ?", "Statut du Pr. Benali"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 6 : FOCUS ROBOT CHIRURGICAL (MAR-2026-0046)
  // -------------------------------------------------------------
  if (q.includes("robot") || q.includes("chirurgie robot") || q.includes("0046") || q.includes("da vinci")) {
    const d = dossiers.find(x => x.ref === "MAR-2026-0046") || dossiers[3];
    return {
      text: `🤖 <strong>Marché ${d.ref} : ${d.title}</strong><br><br>• <strong>Montant :</strong> 1 450 000 € HT (Location-option d'achat 4 bras double console).<br>• <strong>Candidat :</strong> Intuitive Surgical (da Vinci Xi).<br>• <strong>Échéance :</strong> 28 Octobre 2026 (J+9).<br>• <strong>Avis :</strong> Avis favorable déjà émis par le Dr. Marc Villeneuve (Direction des Achats) avec -18% négociés sur la maintenance.<br>• <strong>En attente :</strong> Évaluations techniques du Pr. Benali et de la cellule biomédicale.`,
      actionBtn: {
        label: "Consulter le dossier Robot",
        onClick: `openVoteModal('${d.id}')`
      },
      suggestions: ["Où en est le Dr. Benali ?", "Règles du quorum", "Quels sont les marchés urgents ?"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 7 : FOCUS MONITORAGE RÉANIMATION (MAR-2026-0038)
  // -------------------------------------------------------------
  if (q.includes("monitorage") || q.includes("réanimation") || q.includes("0038") || q.includes("mindray")) {
    const d = dossiers.find(x => x.ref === "MAR-2026-0038") || dossiers[2];
    return {
      text: `📈 <strong>Marché ${d.ref} : ${d.title}</strong><br><br>• <strong>Montant :</strong> 420 000 € HT (18 moniteurs haute acuité).<br>• <strong>Résultat :</strong> Marché <strong>VALIDÉ À 100% SANS RÉUNION</strong>.<br>• <strong>Attributaire :</strong> Mindray Medical N-Series.<br>• <strong>Gain de temps certifié :</strong> 35 jours calendaires gagnés par rapport à une commission physique.<br>• <strong>Procès-verbal officiel :</strong> Émis sous la référence <code>PV-COMTECH-2026-038</code>.`,
      actionBtn: {
        label: "Consulter le PV officiel signé",
        onClick: "openPvModal('MAR-2026-0038')"
      },
      suggestions: ["Imprimer le PV officiel", "Quels sont les autres marchés ?", "Voir les statistiques"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 8 : QUORUM, CALCUL & SEUILS RÉGLEMENTAIRES
  // -------------------------------------------------------------
  if (q.includes("quorum") || q.includes("voix") || q.includes("seuil") || q.includes("légal") || q.includes("validité")) {
    let details = dossiers.map(d => {
      const qInfo = calculateQuorum ? calculateQuorum(d) : { percentage: 75, reached: true, votesCount: 3, requiredCount: 4 };
      const icon = qInfo.reached ? "✅" : "⚠️";
      return `${icon} <strong>${d.ref}</strong> : <strong>${qInfo.percentage}%</strong> (${qInfo.votesCount}/${qInfo.requiredCount} votants)`;
    }).join("<br>");

    return {
      text: `🏛️ <strong>Règles du Quorum dans SynapMarchés :</strong><br><br>${details}<br><br><strong>Règles légales imposées :</strong><br>1. Le quorum minimum légal est fixé à <strong>75%</strong> des voix délibératives.<br>2. La présence ou représentation par suppléant du <strong>praticien hospitalier référent</strong> et de l'<strong>ingénieur biomédical</strong> est obligatoire.<br>3. Si un membre titulaire est absent, la voix de son suppléant compte à part entière pour le quorum.`,
      suggestions: ["Comment fonctionne la suppléance ?", "Où en est le Dr. Benali ?", "Planifier une réunion d'arbitrage"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 9 : MEMBRES, CHIRURGIENS & SUPPLÉANTS
  // -------------------------------------------------------------
  if (q.includes("benali") || q.includes("moreau") || q.includes("laurent") || q.includes("dubois") || q.includes("lambert") || q.includes("villeneuve") || q.includes("qui vote") || q.includes("membres")) {
    const benali = members.find(m => m.id === "pr_benali");
    const isBenaliAbsent = benali && benali.status === "absent";

    return {
      text: `👥 <strong>Composition de la Commission Technique :</strong><br><br>• <strong>Mme Sophie Lambert :</strong> Responsable Marchés (Présidente administrative)<br>• <strong>Dr. Marc Villeneuve :</strong> Directeur des Achats & CME<br>• <strong>Pr. Karim Benali :</strong> Chef de Chirurgie Cardiaque &rarr; <em>${isBenaliAbsent ? '⚠️ ABSENT (Tokyo) - Suppléante Dr. Claire Moreau active' : '✅ Présent'}</em><br>• <strong>Dr. Hélène Laurent :</strong> Pharmacie & DM (Suppléant : Dr. El Amrani)<br>• <strong>M. Julien Dubois :</strong> Ingénieur Biomédical (Suppléante : Mme Vasseur)`,
      actionBtn: {
        label: isBenaliAbsent ? "Rétablir présence Pr. Benali" : "Simuler absence Pr. Benali",
        onClick: "toggleMemberAbsence('pr_benali')"
      },
      suggestions: ["Déclarer une indisponibilité", "Qui est le suppléant de qui ?", "Quels sont les dossiers urgents ?"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 10 : RELANCES MULTI-CANAUX (SMS, WHATSAPP, EMAIL)
  // -------------------------------------------------------------
  if (q.includes("relance") || q.includes("whatsapp") || q.includes("sms") || q.includes("rappel") || q.includes("notification") || q.includes("escalade")) {
    if (q.includes("lancer") || q.includes("déclencher") || q.includes("envoie")) {
      if (typeof simulateFullReminderCycle === "function") simulateFullReminderCycle();
    }

    return {
      text: `📲 <strong>Protocole d'Escalade Automatique :</strong><br><br>• <strong>Phase 1 (J - 5) :</strong> E-mail doux avec synthèse des offres et lien de consultation.<br>• <strong>Phase 2 (J - 2 / J - 1) :</strong> <strong>SMS & WhatsApp Flash</strong> contenant un <em>magic link</em> permettant aux médecins au bloc opératoire de voter en 1 clic sans mot de passe fastidieux.<br>• <strong>Phase 3 (J - 0 / Retard) :</strong> Alerte escalade au Directeur des Achats + bascule automatique sur le suppléant.<br><br>Dernières relances : <strong>${reminders.length} notifications tracées</strong> dans le journal.`,
      actionBtn: {
        label: "⚡ Simuler un cycle de relance immédiat",
        onClick: "simulateFullReminderCycle()"
      },
      suggestions: ["Voir le journal des relances", "Quels sont les marchés urgents ?", "Quorum des dossiers"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 11 : RÈGLE 'ZÉRO RÉUNION' & CODE DE LA COMMANDE PUBLIQUE
  // -------------------------------------------------------------
  if (q.includes("zéro réunion") || q.includes("sans réunion") || q.includes("réunion") || q.includes("loi") || q.includes("juridique") || q.includes("article") || q.includes("code")) {
    return {
      text: `⚖️ <strong>Fondement Juridique du Mode Asynchrone :</strong><br><br>Conformément aux articles <strong>R.2184-1 et suivants du Code de la commande publique</strong> régissant la dématérialisation des procédures :<br><br>1. <strong>Vote Favorable Unanime :</strong> Si tous les experts et praticiens requis votent Favorable avant l'échéance, la réunion physique est <strong>légalement dispensée</strong>.<br>2. <strong>Procès-verbal scellé :</strong> Un PV officiel d'adjudication technique est généré automatiquement avec les signatures électroniques eIDAS.<br>3. <strong>Arbitrage ciblé :</strong> Une réunion physique ou visio n'est convoquée <strong>qu'en cas de désaccord explicite ou de réserve bloquante</strong>, restreinte à 20-30 minutes sur le seul point de friction.`,
      actionBtn: {
        label: "Voir un modèle de PV certifié",
        onClick: "openPvModal('MAR-2026-0038')"
      },
      suggestions: ["Combien de jours gagnés ?", "Planifier une réunion si désaccord", "Quels sont les marchés urgents ?"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 12 : STATISTIQUES, PERFORMANCE & GOULOTS
  // -------------------------------------------------------------
  if (q.includes("stat") || q.includes("kpi") || q.includes("performance") || q.includes("goulot") || q.includes("qui bloque") || q.includes("délai moyen") || q.includes("gagné")) {
    return {
      text: `📊 <strong>Baromètre d'Efficacité & Analyse des Goulots :</strong><br><br>• <strong>Délai moyen de commission :</strong> <strong>8.5 jours</strong> (auparavant 42 jours &rarr; <strong>-79%</strong> de réduction !)<br>• <strong>Réunions évitées :</strong> <strong>76%</strong> (19 commissions sur 25 validées sans réunion).<br>• <strong>Temps médical économisé :</strong> <strong>124 heures</strong> de médecins et chirurgiens réinvesties dans le soin.<br>• <strong>Goulot identifié :</strong> Les praticiens hospitaliers chirurgiens (temps moyen de réponse : 8.2 jours vs 2.1 jours pour le biomédical). La suppléance automatique après 48h permet de contourner ce blocage.`,
      actionBtn: {
        label: "Exporter le rapport de performance",
        onClick: "exportAnalyticsReport()"
      },
      suggestions: ["Comment réduire les retards des chirurgiens ?", "Voir le tableau de bord", "Quels sont les marchés urgents ?"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 13 : PROCÈS-VERBAUX (PV) & IMPRESSION PDF
  // -------------------------------------------------------------
  if (q.includes("pv") || q.includes("procès-verbal") || q.includes("imprimer") || q.includes("pdf") || q.includes("signature") || q.includes("eidas")) {
    return {
      text: `📑 <strong>Gestion des Procès-Verbaux (PV) :</strong><br><br>• Chaque PV généré comporte l'en-tête officiel de l'établissement hospitalier, le détail des notes techniques, le quorum certifié et les signatures électroniques horodatées RFC 3161.<br>• Le document est <strong>immédiatement imprimable ou exportable en PDF</strong> via <code>Ctrl + P</code> ou le bouton d'impression intégré.<br>• 3 PV sont actuellement archivés au registre légal.`,
      actionBtn: {
        label: "Ouvrir le registre des PV",
        onClick: "switchTab('pv-archive')"
      },
      suggestions: ["Consulter le PV MAR-2026-0038", "Règles juridiques", "Quels sont les marchés urgents ?"]
    };
  }

  // -------------------------------------------------------------
  // THÈME 14 : NOUVEAU MARCHÉ & PUBLICATION
  // -------------------------------------------------------------
  if (q.includes("nouveau marché") || q.includes("créer") || q.includes("ajouter dossier") || q.includes("publier")) {
    return {
      text: `📝 <strong>Lancement d'une Nouvelle Commission Asynchrone :</strong><br><br>Pour publier un marché :<br>1. Indiquez la référence, le matériel et le budget estimé.<br>2. Fixez la date limite de vote (ex: J+10).<br>3. Le système envoie immédiatement les avis de consultation aux collèges requis (Chirurgie, Pharmacie, Biomédical).`,
      actionBtn: {
        label: "➕ Ouvrir le formulaire de publication",
        onClick: "openNewDossierModal()"
      },
      suggestions: ["Quels sont les marchés actuels ?", "Quorum des dossiers"]
    };
  }

  // -------------------------------------------------------------
  // RÉPONSE GÉNÉRALE PAR DÉFAUT
  // -------------------------------------------------------------
  return {
    text: `Je peux vous renseigner sur **n'importe quelle information** de l'application :<br><br>• <strong>Dossiers :</strong> Échographes 4D, Endoscopie, Monitorage Réa, Robot Chirurgical.<br>• <strong>Personnes :</strong> Pr. Benali, Dr. Moreau, Dr. Laurent, M. Dubois, Mme Lambert.<br>• <strong>Processus :</strong> Quorum, suppléants, relances WhatsApp/SMS, validation sans réunion, PV officiels.<br><br><em>Que voulez-vous savoir en détail ?</em>`,
    suggestions: [
      "Quels sont les marchés urgents ?",
      "Calculer le quorum global",
      "Où en est le Dr. Benali ?",
      "Règles pour valider sans réunion",
      "Voir le marché Endoscopie"
    ]
  };
}

// Helpers
function getCurrentTimeFormatted() {
  const now = new Date();
  return now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
