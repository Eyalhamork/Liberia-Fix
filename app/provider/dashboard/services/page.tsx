// app/provider/dashboard/services/page.tsx - SAME DESIGN AS ONBOARDING
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { SERVICE_BANK } from "@/lib/data/service-bank";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Briefcase,
  Plus,
  Trash2,
  Check,
  X,
  Lock,
  Star,
  AlertCircle,
  Search,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Loader2,
  Crown,
  Zap,
  Gift,
} from "lucide-react";

function ProviderServicesManagerContent() {
  const { user } = useAuth();
  const supabase = createClient();

  const [tierStatus, setTierStatus] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSpecialty, setShowAddSpecialty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTierStatus(),
      fetchCategories(),
      fetchSpecialties(),
    ]);
    setLoading(false);
  };

  const fetchTierStatus = async () => {
    const { data: provider } = await supabase
      .from("providers")
      .select("id, user_id, subscription_tier, promo_expires_at")
      .eq("user_id", user?.id)
      .single();

    if (provider) {
      const promoActive =
        provider.promo_expires_at &&
        new Date(provider.promo_expires_at) > new Date();

      const { count: catCount } = await supabase
        .from("provider_categories")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      const { count: specCount } = await supabase
        .from("provider_specialties")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", provider.id)
        .eq("status", "active");

      setTierStatus({
        subscription_tier: provider.subscription_tier,
        promo_expires_at: provider.promo_expires_at,
        effective_tier: promoActive ? "pro" : provider.subscription_tier,
        promo_active: !!promoActive,
        active_categories: catCount || 0,
        active_specialties: specCount || 0,
      });
    }
  };

  const fetchCategories = async () => {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (provider) {
      const { data } = await supabase
        .from("provider_categories")
        .select("*")
        .eq("provider_id", provider.id)
        .order("created_at");

      setCategories(data || []);
    }
  };

  const fetchSpecialties = async () => {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (provider) {
      const { data } = await supabase
        .from("provider_specialties")
        .select("*")
        .eq("provider_id", provider.id)
        .order("created_at");

      setSpecialties(data || []);
    }
  };

  const addCategory = async (categoryId: string) => {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (!provider) return;

    const { error } = await supabase.from("provider_categories").insert({
      provider_id: provider.id,
      service_category_id: categoryId,
      status: "active",
    });

    if (error) {
      alert(error.message);
    } else {
      fetchData();
      setShowAddCategory(false);
    }
  };

  const removeCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Remove this category? Associated specialties will also be removed."
      )
    )
      return;

    const { error } = await supabase
      .from("provider_categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      alert(error.message);
    } else {
      fetchData();
    }
  };

  const addSpecialty = async (categoryId: string, specialtyId: string) => {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (!provider) return;

    const { error } = await supabase.from("provider_specialties").insert({
      provider_id: provider.id,
      service_category_id: categoryId,
      specialty_id: specialtyId,
      status: "active",
    });

    if (error) {
      alert(error.message);
    } else {
      fetchData();
    }
  };

  const removeSpecialty = async (specialtyId: string) => {
    if (!confirm("Remove this specialty?")) return;

    const { error } = await supabase
      .from("provider_specialties")
      .delete()
      .eq("id", specialtyId);

    if (error) {
      alert(error.message);
    } else {
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Loading your services...</p>
        </div>
      </div>
    );
  }

  const MAX_CATEGORIES = tierStatus?.effective_tier === "pro" ? 5 : 1;
  const MAX_SPECIALTIES_PER_CATEGORY =
    tierStatus?.effective_tier === "pro" ? 5 : 3;
  const canAddCategory = (tierStatus?.active_categories || 0) < MAX_CATEGORIES;

  // Calculate days until promo expires
  const daysUntilExpiry = tierStatus?.promo_expires_at
    ? Math.ceil(
        (new Date(tierStatus.promo_expires_at).getTime() -
          new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  // Filter categories by search
  const filteredCategories = searchQuery
    ? SERVICE_BANK.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SERVICE_BANK;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pb-20">
      {/* Custom Scrollbar (same as onboarding) */}
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(243, 244, 246, 0.5);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            rgb(37, 99, 235),
            rgb(147, 51, 234)
          );
          border-radius: 10px;
          border: 2px solid rgba(243, 244, 246, 0.5);
        }
      `}</style>

      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Briefcase className="h-10 w-10 text-blue-600" />
            Manage Your Services
          </h1>
          <p className="text-gray-600 text-lg">
            Add or remove categories and specialties
          </p>
        </div>

        {/* Promo Banner (if active) */}
        {tierStatus?.promo_active && daysUntilExpiry > 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 animate-in fade-in slide-in-from-top duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-6 w-6 animate-bounce" />
                <div>
                  <h3 className="font-bold text-xl">🎉 Pro Features Active!</h3>
                  <p className="text-blue-100">
                    {daysUntilExpiry} days remaining on your promo
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{daysUntilExpiry}</div>
                <div className="text-sm text-blue-100">days left</div>
              </div>
            </div>
          </div>
        )}

        {/* Tier Status Card */}
        <div className="mb-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {tierStatus?.effective_tier === "pro" ? (
                <>
                  <Crown className="h-7 w-7 text-purple-600" />
                  <span>PRO Tier</span>
                </>
              ) : (
                <>
                  <Shield className="h-7 w-7 text-gray-600" />
                  <span>Free Tier</span>
                </>
              )}
            </h2>
            {tierStatus?.effective_tier === "free" && (
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl">
                <Sparkles className="inline h-5 w-5 mr-2" />
                Upgrade to Pro
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-100">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {tierStatus?.active_categories}/{MAX_CATEGORIES}
              </div>
              <div className="text-sm font-semibold text-blue-700">
                Categories
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {tierStatus?.active_specialties}
              </div>
              <div className="text-sm font-semibold text-purple-700">
                Specialties
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {tierStatus?.effective_tier === "pro" ? "25" : "3"}
              </div>
              <div className="text-sm font-semibold text-green-700">
                Max Specialties
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Your Categories
            </h2>
            {canAddCategory && (
              <button
                onClick={() => setShowAddCategory(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Category
              </button>
            )}
          </div>

          {categories.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-12 text-center border border-gray-100">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Categories Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add your first service category to get started
              </p>
              <button
                onClick={() => setShowAddCategory(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg inline-flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Your First Category
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat, idx) => {
                const categoryData = SERVICE_BANK.find(
                  (c) => c.id === cat.service_category_id
                );
                if (!categoryData) return null;

                const categorySpecialties = specialties.filter(
                  (s) => s.service_category_id === cat.service_category_id
                );
                const activeSpecialties = categorySpecialties.filter(
                  (s) => s.status === "active"
                );
                const canAddSpecialty =
                  activeSpecialties.length < MAX_SPECIALTIES_PER_CATEGORY;

                return (
                  <div
                    key={cat.id}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom duration-500"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {/* Category Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="text-6xl">{categoryData.icon}</div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {categoryData.name}
                          </h3>
                          <p className="text-gray-600">
                            {categoryData.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-semibold text-gray-700">
                              {activeSpecialties.length}/
                              {MAX_SPECIALTIES_PER_CATEGORY} specialties
                            </span>
                            {cat.status === "paused" && (
                              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                                PAUSED
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeCategory(cat.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="h-5 w-5" />
                        Remove
                      </button>
                    </div>

                    {/* Specialties */}
                    {categorySpecialties.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-bold text-gray-900 mb-3">
                          Specialties:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categorySpecialties.map((spec) => {
                            const specialtyData = categoryData.specialties.find(
                              (s) => s.id === spec.specialty_id
                            );
                            if (!specialtyData) return null;

                            return (
                              <div
                                key={spec.id}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                  spec.status === "active"
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-gray-50 border-gray-200 opacity-60"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-gray-900">
                                        {specialtyData.name}
                                      </span>
                                      {specialtyData.popular && (
                                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                          🔥
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {specialtyData.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => removeSpecialty(spec.id)}
                                    className="text-red-600 hover:text-red-700 ml-2"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Add Specialty Button */}
                    {canAddSpecialty ? (
                      <button
                        onClick={() =>
                          setShowAddSpecialty(cat.service_category_id)
                        }
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-xl font-semibold hover:from-blue-100 hover:to-purple-100 transition-all border-2 border-blue-200 flex items-center justify-center gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Add Specialty ({activeSpecialties.length}/
                        {MAX_SPECIALTIES_PER_CATEGORY})
                      </button>
                    ) : (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Lock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-yellow-900 mb-1">
                              Specialty Limit Reached
                            </p>
                            <p className="text-sm text-yellow-800">
                              {tierStatus?.effective_tier === "free"
                                ? "Free tier: 3 specialties per category. Upgrade to Pro for 5!"
                                : "Pro tier: 5 specialties per category maximum."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Upgrade Prompt (if at limit) */}
          {!canAddCategory && tierStatus?.effective_tier === "free" && (
            <div className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-8">
              <div className="flex items-start gap-4">
                <Lock className="h-8 w-8 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    Need More Categories?
                  </h3>
                  <p className="text-blue-100 mb-4">
                    Upgrade to Pro to add up to 5 categories, 25 specialties,
                    and more!
                  </p>
                  <button className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Upgrade to Pro - $20/month
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Add Category</h2>
              <button
                onClick={() => setShowAddCategory(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filteredCategories.map((category) => {
                const isSelected = categories.some(
                  (c) => c.service_category_id === category.id
                );

                return (
                  <button
                    key={category.id}
                    onClick={() => !isSelected && addCategory(category.id)}
                    disabled={isSelected}
                    className={`p-6 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-gray-200 opacity-50 cursor-not-allowed"
                        : "border-gray-200 hover:border-blue-500 hover:shadow-lg"
                    }`}
                  >
                    {category.popular && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        🔥
                      </div>
                    )}
                    <div className="text-4xl mb-3">{category.icon}</div>
                    <div className="font-bold text-gray-900 text-sm">
                      {category.name}
                    </div>
                    {isSelected && (
                      <div className="mt-2">
                        <Check className="h-6 w-6 text-green-600 mx-auto" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Specialty Modal */}
      {showAddSpecialty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Add Specialty
              </h2>
              <button
                onClick={() => setShowAddSpecialty(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
            </div>

            {/* Specialty List */}
            <div className="space-y-3">
              {SERVICE_BANK.find(
                (c) => c.id === showAddSpecialty
              )?.specialties.map((specialty) => {
                const isSelected = specialties.some(
                  (s) =>
                    s.specialty_id === specialty.id &&
                    s.service_category_id === showAddSpecialty
                );

                return (
                  <button
                    key={specialty.id}
                    onClick={() =>
                      !isSelected &&
                      addSpecialty(showAddSpecialty, specialty.id)
                    }
                    disabled={isSelected}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-gray-200 opacity-50 cursor-not-allowed"
                        : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "border-green-500 bg-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {specialty.name}
                          </span>
                          {specialty.popular && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                              🔥 Popular
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {specialty.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProviderServicesManager() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderServicesManagerContent />
    </ProtectedRoute>
  );
}
