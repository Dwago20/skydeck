import {
  BlobServiceClient,
  ContainerClient,
  type BlobItem,
} from "@azure/storage-blob";

function getBlobServiceClient(): BlobServiceClient | null {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) return null;

  return BlobServiceClient.fromConnectionString(connectionString);
}

export async function isAzureConfigured(): Promise<boolean> {
  return getBlobServiceClient() !== null;
}

export async function listContainers() {
  const client = getBlobServiceClient();
  if (!client) return [];

  const containers: { name: string; properties: Record<string, unknown> }[] = [];
  for await (const container of client.listContainers()) {
    containers.push({
      name: container.name,
      properties: { ...container.properties },
    });
  }
  return containers;
}

export async function listBlobs(containerName: string, prefix?: string) {
  const client = getBlobServiceClient();
  if (!client) return [];

  const containerClient = client.getContainerClient(containerName);
  const blobs: BlobItem[] = [];

  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    blobs.push(blob);
  }
  return blobs;
}

export async function uploadBlob(
  containerName: string,
  blobName: string,
  body: Buffer,
  contentType: string
) {
  const client = getBlobServiceClient();
  if (!client) throw new Error("Azure Blob Storage is not configured");

  const containerClient = client.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  return blockBlobClient.uploadData(body, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
}

export async function deleteBlob(containerName: string, blobName: string) {
  const client = getBlobServiceClient();
  if (!client) throw new Error("Azure Blob Storage is not configured");

  const containerClient = client.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);
  return blobClient.delete();
}

export async function getBlobDownloadUrl(
  containerName: string,
  blobName: string
): Promise<string> {
  const client = getBlobServiceClient();
  if (!client) throw new Error("Azure Blob Storage is not configured");

  const containerClient = client.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);
  return blobClient.url;
}
