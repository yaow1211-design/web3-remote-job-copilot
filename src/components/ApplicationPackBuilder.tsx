import { generateApplicationPack } from "../domain/applicationPack";
import { scoreJob } from "../domain/scoring";
import type { ApplicationPack, CandidateAsset, Job } from "../domain/types";

interface ApplicationPackBuilderProps {
  candidate: CandidateAsset;
  job: Job;
  pack: ApplicationPack | undefined;
  onSavePack: (pack: ApplicationPack) => void;
}

export function ApplicationPackBuilder({
  candidate,
  job,
  pack,
  onSavePack,
}: ApplicationPackBuilderProps) {
  function handleGenerate() {
    onSavePack(generateApplicationPack(job, candidate, scoreJob(job, candidate)));
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Application Pack Builder</p>
        <h2>
          {job.title} · {job.company}
        </h2>
        <p>
          Generate tailored materials for review. No application or message will be sent
          automatically.
        </p>
      </div>

      <button className="primary-button" type="button" onClick={handleGenerate}>
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
