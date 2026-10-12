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
