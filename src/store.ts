import { EvaluationReport } from './types';
import { randomUUID } from 'crypto';

export interface SavedReport {
  id: string;
  createdAt: string; // ISO
  report: EvaluationReport;
}

const reports = new Map<string, SavedReport>();

export function saveReport(report: EvaluationReport): SavedReport {
  const id = randomUUID();
  const saved: SavedReport = { id, createdAt: new Date().toISOString(), report };
  reports.set(id, saved);
  return saved;
}

export function getReport(id: string): SavedReport | undefined {
  return reports.get(id);
}

export function listReports(limit = 50): SavedReport[] {
  const all = Array.from(reports.values());
  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return all.slice(0, limit);
}
