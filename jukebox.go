package main

import (
	"encoding/json"
	"errors"
	"log"
	"strconv"
	"sync"

	"github.com/fhs/gompd/v2/mpd"
)

// Jukebox : Jukebox state
type Jukebox struct {
	CurrentUser string            `json:"currentUser"`
	CurrentSong Song              `json:"currentSong"`
	Queues      map[string][]Song `json:"queues"`
	Volume      int               `json:"volume"`
	Usernames   []string          `json:"usernames"` // To record insertion order
	mux         sync.Mutex
	conn        *mpd.Client
}

// NewJukebox : Generates a new Jukebox given a mpd client connection
func NewJukebox(conn *mpd.Client) Jukebox {
	var volume int
	var err error

	attrs, err := conn.Status()
	if err != nil {
		log.Fatalln(err)
	}

	if mpvVol, ok := attrs["volume"]; ok {
		volume, err = strconv.Atoi(mpvVol)
	} else {
		volume = 80
		err = conn.SetVolume(volume)
	}

	if err != nil {
		log.Fatalln(err)
	}

	return Jukebox{conn: conn, Queues: make(map[string][]Song), Volume: volume}
}

// SetVolume : Sets mpd volume
func (juke *Jukebox) SetVolume(value int) error {
	if value > 100 || value < 0 {
		return errors.New("Invalid volume")
	}
	juke.mux.Lock()
	defer juke.mux.Unlock()
	juke.Volume = value
	return juke.conn.SetVolume(value)
}

// GetState : Returns JSON of Jukebox state
func (juke *Jukebox) GetState() string {
	juke.mux.Lock()
	defer juke.mux.Unlock()
	jsonrep, _ := json.Marshal(juke)
	return string(jsonrep)
}

func (juke *Jukebox) addSong(name string, song Song) error {
	juke.mux.Lock()
	defer juke.mux.Unlock()
	if val, ok := juke.Queues[name]; ok {
		juke.Queues[name] = append(val, song)
	} else {
		juke.Queues[name] = []Song{song}
		juke.Usernames = append(juke.Usernames, name)
	}
	// If nothing playing, play it
	if (Song{}) == juke.CurrentSong {
		return juke.cycle()
	}
	return nil
}

// AddSongURL : Given a URL, add it to the Jukebox
func (juke *Jukebox) AddSongURL(name string, songURL string) error {
	song, err := fetchSong(songURL)
	if err != nil {
		return err
	}
	return juke.addSong(name, song)
}

// RemoveSong : Remove a song from a queue
func (juke *Jukebox) RemoveSong(name string, position int) {
	juke.mux.Lock()
	defer juke.mux.Unlock()
	juke.remove(name, position)
}

func (juke *Jukebox) remove(name string, position int) {
	if val, ok := juke.Queues[name]; ok {
		if position < 0 || position >= len(val) {
			return
		}
		juke.Queues[name] = append(val[:position], val[position+1:]...)
		if len(juke.Queues[name]) == 0 {
			delete(juke.Queues, name)
			for i, v := range juke.Usernames {
				if v == name {
					juke.Usernames = append(juke.Usernames[:i], juke.Usernames[i+1:]...)
					break
				}
			}
		}
	}
}

// SkipSong : Skip the currently playing song
func (juke *Jukebox) SkipSong() error {
	// Will trigger cycle song watcher
	juke.mux.Lock()
	defer juke.mux.Unlock()
	return juke.conn.Clear()
}

// CycleSong : Play the next song on the queue
func (juke *Jukebox) CycleSong() error {
	juke.mux.Lock()
	defer juke.mux.Unlock()
	return juke.cycle()
}

func (juke *Jukebox) cycle() error {
	// Exists so cycle can be reused
	if len(juke.Queues) == 0 {
		juke.CurrentSong = Song{}
		return nil
	}
	juke.CurrentSong = juke.Queues[juke.Usernames[0]][0]
	juke.CurrentUser = juke.Usernames[0]
	juke.remove(juke.Usernames[0], 0)
	if len(juke.Queues) > 1 {
		juke.Usernames = append(juke.Usernames[1:], juke.Usernames[0])
	}
	// Play the new Current song
	if err := juke.conn.Clear(); err != nil {
		return err
	}
	if err := juke.conn.Add(juke.CurrentSong.URL); err != nil {
		return err
	}
	if err := juke.conn.Play(-1); err != nil {
		return err
	}
	return nil
}

// Pause : Pause mpd playback
func (juke *Jukebox) Pause() error {
	return juke.conn.Pause(true)
}

// Resume : Resume mpd playback
func (juke *Jukebox) Resume() error {
	return juke.conn.Pause(false)
}
