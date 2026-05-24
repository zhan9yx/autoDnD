import { readFile, writeFile } from "node:fs/promises";

const manifestPath = new URL("../assets/generated/manifest.json", import.meta.url);

const itemSurfaces = ["inventory-item", "market-item", "reward-card", "item-detail"];
const itemFlow = ["inventory", "market", "reward", "item-detail"];
const sceneSurfaces = ["stage-backdrop", "relevant-scene"];
const qualityApproved = {
  approved: true,
  reviewStatus: "approved-metadata-template",
  duplicateRisk: "low",
  safetyFlags: []
};

const sheet020Reagents = [
  ["mooncap-mushroom", "Mooncap Mushroom", "月帽蘑菇", "reagent", "common", "alchemy", 12, "A pale mooncap mushroom with a luminous rim, ready for alchemy crafting, market barter, reward cards, and item detail inspection."],
  ["powdered-silver-vial", "Powdered Silver Vial", "银粉小瓶", "reagent", "uncommon", "crafting", 28, "A corked vial of powdered silver for warding recipes, suitable for inventory stacks, market stock, reward cards, and item details."],
  ["ember-resin-lump", "Ember Resin Lump", "余烬树脂块", "material", "uncommon", "fire-crafting", 34, "A warm lump of ember resin with dark bark flecks, prepared for crafting recipes, market listings, rewards, and inspection views."],
  ["frost-salt-crystal", "Frost Salt Crystal", "霜盐晶体", "mineral", "uncommon", "cold-crafting", 32, "A blue frost salt crystal that sweats cold vapor, useful for reagent storage, barter, reward cards, and data-backed detail screens."],
  ["basilisk-scale", "Basilisk Scale", "蜥化兽鳞片", "monster-part", "rare", "petrification", 90, "A glossy basilisk scale with a stone-gray edge, prepared for rare crafting rewards, market appraisal, inventory rows, and item details."],
  ["witchgrass-bundle", "Witchgrass Bundle", "巫草束", "herb", "common", "alchemy", 10, "A tied bundle of witchgrass with dry purple tips, suited for common reagent stacks, shop stock, reward cards, and item detail views."],
  ["quicksilver-bead", "Quicksilver Bead", "水银珠", "reagent", "rare", "transmutation", 110, "A sealed quicksilver bead that catches distorted reflections, ready for transmutation recipes, rare markets, rewards, and inspection."],
  ["mandrake-root-cutting", "Mandrake Root Cutting", "曼德拉草根段", "herb", "uncommon", "restoration", 45, "A dried mandrake root cutting wrapped in thread, prepared for healing crafts, market barter, reward cards, and item details."],
  ["star-anise-ash", "Star Anise Ash", "星茴香灰", "reagent", "common", "ritual", 14, "A folded packet of star anise ash used in minor rites, suitable for inventory stacks, market stalls, rewards, and details."],
  ["volcanic-glass-shard", "Volcanic Glass Shard", "火山玻璃片", "material", "uncommon", "weapon-crafting", 36, "A sharp volcanic glass shard with smoky edges, ready for crafting components, barter stock, reward cards, and item inspection."],
  ["blue-lotus-petal", "Blue Lotus Petal", "蓝莲花瓣", "herb", "rare", "focus", 78, "A preserved blue lotus petal in a wax paper fold, useful for focus brews, rare rewards, markets, and item detail views."],
  ["ghost-orchid-pollen", "Ghost Orchid Pollen", "幽兰花粉", "reagent", "rare", "illusion", 95, "A tiny vial of ghost orchid pollen that glows in dim light, prepared for illusion reagents, market curios, rewards, and details."],
  ["dragonbone-filings", "Dragonbone Filings", "龙骨锉屑", "monster-part", "rare", "enchantment", 140, "A pinch of dragonbone filings in a black paper twist, suited for enchantment crafts, valuable rewards, market appraisal, and inspection."],
  ["nightshade-berry-sprig", "Nightshade Berry Sprig", "夜影莓枝", "herb", "uncommon", "poison", 40, "A dark nightshade berry sprig tied with red string, ready for poison recipes, market stock, reward cards, and item details."],
  ["ambergris-wax-chip", "Ambergris Wax Chip", "龙涎蜡片", "material", "uncommon", "perfume", 52, "A fragrant ambergris wax chip wrapped in cloth, prepared for luxury crafting, barter goods, reward cards, and inspected details."],
  ["phoenix-ash-pinch", "Phoenix Ash Pinch", "凤凰灰撮", "reagent", "legendary", "revival", 300, "A tiny sealed pinch of phoenix ash with a gold ember glow, reserved for major rewards, rare markets, inventory, and item detail views."]
];

const sheet021Tools = [
  ["tension-wrench-set", "Tension Wrench Set", "张力扳手组", "tool", "common", "lockwork", 22, "A compact tension wrench set with slim steel picks, prepared for utility inventory, market stock, reward cards, and item details."],
  ["folding-caltrops", "Folding Caltrops", "折叠蒺藜", "trap", "common", "control", 18, "A hinged cluster of folding caltrops, suitable for trap gear, backpack rows, market supplies, rewards, and item inspection."],
  ["tripwire-spool", "Tripwire Spool", "绊线线轴", "trap", "common", "setup", 16, "A brass tripwire spool with fine black cord, ready for trap kits, market stock, rewards, and item detail screens."],
  ["smoke-pellet-case", "Smoke Pellet Case", "烟雾弹盒", "gadget", "uncommon", "escape", 35, "A small case of smoke pellets for quick escapes, prepared for inventory use, market listing, reward cards, and item details."],
  ["spring-jaw-snare", "Spring Jaw Snare", "弹簧夹索", "trap", "uncommon", "restraint", 42, "A spring jaw snare with a coiled trigger, suitable for trap rewards, market supplies, backpack rows, and inspection views."],
  ["clockwork-decoy", "Clockwork Decoy", "发条诱饵", "gadget", "rare", "distraction", 95, "A clockwork decoy with brass feet and a wind-up key, ready for gadget rewards, market curios, inventory, and details."],
  ["glass-cutter-wheel", "Glass Cutter Wheel", "玻璃切割轮", "tool", "uncommon", "infiltration", 46, "A glass cutter wheel mounted on a small handle, prepared for infiltration tools, market listings, reward cards, and inspection."],
  ["signal-mirror", "Signal Mirror", "信号镜", "tool", "common", "communication", 20, "A polished signal mirror in a leather tab, useful for field tools, market supplies, reward cards, and item details."],
  ["collapsible-probe-pole", "Collapsible Probe Pole", "伸缩探杆", "tool", "uncommon", "exploration", 38, "A collapsible probe pole with marked segments, ready for exploration kits, shop stock, reward cards, and item detail views."],
  ["alchemist-igniter", "Alchemist Igniter", "炼金点火器", "gadget", "uncommon", "fire-starting", 50, "A thumb-sized alchemist igniter with a guarded spark wheel, prepared for gadget inventory, market stock, rewards, and details."],
  ["grapnel-line-capsule", "Grapnel Line Capsule", "抓钩绳囊", "tool", "rare", "mobility", 120, "A grapnel line capsule with tightly wound cord, suited for mobility rewards, market appraisal, inventory rows, and item inspection."],
  ["needle-trigger-ring", "Needle Trigger Ring", "针触发环", "trap", "rare", "poison", 105, "A needle trigger ring with a hidden catch, prepared for delicate trap rewards, market curios, backpack storage, and detail screens."],
  ["brass-pressure-plate", "Brass Pressure Plate", "黄铜压板", "trap", "uncommon", "detection", 44, "A brass pressure plate etched with guide marks, useful for trap setups, market stock, reward cards, and item details."],
  ["miniature-pulley-block", "Miniature Pulley Block", "微型滑轮组", "tool", "common", "rigging", 26, "A miniature pulley block with twin wheels, prepared for rigging tools, inventory kits, market supplies, rewards, and inspection."],
  ["arc-spark-battery", "Arc Spark Battery", "电弧火花电池", "gadget", "rare", "power", 130, "A sealed arc spark battery with copper terminals, suitable for rare gadgets, market appraisal, reward cards, and item detail screens."],
  ["hinged-listening-cone", "Hinged Listening Cone", "折叠听音锥", "tool", "uncommon", "surveillance", 48, "A hinged listening cone that folds flat, ready for surveillance tools, market curios, reward cards, and item details."]
];

const sheet022Trophies = [
  ["wyvern-talon", "Wyvern Talon", "翼龙爪", "monster-part", "uncommon", "barter", 55, "A curved wyvern talon polished at the base, prepared for trophy rewards, market barter, inventory rows, and item details."],
  ["basilisk-glass-eye", "Basilisk Glass Eye", "蜥化兽玻璃眼", "monster-part", "rare", "alchemy", 135, "A basilisk glass eye with a cloudy center, suited for alchemical trophies, rare markets, reward cards, and inspection."],
  ["manticore-spine-barb", "Manticore Spine Barb", "蝎尾兽脊刺", "monster-part", "rare", "poison", 125, "A manticore spine barb wrapped in cloth, ready for poison crafts, trophy rewards, market appraisal, and item details."],
  ["chimera-horn-chip", "Chimera Horn Chip", "嵌合兽角片", "monster-part", "uncommon", "crafting", 70, "A chipped piece of chimera horn with scorched grain, prepared for crafting rewards, barter stock, inventory, and item details."],
  ["grave-wight-knuckle", "Grave Wight Knuckle", "墓妖指节", "trophy", "rare", "necromancy", 115, "A grave wight knuckle sealed in red thread, suitable for grim trophies, rare markets, reward cards, and inspection views."],
  ["storm-eel-scale", "Storm Eel Scale", "风暴鳗鳞片", "monster-part", "uncommon", "weather", 62, "A storm eel scale that flashes blue at the edge, ready for barter goods, reagent rewards, inventory rows, and details."],
  ["harpy-voice-feather", "Harpy Voice Feather", "鹰身女妖声羽", "monster-part", "rare", "enchantment", 105, "A harpy voice feather tied in a paper band, prepared for enchantment components, market curios, rewards, and item details."],
  ["gorgon-bronze-chip", "Gorgon Bronze Chip", "蛇发兽铜片", "monster-part", "rare", "petrification", 145, "A bronze chip from a gorgon hide, suited for high-value trophies, market appraisal, inventory rows, and inspection."],
  ["dire-boar-tusk-cap", "Dire Boar Tusk Cap", "凶野猪獠牙帽", "trophy", "common", "barter", 24, "A capped dire boar tusk with a drilled loop, useful for common trophies, barter stock, reward cards, and item details."],
  ["specter-cold-chain", "Specter Cold Chain", "幽魂冷链", "trophy", "rare", "haunting", 160, "A cold chain link recovered from a specter haunt, ready for eerie rewards, rare markets, inventory, and item detail views."],
  ["umber-hulk-chitin", "Umber Hulk Chitin", "土巨虫几丁片", "monster-part", "uncommon", "armor-crafting", 58, "A thick umber hulk chitin plate, prepared for armor crafting, trophy rewards, market stock, and inspection screens."],
  ["siren-scale-charm", "Siren Scale Charm", "塞壬鳞护符", "monster-part", "rare", "social", 120, "A siren scale charm that glitters like tidewater, suitable for social trophies, market curios, rewards, and details."],
  ["gargoyle-wing-slate", "Gargoyle Wing Slate", "石像鬼翼板", "monster-part", "uncommon", "stonework", 64, "A flat gargoyle wing slate with chisel marks, ready for stonework barter, reward cards, inventory rows, and item details."],
  ["hellhound-cinder-collar", "Hellhound Cinder Collar", "炼狱犬余烬项圈", "trophy", "rare", "fire", 150, "A cinder-black collar from a hellhound, prepared for fire trophies, rare markets, reward cards, and inspected details."],
  ["mirror-slime-core", "Mirror Slime Core", "镜史莱姆核心", "monster-part", "uncommon", "illusion", 68, "A mirror slime core suspended in a small jar, suited for illusion reagents, barter rewards, inventory, and item details."],
  ["moon-antler-fragment", "Moon Antler Fragment", "月角碎片", "trophy", "legendary", "treasure", 260, "A silver moon antler fragment with a soft glow, reserved for major trophies, valuable markets, reward cards, and detail views."]
];

const sheet023Wearables = [
  ["plume-guard-helm", "Plume Guard Helm", "赤羽卫盔", "headgear", "rare", "armor", 120, "A black steel guard helm with a red plume and etched gold cheek plates, ready for inventory equipment, market appraisal, reward cards, and item detail inspection.", "accessory", "黑钢卫盔缀着赤红羽饰和金色护颊，适合在装备栏、市场估价、奖励卡和物品详情中作为可穿戴战利品出现。"],
  ["lacquered-leather-cuirass", "Lacquered Leather Cuirass", "漆皮胸甲", "armor-body", "uncommon", "armor", 95, "A red lacquered leather cuirass with brass buckles and travel scuffs, prepared for body-slot equipment, market offers, rewards, and detailed item views.", "body", "赤红漆皮胸甲带有黄铜扣具和旅途擦痕，可作为身体槽装备进入背包、市场、奖励和详情流程。"],
  ["folded-chain-shirt", "Folded Chain Shirt", "折叠链甲", "armor-body", "uncommon", "armor", 110, "A neatly folded chain shirt with a reinforced collar, useful for armor rewards, market stock, inventory equipment rows, and item detail screens.", "body", "折叠整齐的链甲露出加固衣领，适合作为护甲奖励、市场货品、背包装备行和物品详情资产。"],
  ["stormclasp-travel-cloak", "Stormclasp Travel Cloak", "风暴扣旅斗篷", "cloak", "rare", "weather-gear", 130, "A navy travel cloak pinned by a lightning clasp, suited for weather gear in inventory, market listings, reward cards, and item inspection.", "body", "深蓝旅斗篷以闪电纹扣针固定，适合表现防风雨装备、市场陈列、奖励卡和详情检查。"],
  ["azure-court-tunic", "Azure Court Tunic", "蔚蓝宫廷束腰衣", "clothing", "uncommon", "social-wear", 70, "An azure court tunic with gold embroidery and a hanging gem, prepared for social equipment, market trade, rewards, and item detail views.", "body", "蔚蓝宫廷束腰衣饰有金线和垂坠宝石，可用于社交装备、市场交易、奖励展示和物品详情。"],
  ["furred-warden-mantle", "Furred Warden Mantle", "毛领守卫披肩", "cloak", "rare", "survival", 145, "A heavy furred warden mantle with a round clasp, ready for cold-weather inventory gear, market appraisal, reward cards, and inspection.", "body", "厚重毛领守卫披肩扣着圆形徽章，适合寒地装备、市场估值、奖励卡和物品检查流程。"],
  ["crimson-sash-wrap", "Crimson Sash Wrap", "绯红礼仪腰披", "belt", "uncommon", "social-wear", 58, "A crimson ceremonial sash with gold trim and a jeweled clasp, suited for accessory rows, market goods, reward cards, and item detail screens.", "accessory", "绯红礼仪腰披有金边和宝石扣，可作为饰品行、市场货品、奖励卡和详情视图中的社交装备。"],
  ["moon-veil-hood", "Moon Veil Hood", "月幕兜帽", "hood", "rare", "ritual-wear", 125, "A white moon veil hood embroidered with crescent motifs, prepared for ritual wear, inventory equipment, market listings, rewards, and details.", "accessory", "白色月幕兜帽绣有新月纹样，适合作为仪式服饰进入装备、市场、奖励和详情流程。"],
  ["iron-buckled-boots", "Iron Buckled Boots", "铁扣长靴", "boots", "common", "travel-gear", 38, "A pair of roadworn leather boots with iron toe caps and buckles, ready for travel gear inventories, markets, rewards, and details.", "accessory", "这双旧皮长靴带铁包头和扣带，适合表现旅行装备、市场补给、奖励卡和物品详情。"],
  ["engraved-duelist-gloves", "Engraved Duelist Gloves", "铭纹决斗手套", "gloves", "uncommon", "dueling-gear", 64, "Dark duelist gloves with engraved silver bracers, prepared for accessory equipment, market appraisal, reward cards, and inspection views.", "accessory", "深色决斗手套连着银色铭纹护腕，可作为饰品装备、市场估价、奖励和检查视图资产。"],
  ["bone-toggle-jerkin", "Bone Toggle Jerkin", "骨扣短上衣", "clothing", "common", "travel-wear", 42, "A black travel jerkin fastened with bone toggles, suited for body-slot inventory gear, market stock, rewards, and item details.", "body", "黑色旅行短上衣以骨扣系紧，适合作为身体槽装备、市场库存、奖励和物品详情展示。"],
  ["apothecary-tool-belt", "Apothecary Tool Belt", "药剂师工具腰带", "belt", "uncommon", "utility", 72, "A dark apothecary belt with vials and pouches, ready for utility accessories, market trade, reward cards, and item inspection.", "accessory", "深色药剂师腰带挂满小瓶和皮袋，可作为实用饰品进入市场、奖励、背包和详情流程。"],
  ["verdant-laurel-circlet", "Verdant Laurel Circlet", "翠叶桂冠", "headgear", "rare", "nature-rite", 150, "A green laurel circlet woven with gold stems and emerald leaves, prepared for ritual accessories, market appraisal, rewards, and details.", "accessory", "翠叶桂冠由金枝和绿宝石叶片交织而成，适合仪式饰品、市场估值、奖励卡和物品详情。"],
  ["gilded-masquerade-mask", "Gilded Masquerade Mask", "鎏金化装面具", "mask", "rare", "social-wear", 135, "A black and gold masquerade mask with sharp filigree, suited for social accessories, market curios, reward cards, and item detail views.", "accessory", "黑金化装面具布满精细卷纹，适合社交饰品、市场奇物、奖励卡和详情视图。"],
  ["quilted-scout-cap", "Quilted Scout Cap", "绗缝斥候帽", "headgear", "common", "travel-gear", 32, "A quilted scout cap with tie cords and worn leather edging, ready for travel inventories, market supply, rewards, and item inspection.", "accessory", "绗缝斥候帽带系绳和磨旧皮边，可作为旅行补给、市场货品、奖励和详情资产。"],
  ["coin-charm-belt", "Coin Charm Belt", "钱币护符腰带", "belt", "uncommon", "merchant-wear", 54, "A blue leather belt hung with a coin charm, prepared for accessory equipment, market listings, reward cards, and item details.", "accessory", "蓝皮腰带垂着钱币护符，适合作为饰品装备、市场陈列、奖励卡和物品详情。"]
];

const sheet024Weapons = [
  ["verdant-leaf-saber", "Verdant Leaf Saber", "翠叶军刀", "saber", "rare", "melee-weapon", 160, "A leaf-shaped green saber with a gemmed guard, ready for weapon inventory rows, market appraisal, reward cards, and item details.", "mainHand", "翠叶形军刀配有镶宝护手，适合在武器背包、市场估价、奖励卡和物品详情中出现。"],
  ["runed-stone-maul", "Runed Stone Maul", "符文石槌", "maul", "rare", "melee-weapon", 175, "A square-headed stone maul etched with blue runes, prepared for heavy weapon rewards, markets, inventory equipment, and inspection.", "mainHand", "方头石槌刻着蓝色符文，可作为重型武器奖励、市场货品、装备行和详情检查资产。"],
  ["frostglass-dagger", "Frostglass Dagger", "霜玻短匕", "dagger", "rare", "melee-weapon", 130, "A jagged frostglass dagger with a cold blue grip, suited for weapon inventories, market curios, rewards, and item detail screens.", "mainHand", "锯齿状霜玻短匕带有冰蓝握柄，适合武器背包、市场奇物、奖励和详情视图。"],
  ["stormhook-rapier", "Stormhook Rapier", "风暴钩刺剑", "rapier", "rare", "dueling-weapon", 155, "A hooked blue rapier crackling like storm ice, ready for dueling weapon rows, market appraisal, reward cards, and details.", "mainHand", "钩形蓝色刺剑如风暴冰晶般闪光，可进入决斗武器、市场估值、奖励卡和详情流程。"],
  ["briar-thorn-bow", "Briar Thorn Bow", "荆棘短弓", "longbow", "uncommon", "ranged-weapon", 95, "A thorn-wrapped bow with a taut red string, prepared for ranged weapon inventory, market stock, reward cards, and inspection.", "mainHand", "荆棘缠绕的弓身配红色弓弦，适合作为远程武器背包、市场库存、奖励和检查资产。"],
  ["brass-repeater-crossbow", "Brass Repeater Crossbow", "黄铜连弩", "crossbow", "rare", "ranged-weapon", 180, "A brass repeater crossbow with layered limbs and a steel crank, suited for weapon rewards, markets, inventory rows, and item details.", "mainHand", "黄铜连弩有层叠弩臂和钢制曲柄，可用于武器奖励、市场交易、背包行和物品详情。"],
  ["glacier-crystal-spear", "Glacier Crystal Spear", "冰晶长矛", "spear", "rare", "reach-weapon", 150, "A spear tipped with blue glacier crystal and bronze prongs, ready for reach weapon inventory, market listings, rewards, and details.", "mainHand", "蓝色冰晶矛头由青铜爪托起，适合长柄武器背包、市场陈列、奖励卡和详情视图。"],
  ["oath-tower-shield", "Oath-Tower Shield", "誓塔盾", "shield", "rare", "defense", 165, "A black tower shield bearing a silver keep relief, prepared for off-hand equipment, market appraisal, reward cards, and inspection.", "offHand", "黑色塔盾浮雕着银色城堡，可作为副手防具进入装备、市场估价、奖励和检查流程。"],
  ["briar-lash-whip", "Briar Lash Whip", "荆棘鞭", "whip", "uncommon", "control-weapon", 88, "A coiled briar whip with thorny bark and a bronze loop, suited for control weapon rows, market goods, rewards, and details.", "mainHand", "卷起的荆棘鞭有刺状树皮和青铜环，适合控制型武器、市场货品、奖励卡和详情。"],
  ["ironstar-mace", "Ironstar Mace", "铁星钉锤", "mace", "uncommon", "melee-weapon", 92, "A spiked iron mace with a leather-wrapped haft, ready for melee inventory slots, market offers, reward cards, and item detail inspection.", "mainHand", "铁制钉锤带皮革缠柄，适合近战武器背包、市场报价、奖励卡和物品详情检查。"],
  ["twin-crescent-halberd", "Twin Crescent Halberd", "双月戟", "halberd", "rare", "reach-weapon", 170, "A twin crescent halberd with silver cutting hooks, prepared for reach weapon rewards, market appraisal, inventory rows, and details.", "mainHand", "双月形戟刃泛着银光，可作为长柄武器奖励、市场估价、背包行和详情资产。"],
  ["etched-war-axe", "Etched War Axe", "铭纹战斧", "axe", "uncommon", "melee-weapon", 105, "A dark war axe with etched runes and a wrapped haft, suited for weapon inventory, market stock, reward cards, and item details.", "mainHand", "深色战斧刻有符纹并缠着皮柄，适合武器背包、市场库存、奖励和详情视图。"],
  ["gilded-sun-buckler", "Gilded Sun Buckler", "鎏金日轮圆盾", "shield", "uncommon", "defense", 115, "A round gilded buckler with interlaced sunwork, ready for off-hand equipment, market listings, reward cards, and inspection.", "offHand", "鎏金圆盾有交织日轮纹样，可作为副手装备、市场陈列、奖励卡和检查视图。"],
  ["triple-throwing-knives", "Triple Throwing Knives", "三联飞刀", "dagger", "common", "thrown-weapon", 48, "A tied set of three throwing knives with broad silver tips, prepared for weapon inventory, market supply, rewards, and item details.", "mainHand", "三把宽尖飞刀被皮绳束在一起，适合作为武器背包、市场补给、奖励和详情资产。"],
  ["azure-rune-javelin", "Azure Rune Javelin", "蔚蓝符文标枪", "javelin", "uncommon", "thrown-weapon", 82, "A slim javelin marked with blue runes and a gold socket, suited for thrown weapon rows, market goods, reward cards, and details.", "mainHand", "细长标枪有蓝色符文和金色枪箍，适合投掷武器、市场货品、奖励卡和详情。"],
  ["ruby-crescent-scimitar", "Ruby Crescent Scimitar", "红宝弯刀", "scimitar", "rare", "melee-weapon", 150, "A crescent scimitar with gold filigree and a ruby guard, ready for melee inventory, market appraisal, reward cards, and inspection.", "mainHand", "新月弯刀嵌有红宝石护手和金色卷纹，可用于近战背包、市场估值、奖励卡和详情检查。"]
];

const sheet025Magic = [
  ["ember-seal-scroll", "Ember Seal Scroll", "余烬封蜡卷轴", "scroll", "common", "spell-scroll", 42, "A parchment scroll bound in red ribbon and stamped with an ember seal, prepared for inventory scrolls, markets, rewards, and details.", "consumable", "羊皮卷以红缎带和余烬封蜡束紧，适合作为卷轴物品进入背包、市场、奖励和详情流程。"],
  ["moonshadow-scroll", "Moonshadow Scroll", "月影卷轴", "scroll", "uncommon", "spell-scroll", 68, "A moon-marked scroll wrapped in purple thread, ready for arcane inventory rows, market curios, reward cards, and item details.", "consumable", "月印卷轴缠着紫色丝线，可作为奥术卷轴背包行、市场奇物、奖励卡和物品详情。"],
  ["verdant-mend-scroll", "Verdant Mend Scroll", "翠绿疗愈卷轴", "scroll", "uncommon", "spell-scroll", 66, "A green-ribbon healing scroll with a hand sigil, suited for restorative item flows, market listings, rewards, and inspection.", "consumable", "绿色缎带卷轴印有手形疗愈符号，适合恢复类物品、市场陈列、奖励和检查视图。"],
  ["warding-rune-tablet", "Warding Rune Tablet", "守护符文石板", "ward-stone", "rare", "abjuration-focus", 150, "A cracked stone tablet lit by a blue warding circle, prepared for protective magic items, markets, rewards, and details.", "accessory", "裂纹石板上亮着蓝色守护法阵，可作为防护魔法物品进入市场、奖励、背包和详情。"],
  ["astral-scrying-orb", "Astral Scrying Orb", "星界占卜水晶球", "focus", "rare", "divination-focus", 185, "A galaxy-filled crystal orb on a gold stand, ready for divination focus inventory, market appraisal, reward cards, and item details.", "accessory", "金座上的水晶球映着星云，适合作为占卜法器、市场估值、奖励卡和物品详情。"],
  ["cursed-obsidian-athame", "Cursed Obsidian Athame", "诅咒黑曜仪匕", "dagger", "rare", "occult-focus", 155, "A black ritual athame scored with red runes, suited for occult inventory gear, market curios, rewards, and inspection screens.", "mainHand", "黑曜仪式匕首刻着红色咒纹，适合秘仪装备、市场奇物、奖励和检查视图。"],
  ["silver-rite-bell", "Silver Rite Bell", "银制仪式铃", "focus", "uncommon", "ritual-focus", 76, "A silver ritual bell on a braided cord, prepared for focus items, market listings, reward cards, and item detail inspection.", "accessory", "银制仪式铃系在编绳上，可作为法器物品、市场陈列、奖励卡和详情检查资产。"],
  ["brass-star-astrolabe", "Brass Star Astrolabe", "黄铜星盘", "focus", "rare", "navigation-focus", 145, "A brass astrolabe with a dark star map face, ready for navigation focus inventory, market trade, rewards, and details.", "accessory", "黄铜星盘镶着深蓝星图面，适合导航法器背包、市场交易、奖励和详情。"],
  ["carved-rune-stones", "Carved Rune Stones", "刻纹符石", "component", "common", "ritual-component", 28, "A scatter of carved rune stones with old incised marks, suited for component stacks, market stock, reward cards, and inspection.", "component", "一组刻有古老线痕的符石，适合作为仪式材料堆叠、市场库存、奖励卡和详情检查。"],
  ["lotus-incense-burner", "Lotus Incense Burner", "莲座熏炉", "focus", "uncommon", "ritual-focus", 90, "A lotus incense burner giving off pale smoke, prepared for ritual focus items, market goods, reward cards, and item details.", "accessory", "莲花座熏炉吐出淡烟，可作为仪式法器、市场货品、奖励卡和物品详情。"],
  ["bottled-wisp-spirit", "Bottled Wisp Spirit", "瓶装幽魂", "reagent", "rare", "spirit-reagent", 170, "A sealed glass jar holding a pale wisp, ready for rare reagent inventory, market appraisal, reward cards, and details.", "reagent", "密封玻璃瓶中漂着苍白幽光，适合稀有试剂背包、市场估值、奖励卡和详情流程。"],
  ["crescent-moon-wand", "Crescent Moon Wand", "新月魔杖", "wand", "rare", "arcane-focus", 165, "A crescent moon wand set with purple stones, suited for arcane focus inventory, market curios, rewards, and item inspection.", "accessory", "新月魔杖镶着紫色宝石，可作为奥术法器、市场奇物、奖励和物品检查资产。"],
  ["sealed-ritual-formula", "Sealed Ritual Formula", "封缄仪式手稿", "document", "uncommon", "ritual-formula", 62, "A folded ritual formula tied with black ribbon and a red seal, prepared for inventory documents, markets, rewards, and details.", "document", "折起的仪式手稿以黑缎带和红蜡封住，适合作为文件物品、市场、奖励和详情资产。"],
  ["stormglass-amulet", "Stormglass Amulet", "风暴玻璃护符", "amulet", "rare", "charged-focus", 130, "A dark stormglass amulet crossed by blue lightning veins, ready for accessory inventory, market appraisal, reward cards, and item details.", "accessory", "深色风暴玻璃护符内有蓝色电纹，适合饰品背包、市场估值、奖励卡和物品详情。"],
  ["divining-hand-mirror", "Divining Hand Mirror", "占卜手镜", "focus", "rare", "divination-focus", 155, "A gold-framed hand mirror reflecting a misty mountain, suited for divination items, market curios, rewards, and inspection.", "accessory", "金框手镜映出雾中山影，适合作为占卜物品、市场奇物、奖励卡和检查视图。"],
  ["star-chart-card-deck", "Star-Chart Card Deck", "星图牌组", "deck", "uncommon", "divination-tool", 80, "A stacked star-chart card deck with gold compass lines, prepared for divination tools, market stock, reward cards, and details.", "tool", "厚叠星图牌组画着金色罗盘线，可作为占卜工具、市场库存、奖励卡和详情资产。"]
];

const sheet026TradeGoods = [
  ["lion-seal-wine-bottle", "Lion-Seal Wine Bottle", "狮纹封蜡酒", "drink", "uncommon", "luxury-food", 46, "A dark wine bottle tied with purple ribbon and a lion seal, prepared for tavern inventory, market trade, reward cards, and details.", "trade-good", "深色酒瓶系着紫缎和狮纹封牌，适合酒馆背包、市场交易、奖励卡和详情流程。"],
  ["road-cheese-basket", "Road Cheese Basket", "旅途奶酪篮", "food", "common", "provisions", 24, "A travel basket packed with bread, cheese, and sausage, ready for provision inventories, market stock, rewards, and item inspection.", "trade-good", "旅行篮装着面包、奶酪和香肠，可作为补给背包、市场库存、奖励和物品检查资产。"],
  ["savory-meat-pie", "Savory Meat Pie", "咸肉派", "food", "common", "tavern-food", 18, "A golden meat pie with a cut wedge and rich filling, suited for food inventory, market stalls, reward cards, and detail views.", "trade-good", "金黄肉派切开一角露出馅料，适合食物背包、市场摊位、奖励卡和详情视图。"],
  ["runed-ale-stein", "Runed Ale Stein", "符纹麦酒杯", "drink", "common", "tavern-drink", 16, "A dark metal ale stein overflowing with foam, prepared for tavern goods, market listings, rewards, and item details.", "trade-good", "深色金属麦酒杯溢出泡沫，适合作为酒馆货品、市场陈列、奖励和物品详情。"],
  ["washed-rind-cheese-wheel", "Washed-Rind Cheese Wheel", "洗皮奶酪轮", "food", "common", "provisions", 22, "A pale cheese wheel with a cut serving wedge, ready for food inventory stacks, market stock, reward cards, and inspection.", "trade-good", "浅色奶酪轮切出一块，可作为食物堆叠、市场库存、奖励卡和检查视图。"],
  ["phoenix-honey-sweets", "Phoenix Honey Sweets", "凤凰蜜糖", "food", "rare", "luxury-food", 92, "A golden bowl of honey sweets cradled by fiery feathers, suited for luxury market goods, rewards, inventory, and details.", "trade-good", "金碗中蜂蜜糖被火羽托起，适合奢侈市场货品、奖励、背包和详情资产。"],
  ["smoked-river-fish-bundle", "Smoked River Fish Bundle", "熏河鱼束", "food", "common", "provisions", 20, "A tied bundle of smoked river fish with bronze skins, prepared for provision inventory, market barter, reward cards, and item details.", "trade-good", "一束熏河鱼泛着铜色鱼皮，可作为补给背包、市场易货、奖励卡和物品详情。"],
  ["engraved-copper-tray", "Engraved Copper Tray", "铭花铜托盘", "tableware", "uncommon", "household-luxury", 58, "An engraved copper serving tray with ornate handles, ready for household valuables, market listings, reward cards, and inspection.", "trade-good", "铭花铜托盘配有装饰手柄，适合作为家用贵物、市场陈列、奖励和检查资产。"],
  ["purple-spice-purse", "Purple Spice Purse", "紫色香料袋", "spice", "uncommon", "trade-good", 64, "A purple spice purse stuffed with fragrant herbs and red berries, suited for trade inventory, market goods, rewards, and details.", "trade-good", "紫色香料袋塞满香草和红浆果，适合贸易背包、市场货品、奖励卡和详情流程。"],
  ["merchant-assay-chest", "Merchant Assay Chest", "商人鉴定箱", "tool", "rare", "merchant-tool", 135, "A wooden assay chest holding weights, seals, and a small mallet, prepared for merchant tools, market appraisal, rewards, and item details.", "trade-good", "木制鉴定箱内放着砝码、印章和小槌，适合作为商人工具、市场估价、奖励和详情资产。"],
  ["gilded-portrait-miniature", "Gilded Portrait Miniature", "镀金肖像小画", "valuable", "rare", "art-object", 160, "A small gilded portrait of a noble sitter, ready for valuable inventory rows, market appraisal, reward cards, and inspection.", "trade-good", "镀金小肖像描绘一位贵族人物，适合作为贵重背包物、市场估值、奖励卡和检查视图。"],
  ["silver-dining-set", "Silver Dining Set", "银质餐具组", "tableware", "uncommon", "household-luxury", 72, "A fork, knife, and spoon set with pearl handles, suited for luxury trade goods, market stock, rewards, and item details.", "trade-good", "珍珠柄刀叉匙成套摆放，适合作为奢侈贸易品、市场库存、奖励和物品详情。"],
  ["brocade-cloth-bolt", "Brocade Cloth Bolt", "锦缎布卷", "textile", "uncommon", "trade-good", 86, "A folded bolt of red and purple brocade cloth, prepared for textile inventory, market trade, reward cards, and detail views.", "trade-good", "红紫锦缎布卷折叠成摞，可作为纺织品背包、市场交易、奖励卡和详情资产。"],
  ["sealed-tea-brick", "Sealed Tea Brick", "封缄茶砖", "trade-good", "common", "provisions", 34, "A dark tea brick wrapped in paper and red wax, ready for trade inventory, market barter, reward cards, and inspection.", "trade-good", "深色茶砖以纸带和红蜡封住，适合贸易背包、市场易货、奖励卡和检查视图。"],
  ["pearwood-lute", "Pearwood Lute", "梨木鲁特琴", "instrument", "uncommon", "performance", 100, "A polished pearwood lute with ornate inlay, suited for instrument inventory, market listings, reward cards, and item details.", "accessory", "抛光梨木鲁特琴嵌有装饰纹样，适合作为乐器背包、市场陈列、奖励和物品详情。"],
  ["carved-dice-cup", "Carved Dice Cup", "雕纹骰盅", "game-set", "common", "tavern-game", 28, "A carved dice cup spilling colored dice onto the table, prepared for tavern goods, market stock, reward cards, and details.", "trade-good", "雕纹骰盅倒出彩色骰子，可作为酒馆物品、市场库存、奖励卡和详情资产。"]
];

function mainPlans(manifest) {
  return [
    cutoutPlan({
      id: "aidm-transparent-cutouts-sheet-020",
      metadataPlanId: "sheet-020-transparent-cutouts",
      promptId: "transparent-cutouts-020",
      name: "AIDM Transparent Cutouts Sheet 020",
      expectedFile: "assets/generated/sheets/aidm-transparent-cutouts-sheet-020.png",
      expectedPrefix: "aidm-transparent-cutout-020",
      taxonomyBranch: "items.crafting-materials.alchemical-reagents.sheet-020",
      runtimePurpose: "Crafting materials and alchemical reagent cutouts for data-backed item flows.",
      semanticSuffix: ".cutout.v01",
      tags: ["generated-rewards", "crafting-materials", "alchemical-reagents", "sheet-020", "transparent-cutout"],
      entries: sheet020Reagents
    }),
    cutoutPlan({
      id: "aidm-tools-cutouts-sheet-021",
      metadataPlanId: "sheet-021-tools-cutouts",
      promptId: "tools-cutouts-021",
      name: "AIDM Tools Cutouts Sheet 021",
      expectedFile: "assets/generated/sheets/aidm-tools-cutouts-sheet-021.png",
      expectedPrefix: "aidm-tool-cutout-021",
      taxonomyBranch: "items.tools-traps-gadgets.sheet-021",
      runtimePurpose: "Tools, traps, and gadgets for inventory, market, reward, and item detail flows.",
      semanticSuffix: ".cutout.v01",
      tags: ["generated-rewards", "tools", "traps", "gadgets", "sheet-021", "transparent-cutout"],
      entries: sheet021Tools
    }),
    cutoutPlan({
      id: "aidm-trophies-cutouts-sheet-022",
      metadataPlanId: "sheet-022-trophies-cutouts",
      promptId: "trophies-cutouts-022",
      name: "AIDM Trophies Cutouts Sheet 022",
      expectedFile: "assets/generated/sheets/aidm-trophies-cutouts-sheet-022.png",
      expectedPrefix: "aidm-trophy-cutout-022",
      taxonomyBranch: "items.trophies-monster-parts-barter.sheet-022",
      runtimePurpose: "Trophies, monster parts, and barter goods for data-backed item flows.",
      semanticSuffix: ".cutout.v01",
      tags: ["generated-rewards", "trophies", "monster-parts", "barter-goods", "sheet-022", "transparent-cutout"],
      entries: sheet022Trophies
    }),
    cutoutPlan({
      id: "aidm-wearables-cutouts-sheet-023",
      metadataPlanId: "sheet-023-wearables-cutouts",
      promptId: "wearables-cutouts-023",
      name: "AIDM Wearables Cutouts Sheet 023",
      expectedFile: "assets/generated/sheets/aidm-wearables-cutouts-sheet-023.png",
      expectedPrefix: "aidm-wearable-cutout-023",
      taxonomyBranch: "items.wearables.armor-clothing-accessories.sheet-023",
      runtimePurpose: "Wearable armor, clothing, cloaks, belts, masks, gloves, and travel gear for item-backed runtime flows.",
      semanticSuffix: ".cutout.v01",
      tags: ["generated-rewards", "wearables", "armor", "clothing", "accessories", "sheet-023", "transparent-cutout"],
      entries: sheet023Wearables
    }),
    cutoutPlan({
      id: "aidm-weapons-cutouts-sheet-024",
      metadataPlanId: "sheet-024-weapons-cutouts",
      promptId: "weapons-cutouts-024",
      name: "AIDM Weapons Cutouts Sheet 024",
      expectedFile: "assets/generated/sheets/aidm-weapons-cutouts-sheet-024.png",
      expectedPrefix: "aidm-weapon-cutout-024",
      taxonomyBranch: "items.weapons.shields-melee-ranged.sheet-024",
      runtimePurpose: "Weapon and shield cutouts for inventory, market, reward, and item detail flows.",
      semanticSuffix: ".cutout.v01",
      tags: ["generated-rewards", "weapons", "shields", "melee", "ranged", "sheet-024", "transparent-cutout"],
      entries: sheet024Weapons
    }),
    cutoutPlan({
      id: "aidm-magic-cutouts-sheet-025",
      metadataPlanId: "sheet-025-magic-cutouts",
      promptId: "magic-cutouts-025",
      name: "AIDM Magic Cutouts Sheet 025",
      expectedFile: "assets/generated/sheets/aidm-magic-cutouts-sheet-025.png",
      expectedPrefix: "aidm-magic-cutout-025",
      taxonomyBranch: "items.magic.scrolls-focuses-reagents.sheet-025",
      runtimePurpose: "Magic scrolls, ritual focuses, reagents, and divination tools for item-backed runtime flows.",
      semanticSuffix: ".cutout.v01",
      tags: ["generated-rewards", "magic-items", "scrolls", "focuses", "ritual-tools", "sheet-025", "transparent-cutout"],
      entries: sheet025Magic
    }),
    cutoutPlan({
      id: "aidm-trade-cutouts-sheet-026",
      metadataPlanId: "sheet-026-trade-cutouts",
      promptId: "trade-cutouts-026",
      name: "AIDM Trade Cutouts Sheet 026",
      expectedFile: "assets/generated/sheets/aidm-trade-cutouts-sheet-026.png",
      expectedPrefix: "aidm-trade-cutout-026",
      taxonomyBranch: "items.trade-goods.food-luxury-barter.sheet-026",
      runtimePurpose: "Food, drink, luxury trade goods, tools, instruments, and tavern props for item-backed economy flows.",
      semanticSuffix: ".cutout.v01",
      tags: ["generated-rewards", "trade-goods", "food", "drink", "luxury-goods", "sheet-026", "transparent-cutout"],
      entries: sheet026TradeGoods
    }),
    ...scenePlansFromRegisteredAssets(manifest)
  ];
}

function cutoutPlan(options) {
  const frameTemplates = options.entries.map((entry, index) => {
    const [slug, name, zh, itemKind, rarity, economyRole, valueGp, descriptionEn, itemSlot, descriptionZh] = entry;
    const id = frameId(options.expectedPrefix, index);
    return {
      index: index + 1,
      id,
      name,
      type: "raster-icon",
      displayName: { en: name, zh },
      description: {
        en: descriptionEn,
        zh: descriptionZh || `${zh}适合在背包、市场、奖励卡和物品详情中作为数据绑定物品资产出现。`
      },
      semanticKey: `items.${itemKind}.${slug}${options.semanticSuffix}`,
      variantOf: slug,
      variantAxes: {
        culture: "gaslamp-fantasy",
        itemKind,
        rarity,
        economyRole,
        visualStyle: "transparent-cutout"
      },
      gameplay: {
        usable: itemKind === "consumable" || itemKind === "reagent",
        rulesId: slug,
        slot: itemSlot || itemKind,
        valueGp,
        tags: ["market-item", itemKind, slug, "cutout"]
      },
      gameplayBinding: {
        flow: itemFlow,
        itemKind,
        ...(itemSlot ? { itemSlot } : {}),
        economyRole,
        requiresItemDefinition: true,
        marketEligible: true
      },
      quality: qualityApproved,
      uiSurface: itemSurfaces,
      visibility: "player-safe",
      tags: [itemKind, slug, ...options.tags.filter((tag) => tag !== "generated-rewards")]
    };
  });

  return {
    id: options.id,
    metadataPlanId: options.metadataPlanId,
    promptId: options.promptId,
    status: "metadata-ready-for-ingest",
    name: options.name,
    categoryId: "equipment",
    group: "generated-rewards",
    assetType: "raster-sheet",
    expectedFile: options.expectedFile,
    expectedOutDir: "assets/generated/items",
    expectedPrefix: options.expectedPrefix,
    expectedGrid: { columns: 4, rows: 4 },
    transparency: "#00ff00 chroma-key",
    ingestOptions: ["--chroma-key"],
    classification: {
      taxonomyBranch: options.taxonomyBranch,
      runtimePurpose: options.runtimePurpose,
      notForSurfaces: ["character-builder", "party-avatar", "player-detail", "stage-backdrop", "relevant-scene", "catalog-internal"]
    },
    namingRules: {
      sheetId: options.id,
      frameIdPattern: `${options.expectedPrefix}-##`,
      semanticKeyPattern: `items.<item-kind>.<base-item>${options.semanticSuffix}`,
      variantOfRule: "Use the base item name without sheet number or visual-only adjectives."
    },
    metadataTemplate: {
      visibility: "player-safe",
      uiSurface: itemSurfaces,
      tags: options.tags,
      qualityDefaults: qualityApproved,
      alphaGate: {
        required: true,
        pngColorType: 6,
        bitDepth: 8,
        requiresTransparentPixels: true,
        requiresOpaquePixels: true
      },
      approvalRules: {
        playerSafeVisibility: "Only frames covered by reviewed frame metadata may use player-safe surfaces; generated art remains data-backed runtime art, not a browsable catalog.",
        allowedPlayerSurfaces: itemSurfaces,
        requiredFields: [
          "displayName.en",
          "displayName.zh",
          "description.en",
          "description.zh",
          "semanticKey",
          "variantOf",
          "variantAxes.itemKind",
          "variantAxes.rarity",
          "gameplay.valueGp",
          "gameplayBinding.flow",
          "gameplayBinding.itemKind",
          "gameplayBinding.economyRole",
          "gameplayBinding.requiresItemDefinition"
        ]
      },
      frameTemplatePattern: {
        frameCount: 16,
        idPattern: `${options.expectedPrefix}-##`,
        semanticKeyPattern: `items.<item-kind>.<base-item>${options.semanticSuffix}`,
        requiredTags: ["transparent-cutout", options.tags.find((tag) => tag.startsWith("sheet-"))],
        requiredVariantAxes: ["culture", "itemKind", "rarity", "economyRole", "visualStyle"],
        requiredGameplayBinding: {
          flow: itemFlow,
          requiresItemDefinition: true
        }
      },
      frameTemplates
    }
  };
}

function scenePlansFromRegisteredAssets(manifest) {
  return [
    scenePlanFromRegisteredAssets(manifest, {
      id: "aidm-production-scenes-sheet-027",
      metadataPlanId: "sheet-027-production-scenes",
      promptId: "production-scenes-027",
      name: "AIDM Production Scenes Sheet 027",
      expectedFile: "assets/generated/sheets/aidm-production-scenes-sheet-027.png",
      expectedPrefix: "aidm-production-scene-027",
      sceneKind: "production",
      sheetTag: "sheet-027",
      taxonomyBranch: "scenes.production.grand-backdrops.sheet-027",
      runtimePurpose: "Production-scale social, wilderness, dungeon, and war-camp backdrops for stage and relevant scene selection."
    }),
    scenePlanFromRegisteredAssets(manifest, {
      id: "aidm-weather-scenes-sheet-028",
      metadataPlanId: "sheet-028-weather-scenes",
      promptId: "weather-scenes-028",
      name: "AIDM Weather Scenes Sheet 028",
      expectedFile: "assets/generated/sheets/aidm-weather-scenes-sheet-028.png",
      expectedPrefix: "aidm-weather-scene-028",
      sceneKind: "weather",
      sheetTag: "sheet-028",
      taxonomyBranch: "scenes.weather.environmental-backdrops.sheet-028",
      runtimePurpose: "Weather, time-of-day, threat, and soundscape backdrops for stage and relevant scene selection."
    })
  ].filter(Boolean);
}

function scenePlanFromRegisteredAssets(manifest, options) {
  const existingPlan = (manifest.plannedSheets || []).find((entry) => {
    return entry.metadataPlanId === options.metadataPlanId || entry.id === options.id;
  });
  const assets = (manifest.rasterAssets || [])
    .filter((asset) => asset.sheetId === options.id)
    .sort((left, right) => left.index - right.index);

  if (assets.length === 0) {
    return existingPlan || null;
  }

  if (assets.length !== 16) {
    throw new Error(`${options.metadataPlanId} must mirror 16 reviewed scene assets before plan registration`);
  }

  const frameTemplates = assets.map((asset, index) => {
    const id = frameId(options.expectedPrefix, index);
    const sceneSlug = asset.sceneSlug;
    return {
      index: index + 1,
      id,
      name: asset.name,
      zhName: asset.zhName || asset.displayName?.zh,
      type: "scene-backdrop",
      displayName: {
        en: asset.displayName?.en || asset.name,
        zh: asset.displayName?.zh || asset.zhName
      },
      description: asset.description,
      semanticKey: asset.semanticKey || `scene.${options.sceneKind}.${sceneSlug}.v01`,
      variantOf: sceneSlug,
      variantAxes: asset.variantAxes || {
        sceneFamily: options.sceneKind,
        location: sceneSlug,
        weather: asset.weather,
        timeOfDay: asset.timeOfDay,
        mood: asset.mood,
        threatLevel: asset.threatLevel,
        visualScale: asset.taxonomy?.scale
      },
      sceneSlug,
      taxonomy: asset.taxonomy,
      soundscapeHints: asset.soundscapeHints,
      mood: asset.mood,
      timeOfDay: asset.timeOfDay,
      weather: asset.weather,
      threatLevel: asset.threatLevel,
      narrativeUses: asset.narrativeUses || ["stage-backdrop", "relevant-scene", "exploration", "encounter-setup"],
      quality: qualityApproved,
      uiSurface: sceneSurfaces,
      visibility: "player-safe",
      tags: dedupe([
        ...(asset.tags || []),
        "generated-scenes",
        "stage-backdrop",
        "relevant-scene",
        options.sheetTag
      ])
    };
  });

  return {
    id: options.id,
    metadataPlanId: options.metadataPlanId,
    promptId: options.promptId,
    status: "metadata-ready-for-ingest",
    name: options.name,
    categoryId: "scenes",
    group: "generated-scenes",
    assetType: "raster-sheet",
    expectedFile: options.expectedFile,
    expectedOutDir: "assets/generated/scenes",
    expectedPrefix: options.expectedPrefix,
    expectedGrid: { columns: 4, rows: 4 },
    transparency: "full-bleed painted scene",
    ingestOptions: ["--preserve-tile"],
    classification: {
      taxonomyBranch: options.taxonomyBranch,
      runtimePurpose: options.runtimePurpose,
      notForSurfaces: ["catalog-internal", "inventory-item", "market-item", "reward-card", "item-detail", "character-builder", "party-avatar", "player-detail"]
    },
    namingRules: {
      sheetId: options.id,
      frameIdPattern: `${options.expectedPrefix}-##`,
      semanticKeyPattern: `scene.${options.sceneKind}.<scene-slug>.v01`,
      variantOfRule: "Use the stable sceneSlug that names the location, weather, and narrative stage role."
    },
    metadataTemplate: {
      visibility: "player-safe",
      uiSurface: sceneSurfaces,
      tags: ["generated-scenes", "stage-backdrop", "relevant-scene", options.sheetTag],
      qualityDefaults: qualityApproved,
      approvalRules: {
        playerSafeVisibility: "Only reviewed scene frames may use stage-backdrop and relevant-scene surfaces; generated scenes remain selected by current gameplay state, never browsed as a gallery.",
        allowedPlayerSurfaces: sceneSurfaces,
        requiredFields: [
          "displayName.en",
          "displayName.zh",
          "zhName",
          "description",
          "semanticKey",
          "sceneSlug",
          "taxonomy",
          "weather",
          "timeOfDay",
          "mood",
          "threatLevel",
          "soundscapeHints",
          "narrativeUses"
        ]
      },
      frameTemplatePattern: {
        frameCount: 16,
        idPattern: `${options.expectedPrefix}-##`,
        semanticKeyPattern: `scene.${options.sceneKind}.<scene-slug>.v01`,
        requiredTags: ["stage-backdrop", "relevant-scene", options.sheetTag],
        requiredVariantAxes: ["sceneFamily", "location", "weather", "timeOfDay", "mood", "threatLevel", "visualScale"],
        requiredSceneFields: ["sceneSlug", "taxonomy", "soundscapeHints", "narrativeUses"]
      },
      frameTemplates
    }
  };
}

function frameId(prefix, zeroBasedIndex) {
  return `${prefix}-${String(zeroBasedIndex + 1).padStart(2, "0")}`;
}

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function upsertByMetadataPlanId(plannedSheets, plan) {
  const index = plannedSheets.findIndex((entry) => entry.metadataPlanId === plan.metadataPlanId || entry.id === plan.id);
  if (index === -1) {
    plannedSheets.push(plan);
    return;
  }
  plannedSheets[index] = plan;
}

function removeRetiredPlans(plannedSheets) {
  const retired = new Set(["sheet-021-encounter-scenes", "sheet-022-reward-relics"]);
  return plannedSheets.filter((entry) => !retired.has(entry.metadataPlanId));
}

function validatePlan(plan) {
  const frames = plan.metadataTemplate?.frameTemplates || [];
  if (frames.length !== plan.expectedGrid.columns * plan.expectedGrid.rows) {
    throw new Error(`${plan.metadataPlanId} must define one frame template per grid cell`);
  }
  for (const frame of frames) {
    if (!frame.displayName?.en || !frame.displayName?.zh) {
      throw new Error(`${frame.id} must include bilingual displayName labels`);
    }
    if (!frame.description || !frame.semanticKey || !frame.variantOf || !frame.tags?.length) {
      throw new Error(`${frame.id} must include descriptions, semanticKey, variantOf, and tags`);
    }
    if (plan.categoryId === "scenes") {
      if (typeof frame.description !== "string" || frame.description.split(/\s+/).filter(Boolean).length < 16) {
        throw new Error(`${frame.id} must include an immersive scene description`);
      }
      if (!frame.zhName || !frame.sceneSlug || !frame.taxonomy || !frame.weather || !frame.timeOfDay || !frame.mood || !frame.threatLevel) {
        throw new Error(`${frame.id} must include sceneSlug, zhName, taxonomy, weather, time, mood, and threat metadata`);
      }
      if (!Array.isArray(frame.soundscapeHints) || frame.soundscapeHints.length < 3 || !Array.isArray(frame.narrativeUses) || frame.narrativeUses.length < 2) {
        throw new Error(`${frame.id} must include soundscape hints and narrative uses`);
      }
      continue;
    }
    if (!frame.description?.en || !frame.description?.zh) {
      throw new Error(`${frame.id} must include localized descriptions`);
    }
    if (!frame.variantAxes?.rarity || typeof frame.gameplay?.valueGp !== "number") {
      throw new Error(`${frame.id} must include rarity and numeric valueGp metadata`);
    }
  }
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.plannedSheets = removeRetiredPlans(manifest.plannedSheets || []);

  const plans = mainPlans(manifest);
  for (const plan of plans) {
    validatePlan(plan);
    upsertByMetadataPlanId(manifest.plannedSheets, plan);
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    ok: true,
    plannedSheets: manifest.plannedSheets.length,
    upserted: plans.map((plan) => plan.metadataPlanId)
  }, null, 2));
}

await main();
