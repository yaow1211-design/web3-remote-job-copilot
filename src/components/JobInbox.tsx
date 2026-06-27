import type { FormEvent } from "react";
import type { Job, RoleFamily } from "../domain/types";

interface JobInboxProps {
  jobs: Job[];
  selectedJobId: string;
  onSelectJob: (jobId: string) => void;
  onAddJob: (job: Job) => void;
}

const ROLE_FAMILIES: RoleFamily[] = [
  "Growth Data Analyst",
  "Business Analyst",
  "Product / Operations Analyst",
  "Research & Due Diligence Analyst",
];

export function JobInbox({ jobs, selectedJobId, onSelectJob, onAddJob }: JobInboxProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const company = String(form.get("company") ?? "").trim();
    const jdText = String(form.get("jdText") ?? "").trim();
    const roleFamily = String(form.get("roleFamily") ?? "Growth Data Analyst") as RoleFamily;

    if (!title || !company || !jdText) {
      return;
    }

    const lowerJdText = jdText.toLowerCase();

    onAddJob({
      id: `job-${Date.now()}`,
      title,
      company,
      source: "Pasted JD",
      originalUrl: String(form.get("originalUrl") ?? "").trim(),
      applyUrl: String(form.get("applyUrl") ?? "").trim(),
      jdText,
      remoteType: "remote",
      locationConstraints: "Manual review needed",
      roleFamily,
      seniority: "Manual review needed",
      requiredSkills: jdText.match(/SQL|Python|PRD|UAT|analytics|operations/gi) ?? [],
      preferredSkills: jdText.match(/crypto|Web3|DeFi|fintech|growth/gi) ?? [],
      cryptoRequirementLevel:
        lowerJdText.includes("required") && lowerJdText.includes("crypto") ? "required" : "preferred",
      salaryRange: "",
      postedAt: new Date().toISOString().slice(0, 10),
      status: "new",
      notes: "",
    });

    event.currentTarget.reset();
  }

  return (
    <section className="grid-two">
      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow-dark">Job Inbox</p>
          <h2>Manual Job Intake</h2>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Job title
            <input name="title" />
          </label>

          <label>
            Company
            <input name="company" />
          </label>

          <label>
            Role family
            <select name="roleFamily" defaultValue="Growth Data Analyst">
              {ROLE_FAMILIES.map((roleFamily) => (
                <option key={roleFamily}>{roleFamily}</option>
              ))}
            </select>
          </label>

          <label>
            Original URL
            <input name="originalUrl" />
          </label>

          <label>
            Apply URL
            <input name="applyUrl" />
          </label>

          <label className="span-all">
            JD text
            <textarea name="jdText" rows={7} />
          </label>

          <button className="primary-button" type="submit">
            Add job
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="section-heading">
          <p className="eyebrow-dark">Pipeline</p>
          <h2>{jobs.length} Jobs</h2>
        </div>

        <div className="item-list">
          {jobs.map((job) => (
            <button
              key={job.id}
              className={job.id === selectedJobId ? "list-item active" : "list-item"}
              type="button"
              onClick={() => onSelectJob(job.id)}
            >
              <strong>{job.title}</strong>
              <span>
                {job.company} · {job.status}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
