#!/usr/bin/env node
const baseUrl = process.argv[2] || "http://localhost:4173";

const health = await request("/api/health");
assert(health.ok && health.version, "health endpoint should expose service status");

const assets = await request("/assets/manifest.json");
const assetCount = Object.values(assets.groups).flat().length;
assert(assetCount >= 80, "asset manifest should expose at least 80 reusable assets");
assert(assets.version === 2, "asset manifest should use the marketplace-ready v2 schema");

const generatedAssets = await request("/assets/generated/manifest.json");
const generatedAssetList = generatedAssets.rasterAssets || generatedAssets.assets || [];
const generatedAssetCount = generatedAssetList.length;
assert(generatedAssetCount >= 68, "generated manifest should expose image-generated raster assets");
assert(
  generatedAssetList.some((asset) => asset.sheetId === "aidm-ambience-scenes-sheet-002"),
  "generated manifest should include ambience scene backdrops"
);
assertSheetAssetCount(generatedAssetList, "aidm-market-items-sheet-009", 20, "market item");
assertSheetAssetCount(generatedAssetList, "aidm-production-scenes-sheet-011", 16, "production scene");
assertSheetAssetCount(generatedAssetList, "aidm-equipment-fashion-sheet-013", 16, "equipment fashion");
assert(
  generatedAssetList.some((asset) => asset.sheetId === "aidm-production-scenes-sheet-011" && asset.soundscapeHints?.length > 0),
  "production scene assets should carry soundscape hints"
);
await assertStaticAsset(generatedAssetList[0].file, "image/png");

const ttsProviders = await request("/api/tts/providers");
assert(ttsProviders.providers.some((provider) => provider.id === "espeak-ng"), "TTS provider metadata should include eSpeak NG");
assert(ttsProviders.providers.some((provider) => provider.id === "piper"), "TTS provider metadata should include Piper");

const soundscapes = await request("/api/soundscapes");
assert(
  soundscapes.presets.some((preset) => {
    return preset.category === "weather"
      && (preset.id.includes("rain") || preset.assetHints?.some((hint) => hint === "weather:rain"));
  }),
  "soundscape catalog should include rain ambience family"
);
assert(soundscapes.presets.some((preset) => preset.id === "combat-tension"), "soundscape catalog should include combat ambience");
assert(soundscapes.presets.length >= 10, "soundscape catalog should expose the v11 ambience preset set");

const created = await request("/api/rooms", {
  method: "POST",
  body: {
    title: "Smoke Campaign",
    tone: "mystery",
    language: "zh"
  }
});
const roomId = created.room.id;
const hostToken = created.session.hostToken;
assert(created.room.language === "zh", "room should persist selected table language");
assert(created.room.soundscape?.id, "room snapshots should expose selected soundscape");
assert(created.room.transcript[0].text.includes("房间已创建"), "Chinese room should emit localized lifecycle text");

const joined = await request(`/api/rooms/${roomId}/join`, {
  method: "POST",
  body: {
    playerName: "Smoke Player",
    characterName: "Seren",
    species: "automaton",
    classId: "occultist",
    stats: {
      body: 2,
      agility: 3,
      mind: 5,
      presence: 3,
      spirit: 3
    }
  }
});
const playerToken = joined.session.playerToken;
assert(joined.player.character.species === "automaton", "join should persist species");
assert(joined.player.character.classId === "occultist", "join should persist class");
assert(joined.player.character.spells.length > 0, "class should grant spells");
assert(joined.player.character.equipmentSummary?.slots?.mainHand?.item?.itemId === "staff", "join should expose equipped starting weapon");
assert(joined.player.character.inventory.some((item) => item.itemId === "robe" && item.equipped), "join should expose equipped starting armor");

const market = await request(`/api/rooms/${roomId}/market`);
const stormLantern = market.shop.find((offer) => offer.itemId === "storm-lantern");
assert(stormLantern, "market should expose storm lantern offer");
assert(stormLantern.definition?.assetRef?.file, "market offers should expose item art binding");
assert(/\s克朗$/.test(stormLantern.priceLabel), "Chinese market should localize price labels");
assert(!/\bCR\b/.test(stormLantern.priceLabel), "Chinese market should not leak CR in price labels");

const bought = await request(`/api/rooms/${roomId}/market/buy`, {
  method: "POST",
  body: {
    playerId: joined.player.id,
    playerToken,
    itemId: "storm-lantern",
    expectedVersion: market.room.version
  }
});
const buyer = bought.room.players.find((player) => player.id === joined.player.id);
const purchasedLantern = buyer.character.inventory.find((item) => item.itemId === "storm-lantern" && item.source === "shop");
assert(purchasedLantern, "market buy should add purchased item to inventory");
assert(bought.room.transcript.at(-1).economy?.action === "buy", "market buy should append economy transcript");
assert(/\s克朗$/.test(bought.room.transcript.at(-1).economy.priceLabel), "market buy transcript should localize price labels");

const equipped = await request(`/api/rooms/${roomId}/items/equip`, {
  method: "POST",
  body: {
    playerId: joined.player.id,
    playerToken,
    itemId: "staff",
    expectedVersion: bought.room.version
  }
});
const equippedPlayer = equipped.room.players.find((player) => player.id === joined.player.id);
assert(equipped.room.transcript.at(-1).inventory?.action === "equip", "equipment endpoint should append inventory equip transcript");
assert(equippedPlayer.character.equipmentSummary.slots.mainHand.item.itemId === "staff", "equipment summary should retain equipped staff");

const started = await request(`/api/rooms/${roomId}/start`, {
  method: "POST",
  body: { hostToken }
});
const chatted = await request(`/api/rooms/${roomId}/chat`, {
  method: "POST",
  body: {
    playerId: joined.player.id,
    playerToken,
    text: "checking notes before acting",
    expectedVersion: started.room.version
  }
});
assert(chatted.room.transcript.at(-1).type === "chat", "chat should append chat transcript");

const acted = await request(`/api/rooms/${roomId}/action`, {
  method: "POST",
  body: {
    playerId: joined.player.id,
    playerToken,
    text: "carefully inspect the west stair for the silver ledger",
    mode: "normal",
    expectedVersion: chatted.room.version
  }
});

assert(acted.room.transcript.some((entry) => entry.type === "roll"), "action should create a roll event");
assert(acted.room.memories.length >= 1, "action should create memory");
assert(acted.room.combat?.encounter?.enemies?.length >= 1, "room should expose encounter state");
assert(acted.room.combat?.tacticalIntent?.type, "room should expose NPC tactical intent");
assert(acted.room.director?.beat, "room should expose director beat");

const fought = await request(`/api/rooms/${roomId}/action`, {
  method: "POST",
  body: {
    playerId: joined.player.id,
    playerToken,
    text: "attack the nearest street skirmisher with a spell",
    mode: "normal",
    expectedVersion: acted.room.version
  }
});
assert(fought.room.combat?.log?.length >= 1, "combat action should create combat log");

const replay = await request(`/api/rooms/${roomId}/replay`);
assert(replay.replay?.highlights?.length >= 1, "replay should expose highlights");

console.log(JSON.stringify({
  ok: true,
  roomId,
  assetCount,
  generatedAssetCount,
  language: created.room.language,
  ttsProviders: ttsProviders.providers.length,
  soundscapePresets: soundscapes.presets.length,
  marketOffers: market.shop.length,
  purchasedItem: purchasedLantern.itemId,
  equippedItems: equippedPlayer.character.equipmentSummary.equippedItemIds,
  soundscape: fought.room.soundscape.id,
  transcript: fought.room.transcript.length,
  memories: fought.room.memories.length,
  encounterState: fought.room.combat.state,
  npcIntent: fought.room.combat.tacticalIntent.type,
  directorBeat: fought.room.director.beat,
  combatLog: fought.room.combat.log.length,
  replayHighlights: replay.replay.highlights.length
}, null, 2));

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${path} failed: ${payload.error || response.status}`);
  }
  return payload;
}

async function assertStaticAsset(file, expectedType) {
  const path = `/${String(file).replace(/^\/+/, "")}`;
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status}`);
  }
  const contentType = response.headers.get("content-type") || "";
  assert(contentType.includes(expectedType), `${path} should be served as ${expectedType}`);
}

function assertSheetAssetCount(assets, sheetId, minimum, label) {
  const count = assets.filter((asset) => asset.sheetId === sheetId).length;
  assert(count >= minimum, `generated manifest should expose at least ${minimum} ${label} assets`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
