# SMART VENDOR ORDER APP (CUREATE CONNECT)

## User Story Document

| Field    | Value                              |
|----------|------------------------------------|
| Project  | Smart Vendor Order App (Cureate Connect) |
| Version  | 1.0                                |
| Date     | February 11, 2026                  |
| Author   | BAD Systems                        |
| Status   | Draft                              |

---

## 1. Introduction

This document outlines the user stories for the Smart Vendor Order App (Cureate Connect), a Progressive Web Application designed for wholesale ordering. The platform connects buyers with specialty food and beverage vendors, enabling streamlined product browsing, purchase order creation, and order management through role-based interfaces for Buyers, Admins, and Superadmins.

Each user story follows the standard format and includes acceptance criteria, priority level, and estimated story points to guide the development team during sprint planning. The user stories are organized by functional module and prioritized to support iterative delivery across multiple sprints. This is a living document and will be updated as requirements evolve.

---

## 2. User Personas

| Persona       | Description | Key Goals |
|---------------|-------------|-----------|
| Buyer         | End user who browses vendor products, builds purchase orders, and tracks order history. Typically a retail store owner or purchasing manager. | Browse assigned vendor products, create purchase orders, track order status, reorder from history |
| Admin         | Internal operations user who oversees orders, monitors buyer activity, and manages day-to-day fulfillment. | Manage orders, update statuses, edit order items, view buyer analytics, access dashboard metrics |
| Superadmin    | System administrator with full control over all data — products, vendors, buyers, and admin accounts. | Manage products/vendors/buyers, bulk import/export data, assign vendors to buyers, manage admin accounts |

---

## 3. User Stories Summary

| ID     | Title                                    | Persona     | Priority | Points | Sprint   | Status |
|--------|------------------------------------------|-------------|----------|--------|----------|--------|
| **Module 1 — Authentication & Access Control** | | | | | | |
| US-001 | Buyer Login with Access Code             | Buyer       | Critical | 5      | Sprint 1 | Done   |
| US-002 | Email/Password Login                     | Admin       | Critical | 5      | Sprint 1 | Done   |
| US-003 | User Signup                              | Buyer       | High     | 3      | Sprint 1 | Done   |
| US-004 | Role-Based Access Control                | All         | Critical | 8      | Sprint 1 | Done   |
| US-005 | Demo Mode Access                         | All         | Low      | 3      | Sprint 1 | Done   |
| **Module 2 — Product Catalog (Buyer View)** | | | | | | |
| US-006 | Browse Products with Infinite Scroll     | Buyer       | Critical | 8      | Sprint 2 | Done   |
| US-007 | View Product Details                     | Buyer       | High     | 5      | Sprint 2 | Done   |
| US-008 | Search Products                          | Buyer       | High     | 5      | Sprint 2 | Done   |
| US-009 | Advanced Multi-Criteria Filtering        | Buyer       | High     | 13     | Sprint 2 | Done   |
| US-010 | Sort Products                            | Buyer       | Medium   | 3      | Sprint 2 | Done   |
| US-011 | Vendor-Restricted Product Visibility     | Buyer       | High     | 5      | Sprint 2 | Done   |
| **Module 3 — Shopping Cart & Purchase Orders** | | | | | | |
| US-012 | Add Items to Cart                        | Buyer       | Critical | 5      | Sprint 3 | Done   |
| US-013 | Manage Cart Items                        | Buyer       | High     | 5      | Sprint 3 | Done   |
| US-014 | Set Replacement Preferences              | Buyer       | Medium   | 3      | Sprint 3 | Done   |
| US-015 | View Cart Organized by Vendor            | Buyer       | High     | 5      | Sprint 3 | Done   |
| US-016 | Submit Batch Purchase Order              | Buyer       | Critical | 8      | Sprint 3 | Done   |
| **Module 4 — Order Tracking (Buyer View)** | | | | | | |
| US-017 | View Order History by Month              | Buyer       | High     | 5      | Sprint 4 | Done   |
| US-018 | View Batch Order Details                 | Buyer       | High     | 5      | Sprint 4 | Done   |
| US-019 | Reorder from Past Batches                | Buyer       | Medium   | 5      | Sprint 4 | Done   |
| US-020 | Export Order to PDF                      | Buyer       | Medium   | 5      | Sprint 4 | Done   |
| US-021 | Filter Orders by Date Range              | Buyer       | Medium   | 3      | Sprint 4 | Done   |
| **Module 5 — Admin Dashboard** | | | | | | |
| US-022 | View Dashboard Statistics                | Admin       | High     | 5      | Sprint 5 | Done   |
| US-023 | View Recent Orders                       | Admin       | Medium   | 3      | Sprint 5 | Done   |
| US-024 | Quick Navigation to Management Pages     | Admin       | Medium   | 2      | Sprint 5 | Done   |
| **Module 6 — Admin Order Management** | | | | | | |
| US-025 | View and Filter All Orders               | Admin       | Critical | 8      | Sprint 5 | Done   |
| US-026 | Update Order Status                      | Admin       | Critical | 5      | Sprint 5 | Done   |
| US-027 | Edit Order Items                         | Admin       | High     | 8      | Sprint 5 | Done   |
| US-028 | Add Items to Existing Batches            | Admin       | High     | 5      | Sprint 5 | Done   |
| US-029 | View Order Modification History          | Admin       | Medium   | 5      | Sprint 6 | Done   |
| US-030 | Add Admin Notes to Orders                | Admin       | Medium   | 3      | Sprint 5 | Done   |
| **Module 7 — Buyer Overview & Analytics** | | | | | | |
| US-031 | View Buyer Activity Overview             | Admin       | High     | 8      | Sprint 6 | Done   |
| US-032 | Filter Buyer Activity by Date Range      | Admin       | Medium   | 3      | Sprint 6 | Done   |
| **Module 8 — Product Management (Superadmin)** | | | | | | |
| US-033 | Create, Edit, and Delete Products        | Superadmin  | Critical | 8      | Sprint 7 | Done   |
| US-034 | Bulk Import Products                     | Superadmin  | High     | 8      | Sprint 7 | Done   |
| US-035 | Bulk Delete Products                     | Superadmin  | Medium   | 5      | Sprint 7 | Done   |
| US-036 | Export Products                          | Superadmin  | Medium   | 3      | Sprint 7 | Done   |
| **Module 9 — Vendor Management (Superadmin)** | | | | | | |
| US-037 | Create, Edit, and Delete Vendors         | Superadmin  | Critical | 8      | Sprint 7 | Done   |
| US-038 | Bulk Import Vendors                      | Superadmin  | High     | 5      | Sprint 7 | Done   |
| US-039 | Export Vendors                           | Superadmin  | Medium   | 3      | Sprint 7 | Done   |
| **Module 10 — Buyer/User Management (Superadmin)** | | | | | | |
| US-040 | Create, Edit, and Delete Buyer Accounts  | Superadmin  | Critical | 8      | Sprint 8 | Done   |
| US-041 | Assign Vendors to Buyers                 | Superadmin  | High     | 8      | Sprint 8 | Done   |
| US-042 | Assign Products to Buyers                | Superadmin  | High     | 5      | Sprint 8 | Done   |
| US-043 | Export User Assignments                  | Superadmin  | Low      | 3      | Sprint 8 | Done   |
| **Module 11 — Admin Account Management (Superadmin)** | | | | | | |
| US-044 | Create Admin Users                       | Superadmin  | High     | 5      | Sprint 8 | Done   |
| US-045 | Delete Admin Users                       | Superadmin  | Medium   | 3      | Sprint 8 | Done   |
| **Module 12 — Cross-Cutting Concerns** | | | | | | |
| US-046 | Email Notifications                      | All         | High     | 8      | Sprint 4 | Done   |
| US-047 | PWA Installation and Offline Support     | Buyer       | Medium   | 8      | Sprint 6 | Done   |
| US-048 | Buyer Profile Management                 | Buyer       | Medium   | 3      | Sprint 6 | Done   |

---

## 4. Detailed User Stories

### Module 1 — Authentication & Access Control

---

#### US-001: Buyer Login with Access Code

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to log in using my unique 8-character access code so that I can quickly access the ordering system without remembering an email and password. |
| Persona       | Buyer          |
| Priority      | Critical       |
| Story Points  | 5              |
| Sprint        | Sprint 1       |

**Acceptance Criteria:**
1. Login page displays an "Access Code" tab as the default login method
2. Access code input field accepts up to 8 characters, auto-converts to uppercase, and uses monospace tracking for readability
3. Access code lookup is case-insensitive on the backend
4. Upon successful login, a JWT token (7-day expiry) is generated and stored in localStorage
5. Buyer is redirected to the Products page (`/products`) after successful login
6. Invalid access codes display a clear error message: "Invalid access code"
7. Loading spinner is shown during authentication

---

#### US-002: Email/Password Login

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin or buyer, I want to log in using my name and password so that I can securely access the system with my credentials. |
| Persona       | Admin          |
| Priority      | Critical       |
| Story Points  | 5              |
| Sprint        | Sprint 1       |

**Acceptance Criteria:**
1. Login page displays a "Name & Password" tab that can be toggled from the access code tab
2. Form includes Name and Password fields, both required
3. Email/name lookup is case-insensitive on the backend
4. Password is verified against the bcrypt-hashed value stored in the database
5. Upon successful login, a JWT token (7-day expiry) is generated and stored in localStorage
6. Admin and Superadmin users are redirected to the Admin Dashboard (`/admin`) after login
7. Buyer users are redirected to the Products page (`/products`) after login
8. Invalid credentials display a clear error message without revealing which field is wrong

---

#### US-003: User Signup

| Field         | Value          |
|---------------|----------------|
| User Story    | As a new buyer, I want to create an account with my email and password so that I can start placing orders. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 3              |
| Sprint        | Sprint 1       |

**Acceptance Criteria:**
1. Signup page (`/signup`) provides email and password fields
2. Both email and password are required; missing fields return a 400 error
3. Duplicate email addresses are rejected with the message "User already exists"
4. Password is hashed with bcrypt (10 salt rounds) before storage
5. New user is assigned the "user" role by default
6. Upon successful signup, a JWT token is generated and the user is automatically logged in
7. User is redirected to the application after signup

---

#### US-004: Role-Based Access Control

| Field         | Value          |
|---------------|----------------|
| User Story    | As the system, I want to enforce role-based access control so that buyers, admins, and superadmins can only access features appropriate to their role. |
| Persona       | All            |
| Priority      | Critical       |
| Story Points  | 8              |
| Sprint        | Sprint 1       |

**Acceptance Criteria:**
1. Three roles are supported: `buyer`, `admin`, and `superadmin`
2. Unauthenticated users are redirected to the login page when accessing protected routes
3. Buyer-level routes (Products, Cart, Orders) are accessible to all authenticated users
4. Admin-level routes (Dashboard, Manage Orders, Buyer Overview) require `admin` or `superadmin` role
5. Superadmin-level routes (Manage Products, Manage Vendors, Manage Buyers, Manage Admins) require `superadmin` role
6. Unauthorized role access redirects the user to the home page (`/`)
7. Backend API endpoints enforce role checks via `authenticate`, `requireAdmin`, and `requireSuperAdmin` middleware
8. JWT tokens encode the user's id, email, role, and name for stateless verification
9. Already logged-in users are redirected away from the login page to their role-appropriate landing page

---

#### US-005: Demo Mode Access

| Field         | Value          |
|---------------|----------------|
| User Story    | As a stakeholder or tester, I want to access the application without logging in when demo mode is enabled so that I can explore features without needing credentials. |
| Persona       | All            |
| Priority      | Low            |
| Story Points  | 3              |
| Sprint        | Sprint 1       |

**Acceptance Criteria:**
1. When the environment variable `ENABLE_LOGIN` is set to `false`, login is bypassed
2. In demo mode, a mock admin user (`admin@demo.com`) is automatically injected on both frontend and backend
3. All protected routes become accessible without authentication in demo mode
4. The login page redirects to the home page when demo mode is active
5. A Demo User Switcher component allows switching between different user roles for testing purposes
6. Demo user state is persisted in localStorage across page refreshes

---

### Module 2 — Product Catalog (Buyer View)

---

#### US-006: Browse Products with Infinite Scroll

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to browse products in an infinite-scrolling grid so that I can discover items without clicking through pages. |
| Persona       | Buyer          |
| Priority      | Critical       |
| Story Points  | 8              |
| Sprint        | Sprint 2       |

**Acceptance Criteria:**
1. Products are displayed in a responsive card grid showing product image, product ID badge, name, wholesale unit price, wholesale case price, MSRP, and GM%
2. Initial load fetches 20 products at a time using cursor-based pagination
3. Scrolling near the bottom (100px margin) automatically triggers loading the next batch
4. A loading indicator is displayed while additional products are being fetched
5. Products are grouped by vendor for organized navigation
6. A "Back to Top" button appears when the user has scrolled to the end of results
7. A load progress indicator shows the current scroll position
8. No duplicate products appear during concurrent data changes (cursor-based pagination guarantee)
9. Quick "Add to Cart" button is visible on each product card with visual feedback ("Added") on click

---

#### US-007: View Product Details

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to view the full details of a product in a slide-out modal so that I can make an informed ordering decision. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 2       |

**Acceptance Criteria:**
1. Clicking a product card opens a right-side slide-out modal with full product details
2. Modal displays: product image, product name, vendor name, description, size, case pack, UPC, wholesale case price, wholesale unit price, MSRP, GM%, case minimum, shelf life, delivery info, allergens, dietary preferences, cuisine type, and category info
3. Left/Right arrow keys navigate between products while the modal is open
4. Previous/Next navigation buttons are available in the modal header
5. Escape key closes the modal
6. Clicking the backdrop also closes the modal
7. Modal can be maximized to full width
8. An "Add to Cart" button is available inside the modal with visual confirmation feedback

---

#### US-008: Search Products

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to search products by keyword so that I can quickly find specific items I need to order. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 2       |

**Acceptance Criteria:**
1. A global search bar is accessible from the navigation on all pages
2. Search queries match against product names, vendor names, descriptions, and categories
3. Search is triggered in real-time as the user types (with debounce)
4. Product list resets and reloads from the beginning when a search term changes
5. Search works in combination with active filters
6. Clearing the search field restores the full (filtered) product list
7. Search state is managed globally via SearchContext so it persists across page navigation

---

#### US-009: Advanced Multi-Criteria Filtering

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to filter products using multiple criteria simultaneously so that I can narrow down the catalog to exactly what I need. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 13             |
| Sprint        | Sprint 2       |

**Acceptance Criteria:**
1. A filter icon button opens a modal-based filter interface
2. Filter interface uses a two-step selection: choose a filter field, then set the criteria
3. The following filter types are supported:
   - **Text match**: Product ID, Vendor Connect ID, Product Name, Size, UPC, Shelf Life, Delivery Info, Notes
   - **Single select**: State, Seasonal/Featured status
   - **Multi-select with combo box**: Vendor, Main Category, Sub-Category, Allergens, Dietary Preferences, Cuisine Type
   - **Range (min/max)**: Case Pack, Wholesale Case Price, Wholesale Unit Price, MSRP, Gross Margin %, Case Minimum
   - **Boolean toggles**: Popular, Seasonal, New, Favorites Only
4. Multiple filters can be active simultaneously and combine with AND logic (allergens use "match any" logic)
5. A badge on the filter icon shows the count of active filters
6. A "Clear All Filters" option resets all filters at once
7. Individual filters can be cleared independently
8. Filters persist across pagination (product list reloads from the beginning when filters change)
9. Filter dropdown options (vendors, categories, states, etc.) are populated dynamically from the database via dedicated API endpoints
10. A detail panel shows currently applied filters

---

#### US-010: Sort Products

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to sort the product list by name or vendor so that I can organize the catalog in my preferred order. |
| Persona       | Buyer          |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 2       |

**Acceptance Criteria:**
1. Sort by Product Name (A-Z or Z-A) is available
2. Sort by Vendor Name (A-Z or Z-A) is available
3. Default sort is by vendor name ascending
4. Toggling sort order switches between ascending and descending
5. Changing the sort field or order resets the product list and reloads from the beginning
6. Sorting works in combination with active search and filters

---

#### US-011: Vendor-Restricted Product Visibility

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to only see products from vendors assigned to me so that my catalog is relevant to my purchasing needs. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 2       |

**Acceptance Criteria:**
1. Buyers with assigned vendors (`assigned_vendor_ids` array) only see products from those vendors
2. If no vendors are assigned to a buyer (empty array), the buyer sees all products
3. Vendor restriction is enforced at the backend API query level for security
4. Admins and Superadmins see all products regardless of vendor assignments
5. The filter dropdown options (e.g., vendor list) also respect the buyer's vendor assignments
6. Vendor assignments are controlled by the Superadmin via the Buyer Management module

---

### Module 3 — Shopping Cart & Purchase Orders

---

#### US-012: Add Items to Cart

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to add products to my cart from the product grid or detail modal so that I can build my purchase order. |
| Persona       | Buyer          |
| Priority      | Critical       |
| Story Points  | 5              |
| Sprint        | Sprint 3       |

**Acceptance Criteria:**
1. A quick "Add to Cart" button is available on each product card in the grid
2. An "Add to Cart" button is also available inside the product detail modal
3. Clicking "Add to Cart" adds 1 unit (default) and shows a visual confirmation ("Added") for 2 seconds
4. If the product is already in the cart, its quantity is incremented
5. Cart item count badge in the navigation sidebar updates in real-time
6. For authenticated users, cart additions are synced to the database via the `/api/cart/add` endpoint
7. For guest users, cart state is persisted in localStorage as a fallback
8. Cart data is also backed up to localStorage for authenticated users in case of database failure

---

#### US-013: Manage Cart Items (Quantity, Pricing Mode)

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to adjust item quantities and select between case or unit pricing in my cart so that I can customize my order precisely. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 3       |

**Acceptance Criteria:**
1. Each cart item displays +/- buttons for quantity adjustment
2. Direct manual input of quantity is supported
3. Quantity must be at least 1; setting quantity to 0 removes the item
4. Each item has a pricing mode toggle between "Case" and "Unit" pricing
5. When pricing mode is "Case", the wholesale case price is used for the line total
6. When pricing mode is "Unit", the wholesale unit price is used for the line total
7. Line totals and grand total recalculate in real-time on quantity or pricing mode changes
8. A case pack aggregation warning appears when unit-mode items from the same vendor do not fill a complete case
9. Remove button with confirmation dialog removes individual items from the cart
10. All changes are synced to the database for authenticated users

---

#### US-014: Set Replacement Preferences

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to set my preference for what should happen if a product is unavailable so that my order can be handled appropriately. |
| Persona       | Buyer          |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 3       |

**Acceptance Criteria:**
1. Each cart item has a "Replacement Preference" option accessible via an edit button
2. A modal opens with the following preference options:
   - "Cureate to replace if sold out" (default)
   - "Replace with similar item under same vendor"
   - "Replace with similar item across other vendors"
   - "Remove it from my order"
3. The selected preference is displayed on the cart item row
4. Preferences are saved per item and synced to the database
5. When a specific replacement product is selected, the replacement product name is displayed

---

#### US-015: View Cart Organized by Vendor

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to see my cart items grouped by vendor with subtotals so that I can review my purchase order clearly before submitting. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 3       |

**Acceptance Criteria:**
1. Cart items are grouped by vendor name with vendor headers
2. Each vendor group displays a subtotal for that vendor
3. An order summary sidebar shows:
   - Total item count
   - Total units across all items
   - Breakdown by vendor
   - Grand total amount
   - Current user's email for confirmation
4. Each line item shows: product name, quantity, pricing mode, unit/case price, and line total
5. Cart displays empty state with a call-to-action to browse products when no items are present
6. All prices are formatted as currency with 2 decimal places

---

#### US-016: Submit Batch Purchase Order

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to submit all items in my cart as a single batch purchase order so that my order is recorded and sent for fulfillment. |
| Persona       | Buyer          |
| Priority      | Critical       |
| Story Points  | 8              |
| Sprint        | Sprint 3       |

**Acceptance Criteria:**
1. A "Submit Order" button is prominently displayed on the cart page
2. Clicking "Submit Order" shows a confirmation dialog with item count and total amount
3. Empty carts cannot be submitted; an alert is shown if attempted
4. Upon confirmation, the order is submitted to `/api/orders/submit` with all cart item IDs
5. A unique batch order number is generated in the format `BATCH-YYYYMMDD-XXXX`
6. All items in the cart are saved as individual order rows linked by the batch order number
7. Each order row captures: product details, quantity, pricing mode, unit/case price, calculated amount, and the buyer's user ID and email
8. A confirmation email is sent to the buyer with the batch number and order details
9. The cart is automatically cleared after successful submission
10. The buyer is redirected to the Orders page to view the new batch
11. If submission fails, an error message is displayed and the cart remains intact

---

### Module 4 — Order Tracking (Buyer View)

---

#### US-017: View Order History by Month

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to view my past orders grouped by month so that I can easily find and review previous purchases. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 4       |

**Acceptance Criteria:**
1. Orders page displays all submitted batch orders for the authenticated buyer
2. Batches are grouped by month/year (e.g., "February 2026", "January 2026")
3. Each batch card shows: batch order number, submission date, item count, total amount, and status badge
4. Status badges are color-coded: Pending (yellow), Completed (green), Cancelled (red)
5. Admin notes are visible on batch cards when present
6. Orders with "in_cart" status are filtered out (not shown on the orders page)
7. Loading spinner is displayed while orders are being fetched

---

#### US-018: View Batch Order Details

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to expand a batch order to see all individual line items so that I can review exactly what I ordered. |
| Persona       | Buyer          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 4       |

**Acceptance Criteria:**
1. Clicking a batch card expands/collapses the detail view
2. Expanded view shows all individual order items with: product name, vendor name, quantity, and amount
3. Batch details are fetched on demand (lazy loaded) when first expanded
4. Once loaded, batch details are cached in memory for subsequent expansions
5. Only one batch can be expanded at a time
6. An error alert is shown if batch detail loading fails

---

#### US-019: Reorder from Past Batches

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to reorder items from a previous batch order so that I can quickly place repeat orders without rebuilding my cart. |
| Persona       | Buyer          |
| Priority      | Medium         |
| Story Points  | 5              |
| Sprint        | Sprint 4       |

**Acceptance Criteria:**
1. A "Buy Again" button is available on each batch order card
2. Clicking "Buy Again" fetches current product availability for all items in the batch via `/api/orders/batch/:batchNumber/products`
3. All available products are added to the cart at their original order quantities
4. If some products are no longer available, a warning lists the unavailable items
5. If no products are available, an error message informs the buyer
6. Individual "Add to Cart" buttons are available on each line item within the expanded batch view
7. After reordering, the buyer is automatically navigated to the cart page

---

#### US-020: Export Order to PDF

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to download a PDF receipt of my batch order so that I can keep it for my records or share it. |
| Persona       | Buyer          |
| Priority      | Medium         |
| Story Points  | 5              |
| Sprint        | Sprint 4       |

**Acceptance Criteria:**
1. A "Download PDF" button is available on each batch order card
2. PDF includes: "Order Receipt" title, batch number, submission date, and status
3. PDF contains a table with columns: Product, Vendor, Quantity, and Amount
4. A footer row shows totals for quantity and amount
5. Admin notes are included in the PDF if present
6. The PDF uses professional formatting with a striped table theme and branded header colors
7. The file is named `order-{BATCH_NUMBER}.pdf`
8. If batch details are not yet loaded, they are fetched before generating the PDF

---

#### US-021: Filter Orders by Date Range

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to filter my order history by date range so that I can find orders from a specific time period. |
| Persona       | Buyer          |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 4       |

**Acceptance Criteria:**
1. Start date and end date input fields are available at the top of the orders page
2. Changing either date automatically re-fetches the order list
3. Date parameters are passed as query strings to the `/api/orders/my-batches` endpoint
4. Backend filters orders by `date_submitted` within the specified range
5. Both dates are optional — omitting a date means no limit on that end of the range
6. Clearing the date fields restores the full order history

---

### Module 5 — Admin Dashboard

---

#### US-022: View Dashboard Statistics

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to see key order metrics on my dashboard so that I can quickly assess the current state of the business. |
| Persona       | Admin          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 5       |

**Acceptance Criteria:**
1. Dashboard displays four metric cards: Total Orders, Pending Orders, Completed Orders, and Total Revenue
2. Metrics are fetched from the `/api/orders/stats` endpoint on page load
3. Total Revenue is formatted as currency with 2 decimal places
4. Pending Orders card uses a yellow/warning color scheme for visibility
5. Completed Orders card uses a green/success color scheme
6. A loading spinner is shown while metrics are being fetched
7. Dashboard is accessible only to admin and superadmin roles

---

#### US-023: View Recent Orders

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to see the 5 most recent orders on my dashboard so that I can stay informed of the latest ordering activity. |
| Persona       | Admin          |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 5       |

**Acceptance Criteria:**
1. The dashboard displays a table of the 5 most recent orders
2. Each row shows: batch number, buyer email, item count, total amount, status, and submission date
3. Recent orders are fetched from `/api/orders/all` with a limit of 5
4. Status badges are color-coded (Pending, Completed, Cancelled)
5. Data loads in parallel with statistics for faster page rendering

---

#### US-024: Quick Navigation to Management Pages

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want quick-access cards on my dashboard linking to management pages so that I can navigate efficiently. |
| Persona       | Superadmin     |
| Priority      | Medium         |
| Story Points  | 2              |
| Sprint        | Sprint 5       |

**Acceptance Criteria:**
1. Two prominent action cards are displayed: "Manage Orders" and "Manage Products"
2. Each card links to its respective management page (`/admin/orders` and `/admin/products`)
3. Quick action cards are only visible to superadmin users
4. Cards include descriptive text and visual icons for clarity

---

### Module 6 — Admin Order Management

---

#### US-025: View and Filter All Orders

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to view all orders across all buyers with filtering options so that I can find and manage specific orders efficiently. |
| Persona       | Admin          |
| Priority      | Critical       |
| Story Points  | 8              |
| Sprint        | Sprint 5       |

**Acceptance Criteria:**
1. All orders from all buyers are displayed, grouped by batch order number
2. Filters are available for: buyer (dropdown), status (Pending/Completed/Cancelled), date range (start/end dates)
3. Buyer filter dropdown is populated from the user list
4. Filter by buyer email is also supported (for navigation from Buyer Overview)
5. Changing any filter automatically refreshes the order list
6. A "Clear Filters" button resets all filters
7. Each batch group shows: batch number, buyer email, submission date, item count, total amount, and status
8. Batches are expandable/collapsible to show individual line items
9. Admin-only route protection is enforced

---

#### US-026: Update Order Status

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to update the status of a batch order so that I can track fulfillment progress and notify the buyer. |
| Persona       | Admin          |
| Priority      | Critical       |
| Story Points  | 5              |
| Sprint        | Sprint 5       |

**Acceptance Criteria:**
1. An "Edit Status" button is available on each batch order group
2. Clicking opens a modal with a status dropdown (Pending, Completed, Cancelled) and an admin notes text field
3. Status updates apply to the entire batch (all items in the batch)
4. The update is sent to `/api/orders/batch/:batchNumber/status`
5. An email notification is automatically sent to the buyer when the status changes
6. The order list refreshes after a successful update
7. A success alert confirms the update; error alerts show failure details

---

#### US-027: Edit Order Items

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to edit individual line items within a batch order so that I can adjust quantities or pricing as needed. |
| Persona       | Admin          |
| Priority      | High           |
| Story Points  | 8              |
| Sprint        | Sprint 5       |

**Acceptance Criteria:**
1. An "Edit" toggle button on each batch enters/exits edit mode for that batch
2. In edit mode, each order item becomes editable via an inline OrderEditForm component
3. Editable fields include: quantity, pricing mode (case/unit), and admin notes
4. Changes are saved per item via the order update API
5. The `modified_by_admin` flag is set to true and `modification_count` is incremented
6. An order history record is created for each change (field changed, old value, new value, admin ID)
7. An original snapshot is saved before the first admin modification for audit purposes
8. Only one batch can be in edit mode at a time

---

#### US-028: Add Items to Existing Batches

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to add new product items to an existing batch order so that I can fulfill buyer requests for order additions. |
| Persona       | Admin          |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 5       |

**Acceptance Criteria:**
1. An "Add Item" button is available on each batch order group
2. Clicking opens an AddItemModal that allows searching for products
3. The admin can select a product, set quantity, and choose pricing mode
4. The new item is added to the batch via `/api/orders/batch/:batchNumber/add-item`
5. The new item inherits the batch's order number, buyer information, and current status
6. An order history record is created for the addition
7. The order list refreshes after the item is added

---

#### US-029: View Order Modification History

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to view the full modification history of an order or batch so that I can audit all changes made. |
| Persona       | Admin          |
| Priority      | Medium         |
| Story Points  | 5              |
| Sprint        | Sprint 6       |

**Acceptance Criteria:**
1. A "History" button is available on each order item and each batch
2. Clicking opens the OrderHistoryPanel showing all changes
3. History records display: change type, field changed, old value, new value, admin who made the change, admin notes, and timestamp
4. History can be viewed per order item (`/api/orders/:id/history`) or per batch (`/api/orders/batch/:batchNumber/history`)
5. Changes are displayed in reverse chronological order (newest first)
6. Original snapshots are available for comparison

---

#### US-030: Add Admin Notes to Orders

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to add notes to orders that are visible to buyers so that I can communicate order-related information. |
| Persona       | Admin          |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 5       |

**Acceptance Criteria:**
1. An admin notes text field is available in the status update modal
2. Notes are saved alongside status changes
3. Notes are visible to the buyer on their Orders page within the batch card
4. Notes are included in PDF exports and email notifications
5. Notes can be updated on subsequent status changes

---

### Module 7 — Buyer Overview & Analytics

---

#### US-031: View Buyer Activity Overview

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to see a summary of all buyer activity including order counts, spending, and last activity so that I can monitor engagement and identify inactive buyers. |
| Persona       | Admin          |
| Priority      | High           |
| Story Points  | 8              |
| Sprint        | Sprint 6       |

**Acceptance Criteria:**
1. Buyer Overview page displays a summary bar showing: Total Buyers, Active Buyers, and Inactive Buyers
2. A list of all buyers is displayed with: buyer name, email, order count, total spending, and last activity date
3. Data is fetched from `/api/orders/buyer-overview` with date range parameters
4. Buyers can be searched by name or email
5. Buyers can be sorted by name (A-Z/Z-A) or last activity date (newest/oldest)
6. A "View Orders" action on each buyer row navigates to Admin Orders pre-filtered to that buyer's email and date range
7. A refresh button re-fetches the data
8. Loading spinner is shown during data fetch

---

#### US-032: Filter Buyer Activity by Date Range

| Field         | Value          |
|---------------|----------------|
| User Story    | As an admin, I want to filter buyer activity by a date range so that I can analyze activity for specific time periods. |
| Persona       | Admin          |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 6       |

**Acceptance Criteria:**
1. A date range preset dropdown is available with options: "This Week", "This Month", "Last Month", "This Quarter", and "Custom"
2. Selecting a preset automatically sets the start and end dates
3. "Custom" allows manual entry of start and end dates
4. Changing the date range automatically refreshes the buyer activity data
5. Default date range is "This Week" on initial page load
6. Date formatting uses consistent helper utilities from `dateHelpers.js`

---

### Module 8 — Product Management (Superadmin)

---

#### US-033: Create, Edit, and Delete Products

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to create, edit, and delete products so that I can maintain an accurate and up-to-date product catalog. |
| Persona       | Superadmin     |
| Priority      | Critical       |
| Story Points  | 8              |
| Sprint        | Sprint 7       |

**Acceptance Criteria:**
1. Products are displayed in a paginated table (20 per page) with sorting by product name or vendor name
2. A "Create Product" button opens a modal with a comprehensive form including all product fields: Product Connect ID, Vendor Name, State, Product Name, Description, Main Categories (multi-select), Sub-Categories (multi-select), Allergens (multi-select), Dietary Preferences (multi-select), Cuisine Type, Size, Case Pack, UPC, Wholesale Case Price, Wholesale Unit Price, Retail Unit Price, Case Minimum, Shelf Life, Delivery Info, Product Image URL, Stock Level, and Featured/Popular/New/Seasonal toggles
3. Multi-select fields (Main Categories, Sub-Categories, Allergens, Dietary Preferences, Cuisine Type) use ComboBoxInput components with options populated from the database
4. GM% is auto-calculated from: ((MSRP - Wholesale Unit Price) / MSRP) x 100
5. Default product image URL is set to the Cureate placeholder image when creating a new product
6. An "Edit" button on each product row opens the same modal pre-populated with existing data
7. A "Delete" button with a confirmation dialog removes the product
8. Global search and advanced filtering are available for locating products
9. Page is accessible only to superadmin users

---

#### US-034: Bulk Import Products (CSV/Excel)

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to bulk import products from a CSV or Excel file so that I can efficiently add or update large numbers of products at once. |
| Persona       | Superadmin     |
| Priority      | High           |
| Story Points  | 8              |
| Sprint        | Sprint 7       |

**Acceptance Criteria:**
1. An "Import Products" button opens the import modal
2. Supported file formats: `.csv`, `.xlsx`, `.xls`
3. A downloadable import template with sample data is available
4. Import processes each row and either creates a new product or updates an existing one (matched by Product Connect ID)
5. Price fields are cleaned during import (removes `$` and commas)
6. Comma-separated values in Allergens, Dietary Preferences, Main/Sub Categories are parsed into arrays
7. Import results display counts of: products created, products updated, and products failed
8. Failed rows include error details for troubleshooting
9. A loading indicator shows import progress
10. The product list refreshes after import completes

---

#### US-035: Bulk Delete Products

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to select and delete multiple products at once so that I can efficiently clean up the catalog. |
| Persona       | Superadmin     |
| Priority      | Medium         |
| Story Points  | 5              |
| Sprint        | Sprint 7       |

**Acceptance Criteria:**
1. Checkboxes are available on each product row for selection
2. A "Select All on Page" option selects all products on the current page
3. A "Select All (across all pages)" option selects all products matching the current filters
4. A visual count displays the number of selected products
5. A "Bulk Delete" button with a confirmation dialog deletes all selected products via `/api/products/bulk-delete`
6. A loading indicator shows during the delete operation
7. The product list refreshes after deletion

---

#### US-036: Export Products

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to export the full product catalog so that I can review data offline or use it for reporting. |
| Persona       | Superadmin     |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 7       |

**Acceptance Criteria:**
1. An "Export Products" button is available on the Product Management page
2. Export fetches all products via `/api/products/export`
3. The export downloads as an Excel/CSV file containing all product fields
4. Export includes all products regardless of current pagination or filter state

---

### Module 9 — Vendor Management (Superadmin)

---

#### US-037: Create, Edit, and Delete Vendors

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to create, edit, and delete vendors so that I can maintain an accurate vendor directory. |
| Persona       | Superadmin     |
| Priority      | Critical       |
| Story Points  | 8              |
| Sprint        | Sprint 7       |

**Acceptance Criteria:**
1. Vendors are displayed in an infinite-scrolling grid with logo cards showing vendor name and website
2. A "Create Vendor" button opens a modal with fields: Vendor Connect ID, Name, Website URL, Logo URL, Phone, Email, Address, State, and Territory
3. Clicking a vendor card opens a detail view with all vendor information
4. A three-dot context menu on each vendor card provides quick access to Edit and Delete actions
5. Editing opens the same form pre-populated with existing data
6. Deletion requires a confirmation dialog before proceeding
7. Vendors can be searched by name, state, city, or description via global search
8. Page is accessible only to superadmin users

---

#### US-038: Bulk Import Vendors

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to bulk import vendors from a CSV or Excel file so that I can onboard multiple vendors efficiently. |
| Persona       | Superadmin     |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 7       |

**Acceptance Criteria:**
1. An "Import Vendors" button opens the import modal
2. Supported file formats: `.csv`, `.xlsx`, `.xls`
3. A downloadable vendor import template with sample data is available
4. Import creates new or updates existing vendors (matched by Vendor Connect ID)
5. Import results display counts of: vendors created, updated, and failed
6. The vendor list refreshes after import completes

---

#### US-039: Export Vendors

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to export the full vendor list so that I can review data offline. |
| Persona       | Superadmin     |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 7       |

**Acceptance Criteria:**
1. An "Export Vendors" button is available on the Vendor Management page
2. Export fetches all vendors via `/api/vendors/export`
3. The export downloads as an Excel/CSV file containing all vendor fields

---

### Module 10 — Buyer/User Management (Superadmin)

---

#### US-040: Create, Edit, and Delete Buyer Accounts

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to create, edit, and delete buyer accounts so that I can manage who has access to the ordering system. |
| Persona       | Superadmin     |
| Priority      | Critical       |
| Story Points  | 8              |
| Sprint        | Sprint 8       |

**Acceptance Criteria:**
1. All buyer accounts are displayed in a table with: name, email/access code, role, and assigned vendor count
2. A "Create Buyer" button opens a modal with: Name and auto-generated 12-character password
3. The generated password uses a mix of uppercase, lowercase, numbers, and special characters
4. A "Copy" button allows copying the generated password to clipboard
5. A "Regenerate" button generates a new random password
6. Upon creation, the system displays the buyer's Name, Access Code, and Password with a warning that credentials won't be shown again
7. Created buyers default to the "buyer" role
8. Edit modal allows updating Name and Role; optional password regeneration
9. Delete requires a confirmation dialog with the user's name
10. Self-deletion is prevented (superadmin cannot delete their own account)
11. Buyer list can be searched via global search

---

#### US-041: Assign Vendors to Buyers

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to assign specific vendors to each buyer so that buyers only see products from their relevant vendors. |
| Persona       | Superadmin     |
| Priority      | High           |
| Story Points  | 8              |
| Sprint        | Sprint 8       |

**Acceptance Criteria:**
1. An "Assign Vendors" button is available on each buyer row
2. Clicking opens a Vendor Assignment Modal with a searchable list of all vendors
3. Vendors are displayed with checkboxes; currently assigned vendors are pre-checked
4. "Select All" and "Clear All" buttons are available for bulk selection
5. A vendor count shows how many vendors are currently assigned
6. Changes are saved via the user update API (`PUT /api/users/:id`) with the `assigned_vendor_ids` array
7. Vendor IDs (not names) are stored so that vendor name changes don't break assignments
8. If no vendors are assigned (empty array), the buyer sees all products

---

#### US-042: Assign Products to Buyers

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to bulk assign products to specific buyers so that I can control product visibility at a granular level. |
| Persona       | Superadmin     |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 8       |

**Acceptance Criteria:**
1. Product assignments can be managed via the `/api/users/bulk-assign-products` endpoint
2. The `assigned_product_ids` array on the user record controls which products the buyer can see
3. Product assignment works in conjunction with vendor assignment for layered visibility control
4. Changes are reflected immediately in the buyer's product browsing experience

---

#### US-043: Export User Assignments

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to export a matrix of buyer-vendor/product assignments so that I can review and share assignment data offline. |
| Persona       | Superadmin     |
| Priority      | Low            |
| Story Points  | 3              |
| Sprint        | Sprint 8       |

**Acceptance Criteria:**
1. An "Export Assignments" button is available on the Buyer Management page
2. Export fetches assignment data from `/api/users/export-assignments`
3. The export generates a matrix showing buyers vs. vendors/products with assignment indicators
4. The file downloads as an Excel/CSV format

---

### Module 11 — Admin Account Management (Superadmin)

---

#### US-044: Create Admin Users

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to create admin accounts so that I can grant operations access to trusted team members. |
| Persona       | Superadmin     |
| Priority      | High           |
| Story Points  | 5              |
| Sprint        | Sprint 8       |

**Acceptance Criteria:**
1. The Manage Admins page lists all admin and superadmin users
2. A "Create Admin" button opens a modal with: Email/Username and auto-generated password
3. Password generation uses a 12-character mix of uppercase, lowercase, numbers, and special characters
4. A "Regenerate" button creates a new random password
5. The new admin's role can be set to either "admin" or "superadmin"
6. Upon creation, credentials (username and password) are displayed with a warning that the password won't be shown again
7. The admin is created via `/api/users/admin`
8. Admin list refreshes after creation
9. Admin list can be searched via global search

---

#### US-045: Delete Admin Users

| Field         | Value          |
|---------------|----------------|
| User Story    | As a superadmin, I want to delete admin accounts so that I can revoke access for team members who no longer need it. |
| Persona       | Superadmin     |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 8       |

**Acceptance Criteria:**
1. A "Delete" button is available on each admin row
2. Deletion requires a confirmation dialog with the admin's email
3. The admin is deleted via `/api/users/admin/:id`
4. The admin list refreshes after deletion
5. Self-deletion prevention is enforced

---

### Module 12 — Cross-Cutting Concerns

---

#### US-046: Email Notifications

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to receive email notifications for order confirmations and status updates so that I stay informed without checking the app. |
| Persona       | All            |
| Priority      | High           |
| Story Points  | 8              |
| Sprint        | Sprint 4       |

**Acceptance Criteria:**
1. An order confirmation email is sent to the buyer upon successful order submission
2. Confirmation email includes: batch number, item count, total amount, status, and an itemized list of products with quantities and prices
3. A status update email is sent when an admin changes the order status
4. Status update email includes: new status, admin notes, and order details
5. Emails use professional HTML formatting with branded styling
6. Email is sent via Nodemailer using SMTP configuration from environment variables
7. If SMTP is not configured (`SMTP_HOST` or `SMTP_USER` not set), email sending is gracefully skipped without crashing the application
8. The sender name and email address are configurable via `EMAIL_FROM_NAME` and `EMAIL_FROM` environment variables

---

#### US-047: PWA Installation and Offline Support

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to install the app on my mobile device and have basic offline access so that I can use it like a native app. |
| Persona       | Buyer          |
| Priority      | Medium         |
| Story Points  | 8              |
| Sprint        | Sprint 6       |

**Acceptance Criteria:**
1. The app is installable on mobile devices (iOS and Android) via the browser's "Add to Home Screen" prompt
2. A `manifest.json` file provides app metadata (name, icons, theme color, start URL)
3. A service worker caches static resources and images for offline use
4. When launched from the home screen, the app opens in standalone mode (no browser chrome)
5. The app uses a mobile-first responsive design that adapts to all screen sizes
6. Touch targets meet minimum 44px for accessibility (WCAG AAA)
7. Fast load times are achieved through caching strategies

---

#### US-048: Buyer Profile Management

| Field         | Value          |
|---------------|----------------|
| User Story    | As a buyer, I want to view and update my profile information so that my account details are accurate. |
| Persona       | Buyer          |
| Priority      | Medium         |
| Story Points  | 3              |
| Sprint        | Sprint 6       |

**Acceptance Criteria:**
1. A profile option is accessible from the navigation sidebar
2. Clicking opens the BuyerProfileModal showing the buyer's current name, email, and access code
3. Profile data is fetched from `/api/users/profile`
4. The buyer can update their name
5. Changes are saved via `PUT /api/users/profile` with auto-save (debounced)
6. A "Saved" confirmation message appears briefly after successful save
7. Error messages are shown if the save fails
8. Loading state is displayed while profile data is being fetched

---

## 5. Sprint Roadmap

| Sprint   | User Stories                          | Total Points | Focus Area                    |
|----------|---------------------------------------|--------------|-------------------------------|
| Sprint 1 | US-001, US-002, US-003, US-004, US-005 | 24           | Authentication & Access Control |
| Sprint 2 | US-006, US-007, US-008, US-009, US-010, US-011 | 39    | Product Catalog & Browsing    |
| Sprint 3 | US-012, US-013, US-014, US-015, US-016 | 26          | Shopping Cart & Purchase Orders |
| Sprint 4 | US-017, US-018, US-019, US-020, US-021, US-046 | 31   | Order Tracking & Notifications |
| Sprint 5 | US-022, US-023, US-024, US-025, US-026, US-027, US-028, US-030 | 39 | Admin Dashboard & Order Management |
| Sprint 6 | US-029, US-031, US-032, US-047, US-048 | 27          | Analytics, PWA & Profile      |
| Sprint 7 | US-033, US-034, US-035, US-036, US-037, US-038, US-039 | 40 | Product & Vendor Management   |
| Sprint 8 | US-040, US-041, US-042, US-043, US-044, US-045 | 32    | User & Admin Management       |

**Total Story Points: 258**

---

## 6. Definition of Done

1. All acceptance criteria have been met and verified
2. Code has been peer reviewed and approved
3. Unit tests written with minimum 80% coverage
4. Integration tests pass in staging environment
5. UI/UX matches approved design mockups and follows the senior-friendly design guidelines (large typography, high contrast, 44px touch targets)
6. Responsive design verified on mobile, tablet, and desktop viewports
7. Documentation updated (API docs, user guides)
8. No critical or high-severity bugs remain open
9. Product Owner has signed off on the story
10. Accessibility requirements met (WCAG AA minimum)

