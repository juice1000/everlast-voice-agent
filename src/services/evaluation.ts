import OpenAI from 'openai';
import { config, getJobProfile } from '../config';
import { EvaluationInput, EvaluationReport } from '../types';

export function evaluateTranscriptHeuristically(input: EvaluationInput): EvaluationReport {
  const text = input.transcript || '';
  const role = input.role || 'Unknown Role';
  const candidateName = input.candidate?.name || 'Unknown Candidate';

  const keywordScore = (keywords: string[]) => {
    let score = 0;
    for (const kw of keywords) {
      const matches = (text.match(new RegExp(`\\b${kw}\\b`, 'gi')) || []).length;
      score += Math.min(matches, 3);
    }
    return Math.min(10, score);
  };

  const communication = Math.min(10, Math.max(3, Math.round(text.split(/\.|\?|!/).filter(Boolean).length / 20)));
  const technicalDepth = keywordScore(['architecture', 'typescript', 'node', 'design', 'scalability', 'testing']);
  const problemSolving = keywordScore(['debug', 'optimize', 'trade-off', 'constraint', 'complex']);
  const cultureFit = keywordScore(['team', 'collaborate', 'mentor', 'feedback', 'ownership']);
  const motivation = keywordScore(['excited', 'interested', 'mission', 'impact']);
  const seniority = keywordScore(['lead', 'own', 'deliver', 'stakeholder']);

  const weights = { communication: 1, technicalDepth: 2, problemSolving: 1.5, cultureFit: 1, motivation: 0.5, seniority: 1 } as const;
  const weighted =
    communication * weights.communication +
    technicalDepth * weights.technicalDepth +
    problemSolving * weights.problemSolving +
    cultureFit * weights.cultureFit +
    motivation * weights.motivation +
    seniority * weights.seniority;
  const maxWeighted =
    10 * weights.communication + 10 * weights.technicalDepth + 10 * weights.problemSolving + 10 * weights.cultureFit + 10 * weights.motivation + 10 * weights.seniority;
  const overallScore = Math.round((weighted / maxWeighted) * 100);

  const decision =
    overallScore >= 85
      ? 'Strong Hire'
      : overallScore >= 75
      ? 'Hire'
      : overallScore >= 65
      ? 'Leans Hire'
      : overallScore >= 50
      ? 'Neutral'
      : overallScore >= 40
      ? 'Leans No'
      : 'No';

  const highlights = ['Clear articulation on key topics', 'Demonstrated understanding of system design', 'Collaborative mindset'];
  const risks = ['Potential gaps in specific tooling', 'Limited examples of recent impact'];

  return {
    candidateName,
    role,
    overallScore,
    decision,
    scores: { communication, technicalDepth, problemSolving, cultureFit, motivation, seniority },
    highlights,
    risks,
    notes: 'Heuristic evaluation based on keyword and density analysis. For higher fidelity, enable LLM evaluation.',
    metadata: { length: text.length },
  };
}

export async function evaluateTranscriptLLM(input: EvaluationInput): Promise<EvaluationReport> {
  if (!config.openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }
  const openai = new OpenAI({ apiKey: config.openaiApiKey });
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      candidateName: { type: 'string' },
      role: { type: 'string' },
      overallScore: { type: 'number' },
      decision: { type: 'string', enum: ['Strong Hire', 'Hire', 'Leans Hire', 'Neutral', 'Leans No', 'No'] },
      scores: {
        type: 'object',
        additionalProperties: false,
        properties: {
          communication: { type: 'number' },
          technicalDepth: { type: 'number' },
          problemSolving: { type: 'number' },
          cultureFit: { type: 'number' },
          motivation: { type: 'number' },
          seniority: { type: 'number' },
        },
        required: ['communication', 'technicalDepth', 'problemSolving', 'cultureFit', 'motivation', 'seniority'],
      },
      highlights: { type: 'array', items: { type: 'string' } },
      risks: { type: 'array', items: { type: 'string' } },
      notes: { type: 'string' },
      metadata: { type: 'object' },
    },
    required: ['candidateName', 'role', 'overallScore', 'decision', 'scores', 'highlights', 'risks', 'notes', 'metadata'],
  } as const;

  const jobProfile = getJobProfile();

  const system = `You are a rigorous technical interviewer assistant.
- The transcript is a sequence of turns with keys or prefixes "assistant" and "user".
- Treat "assistant" as the interviewer (questions/prompts) and "user" as the interviewee/candidate (answers).
- Evaluate the candidate based primarily on the "user" turns; use "assistant" only for context.
- Be critical and conservative in scoring and decision; do not inflate scores.
- Prefer concrete evidence (specifics, numbers, examples) over generalities. Penalize vagueness or hand-wavy claims.
- If information is missing or uncertain, infer conservatively and explicitly note uncertainties.
- Keep the language professional and HR-ready.`;

  const user = {
    role: input.role || 'Unknown Role',
    candidateName: input.candidate?.name || 'Unknown Candidate',
    transcript: input.transcript,
    jobProfile,
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content:
          `Return ONLY valid JSON for the following evaluation schema:\n${JSON.stringify(schema)}\n\n` +
          `Transcript format guidance:\n` +
          `- assistant: interviewer (questions/prompts)\n` +
          `- user: interviewee/candidate (answers)\n` +
          `Evaluate the candidate using only 'user' turns as evidence; use 'assistant' turns for context.\n` +
          `Be critical and conservative in all scores and the final decision.\n\n` +
          `Input:\n${JSON.stringify(user)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  const text = completion.choices[0]?.message?.content;
  const json = text ? JSON.parse(text) : undefined;
  if (!json) throw new Error('Invalid LLM response');
  return json as EvaluationReport;
}

export async function evaluateTranscript(input: EvaluationInput): Promise<EvaluationReport> {
  try {
    if (config.openaiApiKey) {
      return await evaluateTranscriptLLM(input);
    }
    return evaluateTranscriptHeuristically(input);
  } catch (err) {
    console.warn('LLM evaluation failed, falling back to heuristic:', (err as Error).message);
    return evaluateTranscriptHeuristically(input);
  }
}
