/**
 * LoginProgress Component
 *
 * Visual stepper showing the progress of backend authentication.
 * Shows checkmark for completed steps, spinner for current step,
 * muted text for pending steps, and red error state if failed.
 */

import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import type { LoginStep } from "../context/AuthContext";
import { LOGIN_STEP_LABELS } from "../context/AuthContext";

type StepConfig = {
  key: LoginStep;
  label: string;
};

const STEPS: StepConfig[] = [
  { key: "requesting_challenge", label: "Requesting challenge" },
  { key: "signing", label: "Signing" },
  { key: "verifying", label: "Verifying" },
  { key: "loading_profile", label: "Loading profile" },
];

const STEP_ORDER: LoginStep[] = [
  "requesting_challenge",
  "signing",
  "verifying",
  "loading_profile",
  "success",
];

type Props = {
  currentStep: LoginStep;
  error?: string | null;
};

export function LoginProgress({ currentStep, error }: Props) {
  const themeColors = useThemeColors();

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isError = currentStep === "error";
  const isSuccess = currentStep === "success";
  const isIdle = currentStep === "idle";

  if (isIdle) {
    return null;
  }

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const stepIndex = STEP_ORDER.indexOf(step.key);
        const isCompleted = currentIndex > stepIndex;
        const isCurrent = currentIndex === stepIndex;
        const isPending = currentIndex < stepIndex;

        return (
          <View key={step.key} style={styles.stepRow}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              {isError && isCurrent ? (
                <Icon name="x-circle" size={Size.Small} color="#EF4444" />
              ) : isCompleted || (isSuccess && stepIndex <= currentIndex) ? (
                <Icon name="check-circle" size={Size.Small} color="#22C55E" />
              ) : isCurrent ? (
                <ActivityIndicator size="small" color={themeColors.text.primary} />
              ) : (
                <View style={[styles.pendingDot, { backgroundColor: themeColors.text.muted }]} />
              )}
            </View>

            {/* Label */}
            <Text
              size={Size.Small}
              appearance={
                isError && isCurrent
                  ? TextAppearance.Danger
                  : isCompleted || (isSuccess && stepIndex <= currentIndex)
                  ? TextAppearance.Default
                  : isCurrent
                  ? TextAppearance.Default
                  : TextAppearance.Muted
              }
              weight={isCurrent ? "medium" : "regular"}
              style={styles.label}
            >
              {step.label}
            </Text>
          </View>
        );
      })}

      {/* Success message */}
      {isSuccess && (
        <View style={styles.stepRow}>
          <View style={styles.iconContainer}>
            <Icon name="check-circle" size={Size.Small} color="#22C55E" />
          </View>
          <Text size={Size.Small} weight="medium" style={[styles.label, { color: "#22C55E" }]}>
            Connected to server!
          </Text>
        </View>
      )}

      {/* Error message */}
      {isError && error && (
        <View style={styles.errorContainer}>
          <Text size={Size.ExtraSmall} appearance={TextAppearance.Danger}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.4,
  },
  label: {
    flex: 1,
  },
  errorContainer: {
    marginTop: 8,
    paddingLeft: 32,
  },
});
