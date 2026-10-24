-- =========================================================================
-- DHAGA DIARIES — INITIAL SEED DATA
-- Inserts categories, catalog products, product variants, offers, and coupons
-- =========================================================================

-- 1. Categories
INSERT INTO categories (id, name, slug, description, image, icon, display_order, is_active)
VALUES
  ('cat_bags', 'Bags', 'bags', 'Slowly hand-crocheted everyday totes, pouches, and slings.', 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=600&q=85', '👜', 1, TRUE),
  ('cat_flowers', 'Flowers', 'flowers', 'Everlasting blooms crafted with premium cotton yarn that never wilt.', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=85', '🌸', 2, TRUE),
  ('cat_plushies', 'Plushies', 'plushies', 'Whimsical companions stuffed with love, softness, and nostalgia.', 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=85', '🧸', 3, TRUE),
  ('cat_accessories', 'Accessories', 'accessories', 'Delicate crochet scrunchies, coasters, keychains, and charms.', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=85', '✨', 4, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 2. Products
INSERT INTO products (id, slug, name, description, category, price, sale_price, stock, sku, image, images, emoji, tag, is_published, is_featured, is_bestseller, is_new_arrival)
VALUES
  (
    'prod_daisy_tote',
    'daisy-dream-tote',
    'Daisy Dream Tote',
    'A cheerful everyday bag, stitched slowly by hand with soft milk-cotton yarn. Features sturdy reinforced handles and signature floral motif.',
    'Bags',
    1299.00,
    1199.00,
    8,
    'BAG-DD-01',
    'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=700&q=80',
    '["https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=700&q=80", "https://images.unsplash.com/photo-1638427291164-b4adea2f7b96?auto=format&fit=crop&w=900&q=85"]'::jsonb,
    '👜',
    'BESTSELLER',
    TRUE,
    TRUE,
    TRUE,
    FALSE
  ),
  (
    'prod_sunflower_stem',
    'sunflower-stem-keepsake',
    'Sunflower Stem Keepsake',
    'Bright wool sunflowers made to sit quietly in vintage bottles on sunny desks. A gift of eternal warmth that never loses its petals.',
    'Flowers',
    349.00,
    299.00,
    15,
    'FLW-SF-02',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=80',
    '["https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=700&q=80"]'::jsonb,
    '🌸',
    'HANDMADE',
    TRUE,
    TRUE,
    FALSE,
    FALSE
  ),
  (
    'prod_boba_bear',
    'boba-bear-plushie',
    'Boba Bear Plushie',
    'Pocket-sized palm comfort, holding a tiny pearl cup for slow tea afternoons. Hand-stitched with hypoallergenic velvet yarn.',
    'Plushies',
    899.00,
    799.00,
    5,
    'PLS-BB-03',
    'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=700&q=80',
    '["https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=700&q=80"]'::jsonb,
    '🧸',
    'NEW ARRIVAL',
    TRUE,
    TRUE,
    FALSE,
    TRUE
  ),
  (
    'prod_cherry_scrunchie',
    'cherry-blossom-scrunchie',
    'Cherry Blossom Scrunchie',
    'Gentle on locks, spun in antique ivory and rose-petal stitches. Elastic core reinforced with double-twisted soft yarn.',
    'Accessories',
    249.00,
    199.00,
    22,
    'ACC-CB-04',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=80',
    '["https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=700&q=80"]'::jsonb,
    '✨',
    'HANDMADE',
    TRUE,
    FALSE,
    FALSE,
    FALSE
  ),
  (
    'prod_lavender_bouquet',
    'lavender-whisper-bouquet',
    'Lavender Whisper Bouquet',
    'Five delicate lavender sprigs bound with natural jute ribbon. Infused with subtle calming lavender essential oils.',
    'Flowers',
    649.00,
    549.00,
    10,
    'FLW-LV-05',
    'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=700&q=80',
    '["https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=700&q=80"]'::jsonb,
    '🌸',
    'LIMITED EDITION',
    TRUE,
    TRUE,
    TRUE,
    FALSE
  ),
  (
    'prod_strawberry_pouch',
    'strawberry-sweetheart-pouch',
    'Strawberry Sweetheart Pouch',
    'A compact drawstring bag in vibrant strawberry red with tiny white seed embroidery and leafy green ties.',
    'Bags',
    799.00,
    699.00,
    6,
    'BAG-SB-06',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80',
    '["https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80"]'::jsonb,
    '👜',
    'BESTSELLER',
    TRUE,
    FALSE,
    TRUE,
    FALSE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price,
  stock = EXCLUDED.stock;

-- 3. Product Variants
INSERT INTO product_variants (id, product_id, title, sku, price, stock)
VALUES
  ('var_daisy_pink', 'prod_daisy_tote', 'Pastel Pink', 'BAG-DD-01-PNK', 1299.00, 4),
  ('var_daisy_cream', 'prod_daisy_tote', 'Classic Cream', 'BAG-DD-01-CRM', 1299.00, 4),
  ('var_sun_yellow', 'prod_sunflower_stem', 'Sun Yellow', 'FLW-SF-02-YEL', 349.00, 10),
  ('var_sun_amber', 'prod_sunflower_stem', 'Amber Gold', 'FLW-SF-02-AMB', 349.00, 5)
ON CONFLICT (id) DO NOTHING;

-- 4. Offers
INSERT INTO offers (id, title, description, discount_type, discount_value, banner_text, is_banner_active, start_date, end_date, is_active, scope)
VALUES
  (
    'off_spring_fest',
    'Spring Blossom Celebration',
    'Celebrate hand-knitted creations with 15% off across all boutique pieces.',
    'percentage',
    15.00,
    '🌸 SPRING SPECIAL: Flat 15% OFF with code CROCHET15 | Free Shipping on orders over ₹999 🧶',
    TRUE,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '30 days',
    TRUE,
    'all'
  ),
  (
    'off_bag_season',
    'Tote Bag Festival',
    'Get ₹100 direct off on our best-selling artisanal bags and pouches.',
    'fixed',
    100.00,
    '👜 Handbag Season: Save ₹100 on every Daisy Tote with code BAG100',
    FALSE,
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '15 days',
    TRUE,
    'category'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  banner_text = EXCLUDED.banner_text;

-- 5. Coupons
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, used_count, per_customer_limit, is_active)
VALUES
  ('coup_welcome10', 'WELCOME10', '10% off for first-time crochet lovers', 'percentage', 10.00, 500.00, 300.00, 500, 12, 1, TRUE),
  ('coup_crochet15', 'CROCHET15', '15% off spring season promotion', 'percentage', 15.00, 799.00, 500.00, 200, 45, 1, TRUE),
  ('coup_dhaga50', 'DHAGA50', 'Flat ₹50 off on any handmade order', 'fixed', 50.00, 299.00, 50.00, 1000, 78, 2, TRUE),
  ('coup_bag100', 'BAG100', 'Flat ₹100 off on bag collection', 'fixed', 100.00, 999.00, 100.00, 150, 19, 1, TRUE)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  discount_value = EXCLUDED.discount_value;

-- 6. Initial Customer Reviews
INSERT INTO reviews (id, product_name, customer_name, rating, title, quote, byline, image, is_approved, is_verified_purchase)
VALUES
  (
    'rev_1',
    'Daisy Dream Tote',
    'Priya Sharma',
    5,
    'Prettier than pictures!',
    'The stitches are so tight and neat, and the strap doesn''t dig in even with my iPad inside. Truly feels like an heirloom piece.',
    '— VERIFIED MUMBAI BUYER',
    'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=400&q=80',
    TRUE,
    TRUE
  ),
  (
    'rev_2',
    'Sunflower Stem Keepsake',
    'Ananya Roy',
    5,
    'Eternal sunshine on my desk',
    'Ordered three sunflower stems for my study desk. Everyone who joins my video calls asks where I got them! Packaging was pure poetry.',
    '— VERIFIED BENGALURU BUYER',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=400&q=80',
    TRUE,
    TRUE
  ),
  (
    'rev_3',
    'Boba Bear Plushie',
    'Siddharth Nair',
    5,
    'Cutest gift ever',
    'Gifted the Boba Bear to my sister for her birthday. She literally teared up. Super soft, beautifully boxed with a handwritten note.',
    '— VERIFIED DELHI BUYER',
    'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=400&q=80',
    TRUE,
    TRUE
  )
ON CONFLICT (id) DO NOTHING;
