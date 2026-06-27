import { buildWeeklyReview } from "../domain/weeklyReview";
import type { ApplicationActivity, Job } from "../domain/types";

interface WeeklyReviewProps {
  jobs: Job[];
  activities: ApplicationActivity[];
}

export function WeeklyReview({ jobs, activities }: WeeklyReviewProps) {
  const review = buildWeeklyReview(jobs, activities);

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Weekly Review</p>
        <h2>30/60 Day Sprint Pulse</h2>
      </div>

      <div className="metric-grid">
        <span>Reviewed: {review.reviewedCount}</span>
        <span>Shortlisted: {review.shortlistedCount}</span>
        <span>Applied: {review.appliedCount}</span>
        <span>Outreach: {review.outreachCount}</span>
        <span>Replies: {review.replyCount}</span>
        <span>Interviews: {review.interviewCount}</span>
      </div>

      <div className="review-summary">
        <p>Best role family: {review.bestRoleFamily}</p>
        <p>Needs more proof: {review.worstRoleFamily}</p>
      </div>

      <h3>Next Week Adjustments</h3>
      <ul>
        {review.nextWeekAdjustments.map((adjustment) => (
          <li key={adjustment}>{adjustment}</li>
        ))}
      </ul>
    </section>
  );
}
