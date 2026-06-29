# Application Pack Job Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Mia choose any Job Inbox role inside Application Pack with keyword search and status filtering, then generate materials for that selected role, while Job Inbox clearly supports applied/not-applied tracking.

**Architecture:** Keep the MVP local-first and state-driven: `App.tsx` remains the owner of jobs, selected job id, packs, and activities. `ApplicationPackBuilder` becomes a controlled component that receives the full job list, current selected pack job id, filter state, and callbacks; `JobDetail` gets quick status buttons layered on the existing `onUpdateJob` path so activity logging stays centralized.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, lucide-react, localStorage persistence through existing `storage/localStore.ts`.

## Global Constraints

- Do not add backend services, databases, paid APIs, or new runtime dependencies.
- Keep all job search, selection, and application state local in the existing `AppState`.
- Preserve the existing manual safety boundary: the app prepares materials only and never submits applications automatically.
- Keep existing `JobStatus` values unchanged: `new`, `reviewed`, `shortlisted`, `application_pack_ready`, `applied`, `dm_sent`, `follow_up_due`, `interview`, `rejected`, `archived`.
- Treat `applied`, `interview`, and `rejected` as “Applied” for UI grouping because those statuses imply Mia has already submitted or entered a post-application outcome.
- Treat every other status as “Not applied” for UI grouping.
- `Mark applied` sets `job.status` to `applied`.
- `Mark not applied` sets `job.status` to `reviewed`.
- Use TDD for each task: write failing test, run it red, implement, run it green.
- Keep UI copy direct and operational; do not add onboarding text, marketing copy, or long explanations.

---

## File Structure

- Modify `src/App.tsx`
  - Owns new `selectedPackJobId`, `packJobSearch`, and `packStatusFilter` state.
  - Passes all jobs and selection callbacks to `ApplicationPackBuilder`.
  - Keeps status activity logging through the existing `updateJob(job)` function.
- Modify `src/components/ApplicationPackBuilder.tsx`
  - Adds a job picker, keyword search, status filter, selected job summary, and existing pack rendering.
  - Keeps pack generation local to the selected job.
- Modify `src/components/JobDetail.tsx`
  - Adds quick `Mark applied`, `Mark not applied`, `Shortlist`, and `Archive` buttons.
  - Keeps the existing status dropdown for full manual control.
- Modify `src/App.test.tsx`
  - Adds user-flow tests for multi-job selection, search, filters, pack generation, and applied/not-applied state changes.
- Modify `src/styles.css`
  - Adds compact picker and status action styles using existing panel/button/list patterns.

---

### Task 1: Application Pack Job Selector With Search And Status Filter

**Files:**
- Modify: `src/components/ApplicationPackBuilder.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes:
  - `Job`, `ApplicationPack`, `CandidateAsset` from `src/domain/types.ts`
  - Existing `generateApplicationPack(job, candidate, score)` from `src/domain/applicationPack.ts`
  - Existing `scoreJob(job, candidate)` from `src/domain/scoring.ts`
- Produces:
  - `type PackStatusFilter = "all" | "not_applied" | "applied" | "shortlisted" | "pack_ready" | "interview" | "rejected";`
  - `interface ApplicationPackBuilderProps { candidate: CandidateAsset; jobs: Job[]; selectedJobId: string; searchQuery: string; statusFilter: PackStatusFilter; packs: ApplicationPack[]; onSelectJob(jobId: string): void; onSearchChange(query: string): void; onStatusFilterChange(filter: PackStatusFilter): void; onSavePack(pack: ApplicationPack): void; }`
  - `export function isAppliedForFilter(job: Job): boolean`
  - `export function matchesPackStatusFilter(job: Job, filter: PackStatusFilter): boolean`
  - `export function matchesPackSearch(job: Job, query: string): boolean`

- [ ] **Step 1: Write the failing selector test**

Add this test to `src/App.test.tsx` near the existing Application Pack tests:

```tsx
it("lets Mia search Job Inbox, choose a role, and generate that role's application pack", async () => {
  const user = userEvent.setup();

  saveState({
    jobs: [
      {
        ...sampleJobs[0],
        id: "job-growth",
        title: "Web3 Growth Analyst",
        company: "Orbit Wallet",
        status: "new",
        originalUrl: "https://remoteok.com/orbit-growth",
        applyUrl: "https://remoteok.com/orbit-growth/apply",
        jdText: "Remote lifecycle analytics role with retention, SQL, campaign analysis, and Web3 wallet context.",
      },
      {
        ...sampleJobs[1],
        id: "job-research",
        title: "Protocol Research Analyst",
        company: "Northstar Research",
        status: "shortlisted",
        originalUrl: "https://remoteok.com/northstar-research",
        applyUrl: "https://remoteok.com/northstar-research/apply",
        jdText: "Remote protocol research role with due diligence, risk analysis, market research, and crypto context.",
      },
      {
        ...sampleJobs[1],
        id: "job-ops",
        title: "Product Operations Analyst",
        company: "Atlas Fintech",
        status: "applied",
        originalUrl: "https://remoteok.com/atlas-ops",
        applyUrl: "https://remoteok.com/atlas-ops/apply",
        jdText: "Remote product operations role with PRD, UAT, SQL, and dashboard delivery.",
      },
    ],
    packs: [],
  });

  renderApp();

  await openNav(user, /Application Pack/i);

  expect(screen.getByLabelText(/Search jobs/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Filter jobs/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Web3 Growth Analyst Orbit Wallet new/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Protocol Research Analyst Northstar Research shortlisted/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Product Operations Analyst Atlas Fintech applied/i })).toBeInTheDocument();

  await user.type(screen.getByLabelText(/Search jobs/i), "research");

  expect(screen.queryByRole("button", { name: /Web3 Growth Analyst Orbit Wallet new/i })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Protocol Research Analyst Northstar Research shortlisted/i })).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Protocol Research Analyst Northstar Research shortlisted/i }));

  expect(
    screen.getByRole("heading", { name: /Protocol Research Analyst · Northstar Research/i }),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Generate pack/i }));

  expect(screen.getAllByText(/Northstar Research's Protocol Research Analyst role/i).length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the failing selector test**

Run:

```bash
npm test -- src/App.test.tsx -t "lets Mia search Job Inbox"
```

Expected: FAIL because `Search jobs`, `Filter jobs`, and job selector buttons do not exist in `ApplicationPackBuilder`.

- [ ] **Step 3: Replace `ApplicationPackBuilder` props and add selector helpers**

Replace the top of `src/components/ApplicationPackBuilder.tsx` through the props interface with:

```tsx
import { generateApplicationPack } from "../domain/applicationPack";
import { scoreJob } from "../domain/scoring";
import type { ApplicationPack, CandidateAsset, Job } from "../domain/types";

export type PackStatusFilter =
  | "all"
  | "not_applied"
  | "applied"
  | "shortlisted"
  | "pack_ready"
  | "interview"
  | "rejected";

interface ApplicationPackBuilderProps {
  candidate: CandidateAsset;
  jobs: Job[];
  selectedJobId: string;
  searchQuery: string;
  statusFilter: PackStatusFilter;
  packs: ApplicationPack[];
  onSelectJob: (jobId: string) => void;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (filter: PackStatusFilter) => void;
  onSavePack: (pack: ApplicationPack) => void;
}

const FILTER_LABELS: Record<PackStatusFilter, string> = {
  all: "All",
  not_applied: "Not applied",
  applied: "Applied",
  shortlisted: "Shortlisted",
  pack_ready: "Pack ready",
  interview: "Interview",
  rejected: "Rejected",
};

export function isAppliedForFilter(job: Job): boolean {
  return ["applied", "interview", "rejected"].includes(job.status);
}

export function matchesPackStatusFilter(job: Job, filter: PackStatusFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "not_applied") {
    return !isAppliedForFilter(job);
  }

  if (filter === "applied") {
    return isAppliedForFilter(job);
  }

  if (filter === "pack_ready") {
    return job.status === "application_pack_ready";
  }

  return job.status === filter;
}

export function matchesPackSearch(job: Job, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    job.title,
    job.company,
    job.roleFamily,
    job.status,
    job.originalUrl,
    job.applyUrl,
    job.jdText,
    job.requiredSkills.join(" "),
    job.preferredSkills.join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}
```

- [ ] **Step 4: Replace the `ApplicationPackBuilder` component body**

Replace the current exported component in `src/components/ApplicationPackBuilder.tsx` with:

```tsx
export function ApplicationPackBuilder({
  candidate,
  jobs,
  selectedJobId,
  searchQuery,
  statusFilter,
  packs,
  onSelectJob,
  onSearchChange,
  onStatusFilterChange,
  onSavePack,
}: ApplicationPackBuilderProps) {
  const filteredJobs = jobs.filter(
    (job) => matchesPackStatusFilter(job, statusFilter) && matchesPackSearch(job, searchQuery),
  );
  const selectedJob = jobs.find((job) => job.id === selectedJobId) ?? filteredJobs[0] ?? jobs[0];
  const pack = selectedJob ? packs.find((item) => item.jobId === selectedJob.id) : undefined;

  function handleGenerate() {
    if (!selectedJob) {
      return;
    }

    onSavePack(generateApplicationPack(selectedJob, candidate, scoreJob(selectedJob, candidate)));
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Application Pack Builder</p>
        <h2>{selectedJob ? `${selectedJob.title} · ${selectedJob.company}` : "Select a job"}</h2>
        <p>Generate tailored materials for review. No application or message will be sent automatically.</p>
      </div>

      <div className="pack-selector">
        <label>
          Search jobs
          <input
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title, company, URL, JD, skills"
          />
        </label>

        <label>
          Filter jobs
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as PackStatusFilter)}
          >
            {(Object.keys(FILTER_LABELS) as PackStatusFilter[]).map((filter) => (
              <option key={filter} value={filter}>
                {FILTER_LABELS[filter]}
              </option>
            ))}
          </select>
        </label>

        <div className="pack-job-list" aria-label="Application pack job choices">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <button
                key={job.id}
                className={job.id === selectedJob?.id ? "list-item active" : "list-item"}
                type="button"
                onClick={() => onSelectJob(job.id)}
              >
                <strong>{job.title}</strong>
                <span>
                  {job.company} · {job.status}
                </span>
              </button>
            ))
          ) : (
            <p>No jobs match this search and filter.</p>
          )}
        </div>
      </div>

      <button className="primary-button" type="button" onClick={handleGenerate} disabled={!selectedJob}>
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
```

- [ ] **Step 5: Wire selector state in `App.tsx`**

Add this import in `src/App.tsx`:

```tsx
import type { PackStatusFilter } from "./components/ApplicationPackBuilder";
```

Add these state values below `selectedJobId`:

```tsx
const [selectedPackJobId, setSelectedPackJobId] = useState(() => getDefaultSelectedJob(state.jobs)?.id ?? "");
const [packJobSearch, setPackJobSearch] = useState("");
const [packStatusFilter, setPackStatusFilter] = useState<PackStatusFilter>("all");
```

Update `addJob(job)`:

```tsx
function addJob(job: Job) {
  setState((current) => ({ ...current, jobs: [job, ...current.jobs] }));
  setSelectedJobId(job.id);
  setSelectedPackJobId(job.id);
}
```

Update the `selectedJob` recovery effect:

```tsx
useEffect(() => {
  const defaultSelectedJob = getDefaultSelectedJob(state.jobs);
  if (!selectedJob && defaultSelectedJob) {
    setSelectedJobId(defaultSelectedJob.id);
  }

  if (!state.jobs.some((job) => job.id === selectedPackJobId) && defaultSelectedJob) {
    setSelectedPackJobId(defaultSelectedJob.id);
  }
}, [selectedJob, selectedPackJobId, state.jobs]);
```

Replace the `view === "pack"` rendering block with:

```tsx
{view === "pack" &&
  (state.jobs.length > 0 ? (
    <ApplicationPackBuilder
      candidate={state.candidate}
      jobs={state.jobs}
      selectedJobId={selectedPackJobId}
      searchQuery={packJobSearch}
      statusFilter={packStatusFilter}
      packs={state.packs}
      onSelectJob={setSelectedPackJobId}
      onSearchChange={setPackJobSearch}
      onStatusFilterChange={setPackStatusFilter}
      onSavePack={savePack}
    />
  ) : (
    <section className="panel">
      <h2>Application Pack</h2>
      <p>Add a job to Job Inbox before generating a pack.</p>
    </section>
  ))}
```

Delete the old `selectedPackJob` `useMemo` block because the pack page now owns selection through `selectedPackJobId`.

- [ ] **Step 6: Add selector styles**

Append this CSS to `src/styles.css` near the existing `.pack-grid` rules:

```css
.pack-selector {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.6fr);
  gap: 12px;
  margin: 18px 0;
}

.pack-selector label {
  margin: 0;
}

.pack-job-list {
  grid-column: 1 / -1;
  display: grid;
  max-height: 320px;
  gap: 8px;
  overflow: auto;
  padding-right: 4px;
}

@media (max-width: 760px) {
  .pack-selector {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run selector test green**

Run:

```bash
npm test -- src/App.test.tsx -t "lets Mia search Job Inbox"
```

Expected: PASS.

- [ ] **Step 8: Commit Task 1**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/ApplicationPackBuilder.tsx src/styles.css
git commit -m "feat: add application pack job selector"
```

---

### Task 2: Applied And Not-Applied Filters

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/components/ApplicationPackBuilder.tsx`

**Interfaces:**
- Consumes:
  - `isAppliedForFilter(job)` from Task 1
  - `matchesPackStatusFilter(job, filter)` from Task 1
- Produces:
  - Working `Filter jobs` options:
    - `All`
    - `Not applied`
    - `Applied`
    - `Shortlisted`
    - `Pack ready`
    - `Interview`
    - `Rejected`

- [ ] **Step 1: Write failing filter behavior test**

Add this test to `src/App.test.tsx` near the Task 1 selector test:

```tsx
it("filters Application Pack jobs by applied and not-applied groups", async () => {
  const user = userEvent.setup();

  saveState({
    jobs: [
      {
        ...sampleJobs[0],
        id: "job-not-applied",
        title: "Not Applied Growth Role",
        company: "Orbit Wallet",
        status: "new",
      },
      {
        ...sampleJobs[1],
        id: "job-pack-ready",
        title: "Pack Ready Analyst",
        company: "Northstar Research",
        status: "application_pack_ready",
      },
      {
        ...sampleJobs[1],
        id: "job-applied",
        title: "Applied Product Ops",
        company: "Atlas Fintech",
        status: "applied",
      },
      {
        ...sampleJobs[1],
        id: "job-interview",
        title: "Interview Stage Analyst",
        company: "Protocol Labs",
        status: "interview",
      },
    ],
    packs: [],
  });

  renderApp();

  await openNav(user, /Application Pack/i);
  await user.selectOptions(screen.getByLabelText(/Filter jobs/i), "not_applied");

  expect(screen.getByRole("button", { name: /Not Applied Growth Role Orbit Wallet new/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Pack Ready Analyst Northstar Research application_pack_ready/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Applied Product Ops Atlas Fintech applied/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Interview Stage Analyst Protocol Labs interview/i })).not.toBeInTheDocument();

  await user.selectOptions(screen.getByLabelText(/Filter jobs/i), "applied");

  expect(screen.queryByRole("button", { name: /Not Applied Growth Role Orbit Wallet new/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Pack Ready Analyst Northstar Research application_pack_ready/i })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Applied Product Ops Atlas Fintech applied/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Interview Stage Analyst Protocol Labs interview/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run filter test red**

Run:

```bash
npm test -- src/App.test.tsx -t "filters Application Pack jobs"
```

Expected: FAIL until Task 1 filter helpers are fully wired. If it already passes because Task 1 implemented all filter logic, continue to Step 3 and still commit with Task 2 if the test is new.

- [ ] **Step 3: Ensure filter helper logic is exact**

Confirm `src/components/ApplicationPackBuilder.tsx` contains exactly:

```tsx
export function isAppliedForFilter(job: Job): boolean {
  return ["applied", "interview", "rejected"].includes(job.status);
}

export function matchesPackStatusFilter(job: Job, filter: PackStatusFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (filter === "not_applied") {
    return !isAppliedForFilter(job);
  }

  if (filter === "applied") {
    return isAppliedForFilter(job);
  }

  if (filter === "pack_ready") {
    return job.status === "application_pack_ready";
  }

  return job.status === filter;
}
```

- [ ] **Step 4: Run filter test green**

Run:

```bash
npm test -- src/App.test.tsx -t "filters Application Pack jobs"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add src/App.test.tsx src/components/ApplicationPackBuilder.tsx
git commit -m "test: cover application pack applied filters"
```

---

### Task 3: Job Inbox Quick Applied Status Actions

**Files:**
- Modify: `src/components/JobDetail.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes:
  - Existing `onUpdateJob(job: Job): void` prop in `JobDetail`
  - Existing `updateJob(job)` activity logging in `App.tsx`
- Produces:
  - Buttons in `JobDetail`:
    - `Mark applied`
    - `Mark not applied`
    - `Shortlist`
    - `Archive`
  - `Mark applied` calls `onUpdateJob({ ...job, status: "applied" })`
  - `Mark not applied` calls `onUpdateJob({ ...job, status: "reviewed" })`
  - `Shortlist` calls `onUpdateJob({ ...job, status: "shortlisted" })`
  - `Archive` calls `onUpdateJob({ ...job, status: "archived" })`

- [ ] **Step 1: Write failing quick action test**

Add this test to `src/App.test.tsx` near the existing Job Inbox status tests:

```tsx
it("lets Mia mark a Job Inbox role applied and not applied with quick actions", async () => {
  const user = userEvent.setup();

  saveState({
    jobs: [
      {
        ...sampleJobs[0],
        id: "job-quick-status",
        title: "Quick Status Analyst",
        company: "Orbit Wallet",
        status: "new",
      },
    ],
    activities: [],
  });

  renderApp();

  await openNav(user, /Job Inbox/i);

  expect(screen.getByText(/Orbit Wallet · new/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Mark applied/i }));

  expect(screen.getByText(/Orbit Wallet · applied/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Status/i)).toHaveValue("applied");

  await openNav(user, /Weekly Review/i);
  expect(screen.getByText(/Applications: 1/i)).toBeInTheDocument();

  await openNav(user, /Job Inbox/i);
  await user.click(screen.getByRole("button", { name: /Mark not applied/i }));

  expect(screen.getByText(/Orbit Wallet · reviewed/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Status/i)).toHaveValue("reviewed");
});
```

- [ ] **Step 2: Run quick action test red**

Run:

```bash
npm test -- src/App.test.tsx -t "quick actions"
```

Expected: FAIL because `Mark applied` and `Mark not applied` buttons do not exist.

- [ ] **Step 3: Add quick action buttons**

In `src/components/JobDetail.tsx`, insert this block immediately after the existing link actions block and before `.score-row`:

```tsx
<div className="status-action-row" aria-label="Job status quick actions">
  <button
    className="secondary-button"
    type="button"
    onClick={() => onUpdateJob({ ...job, status: "applied" })}
    disabled={job.status === "applied"}
  >
    Mark applied
  </button>
  <button
    className="secondary-button"
    type="button"
    onClick={() => onUpdateJob({ ...job, status: "reviewed" })}
    disabled={job.status === "reviewed"}
  >
    Mark not applied
  </button>
  <button
    className="secondary-button"
    type="button"
    onClick={() => onUpdateJob({ ...job, status: "shortlisted" })}
    disabled={job.status === "shortlisted"}
  >
    Shortlist
  </button>
  <button
    className="secondary-button"
    type="button"
    onClick={() => onUpdateJob({ ...job, status: "archived" })}
    disabled={job.status === "archived"}
  >
    Archive
  </button>
</div>
```

- [ ] **Step 4: Add quick action styles**

Append this CSS to `src/styles.css` near `.outreach-actions`:

```css
.status-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
```

- [ ] **Step 5: Run quick action test green**

Run:

```bash
npm test -- src/App.test.tsx -t "quick actions"
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add src/App.test.tsx src/components/JobDetail.tsx src/styles.css
git commit -m "feat: add job applied quick actions"
```

---

### Task 4: Application Pack Selection Reflects Quick Status Changes

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/ApplicationPackBuilder.tsx`

**Interfaces:**
- Consumes:
  - `selectedPackJobId` from Task 1
  - Quick status changes from Task 3 through `updateJob(job)`
- Produces:
  - The selected Application Pack job stays selected after status changes.
  - The selected job remains visible even if the current filter would otherwise hide it, by clearing the filter only when Mia explicitly changes it.

- [ ] **Step 1: Write failing selected-job stability test**

Add this test to `src/App.test.tsx` near the Application Pack tests:

```tsx
it("keeps the selected Application Pack job stable after Mia marks it applied", async () => {
  const user = userEvent.setup();

  saveState({
    jobs: [
      {
        ...sampleJobs[0],
        id: "job-stable-pack",
        title: "Stable Pack Analyst",
        company: "Orbit Wallet",
        status: "new",
      },
      {
        ...sampleJobs[1],
        id: "job-other-pack",
        title: "Other Pack Analyst",
        company: "Atlas Fintech",
        status: "shortlisted",
      },
    ],
    packs: [],
  });

  renderApp();

  await openNav(user, /Application Pack/i);
  await user.click(screen.getByRole("button", { name: /Stable Pack Analyst Orbit Wallet new/i }));

  expect(screen.getByRole("heading", { name: /Stable Pack Analyst · Orbit Wallet/i })).toBeInTheDocument();

  await openNav(user, /Job Inbox/i);
  await user.click(screen.getByRole("button", { name: /Stable Pack Analyst Orbit Wallet · new/i }));
  await user.click(screen.getByRole("button", { name: /Mark applied/i }));

  await openNav(user, /Application Pack/i);

  expect(screen.getByRole("heading", { name: /Stable Pack Analyst · Orbit Wallet/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Stable Pack Analyst Orbit Wallet applied/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run selected-job stability test red**

Run:

```bash
npm test -- src/App.test.tsx -t "keeps the selected Application Pack job stable"
```

Expected: FAIL if `selectedPackJobId` is not wired or if the job picker loses the selected job after status change.

- [ ] **Step 3: Ensure `selectedPackJobId` survives status updates**

Confirm `App.tsx` does not reset `selectedPackJobId` inside `updateJob(job)`. The only selected pack recovery should be:

```tsx
if (!state.jobs.some((job) => job.id === selectedPackJobId) && defaultSelectedJob) {
  setSelectedPackJobId(defaultSelectedJob.id);
}
```

No code should set `selectedPackJobId` based on status changes.

- [ ] **Step 4: Run selected-job stability test green**

Run:

```bash
npm test -- src/App.test.tsx -t "keeps the selected Application Pack job stable"
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

Run:

```bash
git add src/App.tsx src/App.test.tsx src/components/ApplicationPackBuilder.tsx
git commit -m "test: keep pack job selection stable"
```

---

### Task 5: Final Regression Verification And Merge

**Files:**
- Verify only unless a failure appears.

**Interfaces:**
- Consumes all behavior from Tasks 1-4.
- Produces a merge-ready branch with tests and build passing.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: PASS with all test files passing. The known React warning about duplicate `briefing-2026-06-28` keys may still appear and is not part of this feature.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS with `tsc -b && vite build` completing successfully.

- [ ] **Step 3: Inspect diff**

Run:

```bash
git diff --stat main
git diff --check
```

Expected: changes limited to:

```text
src/App.tsx
src/App.test.tsx
src/components/ApplicationPackBuilder.tsx
src/components/JobDetail.tsx
src/styles.css
```

`git diff --check` should print no whitespace errors.

- [ ] **Step 4: Merge to main and push**

Run:

```bash
git switch main
git merge --no-ff codex/application-pack-job-selector -m "Merge application pack job selector"
git push origin main
```

Expected: GitHub receives a new `main` commit, and Vercel auto-deploy starts from the pushed branch.

---

## Self-Review

**Spec coverage:** This plan covers Application Pack job selection, keyword search, status filtering, applied/not-applied visibility, quick applied/not-applied actions, and generation of materials for the selected job.

**Placeholder scan:** No unresolved placeholder markers or unspecified edge handling remains. Every task includes concrete files, code, commands, and expected results.

**Type consistency:** `PackStatusFilter`, `isAppliedForFilter`, `matchesPackStatusFilter`, and `matchesPackSearch` are introduced in Task 1 and reused consistently in later tasks. `JobStatus` values match `src/domain/types.ts`.
