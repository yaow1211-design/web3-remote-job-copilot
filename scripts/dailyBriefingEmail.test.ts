import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import {
  buildDailyBriefingEmailConfig,
  hasDailyBriefingEmailBeenSent,
  renderDailyBriefingEmailHtml,
  renderDailyBriefingEmailText,
  resolveDailyBriefingMarkdownPath,
  resolveDailyBriefingSentMarkerPath,
  sendDailyBriefingEmail,
  sendDailyBriefingEmailOnce,
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

  it("renders the email body with the app link and generated time at the very beginning", () => {
    const text = renderDailyBriefingEmailText({
      appUrl: "https://web3-remote-job-copilot.vercel.app/",
      generatedAtLabel: "2026-06-29 12:54 CST",
      markdown: "# Web3 Remote Job Briefing - 2026-06-29",
    });

    expect(text).toBe(
      "https://web3-remote-job-copilot.vercel.app/\nGenerated: 2026-06-29 12:54 CST\n\nWeb3 Remote Job Copilot\n\n# Web3 Remote Job Briefing - 2026-06-29",
    );
  });

  it("renders markdown headings and links as HTML for email clients", () => {
    const html = renderDailyBriefingEmailHtml({
      appUrl: "https://web3-remote-job-copilot.vercel.app/",
      generatedAtLabel: "2026-06-29 08:23 CST",
      markdown: [
        "# Web3 Remote Job Briefing - 2026-06-29",
        "",
        "## Top 10 Matches",
        "",
        "### 1. Growth Analyst - Web3 Company",
        "",
        "Score: 83",
        "Recommendation: Strong Apply",
        "Link: https://example.com/job",
        "",
        "Why it fits:",
        "- Strong lifecycle analytics overlap.",
      ].join("\n"),
    });

    expect(html).toContain('<a href="https://web3-remote-job-copilot.vercel.app/">https://web3-remote-job-copilot.vercel.app/</a>');
    expect(html).toContain("Generated: 2026-06-29 08:23 CST");
    expect(html).toContain("<h1>Web3 Remote Job Briefing - 2026-06-29</h1>");
    expect(html).toContain("<h2>Top 10 Matches</h2>");
    expect(html).toContain("<h3>1. Growth Analyst - Web3 Company</h3>");
    expect(html).toContain('<a href="https://example.com/job">https://example.com/job</a>');
    expect(html).toContain("<li>Strong lifecycle analytics overlap.</li>");
    expect(html).not.toContain("### 1. Growth Analyst");
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

  it("resolves and detects the sent marker for a daily briefing date", async () => {
    const outputDir = join(tmpdir(), `web3-email-marker-test-${Date.now()}`);
    await mkdir(outputDir, { recursive: true });

    try {
      const markerPath = await resolveDailyBriefingSentMarkerPath({ outputDir, date: "2026-06-29" });
      expect(markerPath).toBe(join(outputDir, "2026-06-29.email-sent.json"));
      await expect(hasDailyBriefingEmailBeenSent({ outputDir, date: "2026-06-29" })).resolves.toBe(false);

      await writeFile(markerPath, JSON.stringify({ date: "2026-06-29" }), "utf8");

      await expect(hasDailyBriefingEmailBeenSent({ outputDir, date: "2026-06-29" })).resolves.toBe(true);
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
        html: expect.stringContaining("<h1>Web3 Remote Job Briefing - 2026-06-29</h1>"),
      });
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it("sends only once per briefing date and writes a marker after a successful send", async () => {
    const outputDir = join(tmpdir(), `web3-email-once-test-${Date.now()}`);
    await mkdir(outputDir, { recursive: true });

    try {
      const markdownPath = join(outputDir, "2026-06-29.md");
      await writeFile(
        markdownPath,
        [
          "# Web3 Remote Job Briefing - 2026-06-29",
          "",
          "Generated at: 2026-06-29T00:23:36.574Z",
        ].join("\n"),
        "utf8",
      );
      const sendMail = vi.fn().mockResolvedValue({ messageId: "message-1" });
      const createTransport = vi.fn(() => ({ sendMail }));

      const firstResult = await sendDailyBriefingEmailOnce({
        outputDir,
        date: "2026-06-29",
        config: {
          host: "smtp.qq.com",
          port: 465,
          secure: true,
          user: "627822708@qq.com",
          pass: "app-password",
          from: "627822708@qq.com",
          to: "627822708@qq.com",
          appUrl: "https://web3-remote-job-copilot.vercel.app/",
        },
        createTransport,
        sentAt: new Date("2026-06-29T00:24:00.000Z"),
      });

      const secondResult = await sendDailyBriefingEmailOnce({
        outputDir,
        date: "2026-06-29",
        config: {
          host: "smtp.qq.com",
          port: 465,
          secure: true,
          user: "627822708@qq.com",
          pass: "app-password",
          from: "627822708@qq.com",
          to: "627822708@qq.com",
          appUrl: "https://web3-remote-job-copilot.vercel.app/",
        },
        createTransport,
        sentAt: new Date("2026-06-29T00:55:00.000Z"),
      });

      expect(firstResult).toEqual({ sent: true, markerPath: join(outputDir, "2026-06-29.email-sent.json") });
      expect(secondResult).toEqual({ sent: false, markerPath: join(outputDir, "2026-06-29.email-sent.json") });
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
        subject: "Web3 Remote Job Briefing - 2026-06-29 (generated 2026-06-29 08:23 CST)",
        text: expect.stringContaining("Generated: 2026-06-29 08:23 CST"),
        html: expect.stringContaining("Generated: 2026-06-29 08:23 CST"),
      }));
      await expect(hasDailyBriefingEmailBeenSent({ outputDir, date: "2026-06-29" })).resolves.toBe(true);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
});
