import React from 'react';
import VapiWidget from './VapiAssistant';

export default function VapiPanel() {
  const apiKey = import.meta.env.VITE_VAPI_PUBLIC_API_KEY as string | undefined;
  const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID as string | undefined;

  if (apiKey && assistantId) {
    return (
      <div>
        <div className="panel-title">Voice Agent</div>
        <VapiWidget apiKey={apiKey} assistantId={assistantId} />
      </div>
    );
  }

  return <div className="subtle">Voice is disabled. Set VITE_VAPI_PUBLIC_API_KEY and VITE_VAPI_ASSISTANT_ID in the frontend .env to enable the voice agent.</div>;
}
