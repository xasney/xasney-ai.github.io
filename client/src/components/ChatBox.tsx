import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Message {
  id: number;
  role: "user" | "researcher" | "creator" | "critic" | "optimizer";
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}

const ROLE_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  user: { bg: "bg-primary/20", text: "text-primary", emoji: "👤" },
  researcher: { bg: "bg-cyan-900/30", text: "text-secondary", emoji: "🔍" },
  creator: { bg: "bg-blue-900/30", text: "text-blue-400", emoji: "📝" },
  critic: { bg: "bg-red-900/30", text: "text-red-400", emoji: "⚖️" },
  optimizer: { bg: "bg-green-900/30", text: "text-green-400", emoji: "💎" },
};

const ROLE_NAMES: Record<string, string> = {
  user: "Sie",
  researcher: "Rechercheur",
  creator: "Umsetzer",
  critic: "Prüfer",
  optimizer: "Optimierer",
};

interface ChatBoxProps {
  sessionId: number;
}

export function ChatBox({ sessionId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingRoles, setStreamingRoles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getMessagesQuery = trpc.chat.getMessages.useQuery({ sessionId });

  // Load messages on mount
  useEffect(() => {
    if (getMessagesQuery.data) {
      setMessages(
        getMessagesQuery.data.map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
        }))
      );
    }
  }, [getMessagesQuery.data]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingRoles]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);
    setError(null);
    setStreamingRoles(new Set(["researcher", "creator", "critic", "optimizer"]));

    try {
      // Add user message immediately
      const userMsg: Message = {
        id: Date.now(),
        role: "user",
        content: userMessage,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Connect to SSE endpoint
      const response = await fetch("/api/streaming/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          content: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const roleMessages: Record<string, string> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines[lines.length - 1];

        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "role_start") {
                // Initialize role message
                roleMessages[event.role] = "";
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now() + Math.random(),
                    role: event.role,
                    content: "",
                    createdAt: new Date(),
                    isStreaming: true,
                  },
                ]);
              } else if (event.type === "token") {
                // Append token to role message
                roleMessages[event.role] = (roleMessages[event.role] || "") + event.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.role === event.role && m.isStreaming
                      ? { ...m, content: roleMessages[event.role] }
                      : m
                  )
                );
              } else if (event.type === "role_complete") {
                // Mark role as done streaming
                setMessages((prev) =>
                  prev.map((m) =>
                    m.role === event.role && m.isStreaming
                      ? { ...m, isStreaming: false }
                      : m
                  )
                );
                setStreamingRoles((prev) => {
                  const next = new Set(prev);
                  next.delete(event.role);
                  return next;
                });
              } else if (event.type === "error") {
                console.error(`Error from ${event.role}:`, event.message);
                toast.error(`Fehler bei ${ROLE_NAMES[event.role]}: ${event.message}`);
              } else if (event.type === "complete") {
                // All roles done
                setIsLoading(false);
                await getMessagesQuery.refetch();
              }
            } catch (parseError) {
              console.error("Failed to parse SSE event:", parseError);
            }
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(errorMsg);
      toast.error(`Fehler beim Senden der Nachricht: ${errorMsg}`);
      console.error("Error sending message:", err);
    } finally {
      setIsLoading(false);
      setStreamingRoles(new Set());
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Starten Sie ein Meeting, indem Sie eine Frage eingeben...</p>
          </div>
        ) : (
          messages.map((message) => {
            const roleStyle = ROLE_COLORS[message.role] || ROLE_COLORS.user;
            return (
              <div key={message.id} className="flex gap-3 animate-fadeIn">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg ${roleStyle.bg} flex items-center justify-center ${
                    message.isStreaming ? "animate-pulse" : ""
                  }`}
                >
                  <span className="text-lg">{roleStyle.emoji}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${roleStyle.text} mb-1`}>
                    {ROLE_NAMES[message.role]}
                    {message.isStreaming && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (Schreiben...)
                      </span>
                    )}
                  </p>
                  <div
                    className={`p-4 rounded-lg ${roleStyle.bg} border border-${
                      message.role === "user" ? "primary" : "secondary"
                    }/30`}
                  >
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                      {message.isStreaming && (
                        <span className="animate-blink">▌</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(message.createdAt).toLocaleTimeString("de-DE")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {error && (
          <div className="flex gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Fehler</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-primary/30 p-4 bg-background/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Geben Sie Ihre Frage ein..."
            disabled={isLoading}
            className="bg-input border-primary/30 text-foreground placeholder-muted-foreground"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
