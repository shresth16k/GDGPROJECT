import { z } from 'zod';

// Configurable UPES email domains (e.g. "ddn.upes.ac.in,upes.ac.in")
const allowedDomains = (process.env.UPES_EMAIL_DOMAINS || '')
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter((d) => d.length > 0);

export const registrationSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim()
    .refine((val) => {
      if (allowedDomains.length === 0) return true;
      const domain = val.split('@')[1] || '';
      return allowedDomains.some((d) => domain === d || domain.endsWith('.' + d));
    }, {
      message: allowedDomains.length > 0
        ? `Please use your university email ending with @${allowedDomains.join(' or @')}`
        : 'Please enter a valid email address',
    }),
  sap_id: z
    .string()
    .min(3, 'SAP ID must be at least 3 digits')
    .max(20, 'SAP ID cannot exceed 20 characters')
    .trim(),
  department: z.string().optional(),
  specialization: z.string().optional(),
  year: z.string().optional(),
  semester: z.string().optional(),
  phone_number: z.string().optional(),
  additional_fields: z.record(z.string(), z.any()).optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const settingsSchema = z.object({
  event_name: z.string().min(1, 'Event name is required').max(200),
  event_description: z.string().max(2000).optional(),
  event_date: z.string().optional(),
  event_time: z.string().optional(),
  event_venue: z.string().max(500).optional(),
  campus_name: z.string().max(200).optional(),
  university_name: z.string().max(200).optional(),
  gdg_logo_url: z.string().optional().or(z.literal('')),
  upes_logo_url: z.string().optional().or(z.literal('')),
  registration_status: z.enum(['open', 'closed', 'pending']),
  registration_limit: z.number().int().min(0).optional(),
  primary_contact_email: z.string().email().optional().or(z.literal('')),
  custom_fields_json: z.string().optional(),
  show_registration_count: z.boolean().optional(),
  registration_success_message: z.string().max(500).optional(),
});

