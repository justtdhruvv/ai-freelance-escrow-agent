# AI Freelance Escrow Service

A clean backend architecture for an AI-managed freelance escrow platform built with TypeScript, Node.js, Express, MySQL, and Knex.js.

## Tech Stack

- **Node.js** - Runtime environment
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **MySQL** - Database
- **Knex.js** - Query builder + migrations
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **dotenv** - Environment variables

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MySQL database

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your database configuration
```

### Database Setup

```bash
# Run migrations
npm run knex:migrate

# Run seeds (optional)
npm run knex:seed
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run knex:migrate` - Run database migrations
- `npm run knex:migrate:rollback` - Rollback last migration
- `npm run knex:seed` - Run database seeds
- `npm run knex:make:migration <name>` - Create new migration
- `npm run knex:make:seed <name>` - Create new seed

## Project Structure

```
src/
├── app.ts              # Express app configuration
├── server.ts           # Server entry point
├── config/
│   └── database.ts     # Database connection
├── modules/
│   ├── auth/           # Authentication module
│   ├── users/          # Users module
│   ├── projects/       # Projects module
│   ├── milestones/     # Milestones module
│   ├── escrow/         # Escrow module
│   └── payments/       # Payments module
├── middlewares/        # Custom middlewares
├── routes/             # API routes
│   └── health.ts       # Health check route
├── utils/              # Utility functions
└── db/
    ├── migrations/     # Database migrations
    └── seeds/          # Database seeds
```

## Environment Variables

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=escrow_dev

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "status": "ok"
}
```

## License

ISC
