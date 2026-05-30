import { describe, expect, it } from "vitest";
import { collectStreamedResponse } from "./llmStreaming";

describe("llmStreaming", () => {
  it("should collect all chunks from a streaming response", async () => {
    // Create a mock async generator
    async function* mockGenerator() {
      yield "Hello ";
      yield "World";
      yield "!";
    }

    const result = await collectStreamedResponse(mockGenerator());
    expect(result).toBe("Hello World!");
  });

  it("should handle empty streams", async () => {
    async function* emptyGenerator() {
      // Empty generator
    }

    const result = await collectStreamedResponse(emptyGenerator());
    expect(result).toBe("");
  });

  it("should concatenate multiple chunks in order", async () => {
    async function* multiChunkGenerator() {
      yield "The ";
      yield "quick ";
      yield "brown ";
      yield "fox";
    }

    const result = await collectStreamedResponse(multiChunkGenerator());
    expect(result).toBe("The quick brown fox");
  });
});
