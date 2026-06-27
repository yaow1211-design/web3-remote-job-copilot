export type RoleFamily =
  | "Growth Data Analyst"
  | "Business Analyst"
  | "Product / Operations Analyst"
  | "Research & Due Diligence Analyst";

export type JobStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "application_pack_ready"
  | "applied"
  | "dm_sent"
  | "follow_up_due"
  | "interview"
  | "rejected"
  | "archived";

export type Recommendation = "Strong Apply" | "Apply with Custom Pack" | "DM First" | "Portfolio Needed" | "Skip";
export type RemoteType = "remote" | "hybrid" | "onsite" | "unknown";
export type CryptoRequirementLevel = "none" | "interest" | "preferred" | "required" | "hard_blocker";
export type ContactChannel = "LinkedIn" | "X" | "Telegram" | "Email" | "Warm intro" | "Community";
export type MessageStatus = "Not contacted" | "DM drafted" | "DM sent" | "Follow-up due" | "Replied" | "Call booked" | "Rejected" | "No response";
export type RelationshipType = "recruiter" | "hiring manager" | "team member" | "founder" | "warm intro" | "community contact";
export type ActivityType =
  | "reviewed_job"
  | "shortlisted_job"
  | "generated_pack"
  | "submitted_application"
  | "sent_dm"
  | "sent_follow_up"
  | "received_reply"
  | "booked_interview"
  | "rejected";

export interface CandidateAsset {
  targetPositioning: string;
  linkedinHeadline: string;
  linkedinAbout: string;
  linkedinExperienceHighlights: string[];
  portfolioUrl: string;
  portfolioProjects: string[];
  resumeVersions: string[];
  featuredItems: string[];
  skillKeywords: string[];
  proofPoints: string[];
  riskDisclaimers: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  source: string;
  originalUrl: string;
  applyUrl: string;
  jdText: string;
  remoteType: RemoteType;
  locationConstraints: string;
  roleFamily: RoleFamily;
  seniority: string;
  requiredSkills: string[];
  preferredSkills: string[];
  cryptoRequirementLevel: CryptoRequirementLevel;
  salaryRange: string;
  postedAt: string;
  status: JobStatus;
  notes: string;
}

export interface FitRiskScore {
  overallScore: number;
  roleFit: number;
  transferableFinanceFit: number;
  growthDataFit: number;
  productOpsFit: number;
  web3Barrier: number;
  remoteCompatibility: number;
  languageFit: number;
  portfolioProofStrength: number;
  outreachOpportunity: number;
  recommendation: Recommendation;
  reasons: string[];
  risks: string[];
  suggestedAngle: RoleFamily;
}

export interface ApplicationPack {
  jobId: string;
  selectedResumeVersion: string;
  roleAngle: RoleFamily;
  tailoredSummary: string;
  coverNote: string;
  recruiterDm: string;
  hiringManagerDm: string;
  portfolioHighlight: string;
  interviewTalkingPoints: string[];
  riskHandlingNote: string;
  generatedAt: string;
}

export interface OutreachContact {
  id: string;
  jobId: string;
  name: string;
  company: string;
  role: string;
  channel: ContactChannel;
  profileUrl: string;
  relationshipType: RelationshipType;
  messageStatus: MessageStatus;
  followUpDate: string;
  replyStatus: string;
  notes: string;
}

export interface ApplicationActivity {
  id: string;
  jobId: string;
  actionType: ActivityType;
  channel: ContactChannel | "Application Portal";
  date: string;
  contentVersion: string;
  result: string;
  nextActionDate: string;
  notes: string;
}

export interface AppState {
  version: 1;
  candidate: CandidateAsset;
  jobs: Job[];
  packs: ApplicationPack[];
  contacts: OutreachContact[];
  activities: ApplicationActivity[];
}
