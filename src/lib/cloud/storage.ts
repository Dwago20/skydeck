import { isS3Configured, listObjects, uploadObject, deleteObject, getSignedDownloadUrl } from "@/lib/aws/s3";
import { isAzureConfigured, listBlobs, uploadBlob, deleteBlob, getBlobDownloadUrl } from "@/lib/azure/blob";

export interface CloudFile {
  key: string;
  size: number;
  lastModified: Date | null;
  provider: "aws" | "azure";
  container: string;
}

export interface CloudStorageProvider {
  name: "aws" | "azure";
  isConfigured(): Promise<boolean>;
  listFiles(container: string, prefix?: string): Promise<CloudFile[]>;
  upload(container: string, key: string, body: Buffer, contentType: string): Promise<void>;
  remove(container: string, key: string): Promise<void>;
  getDownloadUrl(container: string, key: string): Promise<string>;
}

const awsProvider: CloudStorageProvider = {
  name: "aws",

  async isConfigured() {
    return isS3Configured();
  },

  async listFiles(bucket, prefix) {
    const { objects } = await listObjects(bucket, prefix);
    return objects.map((obj) => ({
      key: obj.Key || "",
      size: obj.Size || 0,
      lastModified: obj.LastModified || null,
      provider: "aws" as const,
      container: bucket,
    }));
  },

  async upload(bucket, key, body, contentType) {
    await uploadObject(bucket, key, body, contentType);
  },

  async remove(bucket, key) {
    await deleteObject(bucket, key);
  },

  async getDownloadUrl(bucket, key) {
    return getSignedDownloadUrl(bucket, key);
  },
};

const azureProvider: CloudStorageProvider = {
  name: "azure",

  async isConfigured() {
    return isAzureConfigured();
  },

  async listFiles(container, prefix) {
    const blobs = await listBlobs(container, prefix);
    return blobs.map((blob) => ({
      key: blob.name,
      size: blob.properties.contentLength || 0,
      lastModified: blob.properties.lastModified || null,
      provider: "azure" as const,
      container,
    }));
  },

  async upload(container, key, body, contentType) {
    await uploadBlob(container, key, body, contentType);
  },

  async remove(container, key) {
    await deleteBlob(container, key);
  },

  async getDownloadUrl(container, key) {
    return getBlobDownloadUrl(container, key);
  },
};

export function getStorageProvider(name: "aws" | "azure"): CloudStorageProvider {
  switch (name) {
    case "aws": return awsProvider;
    case "azure": return azureProvider;
    default: throw new Error(`Unknown provider: ${name}`);
  }
}

export async function getConfiguredProviders(): Promise<CloudStorageProvider[]> {
  const results = await Promise.all([
    awsProvider.isConfigured().then((ok) => (ok ? awsProvider : null)),
    azureProvider.isConfigured().then((ok) => (ok ? azureProvider : null)),
  ]);
  return results.filter(Boolean) as CloudStorageProvider[];
}

export async function listFilesAcrossProviders(
  mappings: { provider: "aws" | "azure"; container: string; prefix?: string }[]
): Promise<CloudFile[]> {
  const results = await Promise.all(
    mappings.map(async ({ provider, container, prefix }) => {
      const p = getStorageProvider(provider);
      const configured = await p.isConfigured();
      if (!configured) return [];
      try {
        return await p.listFiles(container, prefix);
      } catch {
        return [];
      }
    })
  );
  return results.flat().sort((a, b) => {
    const aTime = a.lastModified?.getTime() || 0;
    const bTime = b.lastModified?.getTime() || 0;
    return bTime - aTime;
  });
}
