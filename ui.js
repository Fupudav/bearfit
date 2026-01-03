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

function updateSessionsTodayUI() {
  const sessionsEl = document.getElementById("home-sessions-today");
  if (!sessionsEl) return;
  const todayKey =
    typeof window.getTodayKey === "function"
      ? window.getTodayKey()
      : null;
  const entry =
    todayKey && typeof window.getTrainingLogEntry === "function"
      ? window.getTrainingLogEntry(todayKey)
      : null;
  const sessionsCompleted =
    entry?.sessionsCompleted ??
    (entry?.combinedSessions ?? 0) +
      (entry?.freeSessions ?? 0) +
      (entry?.soloSessions ?? 0);
  sessionsEl.textContent = String(sessionsCompleted ?? 0);
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
  updateSessionsTodayUI();
  updateObjectivesUI();
}

let reminderTimeouts = {
  daily: null,
  xpGoal: null,
};

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("visible");

  if (toast.dataset.timeoutId) {
    clearTimeout(Number(toast.dataset.timeoutId));
  }

  const timeoutId = window.setTimeout(() => {
    toast.classList.remove("visible");
    toast.classList.add("hidden");
  }, 4000);

  toast.dataset.timeoutId = String(timeoutId);
}

function getDelayUntil(timeString) {
  if (!timeString || typeof timeString !== "string") return null;
  const [hours, minutes] = timeString.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

function scheduleReminderTimeout(key, timeString, onTrigger) {
  const delay = getDelayUntil(timeString);
  if (delay === null) return;
  reminderTimeouts[key] = window.setTimeout(() => {
    if (!userData.settings?.remindersEnabled) return;
    onTrigger();
    const nextTime =
      key === "daily"
        ? userData.settings?.reminderDailyTime
        : userData.settings?.reminderXpGoalTime;
    scheduleReminderTimeout(key, nextTime, onTrigger);
  }, delay);
}

function scheduleReminders() {
  Object.values(reminderTimeouts).forEach((timeoutId) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
  reminderTimeouts = { daily: null, xpGoal: null };

  if (!userData.settings?.remindersEnabled) return;

  scheduleReminderTimeout("daily", userData.settings.reminderDailyTime, () => {
    const today = typeof window.isoToday === "function"
      ? window.isoToday()
      : new Date().toISOString().slice(0, 10);
    if (userData.lastTrainingDate !== today) {
      showToast("Fais ta séance");
    }
  });

  scheduleReminderTimeout("xpGoal", userData.settings.reminderXpGoalTime, () => {
    const todayXp = userData.xpToday?.value ?? 0;
    const goal = userData.settings?.dailyXpGoal ?? 0;
    if (todayXp < goal) {
      showToast("Objectif XP pas atteint");
    }
  });
}

function applyThemeFromSettings() {
  const root = document.documentElement;
  const theme = userData.settings?.theme ?? "auto";
  let resolved = theme;

  if (theme === "auto") {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
      ?.matches;
    resolved = prefersDark ? "dark" : "light";
  }

  root.classList.remove("theme-dark", "theme-light");
  root.classList.add(`theme-${resolved}`);
}

// RÉGLAGES
function updateSettingsUI() {
  const settings = userData.settings || {};

  const dailyXpInput = document.getElementById("settings-daily-xp");
  if (dailyXpInput) {
    dailyXpInput.value = settings.dailyXpGoal ?? 0;
    if (!dailyXpInput.dataset.bound) {
      dailyXpInput.addEventListener("change", (event) => {
        const value = Math.max(0, Number(event.target.value) || 0);
        userData.settings.dailyXpGoal = value;
        saveUserData(userData);
        if (window.refreshUI) {
          window.refreshUI();
        }
      });
      dailyXpInput.dataset.bound = "true";
    }
  }

  const weeklyOffDaysSelect = document.getElementById("settings-weekly-offdays");
  if (weeklyOffDaysSelect) {
    weeklyOffDaysSelect.value = String(settings.weeklyOffDays ?? 0);
    if (!weeklyOffDaysSelect.dataset.bound) {
      weeklyOffDaysSelect.addEventListener("change", (event) => {
        const value = Number(event.target.value);
        userData.settings.weeklyOffDays = value;
        if (typeof window.getOffDaysPattern === "function") {
          userData.settings.offDaysPattern = window.getOffDaysPattern(value);
        } else {
          const fallbackPatterns = {
            0: [],
            1: ["sun"],
            2: ["sat", "sun"],
            3: ["wed", "sat", "sun"],
          };
          userData.settings.offDaysPattern = fallbackPatterns[value] || [];
        }
        saveUserData(userData);
        if (window.refreshUI) {
          window.refreshUI();
        }
      });
      weeklyOffDaysSelect.dataset.bound = "true";
    }
  }

  document
    .querySelectorAll("[data-challenge-toggle]")
    .forEach((checkbox) => {
      const challengeId = checkbox.dataset.challengeToggle;
      checkbox.checked = settings.activeChallenges?.[challengeId] !== false;
      if (!checkbox.dataset.bound) {
        checkbox.addEventListener("change", (event) => {
          userData.settings.activeChallenges[challengeId] = event.target.checked;
          saveUserData(userData);
          if (window.refreshUI) {
            window.refreshUI();
          }
        });
        checkbox.dataset.bound = "true";
      }
    });

  document.querySelectorAll("[data-theme-option]").forEach((radio) => {
    const themeValue = radio.dataset.themeOption;
    radio.checked = settings.theme === themeValue;
    if (!radio.dataset.bound) {
      radio.addEventListener("change", (event) => {
        if (!event.target.checked) return;
        userData.settings.theme = themeValue;
        saveUserData(userData);
        applyThemeFromSettings();
      });
      radio.dataset.bound = "true";
    }
  });

  const soundToggle = document.getElementById("settings-sound-enabled");
  if (soundToggle) {
    soundToggle.checked = settings.soundEnabled !== false;
    if (!soundToggle.dataset.bound) {
      soundToggle.addEventListener("change", (event) => {
        userData.settings.soundEnabled = event.target.checked;
        saveUserData(userData);
      });
      soundToggle.dataset.bound = "true";
    }
  }

  const vibrationToggle = document.getElementById(
    "settings-vibration-enabled"
  );
  if (vibrationToggle) {
    vibrationToggle.checked = settings.vibrationEnabled !== false;
    if (!vibrationToggle.dataset.bound) {
      vibrationToggle.addEventListener("change", (event) => {
        userData.settings.vibrationEnabled = event.target.checked;
        saveUserData(userData);
      });
      vibrationToggle.dataset.bound = "true";
    }
  }

  const remindersToggle = document.getElementById("settings-reminders-enabled");
  if (remindersToggle) {
    remindersToggle.checked = settings.remindersEnabled === true;
    if (!remindersToggle.dataset.bound) {
      remindersToggle.addEventListener("change", (event) => {
        userData.settings.remindersEnabled = event.target.checked;
        saveUserData(userData);
        scheduleReminders();
      });
      remindersToggle.dataset.bound = "true";
    }
  }

  const reminderDailyInput = document.getElementById(
    "settings-reminder-daily-time"
  );
  if (reminderDailyInput) {
    reminderDailyInput.value = settings.reminderDailyTime ?? "19:00";
    reminderDailyInput.disabled = !settings.remindersEnabled;
    if (!reminderDailyInput.dataset.bound) {
      reminderDailyInput.addEventListener("change", (event) => {
        userData.settings.reminderDailyTime = event.target.value;
        saveUserData(userData);
        scheduleReminders();
      });
      reminderDailyInput.dataset.bound = "true";
    }
  }

  const reminderXpInput = document.getElementById(
    "settings-reminder-xp-time"
  );
  if (reminderXpInput) {
    reminderXpInput.value = settings.reminderXpGoalTime ?? "21:00";
    reminderXpInput.disabled = !settings.remindersEnabled;
    if (!reminderXpInput.dataset.bound) {
      reminderXpInput.addEventListener("change", (event) => {
        userData.settings.reminderXpGoalTime = event.target.value;
        saveUserData(userData);
        scheduleReminders();
      });
      reminderXpInput.dataset.bound = "true";
    }
  }

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

// PROFIL
function updateProfileUI() {
  const nameEl = document.getElementById("profile-name");
  if (nameEl) {
    nameEl.textContent = userData.profile?.nickname ?? "Utilisateur";
  }

  const leagueEl = document.getElementById("profile-league");
  if (leagueEl) {
    leagueEl.textContent = userData.league?.currentLeague ?? 1;
  }

  const xpEl = document.getElementById("profile-xp");
  if (xpEl) {
    xpEl.textContent = userData.xp ?? 0;
  }
}

// RAFRAÎCHISSEMENT GLOBAL UI
function refreshUI() {
  window.__isRefreshingUI = true;
  updateHeaderUI();
  renderHome();
  updateSettingsUI();
  updateProfileUI();
  applyThemeFromSettings();
  scheduleReminders();

  if (window.renderChallenges) {
    window.renderChallenges();
  }

  if (window.updateFreeExerciseOptions) {
    window.updateFreeExerciseOptions();
  }

  if (typeof renderStats === "function") {
    renderStats();
  }

  if (typeof renderLeagues === "function") {
    renderLeagues();
  }

  if (typeof renderSuccesses === "function") {
    renderSuccesses();
  }
  window.__isRefreshingUI = false;
}

// RAFRAÎCHISSEMENT AU CHARGEMENT
refreshUI();

// EXPORT DEBUG
window.refreshUI = refreshUI;
window.renderHome = renderHome;

window
  .matchMedia("(prefers-color-scheme: dark)")
  ?.addEventListener("change", () => {
    if (userData.settings?.theme === "auto") {
      applyThemeFromSettings();
    }
  });

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
