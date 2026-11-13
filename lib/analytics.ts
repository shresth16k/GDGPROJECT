import { getDb } from './db';

export interface AnalyticsPayload {
  event_type: 'page_view' | 'link_click' | 'button_click' | 'registration_form_start' | 'registration_attempt' | 'registration_success' | 'registration_error';
  element_name?: string;
  element_id?: string;
  element_label?: string;
  target_url?: string;
  page_path?: string;
  anonymous_session_id?: string;
  registration_reference?: string;
}

export async function recordAnalyticsEvent(data: AnalyticsPayload) {
  try {
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO analytics_events (
        event_type, element_name, element_id, element_label, target_url, page_path,
        anonymous_session_id, registration_reference, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.event_type,
        data.element_name || null,
        data.element_id || null,
        data.element_label || null,
        data.target_url || null,
        data.page_path || null,
        data.anonymous_session_id || null,
        data.registration_reference || null,
        new Date().toISOString(),
      ],
    });
  } catch (err) {
    console.error('Failed to log analytics event:', err);
  }
}

