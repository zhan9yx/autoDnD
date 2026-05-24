import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENCY,
  ITEM_CATALOG,
  buyShopItem,
  createAssetInventoryEntry,
  createInventoryEntry,
  describeInventoryEntry,
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
  assert.equal(sleepScroll.priceLabel, `${sleepScroll.price} ${CURRENCY.symbol}`);
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
  assert.equal(lamp.usable, false);

  const hydratedLegacy = hydrateInventoryEntry("Oak Staff");
  assert.equal(hydratedLegacy.itemId, "staff");
  assert.equal(hydratedLegacy.currency, CURRENCY.id);
  assert.equal(typeof hydratedLegacy.value, "number");

  const [lampView] = inventoryView([lamp], "zh");
  assert.equal(lampView.definition.label, "旅行提灯");
  assert.equal(lampView.definition.categoryLabel, "工具");
  assert.equal(lampView.conditionLabel, "崭新");
  assert.equal(lampView.valueLabel, `${lamp.value} ${CURRENCY.symbol}`);
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
});

test("catalog operations learn scrolls, consume quantities, sell, and buy", () => {
  const player = {
    id: "player-test",
    character: {
      wallet: 200,
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
        })
      ]
    }
  };

  const learned = useInventoryItem(player, "scroll-entry");
  assert.equal(learned.learnedSpell, "healing-word");
  assert.equal(learned.consumed, true);
  assert.deepEqual(player.character.spells, ["healing-word"]);
  assert.equal(player.character.inventory.some((entry) => entry.id === "scroll-entry"), false);

  assert.throws(
    () => useInventoryItem(player, "notebook-entry"),
    /not usable/
  );

  const sold = sellInventoryItem(player, "ledger-entry");
  assert.equal(sold.payout, 33);
  assert.equal(player.character.wallet, 233);
  assert.equal(player.character.inventory.some((entry) => entry.id === "ledger-entry"), false);

  assert.throws(
    () => sellInventoryItem(player, "notebook-entry"),
    /cannot be traded/
  );

  const bought = buyShopItem(player, "festival-wine");
  assert.equal(bought.item.itemId, "festival-wine");
  assert.equal(bought.item.source, "shop");
  assert.equal(bought.price, 28);
  assert.equal(player.character.wallet, 205);
  assert.equal(player.character.inventory.some((entry) => entry.itemId === "festival-wine"), true);
});
