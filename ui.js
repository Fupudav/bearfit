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
  const rerollBtn = document.getElementById("home-reroll-secondary");

  if (!mainObj || !secondObj) return;

  const dailyObjectives = userData.dailyObjectives;
  if (!dailyObjectives?.main || !dailyObjectives?.secondary) {
    mainObj.textContent = "–";
    secondObj.textContent = "–";
    if (rerollBtn) {
      rerollBtn.disabled = true;
      rerollBtn.textContent = "Reroll (0)";
    }
    return;
  }

  mainObj.textContent = formatObjectiveLine(dailyObjectives.main);
  secondObj.textContent = formatObjectiveLine(dailyObjectives.secondary);

  if (rerollBtn) {
    const remaining = dailyObjectives.rerollsLeft ?? 0;
    rerollBtn.disabled = remaining <= 0;
    rerollBtn.textContent = `Reroll (${Math.max(0, remaining)})`;
  }
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

// RÉGLAGES
function updateSettingsUI() {
  const settingsMap = [
    { inputId: "settings-rest-pushups", valueId: "settings-rest-pushups-value", key: "restTimePompes" },
    { inputId: "settings-rest-plank", valueId: "settings-rest-plank-value", key: "restTimeGainage" },
    { inputId: "settings-rest-abs", valueId: "settings-rest-abs-value", key: "restTimeAbdos" },
    { inputId: "settings-rest-triceps", valueId: "settings-rest-triceps-value", key: "restTimeTriceps" },
    { inputId: "settings-rest-bench", valueId: "settings-rest-bench-value", key: "restTimeDeveloppe" },
  ];

  settingsMap.forEach(({ inputId, valueId, key }) => {
    const input = document.getElementById(inputId);
    const valueEl = document.getElementById(valueId);
    if (!input || !valueEl) return;

    const currentValue = userData.settings?.[key] ?? 30;
    input.value = currentValue;
    valueEl.textContent = `${currentValue}s`;

    if (!input.dataset.bound) {
      input.addEventListener("input", (event) => {
        const value = Number(event.target.value);
        userData.settings[key] = value;
        valueEl.textContent = `${value}s`;
        saveUserData(userData);
        if (window.refreshUI) {
          window.refreshUI();
        }
      });
      input.dataset.bound = "true";
    }
  });
}

// RAFRAÎCHISSEMENT GLOBAL UI
function refreshUI() {
  updateHeaderUI();
  renderHome();
  updateSettingsUI();

  if (window.renderChallenges) {
    window.renderChallenges();
  }

  if (typeof renderStats === "function") {
    renderStats();
  }

  if (typeof renderSuccesses === "function") {
    renderSuccesses();
  }
}

// RAFRAÎCHISSEMENT AU CHARGEMENT
refreshUI();

// EXPORT DEBUG
window.refreshUI = refreshUI;
window.renderHome = renderHome;

document
  .getElementById("home-reroll-secondary")
  ?.addEventListener("click", () => {
    if (!window.rerollSecondaryObjective) return;
    const result = window.rerollSecondaryObjective();
    if (!result?.success && result?.message) {
      alert(result.message);
    }
    if (window.refreshUI) {
      window.refreshUI();
    }
  });

document
  .getElementById("profile-reset-btn")
  ?.addEventListener("click", () => {
    if (!window.resetUserData) return;
    const confirmed = window.confirm(
      "Réinitialiser le profil ? Toutes les données seront effacées."
    );
    if (!confirmed) return;
    window.resetUserData();
    alert("Profil réinitialisé.");
  });
