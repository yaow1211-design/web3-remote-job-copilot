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
    expect(score.risks).toContain("Hard blocker: Solidity, smart contract engineering, or blockchain engineering are core to the role.");
  });

  it("does not hard-block analyst roles that only mention smart contract activity", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "Research & Due Diligence Analyst",
        company: "Protocol Insights",
        jdText: "Analyze smart contract activity, protocol usage, and on-chain risk signals.",
        roleFamily: "Research & Due Diligence Analyst",
        seniority: "Mid-level",
        requiredSkills: ["Research", "On-chain Analysis"],
        preferredSkills: ["Risk Analysis"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    expect(score.recommendation).not.toBe("Skip");
    expect(score.risks).not.toContain("Hard blocker: Solidity, smart contract engineering, or blockchain engineering are core to the role.");
  });

  it("explains generic crypto hard blockers without implying Solidity or seniority", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "Growth Analyst",
        company: "Crypto Treasury Co",
        jdText: "Requires prior full-time crypto company experience. Strong SQL and growth analytics background preferred.",
        roleFamily: "Growth Data Analyst",
        seniority: "Mid-level",
        requiredSkills: ["SQL", "Analytics"],
        preferredSkills: ["Crypto interest"],
        cryptoRequirementLevel: "hard_blocker",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("Skip");
    expect(score.risks).toContain("Crypto/Web3 company experience is a hard requirement for this role.");
    expect(score.risks.join(" ")).not.toContain("Solidity, smart contract engineering, or seniority are core to the role.");
  });

  it("uses broader domain-depth wording when the jd does not explicitly ask for company experience", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "DeFi Research Analyst",
        company: "Protocol Insights",
        jdText: "Must have deep DeFi domain knowledge and crypto-native market understanding.",
        roleFamily: "Research & Due Diligence Analyst",
        seniority: "Mid-level",
        requiredSkills: ["Research", "DeFi"],
        preferredSkills: ["Crypto knowledge"],
        cryptoRequirementLevel: "hard_blocker",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("Skip");
    expect(score.risks).toContain("Crypto/Web3 domain depth is a hard requirement for this role.");
    expect(score.risks.join(" ")).not.toContain("company experience");
  });

  it("uses domain-depth wording for blockchain market experience hard blockers", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "DeFi Research Analyst",
        company: "Protocol Insights",
        jdText: "3+ years blockchain market experience required. Must have deep DeFi domain knowledge and crypto-native market understanding.",
        roleFamily: "Research & Due Diligence Analyst",
        seniority: "Mid-level",
        requiredSkills: ["Research", "DeFi"],
        preferredSkills: ["Crypto knowledge"],
        cryptoRequirementLevel: "hard_blocker",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("Skip");
    expect(score.risks).toContain("Crypto/Web3 domain depth is a hard requirement for this role.");
    expect(score.risks.join(" ")).not.toContain("blockchain engineering");
  });

  it("does not claim crypto/Web3 company experience from generic startup wording", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "DeFi Research Analyst",
        company: "Protocol Insights",
        jdText: "Startup company experience preferred. Deep DeFi domain knowledge and crypto-native market understanding required.",
        roleFamily: "Research & Due Diligence Analyst",
        seniority: "Mid-level",
        requiredSkills: ["Research", "DeFi"],
        preferredSkills: ["Startup company experience"],
        cryptoRequirementLevel: "hard_blocker",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("Skip");
    expect(score.risks).toContain("Crypto/Web3 domain depth is a hard requirement for this role.");
    expect(score.risks.join(" ")).not.toContain("company experience is a hard requirement");
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

  it("flags bare Japanese and German language requirements as a language risk", () => {
    const japaneseScore = scoreJob(
      {
        ...baseJob,
        title: "Growth Data Analyst",
        jdText: "Japanese required for close collaboration with local stakeholders.",
        roleFamily: "Growth Data Analyst",
        seniority: "Mid-level",
        preferredSkills: ["Japanese"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    const germanScore = scoreJob(
      {
        ...baseJob,
        title: "Product Analyst",
        jdText: "Must speak German for stakeholder communication.",
        roleFamily: "Product / Operations Analyst",
        seniority: "Mid-level",
        preferredSkills: ["German"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    expect(japaneseScore.languageFit).toBeLessThan(60);
    expect(japaneseScore.risks).toContain("Language requirement may be outside Mia's current positioning.");
    expect(germanScore.languageFit).toBeLessThan(60);
    expect(germanScore.risks).toContain("Language requirement may be outside Mia's current positioning.");
  });

  it("does not flag the German market as a language requirement when German is incidental", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "SQL Analyst",
        jdText: "SQL required; experience with the German market is a plus.",
        roleFamily: "Product / Operations Analyst",
        seniority: "Mid-level",
        requiredSkills: ["SQL"],
        preferredSkills: ["Market Analysis"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    expect(score.languageFit).toBeGreaterThanOrEqual(60);
    expect(score.risks).not.toContain("Language requirement may be outside Mia's current positioning.");
  });

  it("does not flag market or customer segment requirements as language risks", () => {
    const germanMarketScore = scoreJob(
      {
        ...baseJob,
        title: "SQL Analyst",
        jdText: "German market experience required; strong SQL and reporting skills are needed.",
        roleFamily: "Product / Operations Analyst",
        seniority: "Mid-level",
        requiredSkills: ["SQL"],
        preferredSkills: ["Market Analysis"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    const japaneseSegmentScore = scoreJob(
      {
        ...baseJob,
        title: "SQL Analyst",
        jdText: "Japanese customer segment knowledge required; strong SQL and reporting skills are needed.",
        roleFamily: "Product / Operations Analyst",
        seniority: "Mid-level",
        requiredSkills: ["SQL"],
        preferredSkills: ["Market Analysis"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    expect(germanMarketScore.languageFit).toBeGreaterThanOrEqual(60);
    expect(germanMarketScore.risks).not.toContain("Language requirement may be outside Mia's current positioning.");
    expect(japaneseSegmentScore.languageFit).toBeGreaterThanOrEqual(60);
    expect(japaneseSegmentScore.risks).not.toContain("Language requirement may be outside Mia's current positioning.");
  });

  it.each([
    "experience at a crypto company",
    "worked for a Web3 startup",
    "background in blockchain firms",
  ])("treats '%s' as explicit crypto/Web3 company experience", (phrase) => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "Growth Analyst",
        company: "Crypto Treasury Co",
        jdText: `Requires ${phrase}. Strong SQL and growth analytics background preferred.`,
        roleFamily: "Growth Data Analyst",
        seniority: "Mid-level",
        requiredSkills: ["SQL", "Analytics"],
        preferredSkills: ["Crypto company experience"],
        cryptoRequirementLevel: "hard_blocker",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("Skip");
    expect(score.risks).toContain("Crypto/Web3 company experience is a hard requirement for this role.");
  });
});
