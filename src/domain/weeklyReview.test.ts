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
    status: "shortlisted",
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
];

describe("buildWeeklyReview", () => {
  it("summarizes weekly job search progress and gives strategy guidance", () => {
    const review = buildWeeklyReview(jobs, activities);

    expect(review.reviewedCount).toBe(1);
    expect(review.appliedCount).toBe(1);
    expect(review.outreachCount).toBe(1);
    expect(review.interviewCount).toBe(1);
    expect(review.bestRoleFamily).toBe("Growth Data Analyst");
    expect(review.nextWeekAdjustments.join(" ")).toContain("Keep Growth Data Analyst");
  });
});
