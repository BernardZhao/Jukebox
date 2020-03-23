/** The name of the user */
let name = null;

/** The WebSocket connection */
let sock = null;

/** Heartbeat variable */
let isAlive = true;

function createSong(song, onclick, username = null) {
  return `
    <div class="song">
      <a target="_blank" href="${song.webpage_url}">
        <img src="${song.thumbnail}">
      </a>
      <div class="songtitle">
        ${song.title}
      </div>
      ${username === null || username === name ? `<button class="b-remove" onclick="${onclick}"></button>` : ''}
    </div>`;
}

function createQueue(username, queues) {
  return `
    <div class="queue">
      <div class="name">${username}</div>
      <div class="songList">
        ${queues[username].map((song, index) => createSong(song, `removeSong(${index})`, username)).join('')}
      </div>
    </div>`;
}

function toggleSongEntry() {
  const inputSongURL = document.getElementById('input-songurl');
  if (inputSongURL.disabled) { inputSongURL.value = ''; }
  inputSongURL.toggleAttribute('disabled');
  document.getElementById('b-songurl').toggleAttribute('disabled');
}

function checkIsAlive() { document.getElementById('lostconn').hidden = isAlive; }

function sendName(username) {
  name = username; // Save username locally
  sock.send(`name ${name}`);
}

function submitName() { sendName(document.getElementById('input-name').value); }

function submitSong() {
  const songurl = document.getElementById('input-songurl').value;
  if (songurl.trim()) {
    sock.send(`queue ${songurl}`);
    toggleSongEntry();
  }
}

function setVolume(volume) {
  document.getElementById('currentvol').innerText = volume;
  document.getElementById('volslider').value = volume;
}

function socketHandler(event) {
  if (event.data === 'ok') { // ACK adding to queue
    toggleSongEntry();
  } else if (event.data === 'pong') {
  } else if (event.data.substr(0, event.data.indexOf(' ')) === 'error') {
    toggleSongEntry();
    document.getElementById('error').textContent = event.data.substr(event.data.indexOf(' ') + 1);
    document.getElementById('error').hidden = false;
  } else { // JSON state recieved
    const {
      currentSong, currentUser, queues, volume, usernames,
    } = JSON.parse(event.data);

    setVolume(volume);
    // Set current playing song
    const currentSongDiv = document.getElementById('currentsong');
    currentSongDiv.innerHTML = '';
    document.getElementById('currentplayer-descr').hidden = currentSong.title === '';
    document.getElementById('noplaying').hidden = currentSong.title !== '';
    if (currentSong.title !== '') { // If no song is currently playing
      document.getElementById('video').play();
      document.getElementById('currentplayer').innerText = currentUser;
      currentSongDiv.innerHTML = createSong(currentSong, 'skipSong();');
    } else {
      document.getElementById('video').pause();
    }
    // Setup queues
    const queueListDiv = document.getElementById('queuelist');
    queueListDiv.innerHTML = '';
    for (const username of usernames || []) {
      queueListDiv.innerHTML += createQueue(username, queues);
    }
  }
  isAlive = true;
}

function wsInit() {
  // Reset styles
  document.getElementById('starttext').hidden = false;
  document.getElementById('nameentry').hidden = true;
  document.getElementById('interface').hidden = true;
  // generate a relative websocket path
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  let defaultPath = window.location.pathname;
  if (!/\/$/.test(defaultPath)) { defaultPath += '/'; }
  defaultPath += 'ws';
  sock = new WebSocket(protocol + window.location.host + defaultPath);

  sock.onopen = () => {
    document.getElementById('starttext').hidden = true;
    document.getElementById('lostconn').hidden = true;
    const savedName = localStorage.getItem('jukeboxName');
    if (savedName) {
      sendName(savedName);
    } else {
      document.getElementById('nameentry').hidden = false;
    }
  };

  sock.onmessage = (event) => {
    if (event.data === 'ok') { // Valid name
      document.getElementById('nameentry').hidden = true;
      document.getElementById('interface').hidden = false;
      document.getElementById('displayname').innerText = name;
      localStorage.setItem('jukeboxName', name);
      sock.onmessage = socketHandler;
    } else if (event.data === 'pong') {
    } else { // Error
      document.getElementById('nameerror').innerText = event.data;
      document.getElementById('nameerror').hidden = false;
    }
    isAlive = true;
  };

  sock.onclose = () => { document.getElementById('lostconn').hidden = false; };

  sock.onerror = (event) => { console.error(event); };
}

function heartbeat() {
  if (!sock || sock.readyState === 3) { wsInit(); }
  isAlive = false;
  sock.send('ping');
  setTimeout(checkIsAlive, 2000);
}

window.removeSong = (queuePos) => sock.send(`remove ${queuePos}`);

window.skipSong = () => { sock.send('skip'); };

window.onload = () => {
  wsInit();

  // some reverse proxies terminate idle ws after 30 seconds
  setInterval(heartbeat, 15000);

  // make error messages disappear when we click on them
  document.getElementById('error').onclick = (event) => { event.target.hidden = false; };
  document.getElementById('nameerror').onclick = (event) => { event.target.hidden = false; };

  document.getElementById('b-entername').onclick = submitName;
  document.getElementById('b-songurl').onclick = submitSong;

  document.getElementById('b-changename').onclick = () => {
    localStorage.removeItem('jukeboxName');
    if (sock) { sock.close(); }
    wsInit();
  };

  document.getElementById('volslider').onchange = (event) => {
    sock.send(`volume ${event.target.value}`);
  };

  function toggleTabs() {
    document.getElementById('tab-queuesong').toggleAttribute('hidden');
    document.getElementById('tab-settings').toggleAttribute('hidden');
    document.getElementById('m-queue').classList.toggle('active');
    document.getElementById('m-settings').classList.toggle('active');
  }

  document.getElementById('m-queue').onclick = toggleTabs;
  document.getElementById('m-settings').onclick = toggleTabs;

  // Enter keys
  document.getElementById('input-name').onkeypress = (event) => { if (event.key === 'Enter') { submitName(); } };
  document.getElementById('input-songurl').onkeypress = (event) => { if (event.key === 'Enter') { submitSong(); } };
};
