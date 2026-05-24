import { abilityModifier, calculateDefense, getEquipment, getSpell, proficiencyBonus } from "./rules.js";

export const CURRENCY = Object.freeze({
  id: "coin",
  name: { en: "Crowns", zh: "克朗" },
  symbol: "CR"
});

export const ITEM_ECONOMY = Object.freeze({
  shopMarkup: 1.25,
  sellbackRate: 0.55
});

export function formatCurrencyLabel(amount, language = "en") {
  const value = Math.max(0, Number.parseInt(amount ?? 0, 10) || 0);
  const suffix = String(language || "en").toLowerCase().startsWith("zh")
    ? CURRENCY.name.zh
    : CURRENCY.symbol;
  return `${value} ${suffix}`;
}

export const ITEM_CONDITIONS = Object.freeze({
  poor: Object.freeze({ id: "poor", label: { en: "Poor", zh: "破旧" }, multiplier: 0.55 }),
  worn: Object.freeze({ id: "worn", label: { en: "Worn", zh: "磨损" }, multiplier: 0.75 }),
  fine: Object.freeze({ id: "fine", label: { en: "Fine", zh: "良好" }, multiplier: 1 }),
  pristine: Object.freeze({ id: "pristine", label: { en: "Pristine", zh: "崭新" }, multiplier: 1.35 }),
  masterwork: Object.freeze({ id: "masterwork", label: { en: "Masterwork", zh: "精工" }, multiplier: 1.8 })
});

export const ITEM_RARITIES = Object.freeze({
  common: Object.freeze({ id: "common", label: { en: "Common", zh: "常见" } }),
  notable: Object.freeze({ id: "notable", label: { en: "Notable", zh: "醒目" } }),
  uncommon: Object.freeze({ id: "uncommon", label: { en: "Uncommon", zh: "少见" } }),
  rare: Object.freeze({ id: "rare", label: { en: "Rare", zh: "稀有" } }),
  epic: Object.freeze({ id: "epic", label: { en: "Epic", zh: "史诗" } }),
  legendary: Object.freeze({ id: "legendary", label: { en: "Legendary", zh: "传说" } })
});

export const ITEM_CATEGORIES = Object.freeze({
  weapon: { en: "Weapon", zh: "武器" },
  armor: { en: "Armor", zh: "护甲" },
  shield: { en: "Shield", zh: "盾牌" },
  spellScroll: { en: "Spell scroll", zh: "法卷" },
  tool: { en: "Tool", zh: "工具" },
  consumable: { en: "Consumable", zh: "消耗品" },
  tradeGood: { en: "Trade good", zh: "可售卖物" },
  food: { en: "Food and drink", zh: "食品与酒饮" },
  fashion: { en: "Fashion", zh: "时装" },
  quest: { en: "Quest item", zh: "任务物品" }
});

export const EQUIPMENT_SLOTS = Object.freeze({
  mainHand: Object.freeze({ id: "mainHand", label: { en: "Main hand", zh: "主手" } }),
  offHand: Object.freeze({ id: "offHand", label: { en: "Off hand", zh: "副手" } }),
  body: Object.freeze({ id: "body", label: { en: "Body", zh: "身体" } }),
  accessory: Object.freeze({ id: "accessory", label: { en: "Accessory", zh: "饰品" } })
});

export const XP_THRESHOLDS = Object.freeze([0, 100, 300, 600, 1000]);

export const ITEM_CATALOG = Object.freeze({
  "travel-lamp": item({
    id: "travel-lamp",
    name: { en: "Travel Lamp", zh: "旅行提灯" },
    category: "tool",
    baseValue: 12,
    tradeable: true,
    tags: ["light", "tool"],
    assetRef: { file: "assets/items/storm-lantern.svg", semanticKey: "lamp" },
    description: {
      en: "A brass travel lamp with a blue glass shield. Its flame stays steady in drizzle and makes wet stone gleam like polished ink.",
      zh: "一盏带蓝玻璃罩的黄铜旅行提灯。细雨里火苗依旧稳定，能把湿石照得像刚打磨过的墨。"
    }
  }),
  "field-notebook": item({
    id: "field-notebook",
    name: { en: "Field Notebook", zh: "现场札记" },
    category: "tool",
    baseValue: 8,
    tradeable: false,
    tags: ["note", "memory"],
    assetRef: { file: "assets/items/silver-ledger.svg", semanticKey: "notebook" },
    description: {
      en: "Waxed pages stitched into a weathered cover. Margins are marked for suspects, clues, promises, and debts.",
      zh: "打蜡纸页缝在旧封皮里，页边预留了嫌疑人、线索、承诺与欠账的位置。"
    }
  }),
  longsword: item({
    id: "longsword",
    name: { en: "Longsword", zh: "长剑" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 55,
    tradeable: true,
    tags: ["weapon", "melee", "slashing"],
    assetRef: { file: "assets/weapons/longsword.svg", semanticKey: "longsword" },
    description: {
      en: "A balanced patrol blade with a worn leather grip. Its fuller still carries old rainwater stains.",
      zh: "一柄配重稳当的巡逻长剑，皮柄已经磨旧，剑脊槽里还留着旧日雨渍。"
    }
  }),
  shield: item({
    id: "shield",
    name: { en: "Ward Shield", zh: "守护盾" },
    category: "shield",
    slot: "offHand",
    baseValue: 42,
    tradeable: true,
    tags: ["shield", "defense"],
    assetRef: { file: "assets/weapons/ward-shield.svg", semanticKey: "shield" },
    description: {
      en: "A compact shield painted with a fading ward-mark. It has stopped more panic than blades.",
      zh: "一面画着褪色护符的小盾。它挡下的恐惧，或许比刀刃还多。"
    }
  }),
  dagger: item({
    id: "dagger",
    name: { en: "Dagger", zh: "匕首" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 24,
    tradeable: true,
    tags: ["weapon", "light", "piercing"],
    assetRef: { file: "assets/generated/weapons/aidm-weapon-014-04.png", semanticKey: "items.dagger.glassfang-dagger.v01" },
    description: {
      en: "A narrow street blade that vanishes cleanly into a sleeve. The edge is honest even when its owner is not.",
      zh: "一柄能利落藏进袖口的窄刃街刀。刀口很诚实，哪怕主人未必如此。"
    }
  }),
  shortbow: item({
    id: "shortbow",
    name: { en: "Shortbow", zh: "短弓" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 48,
    tradeable: true,
    tags: ["weapon", "ranged"],
    assetRef: { file: "assets/weapons/shortbow.svg", semanticKey: "shortbow" },
    description: {
      en: "A rain-oiled bow sized for alleys and forest tracks, quiet enough to answer before a shout finishes.",
      zh: "一张适合巷战与林径的短弓，防雨油还没干，安静得能在喊声落下前回应。"
    }
  }),
  staff: item({
    id: "staff",
    name: { en: "Oak Staff", zh: "橡木杖" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 18,
    tradeable: true,
    tags: ["weapon", "focus", "bludgeoning"],
    assetRef: { file: "assets/generated/weapons/aidm-weapon-014-11.png", semanticKey: "items.staff.amber-focus-staff.v01" },
    description: {
      en: "A polished oak staff with brass rings near the grip. It can walk, ward, and strike with the same plain certainty.",
      zh: "一根打磨过的橡木杖，握柄旁有黄铜环。它能行路、护身，也能以同样朴素的确定性击人。"
    }
  }),
  mace: item({
    id: "mace",
    name: { en: "Sun Mace", zh: "日纹钉锤" },
    category: "weapon",
    slot: "mainHand",
    baseValue: 38,
    tradeable: true,
    tags: ["weapon", "divine", "bludgeoning"],
    assetRef: { file: "assets/generated/weapons/aidm-weapon-014-08.png", semanticKey: "items.mace.grave-iron-mace.v01" },
    description: {
      en: "A short mace stamped with a sunburst. Temple guards claim it rings differently near a lie.",
      zh: "一柄压着日芒纹的短钉锤。神殿守卫说，它在谎言附近会响得不太一样。"
    }
  }),
  robe: item({
    id: "robe",
    name: { en: "Travel Robe", zh: "旅行长袍" },
    category: "armor",
    slot: "body",
    baseValue: 22,
    tradeable: true,
    tags: ["armor", "cloth"],
    assetRef: { file: "assets/generated/items/aidm-equipment-fashion-013-05.png", semanticKey: "items.robe.ember-scholar-robe.v01" },
    description: {
      en: "A layered robe with hidden inner pockets for chalk, wire, and folded apologies.",
      zh: "一件分层长袍，内袋能藏粉笔、细线，以及折好的道歉信。"
    }
  }),
  leather: item({
    id: "leather",
    name: { en: "Leather Armor", zh: "皮甲" },
    category: "armor",
    slot: "body",
    baseValue: 45,
    tradeable: true,
    tags: ["armor", "light"],
    assetRef: { file: "assets/items/healer-kit.svg", semanticKey: "leather" },
    description: {
      en: "Soft black leather reinforced under the ribs and shoulders, made for running before it is made for dueling.",
      zh: "柔软黑皮在肋侧与肩部加固，比起决斗，它更适合让人活着跑出去。"
    }
  }),
  chainmail: item({
    id: "chainmail",
    name: { en: "Chainmail", zh: "链甲" },
    category: "armor",
    slot: "body",
    baseValue: 95,
    tradeable: true,
    tags: ["armor", "heavy"],
    assetRef: { file: "assets/weapons/ward-shield.svg", semanticKey: "chainmail" },
    description: {
      en: "A heavy shirt of linked iron, patched at the left side where something once tried to prove a point.",
      zh: "一件沉重的铁环甲，左侧补过一片，像是曾有什么东西在那里证明过观点。"
    }
  }),
  "moon-key": item({
    id: "moon-key",
    name: { en: "Moon Key", zh: "月相钥匙" },
    category: "quest",
    rarity: "rare",
    baseValue: 120,
    tradeable: false,
    tags: ["key", "quest", "moon"],
    assetRef: { file: "assets/items/moon-key.svg", semanticKey: "moon-key" },
    description: {
      en: "A pale key whose teeth change under moonlight. Every lock it fits seems to remember the hand that made it.",
      zh: "一枚淡色钥匙，月光下齿纹会轻微改变。凡是它能开的锁，似乎都记得铸造者的手。"
    }
  }),
  "silver-ledger": item({
    id: "silver-ledger",
    name: { en: "Silver Ledger", zh: "银边账本" },
    category: "tradeGood",
    baseValue: 80,
    tradeable: true,
    tags: ["ledger", "clue", "trade"],
    assetRef: { file: "assets/items/silver-ledger.svg", semanticKey: "ledger" },
    description: {
      en: "A ledger trimmed in tarnished silver. Several pages were torn out carefully, which is often louder than a confession.",
      zh: "一本镶着失光银边的账本。几页被小心撕去，而这往往比供词更响。"
    }
  }),
  "storm-lantern": item({
    id: "storm-lantern",
    name: { en: "Storm Lantern", zh: "暴风提灯" },
    category: "tool",
    baseValue: 64,
    tradeable: true,
    tags: ["lamp", "storm", "tool"],
    assetRef: { file: "assets/items/storm-lantern.svg", semanticKey: "storm-lantern" },
    description: {
      en: "A sealed lantern that glows brighter when thunder rolls. Sailors swear it points toward dry ground.",
      zh: "一盏密封提灯，雷声滚过时会更亮些。水手发誓它会指向干燥的地面。"
    }
  }),
  "healing-word-scroll": scroll({
    id: "healing-word-scroll",
    spellId: "healing-word",
    name: { en: "Scroll of Healing Word", zh: "治疗真言法卷" },
    rarity: "uncommon",
    baseValue: 110,
    assetRef: { file: "assets/spells/mend-wounds.svg", semanticKey: "healing-word-scroll" },
    description: {
      en: "A ribbon-bound scroll left behind by a nameless field saint. The ink warms when held near a wounded ally.",
      zh: "一卷以缎带束起的法卷，像是某位无名战地圣徒遗落之物。靠近伤者时，墨迹会微微发暖。"
    }
  }),
  "sleep-scroll": scroll({
    id: "sleep-scroll",
    spellId: "sleep",
    name: { en: "Scroll of Veiled Sleep", zh: "睡眠帷幕法卷" },
    rarity: "uncommon",
    baseValue: 95,
    assetRef: { file: "assets/spells/veil-of-sleep.svg", semanticKey: "sleep-scroll" },
    description: {
      en: "A violet scroll smelling faintly of rain on velvet curtains. Its script blurs when read aloud too eagerly.",
      zh: "一卷带淡紫色的法卷，闻起来像雨落在天鹅绒帘上。若读得太急，字迹会自己模糊。"
    }
  }),
  "binding-vines-scroll": scroll({
    id: "binding-vines-scroll",
    spellId: "binding-vines",
    name: { en: "Scroll of Thorn Snare", zh: "荆棘缚网法卷" },
    rarity: "uncommon",
    baseValue: 105,
    assetRef: { file: "assets/spells/thorn-snare.svg", semanticKey: "binding-vines-scroll" },
    description: {
      en: "A bark-fiber scroll sealed with green wax. Tiny root marks crawl along its edge when danger steps too close.",
      zh: "一卷树皮纤维制成的法卷，以绿蜡封口。危险靠近时，边缘会爬出细小根纹。"
    }
  }),
  "firebolt-scroll": scroll({
    id: "firebolt-scroll",
    spellId: "firebolt",
    name: { en: "Scroll of Firebolt", zh: "火焰箭法卷" },
    rarity: "uncommon",
    baseValue: 100,
    assetRef: { file: "assets/spells/ember-bolt.svg", semanticKey: "firebolt-scroll" },
    description: {
      en: "A char-edged scroll whose first syllable leaves a coal glow on the reader's tongue.",
      zh: "一卷边缘焦黑的法卷，读出第一个音节时，舌尖会泛起炭火般的微光。"
    }
  }),
  "ward-scroll": scroll({
    id: "ward-scroll",
    spellId: "ward",
    name: { en: "Scroll of Ward", zh: "护佑法卷" },
    baseValue: 90,
    assetRef: { file: "assets/spells/silver-ward.svg", semanticKey: "ward-scroll" },
    description: {
      en: "A square prayer-sheet folded around a copper thread. It resists being opened in anger.",
      zh: "一张绕着铜线折起的方形祈符。人在怒意中很难把它展开。"
    }
  }),
  "arcane-shield-scroll": scroll({
    id: "arcane-shield-scroll",
    spellId: "arcane-shield",
    name: { en: "Scroll of Arcane Shield", zh: "奥术护盾法卷" },
    rarity: "uncommon",
    baseValue: 125,
    assetRef: { file: "assets/spells/mirror-veil.svg", semanticKey: "arcane-shield-scroll" },
    description: {
      en: "Silver ink circles the page like a closed eye. The margin hums when steel is drawn nearby.",
      zh: "银墨像闭合的眼睛一样环绕纸面。附近有钢刃出鞘时，页边会轻轻嗡鸣。"
    }
  }),
  "radiant-bolt-scroll": scroll({
    id: "radiant-bolt-scroll",
    spellId: "radiant-bolt",
    name: { en: "Scroll of Radiant Bolt", zh: "辉光箭法卷" },
    rarity: "uncommon",
    baseValue: 118,
    assetRef: { file: "assets/spells/oath-light.svg", semanticKey: "radiant-bolt-scroll" },
    description: {
      en: "A temple vellum strip pressed with sun wax. Dust avoids the letters.",
      zh: "一条以日纹蜡封压过的神殿羊皮纸。尘埃会避开字迹。"
    }
  }),
  "healing-draught": item({
    id: "healing-draught",
    name: { en: "Healing Draught", zh: "治疗药剂" },
    category: "consumable",
    baseValue: 36,
    tradeable: true,
    consumable: true,
    tags: ["potion", "healing", "consumable"],
    useEffect: { type: "restore-hp", amount: 8, consume: true },
    assetRef: { file: "assets/generated/items/aidm-market-item-009-01.png", semanticKey: "items.consumable.healing-draught.v01" },
    description: {
      en: "A corked vial of bitter red medicine. It closes shallow cuts and steadies shaking hands.",
      zh: "一小瓶带苦味的红色药剂。它能合拢浅伤，也能让发抖的手稳下来。"
    }
  }),
  "mana-vial": item({
    id: "mana-vial",
    name: { en: "Mana Vial", zh: "法力小瓶" },
    category: "consumable",
    baseValue: 40,
    tradeable: true,
    consumable: true,
    tags: ["vial", "mana", "arcane", "consumable"],
    useEffect: { type: "restore-mana", amount: 4, consume: true },
    assetRef: { file: "assets/generated/items/aidm-market-item-009-02.png", semanticKey: "items.consumable.mana-vial.v01" },
    description: {
      en: "A thumb-sized blue vial that smells of rain on hot stone. One swallow clears the static from tired spellwork.",
      zh: "一只拇指大小的蓝色小瓶，闻起来像雨落热石。喝下一口，疲惫法术里的杂音会安静下来。"
    }
  }),
  "ember-bomb": item({
    id: "ember-bomb",
    name: { en: "Ember Bomb", zh: "余烬爆弹" },
    category: "consumable",
    rarity: "uncommon",
    baseValue: 58,
    tradeable: true,
    consumable: true,
    tags: ["bomb", "fire", "combat", "consumable"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-06.png", semanticKey: "items.consumable.ember-bomb.v01" },
    description: {
      en: "A clay fire charge wrapped in oilcloth and copper wire. It is carried for locked doors, packed alleys, and arguments that have turned too loud.",
      zh: "一枚以油布和铜线包住的陶壳火弹。它常被带去应付锁死的门、拥挤窄巷，以及已经吵得太响的争执。"
    }
  }),
  "focus-tonic": item({
    id: "focus-tonic",
    name: { en: "Focus Tonic", zh: "专注补剂" },
    category: "consumable",
    baseValue: 34,
    tradeable: true,
    consumable: true,
    tags: ["tonic", "mana", "consumable"],
    useEffect: { type: "restore-mana", amount: 3, consume: true },
    assetRef: { file: "assets/items/witness-charm.svg", semanticKey: "focus-tonic" },
    description: {
      en: "Blue-black syrup in a glass ampoule. It clears fatigue without making the truth easier.",
      zh: "玻璃安瓿里的蓝黑色糖浆。它能驱散疲惫，却不会让真相变得更容易。"
    }
  }),
  "trail-ration": item({
    id: "trail-ration",
    name: { en: "Trail Ration", zh: "行路口粮" },
    category: "food",
    baseValue: 6,
    tradeable: true,
    consumable: true,
    tags: ["food", "rest", "consumable"],
    useEffect: { type: "restore-hp", amount: 2, consume: true },
    assetRef: { file: "assets/generated/items/aidm-trade-good-016-01.png", semanticKey: "items.food.spiced-trail-rations.v01" },
    description: {
      en: "Pressed oats, salt fruit, and a paper twist of tea. Not elegant, but honest.",
      zh: "压实的燕麦、盐渍果干和一小包茶叶。不精致，但很实在。"
    }
  }),
  "spiced-rations": item({
    id: "spiced-rations",
    name: { en: "Spiced Rations", zh: "香料口粮" },
    category: "food",
    baseValue: 8,
    tradeable: true,
    consumable: true,
    tags: ["food", "rations", "market", "consumable"],
    useEffect: { type: "restore-hp", amount: 3, consume: true },
    assetRef: { file: "assets/generated/items/aidm-market-item-009-17.png", semanticKey: "items.consumable.spiced-rations.v01" },
    description: {
      en: "Dense travel cakes packed with pepper, dried fruit, and salt. They wake the blood without pretending to be a feast.",
      zh: "压实的旅行饼，裹着胡椒、果干与盐。它能让血气回暖，却不假装自己是一场宴席。"
    }
  }),
  "field-primer": item({
    id: "field-primer",
    name: { en: "Field Primer", zh: "现场入门册" },
    category: "consumable",
    baseValue: 52,
    tradeable: true,
    consumable: true,
    tags: ["training", "xp", "book"],
    useEffect: { type: "grant-xp", amount: 120, consume: true },
    assetRef: { file: "assets/items/silver-ledger.svg", semanticKey: "field-primer" },
    description: {
      en: "A compact training booklet annotated by several impatient mentors.",
      zh: "一本袖珍训练册，上面有好几位急性子导师留下的批注。"
    }
  }),
  "festival-wine": item({
    id: "festival-wine",
    name: { en: "Festival Wine", zh: "节庆红酒" },
    category: "food",
    baseValue: 16,
    tradeable: true,
    consumable: true,
    tags: ["wine", "food", "social"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-18.png", semanticKey: "items.consumable.vintage-wine.v01" },
    description: {
      en: "A plum-dark bottle from a crowded inn cellar. Good for bargaining, bracing nerves, or making a bad song louder.",
      zh: "一瓶来自拥挤旅店酒窖的深梅色红酒。适合讨价还价、壮胆，或把难听的歌唱得更响。"
    }
  }),
  "minor-portrait": item({
    id: "minor-portrait",
    name: { en: "Minor Noble Portrait", zh: "小贵族肖像" },
    category: "tradeGood",
    baseValue: 70,
    tradeable: true,
    tags: ["portrait", "art", "trade"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-19.png", semanticKey: "items.valuable.framed-portrait.v01" },
    description: {
      en: "A palm-sized portrait of a noble nobody admits to knowing. The frame is worth more than the sitter's reputation.",
      zh: "一幅巴掌大的小贵族肖像，没人承认认识画中人。画框大概比他的名声更值钱。"
    }
  }),
  "sealed-spices": item({
    id: "sealed-spices",
    name: { en: "Sealed Spices", zh: "封装香料" },
    category: "tradeGood",
    baseValue: 28,
    tradeable: true,
    tags: ["spice", "trade", "market"],
    assetRef: { file: "assets/generated/items/aidm-trade-good-016-05.png", semanticKey: "items.trade-good.copper-spice-tin.v01" },
    description: {
      en: "Waxed packets of warm pepper and citrus bark. Merchants can smell the margin before opening them.",
      zh: "用蜡封好的暖胡椒与柑橘树皮。商人还没拆封就能闻出利润。"
    }
  }),
  "storm-ward-amulet": item({
    id: "storm-ward-amulet",
    name: { en: "Storm Ward Amulet", zh: "风暴护符" },
    category: "fashion",
    slot: "accessory",
    rarity: "uncommon",
    baseValue: 118,
    tradeable: true,
    tags: ["amulet", "accessory", "storm", "ward"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-03.png", semanticKey: "items.amulet.storm-ward-amulet.v01" },
    description: {
      en: "A dark cord amulet holding a glassy storm bead. It clicks softly when thunder is near or a promise is about to break.",
      zh: "一枚黑绳护符，坠着玻璃般的风暴珠。雷声将近，或承诺快要破裂时，它会轻轻作响。"
    }
  }),
  "lockpick-kit": item({
    id: "lockpick-kit",
    name: { en: "Lockpick Kit", zh: "开锁套件" },
    category: "tool",
    baseValue: 48,
    tradeable: true,
    tags: ["tool", "lockpick", "stealth", "market"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-04.png", semanticKey: "items.tool.lockpick-kit.v01" },
    description: {
      en: "A flat leather kit of picks, shims, and tension bars. The cloth wrap is quiet enough for patient doors.",
      zh: "一只扁平皮套，收着拨片、薄垫和张力杆。包布足够安静，适合那些需要耐心对待的门。"
    }
  }),
  "tower-shield": item({
    id: "tower-shield",
    name: { en: "Tower Shield", zh: "塔盾" },
    category: "shield",
    slot: "offHand",
    rarity: "uncommon",
    baseValue: 96,
    tradeable: true,
    tags: ["shield", "tower", "defense", "market"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-14.png", semanticKey: "items.shield.tower-shield.v01" },
    description: {
      en: "A tall iron-banded shield built for doorways, alleys, and stubborn retreats. Its face bears old scrape marks in three directions.",
      zh: "一面以铁箍加固的高盾，适合门道、窄巷和固执撤退。盾面上有三种方向的旧刮痕。"
    }
  }),
  "signet-ring": item({
    id: "signet-ring",
    name: { en: "Signet Ring", zh: "印戒" },
    category: "fashion",
    slot: "accessory",
    rarity: "uncommon",
    baseValue: 72,
    tradeable: true,
    tags: ["ring", "accessory", "social", "noble"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-08.png", semanticKey: "items.ring.signet-ring.v01" },
    description: {
      en: "A weighty seal ring with a softened crest. It opens fewer doors than it once did, but still changes how clerks read a signature.",
      zh: "一枚沉甸甸的印戒，纹章已经被磨软。它能打开的门不如从前多，却仍会改变书记员阅读签名的态度。"
    }
  }),
  "rain-city-map": item({
    id: "rain-city-map",
    name: { en: "Rain City Map", zh: "雨城地图" },
    category: "tool",
    baseValue: 44,
    tradeable: true,
    tags: ["map", "document", "quest-clue", "navigation"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-09.png", semanticKey: "items.document.rain-city-map.v01" },
    description: {
      en: "A folded ward map blurred by old rain. Red pinholes mark shortcuts, closed bridges, and one alley nobody admits using.",
      zh: "一张被旧雨洇开的城区折图。红色针孔标着捷径、封桥，以及一条没人承认用过的小巷。"
    }
  }),
  "merchant-contract": item({
    id: "merchant-contract",
    name: { en: "Merchant Contract", zh: "商人契约" },
    category: "tradeGood",
    rarity: "uncommon",
    baseValue: 64,
    tradeable: true,
    tags: ["contract", "document", "quest-clue", "market"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-10.png", semanticKey: "items.document.merchant-contract.v01" },
    description: {
      en: "A ribboned contract with three witness marks and one scraped-out clause. Its value depends on who still fears the signature.",
      zh: "一份系着缎带的契约，带三枚见证印和一条被刮去的条款。它值多少钱，取决于还有谁害怕那枚签名。"
    }
  }),
  "ceremonial-robe": item({
    id: "ceremonial-robe",
    name: { en: "Ceremonial Robe", zh: "礼仪长袍" },
    category: "armor",
    slot: "body",
    rarity: "rare",
    baseValue: 150,
    tradeable: true,
    tags: ["armor", "robe", "ceremony", "noble"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-16.png", semanticKey: "items.armor-body.ceremonial-robe.v01" },
    description: {
      en: "A formal robe layered over hidden stiffeners and charm-thread seams. It was tailored for audiences where words can cut first.",
      zh: "一件正式长袍，夹层里藏着硬衬和护符线缝。它为那些话语会先伤人的觐见场合量身裁制。"
    }
  }),
  "bone-dice-set": item({
    id: "bone-dice-set",
    name: { en: "Bone Dice Set", zh: "骨骰套组" },
    category: "tradeGood",
    baseValue: 18,
    tradeable: true,
    tags: ["dice", "game", "trinket", "tavern"],
    assetRef: { file: "assets/generated/items/aidm-market-item-009-20.png", semanticKey: "items.trinket.bone-dice-set.v01" },
    description: {
      en: "A small set of polished bone dice in a stained pouch. One die is heavier than the rest, though never when watched closely.",
      zh: "一套装在染色小袋里的磨亮骨骰。其中一枚比其他骰子重些，只是在被盯紧时从不承认。"
    }
  }),
  "brass-monocle": item({
    id: "brass-monocle",
    name: { en: "Brass Monocle", zh: "黄铜单片镜" },
    category: "tool",
    rarity: "uncommon",
    baseValue: 35,
    tradeable: true,
    tags: ["tool", "scholar", "lens", "market"],
    assetRef: { file: "assets/generated/items/aidm-accessory-cutout-019-04.png", semanticKey: "items.tool.brass-monocle.cutout.v01" },
    description: {
      en: "A brass-rimmed monocle with a tiny focus screw. It makes ink fibers, forged seals, and nervous pupils equally hard to ignore.",
      zh: "一枚带微型调焦螺丝的黄铜单片镜。墨纤维、伪造印章和紧张的瞳孔，在它面前都很难被忽略。"
    }
  }),
  "etched-war-axe": item({
    id: "etched-war-axe",
    name: { en: "Etched War Axe", zh: "刻纹战斧" },
    category: "weapon",
    slot: "mainHand",
    rarity: "uncommon",
    baseValue: 105,
    tradeable: true,
    tags: ["weapon", "axe", "melee", "market"],
    assetRef: { file: "assets/generated/items/aidm-weapon-cutout-024-12.png", semanticKey: "items.axe.etched-war-axe.cutout.v01" },
    description: {
      en: "A compact war axe with rain-dark etching along the head. The haft is short enough for city work and heavy enough for shields.",
      zh: "一柄紧凑战斧，斧面刻纹被雨色浸深。斧柄短到适合城中行动，斧头又重到足以劈开盾线。"
    }
  }),
  "moon-silk": item({
    id: "moon-silk",
    name: { en: "Moon Silk Bolt", zh: "月丝布卷" },
    category: "tradeGood",
    rarity: "rare",
    baseValue: 140,
    tradeable: true,
    tags: ["silk", "luxury", "trade"],
    assetRef: { file: "assets/items/witness-charm.svg", semanticKey: "moon-silk" },
    description: {
      en: "A narrow bolt of pale silk that shows constellations when folded in shadow.",
      zh: "一卷窄幅浅色丝绸，在阴影中折起时会显出星图。"
    }
  }),
  "rain-glass": item({
    id: "rain-glass",
    name: { en: "Rain Glass Lens", zh: "雨玻璃透镜" },
    category: "tradeGood",
    baseValue: 64,
    tradeable: true,
    tags: ["lens", "craft", "trade"],
    assetRef: { file: "assets/items/storm-lantern.svg", semanticKey: "rain-glass" },
    description: {
      en: "A curved lens that makes raindrops hang a breath longer than they should.",
      zh: "一片弧形透镜，会让雨滴比理应停留的时间多悬一息。"
    }
  }),
  "blackthorn-warplate": item({
    id: "blackthorn-warplate",
    name: { en: "Blackthorn Warplate", zh: "黑棘战甲" },
    category: "armor",
    slot: "body",
    rarity: "rare",
    baseValue: 185,
    tradeable: true,
    tags: ["armor", "heavy", "thorns", "mercenary"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-029-03.png", semanticKey: "items.armor.blackthorn-warplate.v01" },
    description: {
      en: "A brutal cuirass of dark plates and hooked shoulder thorns. The inside bears old wax marks from contracts nobody wanted read aloud.",
      zh: "一副由暗色甲片和倒钩肩刺拼成的凶狠胸甲。内衬还留着旧蜡印，来自没人愿意念出口的契约。"
    }
  }),
  "surveyor-pack": item({
    id: "surveyor-pack",
    name: { en: "Surveyor's Field Pack", zh: "测绘员野外背包" },
    category: "tool",
    baseValue: 58,
    tradeable: true,
    tags: ["pack", "tool", "travel", "survey"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-029-04.png", semanticKey: "items.tool.surveyor-field-pack.v01" },
    description: {
      en: "A weathered canvas pack with rolled stakes, cord, and a hidden dry pocket for maps. It smells of road dust and cold mornings.",
      zh: "一只旧帆布背包，绑着测桩和细绳，暗袋能保持地图干燥。它闻起来像路尘和清冷早晨。"
    }
  }),
  "skyglass-signet": item({
    id: "skyglass-signet",
    name: { en: "Skyglass Signet", zh: "天玻璃印戒" },
    category: "fashion",
    slot: "accessory",
    rarity: "uncommon",
    baseValue: 96,
    tradeable: true,
    tags: ["ring", "accessory", "noble", "arcane"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-029-14.png", semanticKey: "items.ring.skyglass-signet.v01" },
    description: {
      en: "A gold signet holding a blue stone that brightens under open sky. Courtiers watch the gem before they answer difficult questions.",
      zh: "一枚镶蓝石的金印戒，露天时石面会微微发亮。宫廷人回答难题前，常先看它一眼。"
    }
  }),
  "rainmarked-chart": item({
    id: "rainmarked-chart",
    name: { en: "Rainmarked Chart", zh: "雨痕航图" },
    category: "tool",
    baseValue: 74,
    tradeable: true,
    tags: ["map", "navigation", "clue", "tool"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-029-27.png", semanticKey: "items.map.rainmarked-chart.v01" },
    description: {
      en: "A coastal chart stained by salt rain. Some inked routes only appear when the paper is held above a lantern flame.",
      zh: "一张被咸雨染旧的海岸航图。有些墨线航路，只有把纸举到灯火上方时才会显出来。"
    }
  }),
  "bitterleaf-ampoule": item({
    id: "bitterleaf-ampoule",
    name: { en: "Bitterleaf Ampoule", zh: "苦叶安瓿" },
    category: "consumable",
    baseValue: 42,
    tradeable: true,
    consumable: true,
    tags: ["tonic", "mana", "consumable", "herbal"],
    useEffect: { type: "restore-mana", amount: 4, consume: true },
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-029-11.png", semanticKey: "items.consumable.bitterleaf-ampoule.v01" },
    description: {
      en: "A narrow green ampoule sealed with brass wire. One bitter swallow clears spell-fog from the mind and leaves the tongue numb.",
      zh: "一支以黄铜丝封口的细长绿安瓿。苦涩一口能驱散施法后的雾感，也会让舌尖发麻。"
    }
  }),
  "pearwood-lute": item({
    id: "pearwood-lute",
    name: { en: "Pearwood Lute", zh: "梨木鲁特琴" },
    category: "tool",
    baseValue: 88,
    tradeable: true,
    tags: ["instrument", "music", "social", "tool"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-029-64.png", semanticKey: "items.instrument.pearwood-lute.v01" },
    description: {
      en: "A polished pearwood lute with a warm, tavern-ready voice. The inlay around its sound hole resembles a road curling home.",
      zh: "一把打磨光润的梨木鲁特琴，音色温暖，适合旅店夜场。音孔镶嵌像一条回家的路。"
    }
  }),
  "lionward-shield": item({
    id: "lionward-shield",
    name: { en: "Lionward Shield", zh: "狮纹守盾" },
    category: "shield",
    slot: "offHand",
    rarity: "uncommon",
    baseValue: 76,
    tradeable: true,
    tags: ["shield", "defense", "heraldry"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-030-10.png", semanticKey: "items.shield.lionward-shield.v01" },
    description: {
      en: "A blue field shield painted with a rearing lion. Its rim carries dents from a gatehouse defense nobody in town has forgotten.",
      zh: "一面绘有跃狮纹章的蓝底盾牌。盾缘凹痕来自一场城门防卫，镇上至今没人忘记。"
    }
  }),
  "azure-court-crown": item({
    id: "azure-court-crown",
    name: { en: "Azure Court Crown", zh: "蔚蓝宫廷冠" },
    category: "fashion",
    slot: "accessory",
    rarity: "rare",
    baseValue: 168,
    tradeable: true,
    tags: ["crown", "fashion", "noble", "status"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-030-16.png", semanticKey: "items.crown.azure-court-crown.v01" },
    description: {
      en: "A narrow gold crown set with blue stones. The inner band is etched with a vanished house motto and a warning about borrowed thrones.",
      zh: "一顶镶蓝石的窄金冠。内圈刻着失落家族的箴言，以及关于借来王座的警告。"
    }
  }),
  "sapphire-treaty-ring": item({
    id: "sapphire-treaty-ring",
    name: { en: "Sapphire Treaty Ring", zh: "蓝约戒指" },
    category: "fashion",
    slot: "accessory",
    rarity: "rare",
    baseValue: 132,
    tradeable: true,
    tags: ["ring", "fashion", "diplomacy", "noble"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-030-23.png", semanticKey: "items.ring.sapphire-treaty-ring.v01" },
    description: {
      en: "A heavy ring holding a clear sapphire. It was once pressed into wax beside signatures that ended a border feud for one generation.",
      zh: "一枚镶澄蓝宝石的厚戒。它曾按进蜡印，与几枚签名一起让边境争端平息了一代人。"
    }
  }),
  "lockpick-roll": item({
    id: "lockpick-roll",
    name: { en: "Lockpick Roll", zh: "开锁工具卷" },
    category: "tool",
    rarity: "uncommon",
    baseValue: 54,
    tradeable: true,
    tags: ["tool", "lockpick", "stealth", "skill"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-030-45.png", semanticKey: "items.tool.lockpick-roll.v01" },
    description: {
      en: "A compact leather roll filled with picks, hooks, and tension keys. Each tool has a tiny notch from a lock that fought back.",
      zh: "一卷紧凑皮套，装着拨片、钩针和扭力钥匙。每件工具上都有被顽固锁芯咬出的细痕。"
    }
  }),
  "emberglass-lantern": item({
    id: "emberglass-lantern",
    name: { en: "Emberglass Lantern", zh: "烬玻璃提灯" },
    category: "tool",
    rarity: "uncommon",
    baseValue: 68,
    tradeable: true,
    tags: ["tool", "light", "lantern", "rain"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-030-48.png", semanticKey: "items.tool.emberglass-lantern.v01" },
    description: {
      en: "A black iron lantern with amber glass panes. It burns low and warm, making rain look like falling threads of brass.",
      zh: "一盏黑铁提灯，嵌着琥珀色玻璃。它低而温暖地燃着，让雨丝看起来像坠落的黄铜线。"
    }
  }),
  "brass-mariner-compass": item({
    id: "brass-mariner-compass",
    name: { en: "Brass Mariner Compass", zh: "黄铜航海罗盘" },
    category: "tool",
    rarity: "uncommon",
    baseValue: 82,
    tradeable: true,
    tags: ["tool", "navigation", "compass", "travel"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-030-53.png", semanticKey: "items.tool.brass-mariner-compass.v01" },
    description: {
      en: "A lidded compass whose needle settles only after hearing the sea. Inland, it trembles toward promises left unfinished.",
      zh: "一枚带盖罗盘，只有听见海声后指针才会安定。在内陆，它会朝未完成的承诺轻颤。"
    }
  }),
  "oathguard-saber": item({
    id: "oathguard-saber",
    name: { en: "Oathguard Saber", zh: "誓卫弯刀" },
    category: "weapon",
    slot: "mainHand",
    rarity: "uncommon",
    baseValue: 84,
    tradeable: true,
    tags: ["weapon", "saber", "slashing", "martial"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-031-02.png", semanticKey: "items.weapon.oathguard-saber.v01" },
    description: {
      en: "A bright saber with a courtly guard and a grip worn smooth by parade drills that eventually became real fights.",
      zh: "一柄带宫廷护手的明亮弯刀，握柄被仪仗训练磨得光滑，而那些训练后来成了真正的战斗。"
    }
  }),
  "red-tassel-spear": item({
    id: "red-tassel-spear",
    name: { en: "Red-Tassel Spear", zh: "红缨战矛" },
    category: "weapon",
    slot: "mainHand",
    rarity: "uncommon",
    baseValue: 78,
    tradeable: true,
    tags: ["weapon", "spear", "piercing", "reach"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-031-08.png", semanticKey: "items.weapon.red-tassel-spear.v01" },
    description: {
      en: "A narrow spear tied with a red field tassel. Its head is light enough to feint and sharp enough to punish a late guard.",
      zh: "一柄系着红色战缨的窄矛，矛头轻到能虚晃，也锋利到足以惩罚迟来的格挡。"
    }
  }),
  "frostfur-travel-boots": item({
    id: "frostfur-travel-boots",
    name: { en: "Frostfur Travel Boots", zh: "霜毛旅行靴" },
    category: "fashion",
    rarity: "uncommon",
    baseValue: 66,
    tradeable: true,
    tags: ["boots", "fashion", "travel", "cold"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-031-17.png", semanticKey: "items.fashion.frostfur-travel-boots.v01" },
    description: {
      en: "Fur-lined boots stitched for frozen roads and wet alleys alike. The soles still carry white salt from a northern pass.",
      zh: "一双为冻路和湿巷都缝好的毛衬旅行靴，鞋底仍带着北境山口留下的白盐。"
    }
  }),
  "blue-sigil-ward-scroll": scroll({
    id: "blue-sigil-ward-scroll",
    spellId: "ward",
    name: { en: "Blue-Sigil Ward Scroll", zh: "蓝印护佑法卷" },
    rarity: "uncommon",
    baseValue: 104,
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-031-36.png", semanticKey: "items.scroll.blue-sigil-ward-scroll.v01" },
    description: {
      en: "A weathered scroll whose blue sigil lifts from the page when danger is named. It teaches a careful ward to anyone patient enough to read it.",
      zh: "一卷旧法卷，蓝色印记会在危险被说出口时浮起。只要读者足够耐心，它会教会一式谨慎的护佑。"
    }
  }),
  "ironbound-coffer": item({
    id: "ironbound-coffer",
    name: { en: "Ironbound Coffer", zh: "铁箍小匣" },
    category: "tradeGood",
    rarity: "notable",
    baseValue: 58,
    tradeable: true,
    tags: ["coffer", "treasure", "quest-clue", "container"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-031-42.png", semanticKey: "items.trade-good.ironbound-coffer.v01" },
    description: {
      en: "A squat coffer with iron ribs and a stubborn lid. Something inside clicks once when the right name is spoken nearby.",
      zh: "一只带铁箍的矮小匣子，盖子很倔。附近有人说出正确名字时，匣内会轻响一声。"
    }
  }),
  "guild-keyring": item({
    id: "guild-keyring",
    name: { en: "Guild Keyring", zh: "行会钥匙串" },
    category: "tool",
    rarity: "uncommon",
    baseValue: 44,
    tradeable: true,
    tags: ["tool", "keys", "guild", "utility"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-031-54.png", semanticKey: "items.tool.guild-keyring.v01" },
    description: {
      en: "A jangling ring of mismatched guild keys. Most open nothing useful, but one brass tooth keeps turning toward sealed doors.",
      zh: "一串叮当作响的杂配行会钥匙，多数开不了有用的门，唯有一枚黄铜齿总朝封住的门转动。"
    }
  }),
  "alchemist-mortar": item({
    id: "alchemist-mortar",
    name: { en: "Alchemist Mortar", zh: "炼金研钵" },
    category: "tool",
    baseValue: 32,
    tradeable: true,
    tags: ["tool", "alchemy", "crafting"],
    assetRef: { file: "assets/generated/items/aidm-inventory-expansion-031-58.png", semanticKey: "items.tool.alchemist-mortar.v01" },
    description: {
      en: "A stone mortar darkened by powdered herbs and silver dust. It makes even ordinary roots smell like a pending decision.",
      zh: "一只被草药粉和银尘熏暗的石研钵，连普通根茎都会在其中闻起来像一个将要作出的决定。"
    }
  }),
  "tension-wrench-set": item({
    id: "tension-wrench-set",
    name: { en: "Tension Wrench Set", zh: "张力扳手组" },
    category: "tool",
    baseValue: 22,
    tradeable: true,
    tags: ["tool", "lockwork", "market", "utility"],
    assetRef: { file: "assets/generated/items/aidm-tool-cutout-021-01.png", semanticKey: "items.tool.tension-wrench-set.cutout.v01" },
    description: {
      en: "A compact roll of slim steel tension tools for patient locks, stuck latches, and delicate clockwork panels.",
      zh: "一卷紧凑的细钢张力工具，适合耐心处理锁芯、卡住的闩扣和精细的钟表机关面板。"
    }
  }),
  "folded-chain-shirt": item({
    id: "folded-chain-shirt",
    name: { en: "Folded Chain Shirt", zh: "折叠链甲" },
    category: "armor",
    slot: "body",
    rarity: "uncommon",
    baseValue: 110,
    tradeable: true,
    tags: ["armor", "body", "chain", "travel"],
    assetRef: { file: "assets/generated/items/aidm-wearable-cutout-023-03.png", semanticKey: "items.armor-body.folded-chain-shirt.cutout.v01" },
    description: {
      en: "A supple chain shirt folded into travel cloth. The links sit quietly under a cloak until steel gets close.",
      zh: "一件能折进旅行布包的柔韧链甲，环片在斗篷下很安静，直到钢刃靠近才显出分量。"
    }
  }),
  "ironstar-mace": item({
    id: "ironstar-mace",
    name: { en: "Ironstar Mace", zh: "铁星钉锤" },
    category: "weapon",
    slot: "mainHand",
    rarity: "uncommon",
    baseValue: 92,
    tradeable: true,
    tags: ["weapon", "mace", "bludgeoning", "market"],
    assetRef: { file: "assets/generated/items/aidm-weapon-cutout-024-10.png", semanticKey: "items.mace.ironstar-mace.cutout.v01" },
    description: {
      en: "A dark iron mace with a star-shaped head. It is short enough for alleys and heavy enough to end an argument.",
      zh: "一柄星形锤头的黑铁钉锤，短到适合巷战，沉到足以结束争执。"
    }
  }),
  "gilded-sun-buckler": item({
    id: "gilded-sun-buckler",
    name: { en: "Gilded Sun Buckler", zh: "鎏金日轮圆盾" },
    category: "shield",
    slot: "offHand",
    rarity: "uncommon",
    baseValue: 115,
    tradeable: true,
    tags: ["shield", "buckler", "defense", "sun"],
    assetRef: { file: "assets/generated/items/aidm-weapon-cutout-024-13.png", semanticKey: "items.shield.gilded-sun-buckler.cutout.v01" },
    description: {
      en: "A small round buckler with a gilded sun boss. It favors quick guards, bright feints, and narrow stair fights.",
      zh: "一面带鎏金日轮盾脐的小圆盾，适合快速格挡、晃眼虚招和狭窄楼梯上的交锋。"
    }
  }),
  "stormglass-amulet": item({
    id: "stormglass-amulet",
    name: { en: "Stormglass Amulet", zh: "风暴玻璃护符" },
    category: "fashion",
    slot: "accessory",
    rarity: "rare",
    baseValue: 130,
    tradeable: true,
    tags: ["amulet", "accessory", "storm", "focus"],
    assetRef: { file: "assets/generated/items/aidm-magic-cutout-025-14.png", semanticKey: "items.amulet.stormglass-amulet.cutout.v01" },
    description: {
      en: "A blue glass amulet that clicks softly before thunder. Hedge mages wear it when weather starts listening back.",
      zh: "一枚会在雷声前轻响的蓝玻璃护符。野法师们在天气开始回应时会把它戴在身上。"
    }
  }),
  "sealed-tea-brick": item({
    id: "sealed-tea-brick",
    name: { en: "Sealed Tea Brick", zh: "封缄茶砖" },
    category: "tradeGood",
    baseValue: 34,
    tradeable: true,
    tags: ["tea", "provisions", "trade", "gift"],
    assetRef: { file: "assets/generated/items/aidm-trade-cutout-026-14.png", semanticKey: "items.trade-good.sealed-tea-brick.cutout.v01" },
    description: {
      en: "A wax-sealed tea brick stamped with a caravan mark. It spends almost as well as coin in cold villages.",
      zh: "一块带商队印记的蜡封茶砖。在寒冷村落里，它几乎和钱币一样好用。"
    }
  })
});

export const SHOP_CATALOG = Object.freeze([
  { itemId: "healing-word-scroll", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "sleep-scroll", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "firebolt-scroll", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "ward-scroll", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "binding-vines-scroll", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "arcane-shield-scroll", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "radiant-bolt-scroll", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "healing-draught", condition: "fine", quantity: 4, purchasable: true },
  { itemId: "mana-vial", condition: "fine", quantity: 3, purchasable: true },
  { itemId: "ember-bomb", condition: "fine", quantity: 2, purchasable: true },
  { itemId: "focus-tonic", condition: "fine", quantity: 3, purchasable: true },
  { itemId: "trail-ration", condition: "fine", quantity: 6, purchasable: true },
  { itemId: "spiced-rations", condition: "fine", quantity: 5, purchasable: true },
  { itemId: "storm-lantern", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "festival-wine", condition: "pristine", quantity: 3, purchasable: true },
  { itemId: "sealed-spices", condition: "fine", quantity: 2, purchasable: true },
  { itemId: "minor-portrait", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "storm-ward-amulet", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "lockpick-kit", condition: "fine", quantity: 2, purchasable: true },
  { itemId: "tower-shield", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "signet-ring", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "rain-city-map", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "merchant-contract", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "ceremonial-robe", condition: "pristine", quantity: 1, purchasable: true },
  { itemId: "bone-dice-set", condition: "fine", quantity: 2, purchasable: true },
  { itemId: "brass-monocle", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "etched-war-axe", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "moon-silk", condition: "pristine", quantity: 1, purchasable: true },
  { itemId: "surveyor-pack", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "skyglass-signet", condition: "pristine", quantity: 1, purchasable: true },
  { itemId: "rainmarked-chart", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "bitterleaf-ampoule", condition: "fine", quantity: 3, purchasable: true },
  { itemId: "pearwood-lute", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "lionward-shield", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "azure-court-crown", condition: "pristine", quantity: 1, purchasable: true },
  { itemId: "sapphire-treaty-ring", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "lockpick-roll", condition: "fine", quantity: 2, purchasable: true },
  { itemId: "emberglass-lantern", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "brass-mariner-compass", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "oathguard-saber", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "red-tassel-spear", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "frostfur-travel-boots", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "blue-sigil-ward-scroll", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "ironbound-coffer", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "guild-keyring", condition: "fine", quantity: 2, purchasable: true },
  { itemId: "alchemist-mortar", condition: "fine", quantity: 2, purchasable: true },
  { itemId: "tension-wrench-set", condition: "fine", quantity: 2, purchasable: true },
  { itemId: "folded-chain-shirt", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "ironstar-mace", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "gilded-sun-buckler", condition: "worn", quantity: 1, purchasable: true },
  { itemId: "stormglass-amulet", condition: "fine", quantity: 1, purchasable: true },
  { itemId: "sealed-tea-brick", condition: "fine", quantity: 4, purchasable: true }
]);

let shopPurchaseSequence = 0;

export function createInventoryEntry(itemId, options = {}) {
  const definition = getItemDefinition(itemId);
  const condition = normalizeCondition(options.condition || defaultCondition(itemId));
  const rarity = normalizeRarity(options.rarity || definition.rarity);
  const quantity = Math.max(1, Number.parseInt(options.quantity ?? 1, 10) || 1);
  const slot = definition.slot || null;
  return {
    id: options.instanceId || `${itemId}-${stableHash(`${itemId}:${condition}:${options.seed || ""}`).toString(16)}`,
    itemId,
    quantity,
    condition,
    acquiredAt: options.acquiredAt || null,
    source: options.source || "starting",
    value: valueForItem(definition, condition),
    currency: CURRENCY.id,
    rarity,
    tradeable: definition.tradeable !== false,
    sellable: definition.sellable ?? definition.tradeable !== false,
    usable: Boolean(definition.useEffect || definition.consumable),
    slot,
    equipped: Boolean(options.equipped),
    notes: options.notes || ""
  };
}

export function createAssetInventoryEntry(asset, options = {}) {
  const semanticKey = asset?.semanticKey || asset?.assetId || asset?.id || "generated-reward";
  const itemId = `generated:${semanticKey}`;
  const condition = normalizeCondition(options.condition || asset?.variantAxes?.condition || defaultCondition(itemId));
  const rarity = normalizeRarity(options.rarity || asset?.variantAxes?.rarity || asset?.rarity);
  const category = categoryFromAsset(asset);
  const slot = slotFromAsset(asset, category);
  const consumable = isConsumableAsset(asset, category);
  const definitionSnapshot = {
    id: itemId,
    name: asset?.displayName || { en: asset?.name || "Found Item", zh: asset?.zhName || asset?.name || "发现物品" },
    category,
    slot,
    rarity,
    baseValue: baseValueFromAsset(asset),
    tradeable: true,
    consumable,
    tags: [
      asset?.type,
      asset?.kind,
      semanticKey,
      asset?.variantOf,
      ...(asset?.tags || []),
      ...(asset?.soundscapeHints || []),
      ...Object.values(asset?.variantAxes || {}),
      ...Object.values(asset?.gameplayBinding || {}).flat()
    ].filter(Boolean),
    assetRef: {
      file: asset?.file,
      semanticKey,
      assetId: asset?.assetId || asset?.id || null,
      variantOf: asset?.variantOf || null,
      gameplayBinding: asset?.gameplayBinding || {}
    },
    description: asset?.description || {
      en: "A strange find from the current scene. Its exact worth depends on who wants the story attached to it.",
      zh: "这是一件从当前场景中发现的奇物。它真正的价值，取决于谁想买下它背后的故事。"
    }
  };
  return {
    id: options.instanceId || `${itemId}-${stableHash(`${itemId}:${condition}:${options.seed || ""}`).toString(16)}`,
    itemId,
    quantity: Math.max(1, Number.parseInt(options.quantity ?? 1, 10) || 1),
    condition,
    rarity,
    acquiredAt: options.acquiredAt || null,
    source: options.source || "reward",
    value: valueForItem(definitionSnapshot, condition),
    currency: CURRENCY.id,
    tradeable: true,
    sellable: true,
    usable: consumable,
    slot,
    equipped: false,
    notes: options.notes || "",
    definitionSnapshot
  };
}

export function hydrateInventoryEntry(entry) {
  if (typeof entry === "string") {
    return createInventoryEntry(normalizeItemId(entry), { seed: entry });
  }
  const itemId = normalizeItemId(entry?.itemId || entry?.id || entry?.name);
  const definition = entry?.definitionSnapshot || getItemDefinition(itemId);
  const condition = normalizeCondition(entry?.condition || defaultCondition(itemId));
  const rarity = normalizeRarity(entry?.rarity || definition.rarity);
  return {
    ...createInventoryEntry(itemId, { condition, seed: entry?.id || itemId }),
    ...entry,
    itemId,
    condition,
    rarity,
    value: valueForItem(definition, condition),
    currency: entry?.currency || CURRENCY.id,
    tradeable: entry?.tradeable ?? definition.tradeable !== false,
    sellable: entry?.sellable ?? definition.sellable ?? entry?.tradeable ?? definition.tradeable !== false,
    usable: entry?.usable ?? Boolean(definition.useEffect || definition.consumable),
    slot: entry?.slot ?? definition.slot ?? null,
    equipped: Boolean(entry?.equipped)
  };
}

export function inventoryView(entries = [], language = "en") {
  return entries.map((entry) => describeInventoryEntry(hydrateInventoryEntry(entry), language));
}

export function describeInventoryEntry(entry, language = "en") {
  const normalized = hydrateInventoryEntry(entry);
  const definition = normalized.definitionSnapshot || getItemDefinition(normalized.itemId);
  const condition = ITEM_CONDITIONS[normalized.condition] || ITEM_CONDITIONS.fine;
  const rarity = ITEM_RARITIES[normalized.rarity] || ITEM_RARITIES.common;
  const baseValue = Math.max(1, Number.parseInt(definition.baseValue ?? normalized.value ?? 1, 10) || 1);
  const saleValue = canSellEntry(normalized) ? sellValueForEntry(normalized) : 0;
  const actions = inventoryActionAvailability(normalized, definition, language);
  return {
    ...normalized,
    definition: {
      id: definition.id,
      name: definition.name,
      label: localize(definition.name, language),
      category: definition.category,
      categoryLabel: localize(ITEM_CATEGORIES[definition.category] || definition.category, language),
      rarity: normalizeRarity(definition.rarity || normalized.rarity),
      rarityLabel: localize(rarity.label, language),
      baseValue,
      baseValueLabel: formatCurrencyLabel(baseValue, language),
      slot: definition.slot || null,
      slotLabel: definition.slot ? localize(EQUIPMENT_SLOTS[definition.slot]?.label, language) : "",
      tags: definition.tags || [],
      description: definition.description,
      descriptionText: localize(definition.description, language),
      assetRef: definition.assetRef || null,
      useEffect: definition.useEffect || null,
      useEffectLabel: useEffectLabel(definition.useEffect, language)
    },
    conditionLabel: localize(condition.label, language),
    conditionMultiplier: condition.multiplier,
    rarityLabel: localize(rarity.label, language),
    valueLabel: formatCurrencyLabel(normalized.value, language),
    saleValue,
    saleValueLabel: formatCurrencyLabel(saleValue, language),
    equippable: actions.equip.available,
    actions,
    availability: {
      use: actions.use.reason,
      sell: actions.sell.reason,
      equip: actions.equip.reason
    }
  };
}

export function equipmentSummary(entries = [], language = "en") {
  const inventory = entries.map(hydrateInventoryEntry);
  const slots = Object.fromEntries(Object.values(EQUIPMENT_SLOTS).map((slot) => [
    slot.id,
    {
      id: slot.id,
      label: localize(slot.label, language),
      item: null
    }
  ]));
  for (const entry of inventory) {
    if (!entry.equipped) continue;
    const definition = entry.definitionSnapshot || getItemDefinition(entry.itemId);
    const slot = entry.slot || definition.slot;
    if (slot && slots[slot] && !slots[slot].item) {
      slots[slot].item = describeInventoryEntry(entry, language);
    }
  }
  return {
    slots,
    equippedItemIds: inventory.filter((entry) => entry.equipped).map((entry) => entry.itemId),
    emptySlots: Object.values(slots).filter((slot) => !slot.item).map((slot) => slot.id)
  };
}

export function getItemDefinition(itemId) {
  const normalized = normalizeItemId(itemId);
  if (normalized.startsWith("generated:")) {
    return {
      id: normalized,
      name: { en: "Generated Find", zh: "生成发现物" },
      category: "tradeGood",
      baseValue: 20,
      tradeable: true,
      tags: ["generated"],
      description: {
        en: "A generated item whose detailed description is stored on the inventory instance.",
        zh: "一件生成物品，具体描述保存在背包实例上。"
      }
    };
  }
  return ITEM_CATALOG[normalized] || ITEM_CATALOG["field-notebook"];
}

export function valueForItem(definition, conditionId = "fine") {
  const condition = ITEM_CONDITIONS[conditionId] || ITEM_CONDITIONS.fine;
  return Math.max(1, Math.round((definition.baseValue || 1) * condition.multiplier));
}

function canSellEntry(entry) {
  return entry.tradeable !== false && entry.sellable !== false;
}

function sellValueForEntry(entry) {
  return Math.max(1, Math.floor((entry.value || 1) * ITEM_ECONOMY.sellbackRate));
}

function shopPriceForEntry(entry) {
  return Math.ceil((entry.value || 1) * ITEM_ECONOMY.shopMarkup);
}

export function useInventoryItem(player, inventoryItemId, language = "en") {
  const inventory = (player?.character?.inventory || []).map(hydrateInventoryEntry);
  const index = inventory.findIndex((entry) => entry.id === inventoryItemId || entry.itemId === inventoryItemId);
  if (index < 0) {
    throw new Error("Inventory item not found");
  }
  const entry = inventory[index];
  const definition = getItemDefinition(entry.itemId);
  if (!definition.useEffect && !definition.consumable) {
    throw new Error("Item is not usable");
  }

  const before = characterStateSnapshot(player.character);
  const result = {
    item: describeInventoryEntry(entry, language),
    consumed: false,
    learnedSpell: null,
    stateDeltas: {}
  };
  if (definition.useEffect?.type === "learn-spell") {
    const spell = getSpell(definition.useEffect.spellId);
    if (characterKnownSpellIds(player.character).includes(spell.id)) {
      throw new Error("Spell already known");
    }
    const spells = new Set(player.character.spells || []);
    spells.add(spell.id);
    player.character.spells = [...spells];
    const knownSpells = new Set(player.character.knownSpells || player.character.spells || []);
    knownSpells.add(spell.id);
    player.character.knownSpells = [...knownSpells];
    player.character.spellKnown = {
      ...(player.character.spellKnown || {}),
      [spell.id]: true
    };
    result.learnedSpell = spell.id;
  }
  if (definition.useEffect?.type === "restore-hp") {
    const amount = Math.max(0, Number.parseInt(definition.useEffect.amount ?? 0, 10) || 0);
    const maxHp = Math.max(0, player.character.maxHp || 0);
    player.character.hp = Math.min(maxHp, Math.max(0, (player.character.hp || 0) + amount));
  }
  if (definition.useEffect?.type === "restore-mana") {
    const amount = Math.max(0, Number.parseInt(definition.useEffect.amount ?? 0, 10) || 0);
    const maxMana = Math.max(0, player.character.maxMana || 0);
    player.character.mana = Math.min(maxMana, Math.max(0, (player.character.mana || 0) + amount));
  }
  if (definition.useEffect?.type === "grant-xp") {
    applyExperience(player.character, definition.useEffect.amount);
  }
  if (definition.consumable || definition.useEffect?.consume !== false) {
    entry.quantity -= 1;
    result.consumed = true;
  }
  if (entry.quantity < 0) {
    throw new Error("Inventory quantity cannot be negative");
  }
  player.character.inventory = entry.quantity > 0
    ? inventory.with(index, entry)
    : inventory.filter((_, entryIndex) => entryIndex !== index);
  result.stateDeltas = characterStateDelta(before, characterStateSnapshot(player.character));
  return result;
}

export function sellInventoryItem(player, inventoryItemId, language = "en") {
  const inventory = (player?.character?.inventory || []).map(hydrateInventoryEntry);
  const index = inventory.findIndex((entry) => entry.id === inventoryItemId || entry.itemId === inventoryItemId);
  if (index < 0) {
    throw new Error("Inventory item not found");
  }
  const entry = inventory[index];
  if (!canSellEntry(entry)) {
    throw new Error("Item cannot be traded");
  }
  const before = characterStateSnapshot(player.character);
  const payout = sellValueForEntry(entry);
  const soldEntry = { ...entry, quantity: 1, equipped: false };
  entry.quantity -= 1;
  player.character.wallet = normalizeWallet(player.character.wallet) + payout;
  player.character.inventory = entry.quantity > 0
    ? inventory.with(index, entry)
    : inventory.filter((_, entryIndex) => entryIndex !== index);
  syncCharacterEquipment(player.character);
  const stateDeltas = characterStateDelta(before, characterStateSnapshot(player.character));
  stateDeltas.stock = [{
    itemId: soldEntry.itemId,
    quantityDelta: 1
  }];
  return {
    item: describeInventoryEntry(soldEntry, language),
    payout,
    payoutLabel: formatCurrencyLabel(payout, language),
    currency: CURRENCY.id,
    stateDeltas
  };
}

export function buyShopItem(player, shopItemId, language = "en") {
  const offer = SHOP_CATALOG.find((entry) => entry.itemId === shopItemId);
  if (!offer) {
    throw new Error("Shop item not found");
  }
  const availability = shopOfferAvailability(offer);
  if (!availability.canBuy) {
    throw new Error(availability.reason === "out-of-stock" ? "Shop item is out of stock" : "Shop item is unavailable");
  }
  const item = createInventoryEntry(offer.itemId, {
    condition: offer.condition,
    source: "shop",
    seed: `${player.id}:${shopItemId}:${Date.now()}:${shopPurchaseSequence++}`
  });
  const price = shopPriceForEntry(item);
  const before = characterStateSnapshot(player.character);
  if (normalizeWallet(player.character.wallet) < price) {
    throw new Error("Not enough currency");
  }
  player.character.wallet = normalizeWallet(player.character.wallet) - price;
  player.character.inventory = [...(player.character.inventory || []).map(hydrateInventoryEntry), item];
  const stateDeltas = characterStateDelta(before, characterStateSnapshot(player.character));
  stateDeltas.stock = [{
    itemId: offer.itemId,
    quantityDelta: -1
  }];
  return {
    item: describeInventoryEntry(item, language),
    price,
    priceLabel: formatCurrencyLabel(price, language),
    currency: CURRENCY.id,
    stateDeltas
  };
}

export function equipInventoryItem(player, inventoryItemId, language = "en") {
  const inventory = (player?.character?.inventory || []).map(hydrateInventoryEntry);
  const index = inventory.findIndex((entry) => entry.id === inventoryItemId || entry.itemId === inventoryItemId);
  if (index < 0) {
    throw new Error("Inventory item not found");
  }
  const target = inventory[index];
  const definition = getItemDefinition(target.itemId);
  const slot = target.slot || definition.slot;
  if (!slot || !EQUIPMENT_SLOTS[slot]) {
    throw new Error("Item cannot be equipped");
  }
  const before = characterStateSnapshot(player.character);
  const nextInventory = inventory.map((entry, entryIndex) => {
    const entryDefinition = entry.definitionSnapshot || getItemDefinition(entry.itemId);
    const entrySlot = entry.slot || entryDefinition.slot;
    if (entryIndex === index) {
      return { ...entry, slot, equipped: true };
    }
    return entrySlot === slot ? { ...entry, equipped: false } : entry;
  });
  player.character.inventory = nextInventory;
  syncCharacterEquipment(player.character);
  const equipped = nextInventory[index];
  return {
    item: describeInventoryEntry(equipped, language),
    slot,
    equipment: equipmentSummary(nextInventory, language),
    stateDeltas: characterStateDelta(before, characterStateSnapshot(player.character))
  };
}

export function shopView(language = "en") {
  return SHOP_CATALOG.map((offer) => {
    const entry = createInventoryEntry(offer.itemId, { condition: offer.condition, source: "shop" });
    const view = describeInventoryEntry(entry, language);
    const price = shopPriceForEntry(entry);
    const availability = shopOfferAvailability(offer);
    const offerPurchasable = offer.purchasable !== false
      && offer.available !== false
      && offer.buyable !== false
      && offer.canBuy !== false;
    return {
      ...view,
      price,
      priceLabel: formatCurrencyLabel(price, language),
      quantity: availability.quantity,
      stock: availability.quantity,
      availableQuantity: availability.quantity,
      available: availability.canBuy,
      purchasable: offerPurchasable,
      buyable: offerPurchasable,
      canBuy: availability.canBuy,
      purchaseLimit: offer.purchaseLimit ?? null,
      purchaseRestriction: availability.canBuy ? "" : availability.reason,
      purchaseRestrictionLabel: availability.canBuy ? "" : shopAvailabilityLabel(availability.reason, language),
      availabilityReason: availability.reason,
      availabilityLabel: shopAvailabilityLabel(availability.reason, language)
    };
  });
}

function inventoryActionAvailability(entry, definition, language) {
  const canUse = Boolean(entry.usable && (definition.useEffect || definition.consumable));
  const canSell = canSellEntry(entry);
  const slot = entry.slot || definition.slot || null;
  const canEquip = Boolean(slot && EQUIPMENT_SLOTS[slot]);
  return {
    use: {
      available: canUse,
      reason: canUse ? "" : actionReason("not-usable", language)
    },
    sell: {
      available: canSell,
      reason: canSell ? "" : actionReason("not-tradeable", language)
    },
    equip: {
      available: canEquip,
      reason: canEquip ? "" : actionReason("not-equippable", language)
    }
  };
}

function actionReason(reason, language = "en") {
  const reasons = {
    "not-usable": {
      en: "No direct use action",
      zh: "没有直接使用动作"
    },
    "not-tradeable": {
      en: "Cannot be sold",
      zh: "不可售卖"
    },
    "not-equippable": {
      en: "Cannot be equipped",
      zh: "不可装备"
    }
  };
  return localize(reasons[reason], language);
}

function useEffectLabel(effect, language = "en") {
  if (!effect) return "";
  if (effect.type === "learn-spell") {
    const spellId = effect.spellId || "";
    return language === "zh" ? `学习法术：${spellId}` : `Learn spell: ${spellId}`;
  }
  if (effect.type === "restore-hp") {
    return language === "zh" ? `恢复 ${effect.amount || 0} 点生命` : `Restore ${effect.amount || 0} HP`;
  }
  if (effect.type === "restore-mana") {
    return language === "zh" ? `恢复 ${effect.amount || 0} 点法力` : `Restore ${effect.amount || 0} MP`;
  }
  if (effect.type === "grant-xp") {
    return language === "zh" ? `获得 ${effect.amount || 0} 点经验` : `Gain ${effect.amount || 0} XP`;
  }
  return language === "zh" ? "使用物品" : "Use item";
}

function shopAvailabilityLabel(reason, language = "en") {
  if (!reason) {
    return language === "zh" ? "可购买" : "Available";
  }
  if (reason === "out-of-stock") {
    return language === "zh" ? "售罄" : "Out of stock";
  }
  return language === "zh" ? "不可购买" : "Unavailable";
}

function shopOfferAvailability(offer = {}) {
  const quantity = Math.max(0, Number.parseInt(offer.quantity ?? offer.stock ?? offer.availableQuantity ?? 1, 10) || 0);
  if (offer.purchasable === false || offer.available === false || offer.buyable === false || offer.canBuy === false) {
    return { canBuy: false, quantity, reason: "unavailable" };
  }
  if (quantity <= 0) {
    return { canBuy: false, quantity, reason: "out-of-stock" };
  }
  return { canBuy: true, quantity, reason: "" };
}

export function normalizeItemId(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (normalized.startsWith("generated:")) {
    return normalized;
  }
  const aliases = {
    "travel-lamp": "travel-lamp",
    "field-notebook": "field-notebook",
    "healing-potion": "healing-draught",
    "healing-draught": "healing-draught",
    "focus-tonic": "focus-tonic",
    "trail-ration": "trail-ration",
    "field-primer": "field-primer",
    "healing-word-scroll": "healing-word-scroll",
    "scroll-of-healing-word": "healing-word-scroll",
    "sleep-scroll": "sleep-scroll",
    "scroll-of-veiled-sleep": "sleep-scroll",
    "firebolt-scroll": "firebolt-scroll",
    "scroll-of-firebolt": "firebolt-scroll",
    "ward-scroll": "ward-scroll",
    "scroll-of-ward": "ward-scroll",
    "binding-vines-scroll": "binding-vines-scroll",
    "scroll-of-thorn-snare": "binding-vines-scroll",
    "arcane-shield-scroll": "arcane-shield-scroll",
    "scroll-of-arcane-shield": "arcane-shield-scroll",
    "radiant-bolt-scroll": "radiant-bolt-scroll",
    "scroll-of-radiant-bolt": "radiant-bolt-scroll",
    "sealed-spices": "sealed-spices",
    "moon-silk": "moon-silk",
    "rain-glass": "rain-glass",
    "blackthorn-warplate": "blackthorn-warplate",
    "surveyor-pack": "surveyor-pack",
    "surveyor's-field-pack": "surveyor-pack",
    "skyglass-signet": "skyglass-signet",
    "rainmarked-chart": "rainmarked-chart",
    "bitterleaf-ampoule": "bitterleaf-ampoule",
    "pearwood-lute": "pearwood-lute",
    "lionward-shield": "lionward-shield",
    "azure-court-crown": "azure-court-crown",
    "sapphire-treaty-ring": "sapphire-treaty-ring",
    "lockpick-roll": "lockpick-roll",
    "emberglass-lantern": "emberglass-lantern",
    "brass-mariner-compass": "brass-mariner-compass",
    "oathguard-saber": "oathguard-saber",
    "red-tassel-spear": "red-tassel-spear",
    "frostfur-travel-boots": "frostfur-travel-boots",
    "blue-sigil-ward-scroll": "blue-sigil-ward-scroll",
    "scroll-of-blue-sigil-ward": "blue-sigil-ward-scroll",
    "ironbound-coffer": "ironbound-coffer",
    "guild-keyring": "guild-keyring",
    "alchemist-mortar": "alchemist-mortar",
    "tension-wrench-set": "tension-wrench-set",
    "folded-chain-shirt": "folded-chain-shirt",
    "ironstar-mace": "ironstar-mace",
    "gilded-sun-buckler": "gilded-sun-buckler",
    "stormglass-amulet": "stormglass-amulet",
    "sealed-tea-brick": "sealed-tea-brick",
    "staff": "staff",
    "oak-staff": "staff",
    "mace": "mace",
    "sun-mace": "mace",
    "leather-armor": "leather",
    "chainmail": "chainmail",
    "shield": "shield",
    "ward-shield": "shield"
  };
  return aliases[normalized] || normalized || "field-notebook";
}

function baseValueFromAsset(asset) {
  const rarity = asset?.variantAxes?.rarity || asset?.rarity || "common";
  const rarityValue = {
    common: 24,
    notable: 72,
    uncommon: 64,
    rare: 140,
    epic: 320,
    legendary: 850
  };
  return rarityValue[rarity] || 32;
}

function categoryFromAsset(asset) {
  const itemKind = assetItemKind(asset);
  if (["weapon", "rapier", "maul", "longbow", "dagger", "axe", "crossbow", "spear", "mace", "saber", "cutlass", "staff", "chakram", "hammer", "greatsword"].includes(itemKind)) {
    return "weapon";
  }
  if (itemKind === "shield") return "shield";
  if (itemKind.startsWith("armor") || ["robe", "cloak", "clothing", "coat", "boots", "gloves", "hat", "headgear", "hood", "belt", "mask", "shoulders", "toolwear"].includes(itemKind)) {
    return itemKind === "clothing" ? "fashion" : "armor";
  }
  if (["scroll"].includes(itemKind)) return "spellScroll";
  if (["consumable", "food", "drink"].includes(itemKind)) return itemKind === "food" || itemKind === "drink" ? "food" : "consumable";
  if (["tool", "archive", "document", "map"].includes(itemKind)) return "tool";
  if (["clue", "quest-clue"].includes(itemKind) || asset?.group === "generated-quest-clues") return "quest";
  return "tradeGood";
}

function slotFromAsset(asset, category) {
  const itemKind = assetItemKind(asset);
  if (category === "weapon") return "mainHand";
  if (category === "shield") return "offHand";
  if (category === "armor" && ["armor", "armor-body", "robe", "cloak", "clothing", "coat", "toolwear"].includes(itemKind)) return "body";
  if (["ring", "amulet", "necklace", "ear-cuff", "trinket", "charm", "jewelry", "headgear", "hat", "hood", "mask", "belt", "brooch"].includes(itemKind)) return "accessory";
  return null;
}

function isConsumableAsset(asset, category) {
  const itemKind = assetItemKind(asset);
  return category === "consumable" || category === "food" || itemKind === "scroll";
}

function assetItemKind(asset) {
  return String(asset?.gameplayBinding?.itemKind || asset?.variantAxes?.itemKind || asset?.kind || asset?.type || "")
    .trim()
    .toLowerCase();
}

function item(definition) {
  return Object.freeze({
    rarity: "common",
    tradeable: true,
    consumable: false,
    ...definition
  });
}

function scroll(definition) {
  return item({
    category: "spellScroll",
    tradeable: true,
    consumable: true,
    tags: ["scroll", "spell", definition.spellId],
    useEffect: { type: "learn-spell", spellId: definition.spellId, consume: true },
    ...definition
  });
}

function defaultCondition(itemId) {
  const hash = stableHash(itemId);
  return ["worn", "fine", "fine", "pristine"][hash % 4];
}

function normalizeCondition(condition) {
  return ITEM_CONDITIONS[condition] ? condition : "fine";
}

function normalizeRarity(rarity) {
  return ITEM_RARITIES[rarity] ? rarity : "common";
}

function applyExperience(character, amount) {
  const xpDelta = Math.max(0, Number.parseInt(amount ?? 0, 10) || 0);
  const nextXp = Math.max(0, (Number.isFinite(character.xp) ? character.xp : 0) + xpDelta);
  character.xp = nextXp;
  character.level = levelForXp(nextXp, character.level || 1);
  character.proficiencyBonus = proficiencyBonus(character.level);
}

function levelForXp(xp, fallback = 1) {
  let level = Math.max(1, Number.parseInt(fallback, 10) || 1);
  XP_THRESHOLDS.forEach((threshold, index) => {
    if (xp >= threshold) {
      level = Math.max(level, index + 1);
    }
  });
  return level;
}

function syncCharacterEquipment(character) {
  const equipped = (character.inventory || [])
    .map(hydrateInventoryEntry)
    .filter((entry) => entry.equipped)
    .filter((entry) => {
      const definition = entry.definitionSnapshot || getItemDefinition(entry.itemId);
      return Boolean(entry.slot || definition.slot);
    });
  character.equipment = equipped.map((entry) => entry.itemId);
  character.weapons = equipped.filter((entry) => {
    const definition = entry.definitionSnapshot || getItemDefinition(entry.itemId);
    return definition.category === "weapon";
  }).map((entry) => entry.itemId);
  character.armor = equipped.filter((entry) => {
    const definition = entry.definitionSnapshot || getItemDefinition(entry.itemId);
    return definition.category === "armor" || definition.category === "shield";
  }).map((entry) => entry.itemId);
  const rulesEquipment = character.equipment
    .map((itemId) => {
      try {
        return getEquipment(itemId);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const agilityModifier = resolveAgilityModifier(character);
  if (agilityModifier !== null) {
    character.defense = calculateDefense({
      agilityModifier,
      equipment: rulesEquipment
    });
  }
}

function resolveAgilityModifier(character = {}) {
  if (Number.isInteger(character.modifiers?.agility)) {
    return character.modifiers.agility;
  }
  if (Number.isFinite(character.attributes?.agility)) {
    return abilityModifier(character.attributes.agility);
  }
  if (Number.isFinite(character.stats?.agility)) {
    return abilityModifier(character.stats.agility);
  }
  return null;
}

function characterStateSnapshot(character = {}) {
  return {
    wallet: normalizeWallet(character.wallet),
    hp: Number.isFinite(character.hp) ? character.hp : 0,
    mana: Number.isFinite(character.mana) ? character.mana : 0,
    xp: Number.isFinite(character.xp) ? character.xp : 0,
    level: Number.isFinite(character.level) ? character.level : 1,
    defense: Number.isFinite(character.defense) ? character.defense : 10,
    spells: characterKnownSpellIds(character),
    equipment: [...(character.equipment || [])].sort(),
    inventory: (character.inventory || []).map(hydrateInventoryEntry).map((entry) => ({
      id: entry.id,
      itemId: entry.itemId,
      quantity: Math.max(0, Number.parseInt(entry.quantity ?? 0, 10) || 0),
      equipped: Boolean(entry.equipped)
    }))
  };
}

function characterKnownSpellIds(character = {}) {
  return [...new Set([
    ...(character.spells || []),
    ...(character.knownSpells || []),
    ...Object.entries(character.spellKnown || {})
      .filter(([, known]) => Boolean(known))
      .map(([spellId]) => spellId)
  ])].sort();
}

function characterStateDelta(before, after) {
  const deltas = {};
  for (const key of ["wallet", "hp", "mana", "xp", "level", "defense"]) {
    const delta = (after[key] ?? 0) - (before[key] ?? 0);
    if (delta !== 0) {
      deltas[key] = delta;
    }
  }
  const learnedSpells = after.spells.filter((spellId) => !before.spells.includes(spellId));
  if (learnedSpells.length > 0) {
    deltas.learnedSpells = learnedSpells;
  }
  const equipped = after.equipment.filter((itemId) => !before.equipment.includes(itemId));
  const unequipped = before.equipment.filter((itemId) => !after.equipment.includes(itemId));
  if (equipped.length > 0 || unequipped.length > 0) {
    deltas.equipment = { equipped, unequipped };
  }
  const quantityChanges = [];
  const beforeById = new Map(before.inventory.map((entry) => [entry.id, entry]));
  const afterById = new Map(after.inventory.map((entry) => [entry.id, entry]));
  for (const entry of before.inventory) {
    const next = afterById.get(entry.id);
    const delta = (next?.quantity || 0) - entry.quantity;
    if (delta !== 0) {
      quantityChanges.push({ id: entry.id, itemId: entry.itemId, quantityDelta: delta });
    }
  }
  for (const entry of after.inventory) {
    if (!beforeById.has(entry.id)) {
      quantityChanges.push({ id: entry.id, itemId: entry.itemId, quantityDelta: entry.quantity });
    }
  }
  if (quantityChanges.length > 0) {
    deltas.inventory = quantityChanges;
  }
  return deltas;
}

function normalizeWallet(value) {
  const wallet = Number.parseInt(value ?? 0, 10);
  return Number.isFinite(wallet) ? Math.max(0, wallet) : 0;
}

function localize(value, language = "en") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.zh || value.default || "";
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}
