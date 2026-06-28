import {
  BriefcaseBusiness,
  CalendarCheck,
  Database,
  ExternalLink,
  FileText,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ApplicationPackBuilder } from "./components/ApplicationPackBuilder";
import { BackupPanel } from "./components/BackupPanel";
import { CandidateAssets } from "./components/CandidateAssets";
import { JobDetail } from "./components/JobDetail";
import { JobInbox } from "./components/JobInbox";
import { OutreachTracker } from "./components/OutreachTracker";
import { WeeklyReview } from "./components/WeeklyReview";
import { createDailyBriefing, shouldGenerateDailyBriefing } from "./domain/dailyBriefing";
import { formatLocalDate } from "./domain/date";
import type {
  AppState,
  ApplicationActivity,
  ApplicationPack,
  DailyBriefingArchive,
  DailyBriefingItem,
  Job,
  JobStatus,
  OutreachContact,
} from "./domain/types";
import { fetchDiscoveredJobs } from "./services/jobDiscoveryClient";
import { loadAppState, saveAppState } from "./storage/localStore";
import "./styles.css";

type ViewId = "today" | "jobs" | "assets" | "pack" | "outreach" | "review" | "backup";

const NAV_ITEMS = [
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "jobs", label: "Job Inbox", icon: BriefcaseBusiness },
  { id: "assets", label: "Assets", icon: Target },
  { id: "pack", label: "Application Pack", icon: FileText },
  { id: "outreach", label: "Outreach", icon: MessageSquare },
  { id: "review", label: "Weekly Review", icon: Sparkles },
  { id: "backup", label: "Backup", icon: Database },
] as const;

const NON_REGRESSING_PACK_STATUSES: Job["status"][] = [
  "applied",
  "dm_sent",
  "follow_up_due",
  "interview",
  "rejected",
  "archived",
];

const PACK_READY_STATUSES: JobStatus[] = [
  "shortlisted",
  "application_pack_ready",
  "applied",
  "dm_sent",
  "follow_up_due",
  "interview",
];

const MANUAL_STATUS_ACTIVITY_BY_STATUS: Partial<
  Record<JobStatus, Pick<ApplicationActivity, "actionType" | "result">>
> = {
  reviewed: {
    actionType: "reviewed_job",
    result: "Reviewed manually",
  },
  shortlisted: {
    actionType: "shortlisted_job",
    result: "Shortlisted manually",
  },
  applied: {
    actionType: "submitted_application",
    result: "Application submitted manually",
  },
  interview: {
    actionType: "booked_interview",
    result: "Interview booked manually",
  },
  rejected: {
    actionType: "rejected",
    result: "Rejected / closed",
  },
};

const OUTREACH_NON_REGRESSING_STATUSES: JobStatus[] = [
  "applied",
  "interview",
  "rejected",
  "archived",
  "follow_up_due",
];

const TERMINAL_FOLLOW_UP_MESSAGE_STATUSES: OutreachContact["messageStatus"][] = [
  "Replied",
  "Call booked",
  "Rejected",
];
const DAILY_BRIEFING_ERROR_MESSAGE =
  "Daily briefing could not refresh. Manual Fetch in Job Inbox is still available.";

type BriefingStatus = "idle" | "loading" | "done" | "error";

function DailyBriefingItemCard({
  item,
  jobs,
  onAddJob,
}: {
  item: DailyBriefingItem;
  jobs: Job[];
  onAddJob: (job: Job) => void;
}) {
  const alreadyInInbox = jobs.some(
    (job) =>
      job.originalUrl.toLowerCase() === item.job.originalUrl.toLowerCase() ||
      `${job.title.toLowerCase()}|${job.company.toLowerCase()}` ===
        `${item.job.title.toLowerCase()}|${item.job.company.toLowerCase()}`,
  );

  return (
    <article className="match-card" aria-label={`${item.job.title} ${item.job.company}`}>
      <div className="match-meta">
        <div>
          <h3>{item.job.title}</h3>
          <p>
            {item.job.company} · {item.job.source}
          </p>
        </div>
        <span className="score-pill">{item.score.overallScore}</span>
      </div>

      <p>{item.summary}</p>
      <p>
        <strong>Recommendation:</strong> {item.score.recommendation}
      </p>
      <p>
        <strong>Why it fits:</strong>
      </p>
      <ul className="archive-list">
        {item.fitReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p>
        <strong>Risks:</strong>
      </p>
      <ul className="archive-list">
        {item.risks.map((risk) => (
          <li key={risk}>{risk}</li>
        ))}
      </ul>

      <div className="outreach-actions">
        <a className="secondary-button link-button" href={item.job.originalUrl} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" size={16} />
          <span>Open original link</span>
        </a>
        <button className="primary-button" type="button" onClick={() => onAddJob(item.job)} disabled={alreadyInInbox}>
          {alreadyInInbox ? "Already in inbox" : "Add to Job Inbox"}
        </button>
      </div>
    </article>
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [view, setView] = useState<ViewId>("today");
  const [selectedJobId, setSelectedJobId] = useState(() => state.jobs[0]?.id ?? "");
  const [briefingStatus, setBriefingStatus] = useState<BriefingStatus>("idle");
  const [briefingError, setBriefingError] = useState("");
  const selectedJob = useMemo(
    () => state.jobs.find((job) => job.id === selectedJobId) ?? state.jobs[0],
    [selectedJobId, state.jobs],
  );
  const selectedPackJob = useMemo(
    () => {
      const selectedJobPack = selectedJob
        ? state.packs.find((pack) => pack.jobId === selectedJob.id)
        : undefined;

      if (selectedJob && (selectedJobPack || PACK_READY_STATUSES.includes(selectedJob.status))) {
        return selectedJob;
      }

      const savedPackJob = state.jobs.find((job) => state.packs.some((pack) => pack.jobId === job.id));
      if (savedPackJob) {
        return savedPackJob;
      }

      return state.jobs.find((job) => PACK_READY_STATUSES.includes(job.status));
    },
    [selectedJob, state.jobs, state.packs],
  );
  const followUpReminders = useMemo(() => {
    const today = formatLocalDate();

    return state.contacts
      .filter(
        (contact) =>
          contact.followUpDate &&
          contact.followUpDate <= today &&
          !TERMINAL_FOLLOW_UP_MESSAGE_STATUSES.includes(contact.messageStatus),
      )
      .sort((left, right) => left.followUpDate.localeCompare(right.followUpDate));
  }, [state.contacts]);
  const dailyBriefings = useMemo(() => state.briefings, [state.briefings]);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    if (!selectedJob && state.jobs[0]) {
      setSelectedJobId(state.jobs[0].id);
    }
  }, [selectedJob, state.jobs]);

  useEffect(() => {
    if (view !== "today") {
      return;
    }

    if (!shouldGenerateDailyBriefing(new Date(), state.briefings)) {
      return;
    }

    if (briefingStatus !== "idle") {
      return;
    }

    let cancelled = false;

    async function generateBriefing() {
      setBriefingStatus("loading");
      setBriefingError("");

      try {
        const discoveredJobs = await fetchDiscoveredJobs();
        const now = new Date();
        const archive = createDailyBriefing(discoveredJobs, state.candidate, state.jobs, now);

        if (cancelled) {
          return;
        }

        setState((current) => {
          if (!shouldGenerateDailyBriefing(now, current.briefings)) {
            return current;
          }

          return {
            ...current,
            briefings: [archive, ...current.briefings],
          };
        });
        setBriefingStatus("done");
      } catch {
        if (cancelled) {
          return;
        }

        setBriefingError(DAILY_BRIEFING_ERROR_MESSAGE);
        setBriefingStatus("error");
      }
    }

    void generateBriefing();

    return () => {
      cancelled = true;
    };
  }, [state.briefings, state.candidate, state.jobs, view]);

  function addJob(job: Job) {
    setState((current) => ({ ...current, jobs: [job, ...current.jobs] }));
    setSelectedJobId(job.id);
  }

  function updateJob(job: Job) {
    setState((current) => {
      const previousJob = current.jobs.find((item) => item.id === job.id);
      const statusChanged = previousJob && previousJob.status !== job.status;
      const manualStatusActivity = statusChanged ? MANUAL_STATUS_ACTIVITY_BY_STATUS[job.status] : undefined;

      return {
        ...current,
        jobs: current.jobs.map((item) => (item.id === job.id ? job : item)),
        activities: manualStatusActivity
          ? [
              {
                id: `activity-${Date.now()}-${job.id}-${job.status}`,
                jobId: job.id,
                actionType: manualStatusActivity.actionType,
                channel: "Application Portal",
                date: formatLocalDate(),
                contentVersion: "Manual status update",
                result: manualStatusActivity.result,
                nextActionDate: "",
                notes: "Recorded from a manual status change in Job Detail. No automation was used.",
              },
              ...current.activities,
            ]
          : current.activities,
      };
    });
  }

  function savePack(pack: ApplicationPack) {
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((job) =>
        job.id === pack.jobId
          ? {
              ...job,
              status: NON_REGRESSING_PACK_STATUSES.includes(job.status)
                ? job.status
                : "application_pack_ready",
            }
          : job,
      ),
      packs: [pack, ...current.packs.filter((item) => item.jobId !== pack.jobId)],
      activities: [
        {
          id: `activity-${Date.now()}`,
          jobId: pack.jobId,
          actionType: "generated_pack",
          channel: "Application Portal",
          date: formatLocalDate(),
          contentVersion: pack.generatedAt,
          result: "Pack generated for human review",
          nextActionDate: "",
          notes: "No application was submitted automatically.",
        },
        ...current.activities,
      ],
    }));
  }

  function addActivity(activity: ApplicationActivity) {
    setState((current) => ({ ...current, activities: [activity, ...current.activities] }));
  }

  function addContact(contact: OutreachContact) {
    setState((current) => ({ ...current, contacts: [contact, ...current.contacts] }));
  }

  function updateContact(contact: OutreachContact) {
    setState((current) => ({
      ...current,
      contacts: current.contacts.map((item) => (item.id === contact.id ? contact : item)),
      jobs: current.jobs.map((job) =>
        job.id === contact.jobId
          ? OUTREACH_NON_REGRESSING_STATUSES.includes(job.status)
            ? job
            : {
                ...job,
                status:
                  contact.messageStatus === "Follow-up due"
                    ? "follow_up_due"
                    : contact.messageStatus === "DM sent"
                      ? "dm_sent"
                      : job.status,
              }
          : job,
      ),
    }));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div>
          <p className="eyebrow">V1 Local MVP</p>
          <h1>Mia Web3 Remote Application Command Center</h1>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={view === item.id ? "nav-button active" : "nav-button"}
                type="button"
                onClick={() => setView(item.id)}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace" aria-label="Workspace">
        {view === "today" && (
          <section className="panel">
            <p className="eyebrow-dark">Today Command Center</p>
            <h2>Start with the highest-ROI job action</h2>
            <p>Open Job Inbox, review a role, generate an application pack, then record manual outreach.</p>
            <div className="compliance-note">
              <strong>Human review boundary:</strong> This MVP never logs into LinkedIn or Indeed, never sends DMs,
              and never submits applications. It only prepares materials for Mia to review and use manually.
            </div>

            <div className="section-heading">
              <p className="eyebrow-dark">Follow-up Reminders</p>
              <h2>Follow-up Reminders</h2>
            </div>
            {followUpReminders.length > 0 ? (
              <ul className="reminder-list">
                {followUpReminders.map((contact) => (
                  <li key={contact.id} className="reminder-item">
                    <strong>
                      {contact.name} · {contact.company}
                    </strong>
                    <span>Follow-up date: {contact.followUpDate}</span>
                    <span>Message status: {contact.messageStatus}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No follow-ups due today.</p>
            )}

            <div className="section-heading daily-briefing-heading">
              <p className="eyebrow-dark">Daily briefing</p>
              <h2>Daily Web3 Job Briefing</h2>
              <p>Mia opens Today after 08:00 Asia/Shanghai to generate one local archive for the day.</p>
            </div>

            {briefingError ? <p className="error-note">{briefingError}</p> : null}
            {briefingStatus === "loading" ? <p>Refreshing today&apos;s briefing...</p> : null}

            {dailyBriefings.length > 0 ? (
              <div className="briefing-stack">
                {dailyBriefings.map((archive, index) => (
                  <section key={archive.id} className="briefing-block" aria-label={`Daily briefing ${archive.date}`}>
                    <div className="section-heading">
                      <p className="eyebrow-dark">{index === 0 ? "Current archive" : "Older archive"}</p>
                      <h2>{archive.date}</h2>
                      <p>{archive.windowLabel}</p>
                    </div>

                    {archive.items.length > 0 ? (
                      <div className="match-list">
                        {archive.items.map((item) => (
                          <DailyBriefingItemCard
                            key={`${archive.id}-${item.job.id}`}
                            item={item}
                            jobs={state.jobs}
                            onAddJob={addJob}
                          />
                        ))}
                      </div>
                    ) : (
                      <p>No new briefing items made the top match list for this archive.</p>
                    )}
                  </section>
                ))}
              </div>
            ) : (
              <p>No daily briefing archive yet for the current local cycle.</p>
            )}
          </section>
        )}

        {view === "jobs" && (
          <>
            <JobInbox
              candidate={state.candidate}
              jobs={state.jobs}
              selectedJobId={selectedJob?.id ?? ""}
              onSelectJob={setSelectedJobId}
              onAddJob={addJob}
            />
            {selectedJob ? (
              <JobDetail candidate={state.candidate} job={selectedJob} onUpdateJob={updateJob} />
            ) : (
              <section className="panel">
                <p className="eyebrow-dark">Fit & Risk Score</p>
                <h2>No job selected</h2>
                <p>Add a job or choose one from the pipeline to review fit and risks.</p>
              </section>
            )}
          </>
        )}

        {view === "assets" && (
          <CandidateAssets
            candidate={state.candidate}
            onChange={(candidate) => setState((current) => ({ ...current, candidate }))}
          />
        )}

        {view === "pack" &&
          (selectedPackJob ? (
            <ApplicationPackBuilder
              candidate={state.candidate}
              job={selectedPackJob}
              pack={state.packs.find((pack) => pack.jobId === selectedPackJob.id)}
              onSavePack={savePack}
            />
          ) : (
            <section className="panel">
              <h2>Application Pack</h2>
              <p>Select a shortlisted job from Job Inbox before generating a pack.</p>
            </section>
          ))}

        {view === "outreach" && (
          <OutreachTracker
            jobs={state.jobs}
            contacts={state.contacts}
            activities={state.activities}
            onAddContact={addContact}
            onUpdateContact={updateContact}
            onAddActivity={addActivity}
          />
        )}

        {view === "review" && <WeeklyReview jobs={state.jobs} activities={state.activities} />}

        {view === "backup" && <BackupPanel state={state} onImport={setState} />}
      </section>
    </main>
  );
}
