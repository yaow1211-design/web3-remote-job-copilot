# Mia Web3 Remote Application Command Center Design

## Summary

This design updates the existing Web3 Remote Job Copilot PRD from a broad production SaaS concept into a V1 single-user web app for Mia's 30-day remote job search sprint and 60-day conversion window. The product remains a complete web app, but V1 is intentionally scoped to serve Mia first: find suitable remote roles, evaluate fit and risk, generate consistent application materials, manage outreach, track follow-ups, and run weekly positioning reviews.

The product strategy is aggressive but realistic:

- First priority: remote roles at Web3, crypto, or blockchain companies.
- Second priority: Web3-adjacent remote roles in fintech, AI data, global SaaS, growth analytics, and product operations.
- Third priority: non-Web3 remote roles that build international remote work experience and support a later Web3 transition.

V1 is not an auto-apply bot. It is an application command center that helps Mia make better daily decisions and complete higher-quality applications faster while preserving human review and platform compliance.

## Product Positioning

The V1 product is **Mia Web3 Remote Application Command Center**.

It is a single-user job search cockpit, not a general-purpose SaaS product yet. Its success is measured by job search outcomes, not by raw job ingestion volume. The core workflow is:

```text
Job Intake -> Fit & Risk Score -> Application Pack -> Outreach -> Pipeline Tracking -> Weekly Review
```

The product should reinforce four principles:

- Increase application quality rather than enable mass applications.
- Focus on roles where Mia's finance, growth analytics, data product, and Web3 project signals can transfer.
- Convert Mia's existing LinkedIn, portfolio, resume, and outreach materials into a reusable asset layer.
- Keep every external action human-reviewed, especially applications and direct messages.

V1 does not include multi-user accounts, payments, team administration, browser plugins, automatic LinkedIn or Indeed automation, or automatic application submission.

## Core Pages

V1 should include six core pages that match Mia's daily workflow.

### Today Command Center

The home page shows today's action queue rather than a marketing dashboard. It should answer:

- Which jobs should be reviewed today?
- Which jobs are strong apply candidates?
- Which jobs need a portfolio angle?
- Which jobs need recruiter or hiring manager outreach first?
- Which follow-ups are due?

Daily targets should be visible:

- Review 20 jobs.
- Shortlist 8 jobs.
- Apply to 4 jobs.
- Send 8 outreach messages.
- Follow up 5 previous contacts.

### Job Inbox

The job inbox stores candidate roles from manual URL import, copy-pasted job descriptions, and later public API imports. V1 should prioritize clean structure over high-volume scraping.

Each job should capture:

- title
- company
- source
- original URL
- apply URL
- job description text
- remote type
- location constraints
- role family
- seniority
- required and preferred skills
- crypto requirement level
- salary range
- posted date
- status

Key filters:

- Web3 remote
- Web3-adjacent remote
- Growth Data, Product Analyst, Business Analyst, Operations Analyst, Research and Due Diligence
- APAC, worldwide, Taiwan-compatible, or China-compatible remote work
- no hard full-time crypto company experience requirement

### Job Detail And Fit Review

Each job detail page should explain the recommendation, not just show a score. It should answer:

- Why this role fits Mia.
- Why this role is risky.
- Which resume angle to use.
- Which portfolio proof to mention.
- Whether to apply now, DM first, strengthen portfolio proof, or skip.

The score should be broken down into:

- role fit
- transferable finance fit
- growth and data fit
- product and operations fit
- Web3 barrier
- remote compatibility
- language fit
- portfolio proof strength
- outreach opportunity

### Application Pack Builder

The application pack builder is the core V1 conversion feature. For each shortlisted job it creates:

- selected resume version
- role angle
- tailored summary
- cover note or short application note
- recruiter DM
- hiring manager DM
- portfolio highlight
- interview talking points
- risk handling note

Role angles are limited to four V1 templates:

- Growth Data Analyst
- Business Analyst
- Product / Operations Analyst
- Research & Due Diligence Analyst

Generated content must stay consistent with Mia's LinkedIn headline, About section, experience, Featured section, GitHub Pages portfolio, and resume. The system must not reposition Mia as a Solidity engineer, senior tokenomics expert, or full-time Web3 company alum.

### Outreach And Follow-Up

The outreach page tracks contact activity. It does not automatically scrape contacts or send messages.

Contact fields:

- name
- company
- role
- channel
- profile URL
- relationship type
- message status
- follow-up date
- reply status

Relationship types:

- recruiter
- hiring manager
- team member
- founder
- warm intro
- community contact

Message statuses:

- not contacted
- DM drafted
- DM sent
- follow-up due
- replied
- call booked
- rejected
- no response

### Weekly Review

The weekly review page is used to change strategy, not decorate progress. It should answer:

- Which role family produced the best reply rate?
- Which keywords or positioning angles produced interviews?
- Which role types were consistently rejected?
- Should LinkedIn headline, About, Featured, portfolio ordering, resume angle, or DM templates change?
- Should next week's target mix shift toward Web3, Web3-adjacent, fintech, AI data, or global SaaS remote roles?

Core weekly metrics:

- jobs reviewed
- jobs shortlisted
- applications submitted
- outreach sent
- replies received
- interviews booked
- rejection reasons
- best-performing role family
- worst-performing role family
- next-week adjustments

## Data Model

V1 should use seven core objects.

### CandidateAsset

CandidateAsset stores Mia's reusable job search facts and positioning. All scoring and generated materials should reference this layer.

Fields:

- target positioning
- LinkedIn headline
- LinkedIn About
- LinkedIn experience highlights
- portfolio URL
- portfolio projects
- resume versions
- Featured items
- skill keywords
- proof points
- risk disclaimers

Initial proof points:

- traditional finance background
- customer lifecycle analytics
- campaign conversion up to 42%
- data product, PRD, UAT, and dashboard experience
- AI chatbot feasibility and compliance experience
- green finance and asset management exposure
- SQL, Python, and data analysis internships
- GitHub Pages portfolio
- independent Web3 / DeFi project angle

Risk disclaimers:

- no full-time Web3 company experience yet
- not applying as a Solidity engineer
- not positioning as a senior tokenomics expert

### Job

Job stores structured role information from manual input or supported public sources.

Fields:

- title
- company
- source
- original URL
- apply URL
- JD text
- remote type
- location constraints
- role family
- seniority
- required skills
- preferred skills
- crypto requirement level
- salary range
- posted date
- status

Statuses:

- new
- reviewed
- shortlisted
- application pack ready
- applied
- DM sent
- follow-up due
- interview
- rejected
- archived

### FitScore

FitScore is an explainable score, not a black box.

Fields:

- overall score
- role fit
- transferable finance fit
- growth data fit
- product operations fit
- Web3 barrier
- remote compatibility
- language fit
- portfolio proof strength
- outreach opportunity
- recommendation

Allowed recommendations:

- Strong Apply
- Apply with Custom Pack
- DM First
- Portfolio Needed
- Skip

Initial weights:

- role fit: 20%
- transferable finance fit: 20%
- growth data fit: 20%
- product operations fit: 10%
- remote compatibility: 10%
- portfolio proof strength: 10%
- outreach opportunity: 10%
- Web3 barrier: negative penalty up to -30%

Hard reject examples:

- requires 3+ years full-time crypto company experience
- requires Solidity or smart contract engineering as a core skill
- requires incompatible US/EU-only work authorization
- requires native-level language outside English or Chinese
- is clearly above current positioning, such as Head of Growth, Director, or Principal

### ApplicationPack

ApplicationPack stores generated materials for a shortlisted job.

Fields:

- selected resume version
- role angle
- tailored summary
- cover note
- recruiter DM
- hiring manager DM
- portfolio highlight
- interview talking points
- risk handling note

The risk handling note should honestly bridge Mia's transition, for example:

```text
I have not worked full-time inside a Web3 company yet, but I bring finance-grade analytical discipline, customer lifecycle growth experience, and hands-on Web3 project work.
```

### OutreachContact

OutreachContact stores manually entered or user-confirmed contact records.

Fields:

- name
- company
- role
- channel
- profile URL
- relationship type
- message status
- follow-up date
- reply status

### ApplicationActivity

ApplicationActivity records the job search event trail.

Fields:

- job ID
- action type
- channel
- date
- content version
- result
- next action date
- notes

Action types:

- reviewed job
- generated pack
- submitted application
- sent DM
- sent follow-up
- received reply
- booked interview
- rejected

### WeeklyReview

WeeklyReview stores weekly performance and strategy changes.

Fields:

- week
- reviewed count
- shortlisted count
- applied count
- outreach count
- reply count
- interview count
- rejection reasons
- best role family
- worst role family
- next week adjustments

## AI And Automation Boundaries

AI may support:

- JD parsing
- fit and risk explanation
- application pack generation
- DM and follow-up drafting
- weekly review synthesis

AI must not:

- automatically click apply
- automatically submit applications
- automatically send LinkedIn DMs
- fabricate Web3 work experience
- position Mia as a Solidity or smart contract engineer
- hide the fact that Mia has not yet worked full-time at a Web3 company

## Compliance Boundaries

LinkedIn and Indeed are treated as manual or user-assisted sources only:

- Users may paste job URLs, contact URLs, and JD text.
- The app may generate DM copy.
- The app must not automatically scrape logged-in LinkedIn or Indeed pages.
- The app must not automatically send connection requests, DMs, or applications.

ATS and public sources may be integrated when allowed:

- Greenhouse, Lever, Remotive, and similar public APIs or public job pages can feed the job inbox.
- Application submission remains human-reviewed by default.
- V1 may stop at application pack generation and original apply links.

## Priorities

### P0: Required For 30-Day Sprint

- Candidate Asset Layer
- Job Inbox
- Fit & Risk Score
- Application Pack Builder
- Outreach Tracker
- Pipeline Status
- Weekly Review

P0 must support:

- manual job URL or JD import
- JD structuring
- Mia-specific fit and risk scoring
- four role-angle application packs
- LinkedIn, X, and email DM drafts
- application and outreach status tracking
- follow-up reminders
- weekly positioning adjustment suggestions

### P1: Efficiency Improvements

- Greenhouse, Lever, and Remotive imports
- duplicate detection
- expired job detection
- resume PDF version management
- interview question and answer generation
- rejection reason classification

### P2: Future Productization

- multi-user accounts
- subscription billing
- team administration
- browser plugin
- automatic application submission
- LinkedIn automation
- Indeed automation
- template marketplace

## Success Metrics

V1 success is measured by job search activity and outcomes.

30-day targets:

- review 80-120 roles per week
- shortlist 25-40 roles per week
- achieve at least 70% human-confirmed applicability among top recommended jobs
- complete 20-30 high-quality applications per week
- generate an application pack for each submitted application
- use tailored summaries, notes, or DMs for at least 80% of applications
- send 30-50 targeted outreach messages per week
- bind each outreach message to a job, company, or portfolio angle
- complete at least 80% of scheduled follow-ups on time
- receive 3-5 effective replies
- book 1-2 interviews

60-day targets:

- receive 5-8 interview opportunities
- obtain one remote offer, prioritizing Web3 first, then fintech, AI data, or global SaaS remote roles

If there are no effective replies after two weeks, the app should trigger a strategy review that considers:

- changing the target role mix
- reducing pure Web3 weighting and increasing Web3-adjacent remote roles
- rewriting LinkedIn headline, About, Featured, or portfolio ordering
- changing DM templates
- lowering high-barrier job weighting
- increasing warm intro and community outreach

## PRD Refactor Guidance

The existing PRD should be refactored rather than discarded.

Keep:

- source compliance analysis
- Greenhouse, Lever, Remotive, and public job source guidance
- JD parsing fields
- risk keywords
- human-reviewed application principle
- monitoring and review metrics

Rewrite:

- executive summary
- product positioning
- MVP priority table
- scoring model
- semi-automated application section
- roadmap

Add:

- Candidate Asset Layer
- Today Command Center
- Application Pack Builder
- Outreach Tracker
- Mia-specific 30/60-day KPIs
- LinkedIn and portfolio consistency checks

## Assumptions

- V1 is a single-user web app for Mia.
- V1 prioritizes helping Mia land a remote role quickly over general SaaS extensibility.
- Web3 is the long-term transition target, but V1 may recommend Web3-adjacent remote roles when they improve the chance of landing remote work sooner.
- The app can store Mia's job search materials locally or in the product database, but should minimize sensitive data and avoid storing third-party credentials.
- Human review remains mandatory before sending applications, DMs, or follow-ups.
