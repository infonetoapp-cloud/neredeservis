const screenButtons = [...document.querySelectorAll('[data-screen]')];
const screens = [...document.querySelectorAll('[data-view]')];

function setScreen(name) {
  screenButtons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.screen === name);
  });
  screens.forEach((screen) => {
    screen.classList.toggle('is-active', screen.dataset.view === name);
  });
}

screenButtons.forEach((btn) => {
  btn.addEventListener('click', () => setScreen(btn.dataset.screen));
});

const authTabButtons = [...document.querySelectorAll('[data-auth]')];
const authViews = [...document.querySelectorAll('[data-auth-view]')];

function setAuthView(name) {
  authTabButtons.forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.auth === name);
  });
  authViews.forEach((view) => {
    view.classList.toggle('is-active', view.dataset.authView === name);
  });
}

authTabButtons.forEach((btn) => {
  btn.addEventListener('click', () => setAuthView(btn.dataset.auth));
});

const timestampEl = document.getElementById('mapTimestamp');
function updateTimestamp() {
  if (!timestampEl) return;
  timestampEl.textContent = `Son guncelleme: ${new Date().toLocaleTimeString('tr-TR')}`;
}
updateTimestamp();
setInterval(updateTimestamp, 5000);

const tripButtons = [...document.querySelectorAll('.trip-item')];
const drawerPlate = document.getElementById('drawerPlate');
const drawerStatus = document.getElementById('drawerStatus');
const drawerDriver = document.getElementById('drawerDriver');
const drawerRoute = document.getElementById('drawerRoute');
const drawerNext = document.getElementById('drawerNext');
const drawerDelay = document.getElementById('drawerDelay');
const liveProgressText = document.getElementById('liveProgressText');
const liveProgressFill = document.getElementById('liveProgressFill');
const mapMarkers = [...document.querySelectorAll('#liveMapBox .map-marker')];

const progressByTrip = [68, 42, 13, 79];
const markerOffsets = [
  [0, 0, 0, 0],
  [10, -8, -14, 12],
  [-6, 12, 8, -10],
  [14, 6, -10, -6],
];

function setStatusBadge(text) {
  if (!drawerStatus) return;
  drawerStatus.textContent = text;
  drawerStatus.classList.remove('ok', 'soft');

  if (text.toLowerCase().includes('canli')) {
    drawerStatus.classList.add('ok');
  } else if (text.toLowerCase().includes('gecik')) {
    drawerStatus.classList.add('soft');
    drawerStatus.style.color = 'var(--warn)';
    drawerStatus.style.borderColor = 'rgba(217, 119, 6, 0.16)';
    drawerStatus.style.background = 'rgba(217, 119, 6, 0.08)';
    return;
  }

  drawerStatus.style.color = '';
  drawerStatus.style.borderColor = '';
  drawerStatus.style.background = '';
}

function applyTrip(button) {
  if (!button) return;

  tripButtons.forEach((b) => b.classList.toggle('is-active', b === button));

  const plate = button.dataset.plate || '-';
  const status = button.dataset.status || '-';
  const driver = button.dataset.driver || '-';
  const route = button.dataset.route || '-';
  const next = button.dataset.next || '-';
  const delay = button.dataset.delay || '-';
  const tripIndex = Number(button.dataset.trip || '0');
  const progress = progressByTrip[tripIndex] ?? 0;

  if (drawerPlate) drawerPlate.textContent = plate;
  if (drawerDriver) drawerDriver.textContent = driver;
  if (drawerRoute) drawerRoute.textContent = route;
  if (drawerNext) drawerNext.textContent = next;
  if (drawerDelay) drawerDelay.textContent = delay;
  setStatusBadge(status);

  if (liveProgressFill) liveProgressFill.style.width = `${progress}%`;
  if (liveProgressText) liveProgressText.textContent = `${route} • %${progress} ilerleme`;

  const offsets = markerOffsets[tripIndex] || markerOffsets[0];
  mapMarkers.forEach((marker, idx) => {
    const x = offsets[idx] || 0;
    const y = (idx % 2 === 0 ? 1 : -1) * Math.round((progress - 50) / 12);
    marker.style.transform = `translate(${x}px, ${y}px)`;
  });
}

tripButtons.forEach((button) => {
  button.addEventListener('click', () => {
    applyTrip(button);
    autoRotateIndex = tripButtons.indexOf(button);
  });
});

let autoRotateIndex = 0;
if (tripButtons.length > 0) {
  applyTrip(tripButtons[0]);
  setInterval(() => {
    autoRotateIndex = (autoRotateIndex + 1) % tripButtons.length;
    applyTrip(tripButtons[autoRotateIndex]);
  }, 5500);
}
