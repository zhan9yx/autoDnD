import { normalizeLanguage } from "./localization.js";

const BROWSER_TTS_PROVIDER_ID = "browser-speech-synthesis";

export const TTS_PROVIDERS = Object.freeze([
  {
    id: BROWSER_TTS_PROVIDER_ID,
    name: "Browser SpeechSynthesis",
    cost: "free",
    runtime: "client",
    default: true,
    bundled: true,
    local: true,
    openSource: false,
    requiresModelDownload: false,
    status: "shipped-fallback",
    note: "Immediate zero-cost playback using local platform voices. This remains the shipped runtime."
  },
  {
    id: "piper",
    name: "Piper",
    cost: "free",
    runtime: "optional-local-cli",
    local: true,
    openSource: true,
    requiresModelDownload: true,
    status: "catalog-only",
    note: "Fast local neural TTS target using separately downloaded voice models. No model is bundled."
  },
  {
    id: "sherpa-onnx",
    name: "Sherpa-ONNX",
    cost: "free",
    runtime: "optional-local-cli",
    local: true,
    openSource: true,
    requiresModelDownload: true,
    status: "catalog-only",
    note: "Provider-neutral ONNX runtime target for curated offline TTS models, including multilingual options."
  },
  {
    id: "kokoro",
    name: "Kokoro",
    cost: "free",
    runtime: "optional-local-cli",
    local: true,
    openSource: true,
    requiresModelDownload: true,
    status: "catalog-only",
    note: "Compact local neural voice target when a compatible Kokoro runtime and model are installed separately."
  },
  {
    id: "espeak-ng",
    name: "eSpeak NG",
    cost: "free",
    runtime: "optional-local-cli",
    local: true,
    openSource: true,
    requiresModelDownload: false,
    status: "catalog-only",
    note: "Smallest offline open-source fallback target for deterministic low-footprint synthesis."
  }
]);

const PROFILE_METADATA = Object.freeze({
  aidm: profileMetadata("core", "calm, cinematic, neutral", "沉稳、电影感、中立", "DM narration, scene framing, and neutral table updates.", "适合 DM 旁白、场景铺陈和中立桌面播报。", ["dm", "npc"]),
  rules: profileMetadata("core", "precise, firm, procedural", "精准、坚定、流程化", "Rules calls, check results, and arbitration lines.", "适合规则裁定、检定结果和流程提示。", ["system"]),
  table: profileMetadata("core", "low-key, mechanical, concise", "低调、机械、简短", "System state, timers, table status, and non-character messages.", "适合系统状态、计时、牌桌状态和非角色消息。", ["system"]),
  guide: profileMetadata("core", "clear, instructive, forward-moving", "清楚、指引性强、推动行动", "Turn callouts, onboarding prompts, and action guidance.", "适合回合提示、入门引导和行动建议。", ["system"]),
  player: profileMetadata("core", "natural, present, flexible", "自然、在场、可塑", "Default player-character speech when no class or species is known.", "适合未知职业或种族时的默认玩家角色发言。", ["player"]),
  npc: profileMetadata("core", "everyday, grounded, adaptable", "日常、接地气、适配性强", "Default townsfolk, bystanders, and unnamed NPCs.", "适合普通村民、路人和未命名 NPC。", ["npc"]),
  "weathered-guide": profileMetadata("people", "weathered, practical, route-aware", "风霜感、务实、熟悉路线", "Trail guides, caravan scouts, and travel tutorial beats.", "适合向导、商队斥候和旅行教程段落。", ["npc", "player"]),
  "battle-master": profileMetadata("people", "low, tactical, clipped", "低沉、战术化、短促", "Combat mentors, drill captains, and urgent tactical hints.", "适合战斗导师、操练队长和紧急战术提示。", ["npc", "system"]),
  "court-herald": profileMetadata("people", "bright, formal, projecting", "明亮、正式、有宣告感", "Heralds, announcements, ceremonial court scenes, and public cues.", "适合传令、公告、宫廷仪式和公开提示。", ["npc", "system"]),
  noble: profileMetadata("people", "formal, poised, socially sharp", "正式、克制、社交敏锐", "Courtly NPCs, patrons, rivals, or noble player concepts.", "适合宫廷 NPC、赞助人、竞争者或贵族玩家概念。", ["npc", "player"]),
  "young-hero": profileMetadata("people", "bright, earnest, quick", "明亮、真诚、反应快", "Young adventurers, squires, apprentices, and optimistic players.", "适合年轻冒险者、侍从、学徒和乐观型玩家。", ["npc", "player"]),
  warrior: profileMetadata("people", "direct, grounded, forceful", "直接、稳重、有力量", "Front-line fighters, veterans, soldiers, and martial players.", "适合前排战士、老兵、士兵和武斗型玩家。", ["npc", "player"]),
  ranger: profileMetadata("people", "alert, agile, outdoorsy", "警觉、敏捷、野外感", "Scouts, hunters, guides, and wilderness player characters.", "适合斥候、猎人、向导和荒野型玩家角色。", ["npc", "player"]),
  mage: profileMetadata("people", "measured, arcane, intense", "克制、奥术感、专注", "Spellcasters, witches, scholars, and mystic player characters.", "适合法师、女巫、学者和神秘型玩家角色。", ["npc", "player"]),
  cleric: profileMetadata("people", "warm, steady, reassuring", "温暖、稳定、让人安心", "Healers, priests, medics, and support player characters.", "适合治疗者、祭司、医者和支援型玩家。", ["npc", "player"]),
  rogue: profileMetadata("people", "quick, sly, intimate", "快速、狡黠、贴近耳语", "Spies, thieves, tricksters, and stealth player characters.", "适合间谍、盗贼、诡术师和潜行型玩家。", ["npc", "player"]),
  bard: profileMetadata("people", "expressive, playful, rhythmic", "表现力强、俏皮、有节奏", "Performers, envoys, storytellers, and social player characters.", "适合表演者、使节、讲述者和社交型玩家。", ["npc", "player"]),
  captain: profileMetadata("people", "commanding, clipped, steady", "有指挥感、短促、稳定", "Captains, commanders, officers, and tactical player leaders.", "适合队长、指挥官、军官和战术型玩家领袖。", ["npc", "player"]),
  artisan: profileMetadata("people", "practical, textured, matter-of-fact", "务实、有质感、就事论事", "Craftspeople, smiths, alchemists, cooks, and working NPCs.", "适合工匠、铁匠、炼金师、厨师和劳动型 NPC。", ["npc", "player"]),
  dwarf: profileMetadata("lineage", "gruff, sturdy, practical", "粗粝、可靠、务实", "Dwarven NPCs, miners, smiths, and sturdy player concepts.", "适合矮人 NPC、矿工、铁匠和坚韧型玩家概念。", ["npc", "player"]),
  elf: profileMetadata("lineage", "clear, elegant, distant", "清澈、优雅、有距离感", "Elven NPCs, fae figures, and graceful player concepts.", "适合精灵 NPC、妖精角色和优雅型玩家概念。", ["npc", "player"]),
  orc: profileMetadata("lineage", "rough, heavy, confrontational", "粗犷、厚重、压迫感强", "Orc raiders, bruisers, and forceful player concepts.", "适合兽人掠夺者、蛮兵和强势型玩家概念。", ["npc", "player"]),
  tiefling: profileMetadata("lineage", "velvet, sly, infernal", "柔滑、狡黠、带地狱感", "Tieflings, pact envoys, tempters, and charismatic outsiders.", "适合提夫林、契约使者、诱惑者和魅力型异乡人。", ["npc", "player"]),
  halfling: profileMetadata("lineage", "warm, nimble, friendly", "温暖、轻快、友善", "Halflings, cooks, couriers, and small brave player concepts.", "适合半身人、厨师、信使和小个子勇敢玩家概念。", ["npc", "player"]),
  gnome: profileMetadata("lineage", "quick, bright, tinkering", "快速、明亮、爱捣鼓", "Gnomes, inventors, prankish scholars, and tinkerer players.", "适合侏儒、发明家、顽皮学者和工匠型玩家。", ["npc", "player"]),
  dragonborn: profileMetadata("lineage", "resonant, proud, ceremonial", "共鸣感、骄傲、有仪式感", "Dragonborn, oathbound warriors, heralds, and draconic player concepts.", "适合龙裔、誓约战士、传令官和龙族血脉玩家概念。", ["npc", "player"]),
  construct: profileMetadata("lineage", "dry, clipped, synthetic", "干燥、短促、合成感", "Automata, machines, golems, and artificial player bodies.", "适合机关人、机器、魔像和人工躯体玩家。", ["npc", "player"]),
  "occult-scholar": profileMetadata("special", "quiet, learned, unsettling", "安静、博学、略带不安", "Archivists, sages, occultists, and clue-heavy NPCs.", "适合档案管理员、贤者、神秘学者和线索型 NPC。", ["npc"]),
  "shadow-informant": profileMetadata("special", "hushed, quick, conspiratorial", "压低声音、快速、带密谋感", "Informants, spies, coded messages, and underworld contacts.", "适合线人、密探、暗号消息和地下联系人。", ["npc"]),
  "ritual-chanter": profileMetadata("special", "measured, resonant, ceremonial", "克制、有共鸣、仪式感强", "Cultists, temple choirs, ritual locks, and ominous chants.", "适合祭仪参与者、神殿合唱、仪式封印和不祥咏唱。", ["npc"]),
  elder: profileMetadata("special", "slow, wise, weathered", "缓慢、睿智、沧桑", "Village elders, old witnesses, mentors, and senior NPCs.", "适合村长、年迈目击者、导师和资深 NPC。", ["npc"]),
  "elder-woman": profileMetadata("special", "warm, wise, intimate", "温暖、睿智、亲近", "Grandmothers, matriarchs, herbalists, and trusted witnesses.", "适合老奶奶、女族长、草药师和可信目击者。", ["npc"]),
  child: profileMetadata("special", "high, quick, vulnerable", "偏高、快速、脆弱", "Children, urchins, young witnesses, and fragile NPC beats.", "适合孩童、街童、年幼目击者和脆弱情绪段落。", ["npc"]),
  guardian: profileMetadata("special", "disciplined, watchful, stern", "纪律感、警戒、严肃", "Guards, sentries, wardens, and checkpoint NPCs.", "适合守卫、哨兵、看守和关卡 NPC。", ["npc"]),
  merchant: profileMetadata("special", "nimble, practical, persuasive", "灵活、现实、有说服力", "Vendors, brokers, innkeepers, and bargaining scenes.", "适合摊主、中间人、旅店老板和讨价还价场景。", ["npc"]),
  oracle: profileMetadata("special", "slow, prophetic, distant", "缓慢、预言感、疏离", "Oracles, seers, prophets, and ritual clue delivery.", "适合神谕者、占卜师、先知和仪式线索播报。", ["npc"]),
  trickster: profileMetadata("special", "nimble, teasing, theatrical", "灵巧、调侃、戏剧化", "Jesters, gamblers, con artists, and playful social complications.", "适合弄臣、赌徒、骗局角色和轻佻社交麻烦。", ["npc", "player"]),
  villain: profileMetadata("special", "low, controlled, threatening", "低沉、克制、有威胁感", "Antagonists, bosses, enemies, and intimidation scenes.", "适合反派、首领、敌人和威慑场景。", ["npc"]),
  spirit: profileMetadata("special", "distant, airy, uncanny", "遥远、轻飘、异样", "Ghosts, spirits, memories, dreams, and supernatural NPCs.", "适合幽灵、灵体、记忆、梦境和超自然 NPC。", ["npc"]),
  monster: profileMetadata("special", "deep, slow, bestial", "深沉、缓慢、兽性", "Beasts, horrors, fiends, and creature speech.", "适合野兽、恐怖怪物、魔物和异怪发声。", ["npc"])
});

const PROFILE_MENU_GROUPS = Object.freeze({
  core: groupMetadata("Core Voices", "核心声线", "Narrator, rules, table system, and generic speaker fallbacks.", "旁白、规则、牌桌系统和通用角色兜底声线。"),
  people: groupMetadata("People and Classes", "人物与职业", "Social roles, ages, professions, and adventuring class color.", "社交身份、年龄、职业和冒险职业色彩。"),
  lineage: groupMetadata("Lineage and Bodies", "血统与体型", "Species, ancestry, construct, and body-style voice color.", "种族、血脉、构装体和身体类型声线。"),
  special: groupMetadata("NPC Specials", "NPC 特殊声线", "Scene-specific NPCs such as elders, merchants, spirits, and monsters.", "长者、商人、灵体、怪物等场景专用 NPC 声线。")
});

const PROFILE_VOICE_COLORS = Object.freeze({
  aidm: voiceColor({ formantShift: -0.06, resonance: "warm-neutral", breathiness: 0.08, roughness: 0.08, clarity: 0.78 }),
  rules: voiceColor({ formantShift: -0.18, resonance: "chest", breathiness: 0.02, roughness: 0.1, clarity: 0.92 }),
  table: voiceColor({ formantShift: -0.24, resonance: "dry-system", breathiness: 0.01, roughness: 0.06, clarity: 0.86 }),
  guide: voiceColor({ formantShift: -0.04, resonance: "front", breathiness: 0.05, roughness: 0.04, clarity: 0.94 }),
  player: voiceColor({ formantShift: 0.04, resonance: "natural", breathiness: 0.08, roughness: 0.08, clarity: 0.84 }),
  npc: voiceColor({ formantShift: 0, resonance: "street-natural", breathiness: 0.1, roughness: 0.12, clarity: 0.78 }),
  warrior: voiceColor({ formantShift: -0.28, resonance: "chest", breathiness: 0.04, roughness: 0.22, clarity: 0.82 }),
  ranger: voiceColor({ formantShift: 0.1, resonance: "open-air", breathiness: 0.12, roughness: 0.08, clarity: 0.86 }),
  mage: voiceColor({ formantShift: 0.16, resonance: "head", breathiness: 0.08, roughness: 0.05, clarity: 0.9 }),
  cleric: voiceColor({ formantShift: 0.06, resonance: "warm", breathiness: 0.1, roughness: 0.04, clarity: 0.88 }),
  rogue: voiceColor({ formantShift: 0.18, resonance: "close", breathiness: 0.14, roughness: 0.08, clarity: 0.8 }),
  bard: voiceColor({ formantShift: 0.12, resonance: "bright", breathiness: 0.08, roughness: 0.05, clarity: 0.9 }),
  captain: voiceColor({ formantShift: -0.22, resonance: "command", breathiness: 0.03, roughness: 0.16, clarity: 0.9 }),
  artisan: voiceColor({ formantShift: -0.04, resonance: "workshop", breathiness: 0.08, roughness: 0.18, clarity: 0.78 }),
  dwarf: voiceColor({ formantShift: -0.34, resonance: "deep-chest", breathiness: 0.04, roughness: 0.3, clarity: 0.76 }),
  elf: voiceColor({ formantShift: 0.22, resonance: "clear-head", breathiness: 0.06, roughness: 0.02, clarity: 0.94 }),
  orc: voiceColor({ formantShift: -0.4, resonance: "throat", breathiness: 0.05, roughness: 0.42, clarity: 0.68 }),
  tiefling: voiceColor({ formantShift: 0.08, resonance: "velvet", breathiness: 0.14, roughness: 0.08, clarity: 0.84 }),
  halfling: voiceColor({ formantShift: 0.2, resonance: "light", breathiness: 0.1, roughness: 0.05, clarity: 0.86 }),
  gnome: voiceColor({ formantShift: 0.28, resonance: "nasal-bright", breathiness: 0.07, roughness: 0.06, clarity: 0.9 }),
  dragonborn: voiceColor({ formantShift: -0.32, resonance: "ceremonial-chest", breathiness: 0.03, roughness: 0.24, clarity: 0.86 }),
  construct: voiceColor({ formantShift: -0.26, resonance: "synthetic", breathiness: 0, roughness: 0.04, clarity: 0.96 }),
  elder: voiceColor({ formantShift: -0.16, resonance: "aged", breathiness: 0.18, roughness: 0.22, clarity: 0.74 }),
  "elder-woman": voiceColor({ formantShift: 0.04, resonance: "aged-warm", breathiness: 0.2, roughness: 0.16, clarity: 0.78 }),
  child: voiceColor({ formantShift: 0.36, resonance: "small-front", breathiness: 0.08, roughness: 0.03, clarity: 0.82 }),
  villain: voiceColor({ formantShift: -0.3, resonance: "controlled-low", breathiness: 0.04, roughness: 0.18, clarity: 0.88 }),
  spirit: voiceColor({ formantShift: 0.24, resonance: "airy", breathiness: 0.34, roughness: 0.02, clarity: 0.72 }),
  monster: voiceColor({ formantShift: -0.46, resonance: "sub-throat", breathiness: 0.02, roughness: 0.5, clarity: 0.58 })
});

const ROLE_VOICE_PROFILES = Object.freeze([
  roleProfile({
    id: "aidm",
    label: "AIDM Narrator",
    zhLabel: "AIDM 旁白",
    role: "narrator",
    speakerType: "dm",
    gender: "neutral",
    age: "adult",
    aliases: ["aidm", "narrator", "gm", "dm", "host", "主持人", "旁白", "dm旁白"],
    rate: 0.92,
    pitch: 0.88,
    volume: 1,
    en: voiceHints("en-US", "en-us", "en_US-neutral", "en_US-neutral", "af_narrator", ["English", "United States", "Samantha", "Alex", "Daniel", "Karen"]),
    zh: voiceHints("zh-CN", "zh", "zh_CN-neutral", "zh_CN-neutral", "zf_narrator", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia", "Li"])
  }),
  roleProfile({
    id: "rules",
    label: "Rules Arbiter",
    zhLabel: "规则裁定",
    role: "rules",
    speakerType: "system",
    gender: "male",
    age: "adult",
    aliases: ["rules", "rule", "arbiter", "judge", "规则", "裁定", "规则裁定"],
    rate: 1.02,
    pitch: 0.74,
    volume: 0.92,
    en: voiceHints("en-US", "en-us+m3", "en_US-male-medium", "en_US-male-medium", "am_adam", ["English", "United States", "Daniel", "Fred", "Ralph", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m3", "zh_CN-male-medium", "zh_CN-male-medium", "zm_yunjian", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "table",
    label: "Table System",
    zhLabel: "牌桌系统",
    role: "system",
    speakerType: "system",
    gender: "neutral",
    age: "adult",
    aliases: ["table", "system", "state", "table system", "牌桌", "系统", "牌桌系统"],
    rate: 0.96,
    pitch: 0.68,
    volume: 0.86,
    en: voiceHints("en-US", "en-us+m1", "en_US-system", "en_US-system", "am_system", ["English", "United States", "Fred", "Daniel", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m1", "zh_CN-system", "zh_CN-system", "zm_system", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Li"])
  }),
  roleProfile({
    id: "guide",
    label: "Action Guide",
    zhLabel: "行动指引",
    role: "guide",
    speakerType: "system",
    gender: "neutral",
    age: "adult",
    ambience: ["clear", "instruction", "turn"],
    aliases: ["action guide", "turn guide", "onboarding guide", "next action", "行动指引", "回合指引", "下一步提示", "入门指引"],
    rate: 1.06,
    pitch: 0.9,
    volume: 0.9,
    en: voiceHints("en-US", "en-us+m1", "en_US-guide", "en_US-guide", "am_guide", ["English", "United States", "Alex", "Daniel", "Samantha"]),
    zh: voiceHints("zh-CN", "zh+m1", "zh_CN-guide", "zh_CN-guide", "zm_guide", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Li"])
  }),
  roleProfile({
    id: "player",
    label: "Player Character",
    zhLabel: "玩家角色",
    role: "player",
    speakerType: "player",
    gender: "neutral",
    age: "adult",
    aliases: ["player", "character", "hero", "adventurer", "玩家", "角色", "冒险者"],
    rate: 1,
    pitch: 1.06,
    volume: 0.96,
    en: voiceHints("en-US", "en-us+f2", "en_US-player", "en_US-player", "af_heart", ["English", "United States", "Samantha", "Karen", "Victoria"]),
    zh: voiceHints("zh-CN", "zh+f2", "zh_CN-player", "zh_CN-player", "zf_xiaoxiao", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "npc",
    label: "Common NPC",
    zhLabel: "普通 NPC",
    role: "npc",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    aliases: ["npc", "commoner", "villager", "civilian", "普通npc", "村民", "路人"],
    rate: 1.02,
    pitch: 0.98,
    volume: 0.94,
    en: voiceHints("en-US", "en-us", "en_US-common", "en_US-common", "af_common", ["English", "United States", "Samantha", "Alex", "Karen"]),
    zh: voiceHints("zh-CN", "zh", "zh_CN-common", "zh_CN-common", "zf_common", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Li"])
  }),
  roleProfile({
    id: "noble",
    label: "Noble",
    zhLabel: "贵族",
    role: "noble",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    ambience: ["formal", "court", "social"],
    aliases: ["noble", "aristocrat", "duke", "duchess", "lord", "lady", "courtier", "贵族", "公爵", "公主", "领主", "夫人", "宫廷"],
    rate: 0.94,
    pitch: 1.02,
    volume: 0.93,
    en: voiceHints("en-US", "en-us+f1", "en_US-noble", "en_US-noble", "af_alloy", ["English", "United States", "Victoria", "Samantha", "Daniel"]),
    zh: voiceHints("zh-CN", "zh+f1", "zh_CN-noble", "zh_CN-noble", "zf_xiaohan", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "young-hero",
    label: "Young Hero",
    zhLabel: "年轻英雄",
    role: "young-hero",
    speakerType: "npc",
    gender: "neutral",
    age: "young-adult",
    ambience: ["bright", "heroic", "curious"],
    aliases: ["young hero", "squire", "apprentice", "rookie", "young adventurer", "年轻英雄", "侍从", "学徒", "新人", "少年英雄"],
    rate: 1.08,
    pitch: 1.18,
    volume: 0.94,
    en: voiceHints("en-US", "en-us+f4", "en_US-young-hero", "en_US-young-hero", "af_heart", ["English", "United States", "Samantha", "Karen", "Alex"]),
    zh: voiceHints("zh-CN", "zh+f4", "zh_CN-young-hero", "zh_CN-young-hero", "zf_xiaoyi", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "warrior",
    label: "Warrior",
    zhLabel: "战士",
    role: "warrior",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["warrior", "fighter", "soldier", "blade", "战士", "士兵", "武者"],
    rate: 0.9,
    pitch: 0.7,
    volume: 1,
    en: voiceHints("en-US", "en-us+m2", "en_US-warrior", "en_US-warrior", "am_michael", ["English", "United States", "Daniel", "Alex", "Fred"]),
    zh: voiceHints("zh-CN", "zh+m2", "zh_CN-warrior", "zh_CN-warrior", "zm_yunxi", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "ranger",
    label: "Ranger",
    zhLabel: "游侠",
    role: "ranger",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["ranger", "scout", "hunter", "lookout", "游侠", "斥候", "猎人", "哨兵"],
    rate: 1.12,
    pitch: 1.16,
    volume: 0.93,
    en: voiceHints("en-US", "en-us+f4", "en_US-ranger", "en_US-ranger", "af_sarah", ["English", "United States", "Karen", "Samantha", "Moira"]),
    zh: voiceHints("zh-CN", "zh+f4", "zh_CN-ranger", "zh_CN-ranger", "zf_xiaoyi", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "mage",
    label: "Mage",
    zhLabel: "法师",
    role: "mage",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["mage", "wizard", "sorcerer", "witch", "法师", "巫师", "术士", "女巫"],
    rate: 0.94,
    pitch: 1.2,
    volume: 0.95,
    en: voiceHints("en-US", "en-us+f3", "en_US-mage", "en_US-mage", "af_sky", ["English", "United States", "Samantha", "Victoria", "Karen"]),
    zh: voiceHints("zh-CN", "zh+f3", "zh_CN-mage", "zh_CN-mage", "zf_xiaoxuan", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "cleric",
    label: "Cleric",
    zhLabel: "牧师",
    role: "cleric",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["cleric", "priest", "healer", "medic", "牧师", "医者", "治疗者", "祭司"],
    rate: 0.88,
    pitch: 1.08,
    volume: 0.9,
    en: voiceHints("en-US", "en-us+f2", "en_US-cleric", "en_US-cleric", "af_bella", ["English", "United States", "Samantha", "Victoria", "Karen"]),
    zh: voiceHints("zh-CN", "zh+f2", "zh_CN-cleric", "zh_CN-cleric", "zf_xiaomo", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "rogue",
    label: "Rogue",
    zhLabel: "盗贼",
    role: "rogue",
    speakerType: "npc",
    gender: "neutral",
    age: "young-adult",
    aliases: ["rogue", "thief", "trickster", "spy", "盗贼", "诡术师", "骗子", "间谍"],
    rate: 1.16,
    pitch: 1.24,
    volume: 0.92,
    en: voiceHints("en-US", "en-us+f5", "en_US-rogue", "en_US-rogue", "af_nicole", ["English", "United States", "Karen", "Samantha", "Tessa"]),
    zh: voiceHints("zh-CN", "zh+f5", "zh_CN-rogue", "zh_CN-rogue", "zf_xiaobei", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "bard",
    label: "Bard",
    zhLabel: "吟游诗人",
    role: "bard",
    speakerType: "npc",
    gender: "male",
    age: "young-adult",
    aliases: ["bard", "minstrel", "performer", "singer", "吟游诗人", "吟游", "诗人", "歌者"],
    rate: 1.08,
    pitch: 1.14,
    volume: 0.96,
    en: voiceHints("en-US", "en-us+m4", "en_US-bard", "en_US-bard", "am_echo", ["English", "United States", "Alex", "Daniel", "Moira"]),
    zh: voiceHints("zh-CN", "zh+m4", "zh_CN-bard", "zh_CN-bard", "zm_yunyang", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Sinji"])
  }),
  roleProfile({
    id: "captain",
    label: "Captain",
    zhLabel: "指挥官",
    role: "captain",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    ambience: ["command", "battle", "ship"],
    aliases: ["captain", "commander", "officer", "leader", "marshal", "队长", "指挥官", "军官", "船长", "统领"],
    rate: 0.94,
    pitch: 0.82,
    volume: 0.98,
    en: voiceHints("en-US", "en-us+m2", "en_US-captain", "en_US-captain", "am_guardian", ["English", "United States", "Daniel", "Alex", "Fred"]),
    zh: voiceHints("zh-CN", "zh+m2", "zh_CN-captain", "zh_CN-captain", "zm_yunxi", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "artisan",
    label: "Artisan",
    zhLabel: "工匠",
    role: "artisan",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    ambience: ["practical", "craft", "shop"],
    aliases: ["artisan", "craftsperson", "blacksmith", "smith", "alchemist", "cook", "工匠", "匠人", "铁匠", "炼金师", "厨师"],
    rate: 0.98,
    pitch: 0.96,
    volume: 0.94,
    en: voiceHints("en-US", "en-us+f3", "en_US-artisan", "en_US-artisan", "af_merchant", ["English", "United States", "Karen", "Samantha", "Alex"]),
    zh: voiceHints("zh-CN", "zh+f3", "zh_CN-artisan", "zh_CN-artisan", "zf_xiaoxiao", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "weathered-guide",
    label: "Weathered Guide",
    zhLabel: "风霜向导",
    role: "weathered-guide",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    ambience: ["outdoors", "travel", "practical"],
    aliases: ["weathered guide", "trail guide", "caravan scout", "pathfinder", "风霜向导", "向导", "领路人", "商队斥候"],
    rate: 0.96,
    pitch: 0.82,
    volume: 0.94,
    en: voiceHints("en-US", "en-us+m2", "en_US-weathered-guide", "en_US-weathered-guide", "am_onyx", ["English", "United States", "Daniel", "Alex", "Ralph"]),
    zh: voiceHints("zh-CN", "zh+m2", "zh_CN-weathered-guide", "zh_CN-weathered-guide", "zm_yunxi", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "battle-master",
    label: "Battle Master",
    zhLabel: "战术教官",
    role: "battle-master",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    ambience: ["tactical", "combat", "urgent"],
    aliases: ["battle master", "drill captain", "tactics master", "combat mentor", "战术教官", "操练队长", "战斗导师"],
    rate: 0.98,
    pitch: 0.64,
    volume: 1,
    en: voiceHints("en-US", "en-us+m4", "en_US-battle-master", "en_US-battle-master", "am_tactical", ["English", "United States", "Ralph", "Daniel", "Fred"]),
    zh: voiceHints("zh-CN", "zh+m4", "zh_CN-battle-master", "zh_CN-battle-master", "zm_yunhao", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "court-herald",
    label: "Court Herald",
    zhLabel: "宫廷传令",
    role: "court-herald",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    ambience: ["formal", "ceremony", "public"],
    aliases: ["court herald", "royal herald", "ceremony caller", "public crier", "宫廷传令", "王室传令", "仪式宣告者"],
    rate: 1.0,
    pitch: 1.12,
    volume: 0.98,
    en: voiceHints("en-US", "en-us+f1", "en_US-court-herald", "en_US-court-herald", "af_herald", ["English", "United States", "Victoria", "Samantha", "Daniel"]),
    zh: voiceHints("zh-CN", "zh+f1", "zh_CN-court-herald", "zh_CN-court-herald", "zf_xiaohan", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "dwarf",
    label: "Dwarf",
    zhLabel: "矮人",
    role: "dwarf",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["dwarf", "dwarven", "miner", "smith", "矮人", "矿工", "铁匠"],
    rate: 0.84,
    pitch: 0.58,
    volume: 1,
    en: voiceHints("en-US", "en-us+m5", "en_US-dwarf", "en_US-dwarf", "am_onyx", ["English", "United States", "Ralph", "Fred", "Daniel"]),
    zh: voiceHints("zh-CN", "zh+m5", "zh_CN-dwarf", "zh_CN-dwarf", "zm_yunye", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "elf",
    label: "Elf",
    zhLabel: "精灵",
    role: "elf",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["elf", "elven", "fae", "精灵", "精灵族", "妖精"],
    rate: 0.92,
    pitch: 1.32,
    volume: 0.9,
    en: voiceHints("en-US", "en-us+f1", "en_US-elf", "en_US-elf", "af_nova", ["English", "United States", "Samantha", "Victoria", "Karen"]),
    zh: voiceHints("zh-CN", "zh+f1", "zh_CN-elf", "zh_CN-elf", "zf_xiaohan", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "orc",
    label: "Orc",
    zhLabel: "兽人",
    role: "orc",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["orc", "orcish", "raider", "brute", "兽人", "掠夺者", "蛮兵"],
    rate: 0.78,
    pitch: 0.5,
    volume: 1,
    en: voiceHints("en-US", "en-us+m6", "en_US-orc", "en_US-orc", "am_fenrir", ["English", "United States", "Ralph", "Fred", "Daniel"]),
    zh: voiceHints("zh-CN", "zh+m6", "zh_CN-orc", "zh_CN-orc", "zm_yunhao", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "tiefling",
    label: "Tiefling",
    zhLabel: "提夫林",
    role: "tiefling",
    speakerType: "npc",
    gender: "neutral",
    age: "young-adult",
    ambience: ["infernal", "social", "mystery"],
    aliases: ["tiefling", "infernal", "pactbound", "devil-blooded", "提夫林", "炼狱", "魔裔", "契约者"],
    rate: 0.98,
    pitch: 1.12,
    volume: 0.94,
    en: voiceHints("en-US", "en-us+f2", "en_US-tiefling", "en_US-tiefling", "af_alloy", ["English", "United States", "Samantha", "Victoria", "Karen"]),
    zh: voiceHints("zh-CN", "zh+f2", "zh_CN-tiefling", "zh_CN-tiefling", "zf_xiaohan", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "halfling",
    label: "Halfling",
    zhLabel: "半身人",
    role: "halfling",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    ambience: ["warm", "homely", "nimble"],
    aliases: ["halfling", "smallfolk", "cook", "courier", "半身人", "小个子", "厨师", "信使"],
    rate: 1.08,
    pitch: 1.22,
    volume: 0.9,
    en: voiceHints("en-US", "en-us+f4", "en_US-halfling", "en_US-halfling", "af_bella", ["English", "United States", "Samantha", "Karen", "Tessa"]),
    zh: voiceHints("zh-CN", "zh+f4", "zh_CN-halfling", "zh_CN-halfling", "zf_xiaoyi", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "gnome",
    label: "Gnome",
    zhLabel: "侏儒",
    role: "gnome",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    ambience: ["bright", "tinkering", "curious"],
    aliases: ["gnome", "inventor", "tinker", "artificer", "侏儒", "发明家", "奇械师"],
    rate: 1.18,
    pitch: 1.3,
    volume: 0.88,
    en: voiceHints("en-US", "en-us+f5", "en_US-gnome", "en_US-gnome", "af_nicole", ["English", "United States", "Karen", "Samantha", "Alex"]),
    zh: voiceHints("zh-CN", "zh+f5", "zh_CN-gnome", "zh_CN-gnome", "zf_xiaobei", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "dragonborn",
    label: "Dragonborn",
    zhLabel: "龙裔",
    role: "dragonborn",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    ambience: ["proud", "ceremonial", "resonant"],
    aliases: ["dragonborn", "draconic", "dragon blood", "herald", "龙裔", "龙族", "龙血", "传令官"],
    rate: 0.86,
    pitch: 0.66,
    volume: 1,
    en: voiceHints("en-US", "en-us+m4", "en_US-dragonborn", "en_US-dragonborn", "am_onyx", ["English", "United States", "Ralph", "Daniel", "Fred"]),
    zh: voiceHints("zh-CN", "zh+m4", "zh_CN-dragonborn", "zh_CN-dragonborn", "zm_yunhao", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "construct",
    label: "Construct",
    zhLabel: "构装体",
    role: "construct",
    speakerType: "npc",
    gender: "neutral",
    age: "ageless",
    aliases: ["construct", "automaton", "machine", "robot", "mechanical", "构装体", "机械", "机关人", "机器人"],
    rate: 0.82,
    pitch: 0.64,
    volume: 0.88,
    en: voiceHints("en-US", "en-us+m1", "en_US-construct", "en_US-construct", "am_robot", ["English", "United States", "Fred", "Daniel", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m1", "zh_CN-construct", "zh_CN-construct", "zm_robot", ["Chinese", "Mandarin", "普通话", "中文", "Li", "Sinji"])
  }),
  roleProfile({
    id: "occult-scholar",
    label: "Occult Scholar",
    zhLabel: "神秘学者",
    role: "occult-scholar",
    speakerType: "npc",
    gender: "neutral",
    age: "elder",
    aliases: ["occult scholar", "occultist", "scholar", "sage", "librarian", "神秘学者", "秘术学者", "学者", "贤者", "图书管理员"],
    rate: 0.9,
    pitch: 0.92,
    volume: 0.94,
    en: voiceHints("en-US", "en-us+m3", "en_US-occult-scholar", "en_US-occult-scholar", "am_sage", ["English", "United States", "Daniel", "Victoria", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m3", "zh_CN-occult-scholar", "zh_CN-occult-scholar", "zm_yunjian", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Ting"])
  }),
  roleProfile({
    id: "shadow-informant",
    label: "Shadow Informant",
    zhLabel: "暗影线人",
    role: "shadow-informant",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    ambience: ["hushed", "underworld", "secret"],
    aliases: ["shadow informant", "informant", "spy contact", "underworld contact", "暗影线人", "线人", "密探", "地下联系人"],
    rate: 1.1,
    pitch: 0.78,
    volume: 0.84,
    en: voiceHints("en-US", "en-us+m3", "en_US-shadow-informant", "en_US-shadow-informant", "am_informant", ["English", "United States", "Alex", "Daniel", "Fred"]),
    zh: voiceHints("zh-CN", "zh+m3", "zh_CN-shadow-informant", "zh_CN-shadow-informant", "zm_yunjian", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "ritual-chanter",
    label: "Ritual Chanter",
    zhLabel: "仪式咏唱者",
    role: "ritual-chanter",
    speakerType: "npc",
    gender: "neutral",
    age: "adult",
    ambience: ["ritual", "ceremonial", "ominous"],
    aliases: ["ritual chanter", "chanter", "chant leader", "cult chanter", "仪式咏唱者", "咏唱者", "祭仪歌者", "邪教咏唱"],
    rate: 0.76,
    pitch: 1.08,
    volume: 0.92,
    en: voiceHints("en-US", "en-us+f1", "en_US-ritual-chanter", "en_US-ritual-chanter", "af_chant", ["English", "United States", "Victoria", "Samantha", "Moira"]),
    zh: voiceHints("zh-CN", "zh+f1", "zh_CN-ritual-chanter", "zh_CN-ritual-chanter", "zf_xiaohan", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "elder",
    label: "Elder",
    zhLabel: "长者",
    role: "elder",
    speakerType: "npc",
    gender: "male",
    age: "elder",
    aliases: ["elder", "old one", "village elder", "grandfather", "长者", "老人", "村长", "老者"],
    rate: 0.82,
    pitch: 0.78,
    volume: 0.94,
    en: voiceHints("en-US", "en-us+m5", "en_US-elder", "en_US-elder", "am_george", ["English", "United States", "Fred", "Daniel", "Alex"]),
    zh: voiceHints("zh-CN", "zh+m5", "zh_CN-elder", "zh_CN-elder", "zm_yunye", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "elder-woman",
    label: "Elder Woman",
    zhLabel: "老妇人",
    role: "elder-woman",
    speakerType: "npc",
    gender: "female",
    age: "elder",
    ambience: ["warm", "wise", "village"],
    aliases: ["elder woman", "old woman", "grandmother", "matriarch", "老妇人", "老妇", "老奶奶", "祖母", "女长者"],
    rate: 0.84,
    pitch: 1.0,
    volume: 0.9,
    en: voiceHints("en-US", "en-us+f2", "en_US-elder-woman", "en_US-elder-woman", "af_grandmother", ["English", "United States", "Victoria", "Samantha", "Karen"]),
    zh: voiceHints("zh-CN", "zh+f2", "zh_CN-elder-woman", "zh_CN-elder-woman", "zf_xiaomo", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "child",
    label: "Child",
    zhLabel: "孩童",
    role: "child",
    speakerType: "npc",
    gender: "neutral",
    age: "child",
    aliases: ["child", "kid", "urchin", "young", "孩童", "孩子", "小孩", "少年"],
    rate: 1.1,
    pitch: 1.42,
    volume: 0.88,
    en: voiceHints("en-US", "en-us+f5", "en_US-child", "en_US-child", "af_child", ["English", "United States", "Samantha", "Karen", "Tessa"]),
    zh: voiceHints("zh-CN", "zh+f5", "zh_CN-child", "zh_CN-child", "zf_child", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "guardian",
    label: "Guardian",
    zhLabel: "守卫",
    role: "guardian",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["guardian", "guard", "sentinel", "warden", "守卫", "卫兵", "看守"],
    rate: 0.9,
    pitch: 0.72,
    volume: 0.98,
    en: voiceHints("en-US", "en-us+m2", "en_US-guardian", "en_US-guardian", "am_guardian", ["English", "United States", "Daniel", "Alex", "Fred"]),
    zh: voiceHints("zh-CN", "zh+m2", "zh_CN-guardian", "zh_CN-guardian", "zm_yunxi", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "merchant",
    label: "Merchant",
    zhLabel: "商人",
    role: "merchant",
    speakerType: "npc",
    gender: "female",
    age: "adult",
    aliases: ["merchant", "vendor", "shopkeeper", "trader", "商人", "店主", "摊主", "商贩"],
    rate: 1.05,
    pitch: 1.1,
    volume: 0.95,
    en: voiceHints("en-US", "en-us+f3", "en_US-merchant", "en_US-merchant", "af_merchant", ["English", "United States", "Karen", "Samantha", "Victoria"]),
    zh: voiceHints("zh-CN", "zh+f3", "zh_CN-merchant", "zh_CN-merchant", "zf_xiaoxiao", ["Chinese", "Mandarin", "普通话", "中文", "Meijia", "Ting"])
  }),
  roleProfile({
    id: "oracle",
    label: "Oracle",
    zhLabel: "神谕者",
    role: "oracle",
    speakerType: "npc",
    gender: "neutral",
    age: "elder",
    ambience: ["prophetic", "ritual", "mystery"],
    aliases: ["oracle", "seer", "prophet", "diviner", "augur", "神谕者", "先知", "预言者", "占卜师", "卜者"],
    rate: 0.8,
    pitch: 1.18,
    volume: 0.88,
    en: voiceHints("en-US", "en-us+f1", "en_US-oracle", "en_US-oracle", "af_nova", ["English", "United States", "Victoria", "Samantha", "Moira"]),
    zh: voiceHints("zh-CN", "zh+f1", "zh_CN-oracle", "zh_CN-oracle", "zf_xiaohan", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "trickster",
    label: "Trickster",
    zhLabel: "诡术表演者",
    role: "trickster",
    speakerType: "npc",
    gender: "neutral",
    age: "young-adult",
    ambience: ["playful", "social", "deceptive"],
    aliases: ["trickster", "jester", "gambler", "con artist", "prankster", "弄臣", "赌徒", "诡术表演者", "骗术师", "恶作剧者"],
    rate: 1.18,
    pitch: 1.26,
    volume: 0.92,
    en: voiceHints("en-US", "en-us+f5", "en_US-trickster", "en_US-trickster", "af_nicole", ["English", "United States", "Karen", "Samantha", "Tessa"]),
    zh: voiceHints("zh-CN", "zh+f5", "zh_CN-trickster", "zh_CN-trickster", "zf_xiaobei", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "villain",
    label: "Villain",
    zhLabel: "反派",
    role: "villain",
    speakerType: "npc",
    gender: "male",
    age: "adult",
    aliases: ["villain", "enemy", "boss", "antagonist", "反派", "敌人", "首领"],
    rate: 0.86,
    pitch: 0.62,
    volume: 1,
    en: voiceHints("en-US", "en-us+m4", "en_US-villain", "en_US-villain", "am_villain", ["English", "United States", "Daniel", "Fred", "Ralph"]),
    zh: voiceHints("zh-CN", "zh+m4", "zh_CN-villain", "zh_CN-villain", "zm_yunhao", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  }),
  roleProfile({
    id: "spirit",
    label: "Spirit",
    zhLabel: "灵体",
    role: "spirit",
    speakerType: "npc",
    gender: "neutral",
    age: "ageless",
    ambience: ["ethereal", "mystery", "quiet"],
    aliases: ["spirit", "ghost", "phantom", "shade", "apparition", "灵体", "幽灵", "鬼魂", "幻影", "亡魂"],
    rate: 0.78,
    pitch: 1.36,
    volume: 0.82,
    en: voiceHints("en-US", "en-us+f1", "en_US-spirit", "en_US-spirit", "af_nova", ["English", "United States", "Samantha", "Victoria", "Moira"]),
    zh: voiceHints("zh-CN", "zh+f1", "zh_CN-spirit", "zh_CN-spirit", "zf_xiaohan", ["Chinese", "Mandarin", "普通话", "中文", "Ting", "Meijia"])
  }),
  roleProfile({
    id: "monster",
    label: "Monster",
    zhLabel: "怪物",
    role: "monster",
    speakerType: "npc",
    gender: "neutral",
    age: "ageless",
    ambience: ["threat", "horror", "beast"],
    aliases: ["monster", "beast", "creature", "fiend", "horror", "怪物", "野兽", "魔物", "异怪", "恐怖"],
    rate: 0.74,
    pitch: 0.46,
    volume: 1,
    en: voiceHints("en-US", "en-us+m6", "en_US-monster", "en_US-monster", "am_fenrir", ["English", "United States", "Ralph", "Fred", "Daniel"]),
    zh: voiceHints("zh-CN", "zh+m6", "zh_CN-monster", "zh_CN-monster", "zm_yunhao", ["Chinese", "Mandarin", "普通话", "中文", "Sinji", "Li"])
  })
]);

const PROFILE_BY_ID = new Map(ROLE_VOICE_PROFILES.map((profile) => [profile.id, profile]));
const PROFILE_ID_BY_ALIAS = new Map(
  ROLE_VOICE_PROFILES.flatMap((profile) => profile.aliases.map((alias) => [normalizeSpeakerKey(alias), profile.id]))
);
const PROFILE_MATCH_ORDER = [
  "occult-scholar",
  "construct",
  "shadow-informant",
  "ritual-chanter",
  "elder-woman",
  "young-hero",
  "weathered-guide",
  "battle-master",
  "court-herald",
  "monster",
  "spirit",
  "oracle",
  "noble",
  "captain",
  "halfling",
  "artisan",
  "warrior",
  "ranger",
  "cleric",
  "trickster",
  "rogue",
  "dwarf",
  "dragonborn",
  "tiefling",
  "gnome",
  "orc",
  "bard",
  "mage",
  "elf",
  "elder",
  "child",
  "guardian",
  "merchant",
  "villain",
  "guide",
  "rules",
  "table",
  "aidm",
  "npc",
  "player"
];

export function listTtsProviders() {
  return TTS_PROVIDERS.map((provider) => ({ ...provider }));
}

export function listVoiceProfiles(language = "en") {
  const locale = normalizeLanguage(language);
  return ROLE_VOICE_PROFILES.map((profile) => localizeProfile(profile, locale));
}

export function listVoiceProfileGroups(language = "en") {
  const locale = normalizeLanguage(language);
  return Object.entries(PROFILE_MENU_GROUPS).map(([id]) => localizeProfileGroup(id, locale));
}

export function getSpeakerProfile(author = "", language = "en", options = {}) {
  const request = normalizeProfileRequest(author, options);
  const locale = normalizeLanguage(language);
  const profileId = resolveProfileId(request);
  if (profileId) {
    return localizeProfile(PROFILE_BY_ID.get(profileId), locale);
  }

  const hash = stableHash(request.author || request.roleType || request.speakerType || "player");
  const fallbackId = request.speakerType === "npc" ? "npc" : "player";
  const fallback = PROFILE_BY_ID.get(fallbackId);
  return localizeProfile({
    ...fallback,
    id: `${fallbackId}-${hash % 7}`,
    pitch: clamp(0.88 + (hash % 7) * 0.06, 0.5, 1.42),
    rate: clamp(0.94 + (hash % 5) * 0.025, 0.76, 1.16)
  }, locale);
}

export function voiceHintsForProfile(profile, language = "en") {
  const locale = normalizeLanguage(language);
  const base = resolveProfileDefinition(profile);
  return cloneHints(base.hints[locale] || base.hints.en);
}

export function buildUtterancePlan({
  author = "AIDM",
  text = "",
  language = "en",
  speakerType = "",
  roleType = "",
  gender = "",
  age = "",
  ambience = "",
  mood = ""
} = {}) {
  const profile = getSpeakerProfile(author, language, { speakerType, roleType, gender, age, ambience, mood });
  const hints = voiceHintsForProfile(profile, language);
  return {
    provider: BROWSER_TTS_PROVIDER_ID,
    author,
    text: String(text || "").trim(),
    language: hints.language,
    profile,
    voiceTuning: profile.voiceTuning,
    hints
  };
}

function roleProfile({ en, zh, ...profile }) {
  const metadata = PROFILE_METADATA[profile.id] || profileMetadata("special", "neutral, flexible", "中性、可变", "General table speech profile.", "通用牌桌发言声线。", [profile.speakerType || "npc"]);
  const voiceColorProfile = voiceColorFor(profile);
  return {
    ...metadata,
    displayName: Object.freeze({
      en: profile.label,
      zh: profile.zhLabel || profile.label
    }),
    ambience: Object.freeze(profile.ambience || ["neutral"]),
    ...profile,
    ambience: Object.freeze(profile.ambience || ["neutral"]),
    voiceColor: Object.freeze(voiceColorProfile),
    hints: { en, zh }
  };
}

function localizeProfile(profile, locale) {
  const hints = cloneHints(profile.hints?.[locale] || profile.hints?.en);
  const displayName = {
    en: profile.displayName?.en || profile.label,
    zh: profile.displayName?.zh || profile.zhLabel || profile.label
  };
  const group = localizeProfileGroup(profile.menuGroup, locale);
  const voiceSummary = {
    en: `${displayName.en}: ${profile.personality}. ${profile.usage}`,
    zh: `${displayName.zh}: ${profile.zhPersonality || profile.personality}。${profile.zhUsage || profile.usage}`
  };
  return {
    ...profile,
    label: locale === "zh" ? displayName.zh : displayName.en,
    displayName,
    bilingualLabel: `${displayName.en} / ${displayName.zh}`,
    menuGroupLabel: group.label,
    group,
    personality: locale === "zh" ? profile.zhPersonality || profile.personality : profile.personality,
    usage: locale === "zh" ? profile.zhUsage || profile.usage : profile.usage,
    voiceSummary,
    useCases: [...(profile.useCases || [])],
    voiceTuning: {
      rate: profile.rate,
      pitch: profile.pitch,
      volume: profile.volume,
      ...profile.voiceColor
    },
    hints,
    aliases: [...(profile.aliases || [])]
  };
}

function profileMetadata(menuGroup, personality, zhPersonality, usage, zhUsage, useCases) {
  return Object.freeze({
    menuGroup,
    personality,
    zhPersonality,
    usage,
    zhUsage,
    useCases: Object.freeze(useCases)
  });
}

function voiceColor(settings) {
  return Object.freeze({
    formantShift: 0,
    resonance: "natural",
    breathiness: 0.08,
    roughness: 0.08,
    clarity: 0.82,
    ...settings
  });
}

function voiceColorFor(profile) {
  const genderBase = profile.gender === "male"
    ? { formantShift: -0.16, resonance: "chest" }
    : profile.gender === "female"
      ? { formantShift: 0.12, resonance: "head" }
      : { formantShift: 0, resonance: "natural" };
  const ageBase = profile.age === "child" || profile.age === "young"
    ? { formantShift: 0.24, breathiness: 0.08, roughness: 0.04 }
    : profile.age === "elder" || profile.age === "old"
      ? { formantShift: -0.08, breathiness: 0.18, roughness: 0.18 }
      : {};
  return voiceColor({
    ...genderBase,
    ...ageBase,
    ...(PROFILE_VOICE_COLORS[profile.id] || {}),
    ...(profile.voiceColor || {})
  });
}

function groupMetadata(label, zhLabel, description, zhDescription) {
  return Object.freeze({
    label,
    zhLabel,
    description,
    zhDescription
  });
}

function localizeProfileGroup(id, locale) {
  const group = PROFILE_MENU_GROUPS[id] || PROFILE_MENU_GROUPS.special;
  return {
    id,
    label: locale === "zh" ? group.zhLabel : group.label,
    description: locale === "zh" ? group.zhDescription : group.description,
    displayName: {
      en: group.label,
      zh: group.zhLabel
    }
  };
}

function resolveProfileDefinition(profile = {}) {
  const normalizedId = String(profile.id || "").replace(/-\d+$/, "");
  if (PROFILE_BY_ID.has(normalizedId)) return PROFILE_BY_ID.get(normalizedId);
  const byRole = ROLE_VOICE_PROFILES.find((candidate) => candidate.role === profile.role);
  return byRole || PROFILE_BY_ID.get("player");
}

function resolveProfileId(request) {
  if (request.speakerType === "dm") return "aidm";
  if (request.speakerType === "system" && !request.roleType && !request.author) return "table";

  const exactRole = PROFILE_ID_BY_ALIAS.get(request.roleType) || PROFILE_BY_ID.get(request.roleType)?.id;
  if (exactRole) return exactRole;

  const exactAuthor = PROFILE_ID_BY_ALIAS.get(request.author) || PROFILE_BY_ID.get(request.author)?.id;
  if (exactAuthor) return exactAuthor;

  const combined = [request.roleType, request.author].filter(Boolean).join(" ");
  if (combined) {
    for (const profileId of PROFILE_MATCH_ORDER) {
      const profile = PROFILE_BY_ID.get(profileId);
      if (profile.aliases.some((alias) => speakerTextMatches(combined, alias))) {
        return profile.id;
      }
    }
  }

  const traitMatch = profileIdFromTraits(request);
  if (traitMatch) return traitMatch;

  if (request.speakerType === "npc") return "npc";
  return "";
}

function normalizeProfileRequest(author, options) {
  if (author && typeof author === "object") {
    return {
      author: normalizeSpeakerKey(author.author || author.name || ""),
      speakerType: normalizeSpeakerKey(author.speakerType || options.speakerType || ""),
      roleType: normalizeSpeakerKey(author.roleType || author.role || options.roleType || ""),
      gender: normalizeSpeakerKey(author.gender || options.gender || ""),
      age: normalizeSpeakerKey(author.age || options.age || ""),
      ambience: normalizeSpeakerKey(author.ambience || author.mood || options.ambience || options.mood || "")
    };
  }
  return {
    author: normalizeSpeakerKey(author),
    speakerType: normalizeSpeakerKey(options.speakerType || ""),
    roleType: normalizeSpeakerKey(options.roleType || ""),
    gender: normalizeSpeakerKey(options.gender || ""),
    age: normalizeSpeakerKey(options.age || ""),
    ambience: normalizeSpeakerKey(options.ambience || options.mood || "")
  };
}

function profileIdFromTraits(request) {
  const traitText = normalizeSpeakerKey([request.gender, request.age, request.ambience, request.roleType, request.author].filter(Boolean).join(" "));
  if (!traitText) return "";
  if (speakerTextMatches(traitText, "female elder") || speakerTextMatches(traitText, "old woman") || traitText.includes("女长者")) return "elder-woman";
  if (speakerTextMatches(traitText, "action guide") || speakerTextMatches(traitText, "turn guide") || traitText.includes("行动指引")) return "guide";
  if (speakerTextMatches(traitText, "weathered guide") || speakerTextMatches(traitText, "trail guide") || traitText.includes("向导")) return "weathered-guide";
  if (speakerTextMatches(traitText, "battle master") || speakerTextMatches(traitText, "combat mentor") || traitText.includes("战术教官")) return "battle-master";
  if (speakerTextMatches(traitText, "court herald") || speakerTextMatches(traitText, "royal herald") || traitText.includes("宫廷传令")) return "court-herald";
  if (speakerTextMatches(traitText, "informant") || speakerTextMatches(traitText, "spy contact") || traitText.includes("线人")) return "shadow-informant";
  if (speakerTextMatches(traitText, "ritual chanter") || speakerTextMatches(traitText, "chant leader") || traitText.includes("咏唱者")) return "ritual-chanter";
  if (speakerTextMatches(traitText, "young hero") || speakerTextMatches(traitText, "apprentice") || traitText.includes("年轻英雄")) return "young-hero";
  if (speakerTextMatches(traitText, "spirit") || speakerTextMatches(traitText, "ghost") || traitText.includes("幽灵")) return "spirit";
  if (speakerTextMatches(traitText, "monster") || speakerTextMatches(traitText, "beast") || traitText.includes("怪物")) return "monster";
  if (speakerTextMatches(traitText, "dragonborn") || speakerTextMatches(traitText, "draconic") || traitText.includes("龙裔")) return "dragonborn";
  if (speakerTextMatches(traitText, "tiefling") || speakerTextMatches(traitText, "infernal") || traitText.includes("提夫林")) return "tiefling";
  if (speakerTextMatches(traitText, "halfling") || speakerTextMatches(traitText, "smallfolk") || traitText.includes("半身人")) return "halfling";
  if (speakerTextMatches(traitText, "gnome") || speakerTextMatches(traitText, "tinker") || traitText.includes("侏儒")) return "gnome";
  if (speakerTextMatches(traitText, "oracle") || speakerTextMatches(traitText, "prophet") || traitText.includes("神谕")) return "oracle";
  if (speakerTextMatches(traitText, "captain") || speakerTextMatches(traitText, "commander") || traitText.includes("指挥官")) return "captain";
  if (speakerTextMatches(traitText, "artisan") || speakerTextMatches(traitText, "blacksmith") || traitText.includes("工匠")) return "artisan";
  if (speakerTextMatches(traitText, "jester") || speakerTextMatches(traitText, "gambler") || traitText.includes("弄臣")) return "trickster";
  if (speakerTextMatches(traitText, "noble") || speakerTextMatches(traitText, "court") || traitText.includes("贵族")) return "noble";
  return "";
}

function speakerTextMatches(text, alias) {
  const normalizedText = normalizeSpeakerKey(text);
  const normalizedAlias = normalizeSpeakerKey(alias);
  if (!normalizedText || !normalizedAlias) return false;
  if (/^[a-z0-9 -]+$/.test(normalizedAlias)) {
    const escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(normalizedText);
  }
  return normalizedText.includes(normalizedAlias);
}

function voiceHints(language, espeakVoice, piperVoicePattern, sherpaVoicePattern, kokoroVoicePattern, browserVoiceIncludes) {
  return {
    language,
    browserVoiceIncludes,
    espeakVoice,
    piperVoicePattern,
    sherpaVoicePattern,
    kokoroVoicePattern
  };
}

function cloneHints(hints) {
  return {
    ...hints,
    browserVoiceIncludes: [...(hints?.browserVoiceIncludes || [])]
  };
}

function normalizeSpeakerKey(value) {
  return String(value || "").trim().toLowerCase();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stableHash(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}
