import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListBucketsCommand,
  type _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  const region = process.env.AWS_REGION || "ap-southeast-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function isS3Configured(): Promise<boolean> {
  return getS3Client() !== null;
}

export async function listBuckets() {
  const client = getS3Client();
  if (!client) return [];

  const command = new ListBucketsCommand({});
  const response = await client.send(command);
  return response.Buckets || [];
}

export async function listObjects(bucket: string, prefix?: string, maxKeys = 100) {
  const client = getS3Client();
  if (!client) return { objects: [], isTruncated: false };

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await client.send(command);
  return {
    objects: response.Contents || [],
    isTruncated: response.IsTruncated || false,
    nextToken: response.NextContinuationToken,
  };
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) {
  const client = getS3Client();
  if (!client) throw new Error("AWS S3 is not configured");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  return client.send(command);
}

export async function deleteObject(bucket: string, key: string) {
  const client = getS3Client();
  if (!client) throw new Error("AWS S3 is not configured");

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return client.send(command);
}

export async function getSignedDownloadUrl(bucket: string, key: string, expiresIn = 3600) {
  const client = getS3Client();
  if (!client) throw new Error("AWS S3 is not configured");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function getSignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 3600
) {
  const client = getS3Client();
  if (!client) throw new Error("AWS S3 is not configured");

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function checkBucketExists(bucket: string): Promise<boolean> {
  const client = getS3Client();
  if (!client) return false;

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch {
    return false;
  }
}
