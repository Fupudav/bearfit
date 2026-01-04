let statsHistoryInitialized = false;

function getHistoryRangeValue() {
  const select = document.getElementById("stats-history-range");
  const value = Number(select?.value);
  return Number.isFinite(value) ? value : 7;
}

function renderBarChart(container, values, labels) {
  if (!container) return;
  container.innerHTML = "";

  const maxValue = Math.max(1, ...values);
  values.forEach((value, index) => {
    const bar = document.createElement("div");
    bar.className = "stats-history-bar";
    bar.style.height = `${(value / maxValue) * 100}%`;
    bar.title = `${labels[index]} : ${value}`;
    container.appendChild(bar);
  });
}

function renderLineChart(container, values, labels) {
  if (!container) return;
  container.innerHTML = "";

  const maxValue = Math.max(1, ...values);
  const width = Math.max(values.length - 1, 1);
  const height = 100;
  const pathPoints = values.map((value, index) => {
    const x = values.length === 1 ? 0 : index;
    const y = height - (value / maxValue) * height;
    return `${x},${y}`;
  });

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", `M ${pathPoints.join(" L ")}`);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "var(--accent)");
  path.setAttribute("stroke-width", "2");
  svg.appendChild(path);

  values.forEach((value, index) => {
    const x = values.length === 1 ? 0 : index;
    const y = height - (value / maxValue) * height;
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", "2.5");
    circle.setAttribute("fill", "var(--accent)");
    circle.setAttribute("title", `${labels[index]} : ${value}`);
    svg.appendChild(circle);
  });

  container.appendChild(svg);
}

function renderHistoryCharts() {
  const range = getHistoryRangeValue();
  const history =
    typeof window.getDailyHistoryWindow === "function"
      ? window.getDailyHistoryWindow(range)
      : [];
  const labels = history.map((entry) => entry.dateKey.slice(5));

  renderBarChart(
    document.getElementById("stats-history-xp"),
    history.map((entry) => entry.xp),
    labels
  );
  renderBarChart(
    document.getElementById("stats-history-volume"),
    history.map((entry) => entry.volume),
    labels
  );
  renderLineChart(
    document.getElementById("stats-history-sessions"),
    history.map((entry) => entry.sessions),
    labels
  );

  const label = document.getElementById("stats-history-window");
  if (label) {
    label.textContent = `${range} derniers jours`;
  }
}

function setupStatsHistory() {
  if (statsHistoryInitialized) return;
  const select = document.getElementById("stats-history-range");
  if (select) {
    select.addEventListener("change", () => {
      renderHistoryCharts();
    });
  }
  statsHistoryInitialized = true;
}

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

  const maxTricepsWeight = document.getElementById("stats-max-triceps-weight");
  if (maxTricepsWeight) {
    maxTricepsWeight.textContent = userData.stats.maxTricepsWeight ?? 0;
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

  const maxDeveloppeWeight = document.getElementById(
    "stats-max-developpe-weight"
  );
  if (maxDeveloppeWeight) {
    maxDeveloppeWeight.textContent = userData.stats.maxDeveloppeWeight ?? 0;
  }

  const weightDeveloppe = document.getElementById("stats-weight-developpe");
  if (weightDeveloppe) {
    const info =
      typeof window.getCurrentChallengeWeightInfo === "function"
        ? window.getCurrentChallengeWeightInfo("bench")
        : null;
    weightDeveloppe.textContent = info?.label || "–";
  }

  setupStatsHistory();
  renderHistoryCharts();
}

window.renderStats = renderStats;
