# Execution Plan: AI Voice Interview Agent with Vapi

## Goal

Build a Vapi-powered voice agent that conducts interviews with candidates, analyzes the conversation into an evaluation report, and notifies HR in Slack about the outcome. The plan includes architecture, evaluation logic, Vapi settings, latency strategies, transcript alternatives, EU-only setup, AWS integration, and testing.

## High-Level Architecture

- Vapi handles the real-time call.
- Our server receives Vapi webhooks (e.g., call completed, summary, transcript chunks).
- We generate an evaluation report (JSON + readable text) from the transcript using either an LLM or a heuristic fallback.
- We post a structured Slack message to HR with the outcome, highlights, and a link to the full report.

```mermaid
description "Voice Interview Agent End-to-End"
sequenceDiagram
  autonumber
  participant C as Candidate
  participant V as Vapi (Voice Agent)
  participant S as Our Server (Webhook + Eval)
  participant L as Slack

  C->>V: Phone/Web call
  V-->>C: Real-time interaction (ASR + TTS + Reasoning)
  V->>S: Webhook events (transcript, summary, call end)
  S->>S: Evaluate transcript (LLM or heuristic)
  S->>L: Post outcome summary + link to full report
  L-->>HR: Notification delivered
```

## Data Flow

1. Vapi Webhook → `POST /webhooks/vapi` with conversation transcript and/or final summary.
2. Evaluation Service → Produces scorecard, strengths/risks, fit decision, recommendations.
3. Slack Service → Sends rich message (blocks) to HR channel via Incoming Webhook or Bot token.

## Evaluation Logic (Bewerberprotokoll)

- Inputs: Full transcript, call metadata (role, seniority), optional job requirements.
- Outputs: Structured JSON and human-readable summary.
- Dimensions (0–10 each):
  - Communication clarity
  - Technical depth (role-specific)
  - Problem-solving/Reasoning
  - Cultural/team fit
  - Motivation/Drive
  - Seniority indicators (impact, ownership)
- Derived metrics:
  - Overall score (weighted average; weight technical higher for tech roles)
  - Decision suggestion: Strong Hire / Hire / Leans Hire / Neutral / Leans No / No
- Extracted evidence:
  - Highlights: 3–5 quotes/points
  - Risks/Concerns: 3–5 items
  - Compensation expectations (if discussed)
  - Availability/notice period
  - Red flags (e.g., exaggerations, contradictions)
- Implementation:
  - Primary: LLM with JSON schema for robust, structured output
  - Fallback: Heuristic scoring using keyword and pattern checks when no LLM key configured

## Slack Notification

- Title: Candidate Name, Role, Date
- Sections: Decision, Overall score, Top strengths, Risks, Notable quotes, Next steps
- Link to full JSON report (optional: store in S3 or attach JSON payload directly in the message for MVP)

## Vapi Settings (Instructions, Voice, Advanced)

- Instructions (system prompt essence):
  - Interviewer persona: professional, concise, friendly
  - Objective: evaluate candidate against role-specific criteria
  - Flow: warm-up (background), core competencies (role-tailored), deep dive, culture, logistics
  - Constraints: avoid leading questions, allow interruptions, clarify when uncertain, seek concrete examples
  - Data capture: mark notable quotes, capture compensation, availability
- Voice:
  - Choose a natural, low-latency, neutral voice (e.g., ElevenLabs or PlayHT German/English neutral tones). Ensure barge-in and fast attack on TTS.
- Advanced (Messaging):
  - Enable partial recognition and barge-in
  - Short initial and turn timeouts
  - Consent line at start if required (compliance)
  - Emit interim transcript events for progressive analysis (optional)

## Best Voice Model Choice (Rationale)

- If using OpenAI Realtime (GPT‑4o Realtime): best overall reasoning and latency trade-off; high speech quality when paired with low-latency TTS
- If prioritizing German speech quality: PlayHT v2/ElevenLabs high naturalness; pair with fast ASR like Deepgram or Whisper large-v3 turbo
- Decision: For a balanced first version, use GPT‑4o Realtime for reasoning + PlayHT/ElevenLabs TTS; measure with live latency traces

## Reducing Agent Delay

- Transport: Prefer WebRTC; use edge POP closest to the user
- ASR: Use low-latency streaming ASR (Deepgram Nova-2, Whisper large-v3 turbo) with partial results
- TTS: Use fast-attack voices (enable barge-in and short synthesis chunking)
- Reasoning: Smaller context windows where possible; cache system prompts; avoid heavy server-side tools on the critical path
- Networking: Keep tool-calls parallel, minimize cross-region hops, pre-warm models
- Conversation: Allow barge-in; reduce long assistant monologues; concise style

## Transcript Alternatives (Not using Vapi transcript)

- External ASR Providers:
  - Deepgram streaming → low latency, diarization, German support
  - AssemblyAI streaming → topic detection, summarization add-ons
  - AWS Transcribe → EU data residency
  - Local Whisper (GPU) → full control, privacy; higher infra cost
- Why this is useful:
  - Compliance/data residency, pricing control, custom diarization, custom vocabulary, alignment with internal data retention policies

## EU-Only / No US Data Transfer (Bonus)

- Host our server in EU region (e.g., Frankfurt)
- Select EU-region ASR/TTS/LLM endpoints; disable US fallback; verify DPAs and data residency guarantees
- Disable provider logging and set retention to minimum
- Encrypt in transit (TLS) and at rest (KMS). Pseudonymize candidate data where possible
- Avoid cross-region S3 replication; pin to eu-central-1. Use EU DNS resolvers and private links where possible
- If using Vapi, choose EU POPs/regions and EU-compliant providers under the hood; verify with vendor

## AWS Integration (Bonus)

- API Gateway + Lambda for webhooks; keep cold starts low (provisioned concurrency for peak hours)
- S3 for storing raw audio and JSON reports (eu-central-1). S3 Object Lambda to redact PII on read
- DynamoDB for candidate-interview state and idempotent webhook processing
- AWS Transcribe for ASR, Comprehend for keyphrase/sentiment enrichment (EU regions)
- KMS for secrets, Secrets Manager for keys, CloudWatch for traces/latency alarms

## Security & Compliance

- Verify webhook signatures
- Idempotency keys for webhooks
- PII minimization and redaction pipeline
- Configurable retention and deletion

## Testing Plan

- Local simulation endpoint to post a sample transcript and verify Slack message renders
- Unit tests for evaluation fallback logic
- Manual test with Vapi: point webhook URL to `POST /webhooks/vapi`, conduct a short mock interview

## Minimal API Surface (MVP)

- `POST /webhooks/vapi`: consumes transcript/summary, produces evaluation, posts to Slack
- `POST /simulate`: accepts `{ transcript, candidate, role }` → runs evaluation + Slack post (no Vapi required)

## Environment Variables

- `SLACK_WEBHOOK_URL`: Slack Incoming Webhook URL
- `OPENAI_API_KEY` (optional): for LLM-based evaluation
- `PORT` (optional): server port, default 3000
- `JOB_PROFILE_JSON` (optional): JSON-string with role requirements

## Deliverables

- Webhook server (Express + TypeScript)
- Evaluation service (LLM with heuristic fallback)
- Slack notification service
- Execution plan (this file)

## Vapi Configuration Snippet (Dashboard)

- Instructions (paste as system prompt):
  """
  You are a professional interviewer. Conduct a structured interview for the role: {{role}}.
  Goals:
  - Build rapport, understand background, and assess skills relevant to {{role}}.
  - Probe for concrete examples; ask follow-ups; avoid leading questions.
  - Capture notable quotes, compensation expectations, availability.
  - Keep responses concise; allow barge-in; confirm understanding.
    When in doubt, ask clarifying questions.
    """
- Voice: Neutral, concise, barge-in enabled (PlayHT/ElevenLabs). Language: German if candidate speaks German.
- Advanced/Messaging:
  - Partial recognition enabled
  - Barge-in enabled
  - Initial silence timeout: 3s; Turn timeout: 0.5s
  - Emit interim transcript events
  - Webhook URL: `https://<your-domain>/webhooks/vapi`
