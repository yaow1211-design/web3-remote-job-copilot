import { seedCandidate } from "./seedCandidate";
import { scoreJob } from "./scoring";
import type { Job } from "./types";

const baseJob: Job = {
  id: "job-test",
  title: "Growth Data Analyst",
  company: "Example Web3 Analytics",
  source: "Manual URL",
  originalUrl: "https://example.com/job",
  applyUrl: "https://example.com/apply",
  jdText: "Remote role requiring SQL, lifecycle analytics, user segmentation, campaign analysis, and interest in crypto.",
  remoteType: "remote",
  locationConstraints: "Worldwide",
  roleFamily: "Growth Data Analyst",
  seniority: "Mid-level",
  requiredSkills: ["SQL", "Lifecycle Analytics", "User Segmentation"],
  preferredSkills: ["Crypto interest"],
  cryptoRequirementLevel: "preferred",
  salaryRange: "",
  postedAt: "2026-06-28",
  status: "new",
  notes: "",
};

describe("scoreJob", () => {
  it("recommends a strong apply for remote growth analytics roles with transferable finance fit", () => {
    const score = scoreJob(baseJob, seedCandidate);

    expect(score.overallScore).toBeGreaterThanOrEqual(75);
    expect(score.recommendation).toBe("Strong Apply");
    expect(score.reasons.join(" ")).toContain("lifecycle analytics");
    expect(score.risks).not.toContain("Hard blocker: Solidity or smart contract engineering is core to the role.");
  });

  it("skips Solidity engineering roles", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "Smart Contract Engineer",
        jdText: "Solidity engineer needed for protocol smart contracts. 3+ years blockchain engineering required.",
        roleFamily: "Product / Operations Analyst",
        requiredSkills: ["Solidity", "Smart Contracts"],
        cryptoRequirementLevel: "hard_blocker",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("Skip");
    expect(score.overallScore).toBeLessThan(50);
    expect(score.risks).toContain("Hard blocker: Solidity or smart contract engineering is core to the role.");
  });

  it("uses DM First when outreach opportunity is high but Web3 barrier is medium", () => {
    const score = scoreJob(
      {
        ...baseJob,
        jdText: "Remote research analyst role. Crypto experience preferred. Founder-led team encourages direct outreach and community participation.",
        roleFamily: "Research & Due Diligence Analyst",
        requiredSkills: ["Research", "Financial Analysis"],
        preferredSkills: ["Crypto experience", "Community"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("DM First");
    expect(score.outreachOpportunity).toBeGreaterThanOrEqual(80);
  });
});
