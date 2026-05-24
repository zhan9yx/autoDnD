const DEFAULT_VOLUMES = Object.freeze({
  master: 0.62,
  music: 0.42,
  ambience: 0.72
});

const TYPE_FILTERS = Object.freeze({
  weather: { type: "bandpass", frequency: 1200, q: 0.8 },
  water: { type: "lowpass", frequency: 680, q: 0.7 },
  fire: { type: "bandpass", frequency: 2100, q: 1.1 },
  nature: { type: "bandpass", frequency: 3600, q: 0.9 },
  urban: { type: "lowpass", frequency: 520, q: 0.55 },
  crowd: { type: "bandpass", frequency: 780, q: 0.8 },
  voice: { type: "bandpass", frequency: 1320, q: 1.2 },
  tension: { type: "lowpass", frequency: 180, q: 1.4 },
  foley: { type: "bandpass", frequency: 980, q: 1.05 }
});

const PROFILE_SETTINGS = Object.freeze({
  "rain.drizzle": profile({ frequency: 2450, q: 0.86, cadence: 9, playbackRate: 1.02, holdMix: 0.34, burst: 0.08, texture: "drizzle", modulation: { frequency: 0.18, depth: 0.018 } }),
  "rain.light": profile({ frequency: 1700, q: 0.65, cadence: 4, playbackRate: 1.08, holdMix: 0.48, texture: "rain", modulation: { frequency: 0.14, depth: 0.014 } }),
  "rain.downpour": profile({ type: "lowpass", frequency: 760, q: 0.55, cadence: 1, playbackRate: 1.24, holdMix: 0.66, burst: 0.26, texture: "downpour", modulation: { frequency: 0.11, depth: 0.035 } }),
  "rain.heavy": profile({ frequency: 940, q: 0.72, cadence: 2, playbackRate: 1.18, burst: 0.18, texture: "rain", modulation: { frequency: 0.1, depth: 0.026 } }),
  "rain.splashes": profile({ frequency: 1260, q: 1.05, cadence: 14, playbackRate: 0.92, holdMix: 0.38, burst: 0.28, texture: "splashes" }),
  "thunder.distant": profile({ type: "lowpass", frequency: 150, q: 1.5, cadence: 74, playbackRate: 0.55, pulse: { frequency: 33, type: "sine", gain: 0.26 } }),
  "thunder.rumble": profile({ type: "lowpass", frequency: 86, q: 1.6, cadence: 96, playbackRate: 0.38, holdMix: 0.94, burst: 0.16, texture: "rumble", pulse: { frequency: 29, type: "sine", gain: 0.22 }, modulation: { frequency: 0.05, depth: 0.04 } }),
  "thunder.close": profile({ type: "lowpass", frequency: 115, q: 1.8, cadence: 48, playbackRate: 0.48, burst: 0.34, pulse: { frequency: 42, type: "sawtooth", gain: 0.34 } }),
  "lightning.crackle": profile({ frequency: 3200, q: 1.35, cadence: 5, playbackRate: 1.35, holdMix: 0.28, burst: 0.42, texture: "crackle" }),
  "weather.clear-day": profile({ frequency: 3200, q: 0.42, cadence: 46, playbackRate: 0.86, holdMix: 0.52, pulse: { frequency: 0.08, type: "sine", gain: 0.08 } }),
  "weather.night-air": profile({ frequency: 760, q: 0.5, cadence: 41, playbackRate: 0.58, holdMix: 0.82, pulse: { frequency: 0.11, type: "sine", gain: 0.06 } }),
  "weather.incense-air": profile({ frequency: 1480, q: 0.68, cadence: 38, playbackRate: 0.62, holdMix: 0.78, pulse: { frequency: 0.07, type: "sine", gain: 0.05 } }),
  "weather.frost-air": profile({ type: "bandpass", frequency: 1120, q: 0.74, cadence: 44, playbackRate: 0.5, holdMix: 0.84, pulse: { frequency: 0.05, type: "sine", gain: 0.05 } }),
  "weather.snow-hush": profile({ type: "lowpass", frequency: 360, q: 0.5, cadence: 52, playbackRate: 0.42, holdMix: 0.9, pulse: { frequency: 0.04, type: "sine", gain: 0.04 } }),
  "wind.light": profile({ frequency: 880, q: 0.55, cadence: 19, playbackRate: 0.74, texture: "wind", pulse: { frequency: 0.18, type: "sine", gain: 0.12 }, modulation: { frequency: 0.07, depth: 0.018 } }),
  "wind.gusts": profile({ type: "lowpass", frequency: 540, q: 0.8, cadence: 12, playbackRate: 0.82, holdMix: 0.82, burst: 0.16, texture: "gusts", pulse: { frequency: 0.3, type: "sine", gain: 0.16 }, modulation: { frequency: 0.09, depth: 0.04 } }),
  "wind.gale": profile({ frequency: 620, q: 0.7, cadence: 9, playbackRate: 0.88, burst: 0.2, texture: "gusts", pulse: { frequency: 0.45, type: "sawtooth", gain: 0.18 }, modulation: { frequency: 0.13, depth: 0.035 } }),
  "wind.canopy": profile({ frequency: 1720, q: 0.68, cadence: 17, playbackRate: 0.78, holdMix: 0.7, texture: "leaves", pulse: { frequency: 0.24, type: "sine", gain: 0.1 }, modulation: { frequency: 0.08, depth: 0.02 } }),
  "water.drips": profile({ frequency: 1200, q: 0.9, cadence: 22, playbackRate: 0.7 }),
  "water.pond-lap": profile({ frequency: 520, q: 0.65, cadence: 16, playbackRate: 0.62, pulse: { frequency: 0.8, type: "sine", gain: 0.12 } }),
  "water.bubbles": profile({ frequency: 740, q: 0.8, cadence: 11, playbackRate: 0.82 }),
  "water.cistern-echo": profile({ type: "lowpass", frequency: 430, q: 0.86, cadence: 24, playbackRate: 0.54, pulse: { frequency: 0.42, type: "sine", gain: 0.1 } }),
  "waterfall.roar": profile({ type: "lowpass", frequency: 760, q: 0.52, cadence: 3, playbackRate: 0.96, burst: 0.12 }),
  "mist.spray": profile({ frequency: 2600, q: 0.5, cadence: 5, playbackRate: 1.04 }),
  "fire.crackle": profile({ frequency: 2400, q: 1.15, cadence: 19, playbackRate: 1.28, burst: 0.22 }),
  "fire.pops": profile({ frequency: 3200, q: 1.4, cadence: 28, playbackRate: 1.42, burst: 0.35 }),
  "fire.hearth": profile({ frequency: 1800, q: 0.85, cadence: 24, playbackRate: 1.05 }),
  "fire.candle": profile({ frequency: 2200, q: 1.0, cadence: 32, playbackRate: 0.98 }),
  "nature.forest-leaves": profile({ frequency: 3400, q: 0.82, cadence: 14, playbackRate: 0.9, pulse: { frequency: 0.32, type: "sine", gain: 0.1 } }),
  "nature.birds": profile({ frequency: 3900, q: 1.25, cadence: 42, playbackRate: 1.16, pulse: { frequency: 880, type: "sine", gain: 0.1 } }),
  "nature.spring-birds": profile({ frequency: 4200, q: 1.18, cadence: 31, playbackRate: 1.2, pulse: { frequency: 960, type: "sine", gain: 0.12 } }),
  "nature.branches": profile({ frequency: 1450, q: 1.05, cadence: 34, playbackRate: 0.72 }),
  "nature.reeds": profile({ frequency: 2500, q: 0.7, cadence: 18, playbackRate: 0.8 }),
  "nature.frogs": profile({ frequency: 620, q: 1.1, cadence: 37, playbackRate: 0.56, pulse: { frequency: 92, type: "triangle", gain: 0.12 } }),
  "foley.weapon-clatter": profile({ frequency: 1900, q: 1.35, cadence: 17, playbackRate: 1.1, burst: 0.2 }),
  "foley.brush": profile({ frequency: 2800, q: 0.78, cadence: 15, playbackRate: 0.88 }),
  "foley.cavern-echo": profile({ type: "lowpass", frequency: 360, q: 1.05, cadence: 30, playbackRate: 0.5, pulse: { frequency: 0.36, type: "sine", gain: 0.08 } }),
  "foley.cups-plates": profile({ frequency: 1850, q: 1.28, cadence: 18, playbackRate: 1.16, burst: 0.18, pulse: { frequency: 520, type: "sine", gain: 0.08 } }),
  "foley.archive-pages": profile({ frequency: 2450, q: 0.9, cadence: 13, playbackRate: 0.94 }),
  "foley.shelf-creak": profile({ frequency: 840, q: 1.18, cadence: 34, playbackRate: 0.54 }),
  "foley.stone-reverb": profile({ type: "lowpass", frequency: 290, q: 1.2, cadence: 42, playbackRate: 0.48, pulse: { frequency: 41, type: "sine", gain: 0.11 } }),
  "foley.floor-creak": profile({ frequency: 720, q: 1.15, cadence: 36, playbackRate: 0.52, burst: 0.1 }),
  "foley.soft-cloth": profile({ frequency: 1700, q: 0.58, cadence: 26, playbackRate: 0.76 }),
  "foley.dry-leaves": profile({ frequency: 3100, q: 0.82, cadence: 12, playbackRate: 0.92, burst: 0.12 }),
  "insects.crickets": profile({ frequency: 4200, q: 1.2, cadence: 7, playbackRate: 1.22, pulse: { frequency: 310, type: "sine", gain: 0.16 } }),
  "insects.cicadas": profile({ frequency: 5100, q: 0.9, cadence: 5, playbackRate: 1.05, pulse: { frequency: 420, type: "triangle", gain: 0.14 } }),
  "urban.footsteps": profile({ frequency: 620, q: 0.72, cadence: 22, playbackRate: 0.7, burst: 0.08 }),
  "urban.workshop-taps": profile({ frequency: 1380, q: 1.05, cadence: 25, playbackRate: 0.82, burst: 0.12 }),
  "urban.cart-wheels": profile({ frequency: 720, q: 0.75, cadence: 27, playbackRate: 0.76 }),
  "urban.bells": profile({ frequency: 1600, q: 1.4, cadence: 54, playbackRate: 0.86, pulse: { frequency: 220, type: "sine", gain: 0.12 } }),
  "urban.archive-room": profile({ type: "lowpass", frequency: 460, q: 0.58, cadence: 45, playbackRate: 0.5, holdMix: 0.86 }),
  "urban.quiet-interior": profile({ type: "lowpass", frequency: 420, q: 0.52, cadence: 47, playbackRate: 0.48, holdMix: 0.88 }),
  "crowd.market-murmur": profile({ frequency: 840, q: 0.75, cadence: 21, playbackRate: 0.68, texture: "crowd", pulse: { frequency: 105, type: "sine", gain: 0.11 }, modulation: { frequency: 0.21, depth: 0.018 }, formants: [{ frequency: 170, gain: 0.024 }, { frequency: 620, gain: 0.018 }] }),
  "crowd.babble": profile({ frequency: 880, q: 0.9, cadence: 25, playbackRate: 0.67, texture: "crowd", pulse: { frequency: 118, type: "sawtooth", gain: 0.1 }, modulation: { frequency: 0.23, depth: 0.025 }, formants: [{ frequency: 160, gain: 0.025 }, { frequency: 700, gain: 0.018 }, { frequency: 1220, gain: 0.014 }] }),
  "crowd.low-murmur": profile({ frequency: 640, q: 0.64, cadence: 33, playbackRate: 0.58, pulse: { frequency: 84, type: "sine", gain: 0.09 } }),
  "crowd.tavern-murmur": profile({ frequency: 690, q: 0.72, cadence: 24, playbackRate: 0.64, pulse: { frequency: 96, type: "sine", gain: 0.1 }, formants: [{ frequency: 145, gain: 0.022 }, { frequency: 540, gain: 0.017 }] }),
  "crowd.cheers": profile({ frequency: 1100, q: 0.95, cadence: 13, playbackRate: 0.92, burst: 0.18, pulse: { frequency: 160, type: "triangle", gain: 0.14 } }),
  "crowd.laughter": profile({ frequency: 1040, q: 0.9, cadence: 18, playbackRate: 0.82, burst: 0.12, pulse: { frequency: 132, type: "triangle", gain: 0.12 } }),
  "crowd.jeers": profile({ frequency: 980, q: 1.0, cadence: 15, playbackRate: 0.88, burst: 0.16, pulse: { frequency: 126, type: "sawtooth", gain: 0.11 } }),
  "crowd.applause": profile({ frequency: 1800, q: 1.1, cadence: 6, playbackRate: 1.18, burst: 0.2 }),
  "foley.glass-toast": profile({ frequency: 2600, q: 1.6, cadence: 31, playbackRate: 1.32, burst: 0.24, pulse: { frequency: 620, type: "sine", gain: 0.1 } }),
  "voice.market-calls": profile({ frequency: 1450, q: 1.1, cadence: 19, playbackRate: 0.84, texture: "voice", pulse: { frequency: 180, type: "triangle", gain: 0.12 }, modulation: { frequency: 0.31, depth: 0.02 }, formants: [{ frequency: 190, gain: 0.045 }, { frequency: 760, gain: 0.034 }, { frequency: 1320, gain: 0.024 }] }),
  "voice.tavern-babble": profile({ frequency: 760, q: 0.85, cadence: 27, playbackRate: 0.61, texture: "crowd", pulse: { frequency: 112, type: "sine", gain: 0.11 }, modulation: { frequency: 0.19, depth: 0.022 }, formants: [{ frequency: 150, gain: 0.034 }, { frequency: 520, gain: 0.025 }, { frequency: 980, gain: 0.018 }] }),
  "voice.shouting": profile({ frequency: 1450, q: 1.2, cadence: 16, playbackRate: 0.86, burst: 0.14, pulse: { frequency: 140, type: "sawtooth", gain: 0.12 }, formants: [{ frequency: 210, gain: 0.04 }, { frequency: 900, gain: 0.03 }] }),
  "voice.heckles": profile({ frequency: 1250, q: 1.05, cadence: 23, playbackRate: 0.82 }),
  "voice.whispers": profile({ frequency: 2100, q: 1.45, cadence: 36, playbackRate: 0.58, pulse: { frequency: 82, type: "sine", gain: 0.08 } }),
  "voice.song": profile({ frequency: 980, q: 1.05, cadence: 26, playbackRate: 0.72, pulse: { frequency: 196, type: "sine", gain: 0.18 } }),
  "voice.chant": profile({ frequency: 840, q: 1.15, cadence: 30, playbackRate: 0.64, pulse: { frequency: 147, type: "sine", gain: 0.16 } }),
  "tension.bowed-metal": profile({ type: "lowpass", frequency: 210, q: 1.5, cadence: 55, playbackRate: 0.62, pulse: { frequency: 37, type: "sawtooth", gain: 0.2 } })
});

const VALID_LAYER_TYPES = new Set(Object.keys(TYPE_FILTERS));

const MUSIC_MOODS = Object.freeze({
  danger: { base: 46.25, fifth: 69.3, wave: "sawtooth" },
  mystery: { base: 55, fifth: 82.41, wave: "triangle" },
  suspense: { base: 49, fifth: 73.42, wave: "triangle" },
  wonder: { base: 65.41, fifth: 98, wave: "sine" },
  calm: { base: 58.27, fifth: 87.31, wave: "sine" },
  warm: { base: 61.74, fifth: 92.5, wave: "triangle" },
  quiet: { base: 51.91, fifth: 77.78, wave: "sine" },
  busy: { base: 73.42, fifth: 110, wave: "triangle" },
  motion: { base: 65.41, fifth: 130.81, wave: "sine" }
});

export function createAmbienceEngine({ onStateChange } = {}) {
  let context = null;
  let masterGain = null;
  let musicGain = null;
  let ambienceGain = null;
  let activeNodes = [];
  let currentSoundscapeId = "";
  let currentSafetyReasons = [];
  let enabled = false;
  let volumes = loadVolumes();

  return {
    get enabled() {
      return enabled;
    },
    get volumes() {
      return { ...volumes };
    },
    get currentSoundscapeId() {
      return currentSoundscapeId;
    },
    async start(soundscape) {
      if (!canUseAudio()) return false;
      await ensureContext();
      enabled = true;
      await context.resume();
      applyVolumes();
      replaceGraph(soundscape);
      emit();
      return true;
    },
    update(soundscape) {
      if (!enabled || !context || !soundscape) return;
      if (currentSoundscapeId === soundscape.id) {
        retuneGraph(soundscape);
        return;
      }
      replaceGraph(soundscape);
      emit();
    },
    stop() {
      fadeAndStop(activeNodes);
      activeNodes = [];
      enabled = false;
      currentSoundscapeId = "";
      currentSafetyReasons = [];
      emit();
    },
    setVolumes(nextVolumes) {
      volumes = {
        master: clampVolume(nextVolumes.master ?? volumes.master),
        music: clampVolume(nextVolumes.music ?? volumes.music),
        ambience: clampVolume(nextVolumes.ambience ?? volumes.ambience)
      };
      localStorage.setItem("aidm.ambience.volumes", JSON.stringify(volumes));
      applyVolumes();
      emit();
    }
  };

  async function ensureContext() {
    if (context) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    context = new AudioContextClass();
    masterGain = context.createGain();
    musicGain = context.createGain();
    ambienceGain = context.createGain();
    musicGain.connect(masterGain);
    ambienceGain.connect(masterGain);
    masterGain.connect(context.destination);
    applyVolumes();
  }

  function replaceGraph(soundscape) {
    if (!context || !soundscape) return;
    const safeSoundscape = sanitizeSoundscape(soundscape);
    const fade = transitionSeconds(soundscape, 0.9);
    fadeAndStop(activeNodes, fade);
    activeNodes = [
      ...buildMusicNodes(safeSoundscape, fade),
      ...safeSoundscape.layers.flatMap((layer, index) => buildLayerNodes(layer, safeSoundscape, index, fade))
    ];
    currentSoundscapeId = safeSoundscape.id;
    currentSafetyReasons = safeSoundscape.safetyReasons;
  }

  function retuneGraph(soundscape) {
    const safeSoundscape = sanitizeSoundscape(soundscape);
    currentSafetyReasons = safeSoundscape.safetyReasons;
    for (const item of activeNodes) {
      const nextGain = item.kind === "music"
        ? safeSoundscape.intensity * 0.26
        : (item.layerBaseGain ?? item.layerGain ?? 0.4) * (0.65 + safeSoundscape.intensity * 0.45);
      item.gain?.gain.setTargetAtTime(clampVolume(nextGain), context.currentTime, 0.7);
    }
  }

  function buildMusicNodes(soundscape, fadeSeconds) {
    const mood = MUSIC_MOODS[soundscape.musicCue?.mood] || MUSIC_MOODS.mystery;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(musicGain);
    gain.gain.setTargetAtTime(clampVolume(soundscape.intensity * 0.28), context.currentTime, fadeSeconds / 3);

    const low = context.createOscillator();
    low.type = mood.wave;
    low.frequency.value = mood.base;
    low.detune.value = soundscape.category === "combat" ? -8 : 0;
    low.connect(gain);
    low.start();

    const high = context.createOscillator();
    high.type = mood.wave === "sawtooth" ? "triangle" : mood.wave;
    high.frequency.value = mood.fifth;
    high.detune.value = soundscape.category === "mystery" ? -13 : 4;
    high.connect(gain);
    high.start();

    return [
      { source: low, gain, kind: "music" },
      { source: high, gain, kind: "music" }
    ];
  }

  function buildLayerNodes(layer, soundscape, index, fadeSeconds) {
    const nodes = [];
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const settings = settingsForLayer(layer);
    filter.type = settings.type;
    filter.frequency.value = settings.frequency + index * 37;
    filter.Q.value = settings.q;
    filter.connect(gain);
    gain.connect(ambienceGain);
    gain.gain.value = 0;
    const layerBaseGain = clampVolume(layer.gain);
    const layerGain = clampVolume(layerBaseGain * (0.65 + soundscape.intensity * 0.45));
    gain.gain.setTargetAtTime(layerGain, context.currentTime, fadeSeconds / 3);

    const noise = context.createBufferSource();
    noise.buffer = createNoiseBuffer(settings, 2.4 + index * 0.11);
    noise.loop = true;
    noise.playbackRate.value = settings.playbackRate;
    noise.connect(filter);
    noise.start();
    nodes.push({ source: noise, gain, layerGain, layerBaseGain, kind: layer.type, profile: layer.profile });

    if (settings.pulse || layer.type === "nature" || layer.type === "urban" || layer.type === "crowd" || layer.type === "voice" || layer.type === "tension") {
      const pulseSettings = settings.pulse || {};
      const pulse = context.createOscillator();
      const pulseGain = context.createGain();
      pulse.type = pulseSettings.type || (layer.type === "tension" ? "sawtooth" : "sine");
      pulse.frequency.value = pulseSettings.frequency ?? defaultPulseFrequency(layer.type, index);
      pulseGain.gain.value = pulseSettings.gain ?? 0.3;
      pulse.connect(pulseGain);
      pulseGain.connect(filter);
      pulse.start();
      nodes.push({ source: pulse, gain, layerGain: layerGain * (pulseSettings.gain ?? 0.3), layerBaseGain, kind: layer.type, profile: layer.profile });
    }

    if (Array.isArray(settings.formants)) {
      settings.formants.slice(0, 4).forEach((formant, formantIndex) => {
        const frequency = Number(formant.frequency);
        const formantOscillator = context.createOscillator();
        const formantGain = context.createGain();
        formantOscillator.type = formant.type || "sine";
        formantOscillator.frequency.value = Number.isFinite(frequency) && frequency > 0
          ? frequency
          : 180 + formantIndex * 360;
        formantOscillator.detune.value = Number(formant.detune ?? 0) + index * 3;
        formantGain.gain.value = clampVolume(formant.gain ?? 0.02);
        formantOscillator.connect(formantGain);
        formantGain.connect(filter);
        formantOscillator.start();
        nodes.push({ source: formantOscillator, gain, layerGain: layerGain * formantGain.gain.value, layerBaseGain, kind: layer.type, profile: layer.profile });
      });
    }

    if (settings.modulation) {
      const lfo = context.createOscillator();
      const lfoGain = context.createGain();
      lfo.type = settings.modulation.type || "sine";
      lfo.frequency.value = settings.modulation.frequency;
      lfoGain.gain.value = clampVolume(settings.modulation.depth ?? 0.02);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      nodes.push({ source: lfo, gain, layerGain, layerBaseGain, kind: layer.type, profile: layer.profile });
    }

    return nodes;
  }

  function createNoiseBuffer(settings, seconds) {
    const sampleRate = context.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * seconds));
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    let held = 0;
    let low = 0;
    const cadence = Math.max(1, Math.round(settings.cadence));
    const holdMix = clampVolume(settings.holdMix);
    const burstLevel = clampVolume(settings.burst);
    for (let i = 0; i < frameCount; i += 1) {
      const white = Math.random() * 2 - 1;
      if (i % cadence === 0) held = white;
      low += (white - low) * 0.035;
      const burst = burstLevel && Math.random() > 1 - burstLevel * 0.08 ? white : 0;
      data[i] = clampSample(
        held * holdMix
        + white * (1 - holdMix)
        + burst * burstLevel
        + low * (settings.rumble ?? 0)
        + textureGrain(settings.texture, white, i, sampleRate)
      );
    }
    return buffer;
  }

  function applyVolumes() {
    if (!context || !masterGain) return;
    masterGain.gain.setTargetAtTime(volumes.master, context.currentTime, 0.2);
    musicGain.gain.setTargetAtTime(volumes.music, context.currentTime, 0.2);
    ambienceGain.gain.setTargetAtTime(volumes.ambience, context.currentTime, 0.2);
  }

  function fadeAndStop(nodes, fadeSeconds = 0.45) {
    if (!context) return;
    const stopAt = context.currentTime + Math.max(0.2, fadeSeconds);
    const timeConstant = Math.max(0.08, fadeSeconds / 4);
    for (const node of nodes) {
      try {
        node.gain?.gain.setTargetAtTime(0, context.currentTime, timeConstant);
        node.source?.stop(stopAt);
      } catch {
        // Some browser sources may already be stopped during route changes.
      }
    }
  }

  function emit() {
    onStateChange?.({ enabled, volumes: { ...volumes }, currentSoundscapeId, safetyReasons: [...currentSafetyReasons] });
  }
}

export function canUseAudio() {
  return typeof window !== "undefined" && Boolean(window.AudioContext || window.webkitAudioContext);
}

function loadVolumes() {
  try {
    return {
      ...DEFAULT_VOLUMES,
      ...JSON.parse(localStorage.getItem("aidm.ambience.volumes") || "{}")
    };
  } catch {
    return { ...DEFAULT_VOLUMES };
  }
}

function clampVolume(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
}

function profile(settings) {
  return Object.freeze({
    type: "bandpass",
    frequency: 1000,
    q: 0.8,
    cadence: 23,
    playbackRate: 1,
    holdMix: 0.72,
    burst: 0,
    pulse: null,
    formants: null,
    ...settings
  });
}

function settingsForLayer(layer) {
  const base = TYPE_FILTERS[layer.type] || TYPE_FILTERS.foley;
  return {
    ...profile({
      ...base,
      cadence: cadenceForType(layer.type),
      playbackRate: playbackRateForType(layer.type)
    }),
    ...(PROFILE_SETTINGS[layer.profile] || {})
  };
}

export function sanitizeSoundscape(soundscape = {}) {
  const safetyReasons = [];
  const id = String(soundscape.id || "mystery");
  const intensity = clampVolume(soundscape.intensity ?? 0.32);
  const rawLayers = Array.isArray(soundscape.layers) ? soundscape.layers : [];
  const layers = rawLayers
    .filter((layer, index) => {
      const valid = layer && VALID_LAYER_TYPES.has(layer.type);
      if (!valid) safetyReasons.push(`dropped-invalid-layer-${index}`);
      return valid;
    })
    .slice(0, 6)
    .map((layer) => ({
      ...layer,
      gain: clampVolume(layer.gain ?? 0.35),
      profile: String(layer.profile || "")
    }));

  if (rawLayers.length > layers.length) {
    safetyReasons.push("limited-layer-count");
  }
  if (!soundscape.layers || layers.length === 0) {
    safetyReasons.push("fallback-empty-soundscape");
    layers.push({ type: "tension", profile: "tension.bowed-metal", gain: 0.22 });
  }

  return {
    ...soundscape,
    id,
    intensity,
    layers,
    safetyReasons: [...new Set([...(soundscape.profile?.guards || []), ...safetyReasons])]
  };
}

function transitionSeconds(soundscape, fallback) {
  const durationMs = Number(soundscape?.transition?.durationMs ?? soundscape?.musicCue?.crossfadeMs);
  if (!Number.isFinite(durationMs)) return fallback;
  return Math.max(0.35, Math.min(3.2, durationMs / 1000));
}

function cadenceForType(type) {
  if (type === "weather") return 3;
  if (type === "water") return 12;
  if (type === "fire") return 19;
  if (type === "urban" || type === "crowd") return 31;
  if (type === "voice") return 29;
  if (type === "tension") return 55;
  return 23;
}

function playbackRateForType(type) {
  if (type === "water") return 0.74;
  if (type === "fire") return 1.35;
  if (type === "nature") return 0.92;
  if (type === "urban" || type === "crowd") return 0.66;
  if (type === "voice") return 0.78;
  return 1;
}

function defaultPulseFrequency(type, index) {
  if (type === "nature") return 310 + index * 21;
  if (type === "urban" || type === "crowd") return 110 + index * 13;
  if (type === "voice") return 140 + index * 11;
  if (type === "tension") return 36 + index * 4;
  return 90 + index * 9;
}

function textureGrain(texture, white, index, sampleRate) {
  const t = index / sampleRate;
  switch (texture) {
    case "drizzle":
      return (Math.random() < 0.018 ? white * 0.78 : 0) + Math.sin(t * 97) * 0.018;
    case "rain":
      return (Math.random() < 0.032 ? white * 0.42 : 0) + Math.sin(t * 41) * 0.024;
    case "downpour":
      return (Math.random() * 2 - 1) * 0.12 + Math.sin(t * 17) * 0.05;
    case "splashes":
      return Math.random() < 0.012 ? white * 0.95 : Math.sin(t * 13) * 0.012;
    case "rumble":
      return Math.sin(t * 9) * 0.18 + Math.sin(t * 4.3) * 0.12;
    case "crackle":
      return Math.random() < 0.035 ? white * 0.88 : 0;
    case "wind":
      return Math.sin(t * 3.7) * 0.12 + Math.sin(t * 0.9) * 0.06;
    case "gusts":
      return Math.sin(t * 2.2) * 0.2 + Math.sin(t * 0.47) * 0.12;
    case "leaves":
      return (Math.random() < 0.024 ? white * 0.3 : 0) + Math.sin(t * 22) * 0.035;
    case "crowd":
      return Math.sin(t * 112) * 0.045 + Math.sin(t * 143) * 0.035 + (Math.random() < 0.008 ? white * 0.22 : 0);
    case "voice":
      return Math.sin(t * 180) * 0.052 + Math.sin(t * 260) * 0.03 + (Math.random() < 0.006 ? white * 0.28 : 0);
    default:
      return 0;
  }
}

function clampSample(value) {
  return Math.max(-1, Math.min(1, value));
}
