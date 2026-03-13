# NestJS Module Generation Commands

## Prisma Commands

```bash
# Initialize Prisma (already done)
pnpm prisma init

# Generate Prisma client
pnpm prisma generate

# Create database migration
pnpm prisma migrate dev --name init

# View database in Prisma Studio
pnpm prisma studio
```

## NestJS CLI Module Generation Commands

### Users Module
```bash
# Generate users module components
npx @nestjs/cli generate module users
npx @nestjs/cli generate controller users
npx @nestjs/cli generate service users
npx @nestjs/cli generate dto users
```

### Projects Module
```bash
# Generate projects module components
npx @nestjs/cli generate module projects
npx @nestjs/cli generate controller projects
npx @nestjs/cli generate service projects
npx @nestjs/cli generate dto projects
```

### Milestones Module
```bash
# Generate milestones module components
npx @nestjs/cli generate module milestones
npx @nestjs/cli generate controller milestones
npx @nestjs/cli generate service milestones
npx @nestjs/cli generate dto milestones
```

### Escrow Module
```bash
# Generate escrow module components
npx @nestjs/cli generate module escrow
npx @nestjs/cli generate controller escrow
npx @nestjs/cli generate service escrow
npx @nestjs/cli generate dto escrow
```

### Payments Module
```bash
# Generate payments module components
npx @nestjs/cli generate module payments
npx @nestjs/cli generate controller payments
npx @nestjs/cli generate service payments
npx @nestjs/cli generate dto payments
```

### Transactions Module
```bash
# Generate transactions module components
npx @nestjs/cli generate module transactions
npx @nestjs/cli generate controller transactions
npx @nestjs/cli generate service transactions
npx @nestjs/cli generate dto transactions
```

## Development Commands

```bash
# Start development server
pnpm run start:dev

# Build application
pnpm run build

# Start production server
pnpm run start:prod

# Run tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Lint code
pnpm lint
```

## Database Setup

### PostgreSQL Setup Commands

```bash
# Create database (using psql)
createdb escrow_wallet_service

# Or using Docker
docker run --name postgres-escrow -e POSTGRES_PASSWORD=password -e POSTGRES_DB=escrow_wallet_service -p 5432:5432 -d postgres
```

### Environment Configuration

1. Copy `.env.example` to `.env`
2. Update the `DATABASE_URL` with your PostgreSQL connection string
3. Configure other environment variables as needed

## Project Structure

```
src/
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   └── validation.config.ts
├── modules/
│   ├── users/
│   ├── projects/
│   ├── milestones/
│   ├── escrow/
│   ├── payments/
│   └── transactions/
├── utils/
├── app.controller.ts
├── app.module.ts
└── main.ts

prisma/
└── schema.prisma
```
