# Role-Based Access Control (RBAC) Implementation Plan

## Executive Summary
This document outlines a complete implementation strategy for adding role-based access control to the RTRP-A21 application. The system will automatically classify users as Admin or Student based on their email domain during registration, and enforce access controls at both frontend and backend levels.

---

## 1. IMPLEMENTATION OVERVIEW

### 1.1 Key Components
- **Database Layer**: Update User schema to include role field
- **Backend Layer**: Add role assignment logic + API authorization middleware
- **Frontend Layer**: Add role checks in UI components + protected routes
- **Authentication**: Enhance current login/signup to include role assignment

### 1.2 Architecture Diagram
```
User Registration → Email Validation → Role Assignment → Save to DB
                                             ↓
                                  @admingmail.com → Admin
                                  Any other → Student
                                             ↓
Frontend Access Control ← Role stored in localStorage + User object
                             ↓
Backend API Protection ← Role validation in middleware
```

---

## 2. DATABASE LAYER

### 2.1 User Schema Update
**File**: `server/server.js` (Update User Schema)

**Current Schema**:
```javascript
const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    id: String,
    year: String,
    password: String,
    createdAt: { type: Date, default: Date.now }
});
```

**Updated Schema** (Add role field):
```javascript
const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    id: String,
    year: String,
    password: String,
    role: { 
        type: String, 
        enum: ['Admin', 'Student'], 
        default: 'Student'  // Default role
    },
    createdAt: { type: Date, default: Date.now }
});
```

---

## 3. BACKEND LAYER

### 3.1 Role Assignment Function
**Create New File**: `server/roleAssigner.js`

```javascript
/**
 * Determines user role based on email domain
 * @param {string} email - User's email address
 * @returns {string} - 'Admin' or 'Student'
 */
function assignRoleByEmail(email) {
  const adminDomain = 'admingmail.com';
  const domain = email.split('@')[1]?.toLowerCase();
  return domain === adminDomain ? 'Admin' : 'Student';
}

module.exports = { assignRoleByEmail };
```

### 3.2 Authentication Middleware
**Create New File**: `server/authMiddleware.js`

```javascript
/**
 * Middleware to verify user has required role
 * @param {string|string[]} requiredRoles - Role(s) allowed to access the endpoint
 */
function authorize(requiredRoles) {
  return (req, res, next) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Get user role from request headers or body
    const userRole = req.headers['x-user-role'] || req.body?.userRole;
    
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Admin authentication required.',
        code: 'FORBIDDEN'
      });
    }
    
    next();
  };
}

module.exports = { authorize };
```

### 3.3 Updated Sign Up API Endpoint
**File**: `server/server.js` - Update `/api/users/signup` route

**Changes**:
1. Import the role assigner function
2. Assign role during user creation
3. Return role in response

**Code Changes**:
```javascript
const { assignRoleByEmail } = require('./roleAssigner');

// In the signup route:
app.post('/api/users/signup', async (req, res) => {
  try {
    const { name, email, username, password, id, year } = req.body;

    // ... existing validation code ...

    // NEW: Assign role based on email
    const role = assignRoleByEmail(email);

    // Create new user
    const newUser = new User({
      name,
      email,
      username,
      password: password || '',
      id: id || '',
      year: year || '1st Year',
      role: role  // ADD THIS LINE
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      username: savedUser.username,
      year: savedUser.year,
      role: savedUser.role,  // ADD THIS LINE
      message: 'Sign up successful'
    });
  } catch (error) {
    // ... error handling ...
  }
});
```

### 3.4 Updated Login API Endpoint
**File**: `server/server.js` - Update `/api/users/login` route

**Code Changes**:
```javascript
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, username } = req.body;

    // ... existing validation code ...

    const user = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      year: user.year || '1st Year',
      role: user.role,  // ADD THIS LINE
      message: 'Login successful'
    });
  } catch (error) {
    // ... error handling ...
  }
});
```

### 3.5 Protected Notice/Event Creation Endpoint
**File**: `server/server.js` - Update `/api/notices` POST route

**Code Changes**:
```javascript
const { authorize } = require('./authMiddleware');

// Add authorization middleware to the route
app.post('/api/notices', authorize('Admin'), upload.single('photo'), async (req, res) => {
  try {
    // ... existing notice creation logic ...
    
    // Extract userRole from header (sent by frontend)
    const userRole = req.headers['x-user-role'];
    
    // Verify again (double-check)
    if (userRole !== 'Admin') {
      return res.status(403).json({ error: 'Admin authentication required.' });
    }

    // ... rest of the logic ...
  } catch (error) {
    // ... error handling ...
  }
});
```

---

## 4. FRONTEND LAYER

### 4.1 Update Storage Service
**File**: `src/data/storageService.js`

**Current**:
```javascript
const setCurrentUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user to localStorage', e);
  }
};
```

**Updated** (Already handles role, no change needed if backend returns it):
```javascript
// The function already stores complete user object including role
// Just ensure user object from backend includes role field
```

### 4.2 Create Role-Check Utility
**Create New File**: `src/utils/roleUtils.js`

```javascript
/**
 * Check if user has Admin role
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export function isAdmin(user) {
  return user && user.role === 'Admin';
}

/**
 * Check if user has Student role
 * @param {object} user - User object with role property
 * @returns {boolean}
 */
export function isStudent(user) {
  return user && user.role === 'Student';
}

/**
 * Check if user can access a feature
 * @param {object} user - User object
 * @param {string} requiredRole - Required role
 * @returns {boolean}
 */
export function hasPermission(user, requiredRole) {
  return user && user.role === requiredRole;
}
```

### 4.3 Update AddNoticeEvent Component
**File**: `src/components/AddNoticeEvent.js`

**Add at the top**:
```javascript
import { isAdmin } from '../utils/roleUtils';
```

**Add early return for non-admin users**:
```javascript
const AddNoticeEvent = ({ user = {}, onNavigateToDashboard, ... }) => {
  
  // ADD THIS: Check authorization
  if (!isAdmin(user)) {
    return (
      <div className="auth-error-container">
        <SidePanel
          isPanelOpen={isPanelOpen}
          setIsPanelOpen={setIsPanelOpen}
          onNavigateToDashboard={onNavigateToDashboard}
          onNavigateToHistory={onNavigateToHistory}
          onNavigateToAdd={onNavigateToAdd}
          onNavigateToSearch={onNavigateToSearch}
          onLogout={onLogout}
          user={user}
        />
        <div className="auth-error-content">
          <h2>Access Denied</h2>
          <p>Admin authentication required.</p>
          <button onClick={onNavigateToDashboard} className="continue-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Rest of the existing component code...
```

### 4.4 Update Navigation/SidePanel
**File**: `src/components/SidePanel.js` or wherever navigation is controlled

**Add conditional rendering**:
```javascript
import { isAdmin } from '../utils/roleUtils';

// In the navigation rendering:
{isAdmin(user) && (
  <button onClick={onNavigateToAdd} className="nav-button">
    Add Event
  </button>
)}

// Show disabled/grayed out button for students with tooltip
{!isAdmin(user) && (
  <button 
    className="nav-button disabled" 
    title="Admin only"
    disabled
  >
    Add Event (Admin Only)
  </button>
)}
```

### 4.5 Update SignUp Component
**File**: `src/components/SignUp.js`

**Update handleSubmit to include role assignment on frontend** (after backend signup):

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!form.name || !form.username || !form.email) {
    alert('Please fill Name, Username and Email');
    return;
  }

  // Determine role based on email (mirror backend logic)
  const assignRoleByEmail = (email) => {
    const adminDomain = 'admingmail.com';
    const domain = email.split('@')[1]?.toLowerCase();
    return domain === adminDomain ? 'Admin' : 'Student';
  };

  const user = {
    id: form.id || `user-${Date.now()}`,
    name: form.name,
    username: form.username,
    email: form.email,
    year: form.year,
    role: assignRoleByEmail(form.email)  // ADD THIS LINE
  };

  try {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }

  alert('Sign up successful!');
  if (onSignUp) onSignUp(user);
};
```

### 4.6 Add CSS for Auth Error Message
**Create/Update File**: `src/components/AddNoticeEvent.css`

```css
.auth-error-container {
  display: flex;
  height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-error-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: white;
  padding: 2rem;
}

.auth-error-content h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.auth-error-content p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

/* Disabled button styling */
.nav-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 5. ROLE-BASED ACCESS CONTROL SUMMARY

| Feature | Admin | Student |
|---------|-------|---------|
| View Dashboard | ✅ | ✅ |
| View History | ✅ | ✅ |
| Search Notices | ✅ | ✅ |
| Create Events/Notices | ✅ | ❌ |
| See "Add Event" Button | ✅ | ❌ (Disabled/Hidden) |
| Access /add route | ✅ | ❌ (Redirected) |

---

## 6. DATA FLOW DIAGRAM

### Registration Flow
```
User Signs Up
    ↓
Frontend: SignUp Component
    ↓
Extract Email → Determine Role (@admingmail.com = Admin, else Student)
    ↓
Store User + Role in localStorage
    ↓
Send to Backend API /api/users/signup
    ↓
Backend: Verify Email → Assign Role → Save to MongoDB
    ↓
Return User Object with Role
    ↓
Frontend: Store in localStorage + Set isLoggedIn = true
```

### Add Event Access Flow
```
User Navigates to /add
    ↓
AddNoticeEvent Component Mounts
    ↓
Check: isAdmin(user)?
    ├─ YES → Show Event Creation Form
    └─ NO → Show "Admin authentication required" message
           → Offer Back to Dashboard button
```

### Backend API Request
```
Frontend Submits Event
    ↓
Include Header: x-user-role = user.role
    ↓
POST /api/notices [with file upload]
    ↓
Backend Middleware: authorize('Admin')
    ├─ Role = Admin → Process & Save
    └─ Role ≠ Admin → Return 403 Forbidden
```

---

## 7. ASSUMPTIONS & CLARIFICATIONS

### Assumptions Made:
1. **Email domain is authoritative**: Only emails with @admingmail.com are Admin (case-insensitive)
2. **Role is immutable after registration**: Users cannot change their role (only admins can if needed)
3. **localStorage is sufficient for MVP**: No JWT tokens needed initially (can add later)
4. **MongoDB is already running**: The backend connects to MongoDB successfully
5. **No password hashing initially**: Application uses plain passwords (should be hashed in production)
6. **Single Admin email domain**: Only one domain (@admingmail.com) defines Admin users
7. **Synchronous role assignment**: Role assigned immediately during signup (no approval workflow)

### Questions for Clarification:

**Q1: Admin Promotion Workflow**
- After initial registration, should there be a way for users to request Admin access?
- Should existing users with Student role be able to upgrade?
- **Current Plan**: No - roles are fixed at registration. Change if needed.

**Q2: Multiple Admin Domains**
- Currently only @admingmail.com is Admin. Need more domains?
- **Current Plan**: Single domain. Easy to extend if needed.

**Q3: Password Security**
- Current signup doesn't validate password strength. Should we?
- Should we implement password hashing (bcrypt)?
- **Current Plan**: No validation/hashing initially. Recommended for production.

**Q4: Email Verification**
- Should we verify email ownership before role assignment?
- **Current Plan**: No - direct assignment. Recommended for production.

**Q5: Existing Users**
- Do existing localStorage users need migration with roles?
- **Current Plan**: Fresh users get roles. Existing may need manual migration.

**Q6: API Authentication Token**
- Should we implement JWT tokens instead of passing role in headers?
- **Current Plan**: Headers for simplicity. JWT recommended for production.

**Q7: Admin Management Panel**
- Do admins need a dashboard to view all users and edit roles?
- **Current Plan**: Not included. Can be added later.

---

## 8. IMPLEMENTATION CHECKLIST

### Backend Tasks
- [ ] Update User schema to include role field
- [ ] Create `roleAssigner.js` utility
- [ ] Create `authMiddleware.js` for authorization checks
- [ ] Update `/api/users/signup` endpoint to assign role
- [ ] Update `/api/users/login` endpoint to return role
- [ ] Protect `/api/notices` POST endpoint with authorization

### Frontend Tasks
- [ ] Create `roleUtils.js` utility functions
- [ ] Update `SignUp.js` to assign role locally
- [ ] Update `AddNoticeEvent.js` to check admin role
- [ ] Update `SidePanel.js` or navigation to conditionally show Add Event button
- [ ] Update `AddNoticeEvent.css` for error message styling
- [ ] Verify localStorage stores role correctly

### Testing Tasks
- [ ] Test signup as admin (@admingmail.com) → Should get Admin role
- [ ] Test signup as student (other email) → Should get Student role
- [ ] Test student accessing Add Event → Should see access denied message
- [ ] Test admin accessing Add Event → Should see form
- [ ] Test backend API protection → Student request should return 403

### Optional Production Tasks
- [ ] Implement password hashing (bcrypt)
- [ ] Add email verification
- [ ] Implement JWT tokens
- [ ] Add role management dashboard for admins
- [ ] Add audit logging for admin actions

---

## 9. FILE CHANGES SUMMARY

| File | Type | Change |
|------|------|--------|
| `server/server.js` | Edit | Update User schema + API endpoints |
| `server/roleAssigner.js` | Create | Role assignment logic |
| `server/authMiddleware.js` | Create | Authorization middleware |
| `src/data/storageService.js` | No change | Already stores full user object |
| `src/utils/roleUtils.js` | Create | Frontend role utilities |
| `src/components/SignUp.js` | Edit | Add role assignment in frontend |
| `src/components/AddNoticeEvent.js` | Edit | Add authorization check |
| `src/components/SidePanel.js` | Edit | Conditional navigation button |
| `src/components/AddNoticeEvent.css` | Edit | Add error styling |

---

## 10. NEXT STEPS

Once you confirm the above assumptions and answer the clarification questions, I will:

1. Implement all backend changes
2. Implement all frontend changes
3. Create test scenarios
4. Provide testing instructions
5. Show before/after code comparisons

**Ready to proceed with implementation? Please confirm the assumptions or provide answers to the clarification questions above.**
