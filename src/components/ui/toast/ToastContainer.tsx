/**
 * @file ToastContainer.tsx
 * @description Container component that renders all active toasts.
 *
 * Positions toasts at the top-right of the screen and manages
 * their stacking order.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Toast, type ToastProps } from "./Toast";
import { spacing } from "../../../styles/tokens";

type ToastContainerProps = {
  toasts: Omit<ToastProps, "onDismiss">[];
  onDismiss: (id: string) => void;
};

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 9999,
    maxWidth: 400,
  },
});
