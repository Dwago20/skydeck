import type { CloudProvider, InstanceStatus } from "./types";

export const providerColors: Record<CloudProvider, string> = {
  aws: "#ff9900",
  azure: "#0078d4",
  alibaba: "#ff6a00",
  digitalocean: "#0080ff",
};

export const providerLabels: Record<CloudProvider, string> = {
  aws: "AWS",
  azure: "Azure",
  alibaba: "Alibaba",
  digitalocean: "DigitalOcean",
};

export const statusColors: Record<InstanceStatus, string> = {
  running: "#10b981",
  stopped: "#f59e0b",
  terminated: "#f43f5e",
  pending: "#8b5cf6",
};
