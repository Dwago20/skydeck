import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isEC2Configured, listVpcs, listSubnets, listSecurityGroups } from "@/lib/aws/ec2";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");

  try {
    const ec2Live = await isEC2Configured();

    if (ec2Live && (!provider || provider === "aws")) {
      const [awsVpcs, awsSubnets, awsSGs] = await Promise.all([
        listVpcs(),
        listSubnets(),
        listSecurityGroups(),
      ]);

      const vpcs = awsVpcs.map((vpc) => {
        const vpcSubnets = awsSubnets.filter((s) => s.VpcId === vpc.VpcId);
        const vpcSGs = awsSGs.filter((sg) => sg.VpcId === vpc.VpcId);

        return {
          id: vpc.VpcId,
          name: vpc.Tags?.find((t) => t.Key === "Name")?.Value || vpc.VpcId,
          provider: "aws",
          cidr: vpc.CidrBlock,
          region: process.env.AWS_REGION || "ap-southeast-1",
          status: vpc.State || "available",
          subnets: vpcSubnets.map((s) => ({
            id: s.SubnetId,
            name: s.Tags?.find((t) => t.Key === "Name")?.Value || s.SubnetId,
            cidr: s.CidrBlock,
            availabilityZone: s.AvailabilityZone,
            isPublic: s.MapPublicIpOnLaunch || false,
            instanceCount: 0,
          })),
          securityGroups: vpcSGs.map((sg) => ({
            id: sg.GroupId,
            name: sg.GroupName,
            provider: "aws",
            inboundRules: sg.IpPermissions?.length || 0,
            outboundRules: sg.IpPermissionsEgress?.length || 0,
          })),
        };
      });

      const totalSubnets = vpcs.reduce((s, v) => s + v.subnets.length, 0);
      const publicSubnets = vpcs.reduce((s, v) => s + v.subnets.filter((sub) => sub.isPublic).length, 0);

      return NextResponse.json({
        vpcs,
        securityGroups: awsSGs.map((sg) => ({
          id: sg.GroupId,
          name: sg.GroupName,
          provider: "aws",
          inboundRules: sg.IpPermissions?.length || 0,
          outboundRules: sg.IpPermissionsEgress?.length || 0,
        })),
        stats: {
          totalVpcs: vpcs.length,
          totalSubnets,
          publicSubnets,
          privateSubnets: totalSubnets - publicSubnets,
          totalSecurityGroups: awsSGs.length,
        },
        source: "aws-ec2",
      });
    }

    // Fallback to database
    const where = provider ? { provider } : undefined;

    const [vpcs, securityGroups] = await Promise.all([
      prisma.vpc.findMany({
        where,
        include: { subnets: true, securityGroups: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.securityGroup.findMany({ where, orderBy: { name: "asc" } }),
    ]);

    const totalSubnets = vpcs.reduce((s, v) => s + v.subnets.length, 0);
    const publicSubnets = vpcs.reduce((s, v) => s + v.subnets.filter((sub) => sub.isPublic).length, 0);

    return NextResponse.json({
      vpcs,
      securityGroups,
      stats: {
        totalVpcs: vpcs.length,
        totalSubnets,
        publicSubnets,
        privateSubnets: totalSubnets - publicSubnets,
        totalSecurityGroups: securityGroups.length,
      },
      source: "database",
    });
  } catch (error) {
    console.error("Network API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
