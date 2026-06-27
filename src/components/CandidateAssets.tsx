import type { CandidateAsset } from "../domain/types";

interface CandidateAssetsProps {
  candidate: CandidateAsset;
  onChange: (candidate: CandidateAsset) => void;
}

function updateList(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CandidateAssets({ candidate, onChange }: CandidateAssetsProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Candidate Asset Layer</p>
        <h2>Positioning Consistency</h2>
      </div>

      <div className="form-grid">
        <label>
          Target positioning
          <input
            value={candidate.targetPositioning}
            onChange={(event) => onChange({ ...candidate, targetPositioning: event.target.value })}
          />
        </label>

        <label>
          LinkedIn headline
          <input
            value={candidate.linkedinHeadline}
            onChange={(event) => onChange({ ...candidate, linkedinHeadline: event.target.value })}
          />
        </label>

        <label className="span-all">
          Portfolio URL
          <input
            value={candidate.portfolioUrl}
            onChange={(event) => onChange({ ...candidate, portfolioUrl: event.target.value })}
          />
        </label>

        <label className="span-all">
          Proof points
          <textarea
            rows={8}
            value={candidate.proofPoints.join("\n")}
            onChange={(event) => onChange({ ...candidate, proofPoints: updateList(event.target.value) })}
          />
        </label>

        <label className="span-all">
          Risk disclaimers
          <textarea
            rows={4}
            value={candidate.riskDisclaimers.join("\n")}
            onChange={(event) => onChange({ ...candidate, riskDisclaimers: updateList(event.target.value) })}
          />
        </label>
      </div>
    </section>
  );
}
