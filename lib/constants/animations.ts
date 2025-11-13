// lib/constants/animations.ts
/**
 * Standard animation timings for consistent feel across the app
 * Based on Material Design motion principles
 */
export const ANIMATION_TIMINGS = {
  instant: 100, // Button press feedback
  fast: 200, // Micro-interactions (ripples, toggles)
  normal: 300, // Page transitions, modals
  slow: 500, // Major state changes, complex animations
} as const;

/**
 * Easing functions for natural motion
 * Use standard for most animations
 * Framer Motion requires cubic-bezier as arrays [x1, y1, x2, y2]
 */
export const ANIMATION_EASINGS = {
  standard: [0.4, 0.0, 0.2, 1], // Most common - acceleration and deceleration
  decelerate: [0.0, 0.0, 0.2, 1], // Elements entering screen
  accelerate: [0.4, 0.0, 1, 1], // Elements leaving screen
  bounce: [0.68, -0.55, 0.265, 1.55], // Playful interactions
} as const;

/**
 * Spring configurations for Framer Motion
 */
export const SPRING_CONFIGS = {
  gentle: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
  snappy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
  },
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 17,
  },
} as const;
