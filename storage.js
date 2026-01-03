// CLÉ UNIQUE DE SAUVEGARDE
const STORAGE_KEY = "bearfit_user_data";

const LEAGUE_GHOST_NAMES = [
  "Ours Alpha",
  "Ours Boréal",
  "Griffe Rapide",
  "Miel Courageux",
  "Brume du Nord",
  "Patte d'Acier",
  "Croc Lunaire",
  "Rugissement Sage",
  "Neige Farouche",
];

const LEAGUE_XP_RANGES = [
  { min: 100, max: 400 },
  { min: 300, max: 700 },
  { min: 600, max: 1000 },
  { min: 900, max: 1400 },
  { min: 1200, max: 1800 },
  { min: 1500, max: 2200 },
  { min: 1900, max: 2800 },
  { min: 2300, max: 3500 },
  { min: 2700, max: 4500 },
  { min: 3000, max: 6000 },
];

const CHALLENGE_IDS = ["pushups", "plank", "abs", "triceps", "bench"];
const OFF_DAYS_PATTERNS = {
  0: [],
  1: ["sun"],
  2: ["sat", "sun"],
  3: ["wed", "sat", "sun"],
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toLocalIsoDate(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function isoToday() {
  return toLocalIsoDate(new Date());
}

function normalizeIsoDate(value) {
  if (!value) return null;
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return toLocalIsoDate(parsed);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toLocalIsoDate(value);
  }
  return null;
}

function getWeekStartISO(date = new Date()) {
  const copy = new Date(date);
  const dayIndex = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - dayIndex);
  copy.setHours(0, 0, 0, 0);
  return copy.toISOString().slice(0, 10);
}

function getLeagueXpRange(league) {
  return LEAGUE_XP_RANGES[league - 1] || LEAGUE_XP_RANGES[0];
}

function generateLeagueGhosts(league) {
  const range = getLeagueXpRange(league);
  return LEAGUE_GHOST_NAMES.map((name) => ({
    name,
    xp:
      Math.floor(Math.random() * (range.max - range.min + 1)) + range.min,
  }));
}

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
  dailyXpGoalBonusDate: null,
  dailyObjectives: {
    dateKey: null,
    main: null,
    secondary: null,
    mainClaimed: false,
    secondaryClaimed: false,
    rerollsLeft: 1,
  },
  dailyCounters: {
    dateKey: null,
    sessionsCompleted: 0,
    combinedSessions: 0,
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
    combinedSessionsCount: 0,
    totalSessions: 0,

    maxPompes: 0,
    maxGainage: 0,
    maxAbdos: 0,
    maxTriceps: 0,
    maxDeveloppe: 0,
    maxTricepsWeight: 0,
    maxDeveloppeWeight: 0,
  },

  achievements: {},
  unlockedAchievements: {},
  achievementEvents: [],

  challengeStreaks: {
    pushups: 0,
    plank: 0,
    abs: 0,
    triceps: 0,
    bench: 0,
  },

  lastChallengeTrainingDate: {
    pushups: null,
    plank: null,
    abs: null,
    triceps: null,
    bench: null,
  },

  challenges: {
    pushups: { level: 1, day: 1 },
    plank: { level: 1, day: 1 },
    abs: { level: 1, day: 1 },
    triceps: { level: 1, day: 1 },
    bench: { level: 1, day: 1 }
  },

  league: {
    currentLeague: 1,
    weekStartISO: getWeekStartISO(new Date()),
    weekXp: 0,
    bestLeague: 1,
    lastResult: null,
    ghosts: generateLeagueGhosts(1),
  },

  leagueHistory: [],

  settings: {
    dailyXpGoal: 30,
    restTimePompes: 30,
    restTimeGainage: 30,
    restTimeAbdos: 30,
    restTimeTriceps: 45,
    restTimeDeveloppe: 60,
    weeklyOffDays: 0,
    offDaysPattern: [],
    activeChallenges: {
      pushups: true,
      plank: true,
      abs: true,
      triceps: true,
      bench: true,
    },
    theme: "auto",
    soundEnabled: true,
    vibrationEnabled: true,
    remindersEnabled: false,
    reminderDailyTime: "19:00",
    reminderXpGoalTime: "21:00",
  }
};

function getOffDaysPattern(weeklyOffDays) {
  const count = Number.isFinite(weeklyOffDays)
    ? Math.min(3, Math.max(0, weeklyOffDays))
    : 0;
  return OFF_DAYS_PATTERNS[count] || OFF_DAYS_PATTERNS[0];
}

function getDayKey(date) {
  return DAY_KEYS[date.getDay()] || "sun";
}

function isDateOffDay(date, settings = userData?.settings) {
  if (!settings) return false;
  const pattern = Array.isArray(settings.offDaysPattern)
    ? settings.offDaysPattern
    : [];
  return pattern.includes(getDayKey(date));
}

function isTodayOffDay() {
  return isDateOffDay(new Date());
}

function getActiveChallengeIds() {
  const active = userData?.settings?.activeChallenges || {};
  return CHALLENGE_IDS.filter((challengeId) => active[challengeId] !== false);
}

function isChallengeActive(challengeId) {
  if (!challengeId) return true;
  const active = userData?.settings?.activeChallenges;
  if (!active || typeof active !== "object") return true;
  return active[challengeId] !== false;
}

function ensureSettingsDefaults(data) {
  let updated = false;
  if (!data.settings || typeof data.settings !== "object") {
    data.settings = structuredClone(defaultUserData.settings);
    return true;
  }

  Object.entries(defaultUserData.settings).forEach(([key, value]) => {
    if (data.settings[key] === undefined) {
      data.settings[key] = structuredClone(value);
      updated = true;
    }
  });

  if (typeof data.settings.darkMode === "boolean" && !data.settings.theme) {
    data.settings.theme = data.settings.darkMode ? "dark" : "light";
    updated = true;
  }

  if (
    typeof data.settings.notificationsEnabled === "boolean" &&
    typeof data.settings.remindersEnabled !== "boolean"
  ) {
    data.settings.remindersEnabled = data.settings.notificationsEnabled;
    updated = true;
  }

  if (!Number.isFinite(data.settings.weeklyOffDays)) {
    data.settings.weeklyOffDays = 0;
    updated = true;
  }

  if (!Array.isArray(data.settings.offDaysPattern)) {
    data.settings.offDaysPattern = getOffDaysPattern(
      data.settings.weeklyOffDays
    );
    updated = true;
  }

  const expectedPattern = getOffDaysPattern(data.settings.weeklyOffDays);
  const currentPattern = data.settings.offDaysPattern;
  if (
    currentPattern.length !== expectedPattern.length ||
    currentPattern.some((day, index) => day !== expectedPattern[index])
  ) {
    data.settings.offDaysPattern = expectedPattern;
    updated = true;
  }

  if (
    !data.settings.activeChallenges ||
    typeof data.settings.activeChallenges !== "object"
  ) {
    data.settings.activeChallenges = structuredClone(
      defaultUserData.settings.activeChallenges
    );
    updated = true;
  } else {
    CHALLENGE_IDS.forEach((challengeId) => {
      if (typeof data.settings.activeChallenges[challengeId] !== "boolean") {
        data.settings.activeChallenges[challengeId] = true;
        updated = true;
      }
    });
  }

  if (!["light", "dark", "auto"].includes(data.settings.theme)) {
    data.settings.theme = "auto";
    updated = true;
  }

  if (typeof data.settings.soundEnabled !== "boolean") {
    data.settings.soundEnabled = true;
    updated = true;
  }

  if (typeof data.settings.vibrationEnabled !== "boolean") {
    data.settings.vibrationEnabled = true;
    updated = true;
  }

  if (typeof data.settings.remindersEnabled !== "boolean") {
    data.settings.remindersEnabled = false;
    updated = true;
  }

  if (typeof data.settings.reminderDailyTime !== "string") {
    data.settings.reminderDailyTime = "19:00";
    updated = true;
  }

  if (typeof data.settings.reminderXpGoalTime !== "string") {
    data.settings.reminderXpGoalTime = "21:00";
    updated = true;
  }

  return updated;
}

function ensureLeagueDefaults(data) {
  let updated = false;
  const defaultWeekStart = getWeekStartISO(new Date());

  if (!data.league || typeof data.league !== "object") {
    data.league = structuredClone(defaultUserData.league);
    data.league.weekStartISO = defaultWeekStart;
    return true;
  }

  if (!Number.isFinite(data.league.currentLeague)) {
    data.league.currentLeague = 1;
    updated = true;
  }

  if (typeof data.league.weekStartISO !== "string") {
    data.league.weekStartISO = defaultWeekStart;
    updated = true;
  }

  if (!Number.isFinite(data.league.weekXp)) {
    data.league.weekXp = 0;
    updated = true;
  }

  if (!Number.isFinite(data.league.bestLeague)) {
    data.league.bestLeague = data.league.currentLeague;
    updated = true;
  }

  if (data.league.lastResult === undefined) {
    data.league.lastResult = null;
    updated = true;
  }

  if (!Array.isArray(data.league.ghosts) || data.league.ghosts.length !== 9) {
    data.league.ghosts = generateLeagueGhosts(data.league.currentLeague);
    updated = true;
  }

  return updated;
}

function ensureLeagueHistoryDefaults(data) {
  if (!Array.isArray(data.leagueHistory)) {
    data.leagueHistory = [];
    return true;
  }

  return false;
}

function ensureStatsDefaults(data) {
  let updated = false;

  if (!data.stats || typeof data.stats !== "object") {
    data.stats = structuredClone(defaultUserData.stats);
    return true;
  }

  if (
    typeof data.stats.combinedSessionsCount !== "number" &&
    typeof data.stats.combinedSessionsTotal === "number"
  ) {
    data.stats.combinedSessionsCount = data.stats.combinedSessionsTotal;
    updated = true;
  }

  Object.entries(defaultUserData.stats).forEach(([key, value]) => {
    if (typeof data.stats[key] !== "number") {
      data.stats[key] = value;
      updated = true;
    }
  });

  return updated;
}

function ensureChallengeStreakDefaults(data) {
  let updated = false;

  if (!data.challengeStreaks || typeof data.challengeStreaks !== "object") {
    data.challengeStreaks = structuredClone(
      defaultUserData.challengeStreaks
    );
    return true;
  }

  Object.entries(defaultUserData.challengeStreaks).forEach(([key, value]) => {
    if (typeof data.challengeStreaks[key] !== "number") {
      data.challengeStreaks[key] = value;
      updated = true;
    }
  });

  return updated;
}

function ensureLastChallengeTrainingDateDefaults(data) {
  let updated = false;

  if (
    !data.lastChallengeTrainingDate ||
    typeof data.lastChallengeTrainingDate !== "object"
  ) {
    data.lastChallengeTrainingDate = structuredClone(
      defaultUserData.lastChallengeTrainingDate
    );
    return true;
  }

  Object.entries(defaultUserData.lastChallengeTrainingDate).forEach(
    ([key, value]) => {
      if (data.lastChallengeTrainingDate[key] === undefined) {
        data.lastChallengeTrainingDate[key] = value;
        updated = true;
      }
    }
  );

  return updated;
}

function ensureUnlockedAchievementsDefaults(data) {
  if (!data.unlockedAchievements || typeof data.unlockedAchievements !== "object") {
    data.unlockedAchievements = {};
    return true;
  }

  return false;
}

function ensureDailyXpGoalBonusDateDefaults(data) {
  if (data.dailyXpGoalBonusDate === undefined) {
    data.dailyXpGoalBonusDate = null;
    return true;
  }

  return false;
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

function formatWeightValue(value) {
  if (!Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return `${value}`;
  return `${Math.round(value * 10) / 10}`;
}

function formatChallengeWeightLabel(challenge, weightValue) {
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

function getChallengeWeightInfo(challengeId, level, day) {
  const challenge = challengePrograms[challengeId];
  if (!challenge || !challenge.hasWeight || !challenge.weightPlan) return null;

  const plan = challenge.weightPlan[level];
  if (!plan) return null;

  const weekIndex = Math.max(1, Math.min(4, Math.ceil(day / 7)));
  const weekKey = `week${weekIndex}`;
  let weightValue = plan[weekKey];
  if (!Number.isFinite(weightValue)) return null;

  if (challenge.deloadDays?.includes(day)) {
    const delta = Number.isFinite(plan.deloadDelta) ? plan.deloadDelta : 0;
    weightValue += delta;
  }

  const label = formatChallengeWeightLabel(challenge, weightValue);

  return {
    value: weightValue,
    unit: challenge.weightUnit || "kg",
    label,
  };
}

function getCurrentChallengeWeightInfo(challengeId) {
  const progress = userData.challenges?.[challengeId];
  if (!progress) return null;
  return getChallengeWeightInfo(challengeId, progress.level, progress.day);
}

window.getChallengeWeightInfo = getChallengeWeightInfo;
window.getCurrentChallengeWeightInfo = getCurrentChallengeWeightInfo;

function clampTarget(expected, minimum) {
  const rawTarget = Math.round(expected * 0.7);
  return Math.min(expected, Math.max(minimum, rawTarget));
}

function getTodayExpectedVolumes() {
  const challengeIds = getActiveChallengeIds();
  const result = {};

  challengeIds.forEach((challengeId) => {
    const session = getTodayChallengeProgram(challengeId);
    if (!session || !Array.isArray(session.series)) {
      result[challengeId] = null;
      return;
    }
    const expected = session.series.reduce((sum, value) => sum + value, 0);
    result[challengeId] = expected > 0 ? expected : null;
  });

  return {
    pushupsExpected: result.pushups,
    plankExpected: result.plank,
    absExpected: result.abs,
    tricepsExpected: result.triceps,
    benchExpected: result.bench,
  };
}

function isCombinedSessionAvailable() {
  if (isTodayOffDay()) return false;
  const challengeIds = getActiveChallengeIds();
  const availableCount = challengeIds.filter(
    (challengeId) => Boolean(getTodayChallengeProgram(challengeId))
  ).length;
  return availableCount >= 2;
}

function buildObjective({ id, type, target, rewardXp, label }) {
  return {
    id,
    type,
    target,
    rewardXp,
    label,
    progress: 0,
    done: false,
  };
}

function buildObjectivePool() {
  if (isTodayOffDay()) return [];
  const pool = [];
  const xpGoal = userData.settings?.dailyXpGoal ?? 0;
  const xpTarget = Math.round(xpGoal * 0.8) || xpGoal;

  if (xpTarget > 0) {
    pool.push(
      buildObjective({
        id: `xp_today_${xpTarget}`,
        type: "xp_today",
        target: xpTarget,
        rewardXp: 10,
        label: `Gagner ${xpTarget} XP aujourd'hui`,
      })
    );
  }

  pool.push(
    buildObjective({
      id: "one_session",
      type: "one_session",
      target: 1,
      rewardXp: 5,
      label: "Faire 1 séance aujourd'hui",
    })
  );

  pool.push(
    buildObjective({
      id: "two_sessions",
      type: "two_sessions",
      target: 2,
      rewardXp: 10,
      label: "Faire 2 séances aujourd'hui",
    })
  );

  const expected = getTodayExpectedVolumes();

  if (expected.pushupsExpected) {
    const target = clampTarget(expected.pushupsExpected, 8);
    pool.push(
      buildObjective({
        id: `pushups_total_${target}`,
        type: "pushups_total",
        target,
        rewardXp: 10,
        label: `Faire ${target} pompes aujourd'hui`,
      })
    );
  }

  if (expected.plankExpected) {
    const target = clampTarget(expected.plankExpected, 20);
    pool.push(
      buildObjective({
        id: `plank_total_${target}`,
        type: "plank_total",
        target,
        rewardXp: 10,
        label: `Faire ${target} secondes de gainage`,
      })
    );
  }

  if (expected.absExpected) {
    const target = clampTarget(expected.absExpected, 10);
    pool.push(
      buildObjective({
        id: `abs_total_${target}`,
        type: "abs_total",
        target,
        rewardXp: 10,
        label: `Faire ${target} abdos aujourd'hui`,
      })
    );
  }

  if (expected.tricepsExpected) {
    const target = clampTarget(expected.tricepsExpected, 6);
    pool.push(
      buildObjective({
        id: `triceps_total_${target}`,
        type: "triceps_total",
        target,
        rewardXp: 10,
        label: `Faire ${target} triceps aujourd'hui`,
      })
    );
  }

  if (expected.benchExpected) {
    const target = clampTarget(expected.benchExpected, 6);
    pool.push(
      buildObjective({
        id: `bench_total_${target}`,
        type: "bench_total",
        target,
        rewardXp: 10,
        label: `Faire ${target} développés couchés aujourd'hui`,
      })
    );
  }

  if (isCombinedSessionAvailable()) {
    pool.push(
      buildObjective({
        id: "combo_session",
        type: "combo_session",
        target: 1,
        rewardXp: 10,
        label: "Faire une séance combinée aujourd'hui",
      })
    );
  }

  return pool;
}

function pickRandomObjective(options) {
  if (!options.length) return null;
  return options[Math.floor(Math.random() * options.length)];
}

// CHARGEMENT DES DONNÉES
function loadUserData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveUserData(defaultUserData);
    return structuredClone(defaultUserData);
  }
  const data = JSON.parse(raw);
  const today = new Date().toDateString();
  let lastTrainingDateUpdated = false;

  const statsUpdated = ensureStatsDefaults(data);
  const xpTodayUpdated = ensureXpTodayDefaults(data, today);
  const dailyObjectivesUpdated = ensureDailyObjectivesDefaults(data);
  const dailyCountersUpdated = ensureDailyCountersDefaults(data);
  const challengeStreaksUpdated = ensureChallengeStreakDefaults(data);
  const lastChallengeTrainingDateUpdated =
    ensureLastChallengeTrainingDateDefaults(data);
  const unlockedAchievementsUpdated = ensureUnlockedAchievementsDefaults(data);
  const dailyXpGoalBonusDateUpdated =
    ensureDailyXpGoalBonusDateDefaults(data);
  const leagueUpdated = ensureLeagueDefaults(data);
  const leagueHistoryUpdated = ensureLeagueHistoryDefaults(data);
  const settingsUpdated = ensureSettingsDefaults(data);
  let achievementsUpdated = false;
  const normalizedLastTrainingDate = normalizeIsoDate(data.lastTrainingDate);
  if (normalizedLastTrainingDate !== data.lastTrainingDate) {
    data.lastTrainingDate = normalizedLastTrainingDate;
    lastTrainingDateUpdated = true;
  }

  if (!data.achievements || typeof data.achievements !== "object") {
    data.achievements = {};
    achievementsUpdated = true;
  }

  if (!Array.isArray(data.achievementEvents)) {
    data.achievementEvents = [];
    achievementsUpdated = true;
  }

  if (
    statsUpdated ||
    xpTodayUpdated ||
    dailyObjectivesUpdated ||
    dailyCountersUpdated ||
    challengeStreaksUpdated ||
    lastChallengeTrainingDateUpdated ||
    unlockedAchievementsUpdated ||
    achievementsUpdated ||
    dailyXpGoalBonusDateUpdated ||
    leagueUpdated ||
    leagueHistoryUpdated ||
    settingsUpdated ||
    lastTrainingDateUpdated
  ) {
    saveUserData(data);
  }

  return data;
}

// SAUVEGARDE DES DONNÉES
function saveUserData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetUserData() {
  localStorage.removeItem(STORAGE_KEY);
  userData = structuredClone(defaultUserData);
  saveUserData(userData);
  window.userData = userData;
  if (window.refreshUI) {
    window.refreshUI();
  }
}

// ACCÈS RAPIDE
let userData = loadUserData();
maybeResetStreakOnOpen();
ensureLeagueWeekUpToDate();

// MISE À JOUR DES XP
function addXp(amount) {
  ensureXpToday();
  userData.xp += amount;
  userData.xpToday.value += amount;
  userData.lastXpDate = userData.xpToday.dateKey;
  addWeekXp(amount);
  saveUserData(userData);
}

// MISE À JOUR DU STREAK
function updateStreakOnTrainingCompletion() {
  const today = isoToday();
  if (userData.lastTrainingDate === today) return;

  if (!userData.lastTrainingDate) {
    userData.streakGlobal = 1;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toLocalIsoDate(yesterday);

    if (userData.lastTrainingDate === yesterdayKey) {
      userData.streakGlobal = (userData.streakGlobal || 0) + 1;
    } else {
      userData.streakGlobal = 1;
    }
  }

  userData.lastTrainingDate = today;
  saveUserData(userData);
}

function maybeResetStreakOnOpen() {
  if (!userData.lastTrainingDate) return;

  const today = new Date(`${isoToday()}T00:00:00`);
  const last = new Date(`${userData.lastTrainingDate}T00:00:00`);
  const diffDays = Math.floor((today - last) / 86400000);

  if (diffDays >= 2) {
    userData.streakGlobal = 0;
    saveUserData(userData);
  }
}

function updateChallengeStreak(challengeId) {
  if (!challengeId) return;
  const today = new Date().toDateString();

  if (!userData.challengeStreaks) {
    userData.challengeStreaks = structuredClone(
      defaultUserData.challengeStreaks
    );
  }

  if (!userData.lastChallengeTrainingDate) {
    userData.lastChallengeTrainingDate = structuredClone(
      defaultUserData.lastChallengeTrainingDate
    );
  }

  if (userData.lastChallengeTrainingDate[challengeId] === today) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toDateString();

  if (userData.lastChallengeTrainingDate[challengeId] === yesterdayKey) {
    userData.challengeStreaks[challengeId] =
      (userData.challengeStreaks[challengeId] || 0) + 1;
  } else {
    userData.challengeStreaks[challengeId] = 1;
  }

  userData.lastChallengeTrainingDate[challengeId] = today;
  saveUserData(userData);
}

// EXPORT SI BESOIN
window.userData = userData;
window.addXp = addXp;
window.isoToday = isoToday;
window.updateStreakOnTrainingCompletion = updateStreakOnTrainingCompletion;
window.updateStreak = updateStreakOnTrainingCompletion;
window.updateChallengeStreak = updateChallengeStreak;
window.maybeResetStreakOnOpen = maybeResetStreakOnOpen;
window.ensureDailyObjectives = ensureDailyObjectives;
window.ensureDailyCounters = ensureDailyCounters;
window.evaluateObjectivesAndMaybeReward = evaluateObjectivesAndMaybeReward;
window.getTodayExpectedVolumes = getTodayExpectedVolumes;
window.rerollSecondaryObjective = rerollSecondaryObjective;
window.resetUserData = resetUserData;
window.getWeekStartISO = getWeekStartISO;
window.ensureLeagueWeekUpToDate = ensureLeagueWeekUpToDate;
window.addWeekXp = addWeekXp;
window.buildLeagueLeaderboard = buildLeagueLeaderboard;
window.getActiveChallengeIds = getActiveChallengeIds;
window.isChallengeActive = isChallengeActive;
window.isTodayOffDay = isTodayOffDay;
window.getOffDaysPattern = getOffDaysPattern;
window.isCombinedSessionAvailable = isCombinedSessionAvailable;

function getMetricValue(pathString) {
  if (!pathString) return 0;

  if (pathString.startsWith("streak:")) {
    const challengeId = pathString.split(":")[1];
    if (!challengeId) return 0;
    return userData.challengeStreaks?.[challengeId] ?? 0;
  }

  switch (pathString) {
    case "streakGlobal":
      return userData.streakGlobal ?? 0;
    case "xpTotal":
      return userData.xp ?? 0;
    case "totalPompes":
      return userData.stats?.totalPompes ?? 0;
    case "combinedSessions":
      return userData.stats?.combinedSessionsCount ?? 0;
    case "totalSessions":
      return userData.stats?.totalSessions ?? 0;
    default:
      break;
  }

  if (pathString.includes(".")) {
    return pathString.split(".").reduce((acc, key) => {
      if (!acc || typeof acc !== "object") return 0;
      const value = acc[key];
      if (value === undefined || value === null) return 0;
      return value;
    }, userData);
  }

  const value = userData[pathString];
  return value ?? 0;
}

function evaluateAchievements() {
  if (!window.ACHIEVEMENTS || !Array.isArray(window.ACHIEVEMENTS)) return;

  if (!userData.achievements || typeof userData.achievements !== "object") {
    userData.achievements = {};
  }

  if (!userData.unlockedAchievements || typeof userData.unlockedAchievements !== "object") {
    userData.unlockedAchievements = {};
  }

  if (!Array.isArray(userData.achievementEvents)) {
    userData.achievementEvents = [];
  }

  if (!Array.isArray(window.__recentUnlocks)) {
    window.__recentUnlocks = [];
  }

  window.ACHIEVEMENTS.forEach((def) => {
    const value = getMetricValue(def.metric);
    const state =
      userData.achievements[def.id] || {
        levelIndex: -1,
        currentValue: value,
        claimedLevels: Array(def.thresholds.length).fill(false),
      };

    if (!Array.isArray(state.claimedLevels)) {
      state.claimedLevels = Array(def.thresholds.length).fill(false);
    }
    if (state.claimedLevels.length < def.thresholds.length) {
      state.claimedLevels = [
        ...state.claimedLevels,
        ...Array(def.thresholds.length - state.claimedLevels.length).fill(false),
      ];
    }

    const newLevelIndex = def.thresholds.reduce((acc, threshold, index) => {
      if (value >= threshold) return index;
      return acc;
    }, -1);

    if (newLevelIndex > state.levelIndex) {
      for (let i = state.levelIndex + 1; i <= newLevelIndex; i += 1) {
        state.claimedLevels[i] = true;
        userData.achievementEvents.push({
          id: def.id,
          levelIndex: i,
          ts: Date.now(),
        });
      }
      state.levelIndex = newLevelIndex;
      userData.unlockedAchievements[def.id] = {
        levelIndex: newLevelIndex,
        tier: def.tiers?.[newLevelIndex] ?? null,
        value,
        ts: Date.now(),
      };
      window.__recentUnlocks.push(def.id);
    }

    state.currentValue = value;
    userData.achievements[def.id] = state;
  });

  if (userData.achievementEvents.length > 20) {
    userData.achievementEvents = userData.achievementEvents.slice(-20);
  }

  saveUserData(userData);
}

window.evaluateAchievements = evaluateAchievements;
window.getMetricValue = getMetricValue;

function buildLeagueLeaderboard(leagueData) {
  if (!leagueData) return [];
  const ghosts = Array.isArray(leagueData.ghosts) ? leagueData.ghosts : [];
  const entries = ghosts.map((ghost) => ({
    ...ghost,
    isUser: false,
  }));
  entries.push({
    name: "Toi",
    xp: Number.isFinite(leagueData.weekXp) ? leagueData.weekXp : 0,
    isUser: true,
  });

  entries.sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (a.isUser && !b.isUser) return -1;
    if (b.isUser && !a.isUser) return 1;
    return a.name.localeCompare(b.name);
  });

  return entries;
}

function finalizeLeagueWeek() {
  if (!userData.league) return null;
  const leagueData = userData.league;
  const leaderboard = buildLeagueLeaderboard(leagueData);
  const rank = Math.max(
    1,
    leaderboard.findIndex((entry) => entry.isUser) + 1
  );

  const leagueBefore = leagueData.currentLeague;
  let leagueAfter = leagueBefore;
  let status = "maintien";

  if (rank <= 2 && leagueBefore < 10) {
    leagueAfter = leagueBefore + 1;
    status = "promotion";
  } else if (rank >= 9 && leagueBefore > 1) {
    leagueAfter = leagueBefore - 1;
    status = "retrogradation";
  }

  leagueData.currentLeague = leagueAfter;
  leagueData.bestLeague = Math.max(
    leagueData.bestLeague ?? leagueAfter,
    leagueAfter
  );
  leagueData.lastResult = {
    weekStartISO: leagueData.weekStartISO,
    leagueBefore,
    leagueAfter,
    rank,
    status,
  };

  if (!Array.isArray(userData.leagueHistory)) {
    userData.leagueHistory = [];
  }

  userData.leagueHistory.push({
    weekStartISO: leagueData.weekStartISO,
    league: leagueAfter,
    weekXp: Number.isFinite(leagueData.weekXp) ? leagueData.weekXp : 0,
    rank,
    status,
  });

  return leagueData.lastResult;
}

function ensureLeagueWeekUpToDate() {
  if (!userData) return false;
  ensureLeagueDefaults(userData);
  ensureLeagueHistoryDefaults(userData);

  const weekStartISONow = getWeekStartISO(new Date());
  if (userData.league.weekStartISO !== weekStartISONow) {
    finalizeLeagueWeek();
    userData.league.weekStartISO = weekStartISONow;
    userData.league.weekXp = 0;
    userData.league.ghosts = generateLeagueGhosts(
      userData.league.currentLeague
    );
    saveUserData(userData);
    if (window.evaluateAchievements) {
      window.evaluateAchievements();
    }
    return true;
  }

  return false;
}

function addWeekXp(amount) {
  if (!Number.isFinite(amount)) return;
  ensureLeagueWeekUpToDate();
  if (!userData.league) return;
  userData.league.weekXp += amount;
}

// RECUPERER SEANCE DU JOUR
function getTodayChallengeProgram(challengeId) {
  const challenge = challengePrograms[challengeId];
  const progress = userData.challenges[challengeId];

  if (!challenge || !progress) return null;
  if (typeof isChallengeActive === "function" && !isChallengeActive(challengeId)) {
    return null;
  }
  if (isTodayOffDay()) return null;

  const todayKey = new Date().toDateString();
  if (progress.lastCompletedDate === todayKey) return null;

  const level = progress.level;
  const day = progress.day;

  const dayProgram = challenge.levels[level]?.days[day];
  if (!dayProgram) return null;

  const weightInfo = getChallengeWeightInfo(challengeId, level, day);

  return {
    challengeId,
    name: challenge.name,
    type: challenge.type,
    level,
    day,
    series: dayProgram,
    weightInfo
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
  if (progress.lastCompletedDate === todayKey) return false;

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
      combinedSessions: 0,
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

  ensureDailyObjectivesDefaults(userData);

  if (userData.dailyObjectives.dateKey !== todayKey) {
    const pool = buildObjectivePool();
    const mainPriorityTypes = [
      "xp_today",
      "one_session",
      "pushups_total",
      "plank_total",
      "abs_total",
    ];

    const mainOptions = pool.filter((objective) =>
      mainPriorityTypes.includes(objective.type)
    );
    const mainObjective = pickRandomObjective(
      mainOptions.length ? mainOptions : pool
    );

    const secondaryOptions = pool.filter(
      (objective) => objective.id !== mainObjective?.id
    );
    const secondaryObjective = pickRandomObjective(secondaryOptions);

    userData.dailyObjectives = {
      dateKey: todayKey,
      main: mainObjective,
      secondary: secondaryObjective,
      mainClaimed: false,
      secondaryClaimed: false,
      rerollsLeft: 1,
    };

    saveUserData(userData);
  }

  return userData.dailyObjectives;
}

function rerollSecondaryObjective() {
  const objectives = ensureDailyObjectives();

  if (!objectives) {
    return { success: false, message: "Objectifs indisponibles." };
  }

  if (objectives.rerollsLeft <= 0) {
    return { success: false, message: "Reroll déjà utilisé aujourd'hui." };
  }

  const pool = buildObjectivePool();
  const secondaryOptions = pool.filter(
    (objective) =>
      objective.id !== objectives.main?.id &&
      objective.id !== objectives.secondary?.id
  );

  if (!secondaryOptions.length) {
    return { success: false, message: "Aucun autre objectif disponible." };
  }

  const newSecondary = pickRandomObjective(secondaryOptions);
  objectives.secondary = newSecondary;
  objectives.secondary.progress = 0;
  objectives.secondary.done = false;
  objectives.secondaryClaimed = false;
  objectives.rerollsLeft -= 1;

  saveUserData(userData);

  return { success: true };
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

function recordDailySessionCompletion(isCombined = false) {
  const counters = ensureDailyCounters();
  counters.sessionsCompleted += 1;
  if (isCombined) {
    counters.combinedSessions += 1;
  }
  if (userData.stats) {
    userData.stats.totalSessions = (userData.stats.totalSessions || 0) + 1;
  }
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
      case "one_session":
      case "two_sessions":
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
      case "combo_session":
        return userData.dailyCounters.combinedSessions;
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
