import { applyTranslations, normalizeLanguage, t } from "./i18n.js";
import { buildUtterancePlan, selectVoice, splitSpeechText } from "./tts.js";

let room = null;
let playerId = localStorage.getItem("aidm.playerId") || "";
let playerToken = localStorage.getItem("aidm.playerToken") || "";
let hostToken = localStorage.getItem("aidm.hostToken") || "";
let eventSource = null;
let animationFrame = null;
let assetManifest = null;
let uiLanguage = normalizeLanguage(localStorage.getItem("aidm.language") || navigator.language || "en");
let activeRoomId = "";
const spokenEventIds = new Set();

const speechState = {
  enabled: localStorage.getItem("aidm.voice.enabled") === "true",
  selectedVoiceName: localStorage.getItem("aidm.voice.name") || "",
  rate: Number(localStorage.getItem("aidm.voice.rate") || 1),
  pitch: Number(localStorage.getItem("aidm.voice.pitch") || 1),
  voices: []
};

const els = {
  gateway: document.querySelector("#gateway"),
  table: document.querySelector("#table"),
  createForm: document.querySelector("#createForm"),
  createLanguageSelect: document.querySelector("#createLanguageSelect"),
  languageSelect: document.querySelector("#languageSelect"),
  joinByIdForm: document.querySelector("#joinByIdForm"),
  joinForm: document.querySelector("#joinForm"),
  actionForm: document.querySelector("#actionForm"),
  actionError: document.querySelector("#actionError"),
  startButton: document.querySelector("#startButton"),
  roomTitle: document.querySelector("#roomTitle"),
  connectionStatus: document.querySelector("#connectionStatus"),
  roster: document.querySelector("#roster"),
  transcript: document.querySelector("#transcript"),
  roundBadge: document.querySelector("#roundBadge"),
  turnBadge: document.querySelector("#turnBadge"),
  sceneLocation: document.querySelector("#sceneLocation"),
  sceneObjective: document.querySelector("#sceneObjective"),
  memoryList: document.querySelector("#memoryList"),
  memoryCount: document.querySelector("#memoryCount"),
  directorBeat: document.querySelector("#directorBeat"),
  directorList: document.querySelector("#directorList"),
  encounterState: document.querySelector("#encounterState"),
  encounterList: document.querySelector("#encounterList"),
  replayButton: document.querySelector("#replayButton"),
  replaySummary: document.querySelector("#replaySummary"),
  assetGrid: document.querySelector("#assetGrid"),
  assetCount: document.querySelector("#assetCount"),
  pointBudget: document.querySelector("#pointBudget"),
  metrics: document.querySelector("#metrics"),
  canvas: document.querySelector("#sceneCanvas"),
  guideOverlay: document.querySelector("#guideOverlay"),
  guideOpenButtons: document.querySelectorAll("[data-guide-open]"),
  guideCloseButtons: document.querySelectorAll("[data-guide-close]"),
  guideTabs: document.querySelectorAll("[data-guide-tab]"),
  guideSections: document.querySelectorAll("[data-guide-section]"),
  voiceToggle: document.querySelector("#voiceToggle"),
  readLatestButton: document.querySelector("#readLatestButton"),
  stopVoiceButton: document.querySelector("#stopVoiceButton"),
  voiceSelect: document.querySelector("#voiceSelect"),
  voiceRate: document.querySelector("#voiceRate"),
  voicePitch: document.querySelector("#voicePitch")
};

const FALLBACK_MARKETPLACE_CATEGORIES = [
  {
    id: "characters",
    name: "Characters",
    groups: ["species", "classes", "npcs", "enemies"],
    assetTypes: ["vector", "raster"]
  },
  {
    id: "scenes",
    name: "Scenes",
    groups: ["scenes"],
    assetTypes: ["vector", "raster"]
  },
  {
    id: "equipment",
    name: "Equipment",
    groups: ["weapons", "items"],
    assetTypes: ["vector", "raster"]
  },
  {
    id: "abilities",
    name: "Abilities",
    groups: ["spells"],
    assetTypes: ["vector", "raster"]
  }
];

applyLanguage(uiLanguage);
loadAssets();
bindPointBudget();
bindGuide();
bindLanguageControls();
bindVoiceControls();

els.createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(els.createForm);
  const result = await api("/api/rooms", {
    method: "POST",
    body: {
      title: form.get("title"),
      tone: form.get("tone"),
      language: form.get("language") || uiLanguage,
      system: "d20-lite"
    }
  });
  hostToken = result.session?.hostToken || "";
  if (hostToken) {
    localStorage.setItem("aidm.hostToken", hostToken);
  }
  openRoom(result.room);
});

els.joinByIdForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const roomId = new FormData(els.joinByIdForm).get("roomId");
  const result = await api(`/api/rooms/${encodeURIComponent(roomId)}`);
  openRoom(result.room);
});

els.joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!room) return;
  const form = new FormData(els.joinForm);
  const result = await api(`/api/rooms/${room.id}/join`, {
    method: "POST",
    body: {
      playerName: form.get("playerName"),
      characterName: form.get("characterName"),
      archetype: form.get("archetype"),
      species: form.get("species"),
      classId: form.get("classId"),
      stats: {
        body: form.get("body"),
        agility: form.get("agility"),
        mind: form.get("mind"),
        presence: form.get("presence"),
        spirit: form.get("spirit")
      }
    }
  });
  playerId = result.player.id;
  playerToken = result.session?.playerToken || "";
  localStorage.setItem("aidm.playerId", playerId);
  if (playerToken) {
    localStorage.setItem("aidm.playerToken", playerToken);
  }
  els.joinForm.reset();
  openRoom(result.room);
});

els.startButton.addEventListener("click", async () => {
  if (!room) return;
  const result = await api(`/api/rooms/${room.id}/start`, {
    method: "POST",
    body: { hostToken }
  });
  openRoom(result.room);
});

els.replayButton.addEventListener("click", async () => {
  if (!room) return;
  const result = await api(`/api/rooms/${room.id}/replay`);
  renderReplay(result.replay);
});

els.actionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.actionError.textContent = "";
  if (!room || !playerId) {
    els.actionError.textContent = t(uiLanguage, "joinBeforeActing");
    return;
  }
  const form = new FormData(els.actionForm);
  const intent = form.get("intent");
  const path = intent === "chat" ? "chat" : "action";
  try {
    const result = await api(`/api/rooms/${room.id}/${path}`, {
      method: "POST",
      body: {
        playerId,
        playerToken,
        text: form.get("text"),
        mode: form.get("mode"),
        expectedVersion: room.version
      }
    });
    els.actionForm.reset();
    openRoom(result.room);
  } catch (error) {
    els.actionError.textContent = error.message;
  }
});

const urlRoomId = new URL(location.href).searchParams.get("room");
if (urlRoomId) {
  api(`/api/rooms/${encodeURIComponent(urlRoomId)}`).then((result) => openRoom(result.room)).catch(() => {});
}
drawLoop();

function openRoom(nextRoom) {
  const isNewRoom = nextRoom.id !== activeRoomId;
  room = nextRoom;
  activeRoomId = room.id;
  if (room.language && room.language !== uiLanguage) {
    applyLanguage(room.language);
  }
  if (isNewRoom) {
    primeSpeechHistory(room);
  }
  history.replaceState(null, "", `?room=${room.id}`);
  els.gateway.classList.add("hidden");
  els.table.classList.remove("hidden");
  connectEvents(room.id);
  render();
}

function connectEvents(roomId) {
  if (eventSource) {
    eventSource.close();
  }
  eventSource = new EventSource(`/api/rooms/${roomId}/events`);
  eventSource.addEventListener("open", () => {
    els.connectionStatus.textContent = t(uiLanguage, "status.live");
  });
  eventSource.addEventListener("snapshot", (event) => {
    room = JSON.parse(event.data);
    render();
  });
  eventSource.addEventListener("error", () => {
    els.connectionStatus.textContent = t(uiLanguage, "status.reconnecting");
  });
}

function render() {
  if (!room) return;
  applyLanguage(room.language || uiLanguage, { rerender: false });
  els.roomTitle.textContent = room.title;
  els.roundBadge.textContent = t(uiLanguage, "round", { round: room.round });
  els.sceneLocation.textContent = room.scene.location;
  els.sceneObjective.textContent = room.scene.objective;
  document.querySelector("#threatMeter").value = room.scene.clocks?.danger ?? room.scene.threat ?? 0;
  document.querySelector("#clueMeter").value = room.scene.clocks?.clues ?? Math.min(5, (room.memories || []).length);
  const active = room.players.find((player) => player.id === room.activePlayerId);
  els.turnBadge.textContent = active ? t(uiLanguage, "activeTurn", { name: active.character.name }) : t(uiLanguage, "noActiveTurn");
  els.startButton.disabled = room.phase !== "lobby" || room.players.length === 0;

  renderRoster(active);
  renderTranscript();
  renderMemory();
  renderDirector();
  renderEncounter();
  renderMetrics();
}

function renderRoster(active) {
  els.roster.innerHTML = "";
  for (const player of room.players) {
    const row = document.createElement("div");
    row.className = `player-row ${player.id === active?.id ? "active" : ""}`;
    row.innerHTML = `
      <strong>${escapeHtml(player.character.name)}</strong>
      <span>${escapeHtml(player.name)} / ${escapeHtml(player.character.species || "human")} ${escapeHtml(player.character.className || player.character.classId || player.character.archetype)}</span>
      <span>${escapeHtml(t(uiLanguage, "hpLine", { hp: player.character.hp, maxHp: player.character.maxHp, defense: player.character.defense, initiative: player.character.initiative || 0 }))}</span>
      <span>${escapeHtml(t(uiLanguage, "statsLine", { body: player.character.stats.body, agility: player.character.stats.agility || 0, mind: player.character.stats.mind, presence: player.character.stats.presence, spirit: player.character.stats.spirit || 0 }))}</span>
    `;
    els.roster.append(row);
  }
}

function renderTranscript() {
  const shouldPin = els.transcript.scrollTop + els.transcript.clientHeight >= els.transcript.scrollHeight - 80;
  els.transcript.innerHTML = "";
  for (const entry of room.transcript || []) {
    const message = document.createElement("article");
    message.className = `message ${entry.type}`;
    message.innerHTML = `
      <span class="meta">${escapeHtml(entry.author || entry.type)} / ${new Date(entry.createdAt).toLocaleTimeString()}</span>
      <p>${escapeHtml(entry.text)}</p>
    `;
    els.transcript.append(message);
  }
  if (shouldPin) {
    els.transcript.scrollTop = els.transcript.scrollHeight;
  }
  speakNewTranscriptEntries();
}

function renderMemory() {
  const memories = [...(room.memories || [])].slice(-8).reverse();
  els.memoryCount.textContent = t(uiLanguage, "facts", { count: room.memories?.length || 0 });
  els.memoryList.innerHTML = "";
  for (const memory of memories) {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.textContent = memory.text;
    els.memoryList.append(item);
  }
}

function renderDirector() {
  const director = room.director || {};
  els.directorBeat.textContent = director.beat || "hook";
  els.directorList.innerHTML = "";
  for (const directive of director.directives || []) {
    const item = document.createElement("div");
    item.className = "director-item";
    item.textContent = directive;
    els.directorList.append(item);
  }
}

function renderEncounter() {
  const combat = room.combat || {};
  els.encounterState.textContent = combat.state || "scouting";
  els.encounterList.innerHTML = "";
  for (const enemy of combat.encounter?.enemies || []) {
    const row = document.createElement("div");
    row.className = "enemy-row";
    row.innerHTML = `
      <strong>${escapeHtml(enemy.name)}</strong>
      <span>${escapeHtml(t(uiLanguage, "combatHpLine", { hp: enemy.hp, maxHp: enemy.maxHp, defense: enemy.defense, role: enemy.role }))}</span>
    `;
    els.encounterList.append(row);
  }
  if (combat.tacticalIntent) {
    const intent = document.createElement("div");
    intent.className = "tactic-row";
    intent.textContent = `${t(uiLanguage, "intent")}: ${combat.tacticalIntent.type} - ${combat.tacticalIntent.reason}`;
    els.encounterList.append(intent);
  }
  for (const entry of (combat.log || []).slice(-5).reverse()) {
    const row = document.createElement("div");
    row.className = "combat-row";
    row.textContent = entry.message;
    els.encounterList.append(row);
  }
}

function renderReplay(replay) {
  if (!replay) {
    els.replaySummary.textContent = t(uiLanguage, "noReport");
    return;
  }
  els.replaySummary.innerHTML = `
    <strong>${escapeHtml(replay.title)}</strong>
    <span>${escapeHtml(replay.shareText)}</span>
    <span>${escapeHtml(t(uiLanguage, "replayStats", { chapters: replay.chapters.length, highlights: replay.highlights.length, memories: replay.memoryCount }))}</span>
  `;
}

function renderMetrics() {
  const metrics = room.metrics || {};
  els.metrics.innerHTML = `
    <span>${escapeHtml(t(uiLanguage, "metrics.provider"))}: ${escapeHtml(metrics.provider || "local")}</span>
    <span>${escapeHtml(t(uiLanguage, "metrics.aiCalls"))}: ${metrics.aiCalls || 0}</span>
    <span>${escapeHtml(t(uiLanguage, "metrics.latency"))}: ${metrics.lastLatencyMs || 0} ms</span>
    <span>${escapeHtml(t(uiLanguage, "metrics.version"))}: ${room.version}</span>
    <span>${escapeHtml(t(uiLanguage, "metrics.roomId"))}: ${room.id}</span>
  `;
}

async function loadAssets() {
  try {
    const [baseManifest, generatedManifest] = await Promise.all([
      fetchJson("/assets/manifest.json"),
      fetchOptionalJson("/assets/generated/manifest.json")
    ]);
    assetManifest = normalizeAssetManifest(mergeGeneratedAssets(baseManifest, generatedManifest));
    renderAssets();
  } catch {
    els.assetCount.textContent = t(uiLanguage, "assetsOffline");
  }
}

function renderAssets() {
  if (!assetManifest) return;
  const library = buildAssetLibrary(assetManifest);
  const total = library.assets.length;
  const sheetCount = assetManifest.generatedSheets.length;
  els.assetCount.textContent = sheetCount
    ? t(uiLanguage, "assetSheetCount", { count: total, sheets: sheetCount })
    : t(uiLanguage, "assetCount", { count: total });
  els.assetGrid.innerHTML = "";

  for (const section of library.sections) {
    if (section.assets.length === 0) continue;
    const heading = document.createElement("div");
    heading.className = "asset-category";
    heading.innerHTML = `
      <strong>${escapeHtml(localizeCategory(section.category))}</strong>
      <span>${Math.min(section.assets.length, 6)} / ${section.assets.length}</span>
    `;
    els.assetGrid.append(heading);

    for (const asset of previewAssets(section.assets)) {
      els.assetGrid.append(renderAssetCard(asset, library.sheetsById));
    }
  }
}

function previewAssets(assets) {
  return [...assets]
    .sort((left, right) => {
      const leftRaster = left.assetType === "raster" ? 0 : 1;
      const rightRaster = right.assetType === "raster" ? 0 : 1;
      return leftRaster - rightRaster || String(left.name).localeCompare(String(right.name));
    })
    .slice(0, 6);
}

function normalizeAssetManifest(manifest) {
  return {
    ...manifest,
    groups: manifest.groups || {},
    generatedSheets: Array.isArray(manifest.generatedSheets) ? manifest.generatedSheets : [],
    rasterAssets: Array.isArray(manifest.rasterAssets) ? manifest.rasterAssets : [],
    marketplace: {
      ...(manifest.marketplace || {}),
      categories: normalizeMarketplaceCategories(manifest)
    }
  };
}

function mergeGeneratedAssets(baseManifest, generatedManifest) {
  if (!generatedManifest) return baseManifest;

  const generatedCategories = generatedManifest.marketplace?.categories || [];
  const generatedSheets = generatedManifest.generatedSheets || generatedManifest.sheets || [];
  const generatedAssets = generatedManifest.rasterAssets || generatedManifest.assets || [];
  return {
    ...baseManifest,
    marketplace: {
      ...(baseManifest.marketplace || {}),
      categories: mergeCategories(baseManifest.marketplace?.categories || [], generatedCategories)
    },
    generatedSheets: [...(baseManifest.generatedSheets || []), ...generatedSheets],
    rasterAssets: [...(baseManifest.rasterAssets || []), ...generatedAssets.map(normalizeGeneratedAsset)]
  };
}

function mergeCategories(baseCategories, generatedCategories) {
  const categories = [...baseCategories];
  const ids = new Set(categories.map((category) => category.id));
  for (const category of generatedCategories) {
    if (!ids.has(category.id)) {
      categories.push(category);
      ids.add(category.id);
    }
  }
  return categories;
}

function normalizeGeneratedAsset(asset) {
  return {
    ...asset,
    assetType: asset.assetType || "raster",
    categoryId: asset.categoryId || (asset.group === "generated-scenes" ? "scenes" : "generated")
  };
}

function normalizeMarketplaceCategories(manifest) {
  const categories = manifest.marketplace?.categories || manifest.marketplaceCategories || [];
  return (categories.length ? categories : FALLBACK_MARKETPLACE_CATEGORIES).map((category) => ({
    ...category,
    groups: Array.isArray(category.groups) ? category.groups : [],
    assetTypes: Array.isArray(category.assetTypes) ? category.assetTypes : ["vector", "raster"]
  }));
}

function buildAssetLibrary(manifest) {
  const categories = manifest.marketplace.categories;
  const categoryByGroup = new Map(
    categories.flatMap((category) => category.groups.map((group) => [group, category.id]))
  );
  const sheetsById = new Map(manifest.generatedSheets.map((sheet) => [sheet.id, sheet]));
  const vectorAssets = Object.entries(manifest.groups).flatMap(([group, assets]) =>
    (assets || []).map((asset) => ({
      ...asset,
      group: asset.group || group,
      assetType: asset.assetType || "vector",
      categoryId: asset.categoryId || categoryByGroup.get(asset.group || group) || "uncategorized"
    }))
  );
  const rasterAssets = manifest.rasterAssets.map((asset) => ({
    ...asset,
    assetType: asset.assetType || "raster",
    categoryId: asset.categoryId || categoryByGroup.get(asset.group) || "uncategorized"
  }));
  const assets = [...vectorAssets, ...rasterAssets];
  const sections = [
    ...categories.map((category) => ({
      category,
      assets: assets.filter((asset) => asset.categoryId === category.id)
    })),
    {
      category: { id: "uncategorized", name: "Uncategorized" },
      assets: assets.filter((asset) => asset.categoryId === "uncategorized")
    }
  ];

  return { assets, sections, sheetsById };
}

function renderAssetCard(asset, sheetsById) {
  const item = document.createElement("figure");
  item.className = `asset-card ${asset.assetType === "raster" ? "raster" : "vector"}`;
  item.append(renderAssetPreview(asset, sheetsById));

  const caption = document.createElement("figcaption");
  const name = document.createElement("strong");
  name.textContent = asset.name;
  const meta = document.createElement("span");
  meta.textContent = `${t(uiLanguage, `asset.${asset.assetType || "asset"}`)} / ${asset.group || asset.categoryId || "library"}`;
  caption.append(name, meta);

  const provenance = provenanceLabel(asset.provenance);
  if (provenance) {
    const source = document.createElement("span");
    source.className = "asset-provenance";
    source.textContent = provenance;
    caption.append(source);
  }

  item.append(caption);
  return item;
}

function provenanceLabel(provenance) {
  if (typeof provenance === "string") return provenance;
  return provenance?.generator || provenance?.source || "";
}

function renderAssetPreview(asset, sheetsById) {
  if (asset.file) {
    const image = document.createElement("img");
    image.src = assetUrl(asset.file);
    image.alt = asset.name || asset.id || t(uiLanguage, "asset.preview");
    image.loading = "lazy";
    return image;
  }

  const sheet = sheetsById.get(asset.sheetId);
  const frame = resolveSpriteFrame(asset, sheet);
  if (sheet?.file && frame) {
    const thumb = document.createElement("div");
    thumb.className = "asset-thumb raster-thumb";
    thumb.setAttribute("role", "img");
    thumb.setAttribute("aria-label", asset.name || asset.id || t(uiLanguage, "asset.rasterPreview"));
    thumb.style.backgroundImage = cssUrl(assetUrl(sheet.file));
    thumb.style.backgroundSize = `${(frame.sheetWidth / frame.width) * 100}% ${(frame.sheetHeight / frame.height) * 100}%`;
    thumb.style.backgroundPosition = `${frame.positionX}% ${frame.positionY}%`;
    return thumb;
  }

  const empty = document.createElement("div");
  empty.className = "asset-thumb empty";
  empty.textContent = t(uiLanguage, "asset.empty");
  return empty;
}

function localizeCategory(category) {
  const key = `category.${category.id}`;
  const translated = t(uiLanguage, key);
  return translated === key ? category.name : translated;
}

function resolveSpriteFrame(asset, sheet) {
  if (!sheet) return null;
  const sheetWidth = Number(sheet.width || sheet.dimensions?.width || sheet.tile?.width * sheet.tile?.columns);
  const sheetHeight = Number(sheet.height || sheet.dimensions?.height || sheet.tile?.height * sheet.tile?.rows);
  const frame = asset.frame || {};
  const tile = sheet.tile || {};
  const index = Number(asset.index ?? asset.tileIndex);
  const width = Number(frame.width || tile.width);
  const height = Number(frame.height || tile.height);
  const x = Number(frame.x ?? (Number.isFinite(index) && tile.columns ? (index % tile.columns) * width : 0));
  const y = Number(frame.y ?? (Number.isFinite(index) && tile.columns ? Math.floor(index / tile.columns) * height : 0));

  if (!sheetWidth || !sheetHeight || !width || !height) return null;

  return {
    width,
    height,
    sheetWidth,
    sheetHeight,
    positionX: sheetWidth > width ? (x / (sheetWidth - width)) * 100 : 0,
    positionY: sheetHeight > height ? (y / (sheetHeight - height)) * 100 : 0
  };
}

function assetUrl(file) {
  const value = String(file || "");
  if (/^(https?:|data:)/.test(value)) return value;
  return `/${value.replace(/^\/+/, "")}`;
}

function cssUrl(url) {
  return `url("${String(url).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}")`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.json();
}

async function fetchOptionalJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return response.json();
}

function bindPointBudget() {
  const inputs = [...document.querySelectorAll(".stat-grid input")];
  const update = () => {
    const total = inputs.reduce((sum, input) => sum + Number(input.value || 0), 0);
    els.pointBudget.textContent = `${total} / 27 points`;
    els.pointBudget.classList.toggle("over", total > 27);
  };
  for (const input of inputs) {
    input.addEventListener("input", update);
  }
  update();
}

function bindGuide() {
  if (!els.guideOverlay) return;

  for (const button of els.guideOpenButtons) {
    button.addEventListener("click", () => openGuide(button.dataset.guideTabTarget || "quickstart"));
  }
  for (const button of els.guideCloseButtons) {
    button.addEventListener("click", closeGuide);
  }
  for (const tab of els.guideTabs) {
    tab.addEventListener("click", () => selectGuideTab(tab.dataset.guideTab));
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.guideOverlay.classList.contains("hidden")) {
      closeGuide();
    }
  });
}

function bindLanguageControls() {
  syncLanguageControls();
  for (const select of [els.createLanguageSelect, els.languageSelect].filter(Boolean)) {
    select.addEventListener("change", () => {
      applyLanguage(select.value);
    });
  }
}

function applyLanguage(language, { rerender = true } = {}) {
  uiLanguage = normalizeLanguage(language);
  localStorage.setItem("aidm.language", uiLanguage);
  applyTranslations(uiLanguage);
  syncLanguageControls();
  refreshVoices();
  syncVoiceControls();
  if (rerender) {
    if (room) render();
    if (assetManifest) renderAssets();
  }
}

function syncLanguageControls() {
  if (els.createLanguageSelect) {
    els.createLanguageSelect.value = uiLanguage;
  }
  if (els.languageSelect) {
    els.languageSelect.value = uiLanguage;
  }
}

function bindVoiceControls() {
  if (!els.voiceToggle || !supportsSpeech()) {
    if (els.voiceToggle) {
      els.voiceToggle.disabled = true;
      els.voiceToggle.textContent = t(uiLanguage, "voice.unsupported");
    }
    return;
  }

  speechState.rate = clampSpeechNumber(speechState.rate, 1);
  speechState.pitch = clampSpeechNumber(speechState.pitch, 1);
  els.voiceRate.value = String(speechState.rate);
  els.voicePitch.value = String(speechState.pitch);

  els.voiceToggle.addEventListener("click", () => {
    speechState.enabled = !speechState.enabled;
    localStorage.setItem("aidm.voice.enabled", String(speechState.enabled));
    syncVoiceControls();
    if (speechState.enabled) {
      readLatestTranscript();
    } else {
      stopSpeech();
    }
  });
  els.readLatestButton.addEventListener("click", readLatestTranscript);
  els.stopVoiceButton.addEventListener("click", stopSpeech);
  els.voiceSelect.addEventListener("change", () => {
    speechState.selectedVoiceName = els.voiceSelect.value;
    localStorage.setItem("aidm.voice.name", speechState.selectedVoiceName);
  });
  els.voiceRate.addEventListener("input", () => {
    speechState.rate = clampSpeechNumber(Number(els.voiceRate.value), 1);
    localStorage.setItem("aidm.voice.rate", String(speechState.rate));
  });
  els.voicePitch.addEventListener("input", () => {
    speechState.pitch = clampSpeechNumber(Number(els.voicePitch.value), 1);
    localStorage.setItem("aidm.voice.pitch", String(speechState.pitch));
  });

  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
  refreshVoices();
  syncVoiceControls();
}

function refreshVoices() {
  if (!supportsSpeech()) return;
  speechState.voices = window.speechSynthesis.getVoices();
  const selected = speechState.selectedVoiceName;
  els.voiceSelect.innerHTML = `<option value="">${escapeHtml(t(uiLanguage, "voice.auto"))}</option>`;
  const languagePrefix = uiLanguage === "zh" ? "zh" : "en";
  const matching = speechState.voices.filter((voice) => voice.lang?.toLowerCase().startsWith(languagePrefix));
  const visibleVoices = matching.length > 0 ? matching : speechState.voices;
  for (const voice of visibleVoices) {
    const option = document.createElement("option");
    option.value = voice.name;
    option.textContent = `${voice.name} (${voice.lang})`;
    els.voiceSelect.append(option);
  }
  els.voiceSelect.value = selected;
}

function syncVoiceControls() {
  if (!els.voiceToggle) return;
  els.voiceToggle.textContent = t(uiLanguage, speechState.enabled ? "voice.toggleOn" : "voice.toggleOff");
  els.voiceToggle.setAttribute("aria-pressed", String(speechState.enabled));
  if (els.readLatestButton) els.readLatestButton.textContent = t(uiLanguage, "voice.readLatest");
  if (els.stopVoiceButton) els.stopVoiceButton.textContent = t(uiLanguage, "voice.stop");
  if (els.voiceSelect?.options?.[0]) els.voiceSelect.options[0].textContent = t(uiLanguage, "voice.auto");
}

function speakNewTranscriptEntries() {
  if (!speechState.enabled || !room) return;
  const newEntries = (room.transcript || []).filter((entry) => entry.id && !spokenEventIds.has(entry.id));
  for (const entry of newEntries.slice(-3)) {
    spokenEventIds.add(entry.id);
    speakEntry(entry);
  }
}

function readLatestTranscript() {
  const latest = room?.transcript?.at(-1);
  if (latest) {
    speakEntry(latest, { interrupt: true });
  }
}

function speakEntry(entry, { interrupt = false } = {}) {
  if (!supportsSpeech() || !entry?.text) return;
  if (interrupt) {
    stopSpeech();
  }
  const plan = buildUtterancePlan({ author: entry.author || entry.type, text: entry.text, language: uiLanguage });
  for (const chunk of splitSpeechText(plan.text)) {
    const utterance = new SpeechSynthesisUtterance(chunk);
    const voice = selectVoice(speechState.voices, plan, speechState.selectedVoiceName);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || plan.language;
    utterance.rate = clampSpeechNumber(plan.profile.rate * speechState.rate, 1);
    utterance.pitch = clampSpeechNumber(plan.profile.pitch * speechState.pitch, 1);
    utterance.volume = plan.profile.volume;
    window.speechSynthesis.speak(utterance);
  }
}

function stopSpeech() {
  if (supportsSpeech()) {
    window.speechSynthesis.cancel();
  }
}

function primeSpeechHistory(nextRoom) {
  spokenEventIds.clear();
  for (const entry of nextRoom.transcript || []) {
    if (entry.id) spokenEventIds.add(entry.id);
  }
}

function supportsSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function clampSpeechNumber(value, fallback) {
  return Number.isFinite(value) ? Math.max(0.2, Math.min(2, value)) : fallback;
}

function openGuide(tab = "quickstart") {
  selectGuideTab(tab);
  els.guideOverlay.classList.remove("hidden");
  els.guideOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("guide-open");
  els.guideOverlay.querySelector(".guide-tab.active")?.focus({ preventScroll: true });
}

function closeGuide() {
  els.guideOverlay.classList.add("hidden");
  els.guideOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("guide-open");
}

function selectGuideTab(tabName = "quickstart") {
  const target = [...els.guideSections].some((section) => section.dataset.guideSection === tabName)
    ? tabName
    : "quickstart";

  for (const tab of els.guideTabs) {
    const active = tab.dataset.guideTab === target;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  }
  for (const section of els.guideSections) {
    section.classList.toggle("active", section.dataset.guideSection === target);
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function drawLoop(time = 0) {
  const canvas = els.canvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const threat = room?.scene?.threat ?? 1;
  const tone = room?.tone || "mystery";

  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, tone === "heroic" ? "#3e2f1f" : "#111716");
  sky.addColorStop(0.55, tone === "weird" ? "#253c39" : "#20231f");
  sky.addColorStop(1, threat > 2 ? "#4c1f1b" : "#10100f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(197, 161, 76, 0.14)";
  ctx.lineWidth = 1;
  for (let x = -80; x < width + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x + Math.sin(time / 1600 + x) * 18, 0);
    ctx.lineTo(x + 140, height);
    ctx.stroke();
  }

  for (let i = 0; i < 34; i += 1) {
    const x = (i * 97 + time / (18 + (i % 5))) % (width + 120) - 60;
    const y = 60 + ((i * 53) % (height - 120));
    ctx.fillStyle = `rgba(241, 231, 208, ${0.05 + (i % 4) * 0.02})`;
    ctx.fillRect(x, y, 2 + (i % 3), 18 + (i % 7) * 8);
  }

  ctx.fillStyle = "rgba(15, 16, 14, 0.82)";
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  for (let x = 0; x <= width; x += 80) {
    ctx.lineTo(x, height * 0.62 + Math.sin(x / 100 + time / 1300) * 22);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(197, 161, 76, 0.28)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i += 1) {
    const y = height * 0.74 + i * 26;
    ctx.beginPath();
    ctx.moveTo(0, y + Math.sin(time / 900 + i) * 4);
    ctx.lineTo(width, y + Math.cos(time / 1200 + i) * 4);
    ctx.stroke();
  }

  const doorX = width * 0.5;
  const doorY = height * 0.33;
  const doorW = width * 0.22;
  const doorH = height * 0.43;
  ctx.fillStyle = "rgba(34, 24, 18, 0.88)";
  ctx.strokeStyle = "rgba(213, 184, 108, 0.66)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(doorX - doorW / 2, doorY, doorW, doorH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(197, 161, 76, 0.78)";
  ctx.fillRect(doorX - doorW * 0.34, doorY + doorH * 0.18, doorW * 0.68, 4);
  ctx.fillRect(doorX - doorW * 0.34, doorY + doorH * 0.38, doorW * 0.68, 4);
  ctx.fillRect(doorX - 2, doorY + 12, 4, doorH - 24);
  ctx.beginPath();
  ctx.arc(doorX + doorW * 0.28, doorY + doorH * 0.55, 8, 0, Math.PI * 2);
  ctx.fill();

  const lampX = width * 0.72 + Math.sin(time / 900) * 12;
  const glow = ctx.createRadialGradient(lampX, height * 0.45, 8, lampX, height * 0.45, 190);
  glow.addColorStop(0, "rgba(230, 196, 103, 0.82)");
  glow.addColorStop(0.35, "rgba(214, 180, 91, 0.24)");
  glow.addColorStop(1, "rgba(214, 180, 91, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "rgba(223, 201, 145, 0.92)";
  ctx.fillRect(width * 0.24, height * 0.68, 130, 18);
  ctx.fillStyle = "rgba(142, 63, 56, 0.92)";
  ctx.fillRect(width * 0.24 + 14, height * 0.65, 88, 20);
  ctx.strokeStyle = "rgba(241, 231, 208, 0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(width * 0.24 + 14, height * 0.65, 88, 20);

  animationFrame = requestAnimationFrame(drawLoop);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

window.addEventListener("beforeunload", () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
