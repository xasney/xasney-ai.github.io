import { invokeLLM } from "./llm";

export interface StreamMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Streams LLM response tokens progressively
 * Returns an async generator that yields text chunks as they arrive
 */
export async function* streamLLMResponse(messages: StreamMessage[]) {
  try {
    const response = await invokeLLM({
      messages: messages,
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Invalid response content type");
    }

    // For now, we'll simulate streaming by yielding the content in chunks
    // In a production environment with a streaming-capable LLM API,
    // this would yield tokens as they arrive
    const chunkSize = 20; // Characters per chunk
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);
      yield chunk;
      // Small delay to simulate streaming effect
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  } catch (error) {
    console.error("Error streaming LLM response:", error);
    throw error;
  }
}

/**
 * Collects all chunks from a streaming response into a complete string
 */
export async function collectStreamedResponse(
  generator: AsyncGenerator<string, void, unknown>
): Promise<string> {
  let result = "";
  for await (const chunk of generator) {
    result += chunk;
  }
  return result;
}
