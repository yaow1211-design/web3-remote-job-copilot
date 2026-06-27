import type { ApplicationPack, CandidateAsset, FitRiskScore, Job } from "./types";

const ROLE_FAMILY_RESUME_TITLES: Record<Job["roleFamily"], string> = {
  "Growth Data Analyst": "Growth Data Analyst resume",
  "Business Analyst": "Business Analyst resume",
  "Product / Operations Analyst": "Product Operations Analyst resume",
  "Research & Due Diligence Analyst": "Research and Due Diligence Analyst resume",
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function pickResumeVersion(candidate: CandidateAsset, roleAngle: string): string {
  const preferredResumeTitle = ROLE_FAMILY_RESUME_TITLES[roleAngle as Job["roleFamily"]];

  if (preferredResumeTitle) {
    const normalizedPreferredResumeTitle = normalizeText(preferredResumeTitle);
    const preferredResume =
      candidate.resumeVersions.find((version) => version.toLowerCase() === preferredResumeTitle.toLowerCase()) ??
      candidate.resumeVersions.find((version) => normalizeText(version) === normalizedPreferredResumeTitle) ??
      candidate.resumeVersions.find((version) => normalizeText(version).includes(normalizedPreferredResumeTitle));

    if (preferredResume) {
      return preferredResume;
    }
  }

  const normalizedAngle = normalizeText(roleAngle);

  return (
    candidate.resumeVersions.find((version) => normalizeText(version).includes(normalizedAngle)) ??
    candidate.resumeVersions.find((version) => normalizeText(version).includes("growth")) ??
    candidate.resumeVersions[0]
  );
}

function pickProofPoint(candidate: CandidateAsset, terms: string[]): string {
  const lowerProofPoints = candidate.proofPoints.map((point) => point.toLowerCase());
  const matchedIndex = lowerProofPoints.findIndex((point) => terms.some((term) => point.includes(term)));

  return candidate.proofPoints[matchedIndex] ?? candidate.proofPoints[0];
}

export function generateApplicationPack(
  job: Job,
  candidate: CandidateAsset,
  score: FitRiskScore,
  now: Date = new Date(),
): ApplicationPack {
  const roleAngle = score.suggestedAngle;
  const selectedResumeVersion = pickResumeVersion(candidate, roleAngle);
  const conversionProof = pickProofPoint(candidate, ["42%", "conversion", "campaign"]).toLowerCase();
  const productProof = pickProofPoint(candidate, ["prd", "uat", "dashboard"]).toLowerCase();
  const web3Proof = pickProofPoint(candidate, ["web3", "defi", "blockchain"]);

  return {
    jobId: job.id,
    selectedResumeVersion,
    roleAngle,
    tailoredSummary: `For ${job.company}'s ${job.title} role, Mia should be positioned as a ${roleAngle} who connects finance-grade analytical discipline with lifecycle analytics, segmentation, and campaign execution. The strongest proof point is ${conversionProof}, supported by ${productProof}.`,
    coverNote: `I am interested in ${job.company}'s ${job.title} role because it combines ${job.roleFamily.toLowerCase()} work with remote collaboration. My background in customer lifecycle analytics, banking data products, and AI/product delivery can help the team turn user behavior into practical growth actions. I will review and submit this application manually through the official application link.`,
    recruiterDm: `Hi, I found the ${job.title} role at ${job.company}. My background combines customer lifecycle analytics, SQL/Python data work, and fintech product delivery, including campaign conversion up to 42%. I am exploring Web3 remote roles where this finance and growth analytics experience is useful. Could I ask whether this role is open to APAC-friendly remote candidates?`,
    hiringManagerDm: `Hi, I am interested in ${job.company}'s ${job.title} role. I have worked on lifecycle analytics, segmentation, campaign performance tracking, PRD/UAT coordination, and AI chatbot feasibility in regulated finance settings. I am not positioning myself as a smart contract engineer; my angle is helping product and growth teams make better decisions from customer and campaign data.`,
    portfolioHighlight: `Mention ${candidate.portfolioUrl} and connect it to ${web3Proof}.`,
    interviewTalkingPoints: [
      "Explain how lifecycle analytics across acquisition, activation, retention, churn risk, and reactivation transfers into Web3 growth.",
      "Use the 42% campaign conversion proof point to show measurable business impact.",
      "Describe PRD, UAT, dashboard, and cross-functional delivery experience as evidence for remote collaboration.",
      "Be transparent that Mia has no full-time Web3 company experience yet and is applying for analyst or operator roles, not Solidity engineering.",
    ],
    riskHandlingNote:
      "I have not worked full-time inside a Web3 company yet, but I bring finance-grade analytical discipline, customer lifecycle growth experience, and hands-on Web3 project work.",
    generatedAt: now.toISOString(),
  };
}
