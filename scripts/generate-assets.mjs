#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const groups = {
  species: [
    ["human", "Human", "#d9a66a", "circle"],
    ["elf", "Elf", "#78b68f", "leaf"],
    ["dwarf", "Dwarf", "#b8874f", "hammer"],
    ["orc", "Orc", "#6f9b55", "fang"],
    ["tiefling", "Tiefling", "#b64b52", "horn"],
    ["automaton", "Automaton", "#7e96a8", "gear"],
    ["gnome", "Gnome", "#8aa0d6", "gear"],
    ["halfling", "Halfling", "#d6a45f", "circle"]
  ],
  classes: [
    ["warrior", "Warrior", "#b84a3c", "sword"],
    ["rogue", "Rogue", "#6d6a75", "dagger"],
    ["mage", "Mage", "#5f70c7", "star"],
    ["cleric", "Cleric", "#d6bc64", "sun"],
    ["ranger", "Ranger", "#5a9b65", "bow"],
    ["bard", "Bard", "#b26bb8", "lyre"],
    ["occultist", "Occultist", "#8258a8", "eye"],
    ["envoy", "Envoy", "#3d9b94", "banner"]
  ],
  weapons: [
    ["longsword", "Longsword", "#c2c7c9", "sword"],
    ["shortbow", "Shortbow", "#9a6b3f", "bow"],
    ["dagger", "Dagger", "#aab0b8", "dagger"],
    ["oak-staff", "Oak Staff", "#8b5e34", "staff"],
    ["dueling-pistol", "Dueling Pistol", "#5e5149", "pistol"],
    ["ward-shield", "Ward Shield", "#b99b4d", "shield"],
    ["rapier", "Rapier", "#bfc8d0", "sword"],
    ["warhammer", "Warhammer", "#8f8173", "hammer"],
    ["ritual-knife", "Ritual Knife", "#9e8fb6", "dagger"],
    ["hand-crossbow", "Hand Crossbow", "#8a6b49", "bow"],
    ["sun-mace", "Sun Mace", "#d6bc64", "sun"],
    ["chain-flail", "Chain Flail", "#a68a65", "rope"]
  ],
  spells: [
    ["ember-bolt", "Ember Bolt", "#d96b3a", "flame"],
    ["frost-bind", "Frost Bind", "#7cc7d8", "snow"],
    ["mend-wounds", "Mend Wounds", "#7fcf8a", "cross"],
    ["silver-ward", "Silver Ward", "#b8c6d7", "shield"],
    ["mirror-veil", "Mirror Veil", "#9a75d8", "eye"],
    ["storm-arc", "Storm Arc", "#d5d45f", "bolt"],
    ["thunder-step", "Thunder Step", "#c7c14b", "bolt"],
    ["veil-of-sleep", "Veil of Sleep", "#7d6bb2", "eye"],
    ["oath-light", "Oath Light", "#e4c76c", "sun"],
    ["thorn-snare", "Thorn Snare", "#6ca65f", "leaf"],
    ["glass-echo", "Glass Echo", "#7fb8c4", "star"],
    ["cleanse-poison", "Cleanse Poison", "#78c084", "vial"]
  ],
  items: [
    ["silver-ledger", "Silver Ledger", "#b8c6d7", "book"],
    ["ashroot-antidote", "Ashroot Antidote", "#87b96b", "vial"],
    ["storm-lantern", "Storm Lantern", "#d9b45d", "lantern"],
    ["climbing-rope", "Climbing Rope", "#9a744d", "rope"],
    ["moon-key", "Moon Key", "#c9c1a2", "key"],
    ["house-signet", "House Signet", "#b06d45", "ring"],
    ["sealed-warrant", "Sealed Warrant", "#d0b16b", "book"],
    ["brass-compass", "Brass Compass", "#c7a450", "gear"],
    ["nightglass-lens", "Nightglass Lens", "#6f7ea8", "eye"],
    ["coded-map", "Coded Map", "#b9a878", "book"],
    ["healer-kit", "Healer Kit", "#7fcf8a", "cross"],
    ["witness-charm", "Witness Charm", "#b06d45", "ring"]
  ],
  scenes: [
    ["rain-archive", "Rain Archive", "#2e5756", "door"],
    ["copper-kettle", "Copper Kettle", "#a6603a", "mug"],
    ["bellmaker-alley", "Bellmaker Alley", "#5c5966", "bell"],
    ["cistern-shrine", "Cistern Shrine", "#3f7480", "moon"],
    ["old-courthouse", "Old Courthouse", "#82715d", "columns"],
    ["dock-seven", "Dock Seven", "#3d698c", "anchor"],
    ["observatory-roof", "Observatory Roof", "#415d83", "moon"],
    ["velvet-theater", "Velvet Theater", "#7b3f55", "columns"],
    ["glass-market", "Glass Market", "#4d8f8a", "bell"],
    ["breaker-tunnel", "Breaker Tunnel", "#345f72", "anchor"]
  ],
  npcs: [
    ["archive-keeper", "Archive Keeper", "#8b7156", "book"],
    ["dock-broker", "Dock Broker", "#6a7d8f", "anchor"],
    ["bellmaker", "Bellmaker", "#9a7d4a", "bell"],
    ["masked-heir", "Masked Heir", "#7f4e65", "eye"],
    ["rail-inspector", "Rail Inspector", "#6f7d83", "gear"],
    ["temple-medic", "Temple Medic", "#78b97d", "cross"],
    ["oath-judge", "Oath Judge", "#b99b4d", "columns"],
    ["street-oracle", "Street Oracle", "#7d6bb2", "star"]
  ],
  enemies: [
    ["street-skirmisher", "Street Skirmisher", "#7f5748", "dagger"],
    ["bone-guard", "Bone Guard", "#b8b2a0", "shield"],
    ["veiled-acolyte", "Veiled Acolyte", "#6b4e83", "eye"],
    ["alley-archer", "Alley Archer", "#6b7348", "bow"],
    ["iron-raider", "Iron Raider", "#8f4d3d", "sword"],
    ["bridge-brute", "Bridge Brute", "#8a6b49", "hammer"],
    ["shadow-mage", "Shadow Mage", "#4f4b7d", "star"],
    ["clockwork-warden", "Clockwork Warden", "#7e96a8", "gear"],
    ["cinder-adept", "Cinder Adept", "#c75f3a", "flame"],
    ["fogbound-cutthroat", "Fogbound Cutthroat", "#6d6a75", "dagger"],
    ["mirror-duelist", "Mirror Duelist", "#9a75d8", "sword"],
    ["storm-herald", "Storm Herald", "#c7c14b", "bolt"]
  ]
};

const generatedAt = "2026-05-24T00:00:00.000+08:00";

const license = {
  id: "aidm-project-local-svg",
  name: "Project-local generated SVG assets for AIDM UI reuse.",
  usage: "Reusable inside the AIDM project UI and tests.",
  attribution: "Generated by scripts/generate-assets.mjs."
};

const provenance = {
  source: "scripts/generate-assets.mjs",
  generator: "deterministic-svg",
  generatedAt
};

const marketplaceCategories = [
  {
    id: "characters",
    name: "Characters",
    description: "Playable identities, roles, NPC portraits, and enemy tokens.",
    groups: ["species", "classes", "npcs", "enemies"],
    assetTypes: ["vector", "raster"]
  },
  {
    id: "scenes",
    name: "Scenes",
    description: "Locations, backdrops, encounter spaces, and adventure cards.",
    groups: ["scenes"],
    assetTypes: ["vector", "raster"]
  },
  {
    id: "equipment",
    name: "Equipment",
    description: "Weapons, tools, consumables, and inventory props.",
    groups: ["weapons", "items"],
    assetTypes: ["vector", "raster"]
  },
  {
    id: "abilities",
    name: "Abilities",
    description: "Spells, powers, effects, and action icons.",
    groups: ["spells"],
    assetTypes: ["vector", "raster"]
  }
];

const groupCategory = new Map(
  marketplaceCategories.flatMap((category) => category.groups.map((group) => [group, category.id]))
);

const manifest = {};

for (const [group, assets] of Object.entries(groups)) {
  manifest[group] = [];
  await mkdir(join("assets", group), { recursive: true });
  for (const [id, name, color, glyph] of assets) {
    const file = `${id}.svg`;
    await writeFile(join("assets", group, file), renderSvg({ id, name, color, glyph, group }));
    manifest[group].push({
      id,
      name,
      group,
      categoryId: groupCategory.get(group) || "uncategorized",
      assetType: "vector",
      file: `assets/${group}/${file}`,
      tags: [group, glyph, ...name.toLowerCase().split(/\s+/)],
      license,
      provenance: {
        ...provenance,
        assetId: id,
        group
      }
    });
  }
}

await writeFile(
  "assets/manifest.json",
  JSON.stringify(
    {
      version: 2,
      generatedAt,
      license,
      provenance,
      marketplace: {
        categories: marketplaceCategories
      },
      groups: manifest,
      generatedSheets: [],
      rasterAssets: []
    },
    null,
    2
  )
);

function renderSvg({ id, name, color, glyph, group }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title desc">
  <title id="title">${escapeXml(name)}</title>
  <desc id="desc">AIDM ${escapeXml(group)} asset ${escapeXml(id)}</desc>
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="70%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.95"/>
      <stop offset="62%" stop-color="${color}" stop-opacity="0.42"/>
      <stop offset="100%" stop-color="#171512" stop-opacity="1"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity="0.42"/>
    </filter>
  </defs>
  <rect width="256" height="256" rx="24" fill="#171512"/>
  <path d="M22 190 C72 158 104 214 156 179 C189 157 215 166 236 185 L236 234 L22 234 Z" fill="${color}" opacity="0.18"/>
  <circle cx="128" cy="112" r="78" fill="url(#bg)" stroke="#e8d8a8" stroke-opacity="0.32" stroke-width="3"/>
  ${glyphPath(glyph, color)}
  <text x="128" y="226" text-anchor="middle" fill="#f1e7d0" font-size="18" font-family="Georgia,serif" font-weight="700">${escapeXml(name)}</text>
</svg>
`;
}

function glyphPath(glyph, color) {
  const stroke = `stroke="#f1e7d0" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#shadow)"`;
  const fill = `fill="#f1e7d0" filter="url(#shadow)"`;
  const accent = `fill="${color}" stroke="#f1e7d0" stroke-width="6" filter="url(#shadow)"`;
  const paths = {
    circle: `<circle cx="128" cy="112" r="38" ${fill}/><path d="M76 174c18-28 86-28 104 0" ${stroke}/>`,
    leaf: `<path d="M75 151c65-91 119-75 110-12-4 31-41 48-83 35 26-18 45-39 58-64-25 30-50 49-85 41Z" ${accent}/>`,
    hammer: `<path d="M82 79h82l24 24-25 25-25-25H82Z" ${accent}/><path d="M132 125l-45 60" ${stroke}/>`,
    fang: `<path d="M92 72c42 38 51 79 27 123-6-49-26-70-27-123Zm72 0c-42 38-51 79-27 123 6-49 26-70 27-123Z" ${fill}/>`,
    horn: `<path d="M78 81c31 5 49 24 54 57-36-13-55-31-54-57Zm100 0c-31 5-49 24-54 57 36-13 55-31 54-57Z" ${accent}/><circle cx="128" cy="150" r="26" ${fill}/>`,
    gear: `<path d="M128 62v25m0 50v25m66-50h-25m-50 0H94m81-47-18 18m-36 36-18 18m0-72 18 18m36 36 18 18" ${stroke}/><circle cx="128" cy="112" r="32" ${accent}/>`,
    sword: `<path d="M156 54 98 142m-21 21 82-82 20-47-47 20-82 82m38 38 30-30" ${stroke}/>`,
    dagger: `<path d="M165 62 111 143m-28 28 64-64 18-45-45 18-64 64m20 28 42-42" ${stroke}/>`,
    star: `<path d="m128 54 17 42 45 4-34 29 11 44-39-23-39 23 11-44-34-29 45-4Z" ${accent}/>`,
    sun: `<circle cx="128" cy="112" r="33" ${accent}/><path d="M128 49v28m0 70v28M65 112h28m70 0h28M83 67l20 20m50 50 20 20m0-90-20 20m-50 50-20 20" ${stroke}/>`,
    bow: `<path d="M160 54c-42 34-42 82 0 116M98 60l64 110M94 112h90" ${stroke}/>`,
    lyre: `<path d="M86 74c0 62 84 62 84 0m-84 0v76c0 22 84 22 84 0V74M106 82v82m22-90v96m22-88v82" ${stroke}/>`,
    eye: `<path d="M57 116c35-47 107-47 142 0-35 47-107 47-142 0Z" ${accent}/><circle cx="128" cy="116" r="24" fill="#171512" stroke="#f1e7d0" stroke-width="8"/>`,
    banner: `<path d="M84 179V62h88l-20 31 20 31H84" ${accent}/>`,
    staff: `<path d="M98 188 151 58m-23 44c26-31 50-11 35 14-12 20-37 9-35-14Z" ${stroke}/>`,
    pistol: `<path d="M73 104h94l21 20-18 20h-41l-16 35H82l19-35H73Z" ${accent}/>`,
    shield: `<path d="M128 54 187 78c-6 60-25 94-59 116-34-22-53-56-59-116Z" ${accent}/>`,
    flame: `<path d="M129 51c39 43-5 52 24 83 15 17 8 48-25 48-37 0-54-35-31-66 13-18 31-28 32-65Z" ${accent}/>`,
    snow: `<path d="M128 56v112m-49-84 98 56m0-56-98 56m25-70 24 18 24-18m-48 84 24-18 24 18" ${stroke}/>`,
    cross: `<path d="M111 62h34v35h35v34h-35v35h-34v-35H76V97h35Z" ${accent}/>`,
    bolt: `<path d="M145 48 85 129h42l-20 79 66-99h-44Z" ${accent}/>`,
    book: `<path d="M72 65h60c16 0 28 10 28 25v88c0-15-12-25-28-25H72Z" ${accent}/><path d="M160 90c0-15 12-25 28-25h8v88h-8c-16 0-28 10-28 25" ${stroke}/>`,
    vial: `<path d="M105 55h46m-34 0v42l-34 68c-8 17 4 34 23 34h44c19 0 31-17 23-34l-34-68V55" ${stroke}/><path d="M97 155h62" ${stroke}/>`,
    lantern: `<path d="M101 84h54l16 24v67H85v-67Zm9-33h36l14 33H96Z" ${accent}/><path d="M128 111v44" ${stroke}/>`,
    rope: `<path d="M87 91c0-36 82-36 82 0 0 53-82 31-82 79 0 33 82 33 82 0" ${stroke}/>`,
    key: `<circle cx="95" cy="109" r="28" ${stroke}/><path d="M123 109h67m-22 0v25m-22-25v18" ${stroke}/>`,
    ring: `<circle cx="128" cy="119" r="48" ${stroke}/><path d="M104 73h48l13 28H91Z" ${accent}/>`,
    door: `<path d="M85 58h86v128H85Z" ${accent}/><path d="M128 58v128m-23-82h46m-46 36h46" ${stroke}/><circle cx="154" cy="127" r="6" ${fill}/>`,
    mug: `<path d="M80 79h83v86c0 21-83 21-83 0Zm83 24h22c21 0 21 45 0 45h-22" ${stroke}/>`,
    bell: `<path d="M86 151h84c-15-15-10-56-18-76-8-21-40-21-48 0-8 20-3 61-18 76Zm27 26h30" ${stroke}/>`,
    moon: `<path d="M157 57c-45 12-61 72-25 104 13 12 30 16 47 11-18 25-57 30-84 5-36-33-25-94 20-115 14-7 29-8 42-5Z" ${accent}/>`,
    columns: `<path d="M63 174h130M76 82h104M90 82v92m38-92v92m38-92v92M70 62h116l-58-28Z" ${stroke}/>`,
    anchor: `<path d="M128 54v111m-35-68h70m-72 47c2 38 72 38 74 0m-98 8 24-8-8 24m106-16-24-8 8 24" ${stroke}/>`
  };
  return paths[glyph] || paths.star;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
