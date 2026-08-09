"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Upload,
  FileBarChart,
} from "lucide-react";
import {
  groupListService,
  groupCreateService,
  groupUpdateService,
  groupDeleteService,
  groupMembersListService,
  groupMemberBulkAddService,
  groupMemberRemoveService,
  subjectListService,
} from "@/services/academic-service";
import { parseRosterCsv } from "@/lib/parse-roster-csv";
import type { Group, GroupMember, Subject } from "@/types/academic-types";

const inputCls =
  "px-2.5 py-1.5 rounded-lg border border-sand-border bg-cream text-sm text-espresso outline-none focus:border-sage";

function GroupMembers({ group }: { group: Group }) {
  const [members, setMembers] = useState<GroupMember[] | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    groupMembersListService(group.id).then(setMembers).catch(() => toast.error("Failed to load members."));
  }, [group.id]);

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
      const refreshed = await groupMemberBulkAddService(group.id, parsed);
      setMembers(refreshed);
      toast.success(`Added students from ${parsed.length} row(s) — ${refreshed.length} total members`);
    } catch {
      toast.error("Failed to add members");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      await groupMemberRemoveService(group.id, studentId);
      setMembers((prev) => prev?.filter((m) => m.student_id !== studentId) ?? null);
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  return (
    <div className="pl-4 pr-2 py-3 border-t border-sand-border bg-cream/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] text-bark">
          Upload the same name,email list you&apos;d use for an exam roster — accounts are created automatically.
        </p>
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest text-white text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shrink-0 ml-2">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Upload CSV
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>

      {members === null ? (
        <p className="text-xs text-bark">Loading members…</p>
      ) : members.length === 0 ? (
        <p className="text-xs text-bark">No members yet.</p>
      ) : (
        <div className="space-y-1.5">
          {members.map((m) => (
            <div key={m.student_id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-sand-border">
              <span className="flex-1 text-xs text-espresso">{m.student_name}</span>
              <Link
                href={`/instructor/academic/report/${m.student_id}?term=${encodeURIComponent(group.term)}`}
                className="p-1 text-bark hover:text-forest"
                title="View annual report"
              >
                <FileBarChart size={13} />
              </Link>
              <button onClick={() => handleRemove(m.student_id)} className="p-1 text-bark hover:text-red-600 border-0 bg-transparent cursor-pointer">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GroupsPanel() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newSubjectId, setNewSubjectId] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTerm, setEditTerm] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    groupListService().then(setGroups).catch(() => toast.error("Failed to load groups.")).finally(() => setLoading(false));
    subjectListService().then(setSubjects).catch(() => {});
  }, []);

  const subjectName = (id?: string) => subjects.find((s) => s.id === id)?.name;

  const handleCreate = async () => {
    if (!newName.trim() || !newTerm.trim()) return;
    setCreating(true);
    try {
      const group = await groupCreateService(newName.trim(), newTerm.trim(), newSubjectId || undefined);
      setGroups((prev) => [...prev, group].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewTerm("");
      setNewSubjectId("");
    } catch {
      toast.error("Failed to create group.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (g: Group) => {
    setEditingId(g.id);
    setEditName(g.name);
    setEditTerm(g.term);
    setEditSubjectId(g.subject_id ?? "");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editTerm.trim()) return;
    try {
      const updated = await groupUpdateService(id, editName.trim(), editTerm.trim(), editSubjectId || undefined);
      setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
      setEditingId(null);
    } catch {
      toast.error("Failed to update group.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await groupDeleteService(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch {
      toast.error("Failed to delete group.");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-sand-border p-5">
      <h2 className="text-base font-semibold text-espresso mb-1">Groups</h2>
      <p className="text-xs text-bark mb-4">
        Link a group to a subject to give that subject its own student set — exams assigned to the group only admit its members.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          className={`${inputCls} flex-1`}
          placeholder="Group name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          className={`${inputCls} w-28`}
          placeholder="Term"
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        {subjects.length > 0 && (
          <select className={`${inputCls} w-40`} value={newSubjectId} onChange={(e) => setNewSubjectId(e.target.value)}>
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={handleCreate}
          disabled={creating || !newName.trim() || !newTerm.trim()}
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
      ) : groups.length === 0 ? (
        <p className="text-sm text-bark">No groups yet.</p>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className="rounded-lg border border-sand-border overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  onClick={() => setExpandedId(expandedId === g.id ? null : g.id)}
                  className="p-0.5 text-bark border-0 bg-transparent cursor-pointer"
                >
                  {expandedId === g.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {editingId === g.id ? (
                  <>
                    <input className={`${inputCls} flex-1`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                    <input className={`${inputCls} w-24`} value={editTerm} onChange={(e) => setEditTerm(e.target.value)} />
                    {subjects.length > 0 && (
                      <select className={`${inputCls} w-36`} value={editSubjectId} onChange={(e) => setEditSubjectId(e.target.value)}>
                        <option value="">No subject</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    )}
                    <button onClick={() => handleUpdate(g.id)} className="p-1.5 text-forest hover:opacity-70 border-0 bg-transparent cursor-pointer">
                      <Check size={14} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-bark hover:opacity-70 border-0 bg-transparent cursor-pointer">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-espresso">{g.name}</span>
                    {g.subject_id && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-forest/10 text-forest">
                        {subjectName(g.subject_id) ?? "Subject"}
                      </span>
                    )}
                    <span className="text-xs text-bark">{g.term}</span>
                    <button onClick={() => startEdit(g)} className="p-1.5 text-bark hover:text-forest border-0 bg-transparent cursor-pointer">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(g.id)} className="p-1.5 text-bark hover:text-red-600 border-0 bg-transparent cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
              {expandedId === g.id && <GroupMembers group={g} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
