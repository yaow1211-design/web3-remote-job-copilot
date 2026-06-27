import type {
  ApplicationActivity,
  ContactChannel,
  OutreachContact,
} from "../domain/types";

interface OutreachTrackerProps {
  contacts: OutreachContact[];
  activities: ApplicationActivity[];
  onAddActivity: (activity: ApplicationActivity) => void;
}

export function OutreachTracker({
  contacts,
  activities,
  onAddActivity,
}: OutreachTrackerProps) {
  function recordManualDm(contact: OutreachContact) {
    onAddActivity({
      id: `activity-${Date.now()}`,
      jobId: contact.jobId,
      actionType: "sent_dm",
      channel: contact.channel as ContactChannel,
      date: new Date().toISOString().slice(0, 10),
      contentVersion: "Manual DM",
      result: "Sent manually by Mia",
      nextActionDate: contact.followUpDate,
      notes: "Manual outreach only. No automated sending was used.",
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Outreach Tracker</p>
        <h2>Manual Contact Workflow</h2>
        <p>Track manual DMs, follow-ups, and replies without sending anything automatically.</p>
      </div>

      <div className="item-list">
        {contacts.map((contact) => (
          <article className="list-item static-card" key={contact.id}>
            <strong>
              {contact.name} · {contact.company}
            </strong>
            <span>
              {contact.channel} · {contact.relationshipType} · {contact.messageStatus}
            </span>
            <p>{contact.notes || "Manual contact entry."}</p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => recordManualDm(contact)}
            >
              Record manual DM
            </button>
          </article>
        ))}
      </div>

      <h3>Recent Activities</h3>
      <ul>
        {activities.slice(0, 8).map((activity) => (
          <li key={activity.id}>
            {activity.date}: {activity.actionType} · {activity.result || "No result yet"}
          </li>
        ))}
      </ul>
    </section>
  );
}
