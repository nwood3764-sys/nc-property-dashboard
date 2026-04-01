/*
 * Assignment Badge Component
 * Compact dropdown for assigning a property to a team member.
 * Design: Civic Blueprint — minimal, color-coded by team member.
 */

import { useState, useRef, useEffect } from "react";
import { UserCheck, UserX } from "lucide-react";
import type { TeamMember } from "@/hooks/useTeamAssignments";

interface AssignmentBadgeProps {
  assignedMember: TeamMember | null;
  team: TeamMember[];
  onAssign: (memberId: string | null) => void;
}

export default function AssignmentBadge({ assignedMember, team, onAssign }: AssignmentBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (team.length === 0) {
    return (
      <span className="text-xs text-muted-foreground italic">No team</span>
    );
  }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
          assignedMember
            ? "text-white hover:opacity-90"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
        style={assignedMember ? { backgroundColor: assignedMember.color } : undefined}
      >
        {assignedMember ? (
          <>
            <UserCheck className="w-3 h-3" />
            <span className="max-w-[80px] truncate">{assignedMember.name}</span>
          </>
        ) : (
          <>
            <UserX className="w-3 h-3" />
            Assign
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-white border border-border rounded-sm shadow-lg py-1 max-h-60 overflow-y-auto">
          {/* Unassign option */}
          {assignedMember && (
            <button
              onClick={() => { onAssign(null); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <UserX className="w-3 h-3" />
              Unassign
            </button>
          )}

          {/* Team members */}
          {team.map((member) => (
            <button
              key={member.id}
              onClick={() => { onAssign(String(member.id)); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${
                assignedMember?.id === member.id ? "bg-muted/30 font-semibold" : ""
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: member.color }}
              />
              <span className="truncate">{member.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
