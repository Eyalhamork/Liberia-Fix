import React, { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  DollarSign,
} from "lucide-react";

// Payment Modal Component
export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  currency = "USD",
  transactionType,
  providerId,
  bookingId,
  onSuccess,
}) {
  const [step, setStep] = useState("select"); // select, confirm, processing, success, error
  const [selectedProvider, setSelectedProvider] = useState("mtn_momo");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [error, setError] = useState("");
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);

  // Payment providers
  const providers = [
    {
      id: "mtn_momo",
      name: "MTN Mobile Money",
      logo: "📱",
      description: "Pay with MTN MoMo",
      isActive: true,
    },
    {
      id: "orange_money",
      name: "Orange Money",
      logo: "🍊",
      description: "Pay with Orange Money",
      isActive: false, // Not yet implemented
    },
  ];

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.startsWith("231")) {
      // Already has country code
      return cleaned.slice(0, 12);
    } else if (cleaned.startsWith("0")) {
      // Remove leading 0
      return "231" + cleaned.slice(1, 10);
    } else {
      // Add country code
      return "231" + cleaned.slice(0, 9);
    }
  };

  // Validate phone number
  const validatePhone = async () => {
    if (!phoneNumber || phoneNumber.length < 12) {
      setError("Please enter a valid phone number");
      return false;
    }

    setIsValidating(true);
    setError("");

    try {
      const response = await fetch("/api/payments/validate-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          provider: selectedProvider,
        }),
      });

      const data = await response.json();

      if (data.isValid) {
        return true;
      } else {
        setError("Invalid MTN Mobile Money number");
        return false;
      }
    } catch (err) {
      console.error("Validation error:", err);
      return true; // Continue anyway if validation fails
    } finally {
      setIsValidating(false);
    }
  };

  // Initiate payment
  const initiatePayment = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          transactionType,
          paymentProvider: selectedProvider,
          payerPhone: phoneNumber,
          relatedBookingId: bookingId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReferenceId(data.referenceId);
        setStep("processing");
        startStatusPolling(data.referenceId);
      } else {
        setError(data.error || "Failed to initiate payment");
        setStep("error");
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      setError("An unexpected error occurred");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Poll payment status
  const startStatusPolling = (refId) => {
    let attempts = 0;
    const maxAttempts = 60; // Poll for 5 minutes (every 5 seconds)

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch(
          `/api/payments/status?referenceId=${refId}`
        );
        const data = await response.json();

        if (data.status === "completed") {
          clearInterval(interval);
          setStep("success");
          setTimeout(() => {
            onSuccess && onSuccess(data.transaction);
            onClose();
          }, 2000);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setError("Payment failed. Please try again.");
          setStep("error");
        } else if (data.status === "expired") {
          clearInterval(interval);
          setError("Payment expired. Please try again.");
          setStep("error");
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Payment timeout. Please check your transaction history.");
          setStep("error");
        }
      } catch (err) {
        console.error("Status check error:", err);
      }
    }, 5000); // Check every 5 seconds

    setStatusCheckInterval(interval);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Handle phone input
  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  // Handle proceed to confirm
  const handleProceedToConfirm = async () => {
    const isValid = await validatePhone();
    if (isValid) {
      setStep("confirm");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === "select" && "Select Payment Method"}
              {step === "confirm" && "Confirm Payment"}
              {step === "processing" && "Processing Payment"}
              {step === "success" && "Payment Successful"}
              {step === "error" && "Payment Failed"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* SELECT PROVIDER STEP */}
          {step === "select" && (
            <div className="space-y-6">
              {/* Amount Display */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount to Pay:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {currency} ${amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Payment Method
                </label>
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      disabled={!provider.isActive}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        selectedProvider === provider.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      } ${
                        !provider.isActive
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-blue-300 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-3xl">{provider.logo}</span>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-900">
                            {provider.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {provider.description}
                            {!provider.isActive && " (Coming Soon)"}
                          </div>
                        </div>
                        {selectedProvider === provider.id && (
                          <CheckCircle className="w-6 h-6 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Money Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="0770123456"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter your MTN Mobile Money number
                </p>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleProceedToConfirm}
                disabled={!phoneNumber || isValidating}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          )}

          {/* CONFIRM STEP */}
          {step === "confirm" && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-semibold">
                    {providers.find((p) => p.id === selectedProvider)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Number:</span>
                  <span className="font-semibold">{phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-blue-600">
                    {currency} ${amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Next Steps:</strong> You will receive a prompt on your
                  phone to authorize this payment. Please enter your MTN Mobile
                  Money PIN to complete the transaction.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep("select")}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={initiatePayment}
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Payment</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING STEP */}
          {step === "processing" && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Waiting for Payment
                </h3>
                <p className="text-gray-600">
                  Please check your phone and enter your PIN to authorize the
                  payment.
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Reference:{" "}
                  <span className="font-mono font-semibold">{referenceId}</span>
                </p>
              </div>
            </div>
          )}

          {/* SUCCESS STEP */}
          {step === "success" && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600">
                  Your payment has been processed successfully.
                </p>
              </div>
            </div>
          )}

          {/* ERROR STEP */}
          {step === "error" && (
            <div className="space-y-6">
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <XCircle className="w-16 h-16 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Payment Failed
                  </h3>
                  <p className="text-gray-600">{error}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStep("select");
                  setError("");
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
