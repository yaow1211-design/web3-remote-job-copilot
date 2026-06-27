import { describe, expect, it } from "vitest";
import { generateApplicationPack } from "./applicationPack";
import { seedCandidate } from "./seedCandidate";
import { scoreJob } from "./scoring";
import type { Job } from "./types";

const job: Job = {
  id: "job-pack",
  title: "Growth Data Analyst",
  company: "Example Web3 Wallet",
  source: "Manual URL",
  originalUrl: "https://example.com/job",
  applyUrl: "https://example.com/apply",
  jdText: "Remote growth data analyst role requiring SQL, lifecycle analytics, campaign analysis, and crypto interest.",
  remoteType: "remote",
  locationConstraints: "APAC friendly",
  roleFamily: "Growth Data Analyst",
  seniority: "Mid-level",
  requiredSkills: ["SQL", "Lifecycle Analytics", "Campaign Analysis"],
  preferredSkills: ["Crypto interest"],
  cryptoRequirementLevel: "preferred",
  salaryRange: "",
  postedAt: "2026-06-28",
  status: "shortlisted",
  notes: "",
};

describe("generateApplicationPack", () => {
  it("generates a human-reviewed application pack aligned with Mia's positioning", () => {
    const score = scoreJob(job, seedCandidate);
    const pack = generateApplicationPack(job, seedCandidate, score, new Date("2026-06-28T10:00:00Z"));

    expect(pack.jobId).toBe("job-pack");
    expect(pack.roleAngle).toBe("Growth Data Analyst");
    expect(pack.selectedResumeVersion).toBe("Growth Data Analyst resume");
    expect(pack.tailoredSummary).toContain("campaign conversion up to 42%");
    expect(pack.recruiterDm).toContain("I will review and send this manually");
    expect(pack.hiringManagerDm).toContain("lifecycle analytics");
    expect(pack.riskHandlingNote).toContain("I have not worked full-time inside a Web3 company yet");
    expect(pack.interviewTalkingPoints.length).toBeGreaterThanOrEqual(3);
  });

  it("selects the research and due diligence resume for the research role family", () => {
    const researchJob: Job = {
      ...job,
      id: "job-research",
      title: "Research & Due Diligence Analyst",
      roleFamily: "Research & Due Diligence Analyst",
      jdText: "Remote research and due diligence role focused on crypto analysis and project screening.",
    };
    const score = scoreJob(researchJob, seedCandidate);
    const pack = generateApplicationPack(researchJob, seedCandidate, score, new Date("2026-06-28T10:00:00Z"));

    expect(pack.roleAngle).toBe("Research & Due Diligence Analyst");
    expect(pack.selectedResumeVersion).toBe("Research and Due Diligence Analyst resume");
  });

  it("selects the product operations resume for the product or operations analyst family", () => {
    const productJob: Job = {
      ...job,
      id: "job-product",
      title: "Product / Operations Analyst",
      roleFamily: "Product / Operations Analyst",
      jdText: "Remote product and operations analyst role supporting dashboards, UAT, and workflow coordination.",
    };
    const score = scoreJob(productJob, seedCandidate);
    const pack = generateApplicationPack(productJob, seedCandidate, score, new Date("2026-06-28T10:00:00Z"));

    expect(pack.roleAngle).toBe("Product / Operations Analyst");
    expect(pack.selectedResumeVersion).toBe("Product Operations Analyst resume");
  });
});
