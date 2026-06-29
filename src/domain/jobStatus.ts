import type { JobStatus } from "./types";

const APPLIED_GROUP_STATUSES: JobStatus[] = ["applied", "interview", "rejected"];

export function isAppliedStatus(status: JobStatus): boolean {
  return APPLIED_GROUP_STATUSES.includes(status);
}
