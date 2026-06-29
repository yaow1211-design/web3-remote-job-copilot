import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";

const DEFAULT_EMAIL_TO = "627822708@qq.com";
const DEFAULT_APP_URL = "https://web3-remote-job-copilot.vercel.app/";
const DEFAULT_EMAIL_FROM = "yaow1211@gmail.com";
const DEFAULT_SMTP_HOST = "smtp.gmail.com";
const DEFAULT_SMTP_PORT = 465;

export interface DailyBriefingEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
  appUrl: string;
}

export interface RenderDailyBriefingEmailTextInput {
  appUrl: string;
  generatedAtLabel?: string;
  markdown: string;
}

export interface RenderDailyBriefingEmailHtmlInput {
  appUrl: string;
  generatedAtLabel?: string;
  markdown: string;
}

export interface ResolveDailyBriefingMarkdownPathInput {
  outputDir: string;
  date: string;
}

export interface ResolveDailyBriefingSentMarkerPathInput {
  outputDir: string;
  date: string;
}

export interface SendDailyBriefingEmailInput {
  markdownPath: string;
  date: string;
  config: DailyBriefingEmailConfig;
  createTransport?: typeof nodemailer.createTransport;
}

export interface SendDailyBriefingEmailOnceInput {
  outputDir: string;
  date: string;
  config: DailyBriefingEmailConfig;
  createTransport?: typeof nodemailer.createTransport;
  sentAt?: Date;
}

export interface SendDailyBriefingEmailOnceResult {
  sent: boolean;
  markerPath: string;
}

type Env = Record<string, string | undefined>;

const REQUIRED_ENV_KEYS = [
  "BRIEFING_SMTP_PASS",
];

function readRequiredEnv(env: Env, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required email configuration: ${REQUIRED_ENV_KEYS.join(", ")}`);
  }

  return value;
}

export function buildDailyBriefingEmailConfig(env: Env = process.env): DailyBriefingEmailConfig {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !env[key]?.trim());
  if (missingKeys.length > 0) {
    throw new Error(`Missing required email configuration: ${missingKeys.join(", ")}`);
  }

  const port = Number.parseInt(env.BRIEFING_SMTP_PORT?.trim() || `${DEFAULT_SMTP_PORT}`, 10);
  if (Number.isNaN(port)) {
    throw new Error("BRIEFING_SMTP_PORT must be a number");
  }

  const user = env.BRIEFING_SMTP_USER?.trim() || DEFAULT_EMAIL_FROM;

  return {
    host: env.BRIEFING_SMTP_HOST?.trim() || DEFAULT_SMTP_HOST,
    port,
    secure: port === 465,
    user,
    pass: readRequiredEnv(env, "BRIEFING_SMTP_PASS"),
    from: env.BRIEFING_EMAIL_FROM?.trim() || user,
    to: env.BRIEFING_EMAIL_TO?.trim() || DEFAULT_EMAIL_TO,
    appUrl: env.BRIEFING_APP_URL?.trim() || DEFAULT_APP_URL,
  };
}

export function renderDailyBriefingEmailText({
  appUrl,
  generatedAtLabel,
  markdown,
}: RenderDailyBriefingEmailTextInput): string {
  const generatedLine = generatedAtLabel ? `\nGenerated: ${generatedAtLabel}` : "";
  return `${appUrl}${generatedLine}\n\nWeb3 Remote Job Copilot\n\n${markdown}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function linkify(value: string): string {
  return escapeHtml(value).replace(
    /(https:\/\/[^\s<]+)/g,
    '<a href="$1">$1</a>',
  );
}

export function renderDailyBriefingEmailHtml({
  appUrl,
  generatedAtLabel,
  markdown,
}: RenderDailyBriefingEmailHtmlInput): string {
  const body: string[] = [
    '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;line-height:1.55;color:#111827;max-width:760px;">',
    `<p><a href="${escapeHtml(appUrl)}">${escapeHtml(appUrl)}</a></p>`,
  ];

  if (generatedAtLabel) {
    body.push(`<p>Generated: ${escapeHtml(generatedAtLabel)}</p>`);
  }

  body.push("<p><strong>Web3 Remote Job Copilot</strong></p>");
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    body.push(`<ul>${listItems.join("")}</ul>`);
    listItems = [];
  };

  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(`<li>${linkify(trimmed.slice(2))}</li>`);
      continue;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      body.push(`<h3>${linkify(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith("## ")) {
      body.push(`<h2>${linkify(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith("# ")) {
      body.push(`<h1>${linkify(trimmed.slice(2))}</h1>`);
    } else {
      body.push(`<p>${linkify(trimmed)}</p>`);
    }
  }

  flushList();
  body.push("</div>");
  return body.join("\n");
}

export async function resolveDailyBriefingMarkdownPath({
  outputDir,
  date,
}: ResolveDailyBriefingMarkdownPathInput): Promise<string> {
  return join(outputDir, `${date}.md`);
}

export async function resolveDailyBriefingSentMarkerPath({
  outputDir,
  date,
}: ResolveDailyBriefingSentMarkerPathInput): Promise<string> {
  return join(outputDir, `${date}.email-sent.json`);
}

export async function hasDailyBriefingEmailBeenSent({
  outputDir,
  date,
}: ResolveDailyBriefingSentMarkerPathInput): Promise<boolean> {
  const markerPath = await resolveDailyBriefingSentMarkerPath({ outputDir, date });

  try {
    await access(markerPath);
    return true;
  } catch {
    return false;
  }
}

function formatShanghaiDateTimeLabel(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute} CST`;
}

function extractGeneratedAtLabel(markdown: string): string | undefined {
  const match = markdown.match(/^Generated at:\s*(.+)$/m);
  if (!match) {
    return undefined;
  }

  const generatedAt = new Date(match[1].trim());
  if (Number.isNaN(generatedAt.valueOf())) {
    return undefined;
  }

  return formatShanghaiDateTimeLabel(generatedAt);
}

export async function sendDailyBriefingEmail({
  markdownPath,
  date,
  config,
  createTransport = nodemailer.createTransport,
}: SendDailyBriefingEmailInput): Promise<void> {
  const markdown = await readFile(markdownPath, "utf8");
  const generatedAtLabel = extractGeneratedAtLabel(markdown);
  const transport = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  await transport.sendMail({
    from: config.from,
    to: config.to,
    subject: generatedAtLabel
      ? `Web3 Remote Job Briefing - ${date} (generated ${generatedAtLabel})`
      : `Web3 Remote Job Briefing - ${date}`,
    text: renderDailyBriefingEmailText({
      appUrl: config.appUrl,
      generatedAtLabel,
      markdown,
    }),
    html: renderDailyBriefingEmailHtml({
      appUrl: config.appUrl,
      generatedAtLabel,
      markdown,
    }),
  });
}

export async function sendDailyBriefingEmailOnce({
  outputDir,
  date,
  config,
  createTransport = nodemailer.createTransport,
  sentAt = new Date(),
}: SendDailyBriefingEmailOnceInput): Promise<SendDailyBriefingEmailOnceResult> {
  const markerPath = await resolveDailyBriefingSentMarkerPath({ outputDir, date });
  if (await hasDailyBriefingEmailBeenSent({ outputDir, date })) {
    return { sent: false, markerPath };
  }

  const markdownPath = await resolveDailyBriefingMarkdownPath({ outputDir, date });
  await sendDailyBriefingEmail({
    markdownPath,
    date,
    config,
    createTransport,
  });

  await mkdir(outputDir, { recursive: true });
  await writeFile(
    markerPath,
    `${JSON.stringify({
      date,
      sentAt: sentAt.toISOString(),
      to: config.to,
    }, null, 2)}\n`,
    "utf8",
  );

  return { sent: true, markerPath };
}
