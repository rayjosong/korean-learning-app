import { createServerLanguageModel } from "@korean-learning/ai/server";
import { handleSentenceExplanationRequest } from "@/lib/server-ai-routes";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleSentenceExplanationRequest(request, createServerLanguageModel);
}
