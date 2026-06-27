import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { generateApplicationPack } from "./domain/applicationPack";
import { scoreJob } from "./domain/scoring";
import { seedCandidate } from "./domain/seedCandidate";
import { sampleJobs } from "./sampleData";

const STORAGE_KEY = "web3-remote-job-copilot:v1";

function renderApp() {
  return render(<App />);
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
  });

  it("renders the main command center navigation", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /Mia Web3 Remote Application Command Center/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Job Inbox/i })).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: /Outreach/i }));
    await user.click(screen.getByRole("button", { name: /Record manual DM/i }));

    expect(screen.getByText(/sent_dm/i)).toBeInTheDocument();
    expect(screen.getByText(/Sent manually by Mia/i)).toBeInTheDocument();
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
});
