import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./discover-jobs";

type MockResponse = {
  headers: Record<string, string>;
  statusCode?: number;
  body?: unknown;
  status(code: number): MockResponse;
  setHeader(name: string, value: string): MockResponse;
  json(body: unknown): void;
};

function createMockResponse(): MockResponse {
  return {
    headers: {},
    statusCode: undefined,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    json(body: unknown) {
      this.body = body;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("discover-jobs handler", () => {
  it("returns an error when candidate-looking rows normalize to zero jobs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            title: "Growth Data Analyst",
            company: "Example Web3",
            url: "https://remoteok.com/l/example-job",
            description: "Office role in Lisbon with SQL dashboards.",
            location: "Lisbon, Portugal",
            date: "2026-06-28",
          },
        ],
      })) as typeof fetch,
    );

    const res = createMockResponse();

    await handler({}, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      jobs: [],
      error: "Job discovery source could not be normalized",
    });
  });

  it("returns a stable short error string when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("upstream exploded");
      }) as typeof fetch,
    );

    const res = createMockResponse();

    await handler({}, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      jobs: [],
      error: "Job discovery failed",
    });
    expect(JSON.stringify(res.body)).not.toContain("upstream exploded");
  });
});
