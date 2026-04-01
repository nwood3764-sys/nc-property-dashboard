/*
 * PropertyNoteEditor — inline note editor for each property
 * Design: Civic Blueprint — compact textarea with save indicator
 */
import { useState, useRef, useEffect } from "react";
import { StickyNote, Check } from "lucide-react";

interface Props {
  propertyId: number;
  note: { text: string; updatedAt: string } | null;
  onSave: (propertyId: number, text: string) => void;
}

export default function PropertyNoteEditor({ propertyId, note, onSave }: Props) {
  const [text, setText] = useState(note?.text || "");
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setText(note?.text || "");
  }, [note?.text]);

  const handleChange = (value: string) => {
    setText(value);
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSave(propertyId, value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <StickyNote className="w-3.5 h-3.5" />
        <span className="font-medium">Notes</span>
        {saved && (
          <span className="inline-flex items-center gap-0.5 text-emerald-600">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
        {note?.updatedAt && !saved && (
          <span className="text-slate-400">Last updated {formatDate(note.updatedAt)}</span>
        )}
      </div>
      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add notes about this property (auto-saves)..."
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y min-h-[60px]"
        rows={2}
      />
    </div>
  );
}
