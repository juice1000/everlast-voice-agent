import type { ReportListItem, SavedReport } from './types';

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function evaluate(body: { transcript: string; role?: string; candidate?: { name?: string; email?: string } }) {
  const res = await fetch(`${BASE}/evaluate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Evaluate failed: ${res.status}`);
  return res.json();
}

export async function listReports(): Promise<{ items: ReportListItem[] }> {
  const res = await fetch(`${BASE}/reports`);
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export async function getReport(id: string): Promise<SavedReport> {
  const res = await fetch(`${BASE}/reports/${id}`);
  if (!res.ok) throw new Error(`Get failed: ${res.status}`);
  return res.json();
}
