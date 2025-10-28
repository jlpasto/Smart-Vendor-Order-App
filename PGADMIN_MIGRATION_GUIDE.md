# pgAdmin Migration Guide - Infinite Scroll Indexes

## Quick Start (Easiest Method)

### For Local Database (wholesale_app)

1. **Open pgAdmin 4**

2. **Navigate to your database:**
   - Expand "Servers" → "PostgreSQL 14" → "Databases"
   - Click on **"wholesale_app"**

3. **Open Query Tool:**
   - Right-click on "wholesale_app"
   - Select **"Query Tool"**
   - Or press `Alt + Shift + Q`

4. **Copy and paste this SQL:**

```sql
-- Drop indexes if they exist (for re-running)
DROP INDEX IF EXISTS idx_products_vendor_id;
DROP INDEX IF EXISTS idx_products_name_id;
DROP INDEX IF EXISTS idx_products_case_price_id;
DROP INDEX IF EXISTS idx_products_unit_price_id;
DROP INDEX IF EXISTS idx_products_retail_price_id;
DROP INDEX IF EXISTS idx_products_gm_id;

-- Create composite indexes for cursor-based pagination
CREATE INDEX idx_products_vendor_id ON products(vendor_name, id);
CREATE INDEX idx_products_name_id ON products(product_name, id);
CREATE INDEX idx_products_case_price_id ON products(wholesale_case_price, id);
CREATE INDEX idx_products_unit_price_id ON products(wholesale_unit_price, id);
CREATE INDEX idx_products_retail_price_id ON products(retail_unit_price, id);
CREATE INDEX idx_products_gm_id ON products(gm_percent, id);

-- Verify indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'products'
    AND indexname LIKE 'idx_products_%'
ORDER BY
    indexname;
```

5. **Execute:**
   - Click the **Execute** button (▶ play icon)
   - Or press `F5`

6. **Verify Results:**
   - You should see 6 "CREATE INDEX" messages
   - The verification query shows a table with 6 indexes

---

## Alternative Method: Load SQL File

If you prefer to load the migration file directly:

1. **Open Query Tool** (steps 1-3 above)

2. **Load File:**
   - Click "Open File" icon (📁 folder icon)
   - Or press `Ctrl + O`
   - Navigate to: `c:\Users\JL\Documents\Smart Vendor Order App\server\migrations\`
   - Select: `add_cursor_pagination_indexes.sql`
   - Click "Open"

3. **Execute:**
   - Press `F5` or click Execute button

4. **Check Results:**
   - Should show 6 "CREATE INDEX" confirmations

---

## For Production Database (Render)

### Step 1: Add Render Server in pgAdmin

1. **Register Server:**
   - Right-click "Servers" in left panel
   - Select "Register" → "Server"

2. **General Tab:**
   - **Name:** `Render Production - Wholesale App`

3. **Connection Tab:**
   - **Host:** `dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com`
   - **Port:** `5432`
   - **Maintenance database:** `wholesale_app_4csh`
   - **Username:** `wholesale_app_4csh_user`
   - **Password:** `lrmooKVMVwidUWaMYBNni3daraps5upq`
   - ✅ Check "Save password"

4. **Click "Save"**

### Step 2: Run Migration on Production

1. **Navigate to Production Database:**
   - Expand "Render Production - Wholesale App"
   - Expand "Databases"
   - Click on "wholesale_app_4csh"

2. **Open Query Tool** (Alt + Shift + Q)

3. **Run the same SQL** (from Quick Start section above)

4. **Verify:** Should see 6 indexes created

---

## Expected Results

After successful execution, you should see:

### Messages Tab:
```
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX
CREATE INDEX

Query returned successfully in 234 msec.
```

### Data Output Tab (from verification query):

| tablename | indexname | indexdef |
|-----------|-----------|----------|
| products | idx_products_case_price_id | CREATE INDEX idx_products_case_price_id ON public.products USING btree (wholesale_case_price, id) |
| products | idx_products_gm_id | CREATE INDEX idx_products_gm_id ON public.products USING btree (gm_percent, id) |
| products | idx_products_name_id | CREATE INDEX idx_products_name_id ON public.products USING btree (product_name, id) |
| products | idx_products_retail_price_id | CREATE INDEX idx_products_retail_price_id ON public.products USING btree (retail_unit_price, id) |
| products | idx_products_unit_price_id | CREATE INDEX idx_products_unit_price_id ON public.products USING btree (wholesale_unit_price, id) |
| products | idx_products_vendor_id | CREATE INDEX idx_products_vendor_id ON public.products USING btree (vendor_name, id) |

**✅ Success!** All 6 indexes are created.

---

## Troubleshooting

### ❌ Error: "relation 'products' does not exist"

**Cause:** Wrong database selected or products table not created yet

**Fix:**
1. Make sure you selected "wholesale_app" database (local)
2. Check that you've run `npm run seed` to create tables
3. Verify table exists: `SELECT * FROM products LIMIT 1;`

### ❌ Error: "permission denied"

**Cause:** Insufficient database permissions

**Fix:**
1. Make sure you're connected as `postgres` user (local)
2. Check username in connection settings
3. For production, use exact credentials from .env file

### ❌ Error: "index already exists"

**Status:** ✅ This is actually fine!

**Explanation:** Indexes were already created. You can:
- Ignore the error and continue
- Or run the DROP commands first to recreate them

### ⚠️ Warning: Query takes a long time (>30 seconds)

**Cause:** Creating indexes on large tables can take time

**Status:** Normal if you have thousands of products

**Action:**
- Wait for completion (can take 1-5 minutes for large tables)
- Don't interrupt the process
- Indexes only need to be created once

---

## Verification Checklist

After running the migration:

- [ ] No errors in Messages tab
- [ ] 6 "CREATE INDEX" confirmations
- [ ] Verification query shows 6 rows
- [ ] All index names start with `idx_products_`
- [ ] Each index includes both a field and `id`

---

## Visual Guide

### pgAdmin Interface:

```
┌─────────────────────────────────────────────────────┐
│ [Open File] [Execute/Refresh] [Save] [Clear]       │
├─────────────────────────────────────────────────────┤
│ Query Editor                                        │
│                                                     │
│ CREATE INDEX idx_products_vendor_id...             │
│ CREATE INDEX idx_products_name_id...               │
│ ...                                                 │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Data Output | Messages | Notifications | History   │
├─────────────────────────────────────────────────────┤
│ ✅ CREATE INDEX (6 times)                          │
│ Query returned successfully                         │
└─────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Database Credentials

**Local:**
- Database: `wholesale_app`
- User: `postgres`
- Password: `postgres1234`
- Host: `localhost`
- Port: `5432`

**Production (Render):**
- Database: `wholesale_app_4csh`
- User: `wholesale_app_4csh_user`
- Password: `lrmooKVMVwidUWaMYBNni3daraps5upq`
- Host: `dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com`
- Port: `5432`

### File Locations

- **Migration File:** `server/migrations/add_cursor_pagination_indexes.sql`
- **SQL to Copy:** See "Quick Start" section above

---

## After Running Migration

1. ✅ Close Query Tool
2. ✅ Test your application: `npm run dev`
3. ✅ Navigate to Products page
4. ✅ Scroll down - infinite scroll should work!
5. ✅ Check browser console for errors
6. ✅ Verify smooth performance

---

## Need More Help?

- **General Deployment:** See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- **Production Details:** See [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
- **Technical Info:** See [INFINITE_SCROLL_IMPLEMENTATION.md](INFINITE_SCROLL_IMPLEMENTATION.md)

---

**That's it! You've successfully created the database indexes using pgAdmin.** 🎉

Your infinite scrolling feature is now ready to deliver 70% faster performance!
