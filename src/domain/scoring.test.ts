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
    expect(score.risks).toContain("Hard blocker: Solidity, smart contract engineering, or seniority are core to the role.");
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

  it("does not skip a viable analyst role when Director or Principal appear only in incidental text", () => {
    const score = scoreJob(
      {
        ...baseJob,
        company: "Principal Signal Labs",
        jdText:
          "Mid-level analyst role. You will partner with leadership and report to the Director of Analytics while building lifecycle reporting and SQL dashboards.",
        roleFamily: "Business Analyst",
        seniority: "Mid-level",
        requiredSkills: ["SQL", "Reporting", "Dashboards"],
        preferredSkills: ["Analytics"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    expect(score.recommendation).not.toBe("Skip");
    expect(score.overallScore).toBeGreaterThanOrEqual(50);
  });

  it("flags native Japanese requirements as a language risk", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "Growth Data Analyst",
        jdText: "Native Japanese required for close collaboration with local stakeholders. English is a plus.",
        roleFamily: "Growth Data Analyst",
        seniority: "Mid-level",
        preferredSkills: ["Japanese"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    expect(score.languageFit).toBeLessThan(60);
    expect(score.risks).toContain("Language requirement may be outside Mia's current positioning.");
  });
});
