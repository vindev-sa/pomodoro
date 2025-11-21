let WORK_SECONDS = 25 * 60;
let BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;
const STORAGE_KEY = 'pomodoro_activities_v5';

let mode = 'work';
let remaining = WORK_SECONDS;
let running = false;
let timerInterval = null;
let completedCount = 0;
let workSessions = 0;

const timeEl = document.getElementById('time');
const modeEl = document.getElementById('mode');
const playPauseBtn = document.getElementById('playPause');
const resetBtn = document.getElementById('reset');
const skipBtn = document.getElementById('skip');
const circleEl = document.getElementById('circle');
const completedCountEl = document.getElementById('completedCount');
// const viewLogBtn = document.getElementById('viewLog');
const clearLogBtn = document.getElementById('clearLog');
const logEl = document.getElementById('log');
const soundEl = document.getElementById('sound');
const workInput = document.getElementById('workInput');
const breakInput = document.getElementById('breakInput');
const downloadCSVBtn = document.getElementById('downloadCSV');
const uploadCSVBtn = document.getElementById('uploadCSV');
const csvFileInput = document.getElementById('csvFileInput');
const activityTitleEl = document.getElementById('activityTitle');
const chartCtx = document.getElementById('activityChart').getContext('2d');

let activityChart = new Chart(chartCtx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Pomodoro Activities',
        data: [],
        backgroundColor: 'rgba(96,165,250,0.7)'
      }
    ]
  },
  options: {
    responsive: true,
    scales: { y: { beginAtZero: true } }
  }
});

const pad = (n) => n.toString().padStart(2, '0');
const formatTime = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

function updateUI() {
  timeEl.textContent = formatTime(remaining);
  modeEl.textContent = mode === 'work' ? 'Work' : mode === 'longBreak' ? 'Pausa Longa' : 'Pausa';
  playPauseBtn.src = running
  ? 'public/assets/timer_pause.svg'
  : remaining === (mode === 'work' ? WORK_SECONDS : mode === 'longBreak' ? LONG_BREAK_SECONDS : BREAK_SECONDS)
  ? 'public/assets/timer_play.svg'
  : 'public/assets/timer_pause.svg';
  /* playPauseBtn.textContent = running
    ? 'timer_pause'
    : remaining === (mode === 'work' ? WORK_SECONDS : mode === 'longBreak' ? LONG_BREAK_SECONDS : BREAK_SECONDS)
    ? 'timer_play'
    : 'timer_pause'; */
  completedCountEl.textContent = completedCount;

  const total = mode === 'work' ? WORK_SECONDS : mode === 'longBreak' ? LONG_BREAK_SECONDS : BREAK_SECONDS;
  const progress = 1 - remaining / total;
  const deg = Math.round(progress * 360);
  circleEl.style.background = `conic-gradient(var(--accent) ${deg}deg, rgba(255,255,255,0.06) ${deg}deg)`;
}

function loadActivities() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveActivities(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  updateChart();
}

function saveActivity(a) {
  const list = loadActivities();
  list.unshift(a);
  saveActivities(list);
}

function clearActivities() {
  localStorage.removeItem(STORAGE_KEY);
  renderLog();
  updateChart();
}

function renderLog() {
  const activities = loadActivities();
  if (!activities.length) {
    logEl.innerHTML = '<div style="padding:8px;color:var(--muted)">Ainda não há atividades</div>';
    return;
  }

  logEl.innerHTML = activities
    .map(
      (a, i) =>
        `<div class="item"><div><strong>${a.title || a.type}</strong><br><small>${new Date(
          a.when
        ).toLocaleDateString()}</small></div><div style="text-align:right"><div>${a.durationStr}</div><button class='edit-btn' onclick='editActivity(${i})'>Editar</button></div></div>`
    )
    .join('');
}

function editActivity(index) {
  const acts = loadActivities();
  const a = acts[index];
  const newTitle = prompt('Editar titulo:', a.title || a.type);
  if (newTitle !== null) {
    a.title = newTitle;
    saveActivities(acts);
    renderLog();
  }
}

function notify(title, body) {
  if (Notification.permission === 'granted') new Notification(title, { body });
}

function tick() {
  if (remaining > 0) {
    remaining--;
    updateUI();
    return;
  }

  running = false;
  clearInterval(timerInterval);
  timerInterval = null;

  const duration = mode === 'work' ? WORK_SECONDS : mode === 'longBreak' ? LONG_BREAK_SECONDS : BREAK_SECONDS;
  const a = {
    when: new Date().toISOString(),
    type: mode,
    duration: duration,
    durationStr: formatTime(duration),
    title: activityTitleEl.value || mode
  };

  saveActivity(a);
  soundEl.play();
  notify('Pomodoro concluído!', `${a.title} finalizado.`);

  if (mode === 'work') {
    completedCount++;
    workSessions++;
  }

  if (mode === 'work' && workSessions % 4 === 0) {
    mode = 'longBreak';
    remaining = LONG_BREAK_SECONDS;
  } else if (mode === 'break' || mode === 'longBreak') {
    mode = 'work';
    remaining = WORK_SECONDS;
  }

  updateUI();
  renderLog();
  updateChart();
  setTimeout(startTimer, 1000);
}

function startTimer() {
  if (running) return;
  WORK_SECONDS = parseInt(workInput.value) * 60;
  BREAK_SECONDS = parseInt(breakInput.value) * 60;
  running = true;
  updateUI();
  timerInterval = setInterval(tick, 1000);
}

function pauseTimer() {
  running = false;
  clearInterval(timerInterval);
  timerInterval = null;
  updateUI();
}

function resetTimer() {
  pauseTimer();
  mode = 'work';
  remaining = WORK_SECONDS;
  workSessions = 0;
  updateUI();
}

playPauseBtn.onclick = () => (running ? pauseTimer() : startTimer());
resetBtn.onclick = () => {
  if (confirm('Redefinir contador?')) resetTimer();
};
skipBtn.onclick = () => {
  pauseTimer();
  mode = mode === 'work' ? 'pausa' : 'atividade';
  remaining = mode === 'work' ? WORK_SECONDS : BREAK_SECONDS;
  updateUI();
};

/*
viewLogBtn.onclick = () => {
  logEl.hidden = !logEl.hidden;
  viewLogBtn.textContent = logEl.hidden ? 'Ver registro' : 'Esconder Registro';
  if (!logEl.hidden) renderLog();
};
*/
clearLogBtn.onclick = () => {
  if (confirm('Deseja apagar todos os registros?')) clearActivities();
};

function exportCSV() {
  const acts = loadActivities();
  if (!acts.length) {
    alert('Não há atividades para exportar.');
    return;
  }

  const csv = ['Title,Type,Duration,When'];
  acts.forEach((a) => csv.push(`${a.title || ''},${a.type},${a.durationStr},${a.when}`));
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pomodoro_activities.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function importCSV(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result.trim();
    const rows = text.split('\n').slice(1);
    const acts = rows.map((r) => {
      const [title, type, durationStr, when] = r.split(',');
      return { title, type, durationStr, when };
    });
    saveActivities(acts);
    renderLog();
    alert('CSV carregado com sucesso.');
  };
  reader.readAsText(file);
}

downloadCSVBtn.onclick = exportCSV;
uploadCSVBtn.onclick = () => csvFileInput.click();
csvFileInput.onchange = (e) => {
  if (e.target.files.length) importCSV(e.target.files[0]);
};

function updateChart() {
  const acts = loadActivities();
  const counts = {};
  acts.forEach((a) => {
    counts[a.title] = (counts[a.title] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  activityChart.data.labels = labels;
  activityChart.data.datasets[0].data = data;
  activityChart.update();
}

function init() {
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied')
    Notification.requestPermission();
  const acts = loadActivities();
  completedCount = acts.filter((a) => a.type === 'work').length;
  updateUI();
  renderLog();
  updateChart();
}

init();
