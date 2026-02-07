/**
 * @file UsernameEditor.tsx
 * @description Component for editing username with client-side and server-side validation.
 *
 * ## Features:
 * - Real-time client-side validation
 * - Profanity filter integration
 * - Server availability check
 * - Username suggestions
 * - Rate limit handling
 */

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { Card, Text, Button, Input, Icon } from "@wraith/ghost/components";
import { Size, TextAppearance, Shape, Appearance } from "@wraith/ghost/enums";
import { Colors } from "@wraith/ghost/tokens";
import { useThemeColors } from "@wraith/ghost/context/ThemeContext";
import { validateUsername, type UsernameValidationResult } from "../../utils/usernameValidation";
import { hauntClient } from "../../services/haunt";
import { useAuth } from "../../context/AuthContext";

type UsernameEditorProps = {
  currentUsername: string;
  onUsernameUpdated?: (updatedProfile: any) => void;
};

export function UsernameEditor({ currentUsername, onUsernameUpdated }: UsernameEditorProps) {
  const { t } = useTranslation(["auth", "common"]);
  const themeColors = useThemeColors();
  const { sessionToken } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [validationResult, setValidationResult] = useState<UsernameValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Reset state when editing mode changes
  useEffect(() => {
    if (isEditing) {
      setUsername(currentUsername);
      setValidationResult(null);
      setServerError(null);
      setJustSaved(false);
      setIsValidating(false);
    }
  }, [isEditing, currentUsername]);

  const handleSave = async () => {
    if (!sessionToken || !validationResult?.isValid || username === currentUsername || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setServerError(null);

      const response = await hauntClient.updateUsername(sessionToken, username);

      if (response.data) {
        onUsernameUpdated?.(response.data);
        setJustSaved(true);
        
        // Reset state and exit edit mode after successful save
        setTimeout(() => {
          setJustSaved(false);
          setIsEditing(false);
          setValidationResult(null);
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to update username:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update username";
      
      if (errorMessage.includes("profanity") || errorMessage.includes("inappropriate")) {
        setServerError(t("auth:profile.usernameProfanity"));
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
        setServerError(t("auth:profile.usernameRateLimit"));
      } else if (errorMessage.includes("reserved")) {
        setServerError(t("auth:profile.usernameReserved"));
      } else if (errorMessage.includes("taken") || errorMessage.includes("available")) {
        setServerError(t("auth:profile.usernameUnavailable"));
      } else {
        setServerError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const checkServerAvailability = useCallback(async (usernameToCheck: string) => {
    try {
      const response = await hauntClient.checkUsernameAvailability(usernameToCheck);
      
      if (!response.available) {
        setValidationResult({
          isValid: false,
          error: response.reason || t("auth:profile.usernameUnavailable"),
          errorCode: "ALREADY_TAKEN",
          normalized: response.username,
          suggestions: response.suggestions || [],
        });
      }
    } catch (error) {
      console.error("Failed to check username availability:", error);
      setServerError(
        error instanceof Error ? error.message : "Failed to validate username"
      );
    }
  }, [t]);

  // Client-side validation with debounce
  useEffect(() => {
    if (!isEditing || username === currentUsername) {
      setValidationResult(null);
      setIsValidating(false);
      setServerError(null);
      return;
    }

    if (username.length === 0) {
      setValidationResult(null);
      setIsValidating(false);
      setServerError(null);
      return;
    }

    setServerError(null);
    setJustSaved(false);

    // Longer debounce to prevent rapid validation
    const timeoutId = setTimeout(async () => {
      try {
        // Only show loading when actually validating, not during typing
        setIsValidating(true);
        
        const result = validateUsername(username);
        setValidationResult(result);

        // If client-side validation passes, check server availability
        if (result.isValid && sessionToken) {
          await checkServerAvailability(username);
        }
      } catch (error) {
        console.error("Validation error:", error);
        setServerError(error instanceof Error ? error.message : "Validation failed");
      } finally {
        setIsValidating(false);
      }
    }, 800);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [username, currentUsername, sessionToken, checkServerAvailability, isEditing]);

  const getErrorMessage = useCallback(() => {
    if (serverError) return serverError;
    if (!validationResult || !validationResult.error) return null;

    // Map validation error codes to translations
    switch (validationResult.errorCode) {
      case "TOO_SHORT":
      case "TOO_LONG":
        return t("auth:profile.usernameLength");
      case "INVALID_CHARACTERS":
        return t("auth:profile.usernameInvalidChars");
      case "PROFANITY_DETECTED":
        return t("auth:profile.usernameProfanity");
      case "RESERVED_USERNAME":
        return t("auth:profile.usernameReserved");
      case "HOMOGLYPH_DETECTED":
        return t("auth:profile.usernameHomoglyph");
      case "ALREADY_TAKEN":
        return t("auth:profile.usernameUnavailable");
      case "RATE_LIMITED":
        return t("auth:profile.usernameRateLimit");
      case "STARTS_WITH_NUMBER":
        return t("auth:profile.usernameStartsWithNumber");
      case "CONSECUTIVE_SPECIAL_CHARS":
        return t("auth:profile.usernameConsecutiveSpecial");
      default:
        return validationResult.error;
    }
  }, [validationResult, serverError, t]);

  const errorMessage = getErrorMessage();
  const isValid = validationResult?.isValid && !isValidating && !isSaving && !serverError;
  const isLoading = isValidating || isSaving;
  
  // Determine border color
  const getBorderColor = () => {
    if (isLoading) return themeColors.border.subtle;
    if (isValid && username !== currentUsername) return Colors.status.success;
    if (errorMessage) return Colors.status.danger;
    return themeColors.border.subtle;
  };

  // View mode - show current username with edit button
  if (!isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          <View style={styles.labelContainer}>
            <Text size={Size.Medium} weight="semibold">
              {t("auth:profile.username")}
            </Text>
            <Text size={Size.Medium}>{currentUsername || "—"}</Text>
          </View>
          <Pressable onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Icon name="edit" size={Size.Small} color={themeColors.text.secondary} />
            <Text size={Size.Small} appearance={TextAppearance.Secondary}>
              {t("auth:profile.usernameEdit")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // Edit mode - show input with save on Enter
  return (
    <View style={styles.container}>
      <Text size={Size.Medium} weight="semibold" style={styles.label}>
        {t("auth:profile.username")}
      </Text>

      <View style={[styles.inputWrapper, { borderColor: getBorderColor(), borderWidth: 2, borderRadius: 8 }]}>
        <Input
          value={username}
          onChangeText={setUsername}
          onSubmitEditing={handleSave}
          placeholder={t("auth:profile.usernamePlaceholder")}
          size={Size.Medium}
          shape={Shape.Rounded}
          disabled={isSaving}
          leadingIcon="user"
          trailingIcon={
            isLoading
              ? undefined
              : isValid && username !== currentUsername
              ? "check"
              : errorMessage
              ? "alert-circle"
              : undefined
          }
          style={styles.input}
        />
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={themeColors.text.secondary} />
          </View>
        )}
      </View>

      {isValid && username !== currentUsername && !justSaved && (
        <View style={styles.hintContainer}>
          <Text size={Size.Small} appearance={TextAppearance.Muted}>
            Press Enter to save
          </Text>
        </View>
      )}

      {justSaved && (
        <View style={styles.savedMessage}>
          <Icon name="check" size={Size.Small} color={Colors.status.success} />
          <Text size={Size.Small} style={{ color: Colors.status.success }}>
            {t("auth:profile.usernameUpdated")}
          </Text>
        </View>
      )}

      {isValidating && (
        <View style={styles.validatingContainer}>
          <ActivityIndicator size="small" color={Colors.accent.primary} />
          <Text size={Size.Small} style={{ color: Colors.accent.primary }}>
            {t("auth:profile.usernameValidating")}
          </Text>
        </View>
      )}

      {errorMessage && !isValidating && (
        <View style={styles.errorContainer}>
          <Text size={Size.Small} appearance={TextAppearance.Danger}>
            {errorMessage}
          </Text>

          {validationResult?.suggestions && validationResult.suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text size={Size.ExtraSmall} appearance={TextAppearance.Muted}>
                {t("auth:profile.usernameSuggestions")}
              </Text>
              <View style={styles.suggestionsList}>
                {validationResult.suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => setUsername(suggestion)}
                    style={[
                      styles.suggestionChip,
                      { 
                        backgroundColor: themeColors.background.raised,
                        borderColor: themeColors.border.subtle,
                      },
                    ]}
                  >
                    <Text size={Size.ExtraSmall}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}  
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labelContainer: {
    gap: 4,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
  },
  inputWrapper: {
    position: "relative",
    borderRadius: 8,
  },
  input: {
    borderWidth: 0,
  },
  loadingIndicator: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  label: {
    marginBottom: 4,
  },
  hintContainer: {
    marginTop: -4,
  },
  savedMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -4,
  },
  validatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -4,
  },
  errorContainer: {
    gap: 8,
    marginTop: -8,
  },
  suggestionsContainer: {
    gap: 6,
    marginTop: 4,
  },
  suggestionsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  suggestionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
});
