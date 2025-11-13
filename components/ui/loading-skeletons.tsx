// components/ui/loading-skeletons.tsx
"use client";

import { motion } from "framer-motion";

// Base skeleton component (already exists in ui/skeleton.tsx, this extends it)

// Provider Card Skeleton
export function ProviderCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md animate-pulse">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Name */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          </div>

          {/* Categories */}
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
          </div>
        </div>

        {/* Badge */}
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
      </div>

      {/* Description */}
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg w-28" />
      </div>
    </div>
  );
}

// Search Results Skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <ProviderCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md animate-pulse"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

// Booking Card Skeleton
export function BookingCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Thread Skeleton
export function MessageThreadSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Received message */}
      <div className="flex gap-3">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 animate-pulse" />
        <div className="space-y-2 max-w-[70%]">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-3 space-y-2 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
          </div>
        </div>
      </div>

      {/* Sent message */}
      <div className="flex gap-3 justify-end">
        <div className="space-y-2 max-w-[70%]">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto animate-pulse" />
          <div className="bg-blue-100 dark:bg-blue-900 rounded-2xl p-3 space-y-2 animate-pulse">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 animate-pulse" />
      </div>
    </div>
  );
}

// Profile Header Skeleton
export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 bg-white/20 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-white/20 rounded w-1/2" />
          <div className="h-4 bg-white/20 rounded w-1/3" />
          <div className="flex gap-2">
            <div className="h-6 bg-white/20 rounded-full w-20" />
            <div className="h-6 bg-white/20 rounded-full w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Shimmer effect overlay
export function ShimmerOverlay() {
  return (
    <motion.div
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{
        repeat: Infinity,
        duration: 1.5,
        ease: "easeInOut",
      }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      style={{ pointerEvents: "none" }}
    />
  );
}

// Staggered skeleton list
export function StaggeredSkeletonList({
  count = 5,
  SkeletonComponent,
}: {
  count?: number;
  SkeletonComponent: React.ComponentType;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonComponent />
        </motion.div>
      ))}
    </div>
  );
}
