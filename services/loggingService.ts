// // services/loggingService.ts
import { LoggingSource } from '@/types/loggingsource';

export async function logClientData(
  source: LoggingSource,
  data: any
): Promise<void> {
  const clientTimestamp = new Date().toISOString();

  if (source === 'WEALTH_SIMULATOR') {
    // Primary Attempt: POST to /api/audit
    try {
      const primaryResponse = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          clientTimestamp,
          ...data
        }),
      });

      if (primaryResponse.ok) {
        console.log(`[${source}] Primary logging successful.`);
        return;
      }
    } catch (error) {
      console.error(`[${source}] Supabase logging failed:`, error);
    }
  }

  try {
    // Construct minimized payload to reduce sensitivity in third-party logs
    // Excludes raw_input and full derived objects
    const fallbackPayload: any = {
      timestamp: clientTimestamp,
      source: source,
    };

    // Whitelist of allowed fields for fallback
    const whitelist = ['lead', 'keyFacts', 'presentedAlertIds', 'engineVersion', 'versions'];
    whitelist.forEach(key => {
      if (data[key] !== undefined) {
        fallbackPayload[key] = data[key];
      }
    });

    const res = await fetch('/api/logClientData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fallbackPayload),
    });

    if (!res.ok) {
      console.warn(`[${source}] logClientData returned ${res.status}`);

      const error = await res.text();
      console.error(`[${source}] logClientData failed:`, error);
      throw new Error(`Logging failed: ${error}`);
    }
  } catch (err) {
    console.error(`[${source}] logClientData failed:`, err);
  }

};
