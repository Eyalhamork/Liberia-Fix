"use client";

import React, { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Wallet,
  Gift,
  Zap,
} from "lucide-react";
import {
  CREDIT_PACKAGES,
  getTotalCredits,
  type CreditPackage,
} from "@/lib/constants/wallet";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TopUpModal({ isOpen, onClose, onSuccess }: TopUpModalProps) {
  const [step, setStep] = useState("select"); // select, confirm, processing, success, error
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    null
  );
  const [selectedProvider, setSelectedProvider] = useState("mtn_momo");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [error, setError] = useState("");
  const [statusCheckInterval, setStatusCheckInterval] =
    useState<NodeJS.Timeout | null>(null);

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
      isActive: false,
    },
  ];

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.startsWith("231")) {
      return cleaned.slice(0, 12);
    } else if (cleaned.startsWith("0")) {
      return "231" + cleaned.slice(1, 10);
    } else {
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
      return true;
    } finally {
      setIsValidating(false);
    }
  };

  // Initiate top-up payment
  const initiateTopUp = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: selectedPackage.id,
          payment_provider: selectedProvider,
          payer_phone: phoneNumber,
          simulate: true, // Enable simulation mode
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReferenceId(data.referenceId || data.transaction_id);

        // Check if payment is already completed (simulation mode)
        if (data.status === "completed" || data.simulated) {
          setStep("success");
          setTimeout(() => {
            onSuccess && onSuccess();
            onClose();
            resetModal();
          }, 2000);
        } else {
          // Real payment - poll for status
          setStep("processing");
          startStatusPolling(data.referenceId);
        }
      } else {
        setError(data.error || "Failed to initiate top-up");
        setStep("error");
      }
    } catch (err) {
      console.error("Top-up initiation error:", err);
      setError("An unexpected error occurred");
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Poll payment status
  const startStatusPolling = (refId: string) => {
    let attempts = 0;
    const maxAttempts = 60;

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
            onSuccess && onSuccess();
            onClose();
            resetModal();
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
    }, 5000);

    setStatusCheckInterval(interval);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Reset modal
  const resetModal = () => {
    setStep("select");
    setSelectedPackage(null);
    setPhoneNumber("");
    setError("");
    setReferenceId("");
  };

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  // Handle proceed
  const handleProceedToConfirm = async () => {
    if (!selectedPackage) {
      setError("Please select a credit package");
      return;
    }

    const isValid = await validatePhone();
    if (isValid) {
      setStep("confirm");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === "select" && "Top Up Credits"}
                {step === "confirm" && "Confirm Top-Up"}
                {step === "processing" && "Processing Payment"}
                {step === "success" && "Top-Up Successful"}
                {step === "error" && "Payment Failed"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                🧪 Test Mode - Simulated Payment
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                resetModal();
              }}
              className="text-gray-400 hover:text-gray-600"
              disabled={isProcessing}
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* SELECT PACKAGE STEP */}
          {step === "select" && (
            <div className="space-y-6">
              {/* Credit Packages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Your Package
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CREDIT_PACKAGES.map((pkg) => {
                    const totalCredits = getTotalCredits(pkg);
                    const isSelected = selectedPackage?.id === pkg.id;

                    return (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-5 rounded-xl border-2 transition-all text-left relative ${
                          isSelected
                            ? "border-green-500 bg-green-50 shadow-md"
                            : "border-gray-200 bg-white hover:border-green-300"
                        } ${pkg.popular ? "ring-2 ring-blue-400" : ""}`}
                      >
                        {/* Badge */}
                        {pkg.badge && (
                          <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-full">
                            {pkg.badge}
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-bold text-lg text-gray-900">
                              {pkg.label}
                            </div>
                            <div className="text-2xl font-bold text-green-600 mt-1">
                              ${pkg.amount}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Wallet className="w-4 h-4 text-gray-600" />
                            <span className="text-gray-700">
                              {pkg.credits} credits
                            </span>
                          </div>
                          {pkg.bonus > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Gift className="w-4 h-4 text-purple-600" />
                              <span className="text-purple-700 font-semibold">
                                +{pkg.bonus} bonus credits!
                              </span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-gray-200 mt-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                              <Zap className="w-4 h-4" />
                              Total: {totalCredits} credits
                            </div>
                          </div>
                          {pkg.savings && (
                            <div className="text-xs text-green-600 font-semibold">
                              {pkg.savings}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      disabled={!provider.isActive}
                      className={`p-4 rounded-lg border-2 transition-all ${
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
                        <span className="text-2xl">{provider.logo}</span>
                        <div className="flex-1 text-left">
                          <div className="font-semibold text-gray-900 text-sm">
                            {provider.name}
                          </div>
                          {!provider.isActive && (
                            <div className="text-xs text-gray-500">
                              Coming Soon
                            </div>
                          )}
                        </div>
                        {selectedProvider === provider.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number */}
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                disabled={
                  !selectedPackage || !phoneNumber || isValidating
                }
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
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
          {step === "confirm" && selectedPackage && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package:</span>
                  <span className="font-semibold">{selectedPackage.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credits:</span>
                  <span className="font-semibold text-green-600">
                    {getTotalCredits(selectedPackage)} credits
                  </span>
                </div>
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
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-green-600 text-xl">
                    ${selectedPackage.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Next Steps:</strong> You will receive a prompt on
                  your phone to authorize this payment. Please enter your MTN
                  Mobile Money PIN to complete the transaction.
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
                  onClick={initiateTopUp}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Top-Up</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING STEP */}
          {step === "processing" && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <Loader2 className="w-16 h-16 text-green-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Processing Payment
                </h3>
                <p className="text-gray-600">
                  Completing your top-up transaction...
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
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
                  Top-Up Successful!
                </h3>
                <p className="text-gray-600">
                  Your credits have been added to your wallet.
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
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all"
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
