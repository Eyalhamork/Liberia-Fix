// components/providers/provider-card.tsx
import { Star, MapPin, Clock, Shield, Award, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    services: string[];
    rating: number;
    reviews: number;
    location: string;
    rate: string;
    tier: "free" | "pro" | "elite";
    image?: string;
    responseTime: string;
    description?: string;
    verified?: boolean;
    hasServiceArea?: boolean; // For Pro providers with map coverage
    priorityResponse?: boolean; // 2-hour guarantee for Pro
    multipleLocations?: string[]; // Additional service areas for Pro
  };
  showFullDetails?: boolean;
}

export function ProviderCard({
  provider,
  showFullDetails = false,
}: ProviderCardProps) {
  const getTierBadge = () => {
    switch (provider.tier) {
      case "pro":
        return (
          <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full inline-flex items-center gap-1">
            <Shield className="h-3 w-3" />
            PRO VERIFIED
          </div>
        );
      default:
        return null;
    }
  };

  const getBookingFee = () => {
    // Launch pricing logic - could come from context or config
    return "$1"; // Will be $2 after launch period
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {getTierBadge() && <div className="mb-2">{getTierBadge()}</div>}

        <div className="flex gap-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
            {provider.image || "👤"}
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-lg">{provider.name}</h3>

            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-sm">{provider.rating}</span>
              <span className="text-gray-600 text-sm">
                ({provider.reviews} reviews)
              </span>
              {provider.verified && (
                <Shield className="h-4 w-4 text-blue-500" />
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{provider.location}</span>
                {provider.hasServiceArea && provider.tier === "pro" && (
                  <span className="text-blue-600 text-xs">(Service Area)</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {provider.priorityResponse
                    ? "2hr guarantee"
                    : `Responds in ${provider.responseTime}`}
                </span>
              </div>
            </div>

            {/* Multiple locations for Pro providers */}
            {provider.multipleLocations &&
              provider.multipleLocations.length > 0 && (
                <div className="mb-2">
                  <details className="text-xs text-gray-600">
                    <summary className="cursor-pointer hover:text-blue-600">
                      +{provider.multipleLocations.length} more locations
                    </summary>
                    <div className="mt-1 pl-2">
                      {provider.multipleLocations.map((location, index) => (
                        <div key={index} className="text-xs text-gray-500">
                          • {location}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

            <div className="flex flex-wrap gap-1 mb-2">
              {provider.services.map((service) => (
                <span
                  key={service}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                >
                  {service}
                </span>
              ))}
            </div>

            {showFullDetails && provider.description && (
              <p className="text-sm text-gray-700 mb-3">
                {provider.description}
              </p>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="font-bold text-blue-600">{provider.rate}</span>
              <Link href={`/providers/${provider.id}`}>
                <Button size="sm">Book - {getBookingFee()}</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Pro tier special features indicator */}
        {provider.tier === "pro" && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs text-blue-600">
              {provider.priorityResponse && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Priority Response
                </span>
              )}
              {provider.hasServiceArea && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Service Area Map
                </span>
              )}
              <span className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                Featured Placement
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
