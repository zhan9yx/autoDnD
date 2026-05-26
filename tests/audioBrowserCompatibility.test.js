import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canUseAudio, createAmbienceEngine } from "../public/ambience.js";
import {
  buildUtterancePlan,
  selectVoice,
  TTS_PROVIDER_CATALOG
} from "../public/tts.js";

test("0013 audio compatibility keeps ambience opt-in and muteable under autoplay rules", async () => {
  const [html, app] = await Promise.all([
    readFile("public/index.html", "utf8"),
    readFile("public/app.js", "utf8")
  ]);

  assert.match(html, /id="audioStatusDock"/);
  assert.match(html, /id="ambienceToggle"[\s\S]*id="ambienceStop"[\s\S]*id="ambienceMaster"[\s\S]*id="ambienceMusic"[\s\S]*id="ambienceEnvironment"/);
  assert.match(app, /function bindAmbienceControls\(\)[\s\S]*if \(!canUseAudio\(\)\) \{[\s\S]*els\.ambienceToggle\.disabled = true[\s\S]*ambience\.unsupported/);
  assert.match(app, /els\.ambienceToggle\.addEventListener\("click", async \(\) => \{[\s\S]*await ambienceEngine\.start\(room\?\.soundscape\)/);
  assert.match(app, /els\.ambienceStop\.addEventListener\("click", \(\) => \{[\s\S]*ambienceEngine\.stop\(\)/);
  assert.match(app, /ambienceEngine\.setVolumes\(\{[\s\S]*master: Number\(els\.ambienceMaster\.value\)[\s\S]*music: Number\(els\.ambienceMusic\.value\)[\s\S]*ambience: Number\(els\.ambienceEnvironment\.value\)/);
  assert.match(app, /data-audio-enabled", String\(Boolean\(canUseAudio\(\) && ambienceEngine\.enabled\)\)/);
});

test("0013 ambience engine does not start without browser audio and resumes only after start", async () => {
  const previousWindow = globalThis.window;
  const previousLocalStorage = globalThis.localStorage;

  try {
    delete globalThis.window;
    globalThis.localStorage = createMockStorage();
    assert.equal(canUseAudio(), false);
    assert.equal(await createAmbienceEngine().start(soundscape()), false);

    const { AudioContext, localStorage } = installBrowserAudioMock({
      "aidm.ambience.volumes": JSON.stringify({ master: 0, music: 0.25, ambience: 0.5 })
    });
    const states = [];
    const engine = createAmbienceEngine({ onStateChange: (state) => states.push(state) });

    assert.equal(engine.enabled, false);
    assert.deepEqual(engine.volumes, { master: 0, music: 0.25, ambience: 0.5 });
    assert.equal(AudioContext.instances.length, 0);

    assert.equal(await engine.start(soundscape({ id: "autoplay-safe-start" })), true);
    assert.equal(AudioContext.instances.length, 1);
    assert.equal(AudioContext.instances[0].resumeCount, 1);
    assert.equal(engine.enabled, true);
    assert.equal(engine.currentSoundscapeId, "autoplay-safe-start");

    engine.setVolumes({ master: 0, music: 0, ambience: 0 });
    assert.deepEqual(JSON.parse(localStorage.getItem("aidm.ambience.volumes")), {
      master: 0,
      music: 0,
      ambience: 0
    });
    assert.equal(states.at(-1).enabled, true);

    engine.stop();
    assert.equal(engine.enabled, false);
    assert.equal(states.at(-1).enabled, false);
  } finally {
    restoreGlobal("window", previousWindow);
    restoreGlobal("localStorage", previousLocalStorage);
  }
});

test("0013 speech synthesis fallback tolerates delayed or missing browser voices", async () => {
  const app = await readFile("public/app.js", "utf8");
  const provider = TTS_PROVIDER_CATALOG.find((entry) => entry.id === "browser-speech-synthesis");
  const zhPlan = buildUtterancePlan({ author: "AIDM", text: "雨声靠近。", language: "zh" });

  assert.equal(provider?.default, true);
  assert.equal(provider?.runtime, "client");
  assert.equal(provider?.local, true);
  assert.equal(selectVoice([], zhPlan), null);

  assert.match(app, /function bindVoiceControls\(\)[\s\S]*if \(!els\.voiceToggle \|\| !supportsSpeech\(\)\) \{[\s\S]*voice\.unsupported/);
  assert.match(app, /window\.speechSynthesis\.addEventListener\("voiceschanged", refreshVoices\)/);
  assert.match(app, /window\.speechSynthesis\.onvoiceschanged = refreshVoices/);
  assert.match(app, /speechState\.voices = window\.speechSynthesis\.getVoices\(\)/);
  assert.match(app, /for \(const group of voiceProfileGroupsForMenu\(listVoiceProfiles\(uiLanguage\)\)\)/);
  assert.match(app, /const visibleVoices = compactBrowserVoiceOptions\(matching\.length > 0 \? matching : speechState\.voices, selected\)/);
  assert.match(app, /const utterance = new SpeechSynthesisUtterance\(chunk\)[\s\S]*const voice = selectVoice\(speechState\.voices, plan, selection\.browserVoiceName\)[\s\S]*if \(voice\) utterance\.voice = voice[\s\S]*utterance\.lang = voice\?\.lang \|\| plan\.language/);
});

test("0013 voice controls persist mute and tuning preferences locally", async () => {
  const app = await readFile("public/app.js", "utf8");

  assert.match(app, /let authMode = "login"/);
  assert.match(app, /enabled: localStorage\.getItem\("aidm\.voice\.enabled"\) === "true"/);
  assert.match(app, /selectedVoiceValue: localStorage\.getItem\("aidm\.voice\.selection"\)[\s\S]*legacyVoiceSelection\(localStorage\.getItem\("aidm\.voice\.name"\) \|\| ""\)/);
  assert.match(app, /rate: Number\(localStorage\.getItem\("aidm\.voice\.rate"\) \|\| 1\)/);
  assert.match(app, /pitch: Number\(localStorage\.getItem\("aidm\.voice\.pitch"\) \|\| 1\)/);
  assert.match(app, /localStorage\.setItem\("aidm\.voice\.enabled", String\(speechState\.enabled\)\)/);
  assert.match(app, /localStorage\.setItem\("aidm\.voice\.selection", speechState\.selectedVoiceValue\)/);
  assert.match(app, /localStorage\.setItem\("aidm\.voice\.rate", String\(speechState\.rate\)\)/);
  assert.match(app, /localStorage\.setItem\("aidm\.voice\.pitch", String\(speechState\.pitch\)\)/);
  assert.match(app, /function stopSpeech\(\)[\s\S]*window\.speechSynthesis\.cancel\(\)/);
});

function soundscape(overrides = {}) {
  return {
    id: "audio-compat",
    category: "weather",
    intensity: 0.45,
    musicCue: { mood: "quiet" },
    layers: [
      { type: "weather", profile: "rain.light", gain: 0.5 },
      { type: "voice", profile: "voice.whispers", gain: 0.25 }
    ],
    ...overrides
  };
}

function installBrowserAudioMock(initialStorage = {}) {
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

    createBuffer(channelCount, frameCount) {
      return {
        channelCount,
        frameCount,
        getChannelData() {
          return new Float32Array(frameCount);
        }
      };
    }
  }

  globalThis.window = { AudioContext: MockAudioContext };
  globalThis.localStorage = localStorage;

  return { AudioContext: MockAudioContext, localStorage };
}

function createMockStorage(initialStorage = {}) {
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
