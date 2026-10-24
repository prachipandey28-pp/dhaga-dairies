# Dhaga Diaries — Full-Stack E-commerce & Database-Connected Admin Panel

A production-grade, database-connected e-commerce web platform for **Dhaga Diaries — Handmade with Love**, faithfully preserving the warm burgundy/cream crochet boutique design, Georgia serif typography, glossy ruby buttons, customer-facing editorial experience, and adding an **authenticated, real database-driven Admin Panel connected to Supabase PostgreSQL**.

---

## ✿ Architecture & Technology Stack

- **Frontend & App Framework**: Next.js 15 (App Router), React 19, TypeScript.
- **Database**: Supabase PostgreSQL with relational tables, foreign keys, numeric money representations, and atomic inventory triggers.
- **Authentication**: Supabase Auth with dedicated Admin access control (`admin_roles` table verification).
- **Image Storage**: Supabase Storage (`product-images` bucket) with public read access and admin-only upload/delete policies (plus local fallback for offline development).
- **Security & Authorization**: Row Level Security (RLS) policies on every database table, role-based checks (`is_admin()`), input validation with Zod, and server-side coupon/discount calculation.
- **Payments**: Razorpay Gateway (UPI, Cards, NetBanking, Wallets) with HMAC-SHA256 signature verification and refund initiation.
- **Resilient Dual-Mode Engine**: Runs directly on Supabase PostgreSQL in the cloud; seamlessly uses local persistent database storage (`data/store.json`) when Supabase credentials are in placeholder mode.

---

## ✿ Project Structure

```
dhaga-diaries/
├── .env.example                       # Template with Supabase & Razorpay secret guides
├── .env.local                         # Local environment configuration
├── data/
│   └── store.json                     # Local persistent database (fallback)
├── public/
│   ├── images/
│   │   ├── brand_logo.png             # Official Dhaga Diaries logo
│   │   ├── hero_img.png               # High-res hero crochet visual
│   │   ├── nav_bg.png                 # Header burgundy wave artwork
│   │   └── footer_bg.png              # Burgundy crochet floral frame artwork
│   └── uploads/                       # Product and review uploads (local storage)
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   └── page.tsx               # Protected multi-tab Admin Dashboard
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── customers/route.ts # Registered buyers & lifetime spend
│   │   │   │   ├── login/route.ts     # Supabase Auth & admin role verification
│   │   │   │   ├── logout/route.ts    # Secure admin logout & session clear
│   │   │   │   ├── me/route.ts        # Server-side admin session verification
│   │   │   │   ├── orders/route.ts    # Admin orders & transaction records
│   │   │   │   ├── orders/[id]/route.ts# Order status updates & stock restoration
│   │   │   │   ├── products/import-csv/route.ts # Bulk CSV product importer
│   │   │   │   ├── stats/route.ts     # Real database-driven dashboard metrics
│   │   │   │   └── upload/route.ts    # Supabase Storage & local upload handler
│   │   │   ├── categories/            # Category listing & creation API
│   │   │   ├── categories/[id]/       # Category update & safeguard deletion API
│   │   │   ├── checkout/
│   │   │   │   ├── create-order/      # Server-validated cart & order creation
│   │   │   │   ├── validate-coupon/   # Trusted server-side coupon validation
│   │   │   │   ├── verify-payment/    # Cryptographic signature verification
│   │   │   │   └── webhook/           # Asynchronous Razorpay webhook listener
│   │   │   ├── coupons/               # Coupons CRUD API
│   │   │   ├── offers/                # Offers & promotional banner API
│   │   │   ├── products/              # Products CRUD & variant API
│   │   │   └── reviews/               # Customer review approval & submission
│   │   ├── globals.css                # Preserved original boutique CSS
│   │   ├── layout.tsx                 # Root layout with Razorpay Checkout SDK
│   │   └── page.tsx                   # Customer-facing storefront
│   ├── lib/
│   │   ├── auth.ts                    # Admin session tokens & cookies
│   │   ├── db.ts                      # Database repository (Supabase + Fallback)
│   │   ├── razorpay.ts                # Razorpay payment SDK & verification
│   │   └── supabase.ts                # Supabase client & server-admin client
│   └── types/
│       └── index.ts                   # Strongly-typed TypeScript interfaces
├── supabase/
│   ├── migrations/
│   │   └── 01_initial_schema.sql      # Supabase schema, RLS policies, storage & functions
│   └── seed.sql                       # Complete initial catalog, categories, offers & coupons
├── test_complete_suite.js             # Automated end-to-end 31-point test suite
├── package.json
└── tsconfig.json
```

---

## ✿ Feature Breakdown

### 1. Admin Authentication (`/admin`)
- **Supabase Auth Integration**: Logs in using Supabase Auth (`supabase.auth.signInWithPassword`).
- **Role-Based Access Control**: Checks that the authenticated user exists in the `admin_roles` table with `role IN ('admin', 'owner', 'manager')`. Non-admin authenticated users are denied access with `403 Forbidden`.
- **Session Security**: HTTP-only session cookie for SSR verification.
- **Never Exposes Secrets**: The `SUPABASE_SERVICE_ROLE_KEY` is kept exclusively on the server in API routes and never exposed to the client browser.

### 2. Admin Dashboard & Metrics (`/api/admin/stats`)
Calculates real-time figures directly from database queries:
- **Total Products** & **Active Products**
- **Total Orders** & **Pending Orders**
- **Total Revenue** (computed from valid paid/confirmed orders)
- **Low-Stock Products Alert** (pieces with stock ≤ 3 units)
- **Active Offers & Active Coupons Count**
- **Recent Orders List** with customer details, item counts, and status
- **Monthly Revenue Breakdown**

### 3. Product Management & Variants
- **Full CRUD**: Add, edit, delete (with confirmation dialog), and toggle publication.
- **Multiple Images**: Upload product photos to Supabase Storage bucket `product-images` with thumbnail previews.
- **Product Variants**: Add colors, sizes, variant-specific SKUs, prices, and stock counts.
- **Search & Filters**: Search by product name, SKU, or description; filter by category and stock level (In Stock, Low Stock, Out of Stock); sort by price, stock, or date.
- **CSV Import & Export**: One-click **Export CSV** download and **Import CSV** modal for bulk updates.

### 4. Offers, Discounts & Coupons
- **Promotional Banners & Flash Sales**:
  - Percentage or flat amount discounts.
  - Custom announcement bar banner text (`🌸 SPRING SPECIAL: Flat 15% OFF...`).
  - One-click toggle to feature the banner on the storefront.
  - Start date and expiry date tracking (with `Active`, `Upcoming`, and `Expired` status pills).
- **Checkout Coupon Codes**:
  - Create codes such as `WELCOME10`, `CROCHET15`, `DHAGA50`.
  - Configure minimum order amount, maximum discount caps, usage limits, and per-customer limits.
  - Real-time usage tracking (`usedCount / usageLimit`).
  - **Trusted Server-Side Validation**: Discounts are calculated and verified exclusively on the server via `/api/checkout/validate-coupon` and in `/api/checkout/create-order` so client browsers cannot tamper with prices.

### 5. Categories Management
- Add, edit, and delete product categories with custom icons (🧶, 🌸, 🧸, ✨), descriptions, and display orders.
- **Deletion Safeguard**: Prevents deleting any category that still has active products assigned to it, returning an informative error explaining which products must be reassigned first.
- **Dynamic Storefront Display**: Storefront circular collection cards and category filter dropdown automatically render categories from the database.

### 6. Order Management
- Order history with customer name, email, phone, and complete shipping address.
- Order status workflow: `Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered` (or `Cancelled` / `Refunded`).
- **Atomic Stock Management**:
  - Placing an order decrements product stock immediately.
  - Cancelling or refunding an order automatically restores inventory to the catalog!
- **Payment Verification**: Reconciles Razorpay payment signatures and prevents marking refunds completed unless confirmed by the gateway.

### 7. Customer Management
- Directory of registered buyers and customers.
- Tracks total orders placed, lifetime spend (LTV), first order date, and last order date.
- Click **Order History** to view all historical orders for any individual customer.

---

## ✿ Supabase Configuration & Step-by-Step Setup

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and create a new project (e.g. `dhaga-diaries`).
2. Note your project URL and API keys from **Project Settings > API**:
   - `Project URL`
   - `anon public` key
   - `service_role secret` key

### Step 2: Initialize Database Schema & Seed Data
1. Open the **SQL Editor** in your Supabase dashboard.
2. Open `supabase/migrations/01_initial_schema.sql` and run it. This creates:
   - Tables: `admin_roles`, `categories`, `products`, `product_variants`, `collections`, `offers`, `coupons`, `orders`, `order_items`, `reviews`, `customers`.
   - Security function `is_admin()`.
   - Atomic inventory functions `decrement_stock()` and `increment_stock()`.
   - Storage bucket `product-images` with public read and admin-only write policies.
   - Row Level Security (RLS) policies for all tables.
3. Open `supabase/seed.sql` and run it to populate initial crochet categories, catalog pieces, offers, and coupons.

### Step 3: Create Your First Admin Account
1. In your Supabase dashboard, go to **Authentication > Users** and click **Add User** (or sign up via email).
   - Email: `admin@dhagadiaries.com`
   - Password: `YourSecurePassword2026!`
2. In the Supabase **SQL Editor**, run the safe first-admin helper function:
   ```sql
   SELECT create_first_admin('admin@dhagadiaries.com', 'Dhaga Diaries Founder');
   ```
   This inserts your user into `admin_roles` with `role = 'owner'`, granting full access to the admin dashboard.

### Step 4: Configure Environment Variables
Copy `.env.example` to `.env.local` and add your keys:
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_JWT_SECRET=your-random-32-character-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_ID=rzp_test_placeholder
RAZORPAY_KEY_SECRET=rzp_test_secret_placeholder
```

---

## ✿ Local Development & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the storefront, or [http://localhost:3000/admin](http://localhost:3000/admin) to access the Admin Panel.

### 3. Run Production Build
```bash
npm run build
npm start
```

### 4. Run the Automated Test Suite
With the server running on port 3000, run:
```bash
node test_complete_suite.js
```
The test suite verifies:
- Public storefront and dynamic catalog loading
- Server-side trusted coupon validation
- 401 unauthorized protection on administrative endpoints
- Admin authentication and session handling
- Product CRUD operations
- Category CRUD and deletion safeguards
- Offers and coupons management
- Order placement and automatic stock deduction
- Database dashboard statistics

---

## ✿ Deployment Guide

### Deploying to Vercel
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project into [Vercel](https://vercel.com/).
3. In **Settings > Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_JWT_SECRET`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
4. Click **Deploy**. Vercel will automatically build the Next.js application.

---

## ✿ Default Local Fallback Credentials

When running in offline/local fallback mode without live Supabase credentials configured:
- **Admin Email**: `admin@dhagadiaries.com`
- **Password**: `DhagaAdmin@2026!`
- **Access Level**: Full Administrative Rights
