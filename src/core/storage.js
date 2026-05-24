import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonRoomStore {
  constructor(filePath = process.env.AIDM_DATA_FILE || "data/aidm-store.json") {
    this.filePath = filePath;
    this.rooms = new Map();
    this.users = new Map();
    this.sessions = new Map();
    this.loaded = false;
  }

  async load() {
    if (this.loaded) {
      return;
    }
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      for (const room of parsed.rooms || []) {
        this.rooms.set(room.id, room);
      }
      for (const user of parsed.users || []) {
        this.users.set(user.id, user);
      }
      for (const session of parsed.sessions || []) {
        this.sessions.set(session.tokenHash, session);
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
    this.loaded = true;
  }

  async getRoom(roomId) {
    await this.load();
    const room = this.rooms.get(roomId);
    return room ? structuredClone(room) : null;
  }

  async listRooms() {
    await this.load();
    return [...this.rooms.values()].map((room) => structuredClone(room));
  }

  async saveRoom(room) {
    await this.load();
    this.rooms.set(room.id, structuredClone(room));
    await this.flush();
    return room;
  }

  async getUser(userId) {
    await this.load();
    const user = this.users.get(userId);
    return user ? structuredClone(user) : null;
  }

  async getUserByEmail(email) {
    await this.load();
    const normalized = String(email || "").trim().toLowerCase();
    const user = [...this.users.values()].find((entry) => entry.email === normalized);
    return user ? structuredClone(user) : null;
  }

  async saveUser(user) {
    await this.load();
    this.users.set(user.id, structuredClone(user));
    await this.flush();
    return user;
  }

  async getSession(tokenHash) {
    await this.load();
    const session = this.sessions.get(tokenHash);
    return session ? structuredClone(session) : null;
  }

  async saveSession(session) {
    await this.load();
    this.sessions.set(session.tokenHash, structuredClone(session));
    await this.flush();
    return session;
  }

  async deleteSession(tokenHash) {
    await this.load();
    const deleted = this.sessions.delete(tokenHash);
    if (deleted) {
      await this.flush();
    }
    return deleted;
  }

  async flush() {
    await mkdir(dirname(this.filePath), { recursive: true });
    const payload = JSON.stringify({
      rooms: [...this.rooms.values()],
      users: [...this.users.values()],
      sessions: [...this.sessions.values()]
    }, null, 2);
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, payload);
    await rename(tmp, this.filePath);
  }
}

export class MemoryRoomStore {
  constructor() {
    this.rooms = new Map();
    this.users = new Map();
    this.sessions = new Map();
  }

  async getRoom(roomId) {
    const room = this.rooms.get(roomId);
    return room ? structuredClone(room) : null;
  }

  async listRooms() {
    return [...this.rooms.values()].map((room) => structuredClone(room));
  }

  async saveRoom(room) {
    this.rooms.set(room.id, structuredClone(room));
    return room;
  }

  async getUser(userId) {
    const user = this.users.get(userId);
    return user ? structuredClone(user) : null;
  }

  async getUserByEmail(email) {
    const normalized = String(email || "").trim().toLowerCase();
    const user = [...this.users.values()].find((entry) => entry.email === normalized);
    return user ? structuredClone(user) : null;
  }

  async saveUser(user) {
    this.users.set(user.id, structuredClone(user));
    return user;
  }

  async getSession(tokenHash) {
    const session = this.sessions.get(tokenHash);
    return session ? structuredClone(session) : null;
  }

  async saveSession(session) {
    this.sessions.set(session.tokenHash, structuredClone(session));
    return session;
  }

  async deleteSession(tokenHash) {
    return this.sessions.delete(tokenHash);
  }
}
