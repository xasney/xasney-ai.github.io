interface RoleDetailCardProps {
  emoji: string;
  title: string;
  subtitle: string;
  task: string;
  focus: string;
}

export function RoleDetailCard({
  emoji,
  title,
  subtitle,
  task,
  focus,
}: RoleDetailCardProps) {
  return (
    <div className="hud-border p-6 hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 group">
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
        {emoji}
      </div>
      <h4 className="text-lg font-bold text-primary mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
        {title}
      </h4>
      <p className="text-xs text-secondary mb-4">{subtitle}</p>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
            Aufgabe
          </p>
          <p className="text-foreground">{task}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
            Fokus
          </p>
          <p className="text-foreground">{focus}</p>
        </div>
      </div>
    </div>
  );
}
