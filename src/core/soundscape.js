const FALLBACK_UPDATED_AT = "1970-01-01T00:00:00.000Z";

export const SOUNDSCAPE_PRESETS = Object.freeze([
  Object.freeze({
    id: "combat-tension",
    label: "Combat Tension",
    category: "combat",
    priority: 100,
    baseIntensity: 0.58,
    threatGain: 0.34,
    musicCue: "combat-low-drums",
    musicMood: "danger",
    tones: Object.freeze(["heroic", "dark"]),
    beats: Object.freeze(["crisis", "retaliation"]),
    encounterStates: Object.freeze(["active", "combat", "engaged", "hostile", "started", "in-combat"]),
    keywords: Object.freeze([
      "combat", "fight", "battle", "attack", "strike", "ambush", "enemy", "hostile", "duel",
      "skirmish", "blade", "blood", "initiative", "wound", "guard", "raider", "mage",
      "战斗", "攻击", "敌人", "伏击", "刀", "剑", "受伤", "守卫"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "low-war-drums", type: "music", gain: 0.78 }),
      Object.freeze({ id: "bowed-metal-pulse", type: "tension", gain: 0.64 }),
      Object.freeze({ id: "distant-weapon-clatter", type: "foley", gain: 0.38 })
    ])
  }),
  Object.freeze({
    id: "rain",
    label: "Rain and Wet Stone",
    category: "weather",
    priority: 80,
    baseIntensity: 0.34,
    threatGain: 0.22,
    musicCue: "rain-soaked-mystery",
    musicMood: "mystery",
    tones: Object.freeze(["mystery", "noir"]),
    beats: Object.freeze(["hook", "discovery", "trail"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "rain", "storm", "thunder", "wet", "drizzle", "downpour", "monsoon", "mist",
      "slick", "puddle", "雨", "暴雨", "雷", "潮湿", "雨水", "雾"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "steady-rain", type: "weather", gain: 0.76 }),
      Object.freeze({ id: "stone-drips", type: "water", gain: 0.46 }),
      Object.freeze({ id: "distant-thunder", type: "weather", gain: 0.24 })
    ])
  }),
  Object.freeze({
    id: "forest",
    label: "Deep Forest",
    category: "nature",
    priority: 70,
    baseIntensity: 0.28,
    threatGain: 0.18,
    musicCue: "greenwood-breath",
    musicMood: "wonder",
    tones: Object.freeze(["calm", "heroic"]),
    beats: Object.freeze(["discovery", "trail"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "forest", "woods", "woodland", "grove", "jungle", "trees", "pine", "canopy",
      "leaves", "moss", "森林", "树林", "林地", "树", "树冠", "苔藓"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "leaf-wind", type: "nature", gain: 0.62 }),
      Object.freeze({ id: "distant-branches", type: "nature", gain: 0.36 }),
      Object.freeze({ id: "soft-ground-rustle", type: "foley", gain: 0.26 })
    ])
  }),
  Object.freeze({
    id: "pond",
    label: "Still Pond",
    category: "water",
    priority: 68,
    baseIntensity: 0.24,
    threatGain: 0.14,
    musicCue: "still-water-glass",
    musicMood: "calm",
    tones: Object.freeze(["calm", "mystery"]),
    beats: Object.freeze(["discovery", "trail"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "pond", "lake", "pool", "cistern", "marsh", "swamp", "reeds", "lotus", "frog",
      "池塘", "湖", "水池", "蓄水池", "沼泽", "芦苇", "莲", "蛙"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "small-water-lap", type: "water", gain: 0.58 }),
      Object.freeze({ id: "reed-brush", type: "nature", gain: 0.36 }),
      Object.freeze({ id: "soft-bubbles", type: "water", gain: 0.22 })
    ])
  }),
  Object.freeze({
    id: "waterfall",
    label: "Waterfall Gorge",
    category: "water",
    priority: 74,
    baseIntensity: 0.52,
    threatGain: 0.16,
    musicCue: "rushing-water-march",
    musicMood: "motion",
    tones: Object.freeze(["heroic", "calm"]),
    beats: Object.freeze(["trail", "discovery"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "waterfall", "cascade", "rapids", "falls", "gorge", "river", "rushing water",
      "瀑布", "急流", "峡谷", "河流", "奔流"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "waterfall-roar", type: "water", gain: 0.86 }),
      Object.freeze({ id: "spray-mist", type: "weather", gain: 0.44 }),
      Object.freeze({ id: "wet-rock-echo", type: "foley", gain: 0.28 })
    ])
  }),
  Object.freeze({
    id: "campfire",
    label: "Campfire Watch",
    category: "fire",
    priority: 66,
    baseIntensity: 0.30,
    threatGain: 0.16,
    musicCue: "ember-watch",
    musicMood: "warm",
    tones: Object.freeze(["calm", "heroic"]),
    beats: Object.freeze(["hook", "discovery"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "campfire", "fireplace", "hearth", "bonfire", "embers", "torch", "fire", "candle",
      "smoke", "营火", "篝火", "火堆", "壁炉", "余烬", "火把", "火焰", "烛", "烟"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "fire-crackle", type: "fire", gain: 0.68 }),
      Object.freeze({ id: "ember-pops", type: "fire", gain: 0.36 }),
      Object.freeze({ id: "soft-night-air", type: "nature", gain: 0.22 })
    ])
  }),
  Object.freeze({
    id: "insects",
    label: "Insects at Dusk",
    category: "nature",
    priority: 64,
    baseIntensity: 0.22,
    threatGain: 0.10,
    musicCue: "dusk-field-hum",
    musicMood: "quiet",
    tones: Object.freeze(["calm"]),
    beats: Object.freeze(["discovery", "trail"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "insect", "insects", "cricket", "crickets", "cicada", "cicadas", "mosquito", "buzz",
      "dusk", "field", "grass", "虫", "昆虫", "蟋蟀", "蝉", "蚊", "嗡嗡", "黄昏", "草地"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "cricket-bed", type: "nature", gain: 0.58 }),
      Object.freeze({ id: "cicada-thread", type: "nature", gain: 0.40 }),
      Object.freeze({ id: "dusk-breeze", type: "weather", gain: 0.18 })
    ])
  }),
  Object.freeze({
    id: "market-city",
    label: "Market and City Streets",
    category: "urban",
    priority: 72,
    baseIntensity: 0.38,
    threatGain: 0.18,
    musicCue: "urban-investigation",
    musicMood: "busy",
    tones: Object.freeze(["mystery", "heroic"]),
    beats: Object.freeze(["hook", "discovery", "trail"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "market", "city", "street", "alley", "bazaar", "plaza", "dock", "harbor", "tavern",
      "crowd", "vendor", "cart", "station", "市场", "集市", "城市", "街", "巷", "码头",
      "港口", "酒馆", "人群", "商贩", "广场"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "crowd-murmur", type: "urban", gain: 0.64 }),
      Object.freeze({ id: "cart-wheels", type: "urban", gain: 0.34 }),
      Object.freeze({ id: "distant-bells", type: "urban", gain: 0.24 })
    ])
  }),
  Object.freeze({
    id: "mystery",
    label: "Mystery Undercurrent",
    category: "mystery",
    priority: 60,
    baseIntensity: 0.32,
    threatGain: 0.24,
    musicCue: "low-clue-drone",
    musicMood: "suspense",
    tones: Object.freeze(["mystery", "noir", "dark", "horror"]),
    beats: Object.freeze(["hook", "discovery", "trail", "complication", "revelation"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "mystery", "secret", "clue", "archive", "temple", "shrine", "courthouse", "ledger",
      "sealed", "fog", "shadow", "whisper", "old stone", "ritual", "curse", "unknown",
      "秘密", "线索", "档案", "神殿", "寺", "账本", "封印", "雾", "阴影", "耳语", "仪式", "诅咒", "未知"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "low-detective-drone", type: "music", gain: 0.54 }),
      Object.freeze({ id: "candle-room-tone", type: "fire", gain: 0.26 }),
      Object.freeze({ id: "distant-whisper-tail", type: "tension", gain: 0.18 })
    ])
  }),
  Object.freeze({
    id: "calm-night",
    label: "Calm Night",
    category: "night",
    priority: 58,
    baseIntensity: 0.18,
    threatGain: 0.08,
    musicCue: "quiet-night-pads",
    musicMood: "calm",
    tones: Object.freeze(["calm", "restful"]),
    beats: Object.freeze(["hook", "discovery"]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([
      "night", "dawn", "moon", "stars", "quiet", "rest", "sleep", "calm", "watch",
      "夜", "黎明", "月", "星", "安静", "休息", "睡", "平静", "守夜"
    ]),
    layers: Object.freeze([
      Object.freeze({ id: "cool-night-air", type: "weather", gain: 0.32 }),
      Object.freeze({ id: "soft-room-tone", type: "nature", gain: 0.24 }),
      Object.freeze({ id: "distant-midnight-bell", type: "urban", gain: 0.12 })
    ])
  })
]);

const ACTIVE_ENCOUNTER_STATES = new Set(["active", "combat", "engaged", "hostile", "started", "in-combat"]);

export function chooseSoundscape(room = {}, options = {}) {
  const context = buildSoundscapeContext(room, options);
  const [winner] = rankSoundscapes(context);
  const preset = winner?.preset ?? SOUNDSCAPE_PRESETS.find((entry) => entry.id === "mystery");
  const intensity = chooseIntensity(preset, context, winner?.score ?? 0);

  return {
    id: preset.id,
    label: preset.label,
    category: preset.category,
    intensity,
    layers: buildLayers(preset, intensity),
    musicCue: {
      id: preset.musicCue,
      mood: preset.musicMood,
      energy: clamp01(round2(intensity + (preset.id === "combat-tension" ? 0.08 : 0))),
      transition: intensity >= 0.7 ? "fast-crossfade" : "slow-crossfade"
    },
    reason: buildReason(winner, context),
    updatedAt: context.updatedAt
  };
}

export function scoreSoundscapeCandidates(room = {}, options = {}) {
  return rankSoundscapes(buildSoundscapeContext(room, options)).map(({ preset, score, matches }) => ({
    id: preset.id,
    label: preset.label,
    category: preset.category,
    score,
    matches
  }));
}

export function listSoundscapePresets() {
  return SOUNDSCAPE_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    category: preset.category,
    musicCue: preset.musicCue,
    layers: preset.layers.map((layer) => ({ ...layer }))
  }));
}

function buildSoundscapeContext(room, { transcriptLimit = 6, updatedAt = null } = {}) {
  const scene = room?.scene ?? {};
  const director = room?.director ?? {};
  const combat = room?.combat ?? {};
  const directEncounter = room?.encounter ?? {};
  const combatEncounter = combat.encounter ?? {};
  const transcript = Array.isArray(room?.transcript) ? room.transcript : [];
  const recentTranscript = transcript.slice(Math.max(0, transcript.length - transcriptLimit));
  const lastTranscript = recentTranscript.at(-1) ?? transcript.at(-1) ?? null;
  const encounterState = normalizeText(directEncounter.state || combat.state || combatEncounter.state || "");
  const hasLivingEnemies = [
    ...(Array.isArray(directEncounter.enemies) ? directEncounter.enemies : []),
    ...(Array.isArray(combatEncounter.enemies) ? combatEncounter.enemies : [])
  ].some((enemy) => (enemy.hp ?? 1) > 0);

  let threat = normalizeThreat([
    scene.threatClock,
    scene.clocks?.danger,
    director.pressure,
    scene.threat,
    combat.threat,
    directEncounter.threat,
    combatEncounter.threat
  ]);
  if (ACTIVE_ENCOUNTER_STATES.has(encounterState) && hasLivingEnemies) {
    threat = Math.max(threat, 0.68);
  }

  const locationText = normalizeText(scene.location);
  const sceneText = normalizeText([
    scene.title,
    scene.location,
    scene.tone,
    room?.tone,
    scene.ambience,
    scene.objective
  ].filter(Boolean).join(" "));
  const recentText = normalizeText(recentTranscript.map(formatTranscriptEntry).join(" "));

  return {
    locationText,
    sceneText,
    recentText,
    tone: normalizeText(scene.tone || room?.tone),
    beat: normalizeText(director.beat),
    encounterState,
    threat,
    encounterActive: ACTIVE_ENCOUNTER_STATES.has(encounterState) && hasLivingEnemies,
    updatedAt: String(updatedAt || room?.updatedAt || lastTranscript?.createdAt || FALLBACK_UPDATED_AT)
  };
}

function rankSoundscapes(context) {
  return SOUNDSCAPE_PRESETS
    .map((preset) => scorePreset(preset, context))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.preset.priority !== left.preset.priority) return right.preset.priority - left.preset.priority;
      return left.preset.id.localeCompare(right.preset.id);
    });
}

function scorePreset(preset, context) {
  const locationMatches = matchTerms(context.locationText, preset.keywords);
  const sceneMatches = matchTerms(context.sceneText, preset.keywords);
  const recentMatches = matchTerms(context.recentText, preset.keywords);
  const toneMatches = preset.tones.includes(context.tone) ? [context.tone] : [];
  const beatMatches = preset.beats.includes(context.beat) ? [context.beat] : [];
  const encounterMatches = preset.encounterStates.includes(context.encounterState) ? [context.encounterState] : [];

  let score = 0;
  score += locationMatches.length * 3.4;
  score += sceneMatches.length * 1.8;
  score += recentMatches.length * 1.35;
  score += toneMatches.length * 1.2;
  score += beatMatches.length * 1.1;
  score += encounterMatches.length * 4.2;

  if (preset.id === "combat-tension") {
    if (context.encounterActive) score += 3.2;
    if (context.threat >= 0.62) score += 2.6 + context.threat * 1.8;
    if (context.beat === "crisis" || context.beat === "retaliation") score += 2.8;
  }

  if (preset.id === "rain" && locationMatches.length + sceneMatches.length + recentMatches.length >= 2) {
    score += 11;
  }

  if (preset.id === "mystery") {
    if (context.tone === "mystery") score += 1.4;
    if (context.threat >= 0.35 && context.threat < 0.72) score += 0.8;
  }

  if (preset.id === "calm-night") {
    if (context.threat <= 0.25) score += 1.6;
    if (context.threat > 0.45) score -= 4;
  }

  return {
    preset,
    score: round2(Math.max(0, score)),
    matches: {
      location: locationMatches,
      scene: sceneMatches.filter((match) => !locationMatches.includes(match)),
      recent: recentMatches,
      tone: toneMatches,
      beat: beatMatches,
      encounter: encounterMatches
    }
  };
}

function chooseIntensity(preset, context, score) {
  const scoreBoost = Math.min(0.12, score / 90);
  const beatBoost = context.beat === "crisis" || context.beat === "retaliation" ? 0.08 : 0;
  let intensity = preset.baseIntensity + context.threat * preset.threatGain + scoreBoost + beatBoost;

  if (preset.id === "combat-tension" && context.encounterActive) {
    intensity = Math.max(intensity, 0.78);
  }
  if (preset.id === "calm-night") {
    intensity = Math.min(intensity, 0.44);
  }
  if (preset.id === "pond") {
    intensity = Math.min(intensity, 0.48);
  }

  return clamp01(round2(intensity));
}

function buildLayers(preset, intensity) {
  const scale = 0.58 + intensity * 0.62;
  return preset.layers.map((layer) => ({
    id: layer.id,
    type: layer.type,
    gain: clamp01(round2(layer.gain * scale))
  }));
}

function buildReason(winner, context) {
  if (!winner) {
    return `Fallback mystery bed; pressure ${round2(context.threat)}.`;
  }

  const parts = [];
  const { matches, preset } = winner;
  if (matches.location.length > 0) {
    parts.push(`location matched ${matches.location.slice(0, 3).join(", ")}`);
  }
  if (matches.scene.length > 0) {
    parts.push(`scene matched ${matches.scene.slice(0, 3).join(", ")}`);
  }
  if (matches.recent.length > 0) {
    parts.push(`recent transcript matched ${matches.recent.slice(0, 3).join(", ")}`);
  }
  if (matches.beat.length > 0) {
    parts.push(`director beat ${matches.beat[0]}`);
  }
  if (matches.encounter.length > 0) {
    parts.push(`encounter state ${matches.encounter[0]}`);
  }
  if (matches.tone.length > 0) {
    parts.push(`tone ${matches.tone[0]}`);
  }
  if (parts.length === 0) {
    parts.push(`defaulted to ${preset.label}`);
  }

  return `${sentenceCase(parts.join("; "))}; pressure ${round2(context.threat)}.`;
}

function normalizeThreat(values) {
  return values.reduce((max, value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return max;
    const normalized = number <= 1 ? number : number <= 6 ? number / 6 : number / 10;
    return Math.max(max, clamp01(normalized));
  }, 0);
}

function matchTerms(text, terms) {
  if (!text) return [];
  return terms.filter((term) => hasTerm(text, normalizeText(term)));
}

function hasTerm(text, term) {
  if (!term) return false;
  if (/^[a-z0-9 ]+$/.test(term)) {
    const pattern = term.split(" ").map(escapeRegExp).join("\\s+");
    return new RegExp(`\\b${pattern}\\b`).test(text);
  }
  return text.includes(term);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatTranscriptEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return String(entry ?? "");
  }
  return [entry.type, entry.author, entry.text].filter(Boolean).join(" ");
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function sentenceCase(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
