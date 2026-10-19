/**
 * SynapBot - Assistant IA Contextuel des Marchés Publics Hospitaliers
 * Répond aux questions sur les dossiers, quorums, suppléants, délais et règles juridiques.
 */

// État du Chatbot
let chatState = {
  isOpen: false,
  isTyping: false,
  messages: [
    {
      sender: "bot",
      text: "👋 Bonjour ! Je suis **SynapBot**, votre assistant intelligent des commissions de marchés publics hospitaliers.<br><br>Je peux vous renseigner en temps réel sur vos dossiers en cours, l'état des quorums, les suppléants, ou vous assister sur la réglementation (Code de la commande publique).<br><br>Que souhaitez-vous savoir ?",
      time: "À l'instant",
      suggestions: [
        "Quels sont les dossiers urgents ?",
        "Où en est le quorum des Échographes 4D ?",
        "Comment activer le suppléant du Pr. Benali ?",
        "Quelles sont les règles pour valider sans réunion ?",
        "Relancer les membres en retard par WhatsApp"
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
    // Focus sur l'input
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

  // Afficher l'indicateur d'écriture si actif
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

  // Scroll automatique vers le bas
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

  // Ajouter le message utilisateur
  chatState.messages.push({
    sender: "user",
    text: text,
    time: getCurrentTimeFormatted()
  });

  input.value = "";
  chatState.isTyping = true;
  renderChatMessages();

  // Traiter la réponse avec un léger délai pour simulation naturelle
  setTimeout(() => {
    const botResponse = generateBotAnswer(text);
    chatState.isTyping = false;
    chatState.messages.push({
      sender: "bot",
      text: botResponse.text,
      time: getCurrentTimeFormatted(),
      actionBtn: botResponse.actionBtn || null,
      suggestions: botResponse.suggestions || [
        "Quels sont les dossiers urgents ?",
        "Calculer le quorum global",
        "Voir le statut des suppléants"
      ]
    });
    renderChatMessages();
  }, 650);
}

// Clic sur une suggestion
function handleSuggestionClick(text) {
  const input = document.getElementById("chatbot-input");
  if (input) input.value = text;
  handleChatSubmit();
}

// Moteur de Réponses Intelligentes Spécialisé Marchés Publics
function generateBotAnswer(userQuery) {
  const q = userQuery.toLowerCase();
  const dossiers = window.state ? window.state.dossiers : INITIAL_DOSSIERS;
  const members = window.state ? window.state.members : INITIAL_MEMBERS;

  // 1. Questions sur les dossiers urgents / échéances
  if (q.includes("urgent") || q.includes("retard") || q.includes("échéance") || q.includes("date") || q.includes("délai")) {
    const urgentDossiers = dossiers.filter(d => d.urgent || d.status === "IN_VOTING" || d.status === "RESERVES_ISSUED");
    if (urgentDossiers.length > 0) {
      let listHtml = urgentDossiers.map(d => {
        const qInfo = calculateQuorum ? calculateQuorum(d) : { percentage: 75 };
        return `• <strong>${d.ref}</strong> - ${d.title}<br>&nbsp;&nbsp;↳ <em>Échéance : ${d.deadline}</em> | Quorum : <strong>${qInfo.percentage}%</strong>`;
      }).join("<br><br>");

      return {
        text: `Voici les <strong>dossiers nécessitant une attention immédiate</strong> :<br><br>${listHtml}<br><br>💡 <em>Astuce : Vous pouvez relancer les évaluateurs en 1 clic par WhatsApp/SMS.</em>`,
        actionBtn: {
          label: "🚀 Lancer les relances automatiques",
          onClick: "simulateFullReminderCycle()"
        },
        suggestions: ["Relancer les retardataires par WhatsApp", "Voir le dossier Endoscopie", "Où en est le Dr. Benali ?"]
      };
    } else {
      return {
        text: "✅ Excellente nouvelle : aucun dossier n'est actuellement en situation d'urgence ou de retard critique. Toutes les commissions sont à jour !"
      };
    }
  }

  // 2. Questions sur le Quorum
  if (q.includes("quorum") || q.includes("voix") || q.includes("pourcentage") || q.includes("validité")) {
    let quorumDetails = dossiers.map(d => {
      const qInfo = calculateQuorum ? calculateQuorum(d) : { percentage: 75, reached: true, votesCount: 3, requiredCount: 4 };
      const statusIcon = qInfo.reached ? "✅" : "⚠️";
      return `${statusIcon} <strong>${d.ref}</strong> (${d.title.substring(0, 32)}...) : <strong>${qInfo.percentage}%</strong> (${qInfo.votesCount}/${qInfo.requiredCount} voix)`;
    }).join("<br>");

    return {
      text: `📊 <strong>État des Quorums Légaux :</strong><br><br>${quorumDetails}<br><br>🏛️ <strong>Règle juridique :</strong> La commission requiert un quorum d'au moins <strong>75%</strong> des voix, avec obligatoirement la présence ou représentation du praticien hospitalier référent et du biomédical/pharmacien.`,
      suggestions: ["Comment fonctionne la délégation ?", "Quels sont les dossiers validés ?", "Planifier une réunion si désaccord"]
    };
  }

  // 3. Questions sur un médecin ou professeur spécifique (ex: Pr. Benali)
  if (q.includes("benali") || q.includes("moreau") || q.includes("chirurgie")) {
    const benali = members.find(m => m.id === "pr_benali");
    const moreau = members.find(m => m.id === "dr_moreau");
    const isAbsent = benali && benali.status === "absent";

    if (isAbsent) {
      return {
        text: `👨‍⚕️ <strong>Pr. Karim Benali</strong> est actuellement marqué <strong>ABSENT</strong> (${benali.absenceReason || 'Congrès/Bloc'}).<br><br>🔄 <strong>Délégation active :</strong> Ses droits de vote et de signature sont automatiquement transférés au <strong>Dr. Claire Moreau</strong> (Suppléante officielle). Les quorums sont préservés !`,
        actionBtn: {
          label: "Rétablir la présence du Pr. Benali",
          onClick: "toggleMemberAbsence('pr_benali')"
        },
        suggestions: ["Voir tous les suppléants", "Déclarer une indisponibilité", "Quorum des échographes"]
      };
    } else {
      return {
        text: `👨‍⚕️ <strong>Pr. Karim Benali</strong> est actuellement disponible. Sa suppléante officielle agréée est le <strong>Dr. Claire Moreau</strong>.<br><br>Si le Pr. Benali part au bloc opératoire ou en congrès, vous pouvez activer la suppléance en un clic.`,
        actionBtn: {
          label: "Simuler l'absence du Pr. Benali",
          onClick: "toggleMemberAbsence('pr_benali')"
        },
        suggestions: ["Déclarer une indisponibilité", "Quels sont les dossiers urgents ?"]
      };
    }
  }

  // 4. Questions sur la suppléance générale
  if (q.includes("suppléant") || q.includes("remplaçant") || q.includes("absence") || q.includes("délégation")) {
    return {
      text: `🛡️ <strong>Principe de la Gestion des Suppléants dans SynapMarchés :</strong><br><br>1. Chaque praticien titulaire a un <strong>suppléant officiel agréé</strong> dans l'annuaire de la commission.<br>2. Dès qu'un titulaire est déclaré indisponible (ou s'il ne répond pas après 48h), le système <strong>bascule automatiquement les droits de vote</strong> sur le suppléant.<br>3. Une mention d'audit trail eIDAS est inscrite automatiquement dans le Procès-Verbal officiel.<br><br>👉 Aucun marché n'est ainsi bloqué par l'agenda des chirurgiens !`,
      actionBtn: {
        label: "📅 Déclarer une indisponibilité",
        onClick: "openAbsenceDeclarationModal()"
      },
      suggestions: ["Où en est le Dr. Benali ?", "Ouvrir l'annuaire des suppléants", "Voir les PV officiels"]
    };
  }

  // 5. Questions sur la validation sans réunion / Règle asynchrone
  if (q.includes("réunion") || q.includes("sans réunion") || q.includes("pv") || q.includes("procès-verbal") || q.includes("règle")) {
    return {
      text: `⚖️ <strong>Comment fonctionne la validation 'Zéro Réunion' ?</strong><br><br>• <strong>Cas 1 (Consensus unanime) :</strong> Tous les membres votent <em>Favorable</em> avant la date limite ➔ <strong>Aucune réunion n'est organisée</strong>. Le Procès-Verbal certifié est édité et signé électroniquement (gain moyen : 33.5 jours).<br><br>• <strong>Cas 2 (Réserves mineures) :</strong> Le fournisseur répond par écrit sous 48h. Si validé, dispense de réunion maintenue.<br><br>• <strong>Cas 3 (Avis défavorable motivé) :</strong> Une <em>micro-réunion ciblée de 20 min</em> est planifiée automatiquement sur le créneau où le quorum est garanti.`,
      actionBtn: {
        label: "📑 Consulter un Procès-Verbal certifié",
        onClick: "openPvModal('MAR-2026-0038')"
      },
      suggestions: ["Voir les créneaux d'arbitrage", "Combien de jours gagnés ?", "Quels sont les dossiers urgents ?"]
    };
  }

  // 6. Action de relance demandée
  if (q.includes("relance") || q.includes("whatsapp") || q.includes("sms") || q.includes("rappel") || q.includes("notifier")) {
    if (typeof simulateFullReminderCycle === "function") {
      simulateFullReminderCycle();
    }
    return {
      text: `📲 <strong>Relances multi-canaux déclenchées avec succès !</strong><br><br>• <strong>Phase 1 (J-5) :</strong> E-mail récapitulatif doux avec accès dossier.<br>• <strong>Phase 2 (J-2 / J-1) :</strong> Notification WhatsApp & SMS Flash avec lien express sans mot de passe.<br>• <strong>Phase 3 (J-0) :</strong> Alerte escalade transmise à la Direction des Achats.`,
      suggestions: ["Voir le journal des relances", "Quorum des dossiers", "Où en est le Dr. Benali ?"]
    };
  }

  // 7. Questions sur les statistiques & KPI
  if (q.includes("stat") || q.includes("kpi") || q.includes("délai moyen") || q.includes("gagné") || q.includes("performance")) {
    return {
      text: `📈 <strong>Bilan de Performance de la Plateforme :</strong><br><br>• <strong>Délai moyen de commission :</strong> 8.5 jours (au lieu de 42 jours en commissions physiques, soit <strong>-79%</strong> !)<br>• <strong>Taux de réunions évitées :</strong> <strong>76%</strong> (19 commissions sur 25 validées 100% asynchrones).<br>• <strong>Temps médical préservé :</strong> +124 heures de praticiens épargnées pour les soins et le bloc.<br>• <strong>Quorum au 1er tour :</strong> 92% grâce aux suppléants automatiques.`,
      suggestions: ["Voir le tableau de bord", "Quels sont les dossiers urgents ?", "Quorum des échographes"]
    };
  }

  // 8. Questions sur le dossier échographes 4D (MAR-2026-0042)
  if (q.includes("échographe") || q.includes("4d") || q.includes("0042")) {
    const d = dossiers.find(x => x.ref === "MAR-2026-0042") || dossiers[0];
    return {
      text: `🩺 <strong>Marché ${d.ref} : ${d.title}</strong><br><br>• <strong>Service :</strong> ${d.service}<br>• <strong>Budget estimé :</strong> ${formatCurrency(d.budget)} HT<br>• <strong>Offre pressentie :</strong> ${d.selectedOffer || 'Philips Epiq CVx'}<br>• <strong>Statut :</strong> ${d.status === 'PV_GENERATED' ? 'Validé sans réunion (PV émis)' : 'En vote asynchrone'}<br>• <strong>Avis émis :</strong> Biomédical (Favorable), Pharmacie (Favorable), Chirurgie (Favorable via Dr. Moreau).`,
      actionBtn: {
        label: "Consulter les offres et voter",
        onClick: `openVoteModal('${d.id}')`
      },
      suggestions: ["Voir le document CCTP", "Générer le PV officiel", "Quels sont les dossiers urgents ?"]
    };
  }

  // 9. Création d'un nouveau marché
  if (q.includes("nouveau marché") || q.includes("créer") || q.includes("ajouter dossier")) {
    return {
      text: "📝 Vous souhaitez lancer une nouvelle commission asynchrone ? Cliquez ci-dessous pour ouvrir le formulaire de publication de marché :",
      actionBtn: {
        label: "➕ Publier un nouveau marché",
        onClick: "openNewDossierModal()"
      },
      suggestions: ["Quels sont les dossiers actuels ?", "Règles pour valider sans réunion"]
    };
  }

  // Réponse par défaut polyvalente
  return {
    text: `Je peux vous aider à gérer vos commissions d'achats hospitaliers.<br><br>Vous pouvez me demander par exemple :<br>• <em>"Quels sont les dossiers urgents ?"</em><br>• <em>"Où en est le quorum des échographes ?"</em><br>• <em>"Comment activer le suppléant du Pr. Benali ?"</em><br>• <em>"Quelles sont les règles pour valider sans réunion ?"</em><br>• <em>"Lancer les relances WhatsApp"</em>`,
    suggestions: [
      "Quels sont les dossiers urgents ?",
      "Calculer l'état du quorum",
      "Règles pour valider sans réunion",
      "Relancer les membres par WhatsApp"
    ]
  };
}

// Helper time formatter
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
