package main

import (
	"flag"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/fhs/gompd/v2/mpd"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}
var server Server
var jukebox Jukebox

// Server : State of connections
type Server struct {
	connections map[*websocket.Conn]bool
	mux         sync.Mutex
}

func initServer() Server {
	return Server{connections: make(map[*websocket.Conn]bool)}
}

func (server *Server) removeConnection(c *websocket.Conn) {
	server.mux.Lock()
	delete(server.connections, c)
	server.mux.Unlock()
}

func (server *Server) addConnection(c *websocket.Conn) {
	server.mux.Lock()
	server.connections[c] = true
	server.mux.Unlock()
}

// Sends error back.
func handleError(c *websocket.Conn, errText string, err error) {
	log.Println(errText, err)
	c.WriteMessage(websocket.TextMessage, []byte("error "+errText+" "+err.Error()))
}

func socketinit(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Websocket upgrade error:", err)
	}
	server.addConnection(c)
	defer func() {
		server.removeConnection(c)
		c.Close()
	}()
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			return
		}

		switch messageTokens := strings.SplitN(string(message), " ", 2); messageTokens[0] {
		case "ping":
			c.WriteMessage(mt, []byte("pong"))
			continue
		case "name":
			if len(messageTokens) == 2 && validateName([]byte(messageTokens[1])) {
				c.WriteMessage(mt, []byte("ok"))
				defer socketHandle(c, []byte(messageTokens[1]))
				return
			}
			c.WriteMessage(mt, []byte("Invalid name."))
			continue
		default:
			c.WriteMessage(mt, []byte("Unknown message."))
			continue
		}
	}
}

func socketHandle(c *websocket.Conn, name []byte) {
	sendState()
	for {
		mt, message, err := c.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			return
		}
		switch messageTokens := strings.Split(string(message), " "); messageTokens[0] {
		case "ping":
			c.WriteMessage(mt, []byte("pong"))
			continue
		case "skip":
			if err := jukebox.SkipSong(); err != nil {
				handleError(c, "Skip error:", err)
			}
		case "volume":
			volume, err := strconv.Atoi(messageTokens[1])
			if err != nil {
				handleError(c, "Error parsing volume:", err)
			} else if err := jukebox.SetVolume(volume); err != nil {
				handleError(c, "Error setting volume:", err)
			}
		case "remove":
			songPosition, err := strconv.Atoi(messageTokens[1])
			if err != nil {
				handleError(c, "Error parsing remove:", err)
			}
			jukebox.RemoveSong(string(name), songPosition)
		case "queue":
			songurl := messageTokens[1]
			err := jukebox.AddSongURL(string(name), songurl)
			if err != nil {
				handleError(c, "Error adding song:", err)
			} else {
				c.WriteMessage(mt, []byte("ok"))
			}
		case "pause":
			err := jukebox.Pause()
			if err != nil {
				handleError(c, "Error pausing:", err)
			}
		case "resume":
			err := jukebox.Resume()
			if err != nil {
				handleError(c, "Error resuming:", err)
			}
		default:
			log.Println("Illegal command:", messageTokens[0])
			c.WriteMessage(mt, []byte("Illegal command: "+messageTokens[0]))
		}
		sendState()
	}
}

func sendState() {
	bytestate := []byte(jukebox.GetState())
	server.mux.Lock()
	defer server.mux.Unlock()
	for c := range server.connections {
		c.WriteMessage(1, bytestate)
	}
}

func validateName(name []byte) bool {
	if len(name) <= 20 && len(name) > 0 {
		match, _ := regexp.Match("^[a-zA-Z0-9]*$", name)
		return match
	}
	return false
}

func main() {
	// Command line flags
	var host string
	flag.StringVar(&host, "host", "localhost", "Server host ip")
	var port string
	flag.StringVar(&port, "port", "8080", "Server port number")
	var mpdhost string
	flag.StringVar(&mpdhost, "mpdhost", "localhost", "MPD host ip")
	var mpdport string
	flag.StringVar(&mpdport, "mpdport", "6600", "MPD port number")
	flag.Parse()

	log.Println("Attempting MPD Client connection on " + mpdhost + ":" + mpdport)
	conn, err := mpd.Dial("tcp", mpdhost+":"+mpdport)
	if err != nil {
		log.Fatalln(err)
	}
	defer conn.Close()
	if err := conn.Consume(true); err != nil { // Remove song when finished playing
		log.Fatalln(err)
	}
	if err := conn.Clear(); err != nil { // Clear mpd on startup
		log.Fatalln(err)
	}
	log.Println("Successfully connected to MPD")
	// Keep MPD Client connection alive
	go func() {
		for {
			time.Sleep(5 * time.Second)
			if err := conn.Ping(); err != nil {
				log.Println("Ping error:", err)
			}
		}
	}()
	// Manages state and player
	jukebox = NewJukebox(conn)

	log.Println("Attempting MPD Player Watcher connection")
	w, err := mpd.NewWatcher("tcp", mpdhost+":"+mpdport, "", "player")
	if err != nil {
		log.Fatalln(err)
	}
	log.Println("Successfully watching MPD")
	defer w.Close()
	go func() {
		for range w.Event {
			status, err := conn.Status()
			if err != nil {
				log.Println("Status fetch error:", err)
			}
			switch status["state"] {
			case "play":
			case "stop": // When music stops, move onto the next song
				// Extremely annoying, but mpd won't know a stream URL won't decode correctly
				// until it after it responded that it played successfully. Therefore, only
				// here can we handle a broken youtube-dl streamURL.
				if err, ok := status["error"]; ok {
					log.Println("Playback error:", err)
				}
				if err := jukebox.CycleSong(); err != nil {
					log.Println("Cycle song error:", err)
				}
				sendState()
			case "pause":
			}
		}
	}()
	// Log errors.
	log.Println("Attempting MPD Error Watcher connection")
	ew, err := mpd.NewWatcher("tcp", mpdhost+":"+mpdport, "")
	if err != nil {
		log.Fatalln(err)
	}
	log.Println("Successfully watching MPD errors")
	defer ew.Close()
	go func() {
		for err := range ew.Error {
			log.Println("MPD Internal Error:", err)
		}
	}()

	// Basic test #1 https://www.youtube.com/watch?v=otdOnrgtyfI
	// Basic test #2 https://soundcloud.com/futureisnow/perkys-calling-prod-by-southside
	// Playlist test https://www.youtube.com/watch?v=W3J9-OvxNpo&list=PLmIf0JO7SvbKxGuse9T19m_mHBm4oNG7y

	server = initServer()
	fs := http.FileServer(http.Dir("./dist"))
	http.Handle("/", fs)
	http.HandleFunc("/ws", socketinit)
	log.Println("Starting up server on " + host + ":" + port)
	log.Fatalln(http.ListenAndServe(host+":"+port, nil))
}
