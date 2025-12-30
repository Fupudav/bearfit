// GÉNÉRATION DES TUILES DE CHALLENGES

function renderChallenges() {
  const container = document.getElementById("challenge-list");
  if (!container) return;

  container.innerHTML = "";

  Object.values(challengePrograms).forEach((challenge) => {
    const progress = userData.challenges[challenge.id];
    const level = progress?.level ?? 1;
    const day = progress?.day ?? 1;
    const weightInfo =
      typeof window.getChallengeWeightInfo === "function"
        ? window.getChallengeWeightInfo(challenge.id, level, day)
        : null;
    const tile = document.createElement("div");
    tile.className = "challenge-tile";

    tile.innerHTML = `
      <h3>${challenge.name}</h3>
      <p>Type : ${challenge.type === "reps" ? "Répétitions" : "Temps"}</p>
      <p>Niveau ${level} – Jour ${day}</p>
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
