# Web3 Remote Job Copilot V1 MVP

Local-first job search cockpit for Mia's Web3 remote transition sprint.

## What V1 Does

- Stores Mia's Candidate Asset Layer in the browser.
- Lets Mia manually paste job URLs and JD text.
- Scores roles with an explainable Fit & Risk Score.
- Generates human-reviewed Application Packs.
- Tracks manual outreach and follow-up activities.
- Produces Weekly Review guidance for the 30/60 day sprint.
- Exports and imports local JSON backups.

## What V1 Does Not Do

- It does not log into LinkedIn or Indeed.
- It does not scrape logged-in pages.
- It does not send DMs, connection requests, follow-ups, or applications.
- It does not auto-apply.
- It does not store third-party account passwords.
- It does not position Mia as a Solidity or smart contract engineer.

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Verification

```bash
npm test
npm run build
```

Both commands must pass before using the build as the current working version.
