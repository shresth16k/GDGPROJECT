'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import {
  Users,
  MousePointerClick,
  Eye,
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  ChevronRight,
  X,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface Stats {
  totalRegistrations: number;
  totalLinkClicks: number;
  totalPageVisits: number;
  successfulRegistrations: number;
  conversionRate: number;
}

interface RecentRegistration {
  id: number;
  registration_number: string;
  full_name: string;
  email: string;
  sap_id: string;
  department?: string;
  specialization?: string;
  year?: string;
  semester?: string;
  phone_number?: string;
  additional_fields_json?: string;
  registration_status: string;
  registered_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalRegistrations: 0,
    totalLinkClicks: 0,
    totalPageVisits: 0,
    successfulRegistrations: 0,
    conversionRate: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState<RecentRegistration[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<RecentRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [copiedKey, setCopiedKey] = useState<string>('');

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.recentRegistrations) setRecentRegistrations(data.recentRegistrations);
        setLastRefreshedAt(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, []);

  // Set up live polling (every 8 seconds), pausing when page is hidden
  useEffect(() => {
    fetchDashboardData();

    let intervalId: NodeJS.Timeout | null = setInterval(() => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    }, 8000);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDashboardData]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {}
  };

  const formatIST = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFE7]">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#21172E]">
              Event Operations Overview
            </h1>
            <p className="text-xs sm:text-sm text-[#857F89] mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4F9990] animate-pulse" />
              <span>Live database sync active</span>
              <span>·</span>
              <span className="font-mono">
                Updated {lastRefreshedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E6DFD6] bg-white text-xs font-display font-semibold text-[#21172E] hover:bg-[#F4EFE7] transition-colors disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E8755D]' : ''}`} />
              <span>Refresh</span>
            </button>

            <a
              href="/api/admin/export"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#21172E] hover:bg-[#2d1f3d] text-white text-xs font-display font-semibold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel (.xlsx)</span>
            </a>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1: Registered Students (Hero Highlight) */}
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#857F89]">
                Total Registered Students
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#21172E]/5 text-[#21172E] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="font-display font-extrabold text-4xl sm:text-5xl text-[#21172E] tracking-tight">
              {loading ? '—' : stats.totalRegistrations.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[#4F9990] font-medium mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified entries stored in database</span>
            </p>
          </div>

          {/* Card 2: Total Link Clicks (Hero Highlight) */}
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#857F89]">
                Website Link Clicks
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#E8755D]/10 text-[#E8755D] flex items-center justify-center">
                <MousePointerClick className="w-5 h-5" />
              </div>
            </div>
            <div className="font-display font-extrabold text-4xl sm:text-5xl text-[#E8755D] tracking-tight">
              {loading ? '—' : stats.totalLinkClicks.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[#857F89] font-medium mt-2">
              CTA & navigation link interactions
            </p>
          </div>

          {/* Card 3: Total Page Visits */}
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#857F89]">
                Total Page Visits
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#9B87C9]/10 text-[#9B87C9] flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#21172E] tracking-tight">
              {loading ? '—' : stats.totalPageVisits.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[#857F89] font-medium mt-2">
              Public registration portal views
            </p>
          </div>

          {/* Card 4: Conversion Rate */}
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-[#857F89]">
                Conversion Rate
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#4F9990]/10 text-[#4F9990] flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-[#4F9990] tracking-tight">
              {loading ? '—' : `${stats.conversionRate}%`}
            </div>
            <p className="text-xs text-[#857F89] font-medium mt-2">
              Registrations ÷ Portal Visits × 100
            </p>
          </div>
        </div>

        {/* Recent Registrations Section */}
        <div className="bg-white rounded-3xl border border-[#E6DFD6] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#E6DFD6] flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-2xl font-bold text-[#21172E]">
                Recent Student Registrations
              </h2>
              <p className="text-xs text-[#857F89] mt-0.5">
                Click any student entry to view their complete registered profile and details.
              </p>
            </div>

            <Link
              href="/admin/registrations"
              className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-[#E8755D] hover:underline"
            >
              <span>Manage All Records</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F4EFE7] text-[#857F89] flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-[#21172E]">No students have registered yet.</h3>
              <p className="text-xs text-[#857F89] mt-1 max-w-sm mx-auto">
                Registrations will appear in real time as students fill out the public event registration form.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#F4EFE7]/50 border-b border-[#E6DFD6] text-xs font-display font-semibold text-[#857F89] uppercase tracking-wider">
                    <th className="py-3 px-5">Reg Number</th>
                    <th className="py-3 px-5">Student Name</th>
                    <th className="py-3 px-5">University Email</th>
                    <th className="py-3 px-5">SAP ID</th>
                    <th className="py-3 px-5">Registered At (IST)</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD6]">
                  {recentRegistrations.map((reg) => (
                    <tr
                      key={reg.id}
                      onClick={() => setSelectedStudent(reg)}
                      className="hover:bg-[#F4EFE7]/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-xs text-[#E8755D]">
                        {reg.registration_number}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#21172E]">
                        {reg.full_name}
                      </td>
                      <td className="py-3.5 px-5 text-[#857F89]">
                        {reg.email}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-[#21172E]">
                        {reg.sap_id}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#857F89] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#857F89]" />
                        <span>{formatIST(reg.registered_at)}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="text-xs font-display font-semibold text-[#21172E] hover:text-[#E8755D]">
                          Details →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Student Details Popup Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="bg-white rounded-3xl border border-[#E6DFD6] w-full max-w-lg p-6 sm:p-8 shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DFD6] mb-6">
              <div>
                <span className="text-xs uppercase tracking-wider font-display font-semibold text-[#E8755D]">
                  Student Registration Profile
                </span>
                <h3 className="font-editorial text-2xl font-bold text-[#21172E]">
                  {selectedStudent.full_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-[#857F89] hover:bg-[#F4EFE7] hover:text-[#21172E] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F4EFE7] rounded-2xl p-4 flex items-center justify-between border border-[#E6DFD6]">
                <div>
                  <span className="text-xs font-display font-semibold text-[#857F89] block">
                    Registration Number
                  </span>
                  <span className="font-mono font-bold text-lg text-[#21172E]">
                    {selectedStudent.registration_number}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedStudent.registration_number, 'reg_num')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E6DFD6] text-xs font-display font-semibold text-[#21172E] hover:bg-[#E8755D] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  {copiedKey === 'reg_num' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'reg_num' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-[#F4EFE7]/40 border border-[#E6DFD6]/60">
                  <span className="text-xs text-[#857F89] font-display block">SAP ID</span>
                  <span className="font-mono font-semibold text-[#21172E]">{selectedStudent.sap_id}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F4EFE7]/40 border border-[#E6DFD6]/60">
                  <span className="text-xs text-[#857F89] font-display block">Status</span>
                  <span className="font-display font-semibold text-[#4F9990] capitalize">
                    {selectedStudent.registration_status}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between py-2 border-b border-[#E6DFD6]/50">
                  <span className="text-[#857F89]">Email Address</span>
                  <span className="font-medium text-[#21172E]">{selectedStudent.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6DFD6]/50">
                  <span className="text-[#857F89]">Department</span>
                  <span className="font-medium text-[#21172E]">{selectedStudent.department || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6DFD6]/50">
                  <span className="text-[#857F89]">Specialization</span>
                  <span className="font-medium text-[#21172E]">{selectedStudent.specialization || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6DFD6]/50">
                  <span className="text-[#857F89]">Academic Year & Semester</span>
                  <span className="font-medium text-[#21172E]">
                    {selectedStudent.year || '—'} {selectedStudent.semester ? `· ${selectedStudent.semester}` : ''}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6DFD6]/50">
                  <span className="text-[#857F89]">Phone Number</span>
                  <span className="font-medium text-[#21172E]">{selectedStudent.phone_number || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6DFD6]/50">
                  <span className="text-[#857F89]">Registered Timestamp</span>
                  <span className="font-medium text-[#21172E]">{formatIST(selectedStudent.registered_at)}</span>
                </div>
              </div>

              {/* Custom questions if any */}
              {selectedStudent.additional_fields_json && (
                <div className="pt-2">
                  <span className="text-xs font-display font-bold uppercase tracking-wider text-[#857F89] block mb-2">
                    Additional Responses
                  </span>
                  <div className="space-y-2 text-xs">
                    {Object.entries(JSON.parse(selectedStudent.additional_fields_json || '{}')).map(([k, v]) => (
                      <div key={k} className="p-2.5 bg-[#F4EFE7]/40 rounded-xl border border-[#E6DFD6]/60">
                        <span className="font-semibold text-[#857F89] block mb-0.5">{k}</span>
                        <span className="text-[#21172E] font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-[#E6DFD6] flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-[#21172E] text-white text-xs font-display font-semibold hover:bg-[#2d1f3d] transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

