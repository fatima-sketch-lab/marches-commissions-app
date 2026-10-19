/**
 * SynapMarchés - Main Application Logic
 * Gestion intelligente des commissions de marchés publics hospitaliers
 */

// Global State
let state = {
  currentUser: "marches_admin",
  currentTab: "dashboard",
  dossiers: [],
  members: [],
  remindersLog: [],
  archivePvs: [],
  smartSlots: [],
  activeVotingDossierId: null
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initLucide();
  renderApp();
  checkUrgentDeadlines();
});

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// State Persistence
function loadState() {
  const savedDossiers = localStorage.getItem("synap_dossiers");
  const savedMembers = localStorage.getItem("synap_members");
  const savedReminders = localStorage.getItem("synap_reminders");
  const savedPvs = localStorage.getItem("synap_pvs");

  state.dossiers = savedDossiers ? JSON.parse(savedDossiers) : JSON.parse(JSON.stringify(INITIAL_DOSSIERS));
  state.members = savedMembers ? JSON.parse(savedMembers) : JSON.parse(JSON.stringify(INITIAL_MEMBERS));
  state.remindersLog = savedReminders ? JSON.parse(savedReminders) : JSON.parse(JSON.stringify(INITIAL_REMINDERS_LOG));
  state.archivePvs = savedPvs ? JSON.parse(savedPvs) : JSON.parse(JSON.stringify(INITIAL_ARCHIVE_PVS));
  state.smartSlots = JSON.parse(JSON.stringify(INITIAL_SMART_SLOTS));
}

function saveState() {
  localStorage.setItem("synap_dossiers", JSON.stringify(state.dossiers));
  localStorage.setItem("synap_members", JSON.stringify(state.members));
  localStorage.setItem("synap_reminders", JSON.stringify(state.remindersLog));
  localStorage.setItem("synap_pvs", JSON.stringify(state.archivePvs));
}

// User Switching
function handleUserChange(userId) {
  state.currentUser = userId;
  renderApp();
  showToast(`Vous êtes connecté en tant que : ${getCurrentUserObj().name}`, "info");
}

function getCurrentUserObj() {
  return state.members.find(m => m.id === state.currentUser) || state.members[0];
}

// Tab Switching
function switchTab(tabId) {
  state.currentTab = tabId;
  document.querySelectorAll(".tab-section").forEach(sec => sec.classList.remove("active"));
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(item => item.classList.remove("active"));

  const targetSec = document.getElementById(`section-${tabId}`);
  const targetNav = document.querySelector(`.sidebar-nav .nav-item[data-tab="${tabId}"]`);
  
  if (targetSec) targetSec.classList.add("active");
  if (targetNav) targetNav.classList.add("active");

  initLucide();
}

// Render Master
function renderApp() {
  renderSidebarUser();
  renderUserContextBanner();
  renderDashboardDossiersTable();
  renderDashboardMembersQuick();
  renderDossiersGrid();
  renderQuorumMembersTable();
  renderScheduler();
  renderRemindersTable();
  renderPvArchiveTable();
  updateHeaderBadges();
  initLucide();
}

// Update Top / Sidebar user profile
function renderSidebarUser() {
  const user = getCurrentUserObj();
  const avatarEl = document.getElementById("sidebar-user-avatar");
  const nameEl = document.getElementById("sidebar-user-name");
  const roleEl = document.getElementById("sidebar-user-role");
  const statusEl = document.getElementById("sidebar-user-status");

  if (avatarEl) avatarEl.textContent = user.avatar;
  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role;

  if (statusEl) {
    if (user.status === 'absent') {
      statusEl.innerHTML = `<span class="status-dot" style="background:#f59e0b"></span> En absence (Suppléant actif)`;
      statusEl.style.color = '#fbbf24';
    } else {
      statusEl.innerHTML = `<span class="status-dot online"></span> Disponible pour vote`;
      statusEl.style.color = '#34d399';
    }
  }

  // Update role select box
  const selectEl = document.getElementById("current-user-select");
  if (selectEl && selectEl.value !== state.currentUser) {
    selectEl.value = state.currentUser;
  }
}

// Dynamic Context Banner for Current Role
function renderUserContextBanner() {
  const banner = document.getElementById("user-context-banner");
  if (!banner) return;

  const user = getCurrentUserObj();
  
  // Count dossiers awaiting current user's vote
  const pendingForMe = state.dossiers.filter(d => {
    if (d.status === 'PV_GENERATED') return false;
    // Check if required or represented
    const isRequired = d.requiredMembers.includes(user.id);
    const isSuppleantOfRequired = user.titulaireId && d.requiredMembers.includes(user.titulaireId);
    
    if (!isRequired && !isSuppleantOfRequired) return false;
    
    // Check if already voted
    const hasVoted = d.votes.some(v => v.memberId === user.id || (user.titulaireId && v.memberId === user.titulaireId));
    return !hasVoted;
  });

  if (user.id === "marches_admin" || user.id === "directeur_achats") {
    banner.innerHTML = `
      <div class="banner-context-info">
        <h2>Bienvenue sur l'espace de Supervision des Marchés Publics</h2>
        <p>
          Mode asynchrone actif : <strong>${state.dossiers.filter(d => d.status === 'IN_VOTING').length} marchés</strong> sont en cours de vote.
          Le système gère automatiquement les relances par WhatsApp/SMS et l'attribution des suppléants.
        </p>
      </div>
      <div class="banner-actions">
        <button class="btn btn-outline" onclick="simulateFullReminderCycle()">
          <i data-lucide="bell-ring"></i> Lancer Relances Auto
        </button>
        <button class="btn btn-primary" onclick="openNewDossierModal()">
          <i data-lucide="plus-circle"></i> Nouveau Marché
        </button>
      </div>
    `;
  } else {
    // Medical / Technician evaluator
    banner.innerHTML = `
      <div class="banner-context-info">
        <h2>Espace Évaluateur Technique : ${user.name} (${user.college})</h2>
        <p>
          ${pendingForMe.length > 0 
            ? `Vous avez <strong class="text-warning">${pendingForMe.length} dossier(s) technique(s) en attente de votre avis électronique</strong>. Évitez une réunion physique en votant dès aujourd'hui.`
            : `Félicitations ! Vous êtes à jour dans vos évaluations de commissions techniques. Aucun vote bloquant.`
          }
        </p>
      </div>
      <div class="banner-actions">
        ${pendingForMe.length > 0 
          ? `<button class="btn btn-primary" onclick="openVoteModal('${pendingForMe[0].id}')">
               <i data-lucide="check-square"></i> Évaluer le dossier le plus urgent
             </button>`
          : `<button class="btn btn-outline" onclick="switchTab('dossiers')">
               <i data-lucide="folder"></i> Voir tous les dossiers
             </button>`
        }
      </div>
    `;
  }
}

// Dashboard Table Render
function renderDashboardDossiersTable() {
  const tbody = document.getElementById("dashboard-dossiers-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  state.dossiers.forEach(dossier => {
    const quorum = calculateQuorum(dossier);
    const deadlineInfo = getDeadlineInfo(dossier.deadline);
    const tr = document.createElement("tr");

    // Status label
    let statusBadge = "";
    if (dossier.status === "PV_GENERATED") {
      statusBadge = `<span class="badge-status success"><i data-lucide="file-check"></i> PV Certifié (Sans Réunion)</span>`;
    } else if (dossier.status === "RESERVES_ISSUED") {
      statusBadge = `<span class="badge-status warning"><i data-lucide="alert-triangle"></i> Réserves Émises (En attente réponse)</span>`;
    } else if (dossier.status === "MEETING_REQUIRED") {
      statusBadge = `<span class="badge-status danger"><i data-lucide="users-2"></i> Réunion d'Arbitrage Requise</span>`;
    } else {
      statusBadge = `<span class="badge-status primary"><i data-lucide="clock"></i> En Vote Asynchrone</span>`;
    }

    // Action button based on state
    let actionBtn = "";
    if (dossier.status === "PV_GENERATED") {
      actionBtn = `<button class="btn btn-sm btn-outline" onclick="openPvModal('${dossier.id}')"><i data-lucide="file-text"></i> Voir PV</button>`;
    } else {
      actionBtn = `
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-sm btn-primary" onclick="openVoteModal('${dossier.id}')" title="Consulter et voter">
            <i data-lucide="check-square"></i> Voter
          </button>
          <button class="btn btn-sm btn-outline" onclick="sendDirectReminder('${dossier.id}')" title="Relancer les retardataires">
            <i data-lucide="send"></i>
          </button>
        </div>
      `;
    }

    tr.innerHTML = `
      <td>
        <div class="dossier-cell-title">
          <strong style="cursor:pointer;" onclick="openVoteModal('${dossier.id}')">${dossier.title}</strong>
          <span>${dossier.ref} &bull; ${dossier.service}</span>
        </div>
      </td>
      <td>
        <strong style="font-family:var(--font-mono);">${formatCurrency(dossier.budget)}</strong>
      </td>
      <td>
        <div class="dossier-deadline-countdown ${deadlineInfo.urgencyClass}">
          <i data-lucide="clock"></i>
          <span>${deadlineInfo.text} (${formatDate(dossier.deadline)})</span>
        </div>
      </td>
      <td>
        <div class="table-quorum-meter">
          <div class="table-quorum-label">
            <span>${quorum.votesCount}/${quorum.requiredCount} voix</span>
            <strong class="${quorum.reached ? 'text-success' : 'text-warning'}">${quorum.percentage}%</strong>
          </div>
          <div class="quorum-bar-track">
            <div class="quorum-bar-fill ${quorum.reached ? '' : 'partial'}" style="width: ${quorum.percentage}%;"></div>
          </div>
        </div>
      </td>
      <td>
        <div style="display:flex; gap:0.3rem; align-items:center;">
          ${renderVoteMiniPills(dossier)}
        </div>
      </td>
      <td>${statusBadge}</td>
      <td>${actionBtn}</td>
    `;

    tbody.appendChild(tr);
  });
}

function renderVoteMiniPills(dossier) {
  if (!dossier.votes || dossier.votes.length === 0) {
    return `<span class="text-muted" style="font-size:0.75rem;">En attente de votes</span>`;
  }
  return dossier.votes.map(v => {
    let icon = "check";
    let color = "#10b981";
    let tooltip = `${v.memberName}: Favorable`;
    if (v.choice === "RESERVES") {
      icon = "alert-triangle";
      color = "#f59e0b";
      tooltip = `${v.memberName}: Réserves`;
    } else if (v.choice === "DEFAVORABLE") {
      icon = "x";
      color = "#ef4444";
      tooltip = `${v.memberName}: Défavorable`;
    }
    return `<span title="${tooltip}" style="background:rgba(255,255,255,0.08); border:1px solid ${color}; color:${color}; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px;">
      <i data-lucide="${icon}" style="width:12px; height:12px;"></i>
    </span>`;
  }).join("");
}

// Calculate Quorum for a given dossier
function calculateQuorum(dossier) {
  const requiredCount = dossier.requiredMembers.length;
  let votesCount = 0;

  dossier.requiredMembers.forEach(reqId => {
    // Check if titulaire voted or if suppléant voted in place
    const titulaire = state.members.find(m => m.id === reqId);
    const suppleantId = titulaire ? titulaire.suppleantId : null;
    
    const hasVoted = dossier.votes.some(v => v.memberId === reqId || (suppleantId && v.memberId === suppleantId));
    if (hasVoted) votesCount++;
  });

  const percentage = Math.round((votesCount / requiredCount) * 100);
  const reached = percentage >= 75; // Legal quorum threshold

  return { requiredCount, votesCount, percentage, reached };
}

// Quick Members List for Delegation toggle on dashboard
function renderDashboardMembersQuick() {
  const container = document.getElementById("dashboard-members-quick");
  if (!container) return;

  container.innerHTML = "";

  // Show only members who have a designated suppléant
  const delegableMembers = state.members.filter(m => m.suppleantId);

  delegableMembers.forEach(member => {
    const suppleant = state.members.find(m => m.id === member.suppleantId);
    const isAbsent = member.status === "absent";

    const card = document.createElement("div");
    card.className = `member-card-quick ${isAbsent ? 'absent-mode' : ''}`;

    card.innerHTML = `
      <div class="member-quick-info">
        <div class="member-quick-avatar" style="${isAbsent ? 'background:#b45309;' : ''}">${member.avatar}</div>
        <div class="member-quick-meta">
          <strong>${member.name}</strong>
          <span>${member.role}</span>
          ${isAbsent ? `
            <div class="suppleant-tag-active">
              <i data-lucide="shield-alert" style="width:12px; height:12px;"></i>
              Suppléant actif : <strong>${suppleant ? suppleant.name : 'Attitré'}</strong>
            </div>
          ` : `
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.15rem;">
              Suppléant associé : ${suppleant ? suppleant.name : 'Aucun'}
            </div>
          `}
        </div>
      </div>
      <div>
        <button class="btn btn-sm ${isAbsent ? 'btn-outline' : 'btn-outline'}" onclick="toggleMemberAbsence('${member.id}')">
          <i data-lucide="${isAbsent ? 'user-check' : 'user-x'}"></i>
          ${isAbsent ? 'Marquer Présent' : 'Déclarer Absent'}
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// Toggle Member Absence & Auto-route Delegation
function toggleMemberAbsence(memberId) {
  const member = state.members.find(m => m.id === memberId);
  if (!member) return;

  const suppleant = state.members.find(m => m.id === member.suppleantId);

  if (member.status === "absent") {
    member.status = "available";
    member.delegationActive = false;
    showToast(`Réactivation de la présence pour ${member.name}. Reprise des droits de vote.`, "success");
  } else {
    member.status = "absent";
    member.delegationActive = true;
    showToast(`Délégation activée : Les prérogatives de vote de ${member.name} sont transférées au ${suppleant ? suppleant.name : 'suppléant'}.`, "warning");
    
    // Add an audit log entry in reminders
    state.remindersLog.unshift({
      id: "rem_" + Date.now(),
      destinataire: `${suppleant ? suppleant.name : 'Suppléant'} (Suppléant de ${member.name})`,
      dossierRef: "TOUS MARCHÉS EN COURS",
      canal: "Notification Délégation Immédiate",
      niveau: "Passation automatique",
      timestamp: "À l'instant",
      status: "Actif & Habilité",
      messagePreview: `Délégation légale activée suite à indisponibilité du ${member.name}. Vous êtes invité à émettre les votes techniques pour le quorum.`
    });
  }

  saveState();
  renderApp();
}

// Render Dossiers Tab Cards Grid
function renderDossiersGrid() {
  const container = document.getElementById("dossiers-cards-container");
  if (!container) return;

  container.innerHTML = "";

  state.dossiers.forEach(dossier => {
    const quorum = calculateQuorum(dossier);
    const deadlineInfo = getDeadlineInfo(dossier.deadline);

    let statusPill = "";
    if (dossier.status === "PV_GENERATED") {
      statusPill = `<span class="badge-status success"><i data-lucide="check-circle-2"></i> PV Officiel Émis</span>`;
    } else if (dossier.status === "RESERVES_ISSUED") {
      statusPill = `<span class="badge-status warning"><i data-lucide="alert-triangle"></i> Réserves</span>`;
    } else {
      statusPill = `<span class="badge-status primary"><i data-lucide="clock"></i> En Consultation</span>`;
    }

    const card = document.createElement("div");
    card.className = "dossier-card";

    card.innerHTML = `
      <div>
        <div class="dossier-card-header">
          <span class="dossier-card-ref">${dossier.ref}</span>
          ${statusPill}
        </div>
        <h3 class="dossier-card-title">${dossier.title}</h3>
        <div class="dossier-card-meta">
          <span><i data-lucide="building-2"></i> ${dossier.service}</span>
          <span><i data-lucide="badge-euro"></i> ${formatCurrency(dossier.budget)}</span>
        </div>
        <p class="dossier-card-desc">${dossier.description}</p>
        
        <div class="dossier-card-progress">
          <div class="table-quorum-label" style="margin-bottom:0.4rem;">
            <span>Quorum Légal des Évaluateurs</span>
            <strong class="${quorum.reached ? 'text-success' : 'text-warning'}">${quorum.votesCount}/${quorum.requiredCount} (${quorum.percentage}%)</strong>
          </div>
          <div class="quorum-bar-track">
            <div class="quorum-bar-fill ${quorum.reached ? '' : 'partial'}" style="width:${quorum.percentage}%"></div>
          </div>
        </div>
      </div>

      <div class="dossier-card-footer">
        <div class="dossier-deadline-countdown ${deadlineInfo.urgencyClass}">
          <i data-lucide="calendar"></i>
          <span>${deadlineInfo.text}</span>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-sm btn-outline" onclick="openVoteModal('${dossier.id}', 'consultation')">
            <i data-lucide="file-text"></i> Pièces
          </button>
          <button class="btn btn-sm btn-primary" onclick="openVoteModal('${dossier.id}', 'evaluation')">
            <i data-lucide="check-square"></i> Évaluer
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Filter Dossiers Table in Dashboard
function filterDossiersTable(type, btn) {
  document.querySelectorAll(".filter-group .filter-btn").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");

  const rows = document.querySelectorAll("#dashboard-dossiers-body tr");
  rows.forEach((row, idx) => {
    const dossier = state.dossiers[idx];
    if (!dossier) return;

    if (type === "all") {
      row.style.display = "";
    } else if (type === "urgent") {
      row.style.display = dossier.urgent ? "" : "none";
    } else if (type === "action_required") {
      row.style.display = (dossier.status === "IN_VOTING" || dossier.status === "RESERVES_ISSUED") ? "" : "none";
    } else if (type === "validated") {
      row.style.display = (dossier.status === "PV_GENERATED" || dossier.status === "VALIDATED_NO_MEETING") ? "" : "none";
    }
  });
}

function filterDossiersList() {
  const query = (document.getElementById("search-dossiers")?.value || "").toLowerCase();
  const cards = document.querySelectorAll("#dossiers-cards-container .dossier-card");

  cards.forEach((card, idx) => {
    const d = state.dossiers[idx];
    if (!d) return;
    const match = d.title.toLowerCase().includes(query) || 
                  d.ref.toLowerCase().includes(query) || 
                  d.service.toLowerCase().includes(query);
    card.style.display = match ? "" : "none";
  });
}

// Render Quorum Members Table
function renderQuorumMembersTable() {
  const tbody = document.getElementById("quorum-members-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  // Show titulaires first
  const titulaires = state.members.filter(m => !m.titulaireId);

  titulaires.forEach(member => {
    const suppleant = state.members.find(m => m.id === member.suppleantId);
    const tr = document.createElement("tr");

    const isAbsent = member.status === "absent";

    tr.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <div class="user-avatar" style="width:30px; height:30px; font-size:0.75rem;">${member.avatar}</div>
          <div>
            <strong>${member.name}</strong>
            <div style="font-size:0.725rem; color:var(--text-muted);">${member.role}</div>
          </div>
        </div>
      </td>
      <td>${member.college}</td>
      <td>
        ${isAbsent 
          ? `<span class="badge-status warning"><i data-lucide="user-x"></i> Absent / Congrès</span>`
          : `<span class="badge-status success"><i data-lucide="check"></i> Présent & Disponible</span>`
        }
      </td>
      <td>
        ${suppleant ? `
          <strong>${suppleant.name}</strong>
          <div style="font-size:0.725rem; color:var(--text-muted);">${suppleant.role}</div>
        ` : `<span class="text-muted">Non requis</span>`}
      </td>
      <td>
        ${suppleant ? `
          <span class="badge-status ${isAbsent ? 'primary' : 'info'}">
            ${isAbsent ? 'Actif en votant' : 'En veille'}
          </span>
        ` : '-'}
      </td>
      <td>
        ${isAbsent && suppleant ? `
          <span class="text-success" style="font-weight:600; font-size:0.75rem;">
            <i data-lucide="shield-check"></i> Pouvoir transféré
          </span>
        ` : `
          <span class="text-muted" style="font-size:0.75rem;">Titulaire exerce son droit</span>
        `}
      </td>
      <td>
        ${suppleant ? `
          <button class="btn btn-sm btn-outline" onclick="toggleMemberAbsence('${member.id}')">
            ${isAbsent ? 'Rétablir Présence' : 'Simuler Absence'}
          </button>
        ` : '-'}
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// Render Scheduler for Disagreements / Reservations
function renderScheduler() {
  const select = document.getElementById("scheduler-dossier-select");
  const container = document.getElementById("scheduler-slots-grid");
  if (!select || !container) return;

  // Populate select options
  select.innerHTML = state.dossiers.map(d => `<option value="${d.id}">${d.ref} - ${d.title.substring(0, 35)}...</option>`).join("");

  renderSchedulerSlots(select.value || state.dossiers[0]?.id);
}

function renderSchedulerSlots(dossierId) {
  const container = document.getElementById("scheduler-slots-grid");
  if (!container) return;

  container.innerHTML = "";

  state.smartSlots.forEach(slot => {
    const card = document.createElement("div");
    card.className = `slot-card ${slot.recommended ? 'recommended' : ''}`;

    card.innerHTML = `
      ${slot.recommended ? `<div class="recommended-pill"><i data-lucide="sparkles"></i> Optimal</div>` : ''}
      <div>
        <div class="slot-header">
          <strong>${slot.date}</strong>
          <span>${slot.time}</span>
        </div>
        <p style="font-size:0.775rem; margin-top:0.4rem; color:var(--text-muted);">${slot.reason}</p>
        
        <div class="slot-quorum-stat">
          <span>Quorum Garanti :</span>
          <strong class="text-success">${slot.quorumPercent}% des membres</strong>
        </div>

        <div class="slot-members-list">
          <strong>Membres Disponibles :</strong>
          <p>${slot.availableMembers.join(", ")}</p>
        </div>
      </div>

      <div>
        <button class="btn btn-sm ${slot.recommended ? 'btn-primary' : 'btn-outline'}" style="width:100%;" onclick="confirmMeetingSlot('${slot.id}', '${dossierId}')">
          <i data-lucide="calendar-plus"></i> Convoquer ce Créneau
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  initLucide();
}

function confirmMeetingSlot(slotId, dossierId) {
  const slot = state.smartSlots.find(s => s.id === slotId);
  const dossier = state.dossiers.find(d => d.id === dossierId);

  showToast(`Convocation envoyée pour le ${slot.date} (${slot.time}) avec lien visio sécurisé. Quorum 100% garanti.`, "success");

  // Log in reminders
  state.remindersLog.unshift({
    id: "rem_" + Date.now(),
    destinataire: "Tous membres de la commission",
    dossierRef: dossier ? dossier.ref : "Arbitrage",
    canal: "Convocation Visio Express (30 min)",
    niveau: "Arbitrage Quorum",
    timestamp: "À l'instant",
    status: "Invitation Calendrier Envoyée",
    messagePreview: `Arbitrage ciblé sur le point de blocage. Ordre du jour restreint à 30 minutes.`
  });

  saveState();
  renderRemindersTable();
}

// Render Reminders & Escalations Table
function renderRemindersTable() {
  const tbody = document.getElementById("reminders-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  state.remindersLog.forEach(log => {
    const tr = document.createElement("tr");

    let canalIcon = "mail";
    if (log.canal.includes("WhatsApp") || log.canal.includes("SMS")) canalIcon = "smartphone";
    if (log.canal.includes("Alerte") || log.canal.includes("Escalade")) canalIcon = "alert-octagon";
    if (log.canal.includes("Visio")) canalIcon = "video";

    tr.innerHTML = `
      <td><strong>${log.destinataire}</strong></td>
      <td><span class="dossier-card-ref">${log.dossierRef}</span></td>
      <td>
        <span style="display:inline-flex; align-items:center; gap:0.3rem;">
          <i data-lucide="${canalIcon}" style="width:14px; height:14px;"></i> ${log.canal}
        </span>
      </td>
      <td><span class="badge-status primary">${log.niveau}</span></td>
      <td><small>${log.timestamp}</small></td>
      <td><span class="badge-status success"><i data-lucide="check"></i> ${log.status}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="previewReminderContent('${log.id}')">
          <i data-lucide="eye"></i> Voir Message
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function previewReminderContent(logId) {
  const log = state.remindersLog.find(l => l.id === logId);
  if (!log) return;

  alert(`[Aperçu Canal : ${log.canal}]\n\nDestinataire : ${log.destinataire}\nObjet : Commission Marché ${log.dossierRef}\n\nContenu transmis :\n"${log.messagePreview}"\n\nHorodatage certifié : ${log.timestamp}`);
}

// Simulate full automated reminder cycle
function simulateFullReminderCycle() {
  showToast("Simulation lancée : Analyse automatique des échéances et des retards en cours...", "info");

  setTimeout(() => {
    state.remindersLog.unshift({
      id: "rem_" + Date.now(),
      destinataire: "Pr. Karim Benali (Chirurgie)",
      dossierRef: "MAR-2026-0044",
      canal: "WhatsApp & SMS Flash",
      niveau: "Niveau 2 (J-1 Expirant)",
      timestamp: "À l'instant",
      status: "Délivré avec confirmation de lecture",
      messagePreview: "🚨 Urgent CHU : Le dossier 'Colonnes d'Endoscopie' expire demain à 17h. Cliquez pour valider sans mot de passe : synap.chu/v/9910"
    });

    state.remindersLog.unshift({
      id: "rem_" + (Date.now() + 1),
      destinataire: "M. Julien Dubois (Biomédical)",
      dossierRef: "MAR-2026-0046",
      canal: "Rappel E-mail Automatique",
      niveau: "Niveau 1 (J-5)",
      timestamp: "À l'instant",
      status: "Délivré",
      messagePreview: "Rappel automatique : Évaluation technique du Système Robotique attendue d'ici le 28/10."
    });

    saveState();
    renderRemindersTable();
    showToast("2 relances multi-canaux distribuées avec succès !", "success");
    initLucide();
  }, 700);
}

function sendDirectReminder(target) {
  showToast(`Relance express instantanée envoyée par WhatsApp et SMS !`, "success");
  state.remindersLog.unshift({
    id: "rem_" + Date.now(),
    destinataire: "Membres non votants du dossier",
    dossierRef: typeof target === "string" ? target : "MAR-2026",
    canal: "WhatsApp Express & Magic Link",
    niveau: "Relance Manuelle Prioritaire",
    timestamp: "À l'instant",
    status: "Distribué instantanément",
    messagePreview: "Rappel de commission : votre vote asynchrone est sollicité sous 24h pour clore le marché sans réunion physique."
  });
  saveState();
  renderRemindersTable();
  initLucide();
}

function autoDelegateMember(memberId) {
  toggleMemberAbsence(memberId);
}

// Render PV Archive Table
function renderPvArchiveTable() {
  const tbody = document.getElementById("pv-archive-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  state.archivePvs.forEach(pv => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><strong>${pv.pvNumber}</strong></td>
      <td>
        <span class="dossier-card-ref">${pv.dossierRef}</span>
        <div style="font-size:0.8rem; margin-top:0.2rem;">${pv.marketTitle}</div>
      </td>
      <td>${pv.validationDate}</td>
      <td><span class="badge-status primary">${pv.meetingType}</span></td>
      <td>
        <div style="font-size:0.775rem;">${pv.signatories.join(", ")}</div>
      </td>
      <td><strong class="text-success">${pv.decision}</strong></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openPvModal('${pv.dossierRef}')">
          <i data-lucide="file-text"></i> Consulter PV
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ================= MODAL VOTE & CONSULTATION ASYNCHRONE =================

function openVoteModal(dossierId, defaultSubtab = "evaluation") {
  state.activeVotingDossierId = dossierId;
  const dossier = state.dossiers.find(d => d.id === dossierId);
  if (!dossier) return;

  const modal = document.getElementById("vote-modal");
  document.getElementById("modal-dossier-ref").textContent = dossier.ref;
  document.getElementById("modal-dossier-title").textContent = dossier.title;

  // Set current voter banner
  const voter = getCurrentUserObj();
  const isSuppleant = voter.titulaireId ? true : false;
  const titulaire = isSuppleant ? state.members.find(m => m.id === voter.titulaireId) : null;

  document.getElementById("voter-current-name").innerHTML = isSuppleant 
    ? `${voter.name} <span class="badge-status warning">Par délégation de ${titulaire ? titulaire.name : 'Titulaire'}</span>`
    : `${voter.name}`;

  // Fill preview document
  previewDocument("cctp");

  // Render Quorum Subtab summary & timeline
  renderModalQuorumTab(dossier);

  // Switch to requested subtab
  const tabBtn = document.querySelector(`.modal-tab-btn[onclick*="${defaultSubtab}"]`);
  switchModalTab(defaultSubtab, tabBtn);

  modal.classList.remove("hidden");
  initLucide();
}

function closeVoteModal() {
  document.getElementById("vote-modal").classList.add("hidden");
}

function switchModalTab(subtabId, btn) {
  document.querySelectorAll(".modal-tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".modal-subtab").forEach(tab => tab.classList.remove("active"));

  if (btn) btn.classList.add("active");
  const target = document.getElementById(`modal-tab-${subtabId}`);
  if (target) target.classList.add("active");

  initLucide();
}

// Document Preview within modal
function previewDocument(docType) {
  const previewBox = document.getElementById("preview-content-box");
  const titleBox = document.getElementById("preview-filename");

  // Highlight active doc item
  document.querySelectorAll("#modal-doc-list li").forEach(li => li.classList.remove("active"));

  if (docType === "cctp") {
    titleBox.textContent = "CCTP_Echographes_v2.pdf - Extrait Spécifications Techniques";
    previewBox.innerHTML = `
      <div style="background:#131d35; padding:1.25rem; border-radius:8px; border:1px solid #1e293b; color:#cbd5e1;">
        <h4 style="color:#38bdf8; margin-bottom:0.75rem;">Extrait du Cahier des Clauses Techniques Particulières (CCTP)</h4>
        <p><strong>Article 4.1 - Imagerie Cardiaque 4D :</strong> L'échographe doit impérativement disposer d'une sonde transœsophagienne matricielle volumique temps réel (reconstruction en continu &gt; 35 volumes/seconde).</p>
        <p style="margin-top:0.5rem;"><strong>Article 4.2 - Ergonomie :</strong> Écran OLED 24 pouces monté sur bras articulé, démarrage rapide en veille &lt; 15 secondes pour les arrêts cardiaques en USIC.</p>
        <p style="margin-top:0.5rem;"><strong>Article 5 - Maintenance :</strong> Engagement sur un délai d'intervention &lt; 4h en salle d'opération et mise à disposition d'un équipement relais sous 24h ouvrées.</p>
      </div>
    `;
  } else if (docType === "comparatif") {
    titleBox.textContent = "Matrice_Comparative_Offres.xlsx - Synthèse Offre Retenue";
    previewBox.innerHTML = `
      <div style="background:#131d35; padding:1.25rem; border-radius:8px; border:1px solid #1e293b; color:#cbd5e1;">
        <h4 style="color:#34d399; margin-bottom:0.75rem;">Tableau Comparatif des Candidatures Reçues</h4>
        <table class="custom-table" style="font-size:0.775rem;">
          <thead>
            <tr><th>Candidat</th><th>Prix Total (€ HT)</th><th>Note Technique (/60)</th><th>Garantie</th><th>Classement</th></tr>
          </thead>
          <tbody>
            <tr style="background:rgba(16,185,129,0.1);">
              <td><strong>Philips Healthcare (Offre A)</strong></td>
              <td>285 000 €</td>
              <td><strong>58.5 / 60</strong></td>
              <td>3 ans tout compris</td>
              <td><span class="badge-status success">1er (Recommandé)</span></td>
            </tr>
            <tr>
              <td>GE Healthcare (Offre B)</td>
              <td>298 000 €</td>
              <td>54.0 / 60</td>
              <td>2 ans</td>
              <td>2ème</td>
            </tr>
            <tr>
              <td>Siemens Healthineers (Offre C)</td>
              <td>310 000 €</td>
              <td>51.2 / 60</td>
              <td>2 ans</td>
              <td>3ème</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  } else {
    titleBox.textContent = "Rapport_Essai_Biomedical.pdf - Essais sur Banc Clinique";
    previewBox.innerHTML = `
      <div style="background:#131d35; padding:1.25rem; border-radius:8px; border:1px solid #1e293b; color:#cbd5e1;">
        <h4 style="color:#fbbf24; margin-bottom:0.75rem;">Conclusions de la Cellule Biomédicale</h4>
        <p>&bull; <strong>Sécurité électrique :</strong> Conforme norme NF EN 60601-1 (courants de fuite conformes au bloc opératoire).</p>
        <p>&bull; <strong>Compatibilité PACS/DICOM :</strong> Connexion réussie avec le serveur d'imagerie centralisé du CHU.</p>
        <p>&bull; <strong>Avis Biomédical :</strong> Favorable sans aucune réserve bloquante.</p>
      </div>
    `;
  }
}

function renderModalQuorumTab(dossier) {
  const summaryBox = document.getElementById("modal-quorum-summary");
  const timelineBox = document.getElementById("modal-reviews-timeline");

  const quorum = calculateQuorum(dossier);

  summaryBox.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h3 style="margin-bottom:0.25rem;">Quorum Atteint à ${quorum.percentage}% (${quorum.votesCount}/${quorum.requiredCount} votants légaux)</h3>
        <p style="font-size:0.8rem;">Seuil de validité juridique de la commission : <strong>75%</strong> avec représentation obligatoire du collège médical et biomédical.</p>
      </div>
      <span class="badge-status ${quorum.reached ? 'success' : 'warning'}">
        ${quorum.reached ? '<i data-lucide="check"></i> Quorum Juridique Valide' : '<i data-lucide="alert-circle"></i> Quorum Non Atteint'}
      </span>
    </div>
  `;

  timelineBox.innerHTML = "";
  if (!dossier.votes || dossier.votes.length === 0) {
    timelineBox.innerHTML = `<p class="text-muted">Aucun avis encore enregistré pour ce dossier.</p>`;
    return;
  }

  dossier.votes.forEach(vote => {
    const item = document.createElement("div");
    item.className = "review-item";

    let choiceBadge = "";
    if (vote.choice === "FAVORABLE") {
      choiceBadge = `<span class="badge-status success"><i data-lucide="check-circle-2"></i> Avis Favorable</span>`;
    } else if (vote.choice === "RESERVES") {
      choiceBadge = `<span class="badge-status warning"><i data-lucide="alert-triangle"></i> Réserves Émises</span>`;
    } else {
      choiceBadge = `<span class="badge-status danger"><i data-lucide="x-circle"></i> Avis Défavorable</span>`;
    }

    item.innerHTML = `
      <div class="review-item-header">
        <span class="review-item-author">${vote.memberName}</span>
        ${choiceBadge}
      </div>
      <div style="font-size:0.75rem; color:var(--text-dim);">${formatDateTime(vote.date)}</div>
      <p class="review-item-comment">"${vote.comment || 'Aucun commentaire textuel'}"</p>
      <div class="review-item-signature">
        <i data-lucide="key"></i> Signature électronique certifiée eIDAS : ${vote.signatureId}
      </div>
    `;

    timelineBox.appendChild(item);
  });
}

// Submit Member Vote
function submitMemberVote(event) {
  event.preventDefault();

  const dossier = state.dossiers.find(d => d.id === state.activeVotingDossierId);
  if (!dossier) return;

  const user = getCurrentUserObj();
  const choice = document.querySelector('input[name="vote_choice"]:checked')?.value || "FAVORABLE";
  const comment = document.getElementById("vote-comment")?.value || "";
  const scoreClinique = parseInt(document.getElementById("crit-clinique")?.value) || 18;
  const scoreErgo = parseInt(document.getElementById("crit-ergo")?.value) || 18;
  const scoreSav = parseInt(document.getElementById("crit-sav")?.value) || 18;

  // Generate unique electronic signature hash
  const signatureId = `SIG-EIDAS-${Math.floor(1000 + Math.random() * 9000)}-${user.avatar}`;

  // Check if voter is titulaire or suppléant
  const isSuppleant = !!user.titulaireId;
  const voterLabel = isSuppleant 
    ? `${user.name} (Suppléante au nom du ${state.members.find(m => m.id === user.titulaireId)?.name || 'Titulaire'})`
    : `${user.name} (${user.college})`;

  // Remove previous vote if any
  dossier.votes = dossier.votes.filter(v => v.memberId !== user.id && (!user.titulaireId || v.memberId !== user.titulaireId));

  // Add new vote
  dossier.votes.push({
    memberId: user.id,
    memberName: voterLabel,
    choice: choice,
    date: new Date().toISOString(),
    scores: { clinique: scoreClinique, ergo: scoreErgo, sav: scoreSav },
    comment: comment,
    signatureId: signatureId
  });

  // Evaluate Decision Engine
  evaluateDossierDecision(dossier);

  saveState();
  closeVoteModal();
  renderApp();
}

// Decision Engine: Determines whether meeting is avoided or PV generated
function evaluateDossierDecision(dossier) {
  const quorum = calculateQuorum(dossier);

  const hasDefavorable = dossier.votes.some(v => v.choice === "DEFAVORABLE");
  const hasReserves = dossier.votes.some(v => v.choice === "RESERVES");

  if (hasDefavorable) {
    dossier.status = "MEETING_REQUIRED";
    showToast(`Avis défavorable enregistré sur ${dossier.ref}. Déclenchement automatique de la planification d'arbitrage.`, "warning");
    switchTab("quorum-planning");
  } else if (hasReserves) {
    dossier.status = "RESERVES_ISSUED";
    showToast(`Avis favorable avec réserves techniques enregistré. Demande d'éclaircissement transmise au fournisseur.`, "info");
  } else if (quorum.reached && !hasDefavorable && !hasReserves) {
    // Consensus reached! 100% Asynchronous Validation
    dossier.status = "PV_GENERATED";
    dossier.reunionEvitee = true;
    dossier.joursGagnes = 30;

    // Trigger celebration
    if (window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // Auto-generate PV in archive
    const newPvNumber = `PV-COMTECH-2026-${Math.floor(100 + Math.random() * 900)}`;
    state.archivePvs.unshift({
      id: "pv_" + Date.now(),
      pvNumber: newPvNumber,
      dossierRef: dossier.ref,
      marketTitle: dossier.title,
      validationDate: "Aujourd'hui (" + formatDate(new Date()) + ")",
      meetingType: "Commission 100% Asynchrone (Sans Réunion)",
      signatories: dossier.votes.map(v => v.memberName),
      decision: `Offre Retenue à l'Unanimité (${dossier.selectedOffer || 'Offre Mieux Disante'})`,
      quorumReached: `${quorum.percentage}% (${quorum.votesCount}/${quorum.requiredCount})`,
      daysSaved: 32
    });

    showToast(`🏆 Consensus Unanime ! Le marché ${dossier.ref} est validé SANS réunion physique. Procès-Verbal officiel généré.`, "success");
  } else {
    showToast(`Vote enregistré avec succès ! Quorum actuel : ${quorum.percentage}%.`, "success");
  }
}

// ================= OFFICIAL PV GENERATOR & VIEWER =================

function openPvModal(dossierIdOrRef) {
  let dossier = null;
  if (dossierIdOrRef) {
    dossier = state.dossiers.find(d => d.id === dossierIdOrRef || d.ref === dossierIdOrRef);
  }
  if (!dossier) dossier = state.dossiers[0];

  const modal = document.getElementById("pv-modal");
  const pvContainer = document.getElementById("pv-document-content");

  const votesHtml = dossier.votes.map(v => `
    <tr>
      <td><strong>${v.memberName}</strong></td>
      <td>
        <span class="badge-status ${v.choice === 'FAVORABLE' ? 'success' : 'warning'}">
          ${v.choice}
        </span>
      </td>
      <td>${v.scores ? `${v.scores.clinique}/20 (Clinique) &bull; ${v.scores.ergo}/20 (Ergo) &bull; ${v.scores.sav}/20 (SAV)` : '20/20'}</td>
      <td><em>"${v.comment || 'Avis technique favorable sans restriction.'}"</em></td>
    </tr>
  `).join("");

  const signaturesHtml = dossier.votes.map(v => `
    <div class="pv-sig-box">
      <strong>Signé électroniquement par :</strong><br>
      ${v.memberName}<br>
      <div class="sig-token">Certificat eIDAS : ${v.signatureId || 'SIG-VALID-9901'}</div>
      <div style="font-size:0.7rem; color:#64748b; margin-top:0.25rem;">Horodatage RFC 3161 conforme</div>
    </div>
  `).join("");

  pvContainer.innerHTML = `
    <div class="pv-official-sheet">
      <div class="pv-header-banner">
        <div>
          <div class="pv-rep-fr">RÉPUBLIQUE FRANÇAISE</div>
          <div style="font-weight:700; font-size:1.1rem; color:#0f172a; margin-top:0.25rem;">CENTRE HOSPITALIER UNIVERSITAIRE MÉTROPOLITAIN</div>
          <div style="font-size:0.85rem; color:#475569;">Direction des Achats & Service des Marchés Publics</div>
        </div>
        <div style="text-align:right; font-size:0.8rem; color:#475569;">
          <div>Réf. Délibération : <strong>${dossier.ref}</strong></div>
          <div>Procédure : Dématérialisée Asynchrone</div>
          <div>Date d'effet : <strong>${formatDate(new Date())}</strong></div>
        </div>
      </div>

      <div class="pv-center-title">
        <h1>PROCÈS-VERBAL DE LA COMMISSION TECHNIQUE DES MARCHÉS</h1>
        <p style="font-size:0.9rem; margin-top:0.35rem; color:#334155;">
          Validation d'évaluation technique par voie électronique asynchrone (Conforme Code de la Commande Publique Art. R.2184-1 s.)
        </p>
      </div>

      <div style="margin:1.25rem 0; font-size:0.875rem;">
        <p><strong>Objet du Marché :</strong> ${dossier.title}</p>
        <p><strong>Service Demandeur :</strong> ${dossier.service}</p>
        <p><strong>Montant Estimatif :</strong> ${formatCurrency(dossier.budget)} HT</p>
        <p><strong>Candidature Retenue :</strong> <strong>${dossier.selectedOffer || 'Offre Conforme Retenue'}</strong></p>
      </div>

      <h3 style="color:#0f172a; font-size:1rem; margin-top:1.5rem; border-bottom:1px solid #cbd5e1; padding-bottom:0.35rem;">
        1. CONSTATATION DU QUORUM & AVIS DES ÉVALUATEURS
      </h3>
      <table class="pv-details-table">
        <thead>
          <tr>
            <th>Évaluateur / Collège</th>
            <th>Sens de l'Avis</th>
            <th>Notes Techniques</th>
            <th>Remarques & Réserves</th>
          </tr>
        </thead>
        <tbody>
          ${votesHtml}
        </tbody>
      </table>

      <h3 style="color:#0f172a; font-size:1rem; margin-top:1.5rem; border-bottom:1px solid #cbd5e1; padding-bottom:0.35rem;">
        2. DÉCISION DE LA COMMISSION
      </h3>
      <p style="font-size:0.875rem; margin-top:0.5rem; line-height:1.6;">
        Considérant la consultation complète du dossier technique par voie asynchrone ;<br>
        Considérant que le quorum juridique requis est atteint et certifié conforme ;<br>
        Considérant qu'aucun avis défavorable n'a été émis par les praticiens hospitaliers et experts techniques :<br>
        <strong>LA COMMISSION ÉMET UN AVIS FAVORABLE DÉFINITIF</strong> à la signature du marché au profit de l'offre économiquement la plus avantageuse.
      </p>

      <div class="pv-signatures-grid">
        ${signaturesHtml}
      </div>

      <div style="margin-top:2.5rem; text-align:right; font-size:0.8rem; color:#64748b;">
        Document scellé cryptographiquement par le système SynapMarchés &bull; Chu Metropole &bull; Page 1/1
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  initLucide();
}

function closePvModal() {
  document.getElementById("pv-modal").classList.add("hidden");
}

// ================= NEW DOSSIER CREATION =================

function openNewDossierModal() {
  document.getElementById("new-dossier-modal").classList.remove("hidden");
}

function closeNewDossierModal() {
  document.getElementById("new-dossier-modal").classList.add("hidden");
}

function handleCreateNewDossier(event) {
  event.preventDefault();

  const ref = document.getElementById("new-ref").value;
  const title = document.getElementById("new-title").value;
  const budget = parseFloat(document.getElementById("new-budget").value) || 100000;
  const deadline = document.getElementById("new-deadline").value || "2026-10-30";
  const service = document.getElementById("new-service").value;

  const newDossier = {
    id: "dossier_" + Date.now(),
    ref: ref,
    title: title,
    service: service,
    budget: budget,
    publicationDate: new Date().toISOString().split("T")[0],
    deadline: deadline,
    status: "IN_VOTING",
    urgent: false,
    description: "Procédure de commission dématérialisée pour le service " + service,
    requiredMembers: ["marches_admin", "pr_benali", "dr_laurent", "ing_dubois"],
    votes: [],
    documents: [
      { id: "cctp", name: "CCTP_Validation.pdf", size: "2.1 Mo", type: "pdf", date: "Aujourd'hui" }
    ],
    selectedOffer: "Offre en cours de sélection",
    reunionEvitee: true,
    joursGagnes: 0
  };

  state.dossiers.unshift(newDossier);

  // Trigger notification in reminders
  state.remindersLog.unshift({
    id: "rem_" + Date.now(),
    destinataire: "Pr. Benali, Dr. Laurent, M. Dubois",
    dossierRef: ref,
    canal: "Email & Notification Plateforme",
    niveau: "Lancement Marché (J-7)",
    timestamp: "À l'instant",
    status: "Distribué",
    messagePreview: `Ouverture de la commission asynchrone pour : ${title}. Date limite de vote : ${deadline}.`
  });

  saveState();
  closeNewDossierModal();
  renderApp();
  showToast(`Marché ${ref} publié avec succès ! Les notifications de vote asynchrone ont été envoyées aux membres.`, "success");
}

// ================= NOTIFICATIONS & TOASTS =================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let iconName = "info";
  if (type === "success") iconName = "check-circle-2";
  if (type === "warning") iconName = "alert-triangle";

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  initLucide();

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function toggleNotificationsModal() {
  const modal = document.getElementById("notifications-modal");
  const list = document.getElementById("notifications-modal-list");

  if (modal.classList.contains("hidden")) {
    list.innerHTML = state.remindersLog.slice(0, 5).map(r => `
      <div style="padding:0.75rem 0; border-bottom:1px solid #1e293b; font-size:0.8rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
          <strong style="color:#38bdf8;">${r.canal}</strong>
          <small class="text-muted">${r.timestamp}</small>
        </div>
        <div>Destinataire : <strong>${r.destinataire}</strong></div>
        <p style="margin-top:0.25rem; font-size:0.775rem;">${r.messagePreview}</p>
      </div>
    `).join("");
    modal.classList.remove("hidden");
  } else {
    modal.classList.add("hidden");
  }
}

function checkUrgentDeadlines() {
  const urgent = state.dossiers.find(d => d.urgent && d.status === "IN_VOTING");
  const ticker = document.getElementById("escalation-ticker");
  const tickerText = document.getElementById("ticker-text");

  if (urgent && ticker && tickerText) {
    tickerText.innerHTML = `<strong>Alerte Échéance Dépassée / Critique :</strong> Le dossier '${urgent.title}' arrive à échéance sous 24h. Relance SMS envoyée au Pr. Benali. Suppléant habilité si non-réponse.`;
    ticker.classList.remove("hidden");
  }
}

function closeTicker() {
  document.getElementById("escalation-ticker")?.classList.add("hidden");
}

function updateHeaderBadges() {
  const totalCountEl = document.getElementById("total-dossiers-badge");
  const activeCountEl = document.getElementById("kpi-active-count");
  if (totalCountEl) totalCountEl.textContent = state.dossiers.length;
  if (activeCountEl) activeCountEl.textContent = state.dossiers.filter(d => d.status !== 'PV_GENERATED').length;
}

function exportAnalyticsReport() {
  alert("Rapport de Performance Téléchargé :\n- 76% de réunions évitées sur les 6 derniers mois\n- Délai moyen ramené de 42j à 8.5j\n- 124 heures médicales préservées pour les soins et blocs opératoires.");
}

// Utility formatting helpers
function formatCurrency(val) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  } catch(e) {
    return dateStr;
  }
}

function formatDateTime(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch(e) {
    return dateStr;
  }
}

function getDeadlineInfo(deadlineStr) {
  try {
    const d = new Date(deadlineStr);
    const now = new Date("2026-10-18"); // anchored to current simulated date
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      return { text: `Échéance Demain (J-1)`, urgencyClass: "critical" };
    } else if (diffDays <= 3) {
      return { text: `Reste ${diffDays} jours`, urgencyClass: "urgent" };
    } else {
      return { text: `Reste ${diffDays} jours`, urgencyClass: "" };
    }
  } catch(e) {
    return { text: deadlineStr, urgencyClass: "" };
  }
}

// ================= ABSENCE & DELEGATION MODAL HANDLERS =================

function openAbsenceDeclarationModal() {
  const modal = document.getElementById("absence-modal");
  const select = document.getElementById("absence-member-select");
  if (!modal || !select) return;

  // Populate with delegable titulaires
  const delegable = state.members.filter(m => m.suppleantId);
  select.innerHTML = delegable.map(m => `<option value="${m.id}">${m.name} - ${m.role}</option>`).join("");

  updateAbsenceSuppleantPreview(select.value || delegable[0]?.id);
  modal.classList.remove("hidden");
  initLucide();
}

function closeAbsenceModal() {
  document.getElementById("absence-modal")?.classList.add("hidden");
}

function updateAbsenceSuppleantPreview(memberId) {
  const member = state.members.find(m => m.id === memberId);
  const textEl = document.getElementById("absence-suppleant-text");
  if (!member || !textEl) return;

  const suppleant = state.members.find(m => m.id === member.suppleantId);
  if (suppleant) {
    textEl.innerHTML = `<strong>${suppleant.name}</strong> (${suppleant.role})`;
  } else {
    textEl.innerHTML = `Aucun suppléant direct enregistré`;
  }
}

function handleAbsenceDeclaration(event) {
  event.preventDefault();
  const select = document.getElementById("absence-member-select");
  const reasonSelect = document.getElementById("absence-reason-select");
  if (!select) return;

  const memberId = select.value;
  const reason = reasonSelect ? reasonSelect.value : "Indisponibilité clinique";

  const member = state.members.find(m => m.id === memberId);
  if (member) {
    member.status = "absent";
    member.absenceReason = reason;
    member.delegationActive = true;

    const suppleant = state.members.find(m => m.id === member.suppleantId);

    state.remindersLog.unshift({
      id: "rem_" + Date.now(),
      destinataire: `${suppleant ? suppleant.name : 'Suppléant'} (Habilité pour ${member.name})`,
      dossierRef: "TOUS MARCHÉS EN COURS",
      canal: "Délégation d'Urgence",
      niveau: "Passation Quorum",
      timestamp: "À l'instant",
      status: "Actif & Notifié",
      messagePreview: `Motif : ${reason}. Vous êtes désigné(e) comme suppléant(e) officiel(le) avec droits de vote actifs.`
    });

    saveState();
    closeAbsenceModal();
    renderApp();
    showToast(`Délégation activée pour ${member.name} (${reason}) &rarr; Suppléant : ${suppleant ? suppleant.name : 'Désigné'}.`, "warning");
  }
}

// Alias for PV generator button
function openPvGeneratorModal(dossierId) {
  openPvModal(dossierId);
}

