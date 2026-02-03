/**
 * HeartbeatChart Component
 *
 * @fileoverview Animated ECG-style heartbeat visualization for loading states.
 * Provides visual feedback during chart data loading with a continuously
 * scrolling heartbeat pattern.
 *
 * @description
 * Features:
 * - **ECG Pattern**: Realistic heartbeat waveform with P wave, QRS complex, and T wave
 * - **Smooth Animation**: Continuous horizontal scrolling with pulse glow effect
 * - **Banner Text**: Optional overlay message for loading context
 * - **Platform-Optimized**: CSS animations on web, Animated API on native
 * - **Grid Overlay**: Subtle grid lines for medical monitor aesthetic
 *
 * Animation system:
 * - Scroll animation: Horizontal translation at configurable speed
 * - Pulse animation: Opacity changes synchronized with heartbeat peaks
 * - SVG glow filter: Soft glow effect on the heartbeat line
 *
 * Path generation:
 * - `generateHeartbeatPath`: Creates SVG path for ECG waveform
 * - 8 heartbeat cycles rendered for seamless looping
 * - Each cycle includes: baseline, P wave dip, R spike, S dip, T bump
 *
 * @example
 * // Basic loading indicator
 * <HeartbeatChart />
 *
 * @example
 * // With custom message
 * <HeartbeatChart bannerText="Building chart data..." />
 *
 * @example
 * // Compact size for inline use
 * <HeartbeatChart height={40} width={100} animationDuration={1500} />
 *
 * @exports HeartbeatChart - Main component
 */

import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform, type ViewStyle } from "react-native";
import { Text } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";

type HeartbeatChartProps = {
  /** Color for the heartbeat line */
  color?: string;
  /** Height of the chart */
  height?: number;
  /** Width of the chart */
  width?: number | "100%";
  /** Optional banner text to overlay */
  bannerText?: string;
  /** Animation duration in milliseconds */
  animationDuration?: number;
  /** Additional style overrides */
  style?: ViewStyle;
};

/**
 * An animated heartbeat/ECG-style chart for loading states.
 *
 * @remarks
 * Displays a continuously scrolling ECG-style heartbeat pattern.
 * Perfect for chart loading states to indicate data is being fetched.
 *
 * @example Basic usage
 * ```tsx
 * <HeartbeatChart />
 * ```
 *
 * @example With banner text
 * ```tsx
 * <HeartbeatChart bannerText="Loading chart data..." />
 * ```
 */
export function HeartbeatChart({
  color = Colors.accent.primary,
  height = 200,
  width = "100%",
  bannerText,
  animationDuration = 2000,
  style,
}: HeartbeatChartProps) {
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Continuous scrolling animation
    const scrollAnimation = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: Platform.OS !== "web",
      })
    );

    // Pulse glow animation synchronized with heartbeat
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: animationDuration * 0.15,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: animationDuration * 0.35,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: animationDuration * 0.5,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );

    scrollAnimation.start();
    pulseAnimation.start();

    return () => {
      scrollAnimation.stop();
      pulseAnimation.stop();
    };
  }, [scrollAnim, pulseAnim, animationDuration]);

  // Generate heartbeat SVG path pattern
  const generateHeartbeatPath = (svgWidth: number, svgHeight: number): string => {
    const midY = svgHeight / 2;
    const segmentWidth = svgWidth / 4; // 4 heartbeat cycles visible
    const spikeHeight = svgHeight * 0.35;

    let path = `M 0 ${midY}`;

    // Generate multiple heartbeat cycles for seamless scrolling
    for (let i = 0; i < 8; i++) {
      const baseX = i * segmentWidth;
      // Flat baseline
      path += ` L ${baseX + segmentWidth * 0.2} ${midY}`;
      // Small dip (P wave)
      path += ` Q ${baseX + segmentWidth * 0.25} ${midY + 5} ${baseX + segmentWidth * 0.3} ${midY}`;
      // Sharp spike up (R wave)
      path += ` L ${baseX + segmentWidth * 0.35} ${midY}`;
      path += ` L ${baseX + segmentWidth * 0.4} ${midY - spikeHeight}`;
      // Sharp spike down (S wave)
      path += ` L ${baseX + segmentWidth * 0.45} ${midY + spikeHeight * 0.5}`;
      // Return to baseline
      path += ` L ${baseX + segmentWidth * 0.5} ${midY}`;
      // T wave bump
      path += ` Q ${baseX + segmentWidth * 0.65} ${midY - 8} ${baseX + segmentWidth * 0.8} ${midY}`;
      // Continue baseline
      path += ` L ${baseX + segmentWidth} ${midY}`;
    }

    return path;
  };

  const containerStyle: ViewStyle = {
    height,
    width,
    overflow: "hidden",
    position: "relative",
    backgroundColor: Colors.background.surface,
    borderRadius: 8,
    ...style,
  };

  // Web implementation using CSS animations for better performance
  if (Platform.OS === "web") {
    const svgWidth = typeof width === "number" ? width * 2 : 800;
    const svgHeight = height;
    const pathData = generateHeartbeatPath(svgWidth, svgHeight);

    return (
      <View style={containerStyle}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: svgWidth,
            height: svgHeight,
            animation: `heartbeat-scroll ${animationDuration}ms linear infinite`,
          }}
        >
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ display: "block" }}
          >
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="20%" stopColor={color} stopOpacity="1" />
                <stop offset="80%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor={color} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path
              d={pathData}
              stroke="url(#lineGradient)"
              strokeWidth="2"
              fill="none"
              filter="url(#glow)"
            />
          </svg>
        </div>
        {/* Grid lines for visual effect */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(to right, ${Colors.border.subtle}20 1px, transparent 1px),
              linear-gradient(to bottom, ${Colors.border.subtle}20 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }}
        />
        {bannerText && (
          <View style={styles.bannerContainer}>
            <View style={styles.banner}>
              <Text size={Size.Small} appearance={TextAppearance.Secondary}>
                {bannerText}
              </Text>
            </View>
          </View>
        )}
        <style>{`
          @keyframes heartbeat-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </View>
    );
  }

  // React Native implementation using Animated API
  const translateX = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -200],
  });

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            transform: [{ translateX }],
            opacity: pulseAnim,
          },
        ]}
      >
        {/* Native implementation would use react-native-svg here */}
        <View style={[styles.heartbeatLine, { backgroundColor: color }]} />
      </Animated.View>
      {bannerText && (
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <Text size={Size.Small} appearance={TextAppearance.Secondary}>
              {bannerText}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heartbeatLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 2,
  },
  bannerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  banner: {
    backgroundColor: Colors.background.overlay,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
});
