import { t } from "./localization.js";

export function buildReplay(room) {
  const transcript = room.transcript || [];
  const memories = room.memories || [];
  const chapters = buildChapters(transcript);
  const highlights = selectHighlights(transcript, memories);
  const playerSummaries = (room.players || []).map((player) => ({
    id: player.id,
    playerName: player.name,
    characterName: player.character.name,
    species: player.character.species,
    className: player.character.className || player.character.classId,
    hp: player.character.hp,
    maxHp: player.character.maxHp
  }));

  return {
    id: `${room.id}:replay:${room.version}`,
    roomId: room.id,
    title: room.title,
    phase: room.phase,
    round: room.round,
    generatedAt: new Date(0).toISOString(),
    scene: {
      title: room.scene.title,
      location: room.scene.location,
      objective: room.scene.objective,
      clocks: room.scene.clocks,
      directorBeat: room.director?.beat || null
    },
    players: playerSummaries,
    quests: room.quests || [],
    chapters,
    highlights,
    memoryCount: memories.length,
    shareText: buildShareText(room, highlights)
  };
}

export function renderReplayMarkdown(room) {
  const replay = buildReplay(room);
  const lines = [
    `# ${replay.title}`,
    "",
    `Scene: ${replay.scene.location}`,
    `Objective: ${replay.scene.objective}`,
    `Round: ${replay.round}`,
    "",
    "## Party",
    ...replay.players.map((player) => `- ${player.characterName}: ${player.species} ${player.className}, HP ${player.hp}/${player.maxHp}`),
    "",
    "## Highlights",
    ...(replay.highlights.length > 0 ? replay.highlights.map((item) => `- ${item.text}`) : ["- No highlights yet."]),
    "",
    "## Timeline",
    ...replay.chapters.flatMap((chapter) => [
      `### ${chapter.title}`,
      ...chapter.events.map((event) => `- ${event.author}: ${event.text}`)
    ])
  ];
  return `${lines.join("\n")}\n`;
}

function buildChapters(transcript) {
  if (transcript.length === 0) {
    return [];
  }
  const chapters = [];
  let chapter = makeChapter(1);
  for (const entry of transcript) {
    if (entry.type === "gm" && chapter.events.length >= 6) {
      chapters.push(chapter);
      chapter = makeChapter(chapters.length + 1);
    }
    chapter.events.push({
      id: entry.id,
      type: entry.type,
      author: entry.author,
      text: entry.text,
      createdAt: entry.createdAt
    });
  }
  if (chapter.events.length > 0) {
    chapters.push(chapter);
  }
  return chapters;
}

function makeChapter(index) {
  return {
    id: `chapter-${index}`,
    title: index === 1 ? "Opening Moves" : `Turn Sequence ${index}`,
    events: []
  };
}

function selectHighlights(transcript, memories) {
  const rollHighlights = transcript
    .filter((entry) => entry.type === "roll" && entry.roll)
    .map((entry) => ({
      id: entry.id,
      type: entry.roll.success ? "success" : "setback",
      text: entry.text,
      score: entry.roll.success ? 2 : 1
    }));
  const memoryHighlights = memories.slice(-5).map((memory) => ({
    id: memory.id,
    type: memory.kind,
    text: memory.text,
    score: memory.weight || 1
  }));
  return [...rollHighlights, ...memoryHighlights]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

function buildShareText(room, highlights) {
  const lead = highlights[0]?.text || room.scene.objective;
  return t(room.language, "replayShareText", {
    title: room.title,
    players: room.players.length,
    round: room.round,
    lead
  });
}
