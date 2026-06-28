import type { DiscoveredJob } from "../domain/types";

const DEFAULT_ENDPOINT = "/api/discover-jobs";
const JOB_DISCOVERY_ERROR = "Job discovery failed";

interface JobDiscoveryResponse {
  jobs: DiscoveredJob[];
  error?: string;
}

function isJobDiscoveryResponse(value: unknown): value is JobDiscoveryResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { jobs?: unknown }).jobs)
  );
}

export async function fetchDiscoveredJobs(fetcher: typeof fetch = fetch): Promise<DiscoveredJob[]> {
  try {
    const response = await fetcher(DEFAULT_ENDPOINT);

    if (!response.ok) {
      throw new Error(JOB_DISCOVERY_ERROR);
    }

    const payload: unknown = await response.json();

    if (!isJobDiscoveryResponse(payload)) {
      throw new Error(JOB_DISCOVERY_ERROR);
    }

    if (typeof payload.error === "string" && payload.error.length > 0) {
      throw new Error(JOB_DISCOVERY_ERROR);
    }

    return payload.jobs;
  } catch {
    throw new Error(JOB_DISCOVERY_ERROR);
  }
}
