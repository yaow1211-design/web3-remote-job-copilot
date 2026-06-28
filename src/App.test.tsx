import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import App from "./App";
import * as dailyBriefingModule from "./domain/dailyBriefing";
import { generateApplicationPack } from "./domain/applicationPack";
import { formatLocalDate } from "./domain/date";
import { toJobFromDiscoveredJob, type DiscoveredJob } from "./domain/jobDiscovery";
import { scoreJob } from "./domain/scoring";
import { seedCandidate } from "./domain/seedCandidate";
import { sampleJobs } from "./sampleData";

const STORAGE_KEY = "web3-remote-job-copilot:v1";
const DISCOVERY_ERROR_MESSAGE = "Job discovery failed. Manual intake is still available.";

const discoveredJobsFixture: DiscoveredJob[] = [
  {
    id: "discover-1",
    title: "Growth Data Analyst, Lifecycle",
    company: "Orbit Wallet",
    source: "Remote OK",
    originalUrl: "https://jobs.example.com/orbit-growth-data",
    applyUrl: "https://jobs.example.com/orbit-growth-data/apply",
    description: "Remote lifecycle analytics role with SQL, campaign analysis, retention, and Web3 product exposure.",
    tags: ["remote", "analytics", "web3"],
    location: "Worldwide",
    postedAt: "2026-06-28",
  },
  {
    id: "discover-2",
    title: "Research Analyst, Protocol Due Diligence",
    company: "Northstar Research",
    source: "Remote OK",
    originalUrl: "https://jobs.example.com/northstar-research",
    applyUrl: "https://jobs.example.com/northstar-research/apply",
    description: "Remote due diligence and protocol research role for crypto markets with screening and risk analysis.",
    tags: ["remote", "research", "crypto"],
    location: "APAC friendly",
    postedAt: "2026-06-27",
  },
  {
    id: "discover-3",
    title: "Product Operations Analyst",
    company: "Atlas Fintech",
    source: "Remote OK",
    originalUrl: "https://jobs.example.com/atlas-product-ops",
    applyUrl: "https://jobs.example.com/atlas-product-ops/apply",
    description: "Remote product operations role with PRD, UAT, stakeholder workflows, dashboards, and SQL.",
    tags: ["remote", "operations", "sql"],
    location: "Remote",
    postedAt: "2026-06-26",
  },
];

function createDeferredPromise<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function renderApp() {
  return render(<App />);
}

async function openNav(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole("button", { name }));
}

function saveState(overrides: Record<string, unknown>) {
  const baseState = {
    version: 1,
    candidate: seedCandidate,
    jobs: sampleJobs,
    packs: [],
    contacts: [
      {
        id: "contact-1",
        jobId: "job-1",
        name: "Hiring Team",
        company: "Example Web3 Wallet",
        role: "Recruiter",
        channel: "LinkedIn",
        profileUrl: "",
        relationshipType: "recruiter",
        messageStatus: "Not contacted",
        followUpDate: "",
        replyStatus: "",
        notes: "Manual contact entry only.",
      },
    ],
    activities: [
      {
        id: "activity-1",
        jobId: "job-2",
        actionType: "reviewed_job",
        channel: "Application Portal",
        date: "2026-06-28",
        contentVersion: "Initial review",
        result: "Shortlisted",
        nextActionDate: "2026-06-29",
        notes: "Generate application pack next.",
      },
    ],
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...baseState, ...overrides }));
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the main command center navigation", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /Mia Web3 Remote Application Command Center/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Job Inbox/i })).toBeInTheDocument();
  });

  it("fetches discovered jobs, ranks top matches, and imports the highest score into the inbox", async () => {
    const user = userEvent.setup();
    const rankedJobs = [...discoveredJobsFixture].sort((left, right) => {
      const leftScore = scoreJob(toJobFromDiscoveredJob(left), seedCandidate).overallScore;
      const rightScore = scoreJob(toJobFromDiscoveredJob(right), seedCandidate).overallScore;
      return rightScore - leftScore;
    });
    const topJob = rankedJobs[0];

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: discoveredJobsFixture }),
    } as Response);

    render(<App />);

    await openNav(user, /Job Inbox/i);
    expect(screen.getByRole("heading", { name: /2 Jobs/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Fetch Web3 remote jobs/i }));

    const resultsRegion = await screen.findByRole("region", { name: /Top matches for Mia/i });
    const matchCards = within(resultsRegion).getAllByRole("article");

    expect(within(matchCards[0]).getByRole("heading", { name: new RegExp(topJob.title, "i") })).toBeInTheDocument();
    expect(within(matchCards[0]).getByText(new RegExp(topJob.company, "i"))).toBeInTheDocument();

    await user.click(within(matchCards[0]).getByRole("button", { name: /Add to Job Inbox/i }));

    expect(screen.getByRole("heading", { name: /3 Jobs/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: new RegExp(`${topJob.title} · ${topJob.company}`, "i") }),
    ).toBeInTheDocument();
  });

  it("marks discovered duplicates as already in inbox", async () => {
    const user = userEvent.setup();
    const duplicateJob = discoveredJobsFixture[0];

    saveState({
      jobs: [
        {
          ...sampleJobs[0],
          id: "job-duplicate",
          title: duplicateJob.title,
          company: duplicateJob.company,
          originalUrl: duplicateJob.originalUrl,
        },
        ...sampleJobs.slice(1),
      ],
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: discoveredJobsFixture }),
    } as Response);

    render(<App />);

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Fetch Web3 remote jobs/i }));

    const resultsRegion = await screen.findByRole("region", { name: /Top matches for Mia/i });
    const duplicateCard = within(resultsRegion).getByRole("article", {
      name: new RegExp(`${duplicateJob.title} ${duplicateJob.company}`, "i"),
    });
    const duplicateButton = within(duplicateCard).getByRole("button", { name: /Already in inbox/i });

    expect(duplicateButton).toBeDisabled();
  });

  it("shows a clear error state when job discovery fails", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ jobs: [] }),
    } as Response);

    render(<App />);

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Fetch Web3 remote jobs/i }));

    expect(await screen.findByText(DISCOVERY_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it("shows a clear error state when job discovery returns ok with an error payload", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [], error: "Job discovery failed" }),
    } as Response);

    render(<App />);

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Fetch Web3 remote jobs/i }));

    expect(await screen.findByText(DISCOVERY_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it("adds a pasted JD job and shows an explainable fit review", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Job Inbox/i }));
    await user.type(screen.getByLabelText(/Job title/i), "Product Operations Analyst");
    await user.type(screen.getByLabelText(/Company/i), "Example DAO Tools");
    await user.type(
      screen.getByLabelText(/JD text/i),
      "Remote role with SQL, PRD, UAT, operations, dashboard requirements, and crypto interest preferred.",
    );
    await user.click(screen.getByRole("button", { name: /Add job/i }));

    expect(screen.getAllByText(/Example DAO Tools/i).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /Product Operations Analyst · Example DAO Tools/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Fit & Risk Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommendation/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Status/i), "shortlisted");
    expect(screen.getByLabelText(/Status/i)).toHaveValue("shortlisted");
    expect(screen.getByText(/Example DAO Tools · shortlisted/i)).toBeInTheDocument();
  });

  it("treats negated crypto requirement language as not required", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Job Inbox/i }));
    await user.type(screen.getByLabelText(/Job title/i), "Product Operations Analyst");
    await user.type(screen.getByLabelText(/Company/i), "Example DAO Tools");
    await user.type(
      screen.getByLabelText(/JD text/i),
      "Remote operations role with SQL. Crypto experience not required.",
    );
    await user.click(screen.getByRole("button", { name: /Add job/i }));

    expect(
      screen.getByRole("heading", { name: /Product Operations Analyst · Example DAO Tools/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Web3 experience is required; use only with strong proof or warm intro\./i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/No hard blocker detected\. Human review still required\./i),
    ).toBeInTheDocument();
  });

  it("keeps URL-only imports on the fallback risk path when semantic text is crypto-free", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Job Inbox/i }));
    await user.type(screen.getByLabelText(/Original URL/i), "https://web3careers.example.com/job/123");
    await user.type(screen.getByLabelText(/Apply URL/i), "https://example.com/apply/123");
    await user.click(screen.getByRole("button", { name: /Add job/i }));

    expect(
      screen.getByRole("heading", { name: /Imported role from URL · Company to verify/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No hard blocker detected\. Human review still required\./i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Web3 experience is required; use only with strong proof or warm intro\./i),
    ).not.toBeInTheDocument();
  });

  it("generates a pack with verbatim content, persists it, and records generated-pack activity", async () => {
    const user = userEvent.setup();
    const expectedPack = generateApplicationPack(
      sampleJobs[1],
      seedCandidate,
      scoreJob(sampleJobs[1], seedCandidate),
    );

    renderApp();

    await user.click(screen.getByRole("button", { name: /Application Pack/i }));
    await user.click(screen.getByRole("button", { name: /Generate pack/i }));

    expect(screen.getByText(/Tailored Summary/i)).toBeInTheDocument();
    expect(screen.getByText("I will review and send this manually.")).toBeInTheDocument();
    const [recruiterDm, hiringManagerDm] = screen.getAllByRole("textbox");
    expect(recruiterDm).toHaveValue(expectedPack.recruiterDm);
    expect(hiringManagerDm).toHaveValue(expectedPack.hiringManagerDm);
    expect((recruiterDm as HTMLTextAreaElement).value).not.toContain("I will review and send this manually");
    expect((hiringManagerDm as HTMLTextAreaElement).value).not.toContain("I will review and send this manually");

    await user.click(screen.getByRole("button", { name: /Outreach/i }));
    expect(screen.getByText(/generated_pack/i)).toBeInTheDocument();
    expect(screen.getByText(/Pack generated for human review/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Application Pack/i }));
    expect(screen.getAllByRole("textbox")[0]).toHaveValue(expectedPack.recruiterDm);
  });

  it("marks a non-applied pack job as application_pack_ready after generating a pack", async () => {
    const user = userEvent.setup();

    renderApp();

    await user.click(screen.getByRole("button", { name: /Application Pack/i }));
    await user.click(screen.getByRole("button", { name: /Generate pack/i }));
    await user.click(screen.getByRole("button", { name: /Job Inbox/i }));

    expect(screen.getByText(/Example Global Fintech · application_pack_ready/i)).toBeInTheDocument();
  });

  it("does not regress an applied job when generating a pack", async () => {
    const user = userEvent.setup();

    renderApp();

    await user.click(screen.getByRole("button", { name: /Job Inbox/i }));
    await user.click(screen.getByRole("button", { name: /Business Analyst, Fintech Operations/i }));
    await user.selectOptions(screen.getByLabelText(/Status/i), "applied");
    expect(screen.getByLabelText(/Status/i)).toHaveValue("applied");

    await user.click(screen.getByRole("button", { name: /Application Pack/i }));
    await user.click(screen.getByRole("button", { name: /Generate pack/i }));
    await user.click(screen.getByRole("button", { name: /Job Inbox/i }));

    expect(screen.getByText(/Example Global Fintech · applied/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toHaveValue("applied");
  });

  it("records manual outreach activity as sent manually by Mia", async () => {
    const user = userEvent.setup();

    renderApp();

    await openNav(user, /Outreach/i);
    await user.click(screen.getByRole("button", { name: /Record manual DM/i }));

    expect(screen.getByText(/sent_dm/i)).toBeInTheDocument();
    expect(screen.getByText(/Sent manually by Mia/i)).toBeInTheDocument();
  });

  it("counts a manual applied status change in weekly review and records the manual application activity", async () => {
    const user = userEvent.setup();

    saveState({
      jobs: sampleJobs.map((job) => (job.id === "job-2" ? { ...job, status: "shortlisted" } : job)),
      activities: [],
    });

    renderApp();

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Business Analyst, Fintech Operations/i }));
    await user.selectOptions(screen.getByLabelText(/Status/i), "applied");

    await openNav(user, /Outreach/i);
    expect(screen.getByText(/submitted_application/i)).toBeInTheDocument();
    expect(screen.getByText(/Application submitted manually/i)).toBeInTheDocument();

    await openNav(user, /Weekly Review/i);
    expect(screen.getByText(/Applied: 1/i)).toBeInTheDocument();
  });

  it("counts a manual shortlisted status change in weekly review and records the manual shortlist activity", async () => {
    const user = userEvent.setup();

    saveState({
      jobs: sampleJobs.map((job) => (job.id === "job-2" ? { ...job, status: "reviewed" } : job)),
      activities: [],
    });

    renderApp();

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Business Analyst, Fintech Operations/i }));
    await user.selectOptions(screen.getByLabelText(/Status/i), "shortlisted");
    await user.selectOptions(screen.getByLabelText(/Status/i), "applied");

    await openNav(user, /Outreach/i);
    expect(screen.getByText(/shortlisted_job/i)).toBeInTheDocument();
    expect(screen.getByText(/Shortlisted manually/i)).toBeInTheDocument();

    await openNav(user, /Weekly Review/i);
    expect(screen.getByText(/Shortlisted: 1/i)).toBeInTheDocument();
  });

  it("counts a manual interview status change in weekly review", async () => {
    const user = userEvent.setup();

    saveState({
      jobs: sampleJobs.map((job) => (job.id === "job-2" ? { ...job, status: "shortlisted" } : job)),
      activities: [],
    });

    renderApp();

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Business Analyst, Fintech Operations/i }));
    await user.selectOptions(screen.getByLabelText(/Status/i), "interview");

    await openNav(user, /Weekly Review/i);
    expect(screen.getByText(/Interviews: 1/i)).toBeInTheDocument();
  });

  it("adds a manual outreach contact with a visible follow-up date", async () => {
    const user = userEvent.setup();

    renderApp();

    await openNav(user, /Outreach/i);
    await user.type(screen.getByLabelText(/Contact name/i), "Avery Chen");
    await user.type(screen.getByLabelText(/Contact company/i), "Example Global Fintech");
    await user.type(screen.getByLabelText(/Contact role/i), "Hiring Manager");
    await user.selectOptions(screen.getByLabelText(/Associated job/i), "job-2");
    await user.selectOptions(screen.getByLabelText(/^Channel$/i), "Email");
    await user.selectOptions(screen.getByLabelText(/Relationship type/i), "hiring manager");
    await user.type(screen.getByLabelText(/Profile URL/i), "https://example.com/avery");
    await user.type(screen.getByLabelText(/^Follow-up date$/i), "2026-07-05");
    await user.type(screen.getByLabelText(/Notes/i), "Met through a shared fintech operator group.");
    await user.click(screen.getByRole("button", { name: /Add contact/i }));

    const contactCard = screen.getByText(/Avery Chen · Example Global Fintech/i).closest("article");
    expect(contactCard).not.toBeNull();
    expect(within(contactCard as HTMLElement).getByText(/Not contacted/i)).toBeInTheDocument();
    expect(within(contactCard as HTMLElement).getByText(/Follow-up date: 2026-07-05/i)).toBeInTheDocument();
  });

  it("updates a seeded contact follow-up date and uses it for manual follow-up activity", async () => {
    const user = userEvent.setup();

    saveState({
      contacts: [
        {
          id: "contact-1",
          jobId: "job-1",
          name: "Hiring Team",
          company: "Example Web3 Wallet",
          role: "Recruiter",
          channel: "LinkedIn",
          profileUrl: "",
          relationshipType: "recruiter",
          messageStatus: "Not contacted",
          followUpDate: "",
          replyStatus: "",
          notes: "Manual contact entry only.",
        },
      ],
      activities: [],
    });

    renderApp();

    await openNav(user, /Outreach/i);
    const followUpInput = screen.getByLabelText(/Follow-up date for Hiring Team/i);
    fireEvent.change(followUpInput, { target: { value: "2026-07-10" } });
    expect(screen.getByText(/Follow-up date: 2026-07-10/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Record follow-up/i }));

    expect(screen.getByText(/Follow-up recorded manually/i)).toBeInTheDocument();
    expect(screen.getByText(/Follow-up date: Not scheduled/i)).toBeInTheDocument();
    expect(screen.getByText(/No response/i)).toBeInTheDocument();

    const savedState = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      activities?: Array<{ actionType: string; nextActionDate: string }>;
      contacts?: Array<{ followUpDate: string; messageStatus: string }>;
    };
    expect(savedState.activities?.[0]).toMatchObject({
      actionType: "sent_follow_up",
      nextActionDate: "2026-07-10",
    });
    expect(savedState.contacts?.[0]).toMatchObject({
      followUpDate: "",
      messageStatus: "No response",
    });
  });

  it("records manual DM, follow-up, and reply activities from an outreach contact", async () => {
    const user = userEvent.setup();

    renderApp();

    await openNav(user, /Outreach/i);
    await user.click(screen.getByRole("button", { name: /Record manual DM/i }));
    await user.click(screen.getByRole("button", { name: /Record follow-up/i }));
    await user.click(screen.getByRole("button", { name: /Record reply/i }));

    expect(screen.getByText(/sent_dm/i)).toBeInTheDocument();
    expect(screen.getByText(/sent_follow_up/i)).toBeInTheDocument();
    expect(screen.getByText(/received_reply/i)).toBeInTheDocument();
    expect(screen.getByText(/Sent manually by Mia/i)).toBeInTheDocument();
    expect(screen.getByText(/Follow-up recorded manually/i)).toBeInTheDocument();
    expect(screen.getByText(/Reply recorded manually/i)).toBeInTheDocument();
    expect(screen.getByText(/Replied/i)).toBeInTheDocument();
  });

  it("keeps an advanced job status stable when outreach contact status changes", async () => {
    const user = userEvent.setup();

    renderApp();

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Business Analyst, Fintech Operations/i }));
    await user.selectOptions(screen.getByLabelText(/Status/i), "interview");
    expect(screen.getByLabelText(/Status/i)).toHaveValue("interview");

    await openNav(user, /Outreach/i);
    await user.type(screen.getByLabelText(/Contact name/i), "Mina Patel");
    await user.type(screen.getByLabelText(/Contact company/i), "Example Global Fintech");
    await user.type(screen.getByLabelText(/Contact role/i), "Hiring Manager");
    await user.selectOptions(screen.getByLabelText(/Associated job/i), "job-2");
    await user.click(screen.getByRole("button", { name: /Add contact/i }));

    const contactCard = screen.getByText(/Mina Patel · Example Global Fintech/i).closest("article");
    expect(contactCard).not.toBeNull();
    await user.click(within(contactCard as HTMLElement).getByRole("button", { name: /Record follow-up/i }));

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Business Analyst, Fintech Operations/i }));
    expect(screen.getByLabelText(/Status/i)).toHaveValue("interview");
    expect(screen.getByText(/Example Global Fintech · interview/i)).toBeInTheDocument();
  });

  it("shows weekly review metrics and guidance derived from outreach and reply activity", async () => {
    const user = userEvent.setup();

    renderApp();

    await openNav(user, /Application Pack/i);
    await user.click(screen.getByRole("button", { name: /Generate pack/i }));
    await openNav(user, /Outreach/i);
    await user.click(screen.getByRole("button", { name: /Record manual DM/i }));
    await user.click(screen.getByRole("button", { name: /Record reply/i }));
    await openNav(user, /Weekly Review/i);

    expect(screen.getByText(/Outreach: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Replies: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate Asset Layer/i)).toBeInTheDocument();
    expect(screen.getByText(/Web3 vs Web3-adjacent/i)).toBeInTheDocument();
  });

  it("keeps a saved pack reachable after the selected job moves to interview", async () => {
    const user = userEvent.setup();
    const expectedPack = generateApplicationPack(
      sampleJobs[1],
      seedCandidate,
      scoreJob(sampleJobs[1], seedCandidate),
    );

    renderApp();

    await openNav(user, /Application Pack/i);
    await user.click(screen.getByRole("button", { name: /Generate pack/i }));
    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Business Analyst, Fintech Operations/i }));
    await user.selectOptions(screen.getByLabelText(/Status/i), "interview");
    expect(screen.getByLabelText(/Status/i)).toHaveValue("interview");

    await openNav(user, /Application Pack/i);

    expect(
      screen.getByRole("heading", { name: /Business Analyst, Fintech Operations · Example Global Fintech/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(expectedPack.recruiterDm)).toBeInTheDocument();
    expect(screen.getByText("I will review and send this manually.")).toBeInTheDocument();
  });

  it("does not add a title-only intake without a JD or URL", async () => {
    const user = userEvent.setup();

    renderApp();

    await openNav(user, /Job Inbox/i);
    await user.type(screen.getByLabelText(/Job title/i), "Lonely Title");
    await user.click(screen.getByRole("button", { name: /Add job/i }));

    expect(screen.queryByRole("heading", { name: /Lonely Title · Company to verify/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /2 Jobs/i })).toBeInTheDocument();
  });

  it("exports and imports backup JSON that updates visible app state", async () => {
    const user = userEvent.setup();

    renderApp();

    await user.click(screen.getByRole("button", { name: /Backup/i }));
    expect(screen.getByRole("button", { name: /Export JSON/i })).toBeInTheDocument();
    const backupInput = screen.getByLabelText(/Import JSON/i);

    await user.click(screen.getByRole("button", { name: /Export JSON/i }));

    const exportedJson = (backupInput as HTMLTextAreaElement).value;
    expect(exportedJson).toContain('"candidate"');
    expect(exportedJson).toContain('"jobs"');

    const importedState = JSON.parse(exportedJson) as {
      candidate: { linkedinHeadline: string };
      jobs: Array<{ title: string; company: string }>;
    };
    importedState.candidate.linkedinHeadline = "Imported Headline for Backup Test";
    importedState.jobs[0] = {
      ...importedState.jobs[0],
      title: "Imported Role Title",
      company: "Imported Company",
    };

    fireEvent.change(backupInput, { target: { value: JSON.stringify(importedState, null, 2) } });
    await user.click(screen.getByRole("button", { name: /Import backup/i }));

    await user.click(screen.getByRole("button", { name: /Assets/i }));
    expect(screen.getByDisplayValue(/Imported Headline for Backup Test/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Job Inbox/i }));
    const pipeline = screen.getByRole("heading", { name: /2 Jobs/i }).closest(".panel");
    expect(pipeline).not.toBeNull();
    expect(within(pipeline as HTMLElement).getByText(/Imported Company · new/i)).toBeInTheDocument();
  });

  it("shows due follow-up reminders in Today for contacts with past or current follow-up dates", async () => {
    const user = userEvent.setup();
    const today = formatLocalDate(new Date("2026-06-28T00:30:00+08:00"));

    saveState({
      contacts: [
        {
          id: "contact-due",
          jobId: "job-2",
          name: "Avery Chen",
          company: "Example Global Fintech",
          role: "Hiring Manager",
          channel: "Email",
          profileUrl: "",
          relationshipType: "hiring manager",
          messageStatus: "Follow-up due",
          followUpDate: today,
          replyStatus: "",
          notes: "Due today.",
        },
        {
          id: "contact-future",
          jobId: "job-3",
          name: "Jordan Lee",
          company: "Example Web3 Wallet",
          role: "Recruiter",
          channel: "LinkedIn",
          profileUrl: "",
          relationshipType: "recruiter",
          messageStatus: "DM sent",
          followUpDate: "2099-12-31",
          replyStatus: "",
          notes: "Future follow-up.",
        },
      ],
    });

    renderApp();

    await openNav(user, /Today/i);

    expect(screen.getByRole("heading", { name: /Follow-up Reminders/i })).toBeInTheDocument();
    expect(screen.getByText(/Avery Chen/i)).toBeInTheDocument();
    expect(screen.getByText(/Example Global Fintech/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Follow-up date: ${today}`))).toBeInTheDocument();
    expect(screen.getByText(/Follow-up due/i)).toBeInTheDocument();
    expect(screen.queryByText(/Jordan Lee/i)).not.toBeInTheDocument();
  });

  it("removes a due reminder from Today after recording the follow-up when no next follow-up is scheduled", async () => {
    const user = userEvent.setup();
    const today = formatLocalDate(new Date("2026-06-28T00:30:00+08:00"));

    saveState({
      contacts: [
        {
          id: "contact-due",
          jobId: "job-2",
          name: "Avery Chen",
          company: "Example Global Fintech",
          role: "Hiring Manager",
          channel: "Email",
          profileUrl: "",
          relationshipType: "hiring manager",
          messageStatus: "Follow-up due",
          followUpDate: today,
          replyStatus: "",
          notes: "Due today.",
        },
      ],
      activities: [],
    });

    renderApp();

    await openNav(user, /Outreach/i);
    await user.click(screen.getByRole("button", { name: /Record follow-up/i }));
    expect(screen.getByText(/No response/i)).toBeInTheDocument();
    expect(screen.getByText(/Follow-up date: Not scheduled/i)).toBeInTheDocument();

    await openNav(user, /Today/i);
    expect(screen.getByText(/No follow-ups due today\./i)).toBeInTheDocument();
    expect(screen.queryByText(/Avery Chen/i)).not.toBeInTheDocument();
  });

  it("formats dates using the local calendar day instead of UTC", () => {
    expect(formatLocalDate(new Date("2026-06-28T00:30:00+08:00"))).toBe("2026-06-28");
  });

  it("shows an empty state when no follow-ups are due today", async () => {
    const user = userEvent.setup();

    saveState({
      contacts: [
        {
          id: "contact-future",
          jobId: "job-3",
          name: "Jordan Lee",
          company: "Example Web3 Wallet",
          role: "Recruiter",
          channel: "LinkedIn",
          profileUrl: "",
          relationshipType: "recruiter",
          messageStatus: "DM sent",
          followUpDate: "2099-12-31",
          replyStatus: "",
          notes: "Future follow-up.",
        },
      ],
    });

    renderApp();

    await openNav(user, /Today/i);

    expect(screen.getByText(/No follow-ups due today\./i)).toBeInTheDocument();
  });

  it("keeps a follow_up_due job from regressing to dm_sent after manual outreach updates", async () => {
    const user = userEvent.setup();

    saveState({
      jobs: sampleJobs.map((job) => (job.id === "job-2" ? { ...job, status: "follow_up_due" } : job)),
      contacts: [
        {
          id: "contact-1",
          jobId: "job-2",
          name: "Hiring Team",
          company: "Example Global Fintech",
          role: "Recruiter",
          channel: "LinkedIn",
          profileUrl: "",
          relationshipType: "recruiter",
          messageStatus: "Follow-up due",
          followUpDate: "",
          replyStatus: "",
          notes: "Manual contact entry only.",
        },
      ],
    });

    renderApp();

    await openNav(user, /Outreach/i);
    await user.click(screen.getByRole("button", { name: /Record manual DM/i }));

    await openNav(user, /Job Inbox/i);
    await user.click(screen.getByRole("button", { name: /Business Analyst, Fintech Operations/i }));
    expect(screen.getByText(/Example Global Fintech · follow_up_due/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toHaveValue("follow_up_due");
  });

  it("generates a daily briefing in Today after 08:00 Asia/Shanghai when no local-day archive exists", async () => {
    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockImplementation(
      (_now, briefings) => briefings.length === 0,
    );
    vi.spyOn(dailyBriefingModule, "createDailyBriefing").mockReturnValue({
      id: "briefing-2026-06-28",
      date: "2026-06-28",
      generatedAt: "2026-06-28T00:30:00.000Z",
      windowLabel: "Past 24 hours",
      items: [
        {
          job: toJobFromDiscoveredJob(discoveredJobsFixture[0]),
          score: scoreJob(toJobFromDiscoveredJob(discoveredJobsFixture[0]), seedCandidate),
          summary: "Orbit Wallet is hiring for Growth Data Analyst, Lifecycle. Role angle: Growth Data Analyst. Recommendation: Strong Apply.",
          fitReasons: ["Role angle: Growth Data Analyst.", "Strong lifecycle analytics and growth data overlap."],
          risks: ["No hard blocker detected. Human review still required."],
        },
      ],
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: discoveredJobsFixture }),
    } as Response);

    renderApp();

    expect(await screen.findByText(/Past 24 hours/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Daily Web3 Job Briefing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add to Job Inbox/i })).toBeInTheDocument();

    const savedState = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      briefings?: Array<{ date: string; items: unknown[] }>;
    };
    expect(savedState.briefings?.[0]?.date).toBe("2026-06-28");
    expect(savedState.briefings?.[0]?.items.length).toBeGreaterThan(0);
  });

  it("does not generate a daily briefing before 08:00 Asia/Shanghai", async () => {
    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockReturnValue(false);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: discoveredJobsFixture }),
    } as Response);

    renderApp();

    expect(screen.getByRole("heading", { name: /Daily Web3 Job Briefing/i })).toBeInTheDocument();
    expect(screen.getByText(/No daily briefing archive yet for the current local cycle\./i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows a Today error note when daily briefing generation fails", async () => {
    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockImplementation(
      (_now, briefings) => briefings.length === 0,
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ jobs: [] }),
    } as Response);

    renderApp();

    expect(
      await screen.findByText(/Daily briefing could not refresh\. Manual Fetch in Job Inbox is still available\./i),
    ).toBeInTheDocument();
  });

  it("retries daily briefing generation when Mia revisits Today after a failure", async () => {
    const user = userEvent.setup();

    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockReturnValue(true);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ jobs: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: discoveredJobsFixture }),
      } as Response);

    renderApp();

    expect(
      await screen.findByText(/Daily briefing could not refresh\. Manual Fetch in Job Inbox is still available\./i),
    ).toBeInTheDocument();

    await openNav(user, /Job Inbox/i);
    await openNav(user, /Today/i);

    expect(await screen.findByText(/Past 24 hours/i)).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("shows a Today error for an ok plus error payload, does not persist an empty archive, and retries on revisit", async () => {
    const user = userEvent.setup();

    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockReturnValue(true);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: [], error: "Job discovery failed" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobs: discoveredJobsFixture }),
      } as Response);

    renderApp();

    expect(
      await screen.findByText(/Daily briefing could not refresh\. Manual Fetch in Job Inbox is still available\./i),
    ).toBeInTheDocument();

    const savedAfterFailure = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      briefings?: Array<{ date: string; items: unknown[] }>;
    };
    expect(savedAfterFailure.briefings ?? []).toEqual([]);

    await openNav(user, /Job Inbox/i);
    await openNav(user, /Today/i);

    expect(await screen.findByText(/Past 24 hours/i)).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);

    const savedAfterRetry = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as {
      briefings?: Array<{ date: string; items: unknown[] }>;
    };
    expect(savedAfterRetry.briefings?.[0]?.date).toBe("2026-06-28");
    expect(savedAfterRetry.briefings?.[0]?.items.length).toBeGreaterThan(0);
  });

  it("regenerates today's briefing after backup import replaces state without today's archive", async () => {
    const user = userEvent.setup();
    let archiveCount = 0;

    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockImplementation(
      (_now, briefings) => briefings.length === 0,
    );
    vi.spyOn(dailyBriefingModule, "createDailyBriefing").mockImplementation(() => {
      archiveCount += 1;

      return {
        id: `briefing-2026-06-28-${archiveCount}`,
        date: "2026-06-28",
        generatedAt: `2026-06-28T0${archiveCount}:30:00.000Z`,
        windowLabel: "Past 24 hours",
        items: [
          {
            job: toJobFromDiscoveredJob(discoveredJobsFixture[0]),
            score: scoreJob(toJobFromDiscoveredJob(discoveredJobsFixture[0]), seedCandidate),
            summary: `Generated briefing ${archiveCount}`,
            fitReasons: ["Reason one", "Reason two"],
            risks: ["No hard blocker detected. Human review still required."],
          },
        ],
      };
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: discoveredJobsFixture }),
    } as Response);

    renderApp();

    expect(await screen.findByText("Generated briefing 1")).toBeInTheDocument();

    await openNav(user, /Backup/i);
    const backupInput = screen.getByLabelText(/Import JSON/i);

    await user.click(screen.getByRole("button", { name: /Export JSON/i }));

    const importedState = JSON.parse((backupInput as HTMLTextAreaElement).value) as {
      version: number;
      candidate: typeof seedCandidate;
      jobs: typeof sampleJobs;
      briefings: unknown[];
      packs: unknown[];
      contacts: unknown[];
      activities: unknown[];
    };
    importedState.briefings = [];

    fireEvent.change(backupInput, { target: { value: JSON.stringify(importedState, null, 2) } });
    await user.click(screen.getByRole("button", { name: /Import backup/i }));

    await openNav(user, /Today/i);

    expect(await screen.findByText("Generated briefing 2")).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("excludes jobs added while the daily briefing fetch is in flight", async () => {
    const user = userEvent.setup();
    const deferredResponse = createDeferredPromise<Response>();
    const inflightJob = discoveredJobsFixture[0];

    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockReturnValue(true);
    vi.spyOn(globalThis, "fetch").mockReturnValue(deferredResponse.promise);
    const createDailyBriefingSpy = vi
      .spyOn(dailyBriefingModule, "createDailyBriefing")
      .mockImplementation((discoveredJobs, candidate, existingJobs, now) => {
        const hasAddedJob = existingJobs.some((job) => job.originalUrl === inflightJob.originalUrl);

        if (hasAddedJob) {
          return {
            id: "briefing-2026-06-28",
            date: "2026-06-28",
            generatedAt: now.toISOString(),
            windowLabel: "Past 24 hours",
            items: [],
          };
        }

        return {
          id: "briefing-2026-06-28",
          date: "2026-06-28",
          generatedAt: now.toISOString(),
          windowLabel: "Past 24 hours",
          items: [
            {
              job: toJobFromDiscoveredJob(discoveredJobs[0], now),
              score: scoreJob(toJobFromDiscoveredJob(discoveredJobs[0], now), candidate),
              summary: "Orbit Wallet is hiring for Growth Data Analyst, Lifecycle.",
              fitReasons: ["Good fit"],
              risks: ["No hard blocker detected. Human review still required."],
            },
          ],
        };
      });

    renderApp();

    expect(await screen.findByText(/Refreshing today's briefing/i)).toBeInTheDocument();

    await openNav(user, /Job Inbox/i);
    await user.type(screen.getByLabelText(/Job title/i), inflightJob.title);
    await user.type(screen.getByLabelText(/Company/i), inflightJob.company);
    await user.type(screen.getByLabelText(/Original URL/i), inflightJob.originalUrl);
    await user.type(screen.getByLabelText(/Apply URL/i), inflightJob.applyUrl);
    await user.type(screen.getByLabelText(/JD text/i), inflightJob.description);
    await user.click(screen.getByRole("button", { name: /Add job/i }));

    deferredResponse.resolve({
      ok: true,
      json: async () => ({ jobs: discoveredJobsFixture }),
    } as Response);

    await waitFor(() => {
      expect(createDailyBriefingSpy).toHaveBeenCalled();
    });

    await openNav(user, /Today/i);

    expect(
      await screen.findAllByText(/No new briefing items made the top match list for this archive\./i),
    ).not.toHaveLength(0);
    expect(createDailyBriefingSpy).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /Add to Job Inbox/i })).not.toBeInTheDocument();
    expect(createDailyBriefingSpy.mock.calls[0]?.[2]).toEqual(
      expect.arrayContaining([expect.objectContaining({ originalUrl: inflightJob.originalUrl })]),
    );
  });

  it("labels the newest briefing archive as current even when saved order is older-first", async () => {
    saveState({
      briefings: [
        {
          id: "briefing-older",
          date: "2026-06-27",
          generatedAt: "2026-06-27T01:00:00.000Z",
          windowLabel: "Past 24 hours",
          items: [],
        },
        {
          id: "briefing-newer",
          date: "2026-06-28",
          generatedAt: "2026-06-28T02:00:00.000Z",
          windowLabel: "Past 24 hours",
          items: [],
        },
      ],
    });
    vi.spyOn(dailyBriefingModule, "shouldGenerateDailyBriefing").mockReturnValue(false);

    renderApp();

    const currentArchiveSection = screen.getByRole("heading", { name: "2026-06-28" }).closest("section");

    expect(currentArchiveSection).not.toBeNull();
    expect(within(currentArchiveSection as HTMLElement).getByText(/Current archive/i)).toBeInTheDocument();
  });
});
