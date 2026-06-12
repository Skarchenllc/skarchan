'use client';

import { useEffect, useState } from 'react';
import { getJSON } from './kit';

// Shows a prominent banner across the AI pages when the Anthropic account is out
// of credits (detected from the most recent AI run's error). Polls /ai/status.
export default function HealthBanner() {
  const [low, setLow] = useState(false);

  useEffect(() => {
    let on = true;
    const check = () => getJSON('/api/v1/ai/status').then((s) => { if (on) setLow(!!s?.ai_health?.credits_low); }).catch(() => {});
    check();
    const id = setInterval(check, 30000);
    return () => { on = false; clearInterval(id); };
  }, []);

  if (!low) return null;
  return (
    <div className="mb-3 px-3 py-2.5 rounded border text-sm flex items-start gap-2"
      style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
      <span className="mt-0.5">⚠️</span>
      <span>
        <strong>AI is out of credits.</strong> The last AI request was rejected for a low Anthropic credit balance, so
        runs, delegations and the daily standup will fail until you top up at the{' '}
        <a className="underline font-semibold" href="https://console.anthropic.com/settings/billing" target="_blank" rel="noreferrer">Anthropic console → Plans &amp; Billing</a>.
        This is separate from the in-app monthly budget.
      </span>
    </div>
  );
}
