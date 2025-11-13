// components/layout/pull-to-refresh.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);

  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const MAX_PULL = 120;
  const TRIGGER_THRESHOLD = 80;

  useEffect(() => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh if at the top of the page
      const scrollTop = container.scrollTop;
      if (scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        setCanPull(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!canPull || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0) {
        // Prevent default scroll when pulling down
        e.preventDefault();

        // Apply rubber band effect
        const rubberBandDistance = Math.min(
          distance * 0.5, // 50% resistance
          MAX_PULL
        );

        setPullDistance(rubberBandDistance);

        // Haptic feedback at threshold
        if (rubberBandDistance >= TRIGGER_THRESHOLD && "vibrate" in navigator) {
          navigator.vibrate(10);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!canPull) return;

      if (pullDistance >= TRIGGER_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);

        // Haptic feedback for refresh
        if ("vibrate" in navigator) {
          navigator.vibrate([30, 10, 30]);
        }

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
      setCanPull(false);
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [canPull, pullDistance, isRefreshing, onRefresh, disabled]);

  const rotation = (pullDistance / MAX_PULL) * 360;
  const scale = Math.min(pullDistance / TRIGGER_THRESHOLD, 1);
  const opacity = Math.min(pullDistance / 40, 1);

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 flex justify-center"
            style={{
              transform: `translateY(${Math.min(pullDistance - 40, 60)}px)`,
            }}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700"
              style={{
                opacity,
                transform: `scale(${scale})`,
              }}
            >
              <RefreshCw
                className={`h-6 w-6 text-blue-600 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                style={{
                  transform: isRefreshing ? "none" : `rotate(${rotation}deg)`,
                  transition: isRefreshing ? "none" : "transform 0.1s ease-out",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${
            pullDistance > 0 ? pullDistance * 0.3 : 0
          }px)`,
          transition: pullDistance === 0 ? "transform 0.3s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
