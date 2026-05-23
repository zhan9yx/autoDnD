import test from "node:test";
import assert from "node:assert/strict";
import { addPlayer, advanceTurn, assertActivePlayer, createRoomState, startRoom } from "../src/core/stateMachine.js";

test("enforces active player turn order", () => {
  const room = createRoomState({ title: "Turn Test" });
  const first = addPlayer(room, { playerName: "A", characterName: "Aria" });
  const second = addPlayer(room, { playerName: "B", characterName: "Bram" });
  startRoom(room);

  assert.doesNotThrow(() => assertActivePlayer(room, first.id));
  assert.throws(() => assertActivePlayer(room, second.id), /Aria|another player/);

  advanceTurn(room);
  assert.equal(room.activePlayerId, second.id);
  assert.doesNotThrow(() => assertActivePlayer(room, second.id));
});
