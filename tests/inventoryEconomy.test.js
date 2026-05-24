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
  useInventoryItem,
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
  assert.equal(view.rarity, "common");
  assert.equal(view.rarityLabel, "常见");
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

test("sheet 029 item definitions enter inventory, equipment, and localized detail flows", () => {
  const armor = createInventoryEntry("blackthorn-warplate", {
    condition: "worn",
    instanceId: "warplate-detail"
  });
  const signet = createInventoryEntry("skyglass-signet", {
    condition: "pristine",
    instanceId: "signet-detail",
    equipped: true
  });
  const ampoule = createInventoryEntry("bitterleaf-ampoule", {
    condition: "fine",
    instanceId: "ampoule-detail"
  });

  const [armorView, signetView, ampouleView] = inventoryView([armor, signet, ampoule], "zh");

  assert.equal(armorView.definition.label, "黑棘战甲");
  assert.equal(armorView.definition.slot, "body");
  assert.equal(armorView.definition.assetRef.file, "assets/generated/items/aidm-inventory-expansion-029-03.png");
  assert.equal(signetView.definition.label, "天玻璃印戒");
  assert.equal(signetView.definition.slotLabel, "饰品");
  assert.equal(ampouleView.usable, true);
  assert.equal(ampouleView.definition.useEffect.type, "restore-mana");
  assert.match(ampouleView.definition.descriptionText, /苦涩一口/);

  const summary = equipmentSummary([armor, signet, ampoule], "zh");
  assert.equal(summary.slots.accessory.item.itemId, "skyglass-signet");
  assert.equal(summary.emptySlots.includes("accessory"), false);
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
  assert.equal(englishDraught.rarityLabel, "Common");
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

test("sheet 029 market goods keep stock, pricing, purchase, use, and sale consistent", () => {
  const market = shopView("en");
  const ampouleOffer = market.find((entry) => entry.itemId === "bitterleaf-ampoule");
  const luteOffer = market.find((entry) => entry.itemId === "pearwood-lute");

  assert.ok(ampouleOffer);
  assert.ok(luteOffer);
  assert.equal(ampouleOffer.quantity, 3);
  assert.equal(ampouleOffer.canBuy, true);
  assert.equal(ampouleOffer.definition.assetRef.file, "assets/generated/items/aidm-inventory-expansion-029-11.png");
  assert.equal(luteOffer.definition.categoryLabel, "Tool");
  assert.equal(market.find((entry) => entry.itemId === "skyglass-signet").rarityLabel, "Uncommon");

  const player = {
    id: "sheet-029-buyer",
    character: {
      wallet: ampouleOffer.price + luteOffer.price,
      mana: 0,
      maxMana: 6,
      inventory: []
    }
  };

  const boughtAmpoule = buyShopItem(player, "bitterleaf-ampoule", "zh");
  const boughtLute = buyShopItem(player, "pearwood-lute", "en");

  assert.equal(boughtAmpoule.item.definition.label, "苦叶安瓿");
  assert.equal(boughtAmpoule.item.usable, true);
  assert.equal(boughtLute.item.definition.assetRef.file, "assets/generated/items/aidm-inventory-expansion-029-64.png");
  assert.equal(player.character.wallet, 0);

  const used = player.character.inventory.find((entry) => entry.itemId === "bitterleaf-ampoule");
  const restored = useInventoryItem(player, used.id, "en");
  assert.equal(restored.stateDeltas.mana, 4);
  assert.equal(player.character.inventory.some((entry) => entry.id === used.id), false);

  const lute = player.character.inventory.find((entry) => entry.itemId === "pearwood-lute");
  const sold = sellInventoryItem(player, lute.id, "zh");
  assert.equal(sold.item.definition.label, "梨木鲁特琴");
  assert.equal(sold.payout, Math.max(1, Math.floor(lute.value * 0.55)));
  assert.equal(player.character.inventory.length, 0);
});

test("sheet 030 market goods keep stock, equipment slots, and sale values consistent", () => {
  const market = shopView("en");
  const shieldOffer = market.find((entry) => entry.itemId === "lionward-shield");
  const crownOffer = market.find((entry) => entry.itemId === "azure-court-crown");
  const lockpickOffer = market.find((entry) => entry.itemId === "lockpick-roll");
  const compassOffer = market.find((entry) => entry.itemId === "brass-mariner-compass");

  assert.ok(shieldOffer);
  assert.ok(crownOffer);
  assert.ok(lockpickOffer);
  assert.ok(compassOffer);
  assert.equal(shieldOffer.definition.assetRef.file, "assets/generated/items/aidm-inventory-expansion-030-10.png");
  assert.equal(shieldOffer.definition.slot, "offHand");
  assert.equal(crownOffer.rarityLabel, "Rare");
  assert.equal(lockpickOffer.quantity, 2);
  assert.equal(compassOffer.condition, "worn");

  const player = {
    id: "sheet-030-buyer",
    character: {
      wallet: shieldOffer.price + lockpickOffer.price,
      inventory: []
    }
  };

  const boughtShield = buyShopItem(player, "lionward-shield", "zh");
  const boughtLockpicks = buyShopItem(player, "lockpick-roll", "en");

  assert.equal(boughtShield.item.definition.label, "狮纹守盾");
  assert.equal(boughtShield.item.slot, "offHand");
  assert.equal(boughtLockpicks.item.definition.assetRef.file, "assets/generated/items/aidm-inventory-expansion-030-45.png");
  assert.equal(player.character.wallet, 0);

  const shield = player.character.inventory.find((entry) => entry.itemId === "lionward-shield");
  const sold = sellInventoryItem(player, shield.id, "zh");
  assert.equal(sold.item.definition.label, "狮纹守盾");
  assert.equal(sold.payout, Math.max(1, Math.floor(shield.value * 0.55)));
  assert.equal(player.character.inventory.some((entry) => entry.itemId === "lionward-shield"), false);
});
