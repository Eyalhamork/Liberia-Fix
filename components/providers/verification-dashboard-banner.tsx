// components/provider/verification-dashboard-banner.tsx
"use client";

import { Shield, Clock, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface VerificationBannerProps {
  verificationStatus: "not_submitted" | "pending" | "verified" | "rejected";
  verificationSubmittedAt?: string | null;
  rejectionReason?: string | null;
}

export function VerificationDashboardBanner({
  verificationStatus,
  verificationSubmittedAt,
  rejectionReason,
}: VerificationBannerProps) {
  if (verificationStatus === "not_submitted") {
    return (
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">
                Get Verified
              </h3>
              <p className="text-sm text-yellow-800 mb-3">
                Verify your account to build trust and get more bookings.
                Verified providers get up to 3x more inquiries!
              </p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>✓ Stand out with a verified badge</li>
                <li>✓ Build customer trust</li>
                <li>✓ Increase booking rates</li>
              </ul>
            </div>
          </div>
          <Link
            href="/provider/verification"
            className="flex-shrink-0 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 whitespace-nowrap font-medium transition-colors shadow-sm"
          >
            Start Verification
          </Link>
        </div>
      </div>
    );
  }

  if (verificationStatus === "pending") {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-700" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-blue-900">
                Verification Pending
              </h3>
            </div>
            <p className="text-sm text-blue-800">
              We're reviewing your documents. You'll be notified within 24-48
              hours.
            </p>
            {verificationSubmittedAt && (
              <p className="text-xs text-blue-700 mt-1">
                Submitted on{" "}
                {new Date(verificationSubmittedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === "verified") {
    return (
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
              <Shield className="h-5 w-5 text-green-700" fill="currentColor" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-green-900">
                Verified Provider
              </h3>
              <span className="text-lg">🎉</span>
            </div>
            <p className="text-sm text-green-800">
              Your account is verified! Customers can see your verified badge on
              your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 flex-1">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-700" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                Verification Update Required
              </h3>
              <p className="text-sm text-red-800 mb-2">
                {rejectionReason ||
                  "Your documents could not be verified. Please review and resubmit."}
              </p>
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-2 mt-2">
                <AlertCircle className="h-4 w-4 text-red-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">
                  Common issues: Blurry images, expired documents, or
                  information mismatch
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/provider/verification"
            className="flex-shrink-0 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap font-medium transition-colors shadow-sm"
          >
            Resubmit Documents
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

// Example usage in provider dashboard:
/*
// app/provider/dashboard/page.tsx
import { VerificationDashboardBanner } from '@/components/provider/verification-dashboard-banner';

export default function ProviderDashboard() {
  // ... fetch provider data
  
  return (
    <div className="container mx-auto px-4 py-8">
      <VerificationDashboardBanner 
        verificationStatus={provider.verification_status}
        verificationSubmittedAt={provider.verification_submitted_at}
        rejectionReason={existingVerification?.rejection_reason}
      />
      
      // ... rest of dashboard
    </div>
  );
}
*/
