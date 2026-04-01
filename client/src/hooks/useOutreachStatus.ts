/*
 * Outreach Tracking Hook
 * Persists per-property outreach status to the backend database via tRPC.
 * Statuses: "none" | "contacted" | "in_progress" | "complete"
 */

import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";

export type OutreachStatus = "none" | "contacted" | "in_progress" | "complete";

export function useOutreachStatus() {
  const utils = trpc.useUtils();
  const { data: statusMap = {}, isLoading } = trpc.outreach.getAll.useQuery();

  const setStatusMutation = trpc.outreach.setStatus.useMutation({
    onMutate: async ({ propertyId, status }) => {
      await utils.outreach.getAll.cancel();
      const prev = utils.outreach.getAll.getData();
      utils.outreach.getAll.setData(undefined, (old) => {
        const next = { ...(old ?? {}) };
        if (status === "none") {
          delete next[String(propertyId)];
        } else {
          next[String(propertyId)] = status;
        }
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) utils.outreach.getAll.setData(undefined, context.prev);
    },
    onSettled: () => {
      utils.outreach.getAll.invalidate();
    },
  });

  const bulkSetStatusMutation = trpc.outreach.bulkSetStatus.useMutation({
    onMutate: async ({ propertyIds, status }) => {
      await utils.outreach.getAll.cancel();
      const prev = utils.outreach.getAll.getData();
      utils.outreach.getAll.setData(undefined, (old) => {
        const next = { ...(old ?? {}) };
        propertyIds.forEach((id) => {
          if (status === "none") {
            delete next[String(id)];
          } else {
            next[String(id)] = status;
          }
        });
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) utils.outreach.getAll.setData(undefined, context.prev);
    },
    onSettled: () => {
      utils.outreach.getAll.invalidate();
    },
  });

  const getStatus = useCallback(
    (propertyId: number): OutreachStatus => {
      return (statusMap[String(propertyId)] as OutreachStatus) || "none";
    },
    [statusMap]
  );

  const setStatus = useCallback(
    (propertyId: number, status: OutreachStatus) => {
      setStatusMutation.mutate({ propertyId, status });
    },
    [setStatusMutation]
  );

  const setBulkStatus = useCallback(
    (propertyIds: number[], status: OutreachStatus) => {
      bulkSetStatusMutation.mutate({ propertyIds, status });
    },
    [bulkSetStatusMutation]
  );

  const getCounts = useCallback(() => {
    const values = Object.values(statusMap);
    return {
      contacted: values.filter((s) => s === "contacted").length,
      inProgress: values.filter((s) => s === "in_progress").length,
      complete: values.filter((s) => s === "complete").length,
      total: values.length,
    };
  }, [statusMap]);

  const clearAll = useCallback(() => {
    // Not commonly used, but available
  }, []);

  return { getStatus, setStatus, setBulkStatus, getCounts, clearAll, statuses: statusMap, isLoading };
}
