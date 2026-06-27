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

const CRYPTO_TERMS = "(?:crypto|web3|defi|blockchain)";
const CRYPTO_SIGNAL_TERMS = "(?:experience|knowledge|background|expertise|skills?)";

function inferCryptoRequirementLevel(title: string, jdText: string): Job["cryptoRequirementLevel"] {
  const text = [title, jdText].join(" ").toLowerCase().replace(/\s+/g, " ").trim();

  if (!text) {
    return "none";
  }

  const cryptoTermPattern = new RegExp(`\\b${CRYPTO_TERMS}\\b`);

  const negatedRequirementPatterns = [
    new RegExp(
      `\\b${CRYPTO_TERMS}\\b.{0,40}\\b${CRYPTO_SIGNAL_TERMS}\\b.{0,20}\\b(?:not required|optional|not needed|not necessary|nice to have|not mandatory)\\b`,
    ),
    new RegExp(`\\b(?:no|without)\\s+${CRYPTO_TERMS}(?:\\s+${CRYPTO_SIGNAL_TERMS})?(?:\\s+(?:required|needed|mandatory))?\\b`),
    new RegExp(`\\b${CRYPTO_TERMS}\\b.{0,20}\\b(?:is|are)?\\s*not\\s+(?:required|needed|mandatory)\\b`),
  ];

  if (negatedRequirementPatterns.some((pattern) => pattern.test(text))) {
    return "none";
  }

  const requiredPatterns = [
    new RegExp(`\\b${CRYPTO_TERMS}\\b.{0,40}\\b${CRYPTO_SIGNAL_TERMS}\\b.{0,20}\\b(?:required|must have|mandatory|needed|essential)\\b`),
    new RegExp(`\\b(?:must have|required|mandatory|needed|essential)\\b.{0,40}\\b${CRYPTO_TERMS}\\b.{0,40}\\b${CRYPTO_SIGNAL_TERMS}\\b`),
    new RegExp(`\\b${CRYPTO_TERMS}\\s+${CRYPTO_SIGNAL_TERMS}\\s+(?:is\\s+)?(?:required|mandatory|needed|essential)\\b`),
  ];

  if (requiredPatterns.some((pattern) => pattern.test(text))) {
    return "required";
  }

  if (cryptoTermPattern.test(text)) {
    return "preferred";
  }

  return "none";
}

export function JobInbox({ jobs, selectedJobId, onSelectJob, onAddJob }: JobInboxProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const company = String(form.get("company") ?? "").trim();
    const jdText = String(form.get("jdText") ?? "").trim();
    const originalUrl = String(form.get("originalUrl") ?? "").trim();
    const applyUrl = String(form.get("applyUrl") ?? "").trim();
    const roleFamily = String(form.get("roleFamily") ?? "Growth Data Analyst") as RoleFamily;
    const hasJdText = jdText.length > 0;
    const hasMeaningfulIntake =
      title.length > 0 || company.length > 0 || hasJdText || originalUrl.length > 0 || applyUrl.length > 0;

    if (!hasMeaningfulIntake) {
      return;
    }

    const resolvedTitle = title || "Imported role from URL";
    const resolvedCompany = company || "Company to verify";
    const jdTextValue = hasJdText
      ? jdText
      : "Manual URL import. Review the original job link before applying.";
    const source = hasJdText ? "Pasted JD" : "Manual URL";
    const skillText = [title, company, jdText].join(" ");

    onAddJob({
      id: `job-${Date.now()}`,
      title: resolvedTitle,
      company: resolvedCompany,
      source,
      originalUrl,
      applyUrl,
      jdText: jdTextValue,
      remoteType: "remote",
      locationConstraints: "Manual review needed",
      roleFamily,
      seniority: "Manual review needed",
      requiredSkills: skillText.match(/SQL|Python|PRD|UAT|analytics|operations/gi) ?? [],
      preferredSkills: skillText.match(/crypto|Web3|DeFi|fintech|growth/gi) ?? [],
      cryptoRequirementLevel: inferCryptoRequirementLevel(title, jdText),
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
