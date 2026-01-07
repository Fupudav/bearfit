// GÉNÉRATION DES TUILES DE CHALLENGES

let challengeModalState = {
  challengeId: null,
  selectedDay: null,
};

function formatChallengeValue(value, type) {
  return type === "time" ? `${value}s` : `${value}`;
}

function formatChallengeSeries(series, type) {
  if (!Array.isArray(series)) return "";
  return series.map((value) => formatChallengeValue(value, type)).join(" • ");
}

function renderChallengeSessionDetail(challenge, level, day) {
  const series =
    challenge.levels[level]?.days?.[day] ??
    challenge.levels[level]?.days?.[String(day)] ??
    [];
  const sessionDayEl = document.getElementById("challenge-modal-session-day");
  const seriesEl = document.getElementById("challenge-modal-session-series");
  const weightEl = document.getElementById("challenge-modal-session-weight");
  const statusEl = document.getElementById("challenge-modal-session-status");
  const startBtn = document.getElementById("challenge-modal-start-btn");

  if (sessionDayEl) {
    sessionDayEl.textContent = `Jour ${day} — ${challenge.levels[level]?.label || `Niveau ${level}`}`;
  }

  const calendarEl = document.getElementById("challenge-modal-calendar");
  if (calendarEl) {
    calendarEl.querySelectorAll(".challenge-day").forEach((button) => {
      const buttonDay = Number(button.dataset.day);
      button.classList.toggle("selected", buttonDay === day);
    });
  }

  if (seriesEl) {
    seriesEl.innerHTML = "";
    const list = document.createElement("ul");
    list.className = "challenge-series-list";
    if (!series.length) {
      const empty = document.createElement("li");
      empty.textContent = "Séance indisponible.";
      list.appendChild(empty);
    } else {
      series.forEach((value, index) => {
        const li = document.createElement("li");
        li.textContent = `Série ${index + 1} : ${formatChallengeValue(
          value,
          challenge.type
        )}`;
        list.appendChild(li);
      });
    }
    seriesEl.appendChild(list);
  }

  const weightInfo =
    typeof window.getChallengeWeightInfo === "function"
      ? window.getChallengeWeightInfo(challenge.id, level, day)
      : null;
  if (weightEl) {
    weightEl.textContent = weightInfo
      ? `Poids recommandé : ${weightInfo.label}`
      : "";
    weightEl.classList.toggle("hidden", !weightInfo);
  }

  const todaySession =
    typeof window.getTodayChallengeProgram === "function"
      ? window.getTodayChallengeProgram(challenge.id)
      : null;
  const isTodayOff =
    typeof window.isTodayOffDay === "function" && window.isTodayOffDay();
  const isTodaySession =
    todaySession &&
    todaySession.level === level &&
    todaySession.day === day;

  if (startBtn) {
    startBtn.disabled = !isTodaySession || isTodayOff;
    startBtn.dataset.challengeId = challenge.id;
    startBtn.textContent = isTodaySession
      ? "Démarrer la séance"
      : "Séance non disponible";
  }

  if (statusEl) {
    const progress = userData.challenges[challenge.id];
    const currentDay = progress?.day ?? day;
    let statusText = "";
    if (day < currentDay) {
      statusText = "Séance déjà effectuée.";
    } else if (day === currentDay) {
      if (isTodayOff) {
        statusText = "Jour de repos : séance indisponible.";
      } else if (!todaySession) {
        statusText = "Séance déjà effectuée aujourd'hui.";
      } else {
        statusText = "Séance du jour disponible.";
      }
    } else {
      statusText = "Séance à venir.";
    }
    statusEl.textContent = statusText;
  }

  challengeModalState.selectedDay = day;
}

function renderChallengeModal(challenge) {
  const modal = document.getElementById("challenge-modal");
  const titleEl = document.getElementById("challenge-modal-title");
  const descEl = document.getElementById("challenge-modal-description");
  const metaEl = document.getElementById("challenge-modal-meta");
  const calendarEl = document.getElementById("challenge-modal-calendar");

  if (!modal || !calendarEl) return;

  const progress = userData.challenges[challenge.id];
  const level = progress?.level ?? 1;
  const day = progress?.day ?? 1;
  const levelData = challenge.levels[level];
  const days = levelData ? Object.keys(levelData.days).map(Number) : [];
  days.sort((a, b) => a - b);

  if (titleEl) titleEl.textContent = challenge.name;
  if (descEl) descEl.textContent = challenge.description || "";
  if (metaEl) {
    metaEl.textContent = `Niveau ${level} — Jour ${day} • ${challenge.type === "reps" ? "Répétitions" : "Temps"}`;
  }

  calendarEl.innerHTML = "";
  days.forEach((dayNumber) => {
    const series = levelData?.days?.[dayNumber];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "challenge-day";
    button.dataset.day = dayNumber;
    button.innerHTML = `
      <span>Jour ${dayNumber}</span>
      <span class="challenge-day-series">${formatChallengeSeries(
        series,
        challenge.type
      )}</span>
    `;
    if (dayNumber < day) {
      button.classList.add("completed");
    }
    if (dayNumber === day) {
      button.classList.add("current");
    }
    button.addEventListener("click", () =>
      renderChallengeSessionDetail(challenge, level, dayNumber)
    );
    calendarEl.appendChild(button);
  });

  const useStoredDay =
    challengeModalState.challengeId === challenge.id &&
    days.includes(challengeModalState.selectedDay);
  const initialDay = useStoredDay ? challengeModalState.selectedDay : day;
  renderChallengeSessionDetail(challenge, level, initialDay);

  modal.classList.remove("hidden");
  challengeModalState.challengeId = challenge.id;
}

function closeChallengeModal() {
  const modal = document.getElementById("challenge-modal");
  if (modal) modal.classList.add("hidden");
}

function initChallengeModal() {
  if (window.challengeModalReady) return;
  window.challengeModalReady = true;

  const modal = document.getElementById("challenge-modal");
  const closeBtn = document.getElementById("challenge-modal-close-btn");
  const closeIcon = document.getElementById("challenge-modal-close-icon");
  const startBtn = document.getElementById("challenge-modal-start-btn");

  if (closeBtn) closeBtn.addEventListener("click", closeChallengeModal);
  if (closeIcon) closeIcon.addEventListener("click", closeChallengeModal);
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeChallengeModal();
    });
  }

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const challengeId = startBtn.dataset.challengeId;
      if (!challengeId) return;
      const session =
        typeof window.getTodayChallengeProgram === "function"
          ? window.getTodayChallengeProgram(challengeId)
          : null;
      if (!session) return;
      closeChallengeModal();
      startSession(session);
      window.currentSession = session;
      showScreen("session");
    });
  }
}

function renderChallenges() {
  const container = document.getElementById("challenge-list");
  if (!container) return;

  container.innerHTML = "";

  if (typeof window.isTodayOffDay === "function" && window.isTodayOffDay()) {
    const empty = document.createElement("p");
    empty.textContent = "Jour de repos : aucun challenge disponible.";
    container.appendChild(empty);
    return;
  }

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
      <p>Niveau ${level} – Jour ${day}</p>
      <p class="challenge-streak">🔥 ${streakValue}j</p>
      ${weightInfo ? `<p>Poids : ${weightInfo.label}</p>` : ""}
    `;

    tile.addEventListener("click", () => {
      renderChallengeModal(challenge);
    });

    container.appendChild(tile);
  });
}

// Génération au chargement
renderChallenges();
initChallengeModal();

// Rendre accessible depuis la console
window.renderChallenges = renderChallenges;
