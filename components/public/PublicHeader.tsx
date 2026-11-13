'use client';
import Image from 'next/image';
import { EventSettings } from '@/types';

interface Props {
  settings: EventSettings | null;
}

export default function PublicHeader({ settings }: Props) {
  const regStatus = settings?.registration_status;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#E6DFD6]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logos container */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="relative flex-shrink-0"
              style={{ position: 'relative', width: '110px', height: '38px', maxWidth: '110px', maxHeight: '38px' }}
            >
              <Image
                src={settings?.upes_logo_url || '/logos/upes-logo.png'}
                alt="UPES"
                fill
                style={{ objectFit: 'contain', objectPosition: 'left' }}
                sizes="110px"
                priority
              />
            </div>
            <span className="text-[#E6DFD6] font-light text-xl select-none">×</span>
            <div
              className="relative flex-shrink-0"
              style={{ position: 'relative', width: '100px', height: '36px', maxWidth: '100px', maxHeight: '36px' }}
            >
              <Image
                src={settings?.gdg_logo_url || '/logos/gdg-logo.png'}
                alt="GDG"
                fill
                style={{ objectFit: 'contain', objectPosition: 'left' }}
                sizes="100px"
                priority
              />
            </div>
          </div>
          <div className="hidden md:block h-6 w-px bg-[#E6DFD6]" />
          <span className="hidden md:block text-xs font-display font-semibold text-[#857F89]">
            {settings?.campus_name || 'UPES Dehradun'}
          </span>
        </div>

        {/* Status & CTA */}
        <div className="flex items-center gap-3">
          {regStatus === 'open' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-[#4F9990] bg-[#4F9990]/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#4F9990] rounded-full animate-pulse" />
              Registrations Open
            </span>
          )}
          {regStatus === 'closed' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-[#857F89] bg-[#857F89]/10 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-[#857F89] rounded-full" />
              Registrations Closed
            </span>
          )}
          <a
            href="#register"
            data-analytics="register-cta-header"
            className="hidden sm:inline-flex items-center bg-[#E8755D] hover:bg-[#d4654e] text-white text-xs sm:text-sm font-display font-semibold px-4 py-2 rounded-xl transition-colors shadow-xs"
          >
            Register Now
          </a>
        </div>
      </div>
    </header>
  );
}
