# Avion Structure Library — isolated gallery crawler

**Editor UI research is now a separate command in this folder:** see [EDITOR_RESEARCH.md](EDITOR_RESEARCH.md). `node research-editor.mjs --help` describes screenshot, catalogue and coverage capture. The gallery commands below are unchanged.

This new folder does not alter the old crawlers or Avion. The current scope is **gallery/community video URLs**, not the earlier whole-product L1–L5 research proposal. No new Python/browser installation: the crawler uses Avion's already-installed Node Playwright and system Chrome; `save_auth.py` is a Python launcher for the Node session helper.

## Windows / PowerShell

Run from this folder:

```powershell
node --test core.test.mjs
node crawl.mjs higgsfield --pages 2 --scrolls 1
node crawl.mjs all --pages 8 --scrolls 3
```

One visible Chrome page at a time, at least 1.2 seconds between navigations/scrolls; no unbounded retry. This delay does not individually throttle the browser's concurrent CSS/JS subresources. Images/fonts/media requests are blocked to reduce memory and avoid media downloads. Public mode never loads saved auth. Robots denial/unavailability, 403, 429, access challenges and out-of-scope redirects stop that site's run. No auto-clicking Generate, Publish, Like, Download, payment or destructive actions. Non-GET requests are blocked except explicit read-only GraphQL queries; this can limit galleries and must be reported, not silently bypassed.

Outputs, all gitignored under `output/`:

- `creator_dna_video_master.txt`: deduplicated HTTPS URLs, exactly one per line; no headings/comments.
- `url_evidence.json`: source gallery, observed time, link type, access mode and unverified rights. No bodies, headers, credentials, screenshots or footage.
- `<site>.status.json`: completed/partial/blocked states and real counts. An empty result is not a successful comprehensive crawl.
- Mode-specific checkpoints resume between pages. `--fresh` rechecks pages without deleting previous URL evidence.

Do not run multiple copies. After a crash, verify no crawler is running before manually removing `output/crawl.lock`. Request/signature-bearing URLs are discarded; prefer public video permalinks. An exported permalink may still be unsupported by yt-dlp. Sites backed entirely by canvas, blob URLs or hidden API data require adapter work; they are not treated as fully covered.

## Manual login, only when required

If a public result explicitly says `auth-required`:

```powershell
python save_auth.py higgsfield
# Log in YOURSELF in the opened Chrome window; return to gallery; type SAVE in terminal.
node crawl.mjs higgsfield --auth
```

No screenshot/network/key recording during login. No credentials in code. No stealth, `--no-sandbox`, disabled isolation, copied personal Chrome profile or security-warning bypass. If Google refuses automated Chrome, use an official site-offered email flow or cancel. The helper never solves challenges.

Storage-state files contain reusable account credentials: never share them. Because this project is inside OneDrive, the default is `%LOCALAPPDATA%\AvionCrawlerL5\auth\<site>.json`, **outside OneDrive**, not the project's `auth/`. A defensive `auth/` gitignore is also included. Node `mode: 0600` is not a Windows ACL guarantee; the directory relies on the current Windows user's normal profile permissions. No sessions are copied from the old crawler. Only target-site cookies/origins are persisted; a site requiring another auth domain must be reviewed explicitly rather than capturing all domains.

## Separate download stage — never part of crawling

The original `1_download.sh` / `2_decode.py` were not found in the scoped folders. `1_download.py` is a standalone Windows equivalent using `yt-dlp -a`, not a verified line-for-line port.

```powershell
python 1_download.py                         # validation only, downloads nothing
python 1_download.py --input approved_urls.txt --max-items 3 --execute --rights-confirmed
```

No cookies or account state are passed to yt-dlp. Use a rights-approved subset, not assumed permission from gallery visibility. Downloads go only to this tool's gitignored `raw_videos/`, never the Avion app. Keep the agreed lifecycle: permitted temporary download → `2_decode.py` → validate numeric structure/tiny permitted thumbnails → bounded deletion of raw files. This folder does not implement or claim to verify the existing decoder or its cleanup. No raw-footage retention in the Structure Library. The download stage does not auto-delete failed inputs or unrelated data.

## Seed evidence / limits (18 September 2026)

- Higgsfield community: https://higgsfield.ai/community — public projects/shots gallery.
- InVideo video gallery: https://invideo.io/ideas/ — public gallery categories.
- Kling: https://kling.ai/explore/kling — public recommended works.
- OpenArt: https://openart.ai/explore — carried from the existing config; current access not yet verified.
- HeyGen collection: https://community.heygen.com/public/collections/made-with-heygen-inspiration — current web lookup redirects to `https://www.heygen.com/geniverse` (learning/events/community). Report this boundary; do not relabel it as a verified video gallery or crawl the full marketing site.

Live UI can change. Keep per-site status honest. Collection does not establish permissions, extractor compatibility, decode success, DNA matching or completeness of a competitor corpus.
