import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonRoomStore {
  constructor(filePath = process.env.AIDM_DATA_FILE || "data/aidm-store.json") {
    this.filePath = filePath;
    this.rooms = new Map();
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

  async flush() {
    await mkdir(dirname(this.filePath), { recursive: true });
    const payload = JSON.stringify({ rooms: [...this.rooms.values()] }, null, 2);
    const tmp = `${this.filePath}.tmp`;
    await writeFile(tmp, payload);
    await rename(tmp, this.filePath);
  }
}

export class MemoryRoomStore {
  constructor() {
    this.rooms = new Map();
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
}
