import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

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

  it("generates an application pack and keeps sending manual", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Application Pack/i }));
    await user.click(screen.getByRole("button", { name: /Generate pack/i }));

    expect(screen.getByText(/Tailored Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/I will review and send this manually/i)).toBeInTheDocument();
  });

  it("shows weekly review guidance and backup controls", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: /Weekly Review/i }));
    expect(screen.getByText(/Next Week Adjustments/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Backup/i }));
    expect(screen.getByRole("button", { name: /Export JSON/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Import JSON/i)).toBeInTheDocument();
  });
});
