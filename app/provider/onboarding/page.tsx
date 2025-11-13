// app/provider/onboarding/page.tsx - FIXED VERSION
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  SERVICE_BANK,
  ServiceCategory,
  Specialty,
} from "@/lib/data/service-bank";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Clock,
  MapPin,
  Briefcase,
  Camera,
  Award,
  Star,
  Building2,
  Phone,
  Mail,
  Shield,
  Lock,
  Search,
  X,
  AlertCircle,
  Gift,
  Zap,
  TrendingUp,
  FileText,
} from "lucide-react";

const LOCATIONS = [
  "Sinkor",
  "Paynesville",
  "Congo Town",
  "Old Road",
  "Caldwell",
  "Red Light",
  "Duport Road",
  "Gardnersville",
];

interface SelectedSpecialties {
  [categoryId: string]: string[];
}

function ProviderOnboardingContent() {
  const router = useRouter();
  const { user, updateProfile } = useAuth(); // ✅ Add updateProfile here
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Tier - Free by default
  const [tier, setTier] = useState<"free" | "pro">("free");
  const [promoCode, setPromoCode] = useState("");
  const [promoValidated, setPromoValidated] = useState(false);
  const [promoError, setPromoError] = useState("");

  // Selections
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] =
    useState<SelectedSpecialties>({});
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    accountType: "individual",
    businessName: "",
    fullName: "",
    gender: "male",
    phone: "",
    email: "",
    location: "",
    bio: "",
    portfolioImages: [] as File[],
    nationalIdFront: null as File | null,
    nationalIdBack: null as File | null,
  });

  // Dynamic total steps based on tier
  const totalSteps = tier === "free" ? 7 : 8;
  const progress = (step / totalSteps) * 100;

  // Check if we're on the final review step
  const isFinalStep =
    (tier === "free" && step === 7) || (tier === "pro" && step === 8);

  // Tier limits (Free is default)
  const MAX_CATEGORIES = tier === "free" ? 1 : 5;
  const MAX_SPECIALTIES_PER_CATEGORY = tier === "free" ? 3 : 5;
  const MAX_PHOTOS = tier === "free" ? 1 : 20;

  const canAddMoreCategories = selectedCategories.length < MAX_CATEGORIES;

  // Validate promo code
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    setLoading(true);
    setPromoError("");

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const queryPromise = supabase
        .from("promo_codes")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("active", true)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid error on no match

      const { data, error } = (await Promise.race([
        queryPromise,
        timeoutPromise,
      ])) as any;

      if (error) {
        console.error("Promo query error:", error);
        setPromoError("Invalid or expired promo code");
        return;
      }

      if (!data) {
        setPromoError("Invalid or expired promo code");
        return;
      }

      // Check if already used
      if (data.used_by_user_id) {
        setPromoError("This promo code has already been used");
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoError("This promo code has expired");
        return;
      }

      // Valid! Apply Pro benefits
      setTier("pro");
      setPromoValidated(true);
      setPromoError("");

      alert("🎉 Promo code applied! You now have Pro features for 1 month!");
    } catch (err: any) {
      console.error("Promo validation error:", err);
      setPromoError(
        err.message === "Request timeout"
          ? "Request timed out. Please check your connection and try again."
          : "Error validating code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Category selection
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(
        selectedCategories.filter((id) => id !== categoryId)
      );
      const newSpecialties = { ...selectedSpecialties };
      delete newSpecialties[categoryId];
      setSelectedSpecialties(newSpecialties);
    } else if (canAddMoreCategories) {
      setSelectedCategories([...selectedCategories, categoryId]);
      setSelectedSpecialties({
        ...selectedSpecialties,
        [categoryId]: [],
      });
    }
  };

  // Specialty selection
  const toggleSpecialty = (categoryId: string, specialtyId: string) => {
    const current = selectedSpecialties[categoryId] || [];
    const canAdd = current.length < MAX_SPECIALTIES_PER_CATEGORY;

    if (current.includes(specialtyId)) {
      setSelectedSpecialties({
        ...selectedSpecialties,
        [categoryId]: current.filter((id) => id !== specialtyId),
      });
    } else if (canAdd) {
      setSelectedSpecialties({
        ...selectedSpecialties,
        [categoryId]: [...current, specialtyId],
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const availableSlots = MAX_PHOTOS - formData.portfolioImages.length;
    setFormData((prev) => ({
      ...prev,
      portfolioImages: [
        ...prev.portfolioImages,
        ...files.slice(0, availableSlots),
      ],
    }));
  };

  const handleNationalIdUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        [side === "front" ? "nationalIdFront" : "nationalIdBack"]: file,
      }));
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!user) {
      alert("Please log in first");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const promoExpiresAt = promoValidated
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // 1. Create provider profile
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .insert({
          user_id: user.id,
          business_name: formData.businessName,
          description: formData.bio,
          subscription_tier: tier,
          verified: false,
          active: true,
          hourly_rate: 35.0,
          promo_expires_at: promoExpiresAt,
        })
        .select()
        .single();

      if (providerError) throw providerError;

      // 2. Mark promo code as used
      if (promoValidated && promoCode) {
        await supabase
          .from("promo_codes")
          .update({
            used_by_user_id: user.id,
            used_at: new Date().toISOString(),
          })
          .eq("code", promoCode.toUpperCase());
      }

      await updateProfile({
        full_name: formData.fullName,
        phone: formData.phone,
        location: formData.location,
        user_type: "provider",
        onboarding_completed: true, // CRITICAL: This prevents redirect loop
      });

      // 4. Save categories
      if (selectedCategories.length > 0) {
        const categoryRecords = selectedCategories.map((catId) => ({
          provider_id: providerData.id,
          service_category_id: catId,
          status: "active",
        }));

        await supabase.from("provider_categories").insert(categoryRecords);
      }

      // 5. Save specialties
      const specialtyRecords: any[] = [];
      Object.entries(selectedSpecialties).forEach(([catId, specIds]) => {
        specIds.forEach((specId) => {
          specialtyRecords.push({
            provider_id: providerData.id,
            service_category_id: catId,
            specialty_id: specId,
            status: "active",
          });
        });
      });

      if (specialtyRecords.length > 0) {
        await supabase.from("provider_specialties").insert(specialtyRecords);
      }

      // 6. Upload portfolio images
      if (formData.portfolioImages.length > 0) {
        const photoRecords = [];

        for (let i = 0; i < formData.portfolioImages.length; i++) {
          const file = formData.portfolioImages[i];
          const fileExt = file.name.split(".").pop();
          const fileName = `${providerData.id}_${Date.now()}_${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("provider-photos")
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("provider-photos")
              .getPublicUrl(fileName);

            photoRecords.push({
              provider_id: providerData.id,
              photo_url: urlData.publicUrl,
              caption: `Portfolio ${i + 1}`,
              order_index: i,
              display_order: i,
              status: "active",
              is_profile_photo: i === 0,
            });
          }
        }

        if (photoRecords.length > 0) {
          await supabase.from("provider_photos").insert(photoRecords);
        }
      }

      // 7. Mark ID verification as pending (Pro tier)
      if (
        tier === "pro" &&
        (formData.nationalIdFront || formData.nationalIdBack)
      ) {
        await supabase
          .from("providers")
          .update({ id_verification_status: "pending" })
          .eq("id", providerData.id);
      }

      // Success! The updateProfile() call refreshed the auth state
      // so the redirect loop won't happen
      router.push("/provider/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      alert(
        "An error occurred while setting up your profile. Please try again.\n\nError: " +
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = searchQuery
    ? SERVICE_BANK.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SERVICE_BANK;

  const currentCategory = selectedCategories[currentCategoryIndex]
    ? SERVICE_BANK.find(
        (c) => c.id === selectedCategories[currentCategoryIndex]
      )
    : null;

  const currentSpecialtySelection = currentCategory
    ? selectedSpecialties[currentCategory.id] || []
    : [];

  const filteredSpecialties =
    searchQuery && currentCategory
      ? currentCategory.specialties.filter((spec) =>
          spec.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : currentCategory?.specialties || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-semibold text-gray-700">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tier Badge */}
        {tier === "pro" && promoValidated && (
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top duration-500">
            <Gift className="h-6 w-6" />
            <span className="font-bold">
              🎉 Pro Features Activated for 30 Days!
            </span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
          {/* STEP 1: Account Type */}
          {step === 1 && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Welcome to LiberiaFix!
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Let's set up your provider profile
              </p>

              {/* Launch Promo Banner */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Gift className="h-6 w-6 animate-bounce" />
                  <h3 className="text-xl font-bold">
                    Launch Special Promo Codes!
                  </h3>
                </div>
                <p className="text-green-100">
                  Get 1 month of Pro features FREE with your exclusive promo
                  code
                </p>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                <button
                  onClick={() => {
                    setFormData({ ...formData, accountType: "individual" });
                    handleNext();
                  }}
                  className="w-full p-6 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">👤</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Individual Provider
                      </h3>
                      <p className="text-sm text-gray-600">
                        I'm a solo service provider
                      </p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setFormData({ ...formData, accountType: "business" });
                    handleNext();
                  }}
                  className="w-full p-6 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🏢</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        Business
                      </h3>
                      <p className="text-sm text-gray-600">
                        I have a team or company
                      </p>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Business Info */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">
                  {formData.accountType === "business"
                    ? "🏢"
                    : formData.gender === "male"
                    ? "👨‍🔧"
                    : "👩‍🔧"}
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Tell us about{" "}
                  {formData.accountType === "business"
                    ? "your business"
                    : "yourself"}
                </h2>
                <p className="text-gray-600">
                  Basic information to get started
                </p>
              </div>

              <div className="space-y-6 max-w-2xl mx-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Building2 className="h-4 w-4 inline mr-2" />
                    {formData.accountType === "business"
                      ? "Business Name"
                      : "Your Professional Name"}{" "}
                    *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) =>
                      setFormData({ ...formData, businessName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder={
                      formData.accountType === "business"
                        ? "Felix Construction"
                        : "Joseph Kollie"
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name (Contact Person) *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Joseph Kollie"
                  />
                </div>

                {formData.accountType === "individual" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender (for avatar)
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, gender: "male" })
                        }
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                          formData.gender === "male"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        👨 Male
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, gender: "female" })
                        }
                        className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                          formData.gender === "female"
                            ? "border-pink-500 bg-pink-50 text-pink-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        👩 Female
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-2" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="+231 XXX XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Primary Location *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">Select location</option>
                    {LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Brief Description (Optional)
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                    rows={4}
                    maxLength={500}
                    placeholder="Tell customers about your experience and what makes you unique..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Select Categories */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Select Your Main Category
                </h2>
                <p className="text-gray-600 mb-4">
                  Choose the primary service you offer
                </p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">
                    Selected: {selectedCategories.length}/{MAX_CATEGORIES}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                    FREE: 1 category
                  </span>
                </div>
              </div>

              {/* Upgrade Teaser */}
              <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                <div className="flex items-start gap-4">
                  <Lock className="h-6 w-6 text-purple-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2">
                      Need more categories?
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      Pro providers can select up to 5 categories. Have a promo
                      code? You can apply it at the end!
                    </p>
                    <div className="flex items-center gap-2 text-xs text-purple-700">
                      <Check className="h-4 w-4" />
                      <span>Pro: Up to 5 categories</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6 max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search categories..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id);
                  const canSelect = canAddMoreCategories || isSelected;

                  return (
                    <button
                      key={category.id}
                      onClick={() => canSelect && toggleCategory(category.id)}
                      disabled={!canSelect}
                      className={`p-6 rounded-2xl border-2 transition-all relative ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                          : canSelect
                          ? "border-gray-200 hover:border-gray-300 hover:shadow-md"
                          : "border-gray-100 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {category.popular && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          🔥
                        </div>
                      )}
                      <div className="text-4xl mb-3">{category.icon}</div>
                      <div className="font-bold text-gray-900 text-sm mb-1">
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-600 mb-3">
                        {category.specialties.length} specialties
                      </div>
                      {isSelected && (
                        <Check className="h-6 w-6 text-blue-600 mx-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Select Specialties (for selected category) */}
          {step === 4 && currentCategory && (
            <div>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">{currentCategory.icon}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentCategory.name} Specialties
                </h2>
                <p className="text-gray-600 mb-4">
                  {currentCategory.description}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-sm font-semibold text-gray-700">
                    Selected: {currentSpecialtySelection.length}/
                    {MAX_SPECIALTIES_PER_CATEGORY}
                  </span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                    FREE: 3 specialties
                  </span>
                </div>
              </div>

              {/* Upgrade Teaser */}
              {currentSpecialtySelection.length >=
                MAX_SPECIALTIES_PER_CATEGORY && (
                <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                  <div className="flex items-start gap-4">
                    <Lock className="h-6 w-6 text-purple-600 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2">
                        Reached Free Tier Limit
                      </h3>
                      <p className="text-sm text-gray-700 mb-3">
                        Pro providers can select up to 5 specialties per
                        category. Apply a promo code at the end to unlock more!
                      </p>
                      <div className="space-y-2 mb-3">
                        <p className="text-xs font-semibold text-gray-700">
                          High-demand specialties you're missing:
                        </p>
                        {currentCategory.specialties
                          .filter(
                            (s) => !currentSpecialtySelection.includes(s.id)
                          )
                          .filter((s) => s.popular)
                          .slice(0, 3)
                          .map((spec) => (
                            <div
                              key={spec.id}
                              className="flex items-center gap-2 text-xs text-purple-700"
                            >
                              <TrendingUp className="h-3 w-3" />
                              <span>{spec.name}</span>
                              {spec.searchVolume && (
                                <span>({spec.searchVolume} searches/mo)</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Specialties */}
              <div className="mb-6 max-w-md mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search specialties..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Specialty List */}
              <div className="space-y-3 max-w-2xl mx-auto">
                {filteredSpecialties.map((specialty) => {
                  const isSelected = currentSpecialtySelection.includes(
                    specialty.id
                  );
                  const canSelect =
                    currentSpecialtySelection.length <
                    MAX_SPECIALTIES_PER_CATEGORY;

                  return (
                    <button
                      key={specialty.id}
                      onClick={() =>
                        (canSelect || isSelected) &&
                        toggleSpecialty(currentCategory.id, specialty.id)
                      }
                      disabled={!canSelect && !isSelected}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : canSelect
                          ? "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                          : "border-gray-100 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">
                              {specialty.name}
                            </span>
                            {specialty.popular && (
                              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                🔥 Popular
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {specialty.description}
                          </p>
                          {specialty.searchVolume &&
                            specialty.searchVolume > 150 && (
                              <p className="text-xs text-blue-600 mt-1">
                                ~{specialty.searchVolume} searches/month
                              </p>
                            )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Upload Photos */}
          {step === 5 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-600 to-rose-600 mb-4">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Showcase Your Work
                </h2>
                <p className="text-gray-600 mb-4">
                  Add photos of your projects (optional)
                </p>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                  FREE: 1 photo | PRO: 20 photos
                </span>
              </div>

              <div className="max-w-2xl mx-auto">
                {formData.portfolioImages.length < MAX_PHOTOS ? (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      multiple={tier === "pro"}
                      className="hidden"
                    />
                    <div className="border-4 border-dashed border-gray-300 rounded-3xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Upload Your Best Work
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Click to browse or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        PNG, JPG up to 10MB ({formData.portfolioImages.length}/
                        {MAX_PHOTOS} photos)
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-4">
                    {formData.portfolioImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative p-4 rounded-2xl border-2 border-gray-200 bg-white"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                            <Camera className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {img.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {(img.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setFormData({
                                ...formData,
                                portfolioImages:
                                  formData.portfolioImages.filter(
                                    (_, i) => i !== idx
                                  ),
                              })
                            }
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 text-center">
                  <button
                    onClick={handleNext}
                    className="text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Skip for now →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Promo Code */}
          {step === 6 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-4">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Got a Promo Code?
                </h2>
                <p className="text-gray-600">
                  Unlock Pro features for 30 days FREE
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-6">
                {!promoValidated ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter Promo Code
                      </label>
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoError("");
                        }}
                        placeholder="LIBERIAFIX-XXXXX"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none uppercase"
                      />
                      {promoError && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {promoError}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={validatePromoCode}
                      disabled={loading || !promoCode.trim()}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Validating..." : "Apply Promo Code"}
                    </button>

                    <div className="text-center">
                      <button
                        onClick={handleNext}
                        className="text-gray-600 hover:text-gray-900 font-semibold"
                      >
                        Skip (Continue with Free tier) →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 text-center">
                    <Check className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Promo Code Applied! 🎉
                    </h3>
                    <p className="text-gray-700 mb-4">
                      You now have Pro features for 30 days
                    </p>
                    <div className="bg-white rounded-xl p-4 mb-6">
                      <div className="space-y-2 text-sm text-left">
                        <div className="flex items-center gap-2 text-green-700">
                          <Check className="h-4 w-4" />
                          <span>5 Main Categories</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-700">
                          <Check className="h-4 w-4" />
                          <span>25 Specialties Total</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-700">
                          <Check className="h-4 w-4" />
                          <span>20 Portfolio Photos</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-700">
                          <Check className="h-4 w-4" />
                          <span>Pro Badge & Priority Ranking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* What is Pro section */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
                  <h3 className="font-bold text-gray-900 mb-3">Why Pro?</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span>
                        Get more bookings with priority search ranking
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      <span>Stand out with Pro Badge verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span>Showcase more services and photos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: National ID (if Pro tier) */}
          {step === 7 && tier === "pro" && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Verify Your Identity
                </h2>
                <p className="text-gray-600 mb-4">
                  Upload your National ID for Pro verification
                </p>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold inline-block">
                  Required for Pro Badge ✓
                </div>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Why we need this */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">
                        Why We Need This
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600" />
                          <span>Prevents fake accounts and abuse</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600" />
                          <span>Builds trust with customers</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600" />
                          <span>Required for "Verified Pro" badge</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-blue-600" />
                          <span>Your ID is kept secure and private</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Upload sections */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Front */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      National ID - Front *
                    </label>
                    {!formData.nationalIdFront ? (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleNationalIdUpload(e, "front")}
                          className="hidden"
                        />
                        <div className="border-4 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            Upload Front
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </label>
                    ) : (
                      <div className="p-4 rounded-2xl border-2 border-green-200 bg-green-50">
                        <div className="flex items-center gap-3">
                          <Check className="h-6 w-6 text-green-600" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {formData.nationalIdFront.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {(
                                formData.nationalIdFront.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setFormData({
                                ...formData,
                                nationalIdFront: null,
                              })
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Back */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      National ID - Back *
                    </label>
                    {!formData.nationalIdBack ? (
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleNationalIdUpload(e, "back")}
                          className="hidden"
                        />
                        <div className="border-4 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            Upload Back
                          </p>
                          <p className="text-xs text-gray-500">
                            PNG, JPG up to 10MB
                          </p>
                        </div>
                      </label>
                    ) : (
                      <div className="p-4 rounded-2xl border-2 border-green-200 bg-green-50">
                        <div className="flex items-center gap-3">
                          <Check className="h-6 w-6 text-green-600" />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {formData.nationalIdBack.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {(
                                formData.nationalIdBack.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setFormData({ ...formData, nationalIdBack: null })
                            }
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Verification timeline */}
                <div className="bg-yellow-50 rounded-2xl p-6 border-2 border-yellow-200">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900 mb-1">
                        Verification Process
                      </p>
                      <p className="text-sm text-yellow-800">
                        Your ID will be reviewed within 24 hours. You'll receive
                        an email once verified. Your account will be active
                        immediately, but the "Verified Pro" badge appears after
                        approval.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8 (or 7 for Free): Review & Launch */}
          {isFinalStep && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 mb-4">
                  <Check className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  You're All Set! 🎉
                </h1>
                <p className="text-lg text-gray-600">
                  Review your profile before launching
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Profile Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
                  <div className="flex items-start gap-4">
                    <div className="text-6xl">
                      {formData.accountType === "business"
                        ? "🏢"
                        : formData.gender === "male"
                        ? "👨‍🔧"
                        : "👩‍🔧"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {formData.businessName}
                      </h3>
                      <p className="text-gray-600 mb-2">{formData.fullName}</p>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {formData.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {formData.phone}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full border-2 ${
                        tier === "pro"
                          ? "bg-purple-100 border-purple-300 text-purple-700"
                          : "bg-gray-100 border-gray-300 text-gray-700"
                      }`}
                    >
                      <span className="text-sm font-semibold">
                        {tier === "pro" ? "PRO" : "FREE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Your Services
                  </h4>
                  <div className="space-y-3">
                    {selectedCategories.map((catId) => {
                      const category = SERVICE_BANK.find((c) => c.id === catId);
                      const specs = selectedSpecialties[catId] || [];

                      return (
                        <div
                          key={catId}
                          className="p-4 bg-blue-50 rounded-xl border border-blue-100"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{category?.icon}</span>
                            <h5 className="font-bold text-gray-900">
                              {category?.name}
                            </h5>
                          </div>
                          <div className="flex flex-wrap gap-2 ml-12">
                            {specs.map((specId) => {
                              const spec = category?.specialties.find(
                                (s) => s.id === specId
                              );
                              return (
                                <span
                                  key={specId}
                                  className="px-3 py-1 bg-white text-blue-700 rounded-full text-xs font-semibold border border-blue-200"
                                >
                                  {spec?.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  onClick={handleCompleteOnboarding}
                  disabled={loading}
                  className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Setting up your profile...
                    </span>
                  ) : (
                    <>
                      <Check className="h-5 w-5 inline mr-2" />
                      Launch My Profile!
                    </>
                  )}
                </button>

                <div className="flex gap-4 mt-4">
                  <button
                    onClick={handleBack}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Back to Edit
                  </button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                  You can edit your profile anytime from your dashboard
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step > 1 && !isFinalStep && (
            <div className="flex gap-4 mt-8 pt-8 border-t-2 border-gray-200">
              <button
                onClick={handleBack}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={
                  (step === 2 &&
                    (!formData.businessName ||
                      !formData.fullName ||
                      !formData.phone ||
                      !formData.location)) ||
                  (step === 3 && selectedCategories.length === 0) ||
                  (step === 4 && currentSpecialtySelection.length === 0) ||
                  (step === 7 &&
                    tier === "pro" &&
                    (!formData.nationalIdFront || !formData.nationalIdBack))
                }
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProviderOnboarding() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderOnboardingContent />
    </ProtectedRoute>
  );
}
