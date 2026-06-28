# Task 3 Report: Job Inbox Auto Discover UI

## What I implemented

I implemented the Job Inbox auto-discovery UI inside the allowed files and wired it into the existing app flow.

### UI behavior added

- Added a new `JobDiscoveryPanel` component at `src/components/JobDiscoveryPanel.tsx`.
- Added a `Fetch Web3 remote jobs` action that calls `fetchDiscoveredJobs` from `src/services/jobDiscoveryClient.ts`.
- Ranked discovered jobs with:
  - `toJobFromDiscoveredJob(discoveredJob)`
  - `scoreJob(...)`
- Displayed up to 10 top matches sorted by highest `overallScore` first.
- Each result now shows:
  - title
  - company
  - source
  - score
  - recommendation
  - original link
  - short description
  - why it fits Mia using `score.reasons.slice(0, 2)`
- Added import behavior so `Add to Job Inbox` imports a discovered job into the local job list.
- Kept the existing `App.addJob` behavior so the imported job becomes selected immediately.
- Added duplicate protection against jobs already in the inbox by using `dedupeDiscoveredJobs(...)` to determine importable entries.
- Duplicate discovered jobs remain visible in ranked results but show a disabled `Already in inbox` button.
- Added the required failure message:
  - `Job discovery failed. Manual intake is still available.`
- Added explicit copy stating no applications or DMs are sent automatically.

### Wiring changes

- `src/components/JobInbox.tsx`
  - Added `candidate` prop
  - Rendered `JobDiscoveryPanel` above the manual intake UI
  - Left manual intake behavior unchanged
- `src/App.tsx`
  - Passed `state.candidate` into `JobInbox`
  - Preserved the current `addJob` behavior so a newly added job is selected

### Styling added

Updated `src/styles.css` with compact styles for:

- `.discovery-panel`
- `.match-list`
- `.match-card`
- `.match-meta`
- `.link-button`
- `.score-pill`
- `.error-note`
- `.archive-list`

Also added responsive adjustments so the new layout collapses cleanly on smaller widths without text overlap.

## TDD evidence

I followed the required red-green flow.

### Red

First, I added failing UI tests to `src/App.test.tsx` for:

- fetching discovered jobs
- showing `Top matches for Mia`
- sorting by highest score first
- importing the top match into the inbox
- selecting the imported job
- marking duplicates as already in inbox / non-importable
- showing the discovery failure message

Then I ran:

```bash
npm test -- src/App.test.tsx
```

Observed result:

- test file failed
- 3 new tests failed
- failure was expected because the fetch/discovery UI did not exist yet
- representative failure: missing `Fetch Web3 remote jobs` button

### Green

After implementing the panel and wiring, I ran:

```bash
npm test -- src/App.test.tsx
```

Observed result:

- `1 passed`
- `27 passed`
- `0 failed`

## Tests run and results

### Focused verification

Command:

```bash
npm test -- src/App.test.tsx
```

Result:

- PASS
- `27` tests passed
- `0` failed

## Files changed

- `src/components/JobDiscoveryPanel.tsx` (new)
- `src/components/JobInbox.tsx`
- `src/App.tsx`
- `src/App.test.tsx`
- `src/styles.css`
- `.superpowers/sdd/task-3-report.md`

## Self-review findings

- Verified that ranking uses the required helpers and existing scoring path instead of custom logic.
- Verified that imported jobs still go through the existing `addJob` path, which keeps selection behavior centralized in `App.tsx`.
- Verified that duplicate jobs are visible but not importable, satisfying the brief without hiding potentially useful context.
- Verified the failure message matches the required text exactly.
- Verified the manual intake form behavior remains unchanged.

No blocking issues found during self-review.

## Concerns

- I ran the focused UI test suite required by the brief, not the entire repository test suite.
- The worktree already contains unrelated modified and untracked files outside this task; I did not touch or revert them.

## Commit status

I will attempt to create a scoped commit containing only the task files and this report.
