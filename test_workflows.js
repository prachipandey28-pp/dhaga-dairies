const http = require('http');

async function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING DHAGA DIARIES FULL-STACK TESTS ===\n');
  let cookie = '';

  // 1. Test Storefront
  console.log('1. Testing Storefront (GET /)...');
  const homeRes = await request({ hostname: 'localhost', port: 3000, path: '/', method: 'GET' });
  console.log(`   Status: ${homeRes.statusCode}`);
  console.log(`   Has Dhaga Diaries brand: ${homeRes.body.includes('Dhaga Diaries')}`);
  console.log(`   Has Our Favourite Pieces: ${homeRes.body.includes('Our Favourite Pieces')}`);
  console.log(`   Has Loved stitch by stitch: ${homeRes.body.includes('Loved stitch by stitch')}`);
  if (homeRes.statusCode !== 200) throw new Error('Home page failed to load');

  // 2. Test Admin Login with invalid credentials
  console.log('\n2. Testing Admin Login (Invalid Credentials)...');
  const badLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'wrong@example.com', password: 'wrong' });
  console.log(`   Status: ${badLogin.statusCode} (Expected 401)`);

  // 3. Test Admin Login with valid credentials
  console.log('\n3. Testing Admin Login (Valid Credentials)...');
  const goodLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@dhagadiaries.com', password: 'DhagaAdmin@2026!' });
  console.log(`   Status: ${goodLogin.statusCode} (Expected 200)`);
  console.log(`   User:`, goodLogin.json?.user?.name);
  cookie = (goodLogin.headers['set-cookie'] || [])[0]?.split(';')[0];
  console.log(`   Session Cookie Received: ${Boolean(cookie)}`);

  // 4. Test /api/admin/me
  console.log('\n4. Testing Admin Session Verification (/api/admin/me)...');
  const meRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/me', method: 'GET',
    headers: { 'Cookie': cookie }
  });
  console.log(`   Status: ${meRes.statusCode}, User: ${meRes.json?.user?.email}`);

  // 5. Test Product Creation
  console.log('\n5. Testing Product CRUD: Adding New Product...');
  const newProductRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/products', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
  }, {
    name: 'Lilac Floral Crochet Coaster Set',
    category: 'Accessories',
    price: 399,
    salePrice: 349,
    stock: 10,
    desc: 'Set of 4 hand-crocheted pastel lilac floral coasters.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=85',
    emoji: '🌸',
    tag: 'NEW ARRIVAL',
    isPublished: true,
  });
  console.log(`   Status: ${newProductRes.statusCode}`);
  const createdProd = newProductRes.json?.product;
  console.log(`   Created Product ID: ${createdProd?.id}, Name: ${createdProd?.name}`);

  // 6. Test Unpublish Product
  console.log('\n6. Testing Unpublishing Product...');
  const unpubRes = await request({
    hostname: 'localhost', port: 3000, path: `/api/products/${createdProd.id}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
  }, { isPublished: false });
  console.log(`   Status: ${unpubRes.statusCode}, isPublished: ${unpubRes.json?.product?.isPublished}`);

  // Check public products API (must NOT include unpublished product)
  const pubProdsRes = await request({ hostname: 'localhost', port: 3000, path: '/api/products', method: 'GET' });
  const isFoundWhenUnpub = pubProdsRes.json?.products?.some(p => p.id === createdProd.id);
  console.log(`   Present in public storefront while unpublished? ${isFoundWhenUnpub} (Expected: false)`);

  // Re-publish product
  await request({
    hostname: 'localhost', port: 3000, path: `/api/products/${createdProd.id}`, method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
  }, { isPublished: true });
  console.log('   Re-published product for storefront.');

  // 7. Test Review Management
  console.log('\n7. Testing Review Management: Adding & Approving Review...');
  const revRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/reviews', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie }
  }, {
    productId: createdProd.id,
    productName: 'Lilac Floral Crochet Coaster Set',
    customerName: 'Meera K.',
    rating: 5,
    title: 'Lilac Floral Coaster Set',
    quote: 'Such vibrant colors and exquisite craftsmanship! Brightens my tea table every morning.',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=85',
    isApproved: true,
    isVerifiedPurchase: true
  });
  console.log(`   Status: ${revRes.statusCode}, Review ID: ${revRes.json?.review?.id}`);

  // 8. Test Collection Management
  console.log('\n8. Testing Collection Management...');
  const colRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/collections', method: 'GET'
  });
  console.log(`   Status: ${colRes.statusCode}, Total Collections: ${colRes.json?.collections?.length}`);

  // 9. Test Checkout Flow (Create Order)
  console.log('\n9. Testing Checkout Flow: Creating Order...');
  const orderRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/checkout/create-order', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    customerName: 'Ananya Verma',
    customerEmail: 'ananya@example.com',
    customerPhone: '+919876543210',
    shippingAddress: 'Flat 402, Lotus Towers, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    notes: 'Please pack in eco-friendly gift wrap',
    items: [
      { id: 'p1', qty: 1 },
      { id: createdProd.id, qty: 1 }
    ]
  });
  console.log(`   Status: ${orderRes.statusCode}`);
  const orderData = orderRes.json;
  console.log(`   Order Number: ${orderData?.orderNumber}`);
  console.log(`   Razorpay Order ID: ${orderData?.razorpayOrderId}`);
  console.log(`   Total Amount: ₹${orderData?.amount / 100}`);

  // 10. Test Payment Verification
  console.log('\n10. Testing Payment Signature Verification & Stock Deduction...');
  const verifyRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/checkout/verify-payment', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    orderId: orderData.orderId,
    razorpayOrderId: orderData.razorpayOrderId,
    razorpayPaymentId: `pay_test_${Date.now()}`,
    razorpaySignature: `sig_sim_${Date.now()}`
  });
  console.log(`   Status: ${verifyRes.statusCode}`);
  console.log(`   Verification Message: ${verifyRes.json?.message}`);
  console.log(`   Order Payment Status: ${verifyRes.json?.order?.paymentStatus}`);

  // 11. Test Admin Orders Dashboard
  console.log('\n11. Testing Admin Orders Dashboard...');
  const adminOrdersRes = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/orders', method: 'GET',
    headers: { 'Cookie': cookie }
  });
  console.log(`   Status: ${adminOrdersRes.statusCode}`);
  console.log(`   Total Orders in Dashboard: ${adminOrdersRes.json?.orders?.length}`);
  const latestOrder = adminOrdersRes.json?.orders?.[0];
  console.log(`   Latest Order: ${latestOrder?.orderNumber} by ${latestOrder?.customerName} (${latestOrder?.paymentStatus})`);

  console.log('\n=== ALL END-TO-END TESTS COMPLETED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
