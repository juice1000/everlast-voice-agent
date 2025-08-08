import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  region: process.env.REGION || 'eu-central-1',
  mockSlack: process.env.MOCK_SLACK === 'true',
};

export function getJobProfile(): Record<string, unknown> | undefined {
  const raw = process.env.JOB_PROFILE_JSON;
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('Invalid JOB_PROFILE_JSON; must be a valid JSON string');
    return undefined;
  }
}
