import { describe, expect, it, vi } from "vitest";
import { fetchDiscoveredJobs } from "./jobDiscoveryClient";

describe("fetchDiscoveredJobs", () => {
  it("returns jobs from a successful discovery response", async () => {
    const fetcher = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          jobs: [
            {
              id: "job-1",
              title: "Growth Data Analyst",
              company: "Example Web3",
              source: "Remote OK",
              originalUrl: "https://remoteok.com/l/example-job",
              applyUrl: "https://remoteok.com/l/example-job",
              description: "Remote role for SQL and growth analytics.",
              tags: ["SQL", "Growth"],
              location: "Worldwide",
              postedAt: "2026-06-28",
            },
          ],
        }),
      } as Response;
    });

    await expect(fetchDiscoveredJobs(fetcher as typeof fetch)).resolves.toEqual([
      {
        id: "job-1",
        title: "Growth Data Analyst",
        company: "Example Web3",
        source: "Remote OK",
        originalUrl: "https://remoteok.com/l/example-job",
        applyUrl: "https://remoteok.com/l/example-job",
        description: "Remote role for SQL and growth analytics.",
        tags: ["SQL", "Growth"],
        location: "Worldwide",
        postedAt: "2026-06-28",
      },
    ]);
  });

  it("throws Job discovery failed when the response is not ok", async () => {
    const fetcher = vi.fn(async () => {
      return {
        ok: false,
        json: async () => ({ jobs: [] }),
      } as Response;
    });

    await expect(fetchDiscoveredJobs(fetcher as typeof fetch)).rejects.toThrow("Job discovery failed");
  });

  it("throws Job discovery failed when the payload is malformed", async () => {
    const fetcher = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ jobz: [] }),
      } as Response;
    });

    await expect(fetchDiscoveredJobs(fetcher as typeof fetch)).rejects.toThrow("Job discovery failed");
  });
});
