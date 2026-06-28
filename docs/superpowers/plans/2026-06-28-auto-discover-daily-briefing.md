# Auto Discover And Daily Briefing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add free V1.1 job discovery so Mia can fetch public Web3 remote jobs, see the best matches, import selected roles into Job Inbox, and receive a local daily Top 10 briefing archive in Today.

**Architecture:** Keep the app local-first and human-reviewed. A Vercel-compatible serverless endpoint at `api/discover-jobs.ts` fetches public sources and returns normalized discovered jobs; the React app scores them locally with existing `scoreJob`, deduplicates against local `jobs`, and stores daily briefing archives in localStorage. If network discovery fails, the UI shows a clear failure state and preserves the manual workflow.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, localStorage, Vercel serverless function, plain CSS, existing scoring/domain modules.

## Global Constraints

- V1.1 remains a single-user Web App for Mia.
- First user is Mia.
- Free local-first version only: no database, no paid queue, no paid hosted storage, no accounts.
- The app may fetch public unauthenticated job sources through `/api/discover-jobs`.
- Do not scrape logged-in pages.
- Do not automate LinkedIn or Indeed.
- Do not submit applications automatically.
- Do not send DMs automatically.
- Human review remains mandatory before importing, applying, messaging, or following up.
- Daily briefing archive is stored in browser localStorage.
- Daily briefing is generated when Mia opens Today after 08:00 Asia/Shanghai and the current local day has no archive yet.
- If Mia does not open the app, the free local version does not generate a background archive.
- Top matches are ranked using existing `scoreJob(job, candidate)`.
- Do not position Mia as a Solidity engineer, smart contract engineer, senior tokenomics expert, Head of Growth, Director, or Principal.
- Do not fabricate full-time Web3 company experience.
- Existing manual job intake, application pack, outreach, backup import/export, and weekly review behavior must keep working.

---

## File Structure

- Create `src/domain/jobDiscovery.ts`: normalized discovered-job types, Remote OK normalizer, role-family inference, skill extraction, dedupe helpers, and conversion to `Job`.
- Create `src/domain/jobDiscovery.test.ts`: tests for normalization, filtering, scoring preparation, and dedupe behavior.
- Create `api/discover-jobs.ts`: Vercel serverless endpoint for public job discovery.
- Create `src/services/jobDiscoveryClient.ts`: front-end fetch wrapper for `/api/discover-jobs`.
- Create `src/components/JobDiscoveryPanel.tsx`: manual Fetch Web3 remote jobs UI, Top matches list, and Add to Job Inbox controls.
- Create `src/domain/dailyBriefing.ts`: daily briefing archive types and pure functions for 08:00 gating, Top 10 selection, and local archive updates.
- Create `src/domain/dailyBriefing.test.ts`: tests for local-day generation and archive behavior.
- Modify `src/domain/types.ts`: add `DiscoveredJob`, `DailyBriefingItem`, and `DailyBriefingArchive` interfaces if the task chooses shared types.
- Modify `src/storage/localStore.ts`: persist `briefings` with backwards-compatible load/import validation.
- Modify `src/storage/localStore.test.ts`: verify old backups load with empty briefings and briefing archives export/import.
- Modify `src/App.tsx`: wire discovery actions into `JobInbox`, wire daily briefing into Today, and preserve existing state behavior.
- Modify `src/components/JobInbox.tsx`: accept candidate and discovery props or render `JobDiscoveryPanel`.
- Modify `src/styles.css`: add compact dashboard/list styles for discovery and briefing panels.
- Modify `src/App.test.tsx`: cover manual discovery import, dedupe, Today briefing generation, and archive persistence.

---

### Task 1: Discovery Domain

**Files:**
- Create: `src/domain/jobDiscovery.ts`
- Create: `src/domain/jobDiscovery.test.ts`
- Modify: `src/domain/types.ts`

**Interfaces:**
- Consumes: existing `Job`, `RoleFamily`, `RemoteType`, `CryptoRequirementLevel` from `src/domain/types.ts`; `formatLocalDate` from `src/domain/date.ts`.
- Produces:
  - `DiscoveredJob` interface with fields: `id`, `title`, `company`, `source`, `originalUrl`, `applyUrl`, `description`, `tags`, `location`, `postedAt`.
  - `normalizeRemoteOkJobs(rawItems: unknown[], now?: Date): DiscoveredJob[]`.
  - `inferRoleFamilyFromText(text: string): RoleFamily`.
  - `toJobFromDiscoveredJob(discoveredJob: DiscoveredJob, now?: Date): Job`.
  - `dedupeDiscoveredJobs(discoveredJobs: DiscoveredJob[], existingJobs: Job[]): DiscoveredJob[]`.

- [ ] **Step 1: Write failing discovery tests**

Create `src/domain/jobDiscovery.test.ts` with tests that assert:
- Remote OK payload rows with `position`, `company`, `url`, `description`, `tags`, `location`, and `date` normalize into one `DiscoveredJob`.
- Rows missing title, company, or URL are ignored.
- Non-remote or clearly onsite descriptions are ignored unless location contains `remote`, `worldwide`, or description/title contains remote.
- Growth/user/campaign text infers `Growth Data Analyst`.
- PRD/UAT/operations text infers `Product / Operations Analyst`.
- research/due diligence/on-chain text infers `Research & Due Diligence Analyst`.
- `toJobFromDiscoveredJob` creates a `Job` with `status: "new"`, `remoteType: "remote"`, source carried through, and no automatic application side effect.
- `dedupeDiscoveredJobs` removes discovered jobs matching existing `originalUrl`, and matching same normalized title + company.

Run: `npm test -- src/domain/jobDiscovery.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement discovery domain**

Create `src/domain/jobDiscovery.ts` with pure functions only. Requirements:
- Do not call `fetch` in this file.
- Strip HTML tags from descriptions.
- Generate deterministic discovered IDs from `source + originalUrl + title + company` using a small local string hash.
- Filter for Web3/crypto/remote relevance using title, description, tags, location, and source.
- Extract required skills from text using existing Mia-relevant terms: `SQL`, `Python`, `analytics`, `campaign`, `growth`, `PRD`, `UAT`, `operations`, `dashboard`.
- Extract preferred skills from Web3 terms: `Web3`, `crypto`, `DeFi`, `blockchain`, `on-chain`, `fintech`.
- Mark `cryptoRequirementLevel` as `preferred` when Web3 terms appear, `required` when the description says crypto/web3 experience is required or mandatory, and `none` otherwise.

- [ ] **Step 3: Run discovery tests**

Run: `npm test -- src/domain/jobDiscovery.test.ts`

Expected: PASS.

- [ ] **Step 4: Run existing domain tests**

Run: `npm test -- src/domain/scoring.test.ts src/domain/applicationPack.test.ts src/domain/weeklyReview.test.ts src/domain/jobDiscovery.test.ts`

Expected: PASS.

---

### Task 2: Discover Jobs API And Client

**Files:**
- Create: `api/discover-jobs.ts`
- Create: `src/services/jobDiscoveryClient.ts`
- Create: `src/services/jobDiscoveryClient.test.ts`
- Modify: `package.json` only if TypeScript build requires Vercel-compatible request/response typing to avoid Node-specific imports.

**Interfaces:**
- Consumes: `normalizeRemoteOkJobs(rawItems: unknown[])`.
- Produces:
  - `fetchDiscoveredJobs(fetcher?: typeof fetch): Promise<DiscoveredJob[]>`.
  - `GET /api/discover-jobs` JSON response: `{ jobs: DiscoveredJob[], fetchedAt: string, sources: string[] }`.
  - Error response: `{ jobs: [], fetchedAt: string, sources: string[], error: string }`.

- [ ] **Step 1: Write failing client tests**

Create `src/services/jobDiscoveryClient.test.ts` with tests that:
- Mock a successful fetch returning `{ jobs: [...] }` and assert `fetchDiscoveredJobs` returns the jobs.
- Mock a non-OK response and assert `fetchDiscoveredJobs` throws `Job discovery failed`.
- Mock malformed JSON and assert `fetchDiscoveredJobs` throws `Job discovery failed`.

Run: `npm test -- src/services/jobDiscoveryClient.test.ts`

Expected: FAIL because the service does not exist.

- [ ] **Step 2: Implement front-end client**

Create `src/services/jobDiscoveryClient.ts`:
- Default endpoint is `/api/discover-jobs`.
- Accept an injectable fetcher for tests.
- Validate that `json.jobs` is an array.
- Throw `new Error("Job discovery failed")` for failed responses or malformed payloads.

- [ ] **Step 3: Implement Vercel API endpoint**

Create `api/discover-jobs.ts`:
- Export a default async handler compatible with Vercel Node serverless functions.
- Fetch `https://remoteok.com/api` with headers:
  - `User-Agent: Mia Web3 Remote Job Copilot (https://miaweb3job.vercel.app)`
  - `Accept: application/json`
- Treat the first Remote OK metadata row as ignorable if it has no job title/company/url.
- Normalize and limit the response to 50 jobs.
- Return `Cache-Control: s-maxage=1800, stale-while-revalidate=3600`.
- On fetch or normalization failure, return HTTP 200 with an empty jobs array and a short `error` string so the app stays usable.

- [ ] **Step 4: Run service tests and build**

Run: `npm test -- src/services/jobDiscoveryClient.test.ts src/domain/jobDiscovery.test.ts`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

---

### Task 3: Job Inbox Auto Discover UI

**Files:**
- Create: `src/components/JobDiscoveryPanel.tsx`
- Modify: `src/components/JobInbox.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `fetchDiscoveredJobs`, `dedupeDiscoveredJobs`, `toJobFromDiscoveredJob`, existing `scoreJob`.
- Produces: Job Inbox can fetch discovered jobs, rank Top matches, open original links, and import selected jobs into local `jobs`.

- [ ] **Step 1: Write failing UI tests**

Modify `src/App.test.tsx` with tests that:
- Mock `global.fetch` for `/api/discover-jobs` to return three discovered jobs.
- Open Job Inbox, click `Fetch Web3 remote jobs`, and expect `Top matches for Mia` to appear.
- Assert jobs are sorted with the highest score first.
- Click `Add to Job Inbox` for the top match and assert the pipeline count increases and the imported job is selected.
- Seed an existing job with the same `originalUrl`, fetch again, and assert duplicate jobs show as already in inbox or are not importable.
- Mock fetch failure and assert the UI shows `Job discovery failed. Manual intake is still available.`

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because the UI does not exist.

- [ ] **Step 2: Implement `JobDiscoveryPanel`**

Create `src/components/JobDiscoveryPanel.tsx`:
- Props: `candidate`, `jobs`, `onAddJob`.
- Internal state: `loading`, `error`, `discoveredJobs`.
- Button label: `Fetch Web3 remote jobs`.
- Ranked results use `scoreJob(toJobFromDiscoveredJob(discoveredJob), candidate)`.
- Display up to 10 top matches.
- Each result displays title, company, source, score, recommendation, original link, short description, and why it fits Mia using `score.reasons.slice(0, 2)`.
- Import button calls `onAddJob(toJobFromDiscoveredJob(discoveredJob))`.
- Disable import for duplicates using `dedupeDiscoveredJobs` or equivalent existing-job check.
- Text must clearly say no applications or DMs are sent automatically.

- [ ] **Step 3: Wire into Job Inbox and App**

Modify `src/components/JobInbox.tsx`:
- Add `candidate` prop.
- Render `JobDiscoveryPanel` above manual intake.
- Keep manual form behavior unchanged.

Modify `src/App.tsx`:
- Pass `state.candidate` into `JobInbox`.
- Keep `addJob` selecting newly added jobs.

- [ ] **Step 4: Add compact styles**

Modify `src/styles.css`:
- Add `.discovery-panel`, `.match-list`, `.match-card`, `.match-meta`, `.link-button`, `.score-pill`, `.error-note`, and `.archive-list` styles.
- Keep card border radius at 8px or less.
- Ensure mobile layout does not overlap text.

- [ ] **Step 5: Run UI tests**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

---

### Task 4: Daily Briefing And Local Archive

**Files:**
- Create: `src/domain/dailyBriefing.ts`
- Create: `src/domain/dailyBriefing.test.ts`
- Modify: `src/domain/types.ts`
- Modify: `src/storage/localStore.ts`
- Modify: `src/storage/localStore.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `DiscoveredJob`, `CandidateAsset`, `Job`, `scoreJob`, `toJobFromDiscoveredJob`, `fetchDiscoveredJobs`.
- Produces:
  - `DailyBriefingItem` with `job`, `score`, `summary`, `fitReasons`, and `risks`.
  - `DailyBriefingArchive` with `id`, `date`, `generatedAt`, `windowLabel`, `items`.
  - `shouldGenerateDailyBriefing(now: Date, existingArchives: DailyBriefingArchive[]): boolean`.
  - `createDailyBriefing(discoveredJobs, candidate, existingJobs, now): DailyBriefingArchive`.
  - Today page shows current briefing and archive list.

- [ ] **Step 1: Write failing domain tests**

Create `src/domain/dailyBriefing.test.ts` with tests that:
- Before 08:00 Asia/Shanghai, `shouldGenerateDailyBriefing` returns false.
- At or after 08:00 Asia/Shanghai, it returns true if no archive exists for the local date.
- It returns false if the current local date already has an archive.
- `createDailyBriefing` returns at most 10 items sorted by descending `score.overallScore`.
- Briefing item summary is concise and includes company/title context.
- Existing jobs are excluded from the briefing by URL/title-company dedupe.

Run: `npm test -- src/domain/dailyBriefing.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 2: Implement daily briefing domain**

Create `src/domain/dailyBriefing.ts`:
- Use `Intl.DateTimeFormat` with `timeZone: "Asia/Shanghai"` to compute local date and hour.
- `windowLabel` must be `Past 24 hours`.
- Fit reasons should use the first two score reasons.
- Risks should use `score.risks`, or `["No hard blocker detected. Human review still required."]` if none.
- Exclude duplicate jobs already in Job Inbox.

- [ ] **Step 3: Extend state persistence**

Modify `src/domain/types.ts`:
- Add `briefings: DailyBriefingArchive[]` to `AppState`.

Modify `src/storage/localStore.ts`:
- Initial state includes `briefings: []`.
- Loading older localStorage/backups without `briefings` defaults to `[]`.
- Export includes briefings.
- Import validates `briefings` when present but keeps backwards compatibility.

Modify `src/storage/localStore.test.ts`:
- Add test for old backup without `briefings`.
- Add test for export/import with one briefing archive.

- [ ] **Step 4: Wire Today auto generation**

Modify `src/App.tsx`:
- Today view checks `shouldGenerateDailyBriefing(new Date(), state.briefings)`.
- If true, call `fetchDiscoveredJobs`, build `createDailyBriefing`, and prepend it to `state.briefings`.
- Avoid repeated calls during the same render with a local `briefingStatus` state.
- Show `Daily Web3 Job Briefing` in Today.
- Show current archive first and older archives below.
- Each item displays link, title/company, summary, score, recommendation, why it fits, risks, and `Add to Job Inbox`.
- If generation fails, show `Daily briefing could not refresh. Manual Fetch in Job Inbox is still available.`
- Do not generate before 08:00 local China time.

- [ ] **Step 5: Run briefing tests**

Run: `npm test -- src/domain/dailyBriefing.test.ts src/storage/localStore.test.ts src/App.test.tsx`

Expected: PASS.

---

### Task 5: Final Verification And Deploy Readiness

**Files:**
- Modify only if verification reveals defects in files touched by Tasks 1-4.

**Interfaces:**
- Consumes: all features from prior tasks.
- Produces: tested local build ready to deploy to Vercel.

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: PASS with all test files.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Verify no accidental secrets or paid-service config**

Run: `git diff --stat`

Expected: only app/source/test/docs files related to discovery and briefing changed.

- [ ] **Step 4: Manual browser smoke test**

Run local preview or dev server. Verify:
- Job Inbox shows `Fetch Web3 remote jobs`.
- Clicking it either returns Top matches or a clear failure if network/API is unavailable.
- Importing a discovered job adds it to Pipeline and selects it.
- Today shows Daily Web3 Job Briefing after 08:00 Asia/Shanghai if no archive exists.
- Backup export includes `briefings`.

- [ ] **Step 5: Final report**

Report:
- What changed.
- Tests run.
- Whether API network verification succeeded locally.
- Any limitation: free local archive only generates when Mia opens the app.

---

## Self-Review

- Spec coverage: covered public source discovery, Job Inbox import, Top matches, Today daily Top 10 briefing, fit reasons, score display, local archive, free/local limitation, and human-review boundary.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: `DiscoveredJob`, `DailyBriefingArchive`, `toJobFromDiscoveredJob`, `dedupeDiscoveredJobs`, `fetchDiscoveredJobs`, and `scoreJob` relationships are consistent across tasks.
