import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createChatSession,
  getChatSessionsByUserId,
  getChatSession,
  addChatMessage,
  getChatMessages,
} from "../db";
import { invokeLLM } from "../_core/llm";

type RoleType = "researcher" | "creator" | "critic" | "optimizer";

const ROLE_PROMPTS: Record<RoleType, string> = {
  researcher: `Du bist der Rechercheur in einem KI-Meeting. Deine Aufgabe ist es, aktuelle Fakten, Daten und relevante Informationen zu sammeln. Antworte prägnant und fokussiert auf die Wissensbasis. Nutze dein Wissen, um die beste verfügbare Information bereitzustellen.`,
  creator: `Du bist der Umsetzer in einem KI-Meeting. Deine Aufgabe ist es, die Rohdaten des Rechercheurs in ein konkretes Produkt, einen Plan oder einen Text umzuwandeln. Sei kreativ und praktisch. Erstelle einen detaillierten, umsetzbaren Entwurf.`,
  critic: `Du bist der kritische Prüfer in einem KI-Meeting. Deine Aufgabe ist es, nach Fehlern, Logiklücken, Sicherheitsrisiken oder unrealistischen Annahmen zu suchen. Spiele "Anwalt des Teufels". Wenn es Probleme gibt, sage klar, was falsch ist und warum es angepasst werden muss.`,
  optimizer: `Du bist der Optimierer in einem KI-Meeting. Deine Aufgabe ist es, dem fehlerfreien Endprodukt den letzten Schliff zu geben. Formatiere die Ausgabe perfekt, verbessere die Lesbarkeit und sorge für eine professionelle Präsentation.`,
};

export const chatRouter = router({
  // Create a new chat session
  createSession: protectedProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await createChatSession(ctx.user!.id, input.title);
      const sessions = await getChatSessionsByUserId(ctx.user!.id);
      return sessions[0];
    }),

  // Get all chat sessions for the current user
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    return await getChatSessionsByUserId(ctx.user!.id);
  }),

  // Get messages from a specific session
  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const session = await getChatSession(input.sessionId);
      if (!session || session.userId !== ctx.user!.id) {
        throw new Error("Unauthorized");
      }
      return await getChatMessages(input.sessionId);
    }),

  // Send a user message and get AI responses from all roles
  sendMessage: protectedProcedure
    .input(z.object({ sessionId: z.number(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await getChatSession(input.sessionId);
      if (!session || session.userId !== ctx.user!.id) {
        throw new Error("Unauthorized");
      }

      // Add user message
      await addChatMessage(input.sessionId, "user", input.content);

      // Get all messages for context
      const allMessages = await getChatMessages(input.sessionId);

      // Generate responses from each role
      const roles: RoleType[] = ["researcher", "creator", "critic", "optimizer"];
      const responses = [];

      for (const role of roles) {
        try {
          const systemPrompt = ROLE_PROMPTS[role];
          
          // Build context from previous messages
          const contextMessages = allMessages
            .map(m => ({
              role: m.role === "user" ? ("user" as const) : ("assistant" as const),
              content: m.content,
            }));

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              ...contextMessages,
            ],
          });

          const responseContent = response.choices[0]?.message?.content;
          if (typeof responseContent !== "string") {
            throw new Error("Invalid response content type");
          }

          await addChatMessage(input.sessionId, role, responseContent);
          responses.push({ role, content: responseContent });
        } catch (error) {
          console.error(`Error generating response for ${role}:`, error);
          const errorMessage = `[Fehler bei der Generierung der ${role}-Antwort]`;
          await addChatMessage(input.sessionId, role, errorMessage);
          responses.push({ role, content: errorMessage });
        }
      }

      return responses;
    }),
});
