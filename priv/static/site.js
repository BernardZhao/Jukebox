HEADINGS = [
	"Bridges Jukebox",
	"Bridges' Jukebox",
	"BJukebox",
	"B Jukebox",
	"bJukebox",
	"bMakerspace Jukebox",
	"BJ Jukebox",
	"BJB Jukebox",
	"BJ Box",
	"BJB",
	"BMoffitt Jukebox",
	"Moffitt Jukebox",
	"Moffitt Makerspace Jukebox",
	"Berkeley Jukebox",
	"Bee Jukebox",
	"\uD83D\uDC4C\uFE0E\u263A\uFE0E\u25C6\uFE0E&\uFE0E\u264F\uFE0E\u264C\uFE0E\u25A1\uFE0E\u2327\uFE0E"
];

function removeChildren(parent) {
	while (parent.firstChild) {
		parent.removeChild(parent.firstChild);
	}
}

function songDiv(song) {
	var div = document.createElement("div");
	div.className = "song";

	var div_image = document.createElement("div");
	div_image.className = "song-thumb";

	var a_thumb = document.createElement("a");
	a_thumb.href = song["WebpageURL"];
	a_thumb.target = "_blank";

	var img_thumb = document.createElement("img");
	img_thumb.src = song["thumbnail"];

	div_image.appendChild(img_thumb);

	a_thumb.appendChild(div_image);
	div.appendChild(a_thumb);

	var div_songtitle = document.createElement("div");
	div_songtitle.className = "songtitle";
	div_songtitle.appendChild(document.createTextNode(song["title"]));

	div.appendChild(div_songtitle);

	return div;
}

function free_songentry() {
	var input_songurl = document.getElementById("input-songurl");
	input_songurl.disabled = false;
	input_songurl.value = "";

	var button_songurl = document.getElementById("b-songurl");
	button_songurl.disabled = false;
}

/** The name of the user */
var name = null;

/** The WebSocket connection */
var sock = null

/** Heartbeat variablee */
var isAlive = true;

var main_socket_handler = function (event) {
	if (event.data === "ok") {
		free_songentry();
	} else if (event.data === "pong") {
		isAlive = true;
	} else if (event.data === "error") {
		free_songentry();
		document.getElementById("songurlerror").style.display = "inline";
	} else {
    var serverstate = JSON.parse(event.data);
    console.log(serverstate);

    var current = serverstate["current_song"];
    var current_user = serverstate["current_user"];
		var span_cp = document.getElementById("currentplayer");
    var div_cs = document.getElementById("currentsong");
    var span_currentvol = document.getElementById("currentvol");
		removeChildren(span_currentvol);
		span_currentvol.appendChild(document.createTextNode(serverstate["volume"]));

		removeChildren(span_cp);
		removeChildren(div_cs);
		if (current.title == "") {
			document.getElementById("currentplayer-descr").style.display = "none";
			document.getElementById("disconnected").style.display = "none";
			document.getElementById("noplaying").style.display = "block";
		// } else if (current === "disconnected") {
		// 	document.getElementById("currentplayer-descr").style.display = "none";
		// 	document.getElementById("disconnected").style.display = "block";
		// 	document.getElementById("noplaying").style.display = "none";
		} else {
			document.getElementById("currentplayer-descr").style.display = "block";
			document.getElementById("noplaying").style.display = "none";
			document.getElementById("disconnected").style.display = "none";
			span_cp.appendChild(document.createTextNode(current_user));
			var div_songdiv = songDiv(current);

			var btn_remove = document.createElement("button");
			btn_remove.className = "b-remove";
			btn_remove.onclick = function() {
				sock.send("skip");
			};
			div_songdiv.appendChild(btn_remove);

			div_cs.appendChild(div_songdiv);
		}


		var div_ql = document.getElementById("queuelist");
		removeChildren(div_ql);

    var f_queuelist = document.createDocumentFragment();
    
		for (const username of serverstate["usernames"] ? serverstate["usernames"] : []) {
			var div_queue = document.createElement("div");
			div_queue.className = "queue";

			var div_name = document.createElement("div");
			var span_name = document.createElement("span");
			span_name.className = "name";
			span_name.appendChild(document.createTextNode(username));
			div_name.appendChild(span_name);
			div_queue.appendChild(div_name);

			var div_songlist = document.createElement("div");
			div_songlist.className = "songlist";
      
      songs = serverstate["queues"][username];
      for (let i = 0; i < songs.length; i++) {
				var div_songdiv = songDiv(songs[i])

				// remove button
				if (username === name) {
					var btn_remove = document.createElement("button");
					btn_remove.className = "b-remove";
					(function(queuePos) {
						btn_remove.onclick = function() {
							sock.send("remove "+queuePos);
						}
					})(i);
					div_songdiv.appendChild(btn_remove);
				}
				div_songlist.appendChild(div_songdiv);
			}

			div_queue.appendChild(div_songlist);

			f_queuelist.appendChild(div_queue);
		}
		div_ql.appendChild(f_queuelist);
	}
}

function wsInit() {
	if (sock) {
		sock.close();
	}

	document.getElementById("starttext").style.display = "block";
	document.getElementById("nameentry").style.display = "none";
	document.getElementById("interface").style.display = "none";

	// generate a relative websocket path
	var protocol = "ws://";
	if (window.location.protocol === "https:") {
		protocol = "wss://";
	}
	var defaultPath = window.location.pathname;
	if (!/\/$/.test(defaultPath)) {
		defaultPath += "/";
	}
	defaultPath += "ws";
	sock = new WebSocket(protocol + window.location.host + defaultPath);

	sock.onopen = function (event) {
		document.getElementById("starttext").style.display = "none";
		document.getElementById("lostconn").style.display = "none";
		var savedName = localStorage.getItem('bjb_name');
		if (savedName) {
			submitName(savedName);
		} else {
			document.getElementById("nameentry").style.display = "block";
		}
	}

	sock.onmessage = function (event) {
		// these if statements handle name validation
		if (event.data === "ok") {
			document.getElementById("nameentry").style.display = "none";
			document.getElementById("interface").style.display = "block";
			var span_namedisplay = document.getElementById("namedisplay");
			removeChildren(span_namedisplay);
			span_namedisplay.appendChild(document.createTextNode(name));

			localStorage.setItem('bjb_name', name);
			
			this.onmessage = main_socket_handler;
		} else if (event.data === "pong") {
			isAlive = true;
		} else {
			document.getElementById("starttext").style.display = "none";
			document.getElementById("nameentry").style.display = "block";
			var span_nameerror = document.getElementById("nameerror");
			removeChildren(span_nameerror);
			span_nameerror.style.display = "inline";
			var errortext = "Unknown error";
			console.log(event.data);
			if (event.data === "error invalid") {
				errortext = "Invalid name. Use only alphanumeric characters.";
			}
			span_nameerror.appendChild(document.createTextNode(errortext));
		}
	}
}

function heartbeat() {
	if (!sock || sock.readyState == 2 || sock.readyState == 3) {
		document.getElementById("lostconn").style.display = "block";	
		wsInit();
	}
	isAlive = false;
	sock.send("ping");
	setTimeout(checkIsAlive, 2000);
}

function checkIsAlive() {
	if(!isAlive) {
		document.getElementById("lostconn").style.display = "block";
	} else {
		document.getElementById("lostconn").style.display = "none";
	}
}

function submitName(nameToSubmit) {
	name = "name ".concat(nameToSubmit);
	sock.send(name);
}

window.onload = function() {
	wsInit();

	// some reverse proxies terminate idle ws after 30 seconds
	setInterval(heartbeat, 15000);

	// make error messages disappear when we click on them
	document.getElementById("songurlerror").onclick = function() {
		this.style.display = "none";
	}

	document.getElementById("heading").onclick = function() {
		removeChildren(this);
		var selected = HEADINGS[Math.floor(Math.random()*HEADINGS.length)];
		this.appendChild(document.createTextNode(selected));
	}
	
	document.getElementById("b-entername").onclick = function() {
		var entered_name = document.getElementById("input-name").value;
		submitName(entered_name);
	}

	document.getElementById("b-songurl").onclick = function() {
		var input_songurl = document.getElementById("input-songurl");
		var songurl = input_songurl.value;
		if (songurl.trim()) {
			sock.send("queue "+songurl);
			input_songurl.disabled = true;
			this.disabled = true;
		}
	}

	document.getElementById("b-changename").onclick = function() {
		localStorage.removeItem("bjb_name");
		wsInit();
	}

  document.getElementById("volslider").onchange = function(event) {
		sock.send("volume " + event.target.value)
	}

	// Menu Items
	document.getElementById("m-queue").onclick = function() {
		document.getElementById("tab-queuesong").style.display = "block";
		document.getElementById("tab-settings").style.display = "none";
		document.getElementById("m-queue").classList.add("active")
		document.getElementById("m-settings").classList.remove("active")
	}

	document.getElementById("m-settings").onclick = function() {
		document.getElementById("tab-queuesong").style.display = "none";
		document.getElementById("tab-settings").style.display = "block";
		document.getElementById("m-settings").classList.add("active")
		document.getElementById("m-queue").classList.remove("active")
	}

	window.addEventListener("keydown", function(e) {
		var d = e.srcElement || e.target;
		var key = e.keyCode || e.which;
		if (d.tagName.toUpperCase() === "INPUT") {
			if (key === 13) { //enter
				if (d.id === "input-name") {
					document.getElementById("b-entername").click();
				} else if (d.id ==="input-songurl") {
					document.getElementById("b-songurl").click();
				}
			}
		}
	});
};
