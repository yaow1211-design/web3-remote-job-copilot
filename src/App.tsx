import {
  BriefcaseBusiness,
  CalendarCheck,
  FileText,
  MessageSquare,
  Sparkles,
  Target,
} from "lucide-react";
import "./styles.css";

const NAV_ITEMS = [
  { id: "today", label: "Today", icon: CalendarCheck },
  { id: "jobs", label: "Job Inbox", icon: BriefcaseBusiness },
  { id: "assets", label: "Assets", icon: Target },
  { id: "pack", label: "Application Pack", icon: FileText },
  { id: "outreach", label: "Outreach", icon: MessageSquare },
  { id: "review", label: "Weekly Review", icon: Sparkles },
] as const;

export default function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary">
        <div>
          <p className="eyebrow">V1 Local MVP</p>
          <h1>Mia Web3 Remote Application Command Center</h1>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <button key={item.id} className="nav-button" type="button">
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="workspace" aria-label="Workspace">
        <h2>Today Command Center</h2>
        <p>
          Review jobs, generate application packs, track outreach, and run the weekly review from one local cockpit.
        </p>
      </section>
    </main>
  );
}
