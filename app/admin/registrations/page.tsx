'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import {
  Search,
  Download,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Copy,
  Check,
  Loader2,
  Trash2,
} from 'lucide-react';

interface Registration {
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

export default function RegistrationsManagementPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('registered_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Registration | null>(null);
  const [copiedKey, setCopiedKey] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        status: statusFilter,
        sort: sortField,
        order: sortOrder,
      });

      const res = await fetch(`/api/admin/registrations?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/admin/login';
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error('Failed to fetch registrations:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      window.location.href = '/api/admin/export';
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleSortToggle = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_status: newStatus }),
      });
      if (res.ok) {
        fetchRegistrations();
        if (selectedStudent && selectedStudent.id === id) {
          setSelectedStudent({ ...selectedStudent, registration_status: newStatus });
        }
      }
    } catch {}
  };

  const handleDeleteRegistration = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this registration?')) return;
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSelectedStudent(null);
        fetchRegistrations();
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F4EFE7]">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#21172E]">
              Student Registrations
            </h1>
            <p className="text-xs sm:text-sm text-[#857F89] mt-1">
              Search, filter, inspect profiles, and export complete student datasets.
            </p>
          </div>

          <div>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#21172E] hover:bg-[#2d1f3d] text-white text-sm font-display font-semibold transition-all shadow-sm disabled:opacity-60"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#C5E86C]" />}
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-[#E6DFD6] p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#857F89]" />
            <input
              type="text"
              placeholder="Search by Name, Email, SAP ID, or Reg Number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-xs sm:text-sm text-[#21172E] placeholder:text-[#857F89] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#857F89]" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-[#E6DFD6] bg-white text-xs font-display font-semibold text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <span className="text-xs text-[#857F89] font-display ml-auto md:ml-0">
              Total: <strong className="text-[#21172E]">{total.toLocaleString('en-IN')}</strong> entries
            </span>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-3xl border border-[#E6DFD6] shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#E8755D] mx-auto mb-3" />
              <p className="text-sm font-display text-[#857F89]">Loading registered students...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-sm font-display font-semibold text-[#21172E]">No registration records found.</p>
              <p className="text-xs text-[#857F89] mt-1">Try adjusting your search criteria or filter options.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#F4EFE7]/60 border-b border-[#E6DFD6] text-xs font-display font-semibold text-[#857F89] uppercase tracking-wider">
                    <th className="py-3.5 px-5">Reg Number</th>
                    <th
                      className="py-3.5 px-5 cursor-pointer hover:text-[#21172E] select-none"
                      onClick={() => handleSortToggle('full_name')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Student Name</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-5">University Email</th>
                    <th className="py-3.5 px-5">SAP ID</th>
                    <th className="py-3.5 px-5">Department</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th
                      className="py-3.5 px-5 cursor-pointer hover:text-[#21172E] select-none"
                      onClick={() => handleSortToggle('registered_at')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Registered (IST)</span>
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD6]">
                  {registrations.map((reg) => (
                    <tr
                      key={reg.id}
                      onClick={() => setSelectedStudent(reg)}
                      className="hover:bg-[#F4EFE7]/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono font-bold text-xs text-[#E8755D]">
                        {reg.registration_number}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#21172E]">
                        {reg.full_name}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#857F89]">
                        {reg.email}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-[#21172E]">
                        {reg.sap_id}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#857F89] max-w-xs truncate">
                        {reg.department || '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-display font-semibold ${
                            reg.registration_status === 'confirmed'
                              ? 'bg-[#4F9990]/10 text-[#4F9990]'
                              : reg.registration_status === 'cancelled'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-600'
                          }`}
                        >
                          {reg.registration_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-[#857F89]">
                        {formatIST(reg.registered_at)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(reg);
                          }}
                          className="text-xs font-display font-semibold text-[#21172E] hover:text-[#E8755D]"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#E6DFD6] flex items-center justify-between">
            <span className="text-xs text-[#857F89]">
              Page {page} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl border border-[#E6DFD6] bg-white hover:bg-[#F4EFE7] disabled:opacity-40 disabled:hover:bg-white text-[#21172E] transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl border border-[#E6DFD6] bg-white hover:bg-[#F4EFE7] disabled:opacity-40 disabled:hover:bg-white text-[#21172E] transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
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
                  Student Record Details
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
                  onClick={() => copyToClipboard(selectedStudent.registration_number, 'modal_reg')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E6DFD6] text-xs font-display font-semibold text-[#21172E] hover:bg-[#E8755D] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  {copiedKey === 'modal_reg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'modal_reg' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-[#F4EFE7]/40 border border-[#E6DFD6]/60">
                  <span className="text-xs text-[#857F89] font-display block">SAP ID</span>
                  <span className="font-mono font-semibold text-[#21172E]">{selectedStudent.sap_id}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#F4EFE7]/40 border border-[#E6DFD6]/60">
                  <span className="text-xs text-[#857F89] font-display block">Change Status</span>
                  <select
                    value={selectedStudent.registration_status}
                    onChange={(e) => handleStatusChange(selectedStudent.id, e.target.value)}
                    className="mt-0.5 text-xs font-display font-semibold text-[#21172E] bg-transparent border-0 focus:outline-none cursor-pointer"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
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
                  <span className="text-[#857F89]">Academic Year</span>
                  <span className="font-medium text-[#21172E]">{selectedStudent.year || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#E6DFD6]/50">
                  <span className="text-[#857F89]">Semester</span>
                  <span className="font-medium text-[#21172E]">{selectedStudent.semester || '—'}</span>
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

              {/* Custom fields */}
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

            <div className="mt-8 pt-4 border-t border-[#E6DFD6] flex items-center justify-between">
              <button
                onClick={() => handleDeleteRegistration(selectedStudent.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-display font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </button>

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

