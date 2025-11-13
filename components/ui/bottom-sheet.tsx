// components/ui/bottom-sheet.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // Heights in % of viewport (e.g., [30, 60, 90])
  initialSnap?: number; // Index of initial snap point
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [90],
  initialSnap = 0,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const currentHeight = snapPoints[currentSnap];

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when sheet is open
      document.body.style.overflow = "hidden";

      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);

    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Fast swipe down closes
    if (velocity > 500) {
      onClose();
      if ("vibrate" in navigator) {
        navigator.vibrate(20);
      }
      return;
    }

    // Find nearest snap point
    if (snapPoints.length > 1) {
      const windowHeight = window.innerHeight;
      const currentHeight = windowHeight * (snapPoints[currentSnap] / 100);
      const newHeight = currentHeight - offset;
      const newHeightPercent = (newHeight / windowHeight) * 100;

      let nearestSnap = 0;
      let minDiff = Infinity;

      snapPoints.forEach((snap, index) => {
        const diff = Math.abs(snap - newHeightPercent);
        if (diff < minDiff) {
          minDiff = diff;
          nearestSnap = index;
        }
      });

      if (nearestSnap !== currentSnap) {
        setCurrentSnap(nearestSnap);
        if ("vibrate" in navigator) {
          navigator.vibrate(10);
        }
      }
    }

    // Close if dragged down significantly
    if (offset > 150) {
      onClose();
      if ("vibrate" in navigator) {
        navigator.vibrate(20);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[100]"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={sheetRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 300 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%" }}
            animate={{ y: `${100 - currentHeight}%` }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl"
            style={{
              maxHeight: "95vh",
              touchAction: "none",
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full cursor-grab active:cursor-grabbing" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(95vh - 120px)" }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Example filter bottom sheet
export function FilterBottomSheet({
  isOpen,
  onClose,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      snapPoints={[60, 90]}
    >
      <div className="p-6 space-y-6">
        {/* Filter options go here */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Price Range
          </h3>
          {/* Price range slider */}
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Rating
          </h3>
          {/* Rating options */}
        </div>

        {/* Apply button */}
        <button
          onClick={() => onApply({})}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
      </div>
    </BottomSheet>
  );
}
