// ============================================================
// audio.js — Sound Effect System (Web Audio API — no files needed!)
// ============================================================

const AudioManager = (() => {
  let ctx = null; // AudioContext (created lazily on first interaction)

  // Create the AudioContext on first user gesture (browser requirement)
  function init() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Generic tone generator
  function playTone({ frequency = 440, type = 'sine', duration = 0.15, volume = 0.4, delay = 0 }) {
    if (!ctx || window.AudioManagerMuted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

    gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  // ── Public sound effects ──────────────────────────────────

  function playSwipe() {
    init();
    playTone({ frequency: 600, type: 'triangle', duration: 0.08, volume: 0.3 });
  }

  function playCorrect() {
    init();
    // Ascending chime: C – E – G
    playTone({ frequency: 523, type: 'sine', duration: 0.12, volume: 0.4, delay: 0 });
    playTone({ frequency: 659, type: 'sine', duration: 0.12, volume: 0.4, delay: 0.1 });
    playTone({ frequency: 784, type: 'sine', duration: 0.2,  volume: 0.45, delay: 0.2 });
  }

  function playWrong() {
    init();
    // Descending "bzzzt"
    playTone({ frequency: 300, type: 'sawtooth', duration: 0.18, volume: 0.35, delay: 0 });
    playTone({ frequency: 200, type: 'sawtooth', duration: 0.25, volume: 0.35, delay: 0.15 });
  }

  function playCoin() {
    init();
    playTone({ frequency: 1046, type: 'sine', duration: 0.1, volume: 0.35, delay: 0 });
    playTone({ frequency: 1318, type: 'sine', duration: 0.1, volume: 0.35, delay: 0.08 });
  }

  function playLevelUp() {
    init();
    [523, 659, 784, 1046].forEach((f, i) => {
      playTone({ frequency: f, type: 'sine', duration: 0.15, volume: 0.4, delay: i * 0.12 });
    });
  }

  function playCountdown() {
    init();
    playTone({ frequency: 880, type: 'sine', duration: 0.1, volume: 0.3 });
  }

  let beatIntervalId = null;
  let beatStep = 0;

  function startBeat(speedLevel = 1) {
    init();
    if (beatIntervalId) clearInterval(beatIntervalId);

    // Speed up tempo based on speed level
    const tempo = Math.max(200, 360 - (speedLevel * 28));
    beatStep = 0;

    beatIntervalId = setInterval(() => {
      if (window.AudioManagerMuted || !ctx) return;

      // 1. Kick Drum on beat (every step % 2 === 0)
      if (beatStep % 2 === 0) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(110, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.28, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.12);
        } catch (e) {}
      }

      // 2. Bass arpeggio note (every beat)
      const bassNotes = [55.00, 55.00, 65.41, 65.41, 82.41, 82.41, 98.00, 82.41];
      const freq = bassNotes[beatStep % bassNotes.length];

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
      } catch (e) {}

      beatStep++;
    }, tempo);
  }

  function stopBeat() {
    if (beatIntervalId) {
      clearInterval(beatIntervalId);
      beatIntervalId = null;
    }
  }

  return { init, playSwipe, playCorrect, playWrong, playCoin, playLevelUp, playCountdown, startBeat, stopBeat };
})();
