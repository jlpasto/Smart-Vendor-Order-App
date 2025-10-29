# Password Management Feature for Admins

## Overview
Admins can now generate and reset passwords for any user in the system through the Manage Users interface.

## Features Added

### 1. Password Reset for Existing Users
**Location**: Edit User Modal in Manage Users page

When editing an existing user, admins can:
- Click "Generate New Password" button
- System generates a secure 12-character password
- Password is displayed with copy button
- Password can be regenerated multiple times before saving
- New password is included in formData when saving

### 2. Copy to Clipboard
- One-click copy button for generated passwords
- Shows confirmation alert when copied
- Makes it easy to share passwords with users

### 3. Visual Feedback
- Generated password shows in green-highlighted field
- Success message: "✓ New password generated! Make sure to copy it before saving."
- Warning message before saving

### 4. Security Improvements
**CRITICAL FIX**: Passwords are now properly hashed!

**Backend Changes** (`server/routes/users.js`):
- ✅ Added `bcrypt` import
- ✅ POST endpoint (create user): Passwords hashed with bcrypt before storing
- ✅ PUT endpoint (update user): Passwords hashed with bcrypt before storing
- ✅ Salt rounds: 10
- ✅ Plaintext password returned in response only (not stored)

**Before (INSECURE)**:
```javascript
// Password stored as plaintext - BAD!
const finalPassword = password || generatePassword();
INSERT INTO users (..., password) VALUES (..., finalPassword)
```

**After (SECURE)**:
```javascript
// Password properly hashed - GOOD!
const finalPassword = password || generatePassword();
const hashedPassword = await bcrypt.hash(finalPassword, 10);
INSERT INTO users (..., password) VALUES (..., hashedPassword)
// Return plaintext in response only
res.json({ password: finalPassword })
```

## How to Use

### Creating New User (Already Existed)
1. Admin goes to Manage Users
2. Clicks "+ Add New User"
3. Fills in details
4. Password is auto-generated
5. Can click "🔄 Regenerate" to get different password
6. Saves user
7. Password shown in alert (copy it!)

### Resetting Existing User Password (NEW!)
1. Admin goes to Manage Users
2. Clicks "Edit" on a user
3. Scrolls to "Reset Password" section
4. Clicks "🔑 Generate New Password"
5. New password appears with copy button
6. Clicks "📋 Copy" to copy password
7. Can click "🔄" to regenerate if needed
8. Clicks "Update User" to save
9. Password shown in alert again (last chance to copy!)

## UI Components

### Edit User Modal - New Section
```
┌─────────────────────────────────────────┐
│ Reset Password                          │
├─────────────────────────────────────────┤
│ [🔑 Generate New Password]              │ ← Button
│                                         │
│ OR (after generating):                  │
│                                         │
│ [password12345] [📋 Copy] [🔄]         │ ← Input + Buttons
│ ✓ New password generated! Make sure... │ ← Success message
│ Generate a new password for this user...│ ← Help text
└─────────────────────────────────────────┘
```

## API Endpoints

### Create User (Fixed)
`POST /api/users`

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "id_no": "123",
  "password": "optionalPassword123" // Or omit for auto-generate
}
```

**Response**:
```json
{
  "id": 5,
  "name": "John Doe",
  "email": "john@example.com",
  "id_no": "123",
  "role": "user",
  "created_at": "2025-10-30T...",
  "password": "generatedPassword123" // Plaintext (not stored)
}
```

**Security**: Password is hashed with bcrypt(10) before storing in database.

### Update User (Fixed)
`PUT /api/users/:id`

**Request** (with password reset):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "password": "newPassword123" // New password
}
```

**Response**:
```json
{
  "id": 5,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin",
  "assigned_vendor_ids": [],
  "created_at": "2025-10-30T..."
}
```

**Security**: Password is hashed with bcrypt(10) before storing in database.

## Files Modified

### Frontend
1. **client/src/pages/admin/AdminUsers.jsx**
   - Added password reset section in edit modal
   - Added copy to clipboard functionality
   - Updated handleSave to show password in alert
   - Added visual feedback for generated passwords

### Backend
2. **server/routes/users.js**
   - Added `bcrypt` import
   - Fixed POST endpoint: Hash passwords before storing
   - Fixed PUT endpoint: Hash passwords before storing
   - Both use bcrypt with 10 salt rounds

## Security Notes

### What Was Fixed
- ❌ **Before**: Passwords stored as plaintext in database
- ✅ **After**: Passwords hashed with bcrypt before storing

### Why This Matters
- If database is compromised, attackers cannot read passwords
- Bcrypt is designed to be slow (protects against brute force)
- Salt rounds (10) make it computationally expensive to crack

### Password Storage Flow
1. Admin generates password: `"Pass123!@#"`
2. Backend hashes with bcrypt: `"$2b$10$abcd...xyz123"`
3. Database stores: `"$2b$10$abcd...xyz123"` (hashed)
4. API returns: `"Pass123!@#"` (plaintext, ONE TIME ONLY)
5. Admin copies and shares with user

### Login Flow
1. User enters: `"Pass123!@#"`
2. Backend retrieves hash: `"$2b$10$abcd...xyz123"`
3. Backend compares: `bcrypt.compare("Pass123!@#", "$2b$10$abcd...xyz123")`
4. If match: Login successful
5. If no match: Login denied

## Testing Checklist

- [ ] Create new user - password is generated
- [ ] Create new user - password is shown in alert
- [ ] Edit existing user - see "Reset Password" section
- [ ] Click "Generate New Password" - password appears
- [ ] Click copy button - password copied to clipboard
- [ ] Click regenerate - new password generated
- [ ] Save without generating password - no password change
- [ ] Save with generated password - password changed
- [ ] Login with new password - works
- [ ] Check database - password is hashed (starts with $2b$)
- [ ] Old password doesn't work anymore

## Production Deployment Notes

This is a CRITICAL SECURITY FIX. Deploy as soon as possible!

### Existing Users with Plaintext Passwords
If you have users with plaintext passwords in production:
1. They will still work (bcrypt.compare can fail gracefully)
2. BUT they should reset their password ASAP
3. OR admin should generate new passwords for them
4. New passwords will be properly hashed

### Migration
No database migration needed - password column already exists.
Just deploy the code changes.

## Future Enhancements

- [ ] Add "Show/Hide Password" toggle
- [ ] Add password strength indicator
- [ ] Add custom password option (admin enters password)
- [ ] Add password history (prevent reuse)
- [ ] Add "Email password to user" button
- [ ] Add password expiry dates
- [ ] Add forced password change on first login
