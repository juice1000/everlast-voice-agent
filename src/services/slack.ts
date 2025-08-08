import axios from 'axios';
import { config } from '../config';
import { EvaluationReport } from '../types';

export async function postToSlack(report: EvaluationReport): Promise<void> {
  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: `Interview Outcome: ${report.candidateName} → ${report.role}` } },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Decision*\n${report.decision}` },
        { type: 'mrkdwn', text: `*Overall Score*\n${report.overallScore}/100` },
      ],
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Communication*\n${report.scores.communication}/10` },
        { type: 'mrkdwn', text: `*Technical Depth*\n${report.scores.technicalDepth}/10` },
        { type: 'mrkdwn', text: `*Problem Solving*\n${report.scores.problemSolving}/10` },
        { type: 'mrkdwn', text: `*Culture Fit*\n${report.scores.cultureFit}/10` },
        { type: 'mrkdwn', text: `*Motivation*\n${report.scores.motivation}/10` },
        { type: 'mrkdwn', text: `*Seniority*\n${report.scores.seniority}/10` },
      ],
    },
    { type: 'section', text: { type: 'mrkdwn', text: `*Highlights*\n• ${report.highlights.join('\n• ')}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*Risks*\n• ${report.risks.join('\n• ')}` } },
    { type: 'context', elements: [{ type: 'mrkdwn', text: report.notes }] },
  ];

  if (config.mockSlack || !config.slackWebhookUrl) {
    console.log('[MOCK SLACK] Would post the following blocks:', JSON.stringify(blocks));
    return;
  }

  try {
    await axios.post(config.slackWebhookUrl, { blocks });
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('Failed to post to Slack', status, data);
  }
}
