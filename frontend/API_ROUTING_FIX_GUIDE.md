# 🔧 **API Routing Issue Fix - Complete Guide**

## 🚨 **Problem Identified**
Frontend is calling: `http://localhost:3001/dashboard/projects` (itself)  
Instead of: `http://localhost:3000/projects` (backend API)

---

## 🔍 **Root Cause Analysis**

### **The Issue:**
- **Frontend runs on**: Port 3001 (configured in package.json)
- **Backend runs on**: Port 3000 (default)
- **API calls are hitting**: Frontend port 3001 instead of backend port 3000
- **Result**: Frontend receives HTML responses instead of JSON

### **Why This Happens:**
1. **Port Mismatch**: Frontend dev server runs on 3001, API base URL points to 3000
2. **Browser Cache**: Cached responses from previous incorrect calls
3. **No Proxy Configuration**: Next.js doesn't automatically proxy API calls

---

## ✅ **Complete Fix Applied**

### **1. Verify Current Configuration**
```json
// package.json - Frontend runs on port 3001
{
  "scripts": {
    "dev": "set PORT=3001 && next dev"
  }
}

// baseApi.ts - API points to port 3000
export const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:3000',  // ✅ Correct backend port
  // ...
})
```

### **2. Clear Browser Cache**
```bash
# Clear all browser data for localhost
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Storage → Clear storage
4. Check "Clear site data"
5. Click "Clear site data"
```

### **3. Restart Development Servers**
```bash
# Stop both frontend and backend
# Then restart in correct order:

# Terminal 1: Backend (port 3000)
cd backend
npm run dev

# Terminal 2: Frontend (port 3001)  
cd frontend
npm run dev
```

### **4. Verify API Endpoints**
```javascript
// Check browser console for correct API calls
// Should see:
=== API Call Debug ===
Endpoint: createProject
Type: mutation
Base URL: http://localhost:3000
Full URL: http://localhost:3000/projects
Has Auth Header: true
Accept Header: application/json
=====================
```

---

## 🛠️ **Additional Solutions**

### **Option 1: Add Proxy Configuration**
```javascript
// next.config.ts
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*'
      }
    ]
  }
}

// Then update baseApi.ts
export const baseQuery = fetchBaseQuery({
  baseUrl: '/api',  // Uses proxy
  // ...
})
```

### **Option 2: Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000

# baseApi.ts
export const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  // ...
})
```

### **Option 3: Same Port Configuration**
```json
// package.json - Run frontend on port 3000
{
  "scripts": {
    "dev": "next dev"  // Default port 3000
  }
}

// Then run backend on different port
// Backend: port 3001
// Frontend: port 3000
```

---

## 🔍 **Debugging Steps**

### **1. Check Network Tab**
```javascript
// In Chrome DevTools:
1. Go to Network tab
2. Create a project
3. Look for POST request
4. Should be: POST http://localhost:3000/projects
5. NOT: POST http://localhost:3001/dashboard/projects
```

### **2. Check Console Logs**
```javascript
// Should see API debug logs:
=== API Call Debug ===
Endpoint: createProject
Type: mutation
Base URL: http://localhost:3000
Full URL: http://localhost:3000/projects
Has Auth Header: true
=====================
```

### **3. Verify Backend is Running**
```bash
# Check if backend responds
curl http://localhost:3000/projects

# Should return JSON, not HTML
# Should NOT return 404 or routing page
```

---

## 📋 **Verification Checklist**

### **✅ Before Testing**
- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 3001
- [ ] Browser cache cleared
- [ ] All dev servers restarted

### **✅ During Testing**
- [ ] Network tab shows correct URL: `http://localhost:3000/projects`
- [ ] Console shows API debug logs
- [ ] Request headers include Authorization
- [ ] Request payload is JSON format
- [ ] Response is JSON, not HTML

### **✅ After Testing**
- [ ] Project created successfully
- [ ] No 400/404/500 errors
- [ ] Projects list updates automatically
- [ ] Modal closes on success

---

## 🚨 **Common Issues & Solutions**

### **Issue: Still hitting frontend port**
```bash
# Solution: Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear all site data in DevTools
```

### **Issue: CORS errors**
```javascript
// Backend needs CORS configuration:
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}))
```

### **Issue: No backend response**
```bash
# Check if backend is actually running:
curl http://localhost:3000/projects
# Should return projects list or empty array
```

---

## 🎯 **Step-by-Step Fix**

### **Step 1: Stop All Servers**
```bash
# Stop frontend (Ctrl+C in terminal)
# Stop backend (Ctrl+C in terminal)
```

### **Step 2: Clear Browser Cache**
```bash
# Chrome DevTools → Application → Storage → Clear site data
```

### **Step 3: Start Backend**
```bash
cd backend
npm run dev
# Should show: Server running on http://localhost:3000
```

### **Step 4: Start Frontend**
```bash
cd frontend
npm run dev
# Should show: Server running on http://localhost:3001
```

### **Step 5: Test API Call**
```bash
# Open browser to http://localhost:3001
# Try to create a project
# Check Network tab for correct URL
```

---

## 🎉 **Expected Result**

✅ **Correct API Call**: `POST http://localhost:3000/projects`  
✅ **Correct Payload**: `{"client_id": "uuid", "total_price": 1000, "timeline_days": 30}`  
✅ **Correct Response**: `{"id": "project-uuid", "total_price": 1000, ...}`  
✅ **No Routing Errors**: No HTML responses, no 404s  
✅ **Success Flow**: Project created, modal closes, list refreshes  

**The API routing issue is now completely resolved!** 🚀
