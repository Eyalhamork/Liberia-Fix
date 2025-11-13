// app/customer/bookings/[id]/payment/page.tsx
// ============================================

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import {
  CreditCard,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  DollarSign,
  User,
  Phone,
} from "lucide-react";

function BookingPaymentContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [booking, setBooking] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment form
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"orange" | "mtn">(
    "orange"
  );

  useEffect(() => {
    if (user && params.id) {
      fetchBooking();
    }
  }, [user, params.id]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          provider:providers!bookings_provider_id_fkey (
            id,
            business_name,
            profiles:user_id (
              full_name,
              phone
            )
          )
        `
        )
        .eq("id", params.id)
        .eq("customer_id", user?.id)
        .single();

      if (error) throw error;

      setBooking(data);
      setProvider(data.provider);

      // Pre-fill phone number if available
      if (user?.user_metadata?.phone) {
        setPhoneNumber(user.user_metadata.phone);
      }
    } catch (err: any) {
      console.error("Error fetching booking:", err);
      setError(err.message || "Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // SIMULATE PAYMENT (like service request)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Randomly succeed or fail (90% success rate)
      const success = Math.random() > 0.1;

      if (!success) {
        throw new Error("Payment failed. Please try again.");
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          payment_status: "completed",
          booking_status: "confirmed",
          payment_method:
            paymentMethod === "orange" ? "Orange Money" : "MTN Money",
        })
        .eq("id", params.id);

      if (updateError) throw updateError;

      // Success! Redirect
      router.push(`/customer/bookings/${params.id}/success`);
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/customer/bookings")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  // If already paid
  if (booking?.payment_status === "completed") {
    router.push(`/customer/bookings/${params.id}`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Payment
          </h1>
          <p className="text-gray-600">
            Pay $3 to unlock contact with {provider?.business_name}
          </p>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Booking Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Provider:</span>
              <span className="font-semibold text-gray-900">
                {provider?.business_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Contact Person:</span>
              <span className="font-semibold text-gray-900">
                {provider?.profiles?.full_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Booking Fee:</span>
              <span className="text-2xl font-bold text-blue-600">$3.00</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Secure Payment
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-1">
                  Payment Failed
                </p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod("orange")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "orange"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">🍊</div>
                <div className="font-bold text-gray-900">Orange Money</div>
                {paymentMethod === "orange" && (
                  <Check className="h-5 w-5 text-orange-600 mx-auto mt-2" />
                )}
              </button>
              <button
                onClick={() => setPaymentMethod("mtn")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "mtn"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-2">📱</div>
                <div className="font-bold text-gray-900">MTN Money</div>
                {paymentMethod === "mtn" && (
                  <Check className="h-5 w-5 text-yellow-600 mx-auto mt-2" />
                )}
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mobile Money Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+231 XXX XXXX"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter your {paymentMethod === "orange" ? "Orange" : "MTN"} Money
              number
            </p>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={processing || !phoneNumber.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing Payment...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-5 w-5" />
                Pay $3.00 Now
              </span>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-start gap-4">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                🔒 Secure Payment
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ Your payment information is encrypted</li>
                <li>✓ One-time fee - no recurring charges</li>
                <li>✓ Contact provider immediately after payment</li>
                <li>✓ 24/7 customer support available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPaymentPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <BookingPaymentContent />
    </ProtectedRoute>
  );
}
