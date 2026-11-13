'use client';

import { useState, useEffect } from 'react';
import AdminNav from '@/components/admin/AdminNav';
import {
  Save,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Mail,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CustomField } from '@/types';

interface SettingsState {
  event_name: string;
  event_description: string;
  event_date: string;
  event_time: string;
  event_venue: string;
  campus_name: string;
  university_name: string;
  gdg_logo_url: string;
  upes_logo_url: string;
  registration_status: 'open' | 'closed' | 'pending';
  registration_limit: number;
  primary_contact_email: string;
  custom_fields_json: string;
  show_registration_count: boolean;
  registration_success_message: string;
}

export default function EventSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    event_name: 'GDG DevFest UPES 2026',
    event_description: '',
    event_date: '',
    event_time: '',
    event_venue: '',
    campus_name: 'UPES Dehradun',
    university_name: 'University of Petroleum and Energy Studies',
    gdg_logo_url: '/logos/gdg-logo.png',
    upes_logo_url: '/logos/upes-logo.png',
    registration_status: 'open',
    registration_limit: 500,
    primary_contact_email: 'gdg@ddn.upes.ac.in',
    custom_fields_json: '[]',
    show_registration_count: true,
    registration_success_message: 'You have successfully registered for the event!',
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => {
        if (res.status === 401) {
          window.location.href = '/admin/login';
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.settings) {
          const s = data.settings;
          setSettings({
            event_name: s.event_name || '',
            event_description: s.event_description || '',
            event_date: s.event_date || '',
            event_time: s.event_time || '',
            event_venue: s.event_venue || '',
            campus_name: s.campus_name || 'UPES Dehradun',
            university_name: s.university_name || 'University of Petroleum and Energy Studies',
            gdg_logo_url: s.gdg_logo_url || '/logos/gdg-logo.png',
            upes_logo_url: s.upes_logo_url || '/logos/upes-logo.png',
            registration_status: s.registration_status || 'open',
            registration_limit: Number(s.registration_limit || 0),
            primary_contact_email: s.primary_contact_email || '',
            custom_fields_json: s.custom_fields_json || '[]',
            show_registration_count: Boolean(s.show_registration_count),
            registration_success_message: s.registration_success_message || '',
          });

          try {
            setCustomFields(JSON.parse(s.custom_fields_json || '[]'));
          } catch {
            setCustomFields([]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load settings:', err);
        setErrorMessage('Failed to fetch event settings.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const payload = {
        ...settings,
        registration_limit: Number(settings.registration_limit),
        custom_fields_json: JSON.stringify(customFields),
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to save settings.');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch {
      setErrorMessage('Network error while saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: 'New Question',
      type: 'text',
      required: false,
      placeholder: '',
    };
    setCustomFields([...customFields, newField]);
  };

  const updateCustomField = (index: number, updates: Partial<CustomField>) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...updates };
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4EFE7]">
        <AdminNav />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8755D] mx-auto mb-3" />
          <p className="text-sm font-display text-[#857F89]">Loading event configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4EFE7]">
      <AdminNav />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSave}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#21172E]">
                Event Settings & Customization
              </h1>
              <p className="text-xs sm:text-sm text-[#857F89] mt-1">
                Configure event details, dates, registration limits, and custom student form questions dynamically.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E8755D] hover:bg-[#d4654e] text-white text-sm font-display font-semibold transition-all shadow-sm disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-[#4F9990]/10 border border-[#4F9990]/30 text-[#4F9990] text-sm flex items-center gap-2 font-display font-semibold">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Event settings and registration parameters updated successfully!</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 font-display font-medium">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Section 1: Core Event Details */}
            <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 sm:p-8 shadow-sm">
              <h2 className="font-editorial text-xl font-bold text-[#21172E] mb-1">
                Core Event Identity
              </h2>
              <p className="text-xs text-[#857F89] mb-6">
                These details are displayed on the public event homepage and student registration pass.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                    Event Title / Heading <span className="text-[#E8755D]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.event_name}
                    onChange={(e) => setSettings({ ...settings, event_name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                    Event Description
                  </label>
                  <textarea
                    rows={3}
                    value={settings.event_description}
                    onChange={(e) => setSettings({ ...settings, event_description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={settings.event_date}
                      onChange={(e) => setSettings({ ...settings, event_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                      Event Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM - 04:30 PM"
                      value={settings.event_time}
                      onChange={(e) => setSettings({ ...settings, event_time: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                    Event Venue / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Main Auditorium, Energy Acres, Bidholi Campus, UPES"
                    value={settings.event_venue}
                    onChange={(e) => setSettings({ ...settings, event_venue: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                      Campus Name
                    </label>
                    <input
                      type="text"
                      value={settings.campus_name}
                      onChange={(e) => setSettings({ ...settings, campus_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                      University Name
                    </label>
                    <input
                      type="text"
                      value={settings.university_name}
                      onChange={(e) => setSettings({ ...settings, university_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Registration Controls & Limits */}
            <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 sm:p-8 shadow-sm">
              <h2 className="font-editorial text-xl font-bold text-[#21172E] mb-1">
                Registration Controls & Capacity
              </h2>
              <p className="text-xs text-[#857F89] mb-6">
                Manage registration status, student seat limits, contact email, and visibility options.
              </p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                      Registration Status
                    </label>
                    <select
                      value={settings.registration_status}
                      onChange={(e) => setSettings({ ...settings, registration_status: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm font-semibold text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30"
                    >
                      <option value="open">Open (Accepting Registrations)</option>
                      <option value="closed">Closed (Submissions Blocked)</option>
                      <option value="pending">Pending (Opening Soon)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                      Registration Limit (0 = Unlimited)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={settings.registration_limit}
                      onChange={(e) => setSettings({ ...settings, registration_limit: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                      Primary Contact Email
                    </label>
                    <input
                      type="email"
                      value={settings.primary_contact_email}
                      onChange={(e) => setSettings({ ...settings, primary_contact_email: e.target.value })}
                      placeholder="e.g. gdg@ddn.upes.ac.in"
                      className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                      Success Screen Message
                    </label>
                    <input
                      type="text"
                      value={settings.registration_success_message}
                      onChange={(e) => setSettings({ ...settings, registration_success_message: e.target.value })}
                      placeholder="Custom confirmation message shown to students"
                      className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                    />
                  </div>
                </div>

                {/* Checkbox: Show registration count publicly */}
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.show_registration_count}
                      onChange={(e) => setSettings({ ...settings, show_registration_count: e.target.checked })}
                      className="w-5 h-5 rounded-md text-[#E8755D] focus:ring-[#E8755D] border-[#E6DFD6]"
                    />
                    <div>
                      <span className="text-sm font-display font-semibold text-[#21172E] block">
                        Display live participant count on public portal
                      </span>
                      <span className="text-xs text-[#857F89] block">
                        Shows "X students already registered" badge on the landing page.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Branding & Logos */}
            <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 sm:p-8 shadow-sm">
              <h2 className="font-editorial text-xl font-bold text-[#21172E] mb-1">
                Branding & Hosted Logo URLs
              </h2>
              <p className="text-xs text-[#857F89] mb-6">
                Replace or configure image URLs for official logos. Both logos default to the transparent assets uploaded.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                    GDG Logo URL
                  </label>
                  <input
                    type="text"
                    value={settings.gdg_logo_url}
                    onChange={(e) => setSettings({ ...settings, gdg_logo_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#21172E] mb-2">
                    UPES Logo URL
                  </label>
                  <input
                    type="text"
                    value={settings.upes_logo_url}
                    onChange={(e) => setSettings({ ...settings, upes_logo_url: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-sm text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D]"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Dynamic Custom Form Fields */}
            <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-editorial text-xl font-bold text-[#21172E]">
                    Custom Registration Questions
                  </h2>
                  <p className="text-xs text-[#857F89] mt-0.5">
                    Add custom fields to the registration form. Responses are saved in Turso and automatically exported as columns in Excel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#21172E] hover:bg-[#2d1f3d] text-white text-xs font-display font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              {customFields.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-[#E6DFD6] text-center text-xs text-[#857F89]">
                  No custom questions added yet. The standard form includes Full Name, University Email, SAP ID, Department, Specialization, Year, Semester, and Phone.
                </div>
              ) : (
                <div className="space-y-4">
                  {customFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-2xl border border-[#E6DFD6] bg-[#F4EFE7]/30 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-bold text-[#21172E]">
                          Question #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCustomField(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-display font-semibold text-[#857F89] mb-1">
                            Question / Label
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateCustomField(idx, { label: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-[#E6DFD6] bg-white text-xs text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-display font-semibold text-[#857F89] mb-1">
                            Field Type
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateCustomField(idx, { type: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-lg border border-[#E6DFD6] bg-white text-xs text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30"
                          >
                            <option value="text">Single Line Text</option>
                            <option value="textarea">Paragraph Text</option>
                            <option value="select">Dropdown Menu</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                          </select>
                        </div>
                      </div>

                      {field.type === 'select' && (
                        <div>
                          <label className="block text-[11px] font-display font-semibold text-[#857F89] mb-1">
                            Options (comma-separated)
                          </label>
                          <input
                            type="text"
                            placeholder="Option 1, Option 2, Option 3"
                            value={(field.options || []).join(', ')}
                            onChange={(e) =>
                              updateCustomField(idx, {
                                options: e.target.value.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-[#E6DFD6] bg-white text-xs text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30"
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-display text-[#21172E]">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateCustomField(idx, { required: e.target.checked })}
                            className="w-4 h-4 rounded text-[#E8755D] focus:ring-[#E8755D] border-[#E6DFD6]"
                          />
                          <span>Required question</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#E8755D] hover:bg-[#d4654e] text-white text-sm font-display font-semibold transition-all shadow-sm disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

