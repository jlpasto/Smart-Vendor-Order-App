# Migration Guide: Vendor Assignments → Product Assignments

## Overview
This guide covers the migration from vendor-based assignments to product-based assignments for buyers. This allows fine-grained control over which specific products a buyer can access, rather than giving access to entire vendor catalogs.

---

## Prerequisites

Before starting the migration:
- ✅ Database backup completed
- ✅ All users logged out
- ✅ Backend server stopped
- ✅ Frontend build process stopped

---

## Step 1: Database Migration

### Option A: Using PostgreSQL Client (psql)

```bash
# Connect to your database
psql -U postgres -d smart_vendor_order_app

# Run the migration file
\i server/migrations/migrate_to_product_assignments.sql
```

### Option B: Using Node.js Migration Script

```bash
# From the project root directory
cd server
node scripts/migrate_vendor_to_product_assignments.js
```

This script will:
1. Add the `assigned_product_ids` column to the users table
2. Create a GIN index for efficient array operations
3. Migrate existing vendor assignments to product assignments
4. Display a summary of the migration

**Expected Output:**
```
🚀 Starting migration: Vendor assignments → Product assignments

Step 1: Adding assigned_product_ids column...
✅ Column and index created

Step 2: Fetching buyers with vendor assignments...
Found 5 buyers with vendor assignments

Step 3: Migrating each buyer...

👤 Processing: John Doe (ID: 2)
   Assigned vendors: 3 vendor(s)
   ✅ Assigned 45 products

👤 Processing: Jane Smith (ID: 3)
   Assigned vendors: 2 vendor(s)
   ✅ Assigned 28 products

...

═══════════════════════════════════════════════════════════
Migration Summary:
═══════════════════════════════════════════════════════════
✅ Successfully migrated: 5 buyers
⚠️  Warnings (no products): 0 buyers
📊 Total processed: 5 buyers
```

---

## Step 2: Verify Database Changes

```sql
-- Check that the new column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'assigned_product_ids';

-- Verify migration results
SELECT
  id,
  email,
  role,
  array_length(assigned_vendor_ids, 1) as vendor_count,
  array_length(assigned_product_ids, 1) as product_count
FROM users
WHERE role = 'buyer'
ORDER BY id;

-- Example output:
-- id |  email               | role  | vendor_count | product_count
-- ---|----------------------|-------|--------------|---------------
-- 2  | john@example.com     | buyer | 3            | 45
-- 3  | jane@example.com     | buyer | 2            | 28
```

---

## Step 3: Deploy Backend Changes

The following files have been modified:

### Modified Files:
1. **server/routes/products.js**
   - Updated product filtering to use `assigned_product_ids`
   - Added new endpoint: `GET /api/products/grouped-by-vendor`

2. **server/routes/users.js**
   - Added support for `assigned_products` parameter
   - Returns `assigned_product_ids` in user responses
   - Validates product IDs on assignment

### No server restart needed if using nodemon
If using `nodemon`, the changes will auto-reload. Otherwise:

```bash
# Stop the server (Ctrl+C)
# Start the server
npm run server
# or
node server/index.js
```

---

## Step 4: Deploy Frontend Changes

### Modified Files:
1. **client/src/pages/admin/AdminUsers.jsx**
   - User list now displays product count instead of vendor count
   - "View Vendors" button renamed to "Manage Products"
   - Complete refactor of VendorAssignmentModal → ProductAssignmentModal

### Rebuild and restart frontend:

```bash
cd client
npm run build  # if production
# or
npm run dev    # if development
```

---

## Step 5: Testing

### Backend API Testing

#### 1. Test New Endpoint: GET /api/products/grouped-by-vendor

```bash
# Test with admin JWT token
curl -X GET http://localhost:5000/api/products/grouped-by-vendor \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "vendors": [
    {
      "id": 1,
      "name": "Vendor A",
      "logo_url": "https://...",
      "website_url": "https://...",
      "products": [
        {
          "id": 101,
          "product_name": "Product 1",
          "vendor_connect_id": "VEN-001",
          "size": "12 oz",
          "wholesale_case_price": 24.99,
          "wholesale_unit_price": 2.08,
          "retail_unit_price": 4.99,
          "product_image": "https://...",
          "main_category": "Beverages",
          "sub_category": "Soda"
        },
        ...
      ],
      "product_count": 15
    },
    ...
  ],
  "total_vendors": 8,
  "total_products": 120
}
```

#### 2. Test Product Assignment: PUT /api/users/:id

```bash
# Assign products to a buyer
curl -X PUT http://localhost:5000/api/users/2 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_products": [101, 102, 103, 105, 108]
  }'
```

**Expected Response:**
```json
{
  "id": 2,
  "name": "John Doe",
  "email": "john@example.com",
  "id_no": "EMP001",
  "role": "buyer",
  "assigned_vendor_ids": [1, 2, 3],
  "assigned_product_ids": [101, 102, 103, 105, 108],
  "created_at": "2025-01-01T00:00:00.000Z"
}
```

#### 3. Test Product Filtering: GET /api/products (as buyer)

```bash
# Login as buyer first to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "buyer_password"
  }'

# Use buyer JWT token to fetch products
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer BUYER_JWT_TOKEN"
```

**Expected Behavior:**
- Buyer should ONLY see products in their `assigned_product_ids` array
- Admin should see ALL products (no filtering)

---

### Frontend UI Testing

#### Test Checklist:

##### 1. **User List Display** (AdminUsers.jsx)
- [ ] Product count displays correctly (e.g., "45 products")
- [ ] "No products" displays for buyers with empty assignments
- [ ] "Manage Products" button appears for each buyer
- [ ] Clicking "Manage Products" opens the modal

##### 2. **Product Assignment Modal - Initial Load**
- [ ] Modal opens with title "Assign Products"
- [ ] Shows correct user name in subtitle
- [ ] Displays stats (e.g., "45 of 120 products selected across 8 vendors")
- [ ] All vendors are listed
- [ ] Vendors are collapsed by default
- [ ] Previously assigned products show as checked
- [ ] Vendor checkbox shows correct state:
  - Unchecked: No products selected
  - Checked: All products selected
  - Indeterminate: Some products selected

##### 3. **Expand/Collapse Functionality**
- [ ] Click expand icon (▶) → vendor expands, icon changes to (▼)
- [ ] Click collapse icon (▼) → vendor collapses, icon changes to (▶)
- [ ] "Expand All" button → all vendors expand
- [ ] "Collapse All" button → all vendors collapse
- [ ] Expanded vendors show product list

##### 4. **Vendor Checkbox Behavior**
- [ ] Click unchecked vendor checkbox → ALL products under vendor become checked
- [ ] Click checked vendor checkbox → ALL products under vendor become unchecked
- [ ] Click partial vendor checkbox (indeterminate) → ALL products become checked
- [ ] Vendor checkbox auto-updates when products are manually checked/unchecked
- [ ] Selection badge appears showing "X of Y selected"

##### 5. **Product Checkbox Behavior**
- [ ] Click product checkbox → product becomes checked/unchecked
- [ ] Product selection updates parent vendor checkbox state
- [ ] Product selection updates global count
- [ ] Product info displays: name, ID, price

##### 6. **Search Functionality**
- [ ] Type vendor name → filters vendors
- [ ] Type product name → filters products (shows parent vendor)
- [ ] Search matches partial names (case-insensitive)
- [ ] "No results" message displays when no matches
- [ ] Clear search → shows all vendors again

##### 7. **Bulk Actions**
- [ ] "Select All" → selects ALL products from ALL vendors
- [ ] "Clear All" → deselects ALL products
- [ ] Actions update counts and checkbox states immediately

##### 8. **Save Functionality**
- [ ] Click "Save Assignments" → shows "Saving..." state
- [ ] Success → shows alert "Product assignments updated successfully!"
- [ ] Success → modal closes
- [ ] Success → user list refreshes with new product count
- [ ] Error → shows error alert
- [ ] Error → modal stays open
- [ ] "Cancel" button closes modal without saving

##### 9. **Performance Testing**
- [ ] Modal loads within 2 seconds (with 100+ products)
- [ ] Expand/collapse is instant
- [ ] Checkbox updates are instant
- [ ] Search filters in real-time (no lag)
- [ ] Save operation completes within 3 seconds

---

### Integration Testing

#### Scenario 1: Assign Products to New Buyer
1. Admin creates new buyer
2. Admin opens "Manage Products" for new buyer
3. Verify: No products are pre-selected
4. Admin expands "Vendor A"
5. Admin checks "Vendor A" checkbox → all products selected
6. Admin saves
7. Buyer logs in
8. Verify: Buyer ONLY sees Vendor A's products

#### Scenario 2: Partial Product Assignment
1. Admin opens "Manage Products" for buyer
2. Admin expands "Vendor B" (10 products)
3. Admin checks 5 specific products
4. Verify: Vendor checkbox shows indeterminate state
5. Verify: Badge shows "5 of 10 selected"
6. Admin saves
7. Buyer logs in
8. Verify: Buyer ONLY sees those 5 products from Vendor B

#### Scenario 3: Remove All Product Access
1. Admin opens "Manage Products" for buyer
2. Admin clicks "Clear All"
3. Verify: All checkboxes unchecked
4. Verify: Count shows "0 of X products selected"
5. Admin saves
6. Buyer logs in
7. Verify: Buyer sees "No products found" or empty product list

#### Scenario 4: Search and Assign
1. Admin opens "Manage Products"
2. Admin types "Organic" in search
3. Verify: Only products with "Organic" in name appear
4. Admin checks all filtered products
5. Admin clears search
6. Verify: Selected products remain checked
7. Admin saves
8. Buyer logs in
9. Verify: Buyer sees all "Organic" products

---

## Step 6: Cleanup (Optional - After Thorough Testing)

After you've verified everything works correctly for at least 1-2 weeks:

```sql
-- Drop the old vendor assignments column
ALTER TABLE users DROP COLUMN IF EXISTS assigned_vendor_ids;

-- Drop the old index
DROP INDEX IF EXISTS idx_users_assigned_vendor_ids;
```

⚠️ **WARNING:** Only run cleanup AFTER thorough testing. Keep the old column for rollback safety.

---

## Rollback Procedure (If Needed)

If something goes wrong, you can rollback:

```sql
-- 1. Remove the new column
ALTER TABLE users DROP COLUMN IF EXISTS assigned_product_ids;

-- 2. Drop the new index
DROP INDEX IF EXISTS idx_users_assigned_product_ids;

-- 3. The old assigned_vendor_ids column should still exist
-- Verify:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'assigned_vendor_ids';
```

Then:
1. Restore the old backend code (revert git commit)
2. Restore the old frontend code (revert git commit)
3. Restart servers

---

## Troubleshooting

### Issue: "assigned_product_ids is undefined" in Frontend

**Cause:** Old user data cached in frontend state

**Solution:**
```javascript
// Force refresh users data
// In AdminUsers.jsx, add console.log:
console.log('User data:', users);

// Check if assigned_product_ids exists
```

### Issue: Buyer Sees No Products After Migration

**Possible Causes:**
1. Migration script didn't run
2. Vendor has no products (vendor_id is NULL)
3. Products were deleted after vendor assignment

**Debug:**
```sql
-- Check buyer's assignments
SELECT id, email, assigned_product_ids
FROM users
WHERE email = 'buyer@example.com';

-- Check if assigned products exist
SELECT id, product_name FROM products
WHERE id = ANY(ARRAY[101, 102, 103]); -- Replace with actual IDs
```

### Issue: "Invalid product IDs" Error When Saving

**Cause:** Trying to assign products that don't exist

**Solution:**
- Admin should close and reopen modal (re-fetches products)
- Verify products weren't deleted from database

---

## Summary

✅ **What Changed:**
- Database: Added `assigned_product_ids` column
- Backend: Product filtering now uses product IDs instead of vendor IDs
- Backend: New endpoint for grouped products
- Backend: User routes support product assignments
- Frontend: Enhanced UI with collapsible vendor groups and per-product selection

✅ **Benefits:**
- Fine-grained access control
- Buyers can have partial access to vendor catalogs
- More flexible business logic
- Better performance (single array lookup vs joins)

✅ **Backward Compatibility:**
- Old `assigned_vendor_ids` column preserved (for rollback)
- Both vendor and product assignments supported temporarily
- Gradual migration possible

---

## Need Help?

If you encounter issues during migration:
1. Check server logs: `server/logs/` or console output
2. Check browser console for frontend errors
3. Verify database migration completed successfully
4. Review this guide's troubleshooting section
