import test from "node:test";
import assert from "node:assert/strict";
import { canUseAudio, createAmbienceEngine, sanitizeSoundscape } from "../public/ambience.js";

test("ambience engine starts, retunes matching ids, replaces changed ids, stops, and clamps volumes", async () => {
  const { AudioContext, localStorage, restore } = installBrowserAudioMock({
    "aidm.ambience.volumes": JSON.stringify({ master: 0.5 })
  });
  try {
    const states = [];
    const engine = createAmbienceEngine({ onStateChange: (state) => states.push(state) });

    assert.equal(canUseAudio(), true);
    assert.deepEqual(engine.volumes, { master: 0.5, music: 0.42, ambience: 0.72 });

    const first = soundscape({ id: "rain-pass", intensity: 0.42 });
    assert.equal(await engine.start(first), true);

    const context = AudioContext.instances[0];
    const initialSources = [...context.sources];
    const gainTargetCounts = context.gains.map((gain) => gain.gain.targets.length);

    assert.equal(context.resumeCount, 1);
    assert.equal(engine.enabled, true);
    assert.equal(engine.currentSoundscapeId, "rain-pass");
    assert.equal(initialSources.every((source) => source.started), true);
    const lastState = states.at(-1);
    assert.equal(lastState.enabled, true);
    assert.deepEqual(lastState.volumes, { master: 0.5, music: 0.42, ambience: 0.72 });
    assert.equal(lastState.currentSoundscapeId, "rain-pass");
    assert.deepEqual(lastState.safetyReasons, []);
    if ("backgroundPaused" in lastState) assert.equal(lastState.backgroundPaused, false);

    engine.setVolumes({ master: 1.8, music: -0.25, ambience: Number.NaN });
    assert.deepEqual(engine.volumes, { master: 1, music: 0, ambience: 0 });
    assert.deepEqual(JSON.parse(localStorage.getItem("aidm.ambience.volumes")), {
      master: 1,
      music: 0,
      ambience: 0
    });
    assert.equal(context.gains[0].gain.value, 1);
    assert.equal(context.gains[1].gain.value, 0);
    assert.equal(context.gains[2].gain.value, 0);

    engine.update(soundscape({ id: "rain-pass", intensity: 0.9 }));
    assert.equal(context.sources.length, initialSources.length);
    assert.equal(initialSources.some((source) => source.stopCalls.length > 0), false);
    assert.equal(
      context.gains.some((gain, index) => gain.gain.targets.length > gainTargetCounts[index]),
      true
    );

    engine.update(soundscape({
      id: "market-shift",
      category: "urban",
      intensity: 0.65,
      layers: [{ type: "urban", gain: 0.74 }],
      musicCue: { mood: "busy" }
    }));
    const replacementSources = context.sources.slice(initialSources.length);

    assert.equal(engine.currentSoundscapeId, "market-shift");
    assert.equal(initialSources.every((source) => source.stopCalls.length === 1), true);
    assert.equal(replacementSources.length > 0, true);
    assert.equal(replacementSources.every((source) => source.started), true);

    engine.stop();
    assert.equal(engine.enabled, false);
    assert.equal(engine.currentSoundscapeId, "");
    assert.equal(replacementSources.every((source) => source.stopCalls.length === 1), true);
    assert.deepEqual(states.at(-1), {
      enabled: false,
      volumes: { master: 1, music: 0, ambience: 0 },
      currentSoundscapeId: "",
      safetyReasons: []
    });
  } finally {
    restore();
  }
});

test("ambience engine sanitizes malformed soundscapes and reports safety reasons", async () => {
  const { AudioContext, restore } = installBrowserAudioMock();
  try {
    const states = [];
    const engine = createAmbienceEngine({ onStateChange: (state) => states.push(state) });

    assert.deepEqual(sanitizeSoundscape({ id: "broken", intensity: 9, layers: [] }).safetyReasons, ["fallback-empty-soundscape"]);

    assert.equal(await engine.start({
      id: "broken",
      intensity: 8,
      profile: { guards: ["scene-bed-mismatch:forest"] },
      layers: [
        { type: "bogus", gain: 3 },
        { type: "weather", profile: "rain.light", gain: 2 },
        { type: "voice", profile: "voice.whispers", gain: 0.4 },
        { type: "nature", profile: "nature.forest-leaves", gain: 0.5 },
        { type: "fire", profile: "fire.crackle", gain: 0.5 },
        { type: "urban", profile: "urban.bells", gain: 0.5 },
        { type: "crowd", profile: "crowd.cheers", gain: 0.5 },
        { type: "tension", profile: "tension.bowed-metal", gain: 0.5 },
        { type: "water", profile: "rain.eaves", gain: 0.5 },
        { type: "water", profile: "rain.puddles", gain: 0.5 },
        { type: "voice", profile: "voice.market-hawkers", gain: 0.5 },
        { type: "voice", profile: "voice.tavern-table", gain: 0.5 }
      ],
      musicCue: { mood: "mystery" }
    }), true);

    const context = AudioContext.instances[0];

    assert.equal(engine.currentSoundscapeId, "broken");
    assert.equal(context.filters.length, 10);
    assert.equal(states.at(-1).safetyReasons.includes("scene-bed-mismatch:forest"), true);
    assert.equal(states.at(-1).safetyReasons.includes("dropped-invalid-layer-0"), true);
    assert.equal(states.at(-1).safetyReasons.includes("limited-layer-count"), true);
  } finally {
    restore();
  }
});

test("ambience engine applies layer profiles and transition timing", async () => {
  const { AudioContext, restore } = installBrowserAudioMock();
  try {
    const states = [];
    const engine = createAmbienceEngine({ onStateChange: (state) => states.push(state) });
    const storm = soundscape({
      id: "storm",
      category: "weather",
      intensity: 0.8,
      transition: { style: "weather-swell", durationMs: 2400 },
      layers: [
        { type: "weather", profile: "rain.heavy", gain: 0.82 },
        { type: "weather", profile: "thunder.close", gain: 0.74 },
        { type: "voice", profile: "voice.whispers", gain: 0.4 }
      ],
      musicCue: { mood: "suspense", transition: "weather-swell", crossfadeMs: 2400 }
    });

    assert.equal(await engine.start(storm), true);

    const context = AudioContext.instances[0];
    const initialSources = [...context.sources];
    const bufferSources = context.sources.filter((source) => "playbackRate" in source);

    assert.equal(context.filters[0].frequency.value, 940);
    assert.equal(context.filters[1].type, "lowpass");
    assert.equal(context.filters[1].frequency.value, 152);
    assert.equal(context.filters[2].frequency.value, 2174);
    assert.deepEqual(bufferSources.slice(0, 3).map((source) => source.playbackRate.value), [1.18, 0.48, 0.58]);
    assert.equal(context.sources.some((source) => source.frequency?.value === 42), true);
    assert.equal(
      context.gains.some((gain) => gain.gain.targets.some((target) => target.timeConstant > 0.79 && target.timeConstant < 0.81)),
      true
    );

    engine.update(soundscape({
      id: "cheer",
      category: "crowd",
      intensity: 0.55,
      transition: { style: "medium-crossfade", durationMs: 3000 },
      layers: [
        { type: "crowd", profile: "crowd.cheers", gain: 0.72 },
        { type: "foley", profile: "foley.glass-toast", gain: 0.46 },
        { type: "voice", profile: "voice.chant", gain: 0.36 }
      ],
      musicCue: { mood: "busy", transition: "medium-crossfade", crossfadeMs: 3000 }
    }));

    assert.equal(engine.currentSoundscapeId, "cheer");
    assert.equal(initialSources.every((source) => source.stopCalls.length === 1), true);
    assert.equal(initialSources.every((source) => source.stopCalls[0] === 13), true);
    assert.equal(states.at(-1).currentSoundscapeId, "cheer");
    assert.equal(context.filters.at(-3).frequency.value, 1100);
    assert.equal(context.filters.at(-2).frequency.value, 2637);
    assert.equal(context.filters.at(-1).frequency.value, 914);
  } finally {
    restore();
  }
});

test("ambience engine gives indoor, archive, tavern, and clear-day layers distinct profiles", async () => {
  const { AudioContext, restore } = installBrowserAudioMock();
  try {
    const engine = createAmbienceEngine();
    const indoor = soundscape({
      id: "interior",
      category: "interior",
      intensity: 0.34,
      layers: [
        { type: "urban", profile: "urban.quiet-interior", gain: 0.3 },
        { type: "foley", profile: "foley.floor-creak", gain: 0.2 },
        { type: "foley", profile: "foley.cups-plates", gain: 0.25 },
        { type: "weather", profile: "weather.clear-day", gain: 0.18 },
        { type: "foley", profile: "foley.archive-pages", gain: 0.22 }
      ],
      musicCue: { mood: "quiet" }
    });

    assert.equal(await engine.start(indoor), true);

    const context = AudioContext.instances[0];
    const bufferSources = context.sources.filter((source) => "playbackRate" in source);

    assert.equal(context.filters[0].type, "lowpass");
    assert.equal(context.filters[0].frequency.value, 420);
    assert.equal(context.filters[1].frequency.value, 757);
    assert.equal(context.filters[2].frequency.value, 1924);
    assert.equal(context.filters[3].frequency.value, 3311);
    assert.equal(context.filters[4].frequency.value, 2598);
    assert.deepEqual(bufferSources.slice(0, 5).map((source) => source.playbackRate.value), [0.48, 0.52, 1.16, 0.86, 0.94]);
  } finally {
    restore();
  }
});

test("ambience engine applies seasonal synthetic layer profiles", async () => {
  const { AudioContext, restore } = installBrowserAudioMock();
  try {
    const engine = createAmbienceEngine();
    const seasonal = soundscape({
      id: "winter-autumn",
      category: "weather",
      intensity: 0.46,
      layers: [
        { type: "weather", profile: "weather.frost-air", gain: 0.22 },
        { type: "weather", profile: "weather.snow-hush", gain: 0.3 },
        { type: "foley", profile: "foley.dry-leaves", gain: 0.28 },
        { type: "nature", profile: "nature.spring-birds", gain: 0.24 }
      ],
      musicCue: { mood: "quiet" }
    });

    assert.equal(await engine.start(seasonal), true);

    const context = AudioContext.instances[0];
    const bufferSources = context.sources.filter((source) => "playbackRate" in source);

    assert.equal(context.filters[0].type, "bandpass");
    assert.equal(context.filters[0].frequency.value, 1120);
    assert.equal(context.filters[1].type, "lowpass");
    assert.equal(context.filters[1].frequency.value, 397);
    assert.equal(context.filters[2].frequency.value, 3174);
    assert.equal(context.filters[3].frequency.value, 4311);
    assert.deepEqual(bufferSources.slice(0, 4).map((source) => source.playbackRate.value), [0.5, 0.42, 0.92, 1.2]);
  } finally {
    restore();
  }
});

test("ambience engine synthesizes distinct natural weather and crowd textures locally", async () => {
  const { AudioContext, restore } = installBrowserAudioMock();
  try {
    const engine = createAmbienceEngine();
    const natural = soundscape({
      id: "natural-variety",
      category: "weather",
      intensity: 0.62,
      layers: [
        { type: "weather", profile: "rain.drizzle", gain: 0.36 },
        { type: "weather", profile: "rain.downpour", gain: 0.76 },
        { type: "weather", profile: "lightning.crackle", gain: 0.26 },
        { type: "weather", profile: "wind.gusts", gain: 0.42 },
        { type: "crowd", profile: "crowd.babble", gain: 0.48 },
        { type: "voice", profile: "voice.market-calls", gain: 0.34 },
        { type: "water", profile: "rain.eaves", gain: 0.3 },
        { type: "water", profile: "rain.puddles", gain: 0.24 },
        { type: "voice", profile: "voice.market-hawkers", gain: 0.26 },
        { type: "voice", profile: "voice.tavern-table", gain: 0.24 }
      ],
      musicCue: { mood: "busy" }
    });

    assert.equal(await engine.start(natural), true);

    const context = AudioContext.instances[0];
    const bufferSources = context.sources.filter((source) => "playbackRate" in source);
    const oscillatorFrequencies = context.sources
      .filter((source) => source.frequency)
      .map((source) => source.frequency.value);
    const extraGainValues = context.gains.slice(3).map((gain) => gain.gain.value);

    assert.equal(context.filters[0].frequency.value, 2450);
    assert.equal(context.filters[1].type, "lowpass");
    assert.equal(context.filters[1].frequency.value, 797);
    assert.equal(context.filters[2].frequency.value, 3274);
    assert.equal(context.filters[3].type, "lowpass");
    assert.equal(context.filters[3].frequency.value, 651);
    assert.equal(context.filters[4].frequency.value, 1028);
    assert.equal(context.filters[5].frequency.value, 1635);
    assert.equal(context.filters[6].frequency.value, 1202);
    assert.equal(context.filters[7].frequency.value, 1619);
    assert.equal(context.filters[8].frequency.value, 1976);
    assert.equal(context.filters[9].frequency.value, 1253);
    assert.deepEqual(bufferSources.slice(0, 10).map((source) => source.playbackRate.value), [1.02, 1.24, 1.35, 0.82, 0.67, 0.84, 0.78, 0.72, 0.9, 0.66]);
    assert.equal(oscillatorFrequencies.includes(0.18), true);
    assert.equal(oscillatorFrequencies.includes(0.11), true);
    assert.equal(oscillatorFrequencies.includes(0.09), true);
    assert.equal(oscillatorFrequencies.includes(0.23), true);
    assert.equal(oscillatorFrequencies.includes(0.31), true);
    assert.equal(oscillatorFrequencies.includes(190), true);
    assert.equal(oscillatorFrequencies.includes(760), true);
    assert.equal(oscillatorFrequencies.includes(1320), true);
    assert.equal(oscillatorFrequencies.includes(220), true);
    assert.equal(oscillatorFrequencies.includes(840), true);
    assert.equal(oscillatorFrequencies.includes(1480), true);
    assert.equal(oscillatorFrequencies.includes(135), true);
    assert.equal(oscillatorFrequencies.includes(560), true);
    assert.equal(oscillatorFrequencies.includes(1040), true);
    assert.equal(extraGainValues.includes(0.018), true);
    assert.equal(extraGainValues.includes(0.035), true);
    assert.equal(extraGainValues.includes(0.04), true);
    assert.equal(extraGainValues.includes(0.025), true);
    assert.equal(extraGainValues.includes(0.02), true);
    assert.equal(extraGainValues.includes(0.045), true);
    assert.equal(extraGainValues.includes(0.034), true);
    assert.equal(extraGainValues.includes(0.024), true);
    assert.equal(extraGainValues.includes(0.05), true);
    assert.equal(extraGainValues.includes(0.038), true);
    assert.equal(extraGainValues.includes(0.026), true);
    assert.equal(extraGainValues.includes(0.036), true);
    assert.equal(extraGainValues.includes(0.028), true);
  } finally {
    restore();
  }
});

function soundscape(overrides = {}) {
  return {
    id: "rain-pass",
    category: "mystery",
    intensity: 0.5,
    musicCue: { mood: "mystery" },
    transition: { style: "slow-crossfade", durationMs: 900 },
    layers: [
      { type: "weather", gain: 0.62 },
      { type: "nature", gain: 0.4 }
    ],
    ...overrides
  };
}

function installBrowserAudioMock(initialStorage = {}) {
  const previousWindow = globalThis.window;
  const previousLocalStorage = globalThis.localStorage;
  const localStorage = createMockStorage(initialStorage);

  class MockAudioContext {
    static instances = [];

    constructor() {
      this.currentTime = 10;
      this.sampleRate = 64;
      this.destination = { id: "destination" };
      this.resumeCount = 0;
      this.gains = [];
      this.filters = [];
      this.sources = [];
      this.buffers = [];
      MockAudioContext.instances.push(this);
    }

    async resume() {
      this.resumeCount += 1;
    }

    createGain() {
      const gain = new MockGain(this);
      this.gains.push(gain);
      return gain;
    }

    createOscillator() {
      const oscillator = new MockOscillator(this);
      this.sources.push(oscillator);
      return oscillator;
    }

    createBiquadFilter() {
      const filter = new MockBiquadFilter(this);
      this.filters.push(filter);
      return filter;
    }

    createBufferSource() {
      const source = new MockBufferSource(this);
      this.sources.push(source);
      return source;
    }

    createBuffer(channelCount, frameCount, sampleRate) {
      const buffer = new MockAudioBuffer(channelCount, frameCount, sampleRate);
      this.buffers.push(buffer);
      return buffer;
    }
  }

  globalThis.window = { AudioContext: MockAudioContext };
  globalThis.localStorage = localStorage;

  return {
    AudioContext: MockAudioContext,
    localStorage,
    restore() {
      restoreGlobal("window", previousWindow);
      restoreGlobal("localStorage", previousLocalStorage);
    }
  };
}

function createMockStorage(initialStorage) {
  const store = new Map(Object.entries(initialStorage));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    }
  };
}

function restoreGlobal(name, value) {
  if (value === undefined) {
    delete globalThis[name];
  } else {
    globalThis[name] = value;
  }
}

class MockAudioParam {
  constructor(value = 0) {
    this.value = value;
    this.targets = [];
  }

  setTargetAtTime(value, time, timeConstant) {
    this.value = value;
    this.targets.push({ value, time, timeConstant });
  }
}

class MockNode {
  constructor(context) {
    this.context = context;
    this.connections = [];
  }

  connect(target) {
    this.connections.push(target);
    return target;
  }
}

class MockGain extends MockNode {
  constructor(context) {
    super(context);
    this.gain = new MockAudioParam(1);
  }
}

class MockBiquadFilter extends MockNode {
  constructor(context) {
    super(context);
    this.type = "lowpass";
    this.frequency = { value: 0 };
    this.Q = { value: 0 };
  }
}

class MockOscillator extends MockNode {
  constructor(context) {
    super(context);
    this.type = "sine";
    this.frequency = { value: 0 };
    this.detune = { value: 0 };
    this.started = false;
    this.stopCalls = [];
  }

  start() {
    this.started = true;
  }

  stop(when) {
    this.stopCalls.push(when);
  }
}

class MockBufferSource extends MockNode {
  constructor(context) {
    super(context);
    this.buffer = null;
    this.loop = false;
    this.playbackRate = { value: 1 };
    this.started = false;
    this.stopCalls = [];
  }

  start() {
    this.started = true;
  }

  stop(when) {
    this.stopCalls.push(when);
  }
}

class MockAudioBuffer {
  constructor(channelCount, frameCount, sampleRate) {
    this.channelCount = channelCount;
    this.frameCount = frameCount;
    this.sampleRate = sampleRate;
    this.channels = Array.from({ length: channelCount }, () => new Float32Array(frameCount));
  }

  getChannelData(index) {
    return this.channels[index];
  }
}
