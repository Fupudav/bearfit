function buildChallengeLabel(name) {
  return name.replace(/^Challenge\s+/i, "");
}

function renderCombinedList() {
  const list = document.getElementById("combined-list");
  if (!list) return;

  list.innerHTML = "";

  Object.values(challengePrograms).forEach((challenge) => {
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
  renderCombinedList();
  modal.classList.remove("hidden");
}

function closeCombinedModal() {
  const modal = document.getElementById("combined-modal");
  if (!modal) return;
  modal.classList.add("hidden");
}

function buildCombinedSteps(sessions) {
  const steps = [];
  const maxSeries = Math.max(...sessions.map((session) => session.series.length));

  for (let serieIndex = 0; serieIndex < maxSeries; serieIndex += 1) {
    sessions.forEach((session) => {
      const value = session.series[serieIndex];
      if (value === undefined) return;

      const challenge = challengePrograms[session.challengeId];
      steps.push({
        challengeId: session.challengeId,
        challengeName: buildChallengeLabel(challenge.name),
        type: session.type,
        value,
        weightInfo: session.weightInfo || null,
        stepIndex: steps.length + 1,
        serieIndex: serieIndex + 1,
        totalSeries: session.series.length,
      });
    });
  }

  return steps;
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

  const combinedSession = {
    mode: "combined",
    name: "Séance combinée",
    steps: buildCombinedSteps(sessions),
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
