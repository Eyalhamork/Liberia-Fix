// components/providers/provider-list.tsx
import { ProviderCard } from "./provider-card";

interface Provider {
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
}

interface ProviderListProps {
  providers: Provider[];
  showFullDetails?: boolean;
}

export function ProviderList({
  providers,
  showFullDetails = false,
}: ProviderListProps) {
  // Sort providers by tier (elite > pro > free) and rating
  const sortedProviders = [...providers].sort((a, b) => {
    const tierOrder = { elite: 3, pro: 2, free: 1 };
    if (tierOrder[a.tier] !== tierOrder[b.tier]) {
      return tierOrder[b.tier] - tierOrder[a.tier];
    }
    return b.rating - a.rating;
  });

  return (
    <div className="space-y-4">
      {sortedProviders.map((provider) => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          showFullDetails={showFullDetails}
        />
      ))}
    </div>
  );
}
