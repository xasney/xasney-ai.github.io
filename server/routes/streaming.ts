import { Router, Request, Response } from "express";
import { sdk } from "../_core/sdk";
import {
  getChatSession,
  addChatMessage,
  getChatMessages,
} from "../db";
import { streamLLMResponse } from "../_core/llmStreaming";

type RoleType = "researcher" | "creator" | "critic" | "optimizer";

const ROLE_PROMPTS: Record<RoleType, string> = {
  researcher: `Du bist der Rechercheur in einem KI-Meeting. Deine Aufgabe ist es, aktuelle Fakten, Daten und relevante Informationen zu sammeln. Antworte prägnant und fokussiert auf die Wissensbasis.`,
  creator: `Du bist der Umsetzer in einem KI-Meeting. Deine Aufgabe ist es, die Rohdaten des Rechercheurs in ein konkretes Produkt umzuwandeln. Sei kreativ und praktisch.`,
  critic: `Du bist der kritische Prüfer in einem KI-Meeting. Deine Aufgabe ist es, nach Fehlern und Logiklücken zu suchen. Spiele "Anwalt des Teufels".`,
  optimizer: `Du bist der Optimierer in einem KI-Meeting. Deine Aufgabe ist es, dem Endprodukt den letzten Schliff zu geben. Formatiere perfekt.`,
};

export const streamingRouter = Router();

/**
 * POST /api/streaming/chat/send
 * Streams AI responses for all four roles via Server-Sent Events
 */
streamingRouter.post("/chat/send", async (req: Request, res: Response) => {
  try {
    // Verify authentication
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { sessionId, content } = req.body;

    if (!sessionId || !content) {
      res.status(400).json({ error: "Missing sessionId or content" });
      return;
    }

    // Verify session ownership
    const session = await getChatSession(sessionId);
    if (!session || session.userId !== user.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Add user message
    await addChatMessage(sessionId, "user", content);

    // Get all messages for context
    const allMessages = await getChatMessages(sessionId);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Stream responses from each role
    const roles: RoleType[] = ["researcher", "creator", "critic", "optimizer"];

    for (const role of roles) {
      try {
        const systemPrompt = ROLE_PROMPTS[role];

        // Build context
        const contextMessages = allMessages.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));

        // Send role start event
        res.write(
          `data: ${JSON.stringify({ type: "role_start", role })}\n\n`
        );

        // Stream the response
        const generator = streamLLMResponse([
          { role: "system", content: systemPrompt },
          ...contextMessages,
        ]);

        let completeResponse = "";
        for await (const chunk of generator) {
          completeResponse += chunk;
          // Send each chunk as an SSE event
          res.write(
            `data: ${JSON.stringify({ type: "token", role, token: chunk })}\n\n`
          );
        }

        // Save complete response to database
        await addChatMessage(sessionId, role, completeResponse);

        // Send role complete event
        res.write(
          `data: ${JSON.stringify({ type: "role_complete", role })}\n\n`
        );
      } catch (error) {
        console.error(`Error streaming role ${role}:`, error);
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            role,
            message: `Failed to generate ${role} response`,
          })}\n\n`
        );
      }
    }

    // Send final completion event
    res.write(`data: ${JSON.stringify({ type: "complete" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Streaming error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
