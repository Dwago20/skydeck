import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAzureConfigured, listBlobs, listContainers, uploadBlob, deleteBlob } from "@/lib/azure/blob";

export async function GET(req: NextRequest) {
  const containerName = req.nextUrl.searchParams.get("container");

  try {
    const azureLive = await isAzureConfigured();

    if (containerName) {
      if (azureLive) {
        const blobs = await listBlobs(containerName);
        return NextResponse.json({
          container: containerName,
          blobs: blobs.map((b) => ({
            name: b.name,
            size: b.properties.contentLength,
            contentType: b.properties.contentType,
            lastModified: b.properties.lastModified,
          })),
          source: "azure-blob",
        });
      }

      const bucket = await prisma.bucket.findFirst({
        where: { name: containerName, provider: { name: "azure" } },
        include: { files: true, provider: true },
      });
      if (!bucket) return NextResponse.json({ error: "Container not found" }, { status: 404 });
      return NextResponse.json({ container: bucket, source: "database" });
    }

    if (azureLive) {
      const containers = await listContainers();
      return NextResponse.json({ containers, source: "azure-blob" });
    }

    const containers = await prisma.bucket.findMany({
      where: { provider: { name: "azure" } },
      include: { provider: true, _count: { select: { files: true } } },
      orderBy: { createdAt: "desc" },
    });

    const totalSize = containers.reduce((s, c) => s + Number(c.sizeBytes), 0);
    const totalObjects = containers.reduce((s, c) => s + c.objectCount, 0);

    return NextResponse.json({
      containers,
      stats: { totalContainers: containers.length, totalSize, totalObjects },
      source: "database",
    });
  } catch (error) {
    console.error("Azure API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const containerName = formData.get("bucket") as string | null;
      const keyPrefix = (formData.get("prefix") as string) || "";

      if (!file || !containerName) {
        return NextResponse.json({ error: "file and bucket (container) are required" }, { status: 400 });
      }

      const key = keyPrefix ? `${keyPrefix}/${file.name}` : file.name;
      const buffer = Buffer.from(await file.arrayBuffer());

      const azureLive = await isAzureConfigured();
      if (azureLive) {
        await uploadBlob(containerName, key, buffer, file.type || "application/octet-stream");

        await prisma.activityLog.create({
          data: { type: "storage", action: "upload", message: `File ${key} uploaded to Azure container ${containerName}` },
        });

        return NextResponse.json({ key, container: containerName, size: file.size, source: "azure-blob" }, { status: 201 });
      }

      // Fallback: save metadata to database
      const bucket = await prisma.bucket.findFirst({
        where: { name: containerName, provider: { name: "azure" } },
        include: { provider: true },
      });

      if (!bucket) return NextResponse.json({ error: "Container not found" }, { status: 404 });

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
        data: { type: "storage", action: "upload", message: `File ${key} uploaded to ${containerName} (demo mode)` },
      });

      return NextResponse.json({ file: { ...dbFile, sizeBytes: dbFile.sizeBytes.toString() }, source: "database" }, { status: 201 });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  } catch (error) {
    console.error("Azure upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const containerName = req.nextUrl.searchParams.get("container");
  const blobName = req.nextUrl.searchParams.get("blob");

  if (!containerName || !blobName) {
    return NextResponse.json({ error: "container and blob are required" }, { status: 400 });
  }

  try {
    const azureLive = await isAzureConfigured();
    if (azureLive) {
      await deleteBlob(containerName, blobName);
    }

    const bucket = await prisma.bucket.findFirst({
      where: { name: containerName, provider: { name: "azure" } },
    });

    if (bucket) {
      const file = await prisma.storageFile.findFirst({
        where: { bucketId: bucket.id, key: blobName },
      });
      if (file) {
        await prisma.storageFile.delete({ where: { id: file.id } });
        await prisma.bucket.update({
          where: { id: bucket.id },
          data: { objectCount: { decrement: 1 } },
        });
      }
    }

    await prisma.activityLog.create({
      data: { type: "storage", action: "delete", message: `Blob ${blobName} deleted from Azure container ${containerName}` },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Azure delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
