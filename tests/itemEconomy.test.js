import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENCY,
  ITEM_ECONOMY,
  ITEM_LOOT_POOLS,
  ITEM_PRICING_RULES,
  buyShopItem,
  catalogValue,
  chooseLootItemId,
  createCatalogReward,
  createInventoryEntry,
  describeInventoryEntry,
  formatCurrencyLabel,
  getItemDefinition,
  shopView,
  sellInventoryItem
} from "../src/core/itemCatalog.js";
import { GameEngine } from "../src/core/gameEngine.js";
import { MemoryRoomStore } from "../src/core/storage.js";

test("mapped cutout catalog items expose art, economy fields, and bounded resale values", () => {
  const mappedItems = [
    ["iron-longsword", "weapon", "mainHand", "assets/generated/items/aidm-weapon-cutout-052-01.png"],
    ["studded-leather-armor", "armor", "body", "assets/generated/items/aidm-armor-outfit-cutout-053-03.png"],
    ["minor-healing-potion", "consumable", null, "assets/generated/items/aidm-consumable-provision-054-01.png"],
    ["magnifying-lens", "tool", null, "assets/generated/items/aidm-tool-clue-055-03.png"],
    ["locked-coffer", "tradeGood", null, "assets/generated/items/aidm-treasure-material-056-64.png"],
    ["field-primer", "consumable", null, "assets/generated/items/aidm-tool-clue-055-25.png"]
  ];

  assert.equal(ITEM_PRICING_RULES.consumableDiscount < 1, true);
  assert.equal(catalogValue({ category: "consumable", utility: "standard", consumable: true }), getItemDefinition("minor-healing-potion").baseValue);

  for (const [itemId, category, slot, file] of mappedItems) {
    const definition = getItemDefinition(itemId);
    const view = describeInventoryEntry(createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-mapped` }), "zh");

    assert.equal(definition.category, category);
    assert.equal(definition.slot || null, slot);
    assert.equal(definition.assetRef.file, file);
    assert.equal(definition.assetRef.semanticKey.startsWith("items."), true);
    assert.equal(view.definition.assetRef.file, file);
    assert.equal(view.definition.descriptionText.length >= 16, true);
    assert.equal(view.currency, CURRENCY.id);
    assert.equal(view.value > 0 && view.value < 700, true, `${itemId} value should stay in a playable range`);
    assert.equal(view.saleValue, Math.floor(view.value * ITEM_ECONOMY.sellbackRate));
    assert.equal(view.saleValue >= Math.floor(view.value * 0.4), true);
    assert.equal(view.saleValue <= Math.ceil(view.value * 0.6), true);
  }
});

test("new mapped shop offers can be bought and sold with markup and sellback rules", () => {
  const market = shopView("en");
  const offerIds = ["iron-longsword", "studded-leather-armor", "minor-healing-potion", "mana-tonic", "magnifying-lens", "grappling-hook"];
  const offers = offerIds.map((itemId) => market.find((entry) => entry.itemId === itemId));

  assert.equal(offers.every(Boolean), true);
  for (const offer of offers) {
    assert.equal(offer.price, Math.ceil(offer.value * ITEM_ECONOMY.shopMarkup));
    assert.equal(offer.saleValue, Math.floor(offer.value * ITEM_ECONOMY.sellbackRate));
    assert.equal(offer.price > offer.saleValue, true);
    assert.equal(offer.priceLabel, formatCurrencyLabel(offer.price, "en"));
    assert.equal(offer.price > 0 && offer.price < 350, true, `${offer.itemId} price should not be extreme`);
  }

  const swordOffer = market.find((entry) => entry.itemId === "iron-longsword");
  const lensOffer = market.find((entry) => entry.itemId === "magnifying-lens");
  const player = {
    id: "mapped-market-buyer",
    character: {
      wallet: swordOffer.price + lensOffer.price,
      inventory: []
    }
  };

  const boughtSword = buyShopItem(player, "iron-longsword", "zh");
  const boughtLens = buyShopItem(player, "magnifying-lens", "en");

  assert.equal(boughtSword.item.definition.label, "铁制长剑");
  assert.equal(boughtSword.item.definition.assetRef.file, "assets/generated/items/aidm-weapon-cutout-052-01.png");
  assert.equal(boughtLens.item.definition.assetRef.file, "assets/generated/items/aidm-tool-clue-055-03.png");
  assert.equal(player.character.wallet, 0);

  const soldLens = sellInventoryItem(player, boughtLens.item.id, "zh");
  assert.equal(soldLens.payout, Math.floor(boughtLens.item.value * ITEM_ECONOMY.sellbackRate));
  assert.equal(soldLens.payoutLabel, formatCurrencyLabel(soldLens.payout, "zh"));
  assert.equal(player.character.wallet, soldLens.payout);
});

test("scene catalog loot pools are deterministic, contextual, and add display-ready items to inventory", async () => {
  for (const [poolId, items] of Object.entries(ITEM_LOOT_POOLS)) {
    assert.equal(items.length > 0, true, `${poolId} should have at least one item`);
    const chosen = chooseLootItemId(poolId, { sourceId: `source-${poolId}`, actionText: "search the cache" });
    assert.equal(items.includes(chosen), true, `${poolId} should choose from its bounded pool`);
  }

  const previewReward = createCatalogReward("locked-coffer", {
    language: "en",
    poolId: "dungeon",
    source: { id: "source-dungeon-vault" }
  });
  assert.equal(previewReward.itemId, "locked-coffer");
  assert.equal(previewReward.file, "assets/generated/items/aidm-treasure-material-056-64.png");
  assert.equal(previewReward.price > previewReward.saleValue, true);

  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const engine = new GameEngine({ store: new MemoryRoomStore() });
    const room = await engine.createRoom({ title: "Market Loot" });
    const joined = await engine.joinRoom(room.id, {
      playerName: "Yixuan",
      characterName: "Lio"
    });
    await engine.startRoom(room.id);
    const started = await engine.getRoom(room.id);

    const acted = await engine.submitAction(room.id, {
      playerId: joined.player.id,
      text: "follow the market street and search the vendor ledger stall drawer",
      expectedVersion: started.version
    });

    assert.equal(acted.scene.lastShiftReason, "market-action");
    const rewardEntry = acted.transcript.at(-1);
    assert.equal(rewardEntry.type, "reward");
    assert.equal(rewardEntry.reward.source.id, "source-vendor-ledger");
    assert.equal(rewardEntry.reward.lootPool, "market");
    assert.equal(ITEM_LOOT_POOLS.market.includes(rewardEntry.reward.itemId), true);
    assert.equal(rewardEntry.reward.file.endsWith(".png"), true);

    const inventoryEntry = acted.players[0].character.inventory.find((entry) => entry.itemId === rewardEntry.reward.itemId);
    assert.ok(inventoryEntry);
    assert.equal(inventoryEntry.source, "source-vendor-ledger");
    assert.equal(typeof inventoryEntry.value, "number");
    assert.equal(inventoryEntry.currency, CURRENCY.id);
    assert.equal(inventoryEntry.definitionSnapshot, undefined);
  } finally {
    Math.random = originalRandom;
  }
});
