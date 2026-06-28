import { createDailyBriefing } from "../src/domain/dailyBriefing";
import { seedCandidate } from "../src/domain/seedCandidate";
import type { DiscoveredJob } from "../src/domain/types";
import { writeDailyBriefingArchive } from "./dailyBriefingArchive";

const DEFAULT_DISCOVERY_URL = "https://web3-remote-job-copilot.vercel.app/api/discover-jobs";
const DEFAULT_OUTPUT_DIR = "data/daily-briefings";

interface DiscoverJobsResponse {
  jobs: DiscoveredJob[];
  fetchedAt: string;
  sources: string[];
  error?: string;
}

function readArgValue(name: string): string | undefined {
  const argIndex = process.argv.indexOf(name);
  if (argIndex === -1) {
    return undefined;
  }

  return process.argv[argIndex + 1];
}

function parseNow(value: string | undefined): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`Invalid DAILY_BRIEFING_NOW value: ${value}`);
  }

  return parsed;
}

async function fetchDiscoveredJobs(endpoint: string): Promise<DiscoverJobsResponse> {
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mia Web3 Remote Job Copilot Daily Briefing",
    },
  });

  if (!response.ok) {
    throw new Error(`Daily briefing discovery failed with HTTP ${response.status}`);
  }

  const payload = (await response.json()) as DiscoverJobsResponse;
  if (!Array.isArray(payload.jobs)) {
    throw new Error("Daily briefing discovery response is missing jobs[]");
  }

  if (payload.error) {
    throw new Error(payload.error);
  }

  return payload;
}

async function main(): Promise<void> {
  const endpoint = process.env.DAILY_BRIEFING_DISCOVERY_URL ?? readArgValue("--endpoint") ?? DEFAULT_DISCOVERY_URL;
  const outputDir = process.env.DAILY_BRIEFING_OUTPUT_DIR ?? readArgValue("--output-dir") ?? DEFAULT_OUTPUT_DIR;
  const now = parseNow(process.env.DAILY_BRIEFING_NOW ?? readArgValue("--now"));

  const discovered = await fetchDiscoveredJobs(endpoint);
  const archive = createDailyBriefing(discovered.jobs, seedCandidate, [], now);
  const result = await writeDailyBriefingArchive({
    archive,
    outputDir,
    sources: discovered.sources,
  });

  if (result.written) {
    console.log(`Daily briefing archive written: ${result.markdownPath}`);
    console.log(`Daily briefing archive written: ${result.jsonPath}`);
    return;
  }

  console.log(`Daily briefing archive already exists: ${result.markdownPath}`);
  console.log(`Daily briefing archive already exists: ${result.jsonPath}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Daily briefing generation failed");
  process.exitCode = 1;
});

