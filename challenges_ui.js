// GÉNÉRATION DES TUILES DE CHALLENGES

function renderChallenges() {
  const container = document.getElementById("challenge-list");
  if (!container) return;

  container.innerHTML = "";

  const challenges = Object.values(challengePrograms).filter((challenge) =>
    typeof window.isChallengeActive === "function"
      ? window.isChallengeActive(challenge.id)
      : true
  );

  if (!challenges.length) {
    const empty = document.createElement("p");
    empty.textContent = "Aucun challenge actif pour le moment.";
    container.appendChild(empty);
    return;
  }

  challenges.forEach((challenge) => {
    const progress = userData.challenges[challenge.id];
    const level = progress?.level ?? 1;
    const day = progress?.day ?? 1;
    const todayKey =
      typeof window.getTodayKey === "function" ? window.getTodayKey() : null;
    const trainingEntry =
      todayKey && typeof window.getTrainingLogEntry === "function"
        ? window.getTrainingLogEntry(todayKey)
        : null;
    const completedToday =
      trainingEntry?.completedChallenges?.[challenge.id] === true;
    const weightInfo =
      typeof window.getChallengeWeightInfo === "function"
        ? window.getChallengeWeightInfo(challenge.id, level, day)
        : null;
    const streakValue = userData.challengeStreaks?.[challenge.id] ?? 0;

    const tile = document.createElement("div");
    tile.className = "challenge-tile";

    tile.innerHTML = `
      <h3>${challenge.name}</h3>
      <p>Type : ${challenge.type === "reps" ? "Répétitions" : "Temps"}</p>
      <p>${completedToday ? "Fait aujourd'hui ✅" : `Niveau ${level} – Jour ${day}`}</p>
      <p class="challenge-streak">🔥 ${streakValue}j</p>
      ${weightInfo ? `<p>Poids : ${weightInfo.label}</p>` : ""}
    `;

    tile.addEventListener("click", () => {
      const session = getTodayChallengeProgram(challenge.id);
      if (!session) {
        alert("Ce challenge n'a pas de séance disponible pour aujourd'hui.");
        return;
      }

      startSession(session);
      console.log("Séance du jour :", session);

      // Stockage temporaire de la séance active
      window.currentSession = session;

      // Passage à l'écran séance
      showScreen("session");
    });

    container.appendChild(tile);
  });
}

// Génération au chargement
renderChallenges();

// Rendre accessible depuis la console
window.renderChallenges = renderChallenges;
