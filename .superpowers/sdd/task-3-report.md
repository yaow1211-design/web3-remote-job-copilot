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
