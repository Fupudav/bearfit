// HEADER XP
function updateHeaderUI() {
  const xpValueEl = document.getElementById("header-xp-value");
  if (xpValueEl) {
    xpValueEl.textContent = `${userData.xp}`;
  }
}

// STREAK GLOBAL
function updateStreakUI() {
  const streakEl = document.getElementById("home-streak");
  if (streakEl) {
    streakEl.textContent = userData.streakGlobal;
  }
}

// OBJECTIF XP DU JOUR
function updateDailyTargetUI() {
  const targetEl = document.getElementById("home-daily-target");
  if (targetEl) {
    targetEl.textContent = userData.settings.dailyXpGoal;
  }
}

// XP GAGNÉS AUJOURD'HUI (provisoire à 0 pour l’instant)
function updateTodayXpUI() {
  const todayXpEl = document.getElementById("home-today-xp");
  if (todayXpEl) {
    todayXpEl.textContent = userData.xpToday?.value ?? 0;
  }
}

// OBJECTIFS DU JOUR (placeholders)
function formatObjectiveLine(objective) {
  if (!objective) return "–";
  const progress = Number.isFinite(objective.progress)
    ? Math.min(objective.progress, objective.target)
    : 0;
  const status = objective.done ? "✅" : "🎯";
  return `${status} ${objective.label} (${progress}/${objective.target}) +${objective.rewardXp} XP`;
}

function updateObjectivesUI() {
  const mainObj = document.getElementById("home-main-objective");
  const secondObj = document.getElementById("home-secondary-objective");

  if (!mainObj || !secondObj) return;

  const dailyObjectives = userData.dailyObjectives;
  if (!dailyObjectives?.main || !dailyObjectives?.secondary) {
    mainObj.textContent = "–";
    secondObj.textContent = "–";
    return;
  }

  mainObj.textContent = formatObjectiveLine(dailyObjectives.main);
  secondObj.textContent = formatObjectiveLine(dailyObjectives.secondary);
}

function renderHome() {
  if (window.ensureDailyObjectives) {
    window.ensureDailyObjectives();
  }

  if (window.ensureDailyCounters) {
    window.ensureDailyCounters();
  }

  if (window.evaluateObjectivesAndMaybeReward) {
    window.evaluateObjectivesAndMaybeReward();
  }

  updateStreakUI();
  updateDailyTargetUI();
  updateTodayXpUI();
  updateObjectivesUI();
}

// RAFRAÎCHISSEMENT GLOBAL UI
function refreshUI() {
  updateHeaderUI();
  renderHome();

  if (window.renderChallenges) {
    window.renderChallenges();
  }

  if (typeof renderStats === "function") {
    renderStats();
  }
}

// RAFRAÎCHISSEMENT AU CHARGEMENT
refreshUI();

// EXPORT DEBUG
window.refreshUI = refreshUI;
window.renderHome = renderHome;
