// Example: app/provider/portfolio/page.tsx - WITH TIER ENFORCEMENT
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useTierLimits } from "@/lib/hooks/use-tier-limits";
import { UpgradePrompt } from "@/components/providers/upgrade-prompt";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Upload,
  Trash2,
  Lock,
  Crown,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";

function ProviderPortfolioContent() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // Use tier limits hook
  const {
    tierStatus,
    loading: tierLoading,
    checkCanAdd,
    refresh,
  } = useTierLimits(user?.id);

  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    setLoading(true);

    const { data: providerData } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (!providerData) {
      setLoading(false);
      return;
    }

    const { data: portfolioData } = await supabase
      .from("provider_photos")
      .select("*")
      .eq("provider_id", providerData.id)
      .eq("status", "active")
      .order("display_order", { ascending: true });

    if (portfolioData) {
      setPortfolioItems(portfolioData);
    }

    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // CHECK TIER LIMIT BEFORE UPLOADING
    const canAddCheck = checkCanAdd("photo");

    if (!canAddCheck.allowed) {
      setUpgradeReason(canAddCheck.reason || "Upgrade to add more photos");
      setShowUpgradePrompt(true);
      return;
    }

    // Proceed with upload
    setUploading(true);

    try {
      const { data: providerData } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!providerData) {
        alert("Provider profile not found");
        return;
      }

      for (const file of files) {
        // Upload to storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${providerData.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("provider-photos")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("provider-photos")
          .getPublicUrl(fileName);

        // Save to database
        await supabase.from("provider_photos").insert({
          provider_id: providerData.id,
          photo_url: urlData.publicUrl,
          status: "active",
          display_order: portfolioItems.length,
        });
      }

      // Refresh portfolio and tier status
      await fetchPortfolio();
      refresh(); // Refresh tier limits

      alert("Photos uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this photo?")) return;

    const { error } = await supabase
      .from("provider_photos")
      .update({ status: "deleted" })
      .eq("id", id);

    if (!error) {
      await fetchPortfolio();
      refresh(); // Refresh tier limits
    }
  };

  if (loading || tierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const tierInfo = tierStatus?.limits;
  const usage = tierStatus?.usage;
  const canAdd = tierStatus?.canAdd.photo;
  const isPro =
    tierStatus?.effectiveTier === "pro" ||
    tierStatus?.effectiveTier === "elite";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Tier Badge */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                Portfolio
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-full">
                    <Crown className="h-4 w-4" />
                    {tierStatus?.effectiveTier.toUpperCase()}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                {usage?.photos || 0} / {tierInfo?.maxPhotos} photos used
              </p>
            </div>

            {/* Upload Button */}
            <div>
              {canAdd ? (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    multiple={isPro}
                    onChange={handleUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2">
                    {uploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5" />
                        Upload Photo
                      </>
                    )}
                  </div>
                </label>
              ) : (
                <button
                  onClick={() => {
                    const check = checkCanAdd("photo");
                    setUpgradeReason(
                      check.reason || "Upgrade to add more photos"
                    );
                    setShowUpgradePrompt(true);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed flex items-center gap-2"
                >
                  <Lock className="h-5 w-5" />
                  Limit Reached
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <div className="mb-6">
            <UpgradePrompt
              reason={upgradeReason}
              onUpgrade={() => router.push("/provider/subscription")}
            />
          </div>
        )}

        {/* Tier Info for Free Users */}
        {!isPro && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
            <div className="flex items-start gap-4">
              <Lock className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-2">
                  Want to showcase more work?
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Free accounts can only upload {tierInfo?.maxPhotos} photo.
                  Upgrade to Pro to unlock up to 20 portfolio photos!
                </p>
                <button
                  onClick={() => router.push("/provider/subscription")}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 text-sm"
                >
                  <Crown className="h-4 w-4" />
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {portfolioItems.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No photos yet
              </h3>
              <p className="text-gray-600">
                Upload your first portfolio photo to showcase your work
              </p>
            </div>
          ) : (
            portfolioItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
              >
                <img
                  src={item.photo_url}
                  alt={item.caption || "Portfolio"}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProviderPortfolio() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderPortfolioContent />
    </ProtectedRoute>
  );
}
