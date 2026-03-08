// main.js — общая логика (статистика и подсветка активных ссылок)

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNavLink();
  updateStatsOnHome();
});

function highlightActiveNavLink() {
  const links = document.querySelectorAll('.nav-link');
  const current = window.location.pathname.split('/').pop() || 'index.html';

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === current) {
      link.classList.add('active');
    }
  });
}

// Локальная статистика в localStorage
const STATS_KEY = 'karyotyping_lab_stats';

export function getStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return { totalRuns: 0, correctDx: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      totalRuns: parsed.totalRuns || 0,
      correctDx: parsed.correctDx || 0,
    };
  } catch {
    return { totalRuns: 0, correctDx: 0 };
  }
}

export function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function incrementRun(isDiagnosisCorrect) {
  const stats = getStats();
  stats.totalRuns += 1;
  if (isDiagnosisCorrect) {
    stats.correctDx += 1;
  }
  saveStats(stats);
}

function updateStatsOnHome() {
  const totalEl = document.getElementById('stat-total-runs');
  const correctEl = document.getElementById('stat-correct-dx');
  const accEl = document.getElementById('stat-accuracy');
  if (!totalEl || !correctEl || !accEl) return;

  const stats = getStats();
  totalEl.textContent = stats.totalRuns;
  correctEl.textContent = stats.correctDx;
  const accuracy =
    stats.totalRuns > 0 ? Math.round((stats.correctDx / stats.totalRuns) * 100) : 0;
  accEl.textContent = accuracy + '%';
}
