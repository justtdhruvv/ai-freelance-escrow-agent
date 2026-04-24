# How to Verify the App is Working

## Step 1 — Start All 3 Services

Open 3 terminals:

**Terminal A — Backend**
```bash
cd escrow-service
npm install
npm run dev
# Should print: Server running on port 3000 + DB connected
```

**Terminal B — AI Service**
```bash
cd ai-agent
pip install -r requirements.txt
python main.py
# Should print: Uvicorn running on http://0.0.0.0:8001
```

**Terminal C — Frontend**
```bash
cd frontend
npm install
npm run dev
# Should print: Ready on http://localhost:3001
```

---

## Step 2 — Health Checks (verify each service is alive)

Open a browser or use curl:

### Backend health
```
GET http://localhost:3000/health
```
Expected: `{ "status": "ok" }` or any 200 response (check if /health route exists, else try GET /auth which should return 404 not 500)

### AI service health
```
GET http://localhost:8001/health
```
Expected: `{ "status": "ok", "gemini": { ... } }`

### Frontend
```
http://localhost:3001
```
Expected: Redirects to /dashboard or /login (not a blank page or error)

---

## Step 3 — Database Setup (first time only)

```bash
# Create the database in MySQL
mysql -u root -p
> CREATE DATABASE escrow;
> EXIT;

# Run migrations
cd escrow-service
npm run knex:migrate
# Should print: Batch 1 run: X migrations
```

---

## Step 4 — Full User Flow Test

### Test as Freelancer

1. Go to `http://localhost:3001/signup`
2. Sign up with email + password, role = **Freelancer**
3. You land on `/dashboard` — should see empty stats

4. Go to **Clients** tab
5. Click "Add Client" → enter a client email → submit
   - Backend creates employer account + sends email
   - Client appears in table

6. Go to **Projects** tab
7. Click "Create Project" → fill in name, select client, price, timeline
   - Should call AI service to generate milestones
   - Project appears in table with status "pending"

8. Go to **Milestones** tab
9. Select the project → should see AI-generated milestones

10. Go to **Wallet** tab
    - Should show ₹0 balance (real data, not hardcoded)

### Test as Employer

1. Open incognito window → `http://localhost:3001/login`
2. Login with the client email + password from Step 4 above
3. Should land on employer dashboard
4. Should see the project created by the freelancer

---

## Step 5 — API Endpoint Tests (using curl or Postman)

### Auth
```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","role":"freelancer"}'
# Expected: { "token": "eyJ...", "user": {...} }

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
# Expected: { "token": "eyJ...", "user": {...} }
```

### Projects (use token from login)
```bash
export TOKEN="eyJ..."

curl -X GET http://localhost:3000/projects \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "projects": [] } or list of projects
```

### AI Service Direct Test
```bash
curl -X POST http://localhost:8001/ai/generate-sop \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-123",
    "raw_text": "Build a simple todo app with React and Node.js",
    "domain": "web_development",
    "timeline_days": 14
  }'
# Expected: { "status": "success", "output": { "milestones": [...] } }
```

### Wallet
```bash
curl -X GET http://localhost:3000/wallet \
  -H "Authorization: Bearer $TOKEN"
# Expected: { "wallet": { "balance": 0, ... } }
```

---

## Step 6 — Check for Common Errors

### Backend won't start
- Check `.env` exists in `escrow-service/` with DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET
- Check MySQL is running: `mysql -u root -p` should work
- Check DB exists: `SHOW DATABASES;` should show `escrow`

### AI service won't start
- Check `.env` exists in `ai-agent/` with GEMINI_API_KEY
- Check Python version: `python --version` should be 3.8+
- Check packages: `pip install -r requirements.txt` (re-run if errors)

### Frontend shows blank page
- Check `.env.local` exists in `frontend/` with NEXT_PUBLIC_API_URL=http://localhost:3000
- Check browser console for errors (F12)
- Check backend is running on 3000

### "Network Error" or CORS error in browser
- Backend CORS must include `http://localhost:3001` — check escrow-service/.env CORS_ORIGIN
- Both backend and frontend must be running

### Milestones not generating after project creation
- AI service must be running on 8001
- Check AI service logs for errors
- Check backend logs — it calls AI service during project creation

---

## Step 7 — TypeScript Build Check

```bash
cd escrow-service
npx tsc --noEmit
# After Session 9: should return ZERO errors
```

---

## Step 8 — Docker (after Session 14)

```bash
# Create root .env from .env.example
cp .env.example .env
# Edit .env with your values

# Build and start everything
docker-compose up --build

# Check all containers running
docker-compose ps
# Should show: db, backend, ai-service, frontend — all "Up"

# Test
curl http://localhost:3000/health
curl http://localhost:8001/health
# Browser: http://localhost:3001
```

---

## Quick Sanity Checklist

Before submitting / demoing:

- [ ] Backend starts on port 3000 with no errors
- [ ] AI service starts on port 8001 with no errors
- [ ] Frontend starts on port 3001 with no errors
- [ ] Can sign up as freelancer
- [ ] Can create a client
- [ ] Can create a project (milestones auto-generated by AI)
- [ ] Can view milestones in dashboard
- [ ] Wallet shows ₹0 (real data, not 25000)
- [ ] Can sign in as employer in incognito
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] `GET http://localhost:8001/health` returns 200
