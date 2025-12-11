"use client";

import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Header } from "@/components/layout/header";
import { Check, Phone, MessageSquare, ArrowRight } from "lucide-react";

function BookingSuccessContent() {
  const router = useRouter();
  const params = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 animate-in zoom-in duration-500">
          <Check className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Payment Successful! 🎉
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your booking is confirmed. Contact details unlocked!
        </p>

        <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-green-200 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">What's Next?</h2>
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  1. Contact Provider
                </h3>
                <p className="text-sm text-gray-600">
                  Call or WhatsApp the provider to discuss details and schedule
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  2. Confirm Details
                </h3>
                <p className="text-sm text-gray-600">
                  Agree on pricing, timeline, and scope of work
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  3. Complete Service
                </h3>
                <p className="text-sm text-gray-600">
                  Work directly with the provider. Leave a review when done!
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push(`/customer/bookings/${params?.id}`)}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg inline-flex items-center gap-2"
        >
          View Booking Details
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <BookingSuccessContent />
    </ProtectedRoute>
  );
}
