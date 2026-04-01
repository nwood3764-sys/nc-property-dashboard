/*
 * Team Assignment Hook
 * Persists team members and per-property assignments to the backend database via tRPC.
 * Supports add/remove team members, assign/unassign properties, bulk assign, and workload stats.
 */

import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";

export interface TeamMember {
  id: number;
  name: string;
  color: string;
}

const TEAM_COLORS = [
  "oklch(0.55 0.20 250)", // blue
  "oklch(0.55 0.20 150)", // green
  "oklch(0.55 0.20 25)",  // red
  "oklch(0.55 0.20 50)",  // orange
  "oklch(0.55 0.20 300)", // purple
  "oklch(0.55 0.20 180)", // teal
  "oklch(0.55 0.20 340)", // pink
  "oklch(0.55 0.20 80)",  // yellow-green
];

export function useTeamAssignments() {
  const utils = trpc.useUtils();

  // Queries
  const { data: teamRows = [], isLoading: teamLoading } = trpc.team.getAll.useQuery();
  const { data: assignmentMap = {}, isLoading: assignmentsLoading } = trpc.assignments.getAll.useQuery();

  // Map DB rows to TeamMember interface
  const team: TeamMember[] = useMemo(
    () => teamRows.map((r) => ({ id: r.id, name: r.name, color: r.color })),
    [teamRows]
  );

  // Assignments map: { propertyId string -> memberId number }
  const assignments: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [propId, memberId] of Object.entries(assignmentMap)) {
      map[propId] = String(memberId);
    }
    return map;
  }, [assignmentMap]);

  // Mutations
  const addMemberMutation = trpc.team.add.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
    },
  });

  const removeMemberMutation = trpc.team.remove.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      utils.assignments.getAll.invalidate();
    },
  });

  const assignMutation = trpc.assignments.assign.useMutation({
    onMutate: async ({ propertyId, memberId }) => {
      await utils.assignments.getAll.cancel();
      const prev = utils.assignments.getAll.getData();
      utils.assignments.getAll.setData(undefined, (old) => {
        const next = { ...(old ?? {}) };
        if (memberId === null) {
          delete next[String(propertyId)];
        } else {
          next[String(propertyId)] = memberId;
        }
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) utils.assignments.getAll.setData(undefined, context.prev);
    },
    onSettled: () => {
      utils.assignments.getAll.invalidate();
    },
  });

  const bulkAssignMutation = trpc.assignments.bulkAssign.useMutation({
    onMutate: async ({ propertyIds, memberId }) => {
      await utils.assignments.getAll.cancel();
      const prev = utils.assignments.getAll.getData();
      utils.assignments.getAll.setData(undefined, (old) => {
        const next = { ...(old ?? {}) };
        propertyIds.forEach((id) => {
          if (memberId === null) {
            delete next[String(id)];
          } else {
            next[String(id)] = memberId;
          }
        });
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) utils.assignments.getAll.setData(undefined, context.prev);
    },
    onSettled: () => {
      utils.assignments.getAll.invalidate();
    },
  });

  // Actions
  const addMember = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      // Check for duplicate names
      if (team.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) return;
      const color = TEAM_COLORS[team.length % TEAM_COLORS.length];
      addMemberMutation.mutate({ name: trimmed, color });
    },
    [team, addMemberMutation]
  );

  const removeMember = useCallback(
    (memberId: string) => {
      removeMemberMutation.mutate({ memberId: Number(memberId) });
    },
    [removeMemberMutation]
  );

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
      return team.find((m) => String(m.id) === memberId) || null;
    },
    [assignments, team]
  );

  const assignProperty = useCallback(
    (propertyId: number, memberId: string | null) => {
      assignMutation.mutate({
        propertyId,
        memberId: memberId === null ? null : Number(memberId),
      });
    },
    [assignMutation]
  );

  const bulkAssign = useCallback(
    (propertyIds: number[], memberId: string | null) => {
      bulkAssignMutation.mutate({
        propertyIds,
        memberId: memberId === null ? null : Number(memberId),
      });
    },
    [bulkAssignMutation]
  );

  const getWorkload = useMemo(() => {
    const workload: Record<string, number> = {};
    team.forEach((m) => {
      workload[String(m.id)] = 0;
    });
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
    isLoading: teamLoading || assignmentsLoading,
  };
}
