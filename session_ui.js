let currentSession = null;
let currentSerieIndex = 0;

function startSession(session) {
  if (!session) {
    alert("Aucune séance disponible pour ce challenge.");
    return;
  }

  currentSession = session;
  currentSerieIndex = 0;

  // 🔁 RESET UI
  const btn = document.getElementById("session-complete-btn");
  btn.style.display = "block";
  btn.textContent = "Série terminée";

  document.getElementById("session-progress-text").textContent = "";
  document.getElementById("session-step").textContent = "";
  const xp = calculateSessionXp(session);
  document.getElementById("session-xp-preview").textContent = `XP prévu : ${xp}`;

  document.getElementById("session-title").textContent = session.name;
  document.getElementById(
    "session-subtitle"
  ).textContent = `Niveau ${session.level} — Jour ${session.day}`;

  showCurrentSerie();
}

function showCurrentSerie() {
  const serie = currentSession.series[currentSerieIndex];

  document.getElementById(
    "session-step"
  ).textContent =
    currentSession.type === "reps"
      ? `Série ${currentSerieIndex + 1} : ${serie} répétitions`
      : `Série ${currentSerieIndex + 1} : ${serie} secondes`;

  document.getElementById(
    "session-progress-text"
  ).textContent = `Série ${currentSerieIndex + 1} sur ${
    currentSession.series.length
  }`;
}

document
  .getElementById("session-complete-btn")
  .addEventListener("click", () => {
    if (!currentSession) return;

    currentSerieIndex++;

    if (currentSerieIndex < currentSession.series.length) {
      showCurrentSerie();
      return;
    }

    // 🏁 FIN DE SÉANCE
    const xp = calculateSessionXp(currentSession);

    console.log("XP gagné :", xp);
    console.log("Challenge validé :", currentSession.challengeId);

    addXp(xp);
    updateStreak();
    completeChallengeDay(currentSession.challengeId);
    if (window.applySessionStats) {
      window.applySessionStats(currentSession);
    }

    saveUserData(userData); // 🔒 sécurité
    if (window.refreshUI) {
      window.refreshUI();
    }

    alert(`Séance terminée 💪 +${xp} XP`);

    currentSession = null;
    currentSerieIndex = 0;

    showScreen("challenges");
  });

function endSession() {
  // Texte
  document.getElementById("session-step").textContent =
    "Séance terminée 💪";

  document.getElementById("session-progress-text").textContent =
    "Bravo, tu as terminé toutes les séries.";

  document.getElementById("session-complete-btn").style.display = "none";

  // LOGIQUE MÉTIER
  const xpGained = 20; // temporaire, on affinera plus tard
  addXp(xpGained);
  updateStreak();
  completeChallengeDay(currentSession.challengeId);

  console.log("XP gagnée :", xpGained);
}
