import { describe, expect, it } from "vitest";
import {
  createInitialAppState,
  exportAppState,
  importAppState,
  loadAppState,
  saveAppState,
} from "./localStore";
import type { AppState } from "../domain/types";

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
    const shortlistActivityState: AppState = {
      ...state,
      activities: [
        {
          ...state.activities[0],
          actionType: "shortlisted_job",
        },
      ],
    };
    const json = exportAppState(shortlistActivityState);

    const imported = importAppState(json);

    expect(imported.version).toBe(1);
    expect(imported.candidate.portfolioUrl).toContain("github.io");
    expect(imported.activities[0]?.actionType).toBe("shortlisted_job");
  });

  it("defaults briefings to an empty array when loading an older backup without briefings", () => {
    const { briefings: _briefings, ...legacyBackup } = createInitialAppState();

    const imported = importAppState(JSON.stringify(legacyBackup)) as AppState & {
      briefings?: unknown[];
    };

    expect(imported.briefings).toEqual([]);
  });

  it("exports and imports a backup with one daily briefing archive", () => {
    const stateWithBriefing = {
      ...createInitialAppState(),
      briefings: [
        {
          id: "briefing-2026-06-28",
          date: "2026-06-28",
          generatedAt: "2026-06-28T08:15:00.000Z",
          windowLabel: "Past 24 hours",
          items: [
            {
              job: createInitialAppState().jobs[0],
              score: {
                overallScore: 88,
                roleFit: 92,
                transferableFinanceFit: 80,
                growthDataFit: 84,
                productOpsFit: 72,
                web3Barrier: -5,
                remoteCompatibility: 95,
                languageFit: 75,
                portfolioProofStrength: 70,
                outreachOpportunity: 63,
                recommendation: "Strong Apply",
                reasons: ["Role angle: Growth Data Analyst.", "Strong lifecycle analytics and growth data overlap."],
                risks: ["No hard blocker detected. Human review still required."],
                suggestedAngle: "Growth Data Analyst",
              },
              summary: "Orbit Wallet is hiring a Growth Data Analyst role with remote lifecycle analytics scope.",
              fitReasons: ["Role angle: Growth Data Analyst.", "Strong lifecycle analytics and growth data overlap."],
              risks: ["No hard blocker detected. Human review still required."],
            },
          ],
        },
      ],
    } as AppState & { briefings: unknown[] };

    const json = exportAppState(stateWithBriefing as AppState);
    const imported = importAppState(json) as AppState & { briefings?: Array<{ id: string; items: unknown[] }> };

    expect(imported.briefings).toHaveLength(1);
    expect(imported.briefings?.[0]).toMatchObject({
      id: "briefing-2026-06-28",
    });
    expect(imported.briefings?.[0]?.items).toHaveLength(1);
  });

  it("rejects malformed backup JSON", () => {
    expect(() => importAppState("{bad json")).toThrow("Backup is not valid JSON");
    expect(() => importAppState(JSON.stringify({ version: 1 }))).toThrow(
      "Backup is missing required app state fields",
    );
  });

  it("rejects malformed nested backup records with clear validation errors", () => {
    const state = createInitialAppState();
    const malformedBackup = {
      ...state,
      jobs: [
        {
          ...state.jobs[0],
          requiredSkills: "SQL",
        },
      ],
      contacts: [
        {
          ...state.contacts[0],
          messageStatus: "Waiting",
        },
      ],
    };

    expect(() => importAppState(JSON.stringify(malformedBackup))).toThrow(
      "Backup validation failed: jobs[0].requiredSkills must be a string array; contacts[0].messageStatus must be one of",
    );
  });

  it("falls back to initial state when persisted localStorage is structurally invalid", () => {
    const storage = createMemoryStorage();
    const invalidPersistedState = {
      ...createInitialAppState(),
      activities: [
        {
          id: "activity-1",
          jobId: "job-1",
          actionType: "sent_dm",
          channel: "Carrier pigeon",
          date: "2026-06-28",
          contentVersion: "Manual DM",
          result: "Sent",
          nextActionDate: "",
          notes: "",
        },
      ],
    };

    storage.setItem("web3-remote-job-copilot:v1", JSON.stringify(invalidPersistedState));

    const loaded = loadAppState(storage);

    expect(loaded).toEqual(createInitialAppState());
  });
});
