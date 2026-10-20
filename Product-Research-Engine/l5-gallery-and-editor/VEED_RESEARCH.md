# VEED — editor UI/workflow research

User-confirmed scope: editor UI and workflows for Avion Edit, not reference-video harvesting or the download/decode pipeline. Keep output separate from gallery URLs and never update shared Avion plans/source from this research task.

Start from this folder in PowerShell:

```powershell
python save_auth.py veed
```

Uses existing Node Playwright and a headed system Chrome window; no pip install or `--break-system-packages` needed. Sign in yourself using the account's normal method; return to VEED's dashboard; press Enter in the terminal, or tell the assistant login is complete. No recording occurs during login. Do not bypass security warnings. Reusable state includes cookies and potentially local storage/IndexedDB, not passwords; normal reuse sends authentication cookies to VEED as part of requests.

Session file: `%LOCALAPPDATA%\AvionCrawlerL5\auth\veed.json`, outside this OneDrive project. Treat it like a password. This is a separate UI target; `node crawl.mjs all` remains gallery-only and does not visit VEED.

Next capture plan (not yet executed): one approved scratch project, main editor layout, media library, text/subtitles, transitions/effects, selected-object inspector, timeline controls, AI/manual handoff, empty/loading/disabled states and export-options screen only. Capture UI evidence and state transitions, not existing personal projects or credentials. Stop before generation, transcription, export jobs, paid trials, uploads, invites or publishing unless separately authorized. Unknown/private backend design stays unknown; public docs and observed UI inform the architecture assessment.

Status: login helper prepared; session reuse and authenticated UI crawl require verification after manual login. No claim of completed L5 research.
