# Quick Start Guide - RBAC System Testing

## ⚡ Quick Setup for Testing

### Step 1: Ensure Backend is Running
```bash
cd server
npm install  # if needed
node server.js
# Expected: "Server running on port 5000"
```

### Step 2: Ensure Frontend is Running
```bash
cd .  # root directory
npm install  # if needed
npm start
# Expected: App opens on http://localhost:3000
```

### Step 3: Verify MongoDB Connection
```bash
# Backend console should show:
# MongoDB connected successfully
```

---

## 🧪 Quick Test Scenarios

### **Scenario 1: Create Admin User**
1. Click "Sign up"
2. Fill form with:
   - **Email**: `john@admingmail.com` ← Admin domain!
   - **Name**: John Admin
   - **Username**: johnadmin
   - **ID**: 12345
   - **Year**: 2nd Year
3. Click "Sign Up"
4. Expected: Login successful, user is Admin

### **Scenario 2: Create Student User**
1. Click "Sign up"
2. Fill form with:
   - **Email**: `jane@gmail.com` ← Regular domain
   - **Name**: Jane Student
   - **Username**: janestudent
   - **ID**: 54321
   - **Year**: 1st Year
3. Click "Sign Up"
4. Expected: Login successful, user is Student

### **Scenario 3: Admin Creates Event**
1. Login as admin user
2. Click profile icon (👤) → See role = "Admin"
3. Click "Add Event" button (➕) → Should be **enabled**
4. Fill event form and submit
5. Expected: Event created, redirected to dashboard

### **Scenario 4: Student Cannot Create Event**
1. Login as student user
2. Click profile icon (👤) → See role = "Student"
3. Click "Add Event" button (➕) → Should be **disabled/grayed out**
4. Try clicking it anyway → Nothing happens
5. Try accessing via URL directly (`/add`) → See "Admin authentication required" message
6. Expected: Cannot create event

---

## 🔍 How to Verify Implementation

### Check Frontend (Chrome DevTools)
1. Open DevTools (F12)
2. Go to **Application** → **Local Storage**
3. Look for:
   - `currentUser`: Should show user object with `role: "Admin"` or `role: "Student"`
   - `authToken`: Should show JWT token (long string)

### Check Backend Console
1. Watch server.js console
2. When signup/login: Look for logs like:
   ```
   User saved to database: <id> with role: Admin
   ```
3. When creating notice: Look for logs like:
   ```
   [Admin] Creating notice...
   Saved notice to MongoDB: <id>
   ```

### Check Network (Browser DevTools)
1. Open DevTools → **Network** tab
2. Create a new event/notice
3. Look for POST request to `/api/notices`
4. Check **Headers** → Should see:
   ```
   Authorization: Bearer eyJhbGc...
   ```

### Check MongoDB
```bash
# Connect to MongoDB (if using local instance)
mongo
use rtrp_db
db.users.find({}, {email: 1, role: 1}).pretty()
# Should show users with role field
```

---

## ✅ Success Criteria

- [ ] Admin user created with `role: "Admin"`
- [ ] Student user created with `role: "Student"`
- [ ] Admin can see "Add Event" button (enabled)
- [ ] Student sees "Add Event" button (disabled)
- [ ] Admin can access /add page and see form
- [ ] Student accessing /add sees "Admin authentication required"
- [ ] Admin can submit event form successfully
- [ ] Student API call to create event returns 403 Forbidden
- [ ] JWT token stored in localStorage
- [ ] User role displayed in profile panel

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Students can still access Add Event | `isAdmin()` not imported | Check import in Dashboard.js, History.js |
| API returns 401 on create event | Token not sent in header | Ensure `getAuthToken()` is called |
| API returns 403 even for admin | Role doesn't match in DB | Check `role` field in User collection |
| "Admin authentication required" shows for all | Middleware issue | Restart backend server |
| Students see "Admin only" button still clickable | CSS not applied | Check `.nav-icon.disabled` style exists |
| New signup doesn't assign role | Backend not updated | Verify `roleAssigner.js` is imported |

---

## 📝 Test Results Template

Use this to document your testing:

```
Date: ___________
Tester: ___________

ADMIN USER TEST:
[ ] Signup with @admingmail.com email: PASS / FAIL
[ ] Role shows "Admin" in profile: PASS / FAIL
[ ] Add Event button enabled: PASS / FAIL
[ ] Can access /add page: PASS / FAIL
[ ] Form submission successful: PASS / FAIL
[ ] Event appears in dashboard: PASS / FAIL

STUDENT USER TEST:
[ ] Signup with other email: PASS / FAIL
[ ] Role shows "Student" in profile: PASS / FAIL
[ ] Add Event button disabled: PASS / FAIL
[ ] Cannot access /add page: PASS / FAIL
[ ] See "Admin authentication required": PASS / FAIL

JWT TOKEN TEST:
[ ] Token stored in localStorage: PASS / FAIL
[ ] Token sent in API header: PASS / FAIL
[ ] Token validated by backend: PASS / FAIL

NOTES:
_____________________________
_____________________________
```

---

## 🔧 Configuration Tips

### Change Admin Domain
**File**: `server/roleAssigner.js`
```javascript
const ADMIN_DOMAINS = [
  'yourdomain.com',     // ← Change this
  'another-domain.com'  // ← Add more as needed
];
```

### Change JWT Expiry
**File**: `server/authMiddleware.js`
```javascript
const JWT_EXPIRY = '14d';  // ← 14 days instead of 7
```

### Change JWT Secret
**Environment Variable** (create `.env` in server folder):
```
JWT_SECRET=your-very-secure-random-string-here
JWT_EXPIRY=7d
```

---

## 📞 Support

If something doesn't work:
1. Check the browser console for errors (F12)
2. Check the backend console for error messages
3. Verify MongoDB is running and connected
4. Clear localStorage and try again
5. Restart both frontend and backend servers

---

**Good luck with testing! 🚀**
