/**
 * @file AlertsPanel.tsx
 * @description Panel displaying user's active price alerts.
 *
 * Shows a list of price alerts with:
 * - Symbol and target price
 * - Condition (above/below/crosses)
 * - Triggered status
 * - Delete action
 */

import React from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Text, Card, Icon, Button, Skeleton } from "@wraith/ghost/components";
import { Colors } from "@wraith/ghost/tokens";
import { Size, Appearance, TextAppearance } from "@wraith/ghost/enums";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { spacing, radii } from "../../../styles/tokens";
import type { Alert } from "../../../services/haunt";

type AlertsPanelProps = {
  alerts: Alert[];
  loading?: boolean;
  onDelete: (alertId: string) => void;
  onCreateNew: () => void;
};

function AlertRow({
  alert,
  onDelete,
}: {
  alert: Alert;
  onDelete: () => void;
}) {
  const themeColors = useThemeColors();

  const getConditionIcon = () => {
    switch (alert.condition) {
      case "above":
        return "arrow-up";
      case "below":
        return "arrow-down";
      case "crosses":
        return "repeat";
    }
  };

  const getConditionColor = () => {
    switch (alert.condition) {
      case "above":
        return Colors.status.success;
      case "below":
        return Colors.status.danger;
      case "crosses":
        return Colors.accent.primary;
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: price < 1 ? 6 : 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    });
  };

  return (
    <View
      style={[
        styles.alertRow,
        { backgroundColor: themeColors.background.sunken },
        alert.triggered && styles.alertRowTriggered,
      ]}
    >
      <View style={styles.alertInfo}>
        <View style={styles.alertHeader}>
          <Text size={Size.Medium} weight="semibold">
            {alert.symbol.toUpperCase()}
          </Text>
          {alert.triggered && (
            <View style={styles.triggeredBadge}>
              <Icon name="check-circle" size={Size.ExtraSmall} color={Colors.status.success} />
              <Text size={Size.TwoXSmall} style={{ color: Colors.status.success }}>
                Triggered
              </Text>
            </View>
          )}
        </View>
        <View style={styles.alertDetails}>
          <View style={[styles.conditionBadge, { backgroundColor: `${getConditionColor()}20` }]}>
            <Icon name={getConditionIcon()} size={Size.ExtraSmall} color={getConditionColor()} />
            <Text size={Size.ExtraSmall} style={{ color: getConditionColor() }}>
              {alert.condition.charAt(0).toUpperCase() + alert.condition.slice(1)}
            </Text>
          </View>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            ${formatPrice(alert.targetPrice)}
          </Text>
        </View>
      </View>
      <Pressable onPress={onDelete} style={styles.deleteButton}>
        <Icon name="trash-2" size={Size.Small} color={Colors.status.danger} />
      </Pressable>
    </View>
  );
}

function AlertSkeleton() {
  return (
    <View style={styles.alertRow}>
      <View style={styles.alertInfo}>
        <Skeleton width={60} height={18} />
        <Skeleton width={120} height={14} style={{ marginTop: 4 }} />
      </View>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

export function AlertsPanel({
  alerts,
  loading = false,
  onDelete,
  onCreateNew,
}: AlertsPanelProps) {
  const themeColors = useThemeColors();

  // Separate active and triggered alerts
  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  if (loading) {
    return (
      <Card style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Icon name="bell" size={Size.Small} color={Colors.accent.primary} />
            <Text size={Size.Small} weight="semibold">
              Price Alerts
            </Text>
          </View>
        </View>
        <View style={styles.content}>
          <AlertSkeleton />
          <AlertSkeleton />
        </View>
      </Card>
    );
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Icon name="bell" size={Size.Small} color={Colors.accent.primary} />
          <Text size={Size.Small} weight="semibold">
            Price Alerts
          </Text>
          {activeAlerts.length > 0 && (
            <View style={styles.countBadge}>
              <Text size={Size.TwoXSmall} style={{ color: Colors.accent.primary }}>
                {activeAlerts.length}
              </Text>
            </View>
          )}
        </View>
        <Button
          label="New"
          onPress={onCreateNew}
          appearance={Appearance.Tertiary}
          size={Size.Small}
          leadingIcon="plus"
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="bell-off" size={Size.Large} color={themeColors.text.muted} />
            <Text size={Size.Small} appearance={TextAppearance.Muted} style={styles.emptyText}>
              No price alerts set
            </Text>
            <Button
              label="Create Alert"
              onPress={onCreateNew}
              appearance={Appearance.Secondary}
              size={Size.Small}
              leadingIcon="plus"
            />
          </View>
        ) : (
          <>
            {activeAlerts.length > 0 && (
              <View style={styles.alertSection}>
                {activeAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onDelete={() => onDelete(alert.id)}
                  />
                ))}
              </View>
            )}

            {triggeredAlerts.length > 0 && (
              <View style={styles.alertSection}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted} style={styles.sectionLabel}>
                  Recently Triggered
                </Text>
                {triggeredAlerts.slice(0, 3).map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onDelete={() => onDelete(alert.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  countBadge: {
    backgroundColor: `${Colors.accent.primary}20`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  content: {
    maxHeight: 300,
  },
  contentContainer: {
    padding: spacing.sm,
  },
  alertSection: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  alertRowTriggered: {
    opacity: 0.6,
  },
  alertInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  alertDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  conditionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  triggeredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: radii.sm,
  },
  deleteButton: {
    padding: spacing.xs,
    borderRadius: radii.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
});
