# Task 3 Report

## Scope
- Created the generated-docx validator at `tools/prd/validate_prd_docx.py`.
- Verified the generated PRD docx artifact.
- Re-ran the source validator.
- Committed the change on `codex/web3-remote-prd-refactor`.

## Implementation
- The validator reads `artifacts/Web3 Remote Job Copilot 个人求职冲刺版 PRD.docx` with `python-docx`.
- It checks for all required phrases from the brief, verifies the forbidden primary-positioning phrases are absent, and asserts minimum paragraph/table counts.
- One check needed a small regex guard so the required phrase `不自动登录 LinkedIn / Indeed` would not false-positive against the forbidden substring `自动登录 LinkedIn`.

## Verification
- `python3 tools/prd/validate_prd_docx.py` -> `PASS: generated PRD docx validates`
- `python3 tools/prd/validate_prd_source.py` -> `PASS: PRD source validates`

## Commit
- `d1de5b7 test: validate generated Web3 remote PRD`

## Notes
- No remaining concerns after verification.

## Follow-up Fix

### Scope
- Hardened `tools/prd/validate_prd_docx.py` so the generated-docx check now covers the missing policy constraints from review.

### What Changed
- Removed the regex-based special case for `自动登录 LinkedIn` and switched to exact forbidden support phrases instead.
- Added required checks for:
  - mandatory human review before external actions
  - non-auto-apply positioning
  - LinkedIn / Indeed manual or user-assisted handling
  - Web3-adjacent remote role fallback when it improves landing odds
- Added explicit forbidden checks for team administration, browser plugins, and broader LinkedIn / Indeed automation support language.

### Verification
- `/Users/wangmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/prd/validate_prd_docx.py` -> `PASS: generated PRD docx validates`
- `/Users/wangmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/prd/validate_prd_source.py` -> `PASS: PRD source validates`

### Files Changed
- `/Users/wangmia/Documents/New project/tools/prd/validate_prd_docx.py`
- `/Users/wangmia/Documents/New project/.superpowers/sdd/task-3-report.md`

### Self-Review
- The validator now uses explicit support phrases, which avoids the previous false positive on negative compliance statements like `不自动登录 LinkedIn / Indeed`.
- The new required checks match wording already present in the generated PRD/source, so they should stay aligned with the artifact instead of drifting into paraphrase territory.

## Public Source Compliance Follow-up

### What Changed
- Added literal required checks to `tools/prd/validate_prd_docx.py` for the public-source compliance stance:
  - `ATS / public sources：`
  - `优先使用 Greenhouse、Lever、Remotive 等公开 API 或公开职位页。`
  - `V1 可以先不做自动提交，只生成 Application Pack 和原始申请链接。`
- Kept the validator deterministic by using direct substring assertions only.

### Verification
- `/Users/wangmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/prd/validate_prd_docx.py` -> `PASS: generated PRD docx validates`
- `/Users/wangmia/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 tools/prd/validate_prd_source.py` -> `PASS: PRD source validates`

### Files Changed
- `/Users/wangmia/Documents/New project/tools/prd/validate_prd_docx.py`
- `/Users/wangmia/Documents/New project/.superpowers/sdd/task-3-report.md`

### Self-Review
- The new assertions cover the exact public-source wording called out in review and stay aligned with the source artifact.
- No additional concerns after verification.
