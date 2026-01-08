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

let audioContext = null;

function shouldPlaySound() {
  return userData.settings?.soundEnabled !== false;
}

function shouldVibrate() {
  return userData.settings?.vibrationEnabled !== false;
}

function playBeep(duration = 0.12, frequency = 640) {
  if (!shouldPlaySound()) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gainNode.gain.value = 0.12;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function triggerVibration(duration = 120) {
  if (!shouldVibrate()) return;
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
}

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

function formatWeightValue(value) {
  if (!Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return `${value}`;
  return `${Math.round(value * 10) / 10}`;
}

function formatWeightLabel(challenge, weightValue) {
  if (!challenge || !Number.isFinite(weightValue)) return "";
  if (typeof window.formatChallengeWeightLabel === "function") {
    return window.formatChallengeWeightLabel(challenge, weightValue);
  }

  const unit = challenge.weightUnit || "kg";
  const perDumbbell = weightValue;
  const totalMultiplier = challenge.weightTotalMultiplier || 1;
  const total = perDumbbell * totalMultiplier;

  const perLabel = `${formatWeightValue(perDumbbell)} ${unit}`;
  const totalLabel = `${formatWeightValue(total)} ${unit}`;

  switch (challenge.weightDisplay) {
    case "perDumbbellPlusTotal":
      return `${perLabel} / haltère (${totalLabel} total)`;
    case "perDumbbell":
      return `${perLabel} / haltère`;
    case "total":
      return `${totalLabel} total`;
    default:
      return perLabel;
  }
}

function updateStepWeightFromPrompt(step) {
  const challenge = challengePrograms?.[step.exerciseKey];
  if (!challenge?.hasWeight) return true;

  const unit = challenge.weightUnit || "kg";
  const weightModeLabel =
    challenge.weightMode === "perDumbbell"
      ? "par haltère"
      : "utilisé";
  const defaultValue = Number.isFinite(step.weightValue)
    ? step.weightValue
    : null;

  const response = prompt(
    `Poids ${weightModeLabel} (${unit}) :`,
    defaultValue === null ? "" : formatWeightValue(defaultValue)
  );

  if (response === null) {
    return false;
  }

  if (response.trim() === "") {
    return true;
  }

  const parsed = Number(response.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    alert("Entre un poids valide.");
    return false;
  }

  const totalMultiplier = challenge.weightTotalMultiplier || 1;
  step.weightValue = parsed;
  step.weightKgTotal = parsed * totalMultiplier;
  step.weightLabel = formatWeightLabel(challenge, parsed);
  return true;
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
  const targetBtn = document.getElementById("session-validate-target-btn");
  if (!mainBtn) return;

  if (sessionState.phase === "idle") {
    mainBtn.textContent = "Démarrer la séance";
    mainBtn.style.display = "block";
    mainBtn.disabled = false;
    if (targetBtn) targetBtn.style.display = "none";
    return;
  }

  if (sessionState.phase === "work") {
    const step = sessionState.steps[sessionState.stepIndex];
    if (!step) {
      mainBtn.style.display = "none";
      if (targetBtn) targetBtn.style.display = "none";
      return;
    }
    if (step.type === "time") {
      mainBtn.textContent = "Démarrer";
      if (targetBtn) targetBtn.style.display = "none";
    } else {
      mainBtn.textContent = "Saisir la valeur";
      if (targetBtn) {
        targetBtn.textContent = "Valider la cible";
        targetBtn.style.display = "inline-block";
      }
    }
    mainBtn.style.display = "block";
    mainBtn.disabled = false;
    return;
  }

  mainBtn.style.display = "none";
  if (targetBtn) targetBtn.style.display = "none";
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

  if (window.updateStreakOnTrainingCompletion) {
    window.updateStreakOnTrainingCompletion();
  }

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
  if (window.ensureLeagueWeekUpToDate) {
    window.ensureLeagueWeekUpToDate();
  }

  if (window.evaluateObjectivesAndMaybeReward) {
    window.evaluateObjectivesAndMaybeReward();
  }

  if (window.evaluateAchievements) {
    window.evaluateAchievements();
  }

  saveUserData(userData);
  if (window.refreshUI) {
    window.refreshUI();
  }
  playBeep(0.2, 520);
  triggerVibration(160);

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
      playBeep(0.14, 720);
      triggerVibration(140);
      moveToNextStep();
      renderSessionUI();
      return;
    }
    updateRestDisplay();
  }, 1000);
}

function validateCurrentStep(performedValue, { skipPrompt = false } = {}) {
  const step = sessionState.steps[sessionState.stepIndex];
  if (!step) return;

  let finalValue = performedValue;
  if (finalValue === undefined || finalValue === null) {
    if (skipPrompt) return;
    const unitLabel = step.type === "reps" ? "répétitions" : "secondes";
    const response = prompt(
      `Saisis les ${unitLabel} réalisées (cible : ${step.target}).`,
      step.target
    );
    if (response === null) return;
    if (response.trim() === "") {
      finalValue = step.target;
    } else {
      const parsed = Number(response.replace(",", "."));
      if (!Number.isFinite(parsed) || parsed < 0) {
        alert("Entre une valeur valide.");
        return;
      }
      finalValue = parsed;
    }
  }

  if (step.type === "reps" && !updateStepWeightFromPrompt(step)) {
    return;
  }

  applySeriesResult(step, finalValue);

  sessionState.completedSteps.push({
    ...step,
    performedValue: finalValue,
  });

  sessionState.xpEarnedThisSession += computeStepXp(step, finalValue);
  triggerVibration(90);
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
      validateCurrentStep(step.target, { skipPrompt: true });
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
    validateCurrentStep();
    return;
  }

  if (step.type === "time") {
    const mainBtn = document.getElementById("session-complete-btn");
    if (mainBtn) mainBtn.disabled = true;
    startTimeCountdown(step);
  }
}

function handleTargetValidationClick() {
  if (sessionState.phase !== "work") return;
  const step = sessionState.steps[sessionState.stepIndex];
  if (!step || step.type !== "reps") return;
  validateCurrentStep(step.target, { skipPrompt: true });
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
    weightValue: weightInfo?.value ?? null,
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
  const recapSteps = document.getElementById("session-recap-steps");
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

  if (recapSteps) {
    recapSteps.innerHTML = "";
    if (sessionState.completedSteps.length) {
      sessionState.completedSteps.forEach((step) => {
        const li = document.createElement("li");
        const unitLabel = step.type === "reps" ? "répétitions" : "secondes";
        const weightLabel = step.weightLabel ? ` — ${step.weightLabel}` : "";
        li.textContent = `${getExerciseLabel(step.exerciseKey)} : ${
          step.performedValue
        } ${unitLabel} (cible ${step.target})${weightLabel}`;
        recapSteps.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.textContent = "Aucune série enregistrée.";
      recapSteps.appendChild(li);
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

function getFreeFormElements(prefix = "free") {
  return {
    exerciseSelect: document.getElementById(`${prefix}-exercise`),
    typeSelect: document.getElementById(`${prefix}-type`),
    valueInput: document.getElementById(`${prefix}-value`),
    weightRow: document.getElementById(`${prefix}-weight-row`),
    weightValue: document.getElementById(`${prefix}-weight`),
  };
}

function getNextFreeSeriesIndex(exerciseKey, steps = sessionState.steps) {
  return steps.filter((step) => step.exerciseKey === exerciseKey).length + 1;
}

function buildFreeStep(exerciseKey, type, target, steps = sessionState.steps) {
  const weightInfo =
    typeof window.getCurrentChallengeWeightInfo === "function"
      ? window.getCurrentChallengeWeightInfo(exerciseKey)
      : null;
  const challenge = challengePrograms[exerciseKey];
  const totalMultiplier =
    challenge?.weightTotalMultiplier || (challenge?.hasWeight ? 2 : 1);
  const seriesIndex = getNextFreeSeriesIndex(exerciseKey, steps);

  return {
    challengeId: null,
    exerciseKey,
    type,
    target,
    label: `${getExerciseLabel(exerciseKey)} — Série ${seriesIndex}`,
    weightValue: weightInfo?.value ?? null,
    weightKgTotal: weightInfo?.value
      ? weightInfo.value * totalMultiplier
      : null,
    weightLabel: weightInfo?.label || "",
    level: null,
  };
}

function appendFreeStep(step) {
  sessionState.steps.push(step);
  updateStepDisplay();
  updateXpPreview();
}

function readFreeForm(prefix = "free") {
  const { exerciseSelect, typeSelect, valueInput } = getFreeFormElements(prefix);
  if (!exerciseSelect || !typeSelect || !valueInput) return null;

  const exerciseKey = exerciseSelect.value;
  const type = typeSelect.value;
  const target = Number(valueInput.value);

  if (!exerciseKey) {
    alert("Sélectionne un exercice disponible.");
    return null;
  }

  if (!target || target <= 0) {
    alert("Entre une valeur valide.");
    return null;
  }

  const allowedTypes = getAllowedFreeTypes(exerciseKey);
  if (!allowedTypes.includes(type)) {
    alert("Type de séance indisponible pour cet exercice.");
    return null;
  }

  return { exerciseKey, type, target };
}

function startFreeSessionFromForm() {
  const values = readFreeForm("free");
  if (!values) return;

  const step = buildFreeStep(
    values.exerciseKey,
    values.type,
    values.target,
    []
  );

  startSessionEngine({
    mode: "free",
    steps: [step],
    title: "Séance libre",
    subtitle: "Entraînement libre",
  });
}

function addFreeSeries() {
  if (sessionState.mode !== "free" || !sessionState.steps.length) return;
  const lastStep = sessionState.steps[sessionState.steps.length - 1];
  const newStep = buildFreeStep(
    lastStep.exerciseKey,
    lastStep.type,
    lastStep.target
  );
  appendFreeStep(newStep);
}

function addFreeExerciseFromForm() {
  if (sessionState.mode !== "free") return;
  const values = readFreeForm("session-free");
  if (!values) return;
  const newStep = buildFreeStep(values.exerciseKey, values.type, values.target);
  appendFreeStep(newStep);
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

function updateFreeWeightUI(prefix = "free") {
  const { exerciseSelect, weightRow, weightValue } =
    getFreeFormElements(prefix);

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

function getAllowedFreeTypes(exerciseKey) {
  const challenge = challengePrograms?.[exerciseKey];
  if (challenge?.type === "time") return ["time"];
  if (challenge?.type === "reps") return ["reps"];
  return ["reps", "time"];
}

function updateFreeTypeOptions(exerciseKey, prefix = "free") {
  const { typeSelect } = getFreeFormElements(prefix);
  if (!typeSelect) return;

  const allowedTypes = getAllowedFreeTypes(exerciseKey);
  typeSelect.innerHTML = "";

  const options = [
    { value: "reps", label: "Répétitions" },
    { value: "time", label: "Temps (secondes)" },
  ];

  options.forEach((option) => {
    if (!allowedTypes.includes(option.value)) return;
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    typeSelect.appendChild(opt);
  });

  if (!allowedTypes.includes(typeSelect.value) && typeSelect.options.length) {
    typeSelect.value = typeSelect.options[0].value;
  }
}

function updateFreeExerciseOptions(prefix = "free") {
  const { exerciseSelect } = getFreeFormElements(prefix);
  if (!exerciseSelect) return;

  const activeIds =
    typeof window.getActiveChallengeIds === "function"
      ? window.getActiveChallengeIds()
      : Object.keys(EXERCISE_LABELS);

  exerciseSelect.innerHTML = "";

  if (!activeIds.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Aucun challenge actif";
    option.disabled = true;
    option.selected = true;
    exerciseSelect.appendChild(option);
    updateFreeTypeOptions("", prefix);
    updateFreeWeightUI(prefix);
    return;
  }

  activeIds.forEach((challengeId) => {
    const option = document.createElement("option");
    option.value = challengeId;
    option.textContent = getExerciseLabel(challengeId);
    exerciseSelect.appendChild(option);
  });

  updateFreeTypeOptions(exerciseSelect.value, prefix);
  updateFreeWeightUI(prefix);
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

const sessionFreeAddExerciseBtn = document.getElementById(
  "session-free-add-exercise"
);
if (sessionFreeAddExerciseBtn) {
  sessionFreeAddExerciseBtn.addEventListener("click", addFreeExerciseFromForm);
}

const sessionFreeEndBtn = document.getElementById("session-free-end");
if (sessionFreeEndBtn) {
  sessionFreeEndBtn.addEventListener("click", endFreeSessionEarly);
}

const sessionTargetValidateBtn = document.getElementById(
  "session-validate-target-btn"
);
if (sessionTargetValidateBtn) {
  sessionTargetValidateBtn.addEventListener(
    "click",
    handleTargetValidationClick
  );
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
  ?.addEventListener("change", (event) => {
    updateFreeTypeOptions(event.target.value, "free");
    updateFreeWeightUI("free");
  });

const sessionFreeExerciseSelect = document.getElementById(
  "session-free-exercise"
);
if (sessionFreeExerciseSelect) {
  sessionFreeExerciseSelect.addEventListener("change", (event) => {
    updateFreeTypeOptions(event.target.value, "session-free");
    updateFreeWeightUI("session-free");
  });
}

updateFreeExerciseOptions("free");
updateFreeWeightUI("free");
updateFreeExerciseOptions("session-free");
updateFreeWeightUI("session-free");

window.startSession = startSoloSession;
window.startCombinedSession = startCombinedSession;
window.buildCombinedStepsFromSessions = buildCombinedStepsFromSessions;
window.updateFreeExerciseOptions = () => {
  updateFreeExerciseOptions("free");
  updateFreeExerciseOptions("session-free");
  updateFreeWeightUI("free");
  updateFreeWeightUI("session-free");
};
