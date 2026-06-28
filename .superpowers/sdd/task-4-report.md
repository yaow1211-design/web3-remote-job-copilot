Task 4 Report: Daily Briefing And Local Archive

Implemented
- Added `src/domain/dailyBriefing.ts` with:
  - `shouldGenerateDailyBriefing(now, existingArchives)` using `Intl.DateTimeFormat` with `timeZone: "Asia/Shanghai"`.
  - `createDailyBriefing(discoveredJobs, candidate, existingJobs, now)` that:
    - dedupes against the current Job Inbox using existing discovery helpers,
    - converts discovered jobs with `toJobFromDiscoveredJob`,
    - scores them with `scoreJob`,
    - sorts by descending `score.overallScore`,
    - limits the archive to 10 items,
    - sets `windowLabel` to `Past 24 hours`,
    - uses the first two score reasons as `fitReasons`,
    - uses `score.risks` or `["No hard blocker detected. Human review still required."]`,
    - generates concise company/title-aware summaries.
- Extended `src/domain/types.ts` with `DailyBriefingItem`, `DailyBriefingArchive`, and `AppState.briefings`.
- Extended `src/storage/localStore.ts` so:
  - initial state includes `briefings: []`,
  - legacy persisted state and imports without `briefings` normalize to `[]`,
  - imported/exported state supports validated briefing archives while remaining backward-compatible.
- Updated `src/App.tsx` so Today:
  - auto-generates a briefing only when Today is opened, the Asia/Shanghai local time gate passes, and no current local-day archive exists,
  - fetches discovered jobs with `fetchDiscoveredJobs`,
  - prepends the generated archive to local state,
  - avoids repeat generation with local `briefingStatus`,
  - shows the current archive first and older archives below,
  - renders item link, title/company, summary, score, recommendation, fit reasons, risks, and `Add to Job Inbox`,
  - shows `Daily briefing could not refresh. Manual Fetch in Job Inbox is still available.` on failure.
- Updated `src/styles.css` for the Today briefing archive layout.

TDD Evidence
1. Created `src/domain/dailyBriefing.test.ts` first.
2. Ran `npm test -- src/domain/dailyBriefing.test.ts` and observed RED:
   - failed import for missing `./dailyBriefing` module.
3. Added storage tests in `src/storage/localStore.test.ts` before storage implementation.
4. Added Today-view app tests in `src/App.test.tsx` before wiring the feature.
5. Implemented domain/storage/app code.
6. Re-ran the target suite and got GREEN.

Tests Run And Results
- `npm test -- src/domain/dailyBriefing.test.ts`
  - PASS after implementation.
- `npm test -- src/domain/dailyBriefing.test.ts src/storage/localStore.test.ts`
  - PASS after domain + storage implementation.
- `npm test -- src/App.test.tsx`
  - PASS after fixing Today generation wiring.
- `npm test -- src/domain/dailyBriefing.test.ts src/storage/localStore.test.ts src/App.test.tsx`
  - PASS, 3 files / 45 tests green.

Files Changed
- `src/domain/dailyBriefing.ts`
- `src/domain/dailyBriefing.test.ts`
- `src/domain/types.ts`
- `src/storage/localStore.ts`
- `src/storage/localStore.test.ts`
- `src/App.tsx`
- `src/App.test.tsx`
- `src/styles.css`

Self-Review Findings
- Fixed an integration bug during implementation: the Today auto-generation effect was cancelling its own in-flight request because the effect re-ran when `briefingStatus` changed to `loading`.
- Kept the free local archive rule explicit in both domain logic and app wiring:
  - generation is gated by Asia/Shanghai 08:00+,
  - generation only occurs when Mia opens Today,
  - generation is skipped when a same-local-day archive already exists.
- Kept local-store compatibility intact for older saved state and imports.
- Left unrelated tracked and untracked workspace changes untouched.

Concerns
- App-level time-gating is primarily asserted in the domain tests. The app tests focus on Today wiring/rendering and use module seams for the gating branch to avoid brittle clock-driven UI tests.
- No broader full-project test suite was run beyond the task-specified target tests.

Review Fix Follow-Up
- Fixed the three review findings in the owned Today briefing flow:
  - Replaced the sticky one-shot session behavior with per-day/per-visit request tracking so a failed refresh can retry on a later Today visit and a new local day can generate again.
  - Moved briefing archive creation into the `setState(current => ...)` path so resolved fetches use the latest `current.jobs`, `current.candidate`, and `current.briefings`, with a same-day gate re-check before prepend.
  - Sorted rendered briefing archives by `date` then `generatedAt` descending so `Current archive` points at the newest archive even when backups load in arbitrary order.
- Added focused App tests for:
  - retrying after a failed Today refresh,
  - excluding a job added while briefing fetch is in flight,
  - labeling the newest archive as current when persisted order is older-first.

Verification
- Command: `npm test -- src/domain/dailyBriefing.test.ts src/storage/localStore.test.ts src/App.test.tsx`
- Result: PASS, `3` files and `48` tests green.

Commit
- Created commit with message: `Fix daily briefing review findings`
