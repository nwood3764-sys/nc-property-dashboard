/*
 * Team Panel Component
 * Manages team members: add/remove members, view workload distribution.
 * Design: Civic Blueprint — compact, professional panel.
 */

import { useState } from "react";
import { UserPlus, X, Users } from "lucide-react";
import type { TeamMember } from "@/hooks/useTeamAssignments";

interface TeamPanelProps {
  team: TeamMember[];
  workload: Record<string, number>;
  totalAssigned: number;
  totalProperties: number;
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
}

export default function TeamPanel({ team, workload, totalAssigned, totalProperties, onAddMember, onRemoveMember }: TeamPanelProps) {
  const [newName, setNewName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = () => {
    if (newName.trim()) {
      onAddMember(newName.trim());
      setNewName("");
    }
  };

  const unassigned = totalProperties - totalAssigned;

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[oklch(0.35_0.06_250)]" />
          <span className="text-sm font-semibold text-foreground">
            Team Members ({team.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {totalAssigned} assigned / {unassigned} unassigned
          </span>
          <span className={`text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t border-border">
          {/* Add Member */}
          <div className="flex items-center gap-2 mt-3 mb-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Add team member name..."
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-[oklch(0.40_0.06_250)]"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-sm bg-[oklch(0.30_0.06_250)] text-white hover:bg-[oklch(0.25_0.06_250)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>

          {/* Team Members List */}
          {team.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No team members yet. Add members to start assigning properties.
            </p>
          ) : (
            <div className="space-y-1.5">
              {team.map((member) => {
                const count = workload[member.id] || 0;
                const pct = totalProperties > 0 ? Math.round((count / totalProperties) * 100) : 0;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-sm bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Color dot + name */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: member.color }}
                    />
                    <span className="text-sm font-medium text-foreground flex-1 truncate">
                      {member.name}
                    </span>

                    {/* Workload bar */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: member.color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-16 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => onRemoveMember(member.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      title={`Remove ${member.name}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {team.length > 0 && (
            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>Total workload: {totalAssigned} properties assigned</span>
              <span>{unassigned} unassigned</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
