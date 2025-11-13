// lib/types/verification.ts

export type DocumentType = "passport" | "national_id";

export type VerificationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "resubmit_required";

export type ProviderVerificationStatus =
  | "not_submitted"
  | "pending"
  | "verified"
  | "rejected";

export interface VerificationDocument {
  id: string;
  provider_id: string;
  document_type: DocumentType;
  document_number: string;
  document_front_url: string;
  document_back_url: string | null;
  full_name_on_document: string;
  date_of_birth: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  status: VerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

export interface VerificationFormData {
  documentType: DocumentType;
  documentNumber: string;
  fullNameOnDocument: string;
  dateOfBirth: string;
  issueDate: string;
  expiryDate: string;
  frontUrl: string;
  backUrl: string;
}

export interface Provider {
  id: string;
  user_id: string;
  business_name: string | null;
  description: string | null;
  verification_status: ProviderVerificationStatus;
  verification_submitted_at: string | null;
  verified: boolean;
  // ... other provider fields
}

export interface AdminReviewAction {
  action: "approve" | "reject" | "request_resubmit";
  reason?: string;
  notes?: string;
}

export interface VerificationStats {
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  resubmit_count: number;
  avg_review_hours: number;
  total_submissions: number;
}

// Validation helpers
export function isDocumentExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

export function isValidDocumentNumber(
  type: DocumentType,
  number: string
): boolean {
  if (type === "passport") {
    // Liberian passport format: 2 letters + 7 digits
    return /^[A-Z]{2}\d{7}$/.test(number.toUpperCase());
  } else {
    // National ID format: 10 digits (adjust based on actual format)
    return /^\d{10,}$/.test(number);
  }
}

export function validateVerificationForm(data: Partial<VerificationFormData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.documentType) {
    errors.push("Document type is required");
  }

  if (!data.documentNumber || data.documentNumber.trim().length === 0) {
    errors.push("Document number is required");
  } else if (
    data.documentType &&
    !isValidDocumentNumber(data.documentType, data.documentNumber)
  ) {
    errors.push("Invalid document number format");
  }

  if (!data.fullNameOnDocument || data.fullNameOnDocument.trim().length === 0) {
    errors.push("Full name as appears on document is required");
  }

  if (!data.frontUrl) {
    errors.push("Front image of document is required");
  }

  if (data.documentType === "national_id" && !data.backUrl) {
    errors.push("Back image of National ID is required");
  }

  if (data.expiryDate && isDocumentExpired(data.expiryDate)) {
    errors.push("Document has expired");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
