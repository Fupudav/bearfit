function buildChallengeLabel(name) {
  return name.replace(/^Challenge\s+/i, "");
}

function renderCombinedList() {
  const list = document.getElementById("combined-list");
  if (!list) return;

  list.innerHTML = "";

  if (typeof window.isTodayOffDay === "function" && window.isTodayOffDay()) {
    const empty = document.createElement("p");
    empty.textContent = "Jour de repos : séance combinée indisponible.";
    list.appendChild(empty);
    return;
  }

  const challenges = Object.values(challengePrograms).filter((challenge) =>
    typeof window.isChallengeActive === "function"
      ? window.isChallengeActive(challenge.id)
      : true
  );

  if (!challenges.length) {
    const empty = document.createElement("p");
    empty.textContent = "Aucun challenge actif pour la séance combinée.";
    list.appendChild(empty);
    return;
  }

  challenges.forEach((challenge) => {
    const label = document.createElement("label");
    label.className = "combined-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = challenge.id;

    const text = document.createElement("span");
    text.textContent = buildChallengeLabel(challenge.name);

    label.appendChild(checkbox);
    label.appendChild(text);
    list.appendChild(label);
  });
}

function openCombinedModal() {
  const modal = document.getElementById("combined-modal");
  if (!modal) return;
  const startBtn = document.getElementById("combined-start-btn");
  const isOffDay =
    typeof window.isTodayOffDay === "function" && window.isTodayOffDay();
  const isAvailable =
    typeof window.isCombinedSessionAvailable === "function"
      ? window.isCombinedSessionAvailable()
      : true;
  if (startBtn) {
    startBtn.disabled = isOffDay || !isAvailable;
  }
  renderCombinedList();
  modal.classList.remove("hidden");
}

function closeCombinedModal() {
  const modal = document.getElementById("combined-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}

function handleCombinedStart() {
  const list = document.getElementById("combined-list");
  if (!list) return;

  const selectedIds = Array.from(
    list.querySelectorAll("input[type='checkbox']:checked")
  ).map((input) => input.value);

  if (selectedIds.length < 2 || selectedIds.length > 5) {
    alert("Sélectionne entre 2 et 5 challenges pour la séance combinée.");
    return;
  }

  const sessions = [];

  for (const challengeId of selectedIds) {
    const session = getTodayChallengeProgram(challengeId);
    if (!session) {
      alert("Une des séances sélectionnées est indisponible aujourd'hui.");
      return;
    }
    sessions.push(session);
  }

  const steps =
    typeof window.buildCombinedStepsFromSessions === "function"
      ? window.buildCombinedStepsFromSessions(sessions)
      : [];

  const combinedSession = {
    mode: "combined",
    name: "Séance combinée",
    steps,
  };

  if (!combinedSession.steps.length) {
    alert("Impossible de générer la séance combinée.");
    return;
  }

  startCombinedSession(combinedSession);
  closeCombinedModal();
  showScreen("session");
}

document.getElementById("btn-combined-session")?.addEventListener("click", () => {
  openCombinedModal();
});

document.getElementById("combined-cancel-btn")?.addEventListener("click", () => {
  closeCombinedModal();
});

document.getElementById("combined-start-btn")?.addEventListener("click", () => {
  handleCombinedStart();
});

window.openCombinedModal = openCombinedModal;
