# Jukebox

A web platform to collectively queue songs to play.

Built on top of the current [Bjb1](https://github.com/ocf/BJukebox), dead [Bjb2](https://github.com/dkess/BJukebox2/blob/master/bjb.py), and [Ryan's](https://github.com/NotRyan) work on a similar [Bjb3](https://github.com/NotRyan/BJukebox3)

Aka Bjb 3 (2.0)

## Usage

Song URLS can be Youtube, Soundcloud, or from any website the `youtube-dl` supports.

Easiest way to deploy is:

```bash
docker build -t jukebox .
docker run --rm jukebox {args}
```

### Running development locally:

`mpd` should be running locally, and `youtube-dl` should also be installed. Song extraction changes rapidly, so make sure to keep `youtube-dl` updated.

```bash
mpd # Make sure mpd is running and check what port it is on
sudo youtube-dl -U # Update youtube-dl when possible
go run .
```

## Arguments

| Argument  | Description         |
| --------- | ------------------- |
| --host    | Server host ip      |
| --port    | Server port number  |
| --mpdhost | MPD host ip         |
| --mpdport | MPD port number     |

### Improvements over Bjb 2

* Uses mpd idle to watch instead of polling for song changes
* Avoids double requesting youtube-dl 
* Better volume control
* Ability to pause

### Todo

Mainly front end improvements are needed:
 - [ ] Volume slider needs styling
 - [ ] Better error display on frontend
 - [ ] Adding new features (like pausing) to frontend
 - [ ] Better queue display - handle more people and be more compact.
 - [ ] Better mobile viewing
 - [ ] Other minor things
    - [ ] Remove from queue button breaks styling with animation
    - [ ] General cleanup of `site.js`
