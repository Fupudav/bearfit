// CLÉ UNIQUE DE SAUVEGARDE
const STORAGE_KEY = "bearfit_user_data";

// DONNÉES PAR DÉFAUT (si rien n'est sauvegardé)
const defaultUserData = {
  profile: {
    nickname: "Utilisateur",
    weight: null,
    height: null,
  },

  xp: 0,
  xpToday: {
    dateKey: null,
    value: 0,
  },
  lastXpDate: null,
  streakGlobal: 0,
  lastTrainingDate: null,
  dailyObjectives: {
    dateKey: null,
    main: null,
    secondary: null,
    bonusClaimed: false,
    mainClaimed: false,
    secondaryClaimed: false,
  },
  dailyCounters: {
    dateKey: null,
    sessionsCompleted: 0,
    pushups: 0,
    plankSeconds: 0,
    abs: 0,
    triceps: 0,
    bench: 0,
  },

  stats: {
    totalPompes: 0,
    totalGainage: 0,
    totalAbdos: 0,
    totalTriceps: 0,
    totalDeveloppe: 0,

    maxPompes: 0,
    maxGainage: 0,
    maxAbdos: 0,
    maxTriceps: 0,
    maxDeveloppe: 0,
  },

  challenges: {
    pushups: { level: 1, day: 1 },
    plank: { level: 1, day: 1 },
    abs: { level: 1, day: 1 },
    triceps: { level: 1, day: 1 },
    bench: { level: 1, day: 1 }
  },

  settings: {
    dailyXpGoal: 30,
    restTimePompes: 30,
    restTimeGainage: 30,
    restTimeAbdos: 30,
    restTimeTriceps: 45,
    restTimeDeveloppe: 60,
    notificationsEnabled: true,
    darkMode: true,
  }
};

function ensureStatsDefaults(data) {
  let updated = false;

  if (!data.stats || typeof data.stats !== "object") {
    data.stats = structuredClone(defaultUserData.stats);
    return true;
  }

  Object.entries(defaultUserData.stats).forEach(([key, value]) => {
    if (typeof data.stats[key] !== "number") {
      data.stats[key] = value;
      updated = true;
    }
  });

  return updated;
}

function ensureXpTodayDefaults(data, today) {
  let updated = false;

  if (!data.xpToday || typeof data.xpToday !== "object") {
    if (typeof data.xpToday === "number") {
      data.xpToday = {
        dateKey: data.lastXpDate || today,
        value: data.xpToday,
      };
    } else {
      data.xpToday = structuredClone(defaultUserData.xpToday);
    }
    updated = true;
  }

  if (typeof data.xpToday.value !== "number") {
    data.xpToday.value = 0;
    updated = true;
  }

  if (data.xpToday.dateKey !== today) {
    data.xpToday.dateKey = today;
    data.xpToday.value = 0;
    updated = true;
  }

  return updated;
}

function ensureDailyObjectivesDefaults(data) {
  let updated = false;

  if (!data.dailyObjectives || typeof data.dailyObjectives !== "object") {
    data.dailyObjectives = structuredClone(defaultUserData.dailyObjectives);
    return true;
  }

  Object.entries(defaultUserData.dailyObjectives).forEach(([key, value]) => {
    if (data.dailyObjectives[key] === undefined) {
      data.dailyObjectives[key] = structuredClone(value);
      updated = true;
    }
  });

  return updated;
}

function ensureDailyCountersDefaults(data) {
  let updated = false;

  if (!data.dailyCounters || typeof data.dailyCounters !== "object") {
    data.dailyCounters = structuredClone(defaultUserData.dailyCounters);
    return true;
  }

  Object.entries(defaultUserData.dailyCounters).forEach(([key, value]) => {
    if (data.dailyCounters[key] === undefined) {
      data.dailyCounters[key] = structuredClone(value);
      updated = true;
    }
  });

  return updated;
}

const dailyObjectiveTemplates = [
  {
    id: "xp_today_20",
    type: "xp_today",
    target: 20,
    rewardXp: 5,
    label: "Gagner 20 XP aujourd'hui",
  },
  {
    id: "xp_today_40",
    type: "xp_today",
    target: 40,
    rewardXp: 10,
    label: "Gagner 40 XP aujourd'hui",
  },
  {
    id: "xp_today_60",
    type: "xp_today",
    target: 60,
    rewardXp: 15,
    label: "Gagner 60 XP aujourd'hui",
  },
  {
    id: "do_one_session",
    type: "do_one_session",
    target: 1,
    rewardXp: 5,
    label: "Faire 1 séance aujourd'hui",
  },
  {
    id: "do_two_sessions",
    type: "do_two_sessions",
    target: 2,
    rewardXp: 10,
    label: "Faire 2 séances aujourd'hui",
  },
  {
    id: "pushups_total_10",
    type: "pushups_total",
    target: 10,
    rewardXp: 10,
    label: "Faire 10 pompes aujourd'hui",
  },
  {
    id: "pushups_total_20",
    type: "pushups_total",
    target: 20,
    rewardXp: 10,
    label: "Faire 20 pompes aujourd'hui",
  },
  {
    id: "pushups_total_30",
    type: "pushups_total",
    target: 30,
    rewardXp: 10,
    label: "Faire 30 pompes aujourd'hui",
  },
  {
    id: "plank_total_30",
    type: "plank_total",
    target: 30,
    rewardXp: 10,
    label: "Faire 30 secondes de gainage",
  },
  {
    id: "plank_total_60",
    type: "plank_total",
    target: 60,
    rewardXp: 10,
    label: "Faire 60 secondes de gainage",
  },
  {
    id: "plank_total_90",
    type: "plank_total",
    target: 90,
    rewardXp: 10,
    label: "Faire 90 secondes de gainage",
  },
  {
    id: "abs_total_15",
    type: "abs_total",
    target: 15,
    rewardXp: 10,
    label: "Faire 15 abdos aujourd'hui",
  },
  {
    id: "abs_total_30",
    type: "abs_total",
    target: 30,
    rewardXp: 10,
    label: "Faire 30 abdos aujourd'hui",
  },
  {
    id: "abs_total_45",
    type: "abs_total",
    target: 45,
    rewardXp: 10,
    label: "Faire 45 abdos aujourd'hui",
  },
];

// CHARGEMENT DES DONNÉES
function loadUserData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveUserData(defaultUserData);
    return structuredClone(defaultUserData);
  }
  const data = JSON.parse(raw);
  const today = new Date().toDateString();

  const statsUpdated = ensureStatsDefaults(data);
  const xpTodayUpdated = ensureXpTodayDefaults(data, today);
  const dailyObjectivesUpdated = ensureDailyObjectivesDefaults(data);
  const dailyCountersUpdated = ensureDailyCountersDefaults(data);

  if (statsUpdated || xpTodayUpdated || dailyObjectivesUpdated || dailyCountersUpdated) {
    saveUserData(data);
  }

  return data;
}

// SAUVEGARDE DES DONNÉES
function saveUserData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ACCÈS RAPIDE
let userData = loadUserData();

// MISE À JOUR DES XP
function addXp(amount) {
  ensureXpToday();
  userData.xp += amount;
  userData.xpToday.value += amount;
  userData.lastXpDate = userData.xpToday.dateKey;
  saveUserData(userData);
}

// MISE À JOUR DU STREAK
function updateStreak() {
  const today = new Date().toDateString();
  if (userData.lastTrainingDate === today) return;

  if (userData.lastTrainingDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (userData.lastTrainingDate === yesterday.toDateString()) {
      userData.streakGlobal += 1;
    } else {
      userData.streakGlobal = 1;
    }
  } else {
    userData.streakGlobal = 1;
  }

  userData.lastTrainingDate = today;
  saveUserData(userData);
}

// EXPORT SI BESOIN
window.userData = userData;
window.addXp = addXp;
window.updateStreak = updateStreak;
window.ensureDailyObjectives = ensureDailyObjectives;
window.ensureDailyCounters = ensureDailyCounters;
window.evaluateObjectivesAndMaybeReward = evaluateObjectivesAndMaybeReward;

// RECUPERER SEANCE DU JOUR
function getTodayChallengeProgram(challengeId) {
  const challenge = challengePrograms[challengeId];
  const progress = userData.challenges[challengeId];

  if (!challenge || !progress) return null;

  const level = progress.level;
  const day = progress.day;

  const dayProgram = challenge.levels[level]?.days[day];
  if (!dayProgram) return null;

  return {
    challengeId,
    name: challenge.name,
    type: challenge.type,
    level,
    day,
    series: dayProgram
  };
}

// Export console
window.getTodayChallengeProgram = getTodayChallengeProgram;

// VALIDER SEANCE
function completeChallengeDay(challengeId) {
  const progress = userData.challenges[challengeId];
  const challenge = challengePrograms[challengeId];

  if (!progress || !challenge) return false;
  const todayKey = new Date().toDateString();

  const currentLevel = progress.level;
  const currentDay = progress.day;

  const currentLevelData = challenge.levels[currentLevel];
  if (!currentLevelData) return false;

  const daysInLevel = Object.keys(currentLevelData.days).length;

  if (currentDay < daysInLevel) {
    progress.day += 1;
  } else {
    // Niveau terminé → on passe au niveau suivant
    const nextLevel = currentLevel + 1;
    if (challenge.levels[nextLevel]) {
      progress.level = nextLevel;
      progress.day = 1;
    } else {
      progress.day = daysInLevel;
    }
  }

  progress.lastCompletedDate = todayKey;

  saveUserData(userData);
  return true;
}

// Export
window.completeChallengeDay = completeChallengeDay;

// CALCUL XP D'UNE SÉANCE
function calculateSessionXp(session) {
  if (!session) return 0;

  let baseXp = 0;

  if (session.type === "reps") {
    baseXp = session.series.reduce((sum, reps) => sum + reps, 0);
  }

  if (session.type === "time") {
    baseXp = session.series.reduce((sum, seconds) => sum + seconds * 0.5, 0);
  }

  const levelMultiplier = 1 + (session.level - 1) * 0.2;

  return Math.round(baseXp * levelMultiplier);
}

// Export
window.calculateSessionXp = calculateSessionXp;

// CALCUL VOLUME D'UNE SÉANCE
function computeSessionVolume(session) {
  if (!session) return 0;

  if (session.type === "reps") {
    return session.series.reduce((sum, reps) => sum + reps, 0);
  }

  if (session.type === "time") {
    return session.series.reduce((sum, seconds) => sum + seconds, 0);
  }

  return 0;
}

function ensureXpToday() {
  const todayKey = new Date().toDateString();

  if (!userData.xpToday || typeof userData.xpToday !== "object") {
    userData.xpToday = structuredClone(defaultUserData.xpToday);
  }

  if (typeof userData.xpToday.value !== "number") {
    userData.xpToday.value = 0;
  }

  if (userData.xpToday.dateKey !== todayKey) {
    userData.xpToday.dateKey = todayKey;
    userData.xpToday.value = 0;
  }

  return userData.xpToday;
}

function ensureDailyCounters() {
  const todayKey = new Date().toDateString();

  if (!userData.dailyCounters || typeof userData.dailyCounters !== "object") {
    userData.dailyCounters = structuredClone(defaultUserData.dailyCounters);
  }

  if (userData.dailyCounters.dateKey !== todayKey) {
    userData.dailyCounters = {
      dateKey: todayKey,
      sessionsCompleted: 0,
      pushups: 0,
      plankSeconds: 0,
      abs: 0,
      triceps: 0,
      bench: 0,
    };
    saveUserData(userData);
  }

  return userData.dailyCounters;
}

function ensureDailyObjectives() {
  const todayKey = new Date().toDateString();

  if (
    !userData.dailyObjectives ||
    typeof userData.dailyObjectives !== "object"
  ) {
    userData.dailyObjectives = structuredClone(defaultUserData.dailyObjectives);
  }

  if (userData.dailyObjectives.dateKey !== todayKey) {
    const mainTemplate = dailyObjectiveTemplates[
      Math.floor(Math.random() * dailyObjectiveTemplates.length)
    ];
    let secondaryTemplate = dailyObjectiveTemplates[
      Math.floor(Math.random() * dailyObjectiveTemplates.length)
    ];

    while (secondaryTemplate.id === mainTemplate.id) {
      secondaryTemplate =
        dailyObjectiveTemplates[
          Math.floor(Math.random() * dailyObjectiveTemplates.length)
        ];
    }

    userData.dailyObjectives = {
      dateKey: todayKey,
      main: {
        id: mainTemplate.id,
        label: mainTemplate.label,
        type: mainTemplate.type,
        target: mainTemplate.target,
        rewardXp: mainTemplate.rewardXp,
        progress: 0,
        done: false,
      },
      secondary: {
        id: secondaryTemplate.id,
        label: secondaryTemplate.label,
        type: secondaryTemplate.type,
        target: secondaryTemplate.target,
        rewardXp: secondaryTemplate.rewardXp,
        progress: 0,
        done: false,
      },
      bonusClaimed: false,
      mainClaimed: false,
      secondaryClaimed: false,
    };

    saveUserData(userData);
  }

  return userData.dailyObjectives;
}

function recordDailySessionVolume(session) {
  if (!session || !session.challengeId) return;

  const counters = ensureDailyCounters();
  const volume = computeSessionVolume(session);

  switch (session.challengeId) {
    case "pushups":
      counters.pushups += volume;
      break;
    case "plank":
      counters.plankSeconds += volume;
      break;
    case "abs":
      counters.abs += volume;
      break;
    case "triceps":
      counters.triceps += volume;
      break;
    case "bench":
      counters.bench += volume;
      break;
    default:
      break;
  }

  saveUserData(userData);
}

function recordDailySessionCompletion() {
  const counters = ensureDailyCounters();
  counters.sessionsCompleted += 1;
  saveUserData(userData);
}

function evaluateObjectivesAndMaybeReward() {
  ensureDailyObjectives();
  ensureDailyCounters();
  ensureXpToday();

  const objectives = userData.dailyObjectives;
  let totalBonus = 0;

  const resolveProgress = (objective) => {
    if (!objective) return 0;
    switch (objective.type) {
      case "xp_today":
        return userData.xpToday.value;
      case "do_one_session":
      case "do_two_sessions":
        return userData.dailyCounters.sessionsCompleted;
      case "pushups_total":
        return userData.dailyCounters.pushups;
      case "plank_total":
        return userData.dailyCounters.plankSeconds;
      case "abs_total":
        return userData.dailyCounters.abs;
      case "triceps_total":
        return userData.dailyCounters.triceps;
      case "bench_total":
        return userData.dailyCounters.bench;
      default:
        return 0;
    }
  };

  if (objectives.main) {
    const progress = resolveProgress(objectives.main);
    objectives.main.progress = progress;
    objectives.main.done = progress >= objectives.main.target;

    if (objectives.main.done && !objectives.mainClaimed) {
      totalBonus += objectives.main.rewardXp;
      objectives.mainClaimed = true;
    }
  }

  if (objectives.secondary) {
    const progress = resolveProgress(objectives.secondary);
    objectives.secondary.progress = progress;
    objectives.secondary.done = progress >= objectives.secondary.target;

    if (objectives.secondary.done && !objectives.secondaryClaimed) {
      totalBonus += objectives.secondary.rewardXp;
      objectives.secondaryClaimed = true;
    }
  }

  objectives.bonusClaimed =
    objectives.mainClaimed && objectives.secondaryClaimed;

  if (totalBonus > 0) {
    addXp(totalBonus);
  } else {
    saveUserData(userData);
  }
}

// APPLIQUER STATS D'UNE SÉANCE
function applySessionStats(session) {
  if (!session || !session.challengeId) return;

  const volume = computeSessionVolume(session);

  switch (session.challengeId) {
    case "pushups":
      userData.stats.totalPompes += volume;
      userData.stats.maxPompes = Math.max(
        userData.stats.maxPompes,
        volume
      );
      break;
    case "plank":
      userData.stats.totalGainage += volume;
      userData.stats.maxGainage = Math.max(
        userData.stats.maxGainage,
        volume
      );
      break;
    case "abs":
      userData.stats.totalAbdos += volume;
      userData.stats.maxAbdos = Math.max(userData.stats.maxAbdos, volume);
      break;
    case "triceps":
      userData.stats.totalTriceps += volume;
      userData.stats.maxTriceps = Math.max(
        userData.stats.maxTriceps,
        volume
      );
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

  saveUserData(userData);
}

// Export
window.applySessionStats = applySessionStats;
window.recordDailySessionVolume = recordDailySessionVolume;
window.recordDailySessionCompletion = recordDailySessionCompletion;
