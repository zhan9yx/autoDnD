import test from "node:test";
import assert from "node:assert/strict";
import { AIProvider, localNarration } from "../src/core/aiProvider.js";
import { applyDirectorBeat } from "../src/core/director.js";
import { GameEngine } from "../src/core/gameEngine.js";
import { aiDecision } from "../src/core/logTemplates.js";
import { t } from "../src/core/localization.js";
import { buildRuleKnowledgeContext, listRuleKnowledgeSources } from "../src/core/rules.js";
import { MemoryRoomStore } from "../src/core/storage.js";
import { addPlayer, createRoomState } from "../src/core/stateMachine.js";

const protectedSettingPatterns = [
  /forgotten realms/i,
  /faer[uû]n/i,
  /waterdeep/i,
  /neverwinter/i,
  /ravenloft/i,
  /strahd/i,
  /eberron/i,
  /dragonlance/i,
  /planescape/i,
  /spelljammer/i,
  /greyhawk/i,
  /vecna/i,
  /xanathar/i,
  /mordenkainen/i,
  /tasha/i,
  /mind flayer/i,
  /beholder/i,
  /displacer beast/i,
  /artificer/i,
  /aasimar/i,
  /bastion/i
];

const copiedRulesTextPatterns = [
  /the dm calls for an ability check/i,
  /the three main rolls of the game/i,
  /specific beats general/i,
  /whenever you divide or multiply/i
];

test("knowledge context source registry stays attribution-only without embedded SRD corpus text", () => {
  const sources = listRuleKnowledgeSources();
  assert.equal(sources.length >= 2, true);

  for (const source of sources) {
    assert.equal(source.license, "CC-BY-4.0");
    assert.match(source.url, /^https:\/\//);
    assert.equal(Object.hasOwn(source, "content"), false);
    assert.equal(Object.hasOwn(source, "body"), false);
    assert.equal(Object.hasOwn(source, "markdown"), false);
    assert.equal(Object.hasOwn(source, "excerpt"), false);
    assert.match(source.useBoundary, /do not (copy|embed) long/i);
  }

  const context = buildRuleKnowledgeContext({
    room: {
      scene: {
        weather: "thunderstorm",
        season: "winter",
        ambience: "cold rain over the archive door"
      }
    },
    player: qaPlayer(),
    actionText: "track the courier through the storm",
    check: { success: false, total: 8, dc: 14, margin: -6 },
    beat: "complication"
  });

  assert.equal(context.framework, "repo-local-srd-style");
  assert.equal(context.sources.every((source) => source.useBoundary.includes("long")), true);
  assert.equal(context.promptDirectives.some((line) => /do not quote long rules text/i.test(line)), true);
  assert.equal(context.environment.weather, "storm");
  assert.equal(context.environment.season, "winter");
  assert.equal(context.actionGuidance.intent, "travel");
  assertContextTextSafe(context);
});

test("local narrator and localized copy consume knowledge hooks without source text sprawl", () => {
  const narration = localNarration({
    room: qaRoom("zh"),
    player: qaPlayer("澜"),
    actionText: "追踪暴雨里的信使足迹",
    check: { success: false, margin: -4, total: 9, dc: 13, expression: "1d20+2" },
    memories: [{ text: "旧线索指向雨棚集市。" }]
  });

  assert.equal(narration.provider, "local");
  assert.match(narration.text, /AIDM 将这次行动放进/);
  assert.match(narration.text, /建议聚焦/);
  assert.match(t("zh", "knowledge.sourceBoundary"), /运行时叙事保持原创/);
  assert.doesNotMatch(narration.text, /https?:\/\/|System Reference Document|Wizards|CC-BY/);
  assertContextTextSafe(narration.text);
});

test("OpenAI narration prompt carries attribution, environment, action guidance, and quote guardrails", async () => {
  const originalFetch = globalThis.fetch;
  let capturedRequest = null;
  globalThis.fetch = async (url, options) => {
    capturedRequest = { url, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({
      output_text: "Rain breaks across the archive stones while the table chooses a careful route."
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    const provider = new AIProvider({
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "qa-model",
      OPENAI_BASE_URL: "https://example.invalid/v1"
    });
    const result = await provider.openAiNarration({
      room: qaRoom("en"),
      player: qaPlayer("Rin"),
      actionText: "track the courier through the storm",
      check: { success: false, margin: -4, total: 9, dc: 13, expression: "1d20+2" },
      memories: [{ text: "The old coffer smelled of rainwater." }]
    });

    assert.equal(result.provider, "openai");
    assert.equal(capturedRequest.url, "https://example.invalid/v1/responses");
    assert.equal(capturedRequest.body.model, "qa-model");
    assert.match(capturedRequest.body.input, /Knowledge attribution boundary:/);
    assert.match(capturedRequest.body.input, /https:\/\/www\.dndbeyond\.com\/srd/);
    assert.match(capturedRequest.body.input, /Environment hook:/);
    assert.match(capturedRequest.body.input, /Action suggestion:/);
    assert.match(capturedRequest.body.input, /Randomness hook:/);
    assert.match(capturedRequest.body.input, /do not quote rules text/i);
    assert.equal(capturedRequest.body.input.length < 3000, true);
    assertContextTextSafe(capturedRequest.body.input);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("director knowledge can be preserved in decision logs with reviewable IP boundaries", () => {
  const room = createRoomState({ title: "Knowledge QA", language: "en" });
  const player = addPlayer(room, {
    playerName: "QA",
    characterName: "Rin",
    classId: "ranger",
    species: "elf"
  });
  room.scene.weather = "thunderstorm";
  room.scene.season = "winter";
  room.scene.ambience = "cold rain and close thunder";

  const director = applyDirectorBeat(room, {
    player,
    actionText: "track the courier through the storm",
    check: { success: false, total: 8, dc: 14, margin: -6 }
  });
  const log = aiDecision({
    roomId: room.id,
    actorId: "aidm",
    decision: "narrate weather-aware travel complication",
    result: "recoverable complication",
    beat: director.beat,
    scene: room.scene.location,
    clocks: room.scene.clocks,
    sceneChange: director.sceneChange,
    npcIntent: director.npcIntent,
    consequence: director.consequence,
    knowledge: director.knowledge,
    directives: director.directives
  });

  assert.deepEqual(log.metadata.knowledgeSources, ["dnd-srd-5.2.1", "dnd-srd-5.1-cc"]);
  assert.equal(log.metadata.environmentHooks.weather, "storm");
  assert.equal(log.metadata.environmentHooks.season, "winter");
  assert.equal(log.metadata.actionGuidance.intent, "travel");
  assert.match(log.metadata.licenseBoundary, /no long SRD text/);
  assert.equal(log.metadata.knowledgeHooks.some((line) => /Attribution boundary/i.test(line)), true);
  assertContextTextSafe(log);
});

test("submitAction attaches knowledge summaries to runtime GM structured logs", async () => {
  const store = new MemoryRoomStore();
  const engine = new GameEngine({ store });
  const room = await engine.createRoom({ title: "Runtime Knowledge QA", language: "en" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "QA",
    characterName: "Rin",
    classId: "ranger",
    species: "elf"
  });
  await engine.startRoom(room.id);

  const rawRoom = await store.getRoom(room.id);
  rawRoom.scene.weather = "thunderstorm";
  rawRoom.scene.season = "winter";
  rawRoom.scene.ambience = "cold rain and close thunder";
  await store.saveRoom(rawRoom);

  const acted = await engine.submitAction(room.id, {
    playerId: joined.player.id,
    text: "track the courier through the storm toward the north gate"
  });
  const gmEntry = acted.transcript.filter((entry) => entry.type === "gm" && entry.author === "AIDM").at(-1);
  const metadata = gmEntry.structuredLog.metadata;

  assert.deepEqual(metadata.knowledgeSources, ["dnd-srd-5.2.1", "dnd-srd-5.1-cc"]);
  assert.equal(metadata.environmentHooks.weather, "storm");
  assert.equal(metadata.environmentHooks.season, "winter");
  assert.equal(metadata.actionGuidance.intent, "travel");
  assert.equal(metadata.actionGuidance.suggestions[0].id, "move-with-care");
  assert.match(metadata.licenseBoundary, /no long SRD text/);
  assert.doesNotMatch(gmEntry.text, /CC-BY|Creative Commons|dndbeyond\.com|license|SRD/i);
  assertContextTextSafe(gmEntry.text);
  assertContextTextSafe(gmEntry.structuredLog);
});

function qaRoom(language) {
  return {
    language,
    title: language === "zh" ? "知识链路 QA" : "Knowledge QA",
    scene: {
      title: language === "zh" ? "风暴档案馆" : "Storm Archive",
      location: language === "zh" ? "冬夜档案馆门口" : "winter archive gate",
      objective: language === "zh" ? "追踪雨中的信使" : "Track the courier before dawn",
      ambience: language === "zh" ? "冷雨与近处雷声" : "cold rain and close thunder",
      weather: "thunderstorm",
      season: "winter"
    },
    director: { beat: "complication" }
  };
}

function qaPlayer(name = "Rin") {
  return {
    character: {
      name,
      archetype: "Ranger",
      skills: { survival: 5, investigation: 3, stealth: 2 },
      actions: ["attack", "defend", "flee"]
    }
  };
}

function assertContextTextSafe(value) {
  const text = flattenStrings(value).join("\n");
  for (const pattern of protectedSettingPatterns) {
    assert.doesNotMatch(text, pattern);
  }
  for (const pattern of copiedRulesTextPatterns) {
    assert.doesNotMatch(text, pattern);
  }
}

function flattenStrings(value, output = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      flattenStrings(entry, output);
    }
    return output;
  }
  if (value && typeof value === "object") {
    for (const entry of Object.values(value)) {
      flattenStrings(entry, output);
    }
  }
  return output;
}
