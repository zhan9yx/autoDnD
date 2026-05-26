#!/usr/bin/env node
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
let baseUrl = process.argv[2] || "";
const ownedServer = baseUrl ? null : await startSmokeServer();
if (!baseUrl) {
  baseUrl = ownedServer.baseUrl;
}

try {

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
const fieldPrimer = market.shop.find((offer) => offer.itemId === "field-primer");
assert(fieldPrimer, "market should expose field primer for runtime level-up validation");
assert(fieldPrimer.price > fieldPrimer.saleValue, "field primer should expose readable buy and resale values");
assert(fieldPrimer.definition?.assetRef?.file, "field primer offer should expose item art binding");

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

const acted = await actUntilReward({
  roomId,
  playerId: joined.player.id,
  playerToken,
  expectedVersion: chatted.room.version,
  initialLocation: started.room.scene.location,
  attempts: [
    "carefully go to the market street and search the vendor ledger stall drawer",
    "carefully follow the city crowd to the market ledger stall drawer",
    "carefully search the vendor ledger stall drawer for the next clue",
    "carefully inspect the market ledger stall drawer and secure the evidence cache"
  ]
});

assert(acted.room.transcript.some((entry) => entry.type === "roll"), "action should create a roll event");
assert(acted.room.memories.length >= 1, "action should create memory");
assert(acted.room.combat?.encounter?.enemies?.length >= 1, "room should expose encounter state");
assert(acted.room.combat?.tacticalIntent?.type, "room should expose NPC tactical intent");
assert(acted.room.director?.beat, "room should expose director beat");
assert(acted.room.scene.lastShiftReason === "market-action", "successful travel action should switch to the market scene");
assert(acted.room.scene.location !== started.room.scene.location, "action should change the room scene location");
assert(acted.room.presentation?.sceneAsset?.file, "scene change should keep stage art selected");
const rewardEntry = acted.room.transcript.findLast((entry) => entry.type === "reward" && entry.reward);
assert(rewardEntry, "successful scene search should create a loot reward");
assert(rewardEntry.reward.file, "loot reward should expose item art");
assert(rewardEntry.reward.value > 0, "loot reward should expose value");
assert(rewardEntry.reward.saleValue > 0, "loot reward should expose resale value");
const rewardOwner = acted.room.players.find((player) => player.id === joined.player.id);
const rewardInventoryEntry = rewardOwner.character.inventory.find((item) => {
  return item.itemId === rewardEntry.reward.itemId && item.source === rewardEntry.reward.source.id;
});
assert(rewardInventoryEntry, "loot reward should be present in the backpack");
assert(rewardInventoryEntry.value === rewardEntry.reward.value, "backpack item should retain reward value");
assert(rewardInventoryEntry.currency === "coin", "backpack item should retain currency");
assert(rewardInventoryEntry.sellable === true, "backpack loot should be sellable");

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

const soldLoot = await request(`/api/rooms/${roomId}/market/sell`, {
  method: "POST",
  body: {
    playerId: joined.player.id,
    playerToken,
    itemId: rewardInventoryEntry.id,
    expectedVersion: fought.room.version
  }
});
const soldEvent = soldLoot.room.transcript.at(-1);
assert(soldEvent.economy?.action === "sell", "market sell should append economy transcript");
assert(soldEvent.economy.payout === rewardEntry.reward.saleValue, "market sell should pay the reward resale value");
assert(/\s克朗$/.test(soldEvent.economy.payoutLabel), "Chinese sell transcript should localize payout labels");
const seller = soldLoot.room.players.find((player) => player.id === joined.player.id);
assert(!seller.character.inventory.some((item) => item.id === rewardInventoryEntry.id), "sold loot should leave the backpack");

const leveling = await runLevelingFlow();

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
  rewardItem: rewardEntry.reward.itemId,
  rewardValue: rewardEntry.reward.value,
  rewardSaleValue: rewardEntry.reward.saleValue,
  soldLootPayout: soldEvent.economy.payout,
  levelUp: leveling,
  soundscape: fought.room.soundscape.id,
  transcript: fought.room.transcript.length,
  memories: fought.room.memories.length,
  encounterState: fought.room.combat.state,
  npcIntent: fought.room.combat.tacticalIntent.type,
  directorBeat: fought.room.director.beat,
  combatLog: fought.room.combat.log.length,
  replayHighlights: replay.replay.highlights.length
}, null, 2));
} finally {
  if (ownedServer) {
    await ownedServer.stop();
  }
}

async function startSmokeServer() {
  const port = await availablePort();
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-smoke-flow-"));
  const child = spawn(process.execPath, ["src/server/server.js"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      AIDM_DATA_FILE: join(tempDir, "rooms.json")
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let exited = false;
  child.once("exit", () => {
    exited = true;
  });
  await waitForSmokeServer(child, port);
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async stop() {
      if (!exited) {
        child.kill("SIGTERM");
        await Promise.race([
          once(child, "exit"),
          delay(1000)
        ]);
      }
      if (!exited) {
        child.kill("SIGKILL");
        await Promise.race([
          once(child, "exit"),
          delay(1000)
        ]);
      }
    }
  };
}

async function waitForSmokeServer(child, port) {
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for smoke server on ${port}. stdout=${stdout} stderr=${stderr}`));
    }, 15000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.includes(`http://localhost:${port}`)) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`Smoke server exited before ready: code=${code} signal=${signal} stderr=${stderr}`));
    });
  });
}

async function availablePort() {
  const server = createNetServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function actUntilReward({ roomId, playerId, playerToken, expectedVersion, initialLocation, attempts }) {
  let version = expectedVersion;
  let lastRoom = null;
  for (const text of attempts) {
    const result = await request(`/api/rooms/${roomId}/action`, {
      method: "POST",
      body: {
        playerId,
        playerToken,
        text,
        mode: "advantage",
        expectedVersion: version
      }
    });
    lastRoom = result.room;
    const reward = result.room.transcript.findLast((entry) => entry.type === "reward" && entry.reward);
    if (reward && result.room.scene.location !== initialLocation) {
      return result;
    }
    version = result.room.version;
  }
  throw new Error(`action flow should create loot and change scene; last version ${lastRoom?.version || "unknown"}`);
}

async function runLevelingFlow() {
  const created = await request("/api/rooms", {
    method: "POST",
    body: {
      title: "Smoke Leveling Flow",
      tone: "heroic",
      language: "zh"
    }
  });
  const roomId = created.room.id;
  const joined = await request(`/api/rooms/${roomId}/join`, {
    method: "POST",
    body: {
      playerName: "Level Player",
      characterName: "Iris",
      species: "human",
      classId: "mage",
      stats: {
        body: 2,
        agility: 3,
        mind: 7,
        presence: 3,
        spirit: 4
      }
    }
  });
  const playerToken = joined.session.playerToken;
  const market = await request(`/api/rooms/${roomId}/market`);
  const primer = market.shop.find((offer) => offer.itemId === "field-primer");
  assert(primer, "leveling flow should expose field primer in market");
  const boughtPrimer = await request(`/api/rooms/${roomId}/market/buy`, {
    method: "POST",
    body: {
      playerId: joined.player.id,
      playerToken,
      itemId: "field-primer",
      expectedVersion: market.room.version
    }
  });
  const buyer = boughtPrimer.room.players.find((player) => player.id === joined.player.id);
  const primerItem = buyer.character.inventory.find((item) => item.itemId === "field-primer" && item.source === "shop");
  assert(primerItem, "field primer purchase should add the training item to backpack");
  const usedPrimer = await request(`/api/rooms/${roomId}/items/use`, {
    method: "POST",
    body: {
      playerId: joined.player.id,
      playerToken,
      itemId: primerItem.id,
      expectedVersion: boughtPrimer.room.version
    }
  });
  const character = usedPrimer.room.players.find((player) => player.id === joined.player.id).character;
  const event = usedPrimer.room.transcript.at(-1);
  assert(character.level === 2, "field primer should advance the character to level 2");
  assert(character.spells.includes("ember-lance"), "level-up should grant a readable learned spell");
  assert(character.actions.includes("recover-mana"), "level-up should grant a readable combat technique action");
  assert(event.inventory?.stateDeltas?.learnedSpells?.includes("ember-lance"), "level-up transcript should expose learned spell delta");
  assert(event.inventory?.stateDeltas?.progression?.actions?.includes("recover-mana"), "level-up transcript should expose combat technique delta");
  assert(/Ember Lance|余烬长矛/.test(event.text), "level-up transcript should name the learned spell");
  assert(/Recover Mana|回收法力/.test(event.text), "level-up transcript should name the combat technique");
  return {
    roomId,
    level: character.level,
    learnedSpells: event.inventory.stateDeltas.learnedSpells,
    progressionActions: event.inventory.stateDeltas.progression.actions
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
