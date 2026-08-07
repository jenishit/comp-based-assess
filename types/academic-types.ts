export interface Subject {
  id: string;
  name: string;
  teacher_id: string;
}

export interface Group {
  id: string;
  name: string;
  term: string;
  teacher_id: string;
  subject_id?: string;
}

export interface GroupMember {
  student_id: string;
  student_name: string;
}

export interface GroupMemberEntry {
  name: string;
  email: string;
}

export interface ExamHistoryRow {
  subject: string;
  exam: string;
  score_pct: number;
  status: string;
}

export interface AnnualReport {
  status: string;
  completed_exams?: number;
  assigned_exams?: number;
  overall_average?: number;
  subjects_completed?: number;
  total_exams?: number;
  weakest_area?: string;
  subject_wise_average?: Record<string, number>;
  bloom_level_performance?: Record<string, number>;
  exam_history?: ExamHistoryRow[];
}
