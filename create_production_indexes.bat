@echo off
echo =====================================
echo Creating Indexes on Render Production Database
echo =====================================
echo.
echo Database: wholesale_app_4csh
echo Host: dpg-d3jjrr7fte5s73frlnig-a
echo.
echo This will create 6 indexes to optimize cursor-based pagination.
echo The process may take 1-5 minutes depending on data size.
echo.
pause

set PGPASSWORD=lrmooKVMVwidUWaMYBNni3daraps5upq

echo.
echo Connecting to production database...
echo.

psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -c "CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON products(vendor_name, id); CREATE INDEX IF NOT EXISTS idx_products_name_id ON products(product_name, id); CREATE INDEX IF NOT EXISTS idx_products_case_price_id ON products(wholesale_case_price, id); CREATE INDEX IF NOT EXISTS idx_products_unit_price_id ON products(wholesale_unit_price, id); CREATE INDEX IF NOT EXISTS idx_products_retail_price_id ON products(retail_unit_price, id); CREATE INDEX IF NOT EXISTS idx_products_gm_id ON products(gm_percent, id);"

echo.
echo =====================================
echo Verifying indexes were created...
echo =====================================
echo.

psql -h dpg-d3jjrr7fte5s73frlnig-a.oregon-postgres.render.com -U wholesale_app_4csh_user -d wholesale_app_4csh -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products' AND indexname LIKE 'idx_products_%' ORDER BY indexname;"

echo.
echo =====================================
echo Done!
echo =====================================
echo.
pause
