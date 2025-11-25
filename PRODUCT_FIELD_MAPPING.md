# Product Field Mapping

## Excel Column → Database Column Mapping

| Excel Column | Database Column | Type | Notes |
|---|---|---|---|
| Product Connect ID | product_connect_id | INTEGER UNIQUE NOT NULL | Primary key for relationships - used in orders and user assignments (e.g., 10001) |
| ID | id | SERIAL PRIMARY KEY | Internal database ID - kept for backwards compatibility |
| Vendor Connect ID | vendor_connect_id | VARCHAR(50) | Vendor's internal ID |
| Vendor Name | vendor_name | VARCHAR(255) | Vendor name |
| Product Name | product_name | VARCHAR(255) | Product name |
| Main Category | main_category | VARCHAR(100) | Main product category (e.g., "Snacks") |
| Sub-Category | sub_category | VARCHAR(100) | Sub-category (e.g., "Other", "Trailmix, Nuts & Dried Fruits") |
| Allergens | allergens | TEXT | Comma-separated allergen list |
| Dietary Preferences | dietary_preferences | TEXT | Comma-separated dietary tags |
| Cuisine Type | cuisine_type | VARCHAR(100) | Type of cuisine |
| Seasonal and Featured | seasonal_and_featured | VARCHAR(50) | Featured/Seasonal status |
| Size | size | VARCHAR(100) | Product size (e.g., "1.4 oz") |
| Case Pack | case_pack | INTEGER | Units per case |
| Wholesale Case Price | wholesale_case_price | DECIMAL(10,2) | Price per case |
| Wholesale Unit Price | wholesale_unit_price | DECIMAL(10,2) | Price per unit |
| Retail Unit Price (MSRP) | retail_unit_price | DECIMAL(10,2) | Retail price |
| GM% | gm_percent | DECIMAL(5,2) | Auto-calculated from prices |
| Case Minimum | case_minimum | INTEGER | Minimum order quantity |
| Shelf Life | shelf_life | VARCHAR(255) | Shelf life description |
| UPC | upc | VARCHAR(50) | Universal Product Code |
| State | state | VARCHAR(100) | State of origin |
| Delivery Info | delivery_info | TEXT | Shipping/delivery information |
| Notes | notes | TEXT | Additional notes |
| Image | product_image | VARCHAR(500) | Product image URL |

## Existing Fields (Kept for Compatibility)

| Database Column | Type | Usage |
|---|---|---|
| product_description | TEXT | Can be synced with notes or kept separate |
| category | VARCHAR(100) | Can map to main_category |
| popular | BOOLEAN | Legacy field |
| seasonal | BOOLEAN | Legacy field |
| new | BOOLEAN | Legacy field |
| order_qty | INTEGER | Cart/order quantity |
| stock_level | INTEGER | Inventory level |
| created_at | TIMESTAMP | Auto-generated |
| updated_at | TIMESTAMP | Auto-generated |

## Import Column Header Mapping

When importing CSV/Excel files, use these exact column headers:

```
Product Connect ID, ID, Vendor Connect ID, Vendor Name, Product Name, Main Category, Sub-Category,
Allergens, Dietary Preferences, Cuisine Type, Seasonal and Featured, Size, Case Pack,
Wholesale Case Price, Wholesale Unit Price, Retail Unit Price (MSRP), GM%, Case Minimum,
Shelf Life, UPC, State, Delivery Info, Notes, Image
```

## Database Relationships

### Foreign Keys Using product_connect_id

**IMPORTANT**: As of the latest migration, all product relationships use `product_connect_id` (not `id`) as the foreign key.

#### Orders Table
- **Foreign Key**: `orders.product_connect_id`
- **References**: `products.product_connect_id`
- **Behavior**: ON DELETE SET NULL
- **Purpose**: Links orders to products using the external product identifier

#### Users Table (Access Control)
- **Field**: `users.assigned_product_ids` (INTEGER[] array)
- **Contains**: Array of `product_connect_id` values
- **Purpose**: Controls which products buyers can see and order

### Why product_connect_id?

The `product_connect_id` field is now the primary relationship key because:
1. **Stable Identifier**: Unlike the auto-incrementing `id`, product_connect_id is a business identifier
2. **External Integration**: Can be synchronized with external systems
3. **Data Migration**: Easier to migrate data between environments using known IDs
4. **Import/Export**: Consistent IDs in Excel imports/exports

The internal `id` field is maintained for backwards compatibility and database performance optimizations.

## Sample Data Example

```csv
Product Connect ID,ID,Vendor Connect ID,Vendor Name,Product Name,Main Category,Sub-Category,Allergens,Dietary Preferences,Cuisine Type,Seasonal and Featured,Size,Case Pack,Wholesale Case Price,Wholesale Unit Price,Retail Unit Price (MSRP),GM%,Case Minimum,Shelf Life,UPC,State,Delivery Info,Notes,Image
10001,16820,871,2Betties,Bites - Chocolate Chip,Snacks,Other,"Dairy-Free, Gluten-Free, Soy-Free, Egg-Free, Peanut-Free","Paleo, Low-Fat, Low-Carb, Low-Sugar, Low-Sodium",,Featured,1.4 oz,36,$68.20,$1.89,$2.99,36.79%,1,7 months from manufacture date,,MD,,,https://s3.amazonaws.com/cureate/products/pics/000/016/820/medium/Chocolate_Chip-New.jpeg?1753127774
```
