import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import {
  CURRENCY,
  EQUIPMENT_SLOTS,
  ITEM_CATALOG,
  buyShopItem,
  createAssetInventoryEntry,
  createInventoryEntry,
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
  assert.equal(sleepScroll.price, Math.ceil(sleepScroll.value * 1.25));
  assert.equal(sleepScroll.priceLabel, `${sleepScroll.price} ${CURRENCY.name.zh}`);
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
  assert.equal(getItemDefinition("field-primer").useEffect.type, "grant-xp");
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
    assert.ok(definition.assetRef?.file, `${itemId} missing asset binding`);
    try {
      await access(definition.assetRef.file);
    } catch {
      missingAssetRefs.push(`${itemId}: ${definition.assetRef.file}`);
    }

    const entry = createInventoryEntry(itemId, { condition: "fine", instanceId: `${itemId}-detail-test` });
    const view = describeInventoryEntry(entry, "en");
    assert.equal(view.condition, "fine");
    assert.equal(view.conditionLabel, "Fine");
    assert.equal(view.value, definition.baseValue);
    assert.equal(view.valueLabel, `${definition.baseValue} ${CURRENCY.symbol}`);
    assert.equal(view.definition.descriptionText, definition.description.en);
    assert.equal(view.sellable, definition.sellable ?? definition.tradeable !== false);
  }

  assert.deepEqual(missingAssetRefs, [], "catalog asset refs should resolve to committed assets");
});

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
  assert.equal(lamp.tradeable, true);
  assert.equal(lamp.sellable, true);
  assert.equal(lamp.usable, false);
  assert.equal(lamp.slot, null);

  const hydratedLegacy = hydrateInventoryEntry("Oak Staff");
  assert.equal(hydratedLegacy.itemId, "staff");
  assert.equal(hydratedLegacy.currency, CURRENCY.id);
  assert.equal(typeof hydratedLegacy.value, "number");

  const [lampView] = inventoryView([lamp], "zh");
  assert.equal(lampView.definition.label, "旅行提灯");
  assert.equal(lampView.definition.categoryLabel, "工具");
  assert.equal(lampView.conditionLabel, "崭新");
  assert.equal(lampView.valueLabel, `${lamp.value} ${CURRENCY.name.zh}`);
  assert.match(lampView.definition.assetRef.file, /storm-lantern\.svg$/);

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
  assert.equal(reward.value, 252);
  assert.equal(reward.definitionSnapshot.assetRef.file, "assets/generated/items/silver-ring.png");

  const rewardView = describeInventoryEntry(reward, "zh");
  assert.equal(rewardView.definition.label, "银戒");
  assert.equal(rewardView.definition.category, "tradeGood");
  assert.equal(rewardView.conditionLabel, "精工");

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
  assert.equal(weaponReward.slot, "mainHand");
  assert.equal(weaponReward.value, 64);
  assert.equal(weaponReward.definitionSnapshot.assetRef.gameplayBinding.requiresItemDefinition, true);
});

test("catalog operations learn scrolls, consume quantities, sell, buy, and report deltas", () => {
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

  const bought = buyShopItem(player, "festival-wine");
  assert.equal(bought.item.itemId, "festival-wine");
  assert.equal(bought.item.source, "shop");
  assert.equal(bought.price, 28);
  assert.equal(player.character.wallet, 205);
  assert.equal(bought.stateDeltas.wallet, -28);
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
  assert.equal(summary.slots.offHand.item.itemId, "shield");
});
