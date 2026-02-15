# Val Dollypee — Valentine Web Experience

A playful, multi‑page, static web experience with love notes, hidden messages, ambient music, animated hearts, and a photobooth. Built with plain HTML/CSS/JS so it’s easy to run and customize.

## Features
- **Multi-page flow:** `index.html`, `photobooth.html`, `love-notes.html`, `letter.html`, `afterglow.html`, `jsyk.html`, `final.html`.
- **Love notes carousel:** Swipe/click through notes with dots and auto‑advance.
- **Hidden messages:** A modal popup revealed by time-on-page or a subtle trigger.
- **Music player:** Visual audio widget with a simple playlist and auto‑start.
- **Hearts animation:** Floating emoji hearts for a cozy ambient vibe.
- **Mobile friendly:** Layouts use modern CSS and scale nicely.

## Project Structure
```text
afterglow.html
final.html
index.html
jsyk.html
letter.html
love-notes.html
photobooth.html
assets/
  player.js          # Music player logic & widget rendering
  README.md          # Assets-specific notes (optional)
  music/
    playlist.js      # Playlist config (JS)
    playlist.json    # Playlist config (JSON, optional)
  photos/            # Photobooth images (user content)
```

## Getting Started
Run this as a static site. Any HTTP server works.

### Quick Start (Node)
Requires Node.js. From the repo root:

```bash
# Option 1: http-server (fetches via npx)
npx http-server . -p 5500

# Option 2: serve (also via npx)
npx serve . -l 5500
```
Then open:

```text
http://localhost:5500
```

### VS Code (Live Server)
- Install the “Live Server” extension.
- Open `index.html` and click “Go Live”.

### Python (if available)
```bash
# Python 3
python -m http.server 5500
```

## Pages Overview
- **index.html:** Entry point for the experience.
- **photobooth.html:** Displays photos from `assets/photos/`.
- **love-notes.html:** Carousel of notes with a time/hidden-triggered modal and audio widget.
- **letter.html / afterglow.html / jsyk.html / final.html:** Additional themed pages in the flow.

## Customization
### Love Notes (carousel)
In `love-notes.html`, the slides live inside the element with id `slides`. Replace the `<div class="note">…</div>` entries with your own text.

### Hidden Messages (modal)
The secret modal uses `showSecret(title, body)` and `hideSecret()`.
- Modal container: element with id `secretBackdrop` and card `secret-card`.
- Dismiss controls: a top‑right “×” button and a “Close” button.
- Backdrop clicks do not close the modal (intentional UX).
- Time trigger appears after ~60s of active viewing unless already shown.

To change the message shown by the time trigger or hidden trigger, edit the `showSecret()` calls in `love-notes.html`.

### Hearts Animation
Hearts are spawned periodically with randomized size/position/duration. Tweak the count or interval in the self‑invoking `Hearts` function in `love-notes.html`.

## Music Player
The audio widget is initialized via `window.initMusicPlayer()`.

#### Where it’s used
- A widget container exists in `love-notes.html` with id `audioWidget`.
- Tracks are defined inline in `love-notes.html` (array named `tracks`) and can also be managed via `assets/music/playlist.js` / `playlist.json`.

#### Initialization Example
```js
// In love-notes.html
const tracks = [
  'assets/music.mp3',
  'assets/music/song1.mp3',
  'assets/music/song2.mp3',
  'assets/music/song3.mp3'
];

window.addEventListener('DOMContentLoaded', () => {
  if (window.initMusicPlayer) {
    window.initMusicPlayer({
      containerId: 'audioWidget',
      tracks,
      autoStart: true
    });
  }
});
```

#### Updating the playlist
- **Simple:** Replace/add files in `assets/music/` and update the `tracks` array.
- **Config files:** Use `assets/music/playlist.js` or `playlist.json` if your player reads from those.
- **Titles/metadata:** If your player displays titles, ensure `player.js` maps track URLs to readable names or pulls from playlist config.

## Deployment
Any static hosting will work.
- **GitHub Pages:** Serve the repo root on the `main` or `gh-pages` branch.
- **Netlify/Vercel:** Deploy the folder as a static site (no build step needed).
- **Static hosts/CDN:** Upload the files and point a domain at them.

## Tips & Notes
- **Browser caching:** When updating media (images/music), bust cache by changing filenames.
- **Session behavior:** The secret modal uses `sessionStorage` to avoid re‑showing once displayed.
- **Accessibility:** Buttons include labels, and modal interactions use explicit controls instead of backdrop clicks.

## Credits
- Emoji hearts are Unicode characters rendered by the browser.
- No external UI libraries; just HTML/CSS/JS.

---
Feel free to tailor copy, timing, music, and visuals to match your story. ❤️
