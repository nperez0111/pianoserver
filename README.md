# Pianoserver
Full integration of Pandora into your computer with Notifications, Shortcuts and a Web UI.

## What this does
This project gives a Web UI for [pianobar](https://github.com/PromyLOPh/pianobar) (The console client for the personalized web radio [pandora](https://pandora.com))
## What's so great about that?
### The Interface
![Horizontal Player Interface](screenshots/horizontal.png)
![Sidepanel Horizontal Player Interface](screenshots/sidepanel.png)
![Vertical Player Interface](screenshots/vertical.png)
### Manages Settings
![Settings Interface](screenshots/settings.png)
You can configure Pianobar settings as well as edit your shortcuts or disable features if you don't want them.
### Notifications
Every time a song changes, or is liked you will get a native notification in MacOS
### Shortcuts 
You can Play, Pause, Like, Dislike and even Select a station to play through shortcuts and confirmed through notification bubbles.

## Install
```npm install nperez0111/pianoserver```
## Usage
```pianoserver```
Starts a server instance if not already running.
### Commands
#### Start [port] [subdomain]
Starts the server if an instance is not already running on the port and subdomain specified if supplied
#### Quit
Stops the server
#### Restart
Restarts the server
#### Play, Pause, LikeSong, DislikeSong
Does the action to the currently playing music
#### SelectStation [stationName]
Changes the station to the station name specified
