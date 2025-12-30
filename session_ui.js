const EXERCISE_LABELS = {
  pushups: "Pompes",
  plank: "Gainage",
  abs: "Abdos",
  triceps: "Triceps haltères",
  bench: "Développé couché",
};

const sessionState = {
  mode: "idle",
  steps: [],
  stepIndex: 0,
  phase: "idle",
  globalStartTs: null,
  globalTimerIntervalId: null,
  globalElapsedSec: 0,
  restRemainingSec: 0,
  restIntervalId: null,
  workIntervalId: null,
  countdownIntervalId: null,
  newRecords: [],
  xpEarnedThisSession: 0,
  exerciseVolumes: {},
  completedSteps: [],
  challengeResults: [],
};

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function clearIntervalSafe(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
  }
}

function resetSessionState() {
  clearIntervalSafe(sessionState.globalTimerIntervalId);
  clearIntervalSafe(sessionState.restIntervalId);
  clearIntervalSafe(sessionState.workIntervalId);
  clearIntervalSafe(sessionState.countdownIntervalId);

  sessionState.mode = "idle";
  sessionState.steps = [];
  sessionState.stepIndex = 0;
  sessionState.phase = "idle";
  sessionState.globalStartTs = null;
  sessionState.globalTimerIntervalId = null;
  sessionState.globalElapsedSec = 0;
  sessionState.restRemainingSec = 0;
  sessionState.restIntervalId = null;
  sessionState.workIntervalId = null;
  sessionState.countdownIntervalId = null;
  sessionState.newRecords = [];
  sessionState.xpEarnedThisSession = 0;
  sessionState.exerciseVolumes = {};
  sessionState.completedSteps = [];
  sessionState.challengeResults = [];
}

function computeStepXp(step, performedValue) {
  if (!performedValue) return 0;
  let baseXp = 0;
  if (step.type === "reps") {
    baseXp = performedValue;
  } else if (step.type === "time") {
    baseXp = performedValue * 0.5;
  }
  const multiplier = step.level
    ? 1 + (step.level - 1) * 0.2
    : 1;
  return Math.round(baseXp * multiplier);
}

function getExerciseLabel(exerciseKey) {
  return EXERCISE_LABELS[exerciseKey] || exerciseKey;
}

function getRestTime(exerciseKey) {
  const settings = userData.settings || {};
  switch (exerciseKey) {
    case "pushups":
      return settings.restTimePompes ?? 30;
    case "plank":
      return settings.restTimeGainage ?? 30;
    case "abs":
      return settings.restTimeAbdos ?? 30;
    case "triceps":
      return settings.restTimeTriceps ?? 45;
    case "bench":
      return settings.restTimeDeveloppe ?? 60;
    default:
      return 30;
  }
}

function updateGlobalTimer() {
  if (!sessionState.globalStartTs) return;
  const elapsed = Math.floor((Date.now() - sessionState.globalStartTs) / 1000);
  sessionState.globalElapsedSec = elapsed;
  const globalTimerEl = document.getElementById("session-global-timer");
  if (globalTimerEl) {
    globalTimerEl.textContent = formatDuration(elapsed);
  }
}

function startGlobalTimer() {
  sessionState.globalStartTs = Date.now();
  updateGlobalTimer();
  sessionState.globalTimerIntervalId = setInterval(updateGlobalTimer, 1000);
}

function stopGlobalTimer() {
  clearIntervalSafe(sessionState.globalTimerIntervalId);
  sessionState.globalTimerIntervalId = null;
}

function updateSessionHeader(title, subtitle) {
  const titleEl = document.getElementById("session-title");
  const subtitleEl = document.getElementById("session-subtitle");
  if (titleEl) titleEl.textContent = title || "Séance";
  if (subtitleEl) subtitleEl.textContent = subtitle || "";
}

function updateStepDisplay() {
  const step = sessionState.steps[sessionState.stepIndex];
  const stepEl = document.getElementById("session-step");
  const progressEl = document.getElementById("session-progress-text");
  const nextStepEl = document.getElementById("session-next-step");
  const workTimerEl = document.getElementById("session-work-timer");
  const countdownEl = document.getElementById("session-countdown");

  if (!step) {
    if (stepEl) stepEl.textContent = "";
    if (progressEl) progressEl.textContent = "";
    if (nextStepEl) nextStepEl.textContent = "";
    if (workTimerEl) workTimerEl.textContent = "";
    if (countdownEl) countdownEl.textContent = "";
    return;
  }

  const isCombined = sessionState.mode === "combined";
  const currentIndex = sessionState.stepIndex + 1;
  const totalSteps = sessionState.steps.length;

  const label = step.type === "reps" ? "répétitions" : "secondes";
  const weightLabel = step.weightLabel ? ` — ${step.weightLabel}` : "";
  const intro = isCombined
    ? `Étape ${currentIndex} / ${totalSteps}`
    : `Série ${currentIndex} / ${totalSteps}`;

  if (stepEl) {
    stepEl.textContent = `${getExerciseLabel(step.exerciseKey)} — ${step.target} ${label}${weightLabel}`;
  }

  if (progressEl) {
    progressEl.textContent = intro;
  }

  if (nextStepEl) {
    const nextStep = sessionState.steps[sessionState.stepIndex + 1];
    nextStepEl.textContent = nextStep
      ? `Prochaine étape : ${getExerciseLabel(nextStep.exerciseKey)} (${nextStep.target} ${nextStep.type === "reps" ? "répétitions" : "secondes"})`
      : "";
  }

  if (workTimerEl) {
    workTimerEl.textContent = "";
  }

  if (countdownEl) {
    countdownEl.textContent = "";
  }
}

function updateMainButton() {
  const mainBtn = document.getElementById("session-complete-btn");
  if (!mainBtn) return;

  if (sessionState.phase === "idle") {
    mainBtn.textContent = "Démarrer la séance";
    mainBtn.style.display = "block";
    mainBtn.disabled = false;
    return;
  }

  if (sessionState.phase === "work") {
    const step = sessionState.steps[sessionState.stepIndex];
    if (!step) {
      mainBtn.style.display = "none";
      return;
    }
    mainBtn.textContent = step.type === "time" ? "Démarrer" : "Valider la série";
    mainBtn.style.display = "block";
    mainBtn.disabled = false;
    return;
  }

  mainBtn.style.display = "none";
}

function updateRestDisplay() {
  const restEl = document.getElementById("session-rest");
  const skipBtn = document.getElementById("session-skip-rest-btn");
  if (!restEl || !skipBtn) return;

  if (sessionState.phase === "rest") {
    restEl.textContent = `Repos : ${sessionState.restRemainingSec}s`;
    restEl.style.display = "block";
    skipBtn.style.display = "block";
  } else {
    restEl.textContent = "";
    restEl.style.display = "none";
    skipBtn.style.display = "none";
  }
}

function updateFreeActionsVisibility() {
  const freeActions = document.getElementById("session-free-actions");
  if (!freeActions) return;
  if (sessionState.mode === "free" && sessionState.phase !== "recap") {
    freeActions.style.display = "grid";
  } else {
    freeActions.style.display = "none";
  }
}

function updateXpPreview() {
  const xpPreviewEl = document.getElementById("session-xp-preview");
  if (!xpPreviewEl) return;
  if (!sessionState.steps.length || sessionState.phase === "recap") {
    xpPreviewEl.textContent = "";
    return;
  }

  const estimatedXp = sessionState.steps.reduce(
    (sum, step) => sum + computeStepXp(step, step.target),
    0
  );
  xpPreviewEl.textContent = `XP prévu : ${estimatedXp}`;
}

function renderSessionUI() {
  updateStepDisplay();
  updateMainButton();
  updateRestDisplay();
  updateFreeActionsVisibility();
  updateXpPreview();

  const recapEl = document.getElementById("session-recap");
  if (recapEl) {
    recapEl.classList.toggle("hidden", sessionState.phase !== "recap");
  }
}

function applySeriesResult(step, performedValue) {
  if (!step || !step.exerciseKey) return;

  const stats = userData.stats;
  const exerciseKey = step.exerciseKey;

  sessionState.exerciseVolumes[exerciseKey] =
    (sessionState.exerciseVolumes[exerciseKey] || 0) + performedValue;

  const addRecord = (label) => {
    sessionState.newRecords.push(label);
  };

  if (step.type === "reps") {
    switch (exerciseKey) {
      case "pushups":
        stats.totalPompes += performedValue;
        if (performedValue > stats.maxPompes) {
          stats.maxPompes = performedValue;
          addRecord(`Pompes : ${performedValue} répétitions`);
        }
        break;
      case "abs":
        stats.totalAbdos += performedValue;
        if (performedValue > stats.maxAbdos) {
          stats.maxAbdos = performedValue;
          addRecord(`Abdos : ${performedValue} répétitions`);
        }
        break;
      case "triceps":
        stats.totalTriceps += performedValue;
        if (performedValue > stats.maxTriceps) {
          stats.maxTriceps = performedValue;
          addRecord(`Triceps : ${performedValue} répétitions`);
        }
        if (
          Number.isFinite(step.weightKgTotal) &&
          step.weightKgTotal > (stats.maxTricepsWeight || 0)
        ) {
          stats.maxTricepsWeight = step.weightKgTotal;
          addRecord(
            `Triceps : ${step.weightKgTotal} kg total`
          );
        }
        break;
      case "bench":
        stats.totalDeveloppe += performedValue;
        if (performedValue > stats.maxDeveloppe) {
          stats.maxDeveloppe = performedValue;
          addRecord(`Développé couché : ${performedValue} répétitions`);
        }
        if (
          Number.isFinite(step.weightKgTotal) &&
          step.weightKgTotal > (stats.maxDeveloppeWeight || 0)
        ) {
          stats.maxDeveloppeWeight = step.weightKgTotal;
          addRecord(
            `Développé couché : ${step.weightKgTotal} kg total`
          );
        }
        break;
      default:
        break;
    }
  } else if (step.type === "time") {
    if (exerciseKey === "plank") {
      stats.totalGainage += performedValue;
      if (performedValue > stats.maxGainage) {
        stats.maxGainage = performedValue;
        addRecord(`Gainage : ${performedValue} secondes`);
      }
    }
  }
}

function addDailyVolumeFromSteps() {
  const exerciseVolumes = sessionState.exerciseVolumes;
  Object.entries(exerciseVolumes).forEach(([exerciseKey, volume]) => {
    const session = {
      challengeId: exerciseKey,
      type: exerciseKey === "plank" ? "time" : "reps",
      series: [volume],
    };
    if (window.recordDailySessionVolume) {
      window.recordDailySessionVolume(session);
    }
  });
}

function maybeApplyDailyXpGoalBonus() {
  const today = new Date().toDateString();
  const goal = userData.settings?.dailyXpGoal ?? 0;
  if (!goal) return 0;

  if (userData.dailyXpGoalBonusDate === today) {
    return 0;
  }

  if (userData.xpToday?.value >= goal) {
    const bonus = Math.round(goal * 0.2) || 20;
    addXp(bonus);
    userData.dailyXpGoalBonusDate = today;
    saveUserData(userData);
    return bonus;
  }

  return 0;
}

function finalizeSessionProgress() {
  const uniqueChallengeIds = [
    ...new Set(
      sessionState.steps
        .map((step) => step.challengeId)
        .filter(Boolean)
    ),
  ];

  const completed = [];
  const skipped = [];

  if (sessionState.mode === "solo" || sessionState.mode === "combined") {
    uniqueChallengeIds.forEach((challengeId) => {
      const ok = completeChallengeDay(challengeId);
      if (ok) {
        completed.push(challengeId);
        if (window.updateChallengeStreak) {
          window.updateChallengeStreak(challengeId);
        }
      } else {
        skipped.push(challengeId);
      }
    });
  }

  if (sessionState.mode === "combined") {
    if (userData.stats) {
      userData.stats.combinedSessionsCount =
        (userData.stats.combinedSessionsCount || 0) + 1;
    }
  }

  updateStreak();

  if (window.recordDailySessionCompletion) {
    window.recordDailySessionCompletion(sessionState.mode === "combined");
  }

  addDailyVolumeFromSteps();

  sessionState.challengeResults = {
    completed,
    skipped,
  };
}

function finalizeSession() {
  stopGlobalTimer();
  clearIntervalSafe(sessionState.restIntervalId);
  clearIntervalSafe(sessionState.workIntervalId);
  clearIntervalSafe(sessionState.countdownIntervalId);

  finalizeSessionProgress();

  addXp(sessionState.xpEarnedThisSession);
  const bonus = maybeApplyDailyXpGoalBonus();
  sessionState.xpEarnedThisSession += bonus;

  if (window.evaluateObjectivesAndMaybeReward) {
    window.evaluateObjectivesAndMaybeReward();
  }

  if (window.evaluateAchievements) {
    window.evaluateAchievements();
  }

  saveUserData(userData);

  sessionState.phase = "recap";
  renderRecap();
  renderSessionUI();
}

function finishIfLastStep() {
  if (sessionState.stepIndex >= sessionState.steps.length) {
    finalizeSession();
    return true;
  }
  return false;
}

function moveToNextStep() {
  sessionState.stepIndex += 1;
  if (finishIfLastStep()) return;
  sessionState.phase = "work";
  updateStepDisplay();
  updateMainButton();
  updateRestDisplay();
}

function startRestPhase() {
  const step = sessionState.steps[sessionState.stepIndex];
  if (!step) return;
  sessionState.phase = "rest";
  sessionState.restRemainingSec = getRestTime(step.exerciseKey);
  updateRestDisplay();

  sessionState.restIntervalId = setInterval(() => {
    sessionState.restRemainingSec -= 1;
    if (sessionState.restRemainingSec <= 0) {
      clearIntervalSafe(sessionState.restIntervalId);
      sessionState.restIntervalId = null;
      moveToNextStep();
      renderSessionUI();
      return;
    }
    updateRestDisplay();
  }, 1000);
}

function validateCurrentStep(performedValue) {
  const step = sessionState.steps[sessionState.stepIndex];
  if (!step) return;

  applySeriesResult(step, performedValue);

  sessionState.completedSteps.push({
    ...step,
    performedValue,
  });

  sessionState.xpEarnedThisSession += computeStepXp(step, performedValue);
  startRestPhase();
  renderSessionUI();
}

function updateWorkTimer(secondsRemaining) {
  const workTimerEl = document.getElementById("session-work-timer");
  if (workTimerEl) {
    workTimerEl.textContent = `Temps restant : ${secondsRemaining}s`;
  }
}

function startTimeCountdown(step) {
  const countdownEl = document.getElementById("session-countdown");
  let countdown = 3;
  if (countdownEl) {
    countdownEl.textContent = `Départ dans ${countdown}...`;
  }

  sessionState.countdownIntervalId = setInterval(() => {
    countdown -= 1;
    if (countdownEl) {
      countdownEl.textContent = `Départ dans ${countdown}...`;
    }

    if (countdown <= 0) {
      clearIntervalSafe(sessionState.countdownIntervalId);
      sessionState.countdownIntervalId = null;
      if (countdownEl) countdownEl.textContent = "";
      startTimeWork(step);
    }
  }, 1000);
}

function startTimeWork(step) {
  let remaining = step.target;
  updateWorkTimer(remaining);
  sessionState.workIntervalId = setInterval(() => {
    remaining -= 1;
    updateWorkTimer(remaining);
    if (remaining <= 0) {
      clearIntervalSafe(sessionState.workIntervalId);
      sessionState.workIntervalId = null;
      validateCurrentStep(step.target);
    }
  }, 1000);
}

function handleMainButtonClick() {
  if (sessionState.phase === "idle") {
    sessionState.phase = "work";
    startGlobalTimer();
    renderSessionUI();
    return;
  }

  if (sessionState.phase !== "work") {
    return;
  }

  const step = sessionState.steps[sessionState.stepIndex];
  if (!step) return;

  if (step.type === "reps") {
    validateCurrentStep(step.target);
    return;
  }

  if (step.type === "time") {
    const mainBtn = document.getElementById("session-complete-btn");
    if (mainBtn) mainBtn.disabled = true;
    startTimeCountdown(step);
  }
}

function skipRest() {
  if (sessionState.phase !== "rest") return;
  clearIntervalSafe(sessionState.restIntervalId);
  sessionState.restIntervalId = null;
  moveToNextStep();
  renderSessionUI();
}

function buildChallengeStep(session, value, serieIndex) {
  const challenge = challengePrograms[session.challengeId];
  const weightInfo = session.weightInfo || null;
  const totalMultiplier =
    challenge?.weightTotalMultiplier || (challenge?.hasWeight ? 2 : 1);
  const weightKgTotal = weightInfo?.value
    ? weightInfo.value * totalMultiplier
    : null;
  const weightLabel = weightInfo?.label || "";

  return {
    challengeId: session.challengeId,
    exerciseKey: session.challengeId,
    type: session.type,
    target: value,
    label: `${getExerciseLabel(session.challengeId)} — Série ${
      serieIndex + 1
    }`,
    weightKgTotal,
    weightLabel,
    level: session.level,
  };
}

function buildStepsFromSession(session) {
  return session.series.map((value, index) =>
    buildChallengeStep(session, value, index)
  );
}

function startSessionEngine({
  mode,
  steps,
  title,
  subtitle,
}) {
  resetSessionState();
  sessionState.mode = mode;
  sessionState.steps = steps;
  sessionState.phase = "idle";

  updateSessionHeader(title, subtitle);
  updateStepDisplay();
  updateRestDisplay();

  const globalTimerEl = document.getElementById("session-global-timer");
  if (globalTimerEl) {
    globalTimerEl.textContent = "00:00";
  }

  const recapEl = document.getElementById("session-recap");
  if (recapEl) {
    recapEl.classList.add("hidden");
  }

  showScreen("session");
  renderSessionUI();
}

function renderRecap() {
  const recapTitle = document.getElementById("session-recap-title");
  const recapDuration = document.getElementById("session-recap-duration");
  const recapXp = document.getElementById("session-recap-xp");
  const recapProgress = document.getElementById("session-recap-progress");
  const recapRecords = document.getElementById("session-recap-records");

  if (recapTitle) {
    recapTitle.textContent = "Récap séance";
  }

  if (recapDuration) {
    recapDuration.textContent = formatDuration(sessionState.globalElapsedSec);
  }

  if (recapXp) {
    recapXp.textContent = `${sessionState.xpEarnedThisSession} XP`;
  }

  if (recapProgress) {
    if (sessionState.mode === "free") {
      recapProgress.textContent = "Séance libre terminée.";
    } else {
      const completed = sessionState.challengeResults.completed || [];
      const skipped = sessionState.challengeResults.skipped || [];
      const completedLabel = completed.length
        ? `Challenges validés : ${completed
            .map((id) => getExerciseLabel(id))
            .join(", ")}`
        : "Aucun challenge validé.";
      const skippedLabel = skipped.length
        ? `Déjà validé aujourd'hui : ${skipped
            .map((id) => getExerciseLabel(id))
            .join(", ")}`
        : "";
      recapProgress.textContent = `${completedLabel} ${skippedLabel}`.trim();
    }
  }

  if (recapRecords) {
    recapRecords.innerHTML = "";
    if (sessionState.newRecords.length) {
      sessionState.newRecords.forEach((record) => {
        const li = document.createElement("li");
        li.textContent = `Nouveau record 🎉 : ${record}`;
        recapRecords.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "Aucun nouveau record.";
      recapRecords.appendChild(li);
    }
  }
}

function buildCombinedStepsFromSessions(sessions) {
  const steps = [];
  const maxSeries = Math.max(...sessions.map((session) => session.series.length));

  for (let serieIndex = 0; serieIndex < maxSeries; serieIndex += 1) {
    sessions.forEach((session) => {
      const value = session.series[serieIndex];
      if (value === undefined) return;
      steps.push(buildChallengeStep(session, value, serieIndex));
    });
  }

  return steps;
}

function startSoloSession(session) {
  if (!session) {
    alert("Aucune séance disponible pour ce challenge.");
    return;
  }

  const steps = buildStepsFromSession(session);
  const weightLabel = session.weightInfo?.label
    ? ` — ${session.weightInfo.label}`
    : "";

  startSessionEngine({
    mode: "solo",
    steps,
    title: session.name,
    subtitle: `Niveau ${session.level} — Jour ${session.day}${weightLabel}`,
  });
}

function startCombinedSession(combinedSession) {
  if (!combinedSession || !combinedSession.steps?.length) return;

  startSessionEngine({
    mode: "combined",
    steps: combinedSession.steps,
    title: combinedSession.name,
    subtitle: "Enchaînement de challenges",
  });
}

function startFreeSessionFromForm() {
  const exerciseSelect = document.getElementById("free-exercise");
  const typeSelect = document.getElementById("free-type");
  const valueInput = document.getElementById("free-value");

  if (!exerciseSelect || !typeSelect || !valueInput) return;

  const exerciseKey = exerciseSelect.value;
  const type = typeSelect.value;
  const target = Number(valueInput.value);

  if (!target || target <= 0) {
    alert("Entre une valeur valide.");
    return;
  }

  const weightInfo =
    typeof window.getCurrentChallengeWeightInfo === "function"
      ? window.getCurrentChallengeWeightInfo(exerciseKey)
      : null;
  const challenge = challengePrograms[exerciseKey];
  const totalMultiplier =
    challenge?.weightTotalMultiplier || (challenge?.hasWeight ? 2 : 1);

  const step = {
    challengeId: null,
    exerciseKey,
    type,
    target,
    label: `${getExerciseLabel(exerciseKey)} — Série 1`,
    weightKgTotal: weightInfo?.value
      ? weightInfo.value * totalMultiplier
      : null,
    weightLabel: weightInfo?.label || "",
    level: null,
  };

  startSessionEngine({
    mode: "free",
    steps: [step],
    title: "Séance libre",
    subtitle: getExerciseLabel(exerciseKey),
  });
}

function addFreeSeries() {
  if (sessionState.mode !== "free" || !sessionState.steps.length) return;
  const lastStep = sessionState.steps[sessionState.steps.length - 1];
  const newStep = {
    ...lastStep,
    label: `${getExerciseLabel(lastStep.exerciseKey)} — Série ${
      sessionState.steps.length + 1
    }`,
  };
  sessionState.steps.push(newStep);
  updateStepDisplay();
  updateXpPreview();
}

function endFreeSessionEarly() {
  if (sessionState.mode !== "free") return;
  finalizeSession();
}

function handleRecapReturnHome() {
  sessionState.phase = "done";
  resetSessionState();
  if (window.refreshUI) {
    window.refreshUI();
  }
  showScreen("home");
}

function updateFreeWeightUI() {
  const exerciseSelect = document.getElementById("free-exercise");
  const weightRow = document.getElementById("free-weight-row");
  const weightValue = document.getElementById("free-weight");

  if (!exerciseSelect || !weightRow || !weightValue) return;

  const challengeId = exerciseSelect.value;
  const info =
    typeof window.getCurrentChallengeWeightInfo === "function"
      ? window.getCurrentChallengeWeightInfo(challengeId)
      : null;

  if (info?.label) {
    weightRow.style.display = "block";
    weightValue.textContent = info.label;
  } else {
    weightRow.style.display = "none";
    weightValue.textContent = "";
  }
}

const sessionMainBtn = document.getElementById("session-complete-btn");
if (sessionMainBtn) {
  sessionMainBtn.addEventListener("click", handleMainButtonClick);
}

const sessionSkipRestBtn = document.getElementById("session-skip-rest-btn");
if (sessionSkipRestBtn) {
  sessionSkipRestBtn.addEventListener("click", skipRest);
}

const sessionFreeAddBtn = document.getElementById("session-free-add");
if (sessionFreeAddBtn) {
  sessionFreeAddBtn.addEventListener("click", addFreeSeries);
}

const sessionFreeEndBtn = document.getElementById("session-free-end");
if (sessionFreeEndBtn) {
  sessionFreeEndBtn.addEventListener("click", endFreeSessionEarly);
}

const sessionRecapHomeBtn = document.getElementById("session-recap-home-btn");
if (sessionRecapHomeBtn) {
  sessionRecapHomeBtn.addEventListener("click", handleRecapReturnHome);
}

const freeStartBtn = document.getElementById("btn-free-start");
if (freeStartBtn) {
  freeStartBtn.addEventListener("click", startFreeSessionFromForm);
}

document
  .getElementById("free-exercise")
  ?.addEventListener("change", updateFreeWeightUI);

updateFreeWeightUI();

window.startSession = startSoloSession;
window.startCombinedSession = startCombinedSession;
window.buildCombinedStepsFromSessions = buildCombinedStepsFromSessions;
