export interface EvaluationInput {
  transcript: string;
  role?: string;
  candidate?: { name?: string; email?: string };
}

export type Decision = 'Strong Hire' | 'Hire' | 'Leans Hire' | 'Neutral' | 'Leans No' | 'No';

export interface EvaluationReport {
  candidateName: string;
  role: string;
  overallScore: number; // 0-100
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
