const TIERS = ["Bronze", "Argent", "Or", "Platine", "Diamant"];
const DEFAULT_REWARDS = [20, 40, 70, 110, 160];

const ACHIEVEMENTS = [
  // STREAK GLOBAL — 5 succès racines
  {
    id: "streak_global_1",
    category: "streak_global",
    name: "Habitude naissante",
    description: "Commence à construire ton rythme.",
    metric: "streakGlobal",
    unit: "jours",
    thresholds: [3, 5, 7, 10, 14],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },
  {
    id: "streak_global_2",
    category: "streak_global",
    name: "Rythme solide",
    description: "Tu tiens la cadence sur la durée.",
    metric: "streakGlobal",
    unit: "jours",
    thresholds: [15, 20, 25, 28, 30],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },
  {
    id: "streak_global_3",
    category: "streak_global",
    name: "Discipline continue",
    description: "La régularité devient une seconde nature.",
    metric: "streakGlobal",
    unit: "jours",
    thresholds: [40, 50, 60, 75, 90],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },
  {
    id: "streak_global_4",
    category: "streak_global",
    name: "Machine de régularité",
    description: "Ton rythme est inébranlable.",
    metric: "streakGlobal",
    unit: "jours",
    thresholds: [100, 120, 150, 180, 200],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },
  {
    id: "streak_global_5",
    category: "streak_global",
    name: "Légende vivante",
    description: "Une constance digne d’une légende.",
    metric: "streakGlobal",
    unit: "jours",
    thresholds: [250, 300, 365, 400, 500],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },

  // STREAK PAR CHALLENGE
  {
    id: "streak_pushups",
    category: "streak_challenge",
    name: "Pompes régulières",
    description: "Enchaîne les séances de pompes sans casser la chaîne.",
    metric: "streak:pushups",
    unit: "jours",
    thresholds: [3, 7, 14, 30, 60],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },

  // VOLUME
  {
    id: "volume_pushups",
    category: "volume",
    name: "Pompes cumulées",
    description: "Accumule un gros volume sur les pompes.",
    metric: "totalPompes",
    unit: "pompes",
    thresholds: [100, 500, 2000, 8000, 20000],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },

  // XP TOTAL
  {
    id: "xp_total",
    category: "xp",
    name: "Accumulation",
    description: "Empile les XP au fil des séances.",
    metric: "xpTotal",
    unit: "XP",
    thresholds: [200, 500, 1500, 5000, 15000],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },

  // FUN
  {
    id: "fun_sessions",
    category: "fun",
    name: "Toujours partant",
    description: "Multiplie les séances pour garder le fun.",
    metric: "totalSessions",
    unit: "séances",
    thresholds: [5, 20, 50, 100, 200],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },

  // SÉANCES COMBINÉES
  {
    id: "combined_sessions",
    category: "combined",
    name: "Enchaînement",
    description: "Enchaîne plusieurs challenges dans une même séance.",
    metric: "combinedSessions",
    unit: "séances",
    thresholds: [10, 50, 200, 300, 500],
    tiers: TIERS,
    rewardXp: DEFAULT_REWARDS,
  },
];

window.ACHIEVEMENTS = ACHIEVEMENTS;
