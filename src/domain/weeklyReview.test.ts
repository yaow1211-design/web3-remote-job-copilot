import { describe, expect, it } from "vitest";
import { buildWeeklyReview } from "./weeklyReview";
import type { ApplicationActivity, Job } from "./types";

const jobs: Job[] = [
  {
    id: "j1",
    title: "Growth Data Analyst",
    company: "Example Web3 Wallet",
    source: "Manual URL",
    originalUrl: "https://example.com/jobs/j1",
    applyUrl: "https://example.com/jobs/j1/apply",
    jdText: "Remote growth data analyst role.",
    remoteType: "remote",
    locationConstraints: "Worldwide",
    roleFamily: "Growth Data Analyst",
    seniority: "Mid-level",
    requiredSkills: ["SQL"],
    preferredSkills: [],
    cryptoRequirementLevel: "none",
    salaryRange: "",
    postedAt: "2026-06-24",
    status: "applied",
    notes: "",
  },
  {
    id: "j2",
    title: "Business Analyst",
    company: "Example Fintech",
    source: "Manual URL",
    originalUrl: "https://example.com/jobs/j2",
    applyUrl: "https://example.com/jobs/j2/apply",
    jdText: "Remote business analyst role.",
    remoteType: "remote",
    locationConstraints: "Worldwide",
    roleFamily: "Business Analyst",
    seniority: "Mid-level",
    requiredSkills: ["SQL"],
    preferredSkills: [],
    cryptoRequirementLevel: "none",
    salaryRange: "",
    postedAt: "2026-06-24",
    status: "reviewed",
    notes: "",
  },
  {
    id: "j3",
    title: "Growth Data Analyst II",
    company: "Example Web3 Wallet",
    source: "Manual URL",
    originalUrl: "https://example.com/jobs/j3",
    applyUrl: "https://example.com/jobs/j3/apply",
    jdText: "Another remote growth data analyst role.",
    remoteType: "remote",
    locationConstraints: "Worldwide",
    roleFamily: "Growth Data Analyst",
    seniority: "Mid-level",
    requiredSkills: ["SQL"],
    preferredSkills: [],
    cryptoRequirementLevel: "none",
    salaryRange: "",
    postedAt: "2026-06-24",
    status: "interview",
    notes: "",
  },
];

const activities: ApplicationActivity[] = [
  {
    id: "a1",
    jobId: "j1",
    actionType: "reviewed_job",
    channel: "Application Portal",
    date: "2026-06-24",
    contentVersion: "",
    result: "",
    nextActionDate: "",
    notes: "",
  },
  {
    id: "a2",
    jobId: "j1",
    actionType: "submitted_application",
    channel: "Application Portal",
    date: "2026-06-24",
    contentVersion: "",
    result: "Submitted",
    nextActionDate: "",
    notes: "",
  },
  {
    id: "a3",
    jobId: "j1",
    actionType: "sent_dm",
    channel: "LinkedIn",
    date: "2026-06-25",
    contentVersion: "",
    result: "Sent",
    nextActionDate: "2026-06-30",
    notes: "",
  },
  {
    id: "a4",
    jobId: "j3",
    actionType: "booked_interview",
    channel: "Email",
    date: "2026-06-27",
    contentVersion: "",
    result: "Interview",
    nextActionDate: "",
    notes: "",
  },
  {
    id: "a5",
    jobId: "j2",
    actionType: "shortlisted_job",
    channel: "Application Portal",
    date: "2026-06-26",
    contentVersion: "",
    result: "Shortlisted manually",
    nextActionDate: "",
    notes: "",
  },
];

describe("buildWeeklyReview", () => {
  it("summarizes weekly job search progress and gives strategy guidance", () => {
    const review = buildWeeklyReview(jobs, activities);

    expect(review.reviewedCount).toBe(1);
    expect(review.shortlistedCount).toBe(1);
    expect(review.appliedCount).toBe(1);
    expect(review.outreachCount).toBe(1);
    expect(review.replyCount).toBe(0);
    expect(review.interviewCount).toBe(1);
    expect(review.bestRoleFamily).toBe("Growth Data Analyst");
    expect(review.worstRoleFamily).toBe("Business Analyst");
    expect(review.nextWeekAdjustments.join(" ")).toContain("Keep Growth Data Analyst");
    expect(review.nextWeekAdjustments.join(" ")).toContain("role direction ratio");
    expect(review.nextWeekAdjustments.join(" ")).toContain("Candidate Asset Layer");
    expect(review.nextWeekAdjustments.join(" ")).toContain("LinkedIn");
    expect(review.nextWeekAdjustments.join(" ")).toContain("portfolio");
    expect(review.nextWeekAdjustments.join(" ")).toContain("resume");
    expect(review.nextWeekAdjustments.join(" ")).toContain("DM templates");
    expect(review.nextWeekAdjustments.join(" ")).toContain("Web3-adjacent");
    expect(review.nextWeekAdjustments.join(" ")).toContain("applications");
    expect(review.nextWeekAdjustments.join(" ")).toContain("outreach");
    expect(review.nextWeekAdjustments.join(" ")).toContain("replies stay at zero");
  });

  it("counts only activities inside the default trailing seven-day window", () => {
    const review = buildWeeklyReview(jobs, [
      ...activities,
      {
        id: "a-old",
        jobId: "j2",
        actionType: "submitted_application",
        channel: "Application Portal",
        date: "2026-06-10",
        contentVersion: "",
        result: "Submitted",
        nextActionDate: "",
        notes: "",
      },
      {
        id: "a-old-shortlist",
        jobId: "j2",
        actionType: "shortlisted_job",
        channel: "Application Portal",
        date: "2026-06-10",
        contentVersion: "",
        result: "Shortlisted manually",
        nextActionDate: "",
        notes: "",
      },
    ]);

    expect(review.appliedCount).toBe(1);
    expect(review.shortlistedCount).toBe(1);
    expect(review.bestRoleFamily).toBe("Growth Data Analyst");
  });

  it("counts shortlisted jobs from shortlisted activity inside the window even after the current status moves on", () => {
    const review = buildWeeklyReview(
      jobs.map((job) => (job.id === "j2" ? { ...job, status: "applied" } : job)),
      activities,
      {
        startDate: "2026-06-24",
        endDate: "2026-06-28",
      },
    );

    expect(review.shortlistedCount).toBe(1);
  });

  it("accepts an explicit review window and excludes activity outside it", () => {
    const review = buildWeeklyReview(jobs, activities, {
      startDate: "2026-06-25",
      endDate: "2026-06-27",
    });

    expect(review.reviewedCount).toBe(0);
    expect(review.appliedCount).toBe(0);
    expect(review.shortlistedCount).toBe(1);
    expect(review.outreachCount).toBe(1);
    expect(review.interviewCount).toBe(1);
    expect(review.bestRoleFamily).toBe("Growth Data Analyst");
  });

  it("returns not enough data for both role families when the week has no signal", () => {
    const review = buildWeeklyReview(
      [
        { ...jobs[0], id: "j10", roleFamily: "Growth Data Analyst" },
        { ...jobs[1], id: "j20", roleFamily: "Business Analyst" },
      ],
      []
    );

    expect(review.bestRoleFamily).toBe("Not enough data");
    expect(review.worstRoleFamily).toBe("Business Analyst");
  });
});
