// GÉNÉRATION DES TUILES DE CHALLENGES

function renderChallenges() {
  const container = document.getElementById("challenge-list");
  if (!container) return;

  container.innerHTML = "";

  Object.values(challengePrograms).forEach((challenge) => {
    const progress = userData.challenges[challenge.id];
    const level = progress?.level ?? 1;
    const day = progress?.day ?? 1;
    const tile = document.createElement("div");
    tile.className = "challenge-tile";

    tile.innerHTML = `
      <h3>${challenge.name}</h3>
      <p>Type : ${challenge.type === "reps" ? "Répétitions" : "Temps"}</p>
      <p>Niveau ${level} – Jour ${day}</p>
    `;

    tile.addEventListener("click", () => {
        const session = getTodayChallengeProgram(challenge.id);
        startSession(session);
        showScreen("session");
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

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("active");
  }
}