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

// CHARGEMENT DES DONNÉES
function loadUserData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    saveUserData(defaultUserData);
    return structuredClone(defaultUserData);
  }
  return JSON.parse(raw);
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

  const daysInLevel = Object.keys(challenge.levels[currentLevel].days).length;

  if (currentDay < daysInLevel) {
    progress.day += 1;
  } else {
    // Niveau terminé → on passe au niveau suivant
    progress.level += 1;
    progress.day = 1;
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