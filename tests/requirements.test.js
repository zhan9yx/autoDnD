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
const documentText = fs.readFileSync(requirementsPath, 'utf8');
const v11SpecText = fs.readFileSync(v11SpecPath, 'utf8');
const v11QaCloseoutText = fs.readFileSync(v11QaCloseoutPath, 'utf8');
const v12SpecText = fs.readFileSync(v12SpecPath, 'utf8');
const v12ReviewText = fs.readFileSync(v12ReviewPath, 'utf8');
const v12TasksText = fs.readFileSync(v12TasksPath, 'utf8');
const v12TestReportText = fs.readFileSync(v12TestReportPath, 'utf8');
const v12ProductGapBatchBText = fs.readFileSync(v12ProductGapBatchBPath, 'utf8');

const depthGateDomains = ['Assets', 'Logs', 'Audio', 'UI', 'Economy', 'Evaluation'];

const requirementRows = documentText
  .split(/\r?\n/)
  .filter((line) => line.startsWith('| REQ-'));

const rowPattern = /^\| (REQ-\d{3}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| (V[1-5]\/[A-Za-z0-9 -]+, Module:[A-Za-z0-9 -]+) \|$/;

test('requirements document contains at least 280 stable requirement rows', () => {
  assert.ok(
    requirementRows.length >= 280,
    `expected at least 280 requirement rows, found ${requirementRows.length}`,
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
