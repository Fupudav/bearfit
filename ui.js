// HEADER XP
function updateHeaderUI() {
  const xpEl = document.getElementById("header-xp");
  if (xpEl) {
    xpEl.textContent = `${userData.xp} XP`;
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
    todayXpEl.textContent = 0; // sera dynamique à l'étape suivante
  }
}

// OBJECTIFS DU JOUR (placeholders)
function updateObjectivesUI() {
  const mainObj = document.getElementById("home-main-objective");
  const secondObj = document.getElementById("home-secondary-objective");

  if (mainObj) mainObj.textContent = "Faire au moins une séance";
  if (secondObj) secondObj.textContent = "Gagner 20 XP aujourd'hui";
}

// RAFRAÎCHISSEMENT GLOBAL UI
function refreshUI() {
  updateHeaderUI();
  updateStreakUI();
  updateDailyTargetUI();
  updateTodayXpUI();
  updateObjectivesUI();
}

// RAFRAÎCHISSEMENT AU CHARGEMENT
refreshUI();

// EXPORT DEBUG
window.refreshUI = refreshUI;