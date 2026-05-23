import { applyTranslations, normalizeLanguage, t } from "./i18n.js";
import { buildUtterancePlan, selectVoice, splitSpeechText } from "./tts.js";
import { canUseAudio, createAmbienceEngine } from "./ambience.js";

let room = null;
let playerId = localStorage.getItem("aidm.playerId") || "";
let playerToken = localStorage.getItem("aidm.playerToken") || "";
let hostToken = localStorage.getItem("aidm.hostToken") || "";
let eventSource = null;
let animationFrame = null;
let assetManifest = null;
let assetLibrary = null;
let uiLanguage = normalizeLanguage(localStorage.getItem("aidm.language") || navigator.language || "en");
let activeRoomId = "";
let selectedSceneAssetId = localStorage.getItem("aidm.sceneAssetId") || "";
const spokenEventIds = new Set();

const assetFilterState = {
  query: "",
  category: "all",
  showAll: false
};

const speechState = {
  enabled: localStorage.getItem("aidm.voice.enabled") === "true",
  selectedVoiceName: localStorage.getItem("aidm.voice.name") || "",
  rate: Number(localStorage.getItem("aidm.voice.rate") || 1),
  pitch: Number(localStorage.getItem("aidm.voice.pitch") || 1),
  voices: []
};

let drawerOpener = null;

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
  roundDock: document.querySelector("#roundDock"),
  turnDock: document.querySelector("#turnDock"),
  encounterDock: document.querySelector("#encounterDock"),
  syncDock: document.querySelector("#syncDock"),
  roster: document.querySelector("#roster"),
  transcript: document.querySelector("#transcript"),
  fullTranscript: document.querySelector("#fullTranscript"),
  logCount: document.querySelector("#logCount"),
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
  assetSearch: document.querySelector("#assetSearch"),
  assetCategoryFilter: document.querySelector("#assetCategoryFilter"),
  assetShowAll: document.querySelector("#assetShowAll"),
  assetDetail: document.querySelector("#assetDetail"),
  assetDetailTitle: document.querySelector("#assetDetailTitle"),
  assetDetailPreview: document.querySelector("#assetDetailPreview"),
  assetDetailMeta: document.querySelector("#assetDetailMeta"),
  assetDetailClose: document.querySelector("#assetDetailClose"),
  assetDetailCloseScrim: document.querySelector("#assetDetailCloseScrim"),
  assetUseScene: document.querySelector("#assetUseScene"),
  pointBudget: document.querySelector("#pointBudget"),
  metrics: document.querySelector("#metrics"),
  sceneBackdrop: document.querySelector("#sceneBackdrop"),
  sceneRail: document.querySelector("#sceneRail"),
  canvas: document.querySelector("#sceneCanvas"),
  guideOverlay: document.querySelector("#guideOverlay"),
  guideOpenButtons: document.querySelectorAll("[data-guide-open]"),
  guideCloseButtons: document.querySelectorAll("[data-guide-close]"),
  guideTabs: document.querySelectorAll("[data-guide-tab]"),
  guideSections: document.querySelectorAll("[data-guide-section]"),
  drawerOpenButtons: document.querySelectorAll("[data-drawer-open]"),
  drawerCloseButtons: document.querySelectorAll("[data-drawer-close]"),
  drawerPanels: document.querySelectorAll("[data-drawer]"),
  drawerScrim: document.querySelector("#drawerScrim"),
  voiceToggle: document.querySelector("#voiceToggle"),
  readLatestButton: document.querySelector("#readLatestButton"),
  stopVoiceButton: document.querySelector("#stopVoiceButton"),
  voiceSelect: document.querySelector("#voiceSelect"),
  voiceRate: document.querySelector("#voiceRate"),
  voicePitch: document.querySelector("#voicePitch"),
  ambienceToggle: document.querySelector("#ambienceToggle"),
  ambienceStop: document.querySelector("#ambienceStop"),
  ambienceMaster: document.querySelector("#ambienceMaster"),
  ambienceMusic: document.querySelector("#ambienceMusic"),
  ambienceEnvironment: document.querySelector("#ambienceEnvironment"),
  soundscapeLabel: document.querySelector("#soundscapeLabel"),
  soundscapeReason: document.querySelector("#soundscapeReason"),
  soundscapeLayers: document.querySelector("#soundscapeLayers")
};

const ambienceEngine = createAmbienceEngine({ onStateChange: syncAmbienceControls });

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
bindDrawers();
bindLanguageControls();
bindVoiceControls();
bindAmbienceControls();
bindAssetControls();

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
  document.body.classList.add("table-active");
  connectEvents(room.id);
  render();
}

function connectEvents(roomId) {
  if (eventSource) {
    eventSource.close();
  }
  eventSource = new EventSource(`/api/rooms/${roomId}/events`);
  eventSource.addEventListener("open", () => {
    setConnectionStatus("status.live");
  });
  eventSource.addEventListener("snapshot", (event) => {
    room = JSON.parse(event.data);
    render();
  });
  eventSource.addEventListener("error", () => {
    setConnectionStatus("status.reconnecting");
  });
}

function setConnectionStatus(statusKey) {
  const key = statusKey || "status.offline";
  if (els.connectionStatus) {
    els.connectionStatus.dataset.statusKey = key;
    els.connectionStatus.textContent = t(uiLanguage, key);
  }
  if (els.syncDock) {
    els.syncDock.textContent = t(uiLanguage, key);
  }
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
  els.turnDock.textContent = els.turnBadge.textContent;
  els.roundDock.textContent = t(uiLanguage, "round", { round: room.round });
  els.encounterDock.textContent = room.combat?.state || "scouting";
  setConnectionStatus(els.connectionStatus.dataset.statusKey || "status.offline");
  els.startButton.disabled = room.phase !== "lobby" || room.players.length === 0;

  renderRoster(active);
  renderTranscript();
  renderMemory();
  renderDirector();
  renderEncounter();
  renderMetrics();
  renderStage();
  renderAmbience();
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
  const entries = room.transcript || [];
  renderTranscriptEntries(els.transcript, entries.slice(-5));
  renderTranscriptEntries(els.fullTranscript, entries);
  if (els.logCount) {
    els.logCount.textContent = t(uiLanguage, "logEntries", { count: entries.length });
  }
  if (shouldPin) {
    els.transcript.scrollTop = els.transcript.scrollHeight;
  }
  speakNewTranscriptEntries();
}

function renderTranscriptEntries(container, entries) {
  if (!container) return;
  container.innerHTML = "";
  for (const entry of entries) {
    const message = document.createElement("article");
    message.className = `message ${entry.type}`;
    message.innerHTML = `
      <span class="meta">${escapeHtml(entry.author || entry.type)} / ${new Date(entry.createdAt).toLocaleTimeString()}</span>
      <p>${escapeHtml(entry.text)}</p>
    `;
    container.append(message);
  }
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

function renderStage() {
  if (!els.sceneBackdrop) return;
  const asset = resolveActiveSceneAsset();
  if (asset) {
    els.sceneBackdrop.style.backgroundImage = cssUrl(assetUrl(asset.file));
    els.sceneBackdrop.setAttribute("aria-label", `${t(uiLanguage, "stage.backdrop")}: ${asset.name}`);
  } else {
    els.sceneBackdrop.style.backgroundImage = "";
    els.sceneBackdrop.setAttribute("aria-label", t(uiLanguage, "stage.backdrop"));
  }
  els.table?.setAttribute("data-soundscape", room.soundscape?.id || "mystery");
  renderSceneRail();
}

function renderAmbience() {
  const soundscape = room?.soundscape;
  if (!soundscape) return;
  if (els.soundscapeLabel) {
    els.soundscapeLabel.textContent = localizeSoundscape(soundscape);
  }
  if (els.soundscapeReason) {
    els.soundscapeReason.textContent = uiLanguage === "zh"
      ? t(uiLanguage, "ambience.selectedReason", { intensity: Math.round((soundscape.intensity || 0) * 100) })
      : soundscape.reason || t(uiLanguage, "ambience.waiting");
  }
  if (els.soundscapeLayers) {
    els.soundscapeLayers.innerHTML = "";
    for (const layer of soundscape.layers || []) {
      const chip = document.createElement("span");
      chip.textContent = `${localizeLayerType(layer.type)} ${Math.round((layer.gain || 0) * 100)}%`;
      els.soundscapeLayers.append(chip);
    }
  }
  ambienceEngine.update(soundscape);
  syncAmbienceControls();
}

function syncAmbienceControls() {
  if (!els.ambienceToggle) return;
  els.ambienceToggle.textContent = t(uiLanguage, ambienceEngine.enabled ? "ambience.toggleOn" : "ambience.toggleOff");
  els.ambienceToggle.setAttribute("aria-pressed", String(ambienceEngine.enabled));
  if (els.ambienceStop) {
    els.ambienceStop.textContent = t(uiLanguage, "ambience.stop");
  }
  const volumes = ambienceEngine.volumes;
  if (els.ambienceMaster) els.ambienceMaster.value = String(volumes.master);
  if (els.ambienceMusic) els.ambienceMusic.value = String(volumes.music);
  if (els.ambienceEnvironment) els.ambienceEnvironment.value = String(volumes.ambience);
}

function renderSceneRail() {
  if (!els.sceneRail || !assetLibrary) return;
  const scenes = sceneAssets().slice(0, 10);
  els.sceneRail.innerHTML = "";
  for (const asset of scenes) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `scene-choice ${asset.id === resolveActiveSceneAsset()?.id ? "active" : ""}`;
    button.title = asset.name;
    button.style.backgroundImage = cssUrl(assetUrl(asset.file));
    button.setAttribute("aria-label", asset.name);
    button.addEventListener("click", () => useSceneAsset(asset));
    els.sceneRail.append(button);
  }
}

function resolveActiveSceneAsset() {
  const scenes = sceneAssets();
  if (scenes.length === 0) return null;
  const selected = scenes.find((asset) => asset.id === selectedSceneAssetId);
  if (selected) return selected;
  const soundscape = room?.soundscape?.id || "";
  const sceneText = [room?.scene?.location, room?.scene?.objective, room?.tone, soundscape].filter(Boolean).join(" ").toLowerCase();
  return scenes.find((asset) => assetMatchesScene(asset, soundscape, sceneText))
    || scenes.find((asset) => asset.soundscapeHints?.includes(soundscape))
    || scenes[0];
}

function sceneAssets() {
  return (assetLibrary?.assets || []).filter((asset) => asset.categoryId === "scenes" && asset.assetType === "raster" && asset.file);
}

function assetMatchesScene(asset, soundscape, sceneText) {
  const terms = [
    asset.sceneSlug,
    asset.name,
    ...(asset.tags || []),
    ...(asset.soundscapeHints || [])
  ].filter(Boolean).map((term) => String(term).toLowerCase());
  if (terms.includes(soundscape)) return true;
  return terms.some((term) => term && sceneText.includes(term.replaceAll("-", " ")))
    || terms.some((term) => term && sceneText.includes(term));
}

function useSceneAsset(asset) {
  if (!asset?.id) return;
  selectedSceneAssetId = asset.id;
  localStorage.setItem("aidm.sceneAssetId", selectedSceneAssetId);
  renderStage();
}

function openAssetDetail(asset) {
  if (!asset || !els.assetDetail) return;
  closeDrawers();
  els.assetDetailTitle.textContent = asset.name || asset.id || "Asset";
  els.assetDetailPreview.innerHTML = "";
  const preview = renderAssetPreview(asset, assetLibrary?.sheetsById || new Map());
  els.assetDetailPreview.append(preview);
  const tags = [...(asset.tags || []), ...(asset.soundscapeHints || [])].slice(0, 12);
  els.assetDetailMeta.innerHTML = `
    <span><strong>${escapeHtml(t(uiLanguage, "assetDetail.group"))}</strong>${escapeHtml(asset.group || asset.categoryId || "")}</span>
    <span><strong>${escapeHtml(t(uiLanguage, "assetDetail.file"))}</strong>${escapeHtml(asset.file || asset.sourceSheet || "")}</span>
    <span><strong>${escapeHtml(t(uiLanguage, "assetDetail.source"))}</strong>${escapeHtml(provenanceLabel(asset.provenance) || "")}</span>
    <span><strong>${escapeHtml(t(uiLanguage, "assetDetail.tags"))}</strong>${escapeHtml(tags.join(", "))}</span>
  `;
  els.assetUseScene.hidden = asset.categoryId !== "scenes";
  els.assetUseScene.dataset.assetId = asset.id;
  els.assetDetail.classList.remove("hidden");
  els.assetDetail.setAttribute("aria-hidden", "false");
  document.body.classList.add("asset-open");
  els.assetDetailClose?.focus({ preventScroll: true });
}

function closeAssetDetail() {
  if (!els.assetDetail) return;
  els.assetDetail.classList.add("hidden");
  els.assetDetail.setAttribute("aria-hidden", "true");
  document.body.classList.remove("asset-open");
}

function localizeSoundscape(soundscape) {
  const key = `soundscape.${soundscape.id}`;
  const translated = t(uiLanguage, key);
  return translated === key ? soundscape.label : translated;
}

function localizeLayerType(type) {
  const key = `layer.${type}`;
  const translated = t(uiLanguage, key);
  return translated === key ? type : translated;
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
  assetLibrary = buildAssetLibrary(assetManifest);
  const total = assetLibrary.assets.length;
  const sheetCount = assetManifest.generatedSheets.length;
  els.assetCount.textContent = sheetCount
    ? t(uiLanguage, "assetSheetCount", { count: total, sheets: sheetCount })
    : t(uiLanguage, "assetCount", { count: total });
  els.assetGrid.innerHTML = "";
  syncAssetControls();
  renderSceneRail();

  const sections = filterAssetSections(assetLibrary);
  const visibleTotal = sections.reduce((sum, section) => sum + section.assets.length, 0);
  if (visibleTotal === 0) {
    const empty = document.createElement("div");
    empty.className = "asset-empty";
    empty.textContent = t(uiLanguage, "assetFilter.empty");
    els.assetGrid.append(empty);
    return;
  }

  for (const section of sections) {
    const heading = document.createElement("div");
    heading.className = "asset-category";
    heading.innerHTML = `
      <strong>${escapeHtml(localizeCategory(section.category))}</strong>
      <span>${assetFilterState.showAll ? section.assets.length : Math.min(section.assets.length, 6)} / ${section.assets.length}</span>
    `;
    els.assetGrid.append(heading);

    for (const asset of previewAssets(section.assets, assetFilterState.showAll ? 36 : 6)) {
      els.assetGrid.append(renderAssetCard(asset, assetLibrary.sheetsById));
    }
  }
}

function previewAssets(assets, limit = 6) {
  return [...assets]
    .sort((left, right) => {
      const leftRaster = left.assetType === "raster" ? 0 : 1;
      const rightRaster = right.assetType === "raster" ? 0 : 1;
      return leftRaster - rightRaster || String(left.name).localeCompare(String(right.name));
    })
    .slice(0, limit);
}

function filterAssetSections(library) {
  const query = assetFilterState.query.trim().toLowerCase();
  return library.sections
    .filter((section) => assetFilterState.category === "all" || section.category.id === assetFilterState.category)
    .map((section) => ({
      ...section,
      assets: section.assets.filter((asset) => {
        if (!query) return true;
        const haystack = [
          asset.id,
          asset.name,
          asset.group,
          asset.categoryId,
          asset.sceneSlug,
          ...(asset.tags || []),
          ...(asset.soundscapeHints || [])
        ].join(" ").toLowerCase();
        return haystack.includes(query);
      })
    }))
    .filter((section) => section.assets.length > 0);
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
  item.tabIndex = 0;
  item.setAttribute("role", "button");
  item.setAttribute("aria-label", asset.name || asset.id || t(uiLanguage, "asset.preview"));
  item.addEventListener("click", () => openAssetDetail(asset));
  item.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAssetDetail(asset);
    }
  });
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

  if (asset.categoryId === "scenes") {
    const action = document.createElement("button");
    action.className = "asset-inline-action";
    action.type = "button";
    action.textContent = t(uiLanguage, "assetDetail.useScene");
    action.addEventListener("click", (event) => {
      event.stopPropagation();
      useSceneAsset(asset);
    });
    caption.append(action);
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

function bindDrawers() {
  for (const button of els.drawerOpenButtons) {
    button.addEventListener("click", () => openDrawer(button.dataset.drawerOpen, button));
  }
  for (const button of els.drawerCloseButtons) {
    button.addEventListener("click", closeDrawers);
  }
  els.drawerScrim?.addEventListener("click", closeDrawers);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.classList.contains("drawer-open")) {
      closeDrawers();
    }
  });
}

function openDrawer(name, opener = document.activeElement) {
  if (!name) return;
  closeAssetDetail();
  closeDrawers({ restoreFocus: false });
  drawerOpener = opener instanceof HTMLElement ? opener : null;
  for (const panel of els.drawerPanels) {
    const active = panel.dataset.drawer === name;
    panel.classList.toggle("open", active);
    panel.setAttribute("aria-hidden", String(!active));
    panel.inert = !active;
    if (active) {
      panel.removeAttribute("inert");
    } else {
      panel.setAttribute("inert", "");
    }
  }
  for (const button of els.drawerOpenButtons) {
    button.setAttribute("aria-expanded", String(button.dataset.drawerOpen === name));
  }
  els.drawerScrim?.classList.remove("hidden");
  document.body.classList.add("drawer-open");
  const closeButton = [...els.drawerPanels].find((panel) => panel.dataset.drawer === name)?.querySelector("[data-drawer-close]");
  setTimeout(() => closeButton?.focus({ preventScroll: true }), 0);
}

function closeDrawers({ restoreFocus = true } = {}) {
  for (const panel of els.drawerPanels) {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    panel.setAttribute("inert", "");
  }
  for (const button of els.drawerOpenButtons) {
    button.setAttribute("aria-expanded", "false");
  }
  els.drawerScrim?.classList.add("hidden");
  document.body.classList.remove("drawer-open");
  if (restoreFocus) {
    drawerOpener?.focus({ preventScroll: true });
  }
  drawerOpener = null;
}

function bindLanguageControls() {
  syncLanguageControls();
  for (const select of [els.createLanguageSelect, els.languageSelect].filter(Boolean)) {
    select.addEventListener("change", () => {
      applyLanguage(select.value);
    });
  }
}

function bindAssetControls() {
  els.assetSearch?.addEventListener("input", () => {
    assetFilterState.query = els.assetSearch.value;
    renderAssets();
  });
  els.assetCategoryFilter?.addEventListener("change", () => {
    assetFilterState.category = els.assetCategoryFilter.value || "all";
    renderAssets();
  });
  els.assetShowAll?.addEventListener("click", () => {
    assetFilterState.showAll = !assetFilterState.showAll;
    renderAssets();
  });
  els.assetDetailClose?.addEventListener("click", closeAssetDetail);
  els.assetDetailCloseScrim?.addEventListener("click", closeAssetDetail);
  els.assetUseScene?.addEventListener("click", () => {
    const asset = assetLibrary?.assets.find((item) => item.id === els.assetUseScene.dataset.assetId);
    if (asset) useSceneAsset(asset);
    closeAssetDetail();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.assetDetail?.classList.contains("hidden")) {
      closeAssetDetail();
    }
  });
}

function syncAssetControls() {
  if (els.assetSearch && els.assetSearch.value !== assetFilterState.query) {
    els.assetSearch.value = assetFilterState.query;
  }
  if (els.assetCategoryFilter) {
    els.assetCategoryFilter.value = assetFilterState.category;
  }
  if (els.assetShowAll) {
    els.assetShowAll.textContent = t(uiLanguage, assetFilterState.showAll ? "assetFilter.showLess" : "assetFilter.showAll");
    els.assetShowAll.setAttribute("aria-pressed", String(assetFilterState.showAll));
  }
}

function bindAmbienceControls() {
  if (!els.ambienceToggle) return;
  if (!canUseAudio()) {
    els.ambienceToggle.disabled = true;
    els.ambienceToggle.textContent = t(uiLanguage, "ambience.unsupported");
    return;
  }

  const volumes = ambienceEngine.volumes;
  els.ambienceMaster.value = String(volumes.master);
  els.ambienceMusic.value = String(volumes.music);
  els.ambienceEnvironment.value = String(volumes.ambience);

  els.ambienceToggle.addEventListener("click", async () => {
    if (ambienceEngine.enabled) {
      ambienceEngine.stop();
    } else {
      await ambienceEngine.start(room?.soundscape);
    }
    syncAmbienceControls();
  });
  els.ambienceStop.addEventListener("click", () => {
    ambienceEngine.stop();
    syncAmbienceControls();
  });

  for (const input of [els.ambienceMaster, els.ambienceMusic, els.ambienceEnvironment].filter(Boolean)) {
    input.addEventListener("input", () => {
      ambienceEngine.setVolumes({
        master: Number(els.ambienceMaster.value),
        music: Number(els.ambienceMusic.value),
        ambience: Number(els.ambienceEnvironment.value)
      });
    });
  }
  syncAmbienceControls();
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
  const soundscape = room?.soundscape?.id || "mystery";
  const intensity = room?.soundscape?.intensity || 0.25;
  const threat = room?.scene?.clocks?.danger ?? room?.scene?.threat ?? 1;
  ctx.clearRect(0, 0, width, height);

  drawAtmosphereTint(ctx, width, height, soundscape, intensity, threat);

  if (soundscape.includes("rain") || soundscape === "market-city") {
    drawRain(ctx, width, height, time, intensity);
  }
  if (soundscape === "forest" || soundscape === "insects" || soundscape === "calm-night") {
    drawMotes(ctx, width, height, time, intensity, soundscape);
  }
  if (soundscape === "campfire" || soundscape === "combat-tension") {
    drawEmbers(ctx, width, height, time, intensity);
  }
  if (soundscape === "waterfall" || soundscape === "pond") {
    drawMist(ctx, width, height, time, intensity);
  }
  if (soundscape === "combat-tension") {
    drawDangerPulse(ctx, width, height, time, intensity);
  }

  animationFrame = requestAnimationFrame(drawLoop);
}

function drawAtmosphereTint(ctx, width, height, soundscape, intensity, threat) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  const danger = threat > 3 || soundscape === "combat-tension";
  gradient.addColorStop(0, danger ? "rgba(99, 31, 28, 0.22)" : "rgba(11, 22, 25, 0.14)");
  gradient.addColorStop(0.62, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, `rgba(0, 0, 0, ${0.18 + intensity * 0.16})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawRain(ctx, width, height, time, intensity) {
  ctx.strokeStyle = `rgba(203, 228, 235, ${0.16 + intensity * 0.18})`;
  ctx.lineWidth = 1.5;
  const count = Math.floor(38 + intensity * 48);
  for (let i = 0; i < count; i += 1) {
    const x = (i * 83 + time / (12 + (i % 7))) % (width + 160) - 80;
    const y = (i * 47 + time / (8 + (i % 5))) % (height + 120) - 60;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 24, y + 80);
    ctx.stroke();
  }
}

function drawMotes(ctx, width, height, time, intensity, soundscape) {
  const warm = soundscape === "insects" || soundscape === "calm-night";
  const count = Math.floor(20 + intensity * 32);
  for (let i = 0; i < count; i += 1) {
    const x = (i * 97 + Math.sin(time / 1300 + i) * 34) % width;
    const y = (i * 61 + Math.cos(time / 1100 + i) * 26) % height;
    ctx.fillStyle = warm ? "rgba(232, 207, 112, 0.28)" : "rgba(187, 232, 201, 0.2)";
    ctx.beginPath();
    ctx.arc(x, y, 1.2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEmbers(ctx, width, height, time, intensity) {
  const count = Math.floor(18 + intensity * 34);
  for (let i = 0; i < count; i += 1) {
    const x = (i * 71 + Math.sin(time / 800 + i) * 48) % width;
    const y = height - ((i * 43 + time / (18 + (i % 5))) % (height * 0.72));
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 197, 93, 0.45)" : "rgba(217, 91, 48, 0.34)";
    ctx.beginPath();
    ctx.arc(x, y, 1.5 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMist(ctx, width, height, time, intensity) {
  ctx.fillStyle = `rgba(189, 228, 225, ${0.05 + intensity * 0.08})`;
  for (let i = 0; i < 9; i += 1) {
    const x = ((i * 211 + time / 18) % (width + 320)) - 160;
    const y = height * (0.18 + (i % 5) * 0.14);
    ctx.beginPath();
    ctx.ellipse(x, y, 180 + i * 9, 26 + (i % 3) * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDangerPulse(ctx, width, height, time, intensity) {
  const alpha = (0.08 + intensity * 0.12) * (0.5 + Math.sin(time / 420) * 0.5);
  ctx.strokeStyle = `rgba(214, 73, 58, ${alpha})`;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, width - 10, height - 10);
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
