// Définition des programmes de challenges

// Chaque challenge a :
// - id
// - nom
// - type ("reps" ou "time")
// - levels : 1 à 5
// - chaque level a 28 jours
//   pour le moment on remplit que quelques jours du niveau 1 en exemple

const challengePrograms = {
  pushups: {
    id: "pushups",
    name: "Challenge Pompes",
    type: "reps",
    levels: {
      1: {
        label: "Niveau 1",
        days: {
          // jour: [reps série 1, série 2, série 3, ...]
          1: [3, 3, 4],
          2: [4, 4, 4],
          3: [4, 5, 5],
          4: [5, 5, 5],
          5: [5, 6, 6],
          6: [6, 6, 6],
          7: [6, 7, 7],
          // on complètera jusqu'à 28 plus tard
        }
      },
      // niveaux 2 à 5 : à remplir plus tard
    }
  },

  plank: {
    id: "plank",
    name: "Challenge Gainage",
    type: "time", // en secondes
    levels: {
      1: {
        label: "Niveau 1",
        days: {
          // jour: [durée série 1, série 2, ...] en secondes
          1: [20, 20],
          2: [20, 25],
          3: [25, 25],
          4: [25, 30],
          5: [30, 30],
          6: [30, 35],
          7: [35, 35],
        }
      }
    }
  },

  abs: {
    id: "abs",
    name: "Challenge Abdos",
    type: "reps",
    levels: {
      1: {
        label: "Niveau 1",
        days: {
          1: [10, 10],
          2: [10, 12],
          3: [12, 12],
          4: [12, 14],
          5: [14, 14],
          6: [14, 16],
          7: [16, 16],
        }
      }
    }
  },

  triceps: {
    id: "triceps",
    name: "Challenge Triceps haltères",
    type: "reps",
    levels: {
      1: {
        label: "Niveau 1",
        days: {
          1: [8, 8],
          2: [8, 10],
          3: [10, 10],
          4: [10, 12],
          5: [12, 12],
          6: [12, 14],
          7: [14, 14],
        }
      }
    }
  },

  bench: {
    id: "bench",
    name: "Challenge Développé couché",
    type: "reps",
    levels: {
      1: {
        label: "Niveau 1",
        days: {
          1: [8, 8],
          2: [8, 9],
          3: [9, 9],
          4: [9, 10],
          5: [10, 10],
          6: [10, 11],
          7: [11, 11],
        }
      }
    }
  }
};

// On expose dans window pour que d'autres scripts puissent l'utiliser
window.challengePrograms = challengePrograms;