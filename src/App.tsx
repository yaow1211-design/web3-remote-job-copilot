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
import { CandidateAssets } from "./components/CandidateAssets";
import { JobDetail } from "./components/JobDetail";
import { JobInbox } from "./components/JobInbox";
import type { AppState, Job } from "./domain/types";
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

export default function App() {
  const [state, setState] = useState<AppState>(() => loadAppState());
  const [view, setView] = useState<ViewId>("today");
  const [selectedJobId, setSelectedJobId] = useState(() => state.jobs[0]?.id ?? "");
  const selectedJob = useMemo(
    () => state.jobs.find((job) => job.id === selectedJobId) ?? state.jobs[0],
    [selectedJobId, state.jobs],
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
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((item) => (item.id === job.id ? job : item)),
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

        {view === "pack" && (
          <section className="panel">
            <h2>Application Pack</h2>
            <p>Select a shortlisted job from Job Inbox before generating a pack.</p>
          </section>
        )}

        {view === "outreach" && (
          <section className="panel">
            <h2>Outreach</h2>
            <p>Manual outreach tracking will be wired in the next task.</p>
          </section>
        )}

        {view === "review" && (
          <section className="panel">
            <h2>Weekly Review</h2>
            <p>Weekly review metrics will be wired after activity tracking.</p>
          </section>
        )}

        {view === "backup" && (
          <section className="panel">
            <h2>Backup</h2>
            <p>Export and import controls will be wired after the core workflow.</p>
          </section>
        )}
      </section>
    </main>
  );
}
