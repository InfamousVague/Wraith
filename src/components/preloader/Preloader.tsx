/**
 * @file Preloader.tsx
 * @description Animated preloading screen with floating ghost animation.
 *
 * Shows a branded loading experience with:
 * - Floating ghost animation at the top
 * - Single status line that updates
 * - Progress bar
 */

import React from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../styles/tokens";
import type { PreloadStep, PreloadStatus } from "./types";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";

export type PreloaderProps = {
  steps: PreloadStep[];
  currentStep: number;
  status: PreloadStatus;
  error?: string;
  onRetry?: () => void;
  onSkip?: () => void;
};

/** Animated Ghost SVG Component */
function GhostSvg({ size = 100 }: { size?: number }) {
  const scale = size / 127.433;
  return (
    <Svg
      width={127.433 * scale}
      height={132.743 * scale}
      viewBox="0 0 127.433 132.743"
    >
      <Path
        fill="#FFF6F4"
        d="M116.223,125.064c1.032-1.183,1.323-2.73,1.391-3.747V54.76c0,0-4.625-34.875-36.125-44.375s-66,6.625-72.125,44l-0.781,63.219c0.062,4.197,1.105,6.177,1.808,7.006c1.94,1.811,5.408,3.465,10.099-0.6c7.5-6.5,8.375-10,12.75-6.875s5.875,9.75,13.625,9.25s12.75-9,13.75-9.625s4.375-1.875,7,1.25s5.375,8.25,12.875,7.875s12.625-8.375,12.625-8.375s2.25-3.875,7.25,0.375s7.625,9.75,14.375,8.125C114.739,126.01,115.412,125.902,116.223,125.064z"
      />
      <Circle fill="#013E51" cx="86.238" cy="57.885" r="6.667" />
      <Circle fill="#013E51" cx="40.072" cy="57.885" r="6.667" />
      <Path
        fill="#013E51"
        d="M71.916,62.782c0.05-1.108-0.809-2.046-1.917-2.095c-0.673-0.03-1.28,0.279-1.667,0.771c-0.758,0.766-2.483,2.235-4.696,2.358c-1.696,0.094-3.438-0.625-5.191-2.137c-0.003-0.003-0.007-0.006-0.011-0.009l0.002,0.005c-0.332-0.294-0.757-0.488-1.235-0.509c-1.108-0.049-2.046,0.809-2.095,1.917c-0.032,0.724,0.327,1.37,0.887,1.749c-0.001,0-0.002-0.001-0.003-0.001c2.221,1.871,4.536,2.88,6.912,2.986c0.333,0.014,0.67,0.012,1.007-0.01c3.163-0.191,5.572-1.942,6.888-3.166l0.452-0.453c0.021-0.019,0.04-0.041,0.06-0.061l0.034-0.034c-0.007,0.007-0.015,0.014-0.021,0.02C71.666,63.771,71.892,63.307,71.916,62.782z"
      />
      {/* Highlights */}
      <Circle fill="#FCEFED" stroke="#FEEBE6" strokeMiterlimit={10} cx="18.614" cy="99.426" r="3.292" />
      <Circle fill="#FCEFED" stroke="#FEEBE6" strokeMiterlimit={10} cx="95.364" cy="28.676" r="3.291" />
      <Circle fill="#FCEFED" stroke="#FEEBE6" strokeMiterlimit={10} cx="24.739" cy="93.551" r="2.667" />
      <Circle fill="#FCEFED" stroke="#FEEBE6" strokeMiterlimit={10} cx="101.489" cy="33.051" r="2.666" />
      <Circle fill="#FCEFED" stroke="#FEEBE6" strokeMiterlimit={10} cx="18.738" cy="87.717" r="2.833" />
      {/* Outline */}
      <Path
        fill="#FCEFED"
        stroke="#FEEBE6"
        strokeMiterlimit={10}
        d="M116.279,55.814c-0.021-0.286-2.323-28.744-30.221-41.012c-7.806-3.433-15.777-5.173-23.691-5.173c-16.889,0-30.283,7.783-37.187,15.067c-9.229,9.736-13.84,26.712-14.191,30.259l-0.748,62.332c0.149,2.133,1.389,6.167,5.019,6.167c1.891,0,4.074-1.083,6.672-3.311c4.96-4.251,7.424-6.295,9.226-6.295c1.339,0,2.712,1.213,5.102,3.762c4.121,4.396,7.461,6.355,10.833,6.355c2.713,0,5.311-1.296,7.942-3.962c3.104-3.145,5.701-5.239,8.285-5.239c2.116,0,4.441,1.421,7.317,4.473c2.638,2.8,5.674,4.219,9.022,4.219c4.835,0,8.991-2.959,11.27-5.728l0.086-0.104c1.809-2.2,3.237-3.938,5.312-3.938c2.208,0,5.271,1.942,9.359,5.936c0.54,0.743,3.552,4.674,6.86,4.674c1.37,0,2.559-0.65,3.531-1.932l0.203-0.268L116.279,55.814z M114.281,121.405c-0.526,0.599-1.096,0.891-1.734,0.891c-2.053,0-4.51-2.82-5.283-3.907l-0.116-0.136c-4.638-4.541-7.975-6.566-10.82-6.566c-3.021,0-4.884,2.267-6.857,4.667l-0.086,0.104c-1.896,2.307-5.582,4.999-9.725,4.999c-2.775,0-5.322-1.208-7.567-3.59c-3.325-3.528-6.03-5.102-8.772-5.102c-3.278,0-6.251,2.332-9.708,5.835c-2.236,2.265-4.368,3.366-6.518,3.366c-2.772,0-5.664-1.765-9.374-5.723c-2.488-2.654-4.29-4.395-6.561-4.395c-2.515,0-5.045,2.077-10.527,6.777c-2.727,2.337-4.426,2.828-5.37,2.828c-2.662,0-3.017-4.225-3.021-4.225l0.745-62.163c0.332-3.321,4.767-19.625,13.647-28.995c3.893-4.106,10.387-8.632,18.602-11.504c-0.458,0.503-0.744,1.165-0.744,1.898c0,1.565,1.269,2.833,2.833,2.833c1.564,0,2.833-1.269,2.833-2.833c0-1.355-0.954-2.485-2.226-2.764c4.419-1.285,9.269-2.074,14.437-2.074c7.636,0,15.336,1.684,22.887,5.004c26.766,11.771,29.011,39.047,29.027,39.251V121.405z"
      />
    </Svg>
  );
}

/** Animated Shadow SVG Component */
function ShadowSvg({ size = 100, scaleX = 1 }: { size?: number; scaleX?: number }) {
  const scale = size / 122.436;
  return (
    <Svg
      width={122.436 * scale}
      height={39.744 * scale}
      viewBox="0 0 122.436 39.744"
      style={{ transform: [{ scaleX }] }}
    >
      <Ellipse fill="rgba(138, 99, 210, 0.3)" cx="61.128" cy="19.872" rx="49.25" ry="8.916" />
    </Svg>
  );
}

export function Preloader({
  steps,
  currentStep,
  status,
  error,
  onRetry,
  onSkip,
}: PreloaderProps) {
  // Ghost floating animation
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  // Shadow scale animation (synced with float)
  const shadowScaleAnim = React.useRef(new Animated.Value(1)).current;
  // Spinner rotation
  const spinAnim = React.useRef(new Animated.Value(0)).current;

  // Float animation
  React.useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 15,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shadowScaleAnim, {
            toValue: 0.7,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shadowScaleAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    float.start();
    return () => float.stop();
  }, [floatAnim, shadowScaleAnim]);

  // Spinner rotation
  React.useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const activeStep = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  // Get current status text - only show the label, no detail
  const getStatusText = () => {
    if (status === "error") return error || "Connection failed";
    if (activeStep) return activeStep.label;
    return "Initializing...";
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Ghost Animation */}
        <View style={styles.ghostContainer}>
          <Animated.View style={[styles.ghost, { transform: [{ translateY: floatAnim }] }]}>
            <GhostSvg size={120} />
          </Animated.View>
          <Animated.View style={[styles.shadow, { transform: [{ scaleX: shadowScaleAnim }] }]}>
            <ShadowSvg size={100} />
          </Animated.View>
        </View>

        {/* Brand */}
        <View style={styles.brandContainer}>
          <Text size={Size.ThreeXLarge} weight="bold" style={styles.logoText}>
            WRAITH
          </Text>
          <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.tagline}>
            Real-time Trading Intelligence
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Single Status Line */}
        <View style={styles.statusContainer}>
          {status === "loading" && (
            <View style={styles.statusRow}>
              <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                <Icon name="loader" size={Size.Small} color={Colors.accent.primary} />
              </Animated.View>
              <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.statusText} numberOfLines={1}>
                {getStatusText()}
              </Text>
            </View>
          )}

          {status === "error" && (
            <View style={styles.statusRow}>
              <Icon name="alert-triangle" size={Size.Small} color={Colors.status.danger} />
              <Text size={Size.Small} appearance={TextAppearance.Danger} style={styles.statusText} numberOfLines={1}>
                {getStatusText()}
              </Text>
            </View>
          )}
        </View>

        {/* Error Actions */}
        {status === "error" && (
          <View style={styles.errorActions}>
            {onRetry && (
              <Text size={Size.Small} style={styles.actionButton} onPress={onRetry}>
                Retry
              </Text>
            )}
            {onSkip && (
              <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.actionButton} onPress={onSkip}>
                Continue Anyway
              </Text>
            )}
          </View>
        )}

        {/* Version Info */}
        <View style={styles.footer}>
          <Text size={Size.TwoXSmall} appearance={TextAppearance.Muted}>
            v0.1.0
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050608",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: spacing.xl,
  },
  ghostContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    height: 160, // Fixed height to prevent layout shift during animation
  },
  ghost: {
    alignItems: "center",
    justifyContent: "center",
  },
  shadow: {
    marginTop: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  logoText: {
    color: "#F4F6FF",
    letterSpacing: 8,
    textAlign: "center",
  },
  tagline: {
    marginTop: spacing.xs,
    letterSpacing: 2,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    maxWidth: 280,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  progressTrack: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
  },
  statusContainer: {
    minHeight: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  statusText: {
    textAlign: "center",
    flexShrink: 1,
  },
  errorActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  actionButton: {
    color: Colors.accent.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: "center",
  },
});
