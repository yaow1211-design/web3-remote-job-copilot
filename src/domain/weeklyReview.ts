import { formatLocalDate } from "./date";
import type { ApplicationActivity, Job, RoleFamily } from "./types";

export interface WeeklyReviewResult {
  reviewedCount: number;
  shortlistedCount: number;
  appliedCount: number;
  outreachCount: number;
  replyCount: number;
  interviewCount: number;
  bestRoleFamily: RoleFamily | "Not enough data";
  worstRoleFamily: RoleFamily | "Not enough data";
  nextWeekAdjustments: string[];
}

function countActivities(activities: ApplicationActivity[], type: ApplicationActivity["actionType"]): number {
  return activities.filter((activity) => activity.actionType === type).length;
}

function roleFamilyScore(jobs: Job[], activities: ApplicationActivity[], roleFamily: RoleFamily): number {
  const jobIds = new Set(jobs.filter((job) => job.roleFamily === roleFamily).map((job) => job.id));

  return activities
    .filter((activity) => jobIds.has(activity.jobId))
    .reduce((score, activity) => {
      if (activity.actionType === "booked_interview") return score + 5;
      if (activity.actionType === "received_reply") return score + 3;
      if (activity.actionType === "submitted_application") return score + 1;
      return score;
    }, 0);
}

export interface WeeklyReviewWindow {
  startDate: string;
  endDate: string;
}

function buildDefaultWindow(today = new Date()): WeeklyReviewWindow {
  const endDate = formatLocalDate(today);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  return {
    startDate: formatLocalDate(start),
    endDate,
  };
}

function isWithinWindow(activity: ApplicationActivity, window: WeeklyReviewWindow): boolean {
  return activity.date >= window.startDate && activity.date <= window.endDate;
}

export function buildWeeklyReview(
  jobs: Job[],
  activities: ApplicationActivity[],
  window: WeeklyReviewWindow = buildDefaultWindow(),
): WeeklyReviewResult {
  const windowedActivities = activities.filter((activity) => isWithinWindow(activity, window));
  const roleFamilies = Array.from(new Set(jobs.map((job) => job.roleFamily)));
  const ranked = roleFamilies
    .map((roleFamily) => ({ roleFamily, score: roleFamilyScore(jobs, windowedActivities, roleFamily) }))
    .sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;

  const bestRoleFamily = topScore > 0 ? ranked[0].roleFamily : "Not enough data";
  const worstRoleFamily = ranked.length > 1 ? ranked[ranked.length - 1].roleFamily : "Not enough data";
  const appliedCount = countActivities(windowedActivities, "submitted_application");
  const outreachCount =
    countActivities(windowedActivities, "sent_dm") + countActivities(windowedActivities, "sent_follow_up");
  const replyCount = countActivities(windowedActivities, "received_reply");
  const interviewCount = countActivities(windowedActivities, "booked_interview");
  const nextWeekAdjustments = [
    bestRoleFamily === "Not enough data"
      ? "Review at least 80 roles before changing your role direction ratio."
      : `Keep ${bestRoleFamily} as a primary angle next week and rebalance the role direction ratio around it.`,
    "Update the Candidate Asset Layer with fresh proof points, quantified outcomes, and role-specific keywords.",
    "Refresh LinkedIn, portfolio, resume, and DM templates so each channel tells the same story.",
    "Adjust the Web3 vs Web3-adjacent role ratio based on traction and the strength of reply signals.",
    appliedCount < 20 ? "Increase high-quality applications toward 20-30 per week." : "Maintain current application pace.",
    outreachCount < 30 ? "Increase targeted outreach toward 30-50 messages per week." : "Maintain current outreach pace.",
    replyCount === 0
      ? "If replies stay at zero after two weeks, increase Web3-adjacent remote roles and revise DM templates again."
      : "Use reply patterns to update LinkedIn, portfolio, and resume language.",
  ];

  return {
    reviewedCount: countActivities(windowedActivities, "reviewed_job"),
    shortlistedCount: countActivities(windowedActivities, "shortlisted_job"),
    appliedCount,
    outreachCount,
    replyCount,
    interviewCount,
    bestRoleFamily,
    worstRoleFamily,
    nextWeekAdjustments,
  };
}
