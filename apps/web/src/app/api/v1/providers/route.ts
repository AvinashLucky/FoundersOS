import { ok, problem } from "@/server/http";
import { getSession } from "@/server/auth/session";
import { providerStatus } from "@/server/ai/router";
import { readKeys } from "@/server/ai/keys";
import { TAVILY_KEY_VARS } from "@/server/ai/research-agent";

/**
 * GET /api/v1/providers — which engines are live.
 * Returns only booleans + public hints: NO key material ever crosses this
 * boundary. Powers the Boardroom's Engine panel so the founder can see at a
 * glance whether the company is running on real models or the offline Echo.
 */
export async function GET() {
  const session = getSession();
  if (!session) return problem("UNAUTHORIZED", "Sign in first", 401);

  const providers = providerStatus();
  const live = providers.filter((p) => p.live && p.key !== "echo");

  return ok({
    providers,
    realEngines: live.length,
    /** True when at least one non-Echo provider is configured. */
    isReal: live.length > 0,
    researchLive: readKeys(process.env, TAVILY_KEY_VARS).length > 0,
  });
}
