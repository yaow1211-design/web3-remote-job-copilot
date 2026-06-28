import { describe, expect, it } from "vitest";
import { formatLocalDate } from "./date";
import {
  dedupeDiscoveredJobs,
  inferRoleFamilyFromText,
  normalizeRemoteOkJobs,
  toJobFromDiscoveredJob,
} from "./jobDiscovery";
import type { Job } from "./types";

describe("normalizeRemoteOkJobs", () => {
  it("normalizes a Remote OK payload row into one discovered job", () => {
    const rawItems: unknown[] = [
      {
        position: "Growth Data Analyst",
        company: "Example Web3",
        url: "https://remoteok.com/l/example-job",
        description: "<p>Remote role for SQL, campaign analysis, and crypto dashboards.</p>",
        tags: ["SQL", "Campaign", "Web3"],
        location: "Worldwide",
        date: "2026-06-28",
      },
    ];

    const results = normalizeRemoteOkJobs(rawItems, new Date("2026-06-28T10:00:00Z"));

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "Growth Data Analyst",
      company: "Example Web3",
      source: "Remote OK",
      originalUrl: "https://remoteok.com/l/example-job",
      applyUrl: "https://remoteok.com/l/example-job",
      description: "Remote role for SQL, campaign analysis, and crypto dashboards.",
      tags: ["SQL", "Campaign", "Web3"],
      location: "Worldwide",
      postedAt: "2026-06-28",
    });
    expect(results[0]?.id).toMatch(/^[a-f0-9]{8,}$/);
  });

  it("ignores rows missing a title, company, or url", () => {
    const rawItems: unknown[] = [
      { company: "Example Web3", url: "https://remoteok.com/l/example-job", description: "Remote role", date: "2026-06-28" },
      { position: "Growth Data Analyst", url: "https://remoteok.com/l/example-job", description: "Remote role", date: "2026-06-28" },
      { position: "Growth Data Analyst", company: "Example Web3", description: "Remote role", date: "2026-06-28" },
    ];

    expect(normalizeRemoteOkJobs(rawItems)).toEqual([]);
  });

  it("keeps remote-adjacent jobs and ignores clearly onsite ones", () => {
    const rawItems: unknown[] = [
      {
        position: "Growth Data Analyst",
        company: "Remote First Co",
        url: "https://remoteok.com/l/remote-job",
        description: "Onsite role in Lisbon with weekly office attendance.",
        tags: ["SQL"],
        location: "Lisbon, Portugal",
        date: "2026-06-28",
      },
      {
        position: "Remote Growth Data Analyst",
        company: "Remote Title Co",
        url: "https://remoteok.com/l/remote-title",
        description: "Onsite role in Lisbon with weekly office attendance.",
        tags: ["SQL"],
        location: "Lisbon, Portugal",
        date: "2026-06-28",
      },
      {
        position: "Growth Data Analyst",
        company: "Worldwide Co",
        url: "https://remoteok.com/l/worldwide",
        description: "Onsite role in Lisbon with weekly office attendance.",
        tags: ["SQL"],
        location: "Worldwide",
        date: "2026-06-28",
      },
      {
        position: "Growth Data Analyst",
        company: "Remote Description Co",
        url: "https://remoteok.com/l/remote-description",
        description: "Remote role with flexible schedule and strong SQL ownership.",
        tags: ["SQL"],
        location: "Lisbon, Portugal",
        date: "2026-06-28",
      },
    ];

    const results = normalizeRemoteOkJobs(rawItems);

    expect(results.map((job) => job.company)).toEqual(["Remote Title Co", "Worldwide Co", "Remote Description Co"]);
  });

  it("keeps a Remote OK source row when location is blank and the text is relevant even without explicit remote wording", () => {
    const rawItems: unknown[] = [
      {
        position: "Growth Data Analyst",
        company: "Remote OK Source Co",
        url: "https://remoteok.com/l/source-driven-job",
        source: "Remote OK",
        description: "Growth analytics role for SQL dashboards and user campaigns.",
        tags: ["SQL", "Growth"],
        location: "",
        date: "2026-06-28",
      },
    ];

    const results = normalizeRemoteOkJobs(rawItems);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      company: "Remote OK Source Co",
      source: "Remote OK",
      location: "",
    });
  });

  it("filters a Remote OK row with a concrete location when it has no remote wording", () => {
    const rawItems: unknown[] = [
      {
        position: "Growth Data Analyst",
        company: "Remote OK Lisbon Co",
        url: "https://remoteok.com/l/lisbon-job",
        source: "Remote OK",
        description: "Growth analytics role for SQL dashboards and user campaigns.",
        tags: ["SQL", "Growth"],
        location: "Lisbon, Portugal",
        date: "2026-06-28",
      },
    ];

    expect(normalizeRemoteOkJobs(rawItems)).toEqual([]);
  });

  it("filters a crypto-heavy Remote OK row with a concrete location when it has no remote wording", () => {
    const rawItems: unknown[] = [
      {
        position: "Web3 Growth Analyst",
        company: "Remote OK Lisbon Web3 Co",
        url: "https://remoteok.com/l/lisbon-web3-job",
        source: "Remote OK",
        description: "Web3 and crypto growth role for on-chain analytics and token research.",
        tags: ["Web3", "Crypto", "Analytics"],
        location: "Lisbon, Portugal",
        date: "2026-06-28",
      },
    ];

    expect(normalizeRemoteOkJobs(rawItems)).toEqual([]);
  });

  it("does not treat Microsoft Office as an onsite signal", () => {
    const rawItems: unknown[] = [
      {
        position: "Growth Data Analyst",
        company: "Public Source Co",
        url: "https://remoteok.com/l/public-source-job",
        source: "Remote OK",
        description: "Remote web3 growth analytics role using Microsoft Office, SQL dashboards, and user campaigns.",
        tags: ["SQL", "Growth", "Web3"],
        location: "Lisbon, Portugal",
        date: "2026-06-28",
      },
    ];

    const results = normalizeRemoteOkJobs(rawItems);

    expect(results).toHaveLength(1);
    expect(results[0]?.description).toContain("Microsoft Office");
  });
});

describe("inferRoleFamilyFromText", () => {
  it("infers the right role family from common discovery text", () => {
    expect(inferRoleFamilyFromText("growth, user, campaign analytics")).toBe("Growth Data Analyst");
    expect(inferRoleFamilyFromText("PRD, UAT, operations, dashboard management")).toBe("Product / Operations Analyst");
    expect(inferRoleFamilyFromText("research, due diligence, on-chain analysis")).toBe("Research & Due Diligence Analyst");
  });
});

describe("toJobFromDiscoveredJob", () => {
  it("maps a discovered job into a new remote job with no auto-apply side effects", () => {
    const discovered = normalizeRemoteOkJobs([
      {
        position: "Growth Data Analyst",
        company: "Example Web3",
        url: "https://remoteok.com/l/example-job",
        description: "<p>Remote role for SQL, campaign analysis, and crypto dashboards.</p>",
        tags: ["SQL", "Campaign", "Web3"],
        location: "Worldwide",
        date: "2026-06-28",
      },
    ])[0];

    expect(discovered).toBeDefined();
    const job = toJobFromDiscoveredJob(discovered!, new Date("2026-06-28T10:00:00Z"));

    expect(job).toMatchObject({
      id: discovered!.id,
      title: "Growth Data Analyst",
      company: "Example Web3",
      source: "Remote OK",
      originalUrl: "https://remoteok.com/l/example-job",
      applyUrl: "https://remoteok.com/l/example-job",
      jdText: "Remote role for SQL, campaign analysis, and crypto dashboards.",
      remoteType: "remote",
      locationConstraints: "Worldwide",
      roleFamily: "Growth Data Analyst",
      requiredSkills: expect.arrayContaining(["SQL", "campaign", "dashboard"]),
      preferredSkills: expect.arrayContaining(["Web3", "crypto"]),
      status: "new",
      notes: "",
      postedAt: formatLocalDate(new Date("2026-06-28T10:00:00Z")),
    });
  });
});

describe("dedupeDiscoveredJobs", () => {
  it("removes discovered jobs that match existing urls or normalized title and company", () => {
    const discoveredJobs = normalizeRemoteOkJobs([
      {
        position: "Growth Data Analyst",
        company: "Example Web3",
        url: "https://remoteok.com/l/example-job",
        description: "Remote role for SQL and campaigns.",
        tags: ["SQL"],
        location: "Worldwide",
        date: "2026-06-28",
      },
      {
        position: "Product Analyst",
        company: "Signal Labs",
        url: "https://remoteok.com/l/product-job",
        description: "Remote role for PRD and UAT work.",
        tags: ["PRD"],
        location: "Worldwide",
        date: "2026-06-28",
      },
      {
        position: "Research Analyst",
        company: "Onchain Research",
        url: "https://remoteok.com/l/research-job",
        description: "Remote due diligence role.",
        tags: ["Research"],
        location: "Worldwide",
        date: "2026-06-28",
      },
    ]);

    const existingJobs: Job[] = [
      {
        id: "existing-url",
        title: "Other Title",
        company: "Other Co",
        source: "Remote OK",
        originalUrl: "https://remoteok.com/l/product-job",
        applyUrl: "https://remoteok.com/l/product-job",
        jdText: "",
        remoteType: "remote",
        locationConstraints: "",
        roleFamily: "Product / Operations Analyst",
        seniority: "",
        requiredSkills: [],
        preferredSkills: [],
        cryptoRequirementLevel: "none",
        salaryRange: "",
        postedAt: "2026-06-28",
        status: "new",
        notes: "",
      },
      {
        id: "existing-title-company",
        title: "Research Analyst",
        company: "Onchain Research",
        source: "Manual URL",
        originalUrl: "https://example.com/other-url",
        applyUrl: "https://example.com/other-url",
        jdText: "",
        remoteType: "remote",
        locationConstraints: "",
        roleFamily: "Research & Due Diligence Analyst",
        seniority: "",
        requiredSkills: [],
        preferredSkills: [],
        cryptoRequirementLevel: "none",
        salaryRange: "",
        postedAt: "2026-06-28",
        status: "new",
        notes: "",
      },
    ];

    const results = dedupeDiscoveredJobs(discoveredJobs, existingJobs);

    expect(results.map((job) => job.originalUrl)).toEqual(["https://remoteok.com/l/example-job"]);
  });
});
