/*
 * Outreach Tracking Hook
 * Persists per-property outreach status to localStorage.
 * Statuses: "none" | "contacted" | "in_progress" | "complete"
 */

import { useState, useCallback, useEffect } from "react";

export type OutreachStatus = "none" | "contacted" | "in_progress" | "complete";

const STORAGE_KEY = "nc-property-outreach-status";

function loadStatuses(): Record<string, OutreachStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {};
}

function saveStatuses(statuses: Record<string, OutreachStatus>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  } catch {
    // ignore
  }
}

export function useOutreachStatus() {
  const [statuses, setStatuses] = useState<Record<string, OutreachStatus>>(loadStatuses);

  // Sync to localStorage whenever statuses change
  useEffect(() => {
    saveStatuses(statuses);
  }, [statuses]);

  const getStatus = useCallback(
    (propertyId: number): OutreachStatus => {
      return statuses[String(propertyId)] || "none";
    },
    [statuses]
  );

  const setStatus = useCallback(
    (propertyId: number, status: OutreachStatus) => {
      setStatuses((prev) => {
        const next = { ...prev };
        if (status === "none") {
          delete next[String(propertyId)];
        } else {
          next[String(propertyId)] = status;
        }
        return next;
      });
    },
    []
  );

  const getCounts = useCallback(() => {
    const values = Object.values(statuses);
    return {
      contacted: values.filter((s) => s === "contacted").length,
      inProgress: values.filter((s) => s === "in_progress").length,
      complete: values.filter((s) => s === "complete").length,
      total: values.length,
    };
  }, [statuses]);

  const setBulkStatus = useCallback(
    (propertyIds: number[], status: OutreachStatus) => {
      setStatuses((prev) => {
        const next = { ...prev };
        propertyIds.forEach((id) => {
          if (status === "none") {
            delete next[String(id)];
          } else {
            next[String(id)] = status;
          }
        });
        return next;
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    setStatuses({});
  }, []);

  return { getStatus, setStatus, setBulkStatus, getCounts, clearAll, statuses };
}
