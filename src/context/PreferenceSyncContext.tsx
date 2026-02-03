/**
 * Preference Sync Context (Stub)
 *
 * This is a stub that returns null since preference sync is not enabled.
 * The full implementation is in the mesh-data-sync branch.
 */

/**
 * Safe hook that returns null when PreferenceSyncContext is not available.
 * This allows components to optionally use preference sync without errors.
 */
export function usePreferenceSyncSafe() {
  return null;
}
