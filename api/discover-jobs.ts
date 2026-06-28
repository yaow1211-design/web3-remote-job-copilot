import { normalizeRemoteOkJobs } from "../src/domain/jobDiscovery";

type DiscoverJobsResponse = {
  jobs: ReturnType<typeof normalizeRemoteOkJobs>;
  fetchedAt: string;
  sources: string[];
  error?: string;
};

type ApiResponse = {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): ApiResponse;
  json(body: DiscoverJobsResponse): void;
};

const REMOTE_OK_API_URL = "https://remoteok.com/api";
const CACHE_CONTROL = "s-maxage=1800, stale-while-revalidate=3600";
const SOURCES = ["Remote OK"];
const USER_AGENT = "Mia Web3 Remote Job Copilot (https://miaweb3job.vercel.app)";
const ACCEPT = "application/json";
const MAX_JOBS = 50;
const FETCH_ERROR_MESSAGE = "Job discovery failed";
const NORMALIZATION_ERROR_MESSAGE = "Job discovery source could not be normalized";
const JOB_TITLE_FIELDS = ["title", "position"];
const JOB_COMPANY_FIELDS = ["company"];
const JOB_URL_FIELDS = ["url", "apply_url", "applyUrl", "slug"];

function setJsonHeaders(res: ApiResponse): ApiResponse {
  return res.setHeader("Cache-Control", CACHE_CONTROL).setHeader("Content-Type", "application/json");
}

function isRecord(item: unknown): item is Record<string, unknown> {
  if (typeof item !== "object" || item === null || Array.isArray(item)) {
    return false;
  }

  return true;
}

function hasAnyFields(item: Record<string, unknown>, fields: string[]): boolean {
  return fields.some((field) => {
    const value = item[field];
    return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null;
  });
}

function hasRecognizableRemoteOkJobKeys(item: unknown): item is Record<string, unknown> {
  if (!isRecord(item)) {
    return false;
  }

  return hasAnyFields(item, JOB_TITLE_FIELDS) && hasAnyFields(item, JOB_COMPANY_FIELDS) && hasAnyFields(item, JOB_URL_FIELDS);
}

function isStructurallyHealthyRemoteOkPayload(rawItems: unknown[]): boolean {
  if (rawItems.length === 0) {
    return true;
  }

  return rawItems.some(hasRecognizableRemoteOkJobKeys);
}

function buildSuccessfulPayload(rawItems: unknown[]): DiscoverJobsResponse {
  const jobs = normalizeRemoteOkJobs(rawItems).slice(0, MAX_JOBS);

  return {
    jobs,
    fetchedAt: new Date().toISOString(),
    sources: SOURCES,
  };
}

function buildErrorPayload(message: string = FETCH_ERROR_MESSAGE): DiscoverJobsResponse {
  return {
    jobs: [],
    fetchedAt: new Date().toISOString(),
    sources: SOURCES,
    error: message,
  };
}

export default async function handler(_req: unknown, res: ApiResponse): Promise<void> {
  try {
    const response = await fetch(REMOTE_OK_API_URL, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: ACCEPT,
      },
    });

    if (!response.ok) {
      throw new Error(FETCH_ERROR_MESSAGE);
    }

    const payload: unknown = await response.json();

    if (!Array.isArray(payload)) {
      throw new Error(FETCH_ERROR_MESSAGE);
    }

    if (!isStructurallyHealthyRemoteOkPayload(payload)) {
      throw new Error(NORMALIZATION_ERROR_MESSAGE);
    }

    setJsonHeaders(res).status(200).json(buildSuccessfulPayload(payload));
  } catch (error) {
    const message = error instanceof Error && error.message === NORMALIZATION_ERROR_MESSAGE ? NORMALIZATION_ERROR_MESSAGE : FETCH_ERROR_MESSAGE;
    setJsonHeaders(res).status(200).json(buildErrorPayload(message));
  }
}
