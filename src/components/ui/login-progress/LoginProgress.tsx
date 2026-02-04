/**
 * LoginProgress Component
 *
 * Visual stepper showing the progress of backend authentication.
 * Shows checkmark for completed steps, spinner for current step,
 * muted text for pending steps, and red error state if failed.
 */

import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { Text, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { Colors } from "@wraith/ghost/tokens";
import { spacing } from "../../../styles/tokens";
import type { LoginStep } from "../../../context/AuthContext";

type StepConfig = {
  key: LoginStep;
  labelKey: string;
};

const STEPS: StepConfig[] = [
  { key: "requesting_challenge", labelKey: "requestingChallenge" },
  { key: "signing", labelKey: "signing" },
  { key: "verifying", labelKey: "verifying" },
  { key: "loading_profile", labelKey: "loadingProfile" },
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
  const { t } = useTranslation("auth");
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
                <Icon name="x-circle" size={Size.Small} color={Colors.status.danger} />
              ) : isCompleted || (isSuccess && stepIndex <= currentIndex) ? (
                <Icon name="check-circle" size={Size.Small} color={Colors.status.success} />
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
              {t(`loginSteps.${step.labelKey}`)}
            </Text>
          </View>
        );
      })}

      {/* Success message */}
      {isSuccess && (
        <View style={styles.stepRow}>
          <View style={styles.iconContainer}>
            <Icon name="check-circle" size={Size.Small} color={Colors.status.success} />
          </View>
          <Text size={Size.Small} weight="medium" style={[styles.label, { color: Colors.status.success }]}>
            {t("loginSteps.success")}
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
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
    marginTop: spacing.xs,
    paddingLeft: spacing.xxl,
  },
});
