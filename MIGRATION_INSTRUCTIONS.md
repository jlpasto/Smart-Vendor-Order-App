# 🚨 MIGRATION REQUIRED - Run This First!

## Before Starting the Application

You **MUST** run the vendor relationship migration to add the required database columns.

## Quick Start (pgAdmin)

1. Open **pgAdmin**
2. Connect to database: **`wholesale_app`**
3. Right-click database → **Query Tool**
4. Open file: **`server/migrations/add_vendor_relationships.sql`**
5. Click **Execute** (F5)
6. Check output: Should see "Query returned successfully"

## Verify Migration

Run this in pgAdmin Query Tool:

```sql
-- Check columns exist
\d users
\d products

-- Should show:
-- users: assigned_vendor_ids | integer[]
-- products: vendor_id | integer
```

## Then Start Your App

```bash
npm run dev
```

## What This Migration Does

- Adds `vendor_id` column to products table (links to vendors table)
- Adds `assigned_vendor_ids` column to users table (stores vendor IDs for buyers)
- Creates necessary indexes for performance
- Maintains backward compatibility with existing data

## If You Skip This

You'll see this error:
```
ERROR: column "assigned_vendor_ids" does not exist
```

## Need Help?

See [VENDOR_ASSIGNMENT_UPDATED.md](VENDOR_ASSIGNMENT_UPDATED.md) for full documentation.
