import { Variants } from "framer-motion";

// -----------------------------------------------------------------------------
// TIMING CONSTANTS (Milliseconds translated to seconds for Framer Motion)
// -----------------------------------------------------------------------------
export const DURATION = {
  ultraFast: 0.15,
  fast: 0.3,
  medium: 0.8,
  slow: 1.5,
  perpetual: 3.0,
};

// -----------------------------------------------------------------------------
// EASINGS
// -----------------------------------------------------------------------------
export const EASE = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  bounce: [0.175, 0.885, 0.32, 1.275], // Overshoot
};

// -----------------------------------------------------------------------------
// PHYSICS PRESETS (For Framer Motion / React Spring)
// -----------------------------------------------------------------------------
export const SPRING = {
  bouncy: { type: "spring", stiffness: 400, damping: 10 },
  smooth: { type: "spring", stiffness: 300, damping: 25 },
  slow: { type: "spring", stiffness: 100, damping: 20 },
};

// -----------------------------------------------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------------------------------------------
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    x: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: DURATION.fast,
      ease: EASE.out,
      when: "beforeChildren",
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: EASE.inOut,
    },
  },
};

// Use for Dashboard <-> Analytics crossfades
export const fadeTransitionVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { duration: DURATION.fast } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.2 } 
  },
};

// -----------------------------------------------------------------------------
// COMPONENT REVEALS
// -----------------------------------------------------------------------------
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: DURATION.medium, ease: EASE.out }
  },
  exit: { opacity: 0, y: -20, transition: { duration: DURATION.fast } },
};

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    transition: { type: "spring", stiffness: 400, damping: 25 } 
  },
};

// -----------------------------------------------------------------------------
// MICRO-INTERACTIONS
// -----------------------------------------------------------------------------
export const hoverScale = {
  scale: 1.02,
  transition: { duration: DURATION.ultraFast },
};

export const hoverLift = {
  y: -4,
  boxShadow: "0px 10px 20px rgba(0,0,0,0.1)",
  transition: { duration: DURATION.fast, ease: EASE.out },
};

export const tapShrink = {
  scale: 0.98,
};
