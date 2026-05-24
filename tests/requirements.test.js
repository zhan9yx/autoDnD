import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requirementsPath = path.join(__dirname, '..', 'docs', 'REQUIREMENTS_200.md');
const v11SpecPath = path.join(__dirname, '..', '.harness', 'changes', '0011-production-depth', 'spec.md');
const v11QaCloseoutPath = path.join(__dirname, '..', 'docs', 'qa', '0011-production-depth-closeout.md');
const v12ChangeDir = path.join(__dirname, '..', '.harness', 'changes', '0012-continuous-depth-assets');
const v12SpecPath = path.join(v12ChangeDir, 'spec.md');
const v12ReviewPath = path.join(v12ChangeDir, 'review.md');
const v12TasksPath = path.join(v12ChangeDir, 'tasks.md');
const v12TestReportPath = path.join(v12ChangeDir, 'test-report.md');
const v12ProductGapBatchBPath = path.join(__dirname, '..', 'docs', 'qa', '0012-product-gap-batch-b.md');
const v13ChangeDir = path.join(__dirname, '..', '.harness', 'changes', '0013-public-productization');
const v13SpecPath = path.join(v13ChangeDir, 'spec.md');
const v13ReviewPath = path.join(v13ChangeDir, 'review.md');
const v13TasksPath = path.join(v13ChangeDir, 'tasks.md');
const v13TestReportPath = path.join(v13ChangeDir, 'test-report.md');
const v13RequirementsQaPath = path.join(__dirname, '..', 'docs', 'qa', '0013-requirements-400.md');
const documentText = fs.readFileSync(requirementsPath, 'utf8');
const v11SpecText = fs.readFileSync(v11SpecPath, 'utf8');
const v11QaCloseoutText = fs.readFileSync(v11QaCloseoutPath, 'utf8');
const v12SpecText = fs.readFileSync(v12SpecPath, 'utf8');
const v12ReviewText = fs.readFileSync(v12ReviewPath, 'utf8');
const v12TasksText = fs.readFileSync(v12TasksPath, 'utf8');
const v12TestReportText = fs.readFileSync(v12TestReportPath, 'utf8');
const v12ProductGapBatchBText = fs.readFileSync(v12ProductGapBatchBPath, 'utf8');
const v13SpecText = fs.readFileSync(v13SpecPath, 'utf8');
const v13ReviewText = fs.readFileSync(v13ReviewPath, 'utf8');
const v13TasksText = fs.readFileSync(v13TasksPath, 'utf8');
const v13TestReportText = fs.readFileSync(v13TestReportPath, 'utf8');
const v13RequirementsQaText = fs.readFileSync(v13RequirementsQaPath, 'utf8');

const depthGateDomains = ['Assets', 'Logs', 'Audio', 'UI', 'Economy', 'Evaluation'];

const requirementRows = documentText
  .split(/\r?\n/)
  .filter((line) => line.startsWith('| REQ-'));

const rowPattern = /^\| (REQ-\d{3}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| (V[1-5]\/[A-Za-z0-9 -]+, Module:[A-Za-z0-9 -]+) \|$/;

test('requirements document contains at least 400 stable requirement rows', () => {
  assert.ok(
    requirementRows.length >= 400,
    `expected at least 400 requirement rows, found ${requirementRows.length}`,
  );

  const ids = new Set();

  requirementRows.forEach((row, index) => {
    const match = row.match(rowPattern);
    assert.ok(match, `requirement row has unstable format: ${row}`);

    const [id, title, goal, acceptance, tags] = match.slice(1);
    const expectedId = `REQ-${String(index + 1).padStart(3, '0')}`;

    assert.equal(id, expectedId, `expected sequential id ${expectedId}`);
    assert.ok(!ids.has(id), `duplicate requirement id ${id}`);
    ids.add(id);

    assert.ok(title.trim().length >= 8, `${id} title is too short`);
    assert.ok(goal.trim().length >= 30, `${id} goal is too short`);
    assert.ok(acceptance.trim().length >= 50, `${id} acceptance is too short`);
    assert.match(tags, /^V[1-5]\//, `${id} version tag is missing`);
    assert.match(tags, /, Module:/, `${id} module tag is missing`);
  });
});

test('requirements document exposes the required table contract', () => {
  assert.match(documentText, /\| ID \| Title \| Goal \| Main Acceptance Criteria \| Version\/Module Tags \|/);
  assert.match(documentText, /Format contract:/);
  assert.equal(new Set(requirementRows).size, requirementRows.length, 'requirement rows must be unique');
});

test('0012 product gap batch B records the next 20 testable requirements', () => {
  const requiredIds = Array.from({ length: 20 }, (_, index) => `REQ-${String(261 + index).padStart(3, '0')}`);

  for (const id of requiredIds) {
    assert.match(documentText, new RegExp(`\\| ${id} \\|`), `${id} is missing from requirements`);
    assert.match(v12ProductGapBatchBText, new RegExp(id), `${id} is missing from batch B QA`);
  }

  for (const phrase of [
    'Ambient Audio Layer Mixer',
    'Character Switch Integrity Matrix',
    'Inventory Action Reason Labels',
    'Event Resolution Journal',
    'Random Table Scenario Seeds',
    'Rules Knowledge Brief Builder',
    'Starter Character Archetypes',
    'Weather Season Scene Matrix',
    'Real Voice Profile Registry',
    'Voice Assignment Browser QA',
  ]) {
    assert.match(documentText, new RegExp(phrase), `requirements missing ${phrase}`);
  }

  for (const phrase of [
    'Runtime code touched: no',
    'Public UI files touched: no',
    'Runtime Follow-up Needed',
    'Focused commands for this batch',
  ]) {
    assert.match(v12ProductGapBatchBText, new RegExp(phrase), `batch B QA missing ${phrase}`);
  }
});

test('0013 public-productization requirements extend REQ-281 through REQ-400', () => {
  const requiredIds = Array.from({ length: 120 }, (_, index) => `REQ-${String(281 + index).padStart(3, '0')}`);

  for (const id of requiredIds) {
    assert.match(documentText, new RegExp(`\\| ${id} \\|`), `${id} is missing from requirements`);
  }

  const requirementIds = requirementRows.map((row) => row.match(/^\| (REQ-\d{3}) \|/)?.[1]);
  const v13Ids = requirementIds.slice(280, 400);
  assert.deepEqual(v13Ids, requiredIds, 'REQ-281 through REQ-400 must be continuous');

  for (const phrase of [
    'Dense Table Information Mode',
    'Party And Log Split Layout',
    'Scene Mood Layer System',
    'Weather Audio Layer Engine',
    'Spell Targeting Rules',
    'Warrior Specialization Framework',
    'Session Refresh Rotation',
    'Room Password Policy',
    'Host Approval Lobby',
    'Create Room Idempotency',
    'Deep Readiness Health Check',
    'Public Productization Gate',
  ]) {
    assert.match(documentText, new RegExp(phrase), `requirements missing ${phrase}`);
  }
});

test('0013 public-productization requirements map to the latest user-requested domains', () => {
  const v13Rows = requirementRows.slice(280, 400).join('\n');
  const domainCoverage = {
    situationPage: [
      'Dense Table Information Mode',
      'Critical State Pinning',
      'Compact Control Bar System',
      'Party And Log Split Layout',
      'Long Log Virtualization',
    ],
    sceneAndAudio: [
      'Scene Mood Layer System',
      'Animated Weather Overlay',
      'Weather Audio Layer Engine',
      'Crowd And Creature Presence Layers',
      'Soundscape Compatibility QA',
    ],
    spellsAndWarriors: [
      'Spell School Taxonomy',
      'Spell Targeting Rules',
      'Spell Learning Rewards',
      'Warrior Specialization Framework',
      'Weapon Mastery Choices',
      'Maneuver Catalog',
    ],
    authAndRooms: [
      'Account Auth Provider Interface',
      'Session Refresh Rotation',
      'Room Password Policy',
      'Host Approval Lobby',
      'Create Room Idempotency',
    ],
    launchReadiness: [
      'Production Configuration Checklist',
      'Deep Readiness Health Check',
      'Launch Observability Dashboard',
      'Public Productization Gate',
    ],
  };

  for (const [domain, phrases] of Object.entries(domainCoverage)) {
    for (const phrase of phrases) {
      assert.match(v13Rows, new RegExp(phrase), `0013 domain ${domain} missing ${phrase}`);
    }
  }

  for (const forbidden of [
    'bugfix',
    'micro patch',
    'typo fix',
    'quick repair',
    'simple patch',
    'crash fix',
  ]) {
    assert.doesNotMatch(v13Rows, new RegExp(forbidden, 'i'), `0013 requirements must not count ${forbidden} rows`);
  }
});

test('0013 Harness and QA records separate backlog, partial implementation, and launch boundary', () => {
  const docs = {
    spec: v13SpecText,
    review: v13ReviewText,
    tasks: v13TasksText,
    testReport: v13TestReportText,
    qa: v13RequirementsQaText,
  };

  for (const [name, text] of Object.entries(docs)) {
    assert.ok(text.trim().length > 200, `0013 ${name} should be a complete record`);
    assert.match(text, /partial implementation|partial runtime|partial .* evidence|does not claim|not .*fully implemented|Runtime code touched by Worker E: no/i, `0013 ${name} must state the partial implementation and backlog boundary`);
    assert.doesNotMatch(text, /all (?:new )?requirements are implemented/i, `0013 ${name} must not claim all requirements are implemented`);
    assert.doesNotMatch(text, /public (?:beta|launch) ready/i, `0013 ${name} must not claim public readiness`);
  }

  assert.match(v13ReviewText, /approved as a backlog, partial-implementation evidence, and documentation-consistency change/i);
  assert.match(v13ReviewText, /MUST FIX/);
  assert.match(v13ReviewText, /not certify/i);

  for (const phrase of [
    'UI density',
    'party and log layout',
    'scene visual dynamics',
    'audio naturalness',
    'weather layers',
    'spell',
    'warrior specialization',
    'auth',
    'session',
    'room password',
    'approval',
    'create-room',
    'partial',
    'deployment',
    'readiness',
  ]) {
    const pattern = new RegExp(phrase, 'i');
    assert.match(v13SpecText + v13RequirementsQaText, pattern, `0013 records missing ${phrase}`);
  }

  assert.match(v13TestReportText, /node --test tests\/requirements\.test\.js tests\/maturity\.test\.js/);
  assert.match(v13TestReportText, /git diff --check/);
});

test('production-depth closeout preserves requirements and feedback evidence', () => {
  assert.match(v11SpecText, /## Acceptance Criteria/);
  assert.match(v11SpecText, /Browser QA covers the player path after integration/);
  assert.match(v11SpecText, /Lint, unit tests, smoke, memory eval, and harness check pass before merge/);

  for (const section of [
    '## Requirement Record',
    '## User Feedback',
    '## Product Acceptance',
    '## Test Report',
    '## Version Record',
    '## Merge Risk List',
  ]) {
    assert.match(v11QaCloseoutText, new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(v11QaCloseoutText, /0011-production-depth/);
  assert.match(v11QaCloseoutText, /docs\/USER_FEEDBACK_0006\.md/);
  assert.match(v11QaCloseoutText, /npm run harness:check/);
});

test('0012 Harness record preserves non-MVP depth gates and open work', () => {
  for (const [name, text] of Object.entries({
    spec: v12SpecText,
    review: v12ReviewText,
    tasks: v12TasksText,
    testReport: v12TestReportText,
  })) {
    assert.ok(text.trim().length > 200, `0012 ${name} should be a complete record`);
    assert.doesNotMatch(text, /Pending implementation|Pending\./i, `0012 ${name} should not contain placeholder status`);
  }

  assert.match(v12SpecText, /## Non-MVP Regression Gates/);
  assert.match(v12SpecText, /## Acceptance Criteria/);
  assert.match(v12ReviewText, /MUST FIX/);
  assert.match(v12ReviewText, /## Quality Gate Matrix/);
  assert.match(v12TasksText, /## Open Backlog Carried Forward/);
  assert.match(v12TasksText, /market action turn-cost/i);
  assert.match(v12TestReportText, /## Commands Run/);
  assert.match(v12TestReportText, /node --test tests\/requirements\.test\.js tests\/maturity\.test\.js/);
  assert.match(v12TestReportText, /npm run lint/);

  for (const domain of depthGateDomains) {
    const domainPattern = new RegExp(`${domain}:|${domain} gate|\\| ${domain} \\|`, 'i');
    assert.match(v12SpecText, domainPattern, `0012 spec missing ${domain} gate`);
    assert.match(v12ReviewText, domainPattern, `0012 review missing ${domain} gate`);
    assert.match(v12TestReportText, domainPattern, `0012 report missing ${domain} gate`);
  }
});
