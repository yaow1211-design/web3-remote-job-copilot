import { readFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";

const DEFAULT_EMAIL_TO = "627822708@qq.com";
const DEFAULT_APP_URL = "https://web3-remote-job-copilot.vercel.app/";

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
  markdown: string;
}

export interface ResolveDailyBriefingMarkdownPathInput {
  outputDir: string;
  date: string;
}

export interface SendDailyBriefingEmailInput {
  markdownPath: string;
  date: string;
  config: DailyBriefingEmailConfig;
  createTransport?: typeof nodemailer.createTransport;
}

type Env = Record<string, string | undefined>;

const REQUIRED_ENV_KEYS = [
  "BRIEFING_SMTP_HOST",
  "BRIEFING_SMTP_PORT",
  "BRIEFING_SMTP_USER",
  "BRIEFING_SMTP_PASS",
  "BRIEFING_EMAIL_FROM",
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

  const port = Number.parseInt(readRequiredEnv(env, "BRIEFING_SMTP_PORT"), 10);
  if (Number.isNaN(port)) {
    throw new Error("BRIEFING_SMTP_PORT must be a number");
  }

  return {
    host: readRequiredEnv(env, "BRIEFING_SMTP_HOST"),
    port,
    secure: port === 465,
    user: readRequiredEnv(env, "BRIEFING_SMTP_USER"),
    pass: readRequiredEnv(env, "BRIEFING_SMTP_PASS"),
    from: readRequiredEnv(env, "BRIEFING_EMAIL_FROM"),
    to: env.BRIEFING_EMAIL_TO?.trim() || DEFAULT_EMAIL_TO,
    appUrl: env.BRIEFING_APP_URL?.trim() || DEFAULT_APP_URL,
  };
}

export function renderDailyBriefingEmailText({ appUrl, markdown }: RenderDailyBriefingEmailTextInput): string {
  return `${appUrl}\n\nWeb3 Remote Job Copilot\n\n${markdown}`;
}

export async function resolveDailyBriefingMarkdownPath({
  outputDir,
  date,
}: ResolveDailyBriefingMarkdownPathInput): Promise<string> {
  return join(outputDir, `${date}.md`);
}

export async function sendDailyBriefingEmail({
  markdownPath,
  date,
  config,
  createTransport = nodemailer.createTransport,
}: SendDailyBriefingEmailInput): Promise<void> {
  const markdown = await readFile(markdownPath, "utf8");
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
    subject: `Web3 Remote Job Briefing - ${date}`,
    text: renderDailyBriefingEmailText({
      appUrl: config.appUrl,
      markdown,
    }),
  });
}
