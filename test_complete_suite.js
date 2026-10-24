/**
 * Dhaga Diaries — Comprehensive Automated Test Suite
 * Tests:
 * 1. Storefront & Public APIs (Categories, Products, Offers, Reviews)
 * 2. Coupon Validation (Valid codes, Expired/Invalid codes, Min order check)
 * 3. Security & Access Control (Protected Admin Routes 401 Unauthorized)
 * 4. Admin Authentication (Supabase Auth / Session cookie)
 * 5. Product CRUD (Create, Read, Update, Delete)
 * 6. Category CRUD & Deletion Safeguards (Cannot delete category with products)
 * 7. Offers & Coupons CRUD
 * 8. Order Placement & Atomic Stock Deduction
 * 9. Real Database Dashboard Stats
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

let adminCookie = '';

async function runTests() {
  console.log('====================================================');
  console.log('🌸 STARTING DHAGA DIARIES FULL DATABASE TEST SUITE 🌸');
  console.log('Target:', BASE_URL);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // -----------------------------------------------------------------------
    // TEST 1: Public Storefront & Catalog APIs
    // -----------------------------------------------------------------------
    console.log('1. Testing Public Storefront & Data APIs...');
    const homeRes = await fetch(`${BASE_URL}/`);
    assert(homeRes.status === 200, 'Storefront (GET /) returns status 200');

    const catRes = await fetch(`${BASE_URL}/api/categories?onlyActive=true`);
    const catData = await catRes.json();
    assert(catRes.status === 200 && Array.isArray(catData.categories), 'GET /api/categories returns array of categories');
    assert(catData.categories.length > 0, `Active categories found: ${catData.categories.length}`);

    const prodRes = await fetch(`${BASE_URL}/api/products`);
    const prodData = await prodRes.json();
    assert(prodRes.status === 200 && Array.isArray(prodData.products), 'GET /api/products returns catalog products');
    assert(prodData.products.length > 0, `Catalog products count: ${prodData.products.length}`);

    const bannerRes = await fetch(`${BASE_URL}/api/offers?bannerOnly=true`);
    const bannerData = await bannerRes.json();
    assert(bannerRes.status === 200, 'GET /api/offers?bannerOnly=true succeeds');

    // -----------------------------------------------------------------------
    // TEST 2: Trusted Server-Side Coupon Validation
    // -----------------------------------------------------------------------
    console.log('\n2. Testing Trusted Server-Side Coupon Validation...');
    const validCouponRes = await fetch(`${BASE_URL}/api/checkout/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'CROCHET15', subtotal: 1000 }),
    });
    const validCouponData = await validCouponRes.json();
    assert(validCouponData.valid === true, 'Coupon CROCHET15 validated as true');
    assert(validCouponData.discount === 150, `15% discount computed correctly on ₹1000: ₹${validCouponData.discount}`);

    const fakeCouponRes = await fetch(`${BASE_URL}/api/checkout/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'FAKE_CODE_99', subtotal: 1000 }),
    });
    const fakeCouponData = await fakeCouponRes.json();
    assert(fakeCouponData.valid === false, 'Invalid coupon FAKE_CODE_99 correctly rejected');

    const minOrderRes = await fetch(`${BASE_URL}/api/checkout/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'CROCHET15', subtotal: 100 }), // below ₹799 min order
    });
    const minOrderData = await minOrderRes.json();
    assert(minOrderData.valid === false, 'Order below min order value correctly rejected');

    // -----------------------------------------------------------------------
    // TEST 3: Security & Authorization Protection
    // -----------------------------------------------------------------------
    console.log('\n3. Testing Security & Unauthorized Access Protection...');
    const unauthStats = await fetch(`${BASE_URL}/api/admin/stats`);
    assert(unauthStats.status === 401, 'Unauthenticated GET /api/admin/stats blocked with 401');

    const unauthCust = await fetch(`${BASE_URL}/api/admin/customers`);
    assert(unauthCust.status === 401, 'Unauthenticated GET /api/admin/customers blocked with 401');

    const unauthProdCreate = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker Item', price: 999 }),
    });
    assert(unauthProdCreate.status === 401, 'Unauthenticated POST /api/products blocked with 401');

    // -----------------------------------------------------------------------
    // TEST 4: Admin Authentication & Session
    // -----------------------------------------------------------------------
    console.log('\n4. Testing Admin Authentication...');
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@dhagadiaries.com',
        password: 'DhagaAdmin@2026!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.success, 'Admin login with credentials succeeds');

    const rawCookies = loginRes.headers.get('set-cookie');
    if (rawCookies) {
      adminCookie = rawCookies.split(';')[0];
    }
    assert(!!adminCookie, 'Received secure HTTP-only admin session cookie');

    const meRes = await fetch(`${BASE_URL}/api/admin/me`, {
      headers: { Cookie: adminCookie },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.user?.email === 'admin@dhagadiaries.com', 'GET /api/admin/me verifies active admin session');

    // -----------------------------------------------------------------------
    // TEST 5: Product CRUD Operations
    // -----------------------------------------------------------------------
    console.log('\n5. Testing Product CRUD (Database-backed)...');
    const newProdRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Automated Test Crochet Coaster',
        category: 'Accessories',
        price: 299,
        salePrice: 249,
        stock: 10,
        sku: `TEST-${Date.now()}`,
        desc: 'Testing database persistence and CRUD operations.',
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
        tag: 'NEW ARRIVAL',
        isPublished: true,
      }),
    });
    const newProdData = await newProdRes.json();
    assert(newProdRes.status === 201 && newProdData.product?.id, `Product created with ID: ${newProdData.product?.id}`);
    const createdProductId = newProdData.product?.id;

    // Update Product
    const updateProdRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        price: 320,
        stock: 12,
      }),
    });
    const updateProdData = await updateProdRes.json();
    assert(updateProdRes.status === 200 && updateProdData.product?.price === 320, 'Product price updated in database');

    // Verify in catalog
    const verifyProdRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
    const verifyProdData = await verifyProdRes.json();
    assert(verifyProdData.product?.stock === 12, 'Product stock updated in database to 12');

    // Delete Product
    const delProdRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delProdRes.status === 200, 'Product deleted successfully from database');

    // -----------------------------------------------------------------------
    // TEST 6: Category Management & Safeguards
    // -----------------------------------------------------------------------
    console.log('\n6. Testing Category CRUD & Safeguards...');
    // Create Category
    const newCatRes = await fetch(`${BASE_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Test Holiday Pieces',
        icon: '🎄',
        description: 'Special seasonal items.',
        displayOrder: 99,
        isActive: true,
      }),
    });
    const newCatData = await newCatRes.json();
    assert(newCatRes.status === 201 && newCatData.category?.id, `Category created with ID: ${newCatData.category?.id}`);
    const testCatId = newCatData.category?.id;

    // Delete Category without products
    const delCatRes = await fetch(`${BASE_URL}/api/categories/${testCatId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    assert(delCatRes.status === 200, 'Empty category deleted successfully');

    // Attempt to delete category in use (e.g. Bags)
    const bagsCat = catData.categories.find(c => c.name === 'Bags');
    if (bagsCat) {
      const delBagsRes = await fetch(`${BASE_URL}/api/categories/${bagsCat.id}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      assert(delBagsRes.status === 400, 'Safeguard passed: Deleting category with active products was BLOCKED');
    }

    // -----------------------------------------------------------------------
    // TEST 7: Offers & Coupons CRUD
    // -----------------------------------------------------------------------
    console.log('\n7. Testing Offers & Coupons Management...');
    const testCode = `TEST${Math.floor(Math.random() * 9000 + 1000)}`;
    const newCoupRes = await fetch(`${BASE_URL}/api/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        code: testCode,
        description: 'Automated test discount coupon',
        discountType: 'fixed',
        discountValue: 75,
        minOrderAmount: 200,
        isActive: true,
      }),
    });
    const newCoupData = await newCoupRes.json();
    assert(newCoupRes.status === 201 && newCoupData.coupon?.code === testCode, `Coupon ${testCode} created`);

    // Validate newly created coupon code
    const testCoupVal = await fetch(`${BASE_URL}/api/checkout/validate-coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: testCode, subtotal: 500 }),
    });
    const testCoupValData = await testCoupVal.json();
    assert(testCoupValData.valid === true && testCoupValData.discount === 75, `New coupon ${testCode} immediately valid for ₹75 discount`);

    // Clean up test coupon
    await fetch(`${BASE_URL}/api/coupons/${newCoupData.coupon.id}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });

    // -----------------------------------------------------------------------
    // TEST 8: Order Placement & Inventory Stock Deduction
    // -----------------------------------------------------------------------
    console.log('\n8. Testing Order Placement & Inventory Stock Deduction...');
    const targetProduct = prodData.products.find(p => p.price >= 800) || prodData.products[0];
    const initialStock = targetProduct.stock;

    const orderRes = await fetch(`${BASE_URL}/api/checkout/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Aanya Tester',
        customerEmail: 'aanya.test@example.com',
        customerPhone: '9876543210',
        shippingAddress: 'Flat 402, Lotus Orchid, MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        notes: 'Please pack with festive ribbon.',
        couponCode: targetProduct.price >= 800 ? 'CROCHET15' : (targetProduct.price >= 299 ? 'DHAGA50' : undefined),
        items: [{ id: targetProduct.id, qty: 1 }],
      }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 200 && orderData.orderNumber, `Order created: ${orderData.orderNumber}`);

    // Verify stock deduction
    const afterStockRes = await fetch(`${BASE_URL}/api/products/${targetProduct.id}`);
    const afterStockData = await afterStockRes.json();
    assert(afterStockData.product.stock === initialStock - 1, `Inventory safely deducted from ${initialStock} to ${afterStockData.product.stock}`);

    // -----------------------------------------------------------------------
    // TEST 9: Real Database Dashboard Statistics
    // -----------------------------------------------------------------------
    console.log('\n9. Testing Database Dashboard Statistics...');
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.success, 'GET /api/admin/stats returns valid metrics');
    assert(typeof statsData.stats.totalProducts === 'number', `Total products computed: ${statsData.stats.totalProducts}`);
    assert(typeof statsData.stats.totalOrders === 'number', `Total orders computed: ${statsData.stats.totalOrders}`);
    assert(typeof statsData.stats.totalRevenue === 'number', `Total revenue computed: ₹${statsData.stats.totalRevenue}`);

    console.log('\n====================================================');
    console.log(`🌸 TEST RUN COMPLETE: ${passed} PASSED, ${failed} FAILED 🌸`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
}

runTests();
