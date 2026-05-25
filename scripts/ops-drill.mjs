#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  rename,
  stat,
  writeFile
} from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SAFE_TEMP_ROOT = "/private/tmp";
const DEFAULT_RETENTION_DAYS = 30;

export async function runOperationsDrill(options = {}) {
  const dataFile = assertSafeTempPath(options.dataFile, "data file");
  const backupDir = assertSafeTempPath(options.backupDir, "backup dir");
  const exportDir = assertSafeTempPath(options.exportDir || join(dirname(dataFile), "exports"), "export dir");
  const reportFile = options.reportFile ? assertSafeTempPath(options.reportFile, "report file") : null;
  const userId = options.userId || "user_ops_0016";
  const retentionDays = Number.parseInt(String(options.retentionDays || DEFAULT_RETENTION_DAYS), 10);

  await mkdir(dirname(dataFile), { recursive: true });
  await mkdir(backupDir, { recursive: true });
  await mkdir(exportDir, { recursive: true });

  let seeded = false;
  try {
    await stat(dataFile);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    await writeJsonAtomic(dataFile, fixtureStore(userId));
    seeded = true;
  }

  const beforeRaw = await readFile(dataFile, "utf8");
  const beforeHash = sha256(beforeRaw);
  const beforeStore = parseStore(beforeRaw);
  const beforeSummary = summarizeStore(beforeStore);

  const backup = await backupStore({ dataFile, backupDir });
  const exported = await exportUserData({ dataFile, exportDir, userId });
  const retention = await applyRetention({ dataFile, retentionDays });
  const deletion = await deleteUserData({ dataFile, userId });
  const restore = await restoreStore({ dataFile, backupFile: backup.backupFile, expectedSha256: backup.sha256 });
  const afterRaw = await readFile(dataFile, "utf8");
  const afterHash = sha256(afterRaw);
  const monitoring = monitoringStatus(process.env);

  const result = {
    ok: afterHash === beforeHash && restore.verified,
    gate: "GATE-004",
    status: "blocked",
    failClosed: true,
    safeRoot: SAFE_TEMP_ROOT,
    dataFile,
    seeded,
    before: {
      sha256: beforeHash,
      ...beforeSummary
    },
    backup,
    exported,
    retention,
    deletion,
    restore,
    after: {
      sha256: afterHash,
      ...summarizeStore(parseStore(afterRaw))
    },
    monitoring
  };

  if (reportFile) {
    await mkdir(dirname(reportFile), { recursive: true });
    await writeJsonAtomic(reportFile, result);
  }
  return result;
}

export async function backupStore({ dataFile, backupDir }) {
  const safeDataFile = assertSafeTempPath(dataFile, "data file");
  const safeBackupDir = assertSafeTempPath(backupDir, "backup dir");
  const raw = await readFile(safeDataFile, "utf8");
  parseStore(raw);
  await mkdir(safeBackupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = join(safeBackupDir, `${basename(safeDataFile)}.${stamp}.bak.json`);
  await copyFile(safeDataFile, backupFile);
  return {
    backupFile,
    sha256: sha256(raw),
    bytes: Buffer.byteLength(raw),
    createdAt: new Date().toISOString()
  };
}

export async function restoreStore({ dataFile, backupFile, expectedSha256 = null }) {
  const safeDataFile = assertSafeTempPath(dataFile, "data file");
  const safeBackupFile = assertSafeTempPath(backupFile, "backup file");
  const raw = await readFile(safeBackupFile, "utf8");
  parseStore(raw);
  const actualSha256 = sha256(raw);
  if (expectedSha256 && actualSha256 !== expectedSha256) {
    throw new Error(`Backup checksum mismatch: expected ${expectedSha256}, got ${actualSha256}`);
  }
  await mkdir(dirname(safeDataFile), { recursive: true });
  await writeFile(`${safeDataFile}.restore-tmp`, raw);
  await rename(`${safeDataFile}.restore-tmp`, safeDataFile);
  return {
    restoredFrom: safeBackupFile,
    sha256: actualSha256,
    verified: true,
    restoredAt: new Date().toISOString()
  };
}

export async function exportUserData({ dataFile, exportDir, userId }) {
  const safeDataFile = assertSafeTempPath(dataFile, "data file");
  const safeExportDir = assertSafeTempPath(exportDir, "export dir");
  const store = parseStore(await readFile(safeDataFile, "utf8"));
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    throw new Error("userId is required for export");
  }
  await mkdir(safeExportDir, { recursive: true });
  const user = store.users.find((entry) => entry.id === normalizedUserId) || null;
  const sessions = store.sessions.filter((entry) => entry.userId === normalizedUserId);
  const rooms = store.rooms
    .filter((room) => room.ownerUserId === normalizedUserId || (room.players || []).some((player) => player.userId === normalizedUserId))
    .map((room) => ({
      id: room.id,
      title: room.title,
      phase: room.phase,
      ownerUserId: room.ownerUserId || null,
      playerIds: (room.players || []).filter((player) => player.userId === normalizedUserId).map((player) => player.id),
      transcriptCount: (room.transcript || []).length,
      updatedAt: room.updatedAt || null
    }));
  const payload = {
    exportedAt: new Date().toISOString(),
    userId: normalizedUserId,
    user,
    sessions,
    rooms
  };
  const exportFile = join(safeExportDir, `${normalizedUserId}-export.json`);
  await writeJsonAtomic(exportFile, payload);
  return {
    exportFile,
    userFound: Boolean(user),
    sessionCount: sessions.length,
    roomCount: rooms.length,
    sha256: sha256(JSON.stringify(payload))
  };
}

export async function deleteUserData({ dataFile, userId }) {
  const safeDataFile = assertSafeTempPath(dataFile, "data file");
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    throw new Error("userId is required for deletion");
  }
  const store = parseStore(await readFile(safeDataFile, "utf8"));
  const before = summarizeStore(store);
  store.users = store.users.filter((entry) => entry.id !== normalizedUserId);
  store.sessions = store.sessions.filter((entry) => entry.userId !== normalizedUserId);
  let roomReferencesRedacted = 0;
  for (const room of store.rooms) {
    if (room.ownerUserId === normalizedUserId) {
      room.ownerUserId = null;
      roomReferencesRedacted += 1;
    }
    if (room.host?.userId === normalizedUserId) {
      room.host.userId = null;
      roomReferencesRedacted += 1;
    }
    for (const player of room.players || []) {
      if (player.userId === normalizedUserId) {
        player.userId = null;
        roomReferencesRedacted += 1;
      }
    }
    for (const authPlayer of Object.values(room.auth?.players || {})) {
      if (authPlayer?.userId === normalizedUserId) {
        authPlayer.userId = null;
        roomReferencesRedacted += 1;
      }
    }
  }
  await writeJsonAtomic(safeDataFile, store);
  const after = summarizeStore(store);
  return {
    userId: normalizedUserId,
    usersDeleted: before.users - after.users,
    sessionsDeleted: before.sessions - after.sessions,
    roomReferencesRedacted,
    after
  };
}

export async function applyRetention({ dataFile, retentionDays = DEFAULT_RETENTION_DAYS, now = new Date() }) {
  const safeDataFile = assertSafeTempPath(dataFile, "data file");
  const days = Number.parseInt(String(retentionDays), 10);
  if (!Number.isFinite(days) || days < 1) {
    throw new Error("retentionDays must be a positive integer");
  }
  const store = parseStore(await readFile(safeDataFile, "utf8"));
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const beforeSessions = store.sessions.length;
  store.sessions = store.sessions.filter((session) => {
    const lastSeen = new Date(session.lastSeenAt || session.createdAt || 0);
    return Number.isNaN(lastSeen.getTime()) || lastSeen >= cutoff;
  });
  await writeJsonAtomic(safeDataFile, store);
  return {
    retentionDays: days,
    cutoff: cutoff.toISOString(),
    sessionsBefore: beforeSessions,
    sessionsAfter: store.sessions.length,
    sessionsPruned: beforeSessions - store.sessions.length
  };
}

export function monitoringStatus(env = process.env) {
  const monitoringConfigured = Boolean(env.AIDM_MONITORING_URL);
  const alertingConfigured = Boolean(env.AIDM_ALERT_WEBHOOK);
  const ok = monitoringConfigured && alertingConfigured;
  return {
    ok,
    status: ok ? "configured" : "blocked",
    failClosed: !ok,
    monitoringConfigured,
    alertingConfigured,
    placeholders: ok ? [] : [
      "AIDM_MONITORING_URL",
      "AIDM_ALERT_WEBHOOK"
    ]
  };
}

export function assertSafeTempPath(inputPath, label = "path") {
  if (!inputPath) {
    throw new Error(`${label} is required`);
  }
  if (!isAbsolute(inputPath)) {
    throw new Error(`${label} must be an absolute path under ${SAFE_TEMP_ROOT}`);
  }
  const resolved = resolve(inputPath);
  if (resolved !== SAFE_TEMP_ROOT && !resolved.startsWith(`${SAFE_TEMP_ROOT}/`)) {
    throw new Error(`${label} must be under ${SAFE_TEMP_ROOT}; got ${resolved}`);
  }
  return resolved;
}

function parseStore(raw) {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AIDM store must be a JSON object");
  }
  return {
    rooms: Array.isArray(parsed.rooms) ? parsed.rooms : [],
    users: Array.isArray(parsed.users) ? parsed.users : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
  };
}

function fixtureStore(userId) {
  const now = new Date().toISOString();
  const stale = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  return {
    rooms: [{
      id: "room_ops_0016",
      title: "Operations Drill Room",
      phase: "in-play",
      ownerUserId: userId,
      host: {
        userId,
        name: "Ops Host"
      },
      players: [{
        id: "player_ops_0016",
        name: "Ops Player",
        userId,
        character: {
          name: "Recovery Warden",
          memo: "Temp-only drill fixture"
        }
      }],
      auth: {
        players: {
          player_ops_0016: {
            tokenHash: "redacted-token-hash",
            role: "player",
            userId
          }
        }
      },
      transcript: [{ id: "event_ops_0016", type: "system", text: "Ops fixture created." }],
      updatedAt: now
    }],
    users: [{
      id: userId,
      email: "ops-0016@example.invalid",
      displayName: "Ops Drill",
      passwordHash: "scrypt-v1:fixture",
      createdAt: now,
      updatedAt: now
    }],
    sessions: [{
      id: "session_ops_0016_active",
      tokenHash: "active-session-hash",
      userId,
      createdAt: now,
      lastSeenAt: now
    }, {
      id: "session_ops_0016_stale",
      tokenHash: "stale-session-hash",
      userId,
      createdAt: stale,
      lastSeenAt: stale
    }]
  };
}

function summarizeStore(store) {
  return {
    rooms: store.rooms.length,
    users: store.users.length,
    sessions: store.sessions.length
  };
}

async function writeJsonAtomic(filePath, payload) {
  await mkdir(dirname(filePath), { recursive: true });
  const raw = `${JSON.stringify(payload, null, 2)}\n`;
  await writeFile(`${filePath}.tmp`, raw);
  await rename(`${filePath}.tmp`, filePath);
}

function sha256(raw) {
  return createHash("sha256").update(raw).digest("hex");
}

function parseCliArgs(argv) {
  const command = argv[2] || "drill";
  const options = {};
  for (let index = 3; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected argument: ${arg}`);
    }
    const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

async function main(argv = process.argv) {
  const { command, options } = parseCliArgs(argv);
  let result;
  if (command === "drill") {
    result = await runOperationsDrill(options);
  } else if (command === "backup") {
    result = await backupStore(options);
  } else if (command === "restore") {
    result = await restoreStore(options);
  } else if (command === "export-user") {
    result = await exportUserData(options);
  } else if (command === "delete-user") {
    result = await deleteUserData(options);
  } else if (command === "retention") {
    result = await applyRetention(options);
  } else if (command === "monitoring-status") {
    result = monitoringStatus(process.env);
  } else {
    throw new Error(`Unknown ops command: ${command}`);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const currentFile = fileURLToPath(import.meta.url);
const invokedFile = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedFile === currentFile) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
