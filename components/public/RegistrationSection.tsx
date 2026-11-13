'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, Copy, Loader2, AlertCircle, Users, Check } from 'lucide-react';
import { EventSettings, CustomField } from '@/types';

interface Props {
  settings: EventSettings | null;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('gdg_session_id');
  if (!sid) {
    sid = `sid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('gdg_session_id', sid);
  }
  return sid;
}

function trackClientEvent(
  eventType: 'page_view' | 'link_click' | 'button_click' | 'registration_form_start' | 'registration_attempt' | 'registration_success' | 'registration_error',
  elementName?: string,
  elementLabel?: string,
  targetUrl?: string
) {
  try {
    const sid = getSessionId();
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        element_name: elementName,
        element_label: elementLabel,
        target_url: targetUrl,
        page_path: window.location.pathname,
        anonymous_session_id: sid,
      }),
    }).catch(() => {});
  } catch {}
}

const baseSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  sap_id: z.string().min(3, 'SAP ID must be at least 3 digits'),
  department: z.string().optional(),
  specialization: z.string().optional(),
  year: z.string().optional(),
  semester: z.string().optional(),
  phone_number: z.string().optional(),
});

type FormValues = z.infer<typeof baseSchema>;

interface ConfirmationState {
  registrationNumber: string;
  fullName: string;
  registeredAt: string;
  message: string;
}

export default function RegistrationSection({ settings }: Props) {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [serverError, setServerError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [hasStartedForm, setHasStartedForm] = useState<boolean>(false);
  const [publicCount, setPublicCount] = useState<number | null>(null);
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const sectionRef = useRef<HTMLDivElement>(null);

  const isClosed = settings?.registration_status === 'closed';
  const isPending = settings?.registration_status === 'pending';

  const customFields: CustomField[] = (() => {
    try {
      return JSON.parse(settings?.custom_fields_json || '[]');
    } catch {
      return [];
    }
  })();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
  });

  // Track page view and delegated click tracking on mount
  useEffect(() => {
    trackClientEvent('page_view', 'registration_portal', 'Public Registration Portal');

    // Fetch public count if enabled
    if (settings?.show_registration_count) {
      fetch('/api/event/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.count === 'number') {
            setPublicCount(data.count);
          }
        })
        .catch(() => {});
    }

    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-analytics]') as HTMLElement | null;
      if (!target) return;
      const analyticsId = target.dataset.analytics || 'unlabeled_element';
      const label = target.innerText?.slice(0, 60) || target.getAttribute('aria-label') || analyticsId;
      const href = (target as HTMLAnchorElement).href;
      trackClientEvent(
        href ? 'link_click' : 'button_click',
        analyticsId,
        label,
        href || undefined
      );
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [settings?.show_registration_count]);

  const handleFormInteraction = () => {
    if (!hasStartedForm) {
      setHasStartedForm(true);
      trackClientEvent('registration_form_start', 'registration_form', 'User started registration form');
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError('');
    trackClientEvent('registration_attempt', 'submit_registration_btn', 'User clicked Submit Registration');

    try {
      const payload = {
        ...values,
        additional_fields: customAnswers,
      };

      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        trackClientEvent('registration_error', 'registration_form', data.error || 'Registration failed');
        setServerError(data.error || 'Registration failed. Please check your inputs and try again.');
        return;
      }

      trackClientEvent('registration_success', 'registration_form', data.registration_number);
      setConfirmation({
        registrationNumber: data.registration_number,
        fullName: data.full_name,
        registeredAt: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }),
        message: data.message || 'You have successfully registered!',
      });
      reset();
      setCustomAnswers({});
    } catch {
      setServerError('A network error occurred. Please try again.');
      trackClientEvent('registration_error', 'registration_form', 'Network error');
    }
  };

  const handleCopy = async () => {
    if (!confirmation) return;
    try {
      await navigator.clipboard.writeText(confirmation.registrationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <section id="register" ref={sectionRef} className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Public participant counter badge */}
        {settings?.show_registration_count && publicCount !== null && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2.5 bg-white border border-[#E6DFD6] px-4 py-2 rounded-full shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4F9990] animate-pulse" />
              <Users className="w-4 h-4 text-[#4F9990]" />
              <span className="text-xs sm:text-sm font-display font-semibold text-[#21172E]">
                <strong className="text-[#E8755D]">{publicCount}</strong> students already registered
              </span>
            </div>
          </div>
        )}

        {/* Confirmation Screen */}
        {confirmation ? (
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-8 sm:p-12 shadow-md text-center animate-fade-in">
            <div className="w-16 h-16 bg-[#4F9990]/10 text-[#4F9990] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#21172E] mb-3">
              Registration Confirmed!
            </h2>
            <p className="text-base text-[#857F89] max-w-lg mx-auto mb-8">
              {confirmation.message}
            </p>

            <div className="bg-[#F4EFE7] rounded-2xl p-6 mb-8 text-center border border-[#E6DFD6]">
              <span className="text-xs uppercase tracking-wider font-display font-semibold text-[#857F89] block mb-1">
                Your Official Registration Pass Number
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-display font-extrabold text-2xl sm:text-3xl text-[#21172E] tracking-tight">
                  {confirmation.registrationNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  data-analytics="copy-reg-number-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E6DFD6] rounded-lg text-xs font-display font-semibold text-[#21172E] hover:bg-[#E8755D] hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#4F9990]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#E6DFD6] rounded-2xl p-5 mb-8 text-left space-y-3">
              <div className="flex justify-between items-center text-sm py-1 border-b border-[#E6DFD6]/50">
                <span className="text-[#857F89] font-display">Student Name</span>
                <span className="font-semibold text-[#21172E]">{confirmation.fullName}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-[#E6DFD6]/50">
                <span className="text-[#857F89] font-display">Event</span>
                <span className="font-semibold text-[#21172E]">{settings?.event_name}</span>
              </div>
              {settings?.event_date && (
                <div className="flex justify-between items-center text-sm py-1 border-b border-[#E6DFD6]/50">
                  <span className="text-[#857F89] font-display">Date</span>
                  <span className="font-semibold text-[#21172E]">{settings.event_date}</span>
                </div>
              )}
              {settings?.event_venue && (
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-[#857F89] font-display">Venue</span>
                  <span className="font-semibold text-[#21172E] text-right max-w-xs">{settings.event_venue}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setConfirmation(null)}
              data-analytics="register-another-btn"
              className="text-sm font-display font-semibold text-[#E8755D] hover:underline"
            >
              ← Register another student
            </button>
          </div>
        ) : isClosed ? (
          /* Registration Closed State */
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#857F89]/10 text-[#857F89] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="font-editorial text-3xl font-bold text-[#21172E] mb-3">
              Registrations Are Currently Closed
            </h2>
            <p className="text-[#857F89] max-w-md mx-auto mb-6 text-sm sm:text-base">
              The registration period for {settings?.event_name || 'this event'} has ended or reached capacity.
            </p>
            {settings?.primary_contact_email && (
              <p className="text-xs text-[#857F89]">
                For questions or urgent queries, contact:{' '}
                <a
                  href={`mailto:${settings.primary_contact_email}`}
                  data-analytics="closed_contact_link"
                  className="text-[#E8755D] font-semibold hover:underline"
                >
                  {settings.primary_contact_email}
                </a>
              </p>
            )}
          </div>
        ) : isPending ? (
          /* Registration Pending State */
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#C5E86C]/20 text-[#21172E] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-[#21172E]" />
            </div>
            <h2 className="font-editorial text-3xl font-bold text-[#21172E] mb-3">
              Registrations Opening Soon
            </h2>
            <p className="text-[#857F89] max-w-md mx-auto text-sm sm:text-base">
              Registration has not started yet. Please check back shortly!
            </p>
          </div>
        ) : (
          /* Active Registration Form */
          <div className="bg-white rounded-3xl border border-[#E6DFD6] p-6 sm:p-10 shadow-md">
            <div className="border-b border-[#E6DFD6] pb-6 mb-8 text-center sm:text-left">
              <span className="text-xs uppercase tracking-wider font-display font-semibold text-[#E8755D] mb-1 block">
                Official Campus Registration
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#21172E]">
                Student Participant Form
              </h2>
              <p className="text-sm text-[#857F89] mt-1">
                Enter your details to receive your event pass. No account or password required.
              </p>
            </div>

            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                <div className="flex-1 font-medium">{serverError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} onFocus={handleFormInteraction} noValidate className="space-y-6">
              {/* Row 1: Full Name */}
              <div>
                <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                  Full Name <span className="text-[#E8755D]">*</span>
                </label>
                <input
                  {...register('full_name')}
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] placeholder:text-[#857F89] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors"
                />
                {errors.full_name && (
                  <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Row 2: University Email Address & SAP ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                    University Email Address <span className="text-[#E8755D]">*</span>
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="yourname@ddn.upes.ac.in"
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] placeholder:text-[#857F89] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                    SAP ID <span className="text-[#E8755D]">*</span>
                  </label>
                  <input
                    {...register('sap_id')}
                    type="text"
                    placeholder="e.g. 500109876"
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] placeholder:text-[#857F89] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors font-mono"
                  />
                  {errors.sap_id && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.sap_id.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Department & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                    Department / School
                  </label>
                  <select
                    {...register('department')}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors"
                  >
                    <option value="">Select Department</option>
                    <option value="School of Computer Science">School of Computer Science (SoCS)</option>
                    <option value="School of Advanced Engineering">School of Advanced Engineering (SoAE)</option>
                    <option value="School of Business">School of Business (SoB)</option>
                    <option value="School of Law">School of Law (SoL)</option>
                    <option value="School of Design">School of Design (SoD)</option>
                    <option value="School of Health Sciences & Tech">School of Health Sciences & Tech</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                    Specialization / Branch
                  </label>
                  <input
                    {...register('specialization')}
                    type="text"
                    placeholder="e.g. AI & ML, Cloud Computing, Cyber Security"
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] placeholder:text-[#857F89] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors"
                  />
                </div>
              </div>

              {/* Row 4: Academic Year & Semester */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                    Academic Year
                  </label>
                  <select
                    {...register('year')}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                    Semester
                  </label>
                  <select
                    {...register('semester')}
                    className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={`Semester ${s}`}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 5: Phone Number */}
              <div>
                <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                  Contact Phone Number
                </label>
                <input
                  {...register('phone_number')}
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] placeholder:text-[#857F89] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm transition-colors"
                />
              </div>

              {/* Dynamic Custom Fields configured by Admin */}
              {customFields.length > 0 && (
                <div className="pt-4 border-t border-[#E6DFD6] space-y-5">
                  <h3 className="font-display font-bold text-sm text-[#21172E] uppercase tracking-wider">
                    Additional Event Questions
                  </h3>
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-display font-semibold text-[#21172E] mb-2">
                        {field.label} {field.required && <span className="text-[#E8755D]">*</span>}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          placeholder={field.placeholder || ''}
                          required={field.required}
                          value={customAnswers[field.id] || ''}
                          onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          required={field.required}
                          value={customAnswers[field.id] || ''}
                          onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm"
                        >
                          <option value="">Select option</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          required={field.required}
                          placeholder={field.placeholder || ''}
                          value={customAnswers[field.id] || ''}
                          onChange={(e) => setCustomAnswers({ ...customAnswers, [field.id]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-[#E6DFD6] bg-[#F4EFE7]/40 text-[#21172E] focus:outline-none focus:ring-2 focus:ring-[#E8755D]/30 focus:border-[#E8755D] text-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-analytics="submit-registration-btn"
                  className="w-full bg-[#E8755D] hover:bg-[#d4654e] text-white font-display font-semibold py-4 rounded-xl text-base shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing Registration...</span>
                    </>
                  ) : (
                    <span>Complete Event Registration →</span>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-[#857F89] pt-2">
                By submitting, your registration is permanently recorded. Only one entry per SAP ID and Email is permitted.
              </p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

