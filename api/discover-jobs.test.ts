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
  it("returns a normalization error for structurally unhealthy array payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [{ foo: "bar", baz: "qux" }],
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

  it("returns empty success without error when healthy Remote OK data has no Mia matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            id: 1,
            date: "2026-06-28",
          },
          {
            position: "Office Operations Coordinator",
            company: "Example Corp",
            url: "https://remoteok.com/l/example-job",
            description: "On-site role in Lisbon with local coordination and admin support.",
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
      fetchedAt: expect.any(String),
      sources: ["Remote OK"],
    });
    expect(res.body).not.toHaveProperty("error");
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
