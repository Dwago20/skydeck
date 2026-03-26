import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  type Instance,
  type Vpc,
  type Subnet,
  type SecurityGroup,
} from "@aws-sdk/client-ec2";

function getEC2Client() {
  const region = process.env.AWS_REGION || "ap-southeast-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) return null;

  return new EC2Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function isEC2Configured(): Promise<boolean> {
  return getEC2Client() !== null;
}

export async function listInstances() {
  const client = getEC2Client();
  if (!client) return [];

  const command = new DescribeInstancesCommand({});
  const response = await client.send(command);

  const instances: Instance[] = [];
  for (const reservation of response.Reservations || []) {
    for (const instance of reservation.Instances || []) {
      instances.push(instance);
    }
  }
  return instances;
}

export async function startInstance(instanceId: string) {
  const client = getEC2Client();
  if (!client) throw new Error("AWS EC2 is not configured");

  const command = new StartInstancesCommand({ InstanceIds: [instanceId] });
  return client.send(command);
}

export async function stopInstance(instanceId: string) {
  const client = getEC2Client();
  if (!client) throw new Error("AWS EC2 is not configured");

  const command = new StopInstancesCommand({ InstanceIds: [instanceId] });
  return client.send(command);
}

export async function listVpcs() {
  const client = getEC2Client();
  if (!client) return [];

  const command = new DescribeVpcsCommand({});
  const response = await client.send(command);
  return response.Vpcs || [];
}

export async function listSubnets(vpcId?: string) {
  const client = getEC2Client();
  if (!client) return [];

  const filters = vpcId ? [{ Name: "vpc-id", Values: [vpcId] }] : undefined;
  const command = new DescribeSubnetsCommand({ Filters: filters });
  const response = await client.send(command);
  return response.Subnets || [];
}

export async function listSecurityGroups(vpcId?: string) {
  const client = getEC2Client();
  if (!client) return [];

  const filters = vpcId ? [{ Name: "vpc-id", Values: [vpcId] }] : undefined;
  const command = new DescribeSecurityGroupsCommand({ Filters: filters });
  const response = await client.send(command);
  return response.SecurityGroups || [];
}
