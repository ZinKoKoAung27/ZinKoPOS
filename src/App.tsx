/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  TrendingUp, 
  DollarSign, 
  Tag, 
  Image as ImageIcon,
  Loader2,
  X,
  ChevronRight,
  ArrowRight,
  Menu,
  ShoppingBag,
  Upload,
  Moon,
  Sun,
  Languages,
  Globe,
  LogOut,
  Settings as SettingsIcon,
  Users,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { collection, doc, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { useFirebaseSync } from './firebase-hooks';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

interface Product {
  id: string;
  name: string;
  cost: number;
  price: number;
  stock: number;
  image?: string;
  category: string;
  ram?: string;
  storage?: string;
  color?: string;
}

interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  cost: number;
}

interface Sale {
  id: string;
  timestamp: number;
  items: SaleItem[];
  totalAmount: number;
  totalCost: number;
  profit: number;
}

// --- Constants ---

const DEFAULT_CATEGORIES = ['General', 'Electronics', 'Food', 'Clothing', 'Home', 'Beauty'];
const ASPECT_RATIOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];
const IMAGE_SIZES = ["1K", "2K", "4K"];

const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    products: 'Products',
    pos: 'POS',
    history: 'History',
    totalSales: 'Total Sales',
    totalCost: 'Total Cost',
    totalProfit: 'Total Profit',
    inventoryValue: 'Inventory Value',
    recentSales: 'Recent Sales',
    lowStock: 'Low Stock Alerts',
    addProduct: 'Add Product',
    searchProducts: 'Search products...',
    allCategories: 'All Categories',
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    cart: 'Shopping Cart',
    clearAll: 'Clear All',
    subtotal: 'Subtotal',
    tax: 'Tax',
    total: 'Total',
    checkout: 'Checkout',
    emptyCart: 'Your cart is empty',
    productName: 'Product Name',
    cost: 'Cost',
    price: 'Price',
    stock: 'Stock',
    category: 'Category',
    productImage: 'Product Image',
    noImage: 'No image selected',
    uploadDevice: 'Upload from Device',
    aiGenerator: 'AI Image Generator',
    aspectRatio: 'Aspect Ratio',
    size: 'Size',
    generateAI: 'Generate with Gemini',
    saveProduct: 'Save Product',
    generating: 'Generating with AI...',
    profit: 'Profit',
    items: 'Items',
    date: 'Date',
    noSales: 'No sales recorded yet.',
    noProducts: 'No products found. Add some to get started!',
    alertName: 'Please enter product name first.',
    alertSize: 'Image size should be less than 10MB.',
    settings: 'Settings',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    mm: 'Myanmar',
    en: 'English',
    sale: 'Sale',
    noSalesYet: 'No sales yet',
    left: 'left',
    allItemsInStock: 'All items in stock',
    inStock: 'in stock',
    noProductsFound: 'No products found',
    inventory: 'Inventory',
    product: 'Product',
    profitUnit: 'Profit/Unit',
    actions: 'Actions',
    noProductsInventory: 'No products in inventory',
    salesHistory: 'Sales History',
    order: 'Order',
    noSalesHistory: 'No sales history found',
    totalOrders: 'Total Orders',
    viewAll: 'View All',
    restock: 'Restock',
    addStock: 'Add Stock',
    quantityToAdd: 'Quantity to add',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loginTitle: 'Welcome Back',
    enterUsername: 'Enter Username',
    enterPassword: 'Enter Password',
    login: 'Login',
    incorrectCredentials: 'Incorrect username or password. Please try again.',
    logout: 'Logout',
    adminSettings: 'Admin Settings',
    changeUsername: 'Change Username',
    changePassword: 'Change Password',
    newUsername: 'New Username',
    newPassword: 'New Password',
    saveChanges: 'Save Changes',
    credentialsUpdated: 'Credentials updated successfully',
    forgotPassword: 'Forgot Password?',
    recoveryCode: 'Recovery Code',
    resetCredentials: 'Reset Credentials',
    credentialsResetSuccess: 'Credentials reset to admin / admin123 successfully.',
    invalidRecoveryCode: 'Invalid recovery code.',
    backToLogin: 'Back to Login',
    enterRecoveryCode: 'Enter recovery code to reset credentials',
    staffAccounts: 'Staff Accounts',
    addStaff: 'Add Staff',
    staffUsername: 'Staff Username',
    staffPassword: 'Staff Password',
    noStaffAccounts: 'No staff accounts yet.',
    deleteStaff: 'Delete Staff',
    staffAdded: 'Staff account added successfully',
    staffDeleted: 'Staff account deleted',
    role: 'Role',
    admin: 'Admin',
    staff: 'Staff',
    allMonths: 'All Months',
    month: 'Month',
    deleteSale: 'Delete Sale?',
    deleteSaleConfirm: 'Are you sure you want to delete this sale? The items will be returned to stock.',
    cancel: 'Cancel',
    delete: 'Delete'
  },
  mm: {
    dashboard: 'ပင်မစာမျက်နှာ',
    products: 'ပစ္စည်းများ',
    pos: 'အရောင်းဆိုင်',
    history: 'အရောင်းမှတ်တမ်း',
    totalSales: 'စုစုပေါင်းရောင်းရငွေ',
    totalCost: 'စုစုပေါင်းရင်းနှီးငွေ',
    totalProfit: 'စုစုပေါင်းအမြတ်ငွေ',
    inventoryValue: 'ပစ္စည်းတန်ဖိုးစုစုပေါင်း',
    recentSales: 'လတ်တလောအရောင်းများ',
    lowStock: 'လက်ကျန်နည်းနေသောပစ္စည်းများ',
    addProduct: 'ပစ္စည်းအသစ်ထည့်ရန်',
    searchProducts: 'ပစ္စည်းရှာဖွေရန်...',
    allCategories: 'အမျိုးအစားအားလုံး',
    addToCart: 'ခြင်းတောင်းထဲထည့်ရန်',
    outOfStock: 'ပစ္စည်းပြတ်နေသည်',
    cart: 'ဈေးဝယ်ခြင်းတောင်း',
    clearAll: 'အားလုံးဖျက်ရန်',
    subtotal: 'စုစုပေါင်း',
    tax: 'အခွန်',
    total: 'စုစုပေါင်းကျသင့်ငွေ',
    checkout: 'ငွေရှင်းမည်',
    emptyCart: 'ခြင်းတောင်းထဲတွင် ဘာမှမရှိသေးပါ',
    productName: 'ပစ္စည်းအမည်',
    cost: 'မူလတန်ဖိုး',
    price: 'ရောင်းဈေး',
    stock: 'လက်ကျန်',
    category: 'အမျိုးအစား',
    productImage: 'ပစ္စည်းပုံ',
    noImage: 'ပုံမရွေးရသေးပါ',
    uploadDevice: 'စက်ထဲမှပုံတင်ရန်',
    aiGenerator: 'AI ဖြင့်ပုံထုတ်ရန်',
    aspectRatio: 'ပုံချိုး',
    size: 'အရွယ်အစား',
    generateAI: 'Gemini ဖြင့်ပုံထုတ်မည်',
    saveProduct: 'ပစ္စည်းသိမ်းဆည်းမည်',
    generating: 'AI ဖြင့်ပုံထုတ်နေသည်...',
    profit: 'အမြတ်',
    items: 'ခုရေ',
    date: 'နေ့စွဲ',
    noSales: 'အရောင်းမှတ်တမ်း မရှိသေးပါ။',
    noProducts: 'ပစ္စည်းများ မရှိသေးပါ။ ပစ္စည်းအသစ်ထည့်ပါ။',
    alertName: 'ပစ္စည်းအမည် အရင်ထည့်ပေးပါ။',
    alertSize: 'ပုံအရွယ်အစား ၁၀MB ထက်မကျော်ရပါ။',
    settings: 'ဆက်တင်များ',
    darkMode: 'အမှောင်မုဒ်',
    lightMode: 'အလင်းမုဒ်',
    language: 'ဘာသာစကား',
    mm: 'မြန်မာ',
    en: 'အင်္ဂလိပ်',
    sale: 'အရောင်း',
    noSalesYet: 'အရောင်းမှတ်တမ်း မရှိသေးပါ',
    left: 'ခုကျန်',
    allItemsInStock: 'ပစ္စည်းအားလုံး လက်ကျန်ရှိပါသည်',
    inStock: 'ခုရှိသည်',
    noProductsFound: 'ပစ္စည်းရှာမတွေ့ပါ',
    inventory: 'ပစ္စည်းစာရင်း',
    product: 'ပစ္စည်း',
    profitUnit: 'အမြတ်/ခု',
    actions: 'လုပ်ဆောင်ချက်များ',
    noProductsInventory: 'ပစ္စည်းစာရင်းထဲတွင် ဘာမှမရှိသေးပါ',
    salesHistory: 'အရောင်းမှတ်တမ်းများ',
    order: 'အော်ဒါ',
    noSalesHistory: 'အရောင်းမှတ်တမ်း ရှာမတွေ့ပါ',
    totalOrders: 'စုစုပေါင်းအော်ဒါများ',
    viewAll: 'အားလုံးကြည့်ရန်',
    restock: 'အသစ်ဖြည့်မည်',
    addStock: 'ပစ္စည်းဖြည့်ရန်',
    quantityToAdd: 'ထည့်မည့်အရေအတွက်',
    cancel: 'ပယ်ဖျက်မည်',
    confirm: 'အတည်ပြုမည်',
    loginTitle: 'ပြန်လည်ကြိုဆိုပါတယ်',
    enterUsername: 'အသုံးပြုသူအမည်ထည့်ပါ',
    enterPassword: 'စကားဝှက်ထည့်ပါ',
    login: 'ဝင်မည်',
    incorrectCredentials: 'အသုံးပြုသူအမည် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။ ပြန်လည်ကြိုးစားကြည့်ပါ။',
    logout: 'အကောင့်ထွက်မည်',
    adminSettings: 'စီမံခန့်ခွဲသူ ဆက်တင်များ',
    changeUsername: 'အသုံးပြုသူအမည်ပြောင်းရန်',
    changePassword: 'စကားဝှက်ပြောင်းရန်',
    newUsername: 'အသုံးပြုသူအမည်သစ်',
    newPassword: 'စကားဝှက်သစ်',
    saveChanges: 'ပြောင်းလဲမှုများကိုသိမ်းဆည်းမည်',
    credentialsUpdated: 'အသုံးပြုသူအမည်နှင့်စကားဝှက်ကို အောင်မြင်စွာပြောင်းလဲပြီးပါပြီ',
    forgotPassword: 'စကားဝှက်မေ့နေပါသလား?',
    recoveryCode: 'ပြန်လည်ရယူရန် ကုဒ်',
    resetCredentials: 'အကောင့်အချက်အလက်များကို မူလအတိုင်းပြန်ထားမည်',
    credentialsResetSuccess: 'အကောင့်အချက်အလက်များကို admin / admin123 သို့ အောင်မြင်စွာ ပြန်လည်သတ်မှတ်ပြီးပါပြီ။',
    invalidRecoveryCode: 'ပြန်လည်ရယူရန် ကုဒ် မှားယွင်းနေပါသည်။',
    backToLogin: 'နောက်သို့',
    enterRecoveryCode: 'အကောင့်အချက်အလက်များ ပြန်လည်ရယူရန် ကုဒ်ထည့်ပါ',
    staffAccounts: 'ဝန်ထမ်း အကောင့်များ',
    addStaff: 'ဝန်ထမ်းအသစ်ထည့်မည်',
    staffUsername: 'ဝန်ထမ်း အမည်',
    staffPassword: 'ဝန်ထမ်း စကားဝှက်',
    noStaffAccounts: 'ဝန်ထမ်း အကောင့်များ မရှိသေးပါ',
    deleteStaff: 'ဖျက်မည်',
    staffAdded: 'ဝန်ထမ်းအကောင့် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ',
    staffDeleted: 'ဝန်ထမ်းအကောင့် ဖျက်လိုက်ပါပြီ',
    role: 'ရာထူး',
    admin: 'စီမံခန့်ခွဲသူ',
    staff: 'ဝန်ထမ်း',
    allMonths: 'လအားလုံး',
    month: 'လ',
    deleteSale: 'အရောင်းမှတ်တမ်း ဖျက်မည်',
    deleteSaleConfirm: 'ဒီအရောင်းမှတ်တမ်းကို ဖျက်မှာ သေချာပြီလား? ရောင်းရပစ္စည်းအရေအတွက်တွေ စာရင်းထဲ ပြန်ဝင်သွားပါမယ်။',
    cancel: 'မလုပ်တော့ပါ',
    delete: 'ဖျက်မည်'
  }
};

// --- Components ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('pos_auth');
    return saved ? JSON.parse(saved) : false;
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryError, setRecoveryError] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const [adminCredentials, setAdminCredentials] = useState({ username: 'admin', password: 'admin123' });
  const [currentUser, setCurrentUser] = useState<{ username: string, role: 'admin' | 'staff' } | null>(() => {
    const saved = localStorage.getItem('pos_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [staffAccounts, setStaffAccounts] = useState<any[]>([]);
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const [staffActionSuccess, setStaffActionSuccess] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'pos' | 'history' | 'settings'>('pos');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pos_dark_mode');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [language, setLanguage] = useState<'en' | 'mm'>(() => {
    const saved = localStorage.getItem('pos_language');
    return (saved as 'en' | 'mm') || 'mm';
  });

  const t = TRANSLATIONS[language];

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  
  // Cart state
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  
  // Modal states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProductId, setRestockProductId] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<string>('');

  
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Sync data with Firebase
  useFirebaseSync(setProducts, setSales, setCategories, setStaffAccounts, setAdminCredentials);

  // Persist data
  useEffect(() => {
    localStorage.setItem('pos_dark_mode', JSON.stringify(darkMode));
    console.log('Dark mode changed:', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('pos_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('pos_auth', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pos_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pos_current_user');
    }
  }, [currentUser]);

  // --- Calculations ---

  const stats = useMemo(() => {
    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = sales.reduce((sum, s) => sum + s.totalCost, 0);
    const totalProfit = totalSales - totalCost;
    const inventoryValue = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
    
    return { totalSales, totalCost, totalProfit, inventoryValue };
  }, [sales, products]);

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([id, qty]) => {
      const product = products.find(p => p.id === id);
      return { product, qty };
    }).filter(item => item.product !== undefined) as { product: Product, qty: number }[];
  }, [cart, products]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  }, [cartItems]);

  const filteredSales = useMemo(() => {
    if (selectedMonth === 'all') return sales;
    return sales.filter(sale => {
      const date = new Date(sale.timestamp);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthStr === selectedMonth;
    });
  }, [sales, selectedMonth]);

  const historyStats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = filteredSales.reduce((sum, s) => sum + s.totalCost, 0);
    const totalProfit = totalSales - totalCost;
    return { totalSales, totalProfit };
  }, [filteredSales]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    sales.forEach(sale => {
      const date = new Date(sale.timestamp);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [sales]);

  // --- Handlers ---

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= (cart[productId] || 0)) return;
    
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId] -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const checkout = async () => {
    if (cartItems.length === 0) return;

    const totalAmount = cartTotal;
    const totalCost = cartItems.reduce((sum, item) => sum + (item.product.cost * item.qty), 0);
    const profit = totalAmount - totalCost;

    const newSaleId = Math.random().toString(36).substr(2, 9);
    const newSale: Sale = {
      id: newSaleId,
      timestamp: Date.now(),
      items: cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.qty,
        price: item.product.price,
        cost: item.product.cost
      })),
      totalAmount,
      totalCost,
      profit
    };

    try {
      const batch = writeBatch(db);
      
      // Add sale
      batch.set(doc(db, 'sales', newSaleId), newSale);
      
      // Update stock
      cartItems.forEach(item => {
        const productRef = doc(db, 'products', item.product.id);
        batch.update(productRef, {
          stock: item.product.stock - item.qty
        });
      });

      await batch.commit();
      
      setCart({});
      alert('ရောင်းချမှု အောင်မြင်ပါသည်။');
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Error during checkout. Please try again.");
    }
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProductId = Math.random().toString(36).substr(2, 9);
    const newProduct: Product = {
      ...product,
      id: newProductId
    };
    try {
      await setDoc(doc(db, 'products', newProductId), newProduct);
      setIsAddProductOpen(false);
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product. Please try again.");
    }
  };

  const updateProduct = async (product: Omit<Product, 'id'>) => {
    if (!editingProduct) return;
    try {
      await updateDoc(doc(db, 'products', editingProduct.id), product);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product. Please try again.");
    }
  };

  // --- Render Helpers ---

  const normalizeText = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  const searchTerms = searchQuery.trim().toLowerCase().split(/\s+/).map(normalizeText).filter(t => t.length > 0);

  const filteredProducts = products.filter(p => {
    const searchableText = normalizeText(
      `${p.name} ${p.category} ${p.ram || ''} ${p.storage || ''} ${p.color || ''} ${p.price}`
    );

    return searchTerms.every(term => searchableText.includes(term));
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden relative perspective-1000">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" />
          <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse delay-1000" />
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[100px] animate-pulse delay-2000" />
        </div>

        {/* Floating Small 3D Cubes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none perspective-1000 hidden lg:block">
          {/* Cube 1 - Medium (Purple/Indigo) */}
          <motion.div 
            animate={{ rotateX: 360, rotateY: 360, y: [0, -30, 0] }}
            transition={{ 
              rotateX: { duration: 8, repeat: Infinity, ease: "linear" },
              rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute right-[15%] top-[20%] w-24 h-24 [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 bg-purple-500/40 backdrop-blur-sm border border-white/20 [transform:translateZ(48px)]" />
            <div className="absolute inset-0 bg-indigo-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(180deg)_translateZ(48px)]" />
            <div className="absolute inset-0 bg-violet-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(90deg)_translateZ(48px)]" />
            <div className="absolute inset-0 bg-fuchsia-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(-90deg)_translateZ(48px)]" />
            <div className="absolute inset-0 bg-purple-400/40 backdrop-blur-sm border border-white/20 [transform:rotateX(90deg)_translateZ(48px)]" />
            <div className="absolute inset-0 bg-indigo-400/40 backdrop-blur-sm border border-white/20 [transform:rotateX(-90deg)_translateZ(48px)]" />
          </motion.div>

          {/* Cube 2 - Small (Blue/Cyan) */}
          <motion.div 
            animate={{ rotateX: -360, rotateY: 360, y: [0, 40, 0] }}
            transition={{ 
              rotateX: { duration: 12, repeat: Infinity, ease: "linear" },
              rotateY: { duration: 15, repeat: Infinity, ease: "linear" },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }
            }}
            className="absolute right-[25%] top-[45%] w-16 h-16 [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 bg-blue-500/40 backdrop-blur-sm border border-white/20 [transform:translateZ(32px)]" />
            <div className="absolute inset-0 bg-cyan-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(180deg)_translateZ(32px)]" />
            <div className="absolute inset-0 bg-sky-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(90deg)_translateZ(32px)]" />
            <div className="absolute inset-0 bg-teal-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(-90deg)_translateZ(32px)]" />
            <div className="absolute inset-0 bg-blue-400/40 backdrop-blur-sm border border-white/20 [transform:rotateX(90deg)_translateZ(32px)]" />
            <div className="absolute inset-0 bg-cyan-400/40 backdrop-blur-sm border border-white/20 [transform:rotateX(-90deg)_translateZ(32px)]" />
          </motion.div>

          {/* Cube 3 - Tiny (Pink/Rose) */}
          <motion.div 
            animate={{ rotateX: 360, rotateY: -360, y: [0, -20, 0] }}
            transition={{ 
              rotateX: { duration: 6, repeat: Infinity, ease: "linear" },
              rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
              y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
            }}
            className="absolute right-[8%] top-[60%] w-12 h-12 [transform-style:preserve-3d]"
          >
            <div className="absolute inset-0 bg-pink-500/40 backdrop-blur-sm border border-white/20 [transform:translateZ(24px)]" />
            <div className="absolute inset-0 bg-rose-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(180deg)_translateZ(24px)]" />
            <div className="absolute inset-0 bg-red-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(90deg)_translateZ(24px)]" />
            <div className="absolute inset-0 bg-orange-500/40 backdrop-blur-sm border border-white/20 [transform:rotateY(-90deg)_translateZ(24px)]" />
            <div className="absolute inset-0 bg-pink-400/40 backdrop-blur-sm border border-white/20 [transform:rotateX(90deg)_translateZ(24px)]" />
            <div className="absolute inset-0 bg-rose-400/40 backdrop-blur-sm border border-white/20 [transform:rotateX(-90deg)_translateZ(24px)]" />
          </motion.div>
        </div>

        {/* 3D Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl blur-xl transform -rotate-6 scale-105 opacity-50" />
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            
            {/* Glossy reflection effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            <div className="flex justify-center mb-8 relative">
              <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <ShoppingCart size={32} className="drop-shadow-md" />
              </div>
              <div className="absolute -bottom-2 w-16 h-4 bg-black/30 blur-md rounded-full" />
            </div>

            <h2 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">
              {isForgotPassword ? t.forgotPassword : "Welcome Back"}
            </h2>
            <p className="text-center text-slate-400 mb-8 text-sm">
              {isForgotPassword ? "Enter your recovery code to reset" : "Sign in to access your POS dashboard"}
            </p>
            
            {isForgotPassword ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (recoveryCodeInput === 'pos-reset-123') {
                  const defaultCredentials = { username: 'admin', password: 'admin123' };
                  try {
                    await setDoc(doc(db, 'settings', 'general'), { adminCredentials: defaultCredentials }, { merge: true });
                    setRecoverySuccess(true);
                    setRecoveryError(false);
                    setTimeout(() => {
                      setRecoverySuccess(false);
                      setIsForgotPassword(false);
                      setRecoveryCodeInput('');
                    }, 3000);
                  } catch (error) {
                    console.error("Error resetting credentials:", error);
                  }
                } else {
                  setRecoveryError(true);
                }
              }} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider ml-1">
                    {t.enterRecoveryCode}
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover/input:opacity-40 transition-opacity" />
                    <input
                      type="text"
                      value={recoveryCodeInput}
                      onChange={(e) => setRecoveryCodeInput(e.target.value)}
                      className="relative w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                      autoFocus
                    />
                  </div>
                  {recoveryError && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-red-400 flex items-center gap-1 font-medium bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                      <AlertCircle size={14} />
                      {t.invalidRecoveryCode}
                    </motion.p>
                  )}
                  {recoverySuccess && (
                    <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 size={14} />
                      {t.credentialsResetSuccess}
                    </motion.p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {t.resetCredentials}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setRecoveryCodeInput('');
                    setRecoveryError(false);
                    setRecoverySuccess(false);
                  }}
                  className="w-full py-3.5 bg-white/5 text-slate-300 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/5"
                >
                  {t.backToLogin}
                </button>
              </form>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (usernameInput === adminCredentials.username && passwordInput === adminCredentials.password) {
                  setIsAuthenticated(true);
                  setCurrentUser({ username: usernameInput, role: 'admin' });
                  setLoginError(false);
                  setUsernameInput('');
                  setPasswordInput('');
                  setActiveTab('dashboard');
                } else {
                  const staff = staffAccounts.find(s => s.username === usernameInput && s.password === passwordInput);
                  if (staff) {
                    setIsAuthenticated(true);
                    setCurrentUser({ username: usernameInput, role: 'staff' });
                    setLoginError(false);
                    setUsernameInput('');
                    setPasswordInput('');
                    setActiveTab('pos');
                  } else {
                    setLoginError(true);
                  }
                }
              }} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider ml-1">
                      {t.enterUsername}
                    </label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover/input:opacity-40 transition-opacity" />
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="relative w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                        placeholder="username"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider ml-1">
                      {t.enterPassword}
                    </label>
                    <div className="relative group/input">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl blur opacity-20 group-hover/input:opacity-40 transition-opacity" />
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="relative w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-white placeholder:text-slate-600 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <motion.p 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs text-red-400 flex items-center gap-2 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20"
                    >
                      <AlertCircle size={16} className="shrink-0" />
                      {t.incorrectCredentials}
                    </motion.p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs font-medium text-slate-400 hover:text-white transition-colors hover:underline decoration-indigo-500 decoration-2 underline-offset-4"
                  >
                    {t.forgotPassword}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center gap-2">
                    {t.login}
                    <ArrowRight size={18} />
                  </span>
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative", darkMode && "dark")}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-white/10 flex flex-col z-50 transition-transform duration-300 lg:relative lg:translate-x-0 shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-white border border-white/30 shadow-lg">
              <ShoppingCart size={18} />
            </div>
            Z SHOP POS
          </h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/10 rounded-full text-white/70">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {(currentUser?.role === 'admin') && (
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label={t.dashboard} 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            />
          )}
          <SidebarItem 
            icon={<ShoppingCart size={20} />} 
            label={t.pos} 
            active={activeTab === 'pos'} 
            onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }} 
          />
          {(currentUser?.role === 'admin') && (
            <SidebarItem 
              icon={<Package size={20} />} 
              label={t.products} 
              active={activeTab === 'products'} 
              onClick={() => { setActiveTab('products'); setIsSidebarOpen(false); }} 
            />
          )}
          <SidebarItem 
            icon={<History size={20} />} 
            label={t.history} 
            active={activeTab === 'history'} 
            onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} 
          />
          {(currentUser?.role === 'admin') && (
            <SidebarItem 
              icon={<SettingsIcon size={20} />} 
              label={t.adminSettings} 
              active={activeTab === 'settings'} 
              onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} 
            />
          )}
        </nav>

        <div className="p-4 space-y-4 border-t border-white/10">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2">{t.settings}</p>
            
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-medium text-white/70 flex items-center gap-2">
                {darkMode ? <Moon size={14} /> : <Sun size={14} />}
                {darkMode ? t.darkMode : t.lightMode}
              </span>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  "w-10 h-5 rounded-full relative transition-colors duration-200",
                  darkMode ? "bg-slate-500" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 shadow-md",
                  darkMode ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs font-medium text-white/70 flex items-center gap-2">
                <Globe size={14} />
                {t.language}
              </span>
              <div className="flex bg-white/10 rounded-lg p-0.5">
                <button 
                  onClick={() => setLanguage('mm')}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                    language === 'mm' ? "bg-white text-slate-900 shadow-lg" : "text-white/40"
                  )}
                >
                  MM
                </button>
                <button 
                  onClick={() => setLanguage('en')}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                    language === 'en' ? "bg-white text-indigo-900 shadow-lg" : "text-white/40"
                  )}
                >
                  EN
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">
              {currentUser?.role === 'staff' ? t.totalSales : t.totalProfit}
            </p>
            <p className="text-lg font-bold text-white">
              {currentUser?.role === 'staff' ? stats.totalSales.toLocaleString() : stats.totalProfit.toLocaleString()} MMK
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setCurrentUser(null);
              localStorage.removeItem('pos_auth');
              localStorage.removeItem('pos_current_user');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-100 rounded-xl transition-colors text-sm font-medium border border-red-500/30"
          >
            <LogOut size={16} />
            {t.logout}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full bg-slate-50 dark:bg-slate-950">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden text-slate-600 dark:text-slate-400"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white capitalize hidden sm:block">
              {t[activeTab as keyof typeof t] || activeTab}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 transition-colors"
              title={darkMode ? t.lightMode : t.darkMode}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative flex-1 max-w-xs sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder={t.searchProducts} 
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 w-full transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-700">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{currentUser?.username}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{currentUser?.role === 'admin' ? t.admin : t.staff}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
            </div>
            {activeTab === 'pos' && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full lg:hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ShoppingBag size={24} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {cartItems.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 lg:space-y-8 h-full overflow-y-auto p-4 lg:p-8"
              >
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                  <StatCard title={t.totalSales} value={stats.totalSales} icon={<DollarSign size={24} />} color="sky" unit="MMK" />
                  <StatCard title={t.totalProfit} value={stats.totalProfit} icon={<TrendingUp size={24} />} color="emerald" unit="MMK" />
                  <StatCard title={t.inventoryValue} value={stats.inventoryValue} icon={<Package size={24} />} color="amber" unit="MMK" />
                  <StatCard title={t.totalOrders} value={sales.length} icon={<ShoppingBag size={24} />} color="violet" unit={t.items} />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:gap-8">
                  <div className="glass-panel p-8 rounded-none neo-3d border-t-4 border-rose-500 shadow-[0_30px_60px_rgba(244,63,94,0.15)] bg-gradient-to-br from-rose-500/5 to-transparent">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="p-2 bg-rose-500 rounded-none text-white shadow-lg">
                          <AlertCircle size={20} />
                        </div>
                        {t.lowStock}
                      </h3>
                      <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-none uppercase tracking-widest">
                        {products.filter(p => p.stock < 10).length} {t.items}
                      </span>
                    </div>
                    <div className="space-y-5">
                      {products.filter(p => p.stock < 10).map(product => (
                        <div key={product.id} className="flex items-center justify-between p-5 bg-white/80 dark:bg-slate-800/80 rounded-none neo-3d hover:neo-3d-pressed transition-all duration-300 border border-white/20">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-900 rounded-none overflow-hidden shrink-0 shadow-inner neo-3d">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-700"><ImageIcon size={24} /></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-900 dark:text-white truncate">{product.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{product.category}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <div className={cn(
                              "px-4 py-2 rounded-none font-black text-sm neo-3d-pressed",
                              product.stock === 0 ? "bg-red-500/10 text-red-600" : "bg-rose-500/10 text-rose-600"
                            )}>
                              {product.stock} {t.left}
                            </div>
                          </div>
                        </div>
                      ))}
                      {products.filter(p => p.stock < 10).length === 0 && (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 neo-3d">
                            <CheckCircle2 className="text-emerald-500" size={32} />
                          </div>
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold italic">{t.allItemsInStock}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'pos' && (
              <motion.div 
                key="pos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full overflow-hidden p-4 lg:p-8"
              >
                {/* Product Selection */}
                <div className="flex-1 space-y-6 overflow-y-auto pr-0 lg:pr-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
                    {filteredProducts.map(product => (
                      <button 
                        key={product.id}
                        onClick={() => addToCart(product.id)}
                        disabled={product.stock === 0}
                        className={cn(
                          "bg-white dark:bg-slate-800 p-2 rounded-2xl border-2 border-b-[4px] border-r-[4px] border-slate-300 dark:border-slate-700 text-left group relative flex flex-col transition-all duration-200",
                          product.stock > 0 && "hover:-translate-y-0.5 hover:translate-x-[-0.5px] hover:border-b-[6px] hover:border-r-[6px] hover:border-indigo-300 dark:hover:border-indigo-600 active:border-b-[2px] active:border-r-[2px] active:translate-y-[2px] active:translate-x-[2px]",
                          product.stock === 0 && "opacity-60 grayscale cursor-not-allowed border-b-[2px] border-r-[2px] translate-y-[2px] translate-x-[2px]"
                        )}
                      >
                        <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-xl mb-2 overflow-hidden relative w-full border-2 border-slate-200 dark:border-slate-800">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                              <ImageIcon size={24} />
                            </div>
                          )}
                        </div>
                        <div className="px-0.5 pb-0.5 w-full flex flex-col flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm mb-1 truncate tracking-tight">{product.name}</h4>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {product.ram && (
                              <span className="text-[9px] font-medium px-1 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                                {product.ram}
                              </span>
                            )}
                            {product.storage && (
                              <span className="text-[9px] font-medium px-1 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                                {product.storage}
                              </span>
                            )}
                            {product.color && (
                              <span className="text-[9px] font-medium px-1 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">
                                {product.color}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-1 mt-auto">
                            <p className="text-slate-700 dark:text-slate-300 font-black text-xs sm:text-sm">{product.price.toLocaleString()} MMK</p>
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded-md font-bold w-fit border",
                              product.stock > 10 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" 
                                : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                            )}>
                              {product.stock} {t.inStock}
                            </span>
                          </div>
                        </div>
                        {product.stock === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px] rounded-2xl">
                            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] lg:text-xs px-4 py-1.5 rounded-lg font-black uppercase tracking-widest shadow-sm">{t.outOfStock}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                      <Package className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
                      <p className="text-slate-500 dark:text-slate-400">{t.noProductsFound}</p>
                    </div>
                  )}
                </div>

                {/* Cart (Desktop) */}
                <div className="hidden lg:flex w-72 xl:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex-col overflow-hidden shrink-0">
                  <CartContent 
                    cartItems={cartItems} 
                    cartTotal={cartTotal} 
                    onRemove={removeFromCart} 
                    onAdd={addToCart} 
                    onClear={() => setCart({})} 
                    onCheckout={checkout} 
                    t={t}
                  />
                </div>

                {/* Cart (Mobile/Tablet Modal) */}
                <AnimatePresence>
                  {isCartOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                      />
                      <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
                      >
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart size={20} className="text-slate-700 dark:text-slate-300" />
                            Current Order
                          </h3>
                          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                            <X size={20} />
                          </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <CartContent 
                            cartItems={cartItems} 
                            cartTotal={cartTotal} 
                            onRemove={removeFromCart} 
                            onAdd={addToCart} 
                            onClear={() => setCart({})} 
                            onCheckout={() => { checkout(); setIsCartOpen(false); }} 
                            t={t}
                          />
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div 
                key="products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.inventory}</h3>
                  <button 
                    onClick={() => setIsAddProductOpen(true)}
                    className="w-full sm:w-auto bg-slate-800 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-100 dark:shadow-none"
                  >
                    <Plus size={20} />
                    {t.addProduct}
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900/80 rounded-xl border-2 border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden backdrop-blur-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-200 dark:bg-slate-800/20 border-b-2 border-slate-300 dark:border-slate-700/50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{t.product}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{t.category}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{t.cost}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{t.price}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{t.stock}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">{t.profitUnit}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider text-right">{t.actions}</th>
                        </tr>
                      </thead>
                    <tbody className="divide-y-2 divide-slate-300 dark:divide-slate-800/60">
                        {products.map(product => (
                          <tr key={product.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-300 dark:border-slate-700">
                                  {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><ImageIcon size={20} /></div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-slate-900 dark:text-white truncate block max-w-[200px]">{product.name}</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {product.ram && <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">{product.ram}</span>}
                                    {product.storage && <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">{product.storage}</span>}
                                    {product.color && <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">{product.color}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700">
                                {product.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">{product.cost.toLocaleString()}</td>
                            <td className="px-6 py-4 text-slate-900 dark:text-white font-semibold text-sm">{product.price.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "font-semibold text-sm px-2.5 py-1 rounded-md inline-block min-w-[3rem] text-center",
                                product.stock < 10 
                                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50" 
                                  : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                              )}>
                                {product.stock}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                                +{(product.price - product.cost).toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => setEditingProduct(product)}
                                  className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-200 dark:border-indigo-800/50"
                                  title="Edit Product"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  onClick={() => setRestockProductId(product.id)}
                                  className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                                  title={t.restock}
                                >
                                  <Plus size={16} />
                                </button>
                                <button 
                                  onClick={async () => {
                                    try {
                                      await deleteDoc(doc(db, 'products', product.id));
                                    } catch (error) {
                                      console.error("Error deleting product:", error);
                                    }
                                  }}
                                  className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors border border-red-200 dark:border-red-800/50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
                  {products.length === 0 && (
                    <div className="text-center py-20">
                      <Package className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={64} />
                      <p className="text-slate-400 font-bold italic">{t.noProductsInventory}</p>
                    </div>
                  )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 h-full overflow-y-auto p-4 lg:p-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.salesHistory}</h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-none neo-3d text-sm font-bold text-slate-900 dark:text-white focus:ring-0 focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="all">{t.allMonths}</option>
                      {availableMonths.map(month => {
                        const [year, m] = month.split('-');
                        const date = new Date(parseInt(year), parseInt(m) - 1);
                        const monthName = date.toLocaleString(language === 'mm' ? 'my-MM' : 'en-US', { month: 'long', year: 'numeric' });
                        return <option key={month} value={month}>{monthName}</option>;
                      })}
                    </select>
                    <div className="glass-panel px-6 py-3 rounded-none neo-3d border-t border-indigo-500/20 flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{t.totalSales}:</span>
                      <span className="font-black text-slate-700 dark:text-slate-300 text-sm">{historyStats.totalSales.toLocaleString()} MMK</span>
                    </div>
                    {currentUser?.role === 'admin' && (
                      <div className="glass-panel px-6 py-3 rounded-none neo-3d border-t border-emerald-500/20 flex items-center gap-3">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{t.totalProfit}:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{historyStats.totalProfit.toLocaleString()} MMK</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredSales.map(sale => (
                    <div key={sale.id} className="glass-panel rounded-none neo-3d border-l-4 border-indigo-500 overflow-hidden group hover:-translate-y-0.5 transition-all duration-300">
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-none flex items-center justify-center text-slate-700 dark:text-slate-300 neo-3d-pressed">
                            <ShoppingBag size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 max-w-[150px] sm:max-w-md">
                              {sale.items.map((item, index) => (
                                <span key={index} className="text-sm font-black text-slate-900 dark:text-white tracking-tight inline-flex items-center gap-1">
                                  {item.name}
                                  {item.quantity > 1 && (
                                    <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">
                                      x{item.quantity}
                                    </span>
                                  )}
                                  {index < sale.items.length - 1 && <span className="text-slate-400 font-normal">,</span>}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{new Date(sale.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 px-4 hidden md:block">
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {t.order} #{sale.id}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{sale.totalAmount.toLocaleString()} MMK</p>
                            {currentUser?.role === 'admin' && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest">{t.profit}: +{sale.profit.toLocaleString()}</p>
                            )}
                          </div>
                          <button 
                            onClick={() => setSaleToDelete(sale.id)}
                            className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-none hover:bg-red-500 hover:text-white transition-all neo-3d"
                            title="Delete sale and restore stock"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredSales.length === 0 && (
                    <div className="text-center py-20 glass-panel rounded-none neo-3d">
                      <History className="mx-auto text-slate-200 dark:text-slate-800 mb-6" size={64} />
                      <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">{t.noSalesHistory}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 max-w-2xl mx-auto h-full overflow-y-auto p-4 lg:p-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg neo-3d">
                    <SettingsIcon size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{t.adminSettings}</h3>
                </div>

                <div className="glass-panel p-8 rounded-2xl neo-3d border-t-2 border-slate-500/20">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (newUsername && newPassword) {
                      const newCredentials = { username: newUsername, password: newPassword };
                      try {
                        await setDoc(doc(db, 'settings', 'general'), { adminCredentials: newCredentials }, { merge: true });
                        setSettingsSuccess(true);
                        setNewUsername('');
                        setNewPassword('');
                        setTimeout(() => setSettingsSuccess(false), 3000);
                      } catch (error) {
                        console.error("Error updating credentials:", error);
                      }
                    }
                  }} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                        {t.newUsername}
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white font-medium"
                        placeholder={adminCredentials.username}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                        {t.newPassword}
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white font-medium"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    
                    {settingsSuccess && (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={20} />
                        <p className="font-medium text-sm">{t.credentialsUpdated}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button 
                        type="submit"
                        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-lg neo-3d uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <SettingsIcon size={18} />
                        {t.saveChanges}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Staff Accounts Management */}
                <div className="glass-panel p-8 rounded-2xl neo-3d border-t-2 border-slate-500/20 mt-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300">
                      <Users size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{t.staffAccounts}</h3>
                  </div>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newStaffUsername || !newStaffPassword) return;
                    if (staffAccounts.some(s => s.username === newStaffUsername) || newStaffUsername === adminCredentials.username) {
                      alert('Username already exists');
                      return;
                    }
                    const newStaff = { username: newStaffUsername, password: newStaffPassword };
                    try {
                      await setDoc(doc(db, 'staffAccounts', Date.now().toString()), newStaff);
                      setNewStaffUsername('');
                      setNewStaffPassword('');
                      setStaffActionSuccess(t.staffAdded);
                      setTimeout(() => setStaffActionSuccess(''), 3000);
                    } catch (error) {
                      console.error("Error adding staff:", error);
                    }
                  }} className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">{t.staffUsername}</label>
                        <input
                          type="text"
                          value={newStaffUsername}
                          onChange={(e) => setNewStaffUsername(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">{t.staffPassword}</label>
                        <input
                          type="password"
                          value={newStaffPassword}
                          onChange={(e) => setNewStaffPassword(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-medium"
                          required
                        />
                      </div>
                    </div>
                    <button type="submit" className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors shadow-md flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Plus size={16} />
                      {t.addStaff}
                    </button>
                    {staffActionSuccess && (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium">
                        <CheckCircle2 size={16} />
                        {staffActionSuccess}
                      </p>
                    )}
                  </form>

                  <div className="space-y-3">
                    {staffAccounts.length === 0 ? (
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t.noStaffAccounts}</p>
                    ) : (
                      staffAccounts.map(staff => (
                        <div key={staff.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-lg">
                              {staff.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{staff.username}</p>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.staff}</p>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                await deleteDoc(doc(db, 'staffAccounts', staff.id));
                                setStaffActionSuccess(t.staffDeleted);
                                setTimeout(() => setStaffActionSuccess(''), 3000);
                              } catch (error) {
                                console.error("Error deleting staff:", error);
                              }
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title={t.deleteStaff}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProductOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New Product</h3>
                <button onClick={() => setIsAddProductOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <AddProductForm 
                  onAdd={addProduct} 
                  t={t}
                  categories={categories}
                  onAddCategory={async (newCategory) => {
                    try {
                      const newCategories = [...categories, newCategory];
                      await setDoc(doc(db, 'settings', 'general'), { categories: newCategories }, { merge: true });
                    } catch (error) {
                      console.error("Error adding category:", error);
                    }
                  }}
                  onDeleteCategory={async (categoryToDelete) => {
                    try {
                      const newCategories = categories.filter(c => c !== categoryToDelete);
                      await setDoc(doc(db, 'settings', 'general'), { categories: newCategories }, { merge: true });
                    } catch (error) {
                      console.error("Error deleting category:", error);
                    }
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Product</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <AddProductForm 
                  key={editingProduct.id}
                  initialData={editingProduct}
                  onAdd={updateProduct} 
                  t={t}
                  categories={categories}
                  onAddCategory={async (newCategory) => {
                    try {
                      const newCategories = [...categories, newCategory];
                      await setDoc(doc(db, 'settings', 'general'), { categories: newCategories }, { merge: true });
                    } catch (error) {
                      console.error("Error adding category:", error);
                    }
                  }}
                  onDeleteCategory={async (categoryToDelete) => {
                    try {
                      const newCategories = categories.filter(c => c !== categoryToDelete);
                      await setDoc(doc(db, 'settings', 'general'), { categories: newCategories }, { merge: true });
                    } catch (error) {
                      console.error("Error deleting category:", error);
                    }
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Modal */}
      <AnimatePresence>
        {restockProductId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setRestockProductId(null);
                setRestockQuantity('');
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-none shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800"
            >
              <div className="p-4 lg:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.addStock}</h3>
                <button 
                  onClick={() => {
                    setRestockProductId(null);
                    setRestockQuantity('');
                  }} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {products.find(p => p.id === restockProductId)?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.inStock}: {products.find(p => p.id === restockProductId)?.stock}
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.quantityToAdd}</label>
                    <input 
                      type="number" 
                      min="1"
                      value={restockQuantity}
                      onChange={e => setRestockQuantity(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white"
                      placeholder="e.g. 10"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 lg:p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setRestockProductId(null);
                    setRestockQuantity('');
                  }}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={async () => {
                    const qty = parseInt(restockQuantity);
                    if (qty > 0 && restockProductId) {
                      try {
                        const productRef = doc(db, 'products', restockProductId);
                        const product = products.find(p => p.id === restockProductId);
                        if (product) {
                          await updateDoc(productRef, { stock: product.stock + qty });
                        }
                        setRestockProductId(null);
                        setRestockQuantity('');
                      } catch (error) {
                        console.error("Error restocking product:", error);
                      }
                    }
                  }}
                  disabled={!restockQuantity || parseInt(restockQuantity) <= 0}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Delete Sale Modal */}
        {saleToDelete && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-none neo-3d p-6 max-w-sm w-full border-t-4 border-red-500"
            >
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">{t.deleteSale}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-8">
                {t.deleteSaleConfirm}
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setSaleToDelete(null)}
                  className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-none transition-colors uppercase tracking-widest"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={async () => {
                    const sale = sales.find(s => s.id === saleToDelete);
                    if (sale) {
                      try {
                        const batch = writeBatch(db);
                        // Delete sale
                        batch.delete(doc(db, 'sales', sale.id));
                        // Return stock
                        sale.items.forEach(item => {
                          const product = products.find(p => p.id === item.productId);
                          if (product) {
                            const productRef = doc(db, 'products', product.id);
                            batch.update(productRef, { stock: product.stock + item.quantity });
                          }
                        });
                        await batch.commit();
                      } catch (error) {
                        console.error("Error deleting sale:", error);
                      }
                    }
                    setSaleToDelete(null);
                  }}
                  className="px-6 py-3 text-sm font-black bg-red-500 text-white hover:bg-red-600 rounded-none transition-colors uppercase tracking-widest neo-3d"
                >
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function CartContent({ 
  cartItems, 
  cartTotal, 
  onRemove, 
  onAdd, 
  onClear, 
  onCheckout,
  t
}: { 
  cartItems: { product: Product, qty: number }[], 
  cartTotal: number, 
  onRemove: (id: string) => void, 
  onAdd: (id: string) => void, 
  onClear: () => void, 
  onCheckout: () => void,
  t: any
}) {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-xl">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-md">
            <ShoppingCart size={18} />
          </div>
          {t.cart}
        </h3>
        <button 
          onClick={onClear}
          className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
        >
          {t.clearAll}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cartItems.map(({ product, qty }) => (
          <div key={product.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3 group">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700 relative">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600"><ImageIcon size={20} /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{product.name}</p>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{(product.price * qty).toLocaleString()} MMK</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => onRemove(product.id)}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-900 dark:text-white font-bold shadow-sm text-xs"
              >
                -
              </button>
              <span className="w-6 text-center font-bold text-xs text-slate-900 dark:text-white">{qty}</span>
              <button 
                onClick={() => onAdd(product.id)}
                disabled={product.stock <= qty}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 transition-all font-bold shadow-md text-xs"
              >
                +
              </button>
            </div>
          </div>
        ))}
        {cartItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-slate-200 dark:border-slate-700 border-dashed">
              <ShoppingCart className="text-slate-300 dark:text-slate-600" size={24} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{t.emptyCart}</p>
          </div>
        )}
      </div>

      <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{t.subtotal}</span>
            <span>{cartTotal.toLocaleString()} MMK</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{t.tax} (0%)</span>
            <span>0 MMK</span>
          </div>
          <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white pt-3 border-t border-slate-100 dark:border-slate-800">
            <span>{t.total}</span>
            <span>{cartTotal.toLocaleString()} MMK</span>
          </div>
        </div>
        <button 
          onClick={onCheckout}
          disabled={cartItems.length === 0}
          className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {t.checkout}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
// --- Sub-components ---

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-[calc(100%-16px)] mx-2 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-bold tracking-tight relative group overflow-hidden mb-1",
        active 
          ? "bg-gradient-to-br from-white/20 to-white/5 text-white shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] border border-white/10 backdrop-blur-md translate-x-1" 
          : "text-white/50 hover:text-white hover:bg-white/5 hover:translate-x-1"
      )}
    >
      <span className={cn(
        "shrink-0 transition-transform duration-300 group-hover:scale-110",
        active ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "text-white/40 group-hover:text-white/70"
      )}>
        {icon}
      </span>
      <span className="truncate text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
        />
      )}
    </button>
  );
}

function StatCard({ title, value, icon, color, unit = "MMK" }: { title: string, value: number, icon: React.ReactNode, color: string, unit?: string }) {
  const colors: { [key: string]: string } = {
    emerald: "bg-emerald-500 border-emerald-700",
    amber: "bg-amber-500 border-amber-700",
    indigo: "bg-indigo-500 border-indigo-700",
    rose: "bg-rose-500 border-rose-700",
    violet: "bg-violet-500 border-violet-700",
    sky: "bg-sky-500 border-sky-700",
  };

  return (
    <div className={cn(
      "p-3 sm:p-4 rounded-2xl border-2 border-b-[6px] border-r-[6px] transition-all hover:-translate-y-1 hover:translate-x-[-1px] hover:border-b-[8px] hover:border-r-[8px] active:border-b-[2px] active:border-r-[2px] active:translate-y-[4px] active:translate-x-[4px] duration-200 group relative overflow-hidden",
      colors[color] || "bg-slate-500 border-slate-700"
    )}>
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 relative z-10 gap-2 sm:gap-0">
        <motion.div 
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "p-2 sm:p-3 rounded-xl bg-white shadow-sm border-b-[3px] border-r-[3px] border-black/10 group-hover:rotate-6 transition-all duration-300 w-fit shrink-0",
            color === 'emerald' ? "text-emerald-600" : 
            color === 'amber' ? "text-amber-600" : 
            color === 'indigo' ? "text-indigo-600" : 
            color === 'rose' ? "text-rose-600" :
            color === 'violet' ? "text-violet-600" :
            color === 'sky' ? "text-sky-600" : "text-slate-600"
          )}
        >
          <div className="scale-75 sm:scale-100 origin-center">{icon}</div>
        </motion.div>
        <div className="flex flex-col sm:items-end">
          <span className="text-[10px] sm:text-xs font-bold text-white/90 uppercase tracking-wider mb-1">{title}</span>
          <div className="h-1 w-6 sm:w-8 rounded-full bg-white/40" />
        </div>
      </div>
      <p className="text-xl sm:text-3xl font-black text-white tracking-tight relative z-10 break-words">
        {value.toLocaleString()} 
        {unit && <span className="text-[10px] sm:text-xs font-bold text-white/80 ml-1 uppercase tracking-widest">{unit}</span>}
      </p>
    </div>
  );
}

function AddProductForm({ 
  onAdd, 
  t,
  categories,
  onAddCategory,
  onDeleteCategory,
  initialData
}: { 
  onAdd: (p: Omit<Product, 'id'>) => void,
  t: any,
  categories: string[],
  onAddCategory: (c: string) => void,
  onDeleteCategory: (c: string) => void,
  initialData?: Product
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    cost: initialData?.cost || '',
    price: initialData?.price || '',
    stock: initialData?.stock || '',
    category: initialData?.category || categories[0] || '',
    image: initialData?.image || '',
    ram: initialData?.ram || '',
    storage: initialData?.storage || '',
    color: initialData?.color || ''
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory('');
      setIsAddingCategory(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      cost: Number(formData.cost),
      price: Number(formData.price),
      stock: Number(formData.stock),
      category: formData.category,
      image: formData.image,
      ram: formData.ram,
      storage: formData.storage,
      color: formData.color
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert(t.alertSize);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.productName}</label>
          <input 
            required
            type="text" 
            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Apple iPhone 15"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.cost}</label>
            <input 
              required
              type="number" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
              value={formData.cost}
              onChange={e => setFormData(prev => ({ ...prev, cost: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.price}</label>
            <input 
              required
              type="number" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
              value={formData.price}
              onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.stock}</label>
            <input 
              required
              type="number" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
              value={formData.stock}
              onChange={e => setFormData(prev => ({ ...prev, stock: e.target.value }))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.category}</label>
            {isAddingCategory ? (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="New category..."
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    } else if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                      setNewCategory('');
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategory('');
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            ) : confirmDelete ? (
              <div className="flex gap-2 items-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1">
                <span className="text-sm text-red-600 dark:text-red-400 flex-1 truncate">Delete "{formData.category}"?</span>
                <button 
                  type="button"
                  onClick={() => {
                    onDeleteCategory(formData.category);
                    setFormData(prev => ({ ...prev, category: categories[0] === formData.category ? categories[1] || '' : categories[0] || '' }));
                    setConfirmDelete(false);
                  }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Yes
                </button>
                <button 
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                >
                  No
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select 
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button 
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium flex items-center justify-center"
                  title="Add New Category"
                >
                  +
                </button>
                <button 
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={categories.length <= 1}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete Selected Category"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">RAM</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
              value={formData.ram}
              onChange={e => setFormData(prev => ({ ...prev, ram: e.target.value }))}
              placeholder="e.g. 8GB"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Storage</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
              value={formData.storage}
              onChange={e => setFormData(prev => ({ ...prev, storage: e.target.value }))}
              placeholder="e.g. 256GB"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-white"
              value={formData.color}
              onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="e.g. Black"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { name: 'Black', hex: '#000000' },
                { name: 'White', hex: '#FFFFFF' },
                { name: 'Silver', hex: '#C0C0C0' },
                { name: 'Gold', hex: '#FFD700' },
                { name: 'Blue', hex: '#3B82F6' },
                { name: 'Red', hex: '#EF4444' },
                { name: 'Green', hex: '#10B981' },
                { name: 'Purple', hex: '#8B5CF6' },
                { name: 'Pink', hex: '#EC4899' },
                { name: 'Gray', hex: '#6B7280' },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: c.name }))}
                  className={cn(
                    "w-6 h-6 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm transition-all hover:scale-110",
                    formData.color === c.name ? "ring-2 ring-slate-500 ring-offset-2 dark:ring-offset-slate-800 scale-110" : ""
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">{t.productImage}</label>
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="product-image-upload"
            />
            <label 
              htmlFor="product-image-upload"
              className={cn(
                "flex flex-col items-center justify-center w-full h-32 sm:h-40 rounded-2xl border-2 border-b-[6px] border-r-[6px] border-slate-200 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/10 text-slate-500 dark:text-slate-400 cursor-pointer transition-all duration-200",
                "hover:-translate-y-1 hover:translate-x-[-1px] hover:border-b-[8px] hover:border-r-[8px] hover:bg-slate-50 dark:hover:bg-slate-800/20",
                "active:border-b-[2px] active:border-r-[2px] active:translate-y-[4px] active:translate-x-[4px]",
                "overflow-hidden relative"
              )}
            >
              {formData.image ? (
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border-b-[3px] border-r-[3px] border-black/10 mb-3 group-hover:rotate-6 transition-transform duration-300">
                    <Upload size={24} className="text-slate-500" />
                  </div>
                  <span className="text-sm font-bold tracking-wide">{t.uploadDevice}</span>
                  <span className="text-xs font-medium opacity-70 mt-1">PNG, JPG up to 10MB</span>
                </>
              )}
            </label>
            {formData.image && (
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, image: '' })); }}
                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-sm border-b-[3px] border-r-[3px] border-red-700 hover:-translate-y-0.5 hover:border-b-[4px] hover:border-r-[4px] active:translate-y-[2px] active:translate-x-[2px] active:border-b-[1px] active:border-r-[1px] transition-all z-10"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
        <button 
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {t.saveProduct}
        </button>
      </div>
    </form>
  );
}
