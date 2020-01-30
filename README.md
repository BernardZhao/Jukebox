# Jukebox

A web platform to collectively queue songs to play.

Built on top of the current [Bjb1](https://github.com/ocf/BJukebox), dead [Bjb2](https://github.com/dkess/BJukebox2/blob/master/bjb.py), and [Ryan's](https://github.com/NotRyan) work on a similar [Bjb3](https://github.com/NotRyan/BJukebox3)

Aka Bjb 3 (2.0)

## Usage

Song URLS can be Youtube, Soundcloud, or any website the `youtube-dl` supports.

`mpd` should be running on the server, and `youtube-dl` should also be installed. Song extraction changes rapidly, so make sure to keep `youtube-dl` updated.

## Running

```console
$ mpd # Make sure mpd is running and check what port it is on
$ sudo youtube-dl -U # Update youtube-dl when possible

$ go run .
$ go run . -mpdport=6600 -port=8080 # Manually set ports
```

### Improvements over Bjb 2

* Uses mpd idle to watch instead of polling for song changes
* Avoids double requesting youtube-dl 


### Todo

Mainly front end improvements are needed:
 - [ ] Volume slider needs styling
 - [ ] Actual error display on frontend

Big networking issue:

Occasional broken pipe, client connection to mpd closes, then everything breaks. I've only been able to reproduce this by starting the server, playing a song, then waiting 30 secs and then trying to skip / perform any other mpd operation. This generates an EOF error, and then all subsequent mpd client commands error with `write tcp [::1]:54651->[::1]:6600: write: broken pipe`
