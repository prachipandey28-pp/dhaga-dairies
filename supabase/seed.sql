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
    'prod_1792853665720_wls8',
    'tulip-clip-5720',
    'Tulip clip',
    'Handmade crochet tulip hair clip with soft pastel yarn and secure metal clasp.',
    'Accessories',
    70.00,
    NULL,
    49,
    'clip-01',
    '/uploads/WhatsApp_Image_2026-10-11_at_5_22_49_PM__1__1792853653416.jpeg',
    '["/uploads/WhatsApp_Image_2026-10-11_at_5_22_49_PM__1__1792853653416.jpeg"]'::jsonb,
    '🌷',
    'HANDMADE',
    TRUE,
    TRUE,
    FALSE,
    TRUE
  ),
  (
    'prod_1792853594871_1wxk',
    'flower-clip-4871',
    'Flower Clip',
    'Charming crochet blossom hair clip, handcrafted with premium milk-cotton yarn.',
    'Accessories',
    100.00,
    NULL,
    8,
    'clip-02',
    '/uploads/WhatsApp_Image_2026-10-11_at_5_22_49_PM_1792853585793.jpeg',
    '["/uploads/WhatsApp_Image_2026-10-11_at_5_22_49_PM_1792853585793.jpeg"]'::jsonb,
    '🌸',
    'BESTSELLER',
    TRUE,
    TRUE,
    TRUE,
    FALSE
  ),
  (
    'prod_1792853398906_vl07',
    'rose-tulip-8905',
    'Rose Tulip',
    'Elegant handcrafted crochet rose tulip accessory, woven with vibrant yarn.',
    'Accessories',
    200.00,
    NULL,
    8,
    'rose-03',
    '/uploads/WhatsApp_Image_2026-10-11_at_5_22_50_PM__1__1792853378700.jpeg',
    '["/uploads/WhatsApp_Image_2026-10-11_at_5_22_50_PM__1__1792853378700.jpeg"]'::jsonb,
    '🌹',
    'HANDMADE',
    TRUE,
    FALSE,
    FALSE,
    FALSE
  ),
  (
    'prod_1792853318503_zeld',
    'rose-n-heart-bouquet-8503',
    'Rose & Heart Bouquet',
    'Everlasting crochet floral bouquet featuring lovingly stitched roses and cute crochet hearts.',
    'Flowers',
    400.00,
    NULL,
    10,
    'bouquet-04',
    '/uploads/WhatsApp_Image_2026-10-11_at_5_22_50_PM_1792853292409.jpeg',
    '["/uploads/WhatsApp_Image_2026-10-11_at_5_22_50_PM_1792853292409.jpeg"]'::jsonb,
    '💐',
    'HANDMADE',
    TRUE,
    TRUE,
    FALSE,
    TRUE
  ),
  (
    'prod_1792853211799_xome',
    'simpal-gajra-1799',
    'Simple Gajra',
    'Traditional hair gajra handcrafted with white & yellow wool buds, reusable and evergreen.',
    'Accessories',
    300.00,
    250.00,
    50,
    'gajra-05',
    '/uploads/WhatsApp_Image_2026-10-11_at_5_22_51_PM__1__1792853192777.jpeg',
    '["/uploads/WhatsApp_Image_2026-10-11_at_5_22_51_PM__1__1792853192777.jpeg"]'::jsonb,
    '🌼',
    'NEW ARRIVAL',
    TRUE,
    FALSE,
    FALSE,
    TRUE
  ),
  (
    'prod_1792852337558_cvd3',
    'chaffa-keychain-7558',
    'Chaffa Keychain',
    'Delicate frangipani / chaffa flower keychain hand-crocheted with soft yellow & cream yarn.',
    'Plushies',
    200.00,
    200.00,
    8,
    'keychain-06',
    '/uploads/WhatsApp_Image_2026-10-11_at_5_22_51_PM_1792852319508.jpeg',
    '["/uploads/WhatsApp_Image_2026-10-11_at_5_22_51_PM_1792852319508.jpeg"]'::jsonb,
    '🌸',
    'LIMITED EDITION',
    TRUE,
    FALSE,
    FALSE,
    FALSE
  ),
  (
    'prod_1792852236419_f9s5',
    'claw-clips-6419',
    'Claw Clips',
    'Sturdy hair claw clips adorned with handcrafted crochet flowers and cute leaf detailing.',
    'Accessories',
    200.00,
    200.00,
    8,
    'clips-07',
    '/uploads/WhatsApp_Image_2026-10-11_at_5_34_59_PM__1__1792852208739.jpeg',
    '["/uploads/WhatsApp_Image_2026-10-11_at_5_38_20_PM_1792852179457.jpeg", "/uploads/WhatsApp_Image_2026-10-11_at_5_34_59_PM__1__1792852208739.jpeg"]'::jsonb,
    '🎀',
    'BESTSELLER',
    TRUE,
    TRUE,
    TRUE,
    FALSE
  ),
  (
    'prod_1792851455888_4y6w',
    'rubberbands-5888',
    'Rubberbands',
    'Gentle crochet hair scrunchies and rubber bands that protect hair and prevent breakage.',
    'Accessories',
    60.00,
    60.00,
    25,
    'rubber-08',
    '/uploads/WhatsApp_Image_2026-10-11_at_5_38_20_PM_1792851412264.jpeg',
    '["/uploads/WhatsApp_Image_2026-10-11_at_5_38_20_PM_1792851412264.jpeg"]'::jsonb,
    '🎀',
    'HANDMADE',
    TRUE,
    FALSE,
    FALSE,
    FALSE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  sale_price = EXCLUDED.sale_price,
  stock = EXCLUDED.stock;

-- 3. Product Variants
-- (No default demo variants)

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
