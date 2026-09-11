export function ProgressBar({
  label,
  value,
  target,
  unit,
  tone,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  tone: "accent" | "protein";
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = target > 0 && value > target;
  const fillClass = over ? "bg-warning" : tone === "accent" ? "bg-accent" : "bg-protein";

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={over ? "font-medium text-warning" : "text-muted-foreground"}>
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full transition-all ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
