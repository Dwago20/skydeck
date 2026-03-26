import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isEC2Configured, listInstances, startInstance, stopInstance } from "@/lib/aws/ec2";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  const status = req.nextUrl.searchParams.get("status");

  try {
    const ec2Live = await isEC2Configured();

    if (ec2Live && (!provider || provider === "aws")) {
      const awsInstances = await listInstances();
      const mapped = awsInstances.map((i) => ({
        id: i.InstanceId,
        externalId: i.InstanceId,
        name: i.Tags?.find((t) => t.Key === "Name")?.Value || i.InstanceId,
        type: i.InstanceType,
        status: i.State?.Name || "unknown",
        region: i.Placement?.AvailabilityZone?.slice(0, -1) || process.env.AWS_REGION,
        publicIp: i.PublicIpAddress || null,
        privateIp: i.PrivateIpAddress || "N/A",
        cpu: i.CpuOptions?.CoreCount || 1,
        memory: 0,
        monthlyCost: 0,
        launchTime: i.LaunchTime?.toISOString(),
        provider: { id: "aws", name: "aws", label: "AWS" },
      }));

      const filtered = status ? mapped.filter((i) => i.status === status) : mapped;
      const running = filtered.filter((i) => i.status === "running").length;

      return NextResponse.json({
        instances: filtered,
        stats: {
          total: filtered.length,
          running,
          stopped: filtered.filter((i) => i.status === "stopped").length,
          totalCpu: filtered.filter((i) => i.status === "running").reduce((s, i) => s + i.cpu, 0),
          totalMemory: 0,
          totalCost: 0,
        },
        source: "aws-ec2",
      });
    }

    // Fallback to database
    const where: Record<string, unknown> = {};
    if (provider) where.provider = { name: provider };
    if (status) where.status = status;

    const instances = await prisma.instance.findMany({
      where,
      include: { provider: true },
      orderBy: { launchTime: "desc" },
    });

    const stats = {
      total: instances.length,
      running: instances.filter((i) => i.status === "running").length,
      stopped: instances.filter((i) => i.status === "stopped").length,
      totalCpu: instances.filter((i) => i.status === "running").reduce((s, i) => s + i.cpu, 0),
      totalMemory: instances.filter((i) => i.status === "running").reduce((s, i) => s + i.memory, 0),
      totalCost: instances.reduce((s, i) => s + i.monthlyCost, 0),
    };

    return NextResponse.json({ instances, stats, source: "database" });
  } catch (error) {
    console.error("Compute API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 });
    }

    const ec2Live = await isEC2Configured();

    // Try real AWS first
    if (ec2Live) {
      const dbInstance = await prisma.instance.findUnique({ where: { id } });
      const externalId = dbInstance?.externalId || id;

      try {
        if (action === "start") await startInstance(externalId);
        else if (action === "stop") await stopInstance(externalId);
        else return NextResponse.json({ error: "Invalid action" }, { status: 400 });

        await prisma.activityLog.create({
          data: { type: "instance", action, message: `Instance ${externalId} ${action === "start" ? "started" : "stopped"} via AWS EC2 API` },
        });

        return NextResponse.json({ success: true, instanceId: externalId, source: "aws-ec2" });
      } catch (awsError) {
        console.error("AWS EC2 action failed, falling back to DB:", awsError);
      }
    }

    // Fallback to database
    const newStatus = action === "start" ? "running" : action === "stop" ? "stopped" : null;
    if (!newStatus) {
      return NextResponse.json({ error: "Invalid action. Use 'start' or 'stop'" }, { status: 400 });
    }

    const instance = await prisma.instance.update({
      where: { id },
      data: { status: newStatus },
      include: { provider: true },
    });

    await prisma.activityLog.create({
      data: { type: "instance", action, message: `Instance ${instance.name} ${action === "start" ? "started" : "stopped"} (demo mode)` },
    });

    return NextResponse.json({ instance, source: "database" });
  } catch (error) {
    console.error("Compute PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
