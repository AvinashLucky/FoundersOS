# START HERE — your 30 minutes tomorrow

**No Ollama needed.** Your PC only runs the web app; all AI thinking happens in the cloud
on free tiers. Ollama is now *opt-in* and stays off unless you explicitly enable it —
this matters, because a registered-but-unreachable local model would have silently
downgraded every run to the offline engine.

---

## Step 1 · Get your free keys (10 min, do this first)

Open three tabs, create a key in each, paste them somewhere temporary:

| # | Provider | Where | Why it matters |
|---|---|---|---|
| 1 | **Google Gemini** | https://aistudio.google.com/apikey | Free. `gemini-1.5-pro` (0.90 quality) takes the **CEO seat** — real synthesis at $0 |
| 2 | **Groq** | https://console.groq.com/keys | Free + fastest inference anywhere. Departments answer almost instantly |
| 3 | **OpenRouter** | https://openrouter.ai/keys | Free. One key, many `:free` models — your backup when others rate-limit |
| 4 | **Tavily** *(optional)* | https://app.tavily.com/home | 1000 free searches/mo → the Research Agent cites real sources |

You already have the Gemini Pro key — that alone is enough to see everything work.

## Step 2 · Install Node.js (10 min)

Download **LTS** from https://nodejs.org, run the installer, accept defaults.
Open a **new** PowerShell window and check:
```powershell
node --version    # v20.x or v22.x
```

## Step 3 · Install + configure (5 min)

```powershell
cd "C:\Users\Allam Avinash\OneDrive\Desktop\Projects\FoundersOS\apps\web"
npm install
copy .env.example .env.local
notepad .env.local
```

In Notepad fill only these, save, close:
```
GEMINI_API_KEY=<your key>
GROQ_API_KEY=<your key>
OPENROUTER_API_KEY=<your key>
TAVILY_API_KEY=<your key, optional>
AUTH_SECRET=any-long-random-string-you-type-here-32-chars-min
```
Leave `OLLAMA_URL` commented out. Leave `MONGODB_URI` blank (in-memory storage works
perfectly for day one).

## Step 4 · Launch (1 min)

```powershell
npm run dev
```
Open **http://localhost:3000**

## Step 5 · The 5-minute tour (in this exact order)

1. **Sign in** with any email (dev auth — it just creates your workspace).
2. **Boardroom** (top-right link) → the **Engine Room** strip. Every key you added shows
   a lit chip. If they're all dim, your `.env.local` didn't load — restart `npm run dev`.
3. **Create a project** → name it anything, pick a domain (it re-themes the whole app).
4. **Run an intent**: type *"Design the onboarding flow"* → watch it live:
   the COO's activation plan → departments working → **the debate** (pink challenges,
   amber concerns) → the CEO's ruling with a cost receipt.
   *Real models produce varied prose; if you see identical templated sentences, no key
   is loading.*
5. **Research** panel → type a market → cited brief, saved to memory.
6. **`/demo`** → press it and let go. Six acts, self-driving. This is the one you show people.
7. **Freelance Studio** → scout ideas, draft a listing, track where it's posted.

## If something breaks

| Symptom | Fix |
|---|---|
| `node` not recognised | Close and reopen PowerShell (PATH refresh) |
| `npm install` fails with EPERM/locked file | Pause OneDrive sync, retry |
| Port 3000 busy | `npm run dev -- -p 3001` |
| Answers look templated/identical | Key not loaded — check `.env.local` is in `apps/web/`, restart dev server |
| Engine Room all dim | Same as above; the panel reads the server env at request time |

Send me the exact error text and I'll fix it immediately.
