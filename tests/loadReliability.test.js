import test from "node:test";
import assert from "node:assert/strict";
import { runLoadSmoke } from "../scripts/load-smoke.mjs";

test("local load smoke covers concurrent rooms and SSE clients within bounded thresholds", async () => {
  const result = await runLoadSmoke({
    rooms: 2,
    sseClientsPerRoom: 2,
    apiP95Ms: 15000,
    sseConnectP95Ms: 1000,
    sseInitialP95Ms: 1000,
    sseBroadcastP95Ms: 1250,
    maxErrorRate: 0,
    timeoutMs: 8000
  });

  assert.equal(result.ok, true);
  assert.equal(result.target.rooms, 2);
  assert.equal(result.target.totalSseClients, 4);
  assert.equal(result.metrics.errors, 0);
  assert.equal(result.metrics.api.count >= 7, true);
  assert.equal(result.metrics.sseConnect.count, 4);
  assert.equal(result.metrics.sseInitial.count, 4);
  assert.equal(result.metrics.sseBroadcast.count, 4);
});
