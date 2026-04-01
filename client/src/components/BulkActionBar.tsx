/*
 * BulkActionBar — floating toolbar for bulk outreach status updates.
 * Appears when properties are selected; allows marking all filtered or selected properties.
 * Design: Civic Blueprint — dark navy bar with action buttons.
 */

import { CheckSquare, Square, X, ChevronDown, UserCheck } from "lucide-react";
import type { OutreachStatus } from "@/hooks/useOutreachStatus";
import type { TeamMember } from "@/hooks/useTeamAssignments";
import { useState, useRef, useEffect } from "react";

interface BulkActionBarProps {
  selectedIds: Set<number>;
  filteredIds: number[];
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkUpdate: (ids: number[], status: OutreachStatus) => void;
  totalFiltered: number;
  team?: TeamMember[];
  onBulkAssign?: (ids: number[], memberId: string | null) => void;
}

const statusOptions: { value: OutreachStatus; label: string; color: string }[] = [
  { value: "contacted", label: "Contacted", color: "oklch(0.60 0.17 60)" },
  { value: "in_progress", label: "In Progress", color: "oklch(0.55 0.15 240)" },
  { value: "complete", label: "Complete", color: "oklch(0.45 0.15 155)" },
  { value: "none", label: "Clear Status", color: "oklch(0.55 0.02 250)" },
];

export default function BulkActionBar({
  selectedIds,
  filteredIds,
  onSelectAll,
  onDeselectAll,
  onBulkUpdate,
  totalFiltered,
  team,
  onBulkAssign,
}: BulkActionBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const assignDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target as Node)) {
        setShowAssignDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const count = selectedIds.size;
  const allSelected = count > 0 && count === filteredIds.length;

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm px-4 py-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Select controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="flex items-center gap-2 text-sm font-medium text-[oklch(0.30_0.06_250)] hover:text-[oklch(0.22_0.06_250)] transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-4 h-4 text-[oklch(0.45_0.15_155)]" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            {allSelected ? "Deselect All" : `Select All ${totalFiltered.toLocaleString()} Filtered`}
          </button>

          {count > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {count.toLocaleString()} selected
              </span>
              <button
                onClick={onDeselectAll}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </>
          )}
        </div>

        {/* Right: Bulk action dropdowns */}
        {count > 0 && (
          <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.22_0.06_250)] text-white text-sm font-semibold rounded-sm hover:bg-[oklch(0.28_0.06_250)] transition-colors"
            >
              Mark {count.toLocaleString()} as...
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-sm shadow-lg z-50">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onBulkUpdate(Array.from(selectedIds), opt.value);
                      setShowDropdown(false);
                      onDeselectAll();
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Assign dropdown */}
          {team && team.length > 0 && onBulkAssign && (
            <div className="relative" ref={assignDropdownRef}>
              <button
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.35_0.06_250)] text-white text-sm font-semibold rounded-sm hover:bg-[oklch(0.30_0.06_250)] transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Assign {count.toLocaleString()} to...
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showAssignDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-sm shadow-lg z-50">
                  <button
                    onClick={() => {
                      onBulkAssign(Array.from(selectedIds), null);
                      setShowAssignDropdown(false);
                      onDeselectAll();
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 text-muted-foreground"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-300" />
                    Unassign
                  </button>
                  {team.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onBulkAssign(Array.from(selectedIds), m.id);
                        setShowAssignDropdown(false);
                        onDeselectAll();
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
