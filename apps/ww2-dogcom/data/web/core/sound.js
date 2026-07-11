// sound.js - Procedural audio for engine, gunfire, explosions
// Uses Web Audio API - no external assets needed
// Exports: WW2.sound.init(), .engineStart/Stop, .gunfire, .explosion

WW2 = window.WW2 || {};

WW2.sound = (function() {
  let ctx = null;
  let masterGain = null;
  let engineNodes = {};

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
    return true;
  }

  // Engine drone - layered sawtooth + noise
  function engineStart(id) {
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();

    const nodes = {};
    const master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(masterGain);

    // Layer 1: Low rumble
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 45;

    const gain1 = ctx.createGain();
    gain1.gain.value = 0.4;
    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start();

    // Layer 2: Mid roar
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = 90;

    const gain2 = ctx.createGain();
    gain2.gain.value = 0.15;
    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.value = 400;
    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(master);
    osc2.start();

    // Layer 3: Noise (prop wash)
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 200;
    noiseFilter.Q.value = 0.5;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.2;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();

    nodes.master = master;
    nodes.osc1 = osc1;
    nodes.osc2 = osc2;
    nodes.noise = noise;
    nodes.filter2 = filter2;
    nodes.noiseFilter = noiseFilter;

    engineNodes[id] = nodes;
    return nodes;
  }

  function engineSetRPM(id, rpm) {
    // rpm: 0-1 normalized
    if (!engineNodes[id]) return;
    const n = engineNodes[id];
    const baseFreq = 35;
    const rpmScale = baseFreq + rpm * 120;

    n.osc1.frequency.setTargetAtTime(rpmScale, ctx.currentTime, 0.05);
    n.osc2.frequency.setTargetAtTime(rpmScale * 2, ctx.currentTime, 0.05);
    n.filter2.frequency.setTargetAtTime(200 + rpm * 800, ctx.currentTime, 0.05);
    n.noiseFilter.frequency.setTargetAtTime(100 + rpm * 600, ctx.currentTime, 0.05);
    n.master.gain.setTargetAtTime(0.1 + rpm * 0.3, ctx.currentTime, 0.05);
  }

  function engineStop(id) {
    if (!engineNodes[id]) return;
    const n = engineNodes[id];
    n.master.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    setTimeout(() => {
      try { n.osc1.stop(); n.osc2.stop(); n.noise.stop(); } catch(e) {}
      delete engineNodes[id];
    }, 200);
  }

  // Gunshot burst
  function gunfire(count = 1) {
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        // Noise burst for the "crack"
        const bufferSize = Math.floor(ctx.sampleRate * 0.08);
        const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let j = 0; j < bufferSize; j++) {
          d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.15));
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 500;

        const gain = ctx.createGain();
        gain.gain.value = 0.6;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        src.start();

        // Low boom
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 80;
        const oGain = ctx.createGain();
        oGain.gain.value = 0.3;
        oGain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
        osc.connect(oGain);
        oGain.connect(masterGain);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }, i * 40);
    }
  }

  // Explosion
  function explosion(distance = 100) {
    if (!ctx) init();
    if (ctx.state === 'suspended') ctx.resume();

    // Volume based on distance
    const vol = Math.max(0.05, 1.0 / (1 + distance / 200));

    // Deep rumble
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 40;
    osc.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 0.8);

    const gain = ctx.createGain();
    gain.gain.value = vol * 0.8;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);

    // Noise crash
    const bufSize = Math.floor(ctx.sampleRate * 1.5);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.1));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const nFilter = ctx.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.value = 800;
    nFilter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.0);

    const nGain = ctx.createGain();
    nGain.gain.value = vol * 0.6;

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(masterGain);
    noise.start();

    return { osc, gain, noise };
  }

  // Aircraft hit (metal crunch)
  function hit() {
    if (!ctx) init();

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 200;
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);

    const gain = ctx.createGain();
    gain.gain.value = 0.2;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  // Radar ping
  function radarPing() {
    if (!ctx) init();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  function setMasterVolume(v) {
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  function getEngineNodes() {
    return engineNodes;
  }

  return {
    init, engineStart, engineSetRPM, engineStop, gunfire, explosion, hit, radarPing,
    setMasterVolume, getEngineNodes
  };
})();
