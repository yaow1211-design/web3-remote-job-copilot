import { getShanghaiDateKey } from "./dailyBriefingArchive";
import {
  buildDailyBriefingEmailConfig,
  sendDailyBriefingEmailOnce,
} from "./dailyBriefingEmail";

const DEFAULT_OUTPUT_DIR = "data/daily-briefings";

function readArgValue(name: string): string | undefined {
  const argIndex = process.argv.indexOf(name);
  if (argIndex === -1) {
    return undefined;
  }

  return process.argv[argIndex + 1];
}

function parseNow(value: string | undefined): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new Error(`Invalid DAILY_BRIEFING_NOW value: ${value}`);
  }

  return parsed;
}

async function main(): Promise<void> {
  const outputDir = process.env.DAILY_BRIEFING_OUTPUT_DIR ?? readArgValue("--output-dir") ?? DEFAULT_OUTPUT_DIR;
  const date = process.env.DAILY_BRIEFING_DATE ?? readArgValue("--date") ?? getShanghaiDateKey(parseNow(process.env.DAILY_BRIEFING_NOW));
  const config = buildDailyBriefingEmailConfig();
  const result = await sendDailyBriefingEmailOnce({
    outputDir,
    date,
    config,
  });

  if (!result.sent) {
    console.log(`Daily briefing email already sent for ${date}: ${result.markerPath}`);
    return;
  }

  console.log(`Daily briefing email sent to ${config.to}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Daily briefing email failed");
  process.exitCode = 1;
});
