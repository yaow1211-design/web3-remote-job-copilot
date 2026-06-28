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

function setJsonHeaders(res: ApiResponse): ApiResponse {
  return res.setHeader("Cache-Control", CACHE_CONTROL).setHeader("Content-Type", "application/json");
}

function buildSuccessfulPayload(rawItems: unknown[]): DiscoverJobsResponse {
  const metadataRow = rawItems[0];
  const dataRows =
    typeof metadataRow === "object" &&
    metadataRow !== null &&
    !Array.isArray(metadataRow) &&
    !("position" in metadataRow) &&
    !("title" in metadataRow) &&
    !("company" in metadataRow) &&
    !("url" in metadataRow) &&
    !("originalUrl" in metadataRow)
      ? rawItems.slice(1)
      : rawItems;

  return {
    jobs: normalizeRemoteOkJobs(dataRows).slice(0, MAX_JOBS),
    fetchedAt: new Date().toISOString(),
    sources: SOURCES,
  };
}

function buildErrorPayload(error: unknown): DiscoverJobsResponse {
  return {
    jobs: [],
    fetchedAt: new Date().toISOString(),
    sources: SOURCES,
    error: error instanceof Error && error.message.trim() ? error.message : "Remote OK fetch failed",
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
      throw new Error("Remote OK fetch failed");
    }

    const payload: unknown = await response.json();

    if (!Array.isArray(payload)) {
      throw new Error("Remote OK fetch failed");
    }

    setJsonHeaders(res).status(200).json(buildSuccessfulPayload(payload));
  } catch (error) {
    setJsonHeaders(res).status(200).json(buildErrorPayload(error));
  }
}
