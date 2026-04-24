# SESSION 14 — Docker + Production Deployment Setup

## Priority: HIGH for production
## Estimated effort: 60-90 min

---

## Project Context
The app has 3 services that all need to run together:
- Frontend: Next.js 16 (port 3001)
- Backend: Node.js/Express/TypeScript (port 3000)
- AI Service: Python/FastAPI (port 8001)
- Database: MySQL 8

Currently there is NO Docker setup. Deploying requires manually starting 3 services + a DB.
This session creates Dockerfiles + docker-compose.yml so the entire stack runs with one command:
`docker-compose up`

---

## Your Scope
**Create these new files:**
- `escrow-service/Dockerfile`
- `frontend/Dockerfile`
- `ai-agent/Dockerfile`
- `docker-compose.yml` (at repo root)
- `.dockerignore` files for each service

**Do NOT touch:** any source code files

---

## Read These Files First (in order)
1. `escrow-service/package.json` — for build/start scripts
2. `frontend/package.json` — for build/start scripts
3. `ai-agent/requirements.txt` — for Python deps
4. `escrow-service/.env.example` — for required env vars
5. `frontend/.env.example` — for required env vars
6. `ai-agent/.env.example` — for required env vars
7. `escrow-service/knexfile.ts` — for DB config to know what env vars to pass

---

## TASK 1: Create escrow-service/Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/src/server.js"]
```

Check `package.json` for the actual `build` and `start` script names before writing.
If start script is different, use that. The build output directory might be `dist/` — verify
in package.json or tsconfig.json.

---

## TASK 2: Create escrow-service/.dockerignore

```
node_modules
dist
.env
*.log
coverage
```

---

## TASK 3: Create frontend/Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build args for env vars needed at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3001
ENV PORT=3001

CMD ["node", "server.js"]
```

Note: Next.js standalone output requires `output: 'standalone'` in next.config.js.
Read `frontend/next.config.js` or `next.config.ts` — if `output: 'standalone'` is not there,
add it to the Next.js config file.

---

## TASK 4: Create frontend/.dockerignore

```
node_modules
.next
.env.local
*.log
```

---

## TASK 5: Create ai-agent/Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

Check `ai-agent/main.py` for the actual FastAPI app variable name (it might be `app`).

---

## TASK 6: Create ai-agent/.dockerignore

```
__pycache__
*.pyc
.env
venv
.venv
```

---

## TASK 7: Create docker-compose.yml at repo root

```yaml
version: '3.9'

services:
  db:
    image: mysql:8.0
    container_name: escrow_db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME:-escrow}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./escrow-service
      dockerfile: Dockerfile
    container_name: escrow_backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME:-escrow}
      JWT_SECRET: ${JWT_SECRET}
      RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID}
      RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET}
      RAZORPAY_WEBHOOK_SECRET: ${RAZORPAY_WEBHOOK_SECRET}
      AI_API_BASE_URL: http://ai-service:8001
      CORS_ORIGIN: ${FRONTEND_URL:-http://localhost:3001}
      USE_MOCK_RAZORPAY: ${USE_MOCK_RAZORPAY:-false}
    depends_on:
      db:
        condition: service_healthy
    command: sh -c "npm run knex:migrate && node dist/src/server.js"

  ai-service:
    build:
      context: ./ai-agent
      dockerfile: Dockerfile
    container_name: escrow_ai
    restart: unless-stopped
    ports:
      - "8001:8001"
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      AI_SERVICE_PORT: 8001
      ENV: production

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:3000}
    container_name: escrow_frontend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      BACKEND_URL: http://backend:3000
      NODE_ENV: production
    depends_on:
      - backend

volumes:
  mysql_data:
```

---

## TASK 8: Create root .env.example for docker-compose

Create `.env.example` at the repo root (NOT inside any service folder):
```
# Database
DB_PASSWORD=your_secure_password
DB_NAME=escrow

# Backend
JWT_SECRET=your_long_random_jwt_secret
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx
USE_MOCK_RAZORPAY=false

# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001
```

---

## Completion Checklist
- [ ] Read all package.json and config files first
- [ ] escrow-service/Dockerfile created (matches actual build/start scripts)
- [ ] escrow-service/.dockerignore created
- [ ] frontend/Dockerfile created (multi-stage)
- [ ] frontend/next.config.js: `output: 'standalone'` added
- [ ] frontend/.dockerignore created
- [ ] ai-agent/Dockerfile created
- [ ] ai-agent/.dockerignore created
- [ ] docker-compose.yml created at repo root
- [ ] All env vars passed correctly (no hardcoded secrets)
- [ ] db healthcheck ensures backend waits for MySQL
- [ ] backend runs migrations before starting
- [ ] Root .env.example created as template

---

## PROMPT TO USE

```
Working directory: d:/khyber/ai-freelance-escrow-agent
Session: SESSIONS/SESSION_14_DOCKER_DEPLOYMENT.md

Read SESSIONS/INDEX.md then read the session file above completely, then read every file in its "Read These Files First" list. Only then start making changes.

Rules:
- Only CREATE new files (Dockerfiles, docker-compose.yml, .dockerignore, .env.example)
- The only existing file you may EDIT is frontend/next.config.js to add output: standalone
- Do NOT touch any source code (no .ts, .tsx, .py files)
- Match build/start scripts exactly as they appear in package.json
- End by confirming every checklist item is complete
```
