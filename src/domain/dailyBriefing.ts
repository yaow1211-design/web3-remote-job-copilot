import { dedupeDiscoveredJobs, toJobFromDiscoveredJob, type DiscoveredJob } from "./jobDiscovery";
import { scoreJob } from "./scoring";
import type { CandidateAsset, DailyBriefingArchive, Job } from "./types";

const DAILY_BRIEFING_TIME_ZONE = "Asia/Shanghai";
const DAILY_BRIEFING_WINDOW_LABEL = "Past 24 hours";
const DAILY_BRIEFING_READY_HOUR = 8;
const FALLBACK_RISK = "No hard blocker detected. Human review still required.";

const briefingDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DAILY_BRIEFING_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const briefingHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: DAILY_BRIEFING_TIME_ZONE,
  hour: "2-digit",
  hour12: false,
});

function getLocalBriefingDate(now: Date): string {
  return briefingDateFormatter.format(now);
}

export function getDailyBriefingDateKey(now: Date): string {
  return getLocalBriefingDate(now);
}

function getLocalBriefingHour(now: Date): number {
  const hourPart = briefingHourFormatter
    .formatToParts(now)
    .find((part) => part.type === "hour")?.value;
  const hour = Number.parseInt(hourPart ?? "", 10);

  if (Number.isNaN(hour) || hour === 24) {
    return 0;
  }

  return hour;
}

function normalizeBriefingText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function buildSummary(company: string, title: string, reason: string, recommendation: string): string {
  return `${company} is hiring for ${title}. ${reason} Recommendation: ${recommendation}.`;
}

export function shouldGenerateDailyBriefing(now: Date, existingArchives: DailyBriefingArchive[]): boolean {
  const localDate = getDailyBriefingDateKey(now);

  if (getLocalBriefingHour(now) < DAILY_BRIEFING_READY_HOUR) {
    return false;
  }

  return !existingArchives.some((archive) => archive.date === localDate);
}

export function createDailyBriefing(
  discoveredJobs: DiscoveredJob[],
  candidate: CandidateAsset,
  existingJobs: Job[],
  now: Date,
): DailyBriefingArchive {
  const items = dedupeDiscoveredJobs(discoveredJobs, existingJobs)
    .map((discoveredJob) => {
      const job = toJobFromDiscoveredJob(discoveredJob, now);
      const fitScore = scoreJob(job, candidate);
      const primaryReason = fitScore.reasons[0] ?? "Needs manual fit review.";

      return {
        job,
        score: fitScore,
        summary: buildSummary(discoveredJob.company, discoveredJob.title, primaryReason, fitScore.recommendation),
        fitReasons: fitScore.reasons.slice(0, 2),
        risks: fitScore.risks.length > 0 ? fitScore.risks : [FALLBACK_RISK],
      };
    })
    .sort((left, right) => {
      if (right.score.overallScore !== left.score.overallScore) {
        return right.score.overallScore - left.score.overallScore;
      }

      const leftKey = `${normalizeBriefingText(left.job.title)}|${normalizeBriefingText(left.job.company)}`;
      const rightKey = `${normalizeBriefingText(right.job.title)}|${normalizeBriefingText(right.job.company)}`;
      return leftKey.localeCompare(rightKey);
    })
    .slice(0, 10);

  return {
    id: `briefing-${getDailyBriefingDateKey(now)}`,
    date: getDailyBriefingDateKey(now),
    generatedAt: now.toISOString(),
    windowLabel: DAILY_BRIEFING_WINDOW_LABEL,
    items,
  };
}
