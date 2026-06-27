import { useState } from "react";
import type { AppState } from "../domain/types";
import { exportAppState, importAppState } from "../storage/localStore";

interface BackupPanelProps {
  state: AppState;
  onImport: (state: AppState) => void;
}

export function BackupPanel({ state, onImport }: BackupPanelProps) {
  const [backupText, setBackupText] = useState("");
  const [message, setMessage] = useState("");

  function handleExport() {
    setBackupText(exportAppState(state));
    setMessage("Backup JSON generated. Store it somewhere private.");
  }

  function handleImport() {
    try {
      onImport(importAppState(backupText));
      setMessage("Backup imported into this browser.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backup import failed");
    }
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow-dark">Local Backup</p>
        <h2>Export / Import JSON</h2>
        <p>Use local JSON backups for safekeeping. Imports replace the current browser state.</p>
      </div>

      <div className="backup-actions">
        <button className="primary-button" type="button" onClick={handleExport}>
          Export JSON
        </button>

        <button className="secondary-button" type="button" onClick={handleImport}>
          Import backup
        </button>
      </div>

      <label>
        Import JSON
        <textarea
          rows={12}
          value={backupText}
          onChange={(event) => setBackupText(event.target.value)}
        />
      </label>

      {message ? <p className="manual-note">{message}</p> : null}
    </section>
  );
}
