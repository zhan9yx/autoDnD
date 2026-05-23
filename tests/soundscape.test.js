import test from "node:test";
import assert from "node:assert/strict";
import { chooseSoundscape, listSoundscapePresets, scoreSoundscapeCandidates } from "../src/core/soundscape.js";

const fixedTime = "2026-01-02T03:04:05.000Z";

test("soundscape catalog covers required ambience families", () => {
  const ids = listSoundscapePresets().map((preset) => preset.id);

  assert.deepEqual(
    ["rain", "forest", "pond", "waterfall", "campfire", "insects", "market-city", "combat-tension", "mystery", "calm-night"]
      .every((id) => ids.includes(id)),
    true
  );
});

test("rain cues win for wet archive scenes and stay deterministic", () => {
  const room = {
    tone: "mystery",
    updatedAt: fixedTime,
    scene: {
      location: "A rain-polished street outside a sealed archive",
      ambience: "rain, old stone, and candle smoke",
      threatClock: 1
    },
    director: { beat: "hook" },
    transcript: [
      { createdAt: fixedTime, type: "gm", author: "AIDM", text: "Rain runs down the archive stairs." }
    ]
  };

  const first = chooseSoundscape(room);
  const second = chooseSoundscape(room);

  assert.equal(first.id, "rain");
  assert.equal(first.category, "weather");
  assert.equal(first.updatedAt, fixedTime);
  assert.equal(first.layers.some((layer) => layer.type === "weather"), true);
  assert.deepEqual(first, second);
});

test("natural locations select the expected non-combat beds", () => {
  const cases = [
    {
      expected: "forest",
      room: roomFor({
        location: "Mosswood forest under a pine canopy",
        ambience: "Leaves move above the trail."
      })
    },
    {
      expected: "pond",
      room: roomFor({
        location: "A still lotus pond beside the old shrine",
        ambience: "Reeds brush the water."
      })
    },
    {
      expected: "waterfall",
      room: roomFor({
        location: "A thundering waterfall gorge",
        ambience: "Spray and rushing water fill the pass."
      })
    },
    {
      expected: "campfire",
      room: roomFor({
        location: "A watch camp around a small campfire",
        ambience: "Embers pop while the party rests."
      })
    },
    {
      expected: "insects",
      room: roomFor({
        location: "A dusk field of tall grass",
        ambience: "Crickets and cicadas buzz near the trail."
      })
    }
  ];

  for (const { expected, room } of cases) {
    const soundscape = chooseSoundscape(room);
    assert.equal(soundscape.id, expected);
    assert.equal(soundscape.intensity >= 0 && soundscape.intensity <= 1, true);
    assert.equal(soundscape.layers.length >= 3, true);
  }
});

test("urban scenes prefer market and city layers", () => {
  const soundscape = chooseSoundscape(roomFor({
    tone: "mystery",
    location: "Glass Market city street near the crowded dock",
    ambience: "Vendors, carts, and distant bells fill the plaza."
  }));

  assert.equal(soundscape.id, "market-city");
  assert.equal(soundscape.category, "urban");
  assert.equal(soundscape.layers.some((layer) => layer.type === "urban"), true);
});

test("active danger overrides ambience with combat tension", () => {
  const room = roomFor({
    tone: "heroic",
    location: "Rainy bridge over the market canal",
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
  assert.equal(soundscape.musicCue.transition, "fast-crossfade");
});

test("mystery and calm night remain distinct at low pressure", () => {
  const mystery = chooseSoundscape(roomFor({
    tone: "mystery",
    location: "Sealed archive under the old courthouse",
    ambience: "A hidden clue, candle smoke, and a whisper behind stone.",
    transcriptText: "The shadow points toward an unknown ritual."
  }));
  const calmNight = chooseSoundscape(roomFor({
    tone: "calm",
    location: "Quiet rooftop under moon and stars",
    ambience: "The party keeps a peaceful night watch.",
    threatClock: 0,
    transcriptText: "Everyone rests and speaks softly before dawn."
  }));

  assert.equal(mystery.id, "mystery");
  assert.equal(mystery.intensity > calmNight.intensity, true);
  assert.equal(calmNight.id, "calm-night");
  assert.equal(calmNight.intensity <= 0.44, true);
});

function roomFor({
  tone = "calm",
  location,
  ambience,
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
