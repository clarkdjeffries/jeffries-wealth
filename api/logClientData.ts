// api/logClientData.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { LoggingSource } from '@/types/loggingsource';

const LOGGING_WEBHOOK_URL = process.env.ZAPIER_LOGGING_WEBHOOK_URL || '';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  if (!LOGGING_WEBHOOK_URL) {
    console.warn('ZAPIER_LOGGING_WEBHOOK_URL is not set. Skipping log.');
    return res.status(200).json({ ok: false, skipped: true });
  }

  try {
    const { source, data } = req.body as { source: LoggingSource; data: any };

    if (!source) {
      return res.status(400).json({ error: 'Missing source' });
    }

    const payload = {
      timestamp: new Date().toISOString(),
      source,
      ...data,
    };

    console.log('Zapier logging payload:', payload);

    const response = await fetch(LOGGING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log('Zapier logging response:', response);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error:', response.status, errorText);
      throw new Error(`Webhook error: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Zapier logging failed:', err);
    throw res.status(500).json({ error: 'Logging failed' });
  }
}
