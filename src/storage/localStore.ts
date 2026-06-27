import { seedCandidate } from "../domain/seedCandidate";
import type { AppState } from "../domain/types";
import { sampleActivities, sampleContacts, sampleJobs } from "../sampleData";

const STORAGE_KEY = "web3-remote-job-copilot:v1";

type AppStateShape = Pick<AppState, "version" | "candidate" | "jobs" | "packs" | "contacts" | "activities">;

function getDefaultStorage(): Storage {
  return window.localStorage;
}

export function createInitialAppState(): AppState {
  return {
    version: 1,
    candidate: seedCandidate,
    jobs: sampleJobs,
    packs: [],
    contacts: sampleContacts,
    activities: sampleActivities,
  };
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<AppStateShape>;
  return (
    state.version === 1 &&
    Boolean(state.candidate) &&
    Array.isArray(state.jobs) &&
    Array.isArray(state.packs) &&
    Array.isArray(state.contacts) &&
    Array.isArray(state.activities)
  );
}

export function loadAppState(storage: Storage = getDefaultStorage()): AppState {
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialAppState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isAppState(parsed) ? parsed : createInitialAppState();
  } catch {
    return createInitialAppState();
  }
}

export function saveAppState(state: AppState, storage: Storage = getDefaultStorage()): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportAppState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importAppState(json: string): AppState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Backup is not valid JSON");
  }

  if (!isAppState(parsed)) {
    throw new Error("Backup is missing required app state fields");
  }

  return parsed;
}
