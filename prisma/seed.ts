import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simple SHA-256 hash with salt for seeding
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID();
  const msgBuffer = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${salt}:${hash}`;
}

async function main() {
  console.log("🌱 Seeding SkyDeck database...");

  // ── Admin User ───────────────────────────────────
  const passwordHash = await hashPassword("admin123");
  await prisma.user.upsert({
    where: { email: "admin@skydeck.io" },
    update: { passwordHash },
    create: {
      email: "admin@skydeck.io",
      name: "Admin",
      passwordHash,
      role: "admin",
    },
  });
  console.log("  ✓ Admin user created (admin@skydeck.io / admin123)");

  // ── Cloud Providers ──────────────────────────────
  const aws = await prisma.cloudProvider.upsert({
    where: { name: "aws" },
    update: {},
    create: { name: "aws", label: "Amazon Web Services", region: "ap-southeast-1", status: "connected" },
  });

  const azure = await prisma.cloudProvider.upsert({
    where: { name: "azure" },
    update: {},
    create: { name: "azure", label: "Microsoft Azure", region: "southeastasia", status: "connected" },
  });

  const alibaba = await prisma.cloudProvider.upsert({
    where: { name: "alibaba" },
    update: {},
    create: { name: "alibaba", label: "Alibaba Cloud", region: "ap-southeast-1", status: "connected" },
  });
  console.log("  ✓ Cloud providers");

  // ── Instances ────────────────────────────────────
  const instances = [
    { name: "api-prod-1", providerId: aws.id, externalId: "i-0a1b2c3d4e5f6a7b8", type: "t3.large", status: "running", region: "ap-southeast-1", publicIp: "54.169.123.45", privateIp: "10.0.1.100", cpu: 2, memory: 8, monthlyCost: 60.74 },
    { name: "web-frontend", providerId: aws.id, externalId: "i-0f1e2d3c4b5a6978", type: "t3.medium", status: "running", region: "ap-southeast-1", publicIp: "13.212.98.76", privateIp: "10.0.2.50", cpu: 2, memory: 4, monthlyCost: 30.37 },
    { name: "worker-batch", providerId: aws.id, externalId: "i-0b2a3c4d5e6f7a8b", type: "m5.xlarge", status: "stopped", region: "ap-southeast-1", publicIp: null, privateIp: "10.0.3.200", cpu: 4, memory: 16, monthlyCost: 0 },
    { name: "staging-vm-1", providerId: azure.id, externalId: "vm-staging-001", type: "Standard_B2s", status: "running", region: "southeastasia", publicIp: "20.43.156.89", privateIp: "10.1.0.10", cpu: 2, memory: 4, monthlyCost: 38.54 },
    { name: "ml-training", providerId: alibaba.id, externalId: "ecs-ml-train-01", type: "ecs.g6.xlarge", status: "stopped", region: "ap-southeast-1", publicIp: null, privateIp: "172.16.1.50", cpu: 4, memory: 16, monthlyCost: 0 },
  ];

  for (const inst of instances) {
    await prisma.instance.upsert({
      where: { externalId: inst.externalId },
      update: {},
      create: inst,
    });
  }
  console.log("  ✓ EC2/VM instances");

  // ── Buckets ──────────────────────────────────────
  const buckets = [
    { name: "project-data-lake", providerId: aws.id, region: "ap-southeast-1", sizeBytes: BigInt(42_000_000_000), objectCount: 12_485, storageClass: "standard", monthlyCost: 0.96 },
    { name: "static-assets-cdn", providerId: aws.id, region: "ap-southeast-1", sizeBytes: BigInt(3_200_000_000), objectCount: 1_204, storageClass: "standard", monthlyCost: 0.07 },
    { name: "platform-docs", providerId: azure.id, region: "southeastasia", sizeBytes: BigInt(8_500_000_000), objectCount: 3_421, storageClass: "standard", monthlyCost: 0.19 },
    { name: "archive-2024", providerId: alibaba.id, region: "ap-southeast-1", sizeBytes: BigInt(120_000_000_000), objectCount: 45_200, storageClass: "archive", monthlyCost: 0.48 },
  ];

  for (const b of buckets) {
    await prisma.bucket.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
  }
  console.log("  ✓ Storage buckets");

  // ── VPCs ─────────────────────────────────────────
  const vpc = await prisma.vpc.upsert({
    where: { name: "prod-vpc" },
    update: {},
    create: { name: "prod-vpc", provider: "aws", cidr: "10.0.0.0/16", region: "ap-southeast-1", status: "available" },
  });

  const subnets = [
    { name: "public-1a", vpcId: vpc.id, cidr: "10.0.1.0/24", availabilityZone: "ap-southeast-1a", isPublic: true },
    { name: "private-1a", vpcId: vpc.id, cidr: "10.0.10.0/24", availabilityZone: "ap-southeast-1a", isPublic: false },
    { name: "public-1b", vpcId: vpc.id, cidr: "10.0.2.0/24", availabilityZone: "ap-southeast-1b", isPublic: true },
  ];
  for (const s of subnets) {
    await prisma.subnet.create({ data: s });
  }

  const securityGroups = [
    { name: "web-sg", vpcId: vpc.id, provider: "aws", inboundRules: 3, outboundRules: 1 },
    { name: "db-sg", vpcId: vpc.id, provider: "aws", inboundRules: 1, outboundRules: 1 },
  ];
  for (const sg of securityGroups) {
    await prisma.securityGroup.create({ data: sg });
  }
  console.log("  ✓ VPCs, subnets, security groups");

  // ── Usage Snapshots (24h time-series) ────────────
  const now = new Date();
  const usageData = [];
  for (let i = 23; i >= 0; i--) {
    const ts = new Date(now.getTime() - i * 3600 * 1000);
    const hour = ts.getHours();
    // Simulate realistic usage patterns — higher during business hours
    const isBusinessHour = hour >= 8 && hour <= 20;
    const base = isBusinessHour ? 55 : 25;
    usageData.push({
      timestamp: ts,
      cpu: base + Math.random() * 25,
      memory: base + 10 + Math.random() * 15,
      network: (isBusinessHour ? 40 : 15) + Math.random() * 20,
      storage: 60 + Math.random() * 10,
    });
  }
  await prisma.usageSnapshot.createMany({ data: usageData });
  console.log("  ✓ Usage snapshots (24h)");

  // ── Cost Records ──────────────────────────────────
  await prisma.costRecord.createMany({
    data: [
      { provider: "aws", compute: 91.11, storage: 1.03, network: 12.50, other: 5.20, period: "monthly" },
      { provider: "azure", compute: 38.54, storage: 0.19, network: 4.80, other: 2.10, period: "monthly" },
      { provider: "alibaba", compute: 0, storage: 0.48, network: 1.20, other: 0.80, period: "monthly" },
    ],
  });
  console.log("  ✓ Cost records");

  // ── Activity Logs ─────────────────────────────────
  const activities = [
    { type: "instance", action: "start", message: "Instance api-prod-1 started in AWS ap-southeast-1" },
    { type: "storage", action: "upload", message: "3 files uploaded to project-data-lake" },
    { type: "security", action: "update", message: "Security group web-sg rules updated" },
    { type: "instance", action: "stop", message: "Instance worker-batch stopped" },
    { type: "network", action: "create", message: "New subnet private-1b added to prod-vpc" },
  ];

  await prisma.activityLog.createMany({ data: activities });
  console.log("  ✓ Activity logs");

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
