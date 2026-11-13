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
        {/* Logos container — shrink on mobile */}
        <div className="flex items-center gap-2 sm:gap-5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <div
              className="relative flex-shrink-0"
              style={{ position: 'relative', width: '80px', height: '28px' }}
            >
              <Image
                src={settings?.upes_logo_url || '/logos/upes-logo.png'}
                alt="UPES"
                fill
                style={{ objectFit: 'contain', objectPosition: 'left' }}
                sizes="80px"
                priority
              />
            </div>
            <span className="text-[#E6DFD6] font-light text-base select-none">×</span>
            <div
              className="relative flex-shrink-0"
              style={{ position: 'relative', width: '70px', height: '26px' }}
            >
              <Image
                src={settings?.gdg_logo_url || '/logos/gdg-logo.png'}
                alt="GDG"
                fill
                style={{ objectFit: 'contain', objectPosition: 'left' }}
                sizes="70px"
                priority
              />
            </div>
          </div>
          <div className="hidden md:block h-6 w-px bg-[#E6DFD6]" />
          <span className="hidden md:block text-xs font-display font-semibold text-[#857F89]">
            {settings?.campus_name || 'UPES Dehradun'}
          </span>
        </div>

        {/* Status badge — always visible, compact on mobile */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {regStatus === 'open' && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-display font-semibold text-[#4F9990] bg-[#4F9990]/10 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-[#4F9990] rounded-full animate-pulse flex-shrink-0" />
              <span className="sm:hidden">Open</span>
              <span className="hidden sm:inline">Registrations Open</span>
            </span>
          )}
          {regStatus === 'closed' && (
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-display font-semibold text-[#857F89] bg-[#857F89]/10 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full whitespace-nowrap">
              <span className="w-1.5 h-1.5 bg-[#857F89] rounded-full flex-shrink-0" />
              <span className="sm:hidden">Closed</span>
              <span className="hidden sm:inline">Registrations Closed</span>
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
