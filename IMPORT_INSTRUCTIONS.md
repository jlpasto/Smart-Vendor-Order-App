# 📥 Product Import Feature - User Guide

## Overview
The bulk import feature allows administrators to add or update multiple products at once using CSV or Excel files.

---

## How to Use

### Step 1: Access the Import Feature
1. Log in as an **Admin** user
2. Navigate to **Admin → Manage Products**
3. Click the **📥 Import Products** button in the top right corner

### Step 2: Download Template (Optional)
- Click **📄 Download Template File** to get a sample Excel file
- The template includes all required columns with example data
- Use this as a starting point for your import file

### Step 3: Prepare Your Import File
You can use either:
- **CSV file** (.csv)
- **Excel file** (.xlsx or .xls)

#### Required Columns:
- `product_name` - Name of the product **(required)**
- `vendor_name` - Vendor/supplier name **(required)**
- `wholesale_case_price` - Wholesale price per case
- `wholesale_unit_price` - Wholesale price per unit
- `retail_unit_price` - Retail/MSRP price per unit

#### Optional Columns:
- `id` - Leave empty for new products, or include existing product ID to update
- `state` - State abbreviation (e.g., CA, NY, TX)
- `product_description` - Detailed product description
- `size` - Product size (e.g., 12oz, 500ml, Large)
- `case_pack` - Number of units per case
- `upc` - Universal Product Code
- `order_qty` - Current order quantity (default: 0)
- `stock_level` - Current stock level (default: 0)
- `product_image` - URL to product image
- `category` - Product category (e.g., Beverages, Snacks, Food)
- `popular` - Mark as featured (true/false or 1/0)
- `seasonal` - Mark as seasonal (true/false or 1/0)
- `new` - Mark as new (true/false or 1/0)

### Step 4: Import the File
1. Click **Select File to Import**
2. Choose your CSV or Excel file
3. Click **📥 Import Products**
4. Wait for the import to complete

### Step 5: Review Results
After import, you'll see a summary:
- ✅ **Created**: Number of new products added
- ✅ **Updated**: Number of existing products updated
- ❌ **Failed**: Number of products that failed (with error messages)

---

## Import Behavior

### Adding New Products
- Leave the `id` column empty
- The system will create a new product with all provided data
- A unique ID will be automatically assigned

### Updating Existing Products
- Include the product's `id` in the file
- The system will find the existing product and update its fields
- If the ID doesn't exist, it will create a new product instead

### Example:

```csv
id,vendor_name,product_name,wholesale_case_price,wholesale_unit_price,retail_unit_price,stock_level
,New Vendor,New Product,25.00,1.00,2.00,100
42,Existing Vendor,Updated Product,30.00,1.25,2.50,200
```

In this example:
- Row 1: Creates a **new** product (no id)
- Row 2: **Updates** product with id=42 (or creates new if id 42 doesn't exist)

---

## Tips & Best Practices

### ✅ Do's:
- **Download the template** first to see the correct column structure
- **Test with a small file** (2-3 products) before importing hundreds
- **Include IDs** when updating existing products
- **Use consistent formatting** for prices (e.g., 24.99, not $24.99)
- **Validate data** before import to avoid errors

### ❌ Don'ts:
- Don't include extra columns not in the template
- Don't use special characters in column headers
- Don't leave required fields empty
- Don't use currency symbols ($) or thousands separators (,) in prices
- Don't import the same file multiple times (it will create duplicates)

---

## Common Errors & Solutions

### Error: "Missing required fields"
**Solution**: Ensure every row has `product_name` and `vendor_name` filled in

### Error: "Invalid file type"
**Solution**: Use only .csv, .xlsx, or .xls files

### Error: "No data found in the file"
**Solution**: Make sure your file has data rows (not just headers)

### Error: "Failed to parse file"
**Solution**:
- Check that your CSV is properly formatted
- Ensure Excel file isn't corrupted
- Try saving Excel as CSV and import the CSV instead

---

## Sample Data

A sample import file is included: `sample_import.csv`

This file contains 3 example products you can use to test the import feature.

---

## Field Reference

| Field Name | Type | Required | Example | Notes |
|------------|------|----------|---------|-------|
| id | Number | No | 42 | Leave empty for new products |
| vendor_name | Text | Yes | "Acme Corp" | Vendor/supplier name |
| state | Text | No | "CA" | 2-letter state code |
| product_name | Text | Yes | "Widget Pro" | Product name |
| product_description | Text | No | "High quality widget" | Product details |
| size | Text | No | "12oz" | Product size |
| case_pack | Number | No | 24 | Units per case |
| upc | Text | No | "123456789012" | Universal Product Code |
| wholesale_case_price | Number | No | 24.99 | Price per case |
| wholesale_unit_price | Number | No | 1.04 | Price per unit |
| retail_unit_price | Number | No | 1.99 | Retail/MSRP price |
| order_qty | Number | No | 0 | Current order quantity |
| stock_level | Number | No | 100 | Current stock level |
| product_image | URL | No | "https://..." | Image URL |
| popular | Boolean | No | true | Mark as featured |
| seasonal | Boolean | No | false | Mark as seasonal |
| new | Boolean | No | true | Mark as new |
| category | Text | No | "Beverages" | Product category |

---

## Video Tutorial
[Coming Soon]

---

## Need Help?
If you encounter issues with the import feature:
1. Check this guide for common errors
2. Try the sample CSV file first
3. Contact support with error messages

---

**Last Updated**: 2025-10-25
