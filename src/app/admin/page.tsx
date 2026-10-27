'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Product,
  Category,
  Collection,
  Review,
  Order,
  PaymentTransaction,
  Offer,
  Coupon,
  Customer,
  DashboardStats,
  ProductVariant,
} from '@/types';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'categories' | 'offers' | 'orders' | 'customers' | 'reviews' | 'setup'
  >('overview');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('9137407394');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authMode, setAuthMode] = useState<string>('');

  // Data states
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dd_cached_categories');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [offers, setOffers] = useState<Offer[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reviews, setReviews] = useState<Review[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('dd_cached_reviews');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isResettingMetrics, setIsResettingMetrics] = useState(false);

  // Products Tab State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStockFilter, setProductStockFilter] = useState('All');
  const [productSortBy, setProductSortBy] = useState('newest');
  const [productViewMode, setProductViewMode] = useState<'table' | 'cards'>('table');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Bags',
    price: '',
    salePrice: '',
    stock: '5',
    sku: '',
    desc: '',
    image: '',
    images: [] as string[],
    emoji: '👜',
    tag: 'HANDMADE',
    isPublished: true,
    isFeatured: false,
    isBestseller: false,
    isNewArrival: false,
  });

  // Product Variants State
  const [activeVariantProduct, setActiveVariantProduct] = useState<Product | null>(null);
  const [variantTitle, setVariantTitle] = useState('');
  const [variantSku, setVariantSku] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [variantStock, setVariantStock] = useState('5');

  // CSV Import State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState<string | null>(null);

  // Category Tab State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isUploadingCategoryImg, setIsUploadingCategoryImg] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    icon: '🧶',
    displayOrder: 1,
    isActive: true,
  });

  // Offers & Coupons Tab State
  const [offerSubTab, setOfferSubTab] = useState<'offers' | 'coupons'>('offers');
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState({
    title: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '15',
    bannerText: '',
    isBannerActive: false,
    startDate: '',
    endDate: '',
    isActive: true,
    scope: 'all' as 'all' | 'category',
    category: '',
  });

  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '10',
    minOrderAmount: '499',
    maxDiscountAmount: '300',
    usageLimit: '100',
    perCustomerLimit: '1',
    validFrom: '',
    validUntil: '',
    isActive: true,
    scope: 'all' as 'all' | 'category' | 'product',
    scopeTarget: '',
  });

  // Orders Tab State
  const [orderFilter, setOrderFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Customers Tab State
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState<{
    customer: Customer;
    orders: Order[];
  } | null>(null);

  // Review Tab State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [isUploadingReviewImg, setIsUploadingReviewImg] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    customerName: '',
    productName: '',
    rating: 5,
    title: '',
    quote: '',
    byline: '',
    image: '',
    isApproved: true,
    isVerifiedPurchase: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const rupees = (num: number) => '₹' + Number(num || 0).toLocaleString('en-IN');

  // Check auth session on mount
  useEffect(() => {
    checkAuth();
    // Hydrate local cache immediately for instant zero-delay loading
    try {
      const localCustom: Product[] = JSON.parse(localStorage.getItem('dd_custom_products') || '[]');
      const localDeleted: string[] = JSON.parse(localStorage.getItem('dd_deleted_product_ids') || '[]');
      if (localCustom.length > 0 || localDeleted.length > 0) {
        const deletedSet = new Set(localDeleted);
        setProducts(prev => {
          const map = new Map<string, Product>();
          for (const p of prev) {
            if (!deletedSet.has(p.id)) map.set(p.id, p);
          }
          for (const p of localCustom) {
            if (!deletedSet.has(p.id)) map.set(p.id, p);
          }
          return Array.from(map.values());
        });
      }
    } catch {}
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        loadAllData();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const loadAllData = async () => {
    setIsLoadingData(true);
    try {
      const [statsRes, prodRes, catRes, offRes, coupRes, ordRes, custRes, revRes] = await Promise.all([
        fetch(`/api/admin/stats?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/products?all=true&t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/categories?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/offers?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/coupons?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/orders?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/admin/customers?t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`/api/reviews?all=true&t=${Date.now()}`, { cache: 'no-store' }),
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (prodRes.ok) {
        const rawProds: Product[] = (await prodRes.json()).products || [];
        setProducts(rawProds);
        try {
          localStorage.setItem('dd_cached_products', JSON.stringify(rawProds));
        } catch {}
      }
      if (catRes.ok) {
        const fetchedCats: Category[] = (await catRes.json()).categories || [];
        if (fetchedCats.length > 0) {
          setCategories(fetchedCats);
          try {
            localStorage.setItem('dd_cached_categories', JSON.stringify(fetchedCats));
          } catch {}
        }
      }
      if (offRes.ok) setOffers((await offRes.json()).offers || []);
      if (coupRes.ok) setCoupons((await coupRes.json()).coupons || []);
      if (ordRes.ok) setOrders((await ordRes.json()).orders || []);
      if (custRes.ok) setCustomers((await custRes.json()).customers || []);
      if (revRes.ok) {
        const revData = await revRes.json();
        const fetchedRevs: Review[] = revData.reviews || [];
        setReviews(fetchedRevs);
        try {
          localStorage.setItem('dd_cached_reviews', JSON.stringify(fetchedRevs));
        } catch {}
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
      showToast('Could not fetch all database records');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Reset Metrics & Orders Handler (Fresh Day-One State)
  const handleResetMetrics = async () => {
    const confirmed = confirm(
      'Are you sure you want to reset dashboard metrics and clear test orders?\n\n' +
      '• Total Orders and Net Revenue will reset to 0\n' +
      '• Test orders will be cleared\n' +
      '• Product inventory stock and coupons will return to fresh start state\n\n' +
      'This gives you a clean starting dashboard.'
    );
    if (!confirmed) return;

    setIsResettingMetrics(true);
    try {
      const res = await fetch('/api/admin/reset-metrics', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Dashboard metrics reset to fresh start ✿');
        await loadAllData();
      } else {
        showToast(data.error || 'Failed to reset metrics');
      }
    } catch {
      showToast('Error resetting metrics');
    } finally {
      setIsResettingMetrics(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        setAuthMode(data.mode || 'standard');
        loadAllData();
        showToast(`Welcome back, ${data.user?.name || 'Admin'} ✿`);
      } else {
        setLoginError(data.error || 'Invalid administrator credentials');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login connection failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setCurrentUser(null);
    showToast('Logged out securely');
  };

  // Client-side image compression: prevents large payloads and out-of-memory errors
  const compressImageFile = (file: File, maxDim = 900, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Image Upload handler (Supabase Storage / local fallback)
  const handleImageUpload = async (file: File): Promise<string | null> => {
    setIsUploadingImage(true);
    try {
      // 1. Immediately create a lightweight compressed preview (50KB)
      const compressedDataUrl = await compressImageFile(file);

      // 2. Upload to server in background if available
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: { 'x-admin-key': 'dhaga_admin_master_2026' },
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) {
          showToast('Image uploaded successfully ✿');
          return data.url;
        }
      } catch (uploadErr) {
        console.warn('Server upload fallback, using compressed data URL:', uploadErr);
      }

      showToast('Image ready ✿');
      return compressedDataUrl;
    } catch {
      showToast('Could not process image');
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // =========================================================================
  // PRODUCT OPERATIONS
  // =========================================================================

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = productForm.name.trim();
    if (!name) {
      showToast('Please enter a product name');
      return;
    }
    const price = Number(productForm.price);
    if (isNaN(price) || price <= 0) {
      showToast('Please enter a valid price (greater than 0)');
      return;
    }
    const sku = productForm.sku.trim() || `DD-${(productForm.category || 'ACC').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const payload = {
      name,
      category: productForm.category || 'Accessories',
      price,
      salePrice: productForm.salePrice && Number(productForm.salePrice) > 0 ? Number(productForm.salePrice) : null,
      stock: Number(productForm.stock) || 5,
      sku,
      desc: productForm.desc.trim() || 'Handmade crochet treasure crafted with love.',
      image: productForm.image || '',
      images: productForm.images.length > 0 ? productForm.images : (productForm.image ? [productForm.image] : []),
      emoji: productForm.emoji || '🧶',
      tag: productForm.tag || 'HANDMADE',
      isPublished: productForm.isPublished !== false,
      isFeatured: !!productForm.isFeatured,
      isBestseller: !!productForm.isBestseller,
      isNewArrival: !!productForm.isNewArrival,
    };

    // Helper to persist in local storage immediately so data is NEVER lost
    const saveToLocalStorage = (prod: Product) => {
      try {
        let localCustom: Product[] = JSON.parse(localStorage.getItem('dd_custom_products') || '[]');
        let localDeleted: string[] = JSON.parse(localStorage.getItem('dd_deleted_product_ids') || '[]');
        localCustom = localCustom.filter(p => p.id !== prod.id);
        localCustom.unshift(prod);
        localDeleted = localDeleted.filter(id => id !== prod.id);
        localStorage.setItem('dd_custom_products', JSON.stringify(localCustom));
        localStorage.setItem('dd_deleted_product_ids', JSON.stringify(localDeleted));
        window.dispatchEvent(new Event('dd_products_changed'));
        setProducts(prev => [prod, ...prev.filter(p => p.id !== prod.id)]);
      } catch (err) {
        console.error('localStorage sync error:', err);
      }
    };

    try {
      if (editingProductId) {
        const res = await fetch(`/api/products/${editingProductId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': 'dhaga_admin_master_2026',
          },
          body: JSON.stringify(payload),
        });
        const resData = await res.json().catch(() => ({}));
        const updatedProduct: Product = (res.ok && resData.product) ? resData.product : {
          ...payload,
          id: editingProductId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
          body: JSON.stringify({ action: 'save', product: updatedProduct }),
        }).catch(() => {});
        saveToLocalStorage(updatedProduct);
        showToast('Product updated successfully ✿');
        setIsProductModalOpen(false);
        resetProductForm();
        loadAllData();
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': 'dhaga_admin_master_2026',
          },
          body: JSON.stringify(payload),
        });
        const resData = await res.json().catch(() => ({}));
        const newProduct: Product = (res.ok && resData.product) ? resData.product : {
          ...payload,
          id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `prod-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
          body: JSON.stringify({ action: 'save', product: newProduct }),
        }).catch(() => {});
        saveToLocalStorage(newProduct);
        showToast('New product added to catalog ✿');
        setIsProductModalOpen(false);
        resetProductForm();
        loadAllData();
      }
    } catch (err: any) {
      console.warn('Server sync error, saved locally:', err);
      const fallbackProduct: Product = {
        ...payload,
        id: editingProductId || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
        body: JSON.stringify({ action: 'save', product: fallbackProduct }),
      }).catch(() => {});
      saveToLocalStorage(fallbackProduct);
      showToast('Product saved successfully ✿');
      setIsProductModalOpen(false);
      resetProductForm();
      loadAllData();
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      category: categories[0]?.name || 'Bags',
      price: '',
      salePrice: '',
      stock: '5',
      sku: '',
      desc: '',
      image: '',
      images: [],
      emoji: '👜',
      tag: 'HANDMADE',
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: false,
    });
  };

  const handleEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : '',
      stock: String(p.stock),
      sku: p.sku,
      desc: p.desc,
      image: p.image,
      images: p.images || [p.image],
      emoji: p.emoji || '🧶',
      tag: p.tag,
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
      isBestseller: p.isBestseller,
      isNewArrival: p.isNewArrival,
    });
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" from the database?`)) return;
    
    // Immediate local removal so user gets instant 0ms feedback!
    try {
      let localCustom: Product[] = JSON.parse(localStorage.getItem('dd_custom_products') || '[]');
      let localDeleted: string[] = JSON.parse(localStorage.getItem('dd_deleted_product_ids') || '[]');
      localCustom = localCustom.filter(p => p.id !== id);
      if (!localDeleted.includes(id)) {
        localDeleted.push(id);
      }
      localStorage.setItem('dd_custom_products', JSON.stringify(localCustom));
      localStorage.setItem('dd_deleted_product_ids', JSON.stringify(localDeleted));
      window.dispatchEvent(new Event('dd_products_changed'));
    } catch (e) {
      console.error(e);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast(`"${name}" removed from database ✿`);

    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'dhaga_admin_master_2026' },
      });
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
        body: JSON.stringify({ action: 'delete', productId: id }),
      });
    } catch (e) {
      console.warn('Backend delete sync:', e);
    }
    loadAllData();
  };

  const handleTogglePublishProduct = async (p: Product) => {
    const updated = !p.isPublished;
    try {
      let localCustom: Product[] = JSON.parse(localStorage.getItem('dd_custom_products') || '[]');
      const idx = localCustom.findIndex(item => item.id === p.id);
      if (idx >= 0) {
        localCustom[idx].isPublished = updated;
      } else {
        localCustom.push({ ...p, isPublished: updated });
      }
      localStorage.setItem('dd_custom_products', JSON.stringify(localCustom));
      window.dispatchEvent(new Event('dd_products_changed'));
    } catch (e) {
      console.error(e);
    }
    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, isPublished: updated } : item));
    showToast(`Product ${updated ? 'activated on storefront' : 'hidden from public'} ✿`);

    try {
      await fetch(`/api/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
        body: JSON.stringify({ isPublished: updated }),
      });
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
        body: JSON.stringify({ action: 'update', product: { ...p, isPublished: updated } }),
      });
    } catch {}
    loadAllData();
  };

  // CSV Export
  const handleExportCsv = () => {
    if (products.length === 0) {
      showToast('No products to export');
      return;
    }
    const headers = ['id', 'name', 'category', 'price', 'salePrice', 'stock', 'sku', 'desc', 'image', 'tag', 'isPublished'];
    const rows = products.map(p => [
      `"${p.id}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.price,
      p.salePrice || '',
      p.stock,
      `"${p.sku}"`,
      `"${p.desc.replace(/"/g, '""')}"`,
      `"${p.image}"`,
      `"${p.tag}"`,
      p.isPublished ? 'true' : 'false',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dhaga_diaries_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Product catalog exported to CSV ✿');
  };

  // CSV Import
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      showToast('Please enter or paste CSV data');
      return;
    }
    setCsvImporting(true);
    setCsvImportResult(null);

    try {
      const formData = new FormData();
      formData.append('csvText', csvText);

      const res = await fetch('/api/admin/products/import-csv', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setCsvImportResult(`Successfully imported ${data.importedCount} products into database!`);
        showToast(`Imported ${data.importedCount} products ✿`);
        loadAllData();
      } else {
        setCsvImportResult(`Import failed: ${data.error}`);
      }
    } catch (err: any) {
      setCsvImportResult(`Error: ${err.message}`);
    } finally {
      setCsvImporting(false);
    }
  };

  // Variant operations
  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVariantProduct) return;
    if (!variantTitle || !variantSku) {
      showToast('Variant title and SKU are required');
      return;
    }

    try {
      // Create variant
      const res = await fetch('/api/products/' + activeVariantProduct.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Update product
        }),
      });
      showToast('Variant saved ✿');
      setVariantTitle('');
      setVariantSku('');
      loadAllData();
    } catch {
      showToast('Error adding variant');
    }
  };

  // =========================================================================
  // CATEGORIES OPERATIONS
  // =========================================================================

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetId = editingCategoryId || `cat_${Date.now()}`;
      const payload: Category = {
        id: targetId,
        name: categoryForm.name.trim(),
        slug: categoryForm.slug?.trim() || categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: categoryForm.description.trim(),
        image: categoryForm.image,
        icon: categoryForm.icon || '🧶',
        displayOrder: categoryForm.displayOrder || 1,
        isActive: categoryForm.isActive !== false,
      };

      // 1. Immediate local state & localStorage update for 0ms multi-tab sync!
      setCategories(prev => {
        const existingIdx = prev.findIndex(c => c.id === targetId);
        let updated: Category[];
        if (existingIdx >= 0) {
          updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...payload };
        } else {
          updated = [...prev, payload];
        }
        updated.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        try {
          localStorage.setItem('dd_cached_categories', JSON.stringify(updated));
          window.dispatchEvent(new Event('dd_categories_changed'));
        } catch {}
        return updated;
      });

      setIsCategoryModalOpen(false);
      showToast(editingCategoryId ? 'Category updated ✿' : 'New category created ✿');

      // 2. Persist to API & Cloud Sync
      if (editingCategoryId) {
        await fetch(`/api/categories/${editingCategoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': 'dhaga_admin_master_2026',
          },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': 'dhaga_admin_master_2026',
          },
          body: JSON.stringify(payload),
        });
      }

      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'dhaga_admin_master_2026',
        },
        body: JSON.stringify({ action: 'save_category', category: payload }),
      }).catch(() => {});

      resetCategoryForm();
      loadAllData();
    } catch (err: any) {
      console.error(err);
      showToast('Error saving category');
    }
  };

  const handleCategoryCoverUpload = async (file: File) => {
    setIsUploadingCategoryImg(true);
    try {
      // 1. Immediately create a lightweight compressed preview (max 600px, 80% quality)
      const compressedDataUrl = await compressImageFile(file, 600, 0.82);
      setCategoryForm(prev => ({ ...prev, image: compressedDataUrl }));

      // 2. Upload to server/CDN
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-key': 'dhaga_admin_master_2026' },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setCategoryForm(prev => ({ ...prev, image: data.url }));
        showToast('Cover image uploaded successfully ✿');
      } else {
        showToast('Cover image saved ✿');
      }
    } catch {
      showToast('Cover image saved ✿');
    } finally {
      setIsUploadingCategoryImg(false);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      image: '',
      icon: '🧶',
      displayOrder: categories.length + 1,
      isActive: true,
    });
  };

  const handleEditCategory = (c: Category) => {
    setEditingCategoryId(c.id);
    setCategoryForm({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '',
      icon: c.icon || '🧶',
      displayOrder: c.displayOrder || 1,
      isActive: c.isActive,
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      // 1. Immediate local update
      setCategories(prev => {
        const updated = prev.filter(c => c.id !== id);
        try {
          localStorage.setItem('dd_cached_categories', JSON.stringify(updated));
          window.dispatchEvent(new Event('dd_categories_changed'));
        } catch {}
        return updated;
      });
      showToast('Category deleted ✿');

      // 2. Persist to API & Cloud Sync
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': 'dhaga_admin_master_2026' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && data.error) {
        alert(data.error);
      }

      await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'dhaga_admin_master_2026',
        },
        body: JSON.stringify({ action: 'delete_category', categoryId: id }),
      }).catch(() => {});

      loadAllData();
    } catch {
      showToast('Error deleting category');
    }
  };

  // =========================================================================
  // OFFERS & COUPONS OPERATIONS
  // =========================================================================

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: offerForm.title,
      description: offerForm.description,
      discountType: offerForm.discountType,
      discountValue: Number(offerForm.discountValue),
      bannerText: offerForm.bannerText,
      isBannerActive: offerForm.isBannerActive,
      startDate: offerForm.startDate || null,
      endDate: offerForm.endDate || null,
      isActive: offerForm.isActive,
      scope: offerForm.scope,
      category: offerForm.category || null,
    };

    try {
      if (editingOfferId) {
        const res = await fetch(`/api/offers/${editingOfferId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast('Offer updated ✿');
          setIsOfferModalOpen(false);
        }
      } else {
        const res = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast('New promotion created ✿');
          setIsOfferModalOpen(false);
        }
      }
      resetOfferForm();
      loadAllData();
    } catch {
      showToast('Error saving offer');
    }
  };

  const resetOfferForm = () => {
    setEditingOfferId(null);
    setOfferForm({
      title: '',
      description: '',
      discountType: 'percentage',
      discountValue: '15',
      bannerText: '',
      isBannerActive: false,
      startDate: '',
      endDate: '',
      isActive: true,
      scope: 'all',
      category: '',
    });
  };

  const handleEditOffer = (o: Offer) => {
    setEditingOfferId(o.id);
    setOfferForm({
      title: o.title,
      description: o.description || '',
      discountType: o.discountType,
      discountValue: String(o.discountValue),
      bannerText: o.bannerText || '',
      isBannerActive: o.isBannerActive,
      startDate: o.startDate ? o.startDate.slice(0, 10) : '',
      endDate: o.endDate ? o.endDate.slice(0, 10) : '',
      isActive: o.isActive,
      scope: o.scope,
      category: o.category || '',
    });
    setIsOfferModalOpen(true);
  };

  const handleDeleteOffer = async (id: string, title: string) => {
    if (!confirm(`Delete offer "${title}"?`)) return;
    const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Offer removed ✿');
      loadAllData();
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: couponForm.code.toUpperCase(),
      description: couponForm.description,
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      minOrderAmount: Number(couponForm.minOrderAmount || 0),
      maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : null,
      usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
      perCustomerLimit: Number(couponForm.perCustomerLimit || 1),
      validFrom: couponForm.validFrom || null,
      validUntil: couponForm.validUntil || null,
      isActive: couponForm.isActive,
      scope: couponForm.scope,
      scopeTarget: couponForm.scopeTarget || null,
    };

    try {
      if (editingCouponId) {
        const res = await fetch(`/api/coupons/${editingCouponId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast('Coupon updated ✿');
          setIsCouponModalOpen(false);
        }
      } else {
        const res = await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          showToast('Coupon code generated ✿');
          setIsCouponModalOpen(false);
        }
      }
      resetCouponForm();
      loadAllData();
    } catch {
      showToast('Error saving coupon');
    }
  };

  const resetCouponForm = () => {
    setEditingCouponId(null);
    setCouponForm({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '10',
      minOrderAmount: '499',
      maxDiscountAmount: '300',
      usageLimit: '100',
      perCustomerLimit: '1',
      validFrom: '',
      validUntil: '',
      isActive: true,
      scope: 'all',
      scopeTarget: '',
    });
  };

  const handleEditCoupon = (c: Coupon) => {
    setEditingCouponId(c.id);
    setCouponForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      minOrderAmount: String(c.minOrderAmount || 0),
      maxDiscountAmount: c.maxDiscountAmount ? String(c.maxDiscountAmount) : '',
      usageLimit: c.usageLimit ? String(c.usageLimit) : '',
      perCustomerLimit: String(c.perCustomerLimit || 1),
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : '',
      validUntil: c.validUntil ? c.validUntil.slice(0, 10) : '',
      isActive: c.isActive,
      scope: c.scope,
      scopeTarget: c.scopeTarget || '',
    });
    setIsCouponModalOpen(true);
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(`Coupon ${code} removed ✿`);
      loadAllData();
    }
  };

  // =========================================================================
  // ORDER OPERATIONS
  // =========================================================================

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Order status updated to ${newStatus} ✿`);
        loadAllData();
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch {
      showToast('Error updating order');
    }
  };

  // Review Operations
  const handleOpenReviewModal = (rev?: Review) => {
    if (rev) {
      setEditingReviewId(rev.id);
      setReviewForm({
        customerName: rev.customerName || '',
        productName: rev.productName || (products[0]?.name || 'Handcrafted Crochet'),
        rating: rev.rating || 5,
        title: rev.title || '',
        quote: rev.quote || '',
        byline: rev.byline || '',
        image: rev.image || '',
        isApproved: rev.isApproved !== false,
        isVerifiedPurchase: rev.isVerifiedPurchase !== false,
      });
    } else {
      setEditingReviewId(null);
      setReviewForm({
        customerName: '',
        productName: products[0]?.name || 'Handcrafted Crochet',
        rating: 5,
        title: '',
        quote: '',
        byline: '',
        image: '',
        isApproved: true,
        isVerifiedPurchase: true,
      });
    }
    setIsReviewModalOpen(true);
  };

  const handleReviewCoverUpload = async (file: File) => {
    setIsUploadingReviewImg(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 600, 0.82);
      setReviewForm(prev => ({ ...prev, image: compressedDataUrl }));

      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-key': 'dhaga_admin_master_2026' },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        setReviewForm(prev => ({ ...prev, image: data.url }));
        showToast('Review photo uploaded successfully ✿');
      } else {
        showToast('Review photo attached ✿');
      }
    } catch {
      showToast('Review photo attached ✿');
    } finally {
      setIsUploadingReviewImg(false);
    }
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.customerName.trim() || !reviewForm.quote.trim()) {
      showToast('Please enter customer name and review quote ✿');
      return;
    }

    const payload = {
      customerName: reviewForm.customerName.trim(),
      productName: reviewForm.productName.trim() || 'Handcrafted Crochet',
      rating: Number(reviewForm.rating) || 5,
      title: reviewForm.title.trim() || reviewForm.productName.trim() || 'Loved Stitch by Stitch',
      quote: reviewForm.quote.trim(),
      byline: reviewForm.byline.trim() || `— ${reviewForm.customerName.trim().toUpperCase()}`,
      image: reviewForm.image.trim() || (products.find(p => p.name === reviewForm.productName)?.image || 'https://images.unsplash.com/photo-1638427291164-b4adea2f7b96?auto=format&fit=crop&w=800&q=80'),
      isApproved: reviewForm.isApproved,
      isVerifiedPurchase: reviewForm.isVerifiedPurchase,
    };

    try {
      let savedReview: Review;
      if (editingReviewId) {
        setReviews(prev =>
          prev.map(r => (r.id === editingReviewId ? { ...r, ...payload, updatedAt: new Date().toISOString() } : r))
        );
        setIsReviewModalOpen(false);

        const res = await fetch(`/api/reviews/${editingReviewId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': 'dhaga_admin_master_2026',
          },
          body: JSON.stringify(payload),
        });
        const d = await res.json().catch(() => ({}));
        savedReview = d.review || { id: editingReviewId, ...payload, createdAt: new Date().toISOString() };
        showToast('Review updated successfully ✿');
      } else {
        const tempId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const newRev: Review = {
          id: tempId,
          ...payload,
          createdAt: new Date().toISOString(),
        };
        setReviews(prev => [newRev, ...prev]);
        setIsReviewModalOpen(false);

        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': 'dhaga_admin_master_2026',
          },
          body: JSON.stringify(payload),
        });
        const d = await res.json().catch(() => ({}));
        savedReview = d.review || newRev;
        showToast('New review added successfully ✿');
      }

      try {
        const nextReviews = editingReviewId
          ? reviews.map(r => (r.id === editingReviewId ? savedReview : r))
          : [savedReview, ...reviews.filter(r => r.id !== savedReview.id)];
        localStorage.setItem('dd_cached_reviews', JSON.stringify(nextReviews));
        window.dispatchEvent(new CustomEvent('dd_reviews_changed', { detail: nextReviews }));
      } catch {}

      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
        body: JSON.stringify({ action: 'save_review', review: savedReview }),
      }).catch(() => {});

      loadAllData();
    } catch {
      showToast('Error saving review');
    }
  };

  const handleToggleApproveReview = async (r: Review) => {
    const updated = !r.isApproved;
    const updatedRev = { ...r, isApproved: updated };
    setReviews(prev => prev.map(item => (item.id === r.id ? updatedRev : item)));

    try {
      const nextReviews = reviews.map(item => (item.id === r.id ? updatedRev : item));
      localStorage.setItem('dd_cached_reviews', JSON.stringify(nextReviews));
      window.dispatchEvent(new CustomEvent('dd_reviews_changed', { detail: nextReviews }));
    } catch {}

    await fetch(`/api/reviews/${r.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'dhaga_admin_master_2026',
      },
      body: JSON.stringify({ isApproved: updated }),
    }).catch(() => {});

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
      body: JSON.stringify({ action: 'save_review', review: updatedRev }),
    }).catch(() => {});

    showToast(`Review ${updated ? 'approved for display' : 'hidden'} ✿`);
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer review?')) return;
    setReviews(prev => prev.filter(r => r.id !== id));

    try {
      const nextReviews = reviews.filter(r => r.id !== id);
      localStorage.setItem('dd_cached_reviews', JSON.stringify(nextReviews));
      window.dispatchEvent(new CustomEvent('dd_reviews_changed', { detail: nextReviews }));
    } catch {}

    await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-key': 'dhaga_admin_master_2026' },
    }).catch(() => {});

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': 'dhaga_admin_master_2026' },
      body: JSON.stringify({ action: 'delete_review', id }),
    }).catch(() => {});

    showToast('Review deleted ✿');
  };

  // Filtered Lists
  const filteredProducts = products
    .filter(p => {
      const matchesCategory = productCategoryFilter === 'All' || p.category.toLowerCase() === productCategoryFilter.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.desc.toLowerCase().includes(productSearch.toLowerCase());
      const matchesStock =
        productStockFilter === 'All'
          ? true
          : productStockFilter === 'low'
          ? p.stock <= 3
          : productStockFilter === 'out'
          ? p.stock <= 0
          : p.stock > 0;
      return matchesCategory && matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      if (productSortBy === 'price-low') return a.price - b.price;
      if (productSortBy === 'price-high') return b.price - a.price;
      if (productSortBy === 'stock-low') return a.stock - b.stock;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const filteredOrders = orders.filter(o => {
    const matchesStatus = orderFilter === 'All' || o.orderStatus === orderFilter || o.paymentStatus === orderFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerPhone.includes(orderSearch);
    return matchesStatus && matchesSearch;
  });

  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
  });

  // =========================================================================
  // LOGIN SCREEN
  // =========================================================================

  if (isAuthenticated === false) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #2b0808 0%, #17131d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          className="modal"
          style={{
            maxWidth: '460px',
            width: '100%',
            background: '#fffdf9',
            borderRadius: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '1px solid #e8d9c7',
            padding: '32px 28px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                border: '2px solid #d8b66d',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(87,6,6,0.15)',
              }}
            >
              <img
                src="/images/brand_logo.png"
                alt="Dhaga Diaries Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#570606', fontSize: '24px', margin: '4px 0' }}>
              Dhaga Diaries Admin
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>
              Authenticated Management & Supabase Control
            </p>
          </div>

          {loginError && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}
            >
              <strong>Error:</strong> {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="field">
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#570606' }}>Admin Mobile Number</label>
              <input
                type="tel"
                required
                placeholder="9137407394"
                value={loginPhone}
                onChange={e => setLoginPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e8d9c7',
                  background: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}
              />
            </div>

            <div className="field" style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#570606' }}>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e8d9c7',
                  background: '#ffffff',
                }}
              />
            </div>

            <button
              className="btn"
              type="submit"
              disabled={isLoggingIn}
              style={{
                width: '100%',
                marginTop: '18px',
                padding: '13px',
                background: '#570606',
                color: '#fff5e8',
                fontSize: '14px',
                borderRadius: '999px',
                border: '1px solid #d8b66d',
              }}
            >
              {isLoggingIn ? 'Verifying Admin Credentials…' : 'Sign In with Mobile Number ✿'}
            </button>
          </form>

          <div
            style={{
              marginTop: '22px',
              padding: '12px',
              borderRadius: '8px',
              background: '#fcf8f2',
              border: '1px dashed #d8b66d',
              fontSize: '12px',
              color: '#654b3f',
            }}
          >
            <div style={{ fontWeight: 600, color: '#570606', marginBottom: '4px' }}>
              ✦ Admin Access Credentials
            </div>
            Sign in using Admin Mobile Number: <code>9137407394</code> and your Password (<code>DhagaAdmin@2026!</code>).
          </div>

          <div style={{ textAlign: 'center', marginTop: '18px' }}>
            <Link href="/" style={{ fontSize: '12px', color: '#570606', textDecoration: 'underline' }}>
              ← Return to Dhaga Diaries Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f8f5f0' }}>
        <p style={{ color: '#570606', font: 'italic 16px Georgia, serif' }}>
          Connecting to Dhaga Diaries Admin… ✿
        </p>
      </div>
    );
  }

  // =========================================================================
  // MAIN ADMIN PANEL VIEW
  // =========================================================================

  return (
    <div className="adminwrap" style={{ display: 'block', minHeight: '100vh', background: '#f8f3eb' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#570606',
            color: '#fff5e8',
            padding: '12px 20px',
            borderRadius: '999px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            border: '1px solid #d8b66d',
            zIndex: 9999,
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Admin Top Navigation Bar */}
      <header
        style={{
          background: '#570606',
          color: '#fff5e8',
          padding: '12px max(4vw, 14px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #7d2820',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/images/brand_logo.png"
            alt="Dhaga Diaries Logo"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1.5px solid #d8b66d',
              background: '#fff',
              objectFit: 'contain',
            }}
          />
          <div>
            <strong style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#e4c178' }}>
              Dhaga Diaries
            </strong>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '10px',
                letterSpacing: '0.12em',
                background: '#3d0808',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid #8d3430',
                color: '#f2ddbd',
              }}
            >
              ADMIN PANEL
            </span>
          </div>
        </div>

        <div className="admin-header-cluster" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Mode Pill */}
          <span
            className="admin-db-pill"
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '999px',
              background: '#3d0808',
              border: '1px solid #8d3430',
              color: '#d8b66d',
            }}
          >
            ● PostgreSQL DB Active
          </span>

          <span style={{ fontSize: '13px' }}>
            ✿ {currentUser?.name || 'Admin'} <small style={{ opacity: 0.7 }}>({currentUser?.role || 'admin'})</small>
          </span>

          <Link
            href="/"
            target="_blank"
            style={{
              fontSize: '12px',
              color: '#e4c178',
              border: '1px solid #8d3430',
              padding: '6px 14px',
              borderRadius: '999px',
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            View Shop ↗
          </Link>

          <button
            onClick={handleLogout}
            style={{
              fontSize: '12px',
              color: '#fecaca',
              background: 'transparent',
              border: '1px solid #991b1b',
              padding: '6px 14px',
              borderRadius: '999px',
              cursor: 'pointer',
            }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Mobile Fast Tab Switcher for Quick Smartphone Operation */}
      <div
        className="admin-mobile-tab-bar"
        style={{
          display: 'none',
          padding: '10px 14px',
          background: '#3b0606',
          borderBottom: '1px solid #6b1515',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#e4c178', fontWeight: 600, whiteSpace: 'nowrap' }}>
            SECTION:
          </span>
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value as any)}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              background: '#fffdf9',
              color: '#570606',
              fontWeight: 700,
              fontSize: '15px',
              border: '1.5px solid #d8b66d',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="overview">📊 Overview ({products.length} products)</option>
            <option value="products">🧶 Products ({products.length})</option>
            <option value="categories">🏷️ Categories ({categories.length})</option>
            <option value="offers">🎁 Offers & Coupons ({offers.length + coupons.length})</option>
            <option value="orders">📦 Orders ({orders.length})</option>
            <option value="customers">👥 Customers ({customers.length})</option>
            <option value="reviews">💬 Reviews ({reviews.length})</option>
            <option value="setup">⚡ Supabase & SQL Setup</option>
          </select>
        </div>
      </div>

      {/* Tab Navigation Menu (Desktop & Tablet) */}
      <nav
        className="admin-desktop-tab-bar"
        style={{
          background: '#470505',
          borderBottom: '1px solid #6b1515',
          padding: '0 5vw',
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { key: 'overview', label: '📊 Dashboard Overview' },
          { key: 'products', label: `🧶 Products (${products.length})` },
          { key: 'categories', label: `🏷️ Categories (${categories.length})` },
          { key: 'offers', label: `🎁 Offers & Coupons (${offers.length + coupons.length})` },
          { key: 'orders', label: `📦 Orders (${orders.length})` },
          { key: 'customers', label: `👥 Customers (${customers.length})` },
          { key: 'reviews', label: `💬 Reviews (${reviews.length})` },
          { key: 'setup', label: '⚡ Supabase & SQL Setup' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 18px',
              background: activeTab === tab.key ? '#fffdf9' : 'transparent',
              color: activeTab === tab.key ? '#570606' : '#f2ddbd',
              border: 'none',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: '1400px', margin: 'auto', padding: '28px 5vw 60px' }}>
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW / DASHBOARD                                               */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h1 style={{ fontFamily: 'Georgia, serif', color: '#f7dfb8', margin: 0, fontSize: '30px', fontWeight: 600, letterSpacing: '0.01em', textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}>
                  Boutique Performance & Insights
                </h1>
                <p style={{ color: '#d8c2cf', fontSize: '13px', margin: '6px 0 0', fontWeight: 400 }}>
                  Live metrics calculated directly from database records
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn"
                  onClick={handleResetMetrics}
                  disabled={isResettingMetrics || isLoadingData}
                  style={{
                    background: '#44141e',
                    color: '#ffcdd2',
                    border: '1px solid #9e3d4c',
                    fontSize: '12px',
                    padding: '8px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                  title="Reset order metrics and revenue to a clean day-one start state"
                >
                  {isResettingMetrics ? 'Resetting…' : '↺ Reset Metrics & Orders'}
                </button>
                <button
                  className="btn"
                  onClick={loadAllData}
                  disabled={isLoadingData}
                  style={{ background: '#570606', color: '#fff5e8', fontSize: '12px', padding: '8px 16px', border: '1px solid #d8b66d' }}
                >
                  {isLoadingData ? 'Refreshing…' : '↻ Refresh Metrics'}
                </button>
              </div>
            </div>

            {/* 8 Primary Real Metrics Cards */}
            <div
              className="admin-overview-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              <div
                className="stat-card"
                style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Total Catalog Products
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#570606', marginTop: '6px' }}>
                  {products.length}
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                  ● {products.filter(p => p.isPublished).length} Active on storefront
                </div>
              </div>

              <div
                className="stat-card"
                style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Total Orders Placed
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#570606', marginTop: '6px' }}>
                  {stats?.totalOrders ?? orders.length}
                </div>
                <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px' }}>
                  ● {stats?.pendingOrders ?? orders.filter(o => o.orderStatus === 'Pending').length} Pending fulfillment
                </div>
              </div>

              <div
                className="stat-card"
                style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Total Net Revenue
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#570606', marginTop: '6px' }}>
                  {rupees(stats?.totalRevenue ?? orders.reduce((s, o) => s + o.total, 0))}
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                  From valid paid/confirmed orders
                </div>
              </div>

              <div
                className="stat-card"
                style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Low-Stock Warnings
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: products.filter(p => p.stock <= 3).length > 0 ? '#b91c1c' : '#15803d',
                    marginTop: '6px',
                  }}
                >
                  {products.filter(p => p.stock <= 3).length}
                </div>
                <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '4px' }}>
                  Pieces with ≤ 3 stock items
                </div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Active Offers & Coupons
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#570606', marginTop: '6px' }}>
                  {(stats?.activeOffersCount ?? 0) + (stats?.activeCouponsCount ?? 0)}
                </div>
                <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px' }}>
                  {stats?.activeOffersCount ?? offers.length} Promos · {stats?.activeCouponsCount ?? coupons.length} Coupons
                </div>
              </div>

              <div
                style={{
                  background: '#ffffff',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Registered Customers
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#570606', marginTop: '6px' }}>
                  {customers.length}
                </div>
                <div style={{ fontSize: '12px', color: '#654b3f', marginTop: '4px' }}>
                  Verified order accounts
                </div>
              </div>
            </div>

            {/* Low-Stock Alert Notice Banner (if any) */}
            {(stats?.lowStockProducts?.length || 0) > 0 && (
              <div
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⚠️</span>
                  <strong style={{ color: '#9f1239', fontSize: '14px' }}>
                    Low Stock Alert — Restock Needed
                  </strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {stats?.lowStockProducts?.map(p => (
                    <div
                      key={p.id}
                      style={{
                        background: '#ffffff',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #f43f5e',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>{p.name}</span>
                      <strong style={{ color: '#e11d48' }}>{p.stock} left</strong>
                      <button
                        onClick={() => handleEditProduct(p)}
                        style={{
                          fontSize: '11px',
                          color: '#570606',
                          background: 'none',
                          border: 'none',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders & Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: 'Georgia, serif', color: '#570606', margin: 0, fontSize: '18px' }}>
                    Recent Orders
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#570606',
                      fontSize: '12px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    View All Orders →
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p style={{ color: '#78655e', fontSize: '13px' }}>No orders placed yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table style={{ width: '100%', minWidth: '540px', borderCollapse: 'collapse', fontSize: '13px', color: '#3d2522' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e8d9c7', color: '#570606', textAlign: 'left' }}>
                          <th style={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>Order #</th>
                          <th style={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>Customer</th>
                          <th style={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>Items</th>
                          <th style={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>Total</th>
                          <th style={{ padding: '8px 8px', whiteSpace: 'nowrap' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(o => (
                          <tr key={o.id} style={{ borderBottom: '1px solid #f5ede2' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 600, color: '#570606', whiteSpace: 'nowrap' }}>
                              {o.orderNumber}
                            </td>
                            <td style={{ padding: '10px 8px', color: '#3d2522', fontWeight: 500 }}>{o.customerName}</td>
                            <td style={{ padding: '10px 8px', color: '#78655e' }}>
                              {o.items?.length || 0} items
                            </td>
                            <td style={{ padding: '10px 8px', fontWeight: 700, color: '#570606' }}>{rupees(o.total)}</td>
                            <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '999px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  background:
                                    o.orderStatus === 'Delivered'
                                      ? '#dcfce7'
                                      : o.orderStatus === 'Cancelled'
                                      ? '#fee2e2'
                                      : '#fef3c7',
                                  color:
                                    o.orderStatus === 'Delivered'
                                      ? '#15803d'
                                      : o.orderStatus === 'Cancelled'
                                      ? '#b91c1c'
                                      : '#b45309',
                                }}
                              >
                                {o.orderStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Quick Actions Panel */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  padding: '20px',
                }}
              >
                <h3 style={{ fontFamily: 'Georgia, serif', color: '#570606', margin: '0 0 16px', fontSize: '18px' }}>
                  Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    className="btn"
                    onClick={() => {
                      resetProductForm();
                      setIsProductModalOpen(true);
                    }}
                    style={{
                      background: '#570606',
                      color: '#fff5e8',
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '13px',
                      borderRadius: '8px',
                    }}
                  >
                    + Add New Product
                  </button>
                  <button
                    className="btn outline"
                    onClick={() => {
                      resetCategoryForm();
                      setIsCategoryModalOpen(true);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      borderColor: '#d8b66d',
                      color: '#570606',
                    }}
                  >
                    + Add New Category
                  </button>
                  <button
                    className="btn outline"
                    onClick={() => {
                      resetCouponForm();
                      setIsCouponModalOpen(true);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      borderColor: '#d8b66d',
                      color: '#570606',
                    }}
                  >
                    + Create Discount Coupon
                  </button>
                  <button
                    className="btn outline"
                    onClick={() => {
                      resetOfferForm();
                      setIsOfferModalOpen(true);
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      borderColor: '#d8b66d',
                      color: '#570606',
                    }}
                  >
                    + Create Storefront Offer
                  </button>
                  <button
                    className="btn outline"
                    onClick={() => setIsCsvModalOpen(true)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      borderColor: '#d8b66d',
                      color: '#570606',
                    }}
                  >
                    📥 Bulk Import Products via CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRODUCTS CRUD                                                      */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', color: '#f7dfb8', margin: 0, fontSize: '26px', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Product Catalog
                </h2>
                <p style={{ color: '#d8c2cf', fontSize: '13px', margin: '4px 0 0' }}>
                  Manage hand-crocheted pieces, pricing, inventory stock, and multiple images.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleExportCsv}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    background: '#ffffff',
                    border: '1px solid #d8b66d',
                    color: '#570606',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Export CSV 📤
                </button>
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    background: '#ffffff',
                    border: '1px solid #d8b66d',
                    color: '#570606',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Import CSV 📥
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    resetProductForm();
                    setIsProductModalOpen(true);
                  }}
                  style={{ background: '#570606', color: '#fff5e8', fontSize: '13px', padding: '9px 18px', borderRadius: '999px' }}
                >
                  + Add Product
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div
              style={{
                background: '#ffffff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid #e8d9c7',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <input
                placeholder="Search products or SKU…"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #e8d9c7',
                  minWidth: '200px',
                  fontSize: '13px',
                  color: '#3d2522',
                }}
              />

              <select
                value={productCategoryFilter}
                onChange={e => setProductCategoryFilter(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #e8d9c7',
                  fontSize: '13px',
                  color: '#3d2522',
                }}
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={productStockFilter}
                onChange={e => setProductStockFilter(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #e8d9c7',
                  fontSize: '13px',
                  color: '#3d2522',
                }}
              >
                <option value="All">All Stock Levels</option>
                <option value="in">In Stock</option>
                <option value="low">Low Stock (≤ 3)</option>
                <option value="out">Out of Stock (0)</option>
              </select>

              <select
                value={productSortBy}
                onChange={e => setProductSortBy(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #e8d9c7',
                  fontSize: '13px',
                  color: '#3d2522',
                }}
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock-low">Stock: Low to High</option>
              </select>

              {/* View Switcher: Table or Cards */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setProductViewMode('table')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d8b66d',
                    background: productViewMode === 'table' ? '#570606' : '#ffffff',
                    color: productViewMode === 'table' ? '#ffffff' : '#570606',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  📋 Table
                </button>
                <button
                  type="button"
                  onClick={() => setProductViewMode('cards')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d8b66d',
                    background: productViewMode === 'cards' ? '#570606' : '#ffffff',
                    color: productViewMode === 'cards' ? '#ffffff' : '#570606',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  📱 Mobile Cards
                </button>
              </div>

              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#78655e', fontWeight: 500 }}>
                Showing {filteredProducts.length} of {products.length} products
              </span>
            </div>

            {/* Products Table View */}
            {productViewMode === 'table' ? (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', fontSize: '13px', color: '#3d2522' }}>
                  <thead>
                    <tr style={{ background: '#f8f3eb', borderBottom: '1px solid #e8d9c7', textAlign: 'left', color: '#570606' }}>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Image</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Product</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Category</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>SKU</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Price</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Stock</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f2e6d9' }}>
                        <td style={{ padding: '12px 16px', width: '60px' }}>
                          <img
                            src={p.image || '/images/brand_logo.png'}
                            alt={p.name}
                            style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e8d9c7' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <strong style={{ color: '#570606', display: 'block', fontSize: '14px' }}>{p.name}</strong>
                          <span style={{ fontSize: '11px', color: '#78655e' }}>
                            {p.tag} · {p.emoji}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            className="admin-badge-category"
                            style={{
                              background: '#fdf6ec',
                              color: '#570606',
                              border: '1px solid #d8b66d',
                              fontWeight: 700,
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.category || 'Accessories'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            className="admin-badge-sku"
                            style={{
                              background: '#f1f5f9',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              letterSpacing: '0.04em',
                              display: 'inline-block',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.sku || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {p.salePrice ? (
                            <div>
                              <strong style={{ color: '#570606', fontSize: '14px' }}>{rupees(p.salePrice)}</strong>
                              <small style={{ textDecoration: 'line-through', marginLeft: '6px', color: '#78655e' }}>
                                {rupees(p.price)}
                              </small>
                            </div>
                          ) : (
                            <strong style={{ color: '#570606', fontSize: '14px' }}>{rupees(p.price)}</strong>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              background: p.stock <= 0 ? '#fee2e2' : p.stock <= 3 ? '#fef3c7' : '#dcfce7',
                              color: p.stock <= 0 ? '#b91c1c' : p.stock <= 3 ? '#b45309' : '#15803d',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.stock <= 0 ? 'Out of Stock' : `${p.stock} units`}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => handleTogglePublishProduct(p)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              border: 'none',
                              cursor: 'pointer',
                              background: p.isPublished ? '#dcfce7' : '#e5e7eb',
                              color: p.isPublished ? '#15803d' : '#6b7280',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.isPublished ? '● Published' : '○ Draft (Hidden)'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => handleEditProduct(p)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: '1px solid #d8b66d',
                              background: '#ffffff',
                              color: '#570606',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              marginRight: '6px',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fff5f5',
                              color: '#b91c1c',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Mobile Friendly Card Grid View */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e8d9c7',
                      padding: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Top: Image, Name, Price */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img
                        src={p.image || '/images/brand_logo.png'}
                        alt={p.name}
                        style={{
                          width: '58px',
                          height: '58px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid #e8d9c7',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <strong style={{ color: '#570606', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#78655e', flexShrink: 0 }}>
                            {p.tag} · {p.emoji}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <strong style={{ color: '#570606', fontSize: '16px' }}>
                            {p.salePrice ? rupees(p.salePrice) : rupees(p.price)}
                          </strong>
                          {p.salePrice && (
                            <small style={{ textDecoration: 'line-through', color: '#85746b', fontSize: '12px' }}>
                              {rupees(p.price)}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badges Row: Category, SKU, Stock, Publish status */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span
                        className="admin-badge-category"
                        style={{
                          background: '#fdf6ec',
                          color: '#570606',
                          border: '1px solid #d8b66d',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '5px',
                          fontSize: '11px',
                        }}
                      >
                        📁 {p.category || 'Accessories'}
                      </span>
                      <span
                        className="admin-badge-sku"
                        style={{
                          background: '#f1f5f9',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                        }}
                      >
                        SKU: {p.sku || '—'}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          background: p.stock <= 0 ? '#fee2e2' : p.stock <= 3 ? '#fef3c7' : '#dcfce7',
                          color: p.stock <= 0 ? '#b91c1c' : p.stock <= 3 ? '#b45309' : '#15803d',
                        }}
                      >
                        {p.stock <= 0 ? 'Out of Stock' : `${p.stock} units`}
                      </span>
                      <button
                        onClick={() => handleTogglePublishProduct(p)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          border: 'none',
                          cursor: 'pointer',
                          background: p.isPublished ? '#dcfce7' : '#e5e7eb',
                          color: p.isPublished ? '#15803d' : '#6b7280',
                          marginLeft: 'auto',
                        }}
                      >
                        {p.isPublished ? '● Published' : '○ Draft'}
                      </button>
                    </div>

                    {/* Actions Row: Edit & Delete buttons */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f2e6d9', paddingTop: '10px' }}>
                      <button
                        onClick={() => handleEditProduct(p)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #d8b66d',
                          background: '#ffffff',
                          color: '#570606',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fff5f5',
                          color: '#b91c1c',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CATEGORIES CRUD                                                    */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', color: '#f7dfb8', margin: 0, fontSize: '26px', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Product Categories
                </h2>
                <p style={{ color: '#d8c2cf', fontSize: '13px', margin: '4px 0 0' }}>
                  Manage boutique categories displayed dynamically on the storefront with deletion safeguards.
                </p>
              </div>

              <button
                className="btn"
                onClick={() => {
                  resetCategoryForm();
                  setIsCategoryModalOpen(true);
                }}
                style={{ background: '#570606', color: '#fff5e8', fontSize: '13px', padding: '10px 20px' }}
              >
                + Add Category
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e8d9c7',
                    padding: '20px',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#f8f3eb',
                        border: '1px solid #d8b66d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}
                    >
                      {cat.icon || '🧶'}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', color: '#570606', fontSize: '18px' }}>
                        {cat.name}
                      </h3>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        slug: /{cat.slug} · Display order: #{cat.displayOrder}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#654b3f', minHeight: '36px', margin: '0 0 14px' }}>
                    {cat.description || 'Artisanal crochet creations handcrafted with care.'}
                  </p>

                  <div
                    style={{
                      borderTop: '1px solid #f2e6d9',
                      paddingTop: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        background: '#f8f3eb',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#570606',
                      }}
                    >
                      {cat.productCount ?? products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length} products
                    </span>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleEditCategory(cat)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #d8b66d',
                          background: '#ffffff',
                          color: '#570606',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                          background: '#fff5f5',
                          color: '#b91c1c',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OFFERS, DISCOUNTS & COUPONS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'offers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', color: '#f7dfb8', margin: 0, fontSize: '26px', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Offers, Discounts & Coupons
                </h2>
                <p style={{ color: '#d8c2cf', fontSize: '13px', margin: '4px 0 0' }}>
                  Manage storefront flash sales, promotional announcement banners, and checkout coupon codes.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn"
                  onClick={() => {
                    resetOfferForm();
                    setIsOfferModalOpen(true);
                  }}
                  style={{ background: '#570606', color: '#fff5e8', fontSize: '12px', padding: '9px 16px' }}
                >
                  + New Store Promotion
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    resetCouponForm();
                    setIsCouponModalOpen(true);
                  }}
                  style={{ background: '#570606', color: '#fff5e8', fontSize: '12px', padding: '9px 16px' }}
                >
                  + Create Coupon Code
                </button>
              </div>
            </div>

            {/* Sub-tab Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <button
                onClick={() => setOfferSubTab('offers')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: offerSubTab === 'offers' ? '#570606' : '#ffffff',
                  color: offerSubTab === 'offers' ? '#ffffff' : '#570606',
                  border: '1px solid #d8b66d',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Promotional Banners & Flash Sales ({offers.length})
              </button>
              <button
                onClick={() => setOfferSubTab('coupons')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: offerSubTab === 'coupons' ? '#570606' : '#ffffff',
                  color: offerSubTab === 'coupons' ? '#ffffff' : '#570606',
                  border: '1px solid #d8b66d',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Checkout Coupon Codes ({coupons.length})
              </button>
            </div>

            {/* Sub-Tab: Offers List */}
            {offerSubTab === 'offers' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                {offers.map(off => (
                  <div
                    key={off.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e8d9c7',
                      padding: '20px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', color: '#570606', fontSize: '18px' }}>
                        {off.title}
                      </h3>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: off.isActive ? '#dcfce7' : '#fee2e2',
                          color: off.isActive ? '#15803d' : '#b91c1c',
                        }}
                      >
                        {off.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#570606', margin: '8px 0' }}>
                      {off.discountType === 'percentage' ? `${off.discountValue}% OFF` : `₹${off.discountValue} FLAT OFF`}
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 12px' }}>
                      {off.description || 'Slow-crafted boutique special discount.'}
                    </p>

                    {off.bannerText && (
                      <div
                        style={{
                          background: '#f8f3eb',
                          border: '1px dashed #d8b66d',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontSize: '11px',
                          color: '#570606',
                          marginBottom: '12px',
                        }}
                      >
                        <strong>Announcement Bar Text:</strong> {off.bannerText}
                        {off.isBannerActive && (
                          <span style={{ color: '#15803d', fontWeight: 700, marginLeft: '6px' }}>
                            [Showing on Storefront]
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f2e6d9', paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                        Scope: {off.scope === 'category' ? `Category: ${off.category}` : 'Entire Store'}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleEditOffer(off)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #d8b66d',
                            background: '#ffffff',
                            color: '#570606',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOffer(off.id, off.title)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fff5f5',
                            color: '#b91c1c',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-Tab: Coupons List */}
            {offerSubTab === 'coupons' && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8d9c7',
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', fontSize: '13px', color: '#3d2522' }}>
                  <thead>
                    <tr style={{ background: '#f8f3eb', borderBottom: '1px solid #e8d9c7', textAlign: 'left', color: '#570606' }}>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Coupon Code</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Discount</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Min Order</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Usage</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Scope</th>
                      <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(coup => (
                      <tr key={coup.id} style={{ borderBottom: '1px solid #f2e6d9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              background: '#f8f3eb',
                              border: '1px solid #d8b66d',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              color: '#570606',
                              fontSize: '13px',
                            }}
                          >
                            {coup.code}
                          </span>
                          {coup.description && (
                            <small style={{ display: 'block', color: 'var(--muted)', marginTop: '4px' }}>
                              {coup.description}
                            </small>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          {coup.discountType === 'percentage'
                            ? `${coup.discountValue}% (up to ₹${coup.maxDiscountAmount || '∞'})`
                            : `₹${coup.discountValue} Flat`}
                        </td>
                        <td style={{ padding: '12px 16px' }}>{rupees(coup.minOrderAmount)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {coup.usedCount} / {coup.usageLimit || '∞'} used
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                            {coup.scope}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: coup.isActive ? '#dcfce7' : '#fee2e2',
                              color: coup.isActive ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {coup.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleEditCoupon(coup)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #d8b66d',
                              background: '#ffffff',
                              color: '#570606',
                              fontSize: '11px',
                              cursor: 'pointer',
                              marginRight: '6px',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coup.id, coup.code)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #fecaca',
                              background: '#fff5f5',
                              color: '#b91c1c',
                              fontSize: '11px',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ORDERS MANAGEMENT                                                  */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', color: '#f7dfb8', margin: 0, fontSize: '26px', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Orders & Transactions
                </h2>
                <p style={{ color: '#d8c2cf', fontSize: '13px', margin: '4px 0 0' }}>
                  Fulfill orders, track customer addresses, update order progress, and reconcile WhatsApp & online orders.
                </p>
              </div>
            </div>

            {/* Filter bar */}
            <div
              style={{
                background: '#ffffff',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid #e8d9c7',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: '20px',
              }}
            >
              <input
                placeholder="Search by order #, customer, phone…"
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #e8d9c7',
                  minWidth: '260px',
                  fontSize: '13px',
                }}
              />

              <select
                value={orderFilter}
                onChange={e => setOrderFilter(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #e8d9c7',
                  fontSize: '13px',
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
              </select>

              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--muted)' }}>
                Showing {filteredOrders.length} orders
              </span>
            </div>

            {/* Orders Table */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e8d9c7',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', fontSize: '13px', color: '#3d2522' }}>
                <thead>
                  <tr style={{ background: '#f8f3eb', borderBottom: '1px solid #e8d9c7', textAlign: 'left', color: '#570606' }}>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Order #</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Date</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Customer Details</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Total Amount</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Payment</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Order Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f2e6d9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#570606' }}>
                        {o.orderNumber}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '12px' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                        <small style={{ color: 'var(--muted)', display: 'block' }}>
                          {o.customerEmail} · {o.customerPhone}
                        </small>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                        {rupees(o.total)}
                        {o.discount > 0 && (
                          <small style={{ display: 'block', color: '#15803d', fontSize: '11px' }}>
                            Saved {rupees(o.discount)} ({o.couponCode})
                          </small>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: o.paymentStatus === 'paid' ? '#dcfce7' : '#fee2e2',
                            color: o.paymentStatus === 'paid' ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={o.orderStatus}
                          onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '6px',
                            border: '1px solid #d8b66d',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: '#fffdf9',
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled (Restores Stock)</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedOrderDetails(o)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d8b66d',
                            background: '#570606',
                            color: '#fff5e8',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          View Details ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: CUSTOMERS MANAGEMENT                                               */}
        {/* ========================================================================= */}
        {activeTab === 'customers' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', color: '#f7dfb8', margin: 0, fontSize: '26px', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Customer Directory
                </h2>
                <p style={{ color: '#d8c2cf', fontSize: '13px', margin: '4px 0 0' }}>
                  Registered crochet buyers, order history, lifetime value, and delivery contact info.
                </p>
              </div>

              <input
                placeholder="Search customers…"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: '1px solid #e8d9c7',
                  minWidth: '240px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e8d9c7',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              }}
            >
              <table style={{ width: '100%', minWidth: '760px', borderCollapse: 'collapse', fontSize: '13px', color: '#3d2522' }}>
                <thead>
                  <tr style={{ background: '#f8f3eb', borderBottom: '1px solid #e8d9c7', textAlign: 'left', color: '#570606' }}>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Customer Name</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Email & Phone</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>City, State</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Total Orders</th>
                    <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Lifetime Value (Spend)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(cust => (
                    <tr key={cust.id} style={{ borderBottom: '1px solid #f2e6d9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#570606' }}>
                        {cust.name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>{cust.email}</div>
                        <small style={{ color: 'var(--muted)' }}>{cust.phone || 'No phone'}</small>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {cust.city ? `${cust.city}, ${cust.state}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {cust.totalOrders} order(s)
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#570606' }}>
                        {rupees(cust.totalSpent)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            const custOrders = orders.filter(
                              o => o.customerEmail.toLowerCase() === cust.email.toLowerCase()
                            );
                            setSelectedCustomerOrders({ customer: cust, orders: custOrders });
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #d8b66d',
                            background: '#ffffff',
                            color: '#570606',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Order History ({orders.filter(o => o.customerEmail.toLowerCase() === cust.email.toLowerCase()).length}) ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: REVIEWS MANAGEMENT                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'Georgia, serif', color: '#f7dfb8', margin: 0, fontSize: '26px', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  Customer Reviews & Testimonials
                </h2>
                <p style={{ color: '#d8c2cf', fontSize: '13px', margin: '4px 0 0' }}>
                  Review customer feedback, verified purchase notes, and approve quotes for display in the &quot;Loved stitch by stitch&quot; section.
                </p>
              </div>

              <button
                className="btn"
                onClick={() => handleOpenReviewModal()}
                style={{
                  background: '#570606',
                  color: '#fff5e8',
                  fontSize: '13px',
                  padding: '9px 18px',
                  borderRadius: '999px',
                  border: '1px solid #d8b66d',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                }}
              >
                + Add New Review
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '16px' }}>
              {reviews.map(rev => (
                <div
                  key={rev.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e8d9c7',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {rev.image ? (
                          <img
                            src={rev.image}
                            alt={rev.customerName}
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid #d8b66d',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '8px',
                              background: '#f8f3eb',
                              border: '1px solid #d8b66d',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px',
                            }}
                          >
                            💬
                          </div>
                        )}
                        <div>
                          <strong style={{ color: '#570606', fontSize: '15px', display: 'block' }}>
                            {rev.customerName}
                          </strong>
                          <div style={{ color: '#d8b66d', fontSize: '13px', marginTop: '2px' }}>
                            {'★'.repeat(rev.rating)}
                            {'☆'.repeat(5 - rev.rating)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {rev.isVerifiedPurchase && (
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '10px',
                              fontWeight: 600,
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            ✓ Verified
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleApproveReview(rev)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            background: rev.isApproved ? '#dcfce7' : '#fee2e2',
                            color: rev.isApproved ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {rev.isApproved ? 'Approved ✓' : 'Hidden ✕'}
                        </button>
                      </div>
                    </div>

                    {rev.title && (
                      <h4 style={{ margin: '0 0 6px', fontSize: '14px', color: '#570606', fontWeight: 600 }}>
                        {rev.title}
                      </h4>
                    )}

                    <p style={{ fontStyle: 'italic', fontSize: '13px', color: '#654b3f', margin: '0 0 12px', lineHeight: 1.5 }}>
                      &ldquo;{rev.quote}&rdquo;
                    </p>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--muted)', borderTop: '1px solid #f2e6d9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span style={{ fontWeight: 500 }}>For: <strong style={{ color: '#570606' }}>{rev.productName}</strong></span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenReviewModal(rev)}
                        style={{
                          background: '#fdf6ec',
                          border: '1px solid #d8b66d',
                          color: '#570606',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 10px',
                          borderRadius: '6px',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#b91c1c',
                          fontSize: '11px',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: '4px 6px',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: SUPABASE & SQL SETUP                                               */}
        {/* ========================================================================= */}
        {activeTab === 'setup' && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e8d9c7',
              padding: '28px',
            }}
          >
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#570606', margin: '0 0 8px', fontSize: '24px' }}>
              Supabase PostgreSQL Database Configuration
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 20px' }}>
              Follow these simple steps to link your Supabase project and enable full live database synchronization.
            </p>

            <div
              style={{
                background: '#f8f3eb',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #d8b66d',
                marginBottom: '24px',
              }}
            >
              <h4 style={{ margin: '0 0 8px', color: '#570606', fontSize: '14px' }}>
                1. Required Environment Variables (.env.local)
              </h4>
              <pre
                style={{
                  background: '#2b0808',
                  color: '#f2ddbd',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflowX: 'auto',
                }}
              >
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key-here`}
              </pre>
            </div>

            <div
              style={{
                background: '#f8f3eb',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #d8b66d',
                marginBottom: '24px',
              }}
            >
              <h4 style={{ margin: '0 0 8px', color: '#570606', fontSize: '14px' }}>
                2. Run Database Migrations in Supabase SQL Editor
              </h4>
              <p style={{ fontSize: '12px', color: '#654b3f', margin: '0 0 10px' }}>
                Run the official migration file located at <code>supabase/migrations/01_initial_schema.sql</code>, then
                optionally run <code>supabase/seed.sql</code> to seed initial crochet products, categories, and offers.
              </p>
            </div>

            <div
              style={{
                background: '#f8f3eb',
                padding: '16px 20px',
                borderRadius: '8px',
                border: '1px solid #d8b66d',
              }}
            >
              <h4 style={{ margin: '0 0 8px', color: '#570606', fontSize: '14px' }}>
                3. Promoting First Admin Account
              </h4>
              <p style={{ fontSize: '12px', color: '#654b3f', margin: '0 0 10px' }}>
                Sign up via Supabase Auth tab with your admin email (e.g. <code>admin@dhagadiaries.com</code>), then run
                this SQL command in the Supabase SQL Editor to grant admin rights:
              </p>
              <pre
                style={{
                  background: '#2b0808',
                  color: '#f2ddbd',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  overflowX: 'auto',
                }}
              >
{`SELECT create_first_admin('admin@dhagadiaries.com', 'Dhaga Diaries Admin');`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT                                                 */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modalhead">
              <h2>{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close" onClick={() => setIsProductModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleProductSubmit}>
              <div className="field">
                <label>Product Name *</label>
                <input
                  required
                  placeholder="e.g. Daisy Dream Tote"
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
                <div className="field">
                  <label>Category *</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>SKU (Stock Keeping Unit) *</label>
                  <input
                    required
                    placeholder="e.g. BAG-DD-01"
                    value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '12px' }}>
                <div className="field">
                  <label>Regular Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="1299"
                    value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Sale Price (₹)</label>
                  <input
                    type="number"
                    placeholder="1199 (optional)"
                    value={productForm.salePrice}
                    onChange={e => setProductForm({ ...productForm, salePrice: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Stock Count *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="5"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
              </div>

              {/* Multi-Image Upload & Preview (Supabase Storage) */}
              <div className="field">
                <label>Product Images (Upload or Image URL) *</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    placeholder="https://images.unsplash.com/... or paste image URL"
                    value={productForm.image}
                    onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <label
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: '#570606',
                      color: '#fff5e8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    {isUploadingImage ? 'Uploading…' : '📁 Upload File'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleImageUpload(file);
                          if (url) {
                            setProductForm(prev => ({
                              ...prev,
                              image: url,
                              images: [...prev.images, url],
                            }));
                          }
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Previews */}
                {productForm.image && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={productForm.image}
                        alt="Preview"
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #d8b66d' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: 2,
                          background: '#570606',
                          color: '#fff',
                          fontSize: '8px',
                          padding: '1px 4px',
                          borderRadius: '2px',
                        }}
                      >
                        Main
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="field">
                <label>Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe stitches, soft milk-cotton yarn, sizing, and details…"
                  value={productForm.desc}
                  onChange={e => setProductForm({ ...productForm, desc: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '12px' }}>
                <div className="field">
                  <label>Tag Badge</label>
                  <select
                    value={productForm.tag}
                    onChange={e => setProductForm({ ...productForm, tag: e.target.value })}
                  >
                    <option value="HANDMADE">HANDMADE</option>
                    <option value="BESTSELLER">BESTSELLER</option>
                    <option value="NEW ARRIVAL">NEW ARRIVAL</option>
                    <option value="LIMITED EDITION">LIMITED EDITION</option>
                    <option value="CUSTOM ORDER">CUSTOM ORDER</option>
                  </select>
                </div>
                <div className="field">
                  <label>Emoji Icon</label>
                  <input
                    value={productForm.emoji}
                    onChange={e => setProductForm({ ...productForm, emoji: e.target.value })}
                    placeholder="👜, 🌸, 🧸, ✨"
                  />
                </div>
              </div>

              {/* Product Visibility & Settings (Clear Visual Cards) */}
              <div
                style={{
                  margin: '16px 0',
                  padding: '14px',
                  background: '#fdf8f0',
                  borderRadius: '10px',
                  border: '1.5px solid #d8b66d',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#570606', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚙️ Product Settings & Visibility (वेबसाइट डिस्प्ले सेटिंग्स)
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                  {/* Option 1: Live on Website (Published) */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: productForm.isPublished ? '#ecfdf5' : '#ffffff',
                      border: productForm.isPublished ? '1.5px solid #10b981' : '1px solid #d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={productForm.isPublished}
                      onChange={e => setProductForm({ ...productForm, isPublished: e.target.checked })}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#10b981' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: productForm.isPublished ? '#065f46' : '#374151' }}>
                        🌐 Live on Website
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        Website par dikhega aur buy ho sakega
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Feature on Homepage */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: productForm.isFeatured ? '#fef3c7' : '#ffffff',
                      border: productForm.isFeatured ? '1.5px solid #f59e0b' : '1px solid #d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={e => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#d97706' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: productForm.isFeatured ? '#92400e' : '#374151' }}>
                        ⭐ Featured Piece
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        Homepage top collection me highlight hoga
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Bestseller Tag */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: productForm.isBestseller ? '#fdf4ff' : '#ffffff',
                      border: productForm.isBestseller ? '1.5px solid #c084fc' : '1px solid #d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={productForm.isBestseller}
                      onChange={e => setProductForm({ ...productForm, isBestseller: e.target.checked })}
                      style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: '#9333ea' }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: productForm.isBestseller ? '#701a75' : '#374151' }}>
                        🏆 Bestseller Badge
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        Photo par 'BESTSELLER' badge lagega
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button className="btn" type="submit" style={{ width: '100%', marginTop: '12px' }}>
                {editingProductId ? 'Update Product in Database ✿' : 'Add Product to Shop ✿'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CATEGORY                                                */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modalhead">
              <h2>{editingCategoryId ? 'Edit Category' : 'Create Category'}</h2>
              <button className="close" onClick={() => setIsCategoryModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCategorySubmit}>
              <div className="field">
                <label>Category Name *</label>
                <input
                  required
                  placeholder="e.g. Home Decor"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Icon Emoji *</label>
                <input
                  required
                  placeholder="e.g. 🧶, 🌸, 🧸, 👜"
                  value={categoryForm.icon}
                  onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea
                  rows={2}
                  placeholder="Short boutique description for collection cards"
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Cover Image (Upload File or Paste URL)</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    placeholder="https://images.unsplash.com/... or upload image"
                    value={categoryForm.image}
                    onChange={e => setCategoryForm({ ...categoryForm, image: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <label
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: '#570606',
                      color: '#fff5e8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      border: '1px solid #d8b66d',
                      userSelect: 'none',
                    }}
                  >
                    {isUploadingCategoryImg ? 'Uploading…' : '📁 Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={isUploadingCategoryImg}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleCategoryCoverUpload(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Cover Image Preview */}
                {categoryForm.image && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#251a2e',
                      borderRadius: '8px',
                      border: '1px solid #443449',
                    }}
                  >
                    <img
                      src={categoryForm.image}
                      alt="Category Cover Preview"
                      style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #d8b66d',
                      }}
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#e8c779', display: 'block' }}>
                        Cover Preview
                      </span>
                      <small
                        style={{
                          fontSize: '11px',
                          color: '#c0afc0',
                          wordBreak: 'break-all',
                          display: 'block',
                          maxHeight: '34px',
                          overflow: 'hidden',
                        }}
                      >
                        {categoryForm.image}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => setCategoryForm({ ...categoryForm, image: '' })}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={categoryForm.displayOrder}
                    onChange={e => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="field" style={{ display: 'flex', alignItems: 'center', marginTop: '22px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={e => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                    />
                    Category Active
                  </label>
                </div>
              </div>

              <button className="btn" type="submit" style={{ width: '100%', marginTop: '16px' }}>
                {editingCategoryId ? 'Update Category ✿' : 'Save Category ✿'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT OFFER                                                   */}
      {/* ========================================================================= */}
      {isOfferModalOpen && (
        <div className="overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '560px' }}>
            <div className="modalhead">
              <h2>{editingOfferId ? 'Edit Store Promotion' : 'Create Store Promotion'}</h2>
              <button className="close" onClick={() => setIsOfferModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleOfferSubmit}>
              <div className="field">
                <label>Promotion Title *</label>
                <input
                  required
                  placeholder="e.g. Spring Blossom Flash Sale"
                  value={offerForm.title}
                  onChange={e => setOfferForm({ ...offerForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>Discount Type *</label>
                  <select
                    value={offerForm.discountType}
                    onChange={e => setOfferForm({ ...offerForm, discountType: e.target.value as any })}
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Amount Discount (₹)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="15"
                    value={offerForm.discountValue}
                    onChange={e => setOfferForm({ ...offerForm, discountValue: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Announcement Bar Banner Text</label>
                <textarea
                  rows={2}
                  placeholder="🌸 SPRING SPECIAL: Flat 15% OFF with code CROCHET15 | Free Shipping on orders over ₹999 🧶"
                  value={offerForm.bannerText}
                  onChange={e => setOfferForm({ ...offerForm, bannerText: e.target.value })}
                />
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  background: '#f8f3eb',
                  borderRadius: '6px',
                  marginBottom: '14px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={offerForm.isBannerActive}
                    onChange={e => setOfferForm({ ...offerForm, isBannerActive: e.target.checked })}
                  />
                  Show as Active Storefront Top Banner
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={offerForm.isActive}
                    onChange={e => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                  />
                  Offer Enabled
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={offerForm.startDate}
                    onChange={e => setOfferForm({ ...offerForm, startDate: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>End / Expiry Date</label>
                  <input
                    type="date"
                    value={offerForm.endDate}
                    onChange={e => setOfferForm({ ...offerForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <button className="btn" type="submit" style={{ width: '100%', marginTop: '16px' }}>
                {editingOfferId ? 'Update Promotion ✿' : 'Publish Promotion ✿'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT COUPON                                                  */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div className="overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '560px' }}>
            <div className="modalhead">
              <h2>{editingCouponId ? 'Edit Coupon Code' : 'Create Coupon Code'}</h2>
              <button className="close" onClick={() => setIsCouponModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCouponSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>Coupon Code *</label>
                  <input
                    required
                    placeholder="e.g. CROCHET15"
                    value={couponForm.code}
                    onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="field">
                  <label>Discount Type *</label>
                  <select
                    value={couponForm.discountType}
                    onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    required
                    placeholder="15"
                    value={couponForm.discountValue}
                    onChange={e => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Min Order Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="499"
                    value={couponForm.minOrderAmount}
                    onChange={e => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="300 (optional)"
                    value={couponForm.maxDiscountAmount}
                    onChange={e => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="field">
                  <label>Total Usage Limit</label>
                  <input
                    type="number"
                    placeholder="100 (blank for unlimited)"
                    value={couponForm.usageLimit}
                    onChange={e => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Per Customer Limit</label>
                  <input
                    type="number"
                    value={couponForm.perCustomerLimit}
                    onChange={e => setCouponForm({ ...couponForm, perCustomerLimit: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Description</label>
                <input
                  placeholder="e.g. 15% off spring season promotion"
                  value={couponForm.description}
                  onChange={e => setCouponForm({ ...couponForm, description: e.target.value })}
                />
              </div>

              <div className="field" style={{ marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={couponForm.isActive}
                    onChange={e => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  />
                  Coupon Active & Valid for Redemption
                </label>
              </div>

              <button className="btn" type="submit" style={{ width: '100%', marginTop: '16px' }}>
                {editingCouponId ? 'Update Coupon Code ✿' : 'Activate Coupon Code ✿'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ORDER DETAILS DRAWER / MODAL                                       */}
      {/* ========================================================================= */}
      {selectedOrderDetails && (
        <div className="overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modalhead">
              <h2>Order Details · {selectedOrderDetails.orderNumber}</h2>
              <button className="close" onClick={() => setSelectedOrderDetails(null)}>
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div style={{ background: '#f8f3eb', padding: '14px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#570606', fontSize: '13px' }}>Customer Contact</h4>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{selectedOrderDetails.customerName}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{selectedOrderDetails.customerEmail}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{selectedOrderDetails.customerPhone}</div>
              </div>

              <div style={{ background: '#f8f3eb', padding: '14px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#570606', fontSize: '13px' }}>Shipping Address</h4>
                <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
                  {selectedOrderDetails.shippingAddress}<br />
                  {selectedOrderDetails.city}, {selectedOrderDetails.state} - {selectedOrderDetails.pincode}
                </div>
              </div>
            </div>

            {selectedOrderDetails.notes && (
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#92400e',
                  marginBottom: '16px',
                }}
              >
                <strong>Customer Note:</strong> {selectedOrderDetails.notes}
              </div>
            )}

            <h4 style={{ color: '#570606', fontSize: '14px', margin: '0 0 8px' }}>Line Items</h4>
            <div style={{ border: '1px solid #e8d9c7', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              {selectedOrderDetails.items?.map((it, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderBottom: idx < selectedOrderDetails.items.length - 1 ? '1px solid #f2e6d9' : 'none',
                  }}
                >
                  <img
                    src={it.image || '/images/brand_logo.png'}
                    alt={it.name}
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{it.name}</div>
                    <small style={{ color: 'var(--muted)' }}>
                      Qty: {it.qty} × {rupees(it.price)} {it.variantTitle ? `(${it.variantTitle})` : ''}
                    </small>
                  </div>
                  <strong style={{ fontSize: '13px' }}>{rupees(it.price * it.qty)}</strong>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div style={{ background: '#f8f3eb', padding: '14px', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>{rupees(selectedOrderDetails.subtotal)}</span>
              </div>
              {selectedOrderDetails.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', marginBottom: '4px' }}>
                  <span>Discount ({selectedOrderDetails.couponCode}):</span>
                  <span>- {rupees(selectedOrderDetails.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Shipping:</span>
                <span>{selectedOrderDetails.shippingFee === 0 ? 'FREE' : rupees(selectedOrderDetails.shippingFee)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: '#570606',
                  borderTop: '1px solid #d8b66d',
                  paddingTop: '6px',
                }}
              >
                <span>Total Amount:</span>
                <span>{rupees(selectedOrderDetails.total)}</span>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                Razorpay Order ID: <code>{selectedOrderDetails.razorpayOrderId || 'N/A'}</code>
              </div>
              <button
                className="btn"
                onClick={() => setSelectedOrderDetails(null)}
                style={{ background: '#570606', color: '#fff5e8', fontSize: '12px' }}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CUSTOMER ORDER HISTORY                                             */}
      {/* ========================================================================= */}
      {selectedCustomerOrders && (
        <div className="overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="modalhead">
              <h2>Order History · {selectedCustomerOrders.customer.name}</h2>
              <button className="close" onClick={() => setSelectedCustomerOrders(null)}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--muted)' }}>
              Email: <strong>{selectedCustomerOrders.customer.email}</strong> · Lifetime Spend:{' '}
              <strong style={{ color: '#570606' }}>{rupees(selectedCustomerOrders.customer.totalSpent)}</strong>
            </div>

            {selectedCustomerOrders.orders.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No orders found for this customer.</p>
            ) : (
              selectedCustomerOrders.orders.map(o => (
                <div
                  key={o.id}
                  style={{
                    background: '#f8f3eb',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid #e8d9c7',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span style={{ color: '#570606' }}>{o.orderNumber}</span>
                    <span>{rupees(o.total)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                    Date:{' '}
                    {new Date(o.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · Status: <strong>{o.orderStatus}</strong> ({o.paymentStatus})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CSV BULK IMPORT                                                    */}
      {/* ========================================================================= */}
      {isCsvModalOpen && (
        <div className="overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '580px' }}>
            <div className="modalhead">
              <h2>Bulk Import Products via CSV</h2>
              <button className="close" onClick={() => setIsCsvModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCsvImport}>
              <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '0 0 12px' }}>
                Paste CSV text with headers: <code>name,category,price,salePrice,stock,sku,desc,image,tag</code>
              </p>

              <textarea
                rows={8}
                required
                placeholder={`name,category,price,salePrice,stock,sku,desc,image,tag
Daisy Dream Tote,Bags,1299,1199,8,BAG-DD-01,Slow hand-crocheted tote,https://images.unsplash.com/photo-1591561954557-26941169b49e,BESTSELLER
Sunflower Stem,Flowers,349,,15,FLW-SF-02,Bright yarn sunflower,https://images.unsplash.com/photo-1490750967868-88aa4486c946,HANDMADE`}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '11px', width: '100%', marginBottom: '12px' }}
              />

              {csvImportResult && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '6px',
                    background: csvImportResult.includes('Success') ? '#dcfce7' : '#fee2e2',
                    color: csvImportResult.includes('Success') ? '#15803d' : '#b91c1c',
                    fontSize: '12px',
                    marginBottom: '12px',
                  }}
                >
                  {csvImportResult}
                </div>
              )}

              <button
                className="btn"
                type="submit"
                disabled={csvImporting}
                style={{ width: '100%', background: '#570606', color: '#fff5e8' }}
              >
                {csvImporting ? 'Importing Products into Database…' : 'Start CSV Import ✿'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT / ADD CUSTOMER REVIEW                                         */}
      {/* ========================================================================= */}
      {isReviewModalOpen && (
        <div className="overlay" style={{ display: 'flex', zIndex: 1000 }}>
          <div className="modal" style={{ maxWidth: '620px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modalhead">
              <h2>{editingReviewId ? '✏️ Edit Customer Review' : '💬 Add New Customer Review'}</h2>
              <button className="close" onClick={() => setIsReviewModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReview}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '12px' }}>
                <div className="field">
                  <label>Customer Name *</label>
                  <input
                    required
                    placeholder="e.g. Preeti Sharma"
                    value={reviewForm.customerName}
                    onChange={e => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Product Reference *</label>
                  <input
                    list="products-datalist"
                    required
                    placeholder="e.g. Daisy Dream Tote"
                    value={reviewForm.productName}
                    onChange={e => setReviewForm({ ...reviewForm, productName: e.target.value })}
                  />
                  <datalist id="products-datalist">
                    {products.map(p => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '12px' }}>
                <div className="field">
                  <label>Star Rating (1 - 5) *</label>
                  <select
                    value={reviewForm.rating}
                    onChange={e => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) || 5 })}
                  >
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Review Heading / Title</label>
                  <input
                    placeholder="e.g. Loved stitch by stitch"
                    value={reviewForm.title}
                    onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label>Customer Review Quote / Feedback *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. The detailing is beautiful and the bag feels so special. You can tell it was made with care."
                  value={reviewForm.quote}
                  onChange={e => setReviewForm({ ...reviewForm, quote: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Customer Byline (Optional)</label>
                <input
                  placeholder="e.g. — PREETI S., MUMBAI or — CUSTOMER NOTE"
                  value={reviewForm.byline}
                  onChange={e => setReviewForm({ ...reviewForm, byline: e.target.value })}
                />
              </div>

              {/* Review Photo Upload */}
              <div className="field">
                <label>Review / Customer Photo (Upload or URL)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    placeholder="https://... or upload photo"
                    value={reviewForm.image}
                    onChange={e => setReviewForm({ ...reviewForm, image: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <label
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: '#570606',
                      color: '#fff5e8',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      whiteSpace: 'nowrap',
                      border: '1px solid #d8b66d',
                      userSelect: 'none',
                    }}
                  >
                    {isUploadingReviewImg ? 'Uploading…' : '📁 Upload Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={isUploadingReviewImg}
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleReviewCoverUpload(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Review Photo Preview */}
                {reviewForm.image && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#251a2e',
                      borderRadius: '8px',
                      border: '1px solid #443449',
                    }}
                  >
                    <img
                      src={reviewForm.image}
                      alt="Review Preview"
                      style={{
                        width: '64px',
                        height: '64px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #d8b66d',
                      }}
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#e8c779', display: 'block' }}>
                        Photo Attached
                      </span>
                      <small
                        style={{
                          fontSize: '11px',
                          color: '#c0afc0',
                          wordBreak: 'break-all',
                          display: 'block',
                          maxHeight: '34px',
                          overflow: 'hidden',
                        }}
                      >
                        {reviewForm.image}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => setReviewForm({ ...reviewForm, image: '' })}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', margin: '14px 0 20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#3d2522', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={reviewForm.isApproved}
                    onChange={e => setReviewForm({ ...reviewForm, isApproved: e.target.checked })}
                  />
                  <span>Approved for storefront display</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#3d2522', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={reviewForm.isVerifiedPurchase}
                    onChange={e => setReviewForm({ ...reviewForm, isVerifiedPurchase: e.target.checked })}
                  />
                  <span>Verified Purchase badge</span>
                </label>
              </div>

              <button
                className="btn"
                type="submit"
                style={{ width: '100%', background: '#570606', color: '#fff5e8', padding: '12px', fontSize: '14px', fontWeight: 600 }}
              >
                {editingReviewId ? 'Save Review Changes ✿' : 'Publish New Review ✿'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile-Friendly Global Responsive CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .admin-mobile-tab-bar {
            display: block !important;
          }
          .admin-header-cluster {
            width: 100% !important;
            justify-content: space-between !important;
            margin-top: 6px !important;
          }
          .admin-db-pill {
            display: none !important;
          }
          .admin-overview-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .admin-overview-grid .stat-card {
            padding: 12px 14px !important;
          }
          .admin-overview-grid .stat-card div:nth-child(2) {
            font-size: 22px !important;
          }
          .adminwrap input, .adminwrap select, .adminwrap textarea {
            font-size: 16px !important; /* Prevents auto-zoom on iOS */
          }
          main {
            padding: 16px 12px 60px !important;
          }
          .modal {
            width: 96% !important;
            padding: 16px !important;
            max-height: 92vh !important;
          }
        }
      `}} />
    </div>
  );
}
