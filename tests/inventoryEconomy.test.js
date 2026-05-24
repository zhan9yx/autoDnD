import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENCY,
  createInventoryEntry,
  describeInventoryEntry,
  getItemDefinition,
  inventoryView,
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
  assert.equal(view.valueLabel, `${view.value} ${CURRENCY.symbol}`);
  assert.equal(view.tradeable, true);
  assert.equal(view.usable, false);
  assert.equal(view.definition.assetRef.semanticKey, "lamp");

  const [legacyStaff] = inventoryView(["Oak Staff"], "en");
  assert.equal(legacyStaff.itemId, "staff");
  assert.equal(legacyStaff.definition.label, "Oak Staff");
  assert.equal(typeof legacyStaff.value, "number");
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

  const notebook = inventory.find((entry) => entry.itemId === "field-notebook");
  assert.ok(notebook);
  assert.equal(notebook.tradeable, false);
  assert.equal(notebook.usable, false);
});
