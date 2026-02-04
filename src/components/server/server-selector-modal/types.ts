/**
 * Types for server selector modal components
 */

import type { ApiServer } from "../../context/ApiServerContext";

export type ServerSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
};

export type ServerRowProps = {
  server: ApiServer;
  isActive: boolean;
  onSelect: (serverId: string) => void;
};
