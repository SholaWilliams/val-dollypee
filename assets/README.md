# Assets

Place your files here:

- `music/` — add multiple songs (e.g., `song1.mp3`, `song2.mp3`). A random one plays on each visit. You can also keep a single `music.mp3` at the root for compatibility.
 - `music/playlist.json` — list your songs here so the player can auto-load them. Example:
   
	 [
		 "assets/music/song1.mp3",
		 "assets/music/song2.mp3",
		 "assets/music/song3.mp3"
	 ]

- `music/playlist.js` — if you prefer not to run a local server, define the playlist in JavaScript so it works on `file://`:

	```html
	<script src="assets/music/playlist.js"></script>
	<script src="assets/player.js"></script>
	```

	And in `playlist.js`:
  
	```js
	window.PLAYLIST_TRACKS = [
		'assets/music/song1.mp3',
		'assets/music/song2.mp3'
	];
	```
- `photos/` — add her photos as `photo1.jpg`, `photo2.jpg`, etc. You can use any names; just update the image paths in `photobooth.html`.

Tips:
- Keep images reasonable size (under ~1–2 MB each) for smooth loading.
- Use JPEG for photos; PNG/WebP work too.
- Autoplay may be blocked by the browser; click the floating widget to start playback.

Local development:
- Open pages via a local web server (not file://) so playlist.json can be fetched without CORS issues.
- Quick options:
	- Python: `python -m http.server 5500` in the project folder, then visit http://localhost:5500/
	- Node: `npx serve` or `npx http-server` in the project folder.
	- VS Code: use the Live Server extension.

## Spotify (optional, future)

If/when Spotify app creation is available to you, we can enable playlist previews. For now, the site uses local songs defined in `music/playlist.json`.
