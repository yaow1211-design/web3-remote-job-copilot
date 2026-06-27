import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the application command center", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /Mia Web3 Remote Application Command Center/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Today/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Job Inbox/i })).toBeInTheDocument();
  });
});
