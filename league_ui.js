const LEAGUE_DEFINITIONS = [
  {
    name: "Ourson",
    description: "Découvre le rythme et installe tes bases.",
  },
  {
    name: "Grizzly",
    description: "Tu gagnes en constance et en confiance.",
  },
  {
    name: "Kodiak",
    description: "Ta semaine devient plus régulière.",
  },
  {
    name: "Polaris",
    description: "Un cap solide avec un bon volume d'XP.",
  },
  {
    name: "Noyau",
    description: "Le cœur du peloton avec une belle progression.",
  },
  {
    name: "Aurore",
    description: "Tu avances vite et sans relâche.",
  },
  {
    name: "Arctique",
    description: "Un niveau exigeant, mais tu réponds présent.",
  },
  {
    name: "Tempête",
    description: "Tu tiens le rythme des meilleurs.",
  },
  {
    name: "Titan",
    description: "Tes semaines font la différence.",
  },
  {
    name: "Légendaire",
    description: "L'élite des ours, rien ne t'arrête.",
  },
];

function getLeagueDefinition(leagueId) {
  return (
    LEAGUE_DEFINITIONS[leagueId - 1] || {
      name: `Ligue ${leagueId}`,
      description: "",
    }
  );
}

function formatTimeRemaining(weekStartISO) {
  if (!weekStartISO) return "–";
  const [year, month, day] = weekStartISO.split("-").map(Number);
  const weekStart = new Date(year, month - 1, day);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(weekStart.getDate() + 7);

  const diffMs = nextWeek.getTime() - Date.now();
  if (diffMs <= 0) return "0h";

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) {
    return `${days}j ${hours}h`;
  }
  return `${hours}h`;
}

function buildLeagueEntries() {
  if (typeof window.buildLeagueLeaderboard === "function") {
    return window.buildLeagueLeaderboard(userData.league);
  }

  const ghosts = Array.isArray(userData.league?.ghosts)
    ? userData.league.ghosts
    : [];
  const entries = ghosts.map((ghost) => ({
    ...ghost,
    isUser: false,
  }));
  entries.push({
    name: "Toi",
    xp: Number.isFinite(userData.league?.weekXp) ? userData.league.weekXp : 0,
    isUser: true,
  });

  entries.sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (a.isUser && !b.isUser) return -1;
    if (b.isUser && !a.isUser) return 1;
    return a.name.localeCompare(b.name);
  });

  return entries;
}

function renderLeagues() {
  if (!document.getElementById("league-current-name")) return;
  if (window.ensureLeagueWeekUpToDate) {
    window.ensureLeagueWeekUpToDate();
  }

  const leagueData = userData.league;
  if (!leagueData) return;

  const leagueInfo = getLeagueDefinition(leagueData.currentLeague);
  const nameEl = document.getElementById("league-current-name");
  const descEl = document.getElementById("league-current-desc");
  const xpEl = document.getElementById("league-week-xp");
  const bestEl = document.getElementById("league-best");
  const remainingEl = document.getElementById("league-time-remaining");

  if (nameEl) {
    nameEl.textContent = `Ligue ${leagueData.currentLeague} — ${leagueInfo.name}`;
  }
  if (descEl) {
    descEl.textContent = leagueInfo.description;
  }
  if (xpEl) {
    xpEl.textContent = leagueData.weekXp ?? 0;
  }
  if (bestEl) {
    bestEl.textContent = leagueData.bestLeague ?? leagueData.currentLeague;
  }
  if (remainingEl) {
    remainingEl.textContent = formatTimeRemaining(leagueData.weekStartISO);
  }

  const leaderboardEl = document.getElementById("league-leaderboard");
  if (leaderboardEl) {
    leaderboardEl.textContent = "";
    const entries = buildLeagueEntries();
    entries.forEach((entry, index) => {
      const row = document.createElement("li");
      row.className = "leaderboard-row";
      if (entry.isUser) {
        row.classList.add("is-user");
      }
      const name = document.createElement("span");
      name.textContent = `${index + 1}. ${entry.name}`;
      const xp = document.createElement("span");
      xp.textContent = `${entry.xp} XP`;
      row.appendChild(name);
      row.appendChild(xp);
      leaderboardEl.appendChild(row);
    });
  }

  const lastResult = leagueData.lastResult;
  const resultCard = document.getElementById("league-last-result");
  if (resultCard) {
    if (!lastResult) {
      resultCard.classList.add("hidden");
    } else {
      const statusMap = {
        promotion: "Promotion",
        maintien: "Maintien",
        retrogradation: "Rétrogradation",
      };
      const statusEl = document.getElementById("league-last-status");
      const rankEl = document.getElementById("league-last-rank");
      const xpEl = document.getElementById("league-last-xp");
      const historyEntry = Array.isArray(userData.leagueHistory)
        ? [...userData.leagueHistory]
            .reverse()
            .find((entry) => entry.weekStartISO === lastResult.weekStartISO)
        : null;

      if (statusEl) {
        statusEl.textContent = statusMap[lastResult.status] || "Maintien";
      }
      if (rankEl) {
        rankEl.textContent = `Rang ${lastResult.rank} • Ligue ${lastResult.leagueBefore} → ${lastResult.leagueAfter}`;
      }
      if (xpEl) {
        xpEl.textContent = `XP semaine : ${historyEntry?.weekXp ?? 0}`;
      }
      resultCard.classList.remove("hidden");
    }
  }
}

window.renderLeagues = renderLeagues;
