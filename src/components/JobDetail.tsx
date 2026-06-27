import { scoreJob } from "../domain/scoring";
import type { CandidateAsset, Job, JobStatus } from "../domain/types";

interface JobDetailProps {
  candidate: CandidateAsset;
  job: Job;
  onUpdateJob: (job: Job) => void;
}

const STATUSES: JobStatus[] = [
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

export function JobDetail({ candidate, job, onUpdateJob }: JobDetailProps) {
  const score = scoreJob(job, candidate);

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Fit & Risk Score</p>
        <h2>
          {job.title} · {job.company}
        </h2>
      </div>

      <div className="score-row">
        <div>
          <span className="score-number">{score.overallScore}</span>
          <p>Overall Score</p>
        </div>

        <div>
          <span className="badge">{score.recommendation}</span>
          <p>Recommendation</p>
        </div>
      </div>

      <label>
        Status
        <select
          value={job.status}
          onChange={(event) => onUpdateJob({ ...job, status: event.target.value as JobStatus })}
        >
          {STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>

      <h3>Why this fits Mia</h3>
      <ul>
        {score.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>

      <h3>Risks</h3>
      <ul>
        {(score.risks.length
          ? score.risks
          : ["No hard blocker detected. Human review still required."]
        ).map((risk) => (
          <li key={risk}>{risk}</li>
        ))}
      </ul>
    </section>
  );
}
