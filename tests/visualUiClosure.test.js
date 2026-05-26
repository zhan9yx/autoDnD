import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const chromePath = process.env.AIDM_CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const runVisualClosure = process.env.AIDM_RUN_VISUAL_UI_CLOSURE === "1";

test("post-ui visual closure keeps log and character drawers populated in desktop and mobile Chrome", {
  skip: runVisualClosure ? false : "set AIDM_RUN_VISUAL_UI_CLOSURE=1 to run the local Chrome visual gate"
}, async (t) => {
  const server = await startServer(t);
  const chrome = await startChrome(t);
  const page = await chrome.newPage();
  const runtimeErrors = [];
  page.on("Runtime.exceptionThrown", (params) => {
    runtimeErrors.push(params.exceptionDetails?.text || params.exceptionDetails?.exception?.description || "Runtime.exceptionThrown");
  });

  const scenario = await seedScenario(server.baseUrl);
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await navigate(page, `${server.baseUrl}/`);
  await evaluate(page, ({ roomId, playerId, playerToken, hostToken }) => {
    localStorage.setItem("aidm.language", "zh");
    localStorage.setItem("aidm.playerId", playerId);
    localStorage.setItem("aidm.playerToken", playerToken);
    localStorage.setItem("aidm.hostToken", hostToken);
    localStorage.setItem(`aidm.rooms.${roomId}.playerId`, playerId);
    localStorage.setItem(`aidm.rooms.${roomId}.playerToken`, playerToken);
    localStorage.setItem(`aidm.rooms.${roomId}.hostToken`, hostToken);
  }, scenario);
  await navigate(page, `${server.baseUrl}/?room=${encodeURIComponent(scenario.roomId)}`);
  await waitFor(page, () => {
    return document.querySelector("#roomTitle")?.textContent?.includes("AK Visual Closure")
      && document.querySelector("#myCharacterButton")?.disabled === false;
  }, "room shell with local player binding");

  const evidenceDir = join(tmpdir(), "aidm-ak-post-ui-gate");
  await mkdir(evidenceDir, { recursive: true });
  const desktop = await inspectViewport(page, {
    label: "desktop",
    width: 1440,
    height: 960,
    screenshotDir: evidenceDir
  });
  const mobile = await inspectViewport(page, {
    label: "mobile",
    width: 390,
    height: 844,
    screenshotDir: evidenceDir
  });

  for (const result of [desktop, mobile]) {
    assert.equal(result.log.open, true, `${result.label} log drawer should open`);
    assert.ok(result.log.messageCount > 0, `${result.label} full log drawer should render transcript messages`);
    assert.ok(!/^0\b/.test(result.log.countText), `${result.label} log count should not be zero`);
    assert.equal(result.character.open, true, `${result.label} character drawer should open`);
    assert.ok(result.character.inventoryItems > 0, `${result.label} character drawer should render inventory items`);
    assert.ok(result.character.equipmentCards > 0, `${result.label} character drawer should render equipment summary`);
    assert.ok(result.character.spellChips > 0, `${result.label} character drawer should render known spells`);
    assert.ok(result.character.progressCards >= 2, `${result.label} character drawer should render level/xp progress`);
    assert.equal(result.character.levelingSummary, true, `${result.label} character drawer should render progression summary`);
  }

  const blockingErrors = runtimeErrors.filter((message) => /ReferenceError|TypeError|SyntaxError|Uncaught/i.test(message));
  assert.deepEqual(blockingErrors, [], `browser runtime errors: ${blockingErrors.join("; ")}`);
});

async function inspectViewport(page, { label, width, height, screenshotDir }) {
  await page.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width <= 430
  });
  await waitForAnimationFrame(page);

  const log = await evaluate(page, async () => {
    document.querySelector("[data-drawer-open='log']")?.click();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const panel = document.querySelector("[data-drawer='log']");
    const fullTranscript = document.querySelector("#fullTranscript");
    return {
      open: Boolean(panel?.classList.contains("open")),
      countText: document.querySelector("#logCount")?.textContent?.trim() || "",
      messageCount: document.querySelectorAll("#fullTranscript .message").length,
      textLength: fullTranscript?.textContent?.trim()?.length || 0
    };
  });
  await captureScreenshot(page, join(screenshotDir, `${label}-log-drawer.png`));

  await evaluate(page, () => document.querySelector("[data-drawer='log'] [data-drawer-close]")?.click());
  await waitForAnimationFrame(page);

  const character = await evaluate(page, async () => {
    document.querySelector("#myCharacterButton")?.click();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const panel = document.querySelector("[data-drawer='character']");
    return {
      open: Boolean(panel?.classList.contains("open")),
      inventoryItems: document.querySelectorAll("#inventoryList .inventory-item-button").length,
      equipmentCards: document.querySelectorAll("#equipmentSummary article").length,
      spellChips: document.querySelectorAll("#spellList div > span").length,
      progressCards: document.querySelectorAll("#characterProgressSummary > article").length,
      levelingSummary: Boolean(document.querySelector("[data-leveling-summary]")),
      textLength: document.querySelector("#characterSheet")?.textContent?.trim()?.length || 0
    };
  });
  await captureScreenshot(page, join(screenshotDir, `${label}-character-drawer.png`));

  await evaluate(page, () => document.querySelector("[data-drawer='character'] [data-drawer-close]")?.click());
  await waitForAnimationFrame(page);

  return { label, log, character };
}

async function seedScenario(baseUrl) {
  const created = await request(baseUrl, "/api/rooms", {
    method: "POST",
    body: { title: "AK Visual Closure", tone: "mystery", language: "zh" }
  });
  const roomId = created.room.id;
  const hostToken = created.session.hostToken;
  const joined = await request(baseUrl, `/api/rooms/${roomId}/join`, {
    method: "POST",
    body: {
      playerName: "AK Gate",
      characterName: "Iris",
      species: "human",
      classId: "mage",
      stats: { body: 2, agility: 3, mind: 7, presence: 3, spirit: 4 }
    }
  });
  const playerId = joined.player.id;
  const playerToken = joined.session.playerToken;
  const market = await request(baseUrl, `/api/rooms/${roomId}/market`);
  const lantern = market.shop.find((offer) => offer.itemId === "storm-lantern");
  assert.ok(lantern, "scenario should expose storm lantern");
  const boughtLantern = await request(baseUrl, `/api/rooms/${roomId}/market/buy`, {
    method: "POST",
    body: { playerId, playerToken, itemId: "storm-lantern", expectedVersion: market.room.version }
  });
  const boughtPrimer = await request(baseUrl, `/api/rooms/${roomId}/market/buy`, {
    method: "POST",
    body: { playerId, playerToken, itemId: "field-primer", expectedVersion: boughtLantern.room.version }
  });
  const primerOwner = boughtPrimer.room.players.find((player) => player.id === playerId);
  const primerItem = primerOwner.character.inventory.find((item) => item.itemId === "field-primer");
  assert.ok(primerItem, "scenario should put field primer in inventory");
  const usedPrimer = await request(baseUrl, `/api/rooms/${roomId}/items/use`, {
    method: "POST",
    body: { playerId, playerToken, itemId: primerItem.id, expectedVersion: boughtPrimer.room.version }
  });
  await request(baseUrl, `/api/rooms/${roomId}/start`, {
    method: "POST",
    body: { hostToken }
  });
  const character = usedPrimer.room.players.find((player) => player.id === playerId).character;
  assert.equal(character.level, 2);
  assert.ok(character.spells.includes("ember-lance"));
  assert.ok(character.actions.includes("recover-mana"));
  return { roomId, hostToken, playerId, playerToken };
}

async function startServer(t) {
  const port = await availablePort();
  const tempDir = await mkdtemp(join(tmpdir(), "aidm-visual-ui-server-"));
  const child = spawn(process.execPath, ["src/server/server.js"], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port), AIDM_DATA_FILE: join(tempDir, "rooms.json") },
    stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(() => stopChild(child));
  await waitForOutput(child, `http://localhost:${port}`, "server");
  return { baseUrl: `http://127.0.0.1:${port}` };
}

async function startChrome(t) {
  const debugPort = await availablePort();
  const userDataDir = await mkdtemp(join(tmpdir(), "aidm-visual-ui-chrome-"));
  const child = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: ["ignore", "pipe", "pipe"] });
  t.after(() => stopChild(child));
  await waitForCdp(debugPort);
  return {
    async newPage() {
      const target = await fetchJson(`http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent("about:blank")}`, {
        method: "PUT"
      });
      const page = new CdpPage(target.webSocketDebuggerUrl);
      await page.ready();
      return page;
    }
  };
}

class CdpPage {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
        else resolve(message.result || {});
        return;
      }
      if (message.method && this.handlers.has(message.method)) {
        for (const handler of this.handlers.get(message.method)) handler(message.params || {});
      }
    });
  }

  async ready() {
    if (this.ws.readyState === WebSocket.OPEN) return;
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) || [];
    handlers.push(handler);
    this.handlers.set(method, handlers);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, 15000);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      });
    });
  }

  waitForEvent(method, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${method} timed out`)), timeoutMs);
      const handler = (params) => {
        clearTimeout(timer);
        const handlers = (this.handlers.get(method) || []).filter((entry) => entry !== handler);
        this.handlers.set(method, handlers);
        resolve(params);
      };
      this.on(method, handler);
    });
  }
}

async function navigate(page, url) {
  const loaded = page.waitForEvent("Page.loadEventFired");
  await page.send("Page.navigate", { url });
  await loaded;
}

async function evaluate(page, fn, arg) {
  const expression = `(${fn.toString()})(${JSON.stringify(arg)})`;
  const result = await page.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result?.value;
}

async function waitFor(page, fn, label, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(page, fn)) return;
    await delay(200);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function waitForAnimationFrame(page) {
  await evaluate(page, () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function captureScreenshot(page, file) {
  const screenshot = await page.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false
  });
  await writeFile(file, Buffer.from(screenshot.data, "base64"));
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${path} failed: ${payload.error || response.status}`);
  return payload;
}

async function waitForCdp(port) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      await fetchJson(`http://127.0.0.1:${port}/json/version`);
      return;
    } catch {
      await delay(150);
    }
  }
  throw new Error(`Timed out waiting for Chrome CDP on ${port}`);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${url} failed: ${response.status}`);
  return response.json();
}

async function availablePort() {
  const server = createNetServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForOutput(child, text, label) {
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out waiting for ${label}: stdout=${stdout} stderr=${stderr}`));
    }, 15000);
    const onData = () => {
      if (stdout.includes(text)) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on("data", onData);
    child.once("exit", (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`${label} exited before ready: code=${code} signal=${signal} stderr=${stderr}`));
    });
  });
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode) return;
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(1000)]);
  if (child.exitCode === null && !child.signalCode) {
    child.kill("SIGKILL");
    await Promise.race([once(child, "exit"), delay(1000)]);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
