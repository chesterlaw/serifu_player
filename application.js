const keyOrder = '1234567890qwertyuiopasdfghjklzxcvbnm';

let currentAudio = null;
let currentKey = null;
let currentFile = null;
let statusUpdateInterval = null;
const keyToFileMap = {};

const keysDiv = document.getElementById('keys');
const spacebarEl = document.getElementById('spacebar');
const statusbarEl = document.getElementById('statusbar');

const rowEnds = ['0', 'p', 'l', 'm'];
let rowDiv = document.createElement('div');
rowDiv.className = 'row';
keysDiv.appendChild(rowDiv);

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function handleAudioError(keyChar) {
  const keyEl = document.getElementById(`key-${keyChar}`);
  keyEl.classList.remove('playing');
  keyEl.classList.remove('played');
  keyEl.classList.add('error');

  currentAudio = null;
  currentKey = null;
  currentFile = null;
  updateSpacebarState();
  clearInterval(statusUpdateInterval);
  statusUpdateInterval = null;
  document.getElementById('statusbar-text').textContent = `${keyToFileMap[keyChar]} cannot be found.`;
  statusbarEl.classList.add('error');
  document.getElementById('progressbar').style.width = '0%';
}

function updateSpacebarState() {
  if (currentAudio && currentAudio.paused) {
    spacebarEl.classList.add('playing');
  } else {
    spacebarEl.classList.remove('playing');
  }
}

function updateStatusBar(finishedKeyChar = null) {
  const statusTextEl = document.getElementById('statusbar-text');
  const progressBarEl = document.getElementById('progressbar');
  statusbarEl.classList.remove('error');

  if (finishedKeyChar) {
    statusTextEl.textContent = `${keyToFileMap[finishedKeyChar]} has finished playing.`;
    progressBarEl.style.width = '0%';
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  } else if (currentAudio && (currentAudio.duration > 0)) {
    const current = formatTime(currentAudio.currentTime);
    const total = formatTime(currentAudio.duration);
    const prefix = currentAudio.paused ? 'Paused' : 'Playing';
    statusTextEl.textContent = `${prefix}: ${currentFile} (${current} / ${total})`;
    const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
    progressBarEl.style.width = `${progress}%`;
  } else {
    statusTextEl.textContent = 'Nothing playing.';
    progressBarEl.style.width = '0%';
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }
}

function startAudio(audio, keyChar, fileName, resetPosition = false) {
  const keyEl = document.getElementById(`key-${keyChar}`);
  keyEl.classList.add('playing');
  keyEl.classList.remove('played');
  keyEl.classList.remove('error');

  if (resetPosition) {
    audio.currentTime = 0;
  }

  audio.onerror = () => {
    handleAudioError(keyChar);
  };

  audio.play().then(() => {
    updateSpacebarState();
    updateStatusBar();
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = setInterval(updateStatusBar, 200);
  }).catch(() => {
    handleAudioError(keyChar);
  });

  audio.onended = () => {
    keyEl.classList.remove('playing');
    keyEl.classList.add('played');
    currentAudio = null;
    currentKey = null;
    currentFile = null;
    updateSpacebarState();
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
    updateStatusBar(keyChar);
  };
}

function playAudioForKey(keyChar) {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  if (currentKey) {
    const prevKeyEl = document.getElementById(`key-${currentKey}`);
    prevKeyEl.classList.remove('playing');
    prevKeyEl.classList.add('played');
  }

  if (!(keyChar in keyToFileMap)) {
    const keyEl = document.getElementById(`key-${keyChar}`);
    keyEl.classList.remove('playing');
    keyEl.classList.remove('played');
    keyEl.classList.add('error');

    currentAudio = null;
    currentKey = null;
    currentFile = null;
    updateSpacebarState();
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;

    document.getElementById('statusbar-text').textContent = `No file assigned to key '${keyChar.toUpperCase()}'`;
    statusbarEl.classList.add('error');
    document.getElementById('progressbar').style.width = '0%';
    return;
  }

  const audioPath = `audio/${keyToFileMap[keyChar]}`;
  const audio = new Audio(audioPath);

  const isRestartingSamePaused = (currentKey === keyChar && currentAudio && currentAudio.paused);

  currentAudio = audio;
  currentKey = keyChar;
  currentFile = keyToFileMap[keyChar];

  startAudio(audio, keyChar, currentFile, isRestartingSamePaused);
}

function togglePause() {
  if (!currentAudio) return;
  if (currentAudio.paused) {
    currentAudio.play();
  } else {
    currentAudio.pause();
  }
  updateSpacebarState();
  updateStatusBar();
  if (!statusUpdateInterval) {
    statusUpdateInterval = setInterval(updateStatusBar, 200);
  }
}

// Build full keyboard, assign files where available
for (let i = 0; i < keyOrder.length; i++) {
  const keyChar = keyOrder[i];
  const fileName = audioFiles[i] || null;
  if (fileName) {
    keyToFileMap[keyChar] = fileName;
  }

  const keyEl = document.createElement('div');
  keyEl.className = 'key';
  keyEl.id = `key-${keyChar}`;

  const numberEl = document.createElement('div');
  numberEl.className = 'number';
  numberEl.textContent = i + 1;
  keyEl.appendChild(numberEl);

  const charEl = document.createElement('div');
  charEl.className = 'char';
  charEl.textContent = keyChar.toUpperCase();
  keyEl.appendChild(charEl);

  rowDiv.appendChild(keyEl);

  if (rowEnds.includes(keyChar)) {
    rowDiv = document.createElement('div');
    rowDiv.className = 'row';
    keysDiv.appendChild(rowDiv);
  }
}

document.addEventListener('keydown', (event) => {
  const keyChar = event.key.toLowerCase();
  if (keyChar === ' ') {
    event.preventDefault();
    togglePause();
    return;
  }
  if (!keyOrder.includes(keyChar)) return;
  playAudioForKey(keyChar);
});

keysDiv.addEventListener('click', (event) => {
  let keyEl = event.target.closest('.key');
  if (!keyEl) return;
  const keyChar = keyEl.id.replace('key-', '');
  playAudioForKey(keyChar);
});

spacebarEl.addEventListener('click', () => {
  togglePause();
});

document.getElementById('progressbar-container').addEventListener('click', (event) => {
  if (!currentAudio || currentAudio.duration <= 0) return;

  const container = event.currentTarget;
  const rect = container.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percentage = clickX / rect.width;
  const newTime = percentage * currentAudio.duration;

  currentAudio.currentTime = newTime;
  updateStatusBar();
});

// Build bottom key map
const keyMapDiv = document.getElementById('key-map');
const sortedKeys = Object.keys(keyToFileMap).sort((a, b) => keyOrder.indexOf(a) - keyOrder.indexOf(b));
sortedKeys.forEach((key) => {
  const fileName = keyToFileMap[key];
  const line = document.createElement('div');
  line.textContent = `${key.toUpperCase()} → ${fileName}`;
  keyMapDiv.appendChild(line);
});
