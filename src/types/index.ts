export interface SingleWaitlistFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  otherBusinessType?: string;
  deliveryFrequency?: string;
  businessLocation?: string;
  marketingConsent: boolean;
  referredBy?: string;
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  position?: number;
  referralCode?: string;
  isExisting?: boolean;
  error?: string;
}

export interface LegalSectionItem {
  id: string;
  number: string;
  title: string;
  content: string;
}

export interface LegalDocumentData {
  slug: 'terms' | 'privacy';
  title: string;
  documentTitle: string;
  version: string;
  updated_at: string;
  introductionTitle: string;
  introduction: string;
  sections: LegalSectionItem[];
}

export interface DriverPortalProfile {
  id: string;
  user_id: string;
  user_type: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone: string;
  display_name: string;
  nin?: string;
  nin_verified: boolean;
  date_of_birth?: string;
  gender?: string;
  license_number: string;
  license_expiry: string;
  license_verified: boolean;
  vehicle_type: string;
  vehicle_make?: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_seats: number;
  billing_company_name: string;
  billing_company_email: string;
  billing_address: string;
  billing_reg_code: string;
  billing_vat_number: string;
  invoice_issuer_type: 'Private' | 'Company' | string;
  invoice_issuer_name: string;
  invoice_issuer_address: string;
  invoice_issuer_reg_code: string;
  invoice_issuer_vat_number: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code?: string;
  transit_number: string;
  is_activated: boolean;
  portal_completed: boolean;
  portal_completed_at?: string;
  is_online?: boolean;
  created_at?: string;
}

export interface CompleteDriverPortalPayload {
  phone: string;
  display_name: string;
  license_number: string;
  license_expiry: string;
  vehicle_type?: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_seats: number;
  billing_company_name: string;
  billing_company_email: string;
  billing_address: string;
  billing_reg_code: string;
  billing_vat_number: string;
  invoice_issuer_type: 'Private' | 'Company';
  invoice_issuer_name: string;
  invoice_issuer_address: string;
  invoice_issuer_reg_code: string;
  invoice_issuer_vat_number: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code?: string;
  transit_number: string;
}

export interface BankOption {
  name: string;
  code: string;
}

