// components/providers/subscription-plans.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  X,
  Camera,
  MapPin,
  Award,
  Users,
  Clock,
  Facebook,
  Zap,
  Shield,
} from "lucide-react";

interface SubscriptionPlansProps {
  currentTier?: "free" | "pro";
  onSelectPlan: (tier: "free" | "pro") => void;
}

export function SubscriptionPlans({
  currentTier = "free",
  onSelectPlan,
}: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">(currentTier);

  const plans = [
    {
      id: "free" as const,
      name: "Free",
      price: 0,
      description: "Perfect for getting started",
      features: [
        { name: "1 service category", included: true, icon: Award },
        { name: "1 photo (profile only)", included: true, icon: Camera },
        { name: "Basic profile listing", included: true, icon: Users },
        { name: "Customer reviews", included: true, icon: Award },
        { name: "Text location only", included: true, icon: MapPin },
        { name: "Standard search placement", included: true, icon: null },
        { name: "Multiple service categories", included: false, icon: X },
        { name: "Portfolio gallery", included: false, icon: X },
        { name: "PRO VERIFIED badge", included: false, icon: X },
        { name: "Service area mapping", included: false, icon: X },
        { name: "Featured placement", included: false, icon: X },
        { name: "Facebook advertising", included: false, icon: X },
        { name: "Priority response guarantee", included: false, icon: X },
        { name: "Multiple locations", included: false, icon: X },
      ],
      limitations: [
        "Bottom of search results",
        "Limited visibility",
        "No premium features",
      ],
    },
    {
      id: "pro" as const,
      name: "Pro",
      price: 15,
      description: "Everything you need to grow your business",
      popular: true,
      features: [
        { name: "6-8 service categories", included: true, icon: Award },
        { name: "8-10 photos portfolio", included: true, icon: Camera },
        { name: "PRO VERIFIED badge", included: true, icon: Shield },
        { name: "Business hours display", included: true, icon: Clock },
        { name: "Service area mapping", included: true, icon: MapPin },
        { name: "Featured search placement", included: true, icon: Zap },
        { name: "Weekly Facebook ads", included: true, icon: Facebook },
        { name: "Multiple locations", included: true, icon: MapPin },
        { name: "2-hour response guarantee", included: true, icon: Clock },
        { name: "Priority customer support", included: true, icon: Users },
        { name: "Advanced analytics", included: true, icon: null },
        { name: "Customer booking management", included: true, icon: null },
      ],
      benefits: [
        "Top of search results",
        "3x more visibility",
        "Professional credibility",
        "Automatic promotion",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Plan
        </h2>
        <p className="text-gray-600">
          Simplified pricing with just two options - pick what works for you
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative cursor-pointer transition-all ${
              selectedPlan === plan.id
                ? "ring-2 ring-blue-500 shadow-lg"
                : "hover:shadow-md"
            } ${plan.popular ? "border-blue-500" : ""}`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
            )}

            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <div className="space-y-2">
                <div className="text-4xl font-bold">
                  ${plan.price}
                  <span className="text-lg text-gray-500 font-normal">
                    {plan.price > 0 ? "/month" : ""}
                  </span>
                </div>
                <p className="text-gray-600">{plan.description}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Key Features */}
              <div>
                <h4 className="font-semibold mb-3">Features included:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        {feature.included ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        {Icon && <Icon className="h-3 w-3 text-gray-400" />}
                        <span
                          className={feature.included ? "" : "text-gray-400"}
                        >
                          {feature.name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Benefits/Limitations */}
              {plan.benefits && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <h5 className="font-semibold text-green-800 mb-2">
                    Pro Benefits:
                  </h5>
                  <ul className="space-y-1">
                    {plan.benefits.map((benefit, index) => (
                      <li
                        key={index}
                        className="text-sm text-green-700 flex items-center gap-1"
                      >
                        <span className="text-green-500">✓</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.limitations && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <h5 className="font-semibold text-gray-600 mb-2">
                    Limitations:
                  </h5>
                  <ul className="space-y-1">
                    {plan.limitations.map((limitation, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 flex items-center gap-1"
                      >
                        <span className="text-gray-400">•</span>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Current Plan Indicator */}
              {currentTier === plan.id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <span className="text-blue-800 font-semibold">
                    Your Current Plan
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Button */}
      <div className="text-center">
        {selectedPlan !== currentTier && (
          <Button
            onClick={() => onSelectPlan(selectedPlan)}
            size="lg"
            className={
              selectedPlan === "pro" ? "bg-blue-600 hover:bg-blue-700" : ""
            }
          >
            {selectedPlan === "pro" ? (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Upgrade to Pro - $15/month
              </>
            ) : (
              "Switch to Free Plan"
            )}
          </Button>
        )}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold">Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Feature</th>
                <th className="text-center p-4">Free</th>
                <th className="text-center p-4 bg-blue-50">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">Service Categories</td>
                <td className="text-center p-4">1</td>
                <td className="text-center p-4 bg-blue-50 font-semibold">
                  6-8
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Photo Portfolio</td>
                <td className="text-center p-4">1 photo</td>
                <td className="text-center p-4 bg-blue-50 font-semibold">
                  8-10 photos
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Search Placement</td>
                <td className="text-center p-4">Bottom</td>
                <td className="text-center p-4 bg-blue-50 font-semibold">
                  Featured Top
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Service Area</td>
                <td className="text-center p-4">Text only</td>
                <td className="text-center p-4 bg-blue-50 font-semibold">
                  Interactive Map
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">Marketing</td>
                <td className="text-center p-4">None</td>
                <td className="text-center p-4 bg-blue-50 font-semibold">
                  Weekly Facebook Ads
                </td>
              </tr>
              <tr>
                <td className="p-4">Response Guarantee</td>
                <td className="text-center p-4">None</td>
                <td className="text-center p-4 bg-blue-50 font-semibold">
                  2 Hours
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Special Launch Offer */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-6 rounded-lg text-center">
        <h3 className="font-bold text-xl mb-2">
          🎉 Launch Special Still Active!
        </h3>
        <p className="text-green-100 mb-3">
          Current providers get Pro features free for 3 months
        </p>
        <p className="text-sm text-green-200">
          Lock in early bird pricing when we start charging!
        </p>
      </div>
    </div>
  );
}
