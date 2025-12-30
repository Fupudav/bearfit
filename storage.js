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
  xpToday: 0,
  lastXpDate: null,
  streakGlobal: 0,
  lastTrainingDate: null,

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

  if (data.lastXpDate !== today) {
    data.xpToday = 0;
    data.lastXpDate = today;
    saveUserData(data);
  }

  if (statsUpdated) {
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
  userData.xp += amount;
  userData.xpToday += amount;
  userData.lastXpDate = new Date().toDateString();
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

  if (!progress || !challenge) return;

  const currentLevel = progress.level;
  const currentDay = progress.day;

  const currentLevelData = challenge.levels[currentLevel];
  if (!currentLevelData) return;

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

  saveUserData(userData);
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
