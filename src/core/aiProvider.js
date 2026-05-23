const DEFAULT_MODEL = "gpt-5.4-mini";

export class AIProvider {
  constructor(env = process.env) {
    this.apiKey = env.OPENAI_API_KEY || "";
    this.model = env.OPENAI_MODEL || DEFAULT_MODEL;
    this.baseUrl = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  async narrate(input) {
    if (!this.apiKey) {
      return localNarration(input);
    }

    try {
      return await this.openAiNarration(input);
    } catch (error) {
      const fallback = localNarration(input);
      return {
        ...fallback,
        provider: "local-fallback",
        warning: error.message
      };
    }
  }

  async openAiNarration({ room, player, actionText, check, memories }) {
    const prompt = buildNarrationPrompt({ room, player, actionText, check, memories });
    const startedAt = Date.now();
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        input: prompt,
        max_output_tokens: 450
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = extractResponseText(data) || localNarration({ room, player, actionText, check, memories }).text;
    return {
      provider: "openai",
      model: this.model,
      text,
      latencyMs: Date.now() - startedAt,
      promptChars: prompt.length,
      completionChars: text.length
    };
  }
}

export function localNarration({ room, player, actionText, check, memories = [] }) {
  const successLine = check.success
    ? `The attempt lands cleanly by ${check.margin} over the difficulty.`
    : `The attempt falls short by ${Math.abs(check.margin)}, but it still changes the scene.`;
  const memoryLine = memories.length > 0 ? `A prior fact returns: ${memories[0].text}` : "No old certainty answers them yet.";
  const text = [
    `${player.character.name} moves through ${room.scene.location}, choosing to ${actionText}.`,
    `${successLine} The roll is ${check.total} against DC ${check.dc}.`,
    `${memoryLine}`,
    check.success
      ? `The ${room.scene.objective.toLowerCase()} feels closer, and the table gains a concrete lead.`
      : `The pressure rises; ${room.scene.ambience} closes in while a new complication appears.`
  ].join(" ");

  return {
    provider: "local",
    model: "deterministic",
    text,
    latencyMs: 0,
    promptChars: 0,
    completionChars: text.length
  };
}

function buildNarrationPrompt({ room, player, actionText, check, memories }) {
  return [
    "You are AIDM, a tabletop game master. Narrate consequences in vivid but concise prose.",
    "Do not change HP, inventory, turn order, or dice values. The server already computed rules.",
    `Room: ${room.title}`,
    `Scene: ${room.scene.title} at ${room.scene.location}`,
    `Objective: ${room.scene.objective}`,
    `Active character: ${player.character.name}, ${player.character.archetype}`,
    `Player action: ${actionText}`,
    `Rules result: ${check.expression} = ${check.total}, DC ${check.dc}, success=${check.success}, margin=${check.margin}`,
    `Relevant memories: ${memories.map((memory) => `- ${memory.text}`).join("\n") || "none"}`,
    "Return only narration text for the table."
  ].join("\n");
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text.trim();
  }
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("").trim();
}
