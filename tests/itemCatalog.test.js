import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { assetBinaryDelivery, isGeneratedRasterAssetFile } from "../src/core/assets.js";
import {
  CURRENCY,
  EQUIPMENT_SLOTS,
  ITEM_CATALOG,
  ITEM_ECONOMY,
  ITEM_RARITIES,
  buyShopItem,
  createAssetInventoryEntry,
  createInventoryEntry,
  describeActionEquipmentInfluence,
  describeShopOfferAvailability,
  describeInventoryEntry,
  equipInventoryItem,
  equipmentSummary,
  getItemDefinition,
  hydrateInventoryEntry,
  inventoryView,
  sellInventoryItem,
  shopView,
  useInventoryItem,
  valueForItem
} from "../src/core/itemCatalog.js";

test("catalog exposes localized definitions, scroll effects, and shop pricing", () => {
  assert.equal(ITEM_CATALOG["travel-lamp"].category, "tool");
  assert.equal(EQUIPMENT_SLOTS.mainHand.label.en, "Main hand");
  assert.equal(ITEM_RARITIES.rare.label.zh, "稀有");

  const scroll = getItemDefinition("healing-word-scroll");
  assert.equal(scroll.category, "spellScroll");
  assert.deepEqual(scroll.useEffect, {
    type: "learn-spell",
    spellId: "healing-word",
    consume: true
  });

  const shop = shopView("zh");
  const sleepScroll = shop.find((entry) => entry.itemId === "sleep-scroll");
  assert.ok(sleepScroll);
  assert.equal(sleepScroll.definition.categoryLabel, "法卷");
  assert.equal(sleepScroll.condition, "worn");
  assert.equal(sleepScroll.conditionLabel, "磨损");
  assert.equal(sleepScroll.rarity, "uncommon");
  assert.equal(sleepScroll.rarityLabel, "少见");
  assert.equal(sleepScroll.definition.rarityLabel, "少见");
  assert.equal(sleepScroll.price, Math.ceil(sleepScroll.value * 1.25));
  assert.equal(sleepScroll.priceLabel, `${sleepScroll.price} ${CURRENCY.name.zh}`);
  assert.equal(sleepScroll.priceRole, "purchase-price");
  assert.equal(sleepScroll.priceRoleLabel, "购买价格");
  assert.equal(sleepScroll.economy.purchasePrice.label, sleepScroll.priceLabel);
  assert.equal(sleepScroll.economy.inventoryValue.label, sleepScroll.valueLabel);
  assert.equal(sleepScroll.economy.resaleValue.label, sleepScroll.saleValueLabel);
  assert.equal(sleepScroll.sellable, true);
  assert.equal(sleepScroll.purchasable, true);
  assert.equal(sleepScroll.canBuy, true);
  assert.equal(sleepScroll.stock, 1);
  assert.equal(sleepScroll.availableQuantity, 1);
  assert.equal(sleepScroll.purchaseRestriction, "");

  const englishShop = shopView("en");
  const englishSleepScroll = englishShop.find((entry) => entry.itemId === "sleep-scroll");
  assert.ok(englishSleepScroll);
  assert.equal(englishSleepScroll.priceLabel, `${englishSleepScroll.price} ${CURRENCY.symbol}`);

  assert.ok(shop.find((entry) => entry.itemId === "healing-draught"));
  assert.ok(shop.find((entry) => entry.itemId === "firebolt-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "binding-vines-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "arcane-shield-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "radiant-bolt-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "cleanse-poison-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "frost-bind-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "glass-echo-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "storm-arc-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "thunder-step-scroll"));
  assert.ok(shop.find((entry) => entry.itemId === "bitterleaf-ampoule"));
  assert.ok(shop.find((entry) => entry.itemId === "skyglass-signet"));
  assert.ok(shop.find((entry) => entry.itemId === "tension-wrench-set"));
  assert.equal(shop.find((entry) => entry.itemId === "folded-chain-shirt").definition.slotLabel, "身体");
  assert.equal(shop.find((entry) => entry.itemId === "sealed-tea-brick").availabilityLabel, "可购买");
  assert.equal(getItemDefinition("field-primer").useEffect.type, "grant-xp");
  assert.deepEqual(getItemDefinition("cleanse-poison-scroll").useEffect, {
    type: "learn-spell",
    spellId: "cleanse-poison",
    consume: true
  });
});

test("high-value legacy runtime assets prefer generated replacements", () => {
  const cases = [
    ["leather", "assets/generated/items/aidm-wearable-cutout-023-02.png", "items.armor-body.lacquered-leather-cuirass.cutout.v01"],
    ["healing-word-scroll", "assets/generated/spells/aidm-spell-scroll-rune-057-08.png", "spells.visual.healing-word-variant.icon.v01"],
    ["sleep-scroll", "assets/generated/spells/aidm-spell-scroll-rune-057-10.png", "spells.visual.sleep-moon-variant.icon.v01"]
  ];

  for (const [itemId, file, semanticKey] of cases) {
    const definition = getItemDefinition(itemId);
    assert.equal(definition.assetRef.file, file, itemId);
    assert.equal(definition.assetRef.semanticKey, semanticKey, itemId);
    assert.equal(definition.assetRef.file.startsWith("assets/generated/"), true, itemId);
  }
});

test("market offers expose localized disabled reasons and player-specific purchase state", () => {
  const stormLantern = shopView("en").find((entry) => entry.itemId === "storm-lantern");
  assert.ok(stormLantern);

  const poorPlayer = {
    id: "poor-buyer",
    character: {
      wallet: stormLantern.price - 1,
      inventory: []
    }
  };
  const poorOffer = shopView("zh", { player: poorPlayer }).find((entry) => entry.itemId === "storm-lantern");
  assert.equal(poorOffer.canBuy, false);
  assert.equal(poorOffer.purchaseRestriction, "insufficient-funds");
  assert.equal(poorOffer.purchaseRestrictionLabel, "克朗不足");
  assert.equal(poorOffer.purchaseState.walletLabel, `${stormLantern.price - 1} 克朗`);

  const owner = {
    id: "owner-buyer",
    character: {
      wallet: stormLantern.price * 2,
      inventory: [createInventoryEntry("storm-lantern", { instanceId: "owned-lantern", source: "shop" })]
    }
  };
  const ownedOffer = shopView("zh", { player: owner }).find((entry) => entry.itemId === "storm-lantern");
  assert.equal(ownedOffer.canBuy, false);
  assert.equal(ownedOffer.purchaseRestriction, "owned");
  assert.equal(ownedOffer.availabilityLabel, "已拥有");
  assert.equal(ownedOffer.purchaseState.ownedQuantity, 1);
  assert.throws(
    () => buyShopItem(owner, "storm-lantern", "zh"),
    /already owned/
  );

  const soldOut = shopView("en", {
    stockOverrides: { "climbing-rope": 0 },
    wallet: 999
  }).find((entry) => entry.itemId === "climbing-rope");
  assert.equal(soldOut.canBuy, false);
  assert.equal(soldOut.purchaseRestriction, "sold-out");
  assert.equal(soldOut.purchaseRestrictionLabel, "Sold out");

  const locked = describeShopOfferAvailability({
    itemId: "field-notebook",
    condition: "fine",
    quantity: 1,
    purchasable: false
  }, { language: "zh", wallet: 999 });
  assert.equal(locked.canBuy, false);
  assert.equal(locked.reasonCode, "rule-locked");
  assert.equal(locked.label, "规则锁定");
});

test("catalog items bind immersive descriptions, value, condition, trade, sale, and art metadata", async () => {
  const missingAssetRefs = [];

  for (const [itemId, definition] of Object.entries(ITEM_CATALOG)) {
    assert.ok(definition.description?.en, `${itemId} missing English description`);
    assert.ok(definition.description?.zh, `${itemId} missing Chinese description`);
    assert.equal(definition.description.en.length >= 40, true, `${itemId} English description is too thin`);
    assert.equal(definition.description.zh.length >= 16, true, `${itemId} Chinese description is too thin`);
    assert.equal(Number.isFinite(definition.baseValue) && definition.baseValue > 0, true, `${itemId} missing value`);
    assert.equal(typeof (definition.tradeable !== false), "boolean", `${itemId} missing trade flag`);
    assert.equal(typeof (definition.sellable ?? definition.tradeable !== false), "boolean", `${itemId} missing sale flag`);
    assert.ok(ITEM_RARITIES[definition.rarity], `${itemId} missing rarity`);
    assert.ok(definition.assetRef?.file, `${itemId} missing asset binding`);
    try {
      await assertAssetRefDelivery(definition.assetRef, definition);
    } catch (error) {
      missingAssetRefs.push(`${itemId}: ${definition.assetRef.file} (${error.message})`);
    }

    const entry = createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-detail-test` });
    const view = describeInventoryEntry(entry, "en");
    assert.equal(view.condition, "fine");
    assert.equal(view.conditionLabel, "Fine");
    assert.equal(view.rarity, definition.rarity);
    assert.equal(view.rarityLabel, ITEM_RARITIES[definition.rarity].label.en);
    assert.equal(view.definition.rarity, definition.rarity);
    assert.equal(view.value, definition.baseValue);
    assert.equal(view.valueLabel, `${definition.baseValue} ${CURRENCY.symbol}`);
    assert.equal(view.valueRole, "inventory-value");
    assert.equal(view.valueRoleLabel, "Inventory value");
    assert.equal(view.definition.baseValue, definition.baseValue);
    assert.equal(view.definition.baseValueLabel, `${definition.baseValue} ${CURRENCY.symbol}`);
    assert.equal(view.definition.baseValueRole, "base-value");
    assert.equal(view.conditionMultiplier, 1);
    assert.equal(view.saleValue, view.sellable && view.tradeable ? Math.floor(view.value * ITEM_ECONOMY.sellbackRate) : 0);
    assert.equal(view.saleValueLabel, `${view.saleValue} ${CURRENCY.symbol}`);
    assert.equal(view.saleValueRole, "resale-value");
    assert.equal(view.actions.sell.available, view.sellable && view.tradeable);
    assert.equal(view.actions.use.available, Boolean(definition.useEffect || definition.consumable));
    assert.equal(view.actions.equip.available, Boolean(definition.slot));
    assert.equal(view.definition.descriptionText, definition.description.en);
    assert.equal(view.sellable, definition.sellable ?? definition.tradeable !== false);
    assert.equal(view.image.file, definition.assetRef.file);
    assert.equal(view.definition.image.src, definition.assetRef.file);
  }

  assert.deepEqual(missingAssetRefs, [], "catalog asset refs should resolve to committed assets or committed fallbacks");
});

async function assertAssetRefDelivery(assetRef, definition) {
  if (!isGeneratedRasterAssetFile(assetRef.file)) {
    await access(assetRef.file);
    return;
  }

  const delivery = assetBinaryDelivery(assetRef.file, {
    id: definition.id,
    semanticKey: assetRef.semanticKey,
    categoryId: definition.category
  });

  assert.equal(delivery.status, "external-pending-binary");
  assert.equal(Boolean(assetRef.fallbackFile || delivery.fallbackFile), true);
  await access(assetRef.fallbackFile || delivery.fallbackFile);
}

test("inventory entries hydrate legacy items and preserve generated reward snapshots", () => {
  const lamp = createInventoryEntry("travel-lamp", {
    condition: "pristine",
    quantity: 2,
    instanceId: "lamp-entry",
    notes: "blue glass shield"
  });

  assert.equal(lamp.id, "lamp-entry");
  assert.equal(lamp.quantity, 2);
  assert.equal(lamp.value, valueForItem(getItemDefinition("travel-lamp"), "pristine"));
  assert.equal(lamp.currency, CURRENCY.id);
  assert.equal(lamp.rarity, "common");
  assert.equal(lamp.tradeable, true);
  assert.equal(lamp.sellable, true);
  assert.equal(lamp.usable, true);
  assert.equal(lamp.slot, null);

  const hydratedLegacy = hydrateInventoryEntry("Oak Staff");
  assert.equal(hydratedLegacy.itemId, "staff");
  assert.equal(hydratedLegacy.currency, CURRENCY.id);
  assert.equal(typeof hydratedLegacy.value, "number");

  const [lampView] = inventoryView([lamp], "zh");
  assert.equal(lampView.definition.label, "旅行提灯");
  assert.equal(lampView.definition.categoryLabel, "工具");
  assert.equal(lampView.conditionLabel, "崭新");
  assert.equal(lampView.rarityLabel, "常见");
  assert.equal(lampView.valueLabel, `${lamp.value} ${CURRENCY.name.zh}`);
  assert.match(lampView.definition.assetRef.file, /storm-lantern\.svg$/);
  assert.equal(lampView.actions.use.available, true);
  assert.equal(lampView.actions.equip.available, false);
  assert.equal(lampView.actions.equip.reasonCode, "tool-not-equippable");
  assert.equal(lampView.definition.toolUse.label, "照亮黑暗路线，或检查阴影中的细节。");

  const reward = createAssetInventoryEntry({
    id: "reward-ring",
    semanticKey: "silver-ring",
    displayName: { en: "Silver Ring", zh: "银戒" },
    categoryId: "equipment",
    file: "assets/generated/items/silver-ring.png",
    variantAxes: { rarity: "rare", condition: "masterwork" },
    tags: ["ring"],
    soundscapeHints: ["market"]
  }, {
    instanceId: "reward-entry",
    source: "source-old-coffer"
  });

  assert.equal(reward.id, "reward-entry");
  assert.equal(reward.itemId, "generated:silver-ring");
  assert.equal(reward.source, "source-old-coffer");
  assert.equal(reward.rarity, "rare");
  assert.equal(reward.definitionSnapshot.rarity, "rare");
  assert.equal(reward.value, 252);
  assert.equal(reward.definitionSnapshot.assetRef.file, "assets/generated/items/silver-ring.png");

  const rewardView = describeInventoryEntry(reward, "zh");
  assert.equal(rewardView.definition.label, "银戒");
  assert.equal(rewardView.definition.category, "tradeGood");
  assert.equal(rewardView.conditionLabel, "精工");
  assert.equal(rewardView.rarityLabel, "稀有");

  const weaponReward = createAssetInventoryEntry({
    id: "aidm-weapon-014-04",
    semanticKey: "items.dagger.glassfang-dagger.v01",
    displayName: { en: "Glassfang Dagger", zh: "玻璃牙匕首" },
    categoryId: "equipment",
    file: "assets/generated/weapons/aidm-weapon-014-04.png",
    gameplayBinding: { itemKind: "dagger", economyRole: "stealth", requiresItemDefinition: true },
    variantAxes: { itemKind: "dagger", rarity: "uncommon", weaponFamily: "dagger" },
    tags: ["weapon", "finesse"]
  }, {
    instanceId: "weapon-reward"
  });

  assert.equal(weaponReward.definitionSnapshot.category, "weapon");
  assert.equal(weaponReward.rarity, "uncommon");
  assert.equal(weaponReward.slot, "mainHand");
  assert.equal(weaponReward.value, 64);
  assert.equal(weaponReward.definitionSnapshot.assetRef.gameplayBinding.requiresItemDefinition, true);
});

test("sheet 029 catalog items bind usable, equippable, market-ready item definitions", () => {
  const expectedBindings = [
    ["blackthorn-warplate", "assets/generated/items/aidm-inventory-expansion-029-03.png", "body", false],
    ["surveyor-pack", "assets/generated/items/aidm-inventory-expansion-029-04.png", null, false],
    ["skyglass-signet", "assets/generated/items/aidm-inventory-expansion-029-14.png", "accessory", false],
    ["rainmarked-chart", "assets/generated/items/aidm-inventory-expansion-029-27.png", null, false],
    ["bitterleaf-ampoule", "assets/generated/items/aidm-inventory-expansion-029-11.png", null, true],
    ["pearwood-lute", "assets/generated/items/aidm-inventory-expansion-029-64.png", null, false]
  ];

  for (const [itemId, file, slot, usable] of expectedBindings) {
    const definition = getItemDefinition(itemId);
    const entry = createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-029` });
    const view = describeInventoryEntry(entry, "zh");

    assert.equal(definition.assetRef.file, file);
    assert.equal(definition.assetRef.semanticKey.startsWith("items."), true);
    assert.equal(entry.tradeable, true);
    assert.equal(entry.sellable, true);
    assert.equal(view.rarity, definition.rarity);
    assert.ok(view.rarityLabel);
    assert.equal(entry.slot, slot);
    assert.equal(entry.usable, usable);
    assert.equal(view.definition.descriptionText, definition.description.zh);
    assert.equal(view.definition.assetRef.file, file);
  }
});

test("sheet 030 catalog items bind market-ready item definitions", () => {
  const expectedBindings = [
    ["lionward-shield", "assets/generated/items/aidm-inventory-expansion-030-10.png", "offHand", "uncommon"],
    ["azure-court-crown", "assets/generated/items/aidm-inventory-expansion-030-16.png", "accessory", "rare"],
    ["sapphire-treaty-ring", "assets/generated/items/aidm-inventory-expansion-030-23.png", "accessory", "rare"],
    ["lockpick-roll", "assets/generated/items/aidm-inventory-expansion-030-45.png", null, "uncommon"],
    ["emberglass-lantern", "assets/generated/items/aidm-inventory-expansion-030-48.png", null, "uncommon"],
    ["brass-mariner-compass", "assets/generated/items/aidm-inventory-expansion-030-53.png", null, "uncommon"]
  ];

  for (const [itemId, file, slot, rarity] of expectedBindings) {
    const definition = getItemDefinition(itemId);
    const entry = createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-030` });
    const view = describeInventoryEntry(entry, "zh");

    assert.equal(definition.assetRef.file, file);
    assert.equal(definition.assetRef.semanticKey.startsWith("items."), true);
    assert.equal(definition.rarity, rarity);
    assert.equal(entry.tradeable, true);
    assert.equal(entry.sellable, true);
    assert.equal(entry.slot, slot);
    assert.equal(view.rarity, rarity);
    assert.ok(view.rarityLabel);
    assert.equal(view.definition.descriptionText, definition.description.zh);
    assert.equal(view.definition.assetRef.file, file);
  }
});

test("sheet 031 catalog items bind promoted weapons, tools, scrolls, and trade goods", () => {
  const expectedBindings = [
    ["oathguard-saber", "assets/generated/items/aidm-inventory-expansion-031-02.png", "mainHand", "weapon", "uncommon", false, 84],
    ["red-tassel-spear", "assets/generated/items/aidm-inventory-expansion-031-08.png", "mainHand", "weapon", "uncommon", false, 78],
    ["frostfur-travel-boots", "assets/generated/items/aidm-inventory-expansion-031-17.png", null, "fashion", "uncommon", false, 66],
    ["blue-sigil-ward-scroll", "assets/generated/items/aidm-inventory-expansion-031-36.png", null, "spellScroll", "uncommon", true, 104],
    ["ironbound-coffer", "assets/generated/items/aidm-inventory-expansion-031-42.png", null, "tradeGood", "notable", false, 58],
    ["guild-keyring", "assets/generated/items/aidm-inventory-expansion-031-54.png", null, "tool", "uncommon", false, 44],
    ["alchemist-mortar", "assets/generated/items/aidm-inventory-expansion-031-58.png", null, "tool", "common", false, 32]
  ];

  for (const [itemId, file, slot, category, rarity, usable, baseValue] of expectedBindings) {
    const definition = getItemDefinition(itemId);
    const entry = createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-031` });
    const view = describeInventoryEntry(entry, "zh");

    assert.equal(definition.assetRef.file, file);
    assert.equal(definition.assetRef.semanticKey.startsWith("items."), true);
    assert.equal(definition.category, category);
    assert.equal(definition.rarity, rarity);
    assert.equal(definition.baseValue, baseValue);
    assert.equal(entry.value, baseValue);
    assert.equal(entry.tradeable, true);
    assert.equal(entry.sellable, true);
    assert.equal(entry.slot, slot);
    assert.equal(entry.usable, usable);
    assert.equal(view.rarity, rarity);
    assert.ok(view.rarityLabel);
    assert.equal(view.actions.equip.available, Boolean(slot));
    assert.equal(view.actions.sell.available, true);
    assert.equal(view.actions.use.available, usable);
    assert.equal(view.saleValue, Math.floor(view.value * ITEM_ECONOMY.sellbackRate));
    assert.equal(view.definition.descriptionText, definition.description.zh);
    assert.equal(view.definition.assetRef.file, file);
    assert.ok(view.definition.categoryLabel);
  }

  assert.deepEqual(getItemDefinition("blue-sigil-ward-scroll").useEffect, {
    type: "learn-spell",
    spellId: "ward",
    consume: true
  });
});

test("player-safe sheet 021 to 026 assets are promoted through data-backed catalog definitions", () => {
  const expectedBindings = [
    ["tension-wrench-set", "assets/generated/items/aidm-tool-cutout-021-01.png", null, "common", false],
    ["folded-chain-shirt", "assets/generated/items/aidm-wearable-cutout-023-03.png", "body", "uncommon", false],
    ["ironstar-mace", "assets/generated/items/aidm-weapon-cutout-024-10.png", "mainHand", "uncommon", false],
    ["gilded-sun-buckler", "assets/generated/items/aidm-weapon-cutout-024-13.png", "offHand", "uncommon", false],
    ["stormglass-amulet", "assets/generated/items/aidm-magic-cutout-025-14.png", "accessory", "rare", false],
    ["sealed-tea-brick", "assets/generated/items/aidm-trade-cutout-026-14.png", null, "common", false]
  ];

  for (const [itemId, file, slot, rarity, usable] of expectedBindings) {
    const definition = getItemDefinition(itemId);
    const entry = createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-player-safe` });
    const view = describeInventoryEntry(entry, "zh");

    assert.equal(definition.assetRef.file, file);
    assert.equal(definition.assetRef.semanticKey.startsWith("items."), true);
    assert.equal(definition.rarity, rarity);
    assert.equal(entry.slot, slot);
    assert.equal(entry.usable, usable);
    assert.equal(view.actions.equip.available, Boolean(slot));
    assert.equal(view.actions.sell.available, true);
    assert.equal(view.actions.use.available, usable);
    assert.equal(view.saleValue, Math.floor(view.value * ITEM_ECONOMY.sellbackRate));
    assert.ok(view.definition.descriptionText);
  }
});

test("sheet 009 market assets promote five data-backed item definitions", () => {
  const expectedBindings = [
    ["mana-vial", "assets/generated/items/aidm-market-item-009-02.png", null, "consumable", "common", true, 40],
    ["storm-ward-amulet", "assets/generated/items/aidm-market-item-009-03.png", "accessory", "fashion", "uncommon", false, 118],
    ["lockpick-kit", "assets/generated/items/aidm-market-item-009-04.png", null, "tool", "common", false, 48],
    ["tower-shield", "assets/generated/items/aidm-market-item-009-14.png", "offHand", "shield", "uncommon", false, 96],
    ["spiced-rations", "assets/generated/items/aidm-market-item-009-17.png", null, "food", "common", true, 8]
  ];
  const shop = shopView("zh");

  for (const [itemId, file, slot, category, rarity, usable, baseValue] of expectedBindings) {
    const definition = getItemDefinition(itemId);
    const entry = createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-009` });
    const view = describeInventoryEntry(entry, "zh");
    const shopEntry = shop.find((offer) => offer.itemId === itemId);

    assert.equal(definition.assetRef.file, file);
    assert.equal(definition.assetRef.semanticKey.startsWith("items."), true);
    assert.equal(definition.category, category);
    assert.equal(definition.rarity, rarity);
    assert.equal(definition.baseValue, baseValue);
    assert.equal(entry.value, baseValue);
    assert.equal(entry.tradeable, true);
    assert.equal(entry.sellable, true);
    assert.equal(entry.slot, slot);
    assert.equal(entry.usable, usable);
    assert.equal(view.actions.equip.available, Boolean(slot));
    assert.equal(view.actions.sell.available, true);
    assert.equal(view.actions.use.available, usable);
    assert.equal(view.saleValue, Math.floor(view.value * ITEM_ECONOMY.sellbackRate));
    assert.equal(view.definition.descriptionText, definition.description.zh);
    assert.equal(view.definition.assetRef.file, file);
    assert.ok(shopEntry, `${itemId} must be listed in market shopView`);
    assert.equal(shopEntry.canBuy, true);
    assert.equal(shopEntry.definition.assetRef.file, file);
    assert.equal(shopEntry.definition.category, category);
    assert.ok(shopEntry.price > shopEntry.value);
  }
});

test("next generated market batch promotes diverse item definitions", () => {
  const expectedBindings = [
    ["ember-bomb", "assets/generated/items/aidm-market-item-009-06.png", null, "consumable", "uncommon", true, 58, 73],
    ["signet-ring", "assets/generated/items/aidm-market-item-009-08.png", "accessory", "fashion", "uncommon", false, 72, 90],
    ["rain-city-map", "assets/generated/items/aidm-market-item-009-09.png", null, "tool", "common", false, 44, 42],
    ["merchant-contract", "assets/generated/items/aidm-market-item-009-10.png", null, "tradeGood", "uncommon", false, 64, 80],
    ["ceremonial-robe", "assets/generated/items/aidm-market-item-009-16.png", "body", "armor", "rare", false, 150, 254],
    ["bone-dice-set", "assets/generated/items/aidm-market-item-009-20.png", null, "tradeGood", "common", false, 18, 23],
    ["brass-monocle", "assets/generated/items/aidm-accessory-cutout-019-04.png", null, "tool", "uncommon", false, 35, 44],
    ["etched-war-axe", "assets/generated/items/aidm-weapon-cutout-024-12.png", "mainHand", "weapon", "uncommon", false, 105, 132]
  ];
  const shop = shopView("zh");

  for (const [itemId, file, slot, category, rarity, usable, baseValue, shopPrice] of expectedBindings) {
    const definition = getItemDefinition(itemId);
    const entry = createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-next-batch` });
    const view = describeInventoryEntry(entry, "zh");
    const shopEntry = shop.find((offer) => offer.itemId === itemId);

    assert.equal(definition.assetRef.file, file);
    assert.equal(definition.assetRef.semanticKey.startsWith("items."), true);
    assert.equal(definition.category, category);
    assert.equal(definition.rarity, rarity);
    assert.equal(definition.baseValue, baseValue);
    assert.equal(entry.value, baseValue);
    assert.equal(entry.tradeable, true);
    assert.equal(entry.sellable, true);
    assert.equal(entry.slot, slot);
    assert.equal(entry.usable, usable);
    assert.equal(view.actions.equip.available, Boolean(slot));
    assert.equal(view.actions.sell.available, true);
    assert.equal(view.actions.use.available, usable);
    assert.equal(view.saleValue, Math.floor(view.value * ITEM_ECONOMY.sellbackRate));
    assert.equal(view.definition.descriptionText, definition.description.zh);
    assert.equal(view.definition.assetRef.file, file);
    assert.ok(shopEntry, `${itemId} must be listed in market shopView`);
    assert.equal(shopEntry.canBuy, true);
    assert.equal(shopEntry.definition.assetRef.file, file);
    assert.equal(shopEntry.definition.category, category);
    assert.equal(shopEntry.price, shopPrice);
  }
});

test("sheet 009 market item batch can be bought, used, equipped, and sold", () => {
  const player = {
    id: "player-sheet-009",
    character: {
      wallet: 500,
      hp: 2,
      maxHp: 10,
      mana: 1,
      maxMana: 6,
      xp: 0,
      level: 1,
      modifiers: { agility: 1 },
      spells: [],
      inventory: [
        createInventoryEntry("mana-vial", {
          condition: "fine",
          quantity: 2,
          instanceId: "mana-stack"
        }),
        createInventoryEntry("spiced-rations", {
          condition: "fine",
          quantity: 2,
          instanceId: "ration-stack"
        }),
        createInventoryEntry("storm-ward-amulet", {
          condition: "fine",
          instanceId: "storm-amulet-entry"
        }),
        createInventoryEntry("tower-shield", {
          condition: "fine",
          instanceId: "tower-shield-entry"
        }),
        createInventoryEntry("lockpick-kit", {
          condition: "fine",
          instanceId: "lockpick-kit-entry"
        })
      ]
    }
  };

  const restoredMana = useInventoryItem(player, "mana-stack");
  assert.equal(player.character.mana, 5);
  assert.equal(player.character.inventory.find((entry) => entry.id === "mana-stack").quantity, 1);
  assert.equal(restoredMana.stateDeltas.mana, 4);
  assert.deepEqual(restoredMana.stateDeltas.inventory, [{
    id: "mana-stack",
    itemId: "mana-vial",
    quantityDelta: -1
  }]);

  const restoredHp = useInventoryItem(player, "ration-stack");
  assert.equal(player.character.hp, 5);
  assert.equal(player.character.inventory.find((entry) => entry.id === "ration-stack").quantity, 1);
  assert.equal(restoredHp.stateDeltas.hp, 3);

  const equippedAmulet = equipInventoryItem(player, "storm-amulet-entry", "en");
  assert.equal(equippedAmulet.slot, "accessory");
  assert.equal(equippedAmulet.item.itemId, "storm-ward-amulet");
  assert.equal(equippedAmulet.equipment.slots.accessory.item.itemId, "storm-ward-amulet");
  assert.equal(equippedAmulet.stateDeltas.defense, 1);
  assert.deepEqual(equippedAmulet.stateDeltas.equipment.equipped, ["storm-ward-amulet"]);

  const equippedShield = equipInventoryItem(player, "tower-shield-entry", "en");
  assert.equal(equippedShield.slot, "offHand");
  assert.equal(equippedShield.item.itemId, "tower-shield");
  assert.equal(equippedShield.equipment.slots.offHand.item.itemId, "tower-shield");
  assert.deepEqual(equippedShield.stateDeltas.equipment.equipped, ["tower-shield"]);

  const soldKit = sellInventoryItem(player, "lockpick-kit-entry");
  assert.equal(soldKit.payout, 26);
  assert.equal(player.character.wallet, 526);
  assert.equal(player.character.inventory.some((entry) => entry.id === "lockpick-kit-entry"), false);
  assert.equal(soldKit.stateDeltas.wallet, 26);
  assert.deepEqual(soldKit.stateDeltas.stock, [{
    itemId: "lockpick-kit",
    quantityDelta: 1
  }]);

  const boughtMana = buyShopItem(player, "mana-vial");
  assert.equal(boughtMana.item.itemId, "mana-vial");
  assert.equal(boughtMana.item.source, "shop");
  assert.equal(boughtMana.price, 50);
  assert.equal(player.character.wallet, 476);
  assert.equal(boughtMana.stateDeltas.wallet, -50);
  assert.deepEqual(boughtMana.stateDeltas.stock, [{
    itemId: "mana-vial",
    quantityDelta: -1
  }]);
  assert.equal(player.character.inventory.some((entry) => entry.itemId === "mana-vial" && entry.source === "shop"), true);
});

test("next generated market batch can be bought, used, equipped, and sold", () => {
  const player = {
    id: "player-next-generated-batch",
    character: {
      wallet: 700,
      hp: 7,
      maxHp: 10,
      mana: 3,
      maxMana: 6,
      xp: 0,
      level: 1,
      modifiers: { agility: 1 },
      spells: [],
      inventory: [
        createInventoryEntry("ember-bomb", {
          condition: "fine",
          quantity: 2,
          instanceId: "ember-stack"
        }),
        createInventoryEntry("signet-ring", {
          condition: "fine",
          instanceId: "signet-entry"
        }),
        createInventoryEntry("ceremonial-robe", {
          condition: "pristine",
          instanceId: "robe-entry"
        }),
        createInventoryEntry("etched-war-axe", {
          condition: "fine",
          instanceId: "axe-entry"
        }),
        createInventoryEntry("merchant-contract", {
          condition: "fine",
          instanceId: "contract-entry"
        }),
        createInventoryEntry("bone-dice-set", {
          condition: "fine",
          instanceId: "dice-entry"
        })
      ]
    }
  };

  const usedBomb = useInventoryItem(player, "ember-stack");
  assert.equal(usedBomb.consumed, true);
  assert.equal(player.character.inventory.find((entry) => entry.id === "ember-stack").quantity, 1);
  assert.deepEqual(usedBomb.stateDeltas.inventory, [{
    id: "ember-stack",
    itemId: "ember-bomb",
    quantityDelta: -1
  }]);

  const equippedSignet = equipInventoryItem(player, "signet-entry", "en");
  assert.equal(equippedSignet.slot, "accessory");
  assert.equal(equippedSignet.item.itemId, "signet-ring");
  assert.equal(equippedSignet.equipment.slots.accessory.item.itemId, "signet-ring");

  const equippedRobe = equipInventoryItem(player, "robe-entry", "en");
  assert.equal(equippedRobe.slot, "body");
  assert.equal(equippedRobe.item.itemId, "ceremonial-robe");
  assert.equal(equippedRobe.equipment.slots.body.item.itemId, "ceremonial-robe");

  const equippedAxe = equipInventoryItem(player, "axe-entry", "en");
  assert.equal(equippedAxe.slot, "mainHand");
  assert.equal(equippedAxe.item.itemId, "etched-war-axe");
  assert.equal(equippedAxe.equipment.slots.mainHand.item.itemId, "etched-war-axe");

  const soldContract = sellInventoryItem(player, "contract-entry");
  assert.equal(soldContract.payout, 35);
  assert.equal(player.character.wallet, 735);
  assert.equal(player.character.inventory.some((entry) => entry.id === "contract-entry"), false);
  assert.equal(soldContract.stateDeltas.wallet, 35);
  assert.deepEqual(soldContract.stateDeltas.stock, [{
    itemId: "merchant-contract",
    quantityDelta: 1
  }]);

  const boughtMonocle = buyShopItem(player, "brass-monocle");
  assert.equal(boughtMonocle.item.itemId, "brass-monocle");
  assert.equal(boughtMonocle.item.source, "shop");
  assert.equal(boughtMonocle.price, 44);
  assert.equal(player.character.wallet, 691);
  assert.equal(boughtMonocle.stateDeltas.wallet, -44);
  assert.deepEqual(boughtMonocle.stateDeltas.stock, [{
    itemId: "brass-monocle",
    quantityDelta: -1
  }]);
  assert.equal(player.character.inventory.some((entry) => entry.itemId === "brass-monocle" && entry.source === "shop"), true);
  assert.equal(describeInventoryEntry(createInventoryEntry("rain-city-map"), "zh").actions.sell.available, true);
  assert.equal(describeInventoryEntry(createInventoryEntry("bone-dice-set"), "zh").actions.sell.available, true);
});

test("utility tools can be used from inventory and explain why they are not equipped", () => {
  const player = {
    id: "tool-user",
    character: {
      wallet: 0,
      hp: 8,
      maxHp: 8,
      mana: 2,
      maxMana: 2,
      xp: 0,
      level: 1,
      spells: [],
      inventory: [
        createInventoryEntry("storm-lantern", { instanceId: "storm-tool" }),
        createInventoryEntry("travel-lamp", { instanceId: "lamp-tool" }),
        createInventoryEntry("climbing-rope", { instanceId: "rope-tool" }),
        createInventoryEntry("brass-mariner-compass", { instanceId: "compass-tool" })
      ]
    }
  };

  const stormLanternZh = describeInventoryEntry(player.character.inventory[0], "zh");
  const stormLanternEn = describeInventoryEntry(player.character.inventory[0], "en");
  const lampView = describeInventoryEntry(player.character.inventory[1], "zh");
  const ropeView = describeInventoryEntry(player.character.inventory[2], "zh");
  const compassView = describeInventoryEntry(player.character.inventory[3], "zh");

  assert.equal(stormLanternZh.definition.label, "暴风提灯");
  assert.equal(stormLanternZh.actions.use.available, true);
  assert.equal(stormLanternZh.actions.equip.available, false);
  assert.equal(stormLanternZh.actions.equip.reasonCode, "tool-not-equippable");
  assert.equal(stormLanternZh.actions.equip.reason, "可从背包中使用；它不占用装备栏位");
  assert.equal(stormLanternEn.actions.equip.reason, "Use from the backpack; it does not occupy an equipment slot");
  assert.equal(stormLanternZh.equippable, false);
  assert.equal(stormLanternZh.definition.toolUse.type, "light");
  assert.match(stormLanternZh.definition.toolUse.label, /稳定灯光/);
  assert.equal(lampView.actions.use.available, true);
  assert.equal(lampView.actions.equip.available, false);
  assert.equal(lampView.actions.equip.reason, "可从背包中使用；它不占用装备栏位");
  assert.equal(ropeView.definition.assetRef.file, "assets/items/climbing-rope.svg");
  assert.equal(ropeView.definition.toolUse.type, "climbing");
  assert.equal(compassView.definition.toolUse.type, "navigation");
  assert.match(compassView.definition.useEffectLabel, /确认方向/);

  const usedRope = useInventoryItem(player, "rope-tool", "zh");
  assert.equal(usedRope.consumed, false);
  assert.equal(usedRope.toolUse.type, "climbing");
  assert.deepEqual(usedRope.stateDeltas, {});
  assert.equal(player.character.inventory.find((entry) => entry.id === "rope-tool").quantity, 1);
  assert.throws(
    () => equipInventoryItem(player, "compass-tool", "zh"),
    /不占用装备栏/
  );
  assert.throws(
    () => equipInventoryItem(player, "storm-tool", "en"),
    /does not occupy an equipment slot/
  );
});

test("action equipment influence turns tools, shields, focuses, and warrior specs into bounded check modifiers", () => {
  const character = {
    id: "rules-loadout",
    classId: "warrior",
    specialization: {
      id: "dual-wielder",
      label: { en: "Dual Wielder", zh: "双持战士" },
      role: "mobile-striker"
    },
    equipment: ["longsword", "shield", "staff"],
    inventory: [
      createInventoryEntry("longsword", { instanceId: "sword", equipped: true }),
      createInventoryEntry("shield", { instanceId: "shield", equipped: true }),
      createInventoryEntry("staff", { instanceId: "staff", equipped: true }),
      createInventoryEntry("travel-lamp", { instanceId: "lamp" }),
      createInventoryEntry("field-notebook", { instanceId: "notes" }),
      createInventoryEntry("brass-mariner-compass", { instanceId: "compass" })
    ]
  };

  const investigate = describeActionEquipmentInfluence(character, "carefully inspect the rain-dark clue", "en");
  assert.equal(investigate.intent, "investigate");
  assert.equal(investigate.modifier >= 2, true);
  assert.equal(investigate.sourceLabels.some((label) => /Travel Lamp|Field Notebook|Oak Staff/.test(label)), true);
  assert.match(investigate.feedback.en, /\+\d/);

  const guard = describeActionEquipmentInfluence(character, "guard the witness behind the shield", "zh");
  assert.equal(guard.intent, "guard");
  assert.equal(guard.sources.some((source) => source.reason === "shield-guard"), true);
  assert.match(guard.feedback.zh, /支撑这次guard行动/);

  const offhand = describeActionEquipmentInfluence(character, "offhand flank and strike the exposed raider", "en");
  assert.equal(offhand.intent, "hostile");
  assert.equal(offhand.sources.some((source) => source.reason === "dual-wield-pressure"), true);
  assert.equal(offhand.modifier <= 3, true);

  const travel = describeActionEquipmentInfluence(character, "follow the route through the market rain", "en");
  assert.equal(travel.intent, "travel");
  assert.equal(travel.toolItemIds.includes("brass-mariner-compass"), true);
  assert.equal(travel.nextActionTags.includes("intent:travel"), true);
});

test("action equipment influence balance review keeps stacked loadouts at plus three or lower", () => {
  const itemIds = [
    "longsword",
    "dagger",
    "shield",
    "chainmail",
    "staff",
    "stormglass-amulet",
    "travel-lamp",
    "field-notebook",
    "brass-mariner-compass",
    "climbing-rope",
    "sleep-scroll",
    "moon-key"
  ];
  const makeInventory = (equippedIds = []) => {
    const equipped = new Set(equippedIds);
    return itemIds.map((itemId) => createInventoryEntry(itemId, {
      instanceId: `${itemId}-balance`,
      equipped: equipped.has(itemId)
    }));
  };
  const loadouts = [
    {
      label: "mage cast stack",
      character: {
        id: "mage-stack",
        classId: "mage",
        equipment: ["staff", "stormglass-amulet"],
        inventory: makeInventory(["staff", "stormglass-amulet"])
      },
      action: "cast a sleep spell using the focus and scroll"
    },
    {
      label: "dual wielder hostile stack",
      character: {
        id: "dual-stack",
        classId: "warrior",
        specialization: { id: "dual-wielder", label: { en: "Dual Wielder", zh: "双持战士" }, role: "mobile-striker" },
        equipment: ["longsword", "dagger", "chainmail"],
        inventory: makeInventory(["longsword", "dagger", "chainmail"])
      },
      action: "offhand dual flank and strike the exposed raider"
    },
    {
      label: "defender guard stack",
      character: {
        id: "defender-stack",
        classId: "warrior",
        specialization: { id: "defender", label: { en: "Defender", zh: "防御者" }, role: "frontline-guardian" },
        equipment: ["shield", "chainmail"],
        inventory: makeInventory(["shield", "chainmail"])
      },
      action: "guard the witness with shield in dark rain"
    },
    {
      label: "travel tool stack",
      character: {
        id: "travel-stack",
        classId: "ranger",
        equipment: [],
        inventory: makeInventory()
      },
      action: "follow the route using compass rope and lamp through the market rain"
    },
    {
      label: "lock and clue tool stack",
      character: {
        id: "lock-stack",
        classId: "rogue",
        equipment: [],
        inventory: makeInventory()
      },
      action: "open the moon key lock and inspect the ledger clue"
    },
    {
      label: "tactical commander order stack",
      character: {
        id: "commander-stack",
        classId: "warrior",
        specialization: { id: "tactical-commander", label: { en: "Tactical Commander", zh: "战术指挥" }, role: "team-enabler" },
        equipment: ["longsword", "shield", "chainmail"],
        inventory: makeInventory(["longsword", "shield", "chainmail"])
      },
      action: "rally the guard line and command the marked raider"
    }
  ];

  for (const loadout of loadouts) {
    const influence = describeActionEquipmentInfluence(loadout.character, loadout.action, "en");
    assert.equal(influence.modifier <= 3, true, `${loadout.label} produced +${influence.modifier}`);
    assert.equal(influence.sources.length <= 3, true, `${loadout.label} should expose at most three sources`);
    assert.equal(new Set(influence.sources.map((source) => source.id)).size, influence.sources.length, `${loadout.label} has duplicate sources`);
  }
});

test("catalog operations learn scrolls, consume quantities, equip generated bindings, sell, buy, and report deltas", () => {
  const player = {
    id: "player-test",
    character: {
      wallet: 200,
      hp: 3,
      maxHp: 10,
      mana: 1,
      maxMana: 4,
      xp: 0,
      level: 1,
      spells: [],
      inventory: [
        createInventoryEntry("healing-word-scroll", {
          condition: "fine",
          quantity: 1,
          instanceId: "scroll-entry"
        }),
        createInventoryEntry("silver-ledger", {
          condition: "worn",
          instanceId: "ledger-entry"
        }),
        createInventoryEntry("field-notebook", {
          condition: "fine",
          instanceId: "notebook-entry"
        }),
        createInventoryEntry("healing-draught", {
          condition: "fine",
          quantity: 2,
          instanceId: "potion-stack"
        }),
        createInventoryEntry("field-primer", {
          condition: "fine",
          instanceId: "primer-entry"
        }),
        createInventoryEntry("bitterleaf-ampoule", {
          condition: "fine",
          quantity: 2,
          instanceId: "ampoule-stack"
        }),
        createInventoryEntry("skyglass-signet", {
          condition: "pristine",
          instanceId: "signet-entry"
        })
      ]
    }
  };

  const learned = useInventoryItem(player, "scroll-entry");
  assert.equal(learned.learnedSpell, "healing-word");
  assert.equal(learned.consumed, true);
  assert.deepEqual(player.character.spells, ["healing-word"]);
  assert.deepEqual(player.character.knownSpells, ["healing-word"]);
  assert.deepEqual(player.character.spellKnown, { "healing-word": true });
  assert.equal(player.character.inventory.some((entry) => entry.id === "scroll-entry"), false);
  assert.deepEqual(learned.stateDeltas.learnedSpells, ["healing-word"]);

  player.character.inventory.push(createInventoryEntry("healing-word-scroll", {
    condition: "fine",
    instanceId: "known-scroll-entry"
  }));
  assert.throws(
    () => useInventoryItem(player, "known-scroll-entry"),
    /already known/
  );
  assert.equal(player.character.inventory.some((entry) => entry.id === "known-scroll-entry"), true);

  assert.throws(
    () => useInventoryItem(player, "notebook-entry"),
    /not usable/
  );

  const sold = sellInventoryItem(player, "ledger-entry");
  assert.equal(sold.payout, 33);
  assert.equal(player.character.wallet, 233);
  assert.equal(player.character.inventory.some((entry) => entry.id === "ledger-entry"), false);
  assert.equal(sold.stateDeltas.wallet, 33);

  assert.throws(
    () => sellInventoryItem(player, "notebook-entry"),
    /cannot be traded/
  );

  const healed = useInventoryItem(player, "potion-stack");
  assert.equal(player.character.hp, 10);
  assert.equal(player.character.inventory.find((entry) => entry.id === "potion-stack").quantity, 1);
  assert.equal(healed.stateDeltas.hp, 7);
  assert.deepEqual(healed.stateDeltas.inventory, [{
    id: "potion-stack",
    itemId: "healing-draught",
    quantityDelta: -1
  }]);

  const progressed = useInventoryItem(player, "primer-entry");
  assert.equal(player.character.xp, 120);
  assert.equal(player.character.level, 2);
  assert.equal(progressed.stateDeltas.xp, 120);
  assert.equal(progressed.stateDeltas.level, 1);

  const focused = useInventoryItem(player, "ampoule-stack");
  assert.equal(player.character.mana, 4);
  assert.equal(player.character.inventory.find((entry) => entry.id === "ampoule-stack").quantity, 1);
  assert.equal(focused.stateDeltas.mana, 3);

  const equipped = equipInventoryItem(player, "signet-entry", "en");
  assert.equal(equipped.slot, "accessory");
  assert.equal(equipped.item.definition.label, "Skyglass Signet");
  assert.equal(equipped.equipment.slots.accessory.item.itemId, "skyglass-signet");

  const bought = buyShopItem(player, "festival-wine");
  assert.equal(bought.item.itemId, "festival-wine");
  assert.equal(bought.item.source, "shop");
  assert.equal(bought.price, 28);
  assert.equal(player.character.wallet, 205);
  assert.equal(bought.stateDeltas.wallet, -28);
  assert.deepEqual(bought.stateDeltas.inventory, [{
    id: bought.item.id,
    itemId: "festival-wine",
    quantityDelta: 1
  }]);
  assert.equal(player.character.inventory.some((entry) => entry.itemId === "festival-wine"), true);
  assert.throws(
    () => buyShopItem(player, "moon-silk"),
    /Not enough currency/
  );
  assert.throws(
    () => buyShopItem(player, "field-notebook"),
    /Shop item not found/
  );
});

test("expanded spell scrolls teach new spell ids and stay linked to shop definitions", () => {
  const scrollIds = [
    ["cleanse-poison-scroll", "cleanse-poison"],
    ["frost-bind-scroll", "frost-bind"],
    ["glass-echo-scroll", "glass-echo"],
    ["storm-arc-scroll", "storm-arc"],
    ["thunder-step-scroll", "thunder-step"],
    ["grave-whisper-scroll", "grave-whisper"],
    ["iron-oath-scroll", "iron-oath"],
    ["lantern-sigil-scroll", "lantern-sigil"],
    ["blood-moon-hex-scroll", "blood-moon-hex"],
    ["tidecall-scroll", "tidecall"],
    ["clockwork-snare-scroll", "clockwork-snare"],
    ["starfall-rune-scroll", "starfall-rune"]
  ];
  const shop = shopView("en");

  for (const [itemId, spellId] of scrollIds) {
    const definition = getItemDefinition(itemId);
    assert.equal(definition.category, "spellScroll");
    assert.equal(definition.useEffect.spellId, spellId);
    assert.equal(definition.tags.includes(spellId), true);
    assert.ok(shop.find((entry) => entry.itemId === itemId), `${itemId} missing from shop`);
  }

  const player = {
    id: "scroll-learner",
    character: {
      wallet: 0,
      hp: 8,
      maxHp: 8,
      mana: 0,
      maxMana: 4,
      xp: 0,
      level: 1,
      spells: [],
      knownSpells: [],
      spellKnown: {},
      inventory: [
        createInventoryEntry("storm-arc-scroll", {
          condition: "fine",
          instanceId: "storm-scroll-entry"
        })
      ]
    }
  };

  const learned = useInventoryItem(player, "storm-scroll-entry", "en");
  assert.equal(learned.learnedSpell, "storm-arc");
  assert.deepEqual(player.character.spells, ["storm-arc"]);
  assert.deepEqual(player.character.knownSpells, ["storm-arc"]);
  assert.deepEqual(learned.stateDeltas.learnedSpells, ["storm-arc"]);
});

test("equipment summary and equip operation replace a slot without drifting counts", () => {
  const player = {
    id: "player-equip",
    character: {
      wallet: 100,
      hp: 10,
      maxHp: 10,
      mana: 3,
      maxMana: 3,
      xp: 0,
      level: 1,
      modifiers: { agility: 2 },
      inventory: [
        createInventoryEntry("longsword", { instanceId: "sword", equipped: true }),
        createInventoryEntry("shield", { instanceId: "shield", equipped: true }),
        createInventoryEntry("leather", { instanceId: "leather", equipped: true }),
        createInventoryEntry("dagger", { instanceId: "dagger" })
      ],
      equipment: ["longsword", "shield", "leather"],
      weapons: ["longsword"],
      armor: ["shield", "leather"],
      defense: 14,
      spells: []
    }
  };

  const beforeQuantity = player.character.inventory.reduce((sum, entry) => sum + entry.quantity, 0);
  const equipped = equipInventoryItem(player, "dagger");
  const afterQuantity = player.character.inventory.reduce((sum, entry) => sum + entry.quantity, 0);

  assert.equal(beforeQuantity, afterQuantity);
  assert.equal(player.character.wallet, 100);
  assert.equal(player.character.inventory.find((entry) => entry.id === "sword").equipped, false);
  assert.equal(player.character.inventory.find((entry) => entry.id === "dagger").equipped, true);
  assert.deepEqual(player.character.weapons, ["dagger"]);
  assert.deepEqual(equipped.stateDeltas.equipment, {
    equipped: ["dagger"],
    unequipped: ["longsword"]
  });

  const summary = equipmentSummary(player.character.inventory, "zh");
  assert.equal(summary.slots.mainHand.label, "主手");
  assert.equal(summary.slots.mainHand.item.itemId, "dagger");
  assert.equal(summary.slots.mainHand.item.definition.label, "匕首");
  assert.equal(summary.slots.offHand.item.itemId, "shield");
  assert.equal(summary.slots.offHand.item.definition.label, "守护盾");
  assert.equal(summary.slots.body.item.itemId, "leather");
  assert.equal(summary.slots.body.item.definition.label, "皮甲");
});
