# Vendor Assignment Feature - Deployment Checklist

## Pre-Deployment Steps

### Local Environment

- [ ] **Run migration on local database** (`wholesale_app`)
  - Open pgAdmin
  - Connect to `wholesale_app` database
  - Run `server/migrations/add_vendor_relationships.sql`
  - Verify: `\d users` shows `assigned_vendor_ids`
  - Verify: `\d products` shows `vendor_id`

- [ ] **Test locally**
  - Start app: `npm run dev`
  - Login as admin
  - Go to Manage Users page
  - Click "View Vendors" - modal opens
  - Select vendors and save
  - Create/login as test buyer
  - Verify products filtered correctly
  - Verify admin sees all products

- [ ] **Build successfully**
  - Run: `npm run build`
  - No errors in build output
  - Check dist/ folder created

### Production Environment

- [ ] **Backup production database** (CRITICAL!)
  - Use Render dashboard: Create Manual Backup
  - Or use pg_dump command
  - Save backup file with timestamp
  - Verify backup size is reasonable

- [ ] **Run migration on production** (Render PostgreSQL)
  - Follow [PRODUCTION_MIGRATION_GUIDE.md](PRODUCTION_MIGRATION_GUIDE.md)
  - Option 1: pgAdmin (recommended)
  - Option 2: Command line with `run_production_migration.bat`
  - Verify migration completed successfully

- [ ] **Verify production migration**
  ```sql
  -- Run these in pgAdmin connected to production:

  -- Check columns exist
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'users' AND column_name = 'assigned_vendor_ids';

  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'vendor_id';

  -- Check all products have vendor_id
  SELECT COUNT(*) as total, COUNT(vendor_id) as with_vendor
  FROM products;
  -- Both numbers should match!
  ```

## Deployment Steps

- [ ] **Commit changes to git**
  ```bash
  git add .
  git status  # Review changes
  git commit -m "Add vendor assignment feature using vendor IDs

  - Adds vendor_id to products table with foreign key
  - Adds assigned_vendor_ids to users table
  - Admin can assign vendors to buyers via modal UI
  - Buyers automatically filtered to assigned vendors
  - Proper database relationships (IDs not names)
  - Includes comprehensive migration and docs"
  ```

- [ ] **Push to GitHub**
  ```bash
  git push origin main
  ```

- [ ] **Monitor Render deployment**
  - Go to Render dashboard
  - Watch deployment logs
  - Ensure build succeeds
  - Ensure server starts without errors

## Post-Deployment Verification

### Test on Production URL

- [ ] **Admin functionality**
  - Login as admin
  - Navigate to Manage Users
  - "Assigned Vendors" column visible
  - Click "View Vendors" button
  - Modal opens with vendor list
  - Search functionality works
  - Select vendors and save
  - Page refreshes, assignments persist
  - Vendor count displays correctly

- [ ] **Buyer functionality**
  - Create test buyer account (or use existing)
  - As admin: assign 2-3 vendors to test buyer
  - Logout, login as test buyer
  - Navigate to Products page
  - Verify: Only products from assigned vendors appear
  - Verify: Vendor filter (if shown) only shows assigned vendors
  - Verify: Search works within assigned vendors
  - Verify: No products from unassigned vendors

- [ ] **Admin bypass**
  - Login as admin
  - Navigate to Products page
  - Verify: All products visible (no filtering)
  - Verify: All vendors available

### Edge Cases

- [ ] **Buyer with no vendors assigned**
  - Create buyer, don't assign any vendors
  - Login as that buyer
  - Products page should show "no products" or empty state

- [ ] **Buyer with all vendors assigned**
  - Assign all vendors to a buyer
  - Login as that buyer
  - Should see all products (same as admin)

- [ ] **Vendor name change**
  - As admin: Edit a vendor's name
  - Verify: Buyer assignments still work (uses IDs)
  - Verify: Products still appear for assigned buyers

### Database Integrity

- [ ] **Check foreign keys**
  ```sql
  -- Verify foreign key exists
  SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'products';
  -- Should show: fk_products_vendor
  ```

- [ ] **Check indexes**
  ```sql
  -- Verify performance indexes exist
  SELECT indexname, tablename
  FROM pg_indexes
  WHERE tablename IN ('users', 'products')
    AND indexname LIKE '%vendor%';
  -- Should show:
  -- idx_products_vendor_id
  -- idx_users_assigned_vendor_ids
  ```

## Performance Checks

- [ ] **Page load times**
  - Products page loads in < 2 seconds
  - Vendor modal opens in < 1 second
  - Save operation completes in < 2 seconds

- [ ] **Database queries**
  - No N+1 queries
  - Indexes being used (check EXPLAIN ANALYZE if needed)

## Documentation

- [ ] **Updated README.md** with vendor assignment feature
- [ ] **Created VENDOR_ASSIGNMENT_UPDATED.md** with full docs
- [ ] **Created PRODUCTION_MIGRATION_GUIDE.md** for production deployment
- [ ] **Created MIGRATION_INSTRUCTIONS.md** for quick start
- [ ] **Updated FEATURES.md** with new capabilities

## Rollback Plan (If Needed)

If something goes wrong:

1. **Revert code changes**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Rollback database** (if necessary)
   ```sql
   ALTER TABLE products DROP COLUMN IF EXISTS vendor_id;
   ALTER TABLE users DROP COLUMN IF EXISTS assigned_vendor_ids;
   DROP INDEX IF EXISTS idx_products_vendor_id;
   DROP INDEX IF EXISTS idx_users_assigned_vendor_ids;
   ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_vendor;
   ```

3. **Restore from backup** (if needed)
   - Use Render dashboard to restore backup
   - Or use psql to restore from backup file

## Success Criteria

✅ All checklist items completed
✅ Production migration successful
✅ No errors in server logs
✅ Admin can assign vendors
✅ Buyers see only assigned vendors
✅ Database relationships intact
✅ Performance acceptable

## Notes

**Date Deployed:** _______________

**Deployed By:** _______________

**Backup File:** _______________

**Issues Encountered:**
_______________________________
_______________________________
_______________________________

**Resolution:**
_______________________________
_______________________________
_______________________________
