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

export function buildWeeklyReview(jobs: Job[], activities: ApplicationActivity[]): WeeklyReviewResult {
  const roleFamilies = Array.from(new Set(jobs.map((job) => job.roleFamily)));
  const ranked = roleFamilies
    .map((roleFamily) => ({ roleFamily, score: roleFamilyScore(jobs, activities, roleFamily) }))
    .sort((a, b) => b.score - a.score);

  const bestRoleFamily = ranked[0]?.score ? ranked[0].roleFamily : "Not enough data";
  const worstRoleFamily = ranked.length > 1 ? ranked[ranked.length - 1].roleFamily : "Not enough data";
  const appliedCount = countActivities(activities, "submitted_application");
  const outreachCount = countActivities(activities, "sent_dm") + countActivities(activities, "sent_follow_up");
  const replyCount = countActivities(activities, "received_reply");
  const interviewCount = countActivities(activities, "booked_interview");
  const nextWeekAdjustments = [
    bestRoleFamily === "Not enough data"
      ? "Review at least 80 roles before changing positioning."
      : `Keep ${bestRoleFamily} as a primary angle next week.`,
    appliedCount < 20 ? "Increase high-quality applications toward 20-30 per week." : "Maintain current application pace.",
    outreachCount < 30 ? "Increase targeted outreach toward 30-50 messages per week." : "Maintain current outreach pace.",
    replyCount === 0
      ? "If replies stay at zero after two weeks, increase Web3-adjacent remote roles and revise DM templates."
      : "Use reply patterns to update LinkedIn, portfolio, and resume language.",
  ];

  return {
    reviewedCount: countActivities(activities, "reviewed_job"),
    shortlistedCount: jobs.filter((job) => job.status === "shortlisted").length,
    appliedCount,
    outreachCount,
    replyCount,
    interviewCount,
    bestRoleFamily,
    worstRoleFamily,
    nextWeekAdjustments,
  };
}
