import test from "node:test";
import assert from "node:assert/strict";
import { chooseSoundscape, listSoundscapePresets, scoreSoundscapeCandidates } from "../src/core/soundscape.js";
import { t } from "../public/i18n.js";

const fixedTime = "2026-01-02T03:04:05.000Z";

test("soundscape catalog covers weather, nature, water, fire, urban, and social ambience families", () => {
  const ids = listSoundscapePresets().map((preset) => preset.id);

  for (const id of [
    "light-rain",
    "heavy-rain",
    "thunderstorm",
    "clear-day",
    "light-wind",
    "gale-wind",
    "forest",
    "pond",
    "waterfall",
    "campfire",
    "insects",
    "town-square",
    "market-city",
    "tavern",
    "archive-room",
    "shrine-cistern",
    "crowd-murmur",
    "toasting-cheers",
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
  assert.equal(tavern.layers.some((layer) => layer.profile === "foley.glass-toast"), true);
  assert.equal(Array.isArray(tavern.visualHints), true);
  assert.equal(Array.isArray(tavern.assetHints), true);
  assert.equal(tavern.transition.durationMs > 0, true);
});

test("archive and shrine scenes get specific indoor beds with compatible weather layers", () => {
  const rainyArchive = chooseSoundscape(roomFor({
    location: "Records archive below the old courthouse",
    weather: "light rain",
    ambience: "Dusty shelves, parchment pages, and soft rain at the narrow windows."
  }));
  const shrine = chooseSoundscape(roomFor({
    location: "Cistern shrine under the temple",
    mood: "mystery",
    ambience: "Incense curls over a stone basin while water echoes below."
  }));
  const archiveCandidates = scoreSoundscapeCandidates(roomFor({
    location: "Records archive below the old courthouse",
    weather: "clear sunny",
    ambience: "Dry dust, catalog shelves, and bright windows.",
    transcriptText: "Earlier, tavern cups and market cheers filled a different scene."
  }));
  const tavern = archiveCandidates.find((candidate) => candidate.id === "tavern");

  assert.equal(rainyArchive.id, "archive-room");
  assert.equal(rainyArchive.profile.location.includes("archive"), true);
  assert.equal(rainyArchive.layers.some((layer) => layer.profile === "foley.archive-pages"), true);
  assert.equal(rainyArchive.layers.some((layer) => layer.profile === "rain.light"), true);
  assert.equal(rainyArchive.layers.some((layer) => layer.profile === "foley.cups-plates"), false);

  assert.equal(shrine.id, "shrine-cistern");
  assert.equal(shrine.profile.location.includes("shrine"), true);
  assert.equal(shrine.layers.some((layer) => layer.profile === "water.cistern-echo"), true);
  assert.equal(shrine.layers.some((layer) => layer.profile === "foley.stone-reverb"), true);
  assert.equal(shrine.layers.some((layer) => layer.profile === "rain.heavy" || layer.profile === "thunder.close"), false);

  assert.equal(tavern.score, 0);
  assert.equal(tavern.blockedBy.some((reason) => reason.startsWith("scene-location-mismatch")), true);
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

test("weather mix composes rain, wind, and thunder probability over a location bed", () => {
  const tavernStorm = chooseSoundscape(roomFor({
    location: "Crowded tavern common room",
    weather: "heavy rain and gale wind",
    ambience: "Cups clatter while rain lashes the shutters.",
    threatClock: 2
  }));
  const thunderLayer = tavernStorm.layers.find((layer) => layer.profile === "thunder.distant");

  assert.equal(tavernStorm.id, "tavern");
  assert.equal(tavernStorm.reason.key, "soundscape.reason.locationWeather");
  assert.deepEqual(tavernStorm.profile.weatherMix, {
    rain: "heavy",
    wind: "gale",
    thunderChance: 0.34,
    clear: false
  });
  assert.equal(tavernStorm.layers.some((layer) => layer.profile === "rain.heavy"), true);
  assert.equal(tavernStorm.layers.some((layer) => layer.profile === "wind.gale"), true);
  assert.ok(thunderLayer);
  assert.equal(thunderLayer.probability, 0.34);
});

test("structured scene tags match social ambience layers", () => {
  const taggedTavern = chooseSoundscape(roomFor({
    location: "Old stone hall",
    tags: ["location:tavern", "mood:singing", "cheerful", "weather:light-rain"],
    ambience: "Cups and plates clink while a singer leads the room into cheers."
  }));

  assert.equal(taggedTavern.id, "tavern");
  assert.equal(taggedTavern.profile.location.includes("tavern"), true);
  assert.equal(taggedTavern.profile.mood.includes("singing"), true);
  assert.equal(taggedTavern.profile.mood.includes("cheerful"), true);
  assert.equal(taggedTavern.layers.some((layer) => layer.profile === "foley.cups-plates"), true);
  assert.equal(taggedTavern.layers.some((layer) => layer.profile === "voice.song"), true);
  assert.equal(taggedTavern.layers.some((layer) => layer.profile === "crowd.cheers"), true);
  assert.equal(taggedTavern.layers.some((layer) => layer.profile === "rain.light"), true);
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
  assert.equal(singing.layers.some((layer) => layer.profile === "voice.chant"), true);
});

test("social ambience distinguishes crowd beds and toasts", () => {
  const crowd = chooseSoundscape(roomFor({
    location: "Civic hall",
    mood: "crowded",
    ambience: "People and patrons form a busy room of low crowd murmur."
  }));
  const toast = chooseSoundscape(roomFor({
    location: "Banquet hall",
    mood: "toasting",
    ambience: "Glasses clink, cups rise, laughter and cheers move through the room."
  }));

  assert.equal(crowd.id, "crowd-murmur");
  assert.equal(crowd.layers.some((layer) => layer.profile === "crowd.low-murmur"), true);
  assert.equal(crowd.profile.mood.includes("crowded"), true);

  assert.equal(toast.id, "toasting-cheers");
  assert.equal(toast.layers.some((layer) => layer.profile === "foley.glass-toast"), true);
  assert.equal(toast.layers.some((layer) => layer.profile === "crowd.laughter"), true);
  assert.equal(toast.layers.some((layer) => layer.profile === "crowd.cheers"), true);
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

test("clear weather and town scenes stay dry and do not drift into tavern beds", () => {
  const clearRoad = chooseSoundscape(roomFor({
    location: "Open road under a clear blue sky",
    weather: "clear sunny",
    ambience: "Dry grass and warm sunlight frame the path.",
    threatClock: 0
  }));
  const town = chooseSoundscape(roomFor({
    location: "Quiet town square beside the clocktower",
    weather: "clear sunny",
    mood: "calm",
    ambience: "Townsfolk cross dry cobbles near a workshop and a bright well.",
    threatClock: 0
  }));
  const candidates = scoreSoundscapeCandidates(roomFor({
    location: "Quiet town square beside the clocktower",
    weather: "clear sunny",
    mood: "calm",
    ambience: "Townsfolk cross dry cobbles near a workshop and a bright well.",
    threatClock: 0,
    transcriptText: "Last scene was a rainy tavern full of songs, cups, and thunder."
  }));
  const tavern = candidates.find((candidate) => candidate.id === "tavern");
  const rain = candidates.find((candidate) => candidate.id === "heavy-rain");

  assert.equal(clearRoad.id, "clear-day");
  assert.equal(clearRoad.layers.some((layer) => layer.profile === "weather.clear-day"), true);
  assert.equal(clearRoad.layers.some((layer) => layer.profile === "rain.light" || layer.profile === "rain.heavy"), false);
  assert.equal(town.id, "town-square");
  assert.equal(town.profile.location.includes("town"), true);
  assert.equal(town.layers.some((layer) => layer.profile === "urban.footsteps"), true);
  assert.equal(town.layers.some((layer) => layer.profile === "foley.cups-plates"), false);
  assert.equal(tavern.score, 0);
  assert.equal(tavern.blockedBy.some((reason) => reason.startsWith("scene-location-mismatch")), true);
  assert.equal(rain.score, 0);
});

test("clear current weather suppresses older thunder and rain context", () => {
  const room = roomFor({
    tone: "calm",
    location: "Sunny market plaza under a clear blue sky",
    weather: "clear sunny",
    ambience: "Dry banners lift over bright stone beside a storm lantern.",
    threatClock: 0,
    transcriptText: "Earlier, thunder and heavy rain rolled over a different bridge."
  });
  const selected = chooseSoundscape(room);
  const candidates = scoreSoundscapeCandidates(room);
  const thunder = candidates.find((candidate) => candidate.id === "thunderstorm");

  assert.equal(selected.id, "market-city");
  assert.deepEqual(selected.profile.weather, ["clear"]);
  assert.deepEqual(selected.profile.weatherMix, { rain: "none", wind: "none", thunderChance: 0, clear: true });
  assert.equal(selected.layers.some((layer) => layer.profile === "thunder.close" || layer.profile === "thunder.distant"), false);
  assert.equal(selected.layers.some((layer) => layer.profile === "rain.heavy"), false);
  assert.equal(thunder.score, 0);
  assert.equal(thunder.blockedBy.includes("clear"), true);
});

test("clear scene assets suppress stale thunder narration", () => {
  const room = roomFor({
    tone: "calm",
    location: "Market plaza",
    ambience: "Dry awnings and bright flags frame the stalls.",
    threatClock: 0,
    transcriptText: "A previous storm scene mentioned thunder and lightning beyond the pass."
  });
  room.presentation = {
    sceneAsset: {
      id: "scene-clear-market",
      weather: "clear sunny",
      mood: "busy",
      soundscapeHints: ["market", "clear", "sunny"],
      displayName: { en: "Clear Market", zh: "晴朗市场" },
      description: "Clear blue sky over a busy dry plaza."
    }
  };

  const selected = chooseSoundscape(room);
  const candidates = scoreSoundscapeCandidates(room);
  const thunder = candidates.find((candidate) => candidate.id === "thunderstorm");

  assert.equal(selected.id, "market-city");
  assert.equal(selected.profile.weather.includes("clear"), true);
  assert.equal(selected.layers.some((layer) => layer.profile === "thunder.close" || layer.profile === "thunder.distant"), false);
  assert.equal(thunder.score, 0);
  assert.equal(thunder.blockedBy.includes("clear"), true);
});

test("scene mismatch guards prevent recent text from hijacking the current audio bed", () => {
  const room = roomFor({
    tone: "calm",
    location: "Quiet forest shrine beneath old pines",
    weather: "clear",
    mood: "calm",
    ambience: "Still leaves and a soft breeze surround the shrine.",
    threatClock: 0,
    transcriptText: "A distant memory mentions the city market, cheering crowds, tavern songs, and waterfall spray."
  });

  const selected = chooseSoundscape(room);
  const candidates = scoreSoundscapeCandidates(room);
  const market = candidates.find((candidate) => candidate.id === "market-city");
  const singing = candidates.find((candidate) => candidate.id === "singing");

  assert.equal(selected.id, "forest");
  assert.equal(selected.profile.guards.length, 0);
  assert.equal(market.score, 0);
  assert.equal(market.blockedBy.some((reason) => reason.startsWith("scene-location-mismatch")), true);
  assert.equal(market.guardReasons.some((reason) => reason.includes("forest")), true);
  assert.equal(singing.blockedBy.includes("social-mood-mismatch"), true);
});

test("soundscape reasons are localized player descriptors and keep guards internal", () => {
  const room = roomFor({
    tone: "calm",
    location: "Quiet forest shrine beneath old pines",
    weather: "clear",
    mood: "calm",
    ambience: "Still leaves and a soft breeze surround the shrine.",
    threatClock: 0,
    transcriptText: "A city market argument and waterfall spray are mentioned as old rumors."
  });

  const selected = chooseSoundscape(room);
  const candidates = scoreSoundscapeCandidates(room);
  const market = candidates.find((candidate) => candidate.id === "market-city");
  const zhReason = t("zh", selected.reason.key, selected.reason.params);
  const enReason = t("en", selected.reason.key, selected.reason.params);

  assert.equal(selected.reason.key, "soundscape.reason.location");
  assert.deepEqual(Object.keys(selected.reason.params).sort(), ["category", "id"]);
  assert.equal(market.guardReasons.some((reason) => reason.includes("forest")), true);
  assert.equal(JSON.stringify(selected.reason).includes("scene-bed-mismatch"), false);
  assert.doesNotMatch(zhReason, /matched|pressure|guard|mismatch|scene-bed|forest/i);
  assert.doesNotMatch(enReason, /matched|pressure|guard|mismatch|scene-bed|ignored|blocked/i);
  assert.equal(zhReason.length < 32, true);
  assert.equal(enReason.length < 48, true);
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
  assert.deepEqual(soundscape.reason, {
    key: "soundscape.reason.fallback",
    params: { id: "mystery", category: "mystery" }
  });
  assert.equal(t("zh", soundscape.reason.key, soundscape.reason.params), "使用中性的悬疑氛围。");
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
  transcriptText = "",
  tags = []
}) {
  return {
    tone,
    updatedAt: fixedTime,
    scene: {
      location,
      ambience,
      weather,
      mood,
      tags,
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
