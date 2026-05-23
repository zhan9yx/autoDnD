import { applyTranslations, normalizeLanguage, t } from "./i18n.js";
import { buildUtterancePlan, selectVoice, splitSpeechText } from "./tts.js";
import { canUseAudio, createAmbienceEngine } from "./ambience.js";

let room = null;
let playerId = localStorage.getItem("aidm.playerId") || "";
let playerToken = localStorage.getItem("aidm.playerToken") || "";
let hostToken = localStorage.getItem("aidm.hostToken") || "";
let eventSource = null;
let animationFrame = null;
let uiLanguage = normalizeLanguage(localStorage.getItem("aidm.language") || navigator.language || "en");
let activeRoomId = "";
const spokenEventIds = new Set();
const shownRewardEventIds = new Set();

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
  combatBrief: document.querySelector("#combatBrief"),
  roster: document.querySelector("#roster"),
  transcript: document.querySelector("#transcript"),
  fullTranscript: document.querySelector("#fullTranscript"),
  logCount: document.querySelector("#logCount"),
  roundBadge: document.querySelector("#roundBadge"),
  turnBadge: document.querySelector("#turnBadge"),
  sceneLocation: document.querySelector("#sceneLocation"),
  sceneObjective: document.querySelector("#sceneObjective"),
  rewardCount: document.querySelector("#rewardCount"),
  stateBeat: document.querySelector("#stateBeat"),
  stateSummary: document.querySelector("#stateSummary"),
  stateChangeList: document.querySelector("#stateChangeList"),
  encounterState: document.querySelector("#encounterState"),
  encounterList: document.querySelector("#encounterList"),
  rewardList: document.querySelector("#rewardList"),
  replayButton: document.querySelector("#replayButton"),
  replaySummary: document.querySelector("#replaySummary"),
  rewardToast: document.querySelector("#rewardToast"),
  rewardToastTitle: document.querySelector("#rewardToastTitle"),
  rewardToastText: document.querySelector("#rewardToastText"),
  rewardToastImage: document.querySelector("#rewardToastImage"),
  rewardToastClose: document.querySelector("#rewardToastClose"),
  pointBudget: document.querySelector("#pointBudget"),
  stage: document.querySelector("#stage"),
  sceneBackdrop: document.querySelector("#sceneBackdrop"),
  sceneAssetDescription: document.querySelector("#sceneAssetDescription"),
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

applyLanguage(uiLanguage);
bindPointBudget();
bindGuide();
bindDrawers();
bindLanguageControls();
bindVoiceControls();
bindAmbienceControls();
bindRewardToast();

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
  const submitButton = els.actionForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
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
  } finally {
    submitButton.disabled = false;
    submitButton.setAttribute("aria-busy", "false");
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
  renderStateSummary();
  renderEncounter();
  renderRewards();
  renderStage();
  renderAmbience();
  renderCombatBrief();
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
    const reward = entry.reward;
    message.innerHTML = `
      <span class="meta">${escapeHtml(entry.author || entry.type)} / ${new Date(entry.createdAt).toLocaleTimeString()}</span>
      ${reward?.file ? `<img class="message-asset" src="${escapeHtml(assetUrl(reward.file))}" alt="${escapeHtml(localizeTextValue(reward.displayName) || reward.name || "")}" />` : ""}
      <p>${escapeHtml(entry.text)}</p>
    `;
    container.append(message);
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
      <strong>${escapeHtml(localizeEntityName(enemy))}</strong>
      <span>${escapeHtml(t(uiLanguage, "combatHpLine", { hp: enemy.hp, maxHp: enemy.maxHp, defense: enemy.defense, role: localizeCombatRole(enemy.role) }))}</span>
    `;
    els.encounterList.append(row);
  }
  if (combat.tacticalIntent) {
    const intent = document.createElement("div");
    intent.className = "tactic-row";
    intent.textContent = `${t(uiLanguage, "intent")}: ${localizeNpcAction(combat.tacticalIntent.type)} - ${localizeNpcReason(combat.tacticalIntent.reason)}`;
    els.encounterList.append(intent);
  }
  for (const entry of (combat.log || []).slice(-5).reverse()) {
    const row = document.createElement("div");
    row.className = "combat-row";
    row.textContent = localizeTextValue(entry.localizedMessage) || entry.message;
    els.encounterList.append(row);
  }
}

function renderStateSummary() {
  if (!els.stateSummary || !els.stateChangeList) return;
  const summary = room.stateSummary || {};
  const beatLabel = localizeTextValue(summary.beat?.label) || summary.beat?.id || t(uiLanguage, "state.beat");
  if (els.stateBeat) {
    els.stateBeat.textContent = beatLabel;
    els.stateBeat.dataset.tone = summary.beat?.tone || "stable";
  }

  const clocks = summary.clocks || {};
  const quest = summary.quest;
  const cards = [
    {
      label: t(uiLanguage, "state.objective"),
      value: summary.objective || room.scene.objective,
      meter: null
    },
    {
      label: t(uiLanguage, "state.clues"),
      value: formatClock(clocks.clues),
      meter: clocks.clues
    },
    {
      label: t(uiLanguage, "state.danger"),
      value: formatClock(clocks.danger),
      meter: clocks.danger
    },
    {
      label: t(uiLanguage, "state.deadline"),
      value: formatClock(clocks.deadline),
      meter: clocks.deadline
    },
    {
      label: t(uiLanguage, "state.quest"),
      value: quest ? `${quest.title} · ${quest.progress}%` : t(uiLanguage, "state.noQuest"),
      meter: quest ? { value: quest.progress, max: 100 } : null
    }
  ];

  els.stateSummary.innerHTML = "";
  for (const card of cards) {
    const article = document.createElement("article");
    article.className = "state-summary-card";
    const meter = card.meter ? `<meter min="0" max="${escapeHtml(card.meter.max)}" value="${escapeHtml(card.meter.value)}"></meter>` : "";
    article.innerHTML = `
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      ${meter}
    `;
    els.stateSummary.append(article);
  }

  const latest = summary.latestChange || {};
  const scene = summary.scene || {};
  const media = summary.media || {};
  const blockedExit = scene.blockedExit;
  els.stateChangeList.innerHTML = "";
  els.stateChangeList.append(
    renderStateChangeItem(t(uiLanguage, "state.latest"), localizeTextValue(latest.label) || latest.type, localizeTextValue(latest.detail)),
    renderStateChangeItem(t(uiLanguage, "state.scene"), scene.location || room.scene.location, localizeShiftReason(scene.lastShiftReason || "opening-scene")),
    renderStateChangeItem(t(uiLanguage, "state.media"), localizeSoundscape(room.soundscape || {}) || media.soundscapeLabel, localizeSoundscapeReason(room.soundscape || {}))
  );
  if (blockedExit) {
    els.stateChangeList.append(renderStateChangeItem(t(uiLanguage, "state.routeHeld"), t(uiLanguage, "state.routeHeld"), localizeRouteBlock(blockedExit.reason)));
  }
  if (scene.exits?.length) {
    const item = document.createElement("div");
    item.className = "state-change-item state-exit-list";
    const exits = scene.exits.map((exit) => {
      const label = localizeTextValue(exit.label) || exit.target || exit.id;
      return `<span class="${exit.available ? "available" : "locked"}">${escapeHtml(label)}</span>`;
    }).join("");
    item.innerHTML = `<strong>${escapeHtml(t(uiLanguage, "state.exits"))}</strong><div>${exits}</div>`;
    els.stateChangeList.append(item);
  }
}

function renderStateChangeItem(label, value, detail = "") {
  const item = document.createElement("div");
  item.className = "state-change-item";
  item.innerHTML = `
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(String(value || ""))}</strong>
    ${detail ? `<small>${escapeHtml(String(detail))}</small>` : ""}
  `;
  return item;
}

function formatClock(clock) {
  if (!clock) return "0 / 6";
  return t(uiLanguage, "clock.value", { value: clock.value, max: clock.max });
}

function localizeRouteBlock(reason) {
  if (reason === "route-not-established") return t(uiLanguage, "state.routeNotEstablished");
  if (reason === "failed-check") return t(uiLanguage, "state.routeFailed");
  return String(reason || "");
}

function renderRewards() {
  const rewards = (room.transcript || []).filter((entry) => entry.type === "reward" && entry.reward).slice(-4).reverse();
  if (els.rewardCount) {
    els.rewardCount.textContent = t(uiLanguage, "reward.count", { count: rewards.length });
  }
  if (!els.rewardList) return;
  els.rewardList.innerHTML = "";
  if (rewards.length === 0) {
    const empty = document.createElement("div");
    empty.className = "reward-empty";
    empty.textContent = t(uiLanguage, "reward.empty");
    els.rewardList.append(empty);
  }
  for (const entry of rewards) {
    els.rewardList.append(renderRewardCard(entry));
  }
  const latest = rewards[0];
  if (latest && !shownRewardEventIds.has(latest.id)) {
    showRewardToast(latest);
  }
}

function bindRewardToast() {
  els.rewardToastClose?.addEventListener("click", closeRewardToast);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !els.rewardToast?.classList.contains("hidden")) {
      closeRewardToast();
    }
  });
}

function showRewardToast(entry) {
  if (!els.rewardToast || !entry?.reward) return;
  const reward = entry.reward;
  shownRewardEventIds.add(entry.id);
  els.rewardToastTitle.textContent = localizeTextValue(reward.displayName) || reward.name || t(uiLanguage, "reward.item");
  els.rewardToastText.textContent = localizeTextValue(reward.description) || entry.text;
  if (reward.file) {
    els.rewardToastImage.src = assetUrl(reward.file);
    els.rewardToastImage.alt = localizeTextValue(reward.displayName) || reward.name || "";
    els.rewardToastImage.hidden = false;
  } else {
    els.rewardToastImage.hidden = true;
  }
  els.rewardToast.classList.remove("hidden");
  els.rewardToast.setAttribute("aria-hidden", "false");
}

function closeRewardToast() {
  if (!els.rewardToast) return;
  els.rewardToast.classList.add("hidden");
  els.rewardToast.setAttribute("aria-hidden", "true");
}

function renderRewardCard(entry) {
  const reward = entry.reward || {};
  const card = document.createElement("article");
  card.className = "reward-card";
  if (reward.file) {
    const image = document.createElement("img");
    image.src = assetUrl(reward.file);
    image.alt = localizeTextValue(reward.displayName) || reward.name || t(uiLanguage, "reward.item");
    card.append(image);
  }
  const copy = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = localizeTextValue(reward.displayName) || reward.name || t(uiLanguage, "reward.item");
  const body = document.createElement("span");
  body.textContent = localizeTextValue(reward.description) || entry.text;
  copy.append(title, body);
  card.append(copy);
  return card;
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

function renderStage() {
  if (!els.sceneBackdrop) return;
  const asset = room.presentation?.sceneAsset;
  if (asset) {
    const description = assetDescription(asset);
    const sceneLabel = assetLabel(asset);
    els.sceneBackdrop.style.backgroundImage = cssUrl(assetUrl(asset.file));
    const backdropLabel = sceneLabel === t(uiLanguage, "stage.backdrop")
      ? t(uiLanguage, "stage.backdrop")
      : `${t(uiLanguage, "stage.backdrop")}: ${sceneLabel}`;
    els.sceneBackdrop.setAttribute("aria-label", backdropLabel);
    els.stage?.setAttribute("aria-label", `${t(uiLanguage, "stage.label")}: ${sceneLabel}`);
    if (els.sceneAssetDescription) {
      els.sceneAssetDescription.textContent = description;
      els.sceneAssetDescription.classList.toggle("hidden", !description);
    }
  } else {
    els.sceneBackdrop.style.backgroundImage = "";
    els.sceneBackdrop.setAttribute("aria-label", t(uiLanguage, "stage.backdrop"));
    els.stage?.setAttribute("aria-label", t(uiLanguage, "stage.label"));
    els.sceneAssetDescription?.classList.add("hidden");
  }
  els.table?.setAttribute("data-soundscape", room.soundscape?.id || "mystery");
}

function renderAmbience() {
  const soundscape = room?.soundscape;
  if (!soundscape) return;
  if (els.soundscapeLabel) {
    els.soundscapeLabel.textContent = localizeSoundscape(soundscape);
  }
  if (els.soundscapeReason) {
    els.soundscapeReason.textContent = localizeSoundscapeReason(soundscape);
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

function renderCombatBrief() {
  if (!els.combatBrief) return;
  const combat = room.stateSummary?.combat || {};
  if (!["imminent", "active", "combat", "engaged"].includes(combat.state)) {
    els.combatBrief.classList.add("hidden");
    els.combatBrief.textContent = "";
    return;
  }
  const enemy = combat.mostDangerous;
  const enemyText = enemy
    ? t(uiLanguage, "combat.briefEnemy", { name: localizeEntityName(enemy), hp: enemy.hp, maxHp: enemy.maxHp })
    : t(uiLanguage, "combat.briefNoEnemy");
  const intent = combat.tacticalIntent?.type
    ? t(uiLanguage, "combat.briefIntent", { type: localizeNpcAction(combat.tacticalIntent.type) })
    : t(uiLanguage, "combat.briefPrepare");
  els.combatBrief.textContent = `${t(uiLanguage, "combat.brief")}: ${enemyText}. ${intent}`;
  els.combatBrief.classList.remove("hidden");
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

function localizeSoundscape(soundscape) {
  const key = `soundscape.${soundscape.id}`;
  const translated = t(uiLanguage, key);
  return translated === key ? soundscape.label : translated;
}

function localizeSoundscapeReason(soundscape) {
  if (!soundscape) return t(uiLanguage, "ambience.waiting");
  const reason = soundscape.reason || t(uiLanguage, "ambience.waiting");
  if (uiLanguage !== "zh") {
    return reason;
  }
  return reason
    .replace(/^Fallback mystery bed/i, "默认使用悬疑底噪")
    .replace(/^Location matched/i, "地点匹配")
    .replace(/^Scene matched/i, "场景匹配")
    .replace(/^Recent transcript matched/i, "近期叙事匹配")
    .replace(/; scene matched/gi, "；场景匹配")
    .replace(/; recent transcript matched/gi, "；近期叙事匹配")
    .replace(/; director beat ([^;]+?)(?=;|$)/gi, "；导演节奏 $1")
    .replace(/; encounter state ([^;]+?)(?=;|$)/gi, "；遭遇状态 $1")
    .replace(/; tone ([^;]+?)(?=;|$)/gi, "；风格 $1")
    .replace(/；风格 ([^；;]+);/gi, "；风格 $1；")
    .replace(/defaulted to ([^;]+?);/i, "默认选择 $1；")
    .replace(/pressure ([0-9.]+)\./i, "压力 $1。")
    .replace(/\bmystery\b/gi, "悬疑")
    .replace(/\brain\b/gi, "雨")
    .replace(/\bcombat-tension\b/gi, "战斗紧张")
    .replace(/\bmarket\b/gi, "集市")
    .replace(/\bforest\b/gi, "森林")
    .replace(/\bwaterfall\b/gi, "瀑布")
    .replace(/\bcampfire\b/gi, "篝火")
    .replace(/\btrail\b/gi, "追踪")
    .replace(/\bdiscovery\b/gi, "发现")
    .replace(/\brevelation\b/gi, "揭示")
    .replace(/\bcrisis\b/gi, "危机")
    .replace(/；\s+/g, "；");
}

function localizeShiftReason(reason) {
  const labels = {
    "opening-scene": { en: "Opening scene", zh: "开场场景" },
    "forest-action": { en: "Moved through a forest route", zh: "沿森林路线移动" },
    "market-action": { en: "Moved through the market route", zh: "沿集市路线移动" },
    "waterfall-action": { en: "Moved into the waterfall route", zh: "进入瀑布路线" },
    "water-action": { en: "Moved into a water route", zh: "进入水域路线" },
    "camp-action": { en: "Moved into camp watch", zh: "进入营地守夜" },
    "danger-action": { en: "Threat entered the scene", zh: "威胁进入场景" }
  };
  return localizeTextValue(labels[reason]) || String(reason || "");
}

function localizeLayerType(type) {
  const key = `layer.${type}`;
  const translated = t(uiLanguage, key);
  return translated === key ? type : translated;
}

function assetDescription(asset) {
  const description = asset?.description;
  if (typeof description === "string") {
    return uiLanguage === "en" ? description.trim() : "";
  }
  return localizeTextValue(description);
}

function assetLabel(asset) {
  if (uiLanguage === "zh") {
    const zh = asset?.displayName?.zh;
    const en = asset?.displayName?.en;
    return (zh && zh !== en ? zh : "") || asset?.zhName || t(uiLanguage, "stage.backdrop");
  }
  return localizeTextValue(asset?.displayName) || asset?.name || asset?.id || t(uiLanguage, "stage.label");
}

function localizeEntityName(entity) {
  return localizeTextValue(entity?.displayName) || entity?.name || entity?.id || "";
}

function localizeCombatRole(role) {
  const labels = {
    striker: { en: "striker", zh: "突击者" },
    soldier: { en: "soldier", zh: "士兵" },
    support: { en: "support", zh: "支援者" },
    controller: { en: "controller", zh: "控场者" },
    brute: { en: "brute", zh: "重装敌人" }
  };
  return localizeTextValue(labels[role]) || role || "";
}

function localizeNpcAction(type) {
  const labels = {
    attack: { en: "attack", zh: "攻击" },
    cast: { en: "cast", zh: "施法" },
    support: { en: "support", zh: "支援" },
    defend: { en: "defend", zh: "防御" },
    flee: { en: "flee", zh: "撤离" }
  };
  return localizeTextValue(labels[type]) || type || "";
}

function localizeNpcReason(reason) {
  const labels = {
    "No legal target; hold position": { en: "No legal target; hold position", zh: "没有合法目标，保持位置" },
    "HP below morale threshold": { en: "HP below morale threshold", zh: "生命低于士气阈值" },
    "Ally is wounded": { en: "Ally is wounded", zh: "盟友受伤" },
    "Low HP and no safe retreat": { en: "Low HP and no safe retreat", zh: "生命较低且没有安全撤退路线" },
    "Best ranged or magical pressure": { en: "Best ranged or magical pressure", zh: "远程或法术压制最有效" },
    "Pressure highest threat enemy": { en: "Pressure highest threat enemy", zh: "压迫威胁最高的目标" },
    "Maintain position": { en: "Maintain position", zh: "保持阵位" }
  };
  return localizeTextValue(labels[reason]) || reason || "";
}

function localizeTextValue(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return String(value[uiLanguage] || value.en || value.zh || value.default || "").trim();
}

function assetUrl(file) {
  const value = String(file || "");
  if (/^(https?:|data:)/.test(value)) return value;
  return `/${value.replace(/^\/+/, "")}`;
}

function cssUrl(url) {
  return `url("${String(url).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}")`;
}

function bindPointBudget() {
  const inputs = [...document.querySelectorAll(".stat-grid input")];
  const update = () => {
    const total = inputs.reduce((sum, input) => sum + Number(input.value || 0), 0);
    els.pointBudget.textContent = t(uiLanguage, "pointBudget", { total, max: 27 });
    els.pointBudget.classList.toggle("over", total > 27);
  };
  for (const input of inputs) {
    input.addEventListener("input", update);
  }
  update();
  bindPointBudget.update = update;
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
  bindPointBudget.update?.();
  if (rerender) {
    if (room) render();
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
