"use client";

import { useState } from "react";
import {
  User,
  Briefcase,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Award,
} from "lucide-react";

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"customer" | "provider" | null>(
    null
  );
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    // Provider specific
    business_name: "",
    services: [] as string[],
    bio: "",
  });

  const totalSteps = userType === "provider" ? 3 : 2;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    // TODO: Send data to your API endpoint
    // Example:
    // await fetch('/api/onboarding/complete', {
    //   method: 'POST',
    //   body: JSON.stringify({ userType, ...formData })
    // });

    // Redirect based on user type
    if (userType === "provider") {
      window.location.href = "/provider/dashboard";
    } else {
      window.location.href = "/customer/dashboard";
    }
  };

  const serviceOptions = [
    "Plumbing",
    "Cleaning",
    "Electrical",
    "Handyman",
    "Gardening",
    "Driving",
    "Painting",
    "Carpentry",
    "IT Support",
    "Tutoring",
    "Photography",
    "Catering",
  ];

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
          {/* Step 1: Choose User Type */}
          {step === 1 && !userType && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="h-4 w-4" />
                Welcome to LiberiaFix!
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How would you like to use LiberiaFix?
              </h2>

              <p className="text-lg text-gray-600 mb-12">
                Choose the option that best describes you
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Card */}
                <button
                  onClick={() => setUserType("customer")}
                  className="group bg-gradient-to-br from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 transition-all text-left"
                >
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <User className="h-8 w-8" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    I'm a Customer
                  </h3>

                  <p className="text-gray-600 mb-4">
                    Looking for trusted service providers
                  </p>

                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      Find verified providers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      Compare ratings & prices
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      Connect for just $1
                    </li>
                  </ul>
                </button>

                {/* Provider Card */}
                <button
                  onClick={() => setUserType("provider")}
                  className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 transition-all text-left"
                >
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Briefcase className="h-8 w-8" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    I'm a Provider
                  </h3>

                  <p className="text-gray-600 mb-4">
                    Offering services to grow my business
                  </p>

                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      Get more customers
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      Build your reputation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      Start FREE forever
                    </li>
                  </ul>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info (Both user types) */}
          {step === 1 && userType && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Tell us about yourself
                </h2>
                <p className="text-gray-600">Let's set up your profile</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="+231 XXX XXX XXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    required
                  >
                    <option value="">Select your area</option>
                    <option value="Sinkor">Sinkor</option>
                    <option value="Congo Town">Congo Town</option>
                    <option value="Paynesville">Paynesville</option>
                    <option value="Old Road">Old Road</option>
                    <option value="Monrovia">Monrovia (Other)</option>
                    <option value="Outside Monrovia">Outside Monrovia</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setUserType(null)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors font-semibold"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>

                <button
                  onClick={handleNext}
                  disabled={
                    !formData.full_name || !formData.phone || !formData.location
                  }
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 (Provider): Business Info */}
          {step === 2 && userType === "provider" && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Set up your business profile
                </h2>
                <p className="text-gray-600">
                  Help customers find and trust you
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        business_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="John's Plumbing Services"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    What services do you offer? * (Select at least 1)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {serviceOptions.map((service) => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                          formData.services.includes(service)
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    FREE plan: 1 service. PRO plan: Up to 10 services
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    About Your Services *
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                    rows={4}
                    placeholder="Describe your experience, specialties, and what makes you stand out..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors font-semibold"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>

                <button
                  onClick={handleNext}
                  disabled={
                    !formData.business_name ||
                    formData.services.length === 0 ||
                    !formData.bio
                  }
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Final Step: Confirmation */}
          {((step === 2 && userType === "customer") ||
            (step === 3 && userType === "provider")) && (
            <div>
              <div className="text-center mb-8">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  You're all set!
                </h2>
                <p className="text-gray-600">
                  {userType === "provider"
                    ? "Your provider profile is ready to go live"
                    : "Start finding trusted service providers now"}
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-4">
                  Profile Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.full_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-semibold text-gray-900">
                      {formData.location}
                    </span>
                  </div>
                  {userType === "provider" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business:</span>
                        <span className="font-semibold text-gray-900">
                          {formData.business_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Services:</span>
                        <span className="font-semibold text-gray-900">
                          {formData.services.length} selected
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              {userType === "provider" && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 mb-8">
                  <div className="flex items-start gap-4">
                    <Award className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold mb-2">
                        Start with FREE, Upgrade to PRO
                      </h4>
                      <p className="text-sm text-blue-100 mb-3">
                        You're starting with our FREE plan (1 service, 1 photo).
                        Upgrade to PRO anytime for $20/month to get 10 services,
                        20 photos, higher ranking, and 3x more bookings!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-50 transition-colors font-semibold"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </button>

                <button
                  onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                >
                  <Target className="h-5 w-5" />
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Need help?{" "}
          <a
            href="/support"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
