# Production Migration Guide - Vendor Assignment Feature

## 🚨 IMPORTANT: Run This on Production Database

Your production database on Render also needs the vendor assignment migration.

## Production Database Details

**Host:** `dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com`
**Database:** `wholesale_app_4csh`
**User:** `wholesale_app_4csh_user`
**Password:** `lrmooKVMVwidUWaMYBNni3daraps5upq`

## Option 1: Using pgAdmin (Recommended)

### Step 1: Connect to Production Database

1. Open **pgAdmin**
2. Right-click **Servers** → **Create** → **Server**
3. In "General" tab:
   - Name: `Wholesale App Production (Render)`
4. In "Connection" tab:
   - Host: `dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com`
   - Port: `5432`
   - Maintenance database: `wholesale_app_4csh`
   - Username: `wholesale_app_4csh_user`
   - Password: `lrmooKVMVwidUWaMYBNni3daraps5upq`
   - ✅ Check "Save password"
5. Click **Save**

### Step 2: Run Migration

1. Expand your new server connection
2. Navigate to: **Servers** → **Wholesale App Production** → **Databases** → **wholesale_app_4csh**
3. Right-click database → **Query Tool**
4. Click **Open File** icon (folder)
5. Select: `server/migrations/add_vendor_relationships.sql`
6. Click **Execute** (F5)
7. Check output panel for success messages

### Step 3: Verify Migration

Run these queries in the Query Tool to verify:

```sql
-- Check users table has new column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name = 'assigned_vendor_ids';
-- Should return: assigned_vendor_ids | ARRAY

-- Check products table has new column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'vendor_id';
-- Should return: vendor_id | integer

-- Check all products have vendor_id populated
SELECT
  COUNT(*) as total_products,
  COUNT(vendor_id) as products_with_vendor_id,
  COUNT(*) - COUNT(vendor_id) as products_missing_vendor_id
FROM products;
-- products_missing_vendor_id should be 0

-- Check indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('users', 'products')
  AND (indexname LIKE '%vendor%');
-- Should show:
-- idx_products_vendor_id | products
-- idx_users_assigned_vendor_ids | users
```

## Option 2: Using Command Line

### Windows

Run the batch file:
```bash
run_production_migration.bat
```

Or manually:
```bash
set PGPASSWORD=lrmooKVMVwidUWaMYBNni3daraps5upq
psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -f "server/migrations/add_vendor_relationships.sql"
```

### Mac/Linux

```bash
export PGPASSWORD=lrmooKVMVwidUWaMYBNni3daraps5upq
psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -f server/migrations/add_vendor_relationships.sql
```

## Before Running Migration

### 1. Backup Production Database (IMPORTANT!)

```bash
# Backup command
pg_dump -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com \
  -U wholesale_app_4csh_user \
  -d wholesale_app_4csh \
  > backup_before_vendor_assignment_$(date +%Y%m%d_%H%M%S).sql
```

Or use Render dashboard:
1. Go to your database on Render
2. Click "Backups" tab
3. Click "Create Manual Backup"

### 2. Test on Local First

Make sure you've run and verified the migration on your local `wholesale_app` database first!

## After Migration

### Deploy Updated Code to Render

1. Commit all changes:
```bash
git add .
git commit -m "Add vendor assignment feature using vendor IDs"
git push origin main
```

2. Render will automatically deploy the new code

### Test Production

1. Visit your production URL
2. Login as admin
3. Go to Manage Users
4. Click "View Vendors" - should work!
5. Assign vendors to a test buyer
6. Login as buyer - should only see assigned vendor products

## Troubleshooting

### "Column already exists" Error

If you see this error, the migration was already run. Skip it.

### "Relation does not exist" Error

This means the migration failed partway. Check which step failed and run remaining steps manually.

### Products Missing vendor_id

Run this query to populate missing vendor_ids:

```sql
-- Find products without vendor_id
SELECT id, vendor_name FROM products WHERE vendor_id IS NULL;

-- Populate from vendors table
UPDATE products p
SET vendor_id = v.id
FROM vendors v
WHERE p.vendor_name = v.name AND p.vendor_id IS NULL;
```

### Vendors Table Empty

If your production vendors table is empty:

```sql
-- Create vendors from products
INSERT INTO vendors (name)
SELECT DISTINCT vendor_name
FROM products
WHERE vendor_name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Then re-run vendor_id population
UPDATE products p
SET vendor_id = v.id
FROM vendors v
WHERE p.vendor_name = v.name;
```

## Rollback Plan

If something goes wrong, you can rollback:

```sql
-- Remove new columns
ALTER TABLE products DROP COLUMN IF EXISTS vendor_id;
ALTER TABLE users DROP COLUMN IF EXISTS assigned_vendor_ids;

-- Drop indexes
DROP INDEX IF EXISTS idx_products_vendor_id;
DROP INDEX IF EXISTS idx_users_assigned_vendor_ids;

-- Drop foreign key constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_vendor;
```

Then restore from your backup:
```bash
psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com \
  -U wholesale_app_4csh_user \
  -d wholesale_app_4csh \
  < your_backup_file.sql
```

## Migration Status Checklist

- [ ] Backup production database
- [ ] Run migration on local database first
- [ ] Verify local migration success
- [ ] Run migration on production database
- [ ] Verify production migration success
- [ ] Commit and push code changes
- [ ] Test on production URL
- [ ] Verify vendor assignment works
- [ ] Test buyer product filtering

## Support

If you encounter issues:
1. Check server logs on Render
2. Check database logs on Render
3. Review verification queries output
4. Check [VENDOR_ASSIGNMENT_UPDATED.md](VENDOR_ASSIGNMENT_UPDATED.md) for detailed docs
