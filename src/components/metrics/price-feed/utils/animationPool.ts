/**
 * Animation pool utilities for PriceFeedCard
 *
 * Provides pooled Animated.Value objects to prevent memory leaks
 * from creating new animations for each price update event.
 */

import { Animated } from "react-native";

// Pool of reusable Animated.Value objects to prevent memory leaks
const animatedValuePool: Animated.Value[] = [];

/** Maximum number of pooled animation values */
export const MAX_POOL_SIZE = 50;

/**
 * Get an Animated.Value from the pool or create a new one
 * @returns Animated.Value initialized to 1
 */
export function getAnimatedValue(): Animated.Value {
  if (animatedValuePool.length > 0) {
    const value = animatedValuePool.pop()!;
    value.setValue(1);
    return value;
  }
  return new Animated.Value(1);
}

/**
 * Release an Animated.Value back to the pool
 * @param value - The Animated.Value to release
 */
export function releaseAnimatedValue(value: Animated.Value): void {
  value.stopAnimation();
  if (animatedValuePool.length < MAX_POOL_SIZE) {
    animatedValuePool.push(value);
  }
}
