export interface Registration {
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
  updated_at: string;
}

export interface EventSettings {
  id: number;
  event_name: string;
  event_description?: string;
  event_date?: string;
  event_time?: string;
  event_venue?: string;
  campus_name?: string;
  university_name?: string;
  gdg_logo_url?: string;
  upes_logo_url?: string;
  registration_status: 'open' | 'closed' | 'pending';
  registration_start_date?: string;
  registration_end_date?: string;
  registration_limit?: number;
  primary_contact_email?: string;
  custom_fields_json?: string;
  show_registration_count?: boolean;
  registration_success_message?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface DashboardStats {
  totalRegistrations: number;
  totalLinkClicks: number;
  totalPageVisits: number;
  successfulRegistrations: number;
  conversionRate: number;
}

export interface AnalyticsEvent {
  id: number;
  event_type: string;
  element_name?: string;
  element_id?: string;
  element_label?: string;
  target_url?: string;
  page_path?: string;
  anonymous_session_id?: string;
  registration_reference?: string;
  created_at: string;
}

