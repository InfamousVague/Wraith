/**
 * Types for API stats components
 */

export type StatRowProps = {
  icon: string;
  label: string;
  value: React.ReactNode;
  color?: string;
};

export type ApiStatsCardProps = {
  loading?: boolean;
  pollInterval?: number;
};
