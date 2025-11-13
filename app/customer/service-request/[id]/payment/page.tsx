// app/customer/service-request/[id]/payment/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Header } from "@/components/layout/header";
import {
  CreditCard,
  Shield,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";

function ServiceRequestPaymentContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mtn_momo");
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchServiceRequest();
    }
  }, [user, params.id]);

  const fetchServiceRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", params.id)
        .eq("customer_id", user?.id)
        .single();

      if (error) throw error;

      // If already paid, redirect to dashboard
      if (data.payment_status === "completed") {
        router.push("/customer/dashboard");
        return;
      }

      setServiceRequest(data);
    } catch (err) {
      console.error("Error fetching service request:", err);
      setError("Service request not found");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!phoneNumber) {
      setError("Please enter your phone number");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Call mock payment API
      const response = await fetch("/api/payments/mock-service-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_request_id: params.id,
          phone_number: phoneNumber,
          payment_method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPaymentSuccess(true);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/customer/dashboard");
        }, 3000);
      } else {
        setError(
          data.error || data.message || "Payment failed. Please try again."
        );
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setError("Failed to process payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!serviceRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Service Request Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/customer/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6 animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Your service request is now live
          </p>
          <p className="text-gray-500 mb-8">
            Pro providers can now see and bid on your request
          </p>
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200 mb-6">
            <h3 className="font-bold text-lg mb-2">{serviceRequest.title}</h3>
            <p className="text-gray-600 text-sm mb-4">
              {serviceRequest.description}
            </p>
            <div className="text-sm text-gray-500">
              Expires in 7 days • You'll be notified when providers bid
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting to dashboard in 3 seconds...
          </p>
          <button
            onClick={() => router.push("/customer/dashboard")}
            className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all"
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Payment
          </h1>
          <p className="text-gray-600">
            Pay $7 to publish your service request
          </p>
        </div>

        {/* Service Request Summary */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Your Request
          </h3>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {serviceRequest.title}
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {serviceRequest.description}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Category:</span>
            <span className="font-semibold text-gray-900">
              {serviceRequest.category}
            </span>
          </div>
          {serviceRequest.budget_min && serviceRequest.budget_max && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-500">Budget:</span>
              <span className="font-semibold text-green-600">
                ${serviceRequest.budget_min} - ${serviceRequest.budget_max}
              </span>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Payment Details
          </h3>

          {/* Amount */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Posting Fee:</span>
              <span className="text-2xl font-bold text-gray-900">$7.00</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              One-time fee • Request active for 7 days
            </p>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod("mtn_momo")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "mtn_momo"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-gray-900">MTN MoMo</div>
                <div className="text-xs text-gray-500">Mobile Money</div>
              </button>
              <button
                onClick={() => setPaymentMethod("orange_money")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "orange_money"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-bold text-gray-900">Orange Money</div>
                <div className="text-xs text-gray-500">Mobile Money</div>
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your mobile money number"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter the number associated with your{" "}
              {paymentMethod === "mtn_momo" ? "MTN" : "Orange"} Money account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm">
                  Payment Failed
                </p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Mock Payment Notice */}
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-1">
                  Test Mode Active
                </p>
                <p className="text-xs text-blue-700">
                  This is a mock payment for testing. No real charges will be
                  made. Payment will simulate with 90% success rate.
                </p>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={processing || !phoneNumber}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Pay $7.00 Securely</span>
              </>
            )}
          </button>
        </div>

        {/* What Happens Next */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">What Happens Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  Your request goes live immediately
                </p>
                <p className="text-gray-600 text-sm">
                  Pro providers can see and bid on your request
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  Get notified of new bids
                </p>
                <p className="text-gray-600 text-sm">
                  Review quotes and provider profiles
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  Choose your provider
                </p>
                <p className="text-gray-600 text-sm">
                  Contact details unlocked automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceRequestPaymentPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <ServiceRequestPaymentContent />
    </ProtectedRoute>
  );
}
