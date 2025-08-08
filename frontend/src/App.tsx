import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { evaluate, listReports, getReport } from './api';
import type { SavedReport, EvaluationReport, ReportListItem } from './types';
import { useInterviewStore } from './store';
import VapiPanel from './VapiPanel';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <div className="field-label">{label}</div>
      {children}
    </label>
  );
}

function ScoreRow({ report }: { report: EvaluationReport }) {
  const entries = Object.entries(report.scores);
  return (
    <div className="scores">
      {entries.map(([k, v]) => (
        <div key={k} className="score-box">
          <div className="score-label">{k}</div>
          <div className="score-value">{v}/10</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SavedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE || 'http://localhost:3000', []);
  const [backendOk, setBackendOk] = useState(true);
  const [showToast, setShowToast] = useState(false);

  // Zustand store for form state
  const { transcript, role, candidateName, candidateEmail, setTranscript, setRole, setCandidateName, setCandidateEmail, reset } = useInterviewStore();

  // Log transcript on every update
  useEffect(() => {
    // Limit preview size to avoid flooding console
    const preview = transcript.length > 200 ? `${transcript.slice(0, 200)}…` : transcript;
    console.log('[Transcript updated]', { at: new Date().toISOString(), length: transcript.length, preview });
  }, [transcript]);

  async function refreshList() {
    try {
      const res = await listReports();
      setReports(res.items || []);
      setBackendOk(true);
    } catch {
      setBackendOk(false);
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  useEffect(() => {
    async function fetchDetail() {
      if (!selectedId) {
        setSelected(null);
        return;
      }
      const res = await getReport(selectedId);
      setSelected({ id: res.id, createdAt: res.createdAt, report: res.report });
    }
    fetchDetail();
  }, [selectedId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = { transcript, role, candidate: { name: candidateName || undefined, email: candidateEmail || undefined } };
      const res = await evaluate(body);
      await refreshList();
      setSelectedId(res.id);
      reset();
      // Mock Slack send after 2 seconds
      setTimeout(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container">
      <div className="header">
        <div className="title">Interview Evaluator</div>
        <div className="subtle">Backend: {apiBase}</div>
      </div>

      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-body">
          <form onSubmit={onSubmit}>
            <Field label="Transcript">
              <textarea className="textarea" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Paste or type transcript..." />
            </Field>
            <div className="row">
              <Field label="Role">
                <input className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role" />
              </Field>
              <Field label="Candidate Name">
                <input className="input" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="Name" />
              </Field>
              <Field label="Candidate Email">
                <input className="input" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} placeholder="Email" />
              </Field>
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting || transcript.trim().length < 20}>
              {submitting ? 'Evaluating…' : 'Evaluate Transcript'}
            </button>
            {transcript.trim().length > 0 && transcript.trim().length < 20 && (
              <div className="footer-note">Transcript seems very short. Add more content for a better evaluation.</div>
            )}
            {error && <div style={{ color: 'salmon', marginTop: 8 }}>{error}</div>}
            {!backendOk && <div style={{ color: 'salmon', marginTop: 8 }}>Backend not reachable at {apiBase}. Start the server or update VITE_API_BASE.</div>}
          </form>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-body">
            <div className="panel-title">Reports</div>
            <div className="list">
              {reports.length === 0 && (
                <div className="subtle" style={{ padding: 12 }}>
                  No reports yet
                </div>
              )}
              {reports.map((r) => (
                <div key={r.id} onClick={() => setSelectedId(r.id)} className={`list-item ${selectedId === r.id ? 'selected' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600 }}>{r?.candidateName || 'Unknown Candidate'}</div>
                    <span className="badge">{r?.decision}</span>
                  </div>
                  <div className="subtle">
                    {r?.role} • {new Date(r?.createdAt).toLocaleString()}
                  </div>
                  <div className="subtle">Score: {r?.overallScore}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="panel-title">Details</div>
            {!selected && <div className="subtle">Select a report</div>}
            {selected && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                      {selected.report.candidateName} • {selected.report.role}
                    </div>
                    <div className="subtle">{new Date(selected.createdAt).toLocaleString()}</div>
                  </div>
                  <span className="badge" style={{ alignSelf: 'flex-start' }}>
                    {selected.report.decision}
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>Overall Score: {selected.report.overallScore}/100</div>
                  <ScoreRow report={selected.report} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div className="section-title">Highlights</div>
                    <ul>
                      {selected.report.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="section-title">Risks</div>
                    <ul>
                      {selected.report.risks.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {selected.report.notes && (
                  <div style={{ marginTop: 12 }}>
                    <div className="section-title">Notes</div>
                    <div>{selected.report.notes}</div>
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <VapiPanel />
            </div>
          </div>
        </div>
      </div>
      {showToast && <div className="toast">Sending summary to Slack…</div>}
    </div>
  );
}
