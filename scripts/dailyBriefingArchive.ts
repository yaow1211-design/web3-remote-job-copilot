import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DailyBriefingArchive } from "../src/domain/types";

const SHANGHAI_DATE_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export interface RenderDailyBriefingMarkdownInput {
  archive: DailyBriefingArchive;
  sources: string[];
}

export interface WriteDailyBriefingArchiveInput extends RenderDailyBriefingMarkdownInput {
  outputDir: string;
}

export interface WriteDailyBriefingArchiveResult {
  written: boolean;
  markdownPath: string;
  jsonPath: string;
}

export function getShanghaiDateKey(now: Date): string {
  return SHANGHAI_DATE_FORMATTER.format(now);
}

function renderList(items: string[]): string {
  if (items.length === 0) {
    return "- No specific notes.";
  }

  return items.map((item) => `- ${item}`).join("\n");
}

export function renderDailyBriefingMarkdown({ archive, sources }: RenderDailyBriefingMarkdownInput): string {
  const lines = [
    `# Web3 Remote Job Briefing - ${archive.date}`,
    "",
    `Generated at: ${archive.generatedAt}`,
    `Window: ${archive.windowLabel}`,
    `Source: ${sources.length > 0 ? sources.join(", ") : "Unknown"}`,
    "",
    "## Top 10 Matches",
    "",
  ];

  if (archive.items.length === 0) {
    lines.push("No matching jobs found for this archive.", "");
    return lines.join("\n");
  }

  archive.items.forEach((item, index) => {
    lines.push(
      `### ${index + 1}. ${item.job.title} - ${item.job.company}`,
      "",
      `Score: ${item.score.overallScore}`,
      `Recommendation: ${item.score.recommendation}`,
      `Link: ${item.job.originalUrl}`,
      "",
      item.summary,
      "",
      "Why it fits:",
      renderList(item.fitReasons),
      "",
      "Risks:",
      renderList(item.risks),
      "",
    );
  });

  return lines.join("\n");
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function writeDailyBriefingArchive({
  archive,
  outputDir,
  sources,
}: WriteDailyBriefingArchiveInput): Promise<WriteDailyBriefingArchiveResult> {
  const markdownPath = join(outputDir, `${archive.date}.md`);
  const jsonPath = join(outputDir, `${archive.date}.json`);

  if ((await exists(markdownPath)) || (await exists(jsonPath))) {
    return { written: false, markdownPath, jsonPath };
  }

  await mkdir(outputDir, { recursive: true });
  await writeFile(markdownPath, renderDailyBriefingMarkdown({ archive, sources }), "utf8");
  await writeFile(jsonPath, `${JSON.stringify(archive, null, 2)}\n`, "utf8");

  return { written: true, markdownPath, jsonPath };
}

