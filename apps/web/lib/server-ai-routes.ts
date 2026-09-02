import type { ExplainSentenceInput, ExplainWordInput, LanguageModel } from "@korean-learning/ai";
import { LanguageModelError } from "@korean-learning/ai";
import { sentenceExplanationSchema } from "@korean-learning/ai";
import { wordExplanationSchema } from "@korean-learning/ai";

const maxRequestBytes = 32_768;

export async function handleSentenceExplanationRequest(
  request: Request,
  createModel: (reference: string) => LanguageModel
): Promise<Response> {
  const body = await parseRequest(request);
  if (!body.ok) return body.response;
  const { model, sentence, context } = body.value;
  if (!isShortString(model) || !isShortString(sentence) || (context !== undefined && !isShortString(context))) {
    return errorResponse("INVALID_INPUT", "A model and Korean sentence are required.", 400);
  }
  try {
    const explanation = await createModel(model).explainSentence({ sentence, ...(context ? { context } : {}) } satisfies ExplainSentenceInput);
    const parsed = sentenceExplanationSchema.safeParse(explanation);
    if (!parsed.success) return errorResponse("INVALID_OUTPUT", "The AI provider returned an invalid explanation.", 502);
    return Response.json(parsed.data);
  } catch (error) {
    return providerErrorResponse(error);
  }
}

export async function handleWordExplanationRequest(
  request: Request,
  createModel: (reference: string) => LanguageModel
): Promise<Response> {
  const body = await parseRequest(request);
  if (!body.ok) return body.response;
  const { model, word, sentence } = body.value;
  if (!isShortString(model) || !isShortString(word) || !isShortString(sentence)) {
    return errorResponse("INVALID_INPUT", "A model, Korean word, and source sentence are required.", 400);
  }
  try {
    const explanation = await createModel(model).explainWord({ word, sentence } satisfies ExplainWordInput);
    const parsed = wordExplanationSchema.safeParse(explanation);
    if (!parsed.success) return errorResponse("INVALID_OUTPUT", "The AI provider returned an invalid explanation.", 502);
    return Response.json(parsed.data);
  } catch (error) {
    return providerErrorResponse(error);
  }
}

async function parseRequest(request: Request): Promise<{ ok: true; value: Record<string, unknown> } | { ok: false; response: Response }> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxRequestBytes) {
    return { ok: false, response: errorResponse("INVALID_INPUT", "Request body is too large.", 413) };
  }
  let text: string;
  try { text = await request.text(); } catch { return { ok: false, response: errorResponse("INVALID_INPUT", "Request body must be valid JSON.", 400) }; }
  if (new TextEncoder().encode(text).byteLength > maxRequestBytes) {
    return { ok: false, response: errorResponse("INVALID_INPUT", "Request body is too large.", 413) };
  }
  try {
    const value = JSON.parse(text);
    return isRecord(value) ? { ok: true, value } : { ok: false, response: errorResponse("INVALID_INPUT", "Request body must be an object.", 400) };
  } catch { return { ok: false, response: errorResponse("INVALID_INPUT", "Request body must be valid JSON.", 400) }; }
}

function providerErrorResponse(error: unknown): Response {
  if (!(error instanceof LanguageModelError)) return errorResponse("REQUEST_FAILED", "The local AI provider could not be used.", 502);
  const mapping: Record<LanguageModelError["code"], [number, string]> = {
    INVALID_INPUT: [400, error.message],
    PROVIDER_NOT_INSTALLED: [503, "The selected provider is not installed."],
    RUNTIME_DISABLED: [409, "The selected provider runtime is disabled."],
    AUTHENTICATION_FAILED: [401, "The selected provider authentication failed."],
    TIMEOUT: [504, "The selected provider timed out."],
    INVALID_OUTPUT: [502, "The selected provider returned invalid output."],
    REQUEST_FAILED: [502, "The selected provider could not be used."]
  };
  const [status, message] = mapping[error.code];
  return errorResponse(error.code, message, status);
}

function errorResponse(code: string, message: string, status: number): Response {
  return Response.json({ code, message }, { status });
}

function isShortString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 16_000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
