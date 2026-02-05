(function(){
  function initMusicPlayer(options){
    const opts = Object.assign({ containerId: 'audioWidget', tracks: [], autoStart: true }, options || {});
    const container = document.getElementById(opts.containerId);
    if(!container){ console.warn('[player] container not found'); return; }

    const canvas = document.createElement('canvas');
    canvas.width = 180; // logical size; CSS can scale
    canvas.height = 54;
    const btn = document.createElement('button');
    btn.className = 'play-btn';
    btn.textContent = 'Pause ⏸️';

    container.appendChild(canvas);
    container.appendChild(btn);

    const ctx2d = canvas.getContext('2d');

    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';

    const tracks = Array.isArray(opts.tracks) && opts.tracks.length ? opts.tracks : ['assets/music.mp3'];
    const pick = tracks[Math.floor(Math.random() * tracks.length)];
    audio.src = pick;

    let actx, analyser, sourceNode;

    function setupAudio(){
      if(!actx){
        const AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
        analyser = actx.createAnalyser();
        analyser.fftSize = 512; // frequency resolution
        analyser.smoothingTimeConstant = 0.8; // smoother bars
        sourceNode = actx.createMediaElementSource(audio);
        sourceNode.connect(analyser);
        analyser.connect(actx.destination);
      }
    }

    function draw(){
      const w = canvas.width, h = canvas.height;
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const bars = 24;
      const gap = 3;
      const barW = Math.floor((w - gap * (bars-1)) / bars);

      function frame(){
        if(!analyser){ requestAnimationFrame(frame); return; }
        analyser.getByteFrequencyData(buffer);
        ctx2d.clearRect(0,0,w,h);
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

    btn.addEventListener('click', async ()=>{
      setupAudio();
      try { await actx.resume(); } catch {}
      if(audio.paused){ try { await audio.play(); } catch(e){ /* awaiting user gesture */ } }
      else { audio.pause(); }
      updateBtn();
    });

    // Clicking the widget also toggles
    container.addEventListener('click', (e)=>{
      if(e.target !== btn) btn.click();
    });

    // Try to autoplay
    if(opts.autoStart){
      setupAudio();
      actx.resume && actx.resume();
      audio.play().then(()=>{ updateBtn(); }).catch(()=>{ updateBtn(); /* show play button; user gesture needed */ });
    } else { updateBtn(); }

    draw();

    // expose simple controls (optional)
    window.__musicPlayer = { audio, play: ()=>audio.play(), pause: ()=>audio.pause(), toggle: ()=> audio.paused ? audio.play() : audio.pause() };
  }

  window.initMusicPlayer = initMusicPlayer;
})();
