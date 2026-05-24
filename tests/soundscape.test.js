import test from "node:test";
import assert from "node:assert/strict";
import { chooseSoundscape, listSoundscapePresets, scoreSoundscapeCandidates } from "../src/core/soundscape.js";

const fixedTime = "2026-01-02T03:04:05.000Z";

test("soundscape catalog covers weather, nature, water, fire, urban, and social ambience families", () => {
  const ids = listSoundscapePresets().map((preset) => preset.id);

  for (const id of [
    "light-rain",
    "heavy-rain",
    "thunderstorm",
    "light-wind",
    "gale-wind",
    "forest",
    "pond",
    "waterfall",
    "campfire",
    "insects",
    "market-city",
    "tavern",
    "cheering-crowd",
    "angry-shouts",
    "whispers",
    "singing",
    "combat-tension",
    "mystery",
    "calm-night"
  ]) {
    assert.equal(ids.includes(id), true, `${id} should be available`);
  }

  const tavern = listSoundscapePresets().find((preset) => preset.id === "tavern");
  assert.equal(tavern.layers.some((layer) => layer.profile === "foley.cups-plates"), true);
  assert.equal(Array.isArray(tavern.visualHints), true);
  assert.equal(Array.isArray(tavern.assetHints), true);
  assert.equal(tavern.transition.durationMs > 0, true);
});

test("weather variants distinguish drizzle, downpour, thunder, and wind", () => {
  const drizzle = chooseSoundscape(roomFor({
    location: "Archive steps",
    weather: "light rain",
    ambience: "Soft drizzle beads on wet stone."
  }));
  const downpour = chooseSoundscape(roomFor({
    location: "Archive steps",
    weather: "heavy rain",
    ambience: "A downpour hammers the slick street."
  }));
  const thunder = chooseSoundscape(roomFor({
    location: "Old bridge",
    weather: "thunder and lightning",
    ambience: "Storm thunder rolls over heavy rain."
  }));
  const gale = chooseSoundscape(roomFor({
    location: "Open pass",
    weather: "howling wind",
    ambience: "A gale tears across the ridge."
  }));

  assert.equal(drizzle.id, "light-rain");
  assert.equal(drizzle.layers.some((layer) => layer.profile === "rain.light"), true);
  assert.equal(drizzle.visualHints.includes("light-rain"), true);

  assert.equal(downpour.id, "heavy-rain");
  assert.equal(downpour.layers.some((layer) => layer.profile === "rain.heavy"), true);
  assert.equal(downpour.intensity > drizzle.intensity, true);

  assert.equal(thunder.id, "thunderstorm");
  assert.equal(thunder.layers.some((layer) => layer.profile === "thunder.close"), true);
  assert.equal(thunder.transition.style, "weather-swell");
  assert.equal(thunder.musicCue.transition, thunder.transition.style);

  assert.equal(gale.id, "gale-wind");
  assert.equal(gale.layers.some((layer) => layer.profile === "wind.gale"), true);
});

test("location beds can compose weather layers without losing the place identity", () => {
  const forestRain = chooseSoundscape(roomFor({
    location: "Mosswood forest under a pine canopy",
    weather: "light rain",
    ambience: "Leaves move above the trail while drizzle falls."
  }));
  const tavernSong = chooseSoundscape(roomFor({
    location: "Crowded tavern common room",
    ambience: "Cups, plates, singing, and cheers fill the room."
  }));

  assert.equal(forestRain.id, "forest");
  assert.equal(forestRain.profile.location.includes("forest"), true);
  assert.equal(forestRain.profile.weather.includes("light-rain"), true);
  assert.equal(forestRain.layers.some((layer) => layer.profile === "nature.forest-leaves"), true);
  assert.equal(forestRain.layers.some((layer) => layer.profile === "rain.light"), true);
  assert.equal(forestRain.assetHints.includes("location:forest"), true);
  assert.equal(forestRain.assetHints.includes("weather:light-rain"), true);

  assert.equal(tavernSong.id, "tavern");
  assert.equal(tavernSong.layers.some((layer) => layer.profile === "foley.cups-plates"), true);
  assert.equal(tavernSong.layers.some((layer) => layer.profile === "voice.song"), true);
});

test("social mood profiles cover cheers, angry shouts, whispers, and singing", () => {
  const cheering = chooseSoundscape(roomFor({
    location: "Festival courtyard",
    mood: "cheerful",
    ambience: "Cheering and applause roll across the square."
  }));
  const angry = chooseSoundscape(roomFor({
    location: "Stone courtyard",
    mood: "angry",
    ambience: "Shouting, heckles, and curses rise from the crowd.",
    beat: "complication",
    threatClock: 2
  }));
  const whispers = chooseSoundscape(roomFor({
    location: "Curtained back room",
    mood: "secretive",
    ambience: "Low whispers move behind the screen."
  }));
  const singing = chooseSoundscape(roomFor({
    location: "Quiet hall",
    mood: "singing",
    ambience: "A distant song and soft chant drift through the arch."
  }));

  assert.equal(cheering.id, "cheering-crowd");
  assert.equal(cheering.layers.some((layer) => layer.profile === "crowd.cheers"), true);

  assert.equal(angry.id, "angry-shouts");
  assert.equal(angry.layers.some((layer) => layer.profile === "voice.shouting"), true);
  assert.equal(angry.transition.style, "fast-crossfade");

  assert.equal(whispers.id, "whispers");
  assert.equal(whispers.layers.some((layer) => layer.profile === "voice.whispers"), true);

  assert.equal(singing.id, "singing");
  assert.equal(singing.layers.some((layer) => layer.profile === "voice.song"), true);
});

test("clear sunny scenes avoid abrupt rain and thunder selection", () => {
  const room = roomFor({
    tone: "calm",
    location: "Sunny market plaza under a clear blue sky",
    weather: "clear sunny",
    ambience: "Vendors, dry flags, and bright stone.",
    threatClock: 0
  });
  const selected = chooseSoundscape(room);
  const candidates = scoreSoundscapeCandidates(room);
  const thunder = candidates.find((candidate) => candidate.id === "thunderstorm");
  const heavyRain = candidates.find((candidate) => candidate.id === "heavy-rain");

  assert.equal(selected.id, "market-city");
  assert.equal(selected.profile.weather.includes("clear"), true);
  assert.equal(selected.layers.some((layer) => layer.profile === "thunder.close"), false);
  assert.equal(selected.layers.some((layer) => layer.profile === "rain.heavy"), false);
  assert.equal(thunder.score, 0);
  assert.equal(heavyRain.score, 0);
  assert.equal(thunder.blockedBy.includes("clear-weather-without-weather-evidence"), true);
});

test("active danger still overrides ambience with combat tension", () => {
  const room = roomFor({
    tone: "heroic",
    location: "Rainy bridge over the market canal",
    weather: "light rain",
    ambience: "Rain and carts echo below.",
    threatClock: 5,
    beat: "retaliation",
    encounterState: "active",
    transcriptText: "The raider attacks with a long blade and the guards enter combat."
  });

  const soundscape = chooseSoundscape(room);
  const [topCandidate] = scoreSoundscapeCandidates(room);

  assert.equal(soundscape.id, "combat-tension");
  assert.equal(topCandidate.id, "combat-tension");
  assert.equal(soundscape.intensity >= 0.78, true);
  assert.equal(soundscape.transition.style, "fast-crossfade");
  assert.equal(soundscape.layers.some((layer) => layer.profile === "rain.light"), true);
});

test("unmatched rooms use a deterministic mystery fallback with transition metadata", () => {
  const soundscape = chooseSoundscape({ updatedAt: fixedTime, scene: {}, director: {}, transcript: [] });

  assert.equal(soundscape.id, "mystery");
  assert.equal(soundscape.updatedAt, fixedTime);
  assert.equal(soundscape.reason, "Fallback Mystery Undercurrent; pressure 0.");
  assert.equal(soundscape.transition.style, "slow-crossfade");
  assert.equal(soundscape.crossfadeMs, soundscape.transition.durationMs);
  assert.equal(soundscape.layers.every((layer) => layer.profile), true);
  assert.deepEqual(soundscape, chooseSoundscape({ updatedAt: fixedTime, scene: {}, director: {}, transcript: [] }));
});

function roomFor({
  tone = "calm",
  location,
  ambience,
  weather = "",
  mood = "",
  threatClock = 1,
  beat = "discovery",
  encounterState = "foreshadowed",
  transcriptText = ""
}) {
  return {
    tone,
    updatedAt: fixedTime,
    scene: {
      location,
      ambience,
      weather,
      mood,
      threatClock,
      clocks: { danger: threatClock }
    },
    director: { beat, pressure: threatClock },
    encounter: {
      state: encounterState,
      enemies: encounterState === "active" ? [{ id: "enemy", hp: 8, maxHp: 8 }] : []
    },
    transcript: transcriptText
      ? [{ createdAt: fixedTime, type: "gm", author: "AIDM", text: transcriptText }]
      : []
  };
}
