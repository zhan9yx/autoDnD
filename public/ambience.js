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
  "rain.light": profile({ frequency: 1700, q: 0.65, cadence: 4, playbackRate: 1.08 }),
  "rain.heavy": profile({ frequency: 940, q: 0.72, cadence: 2, playbackRate: 1.18, burst: 0.18 }),
  "thunder.distant": profile({ type: "lowpass", frequency: 150, q: 1.5, cadence: 74, playbackRate: 0.55, pulse: { frequency: 33, type: "sine", gain: 0.26 } }),
  "thunder.close": profile({ type: "lowpass", frequency: 115, q: 1.8, cadence: 48, playbackRate: 0.48, burst: 0.34, pulse: { frequency: 42, type: "sawtooth", gain: 0.34 } }),
  "wind.light": profile({ frequency: 880, q: 0.55, cadence: 19, playbackRate: 0.74, pulse: { frequency: 0.18, type: "sine", gain: 0.12 } }),
  "wind.gale": profile({ frequency: 620, q: 0.7, cadence: 9, playbackRate: 0.88, burst: 0.2, pulse: { frequency: 0.45, type: "sawtooth", gain: 0.18 } }),
  "water.drips": profile({ frequency: 1200, q: 0.9, cadence: 22, playbackRate: 0.7 }),
  "water.pond-lap": profile({ frequency: 520, q: 0.65, cadence: 16, playbackRate: 0.62, pulse: { frequency: 0.8, type: "sine", gain: 0.12 } }),
  "water.bubbles": profile({ frequency: 740, q: 0.8, cadence: 11, playbackRate: 0.82 }),
  "waterfall.roar": profile({ type: "lowpass", frequency: 760, q: 0.52, cadence: 3, playbackRate: 0.96, burst: 0.12 }),
  "mist.spray": profile({ frequency: 2600, q: 0.5, cadence: 5, playbackRate: 1.04 }),
  "fire.crackle": profile({ frequency: 2400, q: 1.15, cadence: 19, playbackRate: 1.28, burst: 0.22 }),
  "fire.pops": profile({ frequency: 3200, q: 1.4, cadence: 28, playbackRate: 1.42, burst: 0.35 }),
  "fire.hearth": profile({ frequency: 1800, q: 0.85, cadence: 24, playbackRate: 1.05 }),
  "fire.candle": profile({ frequency: 2200, q: 1.0, cadence: 32, playbackRate: 0.98 }),
  "nature.forest-leaves": profile({ frequency: 3400, q: 0.82, cadence: 14, playbackRate: 0.9, pulse: { frequency: 0.32, type: "sine", gain: 0.1 } }),
  "nature.branches": profile({ frequency: 1450, q: 1.05, cadence: 34, playbackRate: 0.72 }),
  "nature.reeds": profile({ frequency: 2500, q: 0.7, cadence: 18, playbackRate: 0.8 }),
  "insects.crickets": profile({ frequency: 4200, q: 1.2, cadence: 7, playbackRate: 1.22, pulse: { frequency: 310, type: "sine", gain: 0.16 } }),
  "insects.cicadas": profile({ frequency: 5100, q: 0.9, cadence: 5, playbackRate: 1.05, pulse: { frequency: 420, type: "triangle", gain: 0.14 } }),
  "urban.cart-wheels": profile({ frequency: 720, q: 0.75, cadence: 27, playbackRate: 0.76 }),
  "urban.bells": profile({ frequency: 1600, q: 1.4, cadence: 54, playbackRate: 0.86, pulse: { frequency: 220, type: "sine", gain: 0.12 } }),
  "crowd.market-murmur": profile({ frequency: 840, q: 0.75, cadence: 21, playbackRate: 0.68, pulse: { frequency: 105, type: "sine", gain: 0.11 } }),
  "crowd.tavern-murmur": profile({ frequency: 690, q: 0.72, cadence: 24, playbackRate: 0.64, pulse: { frequency: 96, type: "sine", gain: 0.1 } }),
  "crowd.cheers": profile({ frequency: 1100, q: 0.95, cadence: 13, playbackRate: 0.92, burst: 0.18, pulse: { frequency: 160, type: "triangle", gain: 0.14 } }),
  "crowd.applause": profile({ frequency: 1800, q: 1.1, cadence: 6, playbackRate: 1.18, burst: 0.2 }),
  "voice.shouting": profile({ frequency: 1450, q: 1.2, cadence: 16, playbackRate: 0.86, burst: 0.14, pulse: { frequency: 140, type: "sawtooth", gain: 0.12 } }),
  "voice.heckles": profile({ frequency: 1250, q: 1.05, cadence: 23, playbackRate: 0.82 }),
  "voice.whispers": profile({ frequency: 2100, q: 1.45, cadence: 36, playbackRate: 0.58, pulse: { frequency: 82, type: "sine", gain: 0.08 } }),
  "voice.song": profile({ frequency: 980, q: 1.05, cadence: 26, playbackRate: 0.72, pulse: { frequency: 196, type: "sine", gain: 0.18 } }),
  "tension.bowed-metal": profile({ type: "lowpass", frequency: 210, q: 1.5, cadence: 55, playbackRate: 0.62, pulse: { frequency: 37, type: "sawtooth", gain: 0.2 } })
});

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
    const fade = transitionSeconds(soundscape, 0.9);
    fadeAndStop(activeNodes, fade);
    activeNodes = [
      ...buildMusicNodes(soundscape, fade),
      ...soundscape.layers.flatMap((layer, index) => buildLayerNodes(layer, soundscape, index, fade))
    ];
    currentSoundscapeId = soundscape.id;
  }

  function retuneGraph(soundscape) {
    for (const item of activeNodes) {
      const nextGain = item.kind === "music"
        ? soundscape.intensity * 0.26
        : (item.layerBaseGain ?? item.layerGain ?? 0.4) * (0.65 + soundscape.intensity * 0.45);
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
      pulse.type = pulseSettings.type || (layer.type === "tension" ? "sawtooth" : "sine");
      pulse.frequency.value = pulseSettings.frequency ?? defaultPulseFrequency(layer.type, index);
      pulse.connect(filter);
      pulse.start();
      nodes.push({ source: pulse, gain, layerGain: layerGain * (pulseSettings.gain ?? 0.3), layerBaseGain, kind: layer.type, profile: layer.profile });
    }

    return nodes;
  }

  function createNoiseBuffer(settings, seconds) {
    const sampleRate = context.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * seconds));
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    let held = 0;
    for (let i = 0; i < frameCount; i += 1) {
      const white = Math.random() * 2 - 1;
      if (i % settings.cadence === 0) held = white;
      const burst = settings.burst && Math.random() > 1 - settings.burst * 0.08 ? white : 0;
      data[i] = held * settings.holdMix + white * (1 - settings.holdMix) + burst * settings.burst;
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
    onStateChange?.({ enabled, volumes: { ...volumes }, currentSoundscapeId });
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
