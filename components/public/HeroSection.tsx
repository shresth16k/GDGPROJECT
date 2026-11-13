import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { EventSettings } from '@/types';

interface Props { settings: EventSettings | null; }

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

export default function HeroSection({ settings }: Props) {
  const eventName = settings?.event_name || 'GDG UPES Event 2026';
  const description = settings?.event_description || 'Join us for an amazing Google Developer Groups event at UPES.';
  const formattedDate = formatDate(settings?.event_date);
  
  return (
    <section className="relative overflow-hidden bg-[#21172E] text-white">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#E8755D] blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#9B87C9] blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/3 w-56 h-56 rounded-full bg-[#C5E86C] blur-3xl -translate-y-1/2" />
      </div>
      
      {/* GDG color accent bar */}
      <div className="relative z-10 h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC04]" />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-xs font-display font-semibold text-[#C5E86C] uppercase tracking-wider">
              Google Developer Groups × UPES
            </span>
          </div>
          
          {/* Event name */}
          <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {eventName}
          </h1>
          
          {/* Description */}
          <p className="text-white/70 text-lg sm:text-xl font-sans leading-relaxed mb-8 max-w-2xl">
            {description}
          </p>
          
          {/* Event details */}
          <div className="flex flex-wrap gap-4 sm:gap-6 mb-8">
            {formattedDate && (
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4 text-[#C5E86C] flex-shrink-0" />
                <span className="text-sm font-display font-medium">{formattedDate}</span>
              </div>
            )}
            {settings?.event_time && (
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="w-4 h-4 text-[#C5E86C] flex-shrink-0" />
                <span className="text-sm font-display font-medium">{settings.event_time}</span>
              </div>
            )}
            {settings?.event_venue && (
              <div className="flex items-center gap-2 text-white/80">
                <MapPin className="w-4 h-4 text-[#C5E86C] flex-shrink-0" />
                <span className="text-sm font-display font-medium">{settings.event_venue}</span>
              </div>
            )}
          </div>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="#register"
              data-analytics="register-cta-hero"
              className="inline-flex items-center justify-center bg-[#E8755D] hover:bg-[#d4654e] text-white font-display font-semibold px-8 py-3.5 rounded-xl text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Register Now →
            </a>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Users className="w-4 h-4" />
              <span>Free event · Students only</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom wave */}
      <div className="relative z-10 h-8 bg-gradient-to-b from-transparent to-[#F4EFE7]" />
    </section>
  );
}
