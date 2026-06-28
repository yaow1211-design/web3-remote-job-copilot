import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("daily briefing GitHub Actions workflow", () => {
  it("runs the daily briefing generator every day at 08:05 Asia/Shanghai and commits generated files", () => {
    const workflow = readFileSync(".github/workflows/daily-briefing.yml", "utf8");

    expect(workflow).toContain("cron: \"5 0 * * *\"");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("contents: write");
    expect(workflow).toContain("actions/setup-node");
    expect(workflow).toContain("node-version: 24");
    expect(workflow).toContain("npm ci");
    expect(workflow).toContain("npm run generate:daily-briefing");
    expect(workflow).toContain("data/daily-briefings/");
    expect(workflow).toContain("git commit -m \"chore: add daily briefing archive\"");
    expect(workflow).toContain("BRIEFING_SMTP_HOST: ${{ secrets.BRIEFING_SMTP_HOST }}");
    expect(workflow).toContain("BRIEFING_SMTP_PORT: ${{ secrets.BRIEFING_SMTP_PORT }}");
    expect(workflow).toContain("BRIEFING_SMTP_USER: ${{ secrets.BRIEFING_SMTP_USER }}");
    expect(workflow).toContain("BRIEFING_SMTP_PASS: ${{ secrets.BRIEFING_SMTP_PASS }}");
    expect(workflow).toContain("BRIEFING_EMAIL_FROM: ${{ secrets.BRIEFING_EMAIL_FROM }}");
    expect(workflow).toContain("BRIEFING_EMAIL_TO: 627822708@qq.com");
    expect(workflow).toContain("BRIEFING_APP_URL: https://web3-remote-job-copilot.vercel.app/");
    expect(workflow).toContain("npm run send:daily-briefing");
  });
});
