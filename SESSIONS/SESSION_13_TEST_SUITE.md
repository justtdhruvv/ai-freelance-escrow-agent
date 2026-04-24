# SESSION 13 — Fix Test Suite So Tests Actually Run

## Priority: MEDIUM
## Estimated effort: 45-60 min

---

## Project Context
The backend has 342 lines of tests in `escrow-service/test/api.test.ts` covering auth, projects,
payments, wallets, submissions, AQA. The tests are well-written but CANNOT RUN because:
1. They import from `dist/src/server` (requires a build step first)
2. No test database isolation (tests hit the real DB)
3. No jest setup/teardown file

This session fixes the test infrastructure so `npm test` works.

---

## Your Scope
**Only touch:**
- `escrow-service/test/api.test.ts`
- `escrow-service/jest.config.ts` (or `jest.config.js` — read first to see which exists)
- `escrow-service/package.json` (test script only)
- Create: `escrow-service/test/jest.setup.ts`

**Do NOT touch:** any src/ files

---

## Read These Files First (in order)
1. `escrow-service/test/api.test.ts` — full file
2. `escrow-service/jest.config.ts` or `jest.config.js` — whichever exists
3. `escrow-service/package.json` — check test script and ts-jest config
4. `escrow-service/knexfile.ts` — check if a test environment is configured
5. `escrow-service/src/server.ts` — the actual entry point

---

## TASK 1: Fix the Import Path

**Problem:** `api.test.ts` imports from `'../dist/src/server'` which requires the app to be
built first. Tests should import directly from source.

**Fix:** Change the import to use `ts-jest` to run TypeScript directly:
```typescript
// Change:
import app from '../dist/src/server';
// To:
import app from '../src/server';
```

Read the file to find the exact import line and change it.

---

## TASK 2: Add Test Database Config to knexfile.ts

Tests need a separate database so they don't corrupt production/dev data.

Read `knexfile.ts` — if a `test` environment doesn't exist, add one:
```typescript
test: {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.TEST_DB_NAME || 'escrow_test',
  },
  migrations: {
    directory: './src/db/migrations',
  },
},
```

Note: This creates a separate `escrow_test` database. The person running tests must create
this database manually: `CREATE DATABASE escrow_test;`

---

## TASK 3: Create jest.setup.ts

Create `escrow-service/test/jest.setup.ts`:
```typescript
import knex from 'knex';
import knexConfig from '../knexfile';

let db: knex.Knex;

beforeAll(async () => {
  // Use test DB
  process.env.NODE_ENV = 'test';
  db = knex(knexConfig['test']);
  // Run migrations on test DB
  await db.migrate.latest();
});

afterAll(async () => {
  // Clean up and close connection
  await db.migrate.rollback(undefined, true);
  await db.destroy();
});
```

---

## TASK 4: Update jest.config.ts

Read the current jest.config. Add the setup file:
```typescript
setupFilesAfterFramework: ['<rootDir>/test/jest.setup.ts'],
```
Also ensure `testEnvironment` is `'node'` and `preset` is `'ts-jest'`.

If the config imports from dist or has any build-related paths, fix them to point to src.

---

## TASK 5: Update package.json test script

Find the `"test"` script in package.json. Make sure it doesn't require a build step:
```json
"test": "jest --forceExit --detectOpenHandles",
"test:watch": "jest --watch"
```

Remove any `tsc &&` prefix that would require building first.

---

## Completion Checklist
- [ ] Read api.test.ts — understand all imports and what it's testing
- [ ] api.test.ts: import changed from dist/src/server to src/server
- [ ] knexfile.ts: test environment added
- [ ] test/jest.setup.ts created with beforeAll/afterAll DB lifecycle
- [ ] jest.config.ts: setupFilesAfterFramework points to jest.setup.ts
- [ ] package.json: test script runs without build step
- [ ] Run `npm test` — verify it starts (even if some tests fail, the suite should run)

---

## PROMPT TO USE

```
Working directory: d:/khyber/ai-freelance-escrow-agent
Session: SESSIONS/SESSION_13_TEST_SUITE.md

Read SESSIONS/INDEX.md then read the session file above completely, then read every file in its "Read These Files First" list. Only then start making changes.

Rules:
- Only touch files listed in "Your Scope" in the session file
- Work through the checklist one item at a time
- Do not refactor any test logic — only fix infrastructure/imports
- Do not touch any src/ files
- End by confirming every checklist item is complete and running npm test
```
