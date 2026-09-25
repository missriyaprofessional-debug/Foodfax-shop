# FoodFax Owner App & Supabase Real-Time Integration Report

FoodFax Partner & Restaurant Owner portal configured with real-time Supabase database integration, live kitchen display, order tracking, and shop operations.

---

## 1. Supabase Project Configuration

The application is pre-configured to connect directly to your active Supabase project in the background without any manual UI setup or dialog boxes:

| Parameter | Configuration Value |
| :--- | :--- |
| **Project URL** | `https://aftmqdmiwvpbpsdmsfbu.supabase.co` |
| **Publishable / Anon Key** | `sb_publishable_O-f6YGUbj6hqHYBlwEhE5g_QVrnke9m` |
| **Direct PostgreSQL URI** | `postgresql://postgres:[YOUR-PASSWORD]@db.aftmqdmiwvpbpsdmsfbu.supabase.co:5432/postgres` |
| **Target Database Host** | `db.aftmqdmiwvpbpsdmsfbu.supabase.co:5432` |
| **Default Database** | `postgres` |

### Environment Configuration:
- `.env`:
  ```bash
  VITE_SUPABASE_URL="https://aftmqdmiwvpbpsdmsfbu.supabase.co"
  VITE_SUPABASE_ANON_KEY="sb_publishable_O-f6YGUbj6hqHYBlwEhE5g_QVrnke9m"
  ```
- `src/lib/supabaseClient.ts`: Canonical client initialization export (`supabase`, `supabaseClient`, `getSupabaseClient`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
- `src/services/supabaseClient.ts`: Re-exports from `src/lib/supabaseClient.ts` for full backward compatibility across the application.
- `lib/core/constants.dart`: Synchronized with the same project URL and key for Flutter/Dart exports.

---

## 2. API Service Layer Architecture

The database operations are decoupled into modular, single-responsibility services under `src/services/` that consume the canonical client from `src/lib/supabaseClient.ts`:

### 1. `src/lib/supabaseClient.ts`
- Canonical initialized `SupabaseClient` instance (`supabase`).
- Configured with `persistSession: true`, `autoRefreshToken: true`, and WebSocket realtime event stream (`eventsPerSecond: 10`).
- Provides `testSupabaseConnection()` for live database health checks.

### 2. `src/services/userService.ts` (`public.users`)
- `getUserById(id)`: Reads owner profile from `public.users`.
- `getUserByPhone(phone)`: Finds user by registered mobile digits.
- `upsertUser(user)`: Inserts/updates owner account details (`id`, `phone`, `email`, `full_name`, `role = 'owner'`, `shop_id`, `profile_completed = true`, `is_active = true`, `is_demo = false`).
- `updateUser(id, updates)`: Updates profile fields.
- `linkShop(userId, shopId)`: Associates the owner with their store ID.

### 3. `src/services/shopService.ts` (`public.shops`)
- `getShopByOwnerId(ownerId)`: Retrieves store profile linked to the owner.
- `getShopById(shopId)`: Retrieves store by primary key.
- `upsertShop(shop)`: Creates/updates restaurant details mapped to exact schema columns:
  - `stall_type`: Shop classification (e.g., 'Restaurant', 'Cafe', 'Thela / Food Stall')
  - `is_rush_hour`: Live rush mode boolean
  - `table_service_available`: Dine-in table ordering support
  - `preparation_time_minutes`: Estimated turnaround time text
  - `is_open`: Live store status
- `updateShopStatus(shopId, isOpen)`: Updates store open/closed status.
- `updateRushMode(shopId, isRushHour, extraMinutes)`: Toggles rush mode & prep time.

### 4. `src/services/orderService.ts` (`public.orders` & `public.order_items`)
- `getOrdersByShopId(shopId)`: Fetches active orders joined with `order_items`.
- `getOrderById(orderId)`: Retrieves single order with items.
- `getCompletedOrdersHistory(shopId)`: Fetches completed history sorted by `created_at DESC`.
- `updateOrderStatus(orderId, status, reason)`: Performs atomic updates using strict uppercase check constraints (`'PENDING'`, `'ACCEPTED'`, `'PREPARING'`, `'READY'`, `'COMPLETED'`, `'CANCELLED'`). Automatically sets `completed_at` and `payment_status = 'PAID'` when marked complete.
- `createOrder(params)`: Inserts order header into `public.orders` and corresponding rows into `public.order_items`.

### 5. `src/services/menuService.ts` (`public.categories` & `public.menu_items`)
- `getCategories(shopId)`: Fetches categories ordered by `display_order`.
- `addCategory(shopId, name, displayOrder)`: Inserts category record.
- `getMenuItems(shopId)`: Fetches menu items ordered by `display_order`.
- `upsertMenuItem(item)`: Inserts/updates dish with `is_veg`, `price`, `image`, `is_bestseller`, `preparation_time_min`.
- `deleteMenuItem(itemId)`: Removes menu item from store.
- `toggleAvailability(itemId, isAvailable)`: Toggles in-stock status in real-time.

---

## 3. Issues Diagnosed & What Was Fixed

### Issue 1: Missing Table `profiles` & Registration Failures
- **Root Cause**: The previous code was attempting to insert and query user data from a non-existent table named `profiles`.
- **Fix**: Replaced all references with **`public.users`**, matching your database schema:
  - Columns: `id`, `phone`, `email`, `full_name`, `role = 'owner'`, `shop_id`, `profile_completed = true`, `is_active = true`, `is_demo = false`, `created_at`, `updated_at`.
  - When an owner registers or logs in, their profile is now saved and verified directly in `public.users`.

### Issue 2: `public.orders` Column Mismatches & CHECK Constraint Violations
- **Root Cause**: Queries were attempting to insert/filter using `status` (which caused Postgres error `column "status" of relation "orders" does not exist`), `total_amount` (instead of `total`), and `order_number` (instead of `token_number`). Furthermore, lowercase values like `'pending'`, `'dine_in'`, and `'upi'` were rejected by the database's strict `CHECK` constraints.
- **Fix**:
  - `order_status` mapped to uppercase values: `'PENDING'`, `'ACCEPTED'`, `'PREPARING'`, `'READY'`, `'COMPLETED'`, `'CANCELLED'`.
  - `order_type` mapped to uppercase values: `'TAKEAWAY'`, `'DINE_IN'`.
  - `payment_method` mapped to uppercase values: `'CASH_AT_COUNTER'`, `'PAY_ONLINE'`.
  - `payment_status` mapped to uppercase values: `'PENDING'`, `'PAID'`, `'COLLECT_ON_DELIVERY'`, `'REFUNDED'`, `'FAILED'`.
  - Column `total` used for total order amount and `token_number` used for token identifiers.
  - Foreign key relations to `public.order_items` properly joined on `order_items.order_id = orders.id`.

### Issue 3: `public.shops` Column Mismatches
- **Root Cause**: Inserting into `shops` failed with missing column errors (`shop_type`, `is_rush_mode`, `rush_extra_minutes`).
- **Fix**: Re-aligned all fields to your schema:
  - `stall_type` (for shop type)
  - `is_rush_hour` (boolean for rush mode)
  - `preparation_time_minutes` (text, e.g. `'5-10'`)
  - `table_service_available` (boolean for dine-in availability)
  - `owner_id` (foreign key pointing to `public.users.id`).

### Issue 4: `public.categories` & `public.menu_items` Schema Mismatch
- **Root Cause**: Queries were sorting by `sort_order` and inserting `tag`, `image_url`, which failed.
- **Fix**: 
  - `categories` uses `display_order` (integer).
  - `menu_items` uses `display_order`, `image`, `preparation_time_min`, `preparation_minutes`, and `customization_options`.

### Issue 5: Clean UI (Zero Popups or Intrusive Dialogs)
- **Requirement**: "faltu chij ui me mat add kar"
- **Fix**: Removed all setup popups, test panels, manual URL input modals, and database connection buttons from `LoginScreen`, `OrdersScreen`, `TopAppBar`, and `ShopSettingsModal`. The app connects silently in the background directly using your provided credentials.

---

## 4. Database Schema Reference

```
                      +-------------------+
                      |   public.users    |
                      +-------------------+
                      | id (PK)           |
                      | phone             |
                      | full_name         |
                      | role ('owner')    |
                      | shop_id (FK)      |
                      +---------+---------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
+------------------------+             +------------------------+
|      public.shops      |             |  public.favorite_shops |
+------------------------+             +------------------------+
| id (PK)                |             | id (PK)                |
| owner_id (FK -> users) |             | user_id (FK)           |
| name, stall_type       |             | shop_id (FK)           |
| is_open, is_rush_hour  |             +------------------------+
+-----------+------------+
            |
            +--------------------------+--------------------------+
            |                          |                          |
            v                          v                          v
+-----------------------+  +-----------------------+  +-----------------------+
|   public.categories   |  |   public.menu_items   |  |     public.orders     |
+-----------------------+  +-----------------------+  +-----------------------+
| id (PK)               |  | id (PK)               |  | id (PK)               |
| shop_id (FK -> shops) |  | shop_id (FK -> shops) |  | shop_id (FK -> shops) |
| name, display_order   |  | category_id (FK)      |  | token_number, total   |
+-----------------------+  | name, price, image    |  | order_status, type    |
                           +-----------------------+  +-----------+-----------+
                                                                  |
                                      +---------------------------+---------------------------+
                                      |                                                       |
                                      v                                                       v
                          +------------------------+                             +------------------------+
                          |   public.order_items   |                             | public.order_status_...|
                          +------------------------+                             +------------------------+
                          | id (PK)                |                             | id (PK)                |
                          | order_id (FK -> orders)|                             | order_id (FK -> orders)|
                          | name, price, quantity  |                             | new_status, changed_by |
                          +------------------------+                             +------------------------+
```

---

## 5. Real-Time Architecture & Workflow

### 1. Active Subscriptions
- **Channel**: `shop_orders_global_${shop.id}`
- **Table**: `orders`
  - Event: `INSERT` -> New orders trigger sound chime, auto-insert into active order list, and increment Dashboard's Today's Orders / Revenue metrics.
  - Event: `UPDATE` -> Order status changes (`PENDING` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `COMPLETED`) instantly reflect in the UI.
  - Event: `DELETE` -> Removes order from UI if deleted.
- **Table**: `order_items`
  - Listens for line-item modifications.

### 2. OrdersScreen Views
- **Active Orders View**:
  - Filters all non-terminal orders (`pending`, `accepted`, `preparing`, `ready`).
  - Status action buttons trigger atomic updates to `public.orders.order_status`.
  - When marked `ready`, an automated notification is logged to `public.notifications`.
  - When marked `completed`, timestamps `completed_at` and updates `payment_status = 'PAID'`.
- **Order History View**:
  - Fetches completed orders from `public.orders` filtered by `order_status = 'COMPLETED'` ordered by `created_at DESC`.
  - Date filtering supports: All Time, Today, and Past 7 Days.
- **Simulate Order Button**:
  - A quick-action button in OrdersScreen that generates a 100% schema-valid order into `public.orders` and `public.order_items` so you can verify real-time incoming order chimes and dashboard updates in 1 click.

### 3. Dashboard Metrics ('Today's Performance')
- **Orders Placed Today**: Calculated from orders where `created_at >= 00:00:00` of current date.
- **Today's Revenue**: Sum of `total` for today's completed/settled orders.
- **Average Order Value (AOV)**: Computed dynamically from today's orders.
- **Kitchen Rush Mode**: Live toggle writing directly to `public.shops.is_rush_hour`.

---

## 6. How to Run & Verify

1. **Development Server**:
   ```bash
   npm run dev
   ```
   Server runs on `http://0.0.0.0:3000`.

2. **Build for Production**:
   ```bash
   npm run build
   ```

3. **Lint & Typecheck**:
   ```bash
   npm run lint
   ```
