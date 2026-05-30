import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, LogOut, Settings, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface Role {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  task: string;
  focus: string;
}

const ROLES: Role[] = [
  {
    id: "researcher",
    emoji: "🔍",
    title: "Der Rechercheur",
    subtitle: "The Researcher",
    task: "Sucht nach aktuellen Fakten, Daten oder Code-Beispielen im Internet.",
    focus: "Filtert das Rauschen heraus und liefert die rohe Wissensbasis.",
  },
  {
    id: "creator",
    emoji: "📝",
    title: "Der Umsetzer",
    subtitle: "The Creator / Writer",
    task: "Nimmt die Rohdaten des Rechercheurs und baut daraus das gewünschte Produkt.",
    focus: "Schreibt den eigentlichen Text, programmiert das Skript oder entwirft den Plan.",
  },
  {
    id: "critic",
    emoji: "⚖️",
    title: "Der kritische Prüfer",
    subtitle: "The Critic / Fact-Checker",
    task: "Sucht gezielt nach Fehlern, Logiklücken, Sicherheitsrisiken oder Halluzinationen.",
    focus: "Spielt 'Anwalt des Teufels' und schickt den Entwurf bei Mängeln zur Korrektur zurück.",
  },
  {
    id: "optimizer",
    emoji: "💎",
    title: "Der Optimierer",
    subtitle: "The Editor / Polisher",
    task: "Gibt dem fehlerfreien Endprodukt den letzten Schliff.",
    focus: "Formatiert die Ausgabe und sorgt für perfekte Lesbarkeit.",
  },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();
  const [, navigate] = useLocation();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/");
  };

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).mermaid) {
      (window as any).mermaid.contentLoaded();
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-foreground neon-cyan">Initialisiere System...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="hud-border-cyan p-8 mb-8">
            <h1 className="text-4xl font-bold neon-cyan mb-2 text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              KI-MEETING
            </h1>
            <p className="text-center text-muted-foreground">
              Sichere Authentifizierung erforderlich
            </p>
          </div>
          <a href={getLoginUrl()}>
            <Button className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground neon-glow">
              <Zap className="mr-2 w-5 h-5" />
              Mit Manus anmelden
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground scan-lines">
      {/* Header */}
      <header className="border-b border-primary/30 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-primary neon-glow" />
            <h1 className="text-2xl font-bold neon-glow" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              KI-MEETING
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="text-secondary hover:text-primary"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-destructive hover:text-destructive/80"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <section className="mb-16">
          <div className="hud-border-cyan p-8 mb-8">
            <h2 className="text-3xl md:text-4xl font-bold neon-cyan mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              WILLKOMMEN, {user?.name?.toUpperCase() || "AGENT"}
            </h2>
            <p className="text-secondary text-lg">
              Ihr privates KI-Meeting Workflow-System
            </p>
          </div>
        </section>

        {/* Roles Grid */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold neon-glow mb-8" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            DIE VIER ROLLEN
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map((role) => (
              <div
                key={role.id}
                className="hud-border p-6 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {role.emoji}
                </div>
                <h4 className="text-lg font-bold text-primary mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {role.title}
                </h4>
                <p className="text-xs text-secondary mb-4">{role.subtitle}</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                      Aufgabe
                    </p>
                    <p className="text-foreground">{role.task}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                      Fokus
                    </p>
                    <p className="text-foreground">{role.focus}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Workflow Diagram Section */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold neon-cyan mb-8" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            WORKFLOW-PROZESS
          </h3>
          <div className="hud-border-cyan p-8 mb-8 overflow-x-auto">
            <div className="mermaid">
              {`graph TD
    Start(["<b>Nutzer-Anfrage</b><br/>Plane meinen Urlaub in Italien"]) --> R["🔍 <b>Rechercheur</b><br/>Sammelt Fakten & Daten"]
    R --> C["📝 <b>Umsetzer</b><br/>Erstellt ersten Entwurf"]
    C --> CR["⚖️ <b>Prüfer</b><br/>Prüft auf Fehler & Logik"]
    
    CR -->|"Fehler gefunden<br/>(Veto)"| C
    CR -->|"Fehlerfrei"| O["💎 <b>Optimierer</b><br/>Feinschliff & Formatierung"]
    
    O --> End(["<b>Finales Produkt</b><br/>Übersichtliche Tabelle"])

    style Start fill:#ff006e,stroke:#fff,color:#fff,stroke-width:2px
    style End fill:#00ffff,stroke:#000,color:#000,stroke-width:2px
    style R fill:#0f1429,stroke:#00ffff,stroke-width:2px,color:#00ffff
    style C fill:#0f1429,stroke:#ff006e,stroke-width:2px,color:#ff006e
    style CR fill:#0f1429,stroke:#ff006e,stroke-width:3px,color:#ff006e
    style O fill:#0f1429,stroke:#00ffff,stroke-width:2px,color:#00ffff`}
            </div>
          </div>

          <div className="hud-border-cyan p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center flex-shrink-0 neon-glow">
                  <span className="text-primary font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Anfrage
                  </h4>
                  <p className="text-foreground">Der Nutzer stellt eine Anfrage oder ein Problem.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center flex-shrink-0 neon-cyan">
                  <span className="text-secondary font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-bold text-secondary mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Recherche
                  </h4>
                  <p className="text-foreground">
                    Der Rechercheur sammelt aktuelle Fakten, Daten und Beispiele.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center flex-shrink-0 neon-glow">
                  <span className="text-primary font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Umsetzung
                  </h4>
                  <p className="text-foreground">
                    Der Umsetzer erstellt einen ersten Entwurf basierend auf den Daten.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/20 border border-destructive flex items-center justify-center flex-shrink-0">
                  <span className="text-destructive font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-bold text-destructive mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Prüfung
                  </h4>
                  <p className="text-foreground">
                    Der Prüfer sucht nach Fehlern und Logiklücken. Falls nötig → Zurück zu Schritt 3.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 border border-secondary flex items-center justify-center flex-shrink-0 neon-cyan">
                  <span className="text-secondary font-bold">5</span>
                </div>
                <div>
                  <h4 className="font-bold text-secondary mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Optimierung
                  </h4>
                  <p className="text-foreground">
                    Der Optimierer gibt dem Produkt den letzten Schliff und formatiert es perfekt.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary flex items-center justify-center flex-shrink-0 neon-glow">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-bold text-primary mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Fertig
                  </h4>
                  <p className="text-foreground">
                    Das finale, optimierte Produkt ist bereit für die Verwendung.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Example Section */}
        <section className="mb-16">
          <h3 className="text-2xl font-bold neon-cyan mb-8" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            PRAKTISCHES BEISPIEL
          </h3>
          <div className="hud-border p-8">
            <div className="mb-6">
              <p className="text-lg text-primary neon-glow" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Szenario: "Plane meinen nächsten Urlaub in Italien"
              </p>
            </div>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  🔍 Rechercheur
                </p>
                <p className="text-foreground">
                  Findet aktuelle Geheimtipps, Event-Daten und Flugpreise für die Region.
                </p>
              </div>

              <div className="border-l-4 border-secondary pl-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  📝 Umsetzer
                </p>
                <p className="text-foreground">
                  Erstellt eine erste Reiseroute mit Übernachtungen, Aktivitäten und Restaurants.
                </p>
              </div>

              <div className="border-l-4 border-destructive pl-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  ⚖️ Prüfer
                </p>
                <p className="text-foreground">
                  <strong>VETO!</strong> "Die Route an Tag 3 ist zeitlich unmöglich – die Fahrzeit
                  zwischen den Städten ist zu lang. Bitte anpassen."
                </p>
              </div>

              <div className="border-l-4 border-secondary pl-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  📝 Umsetzer (Korrektur)
                </p>
                <p className="text-foreground">
                  Überarbeitet die Route und verteilt die Aktivitäten realistischer.
                </p>
              </div>

              <div className="border-l-4 border-primary pl-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                  💎 Optimierer
                </p>
                <p className="text-foreground">
                  Packt alles in eine übersichtliche Tabelle mit Packliste, Budgetplan und
                  Notfall-Kontakten.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Settings Panel */}
        {showSettings && (
          <section className="mb-16">
            <h3 className="text-2xl font-bold neon-glow mb-8" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              EINSTELLUNGEN
            </h3>
            <div className="hud-border p-8">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                    Benutzerinformationen
                  </p>
                  <p className="text-foreground">
                    <strong>Name:</strong> {user?.name}
                  </p>
                  <p className="text-foreground">
                    <strong>E-Mail:</strong> {user?.email}
                  </p>
                  <p className="text-foreground">
                    <strong>Rolle:</strong> {user?.role}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/30 py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>KI-Meeting Workflow System v1.0</p>
          <p className="mt-2">Sichere Authentifizierung via Manus OAuth</p>
        </div>
      </footer>
    </div>
  );
}
