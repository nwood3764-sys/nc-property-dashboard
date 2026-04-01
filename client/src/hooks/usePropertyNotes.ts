import { useState, useCallback } from "react";

const STORAGE_KEY = "nc-property-notes";

interface NoteEntry {
  text: string;
  updatedAt: string;
}

type NotesMap = Record<string, NoteEntry>;

function loadNotes(): NotesMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveNotes(notes: NotesMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function usePropertyNotes() {
  const [notes, setNotes] = useState<NotesMap>(loadNotes);

  const getNote = useCallback(
    (propertyId: number): NoteEntry | null => {
      return notes[String(propertyId)] || null;
    },
    [notes]
  );

  const setNote = useCallback(
    (propertyId: number, text: string) => {
      setNotes((prev) => {
        const updated = { ...prev };
        if (text.trim()) {
          updated[String(propertyId)] = {
            text: text.trim(),
            updatedAt: new Date().toISOString(),
          };
        } else {
          delete updated[String(propertyId)];
        }
        saveNotes(updated);
        return updated;
      });
    },
    []
  );

  const getNotesCount = useCallback(() => {
    return Object.keys(notes).length;
  }, [notes]);

  const exportNotes = useCallback(() => {
    return { ...notes };
  }, [notes]);

  return { getNote, setNote, getNotesCount, exportNotes };
}
