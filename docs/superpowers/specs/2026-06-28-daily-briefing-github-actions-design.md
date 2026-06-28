# Daily Briefing GitHub Actions Archive Design

## Goal

Generate a daily Web3 remote job briefing without OpenAI tokens, databases, or manual app visits, then archive the result as files in the GitHub repository.

## Scope

V1.2 adds a free GitHub Actions workflow that runs at 08:05 Asia/Shanghai, fetches discovered jobs, reuses the existing local scoring and briefing logic, and writes one Markdown file plus one JSON file per local day under `data/daily-briefings/`.

## Architecture

- A Node script fetches discovered jobs from the production `/api/discover-jobs` endpoint by default.
- The script imports existing TypeScript domain logic through `tsx`, then calls `createDailyBriefing`.
- The output layer renders a human-readable Markdown briefing and a machine-readable JSON archive.
- A GitHub Actions workflow installs dependencies, runs the script, and commits generated files only when new files are created.

## Data Flow

1. GitHub Actions starts from cron `5 0 * * *` or manual `workflow_dispatch`.
2. The script resolves the Asia/Shanghai local date from `new Date()`.
3. If both `data/daily-briefings/YYYY-MM-DD.md` and `.json` already exist, the script exits without overwriting.
4. If files do not exist, the script fetches discovered jobs.
5. The script creates a `DailyBriefingArchive` using `seedCandidate`, no existing jobs, and the current timestamp.
6. The script writes Markdown and JSON archive files.
7. The workflow commits and pushes only when generated files changed.

## Outputs

- `data/daily-briefings/YYYY-MM-DD.md`
- `data/daily-briefings/YYYY-MM-DD.json`

The Markdown file includes title, generated time, window, sources, Top 10 jobs, score, recommendation, link, fit reasons, and risks.

## Error Handling

- If fetching jobs fails, the script exits non-zero and does not create partial files.
- If today's archive already exists, the script exits zero with a clear "already exists" message.
- If no jobs qualify, the script still writes a valid briefing with an empty item list.

## Non-Goals

- No OpenAI API usage.
- No email push.
- No Feishu push.
- No database or cloud storage.
- No automatic application submission or third-party account automation.

