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

    // Dynamic tempo based on speed level (ms per 16th note step)
    const tempo = Math.max(110, 160 - (speedLevel * 8));
    beatStep = 0;

    beatIntervalId = setInterval(() => {
      if (window.AudioManagerMuted || !ctx) return;

      const step = beatStep % 32;

      // 1. KICK DRUM (rhythm foundation on beats 0, 4, 8, 12...)
      if (step % 4 === 0) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(100, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.12);
        } catch (e) {}
      }

      // 2. SNARE DRUM (snare snap on beats 4, 12, 20, 28 using synthesized white noise)
      if (step % 8 === 4) {
        try {
          const bufferSize = ctx.sampleRate * 0.08;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;

          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1000;

          const gain = ctx.createGain();
          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

          noise.start(ctx.currentTime);
          noise.stop(ctx.currentTime + 0.08);
        } catch (e) {}
      }

      // 3. HI-HAT (bright ticks on offbeats: 2, 6, 10...)
      if (step % 4 === 2) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(8000, ctx.currentTime);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.04);
        } catch (e) {}
      }

      // 4. GROOVY BASSLINE (warm sawtooth arpeggio)
      const bassRoots = [
        65.41, 65.41, 77.78, 77.78, 87.31, 87.31, 98.00, 98.00,
        65.41, 65.41, 77.78, 77.78, 116.54, 116.54, 130.81, 130.81
      ];
      const bassFreq = bassRoots[Math.floor(step / 2) % bassRoots.length];
      if (step % 2 === 0) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 180;
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(bassFreq, ctx.currentTime);
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.16);
        } catch (e) {}
      }

      // 5. CATCHY OG MELODY LOOP (Subway Surfers-inspired pentatonic blues synth!)
      const melodyFreqs = {
        0: 261.63,  // C4
        2: 311.13,  // Eb4
        4: 349.23,  // F4
        6: 466.16,  // Bb4
        8: 392.00,  // G4
        10: 349.23, // F4
        12: 311.13, // Eb4
        14: 261.63, // C4
        16: 261.63, // C4
        18: 311.13, // Eb4
        20: 349.23, // F4
        22: 369.99, // F#4
        23: 349.23, // F4
        24: 311.13, // Eb4
        26: 261.63, // C4
        28: 233.08, // Bb3
        30: 261.63  // C4
      };

      const noteFreq = melodyFreqs[step];
      if (noteFreq) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 1200;
          filter.Q.value = 1.0;
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(noteFreq, ctx.currentTime);
          
          if (step === 0 || step === 16) {
            osc.frequency.linearRampToValueAtTime(noteFreq + 5, ctx.currentTime + 0.2);
          }

          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.22);
        } catch (e) {}
      }

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
