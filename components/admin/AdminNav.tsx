'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { LayoutDashboard, Users, BarChart3, Settings, LogOut, Menu, X, ExternalLink } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/registrations', label: 'Registrations', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Event Settings', icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch {
      router.push('/admin/login');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E6DFD6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Branding */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div
                className="relative flex-shrink-0"
                style={{ position: 'relative', width: '85px', height: '30px', maxWidth: '85px', maxHeight: '30px' }}
              >
                <Image
                  src="/logos/gdg-logo.png"
                  alt="GDG"
                  fill
                  style={{ objectFit: 'contain', objectPosition: 'left' }}
                  sizes="85px"
                  priority
                />
              </div>
              <span className="text-xs bg-[#21172E] text-white font-display font-semibold px-2 py-0.5 rounded-md">
                Admin Portal
              </span>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-display font-semibold transition-all ${
                    isActive
                      ? 'bg-[#21172E] text-white shadow-xs'
                      : 'text-[#857F89] hover:text-[#21172E] hover:bg-[#F4EFE7]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Quick actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-[#857F89] hover:text-[#21172E] px-3 py-1.5 rounded-lg border border-[#E6DFD6] hover:bg-[#F4EFE7] transition-colors"
            >
              <span>View Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#21172E] hover:bg-[#F4EFE7] transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E6DFD6] bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-semibold ${
                  isActive ? 'bg-[#21172E] text-white' : 'text-[#857F89] hover:bg-[#F4EFE7] hover:text-[#21172E]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#E6DFD6] flex justify-between items-center px-1">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-display font-semibold text-[#857F89] inline-flex items-center gap-1"
            >
              <span>View Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-display font-semibold text-red-600 inline-flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
