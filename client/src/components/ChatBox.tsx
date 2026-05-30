import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

interface Message {
  id: number;
  role: "user" | "researcher" | "creator" | "critic" | "optimizer";
  content: string;
  createdAt: Date;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getMessagesQuery = trpc.chat.getMessages.useQuery({ sessionId });
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

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
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        sessionId,
        content: userMessage,
      });

      // Refresh messages
      await getMessagesQuery.refetch();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
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
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${roleStyle.bg} flex items-center justify-center`}>
                  <span className="text-lg">{roleStyle.emoji}</span>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${roleStyle.text} mb-1`}>
                    {ROLE_NAMES[message.role]}
                  </p>
                  <div className={`p-4 rounded-lg ${roleStyle.bg} border border-${message.role === 'user' ? 'primary' : 'secondary'}/30`}>
                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
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
