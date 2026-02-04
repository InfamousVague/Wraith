/**
 * Types for server selector card components
 */

import type { ApiServer } from "../../context/ApiServerContext";

export type ServerRowProps = {
  server: ApiServer;
  isActive: boolean;
  onSelect: (id: string) => void;
};
