import { EventSettings } from '@/types';

interface Props { settings: EventSettings | null; }

export default function PublicFooter({ settings }: Props) {
  return (
    <footer className="bg-[#21172E] text-white/60 py-8 mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-white">GDG × UPES</span>
            <span>·</span>
            <span>{settings?.campus_name || 'UPES Dehradun'}</span>
          </div>
          <div className="flex items-center gap-4">
            {settings?.primary_contact_email && (
              <a
                href={`mailto:${settings.primary_contact_email}`}
                data-analytics="footer-contact-email"
                className="hover:text-white transition-colors"
              >
                Contact Organizers
              </a>
            )}
            <span>© {new Date().getFullYear()} GDG UPES</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
