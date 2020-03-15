/** The name of the user */
let name = null;

/** The WebSocket connection */
let sock = null;

/** Heartbeat variable */
let isAlive = true;

function removeChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function createSong(song) {
  const div = document.createElement('div');
  div.className = 'song';

  const divImage = document.createElement('div');
  divImage.className = 'song-thumb';

  const aThumb = document.createElement('a');
  aThumb.href = song.webpage_url;
  aThumb.target = '_blank';

  const imgThumb = document.createElement('img');
  imgThumb.src = song.thumbnail;

  divImage.appendChild(imgThumb);

  aThumb.appendChild(divImage);
  div.appendChild(aThumb);

  const songTitleDiv = document.createElement('div');
  songTitleDiv.className = 'songtitle';
  songTitleDiv.appendChild(document.createTextNode(song.title));

  div.appendChild(songTitleDiv);

  return div;
}

function createQueue(username, queues) {
  const queueDiv = document.createElement('div');
  queueDiv.className = 'queue';

  const nameDiv = document.createElement('div');
  const nameSpan = document.createElement('span');
  nameSpan.className = 'name';
  nameSpan.appendChild(document.createTextNode(username));
  nameDiv.appendChild(nameSpan);
  queueDiv.appendChild(nameDiv);

  const songListDiv = document.createElement('div');
  songListDiv.className = 'songlist';

  const songs = queues[username];
  for (let i = 0; i < songs.length; i++) {
    const songDiv = createSong(songs[i]);

    // remove button
    if (username === name) {
      const remoteBtn = document.createElement('button');
      remoteBtn.className = 'b-remove';
      (function (queuePos) { remoteBtn.onclick = () => { sock.send(`remove ${queuePos}`); }; }(i));
      songDiv.appendChild(remoteBtn);
    }
    songListDiv.appendChild(songDiv);
  }
  queueDiv.appendChild(songListDiv);
  return queueDiv;
}

function freeSongEntry() {
  const inputSongURL = document.getElementById('input-songurl');
  inputSongURL.disabled = false;
  inputSongURL.value = '';

  const songURLButton = document.getElementById('b-songurl');
  songURLButton.disabled = false;
}

function checkIsAlive() {
  if (!isAlive) {
    document.getElementById('lostconn').style.display = 'block';
  } else {
    document.getElementById('lostconn').style.display = 'none';
  }
}

function sendName(username) {
  name = username; // Save username locally
  sock.send(`name ${name}`);
}

function submitName() {
  sendName(document.getElementById('input-name').value);
}

function submitSong() {
  const inputSongURL = document.getElementById('input-songurl');
  const songurl = inputSongURL.value;
  if (songurl.trim()) {
    sock.send(`queue ${songurl}`);
    inputSongURL.disabled = true;
    document.getElementById('b-songurl').disabled = true;
  }
}

function setVolume(volume) {
  document.getElementById('currentvol').innerText = volume;
  document.getElementById('volslider').value = volume;
}

function socketHandler(event) {
  if (event.data === 'ok') { // ACK adding to queue
    freeSongEntry();
  } else if (event.data === 'pong') {
    isAlive = true;
  } else if (event.data === 'error') {
    freeSongEntry();
    document.getElementById('songurlerror').style.display = 'inline';
  } else { // JSON state recieved
    const {
      currentSong, currentUser, queues, volume, usernames,
    } = JSON.parse(event.data);
    setVolume(volume);
    const currentSongDiv = document.getElementById('currentsong');

    removeChildren(currentSongDiv);
    if (currentSong.title === '') { // If no song is currently playing
      document.getElementById('currentplayer-descr').style.display = 'none';
      document.getElementById('noplaying').style.display = 'block';
    } else {
      document.getElementById('currentplayer-descr').style.display = 'block';
      document.getElementById('noplaying').style.display = 'none';
      document.getElementById('currentplayer').innerText = currentUser;
      const songDiv = createSong(currentSong);

      const remoteBtn = document.createElement('button');
      remoteBtn.className = 'b-remove';
      remoteBtn.onclick = () => { sock.send('skip'); };
      songDiv.appendChild(remoteBtn);

      currentSongDiv.appendChild(songDiv);
    }

    const queueListDiv = document.getElementById('queuelist');
    removeChildren(queueListDiv);

    const queueListFragment = document.createDocumentFragment();

    for (const username of usernames || []) {
      queueListFragment.appendChild(createQueue(username, queues));
    }
    queueListDiv.appendChild(queueListFragment);
  }
}

function wsInit() {
  document.getElementById('starttext').style.display = 'block';
  document.getElementById('nameentry').style.display = 'none';
  document.getElementById('interface').style.display = 'none';

  // generate a relative websocket path
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  let defaultPath = window.location.pathname;
  if (!/\/$/.test(defaultPath)) {
    defaultPath += '/';
  }
  defaultPath += 'ws';
  sock = new WebSocket(protocol + window.location.host + defaultPath);

  sock.onopen = () => {
    document.getElementById('starttext').style.display = 'none';
    document.getElementById('lostconn').style.display = 'none';
    const savedName = localStorage.getItem('jukebox_name');
    if (savedName) {
      sendName(savedName);
    } else {
      document.getElementById('nameentry').style.display = 'block';
    }
  };

  sock.onmessage = (event) => {
    if (event.data === 'ok') { // Valid name
      document.getElementById('nameentry').style.display = 'none';
      document.getElementById('interface').style.display = 'block';
      document.getElementById('displayname').innerText = name;
      localStorage.setItem('jukebox_name', name);
      sock.onmessage = socketHandler;
    } else if (event.data === 'pong') {
      isAlive = true;
    } else { // Error
      document.getElementById('starttext').style.display = 'none';
      document.getElementById('nameentry').style.display = 'block';
      document.getElementById('nameerror').innerText = event.data;
      document.getElementById('nameerror').style.display = 'inline';
    }
  };

  sock.onclose = (event) => {
    document.getElementById('lostconn').style.display = 'block';
  };

  sock.onerror = (event) => {
    console.error(event);
  };
}

function heartbeat() {
  if (!sock || sock.readyState === 3) {
    wsInit();
  }
  isAlive = false;
  sock.send('ping');
  setTimeout(checkIsAlive, 2000);
}

window.onload = () => {
  wsInit();

  // some reverse proxies terminate idle ws after 30 seconds
  setInterval(heartbeat, 15000);

  // make error messages disappear when we click on them
  document.getElementById('songurlerror').onclick = (event) => { event.target.style.display = 'none'; };
  document.getElementById('nameerror').onclick = (event) => { event.target.style.display = 'none'; };

  document.getElementById('b-entername').onclick = submitName;

  document.getElementById('b-songurl').onclick = submitSong;

  // Change name
  document.getElementById('b-changename').onclick = () => {
    localStorage.removeItem('jukebox_name');
    if (sock) {
      sock.close();
    }
    wsInit();
  };

  // Volume change
  document.getElementById('volslider').onchange = (event) => {
    sock.send(`volume ${event.target.value}`);
  };

  document.getElementById('m-queue').onclick = () => {
    document.getElementById('tab-queuesong').style.display = 'block';
    document.getElementById('tab-settings').style.display = 'none';
    document.getElementById('m-queue').classList.add('active');
    document.getElementById('m-settings').classList.remove('active');
  };

  document.getElementById('m-settings').onclick = () => {
    document.getElementById('tab-queuesong').style.display = 'none';
    document.getElementById('tab-settings').style.display = 'block';
    document.getElementById('m-settings').classList.add('active');
    document.getElementById('m-queue').classList.remove('active');
  };

  // Enter keys
  document.getElementById('input-name').onkeypress = (event) => { if (event.key === 'Enter') { submitName(); } };
  document.getElementById('input-songurl').onkeypress = (event) => { if (event.key === 'Enter') { submitSong(); } };
};
