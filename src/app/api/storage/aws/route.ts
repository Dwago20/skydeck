import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isS3Configured,
  listObjects,
  listBuckets,
  uploadObject,
  deleteObject,
  getSignedDownloadUrl,
} from "@/lib/aws/s3";

export async function GET(req: NextRequest) {
  const bucketName = req.nextUrl.searchParams.get("bucket");
  const action = req.nextUrl.searchParams.get("action");

  try {
    const s3Live = await isS3Configured();

    // If requesting a download URL
    if (action === "download" && bucketName) {
      const key = req.nextUrl.searchParams.get("key");
      if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

      if (s3Live) {
        const url = await getSignedDownloadUrl(bucketName, key);
        return NextResponse.json({ url });
      }
      return NextResponse.json({ error: "S3 not configured — download unavailable in demo mode" }, { status: 503 });
    }

    // If requesting files from a specific bucket
    if (bucketName) {
      if (s3Live) {
        const prefix = req.nextUrl.searchParams.get("prefix") || undefined;
        const { objects, isTruncated } = await listObjects(bucketName, prefix);
        return NextResponse.json({ bucket: bucketName, objects, isTruncated, source: "aws-s3" });
      }

      const bucket = await prisma.bucket.findFirst({
        where: { name: bucketName, provider: { name: "aws" } },
        include: { files: true, provider: true },
      });
      if (!bucket) return NextResponse.json({ error: "Bucket not found" }, { status: 404 });
      return NextResponse.json({ bucket, source: "database" });
    }

    // List all buckets
    if (s3Live) {
      const awsBuckets = await listBuckets();
      return NextResponse.json({
        buckets: awsBuckets.map((b) => ({
          name: b.Name,
          createdAt: b.CreationDate,
        })),
        source: "aws-s3",
      });
    }

    // Fallback to database
    const buckets = await prisma.bucket.findMany({
      where: { provider: { name: "aws" } },
      include: { provider: true, _count: { select: { files: true } } },
      orderBy: { createdAt: "desc" },
    });

    const totalSize = buckets.reduce((s, b) => s + Number(b.sizeBytes), 0);
    const totalObjects = buckets.reduce((s, b) => s + b.objectCount, 0);
    const totalCost = buckets.reduce((s, b) => s + b.monthlyCost, 0);

    return NextResponse.json({
      buckets,
      stats: { totalBuckets: buckets.length, totalSize, totalObjects, totalCost },
      source: "database",
    });
  } catch (error) {
    console.error("S3 API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Handle multipart file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const bucketName = formData.get("bucket") as string | null;
      const keyPrefix = (formData.get("prefix") as string) || "";

      if (!file || !bucketName) {
        return NextResponse.json({ error: "file and bucket are required" }, { status: 400 });
      }

      const key = keyPrefix ? `${keyPrefix}/${file.name}` : file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      const s3Live = await isS3Configured();
      if (s3Live) {
        await uploadObject(bucketName, key, buffer, file.type || "application/octet-stream");

        await prisma.activityLog.create({
          data: { type: "storage", action: "upload", message: `File ${key} uploaded to S3 bucket ${bucketName}` },
        });

        return NextResponse.json({ key, bucket: bucketName, size: file.size, source: "aws-s3" }, { status: 201 });
      }

      // Fallback: save metadata to database
      const bucket = await prisma.bucket.findFirst({
        where: { name: bucketName, provider: { name: "aws" } },
        include: { provider: true },
      });

      if (!bucket) return NextResponse.json({ error: "Bucket not found" }, { status: 404 });

      const dbFile = await prisma.storageFile.create({
        data: {
          key,
          sizeBytes: BigInt(file.size),
          contentType: file.type || "application/octet-stream",
          bucketId: bucket.id,
          providerId: bucket.providerId,
        },
      });

      await prisma.bucket.update({
        where: { id: bucket.id },
        data: { objectCount: { increment: 1 }, sizeBytes: bucket.sizeBytes + BigInt(file.size) },
      });

      await prisma.activityLog.create({
        data: { type: "storage", action: "upload", message: `File ${key} uploaded to ${bucketName} (demo mode)` },
      });

      return NextResponse.json({ file: { ...dbFile, sizeBytes: dbFile.sizeBytes.toString() }, source: "database" }, { status: 201 });
    }

    // Handle JSON body (for simple metadata creation)
    const body = await req.json();
    const { key, bucketName, sizeBytes, contentType: fileType } = body;

    const bucket = await prisma.bucket.findFirst({
      where: { name: bucketName, provider: { name: "aws" } },
      include: { provider: true },
    });

    if (!bucket) return NextResponse.json({ error: "Bucket not found" }, { status: 404 });

    const dbFile = await prisma.storageFile.create({
      data: {
        key,
        sizeBytes: BigInt(sizeBytes || 0),
        contentType: fileType || "application/octet-stream",
        bucketId: bucket.id,
        providerId: bucket.providerId,
      },
    });

    return NextResponse.json({ file: { ...dbFile, sizeBytes: dbFile.sizeBytes.toString() } }, { status: 201 });
  } catch (error) {
    console.error("S3 upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const bucketName = req.nextUrl.searchParams.get("bucket");
  const key = req.nextUrl.searchParams.get("key");

  if (!bucketName || !key) {
    return NextResponse.json({ error: "bucket and key are required" }, { status: 400 });
  }

  try {
    const s3Live = await isS3Configured();
    if (s3Live) {
      await deleteObject(bucketName, key);
    }

    // Also remove from database if exists
    const bucket = await prisma.bucket.findFirst({
      where: { name: bucketName, provider: { name: "aws" } },
    });

    if (bucket) {
      const file = await prisma.storageFile.findFirst({
        where: { bucketId: bucket.id, key },
      });

      if (file) {
        await prisma.storageFile.delete({ where: { id: file.id } });
        await prisma.bucket.update({
          where: { id: bucket.id },
          data: { objectCount: { decrement: 1 }, sizeBytes: { decrement: Number(file.sizeBytes) > 0 ? file.sizeBytes : BigInt(0) } },
        });
      }
    }

    await prisma.activityLog.create({
      data: { type: "storage", action: "delete", message: `File ${key} deleted from ${bucketName}` },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("S3 delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
