export type CloudProvider = "aws" | "azure" | "alibaba" | "digitalocean";

export type InstanceStatus = "running" | "stopped" | "terminated" | "pending";

export type StorageClass = "standard" | "infrequent" | "archive";

export interface CloudInstance {
  id: string;
  name: string;
  provider: CloudProvider;
  type: string;
  status: InstanceStatus;
  region: string;
  publicIp: string | null;
  privateIp: string;
  cpu: number;
  memory: number;
  launchTime: Date;
  monthlyCost: number;
}

export interface StorageBucket {
  id: string;
  name: string;
  provider: CloudProvider;
  region: string;
  sizeBytes: number;
  objectCount: number;
  storageClass: StorageClass;
  createdAt: Date;
  monthlyCost: number;
}

export interface StorageFile {
  key: string;
  bucket: string;
  provider: CloudProvider;
  sizeBytes: number;
  lastModified: Date;
  contentType: string;
}

export interface NetworkVpc {
  id: string;
  name: string;
  provider: CloudProvider;
  cidr: string;
  region: string;
  subnets: Subnet[];
  status: "available" | "pending";
}

export interface Subnet {
  id: string;
  name: string;
  cidr: string;
  availabilityZone: string;
  isPublic: boolean;
  instanceCount: number;
}

export interface SecurityGroup {
  id: string;
  name: string;
  provider: CloudProvider;
  vpcId: string;
  inboundRules: number;
  outboundRules: number;
}

export interface UsageSeries {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

export interface CostBreakdown {
  provider: CloudProvider;
  compute: number;
  storage: number;
  network: number;
  other: number;
}
