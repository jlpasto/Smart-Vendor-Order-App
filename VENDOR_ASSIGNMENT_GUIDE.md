# Vendor Assignment Feature - User Guide

## Overview

The vendor assignment feature allows administrators to control which vendors each buyer can see in the application. This is useful for:
- Restricting buyers to specific product catalogs
- Territory-based vendor access control
- Managing buyer-vendor relationships
- Improving buyer experience by showing only relevant products

## How It Works

### For Administrators

1. **Accessing User Management**
   - Navigate to the Admin section
   - Click on "Manage Users"

2. **Viewing Vendor Assignments**
   - The "Assigned Vendors" column shows how many vendors are assigned to each buyer
   - "All vendors" means no restrictions (buyer can see all products)
   - "X vendors" means the buyer can only see products from those X vendors

3. **Assigning Vendors to a Buyer**
   - Click the "View Vendors" button for any user
   - A modal will open showing all available vendors
   - Use the search box to quickly find specific vendors
   - Check/uncheck vendors to assign or remove them
   - Use "Select All Shown" to select all vendors matching current search
   - Use "Clear All" to remove all vendor assignments
   - Click "Save Assignments" to apply changes

4. **Best Practices**
   - Assign at least one vendor to buyers (empty assignments = no products visible)
   - Use search when dealing with many vendors
   - Review assignments periodically to ensure they're up to date

### For Buyers (Non-Admin Users)

- Buyers automatically see only products from their assigned vendors
- No action needed - the filtering happens automatically
- If you need access to additional vendors, contact your administrator

## Technical Details

### Database Schema

A new column `assigned_vendors` has been added to the `users` table:
- Type: `TEXT[]` (PostgreSQL array)
- Stores vendor names as strings (e.g., `['2Betties', 'Absurd Snacks']`)
- Empty array `[]` means buyer has no vendor restrictions
- Indexed with GIN for efficient array operations

### API Changes

#### Users API
- `GET /api/users` - Now includes `assigned_vendors` field
- `GET /api/users/:id` - Now includes `assigned_vendors` field
- `PUT /api/users/:id` - Accepts `assigned_vendors` array in request body
  - Validates that all vendor names exist in products table
  - Returns error if invalid vendor names are provided

#### Products API
- `GET /api/products` - Now requires authentication
  - Automatically filters products for non-admin users
  - Admins see all products regardless of assignments
  - Buyers only see products where `vendor_name` matches their assigned vendors
  - If no vendors assigned, returns empty result set

### Frontend Components

#### AdminUsers Component
- New "Assigned Vendors" column in users table
- "View Vendors" button opens assignment modal
- Displays vendor count or "All vendors" text

#### VendorAssignmentModal Component
- Shows all available vendors from both vendors table and products
- Real-time search/filter functionality
- Checkbox-based selection
- Shows count: "X of Y vendors selected"
- Bulk actions: "Select All Shown" and "Clear All"

## Migration

### Running the Migration

**Option 1: Using pgAdmin (Recommended)**
1. Open pgAdmin and connect to your database
2. Right-click on your database (wholesale_app)
3. Select "Query Tool"
4. Open the file: `server/migrations/add_buyer_vendor_assignments.sql`
5. Click "Execute" (F5)
6. Verify success in the output

**Option 2: Using Command Line**
```bash
# Local database
set PGPASSWORD=postgres1234
psql -U postgres -d wholesale_app -f "server/migrations/add_buyer_vendor_assignments.sql"

# Production database (Render)
set PGPASSWORD=lrmooKVMVwidUWaMYBNni3daraps5upq
psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -f "server/migrations/add_buyer_vendor_assignments.sql"
```

### Verification

After running the migration, verify it was successful:

```sql
-- Check that the column was added
\d users

-- Should show: assigned_vendors | text[] | | |

-- Check the index was created
\di

-- Should show: idx_users_assigned_vendors | index | postgres | users
```

## Testing Checklist

### Admin Testing
- [ ] View Manage Users page - see "Assigned Vendors" column
- [ ] Click "View Vendors" button - modal opens
- [ ] Search for vendors - results filter correctly
- [ ] Select/deselect vendors - checkboxes work
- [ ] "Select All Shown" button - selects filtered vendors
- [ ] "Clear All" button - removes all selections
- [ ] Save assignments - success message appears
- [ ] Refresh page - assignments persist

### Buyer Testing
- [ ] Create test buyer account with limited vendors assigned
- [ ] Login as buyer
- [ ] View products page - only assigned vendor products show
- [ ] Try searching/filtering - results still restricted
- [ ] Login as admin - all products visible
- [ ] Assign different vendors to buyer
- [ ] Login as buyer again - see updated product list

### Edge Cases
- [ ] Buyer with no vendors assigned - sees no products
- [ ] Buyer with all vendors assigned - sees all products
- [ ] Invalid vendor names in API - returns validation error
- [ ] Admin users - no filtering applied (see all products)

## Troubleshooting

### Products Not Showing for Buyer
**Problem**: Buyer logs in but sees no products
**Solution**:
1. Check if buyer has vendors assigned (Manage Users page)
2. Verify assigned vendor names match actual vendor_name values in products table
3. Check browser console for API errors

### "Invalid vendor names" Error
**Problem**: Cannot save vendor assignments
**Solution**:
1. Ensure vendor names exactly match those in the products table
2. Check for typos or extra spaces
3. Verify products exist for those vendors

### Migration Fails
**Problem**: Migration script returns error
**Solution**:
1. Check if column already exists: `\d users` in psql
2. If exists, skip migration or use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
3. Verify database connection and permissions

### Modal Not Opening
**Problem**: "View Vendors" button doesn't open modal
**Solution**:
1. Check browser console for JavaScript errors
2. Clear browser cache and refresh
3. Verify API endpoint `/api/vendors` is accessible

## Future Enhancements

Potential improvements for future versions:
- Bulk vendor assignment (assign same vendors to multiple buyers)
- Territory-based auto-assignment
- Vendor access request workflow (buyers request, admins approve)
- Vendor assignment history/audit log
- Email notifications when assignments change
- Import/export vendor assignments via CSV

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database migration completed successfully
4. Contact your system administrator
