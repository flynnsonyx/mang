import { createOpenAI } from "npm:@ai-sdk/openai";
import { streamText, type ModelMessage, type Output } from "npm:ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.ts";

export interface ResponsesCallConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

export function createResponsesCall(
  request: Request,
  config: ResponsesCallConfig,
  messages: ModelMessage[],
  system?: string,
  output?: Output,
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: `${config.baseURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const reasoning = config.model !== "openai/chat-latest";
  const result = streamText({
    model: provider.responses(config.model),
    // AI SDK 6+ lacks `instructions`: pass the system prompt via `system`.
    ...(system ? { system } : {}),
    messages,
    abortSignal: request.signal,
    ...(output ? { output } : {}),
    providerOptions: {
      openai: {
        store: false,
        ...(reasoning
          ? {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            }
          : {}),
      },
    },
  });
  return {
    result,
    response: (init?: HeadersInit) =>
      withLovableAiGatewayRunIdHeader(
        result.toUIMessageStreamResponse({ sendReasoning: true }),
        runIdFetch,
        init,
      ),
    runIdFetch,
  };
}
