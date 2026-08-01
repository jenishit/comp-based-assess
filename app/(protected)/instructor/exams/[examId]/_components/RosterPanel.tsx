"use client";

import { useEffect, useState } from "react";
import { examRosterGetService, examRosterUploadService, examRosterEntryDeleteService } from "@/services/exam-service";
import type { RosterEntry } from "@/types/exam-types";
import { Upload, X, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

function parseRosterCsv(text: string): { name: string; email: string }[] {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));

  // Drop a header row like "name,email" — detected by the second column
  // not looking like an email address.
  if (rows.length > 0 && !rows[0][1]?.includes("@")) {
    rows.shift();
  }

  return rows
    .filter((cols) => cols.length >= 2 && cols[0] && cols[1]?.includes("@"))
    .map(([name, email]) => ({ name, email }));
}

export default function RosterPanel({ examId }: { examId: string }) {
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    examRosterGetService(examId).then(setEntries).catch(() => {}).finally(() => setLoading(false));
  }, [examId]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const text = await file.text();
    const parsed = parseRosterCsv(text);
    if (parsed.length === 0) {
      toast.error("No valid name,email rows found in that file");
      return;
    }

    setUploading(true);
    try {
      const res = await examRosterUploadService(examId, parsed);
      setEntries(res.entries);
      toast.success(`Added ${res.added} of ${parsed.length} students (${res.total} total on roster)`);
    } catch {
      toast.error("Failed to upload roster");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    try {
      await examRosterEntryDeleteService(examId, entryId);
    } catch {
      toast.error("Failed to remove student — refresh to check current roster");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-sand-border p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-espresso flex items-center gap-2">
          <Users size={16} /> Roster
        </h2>
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-medium hover:bg-forest-dark transition-colors cursor-pointer">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="h-10 bg-sand-light rounded-lg animate-pulse" />
      ) : entries.length === 0 ? (
        <p className="text-xs text-bark">
          No roster uploaded — anyone with the PIN can join. Upload a CSV with{" "}
          <code className="text-[11px] bg-sand-light px-1 py-0.5 rounded">name,email</code> columns to restrict joining to listed students.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-cream text-sm">
              <div>
                <span className="font-medium text-espresso">{entry.name}</span>{" "}
                <span className="text-bark text-xs">{entry.email}</span>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-bark hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0 p-1"
                aria-label={`Remove ${entry.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
