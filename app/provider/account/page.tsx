"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { NotificationPermissionPrompt } from "@/components/notifications/notification-permission-prompt";
import {
  User,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Phone,
  Mail,
  Save,
  Eye,
  Crown,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Power,
} from "lucide-react";

function ProviderProfileSettingsContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentTier, setCurrentTier] = useState<"free" | "pro" | "elite">(
    "free"
  );

  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    location: "",
    phone: "",
    hourly_rate: "",
    available: true,
  });

  const [businessHours, setBusinessHours] = useState({
    monday: { open: "09:00", close: "17:00", closed: false },
    tuesday: { open: "09:00", close: "17:00", closed: false },
    wednesday: { open: "09:00", close: "17:00", closed: false },
    thursday: { open: "09:00", close: "17:00", closed: false },
    friday: { open: "09:00", close: "17:00", closed: false },
    saturday: { open: "09:00", close: "17:00", closed: false },
    sunday: { open: "09:00", close: "17:00", closed: true },
  });

  const isPro = currentTier === "pro" || currentTier === "elite";

  useEffect(() => {
    if (user) {
      fetchProviderData();
    }
  }, [user]);

  const fetchProviderData = async () => {
    setLoading(true);

    // Fetch provider info
    const { data: providerData } = await (supabase as any)
      .from("providers")
      .select("*")
      .eq("user_id", user?.id as string)
      .single() as { data: {
          business_name: string | null;
          description: string | null;
          hourly_rate: number | null;
          available: boolean | null;
          subscription_tier: "free" | "pro" | "elite";
          business_hours: any;
        } | null; error: any };

    if (providerData) {
      setFormData({
        business_name: providerData.business_name || "",
        description: providerData.description || "",
        location: profile?.location || "",
        phone: profile?.phone || "",
        hourly_rate: providerData.hourly_rate?.toString() || "",
        available: providerData.available ?? true,
      });
      setCurrentTier(providerData.subscription_tier || "free");

      // Parse business hours if they exist
      if (providerData.business_hours) {
        setBusinessHours(providerData.business_hours);
      }
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      // Update profile (location, phone)
      const { error: profileError } = await (supabase
        .from("profiles") as any)
        .update({
          location: formData.location,
          phone: formData.phone,
        } as any)
        .eq("id", user?.id as string);

      if (profileError) throw profileError;

      // Update provider info
      const { error: providerError } = await (supabase
        .from("providers") as any)
        .update({
          business_name: formData.business_name,
          description: formData.description,
          hourly_rate: parseFloat(formData.hourly_rate) || 0,
          available: formData.available,
          business_hours: businessHours,
        } as any)
        .eq("user_id", user?.id as string);

      if (providerError) throw providerError;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving profile. Please try again.");
    }

    setSaving(false);
  };

  const toggleDay = (day: string) => {
    setBusinessHours({
      ...businessHours,
      [day]: {
        ...businessHours[day as keyof typeof businessHours],
        closed: !businessHours[day as keyof typeof businessHours].closed,
      },
    });
  };

  const updateDayTime = (
    day: string,
    field: "open" | "close",
    value: string
  ) => {
    setBusinessHours({
      ...businessHours,
      [day]: {
        ...businessHours[day as keyof typeof businessHours],
        [field]: value,
      },
    });
  };

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
      <Header />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <User className="h-8 w-8 text-blue-600" />
                Profile Settings
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-full">
                    <Crown className="h-4 w-4" />
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your business information and availability
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/search/providers/${user?.id as string}`)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Message */}
          {saveSuccess && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 font-semibold">
                Profile updated successfully!
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Basic Information
            </h2>

            <div className="space-y-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) =>
                    setFormData({ ...formData, business_name: e.target.value })
                  }
                  placeholder="e.g., John's Plumbing Services"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Tell customers about your business, experience, and what makes you stand out..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  {formData.description.length} / 500 characters
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Service Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                >
                  <option value="">Select location</option>
                  <option value="Monrovia">Monrovia</option>
                  <option value="Paynesville">Paynesville</option>
                  <option value="Buchanan">Buchanan</option>
                  <option value="Gbarnga">Gbarnga</option>
                  <option value="Kakata">Kakata</option>
                  <option value="Voinjama">Voinjama</option>
                  <option value="Harper">Harper</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact & Pricing */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Phone className="h-6 w-6 text-green-600" />
              Contact & Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone */}
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
                  placeholder="+231 XXX XXX XXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  required
                />
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Hourly Rate (USD)
                </label>
                <input
                  type="number"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: e.target.value })
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Leave blank if you don't charge hourly
                </p>
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500 mt-2">
                Email cannot be changed here. Contact support if needed.
              </p>
            </div>
          </div>

          {/* Business Hours */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-600" />
              Business Hours
            </h2>

            <div className="space-y-4">
              {days.map((day) => (
                <div
                  key={day}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 w-32">
                    <input
                      type="checkbox"
                      checked={
                        !businessHours[day as keyof typeof businessHours].closed
                      }
                      onChange={() => toggleDay(day)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="font-semibold text-gray-900 capitalize">
                      {day}
                    </span>
                  </div>

                  {businessHours[day as keyof typeof businessHours].closed ? (
                    <span className="text-gray-500 font-medium">Closed</span>
                  ) : (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="time"
                        value={
                          businessHours[day as keyof typeof businessHours].open
                        }
                        onChange={(e) =>
                          updateDayTime(day, "open", e.target.value)
                        }
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={
                          businessHours[day as keyof typeof businessHours].close
                        }
                        onChange={(e) =>
                          updateDayTime(day, "close", e.target.value)
                        }
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Availability Status */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Power className="h-6 w-6 text-purple-600" />
              Availability Status
            </h2>

            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              <div>
                <p className="font-semibold text-gray-900 text-lg mb-1">
                  Currently {formData.available ? "Available" : "Unavailable"}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.available
                    ? "Your profile is visible and accepting new customers"
                    : "Your profile is hidden from search results"}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, available: !formData.available })
                }
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                  formData.available ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    formData.available ? "translate-x-9" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <NotificationPermissionPrompt />

          {/* Save Button (Mobile) */}
          <div className="md:hidden">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProviderProfileSettings() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderProfileSettingsContent />
    </ProtectedRoute>
  );
}
