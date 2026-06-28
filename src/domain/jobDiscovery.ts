import { formatLocalDate } from "./date";
import type { DiscoveredJob, Job, CryptoRequirementLevel, RoleFamily } from "./types";

const DISCOVERY_SOURCE = "Remote OK";

const REMOTE_TERMS = [
  "remote",
  "worldwide",
  "work from anywhere",
  "anywhere",
  "distributed",
  "remote-first",
  "remote friendly",
];

const ONSITE_TERMS = [
  "onsite",
  "on-site",
  "in office",
  "in-office",
  "hybrid",
  "relocation",
  "fully in person",
];

const SOURCE_REMOTE_TERMS = ["remote ok", "remoteok", "remote"];
const GENERIC_LOCATION_TERMS = [
  "remote",
  "worldwide",
  "anywhere",
  "global",
  "europe",
  "usa",
  "us",
  "united states",
  "united kingdom",
  "uk",
  "european union",
];

const GROWTH_TERMS = ["growth", "user", "campaign", "lifecycle", "activation", "retention", "funnel", "segmentation"];
const PRODUCT_OPS_TERMS = ["prd", "uat", "operations", "dashboard", "workflow", "requirements", "stakeholder"];
const RESEARCH_TERMS = ["research", "due diligence", "on-chain", "on chain", "diligence", "screening", "protocol", "risk"];

const REQUIRED_SKILL_TERMS: Array<[string, string]> = [
  ["sql", "SQL"],
  ["python", "Python"],
  ["analytics", "analytics"],
  ["campaign", "campaign"],
  ["growth", "growth"],
  ["prd", "PRD"],
  ["uat", "UAT"],
  ["operations", "operations"],
  ["dashboard", "dashboard"],
];

const PREFERRED_SKILL_TERMS: Array<[string, string]> = [
  ["web3", "Web3"],
  ["crypto", "crypto"],
  ["defi", "DeFi"],
  ["blockchain", "blockchain"],
  ["on-chain", "on-chain"],
  ["on chain", "on-chain"],
  ["fintech", "fintech"],
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtmlTags(value: string): string {
  return normalizeWhitespace(value.replace(/<[^>]*>/g, " "));
}

function toText(value: unknown): string {
  return typeof value === "string" ? normalizeWhitespace(value) : "";
}

function toOptionalText(value: unknown): string | null {
  const text = toText(value);
  return text.length > 0 ? text : null;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => toText(entry)).filter((entry): entry is string => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => normalizeWhitespace(entry))
      .filter((entry) => entry.length > 0);
  }

  return [];
}

function normalizeLookupText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function hashString(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function buildDiscoveryId(source: string, originalUrl: string, title: string, company: string): string {
  return hashString([source, originalUrl, title, company].join("|"));
}

function toDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const localMidday = new Date(`${trimmed}T12:00:00`);
      if (!Number.isNaN(localMidday.valueOf())) {
        return localMidday;
      }
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed;
    }
  }

  return fallback;
}

function buildSearchText(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value)).join(" ").toLowerCase();
}

function hasExplicitRemoteSignal(title: string, description: string, location: string, tags: string[]): boolean {
  return includesAny(buildSearchText([title, description, location, ...tags]), REMOTE_TERMS);
}

function hasOnsiteSignal(title: string, description: string, location: string, tags: string[]): boolean {
  return includesAny(buildSearchText([title, description, location, ...tags]), ONSITE_TERMS);
}

function hasSourceRemoteSignal(source: string): boolean {
  return includesAny(normalizeLookupText(source), SOURCE_REMOTE_TERMS);
}

function hasGenericRemoteFriendlyLocation(location: string): boolean {
  if (!location.trim()) {
    return true;
  }

  const normalizedLocation = normalizeLookupText(location);

  return includesAny(normalizedLocation, GENERIC_LOCATION_TERMS);
}

function isRelevantDiscovery(title: string, description: string, location: string, tags: string[], source: string): boolean {
  const searchText = buildSearchText([title, description, location, source, ...tags]);
  const explicitRemoteSignal = hasExplicitRemoteSignal(title, description, location, tags);
  const sourceRemoteSignal = hasSourceRemoteSignal(source);
  const sourceLocationEligible = sourceRemoteSignal && hasGenericRemoteFriendlyLocation(location);
  const onsiteSignal = hasOnsiteSignal(title, description, location, tags);
  const web3Signal = includesAny(searchText, ["web3", "crypto", "blockchain", "defi", "on-chain", "on chain"]);

  if (onsiteSignal && !explicitRemoteSignal) {
    return false;
  }

  return explicitRemoteSignal || sourceLocationEligible || web3Signal;
}

function extractRequiredSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const skills: string[] = [];

  for (const [term, label] of REQUIRED_SKILL_TERMS) {
    if (lower.includes(term) && !skills.includes(label)) {
      skills.push(label);
    }
  }

  return skills;
}

function extractPreferredSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const skills: string[] = [];

  for (const [term, label] of PREFERRED_SKILL_TERMS) {
    if (lower.includes(term) && !skills.includes(label)) {
      skills.push(label);
    }
  }

  return skills;
}

function inferCryptoRequirementLevelFromText(text: string): CryptoRequirementLevel {
  const lower = text.toLowerCase();
  const preferredSignal = ["web3", "crypto", "blockchain", "defi"].some((term) => lower.includes(term));

  if (
    /(crypto|web3|blockchain|defi).{0,60}(required|mandatory|must have|must know|essential|needed|core)/.test(lower) ||
    /(required|mandatory|must have|must know|essential|needed|core).{0,60}(crypto|web3|blockchain|defi)/.test(lower)
  ) {
    return "required";
  }

  if (preferredSignal) {
    return "preferred";
  }

  return "none";
}

function buildLocationConstraints(location: string): string {
  return location || "";
}

export function inferRoleFamilyFromText(text: string): RoleFamily {
  const lower = text.toLowerCase();

  if (includesAny(lower, GROWTH_TERMS)) {
    return "Growth Data Analyst";
  }

  if (includesAny(lower, PRODUCT_OPS_TERMS)) {
    return "Product / Operations Analyst";
  }

  if (includesAny(lower, RESEARCH_TERMS)) {
    return "Research & Due Diligence Analyst";
  }

  return "Business Analyst";
}

function buildDiscoveredJob(rawItem: unknown, now: Date): DiscoveredJob | null {
  if (!rawItem || typeof rawItem !== "object") {
    return null;
  }

  const record = rawItem as Record<string, unknown>;
  const title = toOptionalText(record.position ?? record.title);
  const company = toOptionalText(record.company);
  const originalUrl = toOptionalText(record.url ?? record.originalUrl);

  if (!title || !company || !originalUrl) {
    return null;
  }

  const description = stripHtmlTags(toText(record.description));
  const tags = toStringArray(record.tags);
  const location = toText(record.location);
  const source = toOptionalText(record.source) ?? DISCOVERY_SOURCE;

  if (!isRelevantDiscovery(title, description, location, tags, source)) {
    return null;
  }

  const postedAt = formatLocalDate(toDate(record.date, now));

  return {
    id: buildDiscoveryId(source, originalUrl, title, company),
    title,
    company,
    source,
    originalUrl,
    applyUrl: toOptionalText(record.applyUrl ?? record.apply_url) ?? originalUrl,
    description,
    tags,
    location,
    postedAt,
  };
}

export function normalizeRemoteOkJobs(rawItems: unknown[], now: Date = new Date()): DiscoveredJob[] {
  return rawItems.map((item) => buildDiscoveredJob(item, now)).filter((item): item is DiscoveredJob => item !== null);
}

export function toJobFromDiscoveredJob(discoveredJob: DiscoveredJob, now: Date = new Date()): Job {
  const combinedText = buildSearchText([
    discoveredJob.title,
    discoveredJob.description,
    discoveredJob.location,
    discoveredJob.source,
    ...discoveredJob.tags,
  ]);

  return {
    id: discoveredJob.id,
    title: discoveredJob.title,
    company: discoveredJob.company,
    source: discoveredJob.source,
    originalUrl: discoveredJob.originalUrl,
    applyUrl: discoveredJob.applyUrl,
    jdText: discoveredJob.description,
    remoteType: "remote",
    locationConstraints: buildLocationConstraints(discoveredJob.location),
    roleFamily: inferRoleFamilyFromText(combinedText),
    seniority: "Unspecified",
    requiredSkills: extractRequiredSkills(combinedText),
    preferredSkills: extractPreferredSkills(combinedText),
    cryptoRequirementLevel: inferCryptoRequirementLevelFromText(combinedText),
    salaryRange: "",
    postedAt: discoveredJob.postedAt || formatLocalDate(now),
    status: "new",
    notes: "",
  };
}

export function dedupeDiscoveredJobs(discoveredJobs: DiscoveredJob[], existingJobs: Job[]): DiscoveredJob[] {
  const existingUrls = new Set(existingJobs.map((job) => normalizeLookupText(job.originalUrl)));
  const existingPairs = new Set(existingJobs.map((job) => `${normalizeLookupText(job.title)}|${normalizeLookupText(job.company)}`));
  const seenUrls = new Set<string>();
  const seenPairs = new Set<string>();

  return discoveredJobs.filter((job) => {
    const normalizedUrl = normalizeLookupText(job.originalUrl);
    const normalizedPair = `${normalizeLookupText(job.title)}|${normalizeLookupText(job.company)}`;

    if (existingUrls.has(normalizedUrl) || existingPairs.has(normalizedPair)) {
      return false;
    }

    if (seenUrls.has(normalizedUrl) || seenPairs.has(normalizedPair)) {
      return false;
    }

    seenUrls.add(normalizedUrl);
    seenPairs.add(normalizedPair);
    return true;
  });
}

export type { DiscoveredJob } from "./types";
