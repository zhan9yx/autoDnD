#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";

const legacyTopics = [
  ["ledger", "Mara", "silver ledger", "west archive stair", "Magistrate Cale"],
  ["moonsigil", "Reliquary", "moon-shaped sigil", "silver dust", "one minute"],
  ["fenmarble", "Fen", "blue glass marble", "sister Iva", "Dock Seven"],
  ["juno", "Juno", "debtor prison brother", "stolen page", "Cale leverage"],
  ["choir", "Brass Choir", "coded hymns", "pipe organ", "punishment bell"],
  ["orin", "Captain Orin", "black needle tea", "ashroot antidote", "Dock Seven"],
  ["housevale", "House Vale", "signet", "courthouse tunnels", "masked duelist"],
  ["cistern", "cistern shrine", "bronze bell", "spoken oaths", "hidden lift"],
  ["crow", "crow familiar", "Bellmaker Alley", "witness", "roof trail"],
  ["guard", "green lacquered masks", "hooked sabers", "private guard", "morale"],
  ["umbrella", "red umbrella", "Iva", "rain market", "Dock Seven"],
  ["organ", "pipe organ", "broken organ key", "moon sigil", "courthouse basement"],
  ["apothecary", "old apothecary", "ashroot stock", "poison cure", "one vial"],
  ["bell", "cracked bronze bell", "oath amplification", "cistern water", "salt flame"],
  ["roof", "archive roof", "muddy bootprints", "Bellmaker Alley", "storm drain"],
  ["vale", "House Vale", "old treaty", "safe passage", "duelist mercy"],
  ["cale", "Magistrate Cale", "archive fire", "dawn deadline", "payment records"],
  ["mara", "Mara", "fear of bells", "Brass Choir conditioning", "punishment hymn"],
  ["lift", "hidden lift", "west stairs", "cistern shrine", "stolen page"],
  ["needle", "black needle tea", "import crate", "Dock Seven", "poison needle"]
];

const longMemoryConfig = {
  version: "16h-v1",
  gate: "long-memory-16h",
  sessionBlockCount: 16,
  queriesPerBlock: 16,
  expectedEventsPerQuery: 5,
  thresholds: {
    minRecallAt5: 0.92,
    minMeanReciprocalRank: 0.85
  }
};

await mkdir("evals/long-memory", { recursive: true });
await writeLegacyDataset("v1", legacyTopics, 120, 20, { minRecallAt5: 0.85, minMeanReciprocalRank: 0.7 });
await writeLegacyDataset("v2", expandLegacyTopics(legacyTopics, 50), 500, 50, {
  minRecallAt5: 0.9,
  minMeanReciprocalRank: 0.75
});
await writeLongMemoryDataset(longMemoryConfig);

async function writeLegacyDataset(version, topicList, minimumEventTarget, queryTarget, threshold) {
  const events = [];
  const queries = [];
  let eventNumber = 1;

  for (const [topic, actor, object, place, consequence] of topicList.slice(0, queryTarget)) {
    const ids = [];
    ids.push(
      addEvent(`${actor} revealed that the ${object} is tied to ${place}, and this fact matters because of ${consequence}.`)
    );
    ids.push(addEvent(`During a later scene, the party confirmed ${actor}'s clue: ${object} should be checked at ${place}.`));
    ids.push(
      addEvent(
        `A contradiction was resolved at ${place} when ${actor} explained that ${consequence} changes how the party should handle ${object}.`
      )
    );
    ids.push(addEvent(`Status update ${topic}: ${actor} still treats ${object} as relevant only when the party reaches ${place}.`));
    ids.push(addEvent(`Cross-session summary ${topic}: remember ${actor}, ${object}, ${place}, and the consequence ${consequence}.`));
    queries.push({
      id: `Q${String(queries.length + 1).padStart(3, "0")}`,
      query: `What should we remember about ${actor} and ${object} at ${place}?`,
      expectedEventIds: ids
    });
    addEvent(`Unrelated weather note ${topic}: rain hammered copper roofs while a merchant discussed bread prices.`);
    addEvent(`Unrelated tavern note ${topic}: a singer forgot a lyric about summer roads and green apples.`);
    addEvent(`Unrelated training note ${topic}: practice targets were repaired with cheap rope and old nails.`);
    addEvent(`干扰记录 ${topic}: 夜市账本写着灯油价格、桥税和旅店押金，没有核心线索。`);
    addEvent(`False lead ${topic}: a rumor used the wrong place name and pointed the party elsewhere.`);
  }

  while (events.length < minimumEventTarget) {
    addEvent(
      `General distractor ${events.length}: the city changed watch rotations, market taxes, lantern oil prices, and ferry schedules.`
    );
  }

  await writeJson(`evals/long-memory/campaign-history-${version}.json`, {
    name: `Rain Archive long memory benchmark ${version}`,
    version,
    description: `Reusable benchmark with ${events.length} events and ${queries.length} queries for long-history retrieval.`,
    events,
    queries,
    threshold
  });

  function addEvent(text) {
    const id = `E${String(eventNumber).padStart(3, "0")}`;
    eventNumber += 1;
    events.push({ id, text });
    return id;
  }
}

async function writeLongMemoryDataset(config) {
  const events = [];
  const queries = [];
  const sessionBlocks = [];
  let eventNumber = 1;

  for (let blockIndex = 0; blockIndex < config.sessionBlockCount; blockIndex += 1) {
    const hour = blockIndex + 1;
    const sessionBlockId = `H${String(hour).padStart(2, "0")}`;
    const blockStartEventNumber = eventNumber;
    const blockQueryIds = [];
    const focus = hourFocus(blockIndex);

    addEvent({
      sessionBlockId,
      text: `${sessionBlockId} session open: the table begins hour ${hour} around ${focus.place}, tracking rumors about ${focus.theme}.`
    });
    addEvent({
      sessionBlockId,
      text: `${sessionBlockId} recap ledger: prior promises, inventory, wounds, and travel clocks are reviewed before new scenes begin.`
    });

    for (let topicIndex = 0; topicIndex < config.queriesPerBlock; topicIndex += 1) {
      const topic = buildLongMemoryTopic(blockIndex, topicIndex);
      const expectedEventIds = [];
      const eventPayloads = [
        `${sessionBlockId} anchor ${topic.caseCode}: ${topic.actor} ties the ${topic.object} to ${topic.place} because of ${topic.consequence}.`,
        `${sessionBlockId} detail ${topic.caseCode}: the table records ${topic.actor}, ${topic.object}, ${topic.place}, and ${topic.consequence} as the canonical version.`,
        `${sessionBlockId} consequence ${topic.caseCode}: if the party ignores ${topic.object}, ${topic.consequence} will alter the next clock at ${topic.place}.`,
        `${sessionBlockId} contradiction ${topic.caseCode}: a false rumor is rejected after ${topic.actor} repeats the ${topic.place} clue.`,
        `${sessionBlockId} carryover ${topic.caseCode}: future sessions should remember ${topic.actor}'s ${topic.object} clue and ${topic.consequence}.`
      ];

      for (const text of eventPayloads) {
        expectedEventIds.push(addEvent({ sessionBlockId, topicId: topic.topicId, text }));
      }

      const queryId = `Q${String(queries.length + 1).padStart(4, "0")}`;
      queries.push({
        id: queryId,
        sessionBlockId,
        topicId: topic.topicId,
        query: `For ${sessionBlockId} case ${topic.caseCode}, what matters about ${topic.actor}, ${topic.object}, ${topic.place}, and ${topic.consequence}?`,
        expectedEventIds
      });
      blockQueryIds.push(queryId);

      addEvent({
        sessionBlockId,
        topicId: topic.topicId,
        text: `${sessionBlockId} background ${topic.topicId}: rain slicks the cobbles while vendors argue over ferry tokens and candle wax.`
      });
      addEvent({
        sessionBlockId,
        topicId: topic.topicId,
        text: `${sessionBlockId} combat color ${topic.topicId}: a minion misses, a lantern swings, and the initiative order stays unchanged.`
      });
      addEvent({
        sessionBlockId,
        topicId: topic.topicId,
        text: `${sessionBlockId} false lead ${topic.topicId}: a passerby names ${wrongPlace(blockIndex, topicIndex)} but offers no reliable memory hook.`
      });
    }

    addEvent({
      sessionBlockId,
      text: `${sessionBlockId} session close: the party spends downtime, updates supply counts, and saves unresolved clues for the next hour.`
    });
    addEvent({
      sessionBlockId,
      text: `${sessionBlockId} GM note: unresolved tension remains in ${focus.place}, but only tagged case notes should answer memory queries.`
    });

    sessionBlocks.push({
      id: sessionBlockId,
      hour,
      focus: focus.theme,
      startEventId: formatLongEventId(blockStartEventNumber),
      endEventId: formatLongEventId(eventNumber - 1),
      queryIds: blockQueryIds
    });
  }

  await writeJson("evals/long-memory/campaign-history-16h.json", {
    name: "Rain Archive 16-hour long memory benchmark",
    version: config.version,
    gate: config.gate,
    description:
      "Reusable 16 session/hour block benchmark for tabletop-scale long-memory retrieval with thousands of events and hundreds of queries.",
    profile: {
      scenario: "16-hour campaign history",
      sessionBlockCount: config.sessionBlockCount,
      queriesPerBlock: config.queriesPerBlock,
      expectedEventsPerQuery: config.expectedEventsPerQuery
    },
    sessionBlocks,
    events,
    queries,
    threshold: config.thresholds
  });

  function addEvent({ sessionBlockId, topicId = null, text }) {
    const id = formatLongEventId(eventNumber);
    eventNumber += 1;
    events.push({
      id,
      sessionBlockId,
      topicId,
      text
    });
    return id;
  }
}

function buildLongMemoryTopic(blockIndex, topicIndex) {
  const people = [
    "Selene",
    "Ivo",
    "Nara",
    "Tamsin",
    "Kade",
    "Rhea",
    "Osric",
    "Vey",
    "Milo",
    "Tala",
    "Bryn",
    "Elian",
    "Corra",
    "Dax",
    "Liora",
    "Ren"
  ];
  const objects = [
    "amber warrant",
    "glass dagger",
    "coded receipt",
    "storm map",
    "brass vial",
    "witness coin",
    "ivory mask",
    "sealed oath",
    "black ribbon",
    "iron key",
    "mirror token",
    "ash compass",
    "silver spool",
    "velvet writ",
    "cinder charm",
    "moon ledger"
  ];
  const places = [
    "Glass Market",
    "Breaker Tunnel",
    "Velvet Theater",
    "Observatory Roof",
    "North Lock",
    "Salt Chapel",
    "Rail Yard",
    "Lantern Bridge",
    "Old Mint",
    "Cinder Court",
    "Rain Archive",
    "Dock Seven",
    "Bellmaker Alley",
    "Cistern Shrine",
    "Copper Kettle",
    "Old Courthouse"
  ];
  const consequences = [
    "missing witness",
    "false confession",
    "dawn arrest",
    "poison cure",
    "safe passage",
    "hidden patron",
    "debt ledger",
    "stolen relic",
    "silent alarm",
    "sealed exit",
    "broken oath",
    "jury bribe",
    "lost heir",
    "flooded vault",
    "mask bargain",
    "bell curse"
  ];

  const index = blockIndex * 16 + topicIndex;
  const suffix = `${String(blockIndex + 1).padStart(2, "0")}${String(topicIndex + 1).padStart(2, "0")}`;
  return {
    topicId: `T${suffix}`,
    caseCode: `RX${suffix}`,
    actor: `${people[(index + blockIndex) % people.length]}${suffix}`,
    object: `${objects[(index + topicIndex) % objects.length]} ${suffix}`,
    place: `${places[(index + blockIndex + topicIndex) % places.length]} ${suffix}`,
    consequence: `${consequences[(index + blockIndex * 3) % consequences.length]} ${suffix}`
  };
}

function hourFocus(blockIndex) {
  const focus = [
    ["Rain Archive", "burned evidence"],
    ["Glass Market", "coded purchases"],
    ["Dock Seven", "poisoned cargo"],
    ["Bellmaker Alley", "witness routes"],
    ["Old Courthouse", "sealed warrants"],
    ["Cistern Shrine", "oath bells"],
    ["Velvet Theater", "masked patrons"],
    ["Breaker Tunnel", "escape clocks"],
    ["Observatory Roof", "storm omens"],
    ["Rail Yard", "prison transfers"],
    ["Copper Kettle", "safehouse debts"],
    ["Lantern Bridge", "ambush signals"],
    ["Old Mint", "counterfeit writs"],
    ["North Lock", "canal sabotage"],
    ["Salt Chapel", "mercy bargains"],
    ["Cinder Court", "final testimony"]
  ];
  const [place, theme] = focus[blockIndex % focus.length];
  return { place, theme };
}

function wrongPlace(blockIndex, topicIndex) {
  const places = ["Sunken Plaza", "Blue Orchard", "West Quarry", "Ash Parade", "Marble Gate", "Quiet Foundry"];
  return `${places[(blockIndex + topicIndex) % places.length]} ${String(blockIndex + 1).padStart(2, "0")}`;
}

function expandLegacyTopics(seedTopics, target) {
  const people = ["Selene", "Ivo", "Nara", "Tamsin", "Kade", "Rhea", "Osric", "Vey", "Milo", "Tala"];
  const objects = [
    "amber warrant",
    "glass dagger",
    "coded receipt",
    "storm map",
    "brass vial",
    "witness coin",
    "ivory mask",
    "sealed oath",
    "black ribbon",
    "iron key"
  ];
  const places = [
    "Glass Market",
    "Breaker Tunnel",
    "Velvet Theater",
    "Observatory Roof",
    "North Lock",
    "Salt Chapel",
    "Rail Yard",
    "Lantern Bridge",
    "Old Mint",
    "Cinder Court"
  ];
  const consequences = [
    "missing witness",
    "false confession",
    "dawn arrest",
    "poison cure",
    "safe passage",
    "hidden patron",
    "debt ledger",
    "stolen relic",
    "silent alarm",
    "sealed exit"
  ];
  const expanded = [...seedTopics];
  let index = 0;
  while (expanded.length < target) {
    const suffix = String(index).padStart(2, "0");
    expanded.push([
      `synthetic-${index}`,
      `${people[index % people.length]}${suffix}`,
      `${objects[index % objects.length]} ${suffix}`,
      `${places[index % places.length]} ${suffix}`,
      `${consequences[index % consequences.length]} ${suffix}`
    ]);
    index += 1;
  }
  return expanded;
}

function formatLongEventId(number) {
  return `E${String(number).padStart(5, "0")}`;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}
