"use client";

import SubjectsPanel from "./_components/SubjectsPanel";
import GroupsPanel from "./_components/GroupsPanel";

export default function AcademicPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-medium text-espresso tracking-tight">Subjects &amp; Groups</h1>
        <p className="text-bark text-sm mt-1">
          Organize exams by subject and students by group, term-over-term.
        </p>
      </div>

      <div className="grid gap-5">
        <SubjectsPanel />
        <GroupsPanel />
      </div>
    </div>
  );
}
