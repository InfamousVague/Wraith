/**
 * @file ErrorFallback.tsx
 * @description Fallback UI shown when an error is caught.
 *
 * Provides:
 * - Error message display
 * - Retry/reset button
 * - Link to report issue
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Icon } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing, radii } from "../../styles/tokens";

type ErrorFallbackProps = {
  error: Error | null;
  onReset?: () => void;
};

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const themeColors = useThemeColors();

  const handleRefresh = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  const handleReportIssue = () => {
    const issueUrl = `https://github.com/anthropics/claude-code/issues/new?title=Error: ${encodeURIComponent(error?.message || "Unknown error")}&body=${encodeURIComponent(`## Error Details\n\n\`\`\`\n${error?.stack || error?.message || "No error details available"}\n\`\`\`\n\n## Steps to Reproduce\n\n1. \n2. \n3. \n\n## Expected Behavior\n\n`)}`;
    window.open(issueUrl, "_blank");
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.canvas }]}>
      <View style={[styles.card, { backgroundColor: themeColors.background.raised }]}>
        <View style={styles.iconContainer}>
          <Icon name="alert-triangle" size={Size.ExtraLarge} color={Colors.status.danger} />
        </View>

        <Text size={Size.ExtraLarge} weight="bold" style={styles.title}>
          Something went wrong
        </Text>

        <Text
          size={Size.Small}
          appearance={TextAppearance.Muted}
          style={styles.description}
        >
          An unexpected error occurred. You can try refreshing the page or report this issue.
        </Text>

        {error && (
          <View style={[styles.errorDetails, { backgroundColor: themeColors.background.surface }]}>
            <Text size={Size.ExtraSmall} style={{ fontFamily: "monospace", color: Colors.status.danger }}>
              {error.message}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            label="Refresh Page"
            onPress={handleRefresh}
            appearance={Appearance.Primary}
            iconLeft="refresh-cw"
          />
          <Button
            label="Report Issue"
            onPress={handleReportIssue}
            appearance={Appearance.Secondary}
            iconLeft="external-link"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    padding: spacing.xl,
    borderRadius: radii.lg,
    maxWidth: 480,
    width: "100%",
    alignItems: "center",
  },
  iconContainer: {
    padding: spacing.md,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: radii.full,
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  errorDetails: {
    padding: spacing.md,
    borderRadius: radii.md,
    width: "100%",
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
});
