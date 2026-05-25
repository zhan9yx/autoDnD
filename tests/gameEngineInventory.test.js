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
  assert.equal(player.character.xp, 0);
  assert.equal(player.character.level, 1);
  assert.equal(player.character.memo, "");
  assert.equal(player.character.inventory.some((entry) => typeof entry === "string"), false);

  const travelLamp = player.character.inventory.find((entry) => entry.itemId === "travel-lamp");
  assert.ok(travelLamp);
  assert.equal(travelLamp.currency, "coin");
  assert.equal(travelLamp.tradeable, true);
  assert.equal(travelLamp.sellable, true);
  assert.equal(typeof travelLamp.value, "number");
  assert.equal(travelLamp.source, "starting");

  const notebook = player.character.inventory.find((entry) => entry.itemId === "field-notebook");
  assert.ok(notebook);
  assert.equal(notebook.tradeable, false);
  assert.equal(notebook.sellable, false);
  assert.equal(notebook.usable, false);

  assert.equal(player.character.equipmentSummary.slots.mainHand.item.itemId, "longsword");
  assert.equal(player.character.equipmentSummary.slots.offHand.item.itemId, "shield");
});

test("engine market buy and sell update wallet, inventory, and economy transcript", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom();
  const market = await engine.getMarket(roomId);
  const offer = market.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.ok(offer);
  assert.match(offer.priceLabel, / CR$/);
  assert.equal(offer.purchasable, true);
  assert.equal(offer.canBuy, true);
  assert.equal(offer.availableQuantity, 1);
  assert.equal(offer.stock, offer.quantity);

  const beforeBuy = await engine.getRoom(roomId);
  const bought = await engine.buyItem(roomId, {
    playerId,
    itemId: "storm-lantern",
    expectedVersion: beforeBuy.version
  });

  assert.equal(bought.round, beforeBuy.round);
  assert.equal(bought.activePlayerId, beforeBuy.activePlayerId);
  assert.ok(bought.version > beforeBuy.version);
  const buyer = bought.players[0];
  const purchased = buyer.character.inventory.find((entry) => entry.itemId === "storm-lantern" && entry.source === "shop");
  assert.ok(purchased);
  assert.equal(buyer.character.wallet, 120 - offer.price);
  assert.equal(bought.transcript.at(-1).type, "economy");
  assert.equal(bought.transcript.at(-1).economy.action, "buy");
  assert.equal(bought.transcript.at(-1).economy.turnCost, "free-time");
  assert.match(bought.transcript.at(-1).text, /Storm Lantern/);
  assert.match(bought.transcript.at(-1).structuredLog.metadata.itemLabel, /Storm Lantern/);
  assert.equal(bought.transcript.at(-1).economy.price, offer.price);
  assert.equal(bought.transcript.at(-1).economy.priceLabel, `${offer.price} CR`);
  assert.equal(bought.transcript.at(-1).economy.stateDeltas.wallet, -offer.price);
  assert.deepEqual(bought.transcript.at(-1).economy.stateDeltas.inventory, [{
    id: purchased.id,
    itemId: "storm-lantern",
    quantityDelta: 1
  }]);
  assert.deepEqual(bought.transcript.at(-1).economy.stateDeltas.stock, [{
    itemId: "storm-lantern",
    quantityDelta: -1
  }]);
  const marketAfterBuy = await engine.getMarket(roomId);
  const offerAfterBuy = marketAfterBuy.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.equal(offerAfterBuy.quantity, offer.quantity);
  assert.equal(offerAfterBuy.stock, offer.stock);
  assert.equal(offerAfterBuy.availableQuantity, offer.availableQuantity);

  const sold = await engine.sellItem(roomId, {
    playerId,
    itemId: purchased.id,
    expectedVersion: bought.version
  });

  assert.equal(sold.round, beforeBuy.round);
  assert.equal(sold.activePlayerId, beforeBuy.activePlayerId);
  assert.ok(sold.version > bought.version);
  const seller = sold.players[0];
  const expectedPayout = Math.max(1, Math.floor(purchased.value * 0.55));
  assert.equal(seller.character.wallet, 120 - offer.price + expectedPayout);
  assert.equal(seller.character.inventory.some((entry) => entry.id === purchased.id), false);
  assert.equal(sold.transcript.at(-1).type, "economy");
  assert.equal(sold.transcript.at(-1).economy.action, "sell");
  assert.equal(sold.transcript.at(-1).economy.turnCost, "free-time");
  assert.match(sold.transcript.at(-1).text, /Storm Lantern/);
  assert.match(sold.transcript.at(-1).structuredLog.metadata.itemLabel, /Storm Lantern/);
  assert.equal(sold.transcript.at(-1).economy.payout, expectedPayout);
  assert.equal(sold.transcript.at(-1).economy.payoutLabel, `${expectedPayout} CR`);
  assert.equal(sold.transcript.at(-1).economy.stateDeltas.wallet, expectedPayout);
  assert.deepEqual(sold.transcript.at(-1).economy.stateDeltas.inventory, [{
    id: purchased.id,
    itemId: "storm-lantern",
    quantityDelta: -1
  }]);
  assert.deepEqual(sold.transcript.at(-1).economy.stateDeltas.stock, [{
    itemId: "storm-lantern",
    quantityDelta: 1
  }]);
  const marketAfterSell = await engine.getMarket(roomId);
  const offerAfterSell = marketAfterSell.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.equal(offerAfterSell.quantity, offer.quantity);
  assert.equal(offerAfterSell.stock, offer.stock);
  assert.equal(offerAfterSell.availableQuantity, offer.availableQuantity);
});

test("Chinese market economy text uses localized item names and currency labels", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom({ language: "zh" });
  const market = await engine.getMarket(roomId);
  const offer = market.shop.find((entry) => entry.itemId === "storm-lantern");
  assert.ok(offer);
  assert.match(offer.priceLabel, /克朗$/);
  assert.doesNotMatch(offer.priceLabel, /\bCR\b/);

  const beforeBuy = await engine.getRoom(roomId);
  const bought = await engine.buyItem(roomId, {
    playerId,
    itemId: "storm-lantern",
    expectedVersion: beforeBuy.version
  });

  const economyEntry = bought.transcript.at(-1);
  assert.equal(economyEntry.type, "economy");
  assert.match(economyEntry.text, /暴风提灯/);
  assert.doesNotMatch(economyEntry.text, /Storm Lantern/);
  assert.match(economyEntry.text, /克朗/);
  assert.match(economyEntry.economy.priceLabel, /克朗$/);
  assert.doesNotMatch(economyEntry.economy.priceLabel, /\bCR\b/);
  assert.equal(economyEntry.structuredLog.metadata.itemLabel, "暴风提灯");
  assert.doesNotMatch(economyEntry.structuredLog.humanSummary.zh, /Storm Lantern/);

  const purchased = bought.players[0].character.inventory.find((entry) => entry.itemId === "storm-lantern" && entry.source === "shop");
  assert.ok(purchased);
  const sold = await engine.sellItem(roomId, {
    playerId,
    itemId: purchased.id,
    expectedVersion: bought.version
  });
  const sellEntry = sold.transcript.at(-1);
  assert.equal(sellEntry.type, "economy");
  assert.match(sellEntry.text, /暴风提灯/);
  assert.doesNotMatch(sellEntry.text, /Storm Lantern/);
  assert.match(sellEntry.economy.payoutLabel, /克朗$/);
  assert.doesNotMatch(sellEntry.economy.payoutLabel, /\bCR\b/);
  assert.equal(sellEntry.structuredLog.metadata.itemLabel, "暴风提灯");
});

test("Chinese use and equip transcript logs use localized item display names", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom({ language: "zh" });
  const stored = await engine.requireRoom(roomId);
  stored.players[0].character.inventory.push(createInventoryEntry("festival-wine", {
    condition: "fine",
    instanceId: "festival-wine-test",
    source: "test"
  }));
  stored.players[0].character.inventory.push(createInventoryEntry("dagger", {
    condition: "fine",
    instanceId: "dagger-zh-equip-test",
    source: "test"
  }));
  stored.players[0].character.inventory.push(createInventoryEntry("sleep-scroll", {
    condition: "fine",
    instanceId: "sleep-scroll-zh-log-test",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const beforeUse = await engine.getRoom(roomId);
  const used = await engine.useItem(roomId, {
    playerId,
    itemId: "festival-wine-test",
    expectedVersion: beforeUse.version
  });
  const useEntry = used.transcript.at(-1);
  assert.equal(useEntry.inventory.action, "use");
  assert.match(useEntry.text, /节庆红酒/);
  assert.doesNotMatch(useEntry.text, /Festival Wine/);
  assert.equal(useEntry.structuredLog.metadata.itemLabel, "节庆红酒");
  assert.doesNotMatch(useEntry.structuredLog.humanSummary.zh, /Festival Wine/);

  const equipped = await engine.equipItem(roomId, {
    playerId,
    itemId: "dagger-zh-equip-test",
    expectedVersion: used.version
  });
  const equipEntry = equipped.transcript.at(-1);
  assert.equal(equipEntry.inventory.action, "equip");
  assert.match(equipEntry.text, /匕首/);
  assert.doesNotMatch(equipEntry.text, /Dagger/);
  assert.equal(equipEntry.structuredLog.metadata.itemLabel, "匕首");
  assert.doesNotMatch(equipEntry.structuredLog.humanSummary.zh, /Dagger/);

  const learned = await engine.useItem(roomId, {
    playerId,
    itemId: "sleep-scroll-zh-log-test",
    expectedVersion: equipped.version
  });
  const spellEntry = learned.transcript.at(-1);
  assert.equal(spellEntry.type, "spell");
  assert.match(spellEntry.text, /沉眠咒/);
  assert.doesNotMatch(spellEntry.text, /sleep/);
  assert.doesNotMatch(spellEntry.structuredLog.humanSummary.zh, /sleep/);
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
  assert.equal(player.character.knownSpells.includes("sleep"), true);
  assert.equal(player.character.spellKnown.sleep, true);
  assert.equal(player.character.inventory.some((entry) => entry.id === "sleep-scroll-test"), false);
  assert.equal(used.transcript.at(-1).type, "spell");
  assert.equal(used.transcript.at(-1).inventory.action, "use");
  assert.equal(used.transcript.at(-1).inventory.learnedSpell, "sleep");
  assert.equal(used.transcript.at(-1).inventory.consumed, true);
  assert.deepEqual(used.transcript.at(-1).inventory.stateDeltas.learnedSpells, ["sleep"]);
});

test("engine rejects an already-known spell scroll without consuming it", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom({ classId: "mage" });
  const stored = await engine.requireRoom(roomId);
  stored.players[0].character.inventory.push(createInventoryEntry("sleep-scroll", {
    condition: "fine",
    instanceId: "known-sleep-scroll-test",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const beforeUse = await engine.getRoom(roomId);
  await assert.rejects(
    () => engine.useItem(roomId, {
      playerId,
      itemId: "known-sleep-scroll-test",
      expectedVersion: beforeUse.version
    }),
    /already known/
  );

  const afterUse = await engine.getRoom(roomId);
  assert.equal(afterUse.players[0].character.spells.includes("sleep"), true);
  assert.equal(afterUse.players[0].character.inventory.some((entry) => entry.id === "known-sleep-scroll-test"), true);
  assert.notEqual(afterUse.transcript.at(-1)?.inventory?.item?.id, "known-sleep-scroll-test");
});

test("engine item use applies bounded hp, xp, level, and inventory deltas", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom();
  const stored = await engine.requireRoom(roomId);
  stored.players[0].character.hp = 2;
  stored.players[0].character.inventory.push(createInventoryEntry("healing-draught", {
    condition: "fine",
    quantity: 2,
    instanceId: "draught-stack",
    source: "test"
  }));
  stored.players[0].character.inventory.push(createInventoryEntry("field-primer", {
    condition: "fine",
    instanceId: "primer-test",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const beforeHeal = await engine.getRoom(roomId);
  const healed = await engine.useItem(roomId, {
    playerId,
    itemId: "draught-stack",
    expectedVersion: beforeHeal.version
  });

  const healedPlayer = healed.players[0];
  assert.equal(healedPlayer.character.hp, 10);
  assert.equal(healedPlayer.character.inventory.find((entry) => entry.id === "draught-stack").quantity, 1);
  assert.equal(healed.transcript.at(-1).inventory.stateDeltas.hp, 8);

  const progressed = await engine.useItem(roomId, {
    playerId,
    itemId: "primer-test",
    expectedVersion: healed.version
  });

  assert.equal(progressed.players[0].character.xp, 120);
  assert.equal(progressed.players[0].character.level, 2);
  assert.equal(progressed.transcript.at(-1).inventory.stateDeltas.xp, 120);
  assert.equal(progressed.transcript.at(-1).inventory.stateDeltas.level, 1);
});

test("engine equip replaces occupied slots without wallet or quantity drift", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom();
  const stored = await engine.requireRoom(roomId);
  stored.players[0].character.inventory.push(createInventoryEntry("dagger", {
    condition: "fine",
    instanceId: "dagger-equip-test",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const beforeEquip = await engine.getRoom(roomId);
  const quantityBefore = beforeEquip.players[0].character.inventory.reduce((sum, entry) => sum + entry.quantity, 0);
  const equipped = await engine.equipItem(roomId, {
    playerId,
    itemId: "dagger-equip-test",
    expectedVersion: beforeEquip.version
  });

  const player = equipped.players[0];
  const quantityAfter = player.character.inventory.reduce((sum, entry) => sum + entry.quantity, 0);
  assert.equal(player.character.wallet, beforeEquip.players[0].character.wallet);
  assert.equal(quantityAfter, quantityBefore);
  assert.equal(player.character.equipmentSummary.slots.mainHand.item.itemId, "dagger");
  assert.equal(player.character.inventory.find((entry) => entry.itemId === "longsword").equipped, false);
  assert.equal(equipped.transcript.at(-1).inventory.action, "equip");
  assert.equal(equipped.transcript.at(-1).text, "Lio equipped Dagger.");
  assert.deepEqual(equipped.transcript.at(-1).inventory.stateDeltas.equipment, {
    equipped: ["dagger"],
    unequipped: ["longsword"]
  });
});

test("engine equip targets the selected duplicate equipment instance in summary", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom();
  const stored = await engine.requireRoom(roomId);
  stored.players[0].character.inventory.push(createInventoryEntry("dagger", {
    condition: "fine",
    instanceId: "dagger-duplicate-a",
    source: "test"
  }));
  stored.players[0].character.inventory.push(createInventoryEntry("dagger", {
    condition: "fine",
    instanceId: "dagger-duplicate-b",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const beforeEquip = await engine.getRoom(roomId);
  const equipped = await engine.equipItem(roomId, {
    playerId,
    itemId: "dagger-duplicate-b",
    expectedVersion: beforeEquip.version
  });

  const player = equipped.players[0];
  assert.equal(player.character.equipmentSummary.slots.mainHand.item.id, "dagger-duplicate-b");
  assert.equal(player.character.equipmentSummary.slots.mainHand.item.itemId, "dagger");
  assert.equal(player.character.inventory.find((entry) => entry.id === "dagger-duplicate-a").equipped, false);
  assert.equal(player.character.inventory.find((entry) => entry.id === "dagger-duplicate-b").equipped, true);
  assert.equal(equipped.transcript.at(-1).inventory.equipment.slots.mainHand.item.id, "dagger-duplicate-b");
});

test("engine equip updates defense and localized equipment summary for armor slots", async () => {
  const { engine, roomId, playerId } = await createJoinedRoom({ language: "zh" });
  const stored = await engine.requireRoom(roomId);
  stored.players[0].character.inventory.push(createInventoryEntry("leather", {
    condition: "fine",
    instanceId: "leather-equip-test",
    source: "test"
  }));
  await engine.store.saveRoom(stored);

  const beforeEquip = await engine.getRoom(roomId);
  const beforePlayer = beforeEquip.players[0];
  const equipped = await engine.equipItem(roomId, {
    playerId,
    itemId: "leather-equip-test",
    expectedVersion: beforeEquip.version
  });

  const player = equipped.players[0];
  const event = equipped.transcript.at(-1);
  const defenseDelta = player.character.defense - beforePlayer.character.defense;
  assert.equal(defenseDelta < 0, true);
  assert.equal(player.character.equipmentSummary.slots.body.label, "身体");
  assert.equal(player.character.equipmentSummary.slots.body.item.itemId, "leather");
  assert.equal(player.character.equipmentSummary.slots.body.item.definition.label, "皮甲");
  assert.equal(player.character.inventory.find((entry) => entry.itemId === "chainmail").equipped, false);
  assert.equal(event.inventory.action, "equip");
  assert.equal(event.text, "Lio装备了皮甲。");
  assert.equal(event.inventory.stateDeltas.defense, defenseDelta);
  assert.deepEqual(event.inventory.stateDeltas.equipment, {
    equipped: ["leather"],
    unequipped: ["chainmail"]
  });
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

test("successful reward actions add generated item entries to inventory with localized reward logs", async () => {
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const { engine, roomId, playerId } = await createJoinedRoom({ language: "zh" });
    const beforeAction = await engine.getRoom(roomId);

    const acted = await engine.submitAction(roomId, {
      playerId,
      text: "小心打开档案馆旧匣并拿起战利品",
      expectedVersion: beforeAction.version
    });

    const rewardEntry = acted.transcript.at(-1);
    assert.equal(rewardEntry.type, "reward");

    const rewardItemId = `generated:${rewardEntry.reward.semanticKey || rewardEntry.reward.id}`;
    const rewardItem = acted.players[0].character.inventory.find((entry) => entry.itemId === rewardItemId);
    assert.ok(rewardItem);
    assert.equal(rewardItem.source, "source-old-coffer");
    assert.equal(rewardItem.tradeable, true);
    assert.equal(rewardItem.sellable, true);
    assert.equal(rewardItem.currency, "coin");
    assert.equal(typeof rewardItem.value, "number");
    assert.equal(rewardItem.definitionSnapshot.assetRef.file, rewardEntry.reward.file);
    assert.equal(acted.players[0].character.inventory.some((entry) => typeof entry === "string"), false);
    assert.match(rewardEntry.text, new RegExp(rewardEntry.reward.displayName.zh));
    assert.equal(rewardEntry.structuredLog.metadata.assetName, rewardEntry.reward.displayName.zh);
  } finally {
    Math.random = originalRandom;
  }
});
