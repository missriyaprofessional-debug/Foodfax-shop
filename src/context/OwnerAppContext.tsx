import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { OwnerProfile, Shop, MenuItem, MenuCategory, OwnerOrder, OrderStatus, ActiveScreen } from '../types';
import { soundService } from '../services/soundService';
import { getSupabaseClient } from '../services/supabaseClient';

interface OwnerAppContextType {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  ownerProfile: OwnerProfile | null;
  shop: Shop | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  hasCompletedShopSetup: boolean;
  orders: OwnerOrder[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  saveShop: (shopData: Partial<Shop>) => Promise<boolean>;
  toggleShopOpen: (isOpen: boolean) => void;
  toggleRushMode: (isRush: boolean, minutes?: number) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, cancellationReason?: string) => Promise<boolean>;
  saveMenuItem: (item: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  toggleItemAvailability: (id: string, isAvailable: boolean) => void;
  addCategory: (name: string) => Promise<void>;
  simulateIncomingOrder: () => void;
}

const OwnerAppContext = createContext<OwnerAppContextType | undefined>(undefined);

// Default initial demo state
const DEMO_OWNER: OwnerProfile = {
  id: 'owner_demo_101',
  email: 'partner@spicegarden.com',
  fullName: 'Vikram Malhotra',
  phone: '+91 98450 12345',
  role: 'owner',
  createdAt: new Date().toISOString(),
};

const DEMO_SHOP: Shop = {
  id: 'shop_demo_882',
  ownerId: 'owner_demo_101',
  name: 'Spice Garden Bistro',
  shopType: 'Restaurant & Cafe',
  description: 'Authentic North Indian tandoor, artisanal biryanis, rolls & gourmet shakes',
  phone: '+91 98450 12345',
  address: '#42, 80 Feet Road, 4th Block',
  area: 'Koramangala',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560034',
  latitude: 12.9352,
  longitude: 77.6245,
  openingTime: '10:00 AM',
  closingTime: '11:30 PM',
  upiId: 'spicegarden@okaxis',
  isOpen: true,
  isRushMode: false,
  rushExtraMinutes: 15,
  minimumOrder: 99,
  acceptsTakeaway: true,
  acceptsDineIn: true,
  acceptsDelivery: true,
  createdAt: new Date().toISOString(),
};

const DEMO_CATEGORIES: MenuCategory[] = [
  { id: 'cat_starters', shopId: 'shop_demo_882', name: 'Starters & Tandoor', sortOrder: 1, isActive: true },
  { id: 'cat_mains', shopId: 'shop_demo_882', name: 'Main Course & Curries', sortOrder: 2, isActive: true },
  { id: 'cat_biryani', shopId: 'shop_demo_882', name: 'Biryani & Rice', sortOrder: 3, isActive: true },
  { id: 'cat_breads', shopId: 'shop_demo_882', name: 'Breads & Roti', sortOrder: 4, isActive: true },
  { id: 'cat_drinks', shopId: 'shop_demo_882', name: 'Beverages & Shakes', sortOrder: 5, isActive: true },
  { id: 'cat_desserts', shopId: 'shop_demo_882', name: 'Desserts', sortOrder: 6, isActive: true },
];

const DEMO_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item_1',
    shopId: 'shop_demo_882',
    categoryId: 'cat_starters',
    name: 'Paneer Tikka Angara',
    description: 'Charcoal grilled cottage cheese marinated in spiced yogurt and mustard oil with mint chutney',
    price: 249,
    isVeg: true,
    isAvailable: true,
    preparationTimeMinutes: 15,
    tag: 'Bestseller',
  },
  {
    id: 'item_2',
    shopId: 'shop_demo_882',
    categoryId: 'cat_mains',
    name: 'Butter Chicken Roast Bowl',
    description: 'Tender tandoori chicken cooked in velvety tomato, makhani butter and fragrant fenugreek gravy',
    price: 349,
    isVeg: false,
    isAvailable: true,
    preparationTimeMinutes: 20,
    tag: "Chef's Special",
  },
  {
    id: 'item_3',
    shopId: 'shop_demo_882',
    categoryId: 'cat_biryani',
    name: 'Hyderabadi Dum Biryani',
    description: 'Aromatic basmati rice layered with spiced marinated cuts, saffron milk, served with mirchi ka salan',
    price: 320,
    isVeg: false,
    isAvailable: true,
    preparationTimeMinutes: 25,
    tag: 'Bestseller',
  },
  {
    id: 'item_4',
    shopId: 'shop_demo_882',
    categoryId: 'cat_breads',
    name: 'Garlic Butter Naan',
    description: 'Crisp clay oven flatbread brushed with crushed roasted garlic and pure Amul butter',
    price: 65,
    isVeg: true,
    isAvailable: true,
    preparationTimeMinutes: 8,
  },
  {
    id: 'item_5',
    shopId: 'shop_demo_882',
    categoryId: 'cat_drinks',
    name: 'Alphonso Mango Lassi',
    description: 'Thick churned creamy yogurt blended with real Ratnagiri mango pulp and cardamom',
    price: 119,
    isVeg: true,
    isAvailable: true,
    preparationTimeMinutes: 5,
    tag: 'Must Try',
  },
  {
    id: 'item_6',
    shopId: 'shop_demo_882',
    categoryId: 'cat_desserts',
    name: 'Warm Gulab Jamun with Rabri',
    description: 'Golden fried milk dumplings soaked in rose saffron syrup served with reduced milk rabri',
    price: 139,
    isVeg: true,
    isAvailable: true,
    preparationTimeMinutes: 6,
  },
];

const DEMO_ORDERS: OwnerOrder[] = [
  {
    id: 'ord_9901',
    shopId: 'shop_demo_882',
    orderNumber: '#FF-8841',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98712 34567',
    orderType: 'dine_in',
    tableNumber: '4',
    status: 'pending',
    subtotal: 598,
    tax: 30,
    discount: 0,
    totalAmount: 628,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    items: [
      { id: 'oi_1', menuItemId: 'item_1', name: 'Paneer Tikka Angara', price: 249, quantity: 1, isVeg: true, notes: 'Extra spicy mint chutney' },
      { id: 'oi_2', menuItemId: 'item_3', name: 'Hyderabadi Dum Biryani', price: 349, quantity: 1, isVeg: false },
    ],
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    estimatedPrepMinutes: 20,
  },
  {
    id: 'ord_9902',
    shopId: 'shop_demo_882',
    orderNumber: '#FF-8839',
    customerName: 'Rahul Verma',
    customerPhone: '+91 99100 88219',
    orderType: 'takeaway',
    status: 'preparing',
    subtotal: 414,
    tax: 21,
    discount: 0,
    totalAmount: 435,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    items: [
      { id: 'oi_3', menuItemId: 'item_2', name: 'Butter Chicken Roast Bowl', price: 349, quantity: 1, isVeg: false },
      { id: 'oi_4', menuItemId: 'item_4', name: 'Garlic Butter Naan', price: 65, quantity: 1, isVeg: true },
    ],
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    estimatedPrepMinutes: 20,
  },
  {
    id: 'ord_9903',
    shopId: 'shop_demo_882',
    orderNumber: '#FF-8835',
    customerName: 'Priya Iyer',
    customerPhone: '+91 97401 23901',
    orderType: 'dine_in',
    tableNumber: '2',
    status: 'ready',
    subtotal: 258,
    tax: 13,
    discount: 0,
    totalAmount: 271,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    items: [
      { id: 'oi_5', menuItemId: 'item_5', name: 'Alphonso Mango Lassi', price: 119, quantity: 1, isVeg: true },
      { id: 'oi_6', menuItemId: 'item_6', name: 'Warm Gulab Jamun with Rabri', price: 139, quantity: 1, isVeg: true },
    ],
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    estimatedPrepMinutes: 10,
  },
  {
    id: 'ord_9904',
    shopId: 'shop_demo_882',
    orderNumber: '#FF-8829',
    customerName: 'Amit Saxena',
    customerPhone: '+91 98211 44556',
    orderType: 'takeaway',
    status: 'completed',
    subtotal: 717,
    tax: 36,
    discount: 50,
    totalAmount: 703,
    paymentStatus: 'paid',
    paymentMethod: 'upi',
    items: [
      { id: 'oi_7', menuItemId: 'item_1', name: 'Paneer Tikka Angara', price: 249, quantity: 1, isVeg: true },
      { id: 'oi_8', menuItemId: 'item_2', name: 'Butter Chicken Roast Bowl', price: 349, quantity: 1, isVeg: false },
      { id: 'oi_9', menuItemId: 'item_5', name: 'Alphonso Mango Lassi', price: 119, quantity: 1, isVeg: true },
    ],
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    estimatedPrepMinutes: 20,
  },
];

export const OwnerAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard');
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(() => {
    const saved = localStorage.getItem('foodfax_owner_profile');
    return saved ? JSON.parse(saved) : DEMO_OWNER;
  });
  const [shop, setShop] = useState<Shop | null>(() => {
    const saved = localStorage.getItem('foodfax_owner_shop');
    return saved ? JSON.parse(saved) : DEMO_SHOP;
  });
  const [orders, setOrders] = useState<OwnerOrder[]>(() => {
    const saved = localStorage.getItem('foodfax_owner_orders');
    return saved ? JSON.parse(saved) : DEMO_ORDERS;
  });
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>(() => {
    const saved = localStorage.getItem('foodfax_menu_categories');
    return saved ? JSON.parse(saved) : DEMO_CATEGORIES;
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('foodfax_menu_items');
    return saved ? JSON.parse(saved) : DEMO_MENU_ITEMS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(soundService.isEnabled());

  // Save changes to localStorage for continuous session persistence
  useEffect(() => {
    if (ownerProfile) {
      localStorage.setItem('foodfax_owner_profile', JSON.stringify(ownerProfile));
    } else {
      localStorage.removeItem('foodfax_owner_profile');
    }
  }, [ownerProfile]);

  useEffect(() => {
    if (shop) {
      localStorage.setItem('foodfax_owner_shop', JSON.stringify(shop));
    } else {
      localStorage.removeItem('foodfax_owner_shop');
    }
  }, [shop]);

  useEffect(() => {
    localStorage.setItem('foodfax_owner_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('foodfax_menu_categories', JSON.stringify(menuCategories));
  }, [menuCategories]);

  useEffect(() => {
    localStorage.setItem('foodfax_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  const isAuthenticated = ownerProfile !== null;
  const hasCompletedShopSetup = shop !== null && shop.name.trim().length > 0;

  // Supabase Auth listener & Realtime initialization
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    // Listen to Supabase auth events
    const { data: authListener } = client.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Query user profile from Supabase
        const { data: prof } = await client
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (prof) {
          setOwnerProfile({
            id: prof.id,
            email: prof.email || session.user.email || '',
            fullName: prof.full_name || 'Restaurant Owner',
            phone: prof.phone,
            role: 'owner',
          });
        }

        // Query shop from Supabase
        const { data: shopData } = await client
          .from('shops')
          .select('*')
          .eq('owner_id', session.user.id)
          .maybeSingle();

        if (shopData) {
          setShop({
            id: shopData.id,
            ownerId: shopData.owner_id,
            name: shopData.name,
            shopType: shopData.shop_type,
            description: shopData.description,
            phone: shopData.phone,
            address: shopData.address,
            area: shopData.area,
            city: shopData.city,
            state: shopData.state,
            pincode: shopData.pincode,
            latitude: shopData.latitude,
            longitude: shopData.longitude,
            openingTime: shopData.opening_time,
            closingTime: shopData.closing_time,
            upiId: shopData.upi_id,
            isOpen: shopData.is_open ?? true,
            isRushMode: shopData.is_rush_mode ?? false,
            rushExtraMinutes: shopData.rush_extra_minutes ?? 15,
            minimumOrder: shopData.minimum_order ?? 0,
            acceptsTakeaway: shopData.accepts_takeaway ?? true,
            acceptsDineIn: shopData.accepts_dine_in ?? true,
            acceptsDelivery: shopData.accepts_delivery ?? false,
          });
        }
      }
    });

    // Setup Supabase Realtime channel if shop exists
    if (shop?.id) {
      const channel = client
        .channel(`shop_orders_${shop.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shop.id}` },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newOrd = payload.new as OwnerOrder;
              setOrders((prev) => [newOrd, ...prev]);
              soundService.playNewOrderChime();
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as OwnerOrder;
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [shop?.id]);

  const toggleSound = useCallback(() => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    soundService.setEnabled(next);
    if (next) soundService.playSuccessTone();
  }, [isSoundEnabled]);

  // Auth: Login
  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        const profile: OwnerProfile = {
          id: data.user.id,
          email: data.user.email || email,
          fullName: data.user.user_metadata?.full_name || 'Restaurant Owner',
          phone: data.user.user_metadata?.phone,
          role: 'owner',
        };
        setOwnerProfile(profile);

        // Check if shop exists
        const { data: sData } = await client
          .from('shops')
          .select('*')
          .eq('owner_id', data.user.id)
          .maybeSingle();

        setIsLoading(false);
        if (sData) {
          setShop(sData as Shop);
          setActiveScreen('dashboard');
        } else {
          setActiveScreen('shop_setup');
        }
        return true;
      }
    }

    // Direct owner login
    await new Promise((r) => setTimeout(r, 600));
    const profile: OwnerProfile = {
      id: 'owner_' + Math.random().toString(36).substring(2, 9),
      email: email.trim(),
      fullName: email.split('@')[0].replace('.', ' ').toUpperCase(),
      role: 'owner',
    };
    setOwnerProfile(profile);
    setIsLoading(false);

    if (hasCompletedShopSetup) {
      setActiveScreen('dashboard');
    } else {
      setActiveScreen('shop_setup');
    }
    return true;
  };

  // Auth: Register
  const register = async (data: { email: string; password: string; fullName: string; phone?: string }): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    const client = getSupabaseClient();
    if (client) {
      const { data: authData, error } = await client.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            phone: data.phone?.trim(),
            role: 'owner',
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return false;
      }

      if (authData.user) {
        const profile: OwnerProfile = {
          id: authData.user.id,
          email: data.email.trim(),
          fullName: data.fullName.trim(),
          phone: data.phone?.trim(),
          role: 'owner',
        };
        setOwnerProfile(profile);
        // New user has no shop yet
        setShop(null);
        setIsLoading(false);
        setActiveScreen('shop_setup');
        return true;
      }
    }

    // Direct registration
    await new Promise((r) => setTimeout(r, 700));
    const profile: OwnerProfile = {
      id: 'owner_' + Math.random().toString(36).substring(2, 9),
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      phone: data.phone?.trim(),
      role: 'owner',
    };
    setOwnerProfile(profile);
    // Reset shop for brand new registration to trigger the shop setup flow
    setShop(null);
    setIsLoading(false);
    setActiveScreen('shop_setup');
    return true;
  };

  // Auth: Logout
  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setOwnerProfile(null);
    setActiveScreen('login');
  };

  // Shop Setup / Update
  const saveShop = async (shopData: Partial<Shop>): Promise<boolean> => {
    setIsLoading(true);
    const client = getSupabaseClient();

    const newShop: Shop = {
      id: shop?.id || 'shop_' + Math.random().toString(36).substring(2, 9),
      ownerId: ownerProfile?.id || 'owner_default',
      name: shopData.name || '',
      shopType: shopData.shopType || 'Restaurant',
      description: shopData.description,
      phone: shopData.phone || ownerProfile?.phone,
      address: shopData.address,
      area: shopData.area,
      city: shopData.city,
      state: shopData.state,
      pincode: shopData.pincode,
      latitude: shopData.latitude,
      longitude: shopData.longitude,
      openingTime: shopData.openingTime || '09:00 AM',
      closingTime: shopData.closingTime || '10:00 PM',
      upiId: shopData.upiId,
      isOpen: shopData.isOpen ?? true,
      isRushMode: shopData.isRushMode ?? false,
      rushExtraMinutes: shopData.rushExtraMinutes ?? 15,
      minimumOrder: shopData.minimumOrder ?? 0,
      acceptsTakeaway: shopData.acceptsTakeaway ?? true,
      acceptsDineIn: shopData.acceptsDineIn ?? true,
      acceptsDelivery: shopData.acceptsDelivery ?? false,
      createdAt: shop?.createdAt || new Date().toISOString(),
    };

    if (client && ownerProfile) {
      try {
        await client.from('shops').upsert({
          id: newShop.id,
          owner_id: ownerProfile.id,
          name: newShop.name,
          shop_type: newShop.shopType,
          description: newShop.description,
          phone: newShop.phone,
          address: newShop.address,
          area: newShop.area,
          city: newShop.city,
          state: newShop.state,
          pincode: newShop.pincode,
          opening_time: newShop.openingTime,
          closing_time: newShop.closingTime,
          upi_id: newShop.upiId,
          is_open: newShop.isOpen,
          is_rush_mode: newShop.isRushMode,
          rush_extra_minutes: newShop.rushExtraMinutes,
        });
      } catch (e) {
        console.warn('Supabase shop upsert fallback:', e);
      }
    }

    setShop(newShop);
    setIsLoading(false);
    soundService.playSuccessTone();
    return true;
  };

  const toggleShopOpen = (isOpen: boolean) => {
    if (!shop) return;
    const updated = { ...shop, isOpen };
    setShop(updated);
    soundService.playSuccessTone();

    const client = getSupabaseClient();
    if (client) {
      client.from('shops').update({ is_open: isOpen }).eq('id', shop.id).then();
    }
  };

  const toggleRushMode = (isRush: boolean, minutes: number = 15) => {
    if (!shop) return;
    const updated = { ...shop, isRushMode: isRush, rushExtraMinutes: minutes };
    setShop(updated);
    soundService.playSuccessTone();

    const client = getSupabaseClient();
    if (client) {
      client.from('shops').update({ is_rush_mode: isRush, rush_extra_minutes: minutes }).eq('id', shop.id).then();
    }
  };

  // Order status transitions: pending -> accepted -> preparing -> ready -> completed (or cancelled)
  const updateOrderStatus = async (
    orderId: string,
    nextStatus: OrderStatus,
    cancellationReason?: string
  ): Promise<boolean> => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: nextStatus,
            cancellationReason: cancellationReason || ord.cancellationReason,
            updatedAt: new Date().toISOString(),
          };
        }
        return ord;
      })
    );

    soundService.playSuccessTone();

    const client = getSupabaseClient();
    if (client) {
      await client
        .from('orders')
        .update({
          status: nextStatus,
          cancellation_reason: cancellationReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    }

    return true;
  };

  // Menu operations
  const saveMenuItem = async (itemData: Partial<MenuItem>): Promise<boolean> => {
    const isEditing = Boolean(itemData.id);
    const item: MenuItem = {
      id: itemData.id || 'item_' + Math.random().toString(36).substring(2, 9),
      shopId: shop?.id || 'shop_demo_882',
      categoryId: itemData.categoryId,
      name: itemData.name || '',
      description: itemData.description,
      price: itemData.price || 0,
      isVeg: itemData.isVeg ?? true,
      isAvailable: itemData.isAvailable ?? true,
      imageUrl: itemData.imageUrl,
      preparationTimeMinutes: itemData.preparationTimeMinutes || 15,
      tag: itemData.tag,
      createdAt: itemData.createdAt || new Date().toISOString(),
    };

    setMenuItems((prev) => {
      if (isEditing) {
        return prev.map((m) => (m.id === item.id ? item : m));
      }
      return [item, ...prev];
    });

    soundService.playSuccessTone();

    const client = getSupabaseClient();
    if (client) {
      await client.from('menu_items').upsert({
        id: item.id,
        shop_id: item.shopId,
        category_id: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        is_veg: item.isVeg,
        is_available: item.isAvailable,
        preparation_time_minutes: item.preparationTimeMinutes,
        tag: item.tag,
      });
    }

    return true;
  };

  const deleteMenuItem = async (id: string): Promise<boolean> => {
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
    soundService.playSuccessTone();

    const client = getSupabaseClient();
    if (client) {
      await client.from('menu_items').delete().eq('id', id);
    }
    return true;
  };

  const toggleItemAvailability = (id: string, isAvailable: boolean) => {
    setMenuItems((prev) => prev.map((m) => (m.id === id ? { ...m, isAvailable } : m)));
    soundService.playSuccessTone();

    const client = getSupabaseClient();
    if (client) {
      client.from('menu_items').update({ is_available: isAvailable }).eq('id', id).then();
    }
  };

  const addCategory = async (name: string): Promise<void> => {
    const newCat: MenuCategory = {
      id: 'cat_' + Math.random().toString(36).substring(2, 9),
      shopId: shop?.id || 'shop_demo_882',
      name: name.trim(),
      sortOrder: menuCategories.length + 1,
      isActive: true,
    };
    setMenuCategories((prev) => [...prev, newCat]);
    soundService.playSuccessTone();

    const client = getSupabaseClient();
    if (client) {
      await client.from('categories').insert({
        id: newCat.id,
        shop_id: newCat.shopId,
        name: newCat.name,
        sort_order: newCat.sortOrder,
      });
    }
  };

  // Simulate an incoming live order for testing
  const simulateIncomingOrder = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const customers = [
      { name: 'Kavita Sundaram', phone: '+91 99823 45678' },
      { name: 'Sameer Sen', phone: '+91 98302 77123' },
      { name: 'Deepak Nair', phone: '+91 97412 88990' },
      { name: 'Siddharth Roy', phone: '+91 98456 12789' },
    ];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const types: ('dine_in' | 'takeaway')[] = ['dine_in', 'takeaway'];
    const type = types[Math.floor(Math.random() * types.length)];

    // pick 2 random items from menu
    const randomItem1 = menuItems[0] || DEMO_MENU_ITEMS[0];
    const randomItem2 = menuItems[1] || DEMO_MENU_ITEMS[1];

    const newOrder: OwnerOrder = {
      id: 'ord_' + Math.random().toString(36).substring(2, 9),
      shopId: shop?.id || 'shop_demo_882',
      orderNumber: `#FF-${randomNum}`,
      customerName: customer.name,
      customerPhone: customer.phone,
      orderType: type,
      tableNumber: type === 'dine_in' ? String(Math.floor(1 + Math.random() * 8)) : undefined,
      status: 'pending',
      subtotal: randomItem1.price + randomItem2.price,
      tax: Math.round((randomItem1.price + randomItem2.price) * 0.05),
      discount: 0,
      totalAmount: randomItem1.price + randomItem2.price + Math.round((randomItem1.price + randomItem2.price) * 0.05),
      paymentStatus: 'paid',
      paymentMethod: 'upi',
      items: [
        { id: 'i1', menuItemId: randomItem1.id, name: randomItem1.name, price: randomItem1.price, quantity: 1, isVeg: randomItem1.isVeg },
        { id: 'i2', menuItemId: randomItem2.id, name: randomItem2.name, price: randomItem2.price, quantity: 1, isVeg: randomItem2.isVeg },
      ],
      createdAt: new Date().toISOString(),
      estimatedPrepMinutes: (shop?.isRushMode ? 15 : 0) + 15,
    };

    setOrders((prev) => [newOrder, ...prev]);
    soundService.playNewOrderChime();
  };

  return (
    <OwnerAppContext.Provider
      value={{
        activeScreen,
        setActiveScreen,
        ownerProfile,
        shop,
        isAuthenticated,
        isLoading,
        errorMessage,
        hasCompletedShopSetup,
        orders,
        menuCategories,
        menuItems,
        selectedOrderId,
        setSelectedOrderId,
        isSoundEnabled,
        toggleSound,
        login,
        register,
        logout,
        saveShop,
        toggleShopOpen,
        toggleRushMode,
        updateOrderStatus,
        saveMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        addCategory,
        simulateIncomingOrder,
      }}
    >
      {children}
    </OwnerAppContext.Provider>
  );
};

export const useOwnerApp = () => {
  const context = useContext(OwnerAppContext);
  if (!context) {
    throw new Error('useOwnerApp must be used within an OwnerAppProvider');
  }
  return context;
};
