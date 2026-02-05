/**
 * @file types.ts
 * @description Types for the Preloader component and PreloaderProvider context.
 */

/** Status of a preload step */
export type PreloadStepStatus =
  | "pending"
  | "active"
  | "completed"
  | "failed"
  | "skipped";

/** Individual preload step */
export type PreloadStep = {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional detail text (shown when active) */
  detail?: string;
  /** Current status */
  status: PreloadStepStatus;
  /** Whether this step is required (failure blocks app) */
  required?: boolean;
};

/** Overall preload status */
export type PreloadStatus = "idle" | "loading" | "complete" | "error";

/** Preloader context value */
export type PreloaderContextValue = {
  /** Whether preloading is complete */
  isReady: boolean;
  /** Current preload status */
  status: PreloadStatus;
  /** List of preload steps */
  steps: PreloadStep[];
  /** Index of current step */
  currentStep: number;
  /** Error message if failed */
  error?: string;
  /** Retry the failed step */
  retry: () => void;
  /** Skip preloading and show app */
  skip: () => void;
  /** Force restart preloading */
  restart: () => void;
};

/** Preloader configuration */
export type PreloaderConfig = {
  /** Minimum display time in ms (for branding) */
  minDisplayTime?: number;
  /** Whether to skip in development */
  skipInDev?: boolean;
  /** Enable debug logging */
  debug?: boolean;
};
