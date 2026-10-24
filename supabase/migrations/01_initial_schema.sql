-- =========================================================================
-- DHAGA DIARIES — OFFICIAL SUPABASE POSTGRESQL SCHEMA & SECURITY MIGRATION
-- Handcrafted with Love for crochet e-commerce boutique
-- Features: Categories, Products, Variants, Offers, Coupons, Orders,
--           Customers, Reviews, Storage Policies, and Bulletproof RLS.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. ADMIN ROLES & ACCESS CONTROL
-- =========================================================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'owner', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backwards-compatible view for admin_profiles
CREATE OR REPLACE VIEW admin_profiles AS
  SELECT id, user_id, email, name, role, created_at, updated_at
  FROM admin_roles;

-- Helper security definer function to check if the caller is an authenticated admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 2. CATEGORIES
-- =========================================================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY DEFAULT ('cat_' || floor(extract(epoch from now()))::text),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  icon TEXT DEFAULT '🧶',
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 3. PRODUCTS & VARIANTS
-- =========================================================================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY DEFAULT ('prod_' || floor(extract(epoch from now()))::text),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  sale_price NUMERIC(10, 2) CHECK (sale_price IS NULL OR sale_price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku TEXT UNIQUE NOT NULL,
  image TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  emoji TEXT DEFAULT '🧶',
  tag TEXT DEFAULT 'HANDMADE',
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
  is_new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_launch_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY DEFAULT ('var_' || floor(extract(epoch from now()))::text),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g. "Pastel Pink", "Classic Cream", "Size M"
  sku TEXT UNIQUE NOT NULL,
  price NUMERIC(10, 2) CHECK (price IS NULL OR price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Collections support for themed showcases
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY DEFAULT ('col_' || floor(extract(epoch from now()))::text),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image TEXT NOT NULL,
  icon TEXT DEFAULT '🧶',
  display_order INT NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 4. OFFERS, DISCOUNTS & COUPONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY DEFAULT ('off_' || floor(extract(epoch from now()))::text),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  banner_text TEXT DEFAULT '',
  is_banner_active BOOLEAN NOT NULL DEFAULT FALSE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'category')),
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY DEFAULT ('coup_' || floor(extract(epoch from now()))::text),
  code TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_discount_amount NUMERIC(10, 2) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
  usage_limit INT CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  per_customer_limit INT NOT NULL DEFAULT 1 CHECK (per_customer_limit > 0),
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'category', 'product')),
  scope_target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id TEXT REFERENCES coupons(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  order_id TEXT,
  discount_applied NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 5. ORDERS & ORDER ITEMS
-- =========================================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ord_' || floor(extract(epoch from now()))::text),
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  notes TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  coupon_code TEXT,
  shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  order_status TEXT NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  variant_title TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY DEFAULT ('tx_' || floor(extract(epoch from now()))::text),
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  razorpay_payment_id TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  method TEXT,
  error_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 6. REVIEWS & CUSTOMERS
-- =========================================================================
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev_' || floor(extract(epoch from now()))::text),
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT DEFAULT '',
  quote TEXT NOT NULL,
  byline TEXT NOT NULL DEFAULT '— CUSTOMER NOTE',
  image TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  shipping_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(10, 2) NOT NULL DEFAULT 0,
  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 7. ATOMIC INVENTORY FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id TEXT, p_quantity INT)
RETURNS INT AS $$
DECLARE
  v_new_stock INT;
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = NOW()
  WHERE id = p_product_id
  RETURNING stock INTO v_new_stock;

  RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_stock(p_product_id TEXT, p_quantity INT)
RETURNS INT AS $$
DECLARE
  v_new_stock INT;
BEGIN
  UPDATE products
  SET stock = stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id
  RETURNING stock INTO v_new_stock;

  RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 8. INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTER
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published, category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active, is_banner_active);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved, product_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- =========================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "Public can view published products" ON products;
DROP POLICY IF EXISTS "Admins full access on products" ON products;
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins full access on categories" ON categories;
DROP POLICY IF EXISTS "Public can view published collections" ON collections;
DROP POLICY IF EXISTS "Admins full access on collections" ON collections;
DROP POLICY IF EXISTS "Public can view active offers" ON offers;
DROP POLICY IF EXISTS "Admins full access on offers" ON offers;
DROP POLICY IF EXISTS "Admins full access on coupons" ON coupons;
DROP POLICY IF EXISTS "Public can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins full access on orders" ON orders;
DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Public can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Admins full access on reviews" ON reviews;
DROP POLICY IF EXISTS "Admins full access on customers" ON customers;
DROP POLICY IF EXISTS "Admins full access on admin_roles" ON admin_roles;

-- 1. admin_roles: Only admins can view admin profiles
CREATE POLICY "Admins full access on admin_roles" ON admin_roles
  FOR ALL TO authenticated
  USING (is_admin());

-- 2. categories: Public read active; Admins have full access
CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins full access on categories" ON categories
  FOR ALL TO authenticated
  USING (is_admin());

-- 3. products: Public read published products; Admins have full access
CREATE POLICY "Public can view published products" ON products
  FOR SELECT USING (is_published = TRUE AND (scheduled_launch_at IS NULL OR scheduled_launch_at <= NOW()));

CREATE POLICY "Admins full access on products" ON products
  FOR ALL TO authenticated
  USING (is_admin());

-- 4. product_variants: Public can read; Admins full access
CREATE POLICY "Public can view variants" ON product_variants
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins full access on variants" ON product_variants
  FOR ALL TO authenticated
  USING (is_admin());

-- 5. collections: Public read published; Admins full access
CREATE POLICY "Public can view published collections" ON collections
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Admins full access on collections" ON collections
  FOR ALL TO authenticated
  USING (is_admin());

-- 6. offers: Public read active offers; Admins full access
CREATE POLICY "Public can view active offers" ON offers
  FOR SELECT USING (is_active = TRUE AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "Admins full access on offers" ON offers
  FOR ALL TO authenticated
  USING (is_admin());

-- 7. coupons: Admin only (coupons are validated securely on server to prevent scrape leaks)
CREATE POLICY "Admins full access on coupons" ON coupons
  FOR ALL TO authenticated
  USING (is_admin());

-- 8. orders: Public can insert during checkout; Admins have full access
CREATE POLICY "Public can insert orders" ON orders
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins full access on orders" ON orders
  FOR ALL TO authenticated
  USING (is_admin());

-- 9. reviews: Public can view approved reviews; Public can submit review; Admins full access
CREATE POLICY "Public can view approved reviews" ON reviews
  FOR SELECT USING (is_approved = TRUE);

CREATE POLICY "Public can insert reviews" ON reviews
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins full access on reviews" ON reviews
  FOR ALL TO authenticated
  USING (is_admin());

-- 10. customers: Admins only
CREATE POLICY "Admins full access on customers" ON customers
  FOR ALL TO authenticated
  USING (is_admin());

-- =========================================================================
-- 10. SUPABASE STORAGE SETUP FOR 'product-images'
-- =========================================================================
-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  TRUE,
  5242880, -- 5 MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 5242880;

-- Storage RLS: Anyone can view public product images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Storage RLS: Only admins can upload/delete product images
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND is_admin());

-- =========================================================================
-- 11. PROCEDURE TO CREATE THE FIRST ADMIN USER
-- =========================================================================
-- This ensures that only users intentionally promoted in the database
-- gain administrative access, fulfilling the security requirement.
--
-- EXAMPLE USAGE IN SUPABASE SQL EDITOR:
-- SELECT create_first_admin('admin@dhagadiaries.com', 'Dhaga Diaries Founder');
CREATE OR REPLACE FUNCTION create_first_admin(admin_email TEXT, admin_name TEXT DEFAULT 'Dhaga Admin')
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Look for existing user in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF v_user_id IS NULL THEN
    RETURN 'User with email ' || admin_email || ' does not exist in Supabase Auth yet. Please sign up in the Auth tab first, then run this function.';
  END IF;

  INSERT INTO admin_roles (user_id, email, name, role)
  VALUES (v_user_id, admin_email, admin_name, 'owner')
  ON CONFLICT (email) DO UPDATE SET role = 'owner', updated_at = NOW();

  RETURN 'Success: ' || admin_email || ' is now registered as an Owner / Admin!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
