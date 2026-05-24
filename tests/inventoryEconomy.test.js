import test from "node:test";
import assert from "node:assert/strict";
import {
  buyShopItem,
  CURRENCY,
  createInventoryEntry,
  describeInventoryEntry,
  equipmentSummary,
  formatCurrencyLabel,
  getItemDefinition,
  inventoryView,
  sellInventoryItem,
  shopView,
  valueForItem
} from "../src/core/itemCatalog.js";
import { addPlayer, createRoomState, roomSnapshot } from "../src/core/stateMachine.js";

test("inventory item details expose localized labels, values, conditions, and metadata", () => {
  const lamp = createInventoryEntry("travel-lamp", {
    condition: "pristine",
    quantity: 2,
    instanceId: "lamp-detail"
  });

  const view = describeInventoryEntry(lamp, "zh");

  assert.equal(view.id, "lamp-detail");
  assert.equal(view.quantity, 2);
  assert.equal(view.definition.label, "旅行提灯");
  assert.equal(view.definition.categoryLabel, "工具");
  assert.equal(view.conditionLabel, "崭新");
  assert.equal(view.value, valueForItem(getItemDefinition("travel-lamp"), "pristine"));
  assert.equal(view.valueLabel, `${view.value} ${CURRENCY.name.zh}`);
  assert.equal(view.tradeable, true);
  assert.equal(view.sellable, true);
  assert.equal(view.usable, false);
  assert.equal(view.definition.assetRef.semanticKey, "lamp");

  const [legacyStaff] = inventoryView(["Oak Staff"], "en");
  assert.equal(legacyStaff.itemId, "staff");
  assert.equal(legacyStaff.definition.label, "Oak Staff");
  assert.equal(typeof legacyStaff.value, "number");
  assert.equal(legacyStaff.valueLabel, `${legacyStaff.value} ${CURRENCY.symbol}`);
  assert.equal(legacyStaff.currency, CURRENCY.id);
});

test("room snapshots hydrate legacy string inventory into structured player inventory", () => {
  const room = createRoomState({ title: "Legacy Inventory" });
  const player = addPlayer(room, {
    playerName: "Yixuan",
    characterName: "Lio"
  });
  player.character.inventory = ["Oak Staff", "field-notebook"];

  const snapshot = roomSnapshot(room);
  const inventory = snapshot.players[0].character.inventory;

  assert.equal(inventory.some((entry) => typeof entry === "string"), false);

  const staff = inventory.find((entry) => entry.itemId === "staff");
  assert.ok(staff);
  assert.equal(staff.currency, CURRENCY.id);
  assert.equal(typeof staff.value, "number");
  assert.equal(staff.tradeable, true);
  assert.equal(staff.sellable, true);

  const notebook = inventory.find((entry) => entry.itemId === "field-notebook");
  assert.ok(notebook);
  assert.equal(notebook.tradeable, false);
  assert.equal(notebook.sellable, false);
  assert.equal(notebook.usable, false);
});

test("room snapshots expose equipment slot summaries from hydrated inventory", () => {
  const room = createRoomState({ title: "Equipment Summary", language: "zh" });
  const player = addPlayer(room, {
    playerName: "Yixuan",
    characterName: "Lio",
    classId: "warrior"
  });

  const snapshot = roomSnapshot(room);
  const summary = snapshot.players[0].character.equipmentSummary;

  assert.equal(summary.slots.mainHand.label, "主手");
  assert.equal(summary.slots.mainHand.item.itemId, "longsword");
  assert.equal(summary.slots.offHand.item.itemId, "shield");
  assert.equal(summary.slots.body.item.itemId, "chainmail");
  assert.deepEqual(
    equipmentSummary(player.character.inventory, "zh").equippedItemIds.sort(),
    summary.equippedItemIds.sort()
  );
});

test("market economy keeps wallet, quantity, repeated buys, payouts, and labels consistent", () => {
  const englishShop = shopView("en");
  const chineseShop = shopView("zh");
  const englishDraught = englishShop.find((entry) => entry.itemId === "healing-draught");
  const chineseDraught = chineseShop.find((entry) => entry.itemId === "healing-draught");

  assert.ok(englishDraught);
  assert.ok(chineseDraught);
  assert.equal(englishDraught.price, chineseDraught.price);
  assert.equal(englishDraught.quantity, 4);
  assert.equal(chineseDraught.quantity, englishDraught.quantity);
  assert.equal(englishDraught.purchasable, true);
  assert.equal(englishDraught.canBuy, true);
  assert.equal(englishDraught.stock, 4);
  assert.equal(englishDraught.purchaseRestriction, "");
  assert.equal(englishDraught.priceLabel, formatCurrencyLabel(englishDraught.price, "en"));
  assert.equal(chineseDraught.priceLabel, formatCurrencyLabel(chineseDraught.price, "zh"));
  assert.match(englishDraught.priceLabel, / CR$/);
  assert.match(chineseDraught.priceLabel, / 克朗$/);

  const player = {
    id: "market-buyer",
    character: {
      wallet: englishDraught.price * 3,
      inventory: []
    }
  };

  const firstBuy = buyShopItem(player, "healing-draught", "en");
  const secondBuy = buyShopItem(player, "healing-draught", "zh");
  const purchased = player.character.inventory.filter((entry) => entry.itemId === "healing-draught" && entry.source === "shop");

  assert.equal(firstBuy.price, englishDraught.price);
  assert.equal(secondBuy.price, englishDraught.price);
  assert.equal(firstBuy.priceLabel, englishDraught.priceLabel);
  assert.equal(secondBuy.priceLabel, chineseDraught.priceLabel);
  assert.equal(player.character.wallet, englishDraught.price);
  assert.equal(purchased.length, 2);
  assert.equal(new Set(purchased.map((entry) => entry.id)).size, 2);
  assert.deepEqual(purchased.map((entry) => entry.quantity), [1, 1]);
  assert.deepEqual(firstBuy.stateDeltas.inventory, [{
    id: purchased[0].id,
    itemId: "healing-draught",
    quantityDelta: 1
  }]);
  assert.deepEqual(secondBuy.stateDeltas.inventory, [{
    id: purchased[1].id,
    itemId: "healing-draught",
    quantityDelta: 1
  }]);

  const sale = sellInventoryItem(player, purchased[0].id, "zh");
  const expectedPayout = Math.max(1, Math.floor(purchased[0].value * 0.55));

  assert.equal(sale.payout, expectedPayout);
  assert.equal(sale.payoutLabel, formatCurrencyLabel(expectedPayout, "zh"));
  assert.equal(player.character.wallet, englishDraught.price + expectedPayout);
  assert.equal(player.character.inventory.some((entry) => entry.id === purchased[0].id), false);
  assert.equal(player.character.inventory.find((entry) => entry.id === purchased[1].id).quantity, 1);
  assert.deepEqual(sale.stateDeltas.inventory, [{
    id: purchased[0].id,
    itemId: "healing-draught",
    quantityDelta: -1
  }]);
  assert.equal(shopView("en").find((entry) => entry.itemId === "healing-draught").quantity, englishDraught.quantity);
});
