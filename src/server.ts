import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/**
 * "Continue with Google" goes through Lovable's sign-in service, which starts at
 * /~oauth/initiate on the app's own domain. Lovable's hosting forwards those paths;
 * on any other host (Vercel, custom domain) we forward them the same way.
 */
const LOVABLE_OAUTH = "https://oauth.lovable.app";
const LOVABLE_PROJECT_ID = "lovp_2cpv1hg59x9whbb99ff1f9td97";

function lovableOAuthRedirect(request: Request): Response | null {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/~oauth/")) return null;
  const target = new URL(LOVABLE_OAUTH + url.pathname.slice("/~oauth".length) + url.search);
  if (target.pathname === "/initiate" && !target.searchParams.has("project_id")) {
    target.searchParams.set("project_id", LOVABLE_PROJECT_ID);
  }
  return Response.redirect(target.toString(), 302);
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const oauth = lovableOAuthRedirect(request);
    if (oauth) return oauth;
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
