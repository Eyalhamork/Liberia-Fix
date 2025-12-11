// lib/utils/verification-helpers.ts

import { createClient } from "@/lib/supabase/client";
import type {
  DocumentType,
  VerificationStatus,
  ProviderVerificationStatus,
  VerificationFormData,
} from "@/lib/types/verification";

/**
 * Validates a verification form before submission
 */
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

/**
 * Checks if a document has expired
 */
export function isDocumentExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

/**
 * Validates document number format based on type
 */
export function isValidDocumentNumber(
  type: DocumentType,
  number: string
): boolean {
  // Remove whitespace
  const cleaned = number.replace(/\s/g, "");

  if (type === "passport") {
    // Liberian passport format: 2 letters + 7 digits (e.g., AB1234567)
    return /^[A-Z]{2}\d{7}$/.test(cleaned.toUpperCase());
  } else {
    // National ID format: At least 10 digits (adjust based on actual format)
    return /^\d{10,}$/.test(cleaned);
  }
}

/**
 * Formats a date for display
 */
export function formatVerificationDate(date: string | null): string {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Gets verification status display text
 */
export function getVerificationStatusText(status: ProviderVerificationStatus): {
  label: string;
  description: string;
} {
  const statusMap = {
    not_submitted: {
      label: "Not Verified",
      description: "Start your verification to build trust with customers",
    },
    pending: {
      label: "Verification Pending",
      description: "Your documents are being reviewed",
    },
    verified: {
      label: "Verified Provider",
      description: "Your account has been verified",
    },
    rejected: {
      label: "Verification Required",
      description: "Please resubmit your verification documents",
    },
  };

  return statusMap[status];
}

/**
 * Fetches provider verification status
 */
export async function getProviderVerificationStatus(
  providerId: string
): Promise<{
  status: ProviderVerificationStatus;
  latestVerification: any | null;
}> {
  const supabase = createClient();

  const { data: provider } = await (supabase as any)
      .from("providers")
    .select("verification_status")
    .eq("id", providerId)
    .single() as any as { data: { verification_status: string | null } | null };

  const { data: verification } = await (supabase as any)
      .from("provider_verification_documents")
    .select("*")
    .eq("provider_id", providerId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle() as { data: any | null };

  return {
    status: (provider?.verification_status as ProviderVerificationStatus) || "not_submitted",
    latestVerification: verification,
  };
}

/**
 * Checks if provider can submit verification
 */
export async function canSubmitVerification(
  providerId: string
): Promise<{ canSubmit: boolean; reason?: string }> {
  const supabase = createClient();

  const { data: existingVerification } = await (supabase as any)
      .from("provider_verification_documents")
    .select("status")
    .eq("provider_id", providerId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle() as { data: { status: string } | null };

  if (!existingVerification) {
    return { canSubmit: true };
  }

  if (existingVerification.status === "pending") {
    return {
      canSubmit: false,
      reason:
        "You already have a pending verification. Please wait for review.",
    };
  }

  if (existingVerification.status === "approved") {
    return {
      canSubmit: false,
      reason: "Your account is already verified.",
    };
  }

  // Can resubmit if rejected or resubmit_required
  return { canSubmit: true };
}

/**
 * Submits verification documents
 */
export async function submitVerification(
  providerId: string,
  formData: VerificationFormData
): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = createClient();

  // Validate form
  const validation = validateVerificationForm(formData);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join(", "),
    };
  }

  // Check if can submit
  const canSubmit = await canSubmitVerification(providerId);
  if (!canSubmit.canSubmit) {
    return {
      success: false,
      error: canSubmit.reason,
    };
  }

  try {
    // Insert verification document
    const { data: verification, error: insertError } = await (supabase as any)
      .from("provider_verification_documents")
      .insert({
        provider_id: providerId,
        document_type: formData.documentType,
        document_number: formData.documentNumber,
        document_front_url: formData.frontUrl,
        document_back_url: formData.backUrl || null,
        full_name_on_document: formData.fullNameOnDocument,
        date_of_birth: formData.dateOfBirth || null,
        issue_date: formData.issueDate || null,
        expiry_date: formData.expiryDate || null,
        status: "pending",
      } as any)
      .select()
      .single() as { data: any | null; error: any };

    if (insertError) throw insertError;

    // Update provider status
    const { error: updateError } = await (supabase as any)
      .from("providers")
      .update({
        verification_status: "pending",
        verification_submitted_at: new Date().toISOString(),
      } as any)
      .eq("id", providerId) as { error: any };

    if (updateError) throw updateError;

    // Get provider user_id for notification
    const { data: provider } = await (supabase as any)
      .from("providers")
      .select("user_id")
      .eq("id", providerId)
      .single() as { data: { user_id: string } | null };

    // Create notification
    if (provider) {
      await (supabase as any).from("booking_notifications").insert({
        user_id: provider.user_id,
        type: "verification_submitted",
        title: "Verification Submitted",
        message:
          "Your verification documents have been submitted for review. We will notify you within 24-48 hours.",
        read: false,
      } as any);
    }

    return { success: true, data: verification };
  } catch (error: any) {
    console.error("Error submitting verification:", error);
    return {
      success: false,
      error: error.message || "Failed to submit verification",
    };
  }
}

/**
 * Uploads document to Supabase Storage
 */
export async function uploadVerificationDocument(
  providerId: string,
  file: File,
  documentType: "front" | "back"
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();

  try {
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      return { error: "File size must be less than 5MB" };
    }

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      return { error: "Only JPG, PNG, or PDF files are allowed" };
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `${providerId}/${documentType}_${timestamp}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("verification-documents")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL (note: this is a signed URL for private buckets)
    const {
      data: { publicUrl },
    } = supabase.storage.from("verification-documents").getPublicUrl(fileName);

    return { url: publicUrl };
  } catch (error: any) {
    console.error("Error uploading document:", error);
    return { error: error.message || "Failed to upload document" };
  }
}

/**
 * Compresses an image file before upload
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Max dimensions
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Return original if compression fails
            }
          },
          "image/jpeg",
          0.8 // Quality
        );
      };

      img.onerror = () => {
        resolve(file); // Return original if image load fails
      };
    };

    reader.onerror = () => {
      resolve(file); // Return original if reader fails
    };
  });
}

/**
 * Gets verification statistics for admin dashboard
 */
export async function getVerificationStats(): Promise<{
  pending: number;
  approved: number;
  rejected: number;
  avgReviewHours: number;
}> {
  const supabase = createClient();

  const { data } = await (supabase as any)
      .from("verification_stats")
    .select("*")
    .single() as { data: { pending_count: number; approved_count: number; rejected_count: number; avg_review_hours: number } | null };

  return {
    pending: data?.pending_count || 0,
    approved: data?.approved_count || 0,
    rejected: data?.rejected_count || 0,
    avgReviewHours: Math.round(data?.avg_review_hours || 0),
  };
}

/**
 * Searches for potential duplicate document numbers
 */
export async function checkDuplicateDocumentNumber(
  documentNumber: string,
  excludeProviderId?: string
): Promise<{ isDuplicate: boolean; existingProvider?: any }> {
  const supabase = createClient();

  let query = supabase
    .from("provider_verification_documents")
    .select("*, providers(id, business_name)")
    .eq("document_number", documentNumber)
    .eq("status", "approved");

  if (excludeProviderId) {
    query = query.neq("provider_id", excludeProviderId);
  }

  const { data } = await query.limit(1).maybeSingle() as { data: { providers: any } | null };

  return {
    isDuplicate: !!data,
    existingProvider: data?.providers,
  };
}

/**
 * Gets rejection reasons statistics
 */
export async function getRejectionReasonsStats(): Promise<
  Array<{
    reason: string;
    count: number;
  }>
> {
  const supabase = createClient();

  const { data } = await (supabase as any)
      .from("provider_verification_documents")
    .select("rejection_reason")
    .eq("status", "rejected")
    .not("rejection_reason", "is", null) as { data: Array<{ rejection_reason: string | null }> | null };

  // Count occurrences
  const reasonCounts: { [key: string]: number } = {};
  data?.forEach((doc) => {
    if (doc.rejection_reason) {
      reasonCounts[doc.rejection_reason] =
        (reasonCounts[doc.rejection_reason] || 0) + 1;
    }
  });

  // Convert to array and sort
  return Object.entries(reasonCounts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Common rejection reasons (for admin dropdown)
 */
export const COMMON_REJECTION_REASONS = [
  "Document has expired",
  "Image quality too low - blurry or unreadable",
  "Document is cropped or partially visible",
  "Name does not match profile information",
  "Suspected fraudulent or tampered document",
  "Wrong document type submitted",
  "Back of ID not provided",
  "Document appears to be a photocopy or screenshot",
  "Information is not clearly visible",
  "Multiple documents in one image",
  "Document does not appear to be authentic",
  "Photo on document does not match profile photo",
];

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Validates image dimensions
 */
export async function validateImageDimensions(
  file: File,
  minWidth: number = 800,
  minHeight: number = 600
): Promise<{
  valid: boolean;
  width?: number;
  height?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve({ valid: true }); // Skip validation for non-images (PDFs)
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          valid: false,
          width: img.width,
          height: img.height,
          error: `Image must be at least ${minWidth}x${minHeight} pixels. Current: ${img.width}x${img.height}`,
        });
      } else {
        resolve({
          valid: true,
          width: img.width,
          height: img.height,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: "Unable to read image file",
      });
    };

    img.src = url;
  });
}

/**
 * Gets time remaining until verification expires (if pending for too long)
 */
export function getVerificationTimeRemaining(submittedAt: string): {
  isExpired: boolean;
  hoursRemaining: number;
  message: string;
} {
  const submitted = new Date(submittedAt);
  const now = new Date();
  const hoursPassed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
  const maxHours = 48; // 48 hour review window
  const hoursRemaining = Math.max(0, maxHours - hoursPassed);

  return {
    isExpired: hoursPassed > maxHours,
    hoursRemaining: Math.round(hoursRemaining),
    message:
      hoursRemaining > 0
        ? `Review expected within ${Math.round(hoursRemaining)} hours`
        : "Review time exceeded - checking with admin team",
  };
}

/**
 * Generates a secure signed URL for viewing verification documents
 * (for admin use)
 */
export async function getSignedDocumentUrl(
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.storage
      .from("verification-documents")
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;

    return { url: data.signedUrl };
  } catch (error: any) {
    console.error("Error creating signed URL:", error);
    return { error: error.message || "Failed to create signed URL" };
  }
}

/**
 * Checks if user has admin permissions
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data } = await (supabase as any)
      .from("profiles")
    .select("user_type")
    .eq("id", userId)
    .single() as { data: { user_type: string | null } | null };

  return data?.user_type === "admin";
}

/**
 * Logs admin action for audit trail
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: any
): Promise<void> {
  const supabase = createClient();

  await (supabase as any).from("admin_activity_log").insert({
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details || {},
  } as any);
}

/**
 * Calculates verification completion rate for a time period
 */
export async function getVerificationCompletionRate(
  startDate: Date,
  endDate: Date
): Promise<{
  submitted: number;
  approved: number;
  rejected: number;
  approvalRate: number;
}> {
  const supabase = createClient();

  const { data } = await (supabase as any)
      .from("provider_verification_documents")
    .select("status")
    .gte("submitted_at", startDate.toISOString())
    .lte("submitted_at", endDate.toISOString()) as { data: Array<{ status: string }> | null };

  const submitted = data?.length || 0;
  const approved = data?.filter((d) => d.status === "approved").length || 0;
  const rejected = data?.filter((d) => d.status === "rejected").length || 0;
  const approvalRate = submitted > 0 ? (approved / submitted) * 100 : 0;

  return {
    submitted,
    approved,
    rejected,
    approvalRate: Math.round(approvalRate * 100) / 100,
  };
}

/**
 * Gets providers pending verification sorted by submission date
 */
export async function getPendingVerifications(
  limit: number = 50,
  offset: number = 0
): Promise<Array<any>> {
  const supabase = createClient();

  const { data } = await (supabase as any)
      .from("provider_verification_documents")
    .select(
      `
      *,
      providers (
        id,
        business_name,
        profiles (
          full_name,
          email,
          phone,
          location
        )
      )
    `
    )
    .eq("status", "pending")
    .order("submitted_at", { ascending: true })
    .range(offset, offset + limit - 1) as { data: Array<any> | null };

  return data || [];
}

/**
 * Estimates review queue position
 */
export async function getQueuePosition(
  verificationId: string
): Promise<number> {
  const supabase = createClient();

  // Get submission time of this verification
  const { data: verification } = await (supabase as any)
      .from("provider_verification_documents")
    .select("submitted_at")
    .eq("id", verificationId)
    .single() as { data: { submitted_at: string } | null };

  if (!verification) return 0;

  // Count how many pending verifications were submitted before this one
  const { count } = await (supabase as any)
      .from("provider_verification_documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("submitted_at", verification.submitted_at);

  return (count || 0) + 1;
}

/**
 * Batch approve/reject verifications (admin function)
 */
export async function batchUpdateVerifications(
  verificationIds: string[],
  action: "approve" | "reject",
  reason?: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const supabase = createClient();
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  for (const id of verificationIds) {
    try {
      const endpoint = `/api/admin/verification/${id}/${action}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        success++;
      } else {
        failed++;
        errors.push(`Failed to ${action} verification ${id}`);
      }
    } catch (error) {
      failed++;
      errors.push(`Error processing verification ${id}: ${error}`);
    }
  }

  return { success, failed, errors };
}

/**
 * Export verification data for reporting
 */
export async function exportVerificationData(
  startDate: Date,
  endDate: Date
): Promise<string> {
  const supabase = createClient();

  const { data } = await (supabase as any)
      .from("provider_verification_documents")
    .select(
      `
      *,
      providers (
        business_name,
        profiles (
          full_name,
          email,
          location
        )
      )
    `
    )
    .gte("submitted_at", startDate.toISOString())
    .lte("submitted_at", endDate.toISOString())
    .order("submitted_at", { ascending: false }) as {
      data: Array<{
        id: string;
        document_type: string;
        document_number: string;
        status: string;
        submitted_at: string;
        reviewed_at: string | null;
        rejection_reason: string | null;
        providers: {
          business_name: string | null;
          profiles: {
            full_name: string | null;
            email: string | null;
            location: string | null;
          } | null;
        } | null;
      }> | null;
    };

  if (!data) return "";

  // Convert to CSV
  const headers = [
    "ID",
    "Provider",
    "Email",
    "Location",
    "Document Type",
    "Document Number",
    "Status",
    "Submitted At",
    "Reviewed At",
    "Rejection Reason",
  ];

  const rows = data.map((v) => [
    v.id,
    v.providers?.business_name || v.providers?.profiles?.full_name || "N/A",
    v.providers?.profiles?.email || "N/A",
    v.providers?.profiles?.location || "N/A",
    v.document_type,
    v.document_number,
    v.status,
    new Date(v.submitted_at).toLocaleDateString(),
    v.reviewed_at ? new Date(v.reviewed_at).toLocaleDateString() : "N/A",
    v.rejection_reason || "N/A",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Send reminder to admin about pending verifications
 */
export async function sendAdminReminder(): Promise<void> {
  const supabase = createClient();

  // Get count of pending verifications older than 24 hours
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);

  const { count } = await (supabase as any)
      .from("provider_verification_documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")
    .lt("submitted_at", yesterday.toISOString());

  if (count && count > 0) {
    // Send notification to all admins
    const { data: admins } = await (supabase as any)
      .from("profiles")
      .select("id")
      .eq("user_type", "admin") as { data: Array<{ id: string }> | null };

    if (admins) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        type: "admin_alert",
        title: "Pending Verifications",
        message: `You have ${count} verification${
          count > 1 ? "s" : ""
        } waiting for review for over 24 hours.`,
        read: false,
      }));

      await (supabase as any).from("booking_notifications").insert(notifications as any);
    }
  }
}

// Export all functions
export default {
  validateVerificationForm,
  isDocumentExpired,
  isValidDocumentNumber,
  formatVerificationDate,
  getVerificationStatusText,
  getProviderVerificationStatus,
  canSubmitVerification,
  submitVerification,
  uploadVerificationDocument,
  compressImage,
  getVerificationStats,
  checkDuplicateDocumentNumber,
  getRejectionReasonsStats,
  formatFileSize,
  validateImageDimensions,
  getVerificationTimeRemaining,
  getSignedDocumentUrl,
  isAdmin,
  logAdminAction,
  getVerificationCompletionRate,
  getPendingVerifications,
  getQueuePosition,
  batchUpdateVerifications,
  exportVerificationData,
  downloadCSV,
  sendAdminReminder,
  COMMON_REJECTION_REASONS,
};
