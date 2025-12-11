"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Upload,
  Trash2,
  X,
  Lock,
  Crown,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Eye,
  ZoomIn,
} from "lucide-react";

interface PortfolioItem {
  id: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

function ProviderPortfolioContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentTier, setCurrentTier] = useState<"free" | "pro" | "elite">(
    "free"
  );
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(
    null
  );
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Tier limits
  const tierLimits = {
    free: 1,
    pro: 20,
    elite: 999,
  };

  const maxPhotos = tierLimits[currentTier];
  const canAddMore = portfolioItems.length < maxPhotos;
  const isPro = currentTier === "pro" || currentTier === "elite";

  useEffect(() => {
    if (user) {
      fetchProviderData();
      fetchPortfolio();
    }
  }, [user]);

  const fetchProviderData = async () => {
    const { data } = await (supabase as any)
      .from("providers")
      .select("subscription_tier")
      .eq("user_id", user?.id as string)
      .single() as { data: { subscription_tier: "free" | "pro" | "elite" } | null };

    if (data) {
      setCurrentTier(data.subscription_tier || "free");
    }
  };

  const fetchPortfolio = async () => {
    setLoading(true);

    const { data: providerData } = await (supabase as any)
      .from("providers")
      .select("id")
      .eq("user_id", user?.id as string)
      .single() as { data: { id: string } | null };

    if (!providerData) {
      setLoading(false);
      return;
    }

    const { data: portfolioData } = await (supabase as any)
      .from("portfolio")
      .select("*")
      .eq("provider_id", providerData.id)
      .order("created_at", { ascending: false });

    if (portfolioData) {
      setPortfolioItems(portfolioData);
    }

    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!canAddMore) {
      alert(
        `You've reached your limit of ${maxPhotos} photo(s). Upgrade to Pro for more!`
      );
      return;
    }

    const file = files[0];

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setUploading(true);

    try {
      // Get provider ID
      const { data: providerData } = await (supabase as any)
      .from("providers")
        .select("id")
        .eq("user_id", user?.id as string)
        .single() as { data: { id: string } | null };

      if (!providerData) {
        alert("Provider not found");
        setUploading(false);
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${providerData.id}-${Date.now()}.${fileExt}`;
      const filePath = `portfolio/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("provider-photos")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("provider-photos")
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await (supabase as any).from("portfolio").insert({
        provider_id: providerData.id,
        image_url: urlData.publicUrl,
        caption: "",
      } as any);

      if (dbError) {
        throw dbError;
      }

      setShowUploadModal(false);
      fetchPortfolio();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image. Please try again.");
    }

    setUploading(false);
  };

  const handleDelete = async (item: PortfolioItem) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      // Extract file path from URL
      const urlParts = item.image_url.split("/");
      const filePath = `portfolio/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage.from("provider-photos").remove([filePath]);

      // Delete from database
      const { error } = await (supabase as any)
      .from("portfolio")
        .delete()
        .eq("id", item.id);

      if (error) {
        throw error;
      }

      fetchPortfolio();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting image. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ImageIcon className="h-8 w-8 text-blue-600" />
                My Portfolio
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-full">
                    <Crown className="h-4 w-4" />
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                Showcase your best work to attract more customers
              </p>
            </div>
            <label
              htmlFor="upload-input"
              className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer ${
                canAddMore
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {canAddMore ? (
                <>
                  <Upload className="h-5 w-5" />
                  Upload Photo
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Upgrade to Add More
                </>
              )}
              <input
                id="upload-input"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={!canAddMore || uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Tier Status Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Photo Limit
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portfolioItems.length} / {maxPhotos}
                  </p>
                </div>
              </div>
              {!isPro && (
                <button
                  onClick={() => router.push("/provider/subscription")}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(portfolioItems.length / maxPhotos) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Pro Benefits Banner */}
          {!isPro && (
            <div className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    Unlock Your Full Potential with Pro
                  </h3>
                  <p className="text-blue-100 mb-4">
                    Upload up to 20 professional photos and showcase your best
                    work to stand out from the competition.
                  </p>
                  <button
                    onClick={() => router.push("/provider/subscription")}
                    className="px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-blue-50 transition-all"
                  >
                    Upgrade Now - $20/month
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading portfolio...</p>
          </div>
        ) : uploading ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-900 font-semibold mt-4">
              Uploading your photo...
            </p>
            <p className="text-gray-600 text-sm">This may take a moment</p>
          </div>
        ) : portfolioItems.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
            <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Photos Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first photo to start building your portfolio
            </p>
            <label
              htmlFor="upload-input-empty"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg cursor-pointer"
            >
              <Upload className="h-5 w-5" />
              Upload Your First Photo
              <input
                id="upload-input-empty"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="group relative bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={item.image_url}
                    alt="Portfolio"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedImage(item)}
                      className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                    >
                      <ZoomIn className="h-5 w-5 text-gray-900" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 bg-red-500/90 backdrop-blur-sm rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Upload Date Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12 bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Portfolio Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">
                  Use High-Quality Photos
                </p>
                <p className="text-sm text-gray-600">
                  Clear, well-lit images showcase your work best
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">
                  Show Before & After
                </p>
                <p className="text-sm text-gray-600">
                  Demonstrate the transformation you provide
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Vary Your Shots</p>
                <p className="text-sm text-gray-600">
                  Include different angles and project types
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Keep It Current</p>
                <p className="text-sm text-gray-600">
                  Update regularly with your latest projects
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="max-w-4xl w-full">
            <img
              src={selectedImage.image_url}
              alt="Portfolio preview"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
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
