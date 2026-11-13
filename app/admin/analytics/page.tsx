'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import {
  MousePointerClick,
  Link as LinkIcon,
  Eye,
  TrendingUp,
  Clock,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TopElement {
  element_name: string;
  element_label?: string;
  element_id?: string;
  count: number;
  last_clicked: string;
}

interface AnalyticsData {
  overview: {
    page_view?: number;
    link_click?: number;
    button_click?: number;
    registration_form_start?: number;
    registration_attempt?: number;
    registration_success?: number;
    registration_error?: number;
    conversion_rate: number;
  };
  topLinks: TopElement[];
  topButtons: TopElement[];
  timeSeries: Array<{ date: string; event_type: string; count: number }>;
  registrationGrowth: Array<{ date: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatIST = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Process timeSeries for charts
  const chartData = (() => {
    if (!data?.timeSeries) return [];
    const dateMap = new Map<string, { date: string; page_views: number; link_clicks: number; button_clicks: number; registrations: number }>();

    for (const item of data.timeSeries) {
      if (!dateMap.has(item.date)) {
        dateMap.set(item.date, { date: item.date, page_views: 0, link_clicks: 0, button_clicks: 0, registrations: 0 });
      }
      const entry = dateMap.get(item.date)!;
      if (item.event_type === 'page_view') entry.page_views += Number(item.count);
      if (item.event_type === 'link_click') entry.link_clicks += Number(item.count);
      if (item.event_type === 'button_click') entry.button_clicks += Number(item.count);
      if (item.event_type === 'registration_success') entry.registrations += Number(item.count);
    }

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const regGrowthData = (() => {
    if (!data?.registrationGrowth) return [];
    let runningTotal = 0;
    return data.registrationGrowth.map((item) => {
      runningTotal += Number(item.count);
      return {
        date: item.date,
        daily: Number(item.count),
        cumulative: runningTotal,
      };
    });
  })();

  const totalLinkClicks = data?.overview?.link_click || 0;
  const totalButtonClicks = data?.overview?.button_click || 0;
  const totalPageViews = data?.overview?.page_view || 0;
  const successfulRegistrations = data?.overview?.registration_success || 0;
  const formStarts = data?.overview?.registration_form_start || 0;
  const conversionRate = data?.overview?.conversion_rate || 0;

  return (
    <div className="min-h-screen bg-[#F4EFE7]">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#21172E]">
              Engagement & Click Analytics
            </h1>
            <p className="text-xs sm:text-sm text-[#857F89] mt-1">
              First-party website telemetry, link CTRs, button interactions, and conversion funnel.
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex bg-white border border-[#E6DFD6] p-1 rounded-2xl shadow-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7 Days' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-display font-semibold transition-all ${
                  timeRange === tab.id
                    ? 'bg-[#21172E] text-white shadow-xs'
                    : 'text-[#857F89] hover:text-[#21172E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Funnel & Primary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-[#E6DFD6] p-4 shadow-xs">
            <span className="text-xs font-display font-semibold text-[#857F89] block mb-1">
              Page Views
            </span>
            <div className="text-2xl font-display font-extrabold text-[#21172E]">
              {loading ? '—' : totalPageViews.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#9B87C9] font-medium mt-1 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Portal traffic
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6DFD6] p-4 shadow-xs">
            <span className="text-xs font-display font-semibold text-[#857F89] block mb-1">
              Total Link Clicks
            </span>
            <div className="text-2xl font-display font-extrabold text-[#E8755D]">
              {loading ? '—' : totalLinkClicks.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#E8755D] font-medium mt-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Navigation & CTAs
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6DFD6] p-4 shadow-xs">
            <span className="text-xs font-display font-semibold text-[#857F89] block mb-1">
              Button Clicks
            </span>
            <div className="text-2xl font-display font-extrabold text-[#9B87C9]">
              {loading ? '—' : totalButtonClicks.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#9B87C9] font-medium mt-1 flex items-center gap-1">
              <MousePointerClick className="w-3 h-3" /> Interactive UI
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6DFD6] p-4 shadow-xs">
            <span className="text-xs font-display font-semibold text-[#857F89] block mb-1">
              Form Starts
            </span>
            <div className="text-2xl font-display font-extrabold text-[#21172E]">
              {loading ? '—' : formStarts.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#857F89] font-medium mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Intent to register
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6DFD6] p-4 shadow-xs">
            <span className="text-xs font-display font-semibold text-[#857F89] block mb-1">
              Successful Regs
            </span>
            <div className="text-2xl font-display font-extrabold text-[#4F9990]">
              {loading ? '—' : successfulRegistrations.toLocaleString()}
            </div>
            <span className="text-[11px] text-[#4F9990] font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Confirmed
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E6DFD6] p-4 shadow-xs">
            <span className="text-xs font-display font-semibold text-[#857F89] block mb-1">
              Conversion Rate
            </span>
            <div className="text-2xl font-display font-extrabold text-[#4F9990]">
              {loading ? '—' : `${conversionRate}%`}
            </div>
            <span className="text-[11px] text-[#4F9990] font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Regs ÷ Visits
            </span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Website Visits and Clicks Activity */}
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="font-editorial text-xl font-bold text-[#21172E]">
                Visitor & Interaction Trends
              </h2>
              <p className="text-xs text-[#857F89]">
                Comparing page views, link clicks, and button interactions over time.
              </p>
            </div>

            <div className="h-72 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E8755D]" />
                </div>
              ) : chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Eye className="w-8 h-8 text-[#857F89]/40 mb-2" />
                  <p className="text-sm font-display text-[#857F89]">Website activity will appear here once visitors begin interacting with the event page.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#21172E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#21172E" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLinks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8755D" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#E8755D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6DFD6" vertical={false} />
                    <XAxis dataKey="date" stroke="#857F89" fontSize={11} tickLine={false} />
                    <YAxis stroke="#857F89" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6DFD6', borderRadius: '1rem', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="page_views" name="Page Views" stroke="#21172E" fillOpacity={1} fill="url(#colorViews)" strokeWidth={2} />
                    <Area type="monotone" dataKey="link_clicks" name="Link Clicks" stroke="#E8755D" fillOpacity={1} fill="url(#colorLinks)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Cumulative Registration Growth */}
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="font-editorial text-xl font-bold text-[#21172E]">
                Student Registration Growth
              </h2>
              <p className="text-xs text-[#857F89]">
                Cumulative confirmed student registrations over the selected timeframe.
              </p>
            </div>

            <div className="h-72 w-full">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4F9990]" />
                </div>
              ) : regGrowthData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <TrendingUp className="w-8 h-8 text-[#857F89]/40 mb-2" />
                  <p className="text-sm font-display text-[#857F89]">No registration data in this period.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E6DFD6" vertical={false} />
                    <XAxis dataKey="date" stroke="#857F89" fontSize={11} tickLine={false} />
                    <YAxis stroke="#857F89" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6DFD6', borderRadius: '1rem', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="daily" name="Daily Registrations" fill="#4F9990" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Link and Button Clicks Detailed Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1: Link Clicks */}
          <div className="bg-white rounded-3xl border border-[#E6DFD6] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E6DFD6] flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[#21172E]">
                  Most Clicked Links
                </h3>
                <p className="text-xs text-[#857F89]">Detailed link-level engagement metrics</p>
              </div>
              <LinkIcon className="w-5 h-5 text-[#E8755D]" />
            </div>

            {!data?.topLinks || data.topLinks.length === 0 ? (
              <div className="p-8 text-center text-[#857F89] text-xs font-display">
                No link clicks recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F4EFE7]/50 text-[#857F89] font-display font-semibold uppercase tracking-wider border-b border-[#E6DFD6]">
                      <th className="py-2.5 px-4">Link / Identifier</th>
                      <th className="py-2.5 px-4 text-right">Total Clicks</th>
                      <th className="py-2.5 px-4 text-right">Last Clicked (IST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD6]">
                    {data.topLinks.map((link, i) => (
                      <tr key={i} className="hover:bg-[#F4EFE7]/40">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#21172E] block">
                            {link.element_label || link.element_name || 'Link'}
                          </span>
                          <span className="text-[11px] font-mono text-[#857F89]">
                            {link.element_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-display font-bold text-[#E8755D] text-sm">
                          {link.count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-[#857F89]">
                          {formatIST(link.last_clicked)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table 2: Button Interactions */}
          <div className="bg-white rounded-3xl border border-[#E6DFD6] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E6DFD6] flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[#21172E]">
                  Button Interactions
                </h3>
                <p className="text-xs text-[#857F89]">Action clicks separated from standard links</p>
              </div>
              <MousePointerClick className="w-5 h-5 text-[#9B87C9]" />
            </div>

            {!data?.topButtons || data.topButtons.length === 0 ? (
              <div className="p-8 text-center text-[#857F89] text-xs font-display">
                No button interactions recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F4EFE7]/50 text-[#857F89] font-display font-semibold uppercase tracking-wider border-b border-[#E6DFD6]">
                      <th className="py-2.5 px-4">Button / Action</th>
                      <th className="py-2.5 px-4 text-right">Total Clicks</th>
                      <th className="py-2.5 px-4 text-right">Last Clicked (IST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD6]">
                    {data.topButtons.map((btn, i) => (
                      <tr key={i} className="hover:bg-[#F4EFE7]/40">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#21172E] block">
                            {btn.element_label || btn.element_name || 'Button'}
                          </span>
                          <span className="text-[11px] font-mono text-[#857F89]">
                            {btn.element_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-display font-bold text-[#9B87C9] text-sm">
                          {btn.count.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-[#857F89]">
                          {formatIST(btn.last_clicked)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

