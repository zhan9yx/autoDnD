const FALLBACK_UPDATED_AT = "1970-01-01T00:00:00.000Z";

const ACTIVE_ENCOUNTER_STATES = new Set(["active", "combat", "engaged", "hostile", "started", "in-combat"]);

const SCENE_LOCATION_AUDIO_GUARDS = Object.freeze({
  forest: Object.freeze(["forest", "insects", "whispers"]),
  pond: Object.freeze(["pond", "waterfall"]),
  waterfall: Object.freeze(["waterfall", "pond"]),
  campfire: Object.freeze(["campfire", "tavern"]),
  field: Object.freeze(["insects", "light-wind", "gale-wind", "calm-night"]),
  town: Object.freeze(["town-square", "market-city", "crowd-murmur", "cheering-crowd", "angry-shouts", "light-wind", "clear-day"]),
  market: Object.freeze(["market-city", "town-square", "tavern", "crowd-murmur", "cheering-crowd", "angry-shouts", "toasting-cheers"]),
  tavern: Object.freeze(["tavern", "market-city", "campfire", "crowd-murmur", "cheering-crowd", "toasting-cheers", "singing", "whispers"]),
  archive: Object.freeze(["archive-room", "whispers", "mystery", "calm-night", "light-rain"]),
  shrine: Object.freeze(["shrine-cistern", "pond", "whispers", "mystery", "singing", "light-rain"]),
  interior: Object.freeze(["quiet-interior", "archive-room", "whispers", "mystery", "calm-night", "crowd-murmur"])
});

const LOUD_SOCIAL_PRESETS = new Set(["cheering-crowd", "angry-shouts", "toasting-cheers", "singing"]);
const SOCIAL_PRESETS = new Set([...LOUD_SOCIAL_PRESETS, "crowd-murmur"]);

const WEATHER_TAG_TERMS = Object.freeze({
  clear: Object.freeze(["clear", "clear sky", "sunny", "sunlit", "bright day", "blue sky", "晴朗", "晴天", "阳光", "蓝天"]),
  wet: Object.freeze(["wet", "mist", "fog", "drizzle", "rain", "puddle", "slick", "潮湿", "雾", "细雨", "雨", "暴雨", "水洼"]),
  "light-rain": Object.freeze(["drizzle", "sprinkle", "light rain", "misty rain", "soft rain", "fine rain", "细雨", "小雨", "毛毛雨"]),
  "heavy-rain": Object.freeze(["downpour", "heavy rain", "rainstorm", "monsoon", "sheets of rain", "torrent", "torrential rain", "暴雨", "大雨", "倾盆雨"]),
  thunder: Object.freeze(["thunder", "thunderclap", "lightning", "lightning flash", "thunderstorm", "storm front", "storm clouds", "雷", "雷鸣", "闪电", "风暴"]),
  "light-wind": Object.freeze(["breeze", "light wind", "soft wind", "gentle wind", "leaf wind", "微风", "轻风", "和风"]),
  "gale-wind": Object.freeze(["gale", "howling wind", "strong wind", "squall", "gust", "gusts", "狂风", "疾风", "强风", "呼啸", "阵风"])
});

const LOCATION_TAG_TERMS = Object.freeze({
  forest: Object.freeze(["forest", "woods", "woodland", "grove", "jungle", "trees", "pine", "canopy", "森林", "树林", "林地", "树冠"]),
  pond: Object.freeze(["pond", "lake", "pool", "cistern", "marsh", "swamp", "reeds", "lotus", "池塘", "湖", "水池", "蓄水池", "沼泽", "芦苇"]),
  waterfall: Object.freeze(["waterfall", "cascade", "rapids", "falls", "gorge", "river", "瀑布", "急流", "峡谷", "河流"]),
  campfire: Object.freeze(["campfire", "fireplace", "hearth", "bonfire", "embers", "torch", "火堆", "篝火", "壁炉", "余烬", "火把"]),
  field: Object.freeze(["field", "grass", "meadow", "dusk", "草地", "田野", "黄昏"]),
  town: Object.freeze(["town", "village", "hamlet", "town square", "neighborhood", "城镇", "镇子", "村庄", "小镇", "街区"]),
  market: Object.freeze(["market", "city", "street", "alley", "bazaar", "plaza", "dock", "harbor", "vendor", "hawker", "stall", "市场", "集市", "城市", "街", "巷", "码头", "广场", "摊位", "商贩"]),
  tavern: Object.freeze(["tavern", "inn", "pub", "alehouse", "bar", "common room", "taproom", "酒馆", "旅店", "客栈", "酒吧", "大厅"]),
  archive: Object.freeze(["archive room", "records archive", "library", "stacks", "records room", "ledger room", "scriptorium", "档案室", "图书馆", "书库", "卷宗室", "账本室"]),
  shrine: Object.freeze(["shrine", "temple", "sanctuary", "chapel", "cistern shrine", "crypt", "神殿", "神庙", "圣所", "礼拜堂", "蓄水池神龛", "地穴"]),
  interior: Object.freeze(["interior", "indoors", "inside", "quiet room", "private room", "study", "office", "chamber", "corridor", "室内", "屋内", "房间", "静室", "书房", "办公室", "厅堂", "走廊"])
});

const MOOD_TAG_TERMS = Object.freeze({
  cheerful: Object.freeze(["cheer", "cheerful", "cheering", "applause", "celebration", "festival", "欢呼", "喝彩", "庆典", "节日"]),
  angry: Object.freeze(["angry", "shout", "shouting", "argument", "heckle", "boo", "curse", "叫骂", "争吵", "怒吼", "咒骂"]),
  secretive: Object.freeze(["secretive", "whisper", "whispers", "hushed", "secret", "murmur", "低语", "耳语", "秘密", "窃窃私语"]),
  singing: Object.freeze(["song", "singing", "chant", "hymn", "ballad", "歌声", "歌唱", "吟唱", "圣歌"]),
  crowded: Object.freeze(["crowd", "crowded", "people", "patrons", "audience", "murmur", "babble", "busy room", "人群", "人声", "宾客", "观众", "嘈杂", "喧闹"]),
  toasting: Object.freeze(["toast", "toasting", "clink", "clinking", "glasses", "mugs", "cup clatter", "碰杯", "干杯", "酒杯", "杯盏", "杯盘"]),
  calm: Object.freeze(["calm", "quiet", "rest", "peaceful", "sleep", "平静", "安静", "休息", "宁静"]),
  mystery: Object.freeze(["mystery", "secret", "clue", "shadow", "ritual", "curse", "秘密", "线索", "阴影", "仪式", "诅咒"])
});

const SEASON_TAG_TERMS = Object.freeze({
  spring: Object.freeze(["spring", "blossom", "new leaves", "fresh growth", "春", "春季", "花", "新叶"]),
  summer: Object.freeze(["summer", "cicada", "humid heat", "high sun", "夏", "夏季", "蝉", "暑热"]),
  autumn: Object.freeze(["autumn", "fall", "dry leaves", "harvest", "gold leaves", "秋", "秋季", "落叶", "收获"]),
  winter: Object.freeze(["winter", "snow", "frost", "ice", "cold air", "冬", "冬季", "雪", "霜", "冰", "寒冷"])
});

const WEATHER_TAG_IDS = new Set(Object.keys(WEATHER_TAG_TERMS));
const LOCATION_TAG_IDS = new Set(Object.keys(LOCATION_TAG_TERMS));
const MOOD_TAG_IDS = new Set(Object.keys(MOOD_TAG_TERMS));
const SEASON_TAG_IDS = new Set(Object.keys(SEASON_TAG_TERMS));

const LAYERS = Object.freeze({
  combatDrums: layer("low-war-drums", "music", "music.combat-drums", 0.78, ["combat-pulse"], ["music:combat"]),
  bowedMetal: layer("bowed-metal-pulse", "tension", "tension.bowed-metal", 0.64, ["danger-pulse"], ["mood:danger"]),
  weaponClatter: layer("distant-weapon-clatter", "foley", "foley.weapon-clatter", 0.38, ["sparks"], ["foley:weapons"]),
  drizzleTicks: layer("drizzle-ticks-on-stone", "weather", "rain.drizzle", 0.36, ["light-rain", "fine-droplets"], ["weather:rain", "intensity:drizzle"]),
  lightRain: layer("fine-rain-on-stone", "weather", "rain.light", 0.58, ["light-rain", "wet-stone"], ["weather:rain", "intensity:light"]),
  downpourSheet: layer("downpour-sheet-body", "weather", "rain.downpour", 0.76, ["heavy-rain", "low-visibility"], ["weather:rain", "intensity:downpour"]),
  heavyRain: layer("heavy-rain-curtain", "weather", "rain.heavy", 0.86, ["heavy-rain", "low-visibility"], ["weather:rain", "intensity:heavy"]),
  rainSplashes: layer("gutter-rain-splashes", "water", "rain.splashes", 0.34, ["wet-stone"], ["weather:rain", "foley:splashes"]),
  roofDrips: layer("roof-drips", "water", "water.drips", 0.42, ["drips"], ["weather:wet"]),
  distantThunder: layer("distant-thunder-roll", "weather", "thunder.distant", 0.42, ["lightning-horizon"], ["weather:thunder"]),
  thunderRumble: layer("aftershock-thunder-rumble", "weather", "thunder.rumble", 0.38, ["lightning-horizon"], ["weather:thunder"]),
  closeThunder: layer("close-thunder-crack", "weather", "thunder.close", 0.72, ["lightning-flash"], ["weather:thunder", "intensity:heavy"]),
  lightningCrackle: layer("lightning-air-crackle", "weather", "lightning.crackle", 0.26, ["lightning-flash"], ["weather:lightning"]),
  lightWind: layer("soft-breeze", "weather", "wind.light", 0.32, ["leaf-motion"], ["weather:wind", "intensity:light"]),
  windGusts: layer("uneven-wind-gusts", "weather", "wind.gusts", 0.42, ["wind-streaks"], ["weather:wind", "intensity:gust"]),
  galeWind: layer("howling-gale", "weather", "wind.gale", 0.78, ["wind-streaks"], ["weather:wind", "intensity:heavy"]),
  canopyWind: layer("canopy-wind-sway", "nature", "wind.canopy", 0.38, ["leaf-motion", "canopy"], ["location:forest", "weather:wind"]),
  branchWind: layer("branch-creak", "nature", "nature.branches", 0.34, ["swaying-branches"], ["location:forest"]),
  forestLeaves: layer("leaf-canopy-bed", "nature", "nature.forest-leaves", 0.62, ["canopy"], ["location:forest"]),
  forestFloor: layer("soft-ground-rustle", "foley", "foley.brush", 0.26, ["forest-floor"], ["location:forest"]),
  forestBirds: layer("distant-forest-birds", "nature", "nature.birds", 0.18, ["canopy-life"], ["location:forest"]),
  springBirds: layer("near-spring-birds", "nature", "nature.spring-birds", 0.24, ["canopy-life", "fresh-growth"], ["season:spring"]),
  pondLap: layer("small-water-lap", "water", "water.pond-lap", 0.58, ["water-ripples"], ["location:pond"]),
  reeds: layer("reed-brush", "nature", "nature.reeds", 0.36, ["reeds"], ["location:pond"]),
  bubbles: layer("soft-bubbles", "water", "water.bubbles", 0.22, ["water-bubbles"], ["location:pond"]),
  frogs: layer("pond-frog-calls", "nature", "nature.frogs", 0.24, ["pond-life"], ["location:pond"]),
  waterfallRoar: layer("waterfall-roar", "water", "waterfall.roar", 0.86, ["waterfall-spray"], ["location:waterfall"]),
  sprayMist: layer("spray-mist", "weather", "mist.spray", 0.44, ["mist"], ["weather:mist", "location:waterfall"]),
  wetRockEcho: layer("wet-rock-echo", "foley", "foley.cavern-echo", 0.28, ["wet-rock"], ["location:gorge"]),
  fireCrackle: layer("fire-crackle", "fire", "fire.crackle", 0.68, ["ember-glow"], ["location:campfire"]),
  emberPops: layer("ember-pops", "fire", "fire.pops", 0.36, ["ember-sparks"], ["location:campfire"]),
  nightAir: layer("soft-night-air", "nature", "weather.night-air", 0.22, ["cool-air"], ["mood:calm"]),
  sunAir: layer("sunlit-dry-air", "weather", "weather.clear-day", 0.18, ["sunlit-air"], ["weather:clear"]),
  crickets: layer("cricket-bed", "nature", "insects.crickets", 0.58, ["dusk-specks"], ["sound:insects"]),
  cicadas: layer("cicada-thread", "nature", "insects.cicadas", 0.40, ["summer-heat"], ["sound:insects"]),
  autumnLeaves: layer("dry-autumn-leaf-skim", "foley", "foley.dry-leaves", 0.28, ["dry-leaves"], ["season:autumn"]),
  frostAir: layer("thin-frost-air", "weather", "weather.frost-air", 0.22, ["cold-air"], ["season:winter", "weather:cold"]),
  snowHush: layer("soft-snow-hush", "weather", "weather.snow-hush", 0.30, ["low-visibility", "cold-air"], ["season:winter", "weather:snow"]),
  duskBreeze: layer("dusk-breeze", "weather", "wind.light", 0.18, ["dusk-air"], ["weather:wind", "intensity:light"]),
  townSteps: layer("town-footsteps", "urban", "urban.footsteps", 0.30, ["street-motion"], ["location:town"]),
  workshopTap: layer("distant-workshop-taps", "urban", "urban.workshop-taps", 0.22, ["street-work"], ["location:town"]),
  crowdMurmur: layer("crowd-murmur", "crowd", "crowd.market-murmur", 0.64, ["crowd-flow"], ["location:market"]),
  crowdBabble: layer("indistinct-crowd-babble", "crowd", "crowd.babble", 0.48, ["crowd-flow"], ["sound:crowd"]),
  lowCrowd: layer("low-crowd-bed", "crowd", "crowd.low-murmur", 0.42, ["crowd-flow"], ["sound:crowd"]),
  marketVendors: layer("market-vendor-calls", "voice", "voice.market-calls", 0.34, ["crowd-flow", "street-motion"], ["location:market", "sound:voice"]),
  cartWheels: layer("cart-wheels", "urban", "urban.cart-wheels", 0.34, ["street-motion"], ["location:market"]),
  distantBells: layer("distant-bells", "urban", "urban.bells", 0.24, ["city-bells"], ["location:city"]),
  tavernMurmur: layer("tavern-room-murmur", "crowd", "crowd.tavern-murmur", 0.58, ["warm-room"], ["location:tavern"]),
  tavernPatrons: layer("tavern-patron-babble", "voice", "voice.tavern-babble", 0.32, ["warm-room"], ["location:tavern", "sound:voice"]),
  cupClatter: layer("cup-and-plate-clatter", "foley", "foley.cups-plates", 0.48, ["cup-clatter"], ["location:tavern", "foley:cups"]),
  glassToast: layer("glass-toast-clinks", "foley", "foley.glass-toast", 0.46, ["cup-clatter", "toast-glints"], ["foley:cups", "mood:toasting"]),
  tavernLaughter: layer("room-laughter", "crowd", "crowd.laughter", 0.34, ["warm-room"], ["mood:cheer", "sound:crowd"]),
  hearthRoom: layer("hearth-room-tone", "fire", "fire.hearth", 0.22, ["warmth"], ["location:tavern"]),
  quietInteriorTone: layer("quiet-interior-tone", "urban", "urban.quiet-interior", 0.30, ["quiet-room"], ["location:interior"]),
  floorCreak: layer("soft-floorboard-creak", "foley", "foley.floor-creak", 0.20, ["quiet-room"], ["location:interior"]),
  clothRustle: layer("curtain-cloth-rustle", "foley", "foley.soft-cloth", 0.16, ["quiet-room"], ["location:interior"]),
  cheers: layer("table-cheers", "crowd", "crowd.cheers", 0.72, ["crowd-surge"], ["mood:cheer"]),
  applause: layer("hand-applause", "crowd", "crowd.applause", 0.42, ["applause"], ["mood:cheer"]),
  shouting: layer("angry-shouting", "voice", "voice.shouting", 0.68, ["argument"], ["mood:angry"]),
  heckles: layer("distant-heckles", "voice", "voice.heckles", 0.42, ["crowd-edge"], ["mood:angry"]),
  jeers: layer("jeering-crowd", "crowd", "crowd.jeers", 0.46, ["crowd-edge"], ["mood:angry", "sound:crowd"]),
  whispers: layer("low-whispers", "voice", "voice.whispers", 0.52, ["shadow-whispers"], ["mood:secretive"]),
  whisperTail: layer("distant-whisper-tail", "tension", "voice.whispers", 0.18, ["shadow-whispers"], ["mood:mystery"]),
  song: layer("room-song", "voice", "voice.song", 0.58, ["song-wave"], ["mood:singing"]),
  chant: layer("soft-chant", "voice", "voice.chant", 0.36, ["song-wave"], ["mood:singing"]),
  drone: layer("low-detective-drone", "music", "music.mystery-drone", 0.54, ["low-vignette"], ["mood:mystery"]),
  candleTone: layer("candle-room-tone", "fire", "fire.candle", 0.26, ["candle"], ["mood:mystery"]),
  nightBell: layer("distant-midnight-bell", "urban", "urban.bells", 0.12, ["night-bell"], ["mood:calm"]),
  roomTone: layer("soft-room-tone", "nature", "weather.night-air", 0.24, ["quiet-room"], ["mood:calm"]),
  archivePages: layer("archive-page-rustle", "foley", "foley.archive-pages", 0.34, ["page-dust"], ["location:archive"]),
  shelfCreak: layer("old-shelf-creak", "foley", "foley.shelf-creak", 0.24, ["shelf-shadow"], ["location:archive"]),
  archiveRoomTone: layer("dry-archive-room-tone", "urban", "urban.archive-room", 0.28, ["quiet-room"], ["location:archive"]),
  stoneReverb: layer("stone-reverb", "tension", "foley.stone-reverb", 0.30, ["wet-rock"], ["location:shrine"]),
  incenseAir: layer("incense-air", "nature", "weather.incense-air", 0.20, ["candle"], ["location:shrine", "mood:mystery"]),
  cisternEcho: layer("cistern-echo", "water", "water.cistern-echo", 0.32, ["water-ripples"], ["location:shrine", "sound:water"])
});

export const SOUNDSCAPE_PRESETS = Object.freeze([
  preset({
    id: "combat-tension",
    label: "Combat Tension",
    category: "combat",
    priority: 116,
    baseIntensity: 0.58,
    threatGain: 0.34,
    musicCue: "combat-low-drums",
    musicMood: "danger",
    tones: ["heroic", "dark"],
    beats: ["crisis", "retaliation"],
    moods: ["angry"],
    encounterStates: [...ACTIVE_ENCOUNTER_STATES],
    keywords: [
      "combat", "fight", "battle", "attack", "strike", "ambush", "enemy", "hostile", "duel",
      "skirmish", "blade", "blood", "initiative", "wound", "guard", "raider", "mage",
      "战斗", "攻击", "敌人", "伏击", "刀", "剑", "受伤", "守卫"
    ],
    layers: [LAYERS.combatDrums, LAYERS.bowedMetal, LAYERS.weaponClatter, LAYERS.shouting],
    visualHints: ["danger-pulse", "sparks"],
    assetHints: ["mood:danger", "state:combat"],
    transition: { style: "fast-crossfade", durationMs: 900, curve: "urgent" }
  }),
  preset({
    id: "light-rain",
    label: "Light Rain and Wet Stone",
    category: "weather",
    priority: 88,
    baseIntensity: 0.30,
    threatGain: 0.16,
    musicCue: "rain-soaked-mystery",
    musicMood: "mystery",
    tones: ["mystery", "noir", "calm"],
    beats: ["hook", "discovery", "trail"],
    weather: ["light-rain", "wet"],
    incompatibleWeather: ["clear"],
    keywords: ["rain", "drizzle", "mist", "wet", "slick", "puddle", "雨", "细雨", "小雨", "潮湿", "雾", "水洼"],
    layers: [LAYERS.drizzleTicks, LAYERS.lightRain, LAYERS.roofDrips, LAYERS.lightWind],
    visualHints: ["light-rain", "fine-droplets", "wet-stone"],
    assetHints: ["weather:rain", "intensity:drizzle", "intensity:light"],
    transition: { style: "slow-crossfade", durationMs: 2400, curve: "soft" }
  }),
  preset({
    id: "heavy-rain",
    label: "Heavy Rain Curtain",
    category: "weather",
    priority: 94,
    baseIntensity: 0.50,
    threatGain: 0.22,
    musicCue: "rain-soaked-mystery",
    musicMood: "suspense",
    tones: ["mystery", "dark", "noir"],
    beats: ["complication", "trail", "crisis"],
    weather: ["heavy-rain", "wet"],
    incompatibleWeather: ["clear"],
    keywords: ["downpour", "heavy rain", "rainstorm", "monsoon", "storm", "暴雨", "大雨", "倾盆雨", "风暴"],
    layers: [LAYERS.downpourSheet, LAYERS.heavyRain, LAYERS.rainSplashes, LAYERS.galeWind],
    visualHints: ["heavy-rain", "low-visibility", "wet-stone"],
    assetHints: ["weather:rain", "intensity:downpour", "intensity:heavy"],
    transition: { style: "weather-swell", durationMs: 1800, curve: "swell" }
  }),
  preset({
    id: "thunderstorm",
    label: "Thunder Overhead",
    category: "weather",
    priority: 96,
    baseIntensity: 0.56,
    threatGain: 0.25,
    musicCue: "storm-front",
    musicMood: "suspense",
    tones: ["dark", "mystery"],
    beats: ["complication", "crisis"],
    weather: ["thunder", "heavy-rain", "gale-wind"],
    incompatibleWeather: ["clear"],
    keywords: ["thunder", "lightning", "storm", "thunderclap", "雷", "雷鸣", "闪电", "风暴"],
    layers: [LAYERS.downpourSheet, LAYERS.heavyRain, LAYERS.closeThunder, LAYERS.thunderRumble, LAYERS.lightningCrackle, LAYERS.galeWind],
    visualHints: ["lightning-flash", "heavy-rain", "wind-streaks"],
    assetHints: ["weather:thunder", "weather:storm"],
    transition: { style: "weather-swell", durationMs: 1400, curve: "swell" }
  }),
  preset({
    id: "clear-day",
    label: "Clear Sunny Day",
    category: "weather",
    priority: 64,
    baseIntensity: 0.16,
    threatGain: 0.05,
    musicCue: "quiet-daylight",
    musicMood: "calm",
    tones: ["calm", "heroic"],
    beats: ["hook", "discovery", "trail"],
    weather: ["clear"],
    keywords: ["clear", "clear sky", "sunny", "sunlit", "bright day", "blue sky", "dry air", "晴朗", "晴天", "阳光", "蓝天", "干燥"],
    layers: [LAYERS.sunAir, LAYERS.lightWind],
    visualHints: ["sunlit-air", "leaf-motion"],
    assetHints: ["weather:clear", "time:day"],
    transition: { style: "slow-crossfade", durationMs: 2600, curve: "soft" }
  }),
  preset({
    id: "light-wind",
    label: "Light Wind",
    category: "weather",
    priority: 62,
    baseIntensity: 0.18,
    threatGain: 0.08,
    musicCue: "quiet-night-pads",
    musicMood: "calm",
    tones: ["calm", "restful"],
    beats: ["hook", "discovery", "trail"],
    weather: ["light-wind"],
    keywords: ["breeze", "light wind", "soft wind", "微风", "轻风", "和风"],
    layers: [LAYERS.lightWind, LAYERS.nightAir],
    visualHints: ["leaf-motion"],
    assetHints: ["weather:wind", "intensity:light"],
    transition: { style: "slow-crossfade", durationMs: 2600, curve: "soft" }
  }),
  preset({
    id: "gale-wind",
    label: "Howling Wind",
    category: "weather",
    priority: 84,
    baseIntensity: 0.46,
    threatGain: 0.22,
    musicCue: "storm-front",
    musicMood: "motion",
    tones: ["dark", "heroic", "mystery"],
    beats: ["trail", "complication", "crisis"],
    weather: ["gale-wind"],
    keywords: ["gale", "howling wind", "squall", "strong wind", "狂风", "疾风", "强风", "呼啸"],
    layers: [LAYERS.galeWind, LAYERS.windGusts, LAYERS.branchWind],
    visualHints: ["wind-streaks"],
    assetHints: ["weather:wind", "intensity:heavy"],
    transition: { style: "weather-swell", durationMs: 1600, curve: "swell" }
  }),
  preset({
    id: "forest",
    label: "Deep Forest",
    category: "nature",
    priority: 76,
    baseIntensity: 0.28,
    threatGain: 0.18,
    musicCue: "greenwood-breath",
    musicMood: "wonder",
    tones: ["calm", "heroic"],
    beats: ["discovery", "trail"],
    locations: ["forest"],
    keywords: [...LOCATION_TAG_TERMS.forest, "leaves", "moss", "树", "苔藓"],
    layers: [LAYERS.forestLeaves, LAYERS.canopyWind, LAYERS.branchWind, LAYERS.forestFloor, LAYERS.forestBirds],
    visualHints: ["canopy", "leaf-motion"],
    assetHints: ["location:forest"],
    transition: { style: "slow-crossfade", durationMs: 2200, curve: "soft" }
  }),
  preset({
    id: "pond",
    label: "Still Pond",
    category: "water",
    priority: 74,
    baseIntensity: 0.24,
    threatGain: 0.14,
    musicCue: "still-water-glass",
    musicMood: "calm",
    tones: ["calm", "mystery"],
    beats: ["discovery", "trail"],
    locations: ["pond"],
    keywords: [...LOCATION_TAG_TERMS.pond, "frog", "lotus", "莲", "蛙"],
    layers: [LAYERS.pondLap, LAYERS.reeds, LAYERS.bubbles, LAYERS.frogs],
    visualHints: ["water-ripples", "reeds"],
    assetHints: ["location:pond", "sound:water"],
    transition: { style: "slow-crossfade", durationMs: 2600, curve: "soft" }
  }),
  preset({
    id: "waterfall",
    label: "Waterfall Gorge",
    category: "water",
    priority: 82,
    baseIntensity: 0.52,
    threatGain: 0.16,
    musicCue: "rushing-water-march",
    musicMood: "motion",
    tones: ["heroic", "calm"],
    beats: ["trail", "discovery"],
    locations: ["waterfall"],
    keywords: [...LOCATION_TAG_TERMS.waterfall, "rushing water", "奔流"],
    layers: [LAYERS.waterfallRoar, LAYERS.sprayMist, LAYERS.wetRockEcho],
    visualHints: ["waterfall-spray", "mist"],
    assetHints: ["location:waterfall", "sound:water"],
    transition: { style: "medium-crossfade", durationMs: 1700, curve: "natural" }
  }),
  preset({
    id: "campfire",
    label: "Campfire Watch",
    category: "fire",
    priority: 70,
    baseIntensity: 0.30,
    threatGain: 0.16,
    musicCue: "ember-watch",
    musicMood: "warm",
    tones: ["calm", "heroic"],
    beats: ["hook", "discovery"],
    locations: ["campfire"],
    keywords: [...LOCATION_TAG_TERMS.campfire, "fire", "candle", "smoke", "火焰", "烛", "烟"],
    layers: [LAYERS.fireCrackle, LAYERS.emberPops, LAYERS.nightAir],
    visualHints: ["ember-glow", "ember-sparks"],
    assetHints: ["location:campfire", "sound:fire"],
    transition: { style: "slow-crossfade", durationMs: 2100, curve: "soft" }
  }),
  preset({
    id: "insects",
    label: "Insects at Dusk",
    category: "nature",
    priority: 68,
    baseIntensity: 0.22,
    threatGain: 0.10,
    musicCue: "dusk-field-hum",
    musicMood: "quiet",
    tones: ["calm"],
    beats: ["discovery", "trail"],
    locations: ["field"],
    keywords: ["insect", "insects", "cricket", "crickets", "cicada", "cicadas", "mosquito", "buzz", ...LOCATION_TAG_TERMS.field, "虫", "昆虫", "蟋蟀", "蝉", "蚊", "嗡嗡"],
    layers: [LAYERS.crickets, LAYERS.cicadas, LAYERS.duskBreeze],
    visualHints: ["dusk-specks", "summer-heat"],
    assetHints: ["sound:insects", "location:field"],
    transition: { style: "slow-crossfade", durationMs: 2600, curve: "soft" }
  }),
  preset({
    id: "town-square",
    label: "Town Square",
    category: "urban",
    priority: 77,
    baseIntensity: 0.30,
    threatGain: 0.12,
    musicCue: "town-day-walk",
    musicMood: "busy",
    tones: ["calm", "heroic", "mystery"],
    beats: ["hook", "discovery", "trail"],
    locations: ["town"],
    keywords: [...LOCATION_TAG_TERMS.town, "clocktower", "well", "workshop", "neighbor", "townsfolk", "钟楼", "水井", "作坊", "居民", "镇民"],
    layers: [LAYERS.townSteps, LAYERS.workshopTap, LAYERS.distantBells, LAYERS.lowCrowd],
    visualHints: ["street-motion", "city-bells"],
    assetHints: ["location:town", "location:village"],
    transition: { style: "medium-crossfade", durationMs: 1800, curve: "natural" }
  }),
  preset({
    id: "market-city",
    label: "Market and City Streets",
    category: "urban",
    priority: 78,
    baseIntensity: 0.38,
    threatGain: 0.18,
    musicCue: "urban-investigation",
    musicMood: "busy",
    tones: ["mystery", "heroic"],
    beats: ["hook", "discovery", "trail"],
    locations: ["market"],
    keywords: [...LOCATION_TAG_TERMS.market, "crowd", "vendor", "cart", "station", "人群", "商贩"],
    layers: [LAYERS.crowdMurmur, LAYERS.crowdBabble, LAYERS.marketVendors, LAYERS.cartWheels, LAYERS.distantBells],
    visualHints: ["crowd-flow", "street-motion"],
    assetHints: ["location:market", "location:city"],
    transition: { style: "medium-crossfade", durationMs: 1800, curve: "natural" }
  }),
  preset({
    id: "tavern",
    label: "Tavern Cup Clatter",
    category: "urban",
    priority: 80,
    baseIntensity: 0.34,
    threatGain: 0.12,
    musicCue: "warm-common-room",
    musicMood: "warm",
    tones: ["calm", "heroic", "mystery"],
    beats: ["hook", "discovery"],
    locations: ["tavern"],
    keywords: [...LOCATION_TAG_TERMS.tavern, "cup", "plate", "mug", "barmaid", "bottle", "杯", "盘", "酒杯", "瓶"],
    layers: [LAYERS.tavernMurmur, LAYERS.tavernPatrons, LAYERS.cupClatter, LAYERS.glassToast, LAYERS.hearthRoom],
    visualHints: ["warm-room", "cup-clatter"],
    assetHints: ["location:tavern", "foley:cups"],
    transition: { style: "medium-crossfade", durationMs: 1900, curve: "natural" }
  }),
  preset({
    id: "quiet-interior",
    label: "Quiet Interior",
    category: "interior",
    priority: 75,
    baseIntensity: 0.22,
    threatGain: 0.10,
    musicCue: "quiet-room-focus",
    musicMood: "quiet",
    tones: ["calm", "mystery", "noir"],
    beats: ["hook", "discovery", "trail"],
    locations: ["interior"],
    moods: ["calm", "mystery", "secretive"],
    keywords: [...LOCATION_TAG_TERMS.interior, "desk", "curtain", "candle", "floorboard", "桌", "窗帘", "蜡烛", "地板"],
    layers: [LAYERS.quietInteriorTone, LAYERS.floorCreak, LAYERS.clothRustle, LAYERS.roomTone],
    visualHints: ["quiet-room", "candle"],
    assetHints: ["location:interior"],
    transition: { style: "slow-crossfade", durationMs: 2400, curve: "soft" }
  }),
  preset({
    id: "archive-room",
    label: "Archive Room",
    category: "urban",
    priority: 79,
    baseIntensity: 0.26,
    threatGain: 0.16,
    musicCue: "low-clue-drone",
    musicMood: "mystery",
    tones: ["mystery", "calm", "noir"],
    beats: ["hook", "discovery", "trail", "revelation"],
    locations: ["archive"],
    moods: ["mystery", "secretive"],
    keywords: [...LOCATION_TAG_TERMS.archive, "dust", "parchment", "shelf", "page", "catalog", "灰尘", "羊皮纸", "书架", "纸页", "目录"],
    layers: [LAYERS.archiveRoomTone, LAYERS.archivePages, LAYERS.shelfCreak, LAYERS.candleTone],
    visualHints: ["quiet-room", "page-dust", "candle"],
    assetHints: ["location:archive", "mood:mystery"],
    transition: { style: "slow-crossfade", durationMs: 2300, curve: "soft" }
  }),
  preset({
    id: "shrine-cistern",
    label: "Shrine Cistern",
    category: "water",
    priority: 81,
    baseIntensity: 0.30,
    threatGain: 0.18,
    musicCue: "still-water-glass",
    musicMood: "suspense",
    tones: ["mystery", "calm", "dark"],
    beats: ["discovery", "trail", "revelation"],
    locations: ["shrine"],
    moods: ["mystery", "secretive", "singing"],
    keywords: [...LOCATION_TAG_TERMS.shrine, "votive", "incense", "altar", "stone basin", "candle", "供奉", "香", "祭坛", "石盆", "烛"],
    layers: [LAYERS.cisternEcho, LAYERS.stoneReverb, LAYERS.incenseAir, LAYERS.candleTone],
    visualHints: ["water-ripples", "wet-rock", "candle"],
    assetHints: ["location:shrine", "sound:water", "mood:mystery"],
    transition: { style: "slow-crossfade", durationMs: 2400, curve: "soft" }
  }),
  preset({
    id: "crowd-murmur",
    label: "Layered Crowd Murmur",
    category: "crowd",
    priority: 72,
    baseIntensity: 0.32,
    threatGain: 0.12,
    musicCue: "urban-investigation",
    musicMood: "busy",
    tones: ["heroic", "mystery", "calm"],
    beats: ["hook", "discovery", "trail"],
    moods: ["crowded"],
    keywords: [...MOOD_TAG_TERMS.crowded, "market", "tavern", "hall", "plaza", "crowd noise", "人群", "大厅", "广场"],
    layers: [LAYERS.lowCrowd, LAYERS.crowdBabble, LAYERS.crowdMurmur, LAYERS.tavernMurmur],
    visualHints: ["crowd-flow", "warm-room"],
    assetHints: ["sound:crowd", "mood:crowded"],
    transition: { style: "medium-crossfade", durationMs: 1700, curve: "natural" }
  }),
  preset({
    id: "toasting-cheers",
    label: "Toasts and Glass Clinks",
    category: "crowd",
    priority: 83,
    baseIntensity: 0.40,
    threatGain: 0.08,
    musicCue: "festival-cheer",
    musicMood: "warm",
    tones: ["heroic", "calm"],
    beats: ["hook", "discovery", "revelation"],
    moods: ["toasting", "cheerful"],
    keywords: [...MOOD_TAG_TERMS.toasting, "toast", "cheers", "celebration", "banquet", "碰杯", "干杯", "宴会"],
    layers: [LAYERS.glassToast, LAYERS.tavernLaughter, LAYERS.cheers, LAYERS.crowdBabble, LAYERS.lowCrowd],
    visualHints: ["cup-clatter", "toast-glints", "crowd-surge"],
    assetHints: ["mood:toasting", "mood:cheer", "sound:crowd", "foley:cups"],
    transition: { style: "medium-crossfade", durationMs: 1300, curve: "natural" }
  }),
  preset({
    id: "cheering-crowd",
    label: "Cheering Crowd",
    category: "crowd",
    priority: 86,
    baseIntensity: 0.42,
    threatGain: 0.08,
    musicCue: "festival-cheer",
    musicMood: "busy",
    tones: ["heroic", "calm"],
    beats: ["revelation", "discovery"],
    moods: ["cheerful"],
    keywords: [...MOOD_TAG_TERMS.cheerful],
    layers: [LAYERS.cheers, LAYERS.applause, LAYERS.tavernLaughter, LAYERS.crowdBabble, LAYERS.crowdMurmur],
    visualHints: ["crowd-surge", "applause"],
    assetHints: ["mood:cheer", "sound:crowd"],
    transition: { style: "medium-crossfade", durationMs: 1400, curve: "natural" }
  }),
  preset({
    id: "angry-shouts",
    label: "Angry Shouts",
    category: "crowd",
    priority: 87,
    baseIntensity: 0.46,
    threatGain: 0.20,
    musicCue: "urban-investigation",
    musicMood: "danger",
    tones: ["dark", "mystery"],
    beats: ["complication", "crisis"],
    moods: ["angry"],
    keywords: [...MOOD_TAG_TERMS.angry],
    layers: [LAYERS.shouting, LAYERS.heckles, LAYERS.jeers, LAYERS.crowdMurmur],
    visualHints: ["argument", "crowd-edge"],
    assetHints: ["mood:angry", "sound:crowd"],
    transition: { style: "fast-crossfade", durationMs: 950, curve: "urgent" }
  }),
  preset({
    id: "whispers",
    label: "Low Whispers",
    category: "voice",
    priority: 78,
    baseIntensity: 0.28,
    threatGain: 0.18,
    musicCue: "low-clue-drone",
    musicMood: "suspense",
    tones: ["mystery", "dark"],
    beats: ["hook", "discovery", "revelation"],
    moods: ["secretive", "mystery"],
    keywords: [...MOOD_TAG_TERMS.secretive, "shadow", "fog", "阴影", "雾"],
    layers: [LAYERS.whispers, LAYERS.drone, LAYERS.candleTone],
    visualHints: ["shadow-whispers", "low-vignette"],
    assetHints: ["mood:secretive", "sound:voice"],
    transition: { style: "slow-crossfade", durationMs: 2300, curve: "soft" }
  }),
  preset({
    id: "singing",
    label: "Distant Song",
    category: "voice",
    priority: 76,
    baseIntensity: 0.30,
    threatGain: 0.08,
    musicCue: "distant-song",
    musicMood: "warm",
    tones: ["calm", "heroic"],
    beats: ["hook", "discovery"],
    moods: ["singing"],
    keywords: [...MOOD_TAG_TERMS.singing],
    layers: [LAYERS.song, LAYERS.chant, LAYERS.tavernMurmur, LAYERS.nightAir],
    visualHints: ["song-wave"],
    assetHints: ["mood:singing", "sound:voice"],
    transition: { style: "slow-crossfade", durationMs: 2400, curve: "soft" }
  }),
  preset({
    id: "mystery",
    label: "Mystery Undercurrent",
    category: "mystery",
    priority: 60,
    baseIntensity: 0.32,
    threatGain: 0.24,
    musicCue: "low-clue-drone",
    musicMood: "suspense",
    tones: ["mystery", "noir", "dark", "horror"],
    beats: ["hook", "discovery", "trail", "complication", "revelation"],
    moods: ["mystery", "secretive"],
    keywords: ["mystery", "secret", "clue", "archive", "temple", "shrine", "courthouse", "ledger", "sealed", "fog", "shadow", "whisper", "old stone", "ritual", "curse", "unknown", "秘密", "线索", "档案", "神殿", "寺", "账本", "封印", "雾", "阴影", "耳语", "仪式", "诅咒", "未知"],
    layers: [LAYERS.drone, LAYERS.candleTone, LAYERS.whisperTail],
    visualHints: ["low-vignette", "candle"],
    assetHints: ["mood:mystery"],
    transition: { style: "slow-crossfade", durationMs: 2200, curve: "soft" }
  }),
  preset({
    id: "calm-night",
    label: "Calm Night",
    category: "night",
    priority: 58,
    baseIntensity: 0.18,
    threatGain: 0.08,
    musicCue: "quiet-night-pads",
    musicMood: "calm",
    tones: ["calm", "restful"],
    beats: ["hook", "discovery"],
    moods: ["calm"],
    keywords: ["night", "dawn", "moon", "stars", "quiet", "rest", "sleep", "calm", "watch", "夜", "黎明", "月", "星", "安静", "休息", "睡", "平静", "守夜"],
    layers: [LAYERS.nightAir, LAYERS.roomTone, LAYERS.nightBell],
    visualHints: ["cool-air", "night-bell"],
    assetHints: ["mood:calm", "time:night"],
    transition: { style: "slow-crossfade", durationMs: 2800, curve: "soft" }
  })
]);

export function chooseSoundscape(room = {}, options = {}) {
  const context = buildSoundscapeContext(room, options);
  const ranked = rankSoundscapes(context);
  const winner = ranked.find((entry) => entry.score > 0);
  const preset = winner?.preset ?? SOUNDSCAPE_PRESETS.find((entry) => entry.id === "mystery");
  const intensity = chooseIntensity(preset, context, winner?.score ?? 0);
  const layers = buildLayers(preset, context, intensity);
  const transition = buildTransition(preset, context, intensity, options.previousSoundscapeId);
  const hints = buildHints(preset, context, layers);
  const sceneVisualState = buildSceneVisualState(preset, context, layers, transition, hints);

  return {
    id: preset.id,
    label: preset.label,
    category: preset.category,
    intensity,
    layers,
    profile: {
      weather: [...context.profileWeatherTags],
      weatherMix: { ...context.weatherMix },
      season: [...context.seasonTags],
      location: [...context.locationTags],
      mood: [...context.profileMoodTags],
      guards: winner?.guardReasons || []
    },
    transition,
    crossfadeMs: transition.durationMs,
    visualHints: hints.visualHints,
    assetHints: hints.assetHints,
    sceneVisualState,
    musicCue: {
      id: preset.musicCue,
      mood: preset.musicMood,
      energy: clamp01(round2(intensity + (preset.id === "combat-tension" ? 0.08 : 0))),
      transition: transition.style,
      crossfadeMs: transition.durationMs
    },
    reason: buildReason(winner, context, preset),
    updatedAt: context.updatedAt
  };
}

export function scoreSoundscapeCandidates(room = {}, options = {}) {
  return rankSoundscapes(buildSoundscapeContext(room, options)).map(({ preset, score, matches, blockedBy, guardReasons }) => ({
    id: preset.id,
    label: preset.label,
    category: preset.category,
    score,
    matches,
    blockedBy,
    guardReasons
  }));
}

export function listSoundscapePresets() {
  return SOUNDSCAPE_PRESETS.map((entry) => ({
    id: entry.id,
    label: entry.label,
    category: entry.category,
    musicCue: entry.musicCue,
    musicMood: entry.musicMood,
    transition: { ...entry.transition },
    visualHints: [...entry.visualHints],
    assetHints: [...entry.assetHints],
    layers: entry.layers.map((layerEntry) => ({ ...layerEntry }))
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

  const sceneAssetEvidence = collectSceneAssetEvidence([
    room?.presentation?.sceneAsset,
    room?.presentation?.relevantScenes,
    room?.sceneAsset,
    scene.sceneAsset,
    scene.asset,
    scene.currentAsset
  ]);
  const sceneTags = normalizeTagList([
    scene.tags,
    scene.sceneTags,
    scene.soundscapeTags,
    scene.soundscapeHints,
    scene.assetHints,
    scene.atmosphere?.tags,
    scene.atmosphere?.soundscapeTags,
    sceneAssetEvidence.tags
  ]);
  const sceneTagText = normalizeText(sceneTags.join(" "));
  const sceneAssetText = normalizeText(sceneAssetEvidence.text.join(" "));
  const directWeatherTags = directKnownTags(sceneTags, WEATHER_TAG_IDS);
  const directLocationTags = directKnownTags(sceneTags, LOCATION_TAG_IDS);
  const directMoodTags = directKnownTags(sceneTags, MOOD_TAG_IDS);
  const directSeasonTags = directKnownTags(sceneTags, SEASON_TAG_IDS);
  const sceneTagMoodTags = extractTags(sceneTagText, MOOD_TAG_TERMS);
  const explicitWeatherText = normalizeText([
    room?.weather,
    room?.mood?.weather,
    scene.weather,
    scene.weatherState,
    scene.atmosphere?.weather,
    sceneAssetEvidence.weatherText
  ].filter(Boolean).join(" "));
  const explicitSeasonText = normalizeText([
    room?.season,
    scene.season,
    scene.atmosphere?.season,
    sceneAssetEvidence.seasonText
  ].filter(Boolean).join(" "));
  const explicitMoodText = normalizeText([
    room?.mood,
    scene.mood,
    scene.atmosphere?.mood,
    director.mood,
    sceneAssetEvidence.moodText
  ].filter(Boolean).join(" "));
  const sceneAssetWeatherTags = extractTags(sceneAssetText, WEATHER_TAG_TERMS);
  const sceneAssetLocationTags = extractTags(sceneAssetText, LOCATION_TAG_TERMS);
  const sceneAssetMoodTags = extractTags(sceneAssetText, MOOD_TAG_TERMS);
  const sceneAssetSeasonTags = extractTags(sceneAssetText, SEASON_TAG_TERMS);
  const explicitWeatherTags = new Set(extractTags(explicitWeatherText, WEATHER_TAG_TERMS));
  const explicitSeasonTags = new Set([
    ...extractTags(explicitSeasonText, SEASON_TAG_TERMS),
    ...sceneAssetSeasonTags,
    ...directSeasonTags
  ]);
  const explicitMoodTags = new Set([
    ...extractTags(explicitMoodText, MOOD_TAG_TERMS),
    ...sceneTagMoodTags,
    ...sceneAssetMoodTags,
    ...directMoodTags
  ]);
  const locationText = normalizeText([scene.location, sceneAssetEvidence.locationText].filter(Boolean).join(" "));
  const sceneText = normalizeText([
    scene.title,
    scene.location,
    sceneTagText,
    scene.tone,
    room?.tone,
    scene.ambience,
    scene.objective,
    sceneAssetText,
    explicitWeatherText,
    explicitSeasonText,
    explicitMoodText
  ].filter(Boolean).join(" "));
  const recentText = normalizeText(recentTranscript.map(formatTranscriptEntry).join(" "));
  const allText = normalizeText([sceneText, recentText].join(" "));
  const sceneWeatherTags = new Set([
    ...extractTags(sceneText, WEATHER_TAG_TERMS),
    ...sceneAssetWeatherTags,
    ...directWeatherTags
  ]);
  const explicitClearWeather = explicitWeatherTags.has("clear") && !hasWetWeather(explicitWeatherTags);
  const currentWeatherTags = explicitClearWeather
    ? new Set([...explicitWeatherTags, ...[...sceneWeatherTags].filter(isWindWeatherTag)])
    : new Set([...explicitWeatherTags, ...sceneWeatherTags]);
  const weatherTags = new Set([
    ...currentWeatherTags,
    ...extractTags(recentText, WEATHER_TAG_TERMS)
  ]);
  const sceneLocationTags = new Set([
    ...extractTags(locationText, LOCATION_TAG_TERMS),
    ...extractTags(sceneTagText, LOCATION_TAG_TERMS),
    ...sceneAssetLocationTags,
    ...directLocationTags
  ]);
  const locationTags = new Set([
    ...extractTags([locationText, sceneText].join(" "), LOCATION_TAG_TERMS),
    ...directLocationTags
  ]);
  const currentMoodTags = new Set([
    ...extractTags(explicitMoodText || sceneText, MOOD_TAG_TERMS),
    ...sceneTagMoodTags,
    ...sceneAssetMoodTags,
    ...directMoodTags
  ]);
  const moodTags = new Set([
    ...currentMoodTags,
    ...extractTags(allText, MOOD_TAG_TERMS),
    ...directMoodTags
  ]);
  const seasonTags = new Set([
    ...explicitSeasonTags,
    ...extractTags(sceneText, SEASON_TAG_TERMS),
    ...directSeasonTags
  ]);
  const clearWeather = currentWeatherTags.has("clear") && !hasWetWeather(currentWeatherTags);
  const explicitLocationLocked = sceneLocationTags.size > 0;
  const profileWeatherTags = clearWeather || explicitLocationLocked ? currentWeatherTags : weatherTags;
  const profileMoodTags = explicitLocationLocked && currentMoodTags.size > 0 ? currentMoodTags : moodTags;
  const weatherMix = buildWeatherMix(profileWeatherTags, { threat });

  return {
    locationText,
    sceneLocationTags,
    sceneText,
    recentText,
    allText,
    tone: normalizeText(scene.tone || room?.tone),
    beat: normalizeText(director.beat),
    encounterState,
    threat,
    encounterActive: ACTIVE_ENCOUNTER_STATES.has(encounterState) && hasLivingEnemies,
    weatherTags,
    currentWeatherTags,
    profileWeatherTags,
    weatherMix,
    seasonTags,
    locationTags,
    moodTags,
    currentMoodTags,
    profileMoodTags,
    explicitMoodTags,
    explicitWeatherTags,
    explicitWeatherText,
    explicitMoodText,
    explicitLocationLocked,
    clearWeather,
    updatedAt: String(updatedAt || room?.updatedAt || lastTranscript?.createdAt || FALLBACK_UPDATED_AT)
  };
}

function rankSoundscapes(context) {
  return SOUNDSCAPE_PRESETS
    .map((entry) => scorePreset(entry, context))
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.preset.priority !== left.preset.priority) return right.preset.priority - left.preset.priority;
      return left.preset.id.localeCompare(right.preset.id);
    });
}

function scorePreset(entry, context) {
  const locationMatches = matchTerms(context.locationText, entry.keywords);
  const sceneMatches = matchTerms(context.sceneText, entry.keywords);
  const recentMatches = matchTerms(context.recentText, entry.keywords);
  const weatherMatches = entry.weather.filter((tag) => context.weatherTags.has(tag));
  const currentWeatherMatches = entry.weather.filter((tag) => context.currentWeatherTags.has(tag));
  const locationTagMatches = entry.locations.filter((tag) => context.locationTags.has(tag));
  const moodMatches = entry.moods.filter((tag) => context.moodTags.has(tag));
  const currentMoodMatches = entry.moods.filter((tag) => context.currentMoodTags.has(tag));
  const toneMatches = entry.tones.includes(context.tone) ? [context.tone] : [];
  const beatMatches = entry.beats.includes(context.beat) ? [context.beat] : [];
  const encounterMatches = entry.encounterStates.includes(context.encounterState) ? [context.encounterState] : [];

  let score = 0;
  score += locationTagMatches.length * 4.2;
  score += weatherMatches.length * 4.0;
  score += moodMatches.length * 3.7;
  score += locationMatches.length * 3.0;
  score += sceneMatches.length * 1.5;
  score += recentMatches.length * 1.05;
  score += toneMatches.length * 1.0;
  score += beatMatches.length * 1.1;
  score += encounterMatches.length * 4.2;
  if (entry.category !== "weather" && locationTagMatches.length > 0) {
    score += 0.35;
  }
  if (entry.category === "weather" && weatherMatches.length > 0) {
    score += 4;
  }
  if (entry.category === "weather" && context.explicitLocationLocked) {
    score -= 8.5;
  }
  if (entry.category !== "weather" && locationTagMatches.length > 0) {
    score += 4;
  }
  if (context.explicitLocationLocked && locationTagMatches.length > 0) {
    score += 7;
  }
  if (
    context.explicitLocationLocked
    && context.sceneLocationTags?.size > 0
    && entry.category === "crowd"
    && locationTagMatches.length === 0
  ) {
    score -= 2.5;
  }

  const blockedBy = [];
  const guardReasons = [];
  for (const tag of entry.incompatibleWeather) {
    if (context.weatherTags.has(tag) && !hasExplicitPresetWeather(entry, context)) {
      score -= 20;
      blockedBy.push(tag);
    }
  }

  if (entry.id === "combat-tension") {
    if (context.encounterActive) score += 4.2;
    if (context.threat >= 0.62) score += 2.8 + context.threat * 2.0;
    if (context.beat === "crisis" || context.beat === "retaliation") score += 3.0;
  }

  if (entry.category === "weather" && context.clearWeather && !hasExplicitPresetWeather(entry, context)) {
    score -= 8;
    blockedBy.push("clear-weather-without-weather-evidence");
  }

  const mismatchGuard = sceneMismatchGuard(entry, context, {
    locationTagMatches,
    sceneMatches,
    weatherMatches,
    currentWeatherMatches,
    moodMatches,
    currentMoodMatches,
    encounterMatches
  });
  if (mismatchGuard) {
    score -= mismatchGuard.penalty;
    blockedBy.push(mismatchGuard.code);
    guardReasons.push(mismatchGuard.reason);
  }

  if (entry.id === "light-rain" && context.weatherTags.has("heavy-rain")) score -= 4;
  if (entry.id === "light-rain" && context.weatherTags.has("wet") && !context.weatherTags.has("heavy-rain")) score += 4.2;
  if (entry.id === "heavy-rain" && context.weatherTags.has("light-rain") && !context.weatherTags.has("thunder")) score -= 2;
  if (entry.id === "heavy-rain" && context.weatherTags.has("heavy-rain")) score += 3.6;
  if (entry.id === "thunderstorm" && context.weatherTags.has("thunder")) score += 4.4;
  if (entry.id === "thunderstorm" && !context.weatherTags.has("thunder")) score -= 4;
  if (entry.id === "thunderstorm" && context.weatherTags.has("thunder")) score += 4;
  if (entry.id === "crowd-murmur" && context.moodTags.has("crowded")) score += 3.4;
  if (entry.id === "toasting-cheers" && context.moodTags.has("toasting")) score += 4.6;
  if (entry.id === "toasting-cheers" && (context.locationTags.has("tavern") || context.locationTags.has("market"))) score += 1.2;
  if (entry.id === "whispers" && context.moodTags.has("secretive")) score += 4.0;
  if (entry.id === "singing" && context.moodTags.has("singing")) score += 4.0;
  if (entry.id === "angry-shouts" && context.moodTags.has("angry")) score += 4.0;
  if (entry.id === "cheering-crowd" && context.moodTags.has("cheerful")) score += 3.0;
  if (entry.id === "calm-night" && (context.moodTags.has("secretive") || context.moodTags.has("singing") || context.moodTags.has("angry") || context.moodTags.has("cheerful") || context.moodTags.has("crowded") || context.moodTags.has("toasting"))) score -= 3.0;
  if (entry.id === "mystery") {
    if (context.tone === "mystery") score += 1.4;
    if (context.threat >= 0.35 && context.threat < 0.72) score += 0.8;
  }
  if (entry.id === "calm-night") {
    const hasCalmEvidence = moodMatches.length + sceneMatches.length + locationMatches.length + toneMatches.length + beatMatches.length > 0;
    if (context.threat <= 0.25 && hasCalmEvidence) score += 1.6;
    if (context.threat > 0.45) score -= 4;
  }

  return {
    preset: entry,
    score: round2(Math.max(0, score)),
    blockedBy,
    guardReasons,
    matches: {
      location: unique([...locationTagMatches, ...locationMatches]),
      scene: sceneMatches.filter((match) => !locationMatches.includes(match)),
      recent: recentMatches,
      weather: weatherMatches,
      currentWeather: currentWeatherMatches,
      mood: moodMatches,
      currentMood: currentMoodMatches,
      tone: toneMatches,
      beat: beatMatches,
      encounter: encounterMatches
    }
  };
}

function chooseIntensity(entry, context, score) {
  const scoreBoost = Math.min(0.14, score / 90);
  const beatBoost = context.beat === "crisis" || context.beat === "retaliation" ? 0.08 : 0;
  const weatherMix = context.weatherMix || {};
  const weatherBoost = entry.category === "weather"
    ? weatherMixIntensityBoost(weatherMix)
    : Math.min(0.06, weatherMixIntensityBoost(weatherMix) * 0.6);
  let intensity = entry.baseIntensity + context.threat * entry.threatGain + scoreBoost + beatBoost + weatherBoost;

  if (entry.id === "combat-tension" && context.encounterActive) {
    intensity = Math.max(intensity, 0.78);
  }
  if (entry.id === "calm-night") {
    intensity = Math.min(intensity, 0.44);
  }
  if (entry.id === "pond") {
    intensity = Math.min(intensity, 0.48);
  }
  if (entry.id === "light-rain") {
    intensity = Math.min(intensity, 0.58);
  }
  if (entry.id === "thunderstorm") {
    intensity = Math.max(intensity, 0.64);
  }

  return clamp01(round2(intensity));
}

function buildLayers(entry, context, intensity) {
  const layers = [...entry.layers];
  addContextualLayers(layers, entry, context);
  const scale = 0.56 + intensity * 0.64;

  return uniqueBy(layers, (layerEntry) => layerEntry.id).map((layerEntry) => ({
    id: layerEntry.id,
    type: layerEntry.type,
    profile: layerEntry.profile,
    gain: clamp01(round2(layerEntry.gain * scale)),
    ...(layerProbability(layerEntry, context) ? { probability: layerProbability(layerEntry, context) } : {}),
    visualHints: [...layerEntry.visualHints],
    assetHints: [...layerEntry.assetHints]
  }));
}

function addContextualLayers(layers, entry, context) {
  const weatherTags = context.profileWeatherTags || context.weatherTags;
  const moodTags = context.profileMoodTags || context.moodTags;
  const seasonTags = context.seasonTags || new Set();
  if (weatherTags.has("heavy-rain")) {
    layers.push(LAYERS.downpourSheet);
    layers.push(LAYERS.heavyRain);
    layers.push(LAYERS.rainSplashes);
  } else if (weatherTags.has("light-rain") || weatherTags.has("wet")) {
    layers.push(LAYERS.drizzleTicks);
    layers.push(LAYERS.lightRain);
  }
  if (weatherTags.has("gale-wind")) {
    layers.push(LAYERS.galeWind);
    layers.push(LAYERS.windGusts);
  } else if (weatherTags.has("light-wind")) {
    layers.push(LAYERS.lightWind);
  }
  if (context.weatherMix?.thunderChance >= 0.18) {
    layers.push(context.weatherMix.thunderChance >= 0.55 ? LAYERS.closeThunder : LAYERS.distantThunder);
    layers.push(LAYERS.thunderRumble);
    if (context.weatherMix.thunderChance >= 0.55) {
      layers.push(LAYERS.lightningCrackle);
    }
  }

  if (entry.category !== "nature" && context.locationTags.has("forest")) {
    layers.push(LAYERS.forestLeaves);
    layers.push(LAYERS.canopyWind);
    layers.push(LAYERS.forestBirds);
  }
  if (entry.category !== "water" && context.locationTags.has("pond")) {
    layers.push(LAYERS.pondLap);
    layers.push(LAYERS.frogs);
  }
  if (entry.category !== "water" && context.locationTags.has("waterfall")) {
    layers.push(LAYERS.waterfallRoar);
    layers.push(LAYERS.sprayMist);
  }
  if (entry.category !== "urban" && context.locationTags.has("market")) {
    layers.push(LAYERS.crowdMurmur);
    layers.push(LAYERS.crowdBabble);
    layers.push(LAYERS.marketVendors);
  }
  if (entry.category !== "urban" && context.locationTags.has("town")) {
    layers.push(LAYERS.townSteps);
    layers.push(LAYERS.distantBells);
  }
  if (entry.id !== "tavern" && context.locationTags.has("tavern")) {
    layers.push(LAYERS.cupClatter);
    layers.push(LAYERS.tavernPatrons);
    layers.push(LAYERS.tavernMurmur);
  }
  if (entry.id !== "quiet-interior" && context.locationTags.has("interior")) {
    layers.push(LAYERS.quietInteriorTone);
    layers.push(LAYERS.floorCreak);
  }
  if (entry.id !== "archive-room" && context.locationTags.has("archive")) {
    layers.push(LAYERS.archiveRoomTone);
    layers.push(LAYERS.archivePages);
  }
  if (entry.id !== "shrine-cistern" && context.locationTags.has("shrine")) {
    layers.push(LAYERS.cisternEcho);
    layers.push(LAYERS.stoneReverb);
  }
  if (entry.id !== "campfire" && context.locationTags.has("campfire")) {
    layers.push(LAYERS.fireCrackle);
  }
  if (entry.id !== "insects" && context.locationTags.has("field")) {
    layers.push(LAYERS.crickets);
  }
  if (seasonTags.has("spring")) {
    layers.push(LAYERS.springBirds);
  }
  if (seasonTags.has("summer")) {
    layers.push(LAYERS.cicadas);
  }
  if (seasonTags.has("autumn")) {
    layers.push(LAYERS.autumnLeaves);
  }
  if (seasonTags.has("winter")) {
    layers.push(LAYERS.frostAir);
    if (!weatherTags.has("clear")) {
      layers.push(LAYERS.snowHush);
    }
  }
  if (entry.id !== "crowd-murmur" && moodTags.has("crowded")) {
    layers.push(LAYERS.lowCrowd);
    layers.push(LAYERS.crowdBabble);
  }
  if (entry.id !== "toasting-cheers" && moodTags.has("toasting")) {
    layers.push(LAYERS.glassToast);
    layers.push(LAYERS.tavernLaughter);
  }
  if (entry.id !== "cheering-crowd" && moodTags.has("cheerful")) {
    layers.push(LAYERS.cheers);
    layers.push(LAYERS.tavernLaughter);
  }
  if (entry.id !== "angry-shouts" && moodTags.has("angry")) {
    layers.push(LAYERS.shouting);
    layers.push(LAYERS.jeers);
  }
  if (entry.id !== "whispers" && moodTags.has("secretive")) {
    layers.push(LAYERS.whispers);
  }
  if (entry.id !== "singing" && moodTags.has("singing")) {
    layers.push(LAYERS.song);
    layers.push(LAYERS.chant);
  }
}

function buildTransition(entry, context, intensity, previousSoundscapeId) {
  const configured = entry.transition;
  const samePreset = previousSoundscapeId && previousSoundscapeId === entry.id;
  if (samePreset) {
    return { style: "retune", durationMs: 700, curve: "soft" };
  }
  if (context.encounterActive || entry.id === "combat-tension" || intensity >= 0.72) {
    return {
      style: configured.style === "slow-crossfade" ? "medium-crossfade" : configured.style,
      durationMs: Math.min(configured.durationMs, 1200),
      curve: configured.curve === "soft" ? "natural" : configured.curve
    };
  }
  return { ...configured };
}

function buildHints(entry, context, layers) {
  const contextHints = [
    ...[...context.profileWeatherTags].map((tag) => `weather:${tag}`),
    ...[...context.seasonTags].map((tag) => `season:${tag}`),
    ...[...context.locationTags].map((tag) => `location:${tag}`),
    ...[...context.profileMoodTags].map((tag) => `mood:${tag}`)
  ];
  return {
    visualHints: unique([...entry.visualHints, ...layers.flatMap((layerEntry) => layerEntry.visualHints)]),
    assetHints: unique([...entry.assetHints, ...contextHints, ...layers.flatMap((layerEntry) => layerEntry.assetHints)])
  };
}

function buildSceneVisualState(entry, context, layers, transition, hints) {
  const weatherMix = context.weatherMix || { rain: "none", wind: "none", thunderChance: 0, clear: false };
  const variantAxes = {
    weather: [...context.profileWeatherTags],
    season: [...context.seasonTags],
    location: [...context.locationTags],
    mood: [...context.profileMoodTags],
    rain: weatherMix.rain,
    wind: weatherMix.wind,
    thunderChance: weatherMix.thunderChance,
    clear: Boolean(weatherMix.clear)
  };
  const weatherVariantHints = [
    weatherMix.rain !== "none" ? `rain:${weatherMix.rain}` : "",
    weatherMix.wind !== "none" ? `wind:${weatherMix.wind}` : "",
    weatherMix.thunderChance >= 0.55 ? "thunder:close" : weatherMix.thunderChance > 0 ? "thunder:distant" : ""
  ];
  const seasonVariantHints = [...context.seasonTags].map((tag) => `season:${tag}`);
  const motionHints = unique([
    ...layers.flatMap((layerEntry) => layerEntry.visualHints),
    ...weatherVariantHints,
    ...seasonVariantHints
  ]);
  const variantKey = unique([
    `preset:${entry.id}`,
    ...hints.assetHints.filter((hint) => /^(location|weather|season|mood|intensity|time):/.test(hint)),
    ...weatherVariantHints,
    ...seasonVariantHints
  ]).join("|");

  return {
    variantKey,
    variantAxes,
    overlayHints: [...hints.visualHints],
    motionHints,
    assetHints: [...hints.assetHints],
    transition: {
      style: transition.style,
      durationMs: transition.durationMs,
      curve: transition.curve
    },
    updatedAt: context.updatedAt
  };
}

function buildReason(winner, context, fallbackPreset) {
  if (!winner) {
    return reasonDescriptor("soundscape.reason.fallback", fallbackPreset);
  }

  const { matches, preset: entry } = winner;
  if (entry.id === "combat-tension" || matches.encounter.length > 0 || context.encounterActive) {
    return reasonDescriptor("soundscape.reason.combat", entry);
  }
  if (matches.location.length > 0 && hasAudibleWeatherMix(context.weatherMix)) {
    return reasonDescriptor("soundscape.reason.locationWeather", entry);
  }
  if (matches.weather.length > 0) {
    return reasonDescriptor("soundscape.reason.weather", entry);
  }
  if (matches.location.length > 0) {
    return reasonDescriptor("soundscape.reason.location", entry);
  }
  if (matches.mood.length > 0) {
    return reasonDescriptor("soundscape.reason.mood", entry);
  }
  if (matches.scene.length > 0) {
    return reasonDescriptor("soundscape.reason.scene", entry);
  }
  if (matches.recent.length > 0) {
    return reasonDescriptor("soundscape.reason.recent", entry);
  }

  return reasonDescriptor("soundscape.reason.default", entry);
}

function reasonDescriptor(key, entry) {
  return {
    key,
    params: {
      id: entry.id,
      category: entry.category
    }
  };
}

function sceneMismatchGuard(entry, context, matches) {
  if (entry.id === "combat-tension" && (context.encounterActive || context.threat >= 0.72)) {
    return null;
  }

  if (LOUD_SOCIAL_PRESETS.has(entry.id) && context.explicitMoodText && !entry.moods.some((tag) => context.explicitMoodTags.has(tag))) {
    return {
      code: "social-mood-mismatch",
      reason: `${entry.id} ignored explicit mood ${context.explicitMoodText.slice(0, 32)}`,
      penalty: 14
    };
  }

  if (SOCIAL_PRESETS.has(entry.id) && context.explicitLocationLocked && matches.currentMoodMatches.length === 0 && matches.sceneMatches.length === 0) {
    return {
      code: "social-current-scene-mismatch",
      reason: `${entry.id} ignored current scene location`,
      penalty: 12
    };
  }

  const lockedLocations = [...context.sceneLocationTags];
  if (lockedLocations.length > 0 && entry.locations.length > 0 && matches.locationTagMatches.length === 0) {
    return {
      code: `scene-location-mismatch:${lockedLocations.slice(0, 2).join("+")}`,
      reason: `${entry.id} conflicts with scene location ${lockedLocations.slice(0, 2).join(", ")}`,
      penalty: 12
    };
  }

  if (lockedLocations.length > 0 && entry.locations.length === 0 && entry.category !== "weather") {
    const allowed = new Set(lockedLocations.flatMap((tag) => SCENE_LOCATION_AUDIO_GUARDS[tag] || []));
    const hasStrongNonLocationEvidence = matches.currentMoodMatches.length > 0 || matches.encounterMatches.length > 0;
    if (allowed.size > 0 && !allowed.has(entry.id) && matches.sceneMatches.length === 0 && !hasStrongNonLocationEvidence) {
      return {
        code: `scene-bed-mismatch:${lockedLocations.slice(0, 2).join("+")}`,
        reason: `${entry.id} lacks current scene support for ${lockedLocations.slice(0, 2).join(", ")}`,
        penalty: 8
      };
    }
  }

  if (entry.category === "weather" && context.explicitWeatherText && matches.weatherMatches.length === 0) {
    return {
      code: "weather-mismatch",
      reason: `${entry.id} ignored explicit weather ${context.explicitWeatherText.slice(0, 32)}`,
      penalty: 10
    };
  }

  if (entry.category === "weather" && context.explicitLocationLocked && matches.currentWeatherMatches.length === 0) {
    return {
      code: "weather-current-scene-mismatch",
      reason: `${entry.id} only matched stale or non-scene weather`,
      penalty: 18
    };
  }

  return null;
}

function preset(config) {
  return Object.freeze({
    priority: 0,
    baseIntensity: 0.3,
    threatGain: 0.1,
    tones: Object.freeze([]),
    beats: Object.freeze([]),
    moods: Object.freeze([]),
    weather: Object.freeze([]),
    locations: Object.freeze([]),
    incompatibleWeather: Object.freeze([]),
    encounterStates: Object.freeze([]),
    keywords: Object.freeze([]),
    layers: Object.freeze([]),
    visualHints: Object.freeze([]),
    assetHints: Object.freeze([]),
    transition: Object.freeze({ style: "slow-crossfade", durationMs: 2200, curve: "soft" }),
    ...config,
    tones: Object.freeze(config.tones || []),
    beats: Object.freeze(config.beats || []),
    moods: Object.freeze(config.moods || []),
    weather: Object.freeze(config.weather || []),
    locations: Object.freeze(config.locations || []),
    incompatibleWeather: Object.freeze(config.incompatibleWeather || []),
    encounterStates: Object.freeze(config.encounterStates || []),
    keywords: Object.freeze(config.keywords || []),
    layers: Object.freeze(config.layers || []),
    visualHints: Object.freeze(config.visualHints || []),
    assetHints: Object.freeze(config.assetHints || []),
    transition: Object.freeze(config.transition || { style: "slow-crossfade", durationMs: 2200, curve: "soft" })
  });
}

function layer(id, type, profile, gain, visualHints = [], assetHints = []) {
  return Object.freeze({
    id,
    type,
    profile,
    gain,
    visualHints: Object.freeze(visualHints),
    assetHints: Object.freeze(assetHints)
  });
}

function buildWeatherMix(tags, { threat = 0 } = {}) {
  const clear = tags.has("clear") && !hasWetWeather(tags);
  const rain = tags.has("heavy-rain")
    ? "heavy"
    : tags.has("light-rain")
      ? "light"
      : tags.has("wet")
        ? "wet"
        : "none";
  const wind = tags.has("gale-wind") ? "gale" : tags.has("light-wind") ? "light" : "none";
  let thunderChance = 0;

  if (!clear) {
    if (tags.has("thunder")) {
      thunderChance = rain === "heavy" || wind === "gale" ? 0.72 : 0.58;
    } else if (rain === "heavy" && wind === "gale") {
      thunderChance = 0.34;
    } else if (rain === "heavy") {
      thunderChance = 0.24;
    } else if (wind === "gale" && rain !== "none") {
      thunderChance = 0.18;
    } else if (rain === "light" && threat >= 0.5) {
      thunderChance = 0.12;
    }

    if (threat >= 0.72 && (rain === "heavy" || wind === "gale")) {
      thunderChance += 0.08;
    }
  }

  return {
    rain,
    wind,
    thunderChance: round2(clamp01(thunderChance)),
    clear
  };
}

function weatherMixIntensityBoost(weatherMix) {
  if (!weatherMix) return 0;
  const rainBoost = weatherMix.rain === "heavy" ? 0.05 : weatherMix.rain === "light" ? 0.02 : 0;
  const windBoost = weatherMix.wind === "gale" ? 0.05 : weatherMix.wind === "light" ? 0.02 : 0;
  const thunderBoost = weatherMix.thunderChance >= 0.55 ? 0.08 : weatherMix.thunderChance >= 0.18 ? 0.03 : 0;
  if (weatherMix.clear) {
    return Math.min(0.06, windBoost);
  }
  return Math.min(0.12, rainBoost + windBoost + thunderBoost);
}

function layerProbability(layerEntry, context) {
  if (!["thunder.close", "thunder.distant"].includes(layerEntry.profile)) return null;
  const chance = context.weatherMix?.thunderChance ?? 0;
  return chance > 0 ? chance : null;
}

function hasAudibleWeatherMix(weatherMix) {
  return Boolean(
    weatherMix &&
    (weatherMix.rain !== "none" || weatherMix.wind === "gale" || weatherMix.thunderChance > 0)
  );
}

function hasWetWeather(tags) {
  return ["wet", "light-rain", "heavy-rain", "thunder"].some((tag) => tags.has(tag));
}

function isWindWeatherTag(tag) {
  return tag === "light-wind" || tag === "gale-wind";
}

function hasExplicitPresetWeather(entry, context) {
  return entry.weather.some((tag) => context.currentWeatherTags.has(tag));
}

function normalizeThreat(values) {
  return values.reduce((max, value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return max;
    const normalized = number < 1 ? number : number <= 6 ? number / 6 : number / 10;
    return Math.max(max, clamp01(normalized));
  }, 0);
}

function extractTags(text, dictionary) {
  return Object.entries(dictionary)
    .filter(([, terms]) => matchTerms(text, terms).length > 0)
    .map(([tag]) => tag);
}

function matchTerms(text, terms) {
  if (!text) return [];
  return terms.filter((term) => hasTerm(text, normalizeText(term)));
}

function hasTerm(text, term) {
  if (!term) return false;
  if (/^[a-z0-9 -]+$/.test(term)) {
    const pattern = term.split(/[\s-]+/).map(escapeRegExp).join("[\\s-]+");
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

function normalizeTagList(values) {
  const result = [];
  const visit = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value === "object") {
      for (const item of Object.values(value)) visit(item);
      return;
    }
    const normalized = normalizeTagText(value);
    if (normalized) result.push(normalized);
  };

  visit(values);
  return unique(result);
}

function collectSceneAssetEvidence(values) {
  const evidence = {
    tags: [],
    text: [],
    weatherText: [],
    seasonText: [],
    moodText: [],
    locationText: []
  };
  const visit = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }
    if (typeof value !== "object") {
      evidence.text.push(value);
      return;
    }

    evidence.tags.push(value.tags, value.soundscapeHints, value.assetHints, value.uiSurface);
    evidence.text.push(
      value.id,
      value.assetId,
      value.name,
      value.zhName,
      value.sceneSlug,
      value.semanticKey,
      value.variantOf,
      value.type,
      value.group,
      value.reason,
      localizeText(value.description),
      localizeText(value.displayName),
      value.narrativeUses
    );
    evidence.weatherText.push(value.weather, value.variantAxes?.weather, value.taxonomy?.weather);
    evidence.seasonText.push(value.season, value.variantAxes?.season, value.taxonomy?.season);
    evidence.moodText.push(value.mood, value.threatLevel, value.variantAxes?.mood, value.taxonomy?.mood);
    evidence.locationText.push(value.location, value.sceneSlug, value.taxonomy?.location, value.variantAxes?.location);
    evidence.tags.push(Object.values(value.taxonomy || {}), Object.values(value.variantAxes || {}));
  };

  visit(values);
  return {
    tags: normalizeTagList(evidence.tags),
    text: evidence.text.flat().filter(Boolean),
    weatherText: evidence.weatherText.flat().filter(Boolean).join(" "),
    seasonText: evidence.seasonText.flat().filter(Boolean).join(" "),
    moodText: evidence.moodText.flat().filter(Boolean).join(" "),
    locationText: evidence.locationText.flat().filter(Boolean).join(" ")
  };
}

function localizeText(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return [value.en, value.zh, value.default].filter(Boolean).join(" ");
  return String(value);
}

function directKnownTags(tags, knownIds) {
  return tags
    .map((tag) => tag.split(":").at(-1))
    .filter((tag) => knownIds.has(tag));
}

function normalizeTagText(value) {
  return normalizeText(value)
    .replace(/_/g, "-")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+-\s+/g, "-");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueBy(values, getKey) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
