# Quick Start: Production Database Migration

## 🚀 Ready to migrate your production database?

Follow these simple steps:

---

## Option 1: All-in-One Script (Recommended)

Run both backup and migration automatically:

```bash
node server/scripts/migrate_production_complete.js
```

This will:
1. ✅ Create a backup of your users table
2. ✅ Run the migration (with confirmation prompts)
3. ✅ Verify the migration completed successfully

---

## Option 2: Step-by-Step

### Step 1: Backup

```bash
node server/scripts/backup_production_users.js
```

**Result:** Creates `server/backups/users_backup_YYYY-MM-DD.json`

### Step 2: Migrate

```bash
node server/scripts/migrate_production_database.js
```

**Prompts:**
- "Are you sure you want to continue?" → Type `yes`
- "Have you backed up your database?" → Type `yes`

---

## What Gets Changed?

### Database Changes
- ✅ Adds `assigned_product_ids` column to users table
- ✅ Creates index for fast lookups
- ✅ Migrates existing vendor assignments to product assignments
- ✅ Keeps old `assigned_vendor_ids` column (for safety)

### Your Data
```
BEFORE:
User: john@example.com
  assigned_vendor_ids: [1, 2, 3]
  assigned_product_ids: null

AFTER:
User: john@example.com
  assigned_vendor_ids: [1, 2, 3]  ← Still there!
  assigned_product_ids: [101, 102, 103, 104, 105, ...]  ← NEW!
```

---

## After Migration

### Test Your App

1. **Go to your production URL:**
   - https://wholesale-app-frontend.onrender.com

2. **Login as Admin:**
   - Click "Manage Buyers"
   - Click "Manage Products" on any buyer
   - Try the new collapsible vendor UI

3. **Login as Buyer:**
   - Verify you only see assigned products

---

## Rollback (If Needed)

If something goes wrong:

```sql
-- Connect to database and run:
ALTER TABLE users DROP COLUMN assigned_product_ids;
DROP INDEX idx_users_assigned_product_ids;
```

Your old `assigned_vendor_ids` will still be intact.

---

## Need Help?

📖 **Read the full guide:**
- `PRODUCTION_MIGRATION_INSTRUCTIONS.md` - Complete step-by-step instructions
- `MIGRATION_GUIDE_PRODUCT_ASSIGNMENTS.md` - Detailed testing checklist
- `IMPLEMENTATION_SUMMARY.md` - Technical documentation

---

## Quick Checklist

Before migrating:
- [ ] I have a stable internet connection
- [ ] I'm ready to test the app after migration
- [ ] I've read the warnings about modifying production

After migrating:
- [ ] Backup file was created
- [ ] Migration completed successfully
- [ ] Admin can use "Manage Products" modal
- [ ] Buyers only see assigned products

---

## Time Required

- Backup: 30 seconds
- Migration: 1-2 minutes
- Testing: 15-30 minutes

**Total:** ~20-30 minutes

---

## Ready? Let's Go!

```bash
# Run this command to start:
node server/scripts/migrate_production_complete.js
```

Good luck! 🎉
