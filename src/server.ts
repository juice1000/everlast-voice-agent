import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { evaluateTranscript } from './services/evaluation';
import { postToSlack } from './services/slack';
import { EvaluationInput } from './types';
import { saveReport, getReport, listReports } from './store';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get('/', (_req, res) => {
  res.send('Voice Agent Webhook up. Use POST /evaluate, /simulate or /webhooks/vapi');
});

app.post('/webhooks/vapi', async (req, res) => {
  try {
    const body = req.body || {};
    const transcript = body.transcript || body.summary || '';
    const role = body.role || 'Software Engineer';
    const candidate = body.candidate || { name: body.candidateName || 'Unknown Candidate' };

    const report = await evaluateTranscript({ transcript, role, candidate });
    const saved = saveReport(report);
    await postToSlack(report);

    res.status(200).json({ ok: true, id: saved.id, createdAt: saved.createdAt, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.post('/simulate', async (req, res) => {
  try {
    const { transcript, role, candidate } = req.body as EvaluationInput;
    if (!transcript) {
      return res.status(400).json({ error: 'transcript is required' });
    }
    const report = await evaluateTranscript({ transcript, role, candidate });
    const saved = saveReport(report);
    await postToSlack(report);
    res.json({ ok: true, id: saved.id, createdAt: saved.createdAt, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.post('/evaluate', async (req, res) => {
  try {
    const { transcript, role, candidate } = req.body as EvaluationInput;
    if (!transcript) {
      return res.status(400).json({ error: 'transcript is required' });
    }
    const report = await evaluateTranscript({ transcript, role, candidate });
    const saved = saveReport(report);
    await postToSlack(report);
    res.json({ ok: true, id: saved.id, createdAt: saved.createdAt, report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.get('/reports', (_req, res) => {
  const items = listReports().map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    candidateName: r.report.candidateName,
    role: r.report.role,
    overallScore: r.report.overallScore,
    decision: r.report.decision,
  }));
  res.json({ ok: true, items });
});

app.get('/reports/:id', (req, res) => {
  const item = getReport(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, ...item });
});

app.listen(config.port, () => {
  console.log(`HTTP server listening on http://localhost:${config.port}`);
});
