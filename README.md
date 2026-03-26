# SkyDeck — Multi-Cloud Infrastructure Management Portal

A multi-cloud infrastructure management portal that integrates with AWS and Azure through their SDKs. Manages cloud storage (S3 / Azure Blob), monitors compute instances (EC2), and visualizes VPC networking — all through a unified dashboard.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SkyDeck Portal                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ Storage  │  │ Compute  │  │ Network  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       └──────────────┴──────────────┴──────────────┘        │
│                         API Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/assets  /api/storage  /api/compute  /api/network│  │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────┴───────────────────────────────┐   │
│  │           Cloud Provider Abstraction Layer            │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  AWS SDK     │  │  Azure SDK   │  │  Database  │  │   │
│  │  │  (S3, EC2)   │  │  (Blob)      │  │  (Prisma)  │  │   │
│  │  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │   │
│  └─────────┼────────────────┼─────────────────┼─────────┘   │
└────────────┼────────────────┼─────────────────┼─────────────┘
             │                │                 │
     ┌───────▼──────┐  ┌─────▼────────┐  ┌─────▼──────┐
     │   AWS Cloud   │  │  Azure Cloud  │  │  SQLite DB  │
     │  S3, EC2, VPC │  │  Blob Storage │  │  (fallback) │
     └──────────────┘  └──────────────┘  └─────────────┘
```

## Tech Stack

| Layer          | Technology                              |
|----------------|----------------------------------------|
| Framework      | Next.js 16 (App Router)                |
| Styling        | TailwindCSS 4                          |
| Database       | SQLite via Prisma 5                    |
| AWS            | S3, EC2, VPC (AWS SDK v3)              |
| Azure          | Blob Storage (Azure Storage SDK)       |
| Charts         | Recharts                               |
| Icons          | Lucide React                           |
| DevOps         | Docker, GitHub Actions                 |
| IaC            | Terraform (AWS + Azure)                |

## Getting Started

```bash
# Install dependencies
npm install

# Generate Prisma client and create database
npx prisma generate
npx prisma db push

# Seed with demo data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloud Configuration

The portal works in **demo mode** (SQLite database) by default. To connect real cloud providers, configure environment variables in `.env`:

### AWS
```env
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET=your-bucket
```

### Azure
```env
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
```

When credentials are present, the portal automatically switches from database fallback to live cloud APIs.

## Docker

```bash
# Build and run
cd docker
docker-compose up --build

# Or build image directly
docker build -f docker/Dockerfile -t skydeck .
docker run -p 3000:3000 skydeck
```

## Terraform

```bash
# AWS Infrastructure
cd infrastructure/terraform/aws
terraform init
terraform plan
terraform apply

# Azure Infrastructure
cd infrastructure/terraform/azure
terraform init
terraform plan
terraform apply
```

## Project Structure

```
skydeck/
├── src/
│   ├── app/                    # Next.js pages + API routes
│   │   ├── api/
│   │   │   ├── assets/         # Unified asset API
│   │   │   ├── compute/        # EC2 instance management
│   │   │   ├── network/        # VPC/subnet info
│   │   │   └── storage/
│   │   │       ├── aws/        # S3 operations
│   │   │       └── azure/      # Blob operations
│   │   ├── compute/            # Compute dashboard
│   │   ├── network/            # Network visualization
│   │   └── storage/            # Storage management
│   ├── components/             # Reusable UI components
│   └── lib/
│       ├── aws/                # AWS SDK clients (S3, EC2)
│       ├── azure/              # Azure SDK client (Blob)
│       ├── cloud/              # Provider abstraction layer
│       ├── api.ts              # Frontend fetch utilities
│       ├── db.ts               # Prisma client
│       ├── mock-data.ts        # Type definitions + mock data
│       └── utils.ts            # Shared utilities
├── infrastructure/
│   └── terraform/
│       ├── aws/                # VPC, S3, EC2, IAM, SG
│       └── azure/              # RG, Storage, VNet, NSG
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .github/workflows/
│   └── deploy.yml              # CI/CD pipeline
└── prisma/
    ├── schema.prisma           # Database schema
    └── seed.ts                 # Demo data seeder
```
