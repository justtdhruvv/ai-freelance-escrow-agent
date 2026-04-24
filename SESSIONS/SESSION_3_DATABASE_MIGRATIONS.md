# SESSION 3 — Fix Missing Database Migrations

## Priority: CRITICAL
## Estimated effort: 60-90 min

---

## Project Context
This is an AI Freelance Escrow platform. The backend uses Knex.js for DB migrations with MySQL 8.
The migrations live at `escrow-service/src/db/migrations/`.

CRITICAL PROBLEM: The `users` and `projects` tables have NO creation migration — only ALTER
statements. The wallet tables also have no Knex migration, only an orphaned raw SQL file.
If someone clones the repo and runs `npm run knex:migrate`, the database CANNOT be set up
from scratch because the base tables don't exist.

There are 11 existing migration files but they only contain ALTER TABLE statements. You must
create the MISSING initial CREATE TABLE migrations.

---

## Your Scope
**Only touch files in:** `escrow-service/src/db/migrations/` and `escrow-service/src/db/`
**Do NOT touch:** any service/controller files, frontend/, or ai-agent/

---

## Read These Files First (in order)
1. ALL existing migration files in `escrow-service/src/db/migrations/` (read all of them)
2. `escrow-service/knexfile.ts` — migration config
3. `escrow-service/src/config/database.ts` — db connection
4. `escrow-service/src/modules/auth/auth.service.ts` — infer users table schema
5. `escrow-service/src/modules/projects/project.service.ts` — infer projects table schema
6. `escrow-service/src/modules/wallets/wallet.service.ts` — infer wallet tables schema
7. `escrow-service/src/modules/clients/client.service.ts` — infer client_briefs schema
8. Any `.sql` files in the repo root or `database/` directory

---

## What's Missing

### Tables that need CREATE migrations (infer schema from service files)

**1. users**
Infer columns from: `auth.service.ts` (createUser, findUserByEmail),
`payment.service.ts` (updatePfiScore), migration ALTER files
Known columns: user_id (uuid PK), email (varchar unique), password_hash (varchar 255),
role (enum: employer/freelancer), pfi_score (int default 500), trust_score (int default 500),
pfi_history (json nullable), grace_period_active (boolean default false),
razorpay_account_id (varchar nullable), stripe_account_id (varchar nullable),
github_token (text nullable), created_at (timestamp)

**2. projects**
Infer from: `project.service.ts`, migration ALTER files
Known columns: project_id (uuid PK), name (varchar), description (text nullable),
employer_id (uuid FK→users), freelancer_id (uuid FK→users nullable), status (enum),
total_price (int), timeline_days (int nullable), razorpay_order_id (varchar nullable),
escrow_balance (int default 0), created_at (timestamp)
Note: status enum values — look at project.service.ts for all possible statuses

**3. client_briefs**
Infer from: `escrow-service/src/modules/clients/` or `clientBrief` service
Known columns: brief_id (uuid PK), project_id (uuid FK→projects), raw_text (text),
domain (varchar), ai_processed (boolean default false),
ai_generated_requirements (json nullable), created_at (timestamp)

**4. freelancer_wallets**
Infer from: `wallet.service.ts`
Known columns: wallet_id (uuid PK), freelancer_id (uuid FK→users unique),
balance (int default 0), available_balance (int default 0), pending_balance (int default 0),
wallet_type (enum: internal/real default internal), created_at (timestamp)

**5. wallet_transactions**
Infer from: `wallet.service.ts` — look at what fields it inserts
Known columns: transaction_id (uuid PK), wallet_id (uuid FK→wallets), type (enum),
amount (int), description (text nullable), reference_id (varchar nullable),
milestone_id (uuid nullable), created_at (timestamp)

**6. wallet_conversions**
Infer from: `wallet.service.ts` — look at convertToRealMoney() and getConversionStatus()
Known columns: conversion_id (uuid PK), wallet_id (uuid FK→wallets), amount_credits (int),
amount_real (decimal), fee (int), status (enum: pending/completed/failed default pending),
created_at (timestamp)

---

## Migration File Naming Convention
Look at existing migration files to match the naming pattern.
The existing pattern is: `YYYYMMDDHHMMSS_description.ts`

New migrations must have timestamps BEFORE the oldest existing migration so they run first.
Check the oldest existing migration timestamp and use timestamps earlier than that.

## Knex Migration Template
```typescript
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('table_name', (table) => {
    table.uuid('id').primary();
    // ... columns
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('table_name');
}
```

## Important Notes
- `users` and `projects` must be created BEFORE any other table (others FK reference them)
- `freelancer_wallets` must come AFTER users
- `wallet_transactions` and `wallet_conversions` must come AFTER freelancer_wallets
- `client_briefs` must come AFTER projects
- Read existing migration ALTER files carefully — they tell you what columns were added later,
  so the CREATE migration should include those columns from the start
- Do NOT add `ALTER TABLE` migrations for columns that are already in your new CREATE migration

## Verify Existing Migrations Still Work
After creating the new ones, check that the existing ALTER migrations won't fail.
If an ALTER migration tries to add a column that's now in the CREATE migration,
modify the ALTER migration to check `hasColumn` first, or note the conflict.

---

## Completion Checklist
- [ ] Read all existing migrations to understand what already exists
- [ ] Read service files to infer complete column lists
- [ ] Create migration for `users` table (earliest timestamp)
- [ ] Create migration for `projects` table (after users)
- [ ] Create migration for `client_briefs` table (after projects)
- [ ] Create migration for `freelancer_wallets` table (after users)
- [ ] Create migration for `wallet_transactions` table (after wallets)
- [ ] Create migration for `wallet_conversions` table (after wallets)
- [ ] Migration timestamps ordered so CREATE runs before ALTER
- [ ] Each migration has both `up` and `down` functions
- [ ] Raw SQL file (escrow-sql.sql or similar) is NOT deleted but noted as legacy

---

## PROMPT TO USE (paste this into your Claude session)

```
You are working on the database layer of an AI Freelance Escrow platform. The backend uses
Knex.js for migrations with MySQL 8. The migrations are at escrow-service/src/db/migrations/.

CRITICAL PROBLEM: The database cannot be set up from scratch because core tables (users, projects,
wallets, client_briefs) have no CREATE TABLE migrations — only ALTER TABLE migrations exist.

Your job is to create the missing CREATE TABLE Knex migration files by inferring the schemas
from the existing service files.

Read the full session file at SESSIONS/SESSION_3_DATABASE_MIGRATIONS.md first — it lists all
missing tables, known column sets, and migration ordering requirements.

RULES:
- Read ALL existing migration files first to understand what's already there
- Read the service files listed to infer missing column details
- Only create files in escrow-service/src/db/migrations/
- Follow the exact timestamp naming convention from existing files
- CREATE migrations must have earlier timestamps than ALTER migrations
- Every migration needs both up() and down() functions
- Do NOT touch any service, controller, or frontend files
- Work through the checklist one item at a time, confirming each table before the next
```
