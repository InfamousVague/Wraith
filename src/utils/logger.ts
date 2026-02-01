/**
 * Development logger for API requests and data sanity checks.
 * Only logs in development mode (import.meta.env.DEV).
 */

const isDev = import.meta.env.DEV;

const styles = {
  request: "color: #A78BFA; font-weight: bold",
  response: "color: #2FD575; font-weight: bold",
  error: "color: #FF5C7A; font-weight: bold",
  data: "color: #4CC3FF",
  warn: "color: #F6C94C",
  label: "color: #9096AB",
};

export const logger = {
  /** Log an API request */
  request(endpoint: string, params?: Record<string, unknown>) {
    if (!isDev) return;
    console.groupCollapsed(`%c→ API Request: ${endpoint}`, styles.request);
    if (params && Object.keys(params).length > 0) {
      console.log("%cParams:", styles.label, params);
    }
    console.log("%cTimestamp:", styles.label, new Date().toISOString());
    console.groupEnd();
  },

  /** Log an API response */
  response(endpoint: string, data: unknown, duration?: number) {
    if (!isDev) return;
    console.groupCollapsed(
      `%c← API Response: ${endpoint}${duration ? ` (${duration}ms)` : ""}`,
      styles.response
    );
    console.log("%cData:", styles.label, data);
    console.groupEnd();
  },

  /** Log an API error */
  error(endpoint: string, error: unknown) {
    if (!isDev) return;
    console.groupCollapsed(`%c✕ API Error: ${endpoint}`, styles.error);
    console.error(error);
    console.groupEnd();
  },

  /** Sanity check data and log warnings */
  sanityCheck(label: string, checks: Array<{ name: string; pass: boolean; value?: unknown }>) {
    if (!isDev) return;

    const failed = checks.filter((c) => !c.pass);
    if (failed.length === 0) return;

    console.groupCollapsed(`%c⚠ Sanity Check: ${label}`, styles.warn);
    failed.forEach((check) => {
      console.warn(`%c${check.name}:`, styles.label, check.value ?? "FAILED");
    });
    console.groupEnd();
  },

  /** Log data with a label */
  data(label: string, data: unknown) {
    if (!isDev) return;
    console.log(`%c[${label}]`, styles.data, data);
  },

  /** Log a group of related data */
  group(label: string, fn: () => void) {
    if (!isDev) return;
    console.groupCollapsed(`%c${label}`, styles.label);
    fn();
    console.groupEnd();
  },
};
