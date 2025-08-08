export type Decision = 'Strong Hire' | 'Hire' | 'Leans Hire' | 'Neutral' | 'Leans No' | 'No';

export interface EvaluationReport {
  candidateName: string;
  role: string;
  overallScore: number;
  decision: Decision;
  scores: {
    communication: number;
    technicalDepth: number;
    problemSolving: number;
    cultureFit: number;
    motivation: number;
    seniority: number;
  };
  highlights: string[];
  risks: string[];
  notes: string;
  metadata: Record<string, unknown>;
}

export interface SavedReport {
  id: string;
  createdAt: string;
  report: EvaluationReport;
}

export interface ReportListItem {
  id: string;
  createdAt: string;
  candidateName: string;
  role: string;
  overallScore: number;
  decision: Decision;
}
