import test from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../src/core/gameEngine.js";
import { createInventoryEntry } from "../src/core/itemCatalog.js";
import { MemoryRoomStore } from "../src/core/storage.js";

async function createJoinedRoom(input = {}) {
  const engine = new GameEngine({ store: new MemoryRoomStore() });
  const room = await engine.createRoom({ title: input.title || "Inventory Test", language: input.language || "en" });
  const joined = await engine.joinRoom(room.id, {
    playerName: "Yixuan",
    characterName: "Lio",
    classId: input.classId || "warrior"
  });
  return {
    engine,
    roomId: room.id,
    playerId: joined.player.id
  };
}

test("joining a room creates structured starting inventory and wallet state", async () => {
  const { engine, roomId } = await createJoinedRoom();
  const room = await engine.getRoom(roomId);
  const player = room.players[0];

  assert.equal(player.character.wallet, 120);
  assert.equal(player.character.memo, "");
  assert.equal(player.character.inventory.some((entry) => typeof entry === "string"), false);

  const travelLamp = player.character.inventory.find((entry) => entry.itemId === "travel-lamp");
  assert.ok(travelLamp);
  assert.equal(travelLamp.currency, "coin");
  assert.equal(travelLamp.tradeable, true);
  assert.equal(typeof travelLamp.value, "number");
  assert.equal(travelLamp.source, "starting");

  const notebook = player.character.inventory.find((entry) => entry.itemId === "field-notebook");
  assert.ok(notebook);
  assert.equal(notebook.tradeable, false);
  assert.equal(notebook.usable, false);
});

test("engine market buy and sell update wallet, inventory, and economy transcript", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom();
  const market = await engine.getMarket(roomId);
  const offer = market.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.ok(offer);

  const beforeBuy = await engine.getRoom(roomId);
  const bought = await engine.buyItem(roomId, {
    playerId,
    itemId: "storm-lantern",
    expectedVersion: beforeBuy.version
  });

  const buyer = bought.players[0];
  const purchased = buyer.character.inventory.find((entry) => entry.itemId === "storm-lantern" && entry.source === "shop");
  assert.ok(purchased);
  assert.equal(buyer.character.wallet, 120 - offer.price);
  assert.equal(bought.transcript.at(-1).type, "economy");
  assert.equal(bought.transcript.at(-1).economy.action, "buy");
  assert.equal(bought.transcript.at(-1).economy.price, offer.price);

  const sold = await engine.sellItem(roomId, {
    playerId,
    itemId: purchased.id,
    expectedVersion: bought.version
  });

  const seller = sold.players[0];
  const expectedPayout = Math.max(1, Math.floor(purchased.value * 0.55));
  assert.equal(seller.character.wallet, 120 - offer.price + expectedPayout);
  assert.equal(seller.character.inventory.some((entry) => entry.id === purchased.id), false);
  assert.equal(sold.transcript.at(-1).type, "economy");
  assert.equal(sold.transcript.at(-1).economy.action, "sell");
  assert.equal(sold.transcript.at(-1).economy.payout, expectedPayout);
});

test("using a spell scroll learns the spell and consumes the inventory entry", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom();
  const stored = await engine.requireRoom(roomId);
  stored.players[0].character.inventory.push(createInventoryEntry("sleep-scroll", {
    condition: "fine",
    instanceId: "sleep-scroll-test",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const beforeUse = await engine.getRoom(roomId);
  const used = await engine.useItem(roomId, {
    playerId,
    itemId: "sleep-scroll-test",
    expectedVersion: beforeUse.version
  });

  const player = used.players[0];
  assert.equal(player.character.spells.includes("sleep"), true);
  assert.equal(player.character.inventory.some((entry) => entry.id === "sleep-scroll-test"), false);
  assert.equal(used.transcript.at(-1).type, "spell");
  assert.equal(used.transcript.at(-1).inventory.action, "use");
  assert.equal(used.transcript.at(-1).inventory.learnedSpell, "sleep");
  assert.equal(used.transcript.at(-1).inventory.consumed, true);
});

test("saving a memo trims text and updates the owner memo record", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom();
  const longMemo = `  ${"clue ".repeat(260)}  `;
  const beforeSave = await engine.getRoom(roomId);

  const saved = await engine.saveMemo(roomId, {
    playerId,
    text: longMemo,
    expectedVersion: beforeSave.version
  });

  assert.equal(saved.players[0].character.memo.length, 1200);
  assert.equal(saved.memos.length, 1);
  assert.equal(saved.memos[0].authorPlayerId, playerId);
  assert.equal(saved.memos[0].visibility, "owner");
  assert.equal(saved.memos[0].text.length, 1200);
  assert.equal(saved.transcript.at(-1).type, "system");
  assert.deepEqual(saved.transcript.at(-1).visibility, {
    scope: "owner",
    playerIds: [playerId]
  });
  assert.deepEqual(saved.transcript.at(-1).memo, {
    action: "save",
    length: 1200
  });

  const updated = await engine.saveMemo(roomId, {
    playerId,
    text: "short clue",
    expectedVersion: saved.version
  });

  assert.equal(updated.players[0].character.memo, "short clue");
  assert.equal(updated.memos.length, 1);
  assert.equal(updated.memos[0].text, "short clue");
});

test("successful reward actions add generated item entries to inventory", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const { engine, roomId, playerId } = await createJoinedRoom();
    const beforeAction = await engine.getRoom(roomId);

    const acted = await engine.submitAction(roomId, {
      playerId,
      text: "carefully open the old coffer and take the treasure",
      expectedVersion: beforeAction.version
    });

    const rewardEntry = acted.transcript.at(-1);
    assert.equal(rewardEntry.type, "reward");

    const rewardItemId = `generated:${rewardEntry.reward.semanticKey || rewardEntry.reward.id}`;
    const rewardItem = acted.players[0].character.inventory.find((entry) => entry.itemId === rewardItemId);
    assert.ok(rewardItem);
    assert.equal(rewardItem.source, "source-old-coffer");
    assert.equal(rewardItem.tradeable, true);
    assert.equal(rewardItem.currency, "coin");
    assert.equal(typeof rewardItem.value, "number");
    assert.equal(rewardItem.definitionSnapshot.assetRef.file, rewardEntry.reward.file);
    assert.equal(acted.players[0].character.inventory.some((entry) => typeof entry === "string"), false);
  } finally {
    Math.random = originalRandom;
  }
});
