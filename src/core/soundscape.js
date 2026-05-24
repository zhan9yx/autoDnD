const FALLBACK_UPDATED_AT = "1970-01-01T00:00:00.000Z";

const ACTIVE_ENCOUNTER_STATES = new Set(["active", "combat", "engaged", "hostile", "started", "in-combat"]);

const WEATHER_TAG_TERMS = Object.freeze({
  clear: Object.freeze(["clear", "clear sky", "sunny", "sunlit", "bright day", "blue sky", "晴朗", "晴天", "阳光", "蓝天"]),
  wet: Object.freeze(["wet", "mist", "fog", "drizzle", "rain", "storm", "puddle", "slick", "潮湿", "雾", "细雨", "雨", "暴雨", "水洼"]),
  "light-rain": Object.freeze(["drizzle", "light rain", "misty rain", "soft rain", "细雨", "小雨", "毛毛雨"]),
  "heavy-rain": Object.freeze(["downpour", "heavy rain", "rainstorm", "monsoon", "sheets of rain", "暴雨", "大雨", "倾盆雨"]),
  thunder: Object.freeze(["thunder", "thunderclap", "lightning", "storm", "雷", "雷鸣", "闪电", "风暴"]),
  "light-wind": Object.freeze(["breeze", "light wind", "soft wind", "gentle wind", "微风", "轻风", "和风"]),
  "gale-wind": Object.freeze(["gale", "howling wind", "strong wind", "squall", "狂风", "疾风", "强风", "呼啸"])
});

const LOCATION_TAG_TERMS = Object.freeze({
  forest: Object.freeze(["forest", "woods", "woodland", "grove", "jungle", "trees", "pine", "canopy", "森林", "树林", "林地", "树冠"]),
  pond: Object.freeze(["pond", "lake", "pool", "cistern", "marsh", "swamp", "reeds", "lotus", "池塘", "湖", "水池", "蓄水池", "沼泽", "芦苇"]),
  waterfall: Object.freeze(["waterfall", "cascade", "rapids", "falls", "gorge", "river", "瀑布", "急流", "峡谷", "河流"]),
  campfire: Object.freeze(["campfire", "fireplace", "hearth", "bonfire", "embers", "torch", "火堆", "篝火", "壁炉", "余烬", "火把"]),
  field: Object.freeze(["field", "grass", "meadow", "dusk", "草地", "田野", "黄昏"]),
  market: Object.freeze(["market", "city", "street", "alley", "bazaar", "plaza", "dock", "harbor", "市场", "集市", "城市", "街", "巷", "码头", "广场"]),
  tavern: Object.freeze(["tavern", "inn", "pub", "alehouse", "bar", "common room", "酒馆", "旅店", "客栈", "酒吧", "大厅"])
});

const MOOD_TAG_TERMS = Object.freeze({
  cheerful: Object.freeze(["cheer", "cheering", "applause", "celebration", "festival", "欢呼", "喝彩", "庆典", "节日"]),
  angry: Object.freeze(["shout", "shouting", "argument", "heckle", "boo", "curse", "叫骂", "争吵", "怒吼", "咒骂"]),
  secretive: Object.freeze(["whisper", "whispers", "hushed", "secret", "murmur", "低语", "耳语", "秘密", "窃窃私语"]),
  singing: Object.freeze(["song", "singing", "chant", "hymn", "ballad", "歌声", "歌唱", "吟唱", "圣歌"]),
  calm: Object.freeze(["calm", "quiet", "rest", "peaceful", "sleep", "平静", "安静", "休息", "宁静"]),
  mystery: Object.freeze(["mystery", "secret", "clue", "shadow", "ritual", "curse", "秘密", "线索", "阴影", "仪式", "诅咒"])
});

const LAYERS = Object.freeze({
  combatDrums: layer("low-war-drums", "music", "music.combat-drums", 0.78, ["combat-pulse"], ["music:combat"]),
  bowedMetal: layer("bowed-metal-pulse", "tension", "tension.bowed-metal", 0.64, ["danger-pulse"], ["mood:danger"]),
  weaponClatter: layer("distant-weapon-clatter", "foley", "foley.weapon-clatter", 0.38, ["sparks"], ["foley:weapons"]),
  lightRain: layer("fine-rain-on-stone", "weather", "rain.light", 0.58, ["light-rain", "wet-stone"], ["weather:rain", "intensity:light"]),
  heavyRain: layer("heavy-rain-curtain", "weather", "rain.heavy", 0.86, ["heavy-rain", "low-visibility"], ["weather:rain", "intensity:heavy"]),
  roofDrips: layer("roof-drips", "water", "water.drips", 0.42, ["drips"], ["weather:wet"]),
  distantThunder: layer("distant-thunder-roll", "weather", "thunder.distant", 0.42, ["lightning-horizon"], ["weather:thunder"]),
  closeThunder: layer("close-thunder-crack", "weather", "thunder.close", 0.72, ["lightning-flash"], ["weather:thunder", "intensity:heavy"]),
  lightWind: layer("soft-breeze", "weather", "wind.light", 0.32, ["leaf-motion"], ["weather:wind", "intensity:light"]),
  galeWind: layer("howling-gale", "weather", "wind.gale", 0.78, ["wind-streaks"], ["weather:wind", "intensity:heavy"]),
  branchWind: layer("branch-creak", "nature", "nature.branches", 0.34, ["swaying-branches"], ["location:forest"]),
  forestLeaves: layer("leaf-canopy-bed", "nature", "nature.forest-leaves", 0.62, ["canopy"], ["location:forest"]),
  forestFloor: layer("soft-ground-rustle", "foley", "foley.brush", 0.26, ["forest-floor"], ["location:forest"]),
  pondLap: layer("small-water-lap", "water", "water.pond-lap", 0.58, ["water-ripples"], ["location:pond"]),
  reeds: layer("reed-brush", "nature", "nature.reeds", 0.36, ["reeds"], ["location:pond"]),
  bubbles: layer("soft-bubbles", "water", "water.bubbles", 0.22, ["water-bubbles"], ["location:pond"]),
  waterfallRoar: layer("waterfall-roar", "water", "waterfall.roar", 0.86, ["waterfall-spray"], ["location:waterfall"]),
  sprayMist: layer("spray-mist", "weather", "mist.spray", 0.44, ["mist"], ["weather:mist", "location:waterfall"]),
  wetRockEcho: layer("wet-rock-echo", "foley", "foley.cavern-echo", 0.28, ["wet-rock"], ["location:gorge"]),
  fireCrackle: layer("fire-crackle", "fire", "fire.crackle", 0.68, ["ember-glow"], ["location:campfire"]),
  emberPops: layer("ember-pops", "fire", "fire.pops", 0.36, ["ember-sparks"], ["location:campfire"]),
  nightAir: layer("soft-night-air", "nature", "weather.night-air", 0.22, ["cool-air"], ["mood:calm"]),
  crickets: layer("cricket-bed", "nature", "insects.crickets", 0.58, ["dusk-specks"], ["sound:insects"]),
  cicadas: layer("cicada-thread", "nature", "insects.cicadas", 0.40, ["summer-heat"], ["sound:insects"]),
  duskBreeze: layer("dusk-breeze", "weather", "wind.light", 0.18, ["dusk-air"], ["weather:wind", "intensity:light"]),
  crowdMurmur: layer("crowd-murmur", "crowd", "crowd.market-murmur", 0.64, ["crowd-flow"], ["location:market"]),
  cartWheels: layer("cart-wheels", "urban", "urban.cart-wheels", 0.34, ["street-motion"], ["location:market"]),
  distantBells: layer("distant-bells", "urban", "urban.bells", 0.24, ["city-bells"], ["location:city"]),
  tavernMurmur: layer("tavern-room-murmur", "crowd", "crowd.tavern-murmur", 0.58, ["warm-room"], ["location:tavern"]),
  cupClatter: layer("cup-and-plate-clatter", "foley", "foley.cups-plates", 0.48, ["cup-clatter"], ["location:tavern", "foley:cups"]),
  hearthRoom: layer("hearth-room-tone", "fire", "fire.hearth", 0.22, ["warmth"], ["location:tavern"]),
  cheers: layer("table-cheers", "crowd", "crowd.cheers", 0.72, ["crowd-surge"], ["mood:cheer"]),
  applause: layer("hand-applause", "crowd", "crowd.applause", 0.42, ["applause"], ["mood:cheer"]),
  shouting: layer("angry-shouting", "voice", "voice.shouting", 0.68, ["argument"], ["mood:angry"]),
  heckles: layer("distant-heckles", "voice", "voice.heckles", 0.42, ["crowd-edge"], ["mood:angry"]),
  whispers: layer("low-whispers", "voice", "voice.whispers", 0.52, ["shadow-whispers"], ["mood:secretive"]),
  whisperTail: layer("distant-whisper-tail", "tension", "voice.whispers", 0.18, ["shadow-whispers"], ["mood:mystery"]),
  song: layer("room-song", "voice", "voice.song", 0.58, ["song-wave"], ["mood:singing"]),
  drone: layer("low-detective-drone", "music", "music.mystery-drone", 0.54, ["low-vignette"], ["mood:mystery"]),
  candleTone: layer("candle-room-tone", "fire", "fire.candle", 0.26, ["candle"], ["mood:mystery"]),
  nightBell: layer("distant-midnight-bell", "urban", "urban.bells", 0.12, ["night-bell"], ["mood:calm"]),
  roomTone: layer("soft-room-tone", "nature", "weather.night-air", 0.24, ["quiet-room"], ["mood:calm"])
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
    layers: [LAYERS.lightRain, LAYERS.roofDrips, LAYERS.lightWind],
    visualHints: ["light-rain", "wet-stone"],
    assetHints: ["weather:rain", "intensity:light"],
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
    layers: [LAYERS.heavyRain, LAYERS.roofDrips, LAYERS.galeWind],
    visualHints: ["heavy-rain", "low-visibility"],
    assetHints: ["weather:rain", "intensity:heavy"],
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
    layers: [LAYERS.heavyRain, LAYERS.closeThunder, LAYERS.galeWind],
    visualHints: ["lightning-flash", "heavy-rain", "wind-streaks"],
    assetHints: ["weather:thunder", "weather:storm"],
    transition: { style: "weather-swell", durationMs: 1400, curve: "swell" }
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
    layers: [LAYERS.galeWind, LAYERS.branchWind],
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
    layers: [LAYERS.forestLeaves, LAYERS.branchWind, LAYERS.forestFloor],
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
    layers: [LAYERS.pondLap, LAYERS.reeds, LAYERS.bubbles],
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
    layers: [LAYERS.crowdMurmur, LAYERS.cartWheels, LAYERS.distantBells],
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
    layers: [LAYERS.tavernMurmur, LAYERS.cupClatter, LAYERS.hearthRoom],
    visualHints: ["warm-room", "cup-clatter"],
    assetHints: ["location:tavern", "foley:cups"],
    transition: { style: "medium-crossfade", durationMs: 1900, curve: "natural" }
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
    layers: [LAYERS.cheers, LAYERS.applause, LAYERS.crowdMurmur],
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
    layers: [LAYERS.shouting, LAYERS.heckles, LAYERS.crowdMurmur],
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
    layers: [LAYERS.song, LAYERS.tavernMurmur, LAYERS.nightAir],
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

  return {
    id: preset.id,
    label: preset.label,
    category: preset.category,
    intensity,
    layers,
    profile: {
      weather: [...context.weatherTags],
      location: [...context.locationTags],
      mood: [...context.moodTags]
    },
    transition,
    crossfadeMs: transition.durationMs,
    visualHints: hints.visualHints,
    assetHints: hints.assetHints,
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
  return rankSoundscapes(buildSoundscapeContext(room, options)).map(({ preset, score, matches, blockedBy }) => ({
    id: preset.id,
    label: preset.label,
    category: preset.category,
    score,
    matches,
    blockedBy
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

  const explicitWeatherText = normalizeText([
    room?.weather,
    room?.mood?.weather,
    scene.weather,
    scene.weatherState,
    scene.atmosphere?.weather
  ].filter(Boolean).join(" "));
  const explicitMoodText = normalizeText([
    room?.mood,
    scene.mood,
    scene.atmosphere?.mood,
    director.mood
  ].filter(Boolean).join(" "));
  const locationText = normalizeText(scene.location);
  const sceneText = normalizeText([
    scene.title,
    scene.location,
    scene.tone,
    room?.tone,
    scene.ambience,
    scene.objective,
    explicitWeatherText,
    explicitMoodText
  ].filter(Boolean).join(" "));
  const recentText = normalizeText(recentTranscript.map(formatTranscriptEntry).join(" "));
  const allText = normalizeText([sceneText, recentText].join(" "));
  const weatherTags = new Set([
    ...extractTags(explicitWeatherText || sceneText, WEATHER_TAG_TERMS),
    ...extractTags(allText, WEATHER_TAG_TERMS)
  ]);
  const locationTags = new Set(extractTags([locationText, sceneText].join(" "), LOCATION_TAG_TERMS));
  const moodTags = new Set([
    ...extractTags(explicitMoodText || sceneText, MOOD_TAG_TERMS),
    ...extractTags(allText, MOOD_TAG_TERMS)
  ]);

  return {
    locationText,
    sceneText,
    recentText,
    allText,
    tone: normalizeText(scene.tone || room?.tone),
    beat: normalizeText(director.beat),
    encounterState,
    threat,
    encounterActive: ACTIVE_ENCOUNTER_STATES.has(encounterState) && hasLivingEnemies,
    weatherTags,
    locationTags,
    moodTags,
    explicitWeatherText,
    explicitMoodText,
    clearWeather: weatherTags.has("clear") && !hasWetWeather(weatherTags),
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
  const locationTagMatches = entry.locations.filter((tag) => context.locationTags.has(tag));
  const moodMatches = entry.moods.filter((tag) => context.moodTags.has(tag));
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
  if (entry.category !== "weather" && locationTagMatches.length > 0) {
    score += 4;
  }

  const blockedBy = [];
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

  if (entry.category === "weather" && weatherMatches.length === 0 && context.clearWeather) {
    score -= 8;
    blockedBy.push("clear-weather-without-weather-evidence");
  }

  if (entry.id === "light-rain" && context.weatherTags.has("heavy-rain")) score -= 4;
  if (entry.id === "light-rain" && context.weatherTags.has("wet") && !context.weatherTags.has("heavy-rain")) score += 4.2;
  if (entry.id === "heavy-rain" && context.weatherTags.has("light-rain") && !context.weatherTags.has("thunder")) score -= 2;
  if (entry.id === "heavy-rain" && context.weatherTags.has("heavy-rain")) score += 3.6;
  if (entry.id === "thunderstorm" && context.weatherTags.has("thunder")) score += 4.4;
  if (entry.id === "thunderstorm" && !context.weatherTags.has("thunder")) score -= 4;
  if (entry.id === "thunderstorm" && context.weatherTags.has("thunder")) score += 4;
  if (entry.id === "whispers" && context.moodTags.has("secretive")) score += 4.0;
  if (entry.id === "singing" && context.moodTags.has("singing")) score += 4.0;
  if (entry.id === "calm-night" && (context.moodTags.has("secretive") || context.moodTags.has("singing") || context.moodTags.has("angry") || context.moodTags.has("cheerful"))) score -= 3.0;
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
    matches: {
      location: unique([...locationTagMatches, ...locationMatches]),
      scene: sceneMatches.filter((match) => !locationMatches.includes(match)),
      recent: recentMatches,
      weather: weatherMatches,
      mood: moodMatches,
      tone: toneMatches,
      beat: beatMatches,
      encounter: encounterMatches
    }
  };
}

function chooseIntensity(entry, context, score) {
  const scoreBoost = Math.min(0.14, score / 90);
  const beatBoost = context.beat === "crisis" || context.beat === "retaliation" ? 0.08 : 0;
  const weatherBoost = entry.category === "weather" && context.weatherTags.has("thunder") ? 0.08 : 0;
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
    visualHints: [...layerEntry.visualHints],
    assetHints: [...layerEntry.assetHints]
  }));
}

function addContextualLayers(layers, entry, context) {
  if (entry.category !== "weather") {
    if (context.weatherTags.has("thunder")) {
      layers.push(LAYERS.distantThunder);
    } else if (context.weatherTags.has("heavy-rain")) {
      layers.push(LAYERS.heavyRain);
    } else if (context.weatherTags.has("light-rain") || context.weatherTags.has("wet")) {
      layers.push(LAYERS.lightRain);
    }
    if (context.weatherTags.has("gale-wind")) {
      layers.push(LAYERS.galeWind);
    } else if (context.weatherTags.has("light-wind")) {
      layers.push(LAYERS.lightWind);
    }
  }

  if (entry.category !== "nature" && context.locationTags.has("forest")) {
    layers.push(LAYERS.forestLeaves);
  }
  if (entry.category !== "urban" && context.locationTags.has("market")) {
    layers.push(LAYERS.crowdMurmur);
  }
  if (entry.id !== "tavern" && context.locationTags.has("tavern")) {
    layers.push(LAYERS.cupClatter);
  }
  if (entry.id !== "campfire" && context.locationTags.has("campfire")) {
    layers.push(LAYERS.fireCrackle);
  }
  if (entry.id !== "cheering-crowd" && context.moodTags.has("cheerful")) {
    layers.push(LAYERS.cheers);
  }
  if (entry.id !== "angry-shouts" && context.moodTags.has("angry")) {
    layers.push(LAYERS.shouting);
  }
  if (entry.id !== "whispers" && context.moodTags.has("secretive")) {
    layers.push(LAYERS.whispers);
  }
  if (entry.id !== "singing" && context.moodTags.has("singing")) {
    layers.push(LAYERS.song);
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
    ...[...context.weatherTags].map((tag) => `weather:${tag}`),
    ...[...context.locationTags].map((tag) => `location:${tag}`),
    ...[...context.moodTags].map((tag) => `mood:${tag}`)
  ];
  return {
    visualHints: unique([...entry.visualHints, ...layers.flatMap((layerEntry) => layerEntry.visualHints)]),
    assetHints: unique([...entry.assetHints, ...contextHints, ...layers.flatMap((layerEntry) => layerEntry.assetHints)])
  };
}

function buildReason(winner, context, fallbackPreset) {
  if (!winner) {
    return `Fallback ${fallbackPreset.label}; pressure ${round2(context.threat)}.`;
  }

  const parts = [];
  const { matches, preset: entry, blockedBy } = winner;
  if (matches.weather.length > 0) {
    parts.push(`weather matched ${matches.weather.slice(0, 3).join(", ")}`);
  }
  if (matches.location.length > 0) {
    parts.push(`location matched ${matches.location.slice(0, 3).join(", ")}`);
  }
  if (matches.mood.length > 0) {
    parts.push(`mood matched ${matches.mood.slice(0, 3).join(", ")}`);
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
  if (blockedBy.length > 0) {
    parts.push(`blocked ${blockedBy.slice(0, 2).join(", ")}`);
  }
  if (parts.length === 0) {
    parts.push(`defaulted to ${entry.label}`);
  }

  return `${sentenceCase(parts.join("; "))}; pressure ${round2(context.threat)}.`;
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

function hasWetWeather(tags) {
  return ["wet", "light-rain", "heavy-rain", "thunder"].some((tag) => tags.has(tag));
}

function hasExplicitPresetWeather(entry, context) {
  return entry.weather.some((tag) => context.weatherTags.has(tag));
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

function sentenceCase(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
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
