import {
  BriefcaseBusiness,
  CalendarCheck,
  Database,
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
import type { AppState, ApplicationActivity, ApplicationPack, Job, JobStatus, OutreachContact } from "./domain/types";
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

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [view, setView] = useState<ViewId>("today");
  const [selectedJobId, setSelectedJobId] = useState(() => state.jobs[0]?.id ?? "");
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

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    if (!selectedJob && state.jobs[0]) {
      setSelectedJobId(state.jobs[0].id);
    }
  }, [selectedJob, state.jobs]);

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
                date: new Date().toISOString().slice(0, 10),
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
          date: new Date().toISOString().slice(0, 10),
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
          ? {
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
            <p>
              Open Job Inbox, review a role, generate an application pack, then record manual outreach.
            </p>
          </section>
        )}

        {view === "jobs" && (
          <>
            <JobInbox
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
