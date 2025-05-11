// In a constants file, e.g., constants/auth.ts
export const ROLES = {
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  ADMIN: 'admin',
  BILLING_STAFF: 'billing_staff', // Added
  // ... other roles
} as const;

export const PERMISSIONS = {
  READ_PATIENT_RECORD: 'read_patient_record',
  EDIT_PATIENT_RECORD: 'edit_patient_record',
  EDIT_BILLING_INFO: 'edit_billing_info', // Added
  // ... other permissions
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
