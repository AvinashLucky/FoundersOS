# RaKeGa

Teach live, sell recorded AI courses, and deliver agency work through vetted developers, all on one platform.

**Status:** planned. Start with `details/brief.md` (plan, cycles, decisions) and `CLAUDE.md` (build rules).

| App | Folder | Port |
|---|---|---|
| Web app | `frontend/` | 5111 |
| API | `backend/` | 4111 |

`frontend/` and `backend/` are created in cycle 1. Each step's setup commands are added here
then, so this file never describes code that doesn't exist yet.

**Costs $0 until launch.** Every service is optional and sits behind a seam; with no keys
set, the app uses its local or simulated version (`details/brief.md` §11). Accounts to
create when you want the real thing:
- **LiveKit**: the open-source dev server runs locally; LiveKit Cloud Build plan is free.
- **Cloudflare R2**: free tier for course video at launch.
- **Razorpay**: test keys.
- **Telegram bot**: from @BotFather; carries delivery records to you.
- **Gemini API key**: optional.
- **A domain + mailbox**: the only unavoidable launch cost; needed for Reach email.
