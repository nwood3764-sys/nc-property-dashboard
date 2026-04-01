/*
 * Team Assignment Hook
 * Persists team members and per-property assignments to localStorage.
 * Supports add/remove team members, assign/unassign properties, bulk assign, and workload stats.
 */

import { useState, useCallback, useEffect, useMemo } from "react";

const TEAM_KEY = "nc-property-team-members";
const ASSIGN_KEY = "nc-property-assignments";

export interface TeamMember {
  id: string;
  name: string;
  color: string;
}

const TEAM_COLORS = [
  "oklch(0.55 0.20 250)",  // blue
  "oklch(0.55 0.20 150)",  // green
  "oklch(0.55 0.20 25)",   // red
  "oklch(0.55 0.20 50)",   // orange
  "oklch(0.55 0.20 300)",  // purple
  "oklch(0.55 0.20 180)",  // teal
  "oklch(0.55 0.20 340)",  // pink
  "oklch(0.55 0.20 80)",   // yellow-green
];

function loadTeam(): TeamMember[] {
  try {
    const raw = localStorage.getItem(TEAM_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveTeam(team: TeamMember[]) {
  try {
    localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  } catch { /* ignore */ }
}

function loadAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ASSIGN_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveAssignments(assignments: Record<string, string>) {
  try {
    localStorage.setItem(ASSIGN_KEY, JSON.stringify(assignments));
  } catch { /* ignore */ }
}

export function useTeamAssignments() {
  const [team, setTeam] = useState<TeamMember[]>(loadTeam);
  const [assignments, setAssignments] = useState<Record<string, string>>(loadAssignments);

  useEffect(() => { saveTeam(team); }, [team]);
  useEffect(() => { saveAssignments(assignments); }, [assignments]);

  const addMember = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setTeam((prev) => {
      if (prev.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      const color = TEAM_COLORS[prev.length % TEAM_COLORS.length];
      const id = `tm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      return [...prev, { id, name: trimmed, color }];
    });
  }, []);

  const removeMember = useCallback((memberId: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== memberId));
    // Also remove all assignments for this member
    setAssignments((prev) => {
      const next: Record<string, string> = {};
      for (const [propId, mId] of Object.entries(prev)) {
        if (mId !== memberId) next[propId] = mId;
      }
      return next;
    });
  }, []);

  const getAssignment = useCallback(
    (propertyId: number): string | null => {
      return assignments[String(propertyId)] || null;
    },
    [assignments]
  );

  const getAssignedMember = useCallback(
    (propertyId: number): TeamMember | null => {
      const memberId = assignments[String(propertyId)];
      if (!memberId) return null;
      return team.find((m) => m.id === memberId) || null;
    },
    [assignments, team]
  );

  const assignProperty = useCallback(
    (propertyId: number, memberId: string | null) => {
      setAssignments((prev) => {
        const next = { ...prev };
        if (memberId === null) {
          delete next[String(propertyId)];
        } else {
          next[String(propertyId)] = memberId;
        }
        return next;
      });
    },
    []
  );

  const bulkAssign = useCallback(
    (propertyIds: number[], memberId: string | null) => {
      setAssignments((prev) => {
        const next = { ...prev };
        propertyIds.forEach((id) => {
          if (memberId === null) {
            delete next[String(id)];
          } else {
            next[String(id)] = memberId;
          }
        });
        return next;
      });
    },
    []
  );

  const getWorkload = useMemo(() => {
    const workload: Record<string, number> = {};
    team.forEach((m) => { workload[m.id] = 0; });
    Object.values(assignments).forEach((memberId) => {
      if (workload[memberId] !== undefined) workload[memberId]++;
    });
    return workload;
  }, [team, assignments]);

  const totalAssigned = useMemo(() => {
    return Object.keys(assignments).length;
  }, [assignments]);

  return {
    team,
    addMember,
    removeMember,
    getAssignment,
    getAssignedMember,
    assignProperty,
    bulkAssign,
    getWorkload,
    totalAssigned,
    assignments,
  };
}
