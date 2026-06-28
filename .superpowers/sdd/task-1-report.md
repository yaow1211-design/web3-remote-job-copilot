# Task 1 Report: Discovery Domain

## Implemented

I implemented the Web3 Remote Job Copilot V1.1 discovery domain in:

- `/Users/wangmia/Documents/New project/src/domain/jobDiscovery.ts`
- `/Users/wangmia/Documents/New project/src/domain/jobDiscovery.test.ts`
- `/Users/wangmia/Documents/New project/src/domain/types.ts`

What changed:

- Added `DiscoveredJob` to the shared domain types.
- Added pure discovery helpers:
  - `normalizeRemoteOkJobs(rawItems: unknown[], now?: Date): DiscoveredJob[]`
  - `inferRoleFamilyFromText(text: string): RoleFamily`
  - `toJobFromDiscoveredJob(discoveredJob: DiscoveredJob, now?: Date): Job`
  - `dedupeDiscoveredJobs(discoveredJobs: DiscoveredJob[], existingJobs: Job[]): DiscoveredJob[]`
- Built Remote OK normalization with:
  - HTML stripping from descriptions
  - deterministic hash IDs from `source + originalUrl + title + company`
  - remote/web3 relevance filtering
  - required/preferred skill extraction
  - crypto requirement inference
  - `Job` conversion with `status: "new"` and `remoteType: "remote"`

## TDD Evidence

Red step:

- Ran `npm test -- src/domain/jobDiscovery.test.ts`
- Result: failed as expected because `./jobDiscovery` did not exist yet

Green steps:

- Implemented the module after the failing test
- Re-ran `npm test -- src/domain/jobDiscovery.test.ts`
- Result: passed

Regression verification:

- Ran `npm test -- src/domain/scoring.test.ts src/domain/applicationPack.test.ts src/domain/weeklyReview.test.ts src/domain/jobDiscovery.test.ts`
- Result: all 4 test files passed, 30 tests passed total

## Files Changed

- `/Users/wangmia/Documents/New project/src/domain/types.ts`
- `/Users/wangmia/Documents/New project/src/domain/jobDiscovery.ts`
- `/Users/wangmia/Documents/New project/src/domain/jobDiscovery.test.ts`

## Self-Review Findings

- I first used a prefixed discovery ID, then removed the prefix so the ID is the raw deterministic hash required by the brief.
- I tightened the relevance filter so clearly onsite rows do not slip through just because the source is Remote OK.
- I normalized title/company comparisons for dedupe so same-job matches are more reliable.

## Concerns

- The discovery heuristics are intentionally tuned to the Remote OK-style payload shape described in the brief. If later discovery sources use different field names or require broader normalization rules, this module will need source-specific expansion.

## Review Fix Addendum

Fixed the two review findings in `src/domain/jobDiscovery.ts`:

- Source now contributes to remote relevance, so Remote OK rows can stay relevant even when title/description/location do not spell out "remote".
- Onsite detection is less overbroad by dropping generic `office` and `in person` matches, while still filtering clear onsite language.

Verification:

- `npm test -- src/domain/jobDiscovery.test.ts`
- `npm test -- src/domain/scoring.test.ts src/domain/applicationPack.test.ts src/domain/weeklyReview.test.ts src/domain/jobDiscovery.test.ts`

Both commands passed. The focused discovery suite passed 8/8 tests, and the broader domain run passed 32/32 tests.

## Review Fix Addendum 2

Tightened `isRelevantDiscovery` so source-based remote relevance from `Remote OK` only applies when the row's location is blank or remote-friendly. This keeps relevant blank-location Remote OK rows, but filters a concrete onsite-looking location like `Lisbon, Portugal` unless the row also has explicit remote wording.

Verification:

- `npm test -- src/domain/jobDiscovery.test.ts`
- `npm test -- src/domain/scoring.test.ts src/domain/applicationPack.test.ts src/domain/weeklyReview.test.ts src/domain/jobDiscovery.test.ts`

Both commands passed again after the fix. The focused discovery suite passed 9/9 tests, and the broader domain run passed 33/33 tests.

## Review Fix Addendum 3

Closed the remaining discovery review finding by splitting discovery eligibility into two gates in `src/domain/jobDiscovery.ts`:

- remote-compatible evidence must come from explicit remote/worldwide wording or the bounded Remote OK source inference
- Mia-relevant evidence must come from Web3 terms or target-role terms such as growth, analyst, data, PRD, UAT, research, and due diligence

This prevents a crypto-heavy row with `Lisbon, Portugal` from being normalized just because it contains Web3 wording, while still allowing the blank-location Remote OK source path and the Microsoft Office incidental-wording regression case.

Verification:

- `npm test -- src/domain/jobDiscovery.test.ts`
- `npm test -- src/domain/scoring.test.ts src/domain/applicationPack.test.ts src/domain/weeklyReview.test.ts src/domain/jobDiscovery.test.ts`

Output summary:

- focused discovery suite: 10/10 tests passed
- broader domain suite: 34/34 tests passed
