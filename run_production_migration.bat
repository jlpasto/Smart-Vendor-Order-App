@echo off
echo ========================================
echo Running Vendor Assignment Migration
echo Target: PRODUCTION (Render PostgreSQL)
echo ========================================
echo.
echo Database: wholesale_app_4csh
echo Host: dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com
echo.
echo WARNING: This will modify your PRODUCTION database!
echo Press Ctrl+C to cancel, or
pause

echo.
echo Setting password...
set PGPASSWORD=lrmooKVMVwidUWaMYBNni3daraps5upq

echo Connecting to production database...
psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -f "server/migrations/add_vendor_relationships.sql"

echo.
echo ========================================
echo Migration complete!
echo ========================================
echo.
echo Verifying migration...
echo Running verification queries...
echo.

psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'assigned_vendor_ids';"

psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'vendor_id';"

psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -c "SELECT COUNT(*) as total_products, COUNT(vendor_id) as products_with_vendor_id FROM products;"

echo.
echo ========================================
echo All done! Check the output above.
echo ========================================
pause
