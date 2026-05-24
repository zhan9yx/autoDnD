const OPTION_FILES = Object.freeze({
  species: Object.freeze({
    human: option("aidm-option-01", "Human Adventurer Cameo", "人类冒险者", "assets/generated/options/aidm-option-01.png"),
    elf: option("aidm-option-02", "Elf Moonleaf Cameo", "月叶精灵", "assets/generated/options/aidm-option-02.png"),
    dwarf: option("aidm-option-03", "Dwarf Forge Sigil", "矮人锻炉徽记", "assets/generated/options/aidm-option-03.png"),
    orc: option("aidm-option-04", "Orc Iron Tusk Cameo", "兽人铁牙", "assets/generated/options/aidm-option-04.png"),
    tiefling: option("aidm-option-05", "Tiefling Ember Horn Cameo", "提夫林余烬角", "assets/generated/options/aidm-option-05.png"),
    gnome: option("aidm-option-06", "Gnome Brass Tinkerer Cameo", "侏儒黄铜工匠", "assets/generated/options/aidm-option-06.png"),
    halfling: option("aidm-option-07", "Halfling Lucky Lantern Cameo", "半身人幸运提灯", "assets/generated/options/aidm-option-07.png"),
    automaton: option("aidm-option-08", "Automaton Clockwork Mask", "机关人钟表面具", "assets/generated/options/aidm-option-08.png")
  }),
  class: Object.freeze({
    warrior: option("aidm-option-09", "Warrior Crossed Blade Crest", "战士交刃纹章", "assets/generated/options/aidm-option-09.png"),
    rogue: option("aidm-option-10", "Rogue Lockpick Shadow Crest", "游荡者暗影锁簧", "assets/generated/options/aidm-option-10.png"),
    mage: option("aidm-option-11", "Mage Arcane Star Crest", "法师奥术星纹", "assets/generated/options/aidm-option-11.png"),
    cleric: option("aidm-option-12", "Cleric Sun Ward Crest", "牧师日光护符", "assets/generated/options/aidm-option-12.png"),
    ranger: option("aidm-option-13", "Ranger Thorn Arrow Crest", "游侠荆棘箭徽", "assets/generated/options/aidm-option-13.png"),
    bard: option("aidm-option-14", "Bard Silver Lute Crest", "吟游诗人银鲁特", "assets/generated/options/aidm-option-14.png"),
    occultist: option("aidm-option-15", "Occultist Black Candle Crest", "秘术师黑烛徽记", "assets/generated/options/aidm-option-15.png"),
    envoy: option("aidm-option-16", "Envoy Sealed Letter Crest", "使节封蜡信纹", "assets/generated/options/aidm-option-16.png")
  })
});

export function getCharacterOptionAsset(kind, id) {
  const group = OPTION_FILES[kind] || {};
  const asset = group[id];
  return asset ? { ...asset } : null;
}

export function getCharacterAvatar({ species = "human", classId = "warrior" } = {}) {
  return getCharacterOptionAsset("species", species) || getCharacterOptionAsset("class", classId);
}

export function listCharacterOptionAssets() {
  return {
    species: Object.values(OPTION_FILES.species).map((asset) => ({ ...asset })),
    classes: Object.values(OPTION_FILES.class).map((asset) => ({ ...asset }))
  };
}

function option(assetId, en, zh, file) {
  return Object.freeze({
    assetId,
    file,
    displayName: { en, zh },
    source: "chatgpt-image-generation",
    uiSurface: ["character-builder", "party-avatar", "player-detail"]
  });
}
