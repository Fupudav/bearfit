function getAchievementProgress(definition) {
  const value = getMetricValue(definition.metric);
  const computedLevelIndex = definition.thresholds.reduce((acc, threshold, index) => {
    if (value >= threshold) return index;
    return acc;
  }, -1);
  const storedLevelIndex =
    userData?.achievements?.[definition.id]?.levelIndex ??
    userData?.unlockedAchievements?.[definition.id]?.levelIndex ??
    -1;
  const levelIndex = Math.max(storedLevelIndex, computedLevelIndex);
  const nextThreshold = definition.thresholds[levelIndex + 1] ?? null;
  const tierName =
    levelIndex >= 0 ? definition.tiers?.[levelIndex] ?? null : null;

  return {
    value,
    levelIndex,
    nextThreshold,
    tierName,
  };
}

function buildAchievementCard(definition, progress) {
  const card = document.createElement("div");
  card.className = "card";
  if (progress.levelIndex < 0) {
    card.classList.add("locked");
  }

  const title = document.createElement("h3");
  title.textContent = definition.name;
  card.appendChild(title);

  if (definition.description) {
    const description = document.createElement("p");
    description.textContent = definition.description;
    card.appendChild(description);
  }

  const levelText = document.createElement("p");
  const displayTier =
    progress.tierName ?? definition.tiers?.[0] ?? "Bronze";
  levelText.textContent =
    progress.levelIndex >= 0
      ? `Tier ${displayTier} • ${progress.levelIndex + 1}/${definition.thresholds.length}`
      : `Tier ${displayTier} • À débloquer`;
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
  const categoryTitles = {
    streak_global: "Streak global",
    streak_challenge: "Streak par challenge",
    volume: "Volume",
    xp: "XP",
    leagues: "Ligues",
    fun: "Fun",
    combined: "Séances combinées",
  };
  const categoryOrder = [
    "streak_global",
    "streak_challenge",
    "volume",
    "xp",
    "leagues",
    "fun",
    "combined",
  ];
  const grouped = new Map();
  window.ACHIEVEMENTS.forEach((definition) => {
    if (!grouped.has(definition.category)) {
      grouped.set(definition.category, []);
    }
    grouped.get(definition.category).push(definition);
  });

  const recentUnlocks = new Set(window.__recentUnlocks || []);

  categoryOrder.forEach((category) => {
    const items = grouped.get(category);
    if (!items?.length) return;

    const title = document.createElement("h2");
    title.textContent = categoryTitles[category] || category;
    fragment.appendChild(title);

    items.forEach((definition) => {
      const progress = getAchievementProgress(definition);
      const card = buildAchievementCard(definition, progress);
      if (recentUnlocks.has(definition.id)) {
        card.classList.add("just-unlocked");
        setTimeout(() => {
          card.classList.remove("just-unlocked");
        }, 800);
      }
      fragment.appendChild(card);
    });
  });

  window.__recentUnlocks = [];

  list.appendChild(fragment);
}

window.renderSuccesses = renderSuccesses;
