"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Lock,
  Sparkles,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Crown,
  Package,
  TrendingUp,
} from "lucide-react";

interface Service {
  id: string;
  service_category_id: string;
  category_name?: string;
  category_icon?: string;
  price: number;
  duration: number;
  description: string;
  active: boolean;
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}

function ProviderServicesContent() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTier, setCurrentTier] = useState<"free" | "pro" | "elite">(
    "free"
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    category_id: "",
    price: "",
    duration: "60",
    description: "",
    active: true,
  });

  // Tier limits
  const tierLimits = {
    free: 1,
    pro: 20,
    elite: 999,
  };

  const maxServices = tierLimits[currentTier];
  const canAddMore = services.length < maxServices;
  const isPro = currentTier === "pro" || currentTier === "elite";

  useEffect(() => {
    if (user) {
      fetchProviderData();
      fetchServices();
      fetchCategories();
    }
  }, [user]);

  const fetchProviderData = async () => {
    const { data } = await supabase
      .from("providers")
      .select("subscription_tier")
      .eq("user_id", user?.id)
      .single();

    if (data) {
      setCurrentTier(data.subscription_tier || "free");
    }
  };

  const fetchServices = async () => {
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

    const { data: servicesData } = await supabase
      .from("provider_services")
      .select(
        `
        id,
        service_category_id,
        price,
        duration,
        description,
        active,
        service_categories (
          name,
          icon
        )
      `
      )
      .eq("provider_id", providerData.id);

    if (servicesData) {
      const formattedServices = servicesData.map((s: any) => ({
        id: s.id,
        service_category_id: s.service_category_id,
        category_name: s.service_categories?.name,
        category_icon: s.service_categories?.icon,
        price: s.price || 0,
        duration: s.duration || 60,
        description: s.description || "",
        active: s.active ?? true,
      }));
      setServices(formattedServices);
    }

    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("service_categories")
      .select("id, name, icon")
      .eq("active", true)
      .order("name");

    if (data) {
      setCategories(data);
    }
  };

  const handleAddService = async () => {
    if (!formData.category_id || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }

    if (!canAddMore) {
      alert(
        `You've reached your limit of ${maxServices} service(s). Upgrade to Pro for more!`
      );
      return;
    }

    setSaving(true);

    const { data: providerData } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user?.id)
      .single();

    if (!providerData) {
      alert("Provider not found");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("provider_services").insert({
      provider_id: providerData.id,
      service_category_id: formData.category_id,
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      description: formData.description,
      active: formData.active,
    });

    if (error) {
      alert("Error adding service");
      console.error(error);
    } else {
      setShowAddModal(false);
      setFormData({
        category_id: "",
        price: "",
        duration: "60",
        description: "",
        active: true,
      });
      fetchServices();
    }

    setSaving(false);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    setSaving(true);

    const { error } = await supabase
      .from("provider_services")
      .update({
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        description: formData.description,
        active: formData.active,
      })
      .eq("id", editingService.id);

    if (error) {
      alert("Error updating service");
      console.error(error);
    } else {
      setEditingService(null);
      setFormData({
        category_id: "",
        price: "",
        duration: "60",
        description: "",
        active: true,
      });
      fetchServices();
    }

    setSaving(false);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    const { error } = await supabase
      .from("provider_services")
      .delete()
      .eq("id", serviceId);

    if (error) {
      alert("Error deleting service");
      console.error(error);
    } else {
      fetchServices();
    }
  };

  const startEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      category_id: service.service_category_id,
      price: service.price.toString(),
      duration: service.duration.toString(),
      description: service.description,
      active: service.active,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100/70 to-purple-100/30 pb-20">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                My Services
                {isPro && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold rounded-full">
                    <Crown className="h-4 w-4" />
                    PRO
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your service offerings and pricing
              </p>
            </div>
            <button
              onClick={() => {
                if (canAddMore) {
                  setShowAddModal(true);
                } else {
                  router.push("/provider/subscription");
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {canAddMore ? (
                <>
                  <Plus className="h-5 w-5" />
                  Add Service
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Upgrade to Add More
                </>
              )}
            </button>
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
                    Service Limit
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {services.length} / {maxServices}
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
                style={{ width: `${(services.length / maxServices) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading services...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Services Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first service to start attracting customers
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Your First Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">
                      {service.category_icon || "📦"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {service.category_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {service.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                            <AlertCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(service)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {service.description || "No description provided"}
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-700">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">${service.price}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">
                      {service.duration} min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Service Modal */}
      {(showAddModal || editingService) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl">
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingService(null);
                setFormData({
                  category_id: "",
                  price: "",
                  duration: "60",
                  description: "",
                  active: true,
                });
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {editingService ? "Edit Service" : "Add New Service"}
              </h2>
              <p className="text-gray-600">
                {editingService
                  ? "Update your service details"
                  : "Fill in the details for your new service"}
              </p>
            </div>

            <div className="space-y-6">
              {/* Category Selection */}
              {!editingService && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="60"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    min="15"
                    step="15"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what's included in this service..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900">Active Service</p>
                  <p className="text-sm text-gray-600">
                    Make this service visible to customers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, active: !formData.active })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.active ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingService(null);
                  setFormData({
                    category_id: "",
                    price: "",
                    duration: "60",
                    description: "",
                    active: true,
                  });
                }}
                disabled={saving}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={
                  editingService ? handleUpdateService : handleAddService
                }
                disabled={saving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {editingService ? "Update Service" : "Add Service"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProviderServices() {
  return (
    <ProtectedRoute requireAuth allowedUserTypes={["provider"]}>
      <ProviderServicesContent />
    </ProtectedRoute>
  );
}
