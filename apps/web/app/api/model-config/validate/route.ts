import { isProviderKey, type ProviderKey } from "@korean-learning/ai";
import { probeCliProvider } from "@korean-learning/ai/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ProviderValidationResult {
  ok: boolean;
  status:
    | "ready"
    | "needs_setup"
    | "not_installed"
    | "sign_in_required"
    | "auth_failed"
    | "unreachable"
    | "runtime_disabled";
  message: string;
  version?: string;
}

export async function POST(request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, status: "unreachable", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const provider = typeof body.provider === "string" ? body.provider : "";
  if (!isProviderKey(provider)) {
    return Response.json(
      { ok: false, status: "unreachable", message: "Unknown AI provider." },
      { status: 400 }
    );
  }

  const result = await validateProviderConnection(provider, {
    apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
    baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : undefined
  });

  return Response.json(result);
}

export async function validateProviderConnection(
  provider: ProviderKey,
  options: {
    apiKey?: string;
    baseUrl?: string;
    fetch?: typeof fetch;
  } = {}
): Promise<ProviderValidationResult> {
  if (provider === "antigravity_cli") {
    return {
      ok: false,
      status: "runtime_disabled",
      message: "Antigravity CLI is experimental and runtime disabled."
    };
  }

  if (provider === "openai-compatible") {
    const apiKey = options.apiKey?.trim();
    if (!apiKey) {
      return {
        ok: false,
        status: "needs_setup",
        message: "An API key is required."
      };
    }

    const baseUrl = (options.baseUrl?.trim() || "https://api.openai.com/v1").replace(/\/+$/, "");
    const endpoint = `${baseUrl}/models`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const doFetch = options.fetch ?? fetch;

    try {
      const response = await doFetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`
        },
        signal: controller.signal
      });

      if (response.ok) {
        return {
          ok: true,
          status: "ready",
          message: "Connection verified."
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          status: "auth_failed",
          message: "Authentication failed. Check your API key."
        };
      }

      return {
        ok: false,
        status: "unreachable",
        message: `Endpoint returned HTTP ${response.status}.`
      };
    } catch (error) {
      if (controller.signal.aborted) {
        return {
          ok: false,
          status: "unreachable",
          message: "Connection timed out."
        };
      }
      return {
        ok: false,
        status: "unreachable",
        message: "Could not connect to the API endpoint."
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  if (provider === "claude_cli" || provider === "codex_cli") {
    const probe = await probeCliProvider(provider);
    if (probe.status === "not_installed") {
      return {
        ok: false,
        status: "not_installed",
        message: `${provider === "claude_cli" ? "Claude Code" : "Codex"} is not installed.`
      };
    }

    if (probe.status === "runtime_disabled") {
      return {
        ok: false,
        status: "runtime_disabled",
        message: "Local CLI execution is disabled on this server."
      };
    }

    if (probe.status === "ready") {
      return {
        ok: true,
        status: "ready",
        message: "Executable is ready.",
        ...(probe.version ? { version: probe.version } : {})
      };
    }

    return {
      ok: false,
      status: "unreachable",
      message: probe.error ?? "Provider is unavailable."
    };
  }

  return {
    ok: false,
    status: "unreachable",
    message: "Provider is unavailable."
  };
}
