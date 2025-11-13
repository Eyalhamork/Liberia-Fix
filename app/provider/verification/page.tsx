// app/provider/verification/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  AlertCircle,
} from "lucide-react";
import DocumentUpload from "@/components/providers/verification/document-upload";
import { createClient } from "@/lib/supabase/client";

function ProviderVerificationPageContent() {
  const router = useRouter();
  const supabase = createClient();

  const [provider, setProvider] = useState<any>(null);
  const [existingVerification, setExistingVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [formData, setFormData] = useState({
    documentType: "national_id" as "passport" | "national_id",
    documentNumber: "",
    fullNameOnDocument: "",
    dateOfBirth: "",
    issueDate: "",
    expiryDate: "",
    frontUrl: "",
    backUrl: "",
  });

  useEffect(() => {
    fetchProviderAndVerification();
  }, []);

  useEffect(() => {
    if (showSuccessModal && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessModal && countdown === 0) {
      router.push("/provider/dashboard?verification=submitted");
    }
  }, [showSuccessModal, countdown, router]);

  const fetchProviderAndVerification = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Get provider
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (providerError || !providerData) {
        console.error("Provider not found:", providerError);
        router.push("/provider/dashboard");
        return;
      }

      setProvider(providerData);

      // Get existing verification
      const { data: verificationData } = await supabase
        .from("provider_verification_documents")
        .select("*")
        .eq("provider_id", providerData.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setExistingVerification(verificationData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrors(["Failed to load verification data. Please refresh the page."]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.frontUrl) {
      newErrors.push("Please upload the front of your document");
    }

    if (formData.documentType === "national_id" && !formData.backUrl) {
      newErrors.push("Please upload the back of your National ID");
    }

    if (
      !formData.documentNumber ||
      formData.documentNumber.trim().length === 0
    ) {
      newErrors.push("Document number is required");
    }

    if (
      !formData.fullNameOnDocument ||
      formData.fullNameOnDocument.trim().length === 0
    ) {
      newErrors.push("Full name on document is required");
    }

    // Validate document number format
    if (formData.documentType === "passport") {
      const passportRegex = /^[A-Z]{2}\d{7}$/;
      if (!passportRegex.test(formData.documentNumber.replace(/\s/g, ""))) {
        newErrors.push(
          "Invalid passport format. Expected format: AB1234567 (2 letters + 7 digits)"
        );
      }
    } else {
      const nationalIdRegex = /^\d{10,}$/;
      if (!nationalIdRegex.test(formData.documentNumber.replace(/\s/g, ""))) {
        newErrors.push(
          "Invalid National ID format. Expected at least 10 digits"
        );
      }
    }

    // Check expiry date
    if (formData.expiryDate) {
      const expiry = new Date(formData.expiryDate);
      if (expiry < new Date()) {
        newErrors.push("Document has expired. Please use a valid document");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validate form
    if (!validateForm()) {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      // Insert verification document
      const { data, error } = await supabase
        .from("provider_verification_documents")
        .insert({
          provider_id: provider.id,
          document_type: formData.documentType,
          document_number: formData.documentNumber,
          document_front_url: formData.frontUrl,
          document_back_url: formData.backUrl || null,
          full_name_on_document: formData.fullNameOnDocument,
          date_of_birth: formData.dateOfBirth || null,
          issue_date: formData.issueDate || null,
          expiry_date: formData.expiryDate || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw new Error("Failed to save verification documents");
      }

      // Update provider verification status
      const { error: updateError } = await supabase
        .from("providers")
        .update({
          verification_status: "pending",
          verification_submitted_at: new Date().toISOString(),
        })
        .eq("id", provider.id);

      if (updateError) {
        console.error("Provider update error:", updateError);
        // Continue anyway as the main verification was saved
      }

      // Create notification
      await supabase.from("booking_notifications").insert({
        user_id: provider.user_id,
        type: "verification_submitted",
        title: "Verification Submitted",
        message: "Your verification documents have been submitted for review.",
        read: false,
      });

      // Show success modal
      setShowSuccessModal(true);
      setCountdown(5);
    } catch (error: any) {
      console.error("Submission error:", error);
      setErrors([
        error.message || "Failed to submit verification. Please try again.",
        "If this problem persists, please contact support.",
      ]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show status if already submitted
  if (
    existingVerification &&
    (existingVerification.status === "pending" ||
      existingVerification.status === "approved")
  ) {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: "yellow",
        title: "Verification Under Review",
        message:
          "Your documents are currently being reviewed by our team. We'll notify you once the verification is complete.",
      },
      approved: {
        icon: CheckCircle,
        color: "green",
        title: "Verification Approved",
        message:
          "Congratulations! Your account has been successfully verified. You can now accept bookings.",
      },
    };

    const config =
      statusConfig[existingVerification.status as "pending" | "approved"];
    const Icon = config.icon;

    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="text-center">
              <div
                className={`mx-auto w-16 h-16 bg-${config.color}-100 rounded-full flex items-center justify-center mb-4`}
              >
                <Icon className={`h-8 w-8 text-${config.color}-600`} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {config.title}
              </h2>
              <p className="text-gray-600 mb-6">{config.message}</p>

              {existingVerification.status === "pending" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <h4 className="font-semibold text-blue-900 mb-1">
                        What happens next?
                      </h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Our team will review your documents</li>
                        <li>• Verification typically takes 24-48 hours</li>
                        <li>• You'll receive an email notification</li>
                        <li>• Check your dashboard for status updates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => router.push("/provider/dashboard")}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Go to Dashboard
                </button>

                {existingVerification.status === "pending" && (
                  <p className="text-xs text-gray-500">
                    Submitted on{" "}
                    {new Date(
                      existingVerification.submitted_at
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show rejection notice if exists
  const hasRejection =
    existingVerification && existingVerification.status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Provider Verification</h1>
            </div>
            <p className="text-blue-100">
              Verify your identity to start accepting bookings
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Errors Display */}
            {errors.length > 0 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-2">
                      Please fix the following errors:
                    </h3>
                    <ul className="text-sm text-red-800 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Notice */}
            {hasRejection && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <XCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Previous Submission Rejected
                    </h3>
                    {existingVerification.rejection_reason && (
                      <p className="text-sm text-yellow-800 mb-2">
                        <strong>Reason:</strong>{" "}
                        {existingVerification.rejection_reason}
                      </p>
                    )}
                    <p className="text-sm text-yellow-800">
                      Please review the feedback and resubmit your documents.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Document Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        documentType: "passport",
                        backUrl: "", // Clear back URL when switching to passport
                      })
                    }
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.documentType === "passport"
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Passport</p>
                    <p className="text-xs text-gray-500 mt-1">
                      International Passport
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        documentType: "national_id",
                      })
                    }
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.documentType === "national_id"
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <p className="font-semibold text-gray-900">National ID</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Government-issued ID Card
                    </p>
                  </button>
                </div>
              </div>

              {/* Document Number */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Document Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentNumber: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    formData.documentType === "passport"
                      ? "e.g., AB1234567"
                      : "e.g., 1234567890"
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.documentType === "passport"
                    ? "Format: 2 letters followed by 7 digits"
                    : "Enter at least 10 digits"}
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Full Name (as appears on document){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullNameOnDocument}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullNameOnDocument: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name exactly as shown on document"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Document Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, issueDate: e.target.value })
                    }
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expiryDate: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Document Upload */}
              <DocumentUpload
                label={`${
                  formData.documentType === "passport"
                    ? "Passport"
                    : "National ID"
                } Front`}
                required
                providerId={provider?.id}
                onUploadComplete={(url) =>
                  setFormData({ ...formData, frontUrl: url })
                }
              />

              {formData.documentType === "national_id" && (
                <DocumentUpload
                  label="National ID Back"
                  required
                  providerId={provider?.id}
                  onUploadComplete={(url) =>
                    setFormData({ ...formData, backUrl: url })
                  }
                />
              )}

              {/* Requirements Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Document Requirements:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Clear, high-quality photo or scan</li>
                      <li>• All text must be readable</li>
                      <li>• Document must be valid (not expired)</li>
                      <li>• No screenshots or photocopies</li>
                      <li>• File formats: JPG, PNG, or PDF (max 5MB)</li>
                      <li>• Minimum 800x600 pixels for images</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  !formData.frontUrl ||
                  (formData.documentType === "national_id" && !formData.backUrl)
                }
                className="w-full py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg transition-colors shadow-sm"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </span>
                ) : (
                  "Submit for Verification"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Full-Screen Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-12 max-w-md w-full mx-4 text-center animate-scaleIn">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-checkmarkPop">
                <CheckCircle className="h-16 w-16 text-green-500 animate-checkmarkDraw" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Submitted Successfully!
            </h2>

            <p className="text-gray-600 mb-8">
              Your documents have been submitted successfully for verification.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
              <p className="text-sm text-blue-800">
                Our team will review your documents within 24-48 hours. You'll
                receive an email notification once the verification is complete.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              Redirecting in{" "}
              <span className="font-bold text-gray-900">{countdown}</span>{" "}
              seconds...
            </div>

            <button
              onClick={() =>
                router.push("/provider/dashboard?verification=submitted")
              }
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Go to Dashboard now
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkmarkPop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes checkmarkDraw {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }

        .animate-checkmarkPop {
          animation: checkmarkPop 0.6s ease-out;
        }

        .animate-checkmarkDraw {
          animation: checkmarkDraw 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function ProviderVerificationPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderVerificationPageContent />
    </ProtectedRoute>
  );
}
