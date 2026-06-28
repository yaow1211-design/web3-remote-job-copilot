import type { ApplicationActivity, Job, OutreachContact } from "./domain/types";

export const sampleJobs: Job[] = [
  {
    id: "job-1",
    title: "Growth Data Analyst",
    company: "Example Web3 Wallet",
    source: "Manual URL",
    originalUrl: "https://example.com/jobs/growth-data-analyst",
    applyUrl: "https://example.com/jobs/growth-data-analyst/apply",
    jdText:
      "Remote Growth Data Analyst role for a wallet team. SQL, lifecycle analysis, funnel metrics, campaign analysis, and interest in crypto preferred. APAC timezone friendly.",
    remoteType: "remote",
    locationConstraints: "Worldwide / APAC friendly",
    roleFamily: "Growth Data Analyst",
    seniority: "Mid-level",
    requiredSkills: ["SQL", "Lifecycle Analytics", "Campaign Analysis"],
    preferredSkills: ["Crypto interest", "Wallet product experience"],
    cryptoRequirementLevel: "preferred",
    salaryRange: "",
    postedAt: "2026-06-28",
    status: "new",
    notes: "Good first target for portfolio angle.",
  },
  {
    id: "job-2",
    title: "Business Analyst, Fintech Operations",
    company: "Example Global Fintech",
    source: "Pasted JD",
    originalUrl: "",
    applyUrl: "",
    jdText:
      "Remote business analyst role for fintech operations. Requires stakeholder communication, process analysis, dashboard requirements, SQL, and English documentation.",
    remoteType: "remote",
    locationConstraints: "Worldwide",
    roleFamily: "Business Analyst",
    seniority: "Associate / Mid-level",
    requiredSkills: ["SQL", "Business Analysis", "Stakeholder Communication"],
    preferredSkills: ["Fintech", "Product operations"],
    cryptoRequirementLevel: "none",
    salaryRange: "",
    postedAt: "2026-06-28",
    status: "shortlisted",
    notes: "Web3-adjacent fallback with higher landing probability.",
  },
];

export const sampleContacts: OutreachContact[] = [
  {
    id: "contact-1",
    jobId: "job-1",
    name: "Hiring Team",
    company: "Example Web3 Wallet",
    role: "Recruiter",
    channel: "LinkedIn",
    profileUrl: "",
    relationshipType: "recruiter",
    messageStatus: "Not contacted",
    followUpDate: "",
    replyStatus: "",
    notes: "Manual contact entry only.",
  },
];

export const sampleActivities: ApplicationActivity[] = [
  {
    id: "activity-1",
    jobId: "job-2",
    actionType: "reviewed_job",
    channel: "Application Portal",
    date: "2026-06-28",
    contentVersion: "Initial review",
    result: "Shortlisted",
    nextActionDate: "2026-06-29",
    notes: "Generate application pack next.",
  },
];
