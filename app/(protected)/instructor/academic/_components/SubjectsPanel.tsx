"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react";
import {
  subjectListService,
  subjectCreateService,
  subjectUpdateService,
  subjectDeleteService,
} from "@/services/academic-service";
import type { Subject } from "@/types/academic-types";

const inputCls =
  "px-2.5 py-1.5 rounded-lg border border-sand-border bg-cream text-sm text-espresso outline-none focus:border-sage";

export default function SubjectsPanel() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    subjectListService().then(setSubjects).catch(() => toast.error("Failed to load subjects.")).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const subject = await subjectCreateService(newName.trim());
      setSubjects((prev) => [...prev, subject].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } catch {
      toast.error("Failed to create subject.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (s: Subject) => {
    setEditingId(s.id);
    setEditName(s.name);
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const updated = await subjectUpdateService(id, editName.trim());
      setSubjects((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
    } catch {
      toast.error("Failed to update subject.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await subjectDeleteService(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
    } catch {
      toast.error("Failed to delete subject.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-sand-border p-5">
      <h2 className="text-base font-semibold text-espresso mb-4">Subjects</h2>

      <div className="flex gap-2 mb-4">
        <input
          className={`${inputCls} flex-1`}
          placeholder="New subject name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 border-0 cursor-pointer"
        >
          {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : subjects.length === 0 ? (
        <p className="text-sm text-bark">No subjects yet.</p>
      ) : (
        <div className="space-y-2">
          {subjects.map((s) => (
            <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sand-border">
              {editingId === s.id ? (
                <>
                  <input
                    className={`${inputCls} flex-1`}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate(s.id)}
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(s.id)} className="p-1.5 text-forest hover:opacity-70 border-0 bg-transparent cursor-pointer">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-bark hover:opacity-70 border-0 bg-transparent cursor-pointer">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-espresso">{s.name}</span>
                  <button onClick={() => startEdit(s)} className="p-1.5 text-bark hover:text-forest border-0 bg-transparent cursor-pointer">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-bark hover:text-red-600 border-0 bg-transparent cursor-pointer">
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
