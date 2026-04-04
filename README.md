# Command Center

A live dashboard that visualizes the agent's workspace state, memory integrity, project progress, and task completion metrics.

## Overview

The Command Center is not a standalone app — it's a **reflection layer** over the agent's actual working memory. It reads from task lists in `workspace/working/`, syncs with `workspace/state/xp-ledger.json`, and renders an immersive diorama view of ongoing work.

## How It Works

### Data Flow

```
workspace/working/*.md (task lists)
       ↓ (sync-dashboard.ps1)
workspace/state/xp-ledger.json (canonical state)
       ↓ (embedded JSON)
workspace/dashboard/diorama.html (visualization)
```

- **Task Lists**: Each project has a markdown file in `workspace/working/` with checkboxes (`- [ ] task`, `- [x] done`). The sync script parses these to compute XP, levels, open loops, and momentum.
- **Ledger**: `xp-ledger.json` tracks project metadata (class, role, XP, level), current tasks, open tasks, and recent events (task completions, level-ups).
- **Dashboard**: `diorama.html` embeds the ledger JSON and renders a real-time visual display with characters, furniture, and dynamic indicators.

### Running the Sync

Execute the PowerShell script to update the dashboard:

```powershell
powershell -ExecutionPolicy Bypass -File E:\openclaw\workspace\dashboard\sync-dashboard.ps1
```

This can be scheduled (e.g., via cron or the agent's heartbeat) to keep the dashboard current.

### Memory Integrity Metric

The dashboard computes a **Signal Drift** score (0–100%) that measures how coherent and up-to-date the workspace is. Factors:
- Recency of last sync
- Number of valid working files
- Project sync coverage
- Daily journal presence

## Customization

- **Add a new project**: Create a file in `workspace/working/` (e.g., `my-project.md`) with tasks. Then add an entry to `xp-ledger.json` under `projects` (or let the sync script auto-create it on first run).
- **Change visuals**: Edit `workspace/dashboard/diorama.html`, `diorama.css`, and `diorama.js`. Assets are in `workspace/dashboard/assets/`.
- **Metrics**: Modify `sync-dashboard.ps1` to adjust XP per task, level thresholds, or drift calculation.

## Architecture Notes

- The dashboard is **read-only** from the agent's perspective. The agent writes to working files and the ledger; the dashboard only displays.
- All state files in `workspace/state/` are gitignored because they change on every sync.
- The `.openclaw/` directory (OpenClaw runtime) is intentionally separate and also gitignored.

## Repository Structure

```
Project-Command-Center/
├── .gitignore              # excludes state files and secrets
├── README.md               # this file
├── workspace/
│   ├── dashboard/          # front-end visualization
│   │   ├── diorama.html
│   │   ├── diorama.css
│   │   ├── diorama.js
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── sync-dashboard.ps1
│   │   └── assets/...
│   ├── memory/             # daily logs (journal)
│   ├── working/            # project task lists
│   └── state/              # generated JSON (gitignored)
```

## Use with OpenClaw Agents

This Command Center is designed to work with an OpenClaw agent that:
- Maintains `workspace/working/*.md` task lists
- Updates `workspace/memory/` daily
- Can run `sync-dashboard.ps1` periodically (heartbeat or cron)

The agent's identity, memory, and long-term configuration live in `.openclaw/` (not in this repo).
