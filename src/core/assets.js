export const GENERATED_RASTER_BINARY_STATUS = "external-pending-binary";

export const GENERATED_RASTER_FALLBACK_FILES = Object.freeze({
  action: "assets/items/brass-compass.svg",
  armor: "assets/items/healer-kit.svg",
  class: "assets/classes/warrior.svg",
  consumable: "assets/items/ashroot-antidote.svg",
  item: "assets/items/brass-compass.svg",
  reward: "assets/items/silver-ledger.svg",
  scene: "assets/scenes/rain-archive.svg",
  scroll: "assets/items/sealed-warrant.svg",
  spell: "assets/spells/ember-bolt.svg",
  status: "assets/spells/silver-ward.svg",
  token: "assets/enemies/street-skirmisher.svg",
  tool: "assets/items/brass-compass.svg",
  weapon: "assets/weapons/longsword.svg"
});

const CLASS_FALLBACKS = Object.freeze({
  bard: "assets/classes/bard.svg",
  cleric: "assets/classes/cleric.svg",
  envoy: "assets/classes/envoy.svg",
  mage: "assets/classes/mage.svg",
  occultist: "assets/classes/occultist.svg",
  ranger: "assets/classes/ranger.svg",
  rogue: "assets/classes/rogue.svg",
  warrior: "assets/classes/warrior.svg"
});

const SPELL_FALLBACKS = Object.freeze({
  "arcane-shield": "assets/spells/mirror-veil.svg",
  "binding-vines": "assets/spells/thorn-snare.svg",
  "cleanse-poison": "assets/spells/cleanse-poison.svg",
  firebolt: "assets/spells/ember-bolt.svg",
  "frost-bind": "assets/spells/frost-bind.svg",
  "glass-echo": "assets/spells/glass-echo.svg",
  "healing-word": "assets/spells/mend-wounds.svg",
  sleep: "assets/spells/veil-of-sleep.svg",
  "storm-arc": "assets/spells/storm-arc.svg",
  "thunder-step": "assets/spells/thunder-step.svg",
  ward: "assets/spells/silver-ward.svg"
});

export function normalizeAssetFile(file) {
  return String(file || "").replace(/^\/+/, "");
}

export function isGeneratedRasterAssetFile(file) {
  return /^assets\/generated\/.+\.(png|jpe?g|webp)$/i.test(normalizeAssetFile(file));
}

export function fallbackAssetFileFor(file, context = {}) {
  const normalized = normalizeAssetFile(file);
  if (!isGeneratedRasterAssetFile(normalized)) return "";

  const semanticKey = String(context.semanticKey || "").toLowerCase();
  const assetId = String(context.assetId || context.id || "").toLowerCase();
  const category = String(context.categoryId || context.category || "").toLowerCase();
  const search = `${normalized} ${semanticKey} ${assetId} ${category}`;

  if (/\/options\//.test(normalized)) return normalized.replace(/\.(png|jpe?g|webp)$/i, ".svg");
  if (/\/scenes\//.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.scene;
  if (/\/tokens\//.test(normalized)) return GENERATED_RASTER_FALLBACK_FILES.token;

  const classMatch = semanticKey.match(/classid:([a-z-]+)/);
  if (classMatch && CLASS_FALLBACKS[classMatch[1]]) return CLASS_FALLBACKS[classMatch[1]];
  if (/class-badge|specializationid:/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.class;
  if (/action-icon|actionid:|combat|skill/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.action;
  if (/weather-overlay|faction-overlay/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.status;
  if (/status-icon|status-hazard|statusid:|condition|hazard/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.status;

  const spellFallback = spellFallbackFor(search);
  if (/\/spells\//.test(normalized) || /^spells?$/.test(category) || spellFallback) {
    return spellFallback || GENERATED_RASTER_FALLBACK_FILES.spell;
  }

  if (/scroll-icon|scroll|spellscroll|rune/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.scroll;
  if (/weapon|sword|blade|saber|spear|axe|bow|mace|staff|dagger/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.weapon;
  if (/armor|wearable|robe|chain|leather|outfit|boots|shield/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.armor;
  if (/consumable|provision|potion|tonic|ration|bandage|salve|wine|food/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.consumable;
  if (/tool|clue|key|map|ledger|compass|lantern|monocle|mortar|hook/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.tool;
  if (/reward|treasure|trade|market|ring|coin|gem|coffer|material/.test(search)) return GENERATED_RASTER_FALLBACK_FILES.reward;

  return normalized.replace(/\.(png|jpe?g|webp)$/i, ".svg");
}

export function assetBinaryDelivery(file, context = {}) {
  if (!isGeneratedRasterAssetFile(file)) {
    return Object.freeze({ status: "repo-file" });
  }
  const fallbackFile = fallbackAssetFileFor(file, context);
  return Object.freeze({
    status: GENERATED_RASTER_BINARY_STATUS,
    fallbackFile,
    gitPolicy: "generated-raster-binary-excluded"
  });
}

export function withGeneratedAssetFallback(assetRef, context = {}) {
  if (!assetRef) return assetRef;
  const normalized = typeof assetRef === "string" ? { file: assetRef } : { ...assetRef };
  if (!normalized.file) return normalized;
  const delivery = assetBinaryDelivery(normalized.file, { ...context, ...normalized });
  if (delivery.status !== GENERATED_RASTER_BINARY_STATUS) return normalized;
  return Object.freeze({
    ...normalized,
    fallbackFile: normalized.fallbackFile || delivery.fallbackFile,
    binaryDelivery: normalized.binaryDelivery || delivery
  });
}

function spellFallbackFor(search) {
  for (const [spellId, file] of Object.entries(SPELL_FALLBACKS)) {
    if (search.includes(spellId)) return file;
  }
  if (/heal|mend|suture|restoration/.test(search)) return SPELL_FALLBACKS["healing-word"];
  if (/sleep|drowsy|veil/.test(search)) return SPELL_FALLBACKS.sleep;
  if (/ward|shield|guard|oath/.test(search)) return SPELL_FALLBACKS.ward;
  if (/frost|ice/.test(search)) return SPELL_FALLBACKS["frost-bind"];
  if (/storm|lightning|thunder/.test(search)) return SPELL_FALLBACKS["storm-arc"];
  if (/glass|mirror|echo|illusion/.test(search)) return SPELL_FALLBACKS["glass-echo"];
  if (/vine|thorn|snare|bind/.test(search)) return SPELL_FALLBACKS["binding-vines"];
  if (/poison|cleanse/.test(search)) return SPELL_FALLBACKS["cleanse-poison"];
  return "";
}
