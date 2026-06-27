import type {
  ApplicationActivity,
  ContactChannel,
  OutreachContact,
  Job,
  MessageStatus,
  RelationshipType,
} from "../domain/types";
import { useState, type FormEvent } from "react";
import { formatLocalDate } from "../domain/date";

interface OutreachTrackerProps {
  jobs: Job[];
  contacts: OutreachContact[];
  activities: ApplicationActivity[];
  onAddContact: (contact: OutreachContact) => void;
  onUpdateContact: (contact: OutreachContact) => void;
  onAddActivity: (activity: ApplicationActivity) => void;
}

const CHANNELS: ContactChannel[] = ["LinkedIn", "X", "Telegram", "Email", "Warm intro", "Community"];
const RELATIONSHIPS: RelationshipType[] = [
  "recruiter",
  "hiring manager",
  "team member",
  "founder",
  "warm intro",
  "community contact",
];

export function OutreachTracker({
  jobs,
  contacts,
  activities,
  onAddContact,
  onUpdateContact,
  onAddActivity,
}: OutreachTrackerProps) {
  const [formState, setFormState] = useState({
    name: "",
    company: "",
    role: "",
    jobId: jobs[0]?.id ?? "",
    channel: "LinkedIn" as ContactChannel,
    relationshipType: "recruiter" as RelationshipType,
    profileUrl: "",
    followUpDate: "",
    notes: "",
  });

  function setContactStatus(
    contact: OutreachContact,
    messageStatus: MessageStatus,
    followUpDate: string,
    replyStatus: string,
  ) {
    onUpdateContact({
      ...contact,
      messageStatus,
      followUpDate,
      replyStatus,
    });
  }

  function buildActivity(contact: OutreachContact, overrides: Partial<ApplicationActivity>): ApplicationActivity {
    return {
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      jobId: contact.jobId,
      actionType: "sent_dm",
      channel: contact.channel,
      date: formatLocalDate(),
      contentVersion: "Manual outreach",
      result: "Sent manually by Mia",
      nextActionDate: contact.followUpDate,
      notes: "Manual outreach only. No automated sending was used.",
      ...overrides,
    };
  }

  function recordManualDm(contact: OutreachContact) {
    onAddActivity({
      ...buildActivity(contact, {
        actionType: "sent_dm",
        contentVersion: "Manual DM",
        result: "Sent manually by Mia",
      }),
    });
    setContactStatus(contact, "DM sent", contact.followUpDate, "");
  }

  function recordFollowUp(contact: OutreachContact) {
    onAddActivity(
      buildActivity(contact, {
        actionType: "sent_follow_up",
        contentVersion: "Manual follow-up",
        result: "Follow-up recorded manually",
      }),
    );
    setContactStatus(contact, "Follow-up due", contact.followUpDate, "");
  }

  function recordReply(contact: OutreachContact) {
    onAddActivity(
      buildActivity(contact, {
        actionType: "received_reply",
        contentVersion: "Manual reply",
        result: "Reply recorded manually",
        nextActionDate: contact.followUpDate,
      }),
    );
    setContactStatus(contact, "Replied", contact.followUpDate, "Reply received");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAddContact({
      id: `contact-${Date.now()}`,
      jobId: formState.jobId,
      name: formState.name,
      company: formState.company,
      role: formState.role,
      channel: formState.channel,
      profileUrl: formState.profileUrl,
      relationshipType: formState.relationshipType,
      messageStatus: "Not contacted",
      followUpDate: formState.followUpDate,
      replyStatus: "",
      notes: formState.notes,
    });
    setFormState({
      name: "",
      company: "",
      role: "",
      jobId: jobs[0]?.id ?? "",
      channel: "LinkedIn",
      relationshipType: "recruiter",
      profileUrl: "",
      followUpDate: "",
      notes: "",
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Outreach Tracker</p>
        <h2>Manual Contact Workflow</h2>
        <p>Track manual DMs, follow-ups, and replies without sending anything automatically.</p>
      </div>

      <form className="form-grid outreach-form" onSubmit={handleSubmit}>
        <label>
          Contact name
          <input
            required
            value={formState.name}
            onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
          />
        </label>
        <label>
          Contact company
          <input
            required
            value={formState.company}
            onChange={(event) => setFormState((current) => ({ ...current, company: event.target.value }))}
          />
        </label>
        <label>
          Contact role
          <input
            required
            value={formState.role}
            onChange={(event) => setFormState((current) => ({ ...current, role: event.target.value }))}
          />
        </label>
        <label>
          Associated job
          <select
            value={formState.jobId}
            onChange={(event) => setFormState((current) => ({ ...current, jobId: event.target.value }))}
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} · {job.company}
              </option>
            ))}
          </select>
        </label>
        <label>
          Channel
          <select
            value={formState.channel}
            onChange={(event) =>
              setFormState((current) => ({ ...current, channel: event.target.value as ContactChannel }))
            }
          >
            {CHANNELS.map((channel) => (
              <option key={channel}>{channel}</option>
            ))}
          </select>
        </label>
        <label>
          Relationship type
          <select
            value={formState.relationshipType}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                relationshipType: event.target.value as RelationshipType,
              }))
            }
          >
            {RELATIONSHIPS.map((relationship) => (
              <option key={relationship}>{relationship}</option>
            ))}
          </select>
        </label>
        <label>
          Profile URL
          <input
            type="url"
            value={formState.profileUrl}
            onChange={(event) => setFormState((current) => ({ ...current, profileUrl: event.target.value }))}
          />
        </label>
        <label>
          Follow-up date
          <input
            type="date"
            value={formState.followUpDate}
            onChange={(event) => setFormState((current) => ({ ...current, followUpDate: event.target.value }))}
          />
        </label>
        <label className="span-all">
          Notes
          <textarea
            rows={3}
            value={formState.notes}
            onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>
        <div className="span-all outreach-actions">
          <button className="primary-button" type="submit">
            Add contact
          </button>
          <p className="manual-note">Nothing is sent automatically. This tracker records Mia&apos;s manual outreach only.</p>
        </div>
      </form>

      <div className="item-list">
        {contacts.map((contact) => (
          <article className="list-item static-card" key={contact.id}>
            <strong>
              {contact.name} · {contact.company}
            </strong>
            <span>
              {contact.channel} · {contact.relationshipType} · {contact.messageStatus}
            </span>
            <span>{contact.role}</span>
            <span>Follow-up date: {contact.followUpDate || "Not scheduled"}</span>
            <label>
              Follow-up date for {contact.name}
              <input
                type="date"
                value={contact.followUpDate}
                onChange={(event) =>
                  onUpdateContact({
                    ...contact,
                    followUpDate: event.target.value,
                  })
                }
              />
            </label>
            {contact.profileUrl ? (
              <span>Profile URL: {contact.profileUrl}</span>
            ) : null}
            {contact.replyStatus ? <span>{contact.replyStatus}</span> : null}
            <p>{contact.notes || "Manual contact entry."}</p>
            <div className="contact-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => recordManualDm(contact)}
              >
                Record manual DM
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => recordFollowUp(contact)}
              >
                Record follow-up
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => recordReply(contact)}
              >
                Record reply
              </button>
            </div>
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
