function getAchievementProgress(definition) {
  const value = getMetricValue(definition.metric);
  const levelIndex = definition.thresholds.reduce((acc, threshold, index) => {
    if (value >= threshold) return index;
    return acc;
  }, -1);
  const nextThreshold = definition.thresholds[levelIndex + 1] ?? null;

  return {
    value,
    levelIndex,
    nextThreshold,
  };
}

function buildAchievementCard(definition, progress) {
  const card = document.createElement("div");
  card.className = "card";

  const title = document.createElement("h3");
  title.textContent = definition.name;
  card.appendChild(title);

  const levelText = document.createElement("p");
  levelText.textContent =
    progress.levelIndex >= 0
      ? `Niveau ${progress.levelIndex + 1}/${definition.thresholds.length}`
      : "À débloquer";
  card.appendChild(levelText);

  const progressText = document.createElement("p");
  if (progress.nextThreshold === null) {
    progressText.textContent = `Objectif max atteint (${progress.value} ${definition.unit})`;
  } else {
    progressText.textContent = `Progression : ${Math.min(
      progress.value,
      progress.nextThreshold
    )}/${progress.nextThreshold} ${definition.unit}`;
  }
  card.appendChild(progressText);

  return card;
}

function renderSuccesses() {
  const list = document.getElementById("success-list");
  if (!list) return;

  if (!window.ACHIEVEMENTS || !Array.isArray(window.ACHIEVEMENTS)) {
    list.textContent = "Aucun succès disponible pour le moment.";
    return;
  }

  if (typeof window.evaluateAchievements === "function") {
    window.evaluateAchievements();
  }

  list.textContent = "";

  const fragment = document.createDocumentFragment();
  window.ACHIEVEMENTS.forEach((definition) => {
    const progress = getAchievementProgress(definition);
    fragment.appendChild(buildAchievementCard(definition, progress));
  });

  list.appendChild(fragment);
}

window.renderSuccesses = renderSuccesses;

