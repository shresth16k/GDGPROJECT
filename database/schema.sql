CREATE TABLE IF NOT EXISTS event_settings (
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
);

CREATE TABLE IF NOT EXISTS registrations (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_email ON registrations(lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_sap ON registrations(lower(sap_id));
CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations(registered_at);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(registration_status);

CREATE TABLE IF NOT EXISTS analytics_events (
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
);

CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(anonymous_session_id);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_activity_logs(created_at);

CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier_hash TEXT NOT NULL,
  request_type TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(identifier_hash, request_type)
);

