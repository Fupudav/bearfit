function renderStats() {
  const statsXp = document.getElementById("stats-xp");
  if (statsXp) {
    statsXp.textContent = userData.xp;
  }

  const statsStreak = document.getElementById("stats-streak");
  if (statsStreak) {
    statsStreak.textContent = userData.streakGlobal;
  }

  const totalPompes = document.getElementById("stats-total-pompes");
  if (totalPompes) {
    totalPompes.textContent = userData.stats.totalPompes;
  }

  const maxPompes = document.getElementById("stats-max-pompes");
  if (maxPompes) {
    maxPompes.textContent = userData.stats.maxPompes;
  }

  const totalGainage = document.getElementById("stats-total-gainage");
  if (totalGainage) {
    totalGainage.textContent = userData.stats.totalGainage;
  }

  const maxGainage = document.getElementById("stats-max-gainage");
  if (maxGainage) {
    maxGainage.textContent = userData.stats.maxGainage;
  }

  const totalAbdos = document.getElementById("stats-total-abdos");
  if (totalAbdos) {
    totalAbdos.textContent = userData.stats.totalAbdos;
  }

  const maxAbdos = document.getElementById("stats-max-abdos");
  if (maxAbdos) {
    maxAbdos.textContent = userData.stats.maxAbdos;
  }

  const totalTriceps = document.getElementById("stats-total-triceps");
  if (totalTriceps) {
    totalTriceps.textContent = userData.stats.totalTriceps;
  }

  const maxTriceps = document.getElementById("stats-max-triceps");
  if (maxTriceps) {
    maxTriceps.textContent = userData.stats.maxTriceps;
  }

  const weightTriceps = document.getElementById("stats-weight-triceps");
  if (weightTriceps) {
    const info =
      typeof window.getCurrentChallengeWeightInfo === "function"
        ? window.getCurrentChallengeWeightInfo("triceps")
        : null;
    weightTriceps.textContent = info?.label || "–";
  }

  const totalDeveloppe = document.getElementById("stats-total-developpe");
  if (totalDeveloppe) {
    totalDeveloppe.textContent = userData.stats.totalDeveloppe;
  }

  const maxDeveloppe = document.getElementById("stats-max-developpe");
  if (maxDeveloppe) {
    maxDeveloppe.textContent = userData.stats.maxDeveloppe;
  }

  const weightDeveloppe = document.getElementById("stats-weight-developpe");
  if (weightDeveloppe) {
    const info =
      typeof window.getCurrentChallengeWeightInfo === "function"
        ? window.getCurrentChallengeWeightInfo("bench")
        : null;
    weightDeveloppe.textContent = info?.label || "–";
  }
}

window.renderStats = renderStats;
