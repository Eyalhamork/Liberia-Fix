"use client";

import React, { useState } from "react";
import { Wallet, Plus } from "lucide-react";
import { useAuth } from "@/lib/providers/auth-provider";
import { TopUpModal } from "./top-up-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// OPTIMIZED: Memoized component to prevent unnecessary re-renders
const WalletBadge = React.memo(() => {
  const { user } = useAuth();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const queryClient = useQueryClient();

  // OPTIMIZED: React Query with 30s staleTime and cache
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["wallet-balance", user?.id],
    queryFn: async () => {
      const response = await fetch("/api/wallet/balance");
      if (!response.ok) throw new Error("Failed to fetch balance");
      const data = await response.json();
      return data.balance || 0;
    },
    enabled: !!user,
    staleTime: 30000, // 30 seconds - don't refetch if data is fresh
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    refetchOnWindowFocus: false, // Don't refetch on every window focus
    refetchOnMount: false, // Don't refetch on every mount if data is fresh
  });

  const balance = data ?? 0;
  // Show loading skeleton only on first load, not on background refetches
  const showLoadingSkeleton = isLoading && balance === 0;

  const handleTopUpSuccess = () => {
    // Invalidate and refetch the balance after top-up
    queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    setShowTopUpModal(false);
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setShowTopUpModal(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group relative"
      >
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          {balance === 0 && !showLoadingSkeleton && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="text-left">
          <div className="text-xs text-gray-500">Credits</div>
          <div className="font-bold text-gray-900">
            {showLoadingSkeleton ? (
              <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                {balance.toFixed(1)}
                {isFetching && !isLoading && (
                  <span className="ml-1 text-xs text-gray-400">•</span>
                )}
              </>
            )}
          </div>
        </div>
        <Plus className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
      </button>

      <TopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={handleTopUpSuccess}
      />
    </>
  );
});

WalletBadge.displayName = "WalletBadge";

export { WalletBadge };
