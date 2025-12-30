let currentSession = null;
let currentSerieIndex = 0;
let currentMode = "solo";
let currentStepIndex = 0;
let combinedSession = null;

function startSession(session) {
  if (!session) {
    alert("Aucune séance disponible pour ce challenge.");
    return;
  }

  currentSession = session;
  currentSerieIndex = 0;
  currentMode = "solo";
  currentStepIndex = 0;
  combinedSession = null;

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

function startCombinedSession(session) {
  if (!session) return;

  currentMode = "combined";
  combinedSession = session;
  currentStepIndex = 0;
  currentSession = null;
  currentSerieIndex = 0;

  const btn = document.getElementById("session-complete-btn");
  btn.style.display = "block";
  btn.textContent = "Étape terminée";

  document.getElementById("session-xp-preview").textContent = "";
  document.getElementById("session-progress-text").textContent = "";
  document.getElementById("session-step").textContent = "";

  document.getElementById("session-title").textContent = session.name;
  document.getElementById("session-subtitle").textContent =
    "Enchaînement de challenges";

  showCurrentCombinedStep();
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

function showCurrentCombinedStep() {
  if (!combinedSession) return;
  const step = combinedSession.steps[currentStepIndex];
  if (!step) return;

  const label = step.type === "reps" ? "répétitions" : "secondes";

  document.getElementById(
    "session-step"
  ).textContent = `${step.challengeName} — Série ${step.serieIndex}/${
    step.totalSeries
  } : ${step.value} ${label}`;

  document.getElementById(
    "session-progress-text"
  ).textContent = `Étape ${currentStepIndex + 1} sur ${
    combinedSession.steps.length
  }`;
}

document
  .getElementById("session-complete-btn")
  .addEventListener("click", () => {
    if (currentMode === "combined") {
      if (!combinedSession) return;

      currentStepIndex += 1;

      if (currentStepIndex < combinedSession.steps.length) {
        showCurrentCombinedStep();
        return;
      }

      endCombinedSessionPreview();
      return;
    }

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

function endCombinedSessionPreview() {
  document.getElementById("session-step").textContent =
    "Séance combinée terminée 💪";
  document.getElementById("session-progress-text").textContent = "";
  document.getElementById("session-xp-preview").textContent = "";
  document.getElementById("session-complete-btn").style.display = "none";

  currentMode = "solo";
  combinedSession = null;
  currentStepIndex = 0;

  setTimeout(() => {
    showScreen("home");
  }, 1000);
}

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

window.startCombinedSession = startCombinedSession;
