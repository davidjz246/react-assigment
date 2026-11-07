/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Heart,
  Search,
  User,
  Menu,
  X,
  Star,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Package,
  LogOut,
  Lock,
  Mail,
  Phone,
  MapPin,
  Tag,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface Product {
  _id: string;
  title: string;
  slug: string;
  description: string;
  quantity: number;
  sold: number;
  price: number;
  priceAfterDiscount?: number;
  imageCover: string;
  images: string[];
  category: { _id: string; name: string; slug: string; image?: string };
  brand: { _id: string; name: string; slug: string };
  ratingsAverage: number;
  ratingsQuantity: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

interface Brand {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

interface CartItem {
  product: Product;
  count: number;
  price: number;
}

interface Cart {
  _id: string;
  products: CartItem[];
  totalCartPrice: number;
  discount?: number;
}

interface Order {
  _id: string;
  cartItems: CartItem[];
  totalOrderPrice: number;
  shippingAddress: { details: string; city: string; phone: string };
  paymentMethodType: string;
  isPaid: boolean;
  isDelivered: boolean;
  createdAt: string;
}

export default function App() {
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState<'home' | 'products' | 'product-detail' | 'categories' | 'brands' | 'cart' | 'wishlist' | 'checkout' | 'orders' | 'login' | 'register' | 'forgot-password' | 'verify-code' | 'reset-password' | 'change-password'>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // Auth State
  const [token, setToken] = useState<string | null>(localStorage.getItem('freshcart_token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('freshcart_user') || 'null'));

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  
  // Cart State (Supports guest cart + backend sync)
  const [cart, setCart] = useState<Cart>(() => {
    const saved = localStorage.getItem('freshcart_guest_cart');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return { _id: 'guest_cart', products: [], totalCartPrice: 0 };
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('freshcart_guest_wishlist');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // UI Filters & Search State
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(false);

  // Toast / Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Forms State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authRePassword, setAuthRePassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  // Checkout Form
  const [shippingAddress, setShippingAddress] = useState({ details: '15 Tahrir St', city: 'Cairo', phone: '+201012345678' });
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Clear registration form when navigating to register
  useEffect(() => {
    if (currentRoute === 'register') {
      setAuthName('');
      setAuthEmail('');
      setAuthPhone('');
      setAuthPassword('');
      setAuthRePassword('');
    }
  }, [currentRoute]);

  // Initial Data Fetch
  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchProducts();
    if (token) {
      fetchCart();
      fetchWishlist();
      fetchOrders();
    }
  }, [token]);

  // Save guest cart & wishlist to local storage
  useEffect(() => {
    if (!token) {
      localStorage.setItem('freshcart_guest_cart', JSON.stringify(cart));
    }
  }, [cart, token]);

  useEffect(() => {
    if (!token) {
      localStorage.setItem('freshcart_guest_wishlist', JSON.stringify(wishlistIds));
    }
  }, [wishlistIds, token]);

  // Update wishlist products whenever wishlistIds change
  useEffect(() => {
    const prods = products.filter(p => wishlistIds.includes(p._id));
    setWishlistProducts(prods);
  }, [wishlistIds, products]);

  const fetchProducts = async (query = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/products${query}`);
      const data = await res.json();
      if (data && data.data) {
        setProducts(data.data);
      } else if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/v1/categories');
      const data = await res.json();
      if (data && data.data) {
        setCategories(data.data);
      } else if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/v1/brands');
      const data = await res.json();
      if (data && data.data) {
        setBrands(data.data);
      } else if (Array.isArray(data)) {
        setBrands(data);
      }
    } catch (err) {
      console.error('Failed to fetch brands', err);
    }
  };

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.data) setCart(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWishlist = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.data) {
        setWishlistProducts(data.data);
        setWishlistIds(data.data.map((p: Product) => p._id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/v1/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.data) setOrders(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllOrders = async () => {
    try {
      if (token) {
        await fetch('/api/v1/orders', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setOrders([]);
      showToast('All orders cleared successfully');
    } catch (err) {
      console.error(err);
    }
  };

  // Cart Operations (Allows guest usage without sign in)
  const addToCart = async (productId: string) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;

    if (token) {
      try {
        const res = await fetch('/api/v1/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId })
        });
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setCart(data.data);
          showToast('Product added successfully to your cart');
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Guest Cart Management
    setCart(prevCart => {
      const existing = prevCart.products.find(item => item.product._id === productId);
      let updatedProducts = [...prevCart.products];
      const itemPrice = prod.priceAfterDiscount || prod.price;

      if (existing) {
        updatedProducts = updatedProducts.map(item => 
          item.product._id === productId ? { ...item, count: item.count + 1 } : item
        );
      } else {
        updatedProducts.push({ product: prod, count: 1, price: itemPrice });
      }

      const total = updatedProducts.reduce((sum, item) => sum + (item.price * item.count), 0);
      return {
        ...prevCart,
        products: updatedProducts,
        totalCartPrice: total
      };
    });
    showToast('Product added successfully to your cart');
  };

  const updateCartQuantity = async (productId: string, count: number) => {
    if (count <= 0) {
      removeFromCart(productId);
      return;
    }

    if (token) {
      try {
        const res = await fetch(`/api/v1/cart/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ count })
        });
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setCart(data.data);
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Guest update
    setCart(prevCart => {
      let updatedProducts = prevCart.products.map(item => 
        item.product._id === productId ? { ...item, count } : item
      ).filter(item => item.count > 0);

      const subtotal = updatedProducts.reduce((sum, item) => sum + (item.price * item.count), 0);
      const total = prevCart.discount ? Math.round(subtotal * 0.9) : subtotal;
      return {
        ...prevCart,
        products: updatedProducts,
        totalCartPrice: total
      };
    });
  };

  const removeFromCart = async (productId: string) => {
    if (token) {
      try {
        const res = await fetch(`/api/v1/cart/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setCart(data.data);
          showToast('Item removed from cart');
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // Guest remove
    setCart(prevCart => {
      const updatedProducts = prevCart.products.filter(item => item.product._id !== productId);
      const subtotal = updatedProducts.reduce((sum, item) => sum + (item.price * item.count), 0);
      const total = prevCart.discount ? Math.round(subtotal * 0.9) : subtotal;
      return {
        ...prevCart,
        products: updatedProducts,
        totalCartPrice: total
      };
    });
    showToast('Item removed from cart');
  };

  // Move product from cart to wishlist (single toast, no duplicate notification)
  const moveCartItemToWishlist = async (productId: string) => {
    // Add to wishlist
    if (!wishlistIds.includes(productId)) {
      setWishlistIds(prev => [...prev, productId]);
      if (token) {
        try {
          await fetch('/api/v1/wishlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
          });
        } catch (e) { /* ignore */ }
      }
    }

    // Silently remove from cart
    if (token) {
      try {
        const res = await fetch(`/api/v1/cart/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success' && data.data) {
          setCart(data.data);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      setCart(prevCart => {
        const updatedProducts = prevCart.products.filter(item => item.product._id !== productId);
        const subtotal = updatedProducts.reduce((sum, item) => sum + (item.price * item.count), 0);
        const total = prevCart.discount ? Math.round(subtotal * 0.9) : subtotal;
        return {
          ...prevCart,
          products: updatedProducts,
          totalCartPrice: total
        };
      });
    }

    showToast('Item moved to your Wishlist!');
  };

  const clearCart = async () => {
    if (token) {
      try {
        await fetch('/api/v1/cart', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
      }
    }
    setCart({ _id: 'empty', products: [], totalCartPrice: 0 });
    showToast('Cart cleared');
  };

  const applyCoupon = async () => {
    if (!token) {
      showToast('Please login to apply coupons');
      return;
    }
    try {
      const res = await fetch('/api/v1/cart/applyCoupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ coupon: couponCode })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setCart(data.data);
        showToast('Coupon applied successfully! (10% off)');
      } else {
        showToast(data.message || 'Invalid coupon');
      }
    } catch (err) {
      showToast('Failed to apply coupon');
    }
  };

  // Wishlist Operations
  const toggleWishlist = async (productId: string) => {
    const isWishlisted = wishlistIds.includes(productId);
    
    if (isWishlisted) {
      setWishlistIds(prev => prev.filter(id => id !== productId));
      showToast('Removed from wishlist');
      if (token) {
        try {
          await fetch(`/api/v1/wishlist/${productId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (e) { /* ignore */ }
      }
    } else {
      setWishlistIds(prev => [...prev, productId]);
      showToast('Added to wishlist');
      if (token) {
        try {
          await fetch('/api/v1/wishlist', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ productId })
          });
        } catch (e) { /* ignore */ }
      }
    }
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (data.message === 'success' || data.token) {
        const userToken = data.token;
        const userData = data.user || { name: 'Ahmed', email: authEmail, role: 'user' };
        localStorage.setItem('freshcart_token', userToken);
        localStorage.setItem('freshcart_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        showToast('Welcome back, ' + userData.name + '!');
        setCurrentRoute('home');
      } else {
        showToast(data.message || 'Login failed');
      }
    } catch (err) {
      showToast('Login error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName || authName.trim().length < 3) {
      showToast('Name must be at least 3 characters long');
      return;
    }
    if (!authEmail || !authEmail.includes('@') || !authEmail.includes('.')) {
      showToast('Please enter a valid email address');
      return;
    }
    const phoneRegex = /^\d{11}$/;
    if (!authPhone || !phoneRegex.test(authPhone)) {
      showToast('Phone number must be exactly 11 digits and contain numbers only');
      return;
    }
    if (authPassword.length < 6) {
      showToast('Password must be at least 6 characters long');
      return;
    }
    if (authPassword !== authRePassword) {
      showToast('Passwords do not match');
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword, rePassword: authRePassword, phone: authPhone })
      });
      const data = await res.json();
      if (data.message === 'success' || data.token) {
        const userToken = data.token;
        const userData = data.user || { name: authName, email: authEmail, role: 'user' };
        localStorage.setItem('freshcart_token', userToken);
        localStorage.setItem('freshcart_user', JSON.stringify(userData));
        setToken(userToken);
        setUser(userData);
        showToast('Account created successfully!');
        setCurrentRoute('home');
      } else {
        showToast(data.message || 'Registration failed');
      }
    } catch (err) {
      showToast('Registration error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('freshcart_token');
    localStorage.removeItem('freshcart_user');
    localStorage.removeItem('freshcart_guest_cart');
    localStorage.removeItem('freshcart_guest_wishlist');
    setToken(null);
    setUser(null);
    setCart({ _id: 'guest_cart', products: [], totalCartPrice: 0 });
    setWishlistIds([]);
    setWishlistProducts([]);
    setOrders([]);
    showToast('Logged out successfully');
    setCurrentRoute('home');
  };

  const handleForgotPass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/forgotPasswords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(data.message || 'Reset code sent');
        if (data.demoCode) setResetCode(data.demoCode);
        setCurrentRoute('verify-code');
      } else {
        showToast(data.message || 'Error sending code');
      }
    } catch (err) {
      showToast('Error');
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/auth/verifyResetCode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetCode })
      });
      const data = await res.json();
      if (data.status === 'Success' || data.status === 'success') {
        showToast('Code verified successfully');
        setCurrentRoute('reset-password');
      } else {
        showToast(data.message || 'Invalid code');
      }
    } catch (err) {
      showToast('Error verifying code');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long');
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/resetPassword', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, newPassword })
      });
      const data = await res.json();
      if (data.message === 'success' || data.token) {
        showToast('Password reset successfully. Please login.');
        setCurrentRoute('login');
      } else {
        showToast(data.message || 'Reset failed');
      }
    } catch (err) {
      showToast('Error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long');
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/updateMyPassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, password: newPassword })
      });
      const data = await res.json();
      if (data.message === 'success' || data.token) {
        showToast('Password changed successfully');
        setCurrentRoute('home');
      } else {
        showToast(data.message || 'Failed to change password');
      }
    } catch (err) {
      showToast('Error');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast('Please sign in or register to complete your purchase');
      setCurrentRoute('login');
      return;
    }
    if (!cart || !cart.products.length) {
      showToast('Your cart is empty');
      return;
    }

    try {
      const cartId = cart._id || 'cart_1';
      if (paymentMethod === 'cash') {
        const res = await fetch(`/api/v1/orders/${cartId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ shippingAddress })
        });
        const data = await res.json();
        if (data.status === 'success') {
          showToast('Order placed successfully (Cash on Delivery)!');
          setCart({ _id: 'empty', products: [], totalCartPrice: 0 });
          fetchOrders();
          setCurrentRoute('orders');
        }
      } else {
        const res = await fetch(`/api/v1/orders/checkout-session/${cartId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ shippingAddress })
        });
        const data = await res.json();
        if (data.status === 'success') {
          showToast('Payment successful via Stripe Online! Order placed.');
          setCart({ _id: 'empty', products: [], totalCartPrice: 0 });
          fetchOrders();
          setCurrentRoute('orders');
        }
      }
    } catch (err) {
      showToast('Checkout failed');
    }
  };

  // Filtered products with robust category name/slug/id matching
  const filteredProducts = products.filter(p => {
    const matchesKeyword = searchKeyword === '' || p.title.toLowerCase().includes(searchKeyword.toLowerCase()) || p.description.toLowerCase().includes(searchKeyword.toLowerCase());
    
    let matchesCat = true;
    if (selectedCatFilter) {
      const catObj = categories.find(c => c._id === selectedCatFilter || c.slug === selectedCatFilter || c.name === selectedCatFilter);
      const targetName = catObj ? catObj.name.toLowerCase() : selectedCatFilter.toLowerCase();
      const prodCatName = p.category?.name?.toLowerCase() || '';
      const prodCatSlug = p.category?.slug?.toLowerCase() || '';
      const prodCatId = p.category?._id || '';

      matchesCat = (
        prodCatId === selectedCatFilter ||
        prodCatSlug === selectedCatFilter ||
        prodCatName === targetName ||
        prodCatName.includes(targetName) ||
        targetName.includes(prodCatName)
      );
    }

    const matchesBrand = selectedBrandFilter === '' || p.brand?._id === selectedBrandFilter || p.brand?.slug === selectedBrandFilter || p.brand?.name?.toLowerCase() === selectedBrandFilter.toLowerCase();
    return matchesKeyword && matchesCat && matchesBrand;
  });

  const displayedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price') return a.price - b.price;
    if (sortBy === '-price') return b.price - a.price;
    if (sortBy === '-ratingsAverage') return b.ratingsAverage - a.ratingsAverage;
    if (sortBy === '-sold') return b.sold - a.sold;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-800 animate-bounce">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      <div className="bg-emerald-700 text-white text-xs py-2 px-4 text-center font-medium tracking-wide">
        Super Fast Delivery · Free Shipping on orders over EGP 500 · 100% Fresh Organic Guarantee
      </div>

      {/* Header Contract: 3 Zones */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Logo */}
        <div 
          onClick={() => { setSelectedCatFilter(''); setSelectedBrandFilter(''); setSearchKeyword(''); setSortBy(''); setCurrentRoute('home'); }} 
          className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:bg-emerald-700 transition-colors">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900">FreshCart</span>
            <span className="block text-[10px] text-emerald-600 font-semibold tracking-wider uppercase">Grocery & Store</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={() => { setSelectedCatFilter(''); setSelectedBrandFilter(''); setCurrentRoute('home'); }} className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 ${currentRoute === 'home' ? 'text-emerald-600 font-semibold' : ''}`}>
            Home
          </button>
          <button onClick={() => { setSelectedCatFilter(''); setSelectedBrandFilter(''); setCurrentRoute('products'); }} className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 ${currentRoute === 'products' ? 'text-emerald-600 font-semibold' : ''}`}>
            Products
          </button>
          <button onClick={() => setCurrentRoute('categories')} className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 ${currentRoute === 'categories' ? 'text-emerald-600 font-semibold' : ''}`}>
            Categories
          </button>
          <button onClick={() => setCurrentRoute('brands')} className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 ${currentRoute === 'brands' ? 'text-emerald-600 font-semibold' : ''}`}>
            Brands
          </button>
          {token && (
            <button onClick={() => setCurrentRoute('orders')} className={`hover:text-emerald-600 transition-colors whitespace-nowrap shrink-0 ${currentRoute === 'orders' ? 'text-emerald-600 font-semibold' : ''}`}>
              My Orders
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & Search */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative hidden md:block w-48 lg:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search products..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                if (currentRoute !== 'products' && currentRoute !== 'home') setCurrentRoute('products');
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Wishlist Button */}
          <button 
            onClick={() => setCurrentRoute('wishlist')} 
            className="relative p-2 text-slate-700 hover:text-emerald-600 transition-colors"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistIds.length}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button 
            onClick={() => setCurrentRoute('cart')} 
            className="relative p-2 text-slate-700 hover:text-emerald-600 transition-colors flex items-center gap-1.5 bg-slate-50 hover:bg-emerald-50 rounded-lg px-3 py-1.5 border border-slate-200"
            title="Cart"
          >
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">
              {cart && cart.products ? cart.products.reduce((acc, item) => acc + item.count, 0) : 0}
            </span>
          </button>

          {/* User Auth Section */}
          {token && user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors">
                <User className="w-4 h-4 text-emerald-600" />
                <span className="max-w-[100px] truncate">{user.name}</span>
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 hidden group-hover:block z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <button onClick={() => setCurrentRoute('orders')} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" /> My Orders
                </button>
                <button onClick={() => setCurrentRoute('change-password')} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Change Password
                </button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentRoute('login')} 
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => setCurrentRoute('register')} 
                className="px-4 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                Register
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-slate-700">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 shadow-lg">
          <button onClick={() => { setCurrentRoute('home'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">Home</button>
          <button onClick={() => { setCurrentRoute('products'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">Products</button>
          <button onClick={() => { setCurrentRoute('categories'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">Categories</button>
          <button onClick={() => { setCurrentRoute('brands'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">Brands</button>
          {token && <button onClick={() => { setCurrentRoute('orders'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 font-medium text-slate-700">My Orders</button>}
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* 1. HOMEPAGE ROUTE */}
        {currentRoute === 'home' && (
          <div className="space-y-12">
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-900 to-emerald-700 text-white p-8 md:p-14 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl space-y-4">
                <span className="inline-block bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                  🌱 100% Organic & Fresh Groceries
                </span>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                  Freshness Delivered Right To Your Doorstep
                </h1>
                <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                  Shop farm-fresh vegetables, organic fruits, premium dairy, daily bakery, and household essentials with same-day express delivery.
                </p>
                <div className="pt-2 flex items-center gap-4">
                  <button 
                    onClick={() => setCurrentRoute('products')}
                    className="px-6 py-3 bg-white text-emerald-900 rounded-xl font-semibold text-sm hover:bg-emerald-50 transition-colors shadow-md flex items-center gap-2"
                  >
                    Shop Now <ArrowRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentRoute('categories')}
                    className="px-6 py-3 bg-emerald-800/80 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition-colors border border-emerald-600"
                  >
                    Explore Categories
                  </button>
                </div>
              </div>
              <div className="w-full md:w-1/2 flex justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80" 
                  alt="Fresh groceries" 
                  className="rounded-2xl shadow-2xl object-cover max-h-80 w-full"
                />
              </div>
            </div>

            {/* Feature Highlights Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Express Delivery</h3>
                  <p className="text-xs text-slate-500">Same day delivery across all cities</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">100% Secure Payment</h3>
                  <p className="text-xs text-slate-500">Online card or cash on delivery</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Easy Returns</h3>
                  <p className="text-xs text-slate-500">No questions asked guarantee</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Daily Best Prices</h3>
                  <p className="text-xs text-slate-500">Affordable prices & daily discounts</p>
                </div>
              </div>
            </div>

            {/* Popular Categories */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Popular Categories</h2>
                  <p className="text-xs text-slate-500">Browse top shopping departments</p>
                </div>
                <button onClick={() => setCurrentRoute('categories')} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map(cat => (
                  <div
                    key={cat._id}
                    onClick={() => {
                      setSelectedCatFilter(cat._id);
                      setCurrentRoute('products');
                    }}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all group p-4 text-center flex flex-col items-center"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden mb-3 bg-slate-100 border border-slate-100 group-hover:scale-105 transition-transform">
                      <img src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">{cat.name}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Products */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Featured Products</h2>
                  <p className="text-xs text-slate-500">Hand-picked fresh items for you</p>
                </div>
                <button onClick={() => setCurrentRoute('products')} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                  View All Products <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.slice(0, 8).map(prod => (
                  <div key={prod._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group">
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img 
                        src={prod.imageCover} 
                        alt={prod.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onClick={() => { setSelectedProductId(prod._id); setCurrentRoute('product-detail'); }}
                      />
                      <button 
                        onClick={() => toggleWishlist(prod._id)}
                        className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${wishlistIds.includes(prod._id) ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 hover:text-rose-500'}`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      {prod.priceAfterDiscount && (
                        <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          Sale
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">{prod.category?.name}</span>
                        <h3 
                          onClick={() => { setSelectedProductId(prod._id); setCurrentRoute('product-detail'); }}
                          className="text-sm font-semibold text-slate-900 hover:text-emerald-600 cursor-pointer line-clamp-2 mt-1"
                        >
                          {prod.title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{prod.ratingsAverage}</span>
                          <span className="text-slate-400">({prod.ratingsQuantity})</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          {prod.priceAfterDiscount ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">EGP {prod.priceAfterDiscount}</span>
                              <span className="text-xs text-slate-400 line-through">EGP {prod.price}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-slate-900">EGP {prod.price}</span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(prod._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Brands Section */}
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Featured Brands</h2>
                  <p className="text-xs text-slate-500">Top brands trusted by millions</p>
                </div>
                <button onClick={() => setCurrentRoute('brands')} className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                  View All Brands <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {brands.map(brand => (
                  <div
                    key={brand._id}
                    onClick={() => {
                      setSelectedBrandFilter(brand._id);
                      setCurrentRoute('products');
                    }}
                    className="bg-white rounded-2xl border border-slate-200 p-4 text-center cursor-pointer hover:shadow-md transition-all flex flex-col items-center group"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 mb-2 border border-slate-100 group-hover:scale-105 transition-transform">
                      <img src={brand.image || 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=400&q=80'} alt={brand.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">{brand.name}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. PRODUCTS / LISTING ROUTE */}
        {currentRoute === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">All Products Catalog</h1>
                <p className="text-xs text-slate-500">Showing {filteredProducts.length} items available</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>

                <select
                  value={selectedBrandFilter}
                  onChange={(e) => setSelectedBrandFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Brands</option>
                  {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Sort By: Default</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="-ratingsAverage">Top Rated</option>
                  <option value="-sold">Most Popular</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <div key={n} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
                    <div className="aspect-[4/3] bg-slate-100 rounded-xl"></div>
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    <div className="h-6 bg-slate-100 rounded w-full pt-2"></div>
                  </div>
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-800">No products found</h3>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords.</p>
                <button 
                  onClick={() => { setSearchKeyword(''); setSelectedCatFilter(''); setSelectedBrandFilter(''); setSortBy(''); }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedProducts.map(prod => (
                  <div key={prod._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group">
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img 
                        src={prod.imageCover} 
                        alt={prod.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onClick={() => { setSelectedProductId(prod._id); setCurrentRoute('product-detail'); }}
                      />
                      <button 
                        onClick={() => toggleWishlist(prod._id)}
                        className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${wishlistIds.includes(prod._id) ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 hover:text-rose-500'}`}
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">{prod.category?.name}</span>
                        <h3 
                          onClick={() => { setSelectedProductId(prod._id); setCurrentRoute('product-detail'); }}
                          className="text-sm font-semibold text-slate-900 hover:text-emerald-600 cursor-pointer line-clamp-2 mt-1"
                        >
                          {prod.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{prod.ratingsAverage}</span>
                        <span className="text-slate-400">({prod.ratingsQuantity})</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          {prod.priceAfterDiscount ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">EGP {prod.priceAfterDiscount}</span>
                              <span className="text-xs text-slate-400 line-through">EGP {prod.price}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-slate-900">EGP {prod.price}</span>
                          )}
                        </div>
                        <button
                          onClick={() => addToCart(prod._id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. PRODUCT DETAIL ROUTE */}
        {currentRoute === 'product-detail' && selectedProductId && (() => {
          const prod = products.find(p => p._id === selectedProductId);
          if (!prod) {
            return (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-4">
                <Package className="w-16 h-16 text-slate-300 mx-auto" />
                <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
                <p className="text-xs text-slate-500">The product you are looking for does not exist or has been removed.</p>
                <button onClick={() => setCurrentRoute('products')} className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                  Browse Catalog
                </button>
              </div>
            );
          }
          return (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-sm space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
                    <img src={prod.imageCover} alt={prod.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {prod.images && prod.images.map((img, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-pointer bg-slate-50">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full">{prod.category?.name}</span>
                      <span className="text-xs text-slate-400">Brand: {prod.brand?.name}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{prod.title}</h1>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{prod.ratingsAverage}</span>
                      </div>
                      <span className="text-slate-400 text-xs">({prod.ratingsQuantity} customer reviews)</span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed">{prod.description}</p>

                    <div className="pt-2">
                      {prod.priceAfterDiscount ? (
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-extrabold text-slate-900">EGP {prod.priceAfterDiscount}</span>
                          <span className="text-lg text-slate-400 line-through">EGP {prod.price}</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">Save EGP {prod.price - prod.priceAfterDiscount}</span>
                        </div>
                      ) : (
                        <span className="text-3xl font-extrabold text-slate-900">EGP {prod.price}</span>
                      )}
                    </div>

                    <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>In Stock ({prod.quantity} items available) · Fast Delivery Guaranteed</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => addToCart(prod._id)}
                      className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <ShoppingCart className="w-5 h-5" /> Add to Cart
                    </button>
                    <button
                      onClick={() => toggleWishlist(prod._id)}
                      className={`p-3.5 rounded-xl border transition-colors ${wishlistIds.includes(prod._id) ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      title="Wishlist"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 4. CATEGORIES ROUTE */}
        {currentRoute === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">All Categories</h1>
              <p className="text-xs text-slate-500 mt-1">Explore all grocery & store departments</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {categories.map(cat => (
                <div
                  key={cat._id}
                  onClick={() => {
                    setSelectedCatFilter(cat._id);
                    setCurrentRoute('products');
                  }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all group flex items-center p-4 gap-4"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                    <img src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{cat.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Explore products</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. BRANDS ROUTE */}
        {currentRoute === 'brands' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">All Popular Brands</h1>
              <p className="text-xs text-slate-500 mt-1">Shop your favorite household and grocery brands</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {brands.map(brand => (
                <div
                  key={brand._id}
                  onClick={() => {
                    setSelectedBrandFilter(brand._id);
                    setCurrentRoute('products');
                  }}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all group flex items-center p-4 gap-4"
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                    <img src={brand.image || 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=400&q=80'} alt={brand.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{brand.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">View brand items</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. CART ROUTE */}
        {currentRoute === 'cart' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
                <p className="text-xs text-slate-500">
                  {cart && cart.products ? cart.products.reduce((acc, i) => acc + i.count, 0) : 0} items in your cart
                </p>
              </div>
              {cart && cart.products && cart.products.length > 0 && (
                <button onClick={clearCart} className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors border border-rose-200 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" /> Clear Cart
                </button>
              )}
            </div>

            {!cart || !cart.products || cart.products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500">Add fresh groceries and items to your cart to proceed with checkout.</p>
                <button 
                  onClick={() => setCurrentRoute('products')}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                  {cart.products.map(item => (
                    <div key={item.product._id} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img src={item.product.imageCover} alt={item.product.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">{item.product.title}</h3>
                          <p className="text-xs font-bold text-emerald-600 mt-1">EGP {item.price} each</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            onClick={() => updateCartQuantity(item.product._id, item.count - 1)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-slate-900">{item.count}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product._id, item.count + 1)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveCartItemToWishlist(item.product._id)}
                            className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                            title="Move to Wishlist"
                          >
                            <Heart className="w-3.5 h-3.5" /> Wishlist
                          </button>

                          <button
                            onClick={() => removeFromCart(item.product._id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cart Summary & Coupon */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Order Summary</h3>
                    
                    {token && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Coupon code (e.g. FRESH10)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          onClick={applyCoupon}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    )}

                    <div className="space-y-2 pt-2 text-xs text-slate-600">
                      {(() => {
                        const subtotal = cart.products.reduce((acc, item) => acc + (item.price * item.count), 0);
                        const discountAmount = cart.discount ? Math.round(subtotal * 0.1) : 0;
                        return (
                          <>
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span className="font-semibold text-slate-900">EGP {subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Delivery Fee</span>
                              <span className="font-semibold text-emerald-600">FREE</span>
                            </div>
                            {cart.discount && (
                              <div className="flex justify-between text-emerald-600 font-semibold">
                                <span>Discount (10%)</span>
                                <span>-EGP {discountAmount}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-100">
                              <span>Total</span>
                              <span>EGP {cart.totalCartPrice}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {!token && (
                      <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                        Note: You can freely browse and add items to your cart as a guest. You will be asked to sign in when you proceed to checkout.
                      </p>
                    )}

                    <button
                      onClick={() => {
                        if (!token) {
                          showToast('Please sign in or register to checkout');
                          setCurrentRoute('login');
                        } else {
                          setCurrentRoute('checkout');
                        }
                      }}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm mt-4"
                    >
                      {token ? 'Proceed to Checkout' : 'Sign in to Checkout'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. CHECKOUT / PAYMENT WAYS ROUTE */}
        {currentRoute === 'checkout' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">Secure Checkout & Payment</h1>
              <p className="text-xs text-slate-500 mt-1">Provide your delivery address and select payment method</p>
            </div>

            <form onSubmit={handleCheckout} className="space-y-6">
              {/* Shipping Address */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="w-4 h-4 text-emerald-600" /> Shipping Address
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Street Details</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.details}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, details: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Payment Ways
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label 
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${paymentMethod === 'cash' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Cash on Delivery</span>
                      <span className="text-[10px] text-slate-500">Pay cash when your order arrives</span>
                    </div>
                  </label>

                  <label 
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-xl border-2 cursor-pointer flex items-center gap-3 transition-all ${paymentMethod === 'card' ? 'border-emerald-600 bg-emerald-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <span className="block text-xs font-bold text-slate-900">Online Card (Stripe)</span>
                      <span className="text-[10px] text-slate-500">Secure online credit/debit card payment</span>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <p className="text-xs font-semibold text-slate-700">Simulated Card Details</p>
                    <input type="text" placeholder="Card Number (4242 •••• •••• 4242)" disabled defaultValue="4242 4242 4242 4242" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" placeholder="MM / YY" disabled defaultValue="12 / 28" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
                      <input type="text" placeholder="CVC" disabled defaultValue="888" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs" />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Place Order Now <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* 8. WISHLIST ROUTE */}
        {currentRoute === 'wishlist' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h1 className="text-2xl font-bold text-slate-900">My Wishlist</h1>
              <p className="text-xs text-slate-500 mt-1">{wishlistProducts.length} saved items</p>
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <Heart className="w-16 h-16 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">Your Wishlist is Empty</h3>
                <p className="text-xs text-slate-500">Save your favorite products to buy them later.</p>
                <button 
                  onClick={() => setCurrentRoute('products')}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {wishlistProducts.map(prod => (
                  <div key={prod._id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group">
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      <img src={prod.imageCover} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <button 
                        onClick={() => toggleWishlist(prod._id)}
                        className="absolute top-3 right-3 p-2 rounded-full shadow-md bg-rose-500 text-white"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">{prod.category?.name}</span>
                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mt-1">{prod.title}</h3>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-sm font-bold text-slate-900">EGP {prod.priceAfterDiscount || prod.price}</span>
                        <button
                          onClick={() => {
                            addToCart(prod._id);
                            toggleWishlist(prod._id);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Move to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 9. ORDERS ROUTE */}
        {currentRoute === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
                <p className="text-xs text-slate-500 mt-1">Track your past and active orders</p>
              </div>
              {orders.length > 0 && (
                <button
                  onClick={clearAllOrders}
                  className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors border border-rose-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Clear All Orders
                </button>
              )}
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <Package className="w-16 h-16 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">No Orders Placed Yet</h3>
                <p className="text-xs text-slate-500">Your completed orders will appear here.</p>
                <button 
                  onClick={() => setCurrentRoute('products')}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(ord => (
                  <div key={ord._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-xs font-bold text-emerald-600">Order ID: #{ord._id}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(ord.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${ord.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {ord.paymentMethodType === 'card' ? 'Online Paid (Stripe)' : 'Cash on Delivery'}
                        </span>
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                          {ord.isDelivered ? 'Delivered' : 'Processing'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {ord.cartItems.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <img src={item.product?.imageCover} alt="" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                            <div>
                              <p className="font-semibold text-slate-800">{item.product?.title}</p>
                              <p className="text-slate-500">Qty: {item.count} × EGP {item.price}</p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">EGP {item.count * item.price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-900">
                      <span>Total Order Price</span>
                      <span className="text-emerald-600">EGP {ord.totalOrderPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 10. AUTH: LOGIN ROUTE */}
        {currentRoute === 'login' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 my-10">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Welcome Back</h1>
              <p className="text-xs text-slate-500">Login to your FreshCart account to checkout</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="email@gmail.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => setCurrentRoute('forgot-password')} className="text-emerald-600 font-semibold hover:underline">
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
              >
                Login
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              Don't have an account?{' '}
              <button onClick={() => setCurrentRoute('register')} className="text-emerald-600 font-semibold hover:underline">
                Register Now
              </button>
            </div>
          </div>
        )}

        {/* 11. AUTH: REGISTER ROUTE */}
        {currentRoute === 'register' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 my-10">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
                <User className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Create Account</h1>
              <p className="text-xs text-slate-500">Join FreshCart today to complete your purchases</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="exampl@gmail.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  autoComplete="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={authRePassword}
                  onChange={(e) => setAuthRePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm"
              >
                Register
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              Already have an account?{' '}
              <button onClick={() => setCurrentRoute('login')} className="text-emerald-600 font-semibold hover:underline">
                Login here
              </button>
            </div>
          </div>
        )}

        {/* 12. FORGOT PASSWORD / VERIFY / RESET */}
        {currentRoute === 'forgot-password' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 my-10">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Forgot Password</h1>
              <p className="text-xs text-slate-500">Enter your email to receive a password reset code</p>
            </div>

            <form onSubmit={handleForgotPass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="exampl@gmail.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button type="submit" className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md text-sm">
                Send Reset Code
              </button>
            </form>
          </div>
        )}

        {currentRoute === 'verify-code' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 my-10">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Verify Reset Code</h1>
              <p className="text-xs text-slate-500">Enter the 6-digit code sent to your email</p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reset Code</label>
                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs tracking-widest font-mono text-center focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button type="submit" className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md text-sm">
                Verify Code
              </button>
            </form>
          </div>
        )}

        {currentRoute === 'reset-password' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 my-10">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900">Reset Password</h1>
              <p className="text-xs text-slate-500">Enter your new secure password</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button type="submit" className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md text-sm">
                Reset Password
              </button>
            </form>
          </div>
        )}

        {currentRoute === 'change-password' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 my-10">
            {!token ? (
              <div className="text-center py-6 space-y-4">
                <Lock className="w-12 h-12 text-slate-300 mx-auto" />
                <h2 className="text-xl font-bold text-slate-800">Authentication Required</h2>
                <p className="text-xs text-slate-500">Please sign in to change your account password.</p>
                <button
                  onClick={() => setCurrentRoute('login')}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-md"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-extrabold text-slate-900">Change Password</h1>
                  <p className="text-xs text-slate-500">Update your account password</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button type="submit" className="w-full py-3.5 bg-emerald-600 text-white font-bold rounded-xl shadow-md text-sm">
                    Update Password
                  </button>
                </form>
              </>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">FreshCart</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your favorite online grocery and retail supermarket offering 100% fresh organic products and express home delivery.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Departments</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><button onClick={() => { setSelectedCatFilter(''); setCurrentRoute('products'); }} className="hover:text-white transition-colors">Fresh Groceries</button></li>
              <li><button onClick={() => { setSelectedCatFilter(''); setCurrentRoute('products'); }} className="hover:text-white transition-colors">Dairy & Eggs</button></li>
              <li><button onClick={() => { setSelectedCatFilter(''); setCurrentRoute('products'); }} className="hover:text-white transition-colors">Snacks & Bakery</button></li>
              <li><button onClick={() => { setSelectedCatFilter(''); setCurrentRoute('products'); }} className="hover:text-white transition-colors">Beverages & Juices</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Customer Care</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center & FAQ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Track Your Order</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact Us</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-500" /> Cairo, Egypt</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-500" /> +20 101 234 5678</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-emerald-500" /> support@freshcart.com</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FreshCart Supermarket Inc. All rights reserved. Built with React & Tailwind CSS.
        </div>
      </footer>
    </div>
  );
}
