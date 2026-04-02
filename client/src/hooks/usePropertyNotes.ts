/*
 * Property Notes Hook
 * Persists per-property notes to the backend database via tRPC.
 */

import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface NoteEntry {
  text: string;
  updatedAt: string;
}

export function usePropertyNotes() {
  const utils = trpc.useUtils();
  const { data: notesMap = {}, isLoading } = trpc.notes.getAll.useQuery();

  const setNoteMutation = trpc.notes.setNote.useMutation({
    onMutate: async ({ propertyId, text }) => {
      await utils.notes.getAll.cancel();
      const prev = utils.notes.getAll.getData();
      utils.notes.getAll.setData(undefined, (old) => {
        const next = { ...(old ?? {}) };
        if (text.trim()) {
          next[String(propertyId)] = {
            text: text.trim(),
            updatedAt: new Date(),
          };
        } else {
          delete next[String(propertyId)];
        }
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) utils.notes.getAll.setData(undefined, context.prev);
    },
    onSettled: () => {
      utils.notes.getAll.invalidate();
    },
  });

  const getNote = useCallback(
    (propertyId: number): NoteEntry | null => {
      const entry = notesMap[String(propertyId)];
      if (!entry) return null;
      return {
        text: entry.text,
        updatedAt: entry.updatedAt instanceof Date ? entry.updatedAt.toISOString() : String(entry.updatedAt),
      };
    },
    [notesMap]
  );

  const setNote = useCallback(
    (propertyId: number, text: string) => {
      setNoteMutation.mutate({ propertyId, text });
    },
    [setNoteMutation]
  );

  const getNotesCount = useCallback(() => {
    return Object.keys(notesMap).length;
  }, [notesMap]);

  const exportNotes = useCallback(() => {
    const result: Record<string, NoteEntry> = {};
    for (const [key, entry] of Object.entries(notesMap)) {
      result[key] = {
        text: entry.text,
        updatedAt: entry.updatedAt instanceof Date ? entry.updatedAt.toISOString() : String(entry.updatedAt),
      };
    }
    return result;
  }, [notesMap]);

  return { getNote, setNote, getNotesCount, exportNotes, isLoading };
}
