'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, Collection, Review, CartItem, Category, Offer, Coupon } from '@/types';

declare global {
  interface Window {
    Razorpay?: any;
    toastTimer?: any;
  }
}

export default function Storefront() {
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919152831829';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bannerOffer, setBannerOffer] = useState<Offer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [detailQty, setDetailQty] = useState(1);
  const [detailActiveImg, setDetailActiveImg] = useState<string>('');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; text: string }>({
    isOpen: false,
    title: '',
    text: '',
  });

  // Checkout form
  const [checkoutData, setCheckoutData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    total: number;
    whatsappUrl?: string;
  } | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('dd_cart');
      if (savedCart) setCart(JSON.parse(savedCart));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Save cart to localStorage
  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('dd_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch live storefront data from DB
  const loadData = async () => {
    try {
      const [prodRes, colRes, revRes, catRes, offerRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/collections'),
        fetch('/api/reviews'),
        fetch('/api/categories?onlyActive=true'),
        fetch('/api/offers?bannerOnly=true'),
      ]);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.products || []);
      }
      if (colRes.ok) {
        const colData = await colRes.json();
        setCollections(colData.collections || []);
      }
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData.reviews || []);
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      }
      if (offerRes.ok) {
        const offerData = await offerRes.json();
        setBannerOffer(offerData.banner || null);
      }
    } catch (err) {
      console.error('Error loading storefront data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const rupees = (num: number) => '₹' + Number(num).toLocaleString('en-IN');

  // WhatsApp Messaging Helpers
  const openProductWhatsApp = (product: Product, qty: number = 1, variantTitle?: string) => {
    const price = product.salePrice && product.salePrice > 0 ? product.salePrice : product.price;
    let msg = `🌸 *Hello Dhaga Diaries!* 🌸\n\n`;
    msg += `I am interested in ordering / inquiring about this handcrafted crochet treasure:\n\n`;
    msg += `*${product.name}*\n`;
    msg += `• Price: ${rupees(price)}\n`;
    if (variantTitle) {
      msg += `• Variant / Style: ${variantTitle}\n`;
    }
    msg += `• Quantity: ${qty}\n`;
    if (product.sku) {
      msg += `• Item Code: ${product.sku}\n`;
    }
    msg += `• Category: ${product.category}\n\n`;
    msg += `Could you please confirm availability, delivery timeline, and payment options? Thank you! ♡`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openCartWhatsApp = () => {
    if (cart.length === 0) {
      showToast('Your basket is empty');
      return;
    }
    let msg = `🌸 *Hello Dhaga Diaries!* 🌸\n\n`;
    msg += `I would like to place an order for the items in my basket:\n\n`;
    cart.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.name}* × ${item.qty} = ${rupees(item.price * item.qty)}\n`;
    });
    msg += `\n*Subtotal:* ${rupees(cartSubtotal)}\n`;
    if (couponDiscount > 0) {
      msg += `*Coupon Discount (${appliedCoupon?.code}):* -${rupees(couponDiscount)}\n`;
    }
    msg += `*Shipping:* ${shippingFee === 0 ? 'FREE' : rupees(shippingFee)}\n`;
    msg += `*Total Amount:* ${rupees(cartTotal)}\n\n`;
    msg += `Please let me know how to proceed with payment (UPI / Bank Transfer) and delivery details. Thank you! ♡`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const addToCart = (product: Product, quantity: number = 1, variant?: string) => {
    const existing = cart.find(i => i.id === product.id && (variant ? i.selectedVariant === variant : true));
    let newCart: CartItem[];
    if (existing) {
      if (product.stock < existing.qty + quantity) {
        showToast(`Only ${product.stock} pieces in stock ✿`);
        return;
      }
      newCart = cart.map(i => (i === existing ? { ...i, qty: i.qty + quantity } : i));
    } else {
      if (product.stock < quantity) {
        showToast(product.stock <= 0 ? 'Sorry, this piece is currently out of stock ✿' : `Only ${product.stock} pieces available ✿`);
        return;
      }
      newCart = [
        ...cart,
        {
          id: product.id,
          name: variant ? `${product.name} (${variant})` : product.name,
          price: product.salePrice && product.salePrice > 0 ? product.salePrice : product.price,
          qty: quantity,
          image: product.image,
          emoji: product.emoji,
          category: product.category,
          stock: product.stock,
          selectedVariant: variant,
        },
      ];
    }
    updateCart(newCart);
    showToast(`${product.name} added to your basket ♡`);
  };

  const removeFromCart = (id: string) => {
    const newCart = cart.filter(i => i.id !== id);
    updateCart(newCart);
  };

  const updateCartQty = (id: string, delta: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeFromCart(id);
    } else {
      const product = products.find(p => p.id === id);
      if (product && product.stock < newQty) {
        showToast(`Only ${product.stock} pieces available ✿`);
        return;
      }
      const newCart = cart.map(i => (i.id === id ? { ...i, qty: newQty } : i));
      updateCart(newCart);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingFee = cartSubtotal >= 999 || cartSubtotal === 0 ? 0 : 79;
  const cartTotal = Math.max(0, cartSubtotal - couponDiscount + shippingFee);

  // Apply Coupon Code
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponMessage({ text: 'Please enter a coupon code', isError: true });
      return;
    }
    if (cartSubtotal <= 0) {
      setCouponMessage({ text: 'Add items to basket before applying coupons', isError: true });
      return;
    }

    setIsValidatingCoupon(true);
    setCouponMessage(null);

    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: cartSubtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponDiscount(data.discount);
        setCouponMessage({ text: data.message, isError: false });
        showToast(data.message);
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponMessage({ text: data.message || 'Invalid coupon', isError: true });
      }
    } catch {
      setCouponMessage({ text: 'Could not validate coupon code', isError: true });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponMessage(null);
    setCouponInput('');
    showToast('Coupon removed');
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedFilter === 'All' || p.category.toLowerCase() === selectedFilter.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Open info modal
  const openInfo = (title: string, text: string) => {
    setInfoModal({ isOpen: true, title, text });
  };

  // Checkout handling via WhatsApp
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your basket is empty');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const response = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...checkoutData,
          paymentMethod: 'whatsapp',
          couponCode: appliedCoupon?.code || undefined,
          items: cart.map(item => ({
            id: item.id,
            qty: item.qty,
            variantTitle: item.selectedVariant,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Compile detailed WhatsApp order message
      let msg = `🌸 *New Order from Dhaga Diaries!* 🌸\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `*Order Reference:* ${data.orderNumber}\n`;
      msg += `*Customer:* ${checkoutData.customerName}\n`;
      msg += `*Contact Phone:* ${checkoutData.customerPhone}\n`;
      msg += `*Delivery Address:*\n${checkoutData.shippingAddress}, ${checkoutData.city}, ${checkoutData.state} - ${checkoutData.pincode}\n`;
      if (checkoutData.notes) {
        msg += `*Special Request:* ${checkoutData.notes}\n`;
      }
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `*Items Ordered:*\n`;
      cart.forEach(item => {
        msg += `• ${item.name} × ${item.qty} — ${rupees(item.price * item.qty)}\n`;
      });
      msg += `\n*Subtotal:* ${rupees(cartSubtotal)}\n`;
      if (couponDiscount > 0) {
        msg += `*Coupon Discount (${appliedCoupon?.code}):* -${rupees(couponDiscount)}\n`;
      }
      msg += `*Shipping:* ${shippingFee === 0 ? 'FREE' : rupees(shippingFee)}\n`;
      msg += `*Total Amount:* ${rupees(cartTotal)}\n`;
      msg += `━━━━━━━━━━━━━━━━━━\n`;
      msg += `Hello Dhaga Diaries! I have submitted my order details on your website. Please confirm availability and share your UPI / payment details to complete the order. Thank you! ♡`;

      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

      // Automatically launch WhatsApp in new tab
      try {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // Handled via button on success modal
      }

      updateCart([]);
      setIsCheckoutOpen(false);
      setOrderSuccess({
        orderNumber: data.orderNumber,
        customerName: checkoutData.customerName,
        customerPhone: checkoutData.customerPhone,
        customerEmail: checkoutData.customerEmail || 'Provided via WhatsApp',
        total: cartTotal,
        whatsappUrl,
      });
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error processing order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div id="storefront">
      {/* 1. Announcement Bar */}
      <div className="announcement">
        {bannerOffer?.bannerText || 'A LITTLE LOVE, A LOT OF YARN ✿ HANDMADE WITH HEART'}
      </div>

      {/* 2. Sticky Header / Navigation */}
      <header className="nav">
        <a className="brand" href="#" aria-label="Dhaga Diaries home">
          <img id="brandLogo" src="/images/brand_logo.png" alt="Dhaga Diaries logo" />
          <span>
            <strong>Dhaga Diaries</strong>
            <small>Handmade with love</small>
          </span>
        </a>

        <nav className="navlinks">
          <a href="#shop">Shop all</a>
          <a href="#collections">Collections</a>
          <a href="#shop" onClick={() => setSelectedFilter('All')}>New arrivals</a>
          <a href="#story">Our story</a>
          <a href="#footer">Contact</a>
        </nav>

        <div className="navactions">
          <button className="iconbtn" onClick={() => setIsCartOpen(true)} aria-label="Shopping cart">
            ♡<span id="cartCount">{cartCount}</span>
          </button>
          <button
            className="btn rose"
            onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Shop now
          </button>
        </div>
      </header>

      <main>
        {/* 3. Hero Section */}
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-ornament">✦ ───────── ✦</div>
            <div className="eyebrow">THE HANDMADE EDIT · DHAGA DIARIES</div>
            <h1>
              Little things,<br />
              <em>made with love.</em>
            </h1>
            <p className="hero-kicker">HANDCRAFTED JOY · TIMELESS CHARM</p>
            <p>
              Meet your new favourite crochet treasures — bags, blooms, plushies and keepsakes, lovingly
              stitched one loop at a time.
            </p>
            <div className="heroactions">
              <button
                className="btn"
                onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
              >
                SHOP NEW ARRIVALS ↗
              </button>
            </div>
          </div>
          <div className="heroart">
            <img
              className="heroimg"
              src="/images/hero_img.png"
              alt="Handmade crochet pieces"
              onError={e => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=1800&q=85';
              }}
            />
            <div className="hero-stamp">
              HANDMADE<br />
              <span>with ♡</span>
            </div>
          </div>
        </section>

        {/* 4. Shop by Collection */}
        <section className="section" id="collections">
          <div className="sectionhead">
            <div>
              <div className="eyebrow">Find your kind of lovely</div>
              <h2>Shop by Collection</h2>
            </div>
            <p>Find your next favourite handmade treasure.</p>
          </div>

          <div className="categories">
            {categories.length > 0 ? (
              categories.map(cat => (
                <a
                  key={cat.id}
                  className="category"
                  href="#shop"
                  onClick={() => {
                    setSelectedFilter(cat.name);
                    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    backgroundImage: cat.image
                      ? `linear-gradient(0deg,#3e0808b8,transparent 62%),url('${cat.image}')`
                      : undefined,
                  }}
                >
                  <span className="cat-icon">{cat.icon || '🧶'}</span>
                  <div>
                    <h3>{cat.name}</h3>
                    <span>{cat.description || 'Handmade pieces ↗'}</span>
                  </div>
                </a>
              ))
            ) : collections.length > 0 ? (
              collections.map((col) => (
                <a
                  key={col.id}
                  className="category"
                  href="#shop"
                  onClick={() => {
                    setSelectedFilter(col.name.includes('Bags') ? 'Bags' : col.name.includes('Flowers') ? 'Flowers' : col.name.includes('Plushies') ? 'Plushies' : 'Accessories');
                    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    backgroundImage: `linear-gradient(0deg,#3e0808b8,transparent 62%),url('${col.image}')`,
                  }}
                >
                  <span className="cat-icon">{col.icon || '🧶'}</span>
                  <div>
                    <h3>{col.name}</h3>
                    <span>{col.subtitle || 'Handmade pieces ↗'}</span>
                  </div>
                </a>
              ))
            ) : (
              <>
                <a className="category" href="#shop" onClick={() => setSelectedFilter('Bags')}>
                  <span className="cat-icon">👜</span>
                  <div>
                    <h3>Crochet Bags</h3>
                    <span>Handmade bags ↗</span>
                  </div>
                </a>
                <a className="category" href="#shop" onClick={() => setSelectedFilter('Flowers')}>
                  <span className="cat-icon">🌷</span>
                  <div>
                    <h3>Yarn Flowers</h3>
                    <span>Forever flowers ↗</span>
                  </div>
                </a>
                <a className="category" href="#shop" onClick={() => setSelectedFilter('Plushies')}>
                  <span className="cat-icon">🧸</span>
                  <div>
                    <h3>Plushies</h3>
                    <span>Soft little friends ↗</span>
                  </div>
                </a>
                <a className="category" href="#shop" onClick={() => setSelectedFilter('Accessories')}>
                  <span className="cat-icon">🎀</span>
                  <div>
                    <h3>Little Things</h3>
                    <span>Tiny treasures ↗</span>
                  </div>
                </a>
              </>
            )}
          </div>
        </section>

        {/* 5. Shop / Favourite Pieces */}
        <section className="section" id="shop">
          <div className="sectionhead">
            <div>
              <div className="eyebrow">A little handmade magic</div>
              <h2>Our Favourite Pieces</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                id="search"
                placeholder="Find your favourite…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: '99px',
                  padding: '11px 14px',
                  background: 'white',
                  maxWidth: '190px',
                }}
              />
              <select
                id="filter"
                value={selectedFilter}
                onChange={e => setSelectedFilter(e.target.value)}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: '99px',
                  padding: '11px',
                  background: 'white',
                  color: 'var(--ink)',
                }}
              >
                <option value="All">All pieces</option>
                {categories.length > 0 ? (
                  categories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Bags">Bags</option>
                    <option value="Flowers">Flowers</option>
                    <option value="Plushies">Plushies</option>
                    <option value="Accessories">Accessories</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="products" id="productGrid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <article
                  key={p.id}
                  className="product"
                  onClick={() => {
                    setSelectedProduct(p);
                    setSelectedVariant(p.variants && p.variants.length > 0 ? p.variants[0].title : '');
                    setDetailQty(1);
                    setDetailActiveImg(p.image || (p.images && p.images[0]) || '');
                  }}
                  title="Click to view details & chat on WhatsApp"
                >
                  <div className="productimg">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : null}
                    <span className="placeholder" style={{ display: p.image ? 'none' : 'grid' }}>
                      {p.emoji || '🧶'}
                    </span>
                    <span className="tag">{p.tag || p.category.toUpperCase()}</span>
                    <button
                      className="heart"
                      onClick={e => {
                        e.stopPropagation();
                        showToast('Saved for later ♡');
                      }}
                      aria-label="Save product"
                    >
                      ♡
                    </button>
                  </div>
                  <div className="productinfo">
                    <h3>{p.name}</h3>
                    <p>{p.desc || 'A lovely handmade creation.'}</p>
                    <div className="productbottom">
                      <div>
                        <span className="price">
                          {rupees(p.salePrice && p.salePrice > 0 ? p.salePrice : p.price)}
                        </span>
                        {p.salePrice && p.salePrice > 0 ? (
                          <span className="oldprice">{rupees(p.price)}</span>
                        ) : null}
                      </div>
                      <button
                        className="add"
                        onClick={e => {
                          e.stopPropagation();
                          addToCart(p);
                        }}
                      >
                        ＋ Add
                      </button>
                    </div>
                    <div className="product-card-click-hint">
                      <span>View piece details & chat on WhatsApp ↗</span>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty" style={{ gridColumn: '1/-1' }}>
                No pieces found. Try another search or category.
              </div>
            )}
          </div>
        </section>

        {/* 6. Product Reviews Section (Preserving exact visual styling) */}
        <section className="product-reviews" id="product-reviews" aria-labelledby="product-reviews-title">
          <div className="product-reviews-heading">
            <div className="eyebrow">KIND WORDS · HANDMADE WITH LOVE</div>
            <h2 id="product-reviews-title">Loved stitch by stitch.</h2>
            <p>A closer look at the little handmade treasures customers adore.</p>
          </div>
          <div className="product-reviews-grid">
            {reviews.length > 0 ? (
              reviews.slice(0, 6).map(rev => (
                <article key={rev.id} className="product-review-card">
                  <img src={rev.image} alt={rev.productName} loading="lazy" />
                  <div className="product-review-copy">
                    <div className="product-review-stars" aria-label={`${rev.rating} out of 5 stars`}>
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </div>
                    <h3>{rev.title || rev.productName}</h3>
                    <blockquote>“{rev.quote}”</blockquote>
                    <p className="product-review-byline">
                      {rev.byline || '— CUSTOMER NOTE'}
                      {rev.isVerifiedPurchase && (
                        <span className="verified-badge">✓ Verified</span>
                      )}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <>
                <article className="product-review-card">
                  <img
                    src="https://images.unsplash.com/photo-1638427291164-b4adea2f7b96?auto=format&fit=crop&w=900&q=85"
                    alt="Handmade crochet bag with floral details"
                    loading="lazy"
                  />
                  <div className="product-review-copy">
                    <div className="product-review-stars" aria-label="5 out of 5 stars">★★★★★</div>
                    <h3>Daisy Dream Tote</h3>
                    <blockquote>“The detailing is beautiful and the bag feels so special. You can tell it was made with care.”</blockquote>
                    <p className="product-review-byline">— CUSTOMER NOTE</p>
                  </div>
                </article>
                <article className="product-review-card">
                  <img
                    src="https://images.unsplash.com/photo-1749013308478-4176584af239?auto=format&fit=crop&w=900&q=85"
                    alt="Colourful handmade crochet flowers"
                    loading="lazy"
                  />
                  <div className="product-review-copy">
                    <div className="product-review-stars" aria-label="5 out of 5 stars">★★★★★</div>
                    <h3>Forever Bloom Bouquet</h3>
                    <blockquote>“Such a thoughtful gift. The colours are lovely, and these blooms will brighten my room for ages.”</blockquote>
                    <p className="product-review-byline">— CUSTOMER NOTE</p>
                  </div>
                </article>
                <article className="product-review-card">
                  <img
                    src="https://images.unsplash.com/photo-1700171518313-5dd219beaaa6?auto=format&fit=crop&w=900&q=85"
                    alt="Small handmade crochet flowers and yarn details"
                    loading="lazy"
                  />
                  <div className="product-review-copy">
                    <div className="product-review-stars" aria-label="5 out of 5 stars">★★★★★</div>
                    <h3>Little Handmade Keepsake</h3>
                    <blockquote>“A tiny piece of happiness. The stitches and colours make it feel wonderfully personal.”</blockquote>
                    <p className="product-review-byline">— CUSTOMER NOTE</p>
                  </div>
                </article>
              </>
            )}
          </div>
        </section>

        {/* 7. Story Section */}
        <section className="story" id="story">
          <div className="story-copy">
            <div className="eyebrow">A LITTLE MORE HEART IN EVERY STITCH</div>
            <h2>
              Handmade with love.<br />
              <em>Made to be treasured.</em>
            </h2>
            <p>
              At Dhaga Diaries, we believe the loveliest things are the ones made with care. From soft
              crochet flowers to everyday bags and tiny keepsakes, every piece is thoughtfully handmade
              to bring a little warmth to your world.
            </p>
            <p>Choose a gift, find your favourite, or keep a handmade treasure just for you.</p>
            <button
              className="btn"
              onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
            >
              DISCOVER OUR COLLECTION
            </button>
          </div>
          <div className="story-photo">
            <img
              src="https://images.unsplash.com/photo-1604881988758-f76ad2f7?auto=format&fit=crop&w=1100&q=85"
              alt="Crochet yarn and handmade craft"
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="photo-note">Slow-made · Heart-loved · One of a kind</div>
          </div>
        </section>

        {/* 8. Community / Social Gallery Section */}
        <section className="social-gallery" id="community">
          <div className="social-gallery-head">
            <div className="eyebrow">FOLLOW OUR LITTLE YARN WORLD</div>
            <h2>Made by hand, shared with love.</h2>
            <p>Peek at our latest colours, creations and behind-the-scenes moments.</p>
          </div>
          <div className="social-gallery-grid">
            <a
              href="https://www.instagram.com/dhaga.diaries_/"
              target="_blank"
              rel="noreferrer"
              className="social-tile tile-one"
            >
              <img
                src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=600&q=85"
                alt="Soft floral inspiration"
              />
              <span>Forever blooms ✿</span>
            </a>
            <a
              href="https://www.instagram.com/dhaga.diaries_/"
              target="_blank"
              rel="noreferrer"
              className="social-tile tile-two"
            >
              <img
                src="https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=600&q=85"
                alt="Handmade bag inspiration"
              />
              <span>Everyday favourites</span>
            </a>
            <a
              href="https://www.instagram.com/dhaga.diaries_/"
              target="_blank"
              rel="noreferrer"
              className="social-tile tile-three"
            >
              <img
                src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=85"
                alt="Handmade craft detail"
              />
              <span>Little details, lots of love</span>
            </a>
          </div>
          <a
            className="social-follow"
            href="https://www.instagram.com/dhaga.diaries_/"
            target="_blank"
            rel="noreferrer"
          >
            FOLLOW @DHAGADIARIES_ ↗
          </a>
        </section>

        {/* 9. Newsletter Section */}
        <section className="newsletter">
          <div className="eyebrow">Letters from our little yarn world</div>
          <h2>Notes from our yarn world</h2>
          <p>New creations, sweet offers, and handmade happiness.</p>
          <form
            className="newsletterform"
            onSubmit={e => {
              e.preventDefault();
              showToast('Thank you for joining our little community!');
              (e.target as HTMLFormElement).reset();
            }}
          >
            <input type="email" required placeholder="Your email address" />
            <button className="btn" type="submit">
              Count me in
            </button>
          </form>
        </section>
      </main>

      {/* 10. Floral Boutique Footer */}
      <footer className="footer" id="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/images/brand_logo.png" alt="Dhaga Diaries logo" />
              <div>
                <strong>Dhaga Diaries</strong>
                <small>HANDMADE WITH LOVE</small>
              </div>
            </div>
            <p>
              Little things, made with lots of love. Every stitch carries a little story — thoughtfully
              handmade crochet treasures for you and the people you love.
            </p>
            <div className="footer-social">
              <a
                href="https://www.instagram.com/dhaga.diaries_/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                ◎
              </a>
              <a
                href="https://wa.me/919152831829"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
              >
                ◉
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Collections</h3>
            <a
              href="#shop"
              onClick={() => {
                setSelectedFilter('Bags');
                document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Crochet Bags
            </a>
            <a
              href="#shop"
              onClick={() => {
                setSelectedFilter('Flowers');
                document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Yarn Flowers
            </a>
            <a
              href="#shop"
              onClick={() => {
                setSelectedFilter('Plushies');
                document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Crochet Plushies
            </a>
            <a
              href="#shop"
              onClick={() => {
                setSelectedFilter('Accessories');
                document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Accessories & Keychains
            </a>
            <a href="#collections">All Collections</a>
          </div>

          <div className="footer-column">
            <h3>Helpful Links</h3>
            <a href="#shop">Search Products</a>
            <a href="#story">Our Story</a>
            <a
              href="#footer"
              onClick={() =>
                openInfo(
                  'Privacy Policy',
                  'At Dhaga Diaries, we deeply value and respect your privacy. Customer information such as name, email, phone, and delivery address collected during order placement is utilized strictly for processing orders and delivery fulfillment. We never sell, rent, or trade your personal data. Payment card and bank credentials are processed directly through Razorpay PCI-DSS certified systems and are never stored on our servers.'
                )
              }
            >
              Privacy Policy
            </a>
            <a
              href="#footer"
              onClick={() =>
                openInfo(
                  'Terms of Service',
                  'All Dhaga Diaries creations are handcrafted individually with premium yarns. Because each item is handmade, slight natural variations in stitch, dimension, and color may occur, celebrating the unique beauty of handmade art. Orders are crafted with care and dispatched within 3-5 business days.'
                )
              }
            >
              Terms of Service
            </a>
            <a
              href="#footer"
              onClick={() =>
                openInfo(
                  'Shipping & Returns',
                  'We ship pan-India via express delivery partners. Standard delivery takes 4-7 business days depending on location. Free shipping applies on orders above ₹999. In the rare event of transit damage, notify us with unboxing photos within 48 hours for immediate replacement or refund.'
                )
              }
            >
              Shipping & Returns
            </a>
          </div>

          <div className="footer-column footer-care">
            <h3>Customer Care</h3>
            <strong>We&apos;re happy to help</strong>
            <p>
              Phone: <a href="tel:+919152831829">+91 91528 31829</a>
            </p>
            <p>
              WhatsApp:{' '}
              <a href="https://wa.me/919152831829" target="_blank" rel="noreferrer">
                Chat on WhatsApp ↗
              </a>
            </p>
            <p>
              Instagram:{' '}
              <a
                href="https://www.instagram.com/dhaga.diaries_/"
                target="_blank"
                rel="noreferrer"
              >
                @dhaga.diaries_ ↗
              </a>
            </p>
            <p>For custom orders or special gifts, message us anytime.</p>
            <a
              href="https://wa.me/919152831829"
              target="_blank"
              rel="noreferrer"
              className="footer-contact"
            >
              Contact on WhatsApp ↗
            </a>
            <div className="footer-hours">Thoughtfully made · India</div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Dhaga Diaries. Made with ♡ and yarn.</span>
          <span>Privacy · Terms · Shipping & Returns</span>
          <Link href="/admin" className="adminlink">
            Owner? Admin login
          </Link>
        </div>
      </footer>

      {/* 11. Floating Social Buttons */}
      <div className="socialfloat" aria-label="Social links">
        <a
          href="https://wa.me/919152831829"
          target="_blank"
          rel="noreferrer"
          title="Chat with Dhaga Diaries on WhatsApp"
        >
          ◉
        </a>
        <a
          href="https://www.instagram.com/dhaga.diaries_/"
          target="_blank"
          rel="noreferrer"
          title="Visit @dhaga.diaries_ on Instagram"
        >
          ◎
        </a>
      </div>

      {/* 12. Cart Overlay / Drawer */}
      {isCartOpen && (
        <div className="overlay" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modalhead">
              <h2>Your little basket</h2>
              <button className="close" onClick={() => setIsCartOpen(false)}>
                ✕
              </button>
            </div>

            <div id="cartItems">
              {cart.length > 0 ? (
                cart.map(item => (
                  <div key={item.id} className="adminrow" style={{ marginBottom: '8px' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="mini">{item.emoji || '🧶'}</div>
                    )}
                    <div className="grow">
                      <strong>{item.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <button
                          style={{
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            borderRadius: '4px',
                            background: '#eee',
                            border: '1px solid #ccc',
                          }}
                          onClick={() => updateCartQty(item.id, -1)}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.qty}</span>
                        <button
                          style={{
                            width: '24px',
                            height: '24px',
                            padding: 0,
                            borderRadius: '4px',
                            background: '#eee',
                            border: '1px solid #ccc',
                          }}
                          onClick={() => updateCartQty(item.id, 1)}
                        >
                          +
                        </button>
                        <small style={{ marginLeft: '6px' }}>× {rupees(item.price)}</small>
                      </div>
                    </div>
                    <button className="danger" onClick={() => removeFromCart(item.id)}>
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty">Your basket is waiting for something lovely.</div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                {/* Coupon Code Section */}
                <div style={{ margin: '14px 0 10px', background: '#f8f3eb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e8d9c7' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      placeholder="Coupon (e.g. CROCHET15)"
                      value={couponInput}
                      onChange={e => setCouponInput(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d8b66d',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        background: '#ffffff',
                      }}
                    />
                    <button
                      className="btn"
                      onClick={() => handleApplyCoupon()}
                      disabled={isValidatingCoupon}
                      style={{ padding: '8px 14px', fontSize: '11px', background: '#570606', color: '#fff' }}
                    >
                      {isValidatingCoupon ? '…' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage && (
                    <div style={{ fontSize: '11px', marginTop: '6px', color: couponMessage.isError ? '#b91c1c' : '#15803d', fontWeight: 600 }}>
                      {couponMessage.text}
                      {appliedCoupon && (
                        <button
                          onClick={removeCoupon}
                          style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', textDecoration: 'underline', fontSize: '11px' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ margin: '14px 0 12px', borderTop: '1px solid #eadcc9', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)' }}>
                    <span>Subtotal</span>
                    <span>{rupees(cartSubtotal)}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#15803d', marginTop: '4px', fontWeight: 600 }}>
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>- {rupees(couponDiscount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                    <span>Shipping</span>
                    <span>{shippingFee === 0 ? 'FREE' : rupees(shippingFee)}</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px dashed #d8b66d',
                      fontWeight: 700,
                      fontSize: '18px',
                      color: '#570606',
                    }}
                  >
                    <span>Total</span>
                    <span id="cartTotal">{rupees(cartTotal)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  <button
                    type="button"
                    className="btn-whatsapp"
                    style={{ width: '100%' }}
                    onClick={() => openCartWhatsApp()}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.227-.557-1.782-.74-2.92-2.55-3.009-2.668-.087-.12-.72-1.002-.72-1.912 0-.911.477-1.358.647-1.543.17-.185.372-.232.496-.232.124 0 .248.002.355.006.113.004.263-.042.412.316.155.372.529 1.29.576 1.383.047.094.078.203.016.326-.062.123-.093.2-.185.308-.093.109-.196.243-.28.327-.094.093-.192.195-.083.382.11.186.488.804 1.047 1.302.721.642 1.328.841 1.517.934.188.093.298.079.409-.047.111-.126.478-.557.605-.747.127-.19.255-.158.428-.094.173.064 1.096.517 1.284.611.188.094.313.14.36.219.046.079.046.46-.098.865zM12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.003L2 22l5.13-1.344A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                    </svg>
                    Direct Order on WhatsApp 💬
                  </button>

                  <button
                    className="btn"
                    style={{ width: '100%', background: '#570606', color: '#fff' }}
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                  >
                    Enter Delivery Address & Place Order ↗
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 13. Checkout Modal with WhatsApp Confirmation */}
      {isCheckoutOpen && (
        <div className="overlay" style={{ display: 'flex' }}>
          <div className="modal checkout-modal">
            <div className="modalhead">
              <h2>Confirm your handmade order</h2>
              <button className="close" onClick={() => setIsCheckoutOpen(false)}>
                ✕
              </button>
            </div>

            <div className="checkout-grid">
              {/* Form */}
              <form onSubmit={handleCheckoutSubmit}>
                <div className="field">
                  <label>Full Name *</label>
                  <input
                    required
                    placeholder="Aanya Sharma"
                    value={checkoutData.customerName}
                    onChange={e => setCheckoutData({ ...checkoutData, customerName: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>WhatsApp / Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={checkoutData.customerPhone}
                    onChange={e => setCheckoutData({ ...checkoutData, customerPhone: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Email Address (optional, for receipt)</label>
                  <input
                    type="email"
                    placeholder="aanya@example.com (optional)"
                    value={checkoutData.customerEmail}
                    onChange={e => setCheckoutData({ ...checkoutData, customerEmail: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Delivery Address *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="House / Flat No., Street, Landmark"
                    value={checkoutData.shippingAddress}
                    onChange={e => setCheckoutData({ ...checkoutData, shippingAddress: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="field">
                    <label>City *</label>
                    <input
                      required
                      placeholder="Mumbai"
                      value={checkoutData.city}
                      onChange={e => setCheckoutData({ ...checkoutData, city: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Pincode *</label>
                    <input
                      required
                      placeholder="400001"
                      value={checkoutData.pincode}
                      onChange={e => setCheckoutData({ ...checkoutData, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>State *</label>
                  <input
                    required
                    placeholder="Maharashtra"
                    value={checkoutData.state}
                    onChange={e => setCheckoutData({ ...checkoutData, state: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Special Instructions / Gift Note</label>
                  <input
                    placeholder="E.g. Pack with ribbon, custom note..."
                    value={checkoutData.notes}
                    onChange={e => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                  />
                </div>

                <button
                  className="btn-whatsapp"
                  type="submit"
                  disabled={isSubmittingOrder}
                  style={{ width: '100%', marginTop: '16px', opacity: isSubmittingOrder ? 0.7 : 1 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.227-.557-1.782-.74-2.92-2.55-3.009-2.668-.087-.12-.72-1.002-.72-1.912 0-.911.477-1.358.647-1.543.17-.185.372-.232.496-.232.124 0 .248.002.355.006.113.004.263-.042.412.316.155.372.529 1.29.576 1.383.047.094.078.203.016.326-.062.123-.093.2-.185.308-.093.109-.196.243-.28.327-.094.093-.192.195-.083.382.11.186.488.804 1.047 1.302.721.642 1.328.841 1.517.934.188.093.298.079.409-.047.111-.126.478-.557.605-.747.127-.19.255-.158.428-.094.173.064 1.096.517 1.284.611.188.094.313.14.36.219.046.079.046.46-.098.865zM12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.003L2 22l5.13-1.344A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                  {isSubmittingOrder ? 'Connecting to WhatsApp…' : `Confirm Order & Talk on WhatsApp (${rupees(cartTotal)}) ✿`}
                </button>
              </form>

              {/* Order Summary */}
              <div className="order-summary-box">
                <h3 style={{ margin: '0 0 12px', fontFamily: 'Georgia, serif', color: '#570606' }}>
                  Order Summary
                </h3>
                {cart.map(item => (
                  <div key={item.id} className="order-item-mini">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="thumb">{item.emoji || '🧶'}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                      <small style={{ color: 'var(--muted)' }}>
                        Qty: {item.qty} × {rupees(item.price)}
                      </small>
                    </div>
                  </div>
                ))}

                <div className="summary-line" style={{ marginTop: '12px' }}>
                  <span>Items ({cartCount})</span>
                  <span>{rupees(cartSubtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="summary-line" style={{ color: '#15803d', fontWeight: 600 }}>
                    <span>Coupon Discount ({appliedCoupon?.code})</span>
                    <span>- {rupees(couponDiscount)}</span>
                  </div>
                )}
                <div className="summary-line">
                  <span>Shipping</span>
                  <span>{shippingFee === 0 ? 'FREE' : rupees(shippingFee)}</span>
                </div>
                <div className="summary-line total">
                  <span>Total Amount</span>
                  <span>{rupees(cartTotal)}</span>
                </div>

                <div
                  style={{
                    background: '#f5ebe0',
                    borderRadius: '8px',
                    padding: '12px',
                    marginTop: '15px',
                    fontSize: '11px',
                    color: '#654b3f',
                    lineHeight: 1.6,
                  }}
                >
                  💬 <strong>Direct WhatsApp Confirmation:</strong> Your order will be stored safely in our database, and a WhatsApp conversation with your full order items and address will open with the artisan owner to arrange payment (UPI QR, GPay, PhonePe, Bank Transfer, or COD) and schedule express delivery.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 14. Order Success Confirmation Modal */}
      {orderSuccess && (
        <div className="overlay" style={{ display: 'flex' }}>
          <div className="modal" style={{ textAlign: 'center', maxWidth: '460px' }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🌸</div>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#570606', margin: '0 0 8px' }}>
              Order Placed!
            </h2>
            <p style={{ color: '#765e55', fontSize: '14px', lineHeight: 1.6, margin: '0 0 16px' }}>
              Thank you, <strong>{orderSuccess.customerName}</strong>! Your order <strong>{orderSuccess.orderNumber}</strong> has been recorded. Let&apos;s talk on WhatsApp to finalize payment & dispatch.
            </p>
            <div
              style={{
                background: '#f8f2eb',
                border: '1px solid #ebd9c5',
                borderRadius: '10px',
                padding: '14px',
                textAlign: 'left',
                fontSize: '13px',
                marginBottom: '18px',
              }}
            >
              <div>
                <strong>Order Reference:</strong> {orderSuccess.orderNumber}
              </div>
              <div style={{ marginTop: '4px' }}>
                <strong>Total Amount:</strong> {rupees(orderSuccess.total)}
              </div>
              <div style={{ marginTop: '4px' }}>
                <strong>Contact Phone:</strong> {orderSuccess.customerPhone}
              </div>
            </div>

            {orderSuccess.whatsappUrl && (
              <a
                href={orderSuccess.whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp"
                style={{ width: '100%', marginBottom: '10px' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.227-.557-1.782-.74-2.92-2.55-3.009-2.668-.087-.12-.72-1.002-.72-1.912 0-.911.477-1.358.647-1.543.17-.185.372-.232.496-.232.124 0 .248.002.355.006.113.004.263-.042.412.316.155.372.529 1.29.576 1.383.047.094.078.203.016.326-.062.123-.093.2-.185.308-.093.109-.196.243-.28.327-.094.093-.192.195-.083.382.11.186.488.804 1.047 1.302.721.642 1.328.841 1.517.934.188.093.298.079.409-.047.111-.126.478-.557.605-.747.127-.19.255-.158.428-.094.173.064 1.096.517 1.284.611.188.094.313.14.36.219.046.079.046.46-.098.865zM12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.003L2 22l5.13-1.344A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                Open WhatsApp Chat 💬
              </a>
            )}

            <button className="btn outline" style={{ width: '100%' }} onClick={() => setOrderSuccess(null)}>
              Continue Exploring ✿
            </button>
          </div>
        </div>
      )}

      {/* 15. Product Detail Modal with Direct WhatsApp Talk */}
      {selectedProduct && (
        <div
          className="overlay info-overlay"
          style={{ display: 'flex' }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="modal product-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modalhead" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="eyebrow" style={{ fontSize: '11px', letterSpacing: '0.15em' }}>
                  DHAGA DIARIES · {selectedProduct.category.toUpperCase()}
                </span>
                <span
                  style={{
                    background: '#570606',
                    color: '#fff',
                    fontSize: '10px',
                    padding: '3px 9px',
                    borderRadius: '99px',
                    fontWeight: 600,
                  }}
                >
                  {selectedProduct.tag || 'HANDMADE'}
                </span>
              </div>
              <button
                className="close"
                onClick={() => setSelectedProduct(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="product-detail-grid">
              {/* Gallery / Image column */}
              <div>
                <div className="product-gallery-main">
                  {detailActiveImg || selectedProduct.image ? (
                    <img
                      src={detailActiveImg || selectedProduct.image}
                      alt={selectedProduct.name}
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1590736969955-71cc94901144?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '72px' }}>{selectedProduct.emoji || '🧶'}</span>
                  )}
                </div>

                {/* Thumbnails if multiple images */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="product-gallery-thumbs">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`product-gallery-thumb ${detailActiveImg === img ? 'active' : ''}`}
                        onClick={() => setDetailActiveImg(img)}
                      >
                        <img src={img} alt={`Thumbnail ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details column */}
              <div>
                <h2
                  style={{
                    fontFamily: 'Georgia, serif',
                    color: '#570606',
                    fontSize: '26px',
                    margin: '0 0 8px',
                    fontWeight: 500,
                    lineHeight: 1.25,
                  }}
                >
                  {selectedProduct.name}
                </h2>

                {selectedProduct.sku && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
                    Item Code: <code style={{ color: '#570606', fontWeight: 600 }}>{selectedProduct.sku}</code>
                  </div>
                )}

                {/* Price & Discount */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
                  <span
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#570606',
                    }}
                  >
                    {rupees(selectedProduct.salePrice && selectedProduct.salePrice > 0 ? selectedProduct.salePrice : selectedProduct.price)}
                  </span>
                  {selectedProduct.salePrice && selectedProduct.salePrice > 0 && (
                    <>
                      <span style={{ fontSize: '16px', color: '#8d7870', textDecoration: 'line-through' }}>
                        {rupees(selectedProduct.price)}
                      </span>
                      <span
                        style={{
                          background: '#e6f4ea',
                          color: '#137333',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {Math.round(((selectedProduct.price - selectedProduct.salePrice) / selectedProduct.price) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Stock status indicator */}
                <div style={{ marginBottom: '16px', fontSize: '12px' }}>
                  {selectedProduct.stock > 5 ? (
                    <span style={{ color: '#137333', fontWeight: 600 }}>
                      ● In Stock ({selectedProduct.stock} pieces crafted & ready to ship)
                    </span>
                  ) : selectedProduct.stock > 0 ? (
                    <span style={{ color: '#b06000', fontWeight: 600 }}>
                      ⚠️ Hurry! Only {selectedProduct.stock} piece{selectedProduct.stock > 1 ? 's' : ''} left in stock ✿
                    </span>
                  ) : (
                    <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                      ○ Made to order (Crafted upon WhatsApp confirmation)
                    </span>
                  )}
                </div>

                {/* Description */}
                <div
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.7,
                    color: '#5e4d46',
                    marginBottom: '16px',
                    borderTop: '1px solid #ebd9c5',
                    paddingTop: '12px',
                  }}
                >
                  {selectedProduct.desc || 'Every stitch in this piece is lovingly handcrafted using skin-friendly cotton-blend yarns, offering timeless elegance and handmade warmth.'}
                </div>

                {/* Variants selector if available */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#570606', marginBottom: '6px' }}>
                      Select Variant / Style:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedProduct.variants.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v.title)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '99px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: selectedVariant === v.title ? '2px solid #570606' : '1px solid #d8b66d',
                            background: selectedVariant === v.title ? '#570606' : '#fffdf8',
                            color: selectedVariant === v.title ? '#fff' : '#570606',
                            cursor: 'pointer',
                          }}
                        >
                          {v.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#570606' }}>Quantity:</span>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid #d8b66d',
                      borderRadius: '8px',
                      background: '#fff',
                      overflow: 'hidden',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#f8f2ea',
                        border: 0,
                        fontSize: '16px',
                        color: '#570606',
                        cursor: 'pointer',
                      }}
                    >
                      -
                    </button>
                    <span style={{ width: '38px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                      {detailQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProduct.stock > detailQty) {
                          setDetailQty(detailQty + 1);
                        } else {
                          showToast(`Only ${selectedProduct.stock} pieces in stock ✿`);
                        }
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        background: '#f8f2ea',
                        border: 0,
                        fontSize: '16px',
                        color: '#570606',
                        cursor: 'pointer',
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons: WhatsApp and Add to Basket */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn-whatsapp"
                    style={{ width: '100%' }}
                    onClick={() => openProductWhatsApp(selectedProduct, detailQty, selectedVariant)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.227-.557-1.782-.74-2.92-2.55-3.009-2.668-.087-.12-.72-1.002-.72-1.912 0-.911.477-1.358.647-1.543.17-.185.372-.232.496-.232.124 0 .248.002.355.006.113.004.263-.042.412.316.155.372.529 1.29.576 1.383.047.094.078.203.016.326-.062.123-.093.2-.185.308-.093.109-.196.243-.28.327-.094.093-.192.195-.083.382.11.186.488.804 1.047 1.302.721.642 1.328.841 1.517.934.188.093.298.079.409-.047.111-.126.478-.557.605-.747.127-.19.255-.158.428-.094.173.064 1.096.517 1.284.611.188.094.313.14.36.219.046.079.046.46-.098.865zM12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5.003L2 22l5.13-1.344A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                    </svg>
                    Talk on WhatsApp / Order Now ✿
                  </button>

                  <button
                    type="button"
                    className="btn"
                    style={{
                      width: '100%',
                      background: '#570606',
                      color: '#fff',
                      boxShadow: 'none',
                      padding: '12px 20px',
                    }}
                    onClick={() => {
                      addToCart(selectedProduct, detailQty, selectedVariant);
                      setSelectedProduct(null);
                    }}
                  >
                    + Add to Basket ♡
                  </button>
                </div>

                {/* Artisan promise box */}
                <div className="artisan-box">
                  <div className="artisan-item">
                    <span>🌸</span>
                    <span><strong>Pure Craftsmanship:</strong> 100% skin-safe milk-cotton & wool yarn.</span>
                  </div>
                  <div className="artisan-item">
                    <span>🧶</span>
                    <span><strong>Artisan Made:</strong> Lovingly crocheted loop-by-loop in India.</span>
                  </div>
                  <div className="artisan-item">
                    <span>📦</span>
                    <span><strong>Safe Delivery:</strong> Carefully packed in eco-friendly gift boxes.</span>
                  </div>
                  <div className="artisan-item">
                    <span>🧼</span>
                    <span><strong>Care Guide:</strong> Gentle cold hand wash, dry flat in shade.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 15. Info Overlay Modal */}
      {infoModal.isOpen && (
        <div className="info-overlay overlay" style={{ display: 'flex' }}>
          <div className="modal">
            <div className="modalhead">
              <h2 id="infoTitle">{infoModal.title}</h2>
              <button className="close" onClick={() => setInfoModal({ isOpen: false, title: '', text: '' })}>
                ✕
              </button>
            </div>
            <p id="infoText" style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.8' }}>
              {infoModal.text}
            </p>
            <button
              className="btn"
              onClick={() => setInfoModal({ isOpen: false, title: '', text: '' })}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 16. Toast Notification */}
      <div id="toast" className="toast" style={{ display: toastMessage ? 'block' : 'none' }}>
        {toastMessage}
      </div>
    </div>
  );
}
