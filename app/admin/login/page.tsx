'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Fallback if not valid JSON
        data = null;
      }

      if (!res.ok) {
        setError(data?.error || `Authentication failed (${res.status}). Please verify credentials.`);
        setIsLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An error occurred during authentication. Please retry.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFE7] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logos & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div
              className="relative flex-shrink-0"
              style={{ position: 'relative', width: '120px', height: '42px', maxWidth: '120px', maxHeight: '42px' }}
            >
              <Image
                src="/logos/upes-logo.png"
                alt="UPES"
                fill
                style={{ objectFit: 'contain', objectPosition: 'center' }}
                sizes="120px"
                priority
              />
            </div>
            <span className="text-[#E6DFD6] font-light text-2xl select-none">×</span>
            <div
              className="relative flex-shrink-0"
              style={{ position: 'relative', width: '110px', height: '40px', maxWidth: '110px', maxHeight: '40px' }}
            >
              <Image
                src="/logos/gdg-logo.png"
                alt="GDG"
                fill
                style={{ objectFit: 'contain', objectPosition: 'center' }}
                sizes="110px"
                priority
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-white border border-[#E6DFD6] px-3 py-1 rounded-full text-xs font-display font-semibold text-[#857F89] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4F9990]" />
            <span>Authorized Event Organizers Only</span>
          </div>

          <h1 className="font-editorial text-3xl font-bold text-[#21172E]">
            Admin Sign In
          </h1>
          <p className="text-xs sm:text-sm text-[#857F89] mt-1">
            Access registration data, participant analytics, and configuration.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#E6DFD6] p-7 sm:p-9 shadow-sm">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  autoComplete="current-password"
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] placeholder:text-[#857F89] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#857F89] hover:text-[#21172E] rounded-md transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-[#21172E] hover:bg-[#2d1f3d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-display font-semibold py-3.5 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Authenticate & Enter Portal</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#857F89] mt-6">
          Google Developer Groups × UPES Dehradun · Secure Server Authentication
        </p>
      </div>
    </div>
  );
}
