# Task 2 Report

## What I implemented

- Added `src/services/jobDiscoveryClient.ts` with `fetchDiscoveredJobs(fetcher?: typeof fetch)`.
- Added `api/discover-jobs.ts` as a Vercel-style serverless handler for `GET /api/discover-jobs`.
- Added `src/services/jobDiscoveryClient.test.ts` to cover the client success and failure paths.

## TDD evidence

### RED

Command:

```bash
npm test -- src/services/jobDiscoveryClient.test.ts
```

Result:

```text
FAIL src/services/jobDiscoveryClient.test.ts [ src/services/jobDiscoveryClient.test.ts ]
Error: Failed to resolve import "./jobDiscoveryClient" from "src/services/jobDiscoveryClient.test.ts". Does the file exist?
```

### GREEN

Command:

```bash
npm test -- src/services/jobDiscoveryClient.test.ts
```

Result:

```text
✓ src/services/jobDiscoveryClient.test.ts (3 tests) 2ms
```

## Test results

Command:

```bash
npm test -- src/services/jobDiscoveryClient.test.ts src/domain/jobDiscovery.test.ts
```

Result:

```text
✓ src/services/jobDiscoveryClient.test.ts (3 tests) 2ms
✓ src/domain/jobDiscovery.test.ts (22 tests) 6ms
Tests  25 passed (25)
```

Command:

```bash
npm test
```

Result:

```text
✓ src/services/jobDiscoveryClient.test.ts (3 tests)
✓ src/domain/weeklyReview.test.ts (5 tests)
✓ src/domain/jobDiscovery.test.ts (22 tests)
✓ src/storage/localStore.test.ts (6 tests)
✓ src/domain/applicationPack.test.ts (3 tests)
✓ src/domain/scoring.test.ts (16 tests)
✓ src/App.test.tsx (24 tests)
Tests  79 passed (79)
```

Command:

```bash
npm run build
```

Result:

```text
You are using Node.js 20.11.0. Vite requires Node.js version 20.19+ or 22.12+.
✓ built in 738ms
```

## Files changed

- `api/discover-jobs.ts`
- `src/services/jobDiscoveryClient.ts`
- `src/services/jobDiscoveryClient.test.ts`
- `.superpowers/sdd/task-2-report.md`

## Self-review findings

- The client is intentionally strict: anything other than `response.ok === true` or a payload with an array at `jobs` collapses to `Job discovery failed`.
- The API handler preserves usability by returning HTTP 200 with an empty job list and short error text whenever fetch or normalization work fails.
- The handler strips the usual Remote OK metadata row when it does not carry job-like fields, which keeps the normalizer focused on real postings.

## Concerns

- The API handler is covered by build-time typing and the client tests, but it does not yet have a dedicated endpoint test file.
- The repo still emits the existing Vite Node version warning during `npm run build` because the local runtime is `20.11.0`, below Vite's preferred minimum.

## Review follow-up

### Fixes applied

- Added a regression test for candidate-looking Remote OK rows that normalize to zero jobs, and changed the API to return `{ jobs: [], error: "Job discovery source could not be normalized" }` in that case.
- Replaced raw upstream exception text in the API error path with the stable short string `Job discovery failed`.

### Verification

Command:

```bash
npm test -- api/discover-jobs.test.ts
```

Result:

```text
✓ api/discover-jobs.test.ts (2 tests) 3ms
```

Command:

```bash
npm test -- src/services/jobDiscoveryClient.test.ts src/domain/jobDiscovery.test.ts api/discover-jobs.test.ts
```

Result:

```text
✓ src/services/jobDiscoveryClient.test.ts (3 tests) 3ms
✓ api/discover-jobs.test.ts (2 tests) 4ms
✓ src/domain/jobDiscovery.test.ts (22 tests) 6ms
Tests  27 passed (27)
```

Command:

```bash
npm run build
```

Result:

```text
✓ built in 734ms
```

## Review follow-up

### Fixes applied

- Tightened `api/discover-jobs.ts` so Remote OK payloads are only treated as structurally healthy when the array is non-empty and either the first row looks like a metadata/header row or a later row has recognizable job keys.
- Changed the handler so structurally healthy payloads with zero Mia matches return `{ jobs: [] }` without an `error`.
- Kept malformed or non-array upstream payloads on the stable `Job discovery failed` path, while structurally unhealthy arrays now return `Job discovery source could not be normalized`.
- Added a real `response.json()` rejection test to `src/services/jobDiscoveryClient.test.ts`.

### Verification

Command:

```bash
npm test -- src/services/jobDiscoveryClient.test.ts src/domain/jobDiscovery.test.ts api/discover-jobs.test.ts
```

Result:

```text
✓ src/services/jobDiscoveryClient.test.ts (4 tests) 3ms
✓ api/discover-jobs.test.ts (3 tests) 3ms
✓ src/domain/jobDiscovery.test.ts (22 tests) 6ms
Tests  29 passed (29)
```

Command:

```bash
npm run build
```

Result:

```text
Vite warned about Node.js 20.11.0 being below its preferred minimum of 20.19+.
✓ built in 736ms
```

## Review follow-up

### Fixes applied

- Relaxed the Remote OK structural health check so any recognizable job row now counts as healthy, even when the payload starts directly with a real job row and has no metadata/header row.
- Kept empty arrays on the success path as `{ jobs: [] }`.
- Added a regression test for a single real Remote OK job row with no metadata row to prove the handler still normalizes and returns the job.

### Verification

Command:

```bash
npm test -- api/discover-jobs.test.ts src/services/jobDiscoveryClient.test.ts src/domain/jobDiscovery.test.ts
```

Result:

```text
✓ src/services/jobDiscoveryClient.test.ts (4 tests) 3ms
✓ api/discover-jobs.test.ts (4 tests) 4ms
✓ src/domain/jobDiscovery.test.ts (22 tests) 7ms
Tests  30 passed (30)
```

Command:

```bash
npm run build
```

Result:

```text
Vite warned about Node.js 20.11.0 being below its preferred minimum of 20.19+.
✓ built in 706ms
```
