#!/usr/bin/env node
const baseUrl = process.argv[2] || "http://localhost:4173";

const health = await request("/api/health");
assert(health.ok && health.version, "health endpoint should expose service status");

const assets = await request("/assets/manifest.json");
const assetCount = Object.values(assets.groups).flat().length;
assert(assetCount >= 80, "asset manifest should expose at least 80 reusable assets");

const created = await request("/api/rooms", {
  method: "POST",
  body: {
    title: "Smoke Campaign",
    tone: "mystery"
  }
});
const roomId = created.room.id;
const hostToken = created.session.hostToken;

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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
