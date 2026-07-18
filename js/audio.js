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
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
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
    const now = ctx.currentTime;
    
    // 1. Bass impact thud
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.18);
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}

    // 2. High-pitch police trill whistle
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';

      const trillRate = 30; // Hz
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.frequency.value = trillRate;
      modGain.gain.value = 100; // depth in Hz

      mod.connect(modGain);
      modGain.connect(osc.frequency);

      osc.frequency.setValueAtTime(1900, now);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      mod.start(now);
      osc.start(now);

      mod.stop(now + 0.55);
      osc.stop(now + 0.55);
    } catch (e) {}
  }

  function playStartWhistle() {
    init();
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
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

      // 5. CATCHY OG MELODY LOOP (Subway Surfers-inspired whistle theme!)
      const melodyFreqs = {
        0: 523.25,  // C5
        2: 622.25,  // Eb5
        4: 698.46,  // F5
        6: 932.33,  // Bb5
        8: 784.00,  // G5
        10: 698.46, // F5
        12: 622.25, // Eb5
        14: 523.25, // C5
        16: 523.25, // C5
        18: 622.25, // Eb5
        20: 698.46, // F5
        22: 739.99, // F#5
        23: 698.46, // F5
        24: 622.25, // Eb5
        26: 523.25, // C5
        28: 466.16, // Bb4
        30: 523.25  // C5
      };

      const noteFreq = melodyFreqs[step];
      if (noteFreq) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = noteFreq;
          filter.Q.value = 3.5;
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          
          // Realistic whistle slide-in
          osc.frequency.setValueAtTime(noteFreq * 0.95, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(noteFreq, ctx.currentTime + 0.05);
          
          // Soft vibrato
          const vibratoRate = 6; // Hz
          const vibratoOsc = ctx.createOscillator();
          const vibratoGain = ctx.createGain();
          vibratoOsc.frequency.value = vibratoRate;
          vibratoGain.gain.value = 6; // vibrato depth in Hz
          
          vibratoOsc.connect(vibratoGain);
          vibratoGain.connect(osc.frequency);
          
          gain.gain.setValueAtTime(0.09, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
          
          vibratoOsc.start(ctx.currentTime);
          osc.start(ctx.currentTime);
          
          vibratoOsc.stop(ctx.currentTime + 0.22);
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

  let voices = [];
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      voices = window.speechSynthesis.getVoices();
      let attempts = 0;
      const interval = setInterval(() => {
        const list = window.speechSynthesis.getVoices();
        if (list.length > 0) {
          voices = list;
          clearInterval(interval);
        }
        if (++attempts > 10) clearInterval(interval);
      }, 200);

      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
      };
    } catch(e){}
  }

  // Transliteration dictionary from Devnagari Hindi to Roman Hinglish (for English-only TTS engines like Microsoft Edge on standard Windows)
  const HINDI_TRANSLITERATIONS = {
    // Modi
    "मित्रों... आज मैं गिर गया हूँ।": "Mitron... aaj main gir gaya hoon.",
    "मित्रों... आज मैं गिर गया हूँ। 😔": "Mitron... aaj main gir gaya hoon.",
    "यह तो सरासर नाइंसाफी है मित्रों...": "Yeh toh sarasar injustice hai mitron...",
    "यह तो सरासर नाइंसाफी है मित्रों... 😡": "Yeh toh sarasar injustice hai mitron...",
    "५६ इंच का सीना है! फिर उठेंगे!": "56 inch ka seena hai! Phir uthenge!",
    "५६ इंच का सीना है! फिर उठेंगे! 💪": "56 inch ka seena hai! Phir uthenge!",
    // Rahul
    "खतम! बाय-बाय! टाटा! अब मैं पीएम बनूँगा!": "Khatam! Bye bye! Tata! Ab main PM banunga!",
    "खतम! बाय-बाय! टाटा! अब मैं पीएम बनूँगा! 💃": "Khatam! Bye bye! Tata! Ab main PM banunga!",
    "कांग्रेस वाले बोलेंगे... जय हो!": "Congress waale bolenge... Jai ho!",
    "कांग्रेस वाले बोलेंगे... जय हो! 🍀": "Congress waale bolenge... Jai ho!",
    "आलू की तरह मैं भी गिर गया यार...": "Aloo ki tarah main bhi gir gaya yaar...",
    "आलू की तरह मैं भी गिर गया यार... 😔": "Aloo ki tarah main bhi gir gaya yaar...",
    "खतम! बाय-बाय! टाटा! गुडबाय!": "Khatam! Bye bye! Tata! Goodbye!",
    "खतम! बाय-बाय! टाटा! गुडबाय! 🤦‍♂️": "Khatam! Bye bye! Tata! Goodbye!",
    "मैं कल फिर वापस आऊँगा। पप्पू प्रॉमिस!": "Main kal phir waapas aaunga. Pappu promise!",
    "मैं कल फिर वापस आऊँगा। पप्पू प्रॉमिस! 🤝": "Main kal phir waapas aaunga. Pappu promise!",
    // Meloni
    "हेलो फ्रेंड्स... मैं गिर गई!": "Hello friends... main gir gayi!",
    "हेलो फ्रेंड्स... मैं गिर गई! 💔": "Hello friends... main gir gayi!",
    "मेलोनी जी! मैं हेलीकॉप्टर भेजता हूँ!": "Meloni ji! Main helicopter bhejta hoon!",
    "मेलोनी जी! मैं हेलीकॉप्टर भेजता हूँ! 🚁": "Meloni ji! Main helicopter bhejta hoon!",
    "नो मेलोडी टुडे! आज बैरियर जीत गया!": "No Melodi today! Aaj barrier jeet gaya!",
    "नो मेलोडी टुडे! आज बैरियर जीत गया! 😢": "No Melodi today! Aaj barrier jeet gaya!",
    "भारत-इटली दोस्ती हमेशा अमर रहेगी!": "Bharat Italy dosti hamesha amar rahegi!",
    "भारत-इटली दोस्ती हमेशा अमर रहेगी! 🇮🇳🤝🇮🇹": "Bharat Italy dosti hamesha amar rahegi!",
    "अगली बार... मेलोडी ही जीतेगी!": "Agli baar... Melodi hi jeetegi!",
    "अगली बार... मेलोडी ही जीतेगी! 💪": "Agli baar... Melodi hi jeetegi!",
    // Salman
    "भाई गाड़ी नहीं चला रहा था! होवरबोर्ड में ड्राइवर था!": "Bhai gaadi nahi chala raha tha! Hoverboard mein driver tha!",
    "भाई गाड़ी नहीं चला रहा था! होवरबोर्ड में ड्राइवर था! 😠": "Bhai gaadi nahi chala raha tha! Hoverboard mein driver tha!",
    "एक बार माफ़ी मांग लो भाई...": "Ek baar maafi maang lo bhai...",
    "एक बार माफ़ी मांग लो भाई... 😅": "Ek baar maafi maang lo bhai...",
    "भाई भी सॉलिड है, और बैरियर भी सॉलिड है!": "Bhai bhi solid hai, aur barrier bhi solid hai!",
    "भाई भी सॉलिड है, और बैरियर भी सॉलिड है! 💔": "Bhai bhi solid hai, aur barrier bhi solid hai!",
    "दबंग होकर फिर से खड़ा होना पड़ेगा!": "Dabangg hokar phir se khada hona padega!",
    "दबंग होकर फिर से खड़ा होना पड़ेगा! 💪": "Dabangg hokar phir se khada hona padega!",
    "बीइंग ह्यूमन... गिरने से ही इंसान सीखता है!": "Being Human... girne se hi insaan seekhta hai!",
    "बीइंग HUMAN... गिरने से ही इंसान सीखता है! 🙏": "Being Human... girne se hi insaan seekhta hai!",
    "बीइंग ह्यूमन... गिरने से ही इंसान सीखता है! 🙏": "Being Human... girne se hi insaan seekhta hai!",
    // Gandhi
    "हे राम... बापू भी गिर गए।": "Hey Ram... Bapu bhi gir gaye.",
    "हे राम... बापू भी गिर गए। 🙏": "Hey Ram... Bapu bhi gir gaye.",
    "बापू जी! कांग्रेस आपकी विरासत संभालेगी!": "Bapu ji! Congress aapki legacy sambhalegi!",
    "बापू जी! कांग्रेस आपकी विरासत संभालेगी! 🍀": "Bapu ji! Congress aapki legacy sambhalegi!",
    "आंख के बदले आंख... सबको अंधा बना देती है!": "Aankh ke badle aankh... sabko andha bana deti hai!",
    "आंख के बदले आंख... सबको अंधा बना देती है! 😔": "Aankh ke badle aankh... sabko andha bana deti hai!",
    "क्या मैं आपकी लाठी लाऊँ?": "Kya main aapki laathi laoon?",
    "क्या मैं आपकी लाठी लाऊँ? 🦯": "Kya main aapki laathi laoon?",
    "अहिंसा से चलते रहो, बापू फिर उठेंगे।": "Ahinsa se chalte raho, Bapu phir uthenge.",
    "अहिंसा से चलते रहो, बापू फिर उठेंगे। 🕊️": "Ahinsa se chalte raho, Bapu phir uthenge.",
    // Fixed catchphrases / event lines
    "मित्रों! आज गेम शुरू करते हैं!": "Mitron! Aaj game shuru karte hain!",
    "वाह मोदी जी वाह! बहुत ही शानदार!": "Wah Modi ji wah! Bahut hi shandaar!",
    "अरे यार! राहुल जी प्राइम मिनिस्टर बन गए!": "Are yaar! Rahul ji Prime Minister ban gaye!",
    "इधर से आलू डालो, उधर से सोना निकालो! खेल शुरू!": "Idhar se aloo daalo, udhar se sona nikaalo! Khel shuru!",
    "मज़ा आया! बहुत बढ़िया!": "Maza aaya! Bahut badhiya!",
    "नमस्ते दोस्तों! मेलोडी फिर से आ गई है!": "Namaste doston! Melodi phir se aa gayi hai!",
    "क्या बात है! बहुत ही बढ़िया जोड़ी है!": "Kya baat hai! Bahut hi badhiya jodi hai!",
    "अरे नहीं! आज मेलोडी वाइब्स खत्म हो गईं!": "Are nahi! Aaj Melodi vibes khatam ho gayi!",
    "भाई दौड़ रहा है! फुटपाथ से सब दूर हो जाओ!": "Bhai daud raha hai! Footpath se sab door ho jao!",
    "क्या बात है! भाई बहुत खुश हुआ!": "Kya baat hai! Bhai bahut khush hua!",
    "गाड़ी मैं नहीं चला रहा था! ड्राइवर को बुलाओ!": "Gaadi main nahi chala raha tha! Driver ko bulao!",
    "अहिंसा परम धर्म। शांति के साथ दौड़ो!": "Ahinsa param dharma. Shanti ke sath daudo!",
    "सत्यमेव जयते! सत्य की जीत हुई!": "Satyamev Jayate! Satya ki jeet hui!",
    "हे राम! बापू आज गिर गए!": "Hey Ram! Bapu aaj gir gaye!",
    "मित्रों! यही होता है जब कांग्रेस चलती है!": "Mitron! Yahi hota hai jab Congress chalti hai!",
    "अबकी बार... मोदी सरकार!": "Abki baar... Modi Sarkar!"
  };

  function playMemeLine(skinId, eventType, customText = '') {
    if (window.AudioManagerMuted) return;

    const lines = {
      modi: {
        start: "मित्रों! आज गेम शुरू करते हैं!",
        correct: "वाह मोदी जी वाह! बहुत ही शानदार!",
        wrong: "अरे यार! राहुल जी प्राइम मिनिस्टर बन गए!"
      },
      rahul: {
        start: "इधर से आलू डालो, उधर से सोना निकालो! खेल शुरू!",
        correct: "मज़ा आया! बहुत बढ़िया!",
        wrong: "खतम! बाय-बाय! टाटा! गुडबाय!"
      },
      meloni: {
        start: "नमस्ते दोस्तों! मेलोडी फिर से आ गई है!",
        correct: "क्या बात है! बहुत ही बढ़िया जोड़ी है!",
        wrong: "अरे नहीं! आज मेलोडी वाइब्स खत्म हो गईं!"
      },
      salman: {
        start: "भाई दौड़ रहा है! फुटपाथ से सब दूर हो जाओ!",
        correct: "क्या बात है! भाई बहुत खुश हुआ!",
        wrong: "गाड़ी मैं नहीं चला रहा था! ड्राइवर को बुलाओ!"
      },
      gandhi: {
        start: "अहिंसा परम धर्म। शांति के साथ दौड़ो!",
        correct: "सत्यमेव जयते! सत्य की जीत हुई!",
        wrong: "हे राम! बापू आज गिर गए!"
      }
    };

    let rawText = "";
    if (eventType === 'custom') {
      rawText = customText;
    } else {
      const charLines = lines[skinId];
      if (charLines && charLines[eventType]) {
        rawText = charLines[eventType];
      }
    }

    if (!rawText) {
      logDebug("❌ No raw text found for event: " + eventType);
      return;
    }

    // Strip all emoji characters (surrogate pairs) so Android system TTS doesn't stutter or read emoji descriptions
    let textToSpeak = rawText.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
    if (!textToSpeak) {
      logDebug("❌ Text empty after removing emojis: " + rawText);
      return;
    }

    logDebug("🗣️ Attempting to speak: \"" + textToSpeak + "\" (Skin: " + skinId + ")");

    const targetLang = skinId === 'meloni' ? 'hi-IN' : 'hi-IN'; // prioritize Hindi for comedic dialogues
    const targetRate = 0.90;
    const targetPitch = skinId === 'gandhi' ? 0.70 : (skinId === 'meloni' ? 1.25 : 0.95);

    // --- 1. CAPACITOR NATIVE TEXT-TO-SPEECH PLUGIN (Inside APK) ---
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech) {
      const TTS = window.Capacitor.Plugins.TextToSpeech;
      try {
        logDebug("📱 Calling Capacitor native TTS speak...");
        TTS.stop();
        TTS.speak({
          text: textToSpeak,
          lang: targetLang,
          rate: targetRate,
          pitch: targetPitch,
          volume: 1.0,
          category: 'ambient'
        });
        logDebug("✅ Capacitor native TTS speak triggered successfully!");
        return; // Success, exited!
      } catch (e) {
        logDebug("⚠️ Capacitor Native TTS failed, falling back to Web Speech API: " + e.message);
      }
    }

    // --- 2. FALLBACK: WEB SPEECH API (Regular Web Browsers) ---
    if ('speechSynthesis' in window) {
      try {
        logDebug("🌐 Triggering Web Speech API...");
        
        // Reset and clear the Chromium speech queue (resume first to resolve any freeze bugs, then cancel)
        window.speechSynthesis.resume();
        window.speechSynthesis.cancel();
        
        if (voices.length === 0) {
          voices = window.speechSynthesis.getVoices();
        }
        logDebug("📚 Available voices: " + voices.length);
        
        // Find best Hindi voice match first, fallback to Indian English, then general English
        const hiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('HI'));
        const indVoice = voices.find(v => v.lang.includes('IN') || v.lang.includes('in'));
        const enVoice = voices.find(v => v.lang.includes('en') || v.lang.includes('EN'));
        
        let selectedVoice = null;
        let selectedLang = 'en-US';
        
        if (hiVoice) {
          selectedVoice = hiVoice;
          selectedLang = 'hi-IN';
          logDebug("🎯 Selected Hindi Voice: " + hiVoice.name);
        } else if (indVoice) {
          selectedVoice = indVoice;
          selectedLang = 'en-IN';
          logDebug("🎯 Selected Indian-English Voice: " + indVoice.name);
        } else if (enVoice) {
          selectedVoice = enVoice;
          selectedLang = enVoice.lang;
          logDebug("🎯 Selected Fallback English Voice: " + enVoice.name);
        } else {
          selectedLang = 'en-US'; // default standard fallback
          logDebug("🎯 No matching language voice found - using standard en-US default");
        }
        
        // CRITICAL FALLBACK: If selected voice uses an English engine (en-*), we MUST translate the 
        // Devnagari script to Roman Hinglish, otherwise the English voice will be completely silent!
        if (selectedLang.startsWith('en')) {
          // Check for Devnagari match in our dictionary
          const rawMatch = rawText.trim();
          const cleanMatch = textToSpeak.trim();
          const romanHinglish = HINDI_TRANSLITERATIONS[rawMatch] || HINDI_TRANSLITERATIONS[cleanMatch];
          
          if (romanHinglish) {
            logDebug("📝 English voice detected. Transliterating Devnagari \"" + textToSpeak + "\" to Roman Hinglish \"" + romanHinglish + "\"");
            textToSpeak = romanHinglish;
          } else {
            logDebug("⚠️ No Hinglish transliteration mapped for: \"" + textToSpeak + "\". Attempting spelling fallback.");
          }
        }
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.lang = selectedLang;
        utterance.rate = targetRate;
        utterance.pitch = targetPitch;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          logDebug("🔊 Audio speech started playing!");
        };
        utterance.onend = () => {
          logDebug("🔇 Audio speech finished successfully.");
        };
        utterance.onerror = (err) => {
          logDebug("❌ SpeechSynthesis error event: " + err.error + " (type: " + err.type + ")");
        };
        
        window.speechSynthesis.speak(utterance);
        logDebug("⚡ speechSynthesis.speak() method called.");
      } catch(e) {
        logDebug("❌ Web Speech synthesis catch block error: " + e.message);
      }
    } else {
      logDebug("❌ Web Speech API (speechSynthesis) is NOT supported in this browser!");
    }
  }

  function playMemeJingle() {
    // Whimsical boing-whistle melody for the cutscene
    if (!ctx || window.AudioManagerMuted) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      const melody = [
        { f: 523, t: 0.0, d: 0.15 }, // C5
        { f: 659, t: 0.15, d: 0.15 }, // E5
        { f: 784, t: 0.3, d: 0.15 },  // G5
        { f: 1046, t: 0.45, d: 0.25 }, // C6
        { f: 880, t: 0.7, d: 0.12 },  // A5
        { f: 1046, t: 0.82, d: 0.12 }, // C6
        { f: 1175, t: 0.94, d: 0.3 }, // D6
        { f: 987, t: 1.24, d: 0.4 },  // B5 fade
      ];
      melody.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f * 0.6, ctx.currentTime + t);
        osc.frequency.exponentialRampToValueAtTime(f, ctx.currentTime + t + 0.04);
        gain.gain.setValueAtTime(0, ctx.currentTime + t);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + d + 0.01);
      });
    } catch(e) {}
  }

  // Create debug logs element on the page dynamically
  if (typeof document !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      const logContainer = document.createElement('div');
      logContainer.id = 'audio-debug-log';
      logContainer.style.position = 'fixed';
      logContainer.style.bottom = '10px';
      logContainer.style.left = '10px';
      logContainer.style.background = 'rgba(0,0,0,0.85)';
      logContainer.style.color = '#00ff00';
      logContainer.style.padding = '8px 12px';
      logContainer.style.fontFamily = 'monospace';
      logContainer.style.fontSize = '11px';
      logContainer.style.maxHeight = '120px';
      logContainer.style.overflowY = 'auto';
      logContainer.style.zIndex = '999999';
      logContainer.style.pointerEvents = 'none';
      logContainer.style.borderRadius = '5px';
      logContainer.style.border = '1px solid #00ff00';
      logContainer.style.maxWidth = '320px';
      logContainer.style.boxShadow = '0 0 10px rgba(0,255,0,0.2)';
      logContainer.style.display = window.location.search.includes('debug') ? 'block' : 'none';
      logContainer.innerHTML = '⚙️ Audio TTS Logger Active (Appended ?debug to show logs)<br>';
      document.body.appendChild(logContainer);
    });

    // Pre-warm Web Speech API on first interaction to unlock voices list and bypass autoplay activation rules
    const unlockSpeech = () => {
      if ('speechSynthesis' in window) {
        logDebug("👉 User clicked screen - pre-warming Web Speech API...");
        const silentUtterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(silentUtterance);
        window.speechSynthesis.getVoices();
      }
      document.removeEventListener('click', unlockSpeech);
      document.removeEventListener('touchstart', unlockSpeech);
    };
    document.addEventListener('click', unlockSpeech);
    document.addEventListener('touchstart', unlockSpeech);
  }

  function logDebug(msg) {
    console.log("[AudioDebug] " + msg);
    const debugDiv = document.getElementById('audio-debug-log');
    if (debugDiv) {
      debugDiv.style.display = 'block'; // make visible if any log happens
      debugDiv.innerHTML += msg + "<br>";
      debugDiv.scrollTop = debugDiv.scrollHeight;
    }
  }

  return { init, playSwipe, playCorrect, playWrong, playCoin, playLevelUp, playCountdown, startBeat, stopBeat, playStartWhistle, playMemeLine, playMemeJingle };
})();
