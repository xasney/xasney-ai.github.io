import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChatBox } from "@/components/ChatBox";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function ChatPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [showNewSession, setShowNewSession] = useState(false);

  const sessionsQuery = trpc.chat.getSessions.useQuery();
  const createSessionMutation = trpc.chat.createSession.useMutation();
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;

    try {
      const session = await createSessionMutation.mutateAsync({
        title: newSessionTitle,
      });
      setNewSessionTitle("");
      setShowNewSession(false);
      setActiveSessionId(session.id);
      await sessionsQuery.refetch();
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground scan-lines flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-primary/30 bg-background/80 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-primary/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="w-full justify-start text-secondary hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <h2 className="text-lg font-bold neon-cyan" style={{ fontFamily: "Orbitron, sans-serif" }}>
            MEETINGS
          </h2>
        </div>

        {/* New Session Button */}
        <div className="p-4 border-b border-primary/30">
          {!showNewSession ? (
            <Button
              onClick={() => setShowNewSession(true)}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground neon-glow"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neues Meeting
            </Button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="Meeting-Name..."
                className="w-full px-3 py-2 bg-input border border-primary/30 rounded text-foreground text-sm"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateSession();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateSession}
                  disabled={!newSessionTitle.trim()}
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Erstellen
                </Button>
                <Button
                  onClick={() => setShowNewSession(false)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessionsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-secondary" />
            </div>
          ) : sessionsQuery.data && sessionsQuery.data.length > 0 ? (
            sessionsQuery.data.map((session: any) => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  activeSessionId === session.id
                    ? "bg-primary/20 border border-primary text-primary"
                    : "bg-muted/20 border border-primary/10 text-foreground hover:bg-muted/30"
                }`}
              >
                <p className="text-sm font-semibold truncate">{session.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(session.createdAt).toLocaleDateString("de-DE")}
                </p>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Meetings vorhanden
            </p>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeSessionId ? (
          <ChatBox sessionId={activeSessionId} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold neon-cyan mb-4" style={{ fontFamily: "Orbitron, sans-serif" }}>
                WILLKOMMEN ZUM KI-MEETING
              </h1>
              <p className="text-muted-foreground mb-8">
                Erstellen Sie ein neues Meeting oder wählen Sie ein bestehendes aus der Liste.
              </p>
              <Button
                onClick={() => setShowNewSession(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow"
              >
                <Plus className="w-4 h-4 mr-2" />
                Erstes Meeting starten
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
