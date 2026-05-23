#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";

const topics = [
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

await mkdir("evals/long-memory", { recursive: true });
await writeDataset("v1", topics, 120, 20, { minRecallAt5: 0.85, minMeanReciprocalRank: 0.7 });
await writeDataset("v2", expandTopics(topics, 50), 500, 50, { minRecallAt5: 0.9, minMeanReciprocalRank: 0.75 });

async function writeDataset(version, topicList, eventTarget, queryTarget, threshold) {
  const events = [];
  const queries = [];
  let eventNumber = 1;

  for (const [topic, actor, object, place, consequence] of topicList.slice(0, queryTarget)) {
    const ids = [];
    ids.push(addEvent(`${actor} revealed that the ${object} is tied to ${place}, and this fact matters because of ${consequence}.`));
    ids.push(addEvent(`During a later scene, the party confirmed ${actor}'s clue: ${object} should be checked at ${place}.`));
    ids.push(addEvent(`A contradiction was resolved at ${place} when ${actor} explained that ${consequence} changes how the party should handle ${object}.`));
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

  while (events.length < eventTarget) {
    addEvent(`General distractor ${events.length}: the city changed watch rotations, market taxes, lantern oil prices, and ferry schedules.`);
  }

  await writeFile(
    `evals/long-memory/campaign-history-${version}.json`,
    JSON.stringify(
      {
        name: `Rain Archive long memory benchmark ${version}`,
        description: `Reusable benchmark with ${eventTarget} events and ${queryTarget} queries for long-history retrieval.`,
        events,
        queries,
        threshold
      },
      null,
      2
    )
  );

  function addEvent(text) {
    const id = `E${String(eventNumber).padStart(3, "0")}`;
    eventNumber += 1;
    events.push({ id, text });
    return id;
  }
}

function expandTopics(seedTopics, target) {
  const people = ["Selene", "Ivo", "Nara", "Tamsin", "Kade", "Rhea", "Osric", "Vey", "Milo", "Tala"];
  const objects = ["amber warrant", "glass dagger", "coded receipt", "storm map", "brass vial", "witness coin", "ivory mask", "sealed oath", "black ribbon", "iron key"];
  const places = ["Glass Market", "Breaker Tunnel", "Velvet Theater", "Observatory Roof", "North Lock", "Salt Chapel", "Rail Yard", "Lantern Bridge", "Old Mint", "Cinder Court"];
  const consequences = ["missing witness", "false confession", "dawn arrest", "poison cure", "safe passage", "hidden patron", "debt ledger", "stolen relic", "silent alarm", "sealed exit"];
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
