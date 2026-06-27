import type { CandidateAsset, FitRiskScore, Job, Recommendation, RoleFamily } from "./types";

const HARD_BLOCKER_TERMS = ["solidity", "smart contract", "3+ years blockchain", "5+ years in blockchain", "head of growth", "director", "principal"];
const GROWTH_TERMS = ["lifecycle", "segmentation", "campaign", "growth", "funnel", "activation", "retention", "reactivation"];
const PRODUCT_OPS_TERMS = ["prd", "uat", "operations", "dashboard", "workflow", "requirements", "stakeholder"];
const FINANCE_TERMS = ["finance", "fintech", "banking", "asset management", "credit", "risk", "trading"];
const OUTREACH_TERMS = ["founder", "hiring manager", "community", "direct outreach", "telegram", "linkedin", "warm intro"];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function textFor(job: Job): string {
  return [job.title, job.company, job.jdText, job.requiredSkills.join(" "), job.preferredSkills.join(" "), job.notes].join(" ").toLowerCase();
}

function countMatches(text: string, terms: string[]): number {
  return terms.filter((term) => text.includes(term)).length;
}

function hasHardBlocker(text: string, job: Job): boolean {
  return job.cryptoRequirementLevel === "hard_blocker" || HARD_BLOCKER_TERMS.some((term) => text.includes(term));
}

function roleFitFor(roleFamily: RoleFamily): number {
  switch (roleFamily) {
    case "Growth Data Analyst":
      return 92;
    case "Business Analyst":
      return 84;
    case "Product / Operations Analyst":
      return 78;
    case "Research & Due Diligence Analyst":
      return 82;
    default:
      return 75;
  }
}

function recommendationFor(
  overallScore: number,
  outreachOpportunity: number,
  portfolioProofStrength: number,
  hardBlocked: boolean,
  web3Barrier: number,
): Recommendation {
  if (hardBlocked || overallScore < 50) {
    return "Skip";
  }

  if (outreachOpportunity >= 80 && web3Barrier >= -10) {
    return "DM First";
  }

  if (overallScore >= 75) {
    return "Strong Apply";
  }

  if (portfolioProofStrength < 55) {
    return "Portfolio Needed";
  }

  return "Apply with Custom Pack";
}

export function scoreJob(job: Job, candidate: CandidateAsset): FitRiskScore {
  const text = textFor(job);
  const hardBlocked = hasHardBlocker(text, job);

  const roleFit = clamp(roleFitFor(job.roleFamily));
  const transferableFinanceFit = clamp(
    50 +
      countMatches(text, FINANCE_TERMS) * 14 +
      (candidate.proofPoints.join(" ").toLowerCase().includes("finance") ? 12 : 0) +
      (candidate.skillKeywords.some((skill) => ["sql", "python"].includes(skill.toLowerCase())) ? 6 : 0),
  );
  const growthDataFit = clamp(40 + countMatches(text, GROWTH_TERMS) * 14 + (text.includes("sql") ? 12 : 0));
  const productOpsFit = clamp(40 + countMatches(text, PRODUCT_OPS_TERMS) * 12);
  const remoteCompatibility = clamp(job.remoteType === "remote" ? 95 : job.remoteType === "hybrid" ? 55 : 20);
  const languageFit = clamp(text.includes("english") || text.includes("native") ? 85 : 75);
  const portfolioProofStrength = clamp(
    55 + countMatches(candidate.portfolioProjects.join(" ").toLowerCase(), ["web3", "analytics", "growth"]) * 15 + (text.includes("portfolio") ? 10 : 0),
  );
  const outreachOpportunity = clamp(45 + countMatches(text, OUTREACH_TERMS) * 18 + (job.originalUrl.includes("linkedin") ? 10 : 0));
  const web3Barrier =
    job.cryptoRequirementLevel === "hard_blocker" ? -30 : job.cryptoRequirementLevel === "required" ? -22 : job.cryptoRequirementLevel === "preferred" ? -5 : 0;

  const weighted =
    roleFit * 0.2 +
    transferableFinanceFit * 0.2 +
    growthDataFit * 0.2 +
    productOpsFit * 0.1 +
    remoteCompatibility * 0.1 +
    portfolioProofStrength * 0.1 +
    outreachOpportunity * 0.1 +
    web3Barrier;

  const overallScore = hardBlocked ? clamp(Math.min(weighted, 42)) : clamp(weighted);

  const reasons = [
    `Role angle: ${job.roleFamily}.`,
    growthDataFit >= 65 ? "Strong lifecycle analytics and growth data overlap." : "Growth data overlap needs a sharper portfolio angle.",
    transferableFinanceFit >= 65 ? "Finance and fintech background transfers well into this role." : "Finance transfer story should be made explicit.",
    remoteCompatibility >= 80 ? "Remote setup looks compatible." : "Remote or location compatibility needs manual review.",
  ];

  const risks = [
    ...(hardBlocked ? ["Hard blocker: Solidity or smart contract engineering is core to the role."] : []),
    ...(job.cryptoRequirementLevel === "required" ? ["Web3 experience is required; use only with strong proof or warm intro."] : []),
    ...(languageFit < 60 ? ["Language requirement may be outside Mia's current positioning."] : []),
  ];

  return {
    overallScore,
    roleFit,
    transferableFinanceFit,
    growthDataFit,
    productOpsFit,
    web3Barrier,
    remoteCompatibility,
    languageFit,
    portfolioProofStrength,
    outreachOpportunity,
    recommendation: recommendationFor(overallScore, outreachOpportunity, portfolioProofStrength, hardBlocked, web3Barrier),
    reasons,
    risks,
    suggestedAngle: job.roleFamily,
  };
}
