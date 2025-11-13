// components/onboarding/customer-onboarding-flow.tsx - Enhanced with provider suggestions
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Home,
  Wrench,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Clock,
  ArrowLeft,
  Sparkles,
  Heart,
  DollarSign,
  Award,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface OnboardingData {
  location: string;
  serviceInterests: string[];
  homeType: string;
  urgencyLevel: string;
  budget: string;
}

interface Provider {
  id: string;
  business_name: string;
  description: string;
  hourly_rate: number;
  location: string;
  rating: number;
  review_count: number;
  response_time: string;
  subscription_tier: string;
  services: string[];
}

const serviceCategories = [
  { id: "plumbing", name: "Plumbing", icon: "🔧", popular: true },
  { id: "cleaning", name: "Cleaning", icon: "🧽", popular: true },
  { id: "electrical", name: "Electrical", icon: "⚡", popular: false },
  { id: "handyman", name: "Handyman", icon: "🔨", popular: true },
  { id: "gardening", name: "Gardening", icon: "🌿", popular: false },
  { id: "driving", name: "Driving", icon: "🚗", popular: true },
  { id: "painting", name: "Painting", icon: "🎨", popular: false },
  { id: "it_support", name: "IT Support", icon: "💻", popular: false },
];

const locations = [
  "Congo Town",
  "Sinkor",
  "Old Road",
  "Paynesville",
  "Red Light",
  "Waterside",
  "Monrovia Central",
];

const homeTypes = [
  {
    id: "apartment",
    name: "Apartment",
    icon: "🏢",
    desc: "Multi-unit building",
  },
  { id: "house", name: "House", icon: "🏠", desc: "Single family home" },
  { id: "compound", name: "Compound", icon: "🏘️", desc: "Multiple buildings" },
  { id: "office", name: "Office", icon: "🏢", desc: "Commercial space" },
];

const urgencyLevels = [
  {
    id: "emergency",
    name: "Emergency",
    icon: "🚨",
    desc: "Need help immediately",
    color: "red",
  },
  {
    id: "urgent",
    name: "Urgent",
    icon: "⏰",
    desc: "Within 24 hours",
    color: "orange",
  },
  {
    id: "soon",
    name: "Soon",
    icon: "📅",
    desc: "Within a week",
    color: "blue",
  },
  {
    id: "planning",
    name: "Planning",
    icon: "💭",
    desc: "Just exploring options",
    color: "green",
  },
];

const budgetRanges = [
  { id: "budget", label: "$10-50", icon: "💵", desc: "Basic services" },
  { id: "standard", label: "$50-150", icon: "💳", desc: "Most services" },
  { id: "premium", label: "$150-500", icon: "💎", desc: "Premium quality" },
  { id: "luxury", label: "$500+", icon: "👑", desc: "Luxury services" },
];

export function CustomerOnboardingFlow() {
  const [step, setStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    location: "",
    serviceInterests: [],
    homeType: "",
    urgencyLevel: "",
    budget: "",
  });
  const [suggestedProviders, setSuggestedProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const updateData = (field: keyof OnboardingData, value: any) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId: string) => {
    const current = onboardingData.serviceInterests;
    const updated = current.includes(serviceId)
      ? current.filter((id) => id !== serviceId)
      : [...current, serviceId];
    updateData("serviceInterests", updated);
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // Fetch suggested providers based on preferences
  const fetchSuggestedProviders = async () => {
    if (
      !onboardingData.location ||
      onboardingData.serviceInterests.length === 0
    )
      return;

    setLoading(true);
    try {
      // This would be a real API call in production
      // For now, we'll create mock data based on preferences
      const mockProviders: Provider[] = [
        {
          id: "1",
          business_name: "QuickFix Plumbing",
          description: "Professional plumbing services",
          hourly_rate: 45,
          location: onboardingData.location,
          rating: 4.8,
          review_count: 156,
          response_time: "1-2 hours",
          subscription_tier: "elite",
          services: ["plumbing", "handyman"],
        },
        {
          id: "2",
          business_name: "CleanPro Services",
          description: "Reliable cleaning services",
          hourly_rate: 25,
          location: onboardingData.location,
          rating: 4.5,
          review_count: 89,
          response_time: "2-4 hours",
          subscription_tier: "pro",
          services: ["cleaning"],
        },
        {
          id: "3",
          business_name: "ElectroFix Ltd",
          description: "Licensed electrical work",
          hourly_rate: 65,
          location: onboardingData.location,
          rating: 4.9,
          review_count: 234,
          response_time: "30 minutes",
          subscription_tier: "elite",
          services: ["electrical", "handyman"],
        },
      ];

      // Filter based on selected services
      const filtered = mockProviders.filter((provider) =>
        provider.services.some((service) =>
          onboardingData.serviceInterests.includes(service)
        )
      );

      setSuggestedProviders(filtered);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 5) {
      fetchSuggestedProviders();
    }
  }, [step, onboardingData.location, onboardingData.serviceInterests]);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save preferences to localStorage and database
      const preferences = {
        ...onboardingData,
        completedAt: new Date().toISOString(),
        suggestedProviders: suggestedProviders.map((p) => p.id),
      };

      localStorage.setItem("customer_preferences", JSON.stringify(preferences));
      localStorage.setItem("onboarding_completed", "true");

      // In production, save to database
      // await supabase.from('customer_preferences').insert([preferences]);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to LiberiaFix!
          </CardTitle>
          <p className="text-gray-600 text-lg">
            Let's personalize your experience
          </p>

          {/* Progress Bar */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      step >= num
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step > num ? "✓" : num}
                  </div>
                  {num < 5 && (
                    <div
                      className={`w-12 h-1 rounded-full transition-all duration-300 ${
                        step > num
                          ? "bg-gradient-to-r from-blue-600 to-purple-600"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-8 animate-slide-in">
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <MapPin className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Where are you located?
                </h3>
                <p className="text-gray-600 text-lg">
                  We'll show you the best providers in your area
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {locations.map((location) => (
                  <button
                    key={location}
                    onClick={() => updateData("location", location)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      onboardingData.location === location
                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-lg"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }`}
                  >
                    <span className="font-semibold">{location}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={nextStep}
                  disabled={!onboardingData.location}
                  className="flex-1 h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Continue <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={skipOnboarding}
                  className="px-6"
                >
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Service Interests */}
          {step === 2 && (
            <div className="space-y-8 animate-slide-in">
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <Wrench className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  What services interest you?
                </h3>
                <p className="text-gray-600 text-lg">
                  Select all that apply - we'll show you relevant providers
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {serviceCategories.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 text-left hover:scale-105 relative ${
                      onboardingData.serviceInterests.includes(service.id)
                        ? "border-green-500 bg-gradient-to-r from-green-50 to-blue-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{service.icon}</span>
                      <div>
                        <span className="font-semibold block">
                          {service.name}
                        </span>
                        {service.popular && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </div>
                    {onboardingData.serviceInterests.includes(service.id) && (
                      <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={onboardingData.serviceInterests.length === 0}
                  className="flex-1 h-12 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Continue <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Home Type */}
          {step === 3 && (
            <div className="space-y-8 animate-slide-in">
              <div className="text-center">
                <div className="bg-purple-100 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <Home className="h-12 w-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  What type of property?
                </h3>
                <p className="text-gray-600 text-lg">
                  This helps us match you with the right providers
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {homeTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => updateData("homeType", type.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      onboardingData.homeType === type.id
                        ? "border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{type.icon}</span>
                      <div className="text-left">
                        <span className="font-semibold text-lg block">
                          {type.name}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {type.desc}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!onboardingData.homeType}
                  className="flex-1 h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Continue <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Urgency & Budget */}
          {step === 4 && (
            <div className="space-y-8 animate-slide-in">
              <div className="text-center">
                <div className="bg-orange-100 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <Clock className="h-12 w-12 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  When do you need help?
                </h3>
                <p className="text-gray-600 text-lg">
                  And what's your typical budget range?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Urgency */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">Urgency Level</h4>
                  <div className="space-y-3">
                    {urgencyLevels.map((urgency) => (
                      <button
                        key={urgency.id}
                        onClick={() => updateData("urgencyLevel", urgency.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                          onboardingData.urgencyLevel === urgency.id
                            ? "border-orange-500 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{urgency.icon}</span>
                          <div className="text-left">
                            <span className="font-semibold block">
                              {urgency.name}
                            </span>
                            <span className="text-gray-600 text-sm">
                              {urgency.desc}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <h4 className="font-semibold text-lg mb-4">Budget Range</h4>
                  <div className="space-y-3">
                    {budgetRanges.map((budget) => (
                      <button
                        key={budget.id}
                        onClick={() => updateData("budget", budget.id)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                          onboardingData.budget === budget.id
                            ? "border-green-500 bg-gradient-to-r from-green-50 to-blue-50 shadow-lg"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl">{budget.icon}</span>
                          <div className="text-left">
                            <span className="font-semibold block">
                              {budget.label}
                            </span>
                            <span className="text-gray-600 text-sm">
                              {budget.desc}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={
                    !onboardingData.urgencyLevel || !onboardingData.budget
                  }
                  className="flex-1 h-12 text-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  See Recommendations <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Provider Suggestions */}
          {step === 5 && (
            <div className="space-y-8 animate-slide-in">
              <div className="text-center">
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-2xl w-fit mx-auto mb-6">
                  <Award className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  Perfect Matches for You!
                </h3>
                <p className="text-gray-600 text-lg">
                  Based on your preferences, here are some top providers
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {suggestedProviders.map((provider) => (
                    <Card
                      key={provider.id}
                      className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                            <Wrench className="h-8 w-8 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-lg">
                                {provider.business_name}
                              </h4>
                              <Badge
                                variant={
                                  provider.subscription_tier === "elite"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {provider.subscription_tier}
                              </Badge>
                            </div>

                            <p className="text-gray-600 text-sm mb-3">
                              {provider.description}
                            </p>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">
                                  {provider.rating}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({provider.review_count} reviews)
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {provider.location}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Responds in {provider.response_time}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  ${provider.hourly_rate}/hour
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                              <Button size="sm" className="flex-1">
                                Contact Now
                              </Button>
                              <Button size="sm" variant="outline">
                                <Heart className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 h-12 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Setting up...
                    </div>
                  ) : (
                    <>
                      Complete Setup <CheckCircle className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

// Hook to check if onboarding is needed
export function useOnboardingStatus() {
  const [needsOnboarding, setNeedsOnboarding] = useState(true);
  const [preferences, setPreferences] = useState<OnboardingData | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed");
    const savedPreferences = localStorage.getItem("customer_preferences");

    if (completed && savedPreferences) {
      setNeedsOnboarding(false);
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  return { needsOnboarding, preferences };
}
