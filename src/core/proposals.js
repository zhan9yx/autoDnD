const ALLOWED_PROPOSAL_TYPES = new Set([
  "appendMemory",
  "advanceClock",
  "addQuestClue",
  "setScene",
  "suggestCheck",
  "requestAsset"
]);

const FORBIDDEN_STATE_PATHS = [
  "players",
  "combat.encounter.enemies",
  "auth",
  "metrics.aiCalls"
];

export function validateAiProposal(proposal) {
  const errors = [];
  if (!proposal || typeof proposal !== "object") {
    return { ok: false, errors: ["Proposal must be an object"] };
  }
  if (!ALLOWED_PROPOSAL_TYPES.has(proposal.type)) {
    errors.push(`Unsupported proposal type: ${proposal.type}`);
  }
  if (touchesForbiddenPath(proposal.path)) {
    errors.push(`Forbidden state path: ${proposal.path}`);
  }

  switch (proposal.type) {
    case "appendMemory":
      requireText(proposal.text, "text", errors);
      break;
    case "advanceClock":
      requireEnum(proposal.clock, ["clues", "danger", "deadline"], "clock", errors);
      requireInteger(proposal.amount, "amount", errors);
      break;
    case "addQuestClue":
      requireText(proposal.questId, "questId", errors);
      requireText(proposal.clue, "clue", errors);
      break;
    case "setScene":
      requireText(proposal.location, "location", errors);
      requireText(proposal.objective, "objective", errors);
      break;
    case "suggestCheck":
      requireEnum(proposal.attribute, ["body", "agility", "mind", "presence", "spirit"], "attribute", errors);
      requireInteger(proposal.dc, "dc", errors);
      break;
    case "requestAsset":
      requireEnum(proposal.group, ["scenes", "species", "classes", "weapons", "spells", "items", "npcs", "enemies"], "group", errors);
      requireText(proposal.assetId, "assetId", errors);
      break;
    default:
      break;
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

export function validateAiProposals(proposals = []) {
  const results = proposals.map((proposal, index) => ({
    index,
    proposal,
    ...validateAiProposal(proposal)
  }));
  return {
    ok: results.every((result) => result.ok),
    accepted: results.filter((result) => result.ok).map((result) => result.proposal),
    rejected: results.filter((result) => !result.ok)
  };
}

function touchesForbiddenPath(path) {
  if (!path) {
    return false;
  }
  return FORBIDDEN_STATE_PATHS.some((forbidden) => path === forbidden || path.startsWith(`${forbidden}.`));
}

function requireText(value, label, errors) {
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`${label} is required`);
  }
}

function requireInteger(value, label, errors) {
  if (!Number.isInteger(value)) {
    errors.push(`${label} must be an integer`);
  }
}

function requireEnum(value, values, label, errors) {
  if (!values.includes(value)) {
    errors.push(`${label} must be one of: ${values.join(", ")}`);
  }
}
