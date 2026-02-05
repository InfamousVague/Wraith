/**
 * @file TradingSettingsSection.tsx
 * @description Settings section for configuring trading and risk management options.
 *
 * Includes:
 * - Drawdown protection toggle and configuration
 * - Max drawdown threshold slider
 * - Calculation method selector
 * - Bypass permission toggle
 * - Warning threshold configuration
 * - Auto-reset period selector
 */

import React, { useState } from "react";
import { View, StyleSheet, Modal, Pressable } from "react-native";
import { Card, Text, Toggle, Slider, Select, Button, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useTradingSettings } from "../../hooks/useTradingSettings";
import {
  type DrawdownCalculationMethod,
  type AutoResetPeriod,
  getCalculationMethodLabel,
  getAutoResetLabel,
} from "../../types/settings";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { spacing, radii } from "../../styles/tokens";

type CalculationMethodOption = {
  value: DrawdownCalculationMethod;
  label: string;
};

type AutoResetOption = {
  value: AutoResetPeriod;
  label: string;
};

const CALCULATION_METHOD_OPTIONS: CalculationMethodOption[] = [
  { value: "from_peak", label: getCalculationMethodLabel("from_peak") },
  { value: "from_initial", label: getCalculationMethodLabel("from_initial") },
  { value: "rolling_24h", label: getCalculationMethodLabel("rolling_24h") },
];

const AUTO_RESET_OPTIONS: AutoResetOption[] = [
  { value: "never", label: getAutoResetLabel("never") },
  { value: "24h", label: getAutoResetLabel("24h") },
  { value: "7d", label: getAutoResetLabel("7d") },
  { value: "30d", label: getAutoResetLabel("30d") },
];

/**
 * Settings section for trading and risk management configuration.
 * Uses useTradingSettings hook for state management and persistence.
 */
export function TradingSettingsSection() {
  const { isMobile } = useBreakpoint();
  const {
    settings,
    loading,
    error,
    updateDrawdownSettings,
    resetToDefaults,
  } = useTradingSettings();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { drawdownProtection } = settings;
  const isDisabled = !drawdownProtection.enabled || loading;

  const handleToggleProtection = async (value: boolean) => {
    await updateDrawdownSettings({ enabled: value });
  };

  const handleMaxDrawdownChange = async (value: number) => {
    await updateDrawdownSettings({ maxDrawdownPercent: value });
  };

  const handleCalculationMethodChange = async (value: DrawdownCalculationMethod) => {
    await updateDrawdownSettings({ calculationMethod: value });
  };

  const handleAllowBypassChange = async (value: boolean) => {
    await updateDrawdownSettings({ allowBypass: value });
  };

  const handleWarningThresholdChange = async (value: number) => {
    await updateDrawdownSettings({ warningThresholdPercent: value });
  };

  const handleAutoResetChange = async (value: AutoResetPeriod) => {
    await updateDrawdownSettings({ autoResetAfter: value });
  };

  const handleResetToDefaults = async () => {
    setShowResetConfirm(false);
    await resetToDefaults();
  };

  return (
    <View style={styles.section}>
      <Text
        size={Size.Medium}
        appearance={TextAppearance.Muted}
        style={styles.sectionTitle}
      >
        Trading & Risk Management
      </Text>

      <Card style={styles.card} fullBleed={isMobile}>
        <View style={[styles.cardContent, isMobile && styles.cardContentMobile]}>
          {/* Error display */}
          {error && (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={Size.Small} color={Colors.status.danger} />
              <Text size={Size.Small} style={{ color: Colors.status.danger }}>
                {error}
              </Text>
            </View>
          )}

          {/* Enable/Disable Toggle */}
          <View style={[styles.settingRow, isMobile && styles.settingRowMobile]}>
            <View style={styles.settingInfo}>
              <Text size={Size.Medium} weight="medium">
                Enable Drawdown Protection
              </Text>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                Automatically stop trading when portfolio drops below threshold
              </Text>
            </View>
            <Toggle
              value={drawdownProtection.enabled}
              onValueChange={handleToggleProtection}
              size={Size.Medium}
              disabled={loading}
            />
          </View>

          <View style={styles.divider} />

          {/* Max Drawdown Threshold */}
          <View style={styles.settingBlock}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text
                  size={Size.Medium}
                  weight="medium"
                  appearance={isDisabled ? TextAppearance.Muted : undefined}
                >
                  Max Drawdown Threshold
                </Text>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Trading stops when losses exceed this percentage
                </Text>
              </View>
              <Text
                size={Size.Medium}
                weight="bold"
                appearance={isDisabled ? TextAppearance.Muted : TextAppearance.Warning}
              >
                {drawdownProtection.maxDrawdownPercent}%
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                value={drawdownProtection.maxDrawdownPercent}
                min={5}
                max={50}
                step={1}
                onChange={handleMaxDrawdownChange}
                disabled={isDisabled}
                size={Size.Medium}
                appearance={TextAppearance.Warning}
              />
              <View style={styles.sliderLabels}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>5%</Text>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>50%</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Calculation Method */}
          <View style={[styles.settingRow, isMobile && styles.settingRowMobile]}>
            <View style={styles.settingInfo}>
              <Text
                size={Size.Medium}
                weight="medium"
                appearance={isDisabled ? TextAppearance.Muted : undefined}
              >
                Calculation Method
              </Text>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                How drawdown percentage is calculated
              </Text>
            </View>
            <Select
              options={CALCULATION_METHOD_OPTIONS}
              value={drawdownProtection.calculationMethod}
              onChange={handleCalculationMethodChange}
              size={Size.Medium}
              disabled={isDisabled}
              style={styles.select}
            />
          </View>

          <View style={styles.divider} />

          {/* Allow Bypass */}
          <View style={[styles.settingRow, isMobile && styles.settingRowMobile]}>
            <View style={styles.settingInfo}>
              <Text
                size={Size.Medium}
                weight="medium"
                appearance={isDisabled ? TextAppearance.Muted : undefined}
              >
                Allow Single-Trade Bypass
              </Text>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                Allow bypassing protection for individual trades when triggered
              </Text>
            </View>
            <Toggle
              value={drawdownProtection.allowBypass}
              onValueChange={handleAllowBypassChange}
              size={Size.Medium}
              disabled={isDisabled}
            />
          </View>

          <View style={styles.divider} />

          {/* Warning Threshold */}
          <View style={styles.settingBlock}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text
                  size={Size.Medium}
                  weight="medium"
                  appearance={isDisabled ? TextAppearance.Muted : undefined}
                >
                  Warning Threshold
                </Text>
                <Text size={Size.Small} appearance={TextAppearance.Muted}>
                  Show warning when drawdown reaches this % of max limit
                </Text>
              </View>
              <Text
                size={Size.Medium}
                weight="bold"
                appearance={isDisabled ? TextAppearance.Muted : TextAppearance.Info}
              >
                {drawdownProtection.warningThresholdPercent}%
              </Text>
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                value={drawdownProtection.warningThresholdPercent}
                min={50}
                max={95}
                step={5}
                onChange={handleWarningThresholdChange}
                disabled={isDisabled}
                size={Size.Medium}
                appearance={TextAppearance.Info}
              />
              <View style={styles.sliderLabels}>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>50%</Text>
                <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>95%</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Auto Reset */}
          <View style={[styles.settingRow, isMobile && styles.settingRowMobile]}>
            <View style={styles.settingInfo}>
              <Text
                size={Size.Medium}
                weight="medium"
                appearance={isDisabled ? TextAppearance.Muted : undefined}
              >
                Auto-Reset After
              </Text>
              <Text size={Size.Small} appearance={TextAppearance.Muted}>
                Automatically re-enable trading after cooldown period
              </Text>
            </View>
            <Select
              options={AUTO_RESET_OPTIONS}
              value={drawdownProtection.autoResetAfter}
              onChange={handleAutoResetChange}
              size={Size.Medium}
              disabled={isDisabled}
              style={styles.select}
            />
          </View>

          <View style={styles.divider} />

          {/* Reset to Defaults */}
          <View style={styles.resetContainer}>
            <Button
              label="Reset to Defaults"
              onPress={() => setShowResetConfirm(true)}
              size={Size.Small}
              shape={Shape.Rounded}
              appearance={Appearance.Secondary}
              leadingIcon="refresh-cw"
              disabled={loading}
            />
          </View>
        </View>
      </Card>

      {/* Reset Confirmation Modal */}
      <Modal
        visible={showResetConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetConfirm(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowResetConfirm(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card style={styles.modalContent}>
              <View style={styles.modalBody}>
                <Icon name="alert-triangle" size={Size.Large} color={Colors.status.warning} />
                <Text size={Size.Large} weight="bold" style={styles.modalTitle}>
                  Reset Settings?
                </Text>
                <Text
                  size={Size.Medium}
                  appearance={TextAppearance.Muted}
                  style={styles.modalText}
                >
                  This will reset all trading settings to their default values.
                  This action cannot be undone.
                </Text>
                <View style={styles.modalButtons}>
                  <Button
                    label="Cancel"
                    onPress={() => setShowResetConfirm(false)}
                    size={Size.Medium}
                    shape={Shape.Rounded}
                    appearance={Appearance.Secondary}
                    style={styles.modalButton}
                  />
                  <Button
                    label="Reset"
                    onPress={handleResetToDefaults}
                    size={Size.Medium}
                    shape={Shape.Rounded}
                    style={[styles.modalButton, { backgroundColor: Colors.status.warning }]}
                  />
                </View>
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  card: {
    flex: 1,
  },
  cardContent: {
    padding: 24,
  },
  cardContentMobile: {
    padding: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: Colors.status.dangerSurface,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  settingRowMobile: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingBlock: {
    gap: 12,
  },
  settingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  sliderContainer: {
    gap: 4,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  select: {
    minWidth: 180,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 16,
  },
  resetContainer: {
    alignItems: "flex-start",
    paddingTop: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
  },
  modalBody: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  modalTitle: {
    textAlign: "center",
  },
  modalText: {
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    width: "100%",
  },
  modalButton: {
    flex: 1,
  },
});
