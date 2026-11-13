import { getDb } from '@/lib/db';
import PublicHeader from '@/components/public/PublicHeader';
import HeroSection from '@/components/public/HeroSection';
import RegistrationSection from '@/components/public/RegistrationSection';
import PublicFooter from '@/components/public/PublicFooter';
import { EventSettings } from '@/types';

export const dynamic = 'force-dynamic';

async function getEventSettings(): Promise<EventSettings | null> {
  try {
    const db = getDb();
    const result = await db.execute('SELECT * FROM event_settings WHERE id = 1');
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: Number(row.id),
      event_name: String(row.event_name || 'GDG DevFest UPES 2026'),
      event_description: row.event_description ? String(row.event_description) : undefined,
      event_date: row.event_date ? String(row.event_date) : undefined,
      event_time: row.event_time ? String(row.event_time) : undefined,
      event_venue: row.event_venue ? String(row.event_venue) : undefined,
      campus_name: row.campus_name ? String(row.campus_name) : 'UPES Dehradun',
      university_name: row.university_name ? String(row.university_name) : 'University of Petroleum and Energy Studies',
      gdg_logo_url: row.gdg_logo_url ? String(row.gdg_logo_url) : undefined,
      upes_logo_url: row.upes_logo_url ? String(row.upes_logo_url) : undefined,
      registration_status: (row.registration_status as 'open' | 'closed' | 'pending') || 'open',
      registration_limit: row.registration_limit ? Number(row.registration_limit) : undefined,
      primary_contact_email: row.primary_contact_email ? String(row.primary_contact_email) : undefined,
      custom_fields_json: row.custom_fields_json ? String(row.custom_fields_json) : '[]',
      show_registration_count: Boolean(row.show_registration_count),
      registration_success_message: row.registration_success_message ? String(row.registration_success_message) : undefined,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  } catch (error) {
    console.error('Failed to load event settings:', error);
    return null;
  }
}

export default async function HomePage() {
  const settings = await getEventSettings();

  return (
    <main className="min-h-screen bg-[#F4EFE7] text-[#21172E] selection:bg-[#E8755D] selection:text-white">
      <PublicHeader settings={settings} />
      <HeroSection settings={settings} />
      <RegistrationSection settings={settings} />
      <PublicFooter settings={settings} />
    </main>
  );
}
