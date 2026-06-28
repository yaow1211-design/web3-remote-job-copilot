# Daily Briefing GitHub Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a free GitHub Actions daily archive job that generates Markdown and JSON Web3 remote job briefings.

**Architecture:** Keep the app local-first and token-free. A TypeScript script fetches public discovered jobs, reuses existing domain scoring and daily briefing functions, writes archive files, and a GitHub Actions workflow commits those files when generated.

**Tech Stack:** React, TypeScript, Vite, Vitest, GitHub Actions, Node 24, `tsx`, local filesystem archive files.

## Global Constraints

- Do not add OpenAI API usage.
- Do not add a database.
- Do not send email or Feishu messages in this version.
- Do not overwrite an existing daily archive.
- Use Asia/Shanghai local date for archive filenames.
- Keep output under `data/daily-briefings/`.

---

### Task 1: Daily Briefing Archive Module

**Files:**
- Create: `scripts/dailyBriefingArchive.ts`
- Test: `scripts/dailyBriefingArchive.test.ts`

**Interfaces:**
- Consumes: `createDailyBriefing(discoveredJobs, candidate, existingJobs, now)` from `src/domain/dailyBriefing.ts`.
- Produces:
  - `getShanghaiDateKey(now: Date): string`
  - `renderDailyBriefingMarkdown(input): string`
  - `writeDailyBriefingArchive(input): Promise<{ written: boolean; markdownPath: string; jsonPath: string }>`

- [ ] **Step 1: Write failing tests for Markdown/JSON archive behavior.**
- [ ] **Step 2: Run `npm test -- scripts/dailyBriefingArchive.test.ts` and verify missing module failures.**
- [ ] **Step 3: Implement the archive module.**
- [ ] **Step 4: Re-run `npm test -- scripts/dailyBriefingArchive.test.ts` and verify pass.**

### Task 2: CLI Generator

**Files:**
- Create: `scripts/generate-daily-briefing.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: archive module from Task 1.
- Produces npm script `generate:daily-briefing`.

- [ ] **Step 1: Add a failing test that the package script exists and targets `tsx scripts/generate-daily-briefing.ts`.**
- [ ] **Step 2: Run the targeted test and verify failure.**
- [ ] **Step 3: Add `tsx` dev dependency and package script.**
- [ ] **Step 4: Implement CLI argument/env handling.**
- [ ] **Step 5: Run targeted tests and a local dry run.**

### Task 3: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/daily-briefing.yml`
- Create: `data/daily-briefings/.gitkeep`
- Test: `src/deployment/dailyBriefingWorkflow.test.ts`

**Interfaces:**
- Consumes npm script `generate:daily-briefing`.
- Produces scheduled and manual workflow.

- [ ] **Step 1: Add a failing test for workflow schedule, permissions, Node setup, script invocation, and conditional commit.**
- [ ] **Step 2: Run the targeted workflow test and verify failure.**
- [ ] **Step 3: Add the workflow and `.gitkeep`.**
- [ ] **Step 4: Re-run workflow test.**

### Task 4: Verification

**Files:**
- No new files.

**Interfaces:**
- Consumes all previous tasks.
- Produces verified build/test state.

- [ ] **Step 1: Run `npm test`.**
- [ ] **Step 2: Run `npm run build`.**
- [ ] **Step 3: Run a local archive generation against the production API or a mock endpoint if network is unavailable.**

