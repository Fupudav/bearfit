let currentSession = null;
let currentSerieIndex = 0;
let currentMode = "solo";
let currentStepIndex = 0;
let combinedSession = null;
let sessionFinalized = false;

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
  sessionFinalized = false;

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

      endCombinedSession();
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

    const ok = completeChallengeDay(currentSession.challengeId);
    if (!ok) {
      console.warn(
        "Challenge déjà validé aujourd’hui, pas d’avancement:",
        currentSession.challengeId
      );
    } else {
      addXp(xp);
      updateStreak();
      if (window.applySessionStats) {
        window.applySessionStats(currentSession);
      }
      if (window.recordDailySessionCompletion) {
        window.recordDailySessionCompletion();
      }
      if (window.recordDailySessionVolume) {
        window.recordDailySessionVolume(currentSession);
      }
      if (window.evaluateObjectivesAndMaybeReward) {
        window.evaluateObjectivesAndMaybeReward();
      }
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

function computeSessionXpFromSeries(type, series, level) {
  if (!Array.isArray(series) || !series.length) return 0;

  let baseXp = 0;
  if (type === "reps") {
    baseXp = series.reduce((sum, reps) => sum + reps, 0);
  } else if (type === "time") {
    baseXp = series.reduce((sum, seconds) => sum + seconds, 0) / 10;
  }

  const multiplier = 1 + 0.1 * (level - 1);
  return Math.round(baseXp * multiplier);
}

function applySessionStatsFallback(session) {
  if (!session || !session.challengeId) return;
  const volume = session.series.reduce((sum, value) => sum + value, 0);

  switch (session.challengeId) {
    case "pushups":
      userData.stats.totalPompes += volume;
      userData.stats.maxPompes = Math.max(userData.stats.maxPompes, volume);
      break;
    case "plank":
      userData.stats.totalGainage += volume;
      userData.stats.maxGainage = Math.max(userData.stats.maxGainage, volume);
      break;
    case "abs":
      userData.stats.totalAbdos += volume;
      userData.stats.maxAbdos = Math.max(userData.stats.maxAbdos, volume);
      break;
    case "triceps":
      userData.stats.totalTriceps += volume;
      userData.stats.maxTriceps = Math.max(userData.stats.maxTriceps, volume);
      break;
    case "bench":
      userData.stats.totalDeveloppe += volume;
      userData.stats.maxDeveloppe = Math.max(
        userData.stats.maxDeveloppe,
        volume
      );
      break;
    default:
      break;
  }
}

function endCombinedSession() {
  if (sessionFinalized) return;
  sessionFinalized = true;

  if (!combinedSession?.steps?.length) {
    currentMode = "solo";
    combinedSession = null;
    currentStepIndex = 0;
    showScreen("home");
    return;
  }

  const challengeIds = [
    ...new Set(combinedSession.steps.map((step) => step.challengeId)),
  ];

  let totalXp = 0;
  let validCount = 0;
  const completedSessions = [];

  challengeIds.forEach((challengeId) => {
    const session = getTodayChallengeProgram(challengeId);
    if (!session) return;

    const ok = completeChallengeDay(challengeId);
    if (!ok) {
      console.warn(
        "Challenge déjà validé aujourd’hui, pas d’avancement:",
        challengeId
      );
      return;
    }

    const xp = window.calculateSessionXp
      ? window.calculateSessionXp(session)
      : computeSessionXpFromSeries(
          session.type,
          session.series,
          session.level
        );
    totalXp += xp;
    validCount += 1;
    completedSessions.push(session);

    if (window.applySessionStats) {
      window.applySessionStats(session);
    } else {
      applySessionStatsFallback(session);
    }
  });

  if (validCount > 0) {
    addXp(totalXp);
    updateStreak();
    if (window.recordDailySessionCompletion) {
      window.recordDailySessionCompletion();
    }

    if (window.recordDailySessionVolume) {
      completedSessions.forEach((session) => {
        window.recordDailySessionVolume(session);
      });
    }

    if (window.evaluateObjectivesAndMaybeReward) {
      window.evaluateObjectivesAndMaybeReward();
    }
  }

  saveUserData(userData);

  document.getElementById("session-step").textContent =
    "Séance combinée terminée 💪";
  document.getElementById("session-progress-text").textContent =
    `Challenges validés: ${validCount}`;
  document.getElementById(
    "session-xp-preview"
  ).textContent = `XP gagné: ${totalXp}`;
  document.getElementById("session-complete-btn").style.display = "none";

  currentMode = "solo";
  combinedSession = null;
  currentStepIndex = 0;

  if (window.refreshUI) {
    window.refreshUI();
  }

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

  console.log("XP gagnée :", xpGained);
}

window.startCombinedSession = startCombinedSession;
