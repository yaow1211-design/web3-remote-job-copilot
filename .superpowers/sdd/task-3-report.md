# Task 3 Report: Explainable Fit & Risk Score

## What I implemented
- Added `src/domain/scoring.ts` with `scoreJob(job, candidate)` returning a `FitRiskScore`.
- Implemented explainable scoring inputs for:
  - `roleFit`
  - `transferableFinanceFit`
  - `growthDataFit`
  - `productOpsFit`
  - `web3Barrier`
  - `remoteCompatibility`
  - `languageFit`
  - `portfolioProofStrength`
  - `outreachOpportunity`
- Added recommendation logic for `Strong Apply`, `DM First`, `Apply with Custom Pack`, `Portfolio Needed`, and `Skip`.
- Added hard-blocker detection for Solidity / smart contract-heavy roles and explicit risk text.
- Added `src/domain/scoring.test.ts` with the three brief-specified scenarios:
  - strong growth analytics fit
  - Solidity engineering skip
  - outreach-first DM path

## Test commands and exact results
### RED
Command:
```bash
npm test -- src/domain/scoring.test.ts
```
Result:
- Failed as expected because `src/domain/scoring.ts` did not exist yet.
- Key error:
  - `Error: Failed to resolve import "./scoring" from "src/domain/scoring.test.ts". Does the file exist?`
  - Exit code: `1`

### GREEN
Command:
```bash
npm test -- src/domain/scoring.test.ts
```
Result:
- Passed.
- Output summary:
  - `✓ src/domain/scoring.test.ts (3 tests)`
  - `Test Files 1 passed (1)`
  - `Tests 3 passed (3)`

### BROADER VERIFICATION
Command:
```bash
npm test
```
Result:
- Passed.
- Output summary:
  - `✓ src/storage/localStore.test.ts (4 tests)`
  - `✓ src/domain/scoring.test.ts (3 tests)`
  - `✓ src/App.test.tsx (1 test)`
  - `Test Files 3 passed (3)`
  - `Tests 8 passed (8)`

Command:
```bash
npm run build
```
Result:
- Passed.
- Build completed successfully.
- Environment warning observed:
  - `You are using Node.js 20.11.0. Vite requires Node.js version 20.19+ or 22.12+. Please upgrade your Node.js version.`

## Files changed
- `src/domain/scoring.ts`
- `src/domain/scoring.test.ts`
- `.superpowers/sdd/task-3-report.md`

## Self-review findings
- The scorer is explainable and deterministic rather than opaque.
- The recommendation ordering correctly allows `DM First` to override a high raw score when outreach opportunity is strong and the Web3 barrier is only medium.
- Hard-blocked Solidity / smart contract roles are consistently marked `Skip` with an explicit risk reason.
- The behavior matches the three required scenarios in the task brief.

## Any concerns
- The scoring model is heuristic and term-based, so it may need threshold tuning as more role families or job sources are added.
- Vite still emits the Node version warning during build, but the build completes successfully and I did not change tooling versions.

---

# Task 3 Review Fix Report

## What I fixed
- Split blocker detection so `director` and `principal` only count as hard blockers when they appear in the role title or seniority text, not when they are incidental company or JD mentions.
- Kept Solidity, smart contract, and blockchain hard blockers broad across the full role text.
- Restored language risk handling so restrictive non-English language requirements, including native Japanese, lower `languageFit` below 60 and add the language risk.

## Verification
- `npm test -- src/domain/scoring.test.ts`
- `npm test`
- `npm run build`

## Result
- All requested tests passed.
- The build completed successfully, with the same existing Node version warning from Vite.

## Verification output

### `npm test -- src/domain/scoring.test.ts`
```text
> web3-remote-job-copilot@0.1.0 test
> vitest run src/domain/scoring.test.ts

 RUN  v3.2.6 /Users/wangmia/Documents/New project

 ✓ src/domain/scoring.test.ts (5 tests) 3ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  01:26:50
   Duration  370ms (transform 23ms, setup 25ms, collect 17ms, tests 3ms, environment 131ms, prepare 23ms)
```

### `npm test`
```text
> web3-remote-job-copilot@0.1.0 test
> vitest run

 RUN  v3.2.6 /Users/wangmia/Documents/New project

 ✓ src/domain/scoring.test.ts (5 tests) 2ms
 ✓ src/storage/localStore.test.ts (4 tests) 2ms
 ✓ src/App.test.tsx (1 test) 45ms

 Test Files  3 passed (3)
      Tests  10 passed (10)
   Start at  01:26:56
   Duration  535ms (transform 53ms, setup 89ms, collect 138ms, tests 49ms, environment 516ms, prepare 89ms)
```

### `npm run build`
```text
> web3-remote-job-copilot@0.1.0 build
> tsc -b && vite build

You are using Node.js 20.11.0. Vite requires Node.js version 20.19+ or 22.12+. Please upgrade your Node.js version.
vite v7.3.6 building client environment for production...
transforming...
✓ 1579 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.41 kB │ gzip:  0.28 kB
dist/assets/index-6cxVOiDA.css    1.27 kB │ gzip:  0.68 kB
dist/assets/index-D0TAAJDq.js   196.61 kB │ gzip: 62.10 kB
✓ built in 667ms
```

---

# Task 3 Re-Review Fix Report 2

## What I fixed
- Kept explicit crypto company-experience language available when the JD actually says it.
- Changed the generic hard-blocker fallback to the broader `Crypto/Web3 domain depth is a hard requirement for this role.` wording when the JD only signals deep domain knowledge.
- Removed the unused `job` parameter from `hasTechnicalHardBlocker`.
- Added a regression test for a DeFi/domain-depth hard blocker that should skip without claiming company experience.

## Verification
- `npm test -- src/domain/scoring.test.ts`
- `npm test`
- `npm run build`

## Exact output summaries
### `npm test -- src/domain/scoring.test.ts`
```text
> web3-remote-job-copilot@0.1.0 test
> vitest run src/domain/scoring.test.ts

 RUN  v3.2.6 /Users/wangmia/Documents/New project

 ✓ src/domain/scoring.test.ts (7 tests) 3ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  01:36:23
   Duration  907ms (transform 47ms, setup 44ms, collect 34ms, tests 3ms, environment 380ms, prepare 54ms)
```

### `npm test`
```text
> web3-remote-job-copilot@0.1.0 test
> vitest run

 RUN  v3.2.6 /Users/wangmia/Documents/New project

 ✓ src/domain/scoring.test.ts (7 tests) 3ms
 ✓ src/storage/localStore.test.ts (4 tests) 3ms
 ✓ src/App.test.tsx (1 test) 51ms

 Test Files  3 passed (3)
      Tests  12 passed (12)
   Start at  01:36:23
   Duration  1.04s (transform 96ms, setup 140ms, collect 213ms, tests 56ms, environment 1.13s, prepare 178ms)
```

### `npm run build`
```text
> web3-remote-job-copilot@0.1.0 build
> tsc -b && vite build

You are using Node.js 20.11.0. Vite requires Node.js version 20.19+ or 22.12+. Please upgrade your Node.js version.
vite v7.3.6 building client environment for production...
transforming...
✓ 1579 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.41 kB │ gzip:  0.28 kB
dist/assets/index-6cxVOiDA.css    1.27 kB │ gzip:  0.68 kB
dist/assets/index-D0TAAJDq.js   196.61 kB │ gzip: 62.10 kB
✓ built in 671ms
```

---

# Task 3 Re-Review Fix Report

## What I fixed
- Split `hard_blocker` explanations into source-accurate blocker classes.
- Technical blockers now explain Solidity, smart contract, or blockchain engineering requirements.
- Seniority blockers now explain Head, Director, or Principal title/seniority requirements.
- Generic crypto hard blockers now say `Crypto/Web3 company experience is a hard requirement for this role.`
- Added a regression test for a non-Solidity, non-seniority hard blocker that requires prior crypto company experience.

## Verification
- `npm test -- src/domain/scoring.test.ts`
- `npm test`
- `npm run build`

## Exact output summaries
### `npm test -- src/domain/scoring.test.ts`
```text
> web3-remote-job-copilot@0.1.0 test
> vitest run src/domain/scoring.test.ts

 RUN  v3.2.6 /Users/wangmia/Documents/New project

 ✓ src/domain/scoring.test.ts (6 tests) 2ms

 Test Files  1 passed (1)
 Tests  6 passed (6)
 Start at  01:32:03
 Duration  533ms (transform 29ms, setup 36ms, collect 18ms, tests 2ms, environment 270ms, prepare 28ms)
```

### `npm test`
```text
> web3-remote-job-copilot@0.1.0 test
> vitest run

 RUN  v3.2.6 /Users/wangmia/Documents/New project

 ✓ src/storage/localStore.test.ts (4 tests) 2ms
 ✓ src/domain/scoring.test.ts (6 tests) 3ms
 ✓ src/App.test.tsx (1 test) 60ms

 Test Files  3 passed (3)
 Tests  11 passed (11)
 Start at  01:32:08
 Duration  655ms (transform 70ms, setup 93ms, collect 166ms, tests 66ms, environment 634ms, prepare 133ms)
```

### `npm run build`
```text
> web3-remote-job-copilot@0.1.0 build
> tsc -b && vite build

You are using Node.js 20.11.0. Vite requires Node.js version 20.19+ or 22.12+. Please upgrade your Node.js version.
vite v7.3.6 building client environment for production...
transforming...
✓ 1579 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.41 kB │ gzip:  0.28 kB
dist/assets/index-6cxVOiDA.css    1.27 kB │ gzip:  0.68 kB
dist/assets/index-D0TAAJDq.js   196.61 kB │ gzip: 62.10 kB
✓ built in 667ms
```
