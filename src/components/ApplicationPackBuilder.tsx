import { generateApplicationPack } from "../domain/applicationPack";
import { scoreJob } from "../domain/scoring";
import type { ApplicationPack, CandidateAsset, Job } from "../domain/types";

export type PackStatusFilter =
  | "all"
  | "not_applied"
  | "applied"
  | "shortlisted"
  | "pack_ready"
  | "interview"
  | "rejected";

interface ApplicationPackBuilderProps {
  candidate: CandidateAsset;
  jobs: Job[];
  selectedJobId: string;
  searchQuery: string;
  statusFilter: PackStatusFilter;
  packs: ApplicationPack[];
  onSelectJob: (jobId: string) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (filter: PackStatusFilter) => void;
  onSavePack: (pack: ApplicationPack) => void;
}

const FILTER_LABELS: Record<PackStatusFilter, string> = {
  all: "All",
  not_applied: "Not applied",
  applied: "Applied",
  shortlisted: "Shortlisted",
  pack_ready: "Pack ready",
  interview: "Interview",
  rejected: "Rejected",
};

export function isAppliedForFilter(job: Job): boolean {
  return ["applied", "interview", "rejected"].includes(job.status);
}

export function matchesPackStatusFilter(job: Job, filter: PackStatusFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "not_applied") {
    return !isAppliedForFilter(job);
  }

  if (filter === "applied") {
    return isAppliedForFilter(job);
  }

  if (filter === "pack_ready") {
    return job.status === "application_pack_ready";
  }

  return job.status === filter;
}

export function matchesPackSearch(job: Job, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    job.title,
    job.company,
    job.roleFamily,
    job.status,
    job.originalUrl,
    job.applyUrl,
    job.jdText,
    job.requiredSkills.join(" "),
    job.preferredSkills.join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function ApplicationPackBuilder({
  candidate,
  jobs,
  selectedJobId,
  searchQuery,
  statusFilter,
  packs,
  onSelectJob,
  onSearchChange,
  onStatusFilterChange,
  onSavePack,
}: ApplicationPackBuilderProps) {
  const filteredJobs = jobs.filter(
    (job) => matchesPackStatusFilter(job, statusFilter) && matchesPackSearch(job, searchQuery),
  );
  const selectedJob = filteredJobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0];
  const pack = selectedJob ? packs.find((item) => item.jobId === selectedJob.id) : undefined;

  function handleGenerate() {
    if (!selectedJob) {
      return;
    }

    onSavePack(generateApplicationPack(selectedJob, candidate, scoreJob(selectedJob, candidate)));
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Application Pack Builder</p>
        <h2>{selectedJob ? `${selectedJob.title} · ${selectedJob.company}` : "Select a job"}</h2>
        <p>Generate tailored materials for review. No application or message will be sent automatically.</p>
      </div>

      <div className="pack-selector">
        <label>
          Search jobs
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title, company, URL, JD, skills"
          />
        </label>

        <label>
          Filter jobs
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as PackStatusFilter)}
          >
            {(Object.keys(FILTER_LABELS) as PackStatusFilter[]).map((filter) => (
              <option key={filter} value={filter}>
                {FILTER_LABELS[filter]}
              </option>
            ))}
          </select>
        </label>

        <div className="pack-job-list" aria-label="Application pack job choices">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <button
                key={job.id}
                aria-label={`${job.title} ${job.company} ${job.status}`}
                className={job.id === selectedJob?.id ? "list-item active" : "list-item"}
                type="button"
                onClick={() => onSelectJob(job.id)}
              >
                <strong>{job.title}</strong>
                <span>
                  {job.company} · {job.status}
                </span>
              </button>
            ))
          ) : (
            <p>No jobs match this search and filter.</p>
          )}
        </div>
      </div>

      <button className="primary-button" type="button" onClick={handleGenerate} disabled={!selectedJob}>
        Generate pack
      </button>

      {pack ? (
        <>
          <p className="manual-note">I will review and send this manually.</p>

          <div className="pack-grid">
            <section>
              <h3>Tailored Summary</h3>
              <p>{pack.tailoredSummary}</p>
            </section>

            <section>
              <h3>Cover Note</h3>
              <p>{pack.coverNote}</p>
            </section>

            <section>
              <h3>Recruiter DM</h3>
              <textarea readOnly rows={5} value={pack.recruiterDm} />
            </section>

            <section>
              <h3>Hiring Manager DM</h3>
              <textarea readOnly rows={6} value={pack.hiringManagerDm} />
            </section>

            <section>
              <h3>Portfolio Highlight</h3>
              <p>{pack.portfolioHighlight}</p>
            </section>

            <section>
              <h3>Interview Talking Points</h3>
              <ul>
                {pack.interviewTalkingPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>

            <section>
              <h3>Risk Handling Note</h3>
              <p>{pack.riskHandlingNote}</p>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}
