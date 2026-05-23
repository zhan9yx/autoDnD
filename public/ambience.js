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
  tension: { type: "lowpass", frequency: 180, q: 1.4 },
  foley: { type: "bandpass", frequency: 980, q: 1.05 }
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
    fadeAndStop(activeNodes);
    activeNodes = [
      ...buildMusicNodes(soundscape),
      ...soundscape.layers.flatMap((layer, index) => buildLayerNodes(layer, soundscape, index))
    ];
    currentSoundscapeId = soundscape.id;
  }

  function retuneGraph(soundscape) {
    for (const item of activeNodes) {
      const nextGain = item.kind === "music"
        ? soundscape.intensity * 0.26
        : (item.layerGain ?? 0.4) * (0.65 + soundscape.intensity * 0.45);
      item.gain?.gain.setTargetAtTime(clampVolume(nextGain), context.currentTime, 0.7);
    }
  }

  function buildMusicNodes(soundscape) {
    const mood = MUSIC_MOODS[soundscape.musicCue?.mood] || MUSIC_MOODS.mystery;
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(musicGain);
    gain.gain.setTargetAtTime(clampVolume(soundscape.intensity * 0.28), context.currentTime, 1.1);

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

  function buildLayerNodes(layer, soundscape, index) {
    const nodes = [];
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const settings = TYPE_FILTERS[layer.type] || TYPE_FILTERS.foley;
    filter.type = settings.type;
    filter.frequency.value = settings.frequency + index * 37;
    filter.Q.value = settings.q;
    filter.connect(gain);
    gain.connect(ambienceGain);
    gain.gain.value = 0;
    const layerGain = clampVolume(layer.gain * (0.65 + soundscape.intensity * 0.45));
    gain.gain.setTargetAtTime(layerGain, context.currentTime, 0.8);

    const noise = context.createBufferSource();
    noise.buffer = createNoiseBuffer(layer.type, 2.4 + index * 0.11);
    noise.loop = true;
    noise.playbackRate.value = playbackRateFor(layer.type);
    noise.connect(filter);
    noise.start();
    nodes.push({ source: noise, gain, layerGain, kind: layer.type });

    if (layer.type === "nature" || layer.type === "urban" || layer.type === "tension") {
      const pulse = context.createOscillator();
      pulse.type = layer.type === "tension" ? "sawtooth" : "sine";
      pulse.frequency.value = layer.type === "nature" ? 310 + index * 21 : layer.type === "urban" ? 110 + index * 13 : 36 + index * 4;
      pulse.connect(filter);
      pulse.start();
      nodes.push({ source: pulse, gain, layerGain: layerGain * 0.3, kind: layer.type });
    }

    return nodes;
  }

  function createNoiseBuffer(type, seconds) {
    const sampleRate = context.sampleRate;
    const frameCount = Math.max(1, Math.floor(sampleRate * seconds));
    const buffer = context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    let held = 0;
    for (let i = 0; i < frameCount; i += 1) {
      const white = Math.random() * 2 - 1;
      if (i % cadenceFor(type) === 0) held = white;
      data[i] = type === "fire" ? held * (Math.random() > 0.985 ? 1 : 0.22) : held * 0.72 + white * 0.28;
    }
    return buffer;
  }

  function applyVolumes() {
    if (!context || !masterGain) return;
    masterGain.gain.setTargetAtTime(volumes.master, context.currentTime, 0.2);
    musicGain.gain.setTargetAtTime(volumes.music, context.currentTime, 0.2);
    ambienceGain.gain.setTargetAtTime(volumes.ambience, context.currentTime, 0.2);
  }

  function fadeAndStop(nodes) {
    if (!context) return;
    const stopAt = context.currentTime + 0.45;
    for (const node of nodes) {
      try {
        node.gain?.gain.setTargetAtTime(0, context.currentTime, 0.18);
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

function cadenceFor(type) {
  if (type === "rain" || type === "weather") return 3;
  if (type === "water") return 12;
  if (type === "fire") return 19;
  if (type === "urban") return 31;
  if (type === "tension") return 55;
  return 23;
}

function playbackRateFor(type) {
  if (type === "water") return 0.74;
  if (type === "fire") return 1.35;
  if (type === "nature") return 0.92;
  if (type === "urban") return 0.66;
  return 1;
}
