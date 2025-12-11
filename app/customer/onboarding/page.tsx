// app/customer/onboarding/page.tsx - COMPLETE CUSTOMER ONBOARDING
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_AVATARS } from "@/lib/utils/avatar";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  MapPin,
  User,
  CheckCircle2,
  Target,
  Zap,
  Star,
  Upload,
  Phone,
  Camera,
} from "lucide-react";

const locations = [
  "Sinkor",
  "Congo Town",
  "Paynesville",
  "Old Road",
  "New Kru Town",
  "Monrovia",
  "Duala",
  "Gardnersville",
];

function CustomerOnboardingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    location: "",
    phone: "",
    avatarUrl: null as string | null,
    avatarType: "emoji" as "emoji" | "upload",
    selectedEmoji: DEFAULT_AVATARS[0],
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

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

  // Phone number formatting for Liberia (+231)
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // If starts with 231, keep it, otherwise add it
    let formattedDigits = digits;
    if (digits.startsWith("231")) {
      formattedDigits = digits.slice(3);
    } else if (digits.startsWith("0")) {
      formattedDigits = digits.slice(1);
    }

    // Limit to 9 digits after country code
    formattedDigits = formattedDigits.slice(0, 9);

    // Format as: +231 XXX XXX XXX
    if (formattedDigits.length > 0) {
      const parts = [];
      if (formattedDigits.length > 6) {
        parts.push(formattedDigits.slice(0, 3));
        parts.push(formattedDigits.slice(3, 6));
        parts.push(formattedDigits.slice(6, 9));
      } else if (formattedDigits.length > 3) {
        parts.push(formattedDigits.slice(0, 3));
        parts.push(formattedDigits.slice(3, 6));
      } else {
        parts.push(formattedDigits);
      }
      return "+231 " + parts.join(" ");
    }

    return "+231 ";
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("231"); // +231 XXX XXX XXX
  };

  // Image upload with compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size must be less than 2MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setUploadingImage(true);

    try {
      // Compress image
      const compressedFile = await compressImage(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setFormData({
        ...formData,
        avatarUrl: publicUrl,
        avatarType: "upload",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Simple image compression using canvas
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Calculate new dimensions (max 400x400)
          let width = img.width;
          let height = img.height;
          const maxSize = 400;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Failed to compress image"));
              }
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleComplete = async () => {
    if (!user) {
      return;
    }

    setLoading(true);

    try {
      // Prepare avatar URL
      let finalAvatarUrl = formData.avatarUrl;
      if (formData.avatarType === "emoji") {
        finalAvatarUrl = formData.selectedEmoji;
      }

      // Update profile with all data
      const { error: profileError } = await (supabase as any)
      .from("profiles")
        .update({
          location: formData.location,
          phone: formData.phone.replace(/\s/g, ""), // Remove spaces before saving
          avatar_url: finalAvatarUrl,
          onboarding_completed: true,
        } as any)
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile error:", profileError);
        alert("Error updating profile: " + profileError.message);
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push("/customer/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("An unexpected error occurred");
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 2) return formData.location !== "";
    if (step === 3) {
      // Phone is required, avatar is optional
      return isValidPhone(formData.phone);
    }
    return true;
  };

  const getAvatarDisplay = () => {
    if (formData.avatarType === "upload" && formData.avatarUrl) {
      return (
        <img
          src={formData.avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
        />
      );
    }
    return (
      <div className="text-5xl flex items-center justify-center">
        {formData.selectedEmoji}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <span className="text-sm font-medium text-white/80">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-white/80">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="border-0 shadow-2xl overflow-hidden bg-white rounded-3xl">
          <div className="p-8 sm:p-12">
            {/* Step 1: Welcome */}
            {step === 1 && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    Welcome to LiberiaFix!
                  </h1>
                  <p className="text-lg text-gray-600">
                    Let's personalize your experience in just a few quick steps
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-1">
                      Find Providers
                    </h3>
                    <p className="text-sm text-gray-600">
                      Discover trusted service providers
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <Zap className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-1">
                      Quick Connect
                    </h3>
                    <p className="text-sm text-gray-600">
                      Get instant contact information
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                    <Star className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900 mb-1">
                      Leave Reviews
                    </h3>
                    <p className="text-sm text-gray-600">
                      Share your experience
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl"
                >
                  Let's Get Started
                  <ArrowRight className="h-5 w-5 ml-2 inline" />
                </button>

                <p className="text-xs text-gray-500 mt-6">
                  Takes less than 2 minutes
                </p>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                    <MapPin className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Where are you located?
                  </h2>
                  <p className="text-gray-600">
                    We'll show you providers in your area
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                  {locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => setFormData({ ...formData, location })}
                      className={`p-4 rounded-xl border-2 transition-all font-medium ${
                        formData.location === location
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105"
                          : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <MapPin
                        className={`h-5 w-5 mx-auto mb-2 ${
                          formData.location === location
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      />
                      {location}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2 inline" />
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                    <ArrowRight className="h-5 w-5 ml-2 inline" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Complete Profile */}
            {step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Complete Your Profile
                  </h2>
                  <p className="text-gray-600">
                    This helps providers recognize and contact you
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="+231 777 123 456"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-lg"
                    />
                    {formData.phone && !isValidPhone(formData.phone) && (
                      <p className="text-sm text-red-500 mt-1">
                        Please enter a valid Liberian phone number
                      </p>
                    )}
                  </div>

                  {/* Avatar Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <Camera className="h-4 w-4 inline mr-2" />
                      Profile Picture
                    </label>

                    {/* Avatar Preview */}
                    <div className="flex justify-center mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                        {getAvatarDisplay()}
                      </div>
                    </div>

                    {/* Upload or Choose Emoji */}
                    <div className="space-y-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-700 font-medium disabled:opacity-50"
                      >
                        {uploadingImage ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                            Uploading...
                          </span>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 inline mr-2" />
                            Upload Photo (Max 2MB)
                          </>
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">
                            or choose an avatar
                          </span>
                        </div>
                      </div>

                      {/* Emoji Avatar Grid */}
                      <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 border-2 border-gray-200 rounded-xl">
                        {DEFAULT_AVATARS.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() =>
                              setFormData({
                                ...formData,
                                selectedEmoji: emoji,
                                avatarType: "emoji",
                                avatarUrl: null,
                              })
                            }
                            className={`text-3xl p-2 rounded-lg transition-all hover:bg-gray-100 ${
                              formData.avatarType === "emoji" &&
                              formData.selectedEmoji === emoji
                                ? "bg-blue-100 ring-2 ring-blue-500"
                                : ""
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Profile Preview */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
                      How providers will see you
                    </p>
                    <div className="flex items-center gap-3 bg-white p-4 rounded-lg shadow-sm">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center flex-shrink-0">
                        {formData.avatarType === "upload" &&
                        formData.avatarUrl ? (
                          <img
                            src={formData.avatarUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-2xl">
                            {formData.selectedEmoji}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {user?.user_metadata?.full_name || "Your Name"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formData.phone || "+231 XXX XXX XXX"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formData.location}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2 inline" />
                    Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={!canProceed() || loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Setting up...
                      </span>
                    ) : (
                      <>
                        Complete Setup
                        <Sparkles className="h-5 w-5 ml-2 inline" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-4">
                  You can change these details anytime in your account settings
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Skip Option */}
        {step > 1 && (
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/customer/dashboard")}
              className="text-white/90 hover:text-white text-sm font-medium transition-colors"
            >
              Skip for now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomerOnboarding() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <CustomerOnboardingContent />
    </ProtectedRoute>
  );
}
