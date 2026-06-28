import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { dedupeDiscoveredJobs, toJobFromDiscoveredJob, type DiscoveredJob } from "../domain/jobDiscovery";
import { scoreJob } from "../domain/scoring";
import type { CandidateAsset, Job } from "../domain/types";
import { fetchDiscoveredJobs } from "../services/jobDiscoveryClient";

interface JobDiscoveryPanelProps {
  candidate: CandidateAsset;
  jobs: Job[];
  onAddJob: (job: Job) => void;
}

const ERROR_MESSAGE = "Job discovery failed. Manual intake is still available.";

export function JobDiscoveryPanel({ candidate, jobs, onAddJob }: JobDiscoveryPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [discoveredJobs, setDiscoveredJobs] = useState<DiscoveredJob[]>([]);

  const importableIds = useMemo(() => {
    return new Set(dedupeDiscoveredJobs(discoveredJobs, jobs).map((job) => job.id));
  }, [discoveredJobs, jobs]);

  const rankedJobs = useMemo(() => {
    return discoveredJobs
      .map((discoveredJob) => {
        const job = toJobFromDiscoveredJob(discoveredJob);
        const fitScore = scoreJob(job, candidate);

        return {
          discoveredJob,
          job,
          fitScore,
          alreadyInInbox: !importableIds.has(discoveredJob.id),
        };
      })
      .sort((left, right) => right.fitScore.overallScore - left.fitScore.overallScore)
      .slice(0, 10);
  }, [candidate, discoveredJobs, importableIds]);

  async function handleFetchJobs() {
    setLoading(true);
    setError("");

    try {
      const jobsFromDiscovery = await fetchDiscoveredJobs();
      setDiscoveredJobs(jobsFromDiscovery);
    } catch {
      setError(ERROR_MESSAGE);
      setDiscoveredJobs([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel discovery-panel" aria-label="Job discovery">
      <div className="section-heading">
        <p className="eyebrow-dark">Auto Discover</p>
        <h2>Remote job discovery for Mia</h2>
        <p>No applications or DMs are sent automatically. Mia reviews every match before any manual next step.</p>
      </div>

      <div className="outreach-actions">
        <button className="primary-button" type="button" onClick={handleFetchJobs} disabled={loading}>
          <Search aria-hidden="true" size={16} />
          <span>{loading ? "Fetching..." : "Fetch Web3 remote jobs"}</span>
        </button>
      </div>

      {error ? <p className="error-note">{error}</p> : null}

      {rankedJobs.length > 0 ? (
        <section className="match-list" aria-label="Top matches for Mia">
          <div className="section-heading">
            <p className="eyebrow-dark">Top matches for Mia</p>
            <h2>Top matches for Mia</h2>
          </div>

          {rankedJobs.map(({ discoveredJob, job, fitScore, alreadyInInbox }) => (
            <article
              key={discoveredJob.id}
              className="match-card"
              aria-label={`${discoveredJob.title} ${discoveredJob.company}`}
            >
              <div className="match-meta">
                <div>
                  <h3>{discoveredJob.title}</h3>
                  <p>
                    {discoveredJob.company} · {discoveredJob.source}
                  </p>
                </div>
                <span className="score-pill">{fitScore.overallScore}</span>
              </div>

              <p>
                <strong>Recommendation:</strong> {fitScore.recommendation}
              </p>
              <p>{discoveredJob.description}</p>
              <p>
                <strong>Why it fits Mia:</strong>
              </p>
              <ul className="archive-list">
                {fitScore.reasons.slice(0, 2).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <div className="outreach-actions">
                <a
                  className="secondary-button link-button"
                  href={discoveredJob.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink aria-hidden="true" size={16} />
                  <span>Open original link</span>
                </a>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => onAddJob(job)}
                  disabled={alreadyInInbox}
                >
                  {alreadyInInbox ? "Already in inbox" : "Add to Job Inbox"}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </section>
  );
}
