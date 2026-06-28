# Web3 Remote Job Copilot V1 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-first Web3 Remote Job Copilot V1 MVP that Mia can use immediately to manage job assets, review Web3 remote roles, generate application packs, track outreach, and run weekly reviews.

**Architecture:** Build a single-user React + TypeScript web app with Vite, localStorage persistence, deterministic scoring and template generation, and no backend account system. The app is intentionally local-first for fast use: data stays in the browser, export/import uses JSON, and all external actions remain manual human-reviewed actions. Domain logic lives in small pure TypeScript modules with Vitest coverage; UI components consume those modules and keep platform automation out of scope.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, localStorage, plain CSS, lucide-react icons.

## Global Constraints

- V1 is a single-user Web App for Mia.
- 第一用户是 Mia.
- V1 is a single-user job-search cockpit, not a general SaaS.
- V1 prioritizes helping Mia land a remote role quickly over general SaaS extensibility.
- Web3 is the long-term transition target, but V1 may recommend Web3-adjacent remote roles when they improve the chance of landing remote work sooner.
- Human review remains mandatory before sending applications, DMs, or follow-ups.
- V1 is not an auto-apply bot.
- V1 does not include multi-user accounts, payments, team administration, browser plugins, automatic LinkedIn or Indeed automation, or automatic application submission.
- LinkedIn and Indeed are treated as manual or user-assisted sources only.
- Do not store third-party account passwords.
- Do not store LinkedIn / Indeed login state.
- Do not position Mia as a Solidity engineer, smart contract engineer, senior tokenomics expert, Head of Growth, Director, or Principal.
- Do not fabricate full-time Web3 company experience.
- P0 must support manual job URL import, pasted JD import, manual contact input, explainable Fit & Risk Score, Application Pack generation, outreach tracking, follow-up reminders, and Weekly Review.
- P0 data persistence is browser localStorage plus JSON export/import.
- P0 does not call external job boards, does not scrape logged-in pages, and does not send network requests except the local dev server serving the app.

---

## File Structure

- Create `package.json`: scripts and dependencies for the Vite React app.
- Create `index.html`: Vite entry HTML.
- Create `tsconfig.json`: TypeScript compiler settings.
- Create `tsconfig.node.json`: TypeScript settings for Vite config.
- Create `vite.config.ts`: Vite + React + Vitest configuration.
- Create `src/main.tsx`: React app bootstrap.
- Create `src/App.tsx`: page shell, navigation, and app state wiring.
- Create `src/styles.css`: app styling.
- Create `src/domain/types.ts`: shared domain types and enum-like unions.
- Create `src/domain/seedCandidate.ts`: Mia's initial Candidate Asset Layer.
- Create `src/domain/scoring.ts`: deterministic explainable Fit & Risk scoring.
- Create `src/domain/applicationPack.ts`: deterministic Application Pack and outreach draft generation.
- Create `src/domain/weeklyReview.ts`: weekly metrics and recommendations.
- Create `src/storage/localStore.ts`: localStorage load/save/export/import helpers.
- Create `src/sampleData.ts`: sample jobs, contacts, and activities for first-run usability.
- Create `src/components/CandidateAssets.tsx`: Candidate Asset Layer editor.
- Create `src/components/TodayCommandCenter.tsx`: daily action queue and KPI summary.
- Create `src/components/JobInbox.tsx`: manual job intake, filters, and job list.
- Create `src/components/JobDetail.tsx`: job review, score explanation, and status changes.
- Create `src/components/ApplicationPackBuilder.tsx`: pack generation and manual-copy output.
- Create `src/components/OutreachTracker.tsx`: contact and activity tracking.
- Create `src/components/WeeklyReview.tsx`: weekly review output.
- Create `src/components/BackupPanel.tsx`: JSON export/import.
- Create `src/test/setup.ts`: Testing Library setup.
- Create `src/domain/scoring.test.ts`: scoring tests.
- Create `src/domain/applicationPack.test.ts`: application pack tests.
- Create `src/domain/weeklyReview.test.ts`: weekly review tests.
- Create `src/storage/localStore.test.ts`: persistence tests.
- Create `src/App.test.tsx`: app smoke tests for the core workflow.

---

### Task 1: Scaffold Local React App And Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`

**Interfaces:**
- Consumes: none.
- Produces: a runnable Vite React app with `npm run dev`, `npm run build`, and `npm test`.

- [ ] **Step 1: Create the package manifest**

Create `package.json` with this content:

```json
{
  "name": "web3-remote-job-copilot",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^7.0.0",
    "typescript": "^5.5.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "jsdom": "^25.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: command exits with status `0` and creates `package-lock.json`.

- [ ] **Step 3: Create Vite entry files**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web3 Remote Job Copilot</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    globals: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Create a failing app smoke test**

Create `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the application command center", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Mia Web3 Remote Application Command Center/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Job Inbox/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the smoke test and verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 6: Create the minimal app shell**

Create `src/App.tsx`:

```tsx
import { BriefcaseBusiness, CalendarCheck, FileText, MessageSquare, Sparkles, Target } from "lucide-react";
import "./styles.css";

const NAV_ITEMS = [
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "jobs", label: "Job Inbox", icon: BriefcaseBusiness },
  { id: "assets", label: "Assets", icon: Target },
  { id: "pack", label: "Application Pack", icon: FileText },
  { id: "outreach", label: "Outreach", icon: MessageSquare },
  { id: "review", label: "Weekly Review", icon: Sparkles },
] as const;

export default function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div>
          <p className="eyebrow">V1 Local MVP</p>
          <h1>Mia Web3 Remote Application Command Center</h1>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className="nav-button" type="button">
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      <section className="workspace" aria-label="Workspace">
        <h2>Today Command Center</h2>
        <p>Review jobs, generate application packs, track outreach, and run the weekly review from one local cockpit.</p>
      </section>
    </main>
  );
}
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `src/styles.css`:

```css
:root {
  color: #172026;
  background: #f6f7f2;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(240px, 292px) 1fr;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 28px;
  background: #153b3f;
  color: #f8fbf7;
}

.eyebrow {
  margin: 0 0 8px;
  color: #b8dfd2;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  max-width: 14rem;
  font-size: 1.55rem;
  line-height: 1.15;
}

.nav-list {
  display: grid;
  gap: 8px;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  cursor: pointer;
}

.workspace {
  padding: 32px;
}

@media (max-width: 760px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding: 20px;
  }

  h1 {
    max-width: none;
  }
}
```

- [ ] **Step 7: Run tests and build**

Run:

```bash
npm test -- src/App.test.tsx
npm run build
```

Expected:

```text
PASS src/App.test.tsx
```

Expected build output includes:

```text
✓ built
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src/main.tsx src/App.tsx src/styles.css src/test/setup.ts src/App.test.tsx
git commit -m "feat: scaffold local job copilot app"
```

---

### Task 2: Add Domain Types, Seed Candidate Asset, And Local Persistence

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/seedCandidate.ts`
- Create: `src/sampleData.ts`
- Create: `src/storage/localStore.ts`
- Create: `src/storage/localStore.test.ts`

**Interfaces:**
- Produces: `AppState`, `CandidateAsset`, `Job`, `OutreachContact`, `ApplicationActivity`, `loadAppState(storage?: Storage): AppState`, `saveAppState(state: AppState, storage?: Storage): void`, `exportAppState(state: AppState): string`, `importAppState(json: string): AppState`.
- Consumes: none.

- [ ] **Step 1: Write failing persistence tests**

Create `src/storage/localStore.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createInitialAppState, exportAppState, importAppState, loadAppState, saveAppState } from "./localStore";

function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => data.delete(key),
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("localStore", () => {
  it("creates initial state with Mia candidate assets and sample jobs", () => {
    const state = createInitialAppState();

    expect(state.candidate.linkedinHeadline).toContain("Growth Data Analyst");
    expect(state.candidate.riskDisclaimers).toContain("No full-time Web3 company experience yet");
    expect(state.jobs.length).toBeGreaterThanOrEqual(2);
  });

  it("saves and loads app state from localStorage", () => {
    const storage = createMemoryStorage();
    const state = createInitialAppState();

    saveAppState(state, storage);
    const loaded = loadAppState(storage);

    expect(loaded.candidate.targetPositioning).toBe(state.candidate.targetPositioning);
    expect(loaded.jobs.map((job) => job.id)).toEqual(state.jobs.map((job) => job.id));
  });

  it("exports and imports valid JSON backups", () => {
    const state = createInitialAppState();
    const json = exportAppState(state);

    const imported = importAppState(json);

    expect(imported.version).toBe(1);
    expect(imported.candidate.portfolioUrl).toContain("github.io");
  });

  it("rejects malformed backup JSON", () => {
    expect(() => importAppState("{bad json")).toThrow("Backup is not valid JSON");
    expect(() => importAppState(JSON.stringify({ version: 1 }))).toThrow("Backup is missing required app state fields");
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected: FAIL because `src/storage/localStore.ts` does not exist.

- [ ] **Step 3: Create domain types**

Create `src/domain/types.ts`:

```ts
export type RoleFamily =
  | "Growth Data Analyst"
  | "Business Analyst"
  | "Product / Operations Analyst"
  | "Research & Due Diligence Analyst";

export type JobStatus =
  | "new"
  | "reviewed"
  | "shortlisted"
  | "application_pack_ready"
  | "applied"
  | "dm_sent"
  | "follow_up_due"
  | "interview"
  | "rejected"
  | "archived";

export type Recommendation = "Strong Apply" | "Apply with Custom Pack" | "DM First" | "Portfolio Needed" | "Skip";
export type RemoteType = "remote" | "hybrid" | "onsite" | "unknown";
export type CryptoRequirementLevel = "none" | "interest" | "preferred" | "required" | "hard_blocker";
export type ContactChannel = "LinkedIn" | "X" | "Telegram" | "Email" | "Warm intro" | "Community";
export type MessageStatus = "Not contacted" | "DM drafted" | "DM sent" | "Follow-up due" | "Replied" | "Call booked" | "Rejected" | "No response";
export type RelationshipType = "recruiter" | "hiring manager" | "team member" | "founder" | "warm intro" | "community contact";
export type ActivityType =
  | "reviewed_job"
  | "generated_pack"
  | "submitted_application"
  | "sent_dm"
  | "sent_follow_up"
  | "received_reply"
  | "booked_interview"
  | "rejected";

export interface CandidateAsset {
  targetPositioning: string;
  linkedinHeadline: string;
  linkedinAbout: string;
  linkedinExperienceHighlights: string[];
  portfolioUrl: string;
  portfolioProjects: string[];
  resumeVersions: string[];
  featuredItems: string[];
  skillKeywords: string[];
  proofPoints: string[];
  riskDisclaimers: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  source: string;
  originalUrl: string;
  applyUrl: string;
  jdText: string;
  remoteType: RemoteType;
  locationConstraints: string;
  roleFamily: RoleFamily;
  seniority: string;
  requiredSkills: string[];
  preferredSkills: string[];
  cryptoRequirementLevel: CryptoRequirementLevel;
  salaryRange: string;
  postedAt: string;
  status: JobStatus;
  notes: string;
}

export interface FitRiskScore {
  overallScore: number;
  roleFit: number;
  transferableFinanceFit: number;
  growthDataFit: number;
  productOpsFit: number;
  web3Barrier: number;
  remoteCompatibility: number;
  languageFit: number;
  portfolioProofStrength: number;
  outreachOpportunity: number;
  recommendation: Recommendation;
  reasons: string[];
  risks: string[];
  suggestedAngle: RoleFamily;
}

export interface ApplicationPack {
  jobId: string;
  selectedResumeVersion: string;
  roleAngle: RoleFamily;
  tailoredSummary: string;
  coverNote: string;
  recruiterDm: string;
  hiringManagerDm: string;
  portfolioHighlight: string;
  interviewTalkingPoints: string[];
  riskHandlingNote: string;
  generatedAt: string;
}

export interface OutreachContact {
  id: string;
  jobId: string;
  name: string;
  company: string;
  role: string;
  channel: ContactChannel;
  profileUrl: string;
  relationshipType: RelationshipType;
  messageStatus: MessageStatus;
  followUpDate: string;
  replyStatus: string;
  notes: string;
}

export interface ApplicationActivity {
  id: string;
  jobId: string;
  actionType: ActivityType;
  channel: ContactChannel | "Application Portal";
  date: string;
  contentVersion: string;
  result: string;
  nextActionDate: string;
  notes: string;
}

export interface AppState {
  version: 1;
  candidate: CandidateAsset;
  jobs: Job[];
  packs: ApplicationPack[];
  contacts: OutreachContact[];
  activities: ApplicationActivity[];
}
```

- [ ] **Step 4: Create Mia seed assets and sample data**

Create `src/domain/seedCandidate.ts`:

```ts
import type { CandidateAsset } from "./types";

export const seedCandidate: CandidateAsset = {
  targetPositioning: "Growth Data Analyst / Business Analyst for Web3-adjacent remote teams",
  linkedinHeadline: "Growth Data Analyst | Business Analyst | Fintech, Lifecycle Analytics, AI Products",
  linkedinAbout:
    "I help product, growth, and operations teams turn customer lifecycle data into practical decisions. My background spans banking analytics, fintech projects, AI chatbot feasibility, PRD/UAT work, and portfolio-style Web3 learning projects.",
  linkedinExperienceHighlights: [
    "Customer lifecycle analytics across acquisition, activation, retention, churn risk, and reactivation",
    "Campaign conversion rates up to 42% through segmentation-based operations",
    "Data product, PRD, UAT, dashboard, and cross-functional delivery experience",
    "AI chatbot feasibility work under data and compliance constraints",
  ],
  portfolioUrl: "https://yaow1211-design.github.io/PortfolioPages/",
  portfolioProjects: [
    "Web3 Remote Job Copilot portfolio project",
    "Lifecycle analytics and growth operations case studies",
    "AI chatbot feasibility and compliance analysis",
  ],
  resumeVersions: [
    "Growth Data Analyst resume",
    "Business Analyst resume",
    "Product Operations Analyst resume",
    "Research and Due Diligence Analyst resume",
  ],
  featuredItems: ["GitHub Pages portfolio", "LinkedIn Featured portfolio link", "Web3 remote transition narrative"],
  skillKeywords: ["SQL", "Python", "Lifecycle Analytics", "User Segmentation", "Campaign Analysis", "PRD", "UAT", "Fintech", "AI", "Web3"],
  proofPoints: [
    "Traditional finance background",
    "Customer lifecycle analytics",
    "Campaign conversion up to 42%",
    "Data product / PRD / UAT / dashboard experience",
    "AI chatbot feasibility and compliance experience",
    "Green finance and asset management exposure",
    "SQL / Python / data analysis internships",
    "GitHub Pages portfolio",
    "Independent Web3 / DeFi project angle",
  ],
  riskDisclaimers: [
    "No full-time Web3 company experience yet",
    "Not applying as Solidity engineer",
    "Not positioning as senior tokenomics expert",
  ],
};
```

Create `src/sampleData.ts`:

```ts
import type { ApplicationActivity, Job, OutreachContact } from "./domain/types";

export const sampleJobs: Job[] = [
  {
    id: "job-1",
    title: "Growth Data Analyst",
    company: "Example Web3 Wallet",
    source: "Manual URL",
    originalUrl: "https://example.com/jobs/growth-data-analyst",
    applyUrl: "https://example.com/jobs/growth-data-analyst/apply",
    jdText:
      "Remote Growth Data Analyst role for a wallet team. SQL, lifecycle analysis, funnel metrics, campaign analysis, and interest in crypto preferred. APAC timezone friendly.",
    remoteType: "remote",
    locationConstraints: "Worldwide / APAC friendly",
    roleFamily: "Growth Data Analyst",
    seniority: "Mid-level",
    requiredSkills: ["SQL", "Lifecycle Analytics", "Campaign Analysis"],
    preferredSkills: ["Crypto interest", "Wallet product experience"],
    cryptoRequirementLevel: "preferred",
    salaryRange: "",
    postedAt: "2026-06-28",
    status: "new",
    notes: "Good first target for portfolio angle.",
  },
  {
    id: "job-2",
    title: "Business Analyst, Fintech Operations",
    company: "Example Global Fintech",
    source: "Pasted JD",
    originalUrl: "",
    applyUrl: "",
    jdText:
      "Remote business analyst role for fintech operations. Requires stakeholder communication, process analysis, dashboard requirements, SQL, and English documentation.",
    remoteType: "remote",
    locationConstraints: "Worldwide",
    roleFamily: "Business Analyst",
    seniority: "Associate / Mid-level",
    requiredSkills: ["SQL", "Business Analysis", "Stakeholder Communication"],
    preferredSkills: ["Fintech", "Product operations"],
    cryptoRequirementLevel: "none",
    salaryRange: "",
    postedAt: "2026-06-28",
    status: "shortlisted",
    notes: "Web3-adjacent fallback with higher landing probability.",
  },
];

export const sampleContacts: OutreachContact[] = [
  {
    id: "contact-1",
    jobId: "job-1",
    name: "Hiring Team",
    company: "Example Web3 Wallet",
    role: "Recruiter",
    channel: "LinkedIn",
    profileUrl: "",
    relationshipType: "recruiter",
    messageStatus: "Not contacted",
    followUpDate: "",
    replyStatus: "",
    notes: "Manual contact entry only.",
  },
];

export const sampleActivities: ApplicationActivity[] = [
  {
    id: "activity-1",
    jobId: "job-2",
    actionType: "reviewed_job",
    channel: "Application Portal",
    date: "2026-06-28",
    contentVersion: "Initial review",
    result: "Shortlisted",
    nextActionDate: "2026-06-29",
    notes: "Generate application pack next.",
  },
];
```

- [ ] **Step 5: Implement local persistence**

Create `src/storage/localStore.ts`:

```ts
import { seedCandidate } from "../domain/seedCandidate";
import type { AppState } from "../domain/types";
import { sampleActivities, sampleContacts, sampleJobs } from "../sampleData";

const STORAGE_KEY = "web3-remote-job-copilot:v1";

export function createInitialAppState(): AppState {
  return {
    version: 1,
    candidate: seedCandidate,
    jobs: sampleJobs,
    packs: [],
    contacts: sampleContacts,
    activities: sampleActivities,
  };
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = (value as AppState).candidate;
  return (
    (value as AppState).version === 1 &&
    Boolean(candidate) &&
    Array.isArray((value as AppState).jobs) &&
    Array.isArray((value as AppState).packs) &&
    Array.isArray((value as AppState).contacts) &&
    Array.isArray((value as AppState).activities)
  );
}

export function loadAppState(storage: Storage = window.localStorage): AppState {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return createInitialAppState();
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isAppState(parsed) ? parsed : createInitialAppState();
  } catch {
    return createInitialAppState();
  }
}

export function saveAppState(state: AppState, storage: Storage = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportAppState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importAppState(json: string): AppState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Backup is not valid JSON");
  }

  if (!isAppState(parsed)) {
    throw new Error("Backup is missing required app state fields");
  }

  return parsed;
}
```

- [ ] **Step 6: Run persistence tests**

Run:

```bash
npm test -- src/storage/localStore.test.ts
```

Expected:

```text
PASS src/storage/localStore.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add src/domain/types.ts src/domain/seedCandidate.ts src/sampleData.ts src/storage/localStore.ts src/storage/localStore.test.ts
git commit -m "feat: add local job copilot data model"
```

---

### Task 3: Implement Explainable Fit & Risk Score

**Files:**
- Create: `src/domain/scoring.ts`
- Create: `src/domain/scoring.test.ts`

**Interfaces:**
- Consumes: `CandidateAsset`, `Job`, `FitRiskScore`, `RoleFamily`, `Recommendation` from `src/domain/types.ts`.
- Produces: `scoreJob(job: Job, candidate: CandidateAsset): FitRiskScore`.

- [ ] **Step 1: Write failing scoring tests**

Create `src/domain/scoring.test.ts`:

```ts
import { seedCandidate } from "./seedCandidate";
import { scoreJob } from "./scoring";
import type { Job } from "./types";

const baseJob: Job = {
  id: "job-test",
  title: "Growth Data Analyst",
  company: "Example Web3 Analytics",
  source: "Manual URL",
  originalUrl: "https://example.com/job",
  applyUrl: "https://example.com/apply",
  jdText: "Remote role requiring SQL, lifecycle analytics, user segmentation, campaign analysis, and interest in crypto.",
  remoteType: "remote",
  locationConstraints: "Worldwide",
  roleFamily: "Growth Data Analyst",
  seniority: "Mid-level",
  requiredSkills: ["SQL", "Lifecycle Analytics", "User Segmentation"],
  preferredSkills: ["Crypto interest"],
  cryptoRequirementLevel: "preferred",
  salaryRange: "",
  postedAt: "2026-06-28",
  status: "new",
  notes: "",
};

describe("scoreJob", () => {
  it("recommends a strong apply for remote growth analytics roles with transferable finance fit", () => {
    const score = scoreJob(baseJob, seedCandidate);

    expect(score.overallScore).toBeGreaterThanOrEqual(75);
    expect(score.recommendation).toBe("Strong Apply");
    expect(score.reasons.join(" ")).toContain("lifecycle analytics");
    expect(score.risks).not.toContain("Hard blocker: Solidity or smart contract engineering is core to the role.");
  });

  it("skips Solidity engineering roles", () => {
    const score = scoreJob(
      {
        ...baseJob,
        title: "Smart Contract Engineer",
        jdText: "Solidity engineer needed for protocol smart contracts. 3+ years blockchain engineering required.",
        roleFamily: "Product / Operations Analyst",
        requiredSkills: ["Solidity", "Smart Contracts"],
        cryptoRequirementLevel: "hard_blocker",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("Skip");
    expect(score.overallScore).toBeLessThan(50);
    expect(score.risks).toContain("Hard blocker: Solidity or smart contract engineering is core to the role.");
  });

  it("uses DM First when outreach opportunity is high but Web3 barrier is medium", () => {
    const score = scoreJob(
      {
        ...baseJob,
        jdText: "Remote research analyst role. Crypto experience preferred. Founder-led team encourages direct outreach and community participation.",
        roleFamily: "Research & Due Diligence Analyst",
        requiredSkills: ["Research", "Financial Analysis"],
        preferredSkills: ["Crypto experience", "Community"],
        cryptoRequirementLevel: "preferred",
      },
      seedCandidate,
    );

    expect(score.recommendation).toBe("DM First");
    expect(score.outreachOpportunity).toBeGreaterThanOrEqual(80);
  });
});
```

- [ ] **Step 2: Run scoring tests and verify they fail**

Run:

```bash
npm test -- src/domain/scoring.test.ts
```

Expected: FAIL because `src/domain/scoring.ts` does not exist.

- [ ] **Step 3: Implement scoring**

Create `src/domain/scoring.ts`:

```ts
import type { CandidateAsset, FitRiskScore, Job, Recommendation, RoleFamily } from "./types";

const HARD_BLOCKERS = ["solidity", "smart contract", "3+ years blockchain", "5+ years in blockchain", "head of growth", "director", "principal"];
const GROWTH_TERMS = ["lifecycle", "segmentation", "campaign", "growth", "funnel", "activation", "retention", "reactivation"];
const PRODUCT_OPS_TERMS = ["prd", "uat", "operations", "dashboard", "workflow", "requirements", "stakeholder"];
const FINANCE_TERMS = ["finance", "fintech", "banking", "asset management", "credit", "risk", "trading"];
const OUTREACH_TERMS = ["founder", "hiring manager", "community", "direct outreach", "telegram", "linkedin", "warm intro"];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function textFor(job: Job): string {
  return [job.title, job.company, job.jdText, job.requiredSkills.join(" "), job.preferredSkills.join(" "), job.notes].join(" ").toLowerCase();
}

function countMatches(text: string, terms: string[]): number {
  return terms.filter((term) => text.includes(term)).length;
}

function hasHardBlocker(text: string, job: Job): boolean {
  return job.cryptoRequirementLevel === "hard_blocker" || HARD_BLOCKERS.some((term) => text.includes(term));
}

function recommendationFor(score: number, outreachOpportunity: number, portfolioProofStrength: number, hardBlocked: boolean): Recommendation {
  if (hardBlocked || score < 45) {
    return "Skip";
  }
  if (score >= 75) {
    return "Strong Apply";
  }
  if (outreachOpportunity >= 80) {
    return "DM First";
  }
  if (portfolioProofStrength < 55) {
    return "Portfolio Needed";
  }
  return "Apply with Custom Pack";
}

function suggestedAngle(job: Job): RoleFamily {
  return job.roleFamily;
}

export function scoreJob(job: Job, candidate: CandidateAsset): FitRiskScore {
  const text = textFor(job);
  const hardBlocked = hasHardBlocker(text, job);
  const roleFit = clamp(job.roleFamily === "Growth Data Analyst" || job.roleFamily === "Business Analyst" ? 88 : 74);
  const transferableFinanceFit = clamp(55 + countMatches(text, FINANCE_TERMS) * 18 + (candidate.proofPoints.join(" ").toLowerCase().includes("finance") ? 20 : 0));
  const growthDataFit = clamp(45 + countMatches(text, GROWTH_TERMS) * 15 + (text.includes("sql") ? 12 : 0));
  const productOpsFit = clamp(45 + countMatches(text, PRODUCT_OPS_TERMS) * 12);
  const remoteCompatibility = clamp(job.remoteType === "remote" ? 95 : job.remoteType === "hybrid" ? 45 : 20);
  const languageFit = clamp(text.includes("native") && !text.includes("english") && !text.includes("chinese") ? 45 : 85);
  const portfolioProofStrength = clamp(55 + countMatches(candidate.portfolioProjects.join(" ").toLowerCase(), ["web3", "analytics", "growth"]) * 15 + (text.includes("portfolio") ? 10 : 0));
  const outreachOpportunity = clamp(45 + countMatches(text, OUTREACH_TERMS) * 18 + (job.originalUrl.includes("linkedin") ? 10 : 0));
  const web3Barrier =
    job.cryptoRequirementLevel === "hard_blocker" ? -30 : job.cryptoRequirementLevel === "required" ? -22 : job.cryptoRequirementLevel === "preferred" ? -5 : 0;
  const weighted =
    roleFit * 0.2 +
    transferableFinanceFit * 0.2 +
    growthDataFit * 0.2 +
    productOpsFit * 0.1 +
    remoteCompatibility * 0.1 +
    portfolioProofStrength * 0.1 +
    outreachOpportunity * 0.1 +
    web3Barrier;
  const overallScore = hardBlocked ? clamp(Math.min(weighted, 42)) : clamp(weighted);

  const reasons = [
    `Role angle: ${job.roleFamily}.`,
    growthDataFit >= 65 ? "Strong lifecycle analytics and growth data overlap." : "Growth data overlap needs a sharper portfolio angle.",
    transferableFinanceFit >= 65 ? "Finance and fintech background transfers well into this role." : "Finance transfer story should be made explicit.",
    remoteCompatibility >= 80 ? "Remote setup looks compatible." : "Remote/location compatibility needs manual review.",
  ];
  const risks = [
    ...(hardBlocked ? ["Hard blocker: Solidity or smart contract engineering is core to the role."] : []),
    ...(job.cryptoRequirementLevel === "required" ? ["Web3 experience is required; use only with strong proof or warm intro."] : []),
    ...(languageFit < 60 ? ["Language requirement may be outside Mia's current positioning."] : []),
  ];

  return {
    overallScore,
    roleFit,
    transferableFinanceFit,
    growthDataFit,
    productOpsFit,
    web3Barrier,
    remoteCompatibility,
    languageFit,
    portfolioProofStrength,
    outreachOpportunity,
    recommendation: recommendationFor(overallScore, outreachOpportunity, portfolioProofStrength, hardBlocked),
    reasons,
    risks,
    suggestedAngle: suggestedAngle(job),
  };
}
```

- [ ] **Step 4: Run scoring tests**

Run:

```bash
npm test -- src/domain/scoring.test.ts
```

Expected:

```text
PASS src/domain/scoring.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/scoring.ts src/domain/scoring.test.ts
git commit -m "feat: add explainable fit risk scoring"
```

---

### Task 4: Implement Application Pack Generator

**Files:**
- Create: `src/domain/applicationPack.ts`
- Create: `src/domain/applicationPack.test.ts`

**Interfaces:**
- Consumes: `CandidateAsset`, `Job`, `FitRiskScore`, `ApplicationPack`.
- Produces: `generateApplicationPack(job: Job, candidate: CandidateAsset, score: FitRiskScore, now?: Date): ApplicationPack`.

- [ ] **Step 1: Write failing pack tests**

Create `src/domain/applicationPack.test.ts`:

```ts
import { generateApplicationPack } from "./applicationPack";
import { seedCandidate } from "./seedCandidate";
import { scoreJob } from "./scoring";
import type { Job } from "./types";

const job: Job = {
  id: "job-pack",
  title: "Growth Data Analyst",
  company: "Example Web3 Wallet",
  source: "Manual URL",
  originalUrl: "https://example.com/job",
  applyUrl: "https://example.com/apply",
  jdText: "Remote growth data analyst role requiring SQL, lifecycle analytics, campaign analysis, and crypto interest.",
  remoteType: "remote",
  locationConstraints: "APAC friendly",
  roleFamily: "Growth Data Analyst",
  seniority: "Mid-level",
  requiredSkills: ["SQL", "Lifecycle Analytics", "Campaign Analysis"],
  preferredSkills: ["Crypto interest"],
  cryptoRequirementLevel: "preferred",
  salaryRange: "",
  postedAt: "2026-06-28",
  status: "shortlisted",
  notes: "",
};

describe("generateApplicationPack", () => {
  it("generates a human-reviewed application pack aligned with Mia's positioning", () => {
    const score = scoreJob(job, seedCandidate);
    const pack = generateApplicationPack(job, seedCandidate, score, new Date("2026-06-28T10:00:00Z"));

    expect(pack.jobId).toBe("job-pack");
    expect(pack.roleAngle).toBe("Growth Data Analyst");
    expect(pack.selectedResumeVersion).toBe("Growth Data Analyst resume");
    expect(pack.tailoredSummary).toContain("campaign conversion up to 42%");
    expect(pack.recruiterDm).toContain("I will review and send this manually");
    expect(pack.hiringManagerDm).toContain("lifecycle analytics");
    expect(pack.riskHandlingNote).toContain("I have not worked full-time inside a Web3 company yet");
    expect(pack.interviewTalkingPoints.length).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run pack tests and verify they fail**

Run:

```bash
npm test -- src/domain/applicationPack.test.ts
```

Expected: FAIL because `src/domain/applicationPack.ts` does not exist.

- [ ] **Step 3: Implement pack generator**

Create `src/domain/applicationPack.ts`:

```ts
import type { ApplicationPack, CandidateAsset, FitRiskScore, Job } from "./types";

function pickResumeVersion(candidate: CandidateAsset, roleAngle: string): string {
  return candidate.resumeVersions.find((version) => version.toLowerCase().includes(roleAngle.toLowerCase().split(" ")[0])) ?? candidate.resumeVersions[0];
}

function proofPoint(candidate: CandidateAsset, phrase: string): string {
  return candidate.proofPoints.find((point) => point.toLowerCase().includes(phrase)) ?? candidate.proofPoints[0];
}

export function generateApplicationPack(job: Job, candidate: CandidateAsset, score: FitRiskScore, now: Date = new Date()): ApplicationPack {
  const roleAngle = score.suggestedAngle;
  const selectedResumeVersion = pickResumeVersion(candidate, roleAngle);
  const conversionProof = proofPoint(candidate, "42%");
  const dataProductProof = proofPoint(candidate, "prd");
  const web3Proof = proofPoint(candidate, "web3");

  return {
    jobId: job.id,
    selectedResumeVersion,
    roleAngle,
    tailoredSummary: `For ${job.company}'s ${job.title} role, I would position Mia as a ${roleAngle} who connects finance-grade analytical discipline with lifecycle analytics, segmentation, and campaign execution. The strongest proof point is ${conversionProof}, supported by ${dataProductProof}.`,
    coverNote: `I am interested in ${job.company}'s ${job.title} role because it combines ${job.roleFamily.toLowerCase()} work with remote collaboration. My background in customer lifecycle analytics, banking data products, and AI/product delivery can help the team turn user behavior into practical growth actions. I will review and submit this application manually through the official application link.`,
    recruiterDm: `Hi, I found the ${job.title} role at ${job.company}. My background combines customer lifecycle analytics, SQL/Python data work, and fintech product delivery, including campaign conversion up to 42%. I am exploring Web3 remote roles where this finance and growth analytics experience is useful. I will review and send this manually; could I ask whether this role is open to APAC-friendly remote candidates?`,
    hiringManagerDm: `Hi, I am interested in ${job.company}'s ${job.title} role. I have worked on lifecycle analytics, segmentation, campaign performance tracking, PRD/UAT coordination, and AI chatbot feasibility in regulated finance settings. I am not positioning myself as a smart contract engineer; my angle is helping product and growth teams make better decisions from customer and campaign data. I will review and send this manually.`,
    portfolioHighlight: `Mention ${candidate.portfolioUrl} and connect it to ${web3Proof}.`,
    interviewTalkingPoints: [
      "Explain how lifecycle analytics across acquisition, activation, retention, churn risk, and reactivation transfers into Web3 growth.",
      "Use the 42% campaign conversion proof point to show measurable business impact.",
      "Describe PRD, UAT, dashboard, and cross-functional delivery experience as evidence for remote collaboration.",
      "Be transparent that Mia has no full-time Web3 company experience yet and is applying for analyst/operator roles, not Solidity engineering.",
    ],
    riskHandlingNote:
      "I have not worked full-time inside a Web3 company yet, but I bring finance-grade analytical discipline, customer lifecycle growth experience, and hands-on Web3 project work.",
    generatedAt: now.toISOString(),
  };
}
```

- [ ] **Step 4: Run pack tests**

Run:

```bash
npm test -- src/domain/applicationPack.test.ts
```

Expected:

```text
PASS src/domain/applicationPack.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/applicationPack.ts src/domain/applicationPack.test.ts
git commit -m "feat: generate human reviewed application packs"
```

---

### Task 5: Implement Weekly Review Metrics

**Files:**
- Create: `src/domain/weeklyReview.ts`
- Create: `src/domain/weeklyReview.test.ts`

**Interfaces:**
- Consumes: `Job[]`, `ApplicationActivity[]`.
- Produces: `buildWeeklyReview(jobs: Job[], activities: ApplicationActivity[]): WeeklyReviewResult`.

- [ ] **Step 1: Write failing weekly review tests**

Create `src/domain/weeklyReview.test.ts`:

```ts
import { buildWeeklyReview } from "./weeklyReview";
import type { ApplicationActivity, Job } from "./types";

const jobs = [
  { id: "j1", roleFamily: "Growth Data Analyst", status: "applied" },
  { id: "j2", roleFamily: "Business Analyst", status: "shortlisted" },
  { id: "j3", roleFamily: "Growth Data Analyst", status: "interview" },
] as Job[];

const activities: ApplicationActivity[] = [
  { id: "a1", jobId: "j1", actionType: "reviewed_job", channel: "Application Portal", date: "2026-06-24", contentVersion: "", result: "", nextActionDate: "", notes: "" },
  { id: "a2", jobId: "j1", actionType: "submitted_application", channel: "Application Portal", date: "2026-06-24", contentVersion: "", result: "Submitted", nextActionDate: "", notes: "" },
  { id: "a3", jobId: "j1", actionType: "sent_dm", channel: "LinkedIn", date: "2026-06-25", contentVersion: "", result: "Sent", nextActionDate: "2026-06-30", notes: "" },
  { id: "a4", jobId: "j3", actionType: "booked_interview", channel: "Email", date: "2026-06-27", contentVersion: "", result: "Interview", nextActionDate: "", notes: "" },
];

describe("buildWeeklyReview", () => {
  it("summarizes weekly job search progress and gives strategy guidance", () => {
    const review = buildWeeklyReview(jobs, activities);

    expect(review.reviewedCount).toBe(1);
    expect(review.appliedCount).toBe(1);
    expect(review.outreachCount).toBe(1);
    expect(review.interviewCount).toBe(1);
    expect(review.bestRoleFamily).toBe("Growth Data Analyst");
    expect(review.nextWeekAdjustments.join(" ")).toContain("Keep Growth Data Analyst");
  });
});
```

- [ ] **Step 2: Run weekly review tests and verify they fail**

Run:

```bash
npm test -- src/domain/weeklyReview.test.ts
```

Expected: FAIL because `src/domain/weeklyReview.ts` does not exist.

- [ ] **Step 3: Implement weekly review**

Create `src/domain/weeklyReview.ts`:

```ts
import type { ApplicationActivity, Job, RoleFamily } from "./types";

export interface WeeklyReviewResult {
  reviewedCount: number;
  shortlistedCount: number;
  appliedCount: number;
  outreachCount: number;
  replyCount: number;
  interviewCount: number;
  bestRoleFamily: RoleFamily | "Not enough data";
  worstRoleFamily: RoleFamily | "Not enough data";
  nextWeekAdjustments: string[];
}

function countActivities(activities: ApplicationActivity[], type: ApplicationActivity["actionType"]): number {
  return activities.filter((activity) => activity.actionType === type).length;
}

function roleFamilyScore(jobs: Job[], activities: ApplicationActivity[], roleFamily: RoleFamily): number {
  const jobIds = new Set(jobs.filter((job) => job.roleFamily === roleFamily).map((job) => job.id));
  return activities
    .filter((activity) => jobIds.has(activity.jobId))
    .reduce((score, activity) => {
      if (activity.actionType === "booked_interview") return score + 5;
      if (activity.actionType === "received_reply") return score + 3;
      if (activity.actionType === "submitted_application") return score + 1;
      return score;
    }, 0);
}

export function buildWeeklyReview(jobs: Job[], activities: ApplicationActivity[]): WeeklyReviewResult {
  const roleFamilies = Array.from(new Set(jobs.map((job) => job.roleFamily)));
  const ranked = roleFamilies
    .map((roleFamily) => ({ roleFamily, score: roleFamilyScore(jobs, activities, roleFamily) }))
    .sort((a, b) => b.score - a.score);
  const bestRoleFamily = ranked[0]?.score ? ranked[0].roleFamily : "Not enough data";
  const worstRoleFamily = ranked.length > 1 ? ranked[ranked.length - 1].roleFamily : "Not enough data";
  const appliedCount = countActivities(activities, "submitted_application");
  const outreachCount = countActivities(activities, "sent_dm") + countActivities(activities, "sent_follow_up");
  const replyCount = countActivities(activities, "received_reply");
  const interviewCount = countActivities(activities, "booked_interview");
  const nextWeekAdjustments = [
    bestRoleFamily === "Not enough data"
      ? "Review at least 80 roles before changing positioning."
      : `Keep ${bestRoleFamily} as a primary angle next week.`,
    appliedCount < 20 ? "Increase high-quality applications toward 20-30 per week." : "Maintain current application pace.",
    outreachCount < 30 ? "Increase targeted outreach toward 30-50 messages per week." : "Maintain current outreach pace.",
    replyCount === 0 ? "If replies stay at zero after two weeks, increase Web3-adjacent remote roles and revise DM templates." : "Use reply patterns to update LinkedIn, portfolio, and resume language.",
  ];

  return {
    reviewedCount: countActivities(activities, "reviewed_job"),
    shortlistedCount: jobs.filter((job) => job.status === "shortlisted").length,
    appliedCount,
    outreachCount,
    replyCount,
    interviewCount,
    bestRoleFamily,
    worstRoleFamily,
    nextWeekAdjustments,
  };
}
```

- [ ] **Step 4: Run weekly review tests**

Run:

```bash
npm test -- src/domain/weeklyReview.test.ts
```

Expected:

```text
PASS src/domain/weeklyReview.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/domain/weeklyReview.ts src/domain/weeklyReview.test.ts
git commit -m "feat: add weekly review metrics"
```

---

### Task 6: Wire App State, Candidate Assets, Job Inbox, And Fit Review UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/CandidateAssets.tsx`
- Create: `src/components/JobInbox.tsx`
- Create: `src/components/JobDetail.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `AppState`, `loadAppState`, `saveAppState`, `scoreJob`.
- Produces: UI for editing Candidate Asset Layer, manually adding jobs, selecting jobs, reviewing scores, and updating job status.

- [ ] **Step 1: Replace the app smoke test with workflow assertions**

Update `src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  it("renders the main command center navigation", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /Mia Web3 Remote Application Command Center/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Job Inbox/i })).toBeInTheDocument();
  });

  it("adds a pasted JD job and shows an explainable fit review", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Job Inbox/i }));
    await user.type(screen.getByLabelText(/Job title/i), "Product Operations Analyst");
    await user.type(screen.getByLabelText(/Company/i), "Example DAO Tools");
    await user.type(screen.getByLabelText(/JD text/i), "Remote role with SQL, PRD, UAT, operations, dashboard requirements, and crypto interest preferred.");
    await user.click(screen.getByRole("button", { name: /Add job/i }));

    expect(screen.getByText(/Example DAO Tools/i)).toBeInTheDocument();
    expect(screen.getByText(/Fit & Risk Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommendation/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run app tests and verify the workflow test fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because the UI is not wired yet.

- [ ] **Step 3: Create Candidate Assets component**

Create `src/components/CandidateAssets.tsx`:

```tsx
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
      <label>
        Target positioning
        <input value={candidate.targetPositioning} onChange={(event) => onChange({ ...candidate, targetPositioning: event.target.value })} />
      </label>
      <label>
        LinkedIn headline
        <input value={candidate.linkedinHeadline} onChange={(event) => onChange({ ...candidate, linkedinHeadline: event.target.value })} />
      </label>
      <label>
        Portfolio URL
        <input value={candidate.portfolioUrl} onChange={(event) => onChange({ ...candidate, portfolioUrl: event.target.value })} />
      </label>
      <label>
        Proof points
        <textarea
          rows={8}
          value={candidate.proofPoints.join("\n")}
          onChange={(event) => onChange({ ...candidate, proofPoints: updateList(event.target.value) })}
        />
      </label>
      <label>
        Risk disclaimers
        <textarea
          rows={4}
          value={candidate.riskDisclaimers.join("\n")}
          onChange={(event) => onChange({ ...candidate, riskDisclaimers: updateList(event.target.value) })}
        />
      </label>
    </section>
  );
}
```

- [ ] **Step 4: Create Job Inbox and Job Detail components**

Create `src/components/JobInbox.tsx`:

```tsx
import type { Job, RoleFamily } from "../domain/types";

interface JobInboxProps {
  jobs: Job[];
  selectedJobId: string;
  onSelectJob: (jobId: string) => void;
  onAddJob: (job: Job) => void;
}

const roleFamilies: RoleFamily[] = ["Growth Data Analyst", "Business Analyst", "Product / Operations Analyst", "Research & Due Diligence Analyst"];

export function JobInbox({ jobs, selectedJobId, onSelectJob, onAddJob }: JobInboxProps) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const company = String(form.get("company") ?? "").trim();
    const jdText = String(form.get("jdText") ?? "").trim();
    const roleFamily = String(form.get("roleFamily")) as RoleFamily;
    if (!title || !company || !jdText) {
      return;
    }
    onAddJob({
      id: `job-${Date.now()}`,
      title,
      company,
      source: "Pasted JD",
      originalUrl: String(form.get("originalUrl") ?? "").trim(),
      applyUrl: String(form.get("applyUrl") ?? "").trim(),
      jdText,
      remoteType: "remote",
      locationConstraints: "Manual review needed",
      roleFamily,
      seniority: "Manual review needed",
      requiredSkills: jdText.match(/SQL|Python|PRD|UAT|analytics|operations/gi) ?? [],
      preferredSkills: jdText.match(/crypto|Web3|DeFi|fintech|growth/gi) ?? [],
      cryptoRequirementLevel: jdText.toLowerCase().includes("required") && jdText.toLowerCase().includes("crypto") ? "required" : "preferred",
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
              {roleFamilies.map((roleFamily) => (
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
          <button className="primary-button" type="submit">Add job</button>
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
              <span>{job.company} · {job.status}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Create `src/components/JobDetail.tsx`:

```tsx
import { scoreJob } from "../domain/scoring";
import type { CandidateAsset, Job, JobStatus } from "../domain/types";

interface JobDetailProps {
  candidate: CandidateAsset;
  job: Job;
  onUpdateJob: (job: Job) => void;
}

const statuses: JobStatus[] = ["new", "reviewed", "shortlisted", "application_pack_ready", "applied", "dm_sent", "follow_up_due", "interview", "rejected", "archived"];

export function JobDetail({ candidate, job, onUpdateJob }: JobDetailProps) {
  const score = scoreJob(job, candidate);

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Fit & Risk Score</p>
        <h2>{job.title} · {job.company}</h2>
      </div>
      <div className="score-row">
        <div>
          <span className="score-number">{score.overallScore}</span>
          <p>Overall Score</p>
        </div>
        <div>
          <span className="badge">{score.recommendation}</span>
          <p>Recommendation</p>
        </div>
      </div>
      <label>
        Status
        <select value={job.status} onChange={(event) => onUpdateJob({ ...job, status: event.target.value as JobStatus })}>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      <h3>Why this fits Mia</h3>
      <ul>
        {score.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <h3>Risks</h3>
      <ul>
        {(score.risks.length ? score.risks : ["No hard blocker detected. Human review still required."]).map((risk) => (
          <li key={risk}>{risk}</li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Wire app state in App.tsx**

Replace `src/App.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, CalendarCheck, Database, FileText, MessageSquare, Sparkles, Target } from "lucide-react";
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
  const selectedJob = useMemo(() => state.jobs.find((job) => job.id === selectedJobId) ?? state.jobs[0], [selectedJobId, state.jobs]);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  function addJob(job: Job) {
    setState((current) => ({ ...current, jobs: [job, ...current.jobs] }));
    setSelectedJobId(job.id);
  }

  function updateJob(job: Job) {
    setState((current) => ({ ...current, jobs: current.jobs.map((item) => (item.id === job.id ? job : item)) }));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div>
          <p className="eyebrow">V1 Local MVP</p>
          <h1>Mia Web3 Remote Application Command Center</h1>
        </div>
        <nav className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? "nav-button active" : "nav-button"} type="button" onClick={() => setView(item.id)}>
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
          </section>
        )}
        {view === "jobs" && (
          <>
            <JobInbox jobs={state.jobs} selectedJobId={selectedJob?.id ?? ""} onSelectJob={setSelectedJobId} onAddJob={addJob} />
            {selectedJob && <JobDetail candidate={state.candidate} job={selectedJob} onUpdateJob={updateJob} />}
          </>
        )}
        {view === "assets" && <CandidateAssets candidate={state.candidate} onChange={(candidate) => setState((current) => ({ ...current, candidate }))} />}
        {view === "pack" && <section className="panel"><h2>Application Pack</h2><p>Select a shortlisted job from Job Inbox before generating a pack.</p></section>}
        {view === "outreach" && <section className="panel"><h2>Outreach</h2><p>Manual outreach tracking will be wired in the next task.</p></section>}
        {view === "review" && <section className="panel"><h2>Weekly Review</h2><p>Weekly review metrics will be wired after activity tracking.</p></section>}
        {view === "backup" && <section className="panel"><h2>Backup</h2><p>Export and import controls will be wired after the core workflow.</p></section>}
      </section>
    </main>
  );
}
```

- [ ] **Step 6: Extend styles for forms and panels**

Append to `src/styles.css`:

```css
.nav-button.active {
  background: #f8fbf7;
  color: #153b3f;
}

.panel {
  margin-bottom: 20px;
  border: 1px solid #d9ddd2;
  border-radius: 8px;
  padding: 20px;
  background: #ffffff;
}

.section-heading {
  margin-bottom: 18px;
}

.eyebrow-dark {
  margin: 0 0 6px;
  color: #52736d;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.grid-two {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(260px, 0.9fr);
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.span-all {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 7px;
  color: #34464a;
  font-weight: 700;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid #cbd2ca;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fbfcf8;
  color: #172026;
}

.primary-button {
  min-height: 42px;
  border: 0;
  border-radius: 8px;
  padding: 10px 14px;
  background: #1f6b5f;
  color: #ffffff;
  cursor: pointer;
}

.item-list {
  display: grid;
  gap: 10px;
}

.list-item {
  display: grid;
  gap: 4px;
  width: 100%;
  border: 1px solid #d9ddd2;
  border-radius: 8px;
  padding: 12px;
  background: #fbfcf8;
  color: #172026;
  text-align: left;
  cursor: pointer;
}

.list-item.active {
  border-color: #1f6b5f;
  background: #edf7f3;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.score-number {
  color: #1f6b5f;
  font-size: 2.4rem;
  font-weight: 800;
}

.badge {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  background: #e2efe8;
  color: #153b3f;
  font-weight: 800;
}

@media (max-width: 980px) {
  .grid-two,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run UI tests and build**

Run:

```bash
npm test -- src/App.test.tsx
npm run build
```

Expected:

```text
PASS src/App.test.tsx
```

Expected build output includes:

```text
✓ built
```

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/styles.css src/components/CandidateAssets.tsx src/components/JobInbox.tsx src/components/JobDetail.tsx src/App.test.tsx
git commit -m "feat: wire job inbox and fit review"
```

---

### Task 7: Add Application Pack Builder, Outreach Tracker, Weekly Review, And Backup UI

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/ApplicationPackBuilder.tsx`
- Create: `src/components/OutreachTracker.tsx`
- Create: `src/components/WeeklyReview.tsx`
- Create: `src/components/BackupPanel.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `generateApplicationPack`, `buildWeeklyReview`, `exportAppState`, `importAppState`.
- Produces: usable end-to-end workflow from shortlisted job to application pack, manual outreach tracking, weekly review, and JSON backup.

- [ ] **Step 1: Add end-to-end UI tests**

Append to `src/App.test.tsx`:

```tsx
it("generates an application pack and keeps sending manual", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /Application Pack/i }));
  await user.click(screen.getByRole("button", { name: /Generate pack/i }));

  expect(screen.getByText(/Tailored Summary/i)).toBeInTheDocument();
  expect(screen.getByText(/I will review and send this manually/i)).toBeInTheDocument();
});

it("shows weekly review guidance and backup controls", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole("button", { name: /Weekly Review/i }));
  expect(screen.getByText(/Next Week Adjustments/i)).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: /Backup/i }));
  expect(screen.getByRole("button", { name: /Export JSON/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/Import JSON/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run app tests and verify they fail**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because these UI flows are not implemented.

- [ ] **Step 3: Create Application Pack Builder component**

Create `src/components/ApplicationPackBuilder.tsx`:

```tsx
import { generateApplicationPack } from "../domain/applicationPack";
import { scoreJob } from "../domain/scoring";
import type { ApplicationPack, CandidateAsset, Job } from "../domain/types";

interface ApplicationPackBuilderProps {
  candidate: CandidateAsset;
  job: Job;
  pack: ApplicationPack | undefined;
  onSavePack: (pack: ApplicationPack) => void;
}

export function ApplicationPackBuilder({ candidate, job, pack, onSavePack }: ApplicationPackBuilderProps) {
  function handleGenerate() {
    onSavePack(generateApplicationPack(job, candidate, scoreJob(job, candidate)));
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Application Pack Builder</p>
        <h2>{job.title} · {job.company}</h2>
      </div>
      <button className="primary-button" type="button" onClick={handleGenerate}>Generate pack</button>
      {pack && (
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
            <p>{pack.recruiterDm}</p>
          </section>
          <section>
            <h3>Hiring Manager DM</h3>
            <p>{pack.hiringManagerDm}</p>
          </section>
          <section>
            <h3>Risk Handling Note</h3>
            <p>{pack.riskHandlingNote}</p>
          </section>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Create Outreach Tracker, Weekly Review, and Backup components**

Create `src/components/OutreachTracker.tsx`:

```tsx
import type { ApplicationActivity, ContactChannel, OutreachContact } from "../domain/types";

interface OutreachTrackerProps {
  contacts: OutreachContact[];
  activities: ApplicationActivity[];
  onAddActivity: (activity: ApplicationActivity) => void;
}

export function OutreachTracker({ contacts, activities, onAddActivity }: OutreachTrackerProps) {
  function recordManualDm(contact: OutreachContact) {
    onAddActivity({
      id: `activity-${Date.now()}`,
      jobId: contact.jobId,
      actionType: "sent_dm",
      channel: contact.channel as ContactChannel,
      date: new Date().toISOString().slice(0, 10),
      contentVersion: "Manual DM",
      result: "Sent manually by Mia",
      nextActionDate: "",
      notes: "No automated sending was used.",
    });
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Outreach Tracker</p>
        <h2>Manual Contact Workflow</h2>
      </div>
      <div className="item-list">
        {contacts.map((contact) => (
          <article className="list-item" key={contact.id}>
            <strong>{contact.name} · {contact.company}</strong>
            <span>{contact.channel} · {contact.relationshipType} · {contact.messageStatus}</span>
            <button className="secondary-button" type="button" onClick={() => recordManualDm(contact)}>Record manual DM</button>
          </article>
        ))}
      </div>
      <h3>Recent Activities</h3>
      <ul>
        {activities.slice(0, 8).map((activity) => (
          <li key={activity.id}>{activity.date}: {activity.actionType} · {activity.result || "No result yet"}</li>
        ))}
      </ul>
    </section>
  );
}
```

Create `src/components/WeeklyReview.tsx`:

```tsx
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
      <h3>Next Week Adjustments</h3>
      <ul>
        {review.nextWeekAdjustments.map((adjustment) => (
          <li key={adjustment}>{adjustment}</li>
        ))}
      </ul>
    </section>
  );
}
```

Create `src/components/BackupPanel.tsx`:

```tsx
import { useState } from "react";
import type { AppState } from "../domain/types";
import { exportAppState, importAppState } from "../storage/localStore";

interface BackupPanelProps {
  state: AppState;
  onImport: (state: AppState) => void;
}

export function BackupPanel({ state, onImport }: BackupPanelProps) {
  const [backupText, setBackupText] = useState("");
  const [message, setMessage] = useState("");

  function handleExport() {
    setBackupText(exportAppState(state));
    setMessage("Backup JSON generated. Store it somewhere private.");
  }

  function handleImport() {
    try {
      onImport(importAppState(backupText));
      setMessage("Backup imported into this browser.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backup import failed");
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Local Backup</p>
        <h2>Export / Import JSON</h2>
      </div>
      <button className="primary-button" type="button" onClick={handleExport}>Export JSON</button>
      <label>
        Import JSON
        <textarea rows={12} value={backupText} onChange={(event) => setBackupText(event.target.value)} />
      </label>
      <button className="secondary-button" type="button" onClick={handleImport}>Import backup</button>
      {message && <p>{message}</p>}
    </section>
  );
}
```

- [ ] **Step 5: Wire final views in App.tsx**

Modify `src/App.tsx` imports:

```tsx
import { ApplicationPackBuilder } from "./components/ApplicationPackBuilder";
import { BackupPanel } from "./components/BackupPanel";
import { OutreachTracker } from "./components/OutreachTracker";
import { WeeklyReview } from "./components/WeeklyReview";
```

Add these functions inside `App`:

```tsx
  function savePack(pack: ApplicationPack) {
    setState((current) => ({
      ...current,
      jobs: current.jobs.map((job) => (job.id === pack.jobId ? { ...job, status: "application_pack_ready" } : job)),
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
```

Update the view rendering branches:

```tsx
        {view === "pack" && selectedJob && (
          <ApplicationPackBuilder
            candidate={state.candidate}
            job={selectedJob}
            pack={state.packs.find((pack) => pack.jobId === selectedJob.id)}
            onSavePack={savePack}
          />
        )}
        {view === "outreach" && <OutreachTracker contacts={state.contacts} activities={state.activities} onAddActivity={addActivity} />}
        {view === "review" && <WeeklyReview jobs={state.jobs} activities={state.activities} />}
        {view === "backup" && <BackupPanel state={state} onImport={setState} />}
```

Also add `ApplicationActivity` and `ApplicationPack` to the type import from `src/domain/types.ts`.

- [ ] **Step 6: Add final UI styles**

Append to `src/styles.css`:

```css
.pack-grid {
  display: grid;
  gap: 16px;
  margin-top: 18px;
}

.pack-grid section {
  border-top: 1px solid #e2e7df;
  padding-top: 14px;
}

.secondary-button {
  min-height: 38px;
  width: fit-content;
  border: 1px solid #1f6b5f;
  border-radius: 8px;
  padding: 8px 12px;
  background: #ffffff;
  color: #1f6b5f;
  cursor: pointer;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.metric-grid span {
  border: 1px solid #d9ddd2;
  border-radius: 8px;
  padding: 12px;
  background: #fbfcf8;
  font-weight: 800;
}

@media (max-width: 760px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 7: Run all tests and build**

Run:

```bash
npm test
npm run build
```

Expected:

```text
PASS src/domain/scoring.test.ts
PASS src/domain/applicationPack.test.ts
PASS src/domain/weeklyReview.test.ts
PASS src/storage/localStore.test.ts
PASS src/App.test.tsx
```

Expected build output includes:

```text
✓ built
```

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/styles.css src/components/ApplicationPackBuilder.tsx src/components/OutreachTracker.tsx src/components/WeeklyReview.tsx src/components/BackupPanel.tsx
git commit -m "feat: complete local MVP workflow"
```

---

### Task 8: Add Usage Guide, Compliance Copy, And Final Verification

**Files:**
- Create: `README.md`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: completed MVP.
- Produces: documented local run instructions and visible compliance boundary copy inside the app.

- [ ] **Step 1: Add README**

Create `README.md`:

```markdown
# Web3 Remote Job Copilot V1 MVP

Local-first job search cockpit for Mia's Web3 remote transition sprint.

## What V1 Does

- Stores Mia's Candidate Asset Layer in the browser.
- Lets Mia manually paste job URLs and JD text.
- Scores roles with an explainable Fit & Risk Score.
- Generates human-reviewed Application Packs.
- Tracks manual outreach and follow-up activities.
- Produces Weekly Review guidance for the 30/60 day sprint.
- Exports and imports local JSON backups.

## What V1 Does Not Do

- It does not log into LinkedIn or Indeed.
- It does not scrape logged-in pages.
- It does not send DMs, connection requests, follow-ups, or applications.
- It does not auto-apply.
- It does not store third-party account passwords.
- It does not position Mia as a Solidity or smart contract engineer.

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verification

```bash
npm test
npm run build
```

Both commands must pass before using the build as the current working version.
```

- [ ] **Step 2: Add visible compliance copy to Today view**

In `src/App.tsx`, replace the Today view section with:

```tsx
        {view === "today" && (
          <section className="panel">
            <p className="eyebrow-dark">Today Command Center</p>
            <h2>Start with the highest-ROI job action</h2>
            <p>Open Job Inbox, review a role, generate an application pack, then record manual outreach.</p>
            <div className="compliance-note">
              <strong>Human review boundary:</strong> This MVP never logs into LinkedIn or Indeed, never sends DMs, and never submits applications. It only prepares materials for Mia to review and use manually.
            </div>
          </section>
        )}
```

- [ ] **Step 3: Style compliance copy**

Append to `src/styles.css`:

```css
.compliance-note {
  border-left: 4px solid #1f6b5f;
  border-radius: 8px;
  margin-top: 16px;
  padding: 12px 14px;
  background: #edf7f3;
  color: #153b3f;
}
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected:

```text
PASS src/domain/scoring.test.ts
PASS src/domain/applicationPack.test.ts
PASS src/domain/weeklyReview.test.ts
PASS src/storage/localStore.test.ts
PASS src/App.test.tsx
```

Expected build output includes:

```text
✓ built
```

- [ ] **Step 5: Start local dev server for manual QA**

Run:

```bash
npm run dev
```

Expected output includes:

```text
Local:   http://127.0.0.1:5173/
```

Manual QA checklist:

- Open Today and confirm the compliance note is visible.
- Open Assets and edit a proof point.
- Open Job Inbox and add a pasted JD job.
- Confirm Fit & Risk Score appears for the selected job.
- Open Application Pack and generate a pack.
- Confirm recruiter DM contains manual-review language.
- Open Outreach and record a manual DM.
- Open Weekly Review and confirm metrics update.
- Open Backup and export JSON.

- [ ] **Step 6: Stop local dev server**

Stop the `npm run dev` process with `Ctrl+C`.

- [ ] **Step 7: Commit**

```bash
git add README.md src/App.tsx src/styles.css
git commit -m "docs: add local MVP usage and compliance guide"
```

---

## Final Verification

After all tasks are complete, run:

```bash
git status --short
npm test
npm run build
```

Expected test output includes:

```text
PASS src/domain/scoring.test.ts
PASS src/domain/applicationPack.test.ts
PASS src/domain/weeklyReview.test.ts
PASS src/storage/localStore.test.ts
PASS src/App.test.tsx
```

Expected build output includes:

```text
✓ built
```

`git status --short` may still show pre-existing untracked directories such as `OpenClaw/`, `PortfolioPages/`, `portfolio/`, `skills/`, and `vcpkg/`. Those are outside this MVP implementation and must not be staged by this plan.

## Self-Review

- Spec coverage: The plan implements Candidate Asset Layer, Today Command Center, Job Inbox, Fit & Risk Score, Application Pack Builder, Outreach Tracker, Weekly Review, manual import, human review, JSON backup, and local-first persistence.
- Scope control: The plan excludes multi-user accounts, payment, backend auth, browser plugins, LinkedIn automation, Indeed automation, auto-apply, and logged-in scraping.
- TDD coverage: Domain scoring, pack generation, weekly review, persistence, and the core UI workflow all have failing-test-first steps.
- Type consistency: `AppState`, `Job`, `CandidateAsset`, `ApplicationPack`, `OutreachContact`, and `ApplicationActivity` are defined in Task 2 and reused by later tasks.
- Execution readiness: Each task ends with focused verification and a commit.
