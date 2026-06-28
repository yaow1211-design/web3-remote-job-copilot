import { describe, expect, it } from "vitest";
import { seedCandidate } from "./seedCandidate";
import { toJobFromDiscoveredJob, type DiscoveredJob } from "./jobDiscovery";
import { scoreJob } from "./scoring";
import type { DailyBriefingArchive, Job } from "./types";
import { createDailyBriefing, shouldGenerateDailyBriefing } from "./dailyBriefing";

function createDiscoveredJob(overrides: Partial<DiscoveredJob> = {}): DiscoveredJob {
  const suffix = overrides.id ?? "discover-1";

  return {
    id: suffix,
    title: "Growth Data Analyst",
    company: "Orbit Wallet",
    source: "Remote OK",
    originalUrl: `https://jobs.example.com/${suffix}`,
    applyUrl: `https://jobs.example.com/${suffix}/apply`,
    description: "Remote lifecycle analytics role with SQL, campaign analysis, retention, and Web3 product exposure.",
    tags: ["remote", "analytics", "web3"],
    location: "Worldwide",
    postedAt: "2026-06-28",
    ...overrides,
  };
}

function createArchive(date: string): DailyBriefingArchive {
  return {
    id: `briefing-${date}`,
    date,
    generatedAt: `${date}T08:15:00.000Z`,
    windowLabel: "Past 24 hours",
    items: [],
  };
}

describe("shouldGenerateDailyBriefing", () => {
  it("returns false at 00:00 Asia/Shanghai", () => {
    const now = new Date("2026-06-28T00:00:00+08:00");

    expect(shouldGenerateDailyBriefing(now, [])).toBe(false);
  });

  it("returns false at 00:30 Asia/Shanghai", () => {
    const now = new Date("2026-06-28T00:30:00+08:00");

    expect(shouldGenerateDailyBriefing(now, [])).toBe(false);
  });

  it("returns false at 00:59 Asia/Shanghai", () => {
    const now = new Date("2026-06-28T00:59:00+08:00");

    expect(shouldGenerateDailyBriefing(now, [])).toBe(false);
  });

  it("returns false before 08:00 Asia/Shanghai later in the morning", () => {
    const now = new Date("2026-06-28T07:59:00+08:00");

    expect(shouldGenerateDailyBriefing(now, [])).toBe(false);
  });

  it("returns true at or after 08:00 Asia/Shanghai when no archive exists for the local date", () => {
    const now = new Date("2026-06-28T08:00:00+08:00");

    expect(shouldGenerateDailyBriefing(now, [createArchive("2026-06-27")])).toBe(true);
  });

  it("returns false when the current Asia/Shanghai local date already has an archive", () => {
    const now = new Date("2026-06-28T09:00:00+08:00");

    expect(shouldGenerateDailyBriefing(now, [createArchive("2026-06-28")])).toBe(false);
  });
});

describe("createDailyBriefing", () => {
  it("returns at most 10 items sorted by descending overall score", () => {
    const discoveredJobs = Array.from({ length: 12 }, (_, index) =>
      createDiscoveredJob({
        id: `discover-${index + 1}`,
        title:
          index < 4
            ? `Growth Data Analyst ${index + 1}`
            : index < 8
              ? `Business Analyst ${index + 1}`
              : `Product Operations Analyst ${index + 1}`,
        company: `Company ${index + 1}`,
        description:
          index < 4
            ? "Remote lifecycle analytics role with SQL, growth, retention, campaign analysis, and Web3 product exposure."
            : index < 8
              ? "Remote fintech business analyst role with risk analysis, dashboards, finance workflows, and SQL."
              : "Remote product operations role with PRD, UAT, stakeholder workflows, dashboards, and SQL.",
        tags: index < 4 ? ["remote", "analytics", "growth"] : ["remote", "operations", "sql"],
      }),
    );

    const briefing = createDailyBriefing(discoveredJobs, seedCandidate, [], new Date("2026-06-28T08:30:00+08:00"));
    const scores = briefing.items.map((item) => item.score.overallScore);

    expect(briefing.items).toHaveLength(10);
    expect(scores).toEqual([...scores].sort((left, right) => right - left));
  });

  it("builds a concise summary with company and title context", () => {
    const discoveredJob = createDiscoveredJob({
      title: "Research Analyst, Protocol Due Diligence",
      company: "Northstar Research",
      description: "Remote due diligence and protocol research role for crypto markets with screening and risk analysis.",
      tags: ["remote", "research", "crypto"],
    });

    const briefing = createDailyBriefing([discoveredJob], seedCandidate, [], new Date("2026-06-28T08:30:00+08:00"));
    const item = briefing.items[0];

    expect(item.summary.length).toBeLessThanOrEqual(200);
    expect(item.summary).toContain("Northstar Research");
    expect(item.summary).toContain("Research Analyst");
  });

  it("excludes jobs already in the inbox by URL or title-company dedupe", () => {
    const duplicateByUrl = createDiscoveredJob({
      id: "discover-duplicate-url",
      title: "Growth Data Analyst",
      company: "Orbit Wallet",
      originalUrl: "https://jobs.example.com/existing-role",
    });
    const duplicateByPair = createDiscoveredJob({
      id: "discover-duplicate-pair",
      title: "Product Operations Analyst",
      company: "Atlas Fintech",
      originalUrl: "https://jobs.example.com/atlas-new-url",
    });
    const uniqueJob = createDiscoveredJob({
      id: "discover-unique",
      title: "Business Analyst, Fintech Operations",
      company: "Northstar Capital",
      originalUrl: "https://jobs.example.com/northstar-capital",
    });
    const existingJobs: Job[] = [
      {
        ...toJobFromDiscoveredJob(duplicateByUrl),
        id: "job-existing-url",
      },
      {
        ...toJobFromDiscoveredJob(duplicateByPair),
        id: "job-existing-pair",
      },
    ];

    const briefing = createDailyBriefing(
      [duplicateByUrl, duplicateByPair, uniqueJob],
      seedCandidate,
      existingJobs,
      new Date("2026-06-28T08:30:00+08:00"),
    );

    expect(briefing.items).toHaveLength(1);
    expect(briefing.items[0]?.job.originalUrl).toBe(uniqueJob.originalUrl);
  });

  it("keeps the score reasons focused and supplies a fallback risk when none are present", () => {
    const discoveredJob = createDiscoveredJob({
      id: "discover-safe",
      title: "Growth Data Analyst, Lifecycle",
      company: "Orbit Wallet",
      description: "Remote lifecycle analytics role with SQL, campaign analysis, retention, and growth experimentation.",
      tags: ["remote", "analytics", "growth"],
    });

    const briefing = createDailyBriefing([discoveredJob], seedCandidate, [], new Date("2026-06-28T08:30:00+08:00"));
    const item = briefing.items[0];
    const sourceScore = scoreJob(toJobFromDiscoveredJob(discoveredJob), seedCandidate);

    expect(item.fitReasons).toEqual(sourceScore.reasons.slice(0, 2));
    expect(item.risks).toEqual(["No hard blocker detected. Human review still required."]);
  });
});
