import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const ROUTE_API_BASE = 'https://ecommerce.routemisr.com/api/v1';

// Brand new state: Empty users and orders for first use
let fallbackUsers: any[] = [];
let fallbackCarts: Record<string, any> = {};
let fallbackWishlists: Record<string, string[]> = {};
let fallbackOrders: any[] = [];

// Password validation helper (min 6 chars)
const isValidPassword = (pwd: string) => {
  return typeof pwd === 'string' && pwd.length >= 6;
};

// Phone validation helper (exactly 11 digits, numbers only)
const isValidPhone = (phone: string) => {
  return typeof phone === 'string' && /^\d{11}$/.test(phone);
};

// Comprehensive categories matching Route API & user requests
let fallbackCategories = [
  { _id: 'cat_electronics', name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_supermarket', name: 'SuperMarket', slug: 'supermarket', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_mens', name: 'Men\'s Fashion', slug: 'mens-fashion', image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_womens', name: 'Women\'s Fashion', slug: 'womens-fashion', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_music', name: 'Music', slug: 'music', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_home', name: 'Home Appliances', slug: 'home-appliances', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_beauty', name: 'Beauty & Health', slug: 'beauty-health', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_baby', name: 'Baby & Toys', slug: 'baby-toys', image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_books', name: 'Books', slug: 'books', image: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=600&q=80' },
  { _id: 'cat_mobiles', name: 'Mobiles', slug: 'mobiles', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80' },
];

let fallbackBrands = [
  { _id: 'brand_1', name: 'Apple', slug: 'apple', image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=400&q=80' },
  { _id: 'brand_2', name: 'Samsung', slug: 'samsung', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=400&q=80' },
  { _id: 'brand_3', name: 'Sony', slug: 'sony', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80' },
  { _id: 'brand_4', name: 'Zara', slug: 'zara', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80' },
  { _id: 'brand_5', name: 'Nestle', slug: 'nestle', image: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=400&q=80' },
];

// Generate robust fallback products so every category has at least 5 products
let fallbackProducts: any[] = [];
fallbackCategories.forEach((category, catIdx) => {
  for (let i = 0; i < 6; i++) {
    const idx = catIdx * 6 + i;
    let title = `${category.name} Premium Item ${i + 1}`;
    let image = category.image;

    if (category._id === 'cat_electronics') {
      title = ['Wireless Noise-Cancelling Headphones', 'Ultra HD 4K Smart TV 55"', 'Smart Fitness Watch Series 9', 'Ultra-Slim Laptop 16"', 'Bluetooth Speaker Pro', 'Digital Camera 4K'][i];
      image = ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_supermarket') {
      title = ['Organic Fresh Hass Avocados', 'Fresh Organic Red Strawberries', 'Juhayna Pure Full Cream Milk', 'Nestle Nescafe Classic Coffee', 'Pepsi Refreshing Cola Can', 'Artisanal Butter Croissants'][i];
      image = ['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_mens') {
      title = ['Men\'s Classic Casual Cotton Shirt', 'Men\'s Slim Fit Denim Jeans', 'Men\'s Athletic Running Sneakers', 'Men\'s Leather Executive Jacket', 'Men\'s Cotton Crewneck Pullover', 'Men\'s Formal Suit Blazer'][i];
      image = ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_womens') {
      title = ['Women\'s Elegant Summer Floral Dress', 'Women\'s Stylish Oversized Knit Sweater', 'Women\'s High-Waisted Pleated Skirt', 'Women\'s Designer Leather Handbag', 'Women\'s Comfort Walking Loafers', 'Women\'s Chic Silk Blouse'][i];
      image = ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_music') {
      title = ['Studio Pro Condenser Microphone', 'Wireless Bluetooth Bass Speaker', 'Professional DJ Turntable System', 'Studio Monitor Acoustic Speakers', 'Acoustic Guitar with Gig Bag', 'Audiophile Over-Ear Headphones'][i];
      image = ['https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_home') {
      title = ['Smart Robotic Vacuum Cleaner', 'High-Power Air Fryer 6L', 'Automatic Espresso Coffee Machine', 'Drip Coffee Maker & Grinder', 'Ceramic Electric Cooktop', 'Multi-Cooker Pressure Cooker'][i];
      image = ['https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1544237190-e7f09d849504?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_beauty') {
      title = ['L\'Oreal Hyaluronic Acid Serum 30ml', 'Organic Argan Hair Repair Oil', 'Vitamin C Brightening Face Cream', 'Natural Botanical Skincare Kit', 'Professional Hair Styling Dryer', 'Matte Long-Lasting Lipstick Set'][i];
      image = ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1608248597359-f5383a150577?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_baby') {
      title = ['Organic Baby Gentle Body Wash', 'Soft Cotton Baby Rompers Set', 'Interactive Educational Baby Toy', 'Baby Stroller Lightweight', 'Feeding Bottle BPA Free', 'Plush Teddy Bear Soft Toy'][i];
      image = ['https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_books') {
      title = ['Bestseller Fiction Novel', 'Comprehensive JavaScript Guide', 'Modern Architecture Design Book', 'Mastering React & TypeScript', 'World History Encyclopedia', 'Mindfulness & Meditation Guide'][i];
      image = ['https://images.unsplash.com/photo-1495640388908-05fa85288e61?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?auto=format&fit=crop&w=800&q=80'][i];
    } else if (category._id === 'cat_mobiles') {
      title = ['Flagship Smartphone 5G 512GB', 'Pro Max Smartphone 1TB', 'Foldable Dual Screen Phone', 'Budget Friendly 5G Smartphone', 'Rugged Waterproof Smartphone', 'Compact Mini Smartphone'][i];
      image = ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1575695342320-d2d2d2f9b73c?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1533228876829-65c94e7b5025?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80'][i];
    }

    fallbackProducts.push({
      _id: `prod_${idx + 1}`,
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `High quality ${category.name} product featuring premium design and guaranteed satisfaction.`,
      quantity: 50 + (i * 5),
      sold: 10 + (i * 3),
      price: 300 + (i * 50),
      priceAfterDiscount: i % 2 === 0 ? 240 + (i * 40) : undefined,
      imageCover: image,
      images: [image, 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'],
      category,
      brand: fallbackBrands[i % fallbackBrands.length],
      ratingsAverage: Number((4.6 + (i % 4) * 0.1).toFixed(1)),
      ratingsQuantity: 40 + (i * 5),
    });
  }
});

// Universal Proxy Middleware with Fallback & Strict Password / Phone Validation
app.all('/api/v1/*', async (req, res) => {
  const endpoint = req.path;
  const pathParts = endpoint.split('/').filter(Boolean);
  const resource = pathParts[2];
  const method = req.method;

  // Intercept Orders locally so user doesn't see thousands of public orders from Route Misr
  if (resource === 'orders') {
    if (method === 'GET') {
      return res.json({ results: fallbackOrders.length, data: fallbackOrders });
    }
    if (method === 'DELETE') {
      fallbackOrders = [];
      return res.json({ status: 'success', message: 'All orders cleared', data: [] });
    }
    if (method === 'POST') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`) : 'token_guest';
      const cartId = pathParts[3] || (pathParts[2] === 'checkout-session' ? pathParts[4] : undefined);
      
      let userCart = fallbackCarts[token];
      if (!userCart && cartId) {
        userCart = Object.values(fallbackCarts).find((c: any) => c._id === cartId);
      }

      let orderItems: any[] = [];
      let orderPrice = 0;

      if (userCart && userCart.products.length > 0) {
        orderItems = [...userCart.products];
        orderPrice = userCart.totalCartPrice;
        userCart.products = [];
        userCart.totalCartPrice = 0;
        userCart.discount = undefined;
      } else {
        orderItems = [{ product: fallbackProducts[0], count: 1, price: 240 }];
        orderPrice = 240;
      }

      const newOrd = {
        _id: 'ord_' + Date.now(),
        cartItems: orderItems,
        totalOrderPrice: orderPrice,
        shippingAddress: req.body.shippingAddress || { details: 'Cairo', city: 'Cairo', phone: '01012345678' },
        paymentMethodType: endpoint.includes('checkout-session') ? 'card' : 'cash',
        isPaid: endpoint.includes('checkout-session'),
        isDelivered: false,
        createdAt: new Date().toISOString(),
      };
      fallbackOrders.unshift(newOrd);
      return res.json({
        status: 'success',
        session: { url: '/orders?success=true' },
        data: newOrd,
      });
    }
  }

  const targetUrl = `${ROUTE_API_BASE}${endpoint.replace('/api/v1', '')}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (req.headers.authorization) {
      headers['token'] = req.headers.authorization.replace('Bearer ', '');
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(method) && Object.keys(req.body || {}).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const externalRes = await fetch(targetUrl, fetchOptions);
    const data = await externalRes.json();

    if (externalRes.ok) {
      if (endpoint.includes('/products')) {
        if (data.data && Array.isArray(data.data)) {
          data.data = data.data.map((p: any) => ({
            ...p,
            imageCover: (p.imageCover && typeof p.imageCover === 'string' && p.imageCover.startsWith('http')) ? p.imageCover : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
            images: (p.images && Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === 'string' && p.images[0].startsWith('http')) ? p.images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80']
          }));
        } else if (data.data && typeof data.data === 'object') {
          const p = data.data;
          p.imageCover = (p.imageCover && typeof p.imageCover === 'string' && p.imageCover.startsWith('http')) ? p.imageCover : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
          p.images = (p.images && Array.isArray(p.images) && p.images.length > 0) ? p.images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'];
        }
      }
      if (endpoint.includes('/categories')) {
        if (!data.data || (Array.isArray(data.data) && data.data.length === 0)) {
          return res.json({ results: fallbackCategories.length, data: fallbackCategories });
        } else if (Array.isArray(data.data)) {
          data.data = data.data.map((c: any, i: number) => ({
            ...c,
            image: (c.image && typeof c.image === 'string' && c.image.startsWith('http')) ? c.image : (fallbackCategories[i % fallbackCategories.length]?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80')
          }));
        }
      }
      return res.status(externalRes.status).json(data);
    }

    throw new Error(data.message || 'Route API error');
  } catch (err) {
    const pathParts = endpoint.split('/').filter(Boolean);
    const resource = pathParts[2];

    // Products
    if (resource === 'products') {
      const id = pathParts[3];
      const { category, brand, keyword } = req.query;
      let result = [...fallbackProducts];

      if (id) {
        const prod = fallbackProducts.find(p => p._id === id || p.slug === id);
        if (prod) return res.json({ data: prod });
        return res.status(404).json({ message: 'Product not found' });
      }

      if (category && typeof category === 'string') {
        const catQuery = category.toLowerCase();
        result = result.filter(p => 
          p.category?._id === category || 
          p.category?.slug === category || 
          p.category?.name?.toLowerCase() === catQuery ||
          p.category?.name?.toLowerCase().includes(catQuery) ||
          catQuery.includes(p.category?.name?.toLowerCase())
        );
      }
      if (brand && typeof brand === 'string') {
        result = result.filter(p => p.brand._id === brand || p.brand.slug === brand);
      }
      if (keyword && typeof keyword === 'string') {
        const q = keyword.toLowerCase();
        result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }

      return res.json({
        results: result.length,
        metadata: { currentPage: 1, numberOfPages: 1, limit: 50 },
        data: result,
      });
    }

    // Categories
    if (resource === 'categories') {
      const id = pathParts[3];
      if (id) {
        const cat = fallbackCategories.find(c => c._id === id || c.slug === id || c.name.toLowerCase() === id.toLowerCase());
        if (cat) return res.json({ data: cat });
        return res.status(404).json({ message: 'Category not found' });
      }
      return res.json({ results: fallbackCategories.length, data: fallbackCategories });
    }

    // Brands
    if (resource === 'brands') {
      const id = pathParts[3];
      if (id) {
        const brand = fallbackBrands.find(b => b._id === id || b.slug === id);
        if (brand) return res.json({ data: brand });
        return res.status(404).json({ message: 'Brand not found' });
      }
      return res.json({ results: fallbackBrands.length, data: fallbackBrands });
    }

    // Auth with strict password & 11-digit phone validation
    if (resource === 'auth') {
      const action = pathParts[3];
      if (action === 'signup') {
        const { name, email, password, rePassword, phone } = req.body;
        if (!name || name.trim().length < 3) {
          return res.status(400).json({ status: 'fail', message: 'Name must be at least 3 characters long.' });
        }
        if (!email || !email.includes('@') || !email.includes('.')) {
          return res.status(400).json({ status: 'fail', message: 'Please provide a valid email address.' });
        }
        if (!isValidPhone(phone)) {
          return res.status(400).json({ status: 'fail', message: 'Phone number must be exactly 11 numbers (digits only).' });
        }
        if (!isValidPassword(password)) {
          return res.status(400).json({ status: 'fail', message: 'Password must be at least 6 characters long.' });
        }
        if (password !== rePassword) {
          return res.status(400).json({ status: 'fail', message: 'Passwords do not match.' });
        }
        const existing = fallbackUsers.find(u => u.email === email);
        if (existing) {
          return res.status(400).json({ status: 'fail', message: 'Account already exists with this email address.' });
        }
        const newUser = { id: 'user_' + Date.now(), name: name.trim(), email, password };
        fallbackUsers.push(newUser);
        return res.status(201).json({
          message: 'success',
          user: newUser,
          token: 'token_' + newUser.id,
        });
      }
      if (action === 'signin') {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ status: 'fail', message: 'Please provide email and password.' });
        }
        const user = fallbackUsers.find(u => u.email === email);
        if (!user || user.password !== password) {
          return res.status(401).json({ status: 'fail', message: 'Incorrect email or password.' });
        }
        const token = 'token_' + user.id;
        return res.json({
          message: 'success',
          user,
          token,
        });
      }
      if (action === 'forgotPasswords') {
        return res.json({ status: 'success', message: 'Reset code sent (Demo code: 123456)', demoCode: '123456' });
      }
      if (action === 'verifyResetCode') {
        return res.json({ status: 'Success', message: 'Success' });
      }
      if (action === 'resetPassword') {
        const { email, newPassword } = req.body;
        if (!isValidPassword(newPassword)) {
          return res.status(400).json({ status: 'fail', message: 'Password must be at least 6 characters long.' });
        }
        const user = fallbackUsers.find(u => u.email === email);
        if (user) {
          user.password = newPassword;
        }
        return res.json({ message: 'success', token: 'token_user_new' });
      }
      if (action === 'updateMyPassword') {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        const userId = token ? token.replace('token_', '') : '';
        const user = fallbackUsers.find(u => u.id === userId);
        const { currentPassword, password } = req.body;
        if (user && user.password !== currentPassword) {
          return res.status(400).json({ status: 'fail', message: 'Incorrect current password.' });
        }
        if (!isValidPassword(password)) {
          return res.status(400).json({ status: 'fail', message: 'Password must be at least 6 characters long.' });
        }
        if (user) {
          user.password = password;
        }
        return res.json({ message: 'success', token });
      }
    }

    // Cart
    if (resource === 'cart') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`) : 'token_guest';
      if (!fallbackCarts[token]) {
        fallbackCarts[token] = { _id: 'cart_' + Date.now(), products: [], totalCartPrice: 0 };
      }
      const cart = fallbackCarts[token];

      // Handle apply coupon
      if (pathParts[3] === 'applyCoupon' && req.method === 'POST') {
        const { coupon } = req.body;
        if (!coupon || typeof coupon !== 'string' || coupon.trim() === '') {
          return res.status(400).json({ status: 'fail', message: 'Please provide a valid coupon code.' });
        }
        const subtotal = cart.products.reduce((acc: number, i: any) => acc + i.price * i.count, 0);
        cart.discount = 10;
        cart.totalCartPrice = Math.round(subtotal * 0.9);
        return res.json({
          status: 'success',
          message: 'Coupon applied successfully! (10% off)',
          data: cart
        });
      }

      if (req.method === 'GET') {
        return res.json({ status: 'success', numOfCartItems: cart.products.reduce((a: number, b: any) => a + b.count, 0), data: cart });
      }

      if (req.method === 'POST') {
        const { productId } = req.body;
        const prod = fallbackProducts.find(p => p._id === productId) || fallbackProducts[0];
        const existing = cart.products.find((i: any) => i.product._id === productId);
        if (existing) {
          existing.count += 1;
        } else {
          cart.products.push({ product: prod, count: 1, price: prod.priceAfterDiscount || prod.price });
        }
        const subtotal = cart.products.reduce((acc: number, i: any) => acc + i.price * i.count, 0);
        cart.totalCartPrice = cart.discount ? Math.round(subtotal * 0.9) : subtotal;
        return res.json({ status: 'success', message: 'Added to cart', numOfCartItems: cart.products.reduce((a: number, b: any) => a + b.count, 0), data: cart });
      }

      if (req.method === 'PUT') {
        const productId = pathParts[3];
        const { count } = req.body;
        if (count <= 0) {
          cart.products = cart.products.filter((i: any) => i.product._id !== productId);
        } else {
          const item = cart.products.find((i: any) => i.product._id === productId);
          if (item) {
            item.count = count;
          }
        }
        const subtotal = cart.products.reduce((acc: number, i: any) => acc + i.price * i.count, 0);
        cart.totalCartPrice = (cart.products.length > 0 && cart.discount) ? Math.round(subtotal * 0.9) : subtotal;
        return res.json({ status: 'success', numOfCartItems: cart.products.reduce((a: number, b: any) => a + b.count, 0), data: cart });
      }

      if (req.method === 'DELETE') {
        const itemId = pathParts[3];
        if (itemId) {
          cart.products = cart.products.filter((i: any) => i.product._id !== itemId);
        } else {
          cart.products = [];
          cart.discount = undefined;
        }
        const subtotal = cart.products.reduce((acc: number, i: any) => acc + i.price * i.count, 0);
        cart.totalCartPrice = (cart.products.length > 0 && cart.discount) ? Math.round(subtotal * 0.9) : subtotal;
        return res.json({ status: 'success', numOfCartItems: cart.products.reduce((a: number, b: any) => a + b.count, 0), data: cart });
      }
    }

    // Wishlist
    if (resource === 'wishlist') {
      const authHeader = req.headers.authorization || '';
      const token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`) : 'token_guest';
      if (!fallbackWishlists[token]) fallbackWishlists[token] = [];
      const list = fallbackWishlists[token];
      if (req.method === 'GET') {
        const wishProds = fallbackProducts.filter(p => list.includes(p._id));
        return res.json({ status: 'success', count: wishProds.length, data: wishProds });
      }
      if (req.method === 'POST') {
        const { productId } = req.body;
        if (!list.includes(productId)) list.push(productId);
        return res.json({ status: 'success', data: list });
      }
      if (req.method === 'DELETE') {
        const productId = pathParts[3];
        fallbackWishlists[token] = list.filter((id: string) => id !== productId);
        return res.json({ status: 'success', data: fallbackWishlists[token] });
      }
    }

    // Orders
    if (resource === 'orders') {
      if (req.method === 'GET') {
        return res.json({ results: fallbackOrders.length, data: fallbackOrders });
      }
      if (req.method === 'DELETE') {
        fallbackOrders = [];
        return res.json({ status: 'success', message: 'All orders cleared', data: [] });
      }
      if (req.method === 'POST') {
        const authHeader = req.headers.authorization || '';
        const token = authHeader ? (authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`) : 'token_guest';
        const cartId = pathParts[3] || (pathParts[2] === 'checkout-session' ? pathParts[4] : undefined);
        
        let userCart = fallbackCarts[token];
        if (!userCart && cartId) {
          userCart = Object.values(fallbackCarts).find((c: any) => c._id === cartId);
        }

        let orderItems: any[] = [];
        let orderPrice = 0;

        if (userCart && userCart.products.length > 0) {
          orderItems = [...userCart.products];
          orderPrice = userCart.totalCartPrice;
          userCart.products = [];
          userCart.totalCartPrice = 0;
          userCart.discount = undefined;
        } else {
          orderItems = [{ product: fallbackProducts[0], count: 1, price: 240 }];
          orderPrice = 240;
        }

        const newOrd = {
          _id: 'ord_' + Date.now(),
          cartItems: orderItems,
          totalOrderPrice: orderPrice,
          shippingAddress: req.body.shippingAddress || { details: 'Cairo', city: 'Cairo', phone: '01012345678' },
          paymentMethodType: endpoint.includes('checkout-session') ? 'card' : 'cash',
          isPaid: endpoint.includes('checkout-session'),
          isDelivered: false,
          createdAt: new Date().toISOString(),
        };
        fallbackOrders.unshift(newOrd);
        return res.json({
          status: 'success',
          session: { url: '/orders?success=true' },
          data: newOrd,
        });
      }
    }

    return res.status(500).json({ status: 'fail', message: 'API request failed and fallback unavailable' });
  }
});

// Vite middleware for development
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

app.use(vite.middlewares);

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FreshCart server running on http://localhost:${PORT}`);
});
