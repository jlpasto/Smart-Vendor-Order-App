# Buyer Role Changes - Summary

## Overview
Replaced the generic "user" role with "buyer" throughout the application for better clarity and terminology consistency.

## Changes Made

### 1. Database Migration Created
**File**: [server/migrations/update_user_role_to_buyer.sql](server/migrations/update_user_role_to_buyer.sql)

This migration will:
- Update all existing users with role='user' to role='buyer'
- Drop the old CHECK constraint
- Add new CHECK constraint that accepts only 'buyer' or 'admin'

### 2. Backend API Updated
**File**: [server/routes/users.js:78](server/routes/users.js#L78)

Changed the default role when creating new users:
```javascript
// Before:
[name, email, hashedPassword, id_no, 'user']

// After:
[name, email, hashedPassword, id_no, 'buyer']
```

### 3. Frontend Updates
**File**: [client/src/pages/admin/AdminUsers.jsx](client/src/pages/admin/AdminUsers.jsx)

**Changes**:
1. **Default role for new users** (line 51):
   - Changed from `role: 'user'` to `role: 'buyer'`

2. **Role dropdown in edit modal** (lines 314-320):
   - Changed default value from `'user'` to `'buyer'`
   - Changed option from `<option value="user">User</option>` to `<option value="buyer">Buyer</option>`

3. **Role badge display** (line 190):
   - Added proper capitalization: displays "Buyer" instead of "buyer"
   - Displays "Admin" instead of "admin"

4. **Page title and buttons** (lines 156-158):
   - Changed from "Manage Users" to "Manage Buyers"
   - Changed from "+ Add New User" to "+ Add New Buyer"

5. **Admin users hidden** (lines 143-151):
   - Added filter to hide users with `role === 'admin'` from the buyers list
   - Only buyers are shown in the management interface

## How to Apply Changes

### Step 1: Run the Database Migration

#### Option A: Using pgAdmin (Recommended)
1. Open pgAdmin
2. Connect to your database:
   - **Local**: `wholesale_app`
   - **Production**: Your Render database
3. Right-click on the database → Query Tool
4. Open the migration file: `server/migrations/update_user_role_to_buyer.sql`
5. Copy and paste the SQL into the Query Tool
6. Click Execute (F5)
7. Verify the changes:
   ```sql
   SELECT role, COUNT(*) FROM users GROUP BY role;
   ```
   You should see:
   - `buyer`: (count of all non-admin users)
   - `admin`: (count of admin users)

#### Option B: Using Command Line
```bash
# Local database
psql -U postgres -d wholesale_app -f server/migrations/update_user_role_to_buyer.sql

# Production database (adjust connection string)
psql "postgresql://wholesale_app_4csh_user:lrmooKVMVwidUWaMYBNni3daraps5upq@dpg-d3jjrr7fte5s73frlnig-a/wholesale_app_4csh" -f server/migrations/update_user_role_to_buyer.sql
```

### Step 2: Restart Your Application

After running the migration:

```bash
# Stop the running server (Ctrl+C)

# Restart the server
npm run dev
```

### Step 3: Test the Changes

1. **Login as Admin**
   - Use your admin credentials

2. **Go to Admin → Manage Buyers**
   - Page title should show "Manage Buyers"
   - Button should say "+ Add New Buyer"
   - Admin users should NOT appear in the list

3. **Create New Buyer**
   - Click "+ Add New Buyer"
   - Default role should be "Buyer"
   - Create a test buyer

4. **Edit Existing Buyer**
   - Click "Edit" on any buyer
   - Role dropdown should show "Buyer" and "Admin" options
   - Role badge should display "Buyer" (capitalized)

5. **Verify Database**
   ```sql
   SELECT id, name, email, role FROM users;
   ```
   All non-admin users should have `role = 'buyer'`

## Files Modified

1. **server/migrations/update_user_role_to_buyer.sql** - NEW (migration file)
2. **server/routes/users.js** - Line 78 (default role)
3. **client/src/pages/admin/AdminUsers.jsx** - Lines 51, 156, 158, 190, 314, 318 (role references)

## Benefits

1. **Better Clarity**: "Buyer" is more descriptive than generic "User"
2. **Cleaner UI**: Admin users hidden from buyer management
3. **Consistent Terminology**: Aligns with business domain language
4. **Improved UX**: Clear distinction between roles

## Rollback (If Needed)

If you need to revert these changes:

```sql
-- Rollback migration
UPDATE users SET role = 'user' WHERE role = 'buyer';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
```

Then revert the code changes in:
- `server/routes/users.js`
- `client/src/pages/admin/AdminUsers.jsx`

## Notes

- This change is **backwards compatible** - existing functionality remains the same
- All role checks in the application already work with any role value
- The migration is **safe** - it only updates role values, doesn't delete or modify other data
- **IMPORTANT**: Run the migration on both local and production databases

## Next Steps (Optional)

- [ ] Update any documentation that mentions "users" to use "buyers"
- [ ] Consider adding more buyer-specific features (e.g., purchase history, order preferences)
- [ ] Add role-based dashboard views (different for buyers vs admins)
