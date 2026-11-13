import { createClient, type Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

let client: Client | null = null;
let initialized = false;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

    client = createClient({
      url,
      authToken,
    });
  }

  // Self-heal / initialize schema if needed
  if (!initialized) {
    initialized = true;
    initDatabaseSync(client).catch((err) => {
      console.error('Database schema auto-init warning:', err);
    });
  }

  return client;
}

export async function initDatabaseSync(db: Client) {
  try {
    const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await db.execute(statement);
      }

      // Check if event settings row exists
      const checkSettings = await db.execute('SELECT COUNT(*) as count FROM event_settings WHERE id = 1');
      const count = Number(checkSettings.rows[0]?.count || 0);
      if (count === 0) {
        await db.execute(`
          INSERT INTO event_settings (
            id, event_name, event_description, event_date, event_time,
            event_venue, campus_name, university_name, gdg_logo_url, upes_logo_url,
            registration_status, registration_limit, primary_contact_email,
            custom_fields_json, show_registration_count, registration_success_message
          ) VALUES (
            1,
            'GDG DevFest UPES 2026',
            'Join us for the premier campus developer gathering hosted by Google Developer Groups at UPES Dehradun. Discover cutting-edge tech, AI, cloud development, and connect with fellow student developers.',
            '2026-11-28',
            '10:00 AM - 04:30 PM',
            'Main Auditorium, Energy Acres, Bidholi Campus, UPES Dehradun',
            'UPES Dehradun',
            'University of Petroleum and Energy Studies',
            '/logos/gdg-logo.png',
            '/logos/upes-logo.png',
            'open',
            500,
            'gdg@ddn.upes.ac.in',
            '[]',
            1,
            'You have successfully registered for GDG DevFest UPES 2026! Please save your registration number for event check-in.'
          )
        `);
      }
    }
  } catch (err) {
    console.error('Failed to init schema:', err);
  }
}
