import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import {
  buildDailyBriefingEmailConfig,
  renderDailyBriefingEmailText,
  resolveDailyBriefingMarkdownPath,
  sendDailyBriefingEmail,
} from "./dailyBriefingEmail";

describe("daily briefing email", () => {
  it("builds Gmail SMTP config from a single app-password secret and defaults Mia's mailboxes", () => {
    const config = buildDailyBriefingEmailConfig({
      BRIEFING_SMTP_PASS: "app-password",
    });

    expect(config).toEqual({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      user: "yaow1211@gmail.com",
      pass: "app-password",
      from: "yaow1211@gmail.com",
      to: "627822708@qq.com",
      appUrl: "https://web3-remote-job-copilot.vercel.app/",
    });
  });

  it("fails fast when SMTP credentials are missing", () => {
    expect(() => buildDailyBriefingEmailConfig({})).toThrow(
      "Missing required email configuration: BRIEFING_SMTP_PASS",
    );
  });

  it("renders the email body with the app link at the very beginning", () => {
    const text = renderDailyBriefingEmailText({
      appUrl: "https://web3-remote-job-copilot.vercel.app/",
      markdown: "# Web3 Remote Job Briefing - 2026-06-29",
    });

    expect(text).toBe(
      "https://web3-remote-job-copilot.vercel.app/\n\nWeb3 Remote Job Copilot\n\n# Web3 Remote Job Briefing - 2026-06-29",
    );
  });

  it("resolves the markdown path for the requested date", async () => {
    const outputDir = join(tmpdir(), `web3-email-test-${Date.now()}`);
    await mkdir(outputDir, { recursive: true });

    try {
      await writeFile(join(outputDir, "2026-06-29.md"), "# briefing", "utf8");
      await writeFile(join(outputDir, "2026-06-29.json"), "{}", "utf8");

      await expect(resolveDailyBriefingMarkdownPath({ outputDir, date: "2026-06-29" })).resolves.toBe(
        join(outputDir, "2026-06-29.md"),
      );
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("sends the markdown briefing through the provided SMTP transport", async () => {
    const outputDir = join(tmpdir(), `web3-email-send-test-${Date.now()}`);
    await mkdir(outputDir, { recursive: true });

    try {
      const markdownPath = join(outputDir, "2026-06-29.md");
      await writeFile(markdownPath, "# Web3 Remote Job Briefing - 2026-06-29", "utf8");
      const sendMail = vi.fn().mockResolvedValue({ messageId: "message-1" });
      const createTransport = vi.fn(() => ({ sendMail }));

      await sendDailyBriefingEmail({
        markdownPath,
        date: "2026-06-29",
        config: {
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          user: "yaow1211@gmail.com",
          pass: "app-password",
          from: "yaow1211@gmail.com",
          to: "627822708@qq.com",
          appUrl: "https://web3-remote-job-copilot.vercel.app/",
        },
        createTransport,
      });

      expect(createTransport).toHaveBeenCalledWith({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "yaow1211@gmail.com",
          pass: "app-password",
        },
      });
      expect(sendMail).toHaveBeenCalledWith({
        from: "yaow1211@gmail.com",
        to: "627822708@qq.com",
        subject: "Web3 Remote Job Briefing - 2026-06-29",
        text: "https://web3-remote-job-copilot.vercel.app/\n\nWeb3 Remote Job Copilot\n\n# Web3 Remote Job Briefing - 2026-06-29",
      });
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});
