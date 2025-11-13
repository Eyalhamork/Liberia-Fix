// lib/hooks/use-swipe-gestures.ts
"use client";

import { useEffect, useRef, useState } from "react";

type SwipeDirection = "left" | "right" | "up" | "down";

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

interface UseSwipeGesturesOptions {
  minDistance?: number; // Minimum distance for swipe
  maxDuration?: number; // Maximum duration for swipe (ms)
  preventScroll?: boolean;
}

export function useSwipeGestures(
  callbacks: SwipeCallbacks,
  options: UseSwipeGesturesOptions = {}
) {
  const {
    minDistance = 50,
    maxDuration = 500,
    preventScroll = false,
  } = options;

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      setIsSwiping(true);
      callbacks.onSwipeStart?.();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;

      const deltaX = e.touches[0].clientX - touchStartX.current;
      const deltaY = e.touches[0].clientY - touchStartY.current;

      // Calculate swipe progress (0-100)
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const progress = Math.min((distance / minDistance) * 100, 100);
      setSwipeProgress(progress);

      if (preventScroll && Math.abs(deltaX) > Math.abs(deltaY)) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const duration = Date.now() - touchStartTime.current;

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      setIsSwiping(false);
      setSwipeProgress(0);
      callbacks.onSwipeEnd?.();

      // Check if swipe meets criteria
      if (duration > maxDuration) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine primary direction
      if (absX > absY) {
        // Horizontal swipe
        if (absX >= minDistance) {
          // Haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(10);
          }

          if (deltaX > 0) {
            callbacks.onSwipeRight?.();
          } else {
            callbacks.onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (absY >= minDistance) {
          // Haptic feedback
          if ("vibrate" in navigator) {
            navigator.vibrate(10);
          }

          if (deltaY > 0) {
            callbacks.onSwipeDown?.();
          } else {
            callbacks.onSwipeUp?.();
          }
        }
      }
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, {
      passive: !preventScroll,
    });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [callbacks, minDistance, maxDuration, preventScroll, isSwiping]);

  return {
    elementRef,
    isSwiping,
    swipeProgress,
  };
}

// Swipeable card component example
export function useSwipeableCard(onDelete: () => void, onArchive?: () => void) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    setTranslateX(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Delete threshold (swipe left)
    if (translateX < -120) {
      if ("vibrate" in navigator) {
        navigator.vibrate([30, 10, 30]);
      }
      onDelete();
    }
    // Archive threshold (swipe right)
    else if (translateX > 120 && onArchive) {
      if ("vibrate" in navigator) {
        navigator.vibrate([30, 10, 30]);
      }
      onArchive();
    }

    // Reset position
    setTranslateX(0);
  };

  return {
    translateX,
    isDragging,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
