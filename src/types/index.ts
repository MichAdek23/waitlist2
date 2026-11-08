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

