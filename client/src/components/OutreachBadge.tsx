/*
 * OutreachBadge — Inline dropdown for setting outreach status per property.
 * Design: Civic Blueprint — compact, color-coded pill with dropdown.
 */

import type { OutreachStatus } from "@/hooks/useOutreachStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OutreachBadgeProps {
  status: OutreachStatus;
  onChange: (status: OutreachStatus) => void;
}

const statusConfig: Record<OutreachStatus, { label: string; bg: string; text: string; dot: string }> = {
  none: {
    label: "Not Started",
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-gray-400",
  },
  target: {
    label: "Target",
    bg: "bg-[oklch(0.92_0.08_330)]",
    text: "text-[oklch(0.30_0.12_330)]",
    dot: "bg-[oklch(0.55_0.20_330)]",
  },
  contacted: {
    label: "Contacted",
    bg: "bg-[oklch(0.92_0.06_70)]",
    text: "text-[oklch(0.35_0.12_70)]",
    dot: "bg-[oklch(0.60_0.17_60)]",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-[oklch(0.92_0.06_250)]",
    text: "text-[oklch(0.30_0.10_250)]",
    dot: "bg-[oklch(0.55_0.15_240)]",
  },
  complete: {
    label: "Complete",
    bg: "bg-[oklch(0.92_0.08_155)]",
    text: "text-[oklch(0.30_0.12_155)]",
    dot: "bg-[oklch(0.45_0.15_155)]",
  },
};

export default function OutreachBadge({ status, onChange }: OutreachBadgeProps) {
  const config = statusConfig[status];

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        value={status}
        onValueChange={(val) => onChange(val as OutreachStatus)}
      >
        <SelectTrigger
          className={`h-7 min-w-[100px] max-w-[130px] text-xs font-semibold border-0 ${config.bg} ${config.text} gap-1 px-2 rounded-sm shadow-none focus:ring-1`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Not Started
            </span>
          </SelectItem>
          <SelectItem value="target">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.20_330)]" />
              Target
            </span>
          </SelectItem>
          <SelectItem value="contacted">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.60_0.17_60)]" />
              Contacted
            </span>
          </SelectItem>
          <SelectItem value="in_progress">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.55_0.15_240)]" />
              In Progress
            </span>
          </SelectItem>
          <SelectItem value="complete">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[oklch(0.45_0.15_155)]" />
              Complete
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
