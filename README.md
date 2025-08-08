# everlast-voice-agent

## Quick start

1. Install dependencies

```bash
npm install
```

2. Configure environment

- Copy `.env.example` to `.env` and fill values:
  - `SLACK_WEBHOOK_URL` to post interview outcomes to Slack (optional for local testing)
  - `OPENAI_API_KEY` to enable LLM-based evaluation (otherwise uses heuristic fallback)
  - `JOB_PROFILE_JSON` optional role profile JSON

3. Run the server

```bash
npm run dev
```

4. Simulate a call evaluation locally

```bash
curl -s -X POST http://localhost:3000/simulate -H 'Content-Type: application/json' -d '{
  "transcript":"I led a team and designed architecture in Typescript and Node, focused on scalability and testing. I mentor and collaborate. I am excited about the mission and impact.",
  "role":"Software Engineer",
  "candidate":{"name":"Max Mustermann"}
}' | jq
```

The server exposes:

- `POST /webhooks/vapi` for Vapi webhooks (transcript/summary)
- `POST /simulate` for local testing
