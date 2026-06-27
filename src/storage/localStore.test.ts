import { describe, expect, it } from "vitest";
import {
  createInitialAppState,
  exportAppState,
  importAppState,
  loadAppState,
  saveAppState,
} from "./localStore";

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();

  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("localStore", () => {
  it("creates initial state with Mia candidate assets and sample jobs", () => {
    const state = createInitialAppState();

    expect(state.candidate.linkedinHeadline).toContain("Growth Data Analyst");
    expect(state.candidate.riskDisclaimers).toContain(
      "No full-time Web3 company experience yet",
    );
    expect(state.jobs.length).toBeGreaterThanOrEqual(2);
  });

  it("saves and loads app state from localStorage", () => {
    const storage = createMemoryStorage();
    const state = createInitialAppState();

    saveAppState(state, storage);
    const loaded = loadAppState(storage);

    expect(loaded.candidate.targetPositioning).toBe(state.candidate.targetPositioning);
    expect(loaded.jobs.map((job) => job.id)).toEqual(state.jobs.map((job) => job.id));
  });

  it("exports and imports valid JSON backups", () => {
    const state = createInitialAppState();
    const json = exportAppState(state);

    const imported = importAppState(json);

    expect(imported.version).toBe(1);
    expect(imported.candidate.portfolioUrl).toContain("github.io");
  });

  it("rejects malformed backup JSON", () => {
    expect(() => importAppState("{bad json")).toThrow("Backup is not valid JSON");
    expect(() => importAppState(JSON.stringify({ version: 1 }))).toThrow(
      "Backup is missing required app state fields",
    );
  });
});
