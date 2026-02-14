(function(){
  function initMusicPlayer(options){
    const opts = Object.assign({ containerId: 'audioWidget', tracks: [], autoStart: true, spotify: {} }, options || {});
    const container = document.getElementById(opts.containerId);
    if(!container){ console.warn('[player] container not found'); return; }

    const canvas = document.createElement('canvas');
    canvas.width = 180; // logical size; CSS can scale
    canvas.height = 54;
    const btn = document.createElement('button');
    btn.className = 'play-btn';
    btn.textContent = 'Pause ⏸️';
    const nextBtn = document.createElement('button');
    nextBtn.className = 'play-btn';
    nextBtn.textContent = 'Next ⏭️';
    const title = document.createElement('span');
    title.className = 'track-title';
    title.style.fontWeight = '700';
    title.style.color = '#3a2434';
    title.style.whiteSpace = 'nowrap';
    title.style.maxWidth = '220px';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';

    container.appendChild(canvas);
    container.appendChild(btn);
    container.appendChild(nextBtn);
    container.appendChild(title);

    const ctx2d = canvas.getContext('2d');

    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    // crossOrigin set later depending on origin

    // Build track list: prefer global playlist (playlist.js), then opts.tracks, then manifest, then built-ins
    const globalList = Array.isArray(window.PLAYLIST_TRACKS) ? window.PLAYLIST_TRACKS.slice() : null;
    let tracks = (globalList && globalList.length)
      ? globalList
      : (Array.isArray(opts.tracks) && opts.tracks.length ? opts.tracks.slice() : ['assets/music/song1.mp3','assets/music/song2.mp3','assets/music/song3.mp3']);
    const hasGlobalPlaylist = !!(globalList && globalList.length);

    // Spotify integration (previews only). Requires a valid access token.
    const spotify = opts.spotify || {};
    const spClientId = spotify.clientId || (window.SPOTIFY_CLIENT_ID || '');
    const spPlaylistId = spotify.playlistId || (window.SPOTIFY_PLAYLIST_ID || '');

    // Store token from URL hash if present (Implicit Grant)
    (function captureSpotifyTokenFromHash(){
      if(location.hash && location.hash.includes('access_token')){
        const params = new URLSearchParams(location.hash.substring(1));
        const token = params.get('access_token');
        const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
        if(token){
          const expAt = Date.now() + (expiresIn * 1000);
          try {
            localStorage.setItem('spotify_token', token);
            localStorage.setItem('spotify_token_exp', String(expAt));
          } catch {}
          // Remove token fragment from URL
          history.replaceState(null, document.title, location.pathname + location.search);
        }
      }
    })();

    function getStoredSpotifyToken(){
      try {
        const token = localStorage.getItem('spotify_token');
        const exp = parseInt(localStorage.getItem('spotify_token_exp') || '0', 10);
        if(token && exp > Date.now()) return token;
      } catch {}
      return null;
    }

    async function fetchSpotifyPreviewTracks(playlistId){
      const token = getStoredSpotifyToken();
      if(!token) return [];
      try {
        const url = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks?fields=items(track(name,preview_url))&limit=100`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if(!res.ok) return [];
        const json = await res.json();
        const previews = (json.items || [])
          .map(i => i && i.track && i.track.preview_url)
          .filter(Boolean);
        return previews;
      } catch { return []; }
    }

    // Local manifest (assets/music/playlist.json)
    let localPlaylistPromise = (async ()=>{
      try {
        if(location.protocol === 'file:'){
          console.warn('[player] Skipping playlist.json fetch on file:// to avoid CORS; using built-in tracks.');
          return [];
        }
        const res = await fetch('assets/music/playlist.json', { cache: 'no-store' });
        if(!res.ok) return [];
        const json = await res.json();
        if(Array.isArray(json) && json.length) return json.map(s => String(s));
        return [];
      } catch {
        console.warn('[player] Failed to load playlist.json; using built-in tracks.');
        return [];
      }
    })();

    // If we have a playlist id and a stored token, try Spotify previews (optional/future)
    let usingSpotify = false;
    let spotifyPreviewsPromise = null;
    if(spPlaylistId){
      const token = getStoredSpotifyToken();
      if(token){
        usingSpotify = true;
        spotifyPreviewsPromise = fetchSpotifyPreviewTracks(spPlaylistId).then(list => {
          if(Array.isArray(list) && list.length){ tracks = list; }
          else { usingSpotify = false; }
        });
      }
    }

    let actx, analyser, sourceNode;
    let useSimulatedBars = false;

    function setupAudio(){
      if(!actx){
        const AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
        try {
          analyser = actx.createAnalyser();
          analyser.fftSize = 512; // frequency resolution
          analyser.smoothingTimeConstant = 0.8; // smoother bars
          sourceNode = actx.createMediaElementSource(audio);
          sourceNode.connect(analyser);
          analyser.connect(actx.destination);
          useSimulatedBars = false;
        } catch (e) {
          console.warn('[player] Visualizer using simulated bars (CORS or file:// restrictions).', e);
          analyser = null;
          sourceNode = null;
          useSimulatedBars = true;
        }
      }
    }

    function draw(){
      const w = canvas.width, h = canvas.height;
      const buffer = analyser ? new Uint8Array(analyser.frequencyBinCount) : new Uint8Array(256);
      const bars = 24;
      const gap = 3;
      const barW = Math.floor((w - gap * (bars-1)) / bars);

      function frame(){
        ctx2d.clearRect(0,0,w,h);
        if(analyser){
          analyser.getByteFrequencyData(buffer);
        } else if(useSimulatedBars){
          // Generate smooth pseudo spectrum that reacts to play/pause
          const t = performance.now() * 0.002;
          for(let i=0;i<buffer.length;i++){
            const f = i / buffer.length;
            const amp = audio.paused ? 0.15 : 0.7;
            const val = Math.max(0, Math.sin(t + f*6) * 0.5 + 0.5) * 255 * amp;
            buffer[i] = val;
          }
        } else {
          // No analyser and not simulating — nothing to draw
        }
        for(let i=0;i<bars;i++){
          const idx = Math.floor(i * buffer.length / bars);
          const v = buffer[idx] / 255; // 0..1
          const bh = Math.max(2, Math.floor(h * v));
          const x = i * (barW + gap);
          ctx2d.fillStyle = `rgba(255,59,122,${0.45 + v*0.55})`;
          ctx2d.fillRect(x, h - bh, barW, bh);
          // cap
          ctx2d.fillStyle = 'rgba(255,31,104,0.8)';
          ctx2d.fillRect(x, h - bh - 3, barW, 2);
        }
        requestAnimationFrame(frame);
      }
      frame();
    }

    function updateBtn(){ btn.textContent = audio.paused ? 'Play ▶️' : 'Pause ⏸️'; }

    function inferTitle(url){
      try {
        const u = new URL(url, location.href);
        const name = u.pathname.split('/').pop() || url;
        const base = decodeURIComponent(name).replace(/\.[a-zA-Z0-9]+$/, '');
        return base;
      } catch { return url; }
    }

    function pickRandomTrack(){
      if(!tracks || !tracks.length) return null;
      const idx = Math.floor(Math.random() * tracks.length);
      return tracks[idx];
    }

    async function ensureTrackListResolved(){
      // Prefer local manifest if present and no explicit global playlist
      if(localPlaylistPromise && !hasGlobalPlaylist){
        try {
          const list = await localPlaylistPromise;
          if(Array.isArray(list) && list.length){ tracks = list; }
        } catch {}
        localPlaylistPromise = null;
      }
      if(spotifyPreviewsPromise){
        try { await spotifyPreviewsPromise; } catch {}
        spotifyPreviewsPromise = null;
      }
    }

    function isSameOrigin(url){
      try {
        const u = new URL(url, location.href);
        return u.origin === location.origin;
      } catch { return false; }
    }

    function setTrack(url){
      if(!url) return;
      audio.src = url;
      if(location.protocol === 'file:' || isSameOrigin(url)) audio.crossOrigin = '';
      else audio.crossOrigin = 'anonymous';
      title.textContent = inferTitle(url);
    }

    let currentIndex = -1;
    function pickRandomIndex(){
      if(!tracks || !tracks.length) return -1;
      if(tracks.length === 1) return 0;
      let idx;
      do { idx = Math.floor(Math.random() * tracks.length); } while(idx === currentIndex);
      return idx;
    }

    async function startPlayback(){
      await ensureTrackListResolved();
      currentIndex = pickRandomIndex();
      const pick = currentIndex >= 0 ? tracks[currentIndex] : null;
      setTrack(pick);
      setupAudio();
      try { await actx.resume(); } catch {}
      try { await audio.play(); } catch {}
      updateBtn();
    }

    btn.addEventListener('click', async ()=>{
      setupAudio();
      try { await actx.resume(); } catch {}
      if(audio.paused){ try { await audio.play(); } catch(e){ /* awaiting user gesture */ } }
      else { audio.pause(); }
      updateBtn();
    });

    async function nextTrack(){
      await ensureTrackListResolved();
      currentIndex = pickRandomIndex();
      const next = currentIndex >= 0 ? tracks[currentIndex] : null;
      setTrack(next);
      try { await actx.resume(); } catch {}
      audio.play().catch(()=>{});
      updateBtn();
    }
    nextBtn.addEventListener('click', nextTrack);

    // Clicking the widget (except the explicit buttons) toggles play
    container.addEventListener('click', (e)=>{
      if(e.target === btn || e.target === nextBtn) return;
      btn.click();
    });

    // Try to autoplay
    if(opts.autoStart){
      startPlayback().catch(()=>{ updateBtn(); });
    } else { updateBtn(); }

    // When a preview ends, pick another random track automatically
    audio.addEventListener('ended', () => {
      audio.loop = false; // pick another when clip ends
      nextTrack();
    });

    draw();

    // expose simple controls (optional)
    window.__musicPlayer = { audio, play: ()=>audio.play(), pause: ()=>audio.pause(), toggle: ()=> audio.paused ? audio.play() : audio.pause(), next: nextTrack };

    // Optional helper to initiate Spotify auth (Implicit Grant)
    window.__musicPlayerSpotifyLogin = function(){
      const clientId = spClientId;
      if(!clientId){ alert('Missing Spotify Client ID.'); return; }
      const redirectUri = location.origin + location.pathname; // return to current page
      const scope = encodeURIComponent('playlist-read-private');
      const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;
      // Open same tab to get token in hash
      location.href = authUrl;
    };
  }

  window.initMusicPlayer = initMusicPlayer;
})();
