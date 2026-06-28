# Task 8 Report

## What I implemented

- Added `README.md` with the local-first usage guide, the V1 capability list, the explicit non-goals/compliance boundaries, and the verification commands.
- Updated the Today view in `src/App.tsx` so the top panel now includes the required visible human-review/compliance copy while preserving the follow-up reminders section from Task 7.
- Added `.compliance-note` styling in `src/styles.css` to make the boundary copy visually distinct and readable.

## Verification results

- `npm test` passed: 5 files, 46 tests.
- `npm run build` passed and produced the production bundle.
- The build emitted a Node/Vite environment warning because the workspace is on Node.js 20.11.0 while Vite wants 20.19+ or 22.12+, but the build still completed successfully.

## Fix verification

- Updated `README.md` to require Node.js 20.19+ or 22.12+ before the local development commands and clarified that V1 does not automatically send DMs, connection requests, follow-up messages, or applications.
- Added `engines.node` to `package.json` with a minimum of `>=20.19.0` so the runtime requirement is visible to package-aware tooling.
- `package-lock.json` did not need a metadata-only refresh for this change.
- `npm test` passed in this workspace: 5 files, 46 tests.
- `npm run build` passed in this workspace and emitted the expected Node.js 20.11.0 warning from Vite before completing successfully.

## Dev server / manual QA result

- `npm run dev -- --host 127.0.0.1` did not start successfully in this environment.
- Vite failed before serving the app with `TypeError: crypto.hash is not a function`, which is consistent with the older Node.js runtime in the workspace.
- Because the dev server never reached a local URL, I could not complete browser-based manual QA in this session.
- I did complete lightweight code-level QA to confirm the compliance note is present in the Today view and the follow-up reminders block remains in place.

## Files changed

- `README.md`
- `src/App.tsx`
- `src/styles.css`

## Concerns

- Local dev-server verification is blocked by the workspace Node version, so the requested `npm run dev` URL check could not be completed here.
- `git status --short` still shows pre-existing untracked workspace files and directories outside this task's scope; I did not stage them.
- Commit created: `8a29493` (`docs: add local MVP usage and compliance guide`)

## Fix verification note

- Added the explicit README boundary that V1 does not store LinkedIn or Indeed login state, while leaving the existing Node runtime requirement and non-goals wording in place.
