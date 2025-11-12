# Database Migration Guide

This guide will help you copy the complete schema and data from your existing PostgreSQL database to a new one.

## Overview

**Source Database:** `wholesale_app_4csh` on Render
**Target Database:** Any PostgreSQL database (configured in `.env`)

## Migration Process

### Step 1: Extract Schema from Source Database

This extracts the complete table structure, constraints, and indexes:

```bash
npm run extract-schema
```

**What it does:**
- Connects to source database
- Extracts all table definitions
- Captures foreign keys, constraints, and indexes
- Saves to `server/extracted-schema.sql`

**Output:** `server/extracted-schema.sql`

---

### Step 2: Extract Data from Source Database

This exports all data from all tables:

```bash
npm run extract-data
```

**What it does:**
- Connects to source database
- Exports all rows from all tables
- Maintains referential integrity order
- Generates INSERT statements
- Saves to `server/extracted-data.sql`

**Output:** `server/extracted-data.sql`

---

### Step 3: Apply to New Database

This applies the schema and data to your target database:

```bash
npm run migrate-db
```

**What it does:**
- Reads `extracted-schema.sql`
- Reads `extracted-data.sql`
- Connects to target database (from `.env`)
- Drops existing tables
- Creates new tables
- Imports all data
- Resets sequences
- Verifies row counts

**⚠️ WARNING:** This will **REPLACE ALL DATA** in the target database!

You must type `MIGRATE` to confirm.

---

## Complete Migration Example

### From Your Computer

```bash
# 1. Extract from old database
npm run extract-schema
npm run extract-data

# 2. Update .env with new database credentials
# Edit .env file with new DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# 3. Migrate to new database
npm run migrate-db
```

### From Render Shell

If you're migrating on Render itself:

```bash
# 1. First, extract schema and data locally
npm run extract-schema
npm run extract-data

# 2. Commit the SQL files
git add server/extracted-schema.sql server/extracted-data.sql
git commit -m "Add database migration files"
git push

# 3. In Render shell, update .env.production with new DB credentials
# Then run migration
node server/migrate-database.js
```

---

## Source Database Credentials

The source database is hardcoded in the extraction scripts:

```
Host: dpg-d3jjrr7fte5s73frlnig-a
Database: wholesale_app_4csh
User: wholesale_app_4csh_user
Password: lrmooKVMVwidUWaMYBNni3daraps5upq
```

## Target Database Credentials

Target database is read from your `.env` file:

```env
DB_HOST=your-new-host
DB_PORT=5432
DB_NAME=your-new-database
DB_USER=your-new-user
DB_PASSWORD=your-new-password
```

---

## What Gets Migrated

### Schema
- ✅ All table structures
- ✅ All column definitions
- ✅ Primary keys
- ✅ Foreign keys
- ✅ Check constraints
- ✅ Unique constraints
- ✅ All indexes
- ✅ Sequences

### Data
- ✅ All rows from all tables
- ✅ Correct order (respects foreign keys)
- ✅ Sequences reset to correct values
- ✅ NULL values preserved
- ✅ Array columns preserved
- ✅ All data types preserved

---

## Tables Included

Based on your current schema:
- `users` - All user accounts and buyer assignments
- `vendors` - All vendor information
- `products` - All products and pricing
- `orders` - All order history

---

## Verification

After migration completes, it will show:

```
📊 Table row counts:
  orders: XX rows
  products: XX rows
  users: XX rows
  vendors: XX rows
```

Compare these numbers with your source database to verify completeness.

---

## Troubleshooting

### "extracted-schema.sql not found"
Run `npm run extract-schema` first.

### "extracted-data.sql not found"
Run `npm run extract-data` first.

### Connection errors
- Check your `.env` file has correct credentials
- Ensure database accepts connections
- For Render databases, SSL is automatically enabled

### Foreign key errors
The migration script disables constraints during import with:
```sql
SET session_replication_role = replica;
```

If you still get errors, check that:
1. Schema was applied before data
2. Tables are in correct dependency order

### "FATAL: no pg_hba.conf entry"
Your database doesn't allow connections. Check:
- IP whitelist settings
- SSL requirements
- Connection string format

---

## Safety Features

- ✅ Requires typing "MIGRATE" to confirm
- ✅ Shows target database before proceeding
- ✅ Verifies files exist before starting
- ✅ Maintains transaction integrity
- ✅ Disables triggers during import

---

## Alternative: Manual psql Method

If scripts fail, you can use psql directly:

```bash
# On your computer
psql postgresql://source-connection-string -f server/extracted-schema.sql
psql postgresql://source-connection-string -f server/extracted-data.sql

# Or on Render shell
psql $DATABASE_URL -f server/extracted-schema.sql
psql $DATABASE_URL -f server/extracted-data.sql
```

---

## Files Generated

- `server/extracted-schema.sql` - Complete database schema
- `server/extracted-data.sql` - Complete database data

**Note:** These files are NOT committed to git by default. If you want to save them, add to git:

```bash
git add server/extracted-*.sql
git commit -m "Add database backup"
```

---

## Script Files

- [server/extract-schema.js](server/extract-schema.js) - Exports schema
- [server/extract-data.js](server/extract-data.js) - Exports data
- [server/migrate-database.js](server/migrate-database.js) - Imports to new DB

---

## When to Use This

- ✅ Moving from one Render database to another
- ✅ Creating a development copy of production
- ✅ Backing up before major changes
- ✅ Migrating to different hosting provider
- ✅ Restoring from backup

---

## Performance

- Schema extraction: ~5-10 seconds
- Data extraction: Depends on data size (~10-60 seconds for typical app)
- Migration: Depends on data size (~10-60 seconds for typical app)

Large databases (100k+ rows) may take several minutes.

---

## Support

If you encounter issues:

1. Check [package.json](package.json) has all scripts
2. Verify database credentials in `.env`
3. Ensure network connectivity to databases
4. Check Render logs for specific errors

---

## Quick Reference

```bash
# Full migration workflow
npm run extract-schema   # Step 1
npm run extract-data     # Step 2
npm run migrate-db       # Step 3

# Other database scripts
npm run reset-db         # Reset with updated schema (no data)
npm run seed-admin       # Create admin user only
npm run seed             # Seed with sample data
```
