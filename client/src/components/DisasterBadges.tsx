import type { Property } from "@/lib/types";

interface DisasterBadgesProps {
  property: Property;
}

export default function DisasterBadges({ property }: DisasterBadgesProps) {
  const badges: { label: string; active: boolean; color: string }[] = [
    { label: "Helene '24", active: property.helene_affected, color: "oklch(0.50 0.20 25)" },
    { label: "Florence '18", active: property.florence_affected, color: "oklch(0.55 0.15 240)" },
    { label: "Matthew '16", active: property.matthew_affected, color: "oklch(0.50 0.12 250)" },
    { label: "Dorian '19", active: property.dorian_affected, color: "oklch(0.55 0.10 200)" },
  ];

  const activeBadges = badges.filter((b) => b.active);
  if (activeBadges.length === 0) {
    return <span className="text-xs text-muted-foreground">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {activeBadges.map((b) => (
        <span
          key={b.label}
          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded-sm text-white"
          style={{ backgroundColor: b.color }}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
