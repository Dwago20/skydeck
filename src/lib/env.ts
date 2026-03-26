// Environment variable validation — runs at import time
// Provides clear error messages for missing required config

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Please check your .env file or deployment configuration.`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] || fallback;
}

// Database — always required
export const DATABASE_URL = requireEnv("DATABASE_URL");

// AWS — optional, enables live S3/EC2 integration
export const AWS_ACCESS_KEY_ID = optionalEnv("AWS_ACCESS_KEY_ID");
export const AWS_SECRET_ACCESS_KEY = optionalEnv("AWS_SECRET_ACCESS_KEY");
export const AWS_REGION = optionalEnv("AWS_REGION", "ap-southeast-1");

// Azure — optional, enables live Blob integration
export const AZURE_STORAGE_CONNECTION_STRING = optionalEnv("AZURE_STORAGE_CONNECTION_STRING");

// Feature flags
export const isAWSConfigured = !!AWS_ACCESS_KEY_ID && !!AWS_SECRET_ACCESS_KEY;
export const isAzureConfigured = !!AZURE_STORAGE_CONNECTION_STRING;
