// RÉCUPÉRATION DES ÉCRANS
const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll(".nav-btn");

// FONCTION D'AFFICHAGE D'ÉCRAN
function showScreen(screenId) {
  if (
    screenId !== "session" &&
    typeof window.isSessionActive === "function" &&
    window.isSessionActive()
  ) {
    const confirmLeave = window.confirm(
      "Une séance est en cours. Quitter la séance ?"
    );
    if (!confirmLeave) {
      return;
    }
    if (typeof window.abortSession === "function") {
      window.abortSession();
    }
  }
  screens.forEach((screen) => {
    screen.classList.remove("active");
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add("active");
  }

  navButtons.forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeBtn = document.querySelector(`[data-screen="${screenId}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  if (typeof window.refreshUI === "function" && screenId !== "session") {
    window.refreshUI();
  }

  if (screenId === "stats" && typeof window.renderStats === "function") {
    window.renderStats();
  }

  if (screenId === "leagues" && typeof window.renderLeagues === "function") {
    window.renderLeagues();
  }

  if (
    screenId === "success" &&
    typeof window.renderSuccesses === "function"
  ) {
    window.renderSuccesses();
  }
}

// ÉVÉNEMENTS SUR LES BOUTONS
navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const screenId = button.dataset.screen;
    showScreen(screenId);
  });
});

// ÉCRAN PAR DÉFAUT AU LANCEMENT
showScreen("home");
