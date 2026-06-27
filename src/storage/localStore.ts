import { seedCandidate } from "../domain/seedCandidate";
import type {
  ActivityType,
  AppState,
  ApplicationActivity,
  ApplicationPack,
  CandidateAsset,
  ContactChannel,
  CryptoRequirementLevel,
  Job,
  JobStatus,
  MessageStatus,
  OutreachContact,
  RelationshipType,
  RemoteType,
  RoleFamily,
} from "../domain/types";
import { sampleActivities, sampleContacts, sampleJobs } from "../sampleData";

const STORAGE_KEY = "web3-remote-job-copilot:v1";

type AppStateShape = Pick<AppState, "version" | "candidate" | "jobs" | "packs" | "contacts" | "activities">;
type ValidationContext = {
  errors: string[];
};

const ROLE_FAMILIES: RoleFamily[] = [
  "Growth Data Analyst",
  "Business Analyst",
  "Product / Operations Analyst",
  "Research & Due Diligence Analyst",
];
const JOB_STATUSES: JobStatus[] = [
  "new",
  "reviewed",
  "shortlisted",
  "application_pack_ready",
  "applied",
  "dm_sent",
  "follow_up_due",
  "interview",
  "rejected",
  "archived",
];
const REMOTE_TYPES: RemoteType[] = ["remote", "hybrid", "onsite", "unknown"];
const CRYPTO_REQUIREMENT_LEVELS: CryptoRequirementLevel[] = ["none", "interest", "preferred", "required", "hard_blocker"];
const CONTACT_CHANNELS: ContactChannel[] = ["LinkedIn", "X", "Telegram", "Email", "Warm intro", "Community"];
const MESSAGE_STATUSES: MessageStatus[] = [
  "Not contacted",
  "DM drafted",
  "DM sent",
  "Follow-up due",
  "Replied",
  "Call booked",
  "Rejected",
  "No response",
];
const RELATIONSHIP_TYPES: RelationshipType[] = [
  "recruiter",
  "hiring manager",
  "team member",
  "founder",
  "warm intro",
  "community contact",
];
const ACTIVITY_TYPES: ActivityType[] = [
  "reviewed_job",
  "shortlisted_job",
  "generated_pack",
  "submitted_application",
  "sent_dm",
  "sent_follow_up",
  "received_reply",
  "booked_interview",
  "rejected",
];
const ACTIVITY_CHANNELS = [...CONTACT_CHANNELS, "Application Portal"] as const;

function getDefaultStorage(): Storage {
  return window.localStorage;
}

export function createInitialAppState(): AppState {
  return {
    version: 1,
    candidate: seedCandidate,
    jobs: sampleJobs,
    packs: [],
    contacts: sampleContacts,
    activities: sampleActivities,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function appendError(context: ValidationContext, message: string) {
  context.errors.push(message);
}

function validateString(value: unknown, path: string, context: ValidationContext): value is string {
  if (typeof value !== "string") {
    appendError(context, `${path} must be a string`);
    return false;
  }

  return true;
}

function validateStringArray(value: unknown, path: string, context: ValidationContext): value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    appendError(context, `${path} must be a string array`);
    return false;
  }

  return true;
}

function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  path: string,
  context: ValidationContext,
): value is T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    appendError(context, `${path} must be one of: ${allowedValues.join(", ")}`);
    return false;
  }

  return true;
}

function validateCandidateAsset(value: unknown, path: string, context: ValidationContext): value is CandidateAsset {
  if (!isRecord(value)) {
    appendError(context, `${path} must be an object`);
    return false;
  }

  validateString(value.targetPositioning, `${path}.targetPositioning`, context);
  validateString(value.linkedinHeadline, `${path}.linkedinHeadline`, context);
  validateString(value.linkedinAbout, `${path}.linkedinAbout`, context);
  validateStringArray(value.linkedinExperienceHighlights, `${path}.linkedinExperienceHighlights`, context);
  validateString(value.portfolioUrl, `${path}.portfolioUrl`, context);
  validateStringArray(value.portfolioProjects, `${path}.portfolioProjects`, context);
  validateStringArray(value.resumeVersions, `${path}.resumeVersions`, context);
  validateStringArray(value.featuredItems, `${path}.featuredItems`, context);
  validateStringArray(value.skillKeywords, `${path}.skillKeywords`, context);
  validateStringArray(value.proofPoints, `${path}.proofPoints`, context);
  validateStringArray(value.riskDisclaimers, `${path}.riskDisclaimers`, context);

  return true;
}

function validateJob(value: unknown, path: string, context: ValidationContext): value is Job {
  if (!isRecord(value)) {
    appendError(context, `${path} must be an object`);
    return false;
  }

  validateString(value.id, `${path}.id`, context);
  validateString(value.title, `${path}.title`, context);
  validateString(value.company, `${path}.company`, context);
  validateString(value.source, `${path}.source`, context);
  validateString(value.originalUrl, `${path}.originalUrl`, context);
  validateString(value.applyUrl, `${path}.applyUrl`, context);
  validateString(value.jdText, `${path}.jdText`, context);
  validateEnum(value.remoteType, REMOTE_TYPES, `${path}.remoteType`, context);
  validateString(value.locationConstraints, `${path}.locationConstraints`, context);
  validateEnum(value.roleFamily, ROLE_FAMILIES, `${path}.roleFamily`, context);
  validateString(value.seniority, `${path}.seniority`, context);
  validateStringArray(value.requiredSkills, `${path}.requiredSkills`, context);
  validateStringArray(value.preferredSkills, `${path}.preferredSkills`, context);
  validateEnum(value.cryptoRequirementLevel, CRYPTO_REQUIREMENT_LEVELS, `${path}.cryptoRequirementLevel`, context);
  validateString(value.salaryRange, `${path}.salaryRange`, context);
  validateString(value.postedAt, `${path}.postedAt`, context);
  validateEnum(value.status, JOB_STATUSES, `${path}.status`, context);
  validateString(value.notes, `${path}.notes`, context);

  return true;
}

function validateApplicationPack(value: unknown, path: string, context: ValidationContext): value is ApplicationPack {
  if (!isRecord(value)) {
    appendError(context, `${path} must be an object`);
    return false;
  }

  validateString(value.jobId, `${path}.jobId`, context);
  validateString(value.selectedResumeVersion, `${path}.selectedResumeVersion`, context);
  validateEnum(value.roleAngle, ROLE_FAMILIES, `${path}.roleAngle`, context);
  validateString(value.tailoredSummary, `${path}.tailoredSummary`, context);
  validateString(value.coverNote, `${path}.coverNote`, context);
  validateString(value.recruiterDm, `${path}.recruiterDm`, context);
  validateString(value.hiringManagerDm, `${path}.hiringManagerDm`, context);
  validateString(value.portfolioHighlight, `${path}.portfolioHighlight`, context);
  validateStringArray(value.interviewTalkingPoints, `${path}.interviewTalkingPoints`, context);
  validateString(value.riskHandlingNote, `${path}.riskHandlingNote`, context);
  validateString(value.generatedAt, `${path}.generatedAt`, context);

  return true;
}

function validateOutreachContact(value: unknown, path: string, context: ValidationContext): value is OutreachContact {
  if (!isRecord(value)) {
    appendError(context, `${path} must be an object`);
    return false;
  }

  validateString(value.id, `${path}.id`, context);
  validateString(value.jobId, `${path}.jobId`, context);
  validateString(value.name, `${path}.name`, context);
  validateString(value.company, `${path}.company`, context);
  validateString(value.role, `${path}.role`, context);
  validateEnum(value.channel, CONTACT_CHANNELS, `${path}.channel`, context);
  validateString(value.profileUrl, `${path}.profileUrl`, context);
  validateEnum(value.relationshipType, RELATIONSHIP_TYPES, `${path}.relationshipType`, context);
  validateEnum(value.messageStatus, MESSAGE_STATUSES, `${path}.messageStatus`, context);
  validateString(value.followUpDate, `${path}.followUpDate`, context);
  validateString(value.replyStatus, `${path}.replyStatus`, context);
  validateString(value.notes, `${path}.notes`, context);

  return true;
}

function validateApplicationActivity(
  value: unknown,
  path: string,
  context: ValidationContext,
): value is ApplicationActivity {
  if (!isRecord(value)) {
    appendError(context, `${path} must be an object`);
    return false;
  }

  validateString(value.id, `${path}.id`, context);
  validateString(value.jobId, `${path}.jobId`, context);
  validateEnum(value.actionType, ACTIVITY_TYPES, `${path}.actionType`, context);
  validateEnum(value.channel, ACTIVITY_CHANNELS, `${path}.channel`, context);
  validateString(value.date, `${path}.date`, context);
  validateString(value.contentVersion, `${path}.contentVersion`, context);
  validateString(value.result, `${path}.result`, context);
  validateString(value.nextActionDate, `${path}.nextActionDate`, context);
  validateString(value.notes, `${path}.notes`, context);

  return true;
}

function validateArray<T>(
  value: unknown,
  path: string,
  context: ValidationContext,
  itemValidator: (item: unknown, itemPath: string, nextContext: ValidationContext) => item is T,
): value is T[] {
  if (!Array.isArray(value)) {
    appendError(context, `${path} must be an array`);
    return false;
  }

  value.forEach((item, index) => {
    itemValidator(item, `${path}[${index}]`, context);
  });

  return true;
}

function validateAppState(value: unknown): { state?: AppState; errors: string[] } {
  const context: ValidationContext = { errors: [] };

  if (!isRecord(value)) {
    appendError(context, "App state must be an object");
    return context;
  }

  if (value.version !== 1) {
    appendError(context, "version must be 1");
  }

  const requiredKeys = ["candidate", "jobs", "packs", "contacts", "activities"] as const;
  const missingRequiredKeys = requiredKeys.filter((key) => !(key in value));

  if (missingRequiredKeys.length > 0) {
    appendError(context, `missing required fields: ${missingRequiredKeys.join(", ")}`);
    return context;
  }

  validateCandidateAsset(value.candidate, "candidate", context);
  validateArray(value.jobs, "jobs", context, validateJob);
  validateArray(value.packs, "packs", context, validateApplicationPack);
  validateArray(value.contacts, "contacts", context, validateOutreachContact);
  validateArray(value.activities, "activities", context, validateApplicationActivity);

  return context.errors.length === 0 ? { state: value as unknown as AppState, errors: [] } : context;
}

export function loadAppState(storage: Storage = getDefaultStorage()): AppState {
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return createInitialAppState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const { state } = validateAppState(parsed);
    return state ?? createInitialAppState();
  } catch {
    return createInitialAppState();
  }
}

export function saveAppState(state: AppState, storage: Storage = getDefaultStorage()): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportAppState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importAppState(json: string): AppState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Backup is not valid JSON");
  }

  const { state, errors } = validateAppState(parsed);

  if (!state) {
    if (
      errors.length === 0 ||
      errors.some(
        (error) =>
          error === "App state must be an object" ||
          error === "version must be 1" ||
          error.startsWith("missing required fields: "),
      )
    ) {
      throw new Error("Backup is missing required app state fields");
    }

    throw new Error(`Backup validation failed: ${errors.join("; ")}`);
  }

  return state;
}
