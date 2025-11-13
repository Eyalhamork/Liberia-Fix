// lib/animation-variants.ts
/**
 * Reusable Framer Motion animation variants
 * Use these for consistent animations across the app
 */

import { Variants } from "framer-motion";

/**
 * Page transition - slides in from right
 */
export const pageTransition: Variants = {
  enter: { x: "100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: "-100%", opacity: 0 },
};

/**
 * Simple fade in/out
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Slide up from bottom (for modals/sheets)
 */
export const slideUp: Variants = {
  initial: { y: "100%" },
  animate: { y: 0 },
  exit: { y: "100%" },
};

/**
 * Scale in (for dialogs/alerts)
 */
export const scaleIn: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

/**
 * Stagger children animations
 */
export const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * List item fade in
 */
export const listItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Card hover effect
 */
export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2 },
  },
  tap: { scale: 0.98 },
};

/**
 * Notification slide in from top
 */
export const notificationSlide: Variants = {
  initial: { y: -100, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
  exit: {
    y: -100,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Bottom nav item active state
 */
export const navItemActive: Variants = {
  inactive: { scale: 1 },
  active: {
    scale: 1.1,
    transition: { type: "spring", stiffness: 500, damping: 25 },
  },
};
