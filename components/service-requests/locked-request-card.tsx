// components/service-requests/locked-request-card.tsx
"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Zap,
  Users,
  Star,
  TrendingUp,
  MapPin,
  DollarSign,
  Clock,
} from "lucide-react";

interface LockedRequestCardProps {
  request: {
    id: number;
    title: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    location: string;
    distance: number;
    urgency: string;
    bidsCount: number;
  };
  remainingFreeBids: number;
}

export function LockedRequestCard({
  request,
  remainingFreeBids,
}: LockedRequestCardProps) {
  const router = useRouter();

  return (
    <div className="relative bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm overflow-hidden">
      {/* Blur Overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {remainingFreeBids > 0 ? "Use Your Free Bid?" : "Upgrade to Bid"}
          </h3>
          <p className="text-gray-600 mb-4">
            {remainingFreeBids > 0
              ? `You have ${remainingFreeBids} free bid remaining this month`
              : "You've used your free bid this month"}
          </p>

          <div className="bg-blue-50 rounded-xl p-4 mb-4 border-2 border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              ✨ Pro Benefits
            </p>
            <ul className="text-xs text-blue-700 space-y-1 text-left">
              <li>✓ Unlimited service request bidding</li>
              <li>✓ Instant push notifications</li>
              <li>✓ Priority in search results</li>
              <li>✓ Analytics dashboard</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            {remainingFreeBids > 0 ? (
              <>
                <button
                  onClick={() =>
                    router.push(`/service-requests/${request.id}/bid`)
                  }
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
                >
                  Use Free Bid
                </button>
                <button
                  onClick={() => router.push("/provider/upgrade")}
                  className="w-full px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all"
                >
                  Upgrade to Pro - $20/month
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/provider/upgrade")}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                Upgrade Now - $20/month
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            🎁 First month free until first job won!
          </p>
        </div>
      </div>

      {/* Blurred Content Behind */}
      <div className="filter blur-sm pointer-events-none">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {request.category}
          </Badge>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {request.title}
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-gray-500 text-xs">Budget</p>
              <p className="font-semibold text-gray-900">
                ${request.budgetMin} - ${request.budgetMax}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-gray-500 text-xs">Location</p>
              <p className="font-semibold text-gray-900">{request.location}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
