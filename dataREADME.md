# FoodFax Owner App — Data & Architecture Documentation (`dataREADME.md`)

This document provides a comprehensive technical overview of the FoodFax Restaurant & Shop Partner application, covering the application architecture, the Supabase database schema integration, environment variable configuration, and the status of the real-time subscription implementation.

---

## 1. Application Architecture

The FoodFax Partner Portal is structured as a decoupled, reactive single-page application (SPA) built with React 19, TypeScript, Tailwind CSS, and the Supabase JavaScript Client.

### Architectural Diagram
```
+---------------------------------------------------------------------------------+
|                                 USER INTERFACE                                  |
|   +-------------------+  +-------------------+  +---------------------------+   |
|   |  DashboardScreen  |  |   OrdersScreen    |  | MenuScreen / ShopSetup    |   |
|   |  (Live metrics,   |  |  (Kitchen Display |  | (Categories, Dishes,      |   |
|   |   rush toggle)    |  |   & History)      |  |  Shop metadata)           |   |
|   +---------+---------+  +---------+---------+  +-------------+-------------+   |
+-------------|----------------------|--------------------------|-----------------+
              |                      |                          |
              +----------------------+--------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------+
|                       STATE & CONTEXT MANAGEMENT LAYER                          |
|                          (src/context/OwnerAppContext.tsx)                      |
|   - Real-time store state (ownerProfile, shop, active orders, menu items)       |
|   - Sound notification trigger on incoming orders (soundService)                |
|   - Offline resilience & local cached profiles                                  |
+------------------------------------+--------------------------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------+
|                            API SERVICE LAYER (src/services/)                    |
|   +-------------------+  +-------------------+  +---------------------------+   |
|   |    userService    |  |    shopService    |  |       orderService        |   |
|   |  (public.users)   |  |   (public.shops)  |  | (public.orders & items)   |   |
|   +-------------------+  +-------------------+  +---------------------------+   |
|   +-------------------+  +-------------------+  +---------------------------+   |
|   |    menuService    |  |   soundService    |  |   supabaseClient (proxy)  |   |
|   | (categories/items)|  | (WebAudio chime)  |  | (re-exports canonical)    |   |
|   +-------------------+  +-------------------+  +---------------------------+   |
+------------------------------------+--------------------------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------+
|                   CANONICAL SUPABASE CLIENT (src/lib/supabaseClient.ts)         |
|   - Initialized with project URL & Anon Key                                     |
|   - Persistent session storage, auto-refresh tokens                             |
|   - WebSocket client for postgres_changes realtime events                       |
+------------------------------------+--------------------------------------------+
                                     |
                                     v
+---------------------------------------------------------------------------------+
|                           SUPABASE CLOUD BACKEND                                |
|   - PostgreSQL Database (public schema: users, shops, orders, order_items, etc.)|
|   - Realtime Engine (Postgres WAL -> WebSocket push)                            |
|   - Supabase Auth (Phone OTP & Email)                                           |
+---------------------------------------------------------------------------------+
```

### Key Modules:
- **Canonical Client (`src/lib/supabaseClient.ts`)**: The single source of truth for the Supabase instance. Configured with fallback environment credentials and exports `supabase`, `supabaseClient`, `getSupabaseClient()`, and `testSupabaseConnection()`.
- **API Services (`src/services/`)**: Isolated modules encapsulating all CRUD queries and mutations, ensuring no raw, unstructured queries are scattered across screens.
- **Context Provider (`src/context/OwnerAppContext.tsx`)**: Centralized application hub managing active session state, shop operational toggles, and listening to background real-time updates.
- **Audio Service (`src/services/soundService.ts`)**: Synthesizes custom dual-tone chimes using the HTML5 Web Audio API, alerting kitchen staff immediately when an order arrives.

---

## 2. Supabase Database Schema Integration

All database interactions strictly follow your PostgreSQL database schema, foreign key relations, and CHECK constraints.

### 2.1 Table: `public.users`
*Replaces legacy non-existent `profiles` references.*
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `text` / `uuid` | Primary Key (matches Supabase Auth UID or generated ID) |
| `phone` | `text` | Unique phone number |
| `email` | `text` | Optional internal email (e.g. `ff.owner.<phone>@foodfax.local`) |
| `full_name` | `text` | Owner full name |
| `photo_url` | `text` | Avatar URL |
| `role` | `text` | Set to `'owner'` for restaurant managers |
| `shop_id` | `text` / `uuid` | Foreign Key pointing to `public.shops.id` |
| `profile_completed` | `boolean` | `true` once onboarding is complete |
| `is_active` | `boolean` | Account active status (`true`) |
| `is_demo` | `boolean` | `false` for real owner accounts |
| `created_at` | `timestamptz` | Record creation timestamp |
| `updated_at` | `timestamptz` | Last updated timestamp |

### 2.2 Table: `public.shops`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `text` / `uuid` | Primary Key |
| `owner_id` | `text` / `uuid` | Foreign Key -> `public.users.id` |
| `name` | `text` | Restaurant / Stall display name |
| `stall_type` | `text` | Category ('Restaurant', 'Cafe', 'Thela / Food Stall', etc.) |
| `description` | `text` | Restaurant description |
| `phone` / `contact_phone` | `text` | Official contact telephone |
| `address`, `area`, `city`, `state`, `pincode` | `text` | Geographic address details |
| `latitude`, `longitude` | `numeric` | Coordinates for geo-proximity |
| `upi_id` | `text` | Payment UPI ID for direct customer payouts |
| `image` / `banner_image` | `text` | Store logo and hero banner assets |
| `is_open` | `boolean` | Live switch for Store Open / Store Closed |
| `is_rush_hour` | `boolean` | Rush Mode flag (adds buffer to prep time) |
| `table_service_available` | `boolean` | Enables Dine-in table ordering |
| `preparation_time_minutes` | `text` | e.g. `'5-10'` or `'15-20 min'` |

### 2.3 Table: `public.orders`
*Adheres to uppercase CHECK constraints and column name conventions.*
| Column | Type | Constraints / Allowed Values |
| :--- | :--- | :--- |
| `id` | `text` / `uuid` | Primary Key |
| `shop_id` | `text` / `uuid` | Foreign Key -> `public.shops.id` |
| `customer_name` | `text` | Customer display name |
| `customer_phone` | `text` | Customer phone number |
| `token_number` | `text` | Daily kitchen token (e.g. `#FF-402`) |
| `order_number` | `text` | Order identifier token |
| `order_status` | `text` | `'PENDING'`, `'ACCEPTED'`, `'PREPARING'`, `'READY'`, `'COMPLETED'`, `'CANCELLED'` |
| `order_type` | `text` | `'TAKEAWAY'`, `'DINE_IN'` |
| `payment_status` | `text` | `'PENDING'`, `'PAID'`, `'COLLECT_ON_DELIVERY'`, `'REFUNDED'`, `'FAILED'` |
| `payment_method` | `text` | `'CASH_AT_COUNTER'`, `'PAY_ONLINE'` |
| `table_number` | `text` | e.g. `'T-03'` (when `order_type = 'DINE_IN'`) |
| `total` | `numeric` | Total order billing amount |
| `subtotal` | `numeric` | Base item amount |
| `cancellation_reason`| `text` | Reason recorded when rejected |
| `estimated_preparation_minutes` | `text` / `int` | Turnaround time in minutes |
| `completed_at` | `timestamptz` | Set when status changes to `'COMPLETED'` |
| `created_at` | `timestamptz` | Order creation timestamp |
| `updated_at` | `timestamptz` | Last updated timestamp |

### 2.4 Table: `public.order_items`
| Column | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `text` / `uuid` | Primary Key |
| `order_id` | `text` / `uuid` | Foreign Key -> `public.orders.id` (ON DELETE CASCADE) |
| `menu_item_id` | `text` / `uuid` | Foreign Key -> `public.menu_items.id` |
| `name` | `text` | Dish name captured at time of order |
| `price` | `numeric` | Unit item price |
| `quantity` | `int` | Ordered quantity |
| `is_veg` | `boolean` | Dietary flag |
| `notes` | `text` | Customization instructions (e.g. "Less spicy") |

### 2.5 Table: `public.categories` & `public.menu_items`
- `categories`: `id`, `shop_id`, `name`, `display_order`, `is_active`.
- `menu_items`: `id`, `shop_id`, `category_id`, `name`, `description`, `price`, `is_veg`, `is_available`, `display_order`, `preparation_time_min`, `is_bestseller`, `image`.

---

## 3. Environment Variables Configuration

The application uses Vite environment variables with code-level fallbacks:

```bash
# Supabase Project Configuration
VITE_SUPABASE_URL="https://aftmqdmiwvpbpsdmsfbu.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_O-f6YGUbj6hqHYBlwEhE5g_QVrnke9m"

# PostgreSQL Direct Connection (For backend scripts & migrations)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.aftmqdmiwvpbpsdmsfbu.supabase.co:5432/postgres"
```

### Configured Files:
1. `/.env`: Injected into runtime for Vite client-side code (`import.meta.env.VITE_SUPABASE_URL`).
2. `/.env.example`: Template for developers and CI/CD pipelines.
3. `/src/lib/supabaseClient.ts`: Has fallback defaults directly embedded, ensuring the app continues to operate seamlessly even if environment variable injection is skipped.
4. `/lib/core/constants.dart`: Configured with the same defaults for mobile Dart builds.

---

## 4. Status of the Realtime Subscription Implementation

### 4.1 Channel & Subscription Status: **ACTIVE & CONNECTED**
- **Active Channel**: `shop_orders_global_${shop.id}`
- **Postgres Table Filter**: `schema: 'public'`, `table: 'orders'`, `filter: shop_id=eq.${shop.id}`

### 4.2 Realtime Event Handling:
1. **`INSERT` Event**:
   - Fires automatically whenever a customer places an order.
   - Joins `order_items` and maps the payload to the `OwnerOrder` interface.
   - Plays the `soundService.playNewOrderChime()` alert.
   - Prepends the order into the active state list and displays a banner notification.
   - Instantly recalculates Dashboard metrics (Today's Orders and Estimated Revenue).
2. **`UPDATE` Event**:
   - Fires whenever an order status transitions (e.g., `'ACCEPTED'`, `'PREPARING'`, `'READY'`, `'COMPLETED'`).
   - Updates order state in-place without page reloading.
   - If marked `'COMPLETED'`, the order transitions to the completed history list and records timestamps.
   - Shows an unobtrusive 4-second status toast.
3. **`DELETE` Event**:
   - Removes cancelled or pruned orders from the local display.

### 4.3 Instant Verification / Simulation Tool:
- Inside the **Kitchen Orders Screen**, an embedded **"Simulate Order"** quick-action is available.
- Clicking it inserts a fully compliant record into `public.orders` and `public.order_items` via the Supabase client, triggering the real-time pipeline, sound chime, and dashboard metrics update in real-time.

---

## 5. Summary of Completed Improvements

1. **`src/lib/supabaseClient.ts` Created**:
   - Initialized with project URL (`https://aftmqdmiwvpbpsdmsfbu.supabase.co`) and Anon Key (`sb_publishable_O-f6YGUbj6hqHYBlwEhE5g_QVrnke9m`).
   - Exports `supabase`, `supabaseClient`, `getSupabaseClient()`, and `testSupabaseConnection()`.
2. **Modularized API Services**:
   - `userService.ts`, `shopService.ts`, `orderService.ts`, and `menuService.ts` provide clean abstraction over database tables.
3. **Strict Schema Compliance**:
   - Fixed table targets (`public.users` instead of `profiles`).
   - Enforced uppercase check constraints on `order_status`, `order_type`, and `payment_status`.
   - Corrected column keys (`total`, `token_number`, `stall_type`, `is_rush_hour`).
4. **Clean UI**:
   - Zero intrusive setup dialogs or manual URL input prompts in the UI; background connection runs automatically on launch.
