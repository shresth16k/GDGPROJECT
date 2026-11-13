import { createClient, type Client } from '@libsql/client';

let client: Client | null = null;
let initialized = false;

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS event_settings (
    id INTEGER PRIMARY KEY,
    event_name TEXT NOT NULL DEFAULT 'GDG DevFest UPES 2026',
    event_description TEXT DEFAULT 'Join us for the premier campus developer gathering hosted by Google Developer Groups at UPES Dehradun. Discover cutting-edge tech, AI, cloud development, and connect with fellow student developers.',
    event_date TEXT DEFAULT '2026-11-28',
    event_time TEXT DEFAULT '10:00 AM - 04:30 PM',
    event_venue TEXT DEFAULT 'Main Auditorium, Energy Acres, Bidholi Campus, UPES Dehradun',
    campus_name TEXT DEFAULT 'UPES Dehradun',
    university_name TEXT DEFAULT 'University of Petroleum and Energy Studies',
    gdg_logo_url TEXT DEFAULT '/logos/gdg-logo.png',
    upes_logo_url TEXT DEFAULT '/logos/upes-logo.png',
    registration_status TEXT NOT NULL DEFAULT 'open' CHECK(registration_status IN ('open','closed','pending')),
    registration_start_date TEXT,
    registration_end_date TEXT,
    registration_limit INTEGER DEFAULT 500,
    primary_contact_email TEXT DEFAULT 'gdg@ddn.upes.ac.in',
    custom_fields_json TEXT DEFAULT '[]',
    show_registration_count INTEGER DEFAULT 1,
    registration_success_message TEXT DEFAULT 'You have successfully registered for GDG DevFest UPES 2026! Please save your registration number for entry.',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    sap_id TEXT NOT NULL,
    department TEXT,
    specialization TEXT,
    year TEXT,
    semester TEXT,
    phone_number TEXT,
    additional_fields_json TEXT DEFAULT '{}',
    registration_status TEXT NOT NULL DEFAULT 'confirmed' CHECK(registration_status IN ('confirmed','cancelled','pending')),
    registered_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_email ON registrations(lower(email))`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_sap ON registrations(lower(sap_id))`,
  `CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(registered_at)`,
  `CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(registration_status)`,
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT NOT NULL,
    element_name TEXT,
    element_id TEXT,
    element_label TEXT,
    target_url TEXT,
    page_path TEXT,
    anonymous_session_id TEXT,
    registration_reference TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(anonymous_session_id)`,
  `CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_activity_logs(created_at)`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier_hash TEXT NOT NULL,
    request_type TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(identifier_hash, request_type)
  )`
];

export function getDb(): Client {
  if (!client) {
    const isVercel = Boolean(process.env.VERCEL);
    const defaultUrl = isVercel ? 'file:/tmp/local.db' : 'file:local.db';
    const url = process.env.TURSO_DATABASE_URL || defaultUrl;
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
    for (const statement of SCHEMA_STATEMENTS) {
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
  } catch (err) {
    console.error('Failed to init schema:', err);
  }
}
