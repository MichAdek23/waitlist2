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

export type PortalDocumentType =
  | 'road_worthiness'
  | 'vehicle_inspection'
  | 'proof_of_ownership'
  | 'hackney_permit'
  | 'bike_licence'
  | 'mot';

export interface AuthenticityCheckResult {
  code: string;
  label: string;
  passed: boolean;
  detail: string;
  weight: number;
}

export interface DocumentVerificationReport {
  document_type: string;
  document_label: string;
  issuing_authority: string;
  verified: boolean;
  status: 'verified' | 'expiring_soon' | 'expired' | 'rejected' | string;
  authenticity_score: number;
  extracted_issue_date?: string;
  extracted_expiry_date?: string;
  days_until_expiry: number;
  document_number?: string;
  receipt_number?: string;
  extracted_plate?: string;
  extracted_engine_number?: string;
  extracted_chassis_number?: string;
  extracted_owner_name?: string;
  extracted_vehicle_make?: string;
  extracted_vehicle_model?: string;
  extracted_vehicle_year?: number;
  extracted_date_of_birth?: string;
  extracted_gender?: string;
  extracted_phone?: string;
  extracted_address?: string;
  extraction_method?: string;
  extracted_pin?: string;
  extracted_poc_vid?: string;
  extracted_file_number?: string;
  sha256_hash?: string;
  image_dimensions?: string;
  byte_entropy?: number;
  checks?: AuthenticityCheckResult[];
  verified_at?: string;
  rejection_reason?: string;
}

export interface AIComparisonCheck {
  field: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface AIComparisonReport {
  status: 'passed' | 'mismatch' | 'pending' | string;
  passed: boolean;
  method?: string;
  summary: string;
  mismatches?: string[];
  checks?: AIComparisonCheck[];
  evaluated_at?: string;
}

export interface PortalDocumentFile {
  upload_id?: string;
  document_type?: string;
  url: string;
  file_name?: string;
  content_type?: string;
  size_bytes?: number;
  uploaded_at?: string;
  extracted_issue_date?: string;
  extracted_expiry_date?: string;
  days_until_expiry?: number;
  document_number?: string;
  receipt_number?: string;
  extracted_plate?: string;
  extracted_engine_number?: string;
  extracted_chassis_number?: string;
  extracted_owner_name?: string;
  extracted_pin?: string;
  extracted_poc_vid?: string;
  extracted_file_number?: string;
  extracted_vehicle_make?: string;
  extracted_vehicle_model?: string;
  extracted_vehicle_year?: number;
  extracted_date_of_birth?: string;
  extracted_gender?: string;
  extracted_phone?: string;
  extracted_address?: string;
  extraction_method?: string;
  sha256_hash?: string;
  verified?: boolean;
  verification_status?: 'verified' | 'expiring_soon' | 'expired' | 'rejected' | string;
  authenticity_score?: number;
  verification?: DocumentVerificationReport | null;
}

export interface DocumentUploadHints {
  extracted_text?: string;
  document_number?: string;
  receipt_number?: string;
  issue_date?: string;
  expiry_date?: string;
  plate_number?: string;
  engine_number?: string;
  chassis_number?: string;
  owner_name?: string;
  vehicle_make?: string;
  pin?: string;
  poc_vid?: string;
  file_number?: string;
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
  road_worthiness_doc_url?: string;
  vehicle_inspection_doc_url?: string;
  proof_of_ownership_doc_url?: string;
  hackney_permit_doc_url?: string;
  driving_licence_doc_url?: string;
  mot_doc_url?: string;
  bike_licence_doc_url?: string;
  road_worthiness_doc?: PortalDocumentFile | null;
  vehicle_inspection_doc?: PortalDocumentFile | null;
  proof_of_ownership_doc?: PortalDocumentFile | null;
  hackney_permit_doc?: PortalDocumentFile | null;
  driving_licence_doc?: PortalDocumentFile | null;
  mot_doc?: PortalDocumentFile | null;
  bike_licence_doc?: PortalDocumentFile | null;
  vehicle_type: string;
  vehicle_make?: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_seats: number;
  vehicle_engine_number?: string;
  vehicle_chassis_number?: string;
  vehicle_registry_file_no?: string;
  vehicle_autoreg_pin?: string;
  vehicle_poc_vid?: string;
  next_document_expiry?: string;
  next_expiring_doc_type?: string;
  next_expiring_doc_label?: string;
  days_until_next_expiry?: number;
  expiry_warning_active?: boolean;
  expiry_locked?: boolean;
  expired_document_types?: string[];
  expiring_document_types?: string[];
  last_expiry_notified_date?: string;
  expiry_notification_count?: number;
  billing_company_name?: string;
  billing_company_email?: string;
  billing_address?: string;
  billing_reg_code?: string;
  billing_vat_number?: string;
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
  ai_comparison?: AIComparisonReport | null;
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
  road_worthiness_doc_url: string;
  vehicle_inspection_doc_url: string;
  proof_of_ownership_doc_url: string;
  hackney_permit_doc_url: string;
  driving_licence_doc_url?: string;
  mot_doc_url: string;
  bike_licence_doc_url: string;
  road_worthiness_doc?: PortalDocumentFile | null;
  vehicle_inspection_doc?: PortalDocumentFile | null;
  proof_of_ownership_doc?: PortalDocumentFile | null;
  hackney_permit_doc?: PortalDocumentFile | null;
  driving_licence_doc?: PortalDocumentFile | null;
  mot_doc?: PortalDocumentFile | null;
  bike_licence_doc?: PortalDocumentFile | null;
  vehicle_type?: string;
  vehicle_model: string;
  vehicle_year?: number;
  vehicle_plate: string;
  vehicle_seats: number;
  vehicle_engine_number?: string;
  vehicle_chassis_number?: string;
  billing_company_name?: string;
  billing_company_email?: string;
  billing_address?: string;
  billing_reg_code?: string;
  billing_vat_number?: string;
  invoice_issuer_type?: 'Private' | 'Company';
  invoice_issuer_name?: string;
  invoice_issuer_address?: string;
  invoice_issuer_reg_code?: string;
  invoice_issuer_vat_number?: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  bank_code?: string;
  transit_number?: string;
}

export interface BankOption {
  name: string;
  code: string;
}
