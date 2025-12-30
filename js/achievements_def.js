const ACHIEVEMENTS = [
  // STREAK GLOBAL — 5 succès racines
  {
    id: "streak_global_1",
    name: "Habitude naissante",
    category: "streak",
    metric: "streakGlobal",
    thresholds: [3, 5, 7, 10, 14],
    unit: "jours",
  },
  {
    id: "streak_global_2",
    name: "Rythme solide",
    category: "streak",
    metric: "streakGlobal",
    thresholds: [15, 20, 25, 28, 30],
    unit: "jours",
  },
  {
    id: "streak_global_3",
    name: "Discipline continue",
    category: "streak",
    metric: "streakGlobal",
    thresholds: [40, 50, 60, 75, 90],
    unit: "jours",
  },
  {
    id: "streak_global_4",
    name: "Machine de régularité",
    category: "streak",
    metric: "streakGlobal",
    thresholds: [100, 120, 150, 180, 200],
    unit: "jours",
  },
  {
    id: "streak_global_5",
    name: "Légende vivante",
    category: "streak",
    metric: "streakGlobal",
    thresholds: [250, 300, 365, 400, 500],
    unit: "jours",
  },

  // XP TOTAL (à ajuster plus tard si besoin)
  {
    id: "xp_total",
    name: "Accumulation",
    category: "xp",
    metric: "xp",
    thresholds: [200, 500, 1500, 5000, 15000],
    unit: "XP",
  },

  // VOLUME CUMULÉ PAR EXERCICE (basé sur userData.stats.* existants)
  {
    id: "pushups_total",
    name: "Pompes cumulées",
    category: "volume",
    metric: "stats.totalPompes",
    thresholds: [100, 500, 2000, 8000, 20000],
    unit: "pompes",
  },
  {
    id: "plank_total",
    name: "Gainage cumulé",
    category: "volume",
    metric: "stats.totalGainage",
    thresholds: [300, 900, 3600, 10800, 36000],
    unit: "secondes",
  },
  {
    id: "abs_total",
    name: "Abdos cumulés",
    category: "volume",
    metric: "stats.totalAbdos",
    thresholds: [200, 800, 3000, 9000, 20000],
    unit: "reps",
  },
  {
    id: "triceps_total",
    name: "Triceps cumulés",
    category: "volume",
    metric: "stats.totalTriceps",
    thresholds: [150, 600, 2500, 8000, 18000],
    unit: "reps",
  },
  {
    id: "bench_total",
    name: "Développé cumulé",
    category: "volume",
    metric: "stats.totalDeveloppe",
    thresholds: [150, 600, 2500, 8000, 18000],
    unit: "reps",
  },

  // SÉANCES COMBINÉES (compteur total)
  {
    id: "combo_sessions",
    name: "Enchaîneur",
    category: "combo",
    metric: "stats.combinedSessionsTotal",
    thresholds: [3, 10, 30, 80, 200],
    unit: "séances",
  },
];

window.ACHIEVEMENTS = ACHIEVEMENTS;
