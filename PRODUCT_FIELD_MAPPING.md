# Product Field Mapping

## Excel Column → Database Column Mapping

| Excel Column | Database Column | Type | Notes |
|---|---|---|---|
| App ID | app_id | VARCHAR(50) | Unique product identifier (e.g., I0000001) |
| ID | id | SERIAL PRIMARY KEY | Auto-generated in database |
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
App ID, ID, Vendor Connect ID, Vendor Name, Product Name, Main Category, Sub-Category,
Allergens, Dietary Preferences, Cuisine Type, Seasonal and Featured, Size, Case Pack,
Wholesale Case Price, Wholesale Unit Price, Retail Unit Price (MSRP), GM%, Case Minimum,
Shelf Life, UPC, State, Delivery Info, Notes, Image
```

## Sample Data Example

```csv
App ID,ID,Vendor Connect ID,Vendor Name,Product Name,Main Category,Sub-Category,Allergens,Dietary Preferences,Cuisine Type,Seasonal and Featured,Size,Case Pack,Wholesale Case Price,Wholesale Unit Price,Retail Unit Price (MSRP),GM%,Case Minimum,Shelf Life,UPC,State,Delivery Info,Notes,Image
I0000001,16820,871,2Betties,Bites - Chocolate Chip,Snacks,Other,"Dairy-Free, Gluten-Free, Soy-Free, Egg-Free, Peanut-Free","Paleo, Low-Fat, Low-Carb, Low-Sugar, Low-Sodium",,Featured,1.4 oz,36,$68.20,$1.89,$2.99,36.79%,1,7 months from manufacture date,,MD,,,https://s3.amazonaws.com/cureate/products/pics/000/016/820/medium/Chocolate_Chip-New.jpeg?1753127774
```
