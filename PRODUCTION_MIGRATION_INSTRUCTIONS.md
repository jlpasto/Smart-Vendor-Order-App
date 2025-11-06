# Production Database Migration Instructions

## Overview
This guide will help you migrate your **hosted PostgreSQL database on Render.com** to support product-based assignments.

**Database:** `wholesale_app_4csh` on Render.com (dpg-d3jjrr7fte5s73frlnig-a)

---

## ⚠️ IMPORTANT - Read Before Starting

1. **This will modify your PRODUCTION database**
2. **Backup is REQUIRED before proceeding**
3. **The migration is safe to re-run** if it fails partway through
4. **Zero downtime** - your app will continue working during migration
5. **Backward compatible** - old column is preserved for rollback

---

## Prerequisites Checklist

Before running the migration, ensure:

- [ ] You have Node.js installed
- [ ] You're in the project root directory
- [ ] Your internet connection is stable
- [ ] You have access to Render.com dashboard (optional, for manual backup)

---

## Step 1: Backup Production Database

### Option A: Automated Backup (Recommended)

Run the backup script:

```bash
node server/scripts/backup_production_users.js
```

**Expected Output:**
```
═══════════════════════════════════════════════════════════
   PRODUCTION DATABASE BACKUP
   Users Table Backup
═══════════════════════════════════════════════════════════

📡 Connecting to production database...
✅ Connected successfully

📥 Fetching all users...
✅ Retrieved 15 users

💾 Writing backup file...
✅ Backup saved to: server/backups/users_backup_2025-01-07.json

Backup Summary:
────────────────────────────────────────────────────────────
Total Users: 15
  admin: 2
  buyer: 13

Users with vendor assignments: 8
Users with product assignments: 0
────────────────────────────────────────────────────────────

🎉 Backup completed successfully!
```

**Backup Location:** `server/backups/users_backup_2025-01-07.json`

### Option B: Manual Backup via Render.com

1. Go to https://dashboard.render.com/
2. Navigate to your PostgreSQL database
3. Click "Backups" tab
4. Create a manual backup snapshot

---

## Step 2: Run Production Migration

Run the migration script:

```bash
node server/scripts/migrate_production_database.js
```

### Interactive Prompts

The script will ask for confirmation:

```
═══════════════════════════════════════════════════════════
   PRODUCTION DATABASE MIGRATION
   Product-Based Assignments Migration
═══════════════════════════════════════════════════════════

⚠️  WARNING: This will modify your PRODUCTION database!

Database Details:
  Host: dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com
  Database: wholesale_app_4csh
  User: wholesale_app_4csh_user

Are you sure you want to continue? (yes/no):
```

**Type:** `yes`

```
Have you backed up your database? (yes/no):
```

**Type:** `yes`

### Migration Process

The script will then:

```
🚀 Starting migration...

📡 Connecting to production database...
✅ Connected successfully

Step 1: Adding assigned_product_ids column...
✅ Column added

Step 2: Creating GIN index...
✅ Index created

Step 3: Fetching buyers with vendor assignments...
Found 8 buyers with vendor assignments

Step 4: Migrating each buyer...

👤 Processing: John Doe (ID: 5)
   Assigned vendors: 3 vendor(s)
   ✅ Assigned 45 products

👤 Processing: Jane Smith (ID: 6)
   Assigned vendors: 2 vendor(s)
   ✅ Assigned 28 products

...

═══════════════════════════════════════════════════════════
Migration Summary:
═══════════════════════════════════════════════════════════
✅ Successfully migrated: 8 buyers
⚠️  Warnings (no products): 0 buyers
📊 Total processed: 8 buyers

Step 5: Verification

Detailed Verification:
────────────────────────────────────────────────────────────
ID: 5 | John Doe
  Vendors: 3 → Products: 45
ID: 6 | Jane Smith
  Vendors: 2 → Products: 28
...
────────────────────────────────────────────────────────────

🎉 Migration completed successfully!

Next steps:
1. ✅ Database migration complete
2. 🚀 Your deployed backend should automatically use the new system
3. 🧪 Test with a buyer account to verify product filtering
4. 📱 Test the admin UI to assign products
5. ⏳ Monitor for 1-2 weeks before dropping old column
```

---

## Step 3: Verify Migration

### 3.1 Check Database (Optional)

If you want to manually verify the migration worked:

```bash
# Connect to your production database using psql or any PostgreSQL client
psql postgresql://wholesale_app_4csh_user:lrmooKVMVwidUWaMYBNni3daraps5upq@dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com:5432/wholesale_app_4csh

# Run verification query
SELECT
  id,
  email,
  role,
  array_length(assigned_vendor_ids, 1) as vendor_count,
  array_length(assigned_product_ids, 1) as product_count
FROM users
WHERE role = 'buyer'
ORDER BY id;
```

**Expected Result:**
```
 id |        email          | role  | vendor_count | product_count
----|-----------------------|-------|--------------|---------------
  5 | john@example.com      | buyer |            3 |            45
  6 | jane@example.com      | buyer |            2 |            28
...
```

### 3.2 Test Your Deployed Application

1. **Go to your production app URL**
   - Your frontend: `https://wholesale-app-frontend.onrender.com`

2. **Login as Admin**
   - Test the new "Manage Products" feature
   - Open a buyer → Click "Manage Products"
   - Verify the collapsible vendor UI loads correctly
   - Assign some products and save

3. **Login as a Buyer**
   - Verify you only see assigned products
   - Verify products from non-assigned vendors don't appear

---

## Step 4: Deploy Frontend Changes (If Not Already Deployed)

If your frontend hasn't been updated yet:

```bash
# Build the frontend
cd client
npm run build

# The build output should be deployed to Render.com automatically
# Or manually upload the dist/ folder if needed
```

Your Render.com deployment should automatically use the new `AdminUsers.jsx` component.

---

## Troubleshooting

### Error: "Connection timeout"

**Cause:** Render.com database might be sleeping (free tier) or network issue

**Solution:**
1. Wait 30 seconds and try again
2. Check your internet connection
3. Verify database is running on Render.com dashboard

### Error: "column assigned_product_ids already exists"

**Cause:** Migration was already run before

**Solution:**
- This is safe! The script uses `IF NOT EXISTS`
- The migration will skip column creation and proceed with data migration
- Your existing data won't be affected

### Error: "SSL connection failed"

**Cause:** SSL certificate verification issue

**Solution:**
- The script already has `ssl: { rejectUnauthorized: false }`
- If issue persists, check if Render.com changed SSL settings

### Warning: "No products found for assigned vendors"

**Cause:** A buyer was assigned vendors that have no products

**Possible Reasons:**
1. Vendor has no products in the database
2. Products' `vendor_id` is NULL or doesn't match

**Solution:**
- This is just a warning, not an error
- Those buyers will have empty `assigned_product_ids` (no product access)
- You can manually assign products via admin UI after migration

---

## Rollback Procedure (If Needed)

If something goes wrong and you need to rollback:

### Option 1: Using Render.com Backup

1. Go to Render.com dashboard
2. Navigate to your PostgreSQL database
3. Go to "Backups" tab
4. Restore from the backup you created

### Option 2: Drop New Column (Partial Rollback)

```bash
# Connect to database
psql postgresql://wholesale_app_4csh_user:lrmooKVMVwidUWaMYBNni3daraps5upq@dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com:5432/wholesale_app_4csh

# Drop the new column
ALTER TABLE users DROP COLUMN IF EXISTS assigned_product_ids;
DROP INDEX IF EXISTS idx_users_assigned_product_ids;
```

The old `assigned_vendor_ids` column will still be intact.

### Option 3: Restore from JSON Backup

If you used the backup script:

1. Open `server/backups/users_backup_2025-01-07.json`
2. For each user, manually run:
   ```sql
   UPDATE users
   SET assigned_vendor_ids = '{vendor_ids_from_backup}'
   WHERE id = user_id;
   ```

---

## Post-Migration Checklist

After successful migration:

- [ ] ✅ Backup file created and saved
- [ ] ✅ Migration script ran successfully
- [ ] ✅ Verification shows correct product counts
- [ ] ✅ Admin can open "Manage Products" modal
- [ ] ✅ Admin can assign products using new UI
- [ ] ✅ Buyers only see assigned products
- [ ] ✅ No errors in browser console
- [ ] ✅ No errors in server logs

---

## Optional Cleanup (After 1-2 Weeks)

After thoroughly testing the new system for 1-2 weeks, you can remove the old column:

```sql
-- Connect to production database
psql postgresql://wholesale_app_4csh_user:lrmooKVMVwidUWaMYBNni3daraps5upq@dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com:5432/wholesale_app_4csh

-- Drop old column
ALTER TABLE users DROP COLUMN IF EXISTS assigned_vendor_ids;

-- Drop old index
DROP INDEX IF EXISTS idx_users_assigned_vendor_ids;
```

⚠️ **WARNING:** Only do this after confirming everything works perfectly!

---

## Support

If you encounter any issues:

1. Check the error message carefully
2. Review this troubleshooting section
3. Check server logs on Render.com
4. Check browser console for frontend errors
5. Verify the backup file was created before attempting migration

---

## Summary

**What This Migration Does:**
1. ✅ Adds `assigned_product_ids` column to users table
2. ✅ Creates index for fast product lookups
3. ✅ Converts existing vendor assignments to product assignments
4. ✅ Preserves old `assigned_vendor_ids` for rollback safety
5. ✅ Zero downtime - app continues working during migration

**Time Required:**
- Backup: ~30 seconds
- Migration: ~1-2 minutes (depends on number of users/products)
- Testing: ~15-30 minutes

**Risk Level:** Low
- Migration is idempotent (safe to re-run)
- Backward compatible
- Easy rollback available

---

## Ready to Migrate?

Run these commands in order:

```bash
# 1. Create backup
node server/scripts/backup_production_users.js

# 2. Run migration
node server/scripts/migrate_production_database.js

# 3. Test your production app!
```

Good luck! 🚀
