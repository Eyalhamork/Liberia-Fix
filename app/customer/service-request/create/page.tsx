// app/customer/service-request/create/page.tsx - UPDATED FOR NEW SCHEMA
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import {
  FileText,
  DollarSign,
  Users,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  Upload,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Zap,
  Image as ImageIcon,
} from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

function CreateServiceRequestContent() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form state
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    []
  );
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [noBudget, setNoBudget] = useState(false);
  const [urgency, setUrgency] = useState<"asap" | "this-week" | "flexible">(
    "flexible"
  );
  const [preferredTime, setPreferredTime] = useState("");
  const [location, setLocation] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  // Fetch service categories from Supabase
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error: fetchError } = await (supabase as any)
      .from("service_categories")
        .select("id, name, icon, description")
        .eq("active", true)
        .order("name");

      if (fetchError) throw fetchError;
      setServiceCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to load service categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  // Validation
  const isStep1Valid =
    categoryId && title.length >= 10 && description.length >= 30;
  const isStep2Valid = (budgetMin && budgetMax) || noBudget;
  const isStep3Valid = urgency && location;

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      alert("Maximum 3 photos allowed");
      return;
    }

    const newPhotos = [...photos, ...files].slice(0, 3);
    setPhotos(newPhotos);

    // Create preview URLs
    const newUrls = newPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls(newUrls);
  };

  // Remove photo
  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newUrls = photoPreviewUrls.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviewUrls(newUrls);
  };

  // Handle form submission
  const handleSubmit = async () => {
    console.log("🔷 [SUBMIT] Starting service request submission");

    if (!user) {
      console.error("❌ [SUBMIT] No user found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("📦 [SUBMIT] Form data:", {
        categoryId,
        title,
        description: description.substring(0, 50),
        budgetMin,
        budgetMax,
        noBudget,
        urgency,
        location,
        photoCount: photos.length,
      });

      // Upload photos to storage first (if any)
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        console.log(`📸 [SUBMIT] Uploading ${photos.length} photos...`);

        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const fileExt = photo.name.split(".").pop();
          const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;
          const filePath = `service-requests/${fileName}`;

          console.log(
            `📤 [SUBMIT] Uploading photo ${i + 1}/${photos.length}: ${fileName}`
          );

          const { error: uploadError, data: uploadData } =
            await supabase.storage
              .from("service-request-photos")
              .upload(filePath, photo);

          if (uploadError) {
            console.error(
              `❌ [SUBMIT] Photo upload ${i + 1} failed:`,
              uploadError
            );
            // Continue even if photo upload fails
          } else {
            const { data: urlData } = supabase.storage
              .from("service-request-photos")
              .getPublicUrl(filePath);
            photoUrls.push(urlData.publicUrl);
            console.log(`✅ [SUBMIT] Photo ${i + 1} uploaded successfully`);
          }
        }
      }

      console.log("💾 [SUBMIT] Creating service request in database...");

      // Create service request
      const insertData = {
        customer_id: user.id,
        service_category_id: categoryId,
        title,
        description,
        budget_min: noBudget ? null : parseFloat(budgetMin),
        budget_max: noBudget ? null : parseFloat(budgetMax),
        urgency,
        preferred_time: preferredTime || null,
        location,
        photo_urls: photoUrls,
        status: "pending_payment",
        payment_status: "pending",
      };

      console.log("📝 [SUBMIT] Insert data:", insertData);

      const { data, error: insertError } = await (supabase as any)
      .from("service_requests")
        .insert(insertData as any)
        .select()
        .single() as { data: { id: string } | null; error: any };

      if (insertError) {
        console.error("❌ [SUBMIT] Database insert failed:", insertError);
        throw insertError;
      }

      if (!data) {
        console.error("❌ [SUBMIT] No data returned after insert");
        throw new Error("Service request created but no data returned");
      }

      console.log("✅ [SUBMIT] Service request created:", data.id);
      console.log("🚀 [SUBMIT] Redirecting to payment page...");

      // Redirect to payment page
      router.push(`/customer/service-request/${data.id}/payment`);
    } catch (err: any) {
      console.error("❌ [SUBMIT] Error creating request:", err);
      console.error("❌ [SUBMIT] Error details:", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
      });

      setError(
        err.message || "Failed to create service request. Please try again."
      );
      setLoading(false); // CRITICAL: Reset loading state on error
    }
  };

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-orange-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Post Your Service Request
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Describe what you need and get quotes from Pro providers. Pay $7
            once, unlock all responses.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep >= step
                      ? "bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-110"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                      currentStep > step
                        ? "bg-gradient-to-r from-orange-600 to-red-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span
              className={`font-medium ${
                currentStep >= 1 ? "text-orange-600" : "text-gray-400"
              }`}
            >
              Details
            </span>
            <span
              className={`font-medium ${
                currentStep >= 2 ? "text-orange-600" : "text-gray-400"
              }`}
            >
              Budget
            </span>
            <span
              className={`font-medium ${
                currentStep >= 3 ? "text-orange-600" : "text-gray-400"
              }`}
            >
              Timeline
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 mb-1">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form Steps */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          {/* Step 1: Service Details */}
          {currentStep === 1 && (
            <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  What service do you need?
                </h2>
                <p className="text-gray-600 text-sm">
                  Be specific to get the best matches
                </p>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Service Category *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        categoryId === cat.id
                          ? "border-orange-500 bg-orange-50 shadow-lg scale-105"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-3xl mb-2">{cat.icon}</div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {cat.name}
                      </div>
                      {categoryId === cat.id && (
                        <Check className="h-5 w-5 text-orange-600 mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Request Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Emergency Plumbing - Kitchen Sink Leak"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/100 characters (min 10)
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you need in detail. Include specifics like location in your home, when the problem started, any relevant details that will help providers give accurate quotes."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all resize-none"
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/1000 characters (min 30)
                </p>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Photos (Optional)
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Add up to 3 photos to help providers understand your needs
                  better
                </p>

                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length < 3 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 transition-colors cursor-pointer bg-gray-50 hover:bg-orange-50">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload ({photos.length}/3)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Budget */}
          {currentStep === 2 && (
            <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  What's your budget?
                </h2>
                <p className="text-gray-600 text-sm">
                  Help providers know what you're comfortable spending
                </p>
              </div>

              {/* Budget Range */}
              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={noBudget}
                    onChange={(e) => setNoBudget(e.target.checked)}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    I'm open to quotes (no specific budget)
                  </span>
                </label>

                {!noBudget && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Minimum Budget (USD) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                          placeholder="50"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Maximum Budget (USD) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value)}
                          placeholder="100"
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Budget Tips */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">
                      Budget Tips
                    </p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Realistic budgets get more responses</li>
                      <li>• Providers can suggest alternatives if needed</li>
                      <li>• You can negotiate final price directly</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Timeline & Location */}
          {currentStep === 3 && (
            <div className="p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  When and where?
                </h2>
                <p className="text-gray-600 text-sm">
                  Let providers know your timeline and location
                </p>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  How urgent is this? *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setUrgency("asap")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      urgency === "asap"
                        ? "border-red-500 bg-red-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Zap
                      className={`h-6 w-6 mx-auto mb-2 ${
                        urgency === "asap" ? "text-red-600" : "text-gray-400"
                      }`}
                    />
                    <div className="font-semibold text-sm">ASAP</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Today/Tomorrow
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("this-week")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      urgency === "this-week"
                        ? "border-orange-500 bg-orange-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Calendar
                      className={`h-6 w-6 mx-auto mb-2 ${
                        urgency === "this-week"
                          ? "text-orange-600"
                          : "text-gray-400"
                      }`}
                    />
                    <div className="font-semibold text-sm">This Week</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Next 7 days
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("flexible")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      urgency === "flexible"
                        ? "border-green-500 bg-green-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Clock
                      className={`h-6 w-6 mx-auto mb-2 ${
                        urgency === "flexible"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    />
                    <div className="font-semibold text-sm">Flexible</div>
                    <div className="text-xs text-gray-600 mt-1">Anytime</div>
                  </button>
                </div>
              </div>

              {/* Preferred Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preferred Time (Optional)
                </label>
                <input
                  type="text"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g., Weekday mornings, After 5pm, Weekends"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Sinkor, Congo Town, Paynesville"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Request Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold text-gray-900">
                      {serviceCategories.find((c) => c.id === categoryId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-semibold text-gray-900">
                      {noBudget
                        ? "Open to quotes"
                        : `$${budgetMin} - $${budgetMax}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Urgency:</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {urgency.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-semibold text-gray-900">
                      {location}
                    </span>
                  </div>
                  <div className="pt-3 mt-3 border-t-2 border-orange-200 flex justify-between items-center">
                    <span className="text-gray-600">Posting Fee:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      $7.00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="px-6 md:px-8 pb-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">
                      Submission Failed
                    </p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="px-6 md:px-8 pb-6 md:pb-8 flex justify-between gap-4">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="h-5 w-5" />
                Back
              </button>
            )}

            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                }
                className="ml-auto px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Continue
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStep3Valid || loading}
                className="ml-auto px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Post Request & Pay $7
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Post Once</h3>
            <p className="text-sm text-gray-600">
              Pay $7 one-time fee and get quotes from multiple Pro providers
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Compare Quotes</h3>
            <p className="text-sm text-gray-600">
              Review profiles, ratings, and quotes to find your best match
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border-2 border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Hire Direct</h3>
            <p className="text-sm text-gray-600">
              Contact providers directly. No platform fees on the service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateServiceRequestPage() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["customer"]}>
      <CreateServiceRequestContent />
    </ProtectedRoute>
  );
}
