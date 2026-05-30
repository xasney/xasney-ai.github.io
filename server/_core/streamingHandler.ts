import { Response } from "express";
import { streamLLMResponse, collectStreamedResponse } from "./llmStreaming";

export interface StreamMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Sends streaming response to client via Server-Sent Events (SSE)
 */
export async function sendStreamingResponse(
  res: Response,
  messages: StreamMessage[]
) {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const generator = streamLLMResponse(messages);

    for await (const chunk of generator) {
      // Send data as SSE format
      res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error in streaming response:", error);
    res.write(
      `data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`
    );
    res.end();
  }
}

/**
 * Collects a complete streamed response
 */
export async function getCompleteStreamedResponse(
  messages: StreamMessage[]
): Promise<string> {
  const generator = streamLLMResponse(messages);
  return await collectStreamedResponse(generator);
}
