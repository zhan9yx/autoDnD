import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requirementsPath = path.join(__dirname, '..', 'docs', 'REQUIREMENTS_200.md');
const documentText = fs.readFileSync(requirementsPath, 'utf8');

const requirementRows = documentText
  .split(/\r?\n/)
  .filter((line) => line.startsWith('| REQ-'));

const rowPattern = /^\| (REQ-\d{3}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| (V[1-5]\/[A-Za-z0-9 -]+, Module:[A-Za-z0-9 -]+) \|$/;

test('requirements document contains at least 200 stable requirement rows', () => {
  assert.ok(
    requirementRows.length >= 200,
    `expected at least 200 requirement rows, found ${requirementRows.length}`,
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
