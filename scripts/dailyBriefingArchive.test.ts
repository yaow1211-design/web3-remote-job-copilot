import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import type { DailyBriefingArchive } from "../src/domain/types";
import {
  getShanghaiDateKey,
  renderDailyBriefingMarkdown,
  writeDailyBriefingArchive,
} from "./dailyBriefingArchive";

function createArchive(): DailyBriefingArchive {
  return {
    id: "briefing-2026-06-28",
    date: "2026-06-28",
    generatedAt: "2026-06-28T00:05:00.000Z",
    windowLabel: "Past 24 hours",
    items: [
      {
        job: {
          id: "job-1",
          title: "Growth Analyst",
          company: "Example Web3",
          source: "Remote OK",
          originalUrl: "https://example.com/jobs/growth-analyst",
          applyUrl: "https://example.com/jobs/growth-analyst/apply",
          jdText: "Lifecycle analytics role.",
          remoteType: "remote",
          locationConstraints: "Worldwide",
          roleFamily: "Growth Data Analyst",
          seniority: "Unspecified",
          requiredSkills: ["SQL"],
          preferredSkills: ["Web3"],
          cryptoRequirementLevel: "preferred",
          salaryRange: "",
          postedAt: "2026-06-28",
          status: "new",
          notes: "",
        },
        score: {
          overallScore: 88,
          roleFit: 92,
          transferableFinanceFit: 78,
          growthDataFit: 90,
          productOpsFit: 70,
          web3Barrier: -5,
          remoteCompatibility: 95,
          languageFit: 85,
          portfolioProofStrength: 80,
          outreachOpportunity: 75,
          recommendation: "Strong Apply",
          reasons: ["Role angle: Growth Data Analyst.", "Strong lifecycle analytics and growth data overlap."],
          risks: ["Web3 experience is preferred; position your portfolio proof clearly."],
          suggestedAngle: "Growth Data Analyst",
        },
        summary: "Example Web3 is hiring for Growth Analyst. Recommendation: Strong Apply.",
        fitReasons: ["Role angle: Growth Data Analyst.", "Strong lifecycle analytics and growth data overlap."],
        risks: ["Web3 experience is preferred; position your portfolio proof clearly."],
      },
    ],
  };
}

describe("daily briefing archive generation", () => {
  it("uses the Asia/Shanghai local date for archive filenames", () => {
    expect(getShanghaiDateKey(new Date("2026-06-28T00:05:00.000Z"))).toBe("2026-06-28");
    expect(getShanghaiDateKey(new Date("2026-06-27T23:55:00.000Z"))).toBe("2026-06-28");
  });

  it("renders a readable markdown briefing with scores, recommendations, links, reasons, and risks", () => {
    const markdown = renderDailyBriefingMarkdown({
      archive: createArchive(),
      sources: ["Remote OK"],
    });

    expect(markdown).toContain("# Web3 Remote Job Briefing - 2026-06-28");
    expect(markdown).toContain("Generated at: 2026-06-28T00:05:00.000Z");
    expect(markdown).toContain("Source: Remote OK");
    expect(markdown).toContain("### 1. Growth Analyst - Example Web3");
    expect(markdown).toContain("Score: 88");
    expect(markdown).toContain("Recommendation: Strong Apply");
    expect(markdown).toContain("Link: https://example.com/jobs/growth-analyst");
    expect(markdown).toContain("- Role angle: Growth Data Analyst.");
    expect(markdown).toContain("- Web3 experience is preferred; position your portfolio proof clearly.");
  });

  it("writes markdown and json once without overwriting an existing daily archive", async () => {
    const outputDir = join(tmpdir(), `web3-briefing-test-${Date.now()}`);
    await mkdir(outputDir, { recursive: true });

    try {
      const firstWrite = await writeDailyBriefingArchive({
        archive: createArchive(),
        outputDir,
        sources: ["Remote OK"],
      });

      expect(firstWrite.written).toBe(true);
      expect(await readFile(firstWrite.markdownPath, "utf8")).toContain("Growth Analyst - Example Web3");
      expect(JSON.parse(await readFile(firstWrite.jsonPath, "utf8"))).toMatchObject({
        date: "2026-06-28",
        items: [{ job: { title: "Growth Analyst" } }],
      });

      await writeFile(firstWrite.markdownPath, "existing markdown");
      const secondWrite = await writeDailyBriefingArchive({
        archive: createArchive(),
        outputDir,
        sources: ["Remote OK"],
      });

      expect(secondWrite.written).toBe(false);
      expect(await readFile(firstWrite.markdownPath, "utf8")).toBe("existing markdown");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});

