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
    expect(screen.getByText(/Fit & Risk Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommendation/i)).toBeInTheDocument();
  });
});
