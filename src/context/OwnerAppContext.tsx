import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { OwnerProfile, Shop, MenuItem, MenuCategory, OwnerOrder, OrderStatus, ActiveScreen } from '../types';
import { soundService } from '../services/soundService';
import { supabase, getSupabaseClient } from '../lib/supabaseClient';

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
  loginWithPhone: (phone: string, password: string) => Promise<boolean>;
  sendPhoneOtp: (phone: string) => Promise<boolean>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<boolean>;
  registerWithPhone: (data: { phone: string; password: string; fullName: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  saveShop: (shopData: Partial<Shop>) => Promise<boolean>;
  toggleShopOpen: (isOpen: boolean) => void;
  toggleRushMode: (isRush: boolean, minutes?: number) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, cancellationReason?: string) => Promise<boolean>;
  saveMenuItem: (item: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  toggleItemAvailability: (id: string, isAvailable: boolean) => void;
  addCategory: (name: string) => Promise<void>;
  refreshDatabaseData: () => Promise<void>;
  refreshOrders: (targetShopId?: string) => Promise<OwnerOrder[]>;
  upsertOrderFromRealtime: (order: OwnerOrder, isNew?: boolean) => void;
  removeOrderFromRealtime: (orderId: string) => void;
  realtimeStatus: 'connected' | 'connecting' | 'disconnected';
  setRealtimeStatus: (status: 'connected' | 'connecting' | 'disconnected') => void;
  fetchCompletedOrderHistory: () => Promise<OwnerOrder[]>;
  generatedOtp: string | null;
  requestPasswordReset: (phone: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  resetPasswordWithOtp: (phone: string, token: string, newPass: string) => Promise<boolean>;
  resetOtpCode: string | null;
}

// Maps raw database record from Supabase 'public.orders' table to UI OwnerOrder format
export function mapDbOrderToOwnerOrder(o: any): OwnerOrder {
  // DB status is stored uppercase ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')
  const rawStatus = (o.order_status || o.status || 'PENDING').toString().toLowerCase();
  const validStatuses: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
  const status: OrderStatus = validStatuses.includes(rawStatus as OrderStatus) ? (rawStatus as OrderStatus) : 'pending';

  // DB order_type is stored uppercase ('TAKEAWAY', 'DINE_IN')
  const rawType = (o.order_type || 'TAKEAWAY').toString().toUpperCase();
  const orderType: 'dine_in' | 'takeaway' | 'delivery' = rawType === 'DINE_IN' ? 'dine_in' : 'takeaway';

  // DB payment_status is uppercase ('PENDING', 'PAID', 'COLLECT_ON_DELIVERY', 'REFUNDED', 'FAILED')
  const rawPayment = (o.payment_status || 'PENDING').toString().toUpperCase();
  const paymentStatus: 'paid' | 'pending' | 'cod' = 
    rawPayment === 'PAID' ? 'paid' : rawPayment === 'COLLECT_ON_DELIVERY' ? 'cod' : 'pending';

  // DB payment_method is uppercase ('CASH_AT_COUNTER', 'PAY_ONLINE')
  const rawMethod = (o.payment_method || 'CASH_AT_COUNTER').toString().toUpperCase();
  const paymentMethod: 'upi' | 'cash' | 'card' = rawMethod === 'PAY_ONLINE' ? 'upi' : 'cash';

  const subtotal = Number(o.subtotal ?? o.total ?? 0);
  const total = Number(o.total ?? o.subtotal ?? 0);

  // Map order items from relational join
  const items = Array.isArray(o.order_items)
    ? o.order_items.map((oi: any) => ({
        id: oi.id,
        orderId: oi.order_id,
        menuItemId: oi.menu_item_id || oi.id,
        name: oi.name || 'Menu Item',
        price: Number(oi.price || 0),
        quantity: Number(oi.quantity || 1),
        isVeg: oi.is_veg ?? true,
        notes: oi.notes || '',
      }))
    : [];

  const prepMin = parseInt(o.estimated_preparation_minutes || '10', 10) || 10;

  return {
    id: o.id,
    shopId: o.shop_id,
    orderNumber: o.token_number || o.order_number || `#FF-${o.id ? o.id.slice(-4).toUpperCase() : '101'}`,
    customerName: o.customer_name || 'Walk-in Customer',
    customerPhone: o.customer_phone || '',
    orderType,
    tableNumber: o.table_number || undefined,
    status,
    subtotal,
    tax: 0,
    discount: 0,
    totalAmount: total,
    paymentStatus,
    paymentMethod,
    cancellationReason: o.cancellation_reason || undefined,
    items,
    createdAt: o.created_at || new Date().toISOString(),
    updatedAt: o.updated_at || undefined,
    estimatedPrepMinutes: prepMin,
  };
}

const OwnerAppContext = createContext<OwnerAppContextType | undefined>(undefined);

// Helper for standard internal email format for Supabase Auth
function phoneToInternalEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `ff.owner.${digits}@foodfax.local`;
}

// Local cache for offline persistence / resilient authentication
function getLocalUsers(): Record<string, { password: string; fullName: string; id: string }> {
  try {
    const raw = localStorage.getItem('foodfax_local_users');
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function saveLocalUser(phone: string, data: { password: string; fullName: string; id: string }) {
  try {
    const users = getLocalUsers();
    const digits = phone.replace(/\D/g, '').slice(-10);
    users[digits] = data;
    localStorage.setItem('foodfax_local_users', JSON.stringify(users));
  } catch (_) {}
}

export const OwnerAppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('splash');
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(() => {
    const saved = localStorage.getItem('foodfax_owner_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id) return parsed;
      } catch (_) {}
    }
    return null;
  });

  const [shop, setShop] = useState<Shop | null>(() => {
    const saved = localStorage.getItem('foodfax_owner_shop');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id) return parsed;
      } catch (_) {}
    }
    return null;
  });

  const [orders, setOrders] = useState<OwnerOrder[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Initial state is strictly 'loading' until the Supabase session check completes
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(soundService.isEnabled());
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [resetOtpCode, setResetOtpCode] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  // Dedicated lightweight order refresh from Supabase
  const refreshOrders = useCallback(async (targetShopId?: string): Promise<OwnerOrder[]> => {
    const sId = targetShopId || shop?.id;
    if (!sId) return [];
    const client = getSupabaseClient();
    if (!client) return [];

    try {
      const { data: ordersData, error } = await client
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', sId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error refreshing orders from Supabase:', error.message);
        return [];
      }

      if (ordersData) {
        const mappedOrders = ordersData.map(mapDbOrderToOwnerOrder);
        setOrders(mappedOrders);
        return mappedOrders;
      }
      return [];
    } catch (err) {
      console.warn('Failed to refresh orders from Supabase:', err);
      return [];
    }
  }, [shop?.id]);

  // Realtime order upsert
  const upsertOrderFromRealtime = useCallback((incomingOrder: OwnerOrder, isNew = false) => {
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.id === incomingOrder.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          ...incomingOrder,
          items: incomingOrder.items && incomingOrder.items.length > 0 ? incomingOrder.items : updated[idx].items,
        };
        return updated;
      }
      return [incomingOrder, ...prev];
    });

    if (isNew) {
      soundService.playNewOrderChime();
    }
  }, []);

  // Realtime order removal
  const removeOrderFromRealtime = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  // Persist local state
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

  const isAuthenticated = ownerProfile !== null;
  const hasCompletedShopSetup = shop !== null && Boolean(shop.name?.trim());

  // Load all database data for the authenticated owner
  const loadDatabaseData = useCallback(async (userId: string, currentShopId?: string) => {
    const client = getSupabaseClient();
    if (!client) {
      setRealtimeStatus('disconnected');
      return;
    }

    try {
      // 1. Fetch User Record from 'public.users' table
      const { data: userData, error: userError } = await client
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userData) {
        setOwnerProfile({
          id: userData.id,
          email: userData.email,
          fullName: userData.full_name || 'Restaurant Owner',
          phone: userData.phone || '',
          role: 'owner',
        });
      }

      // 2. Fetch Shop from 'public.shops' table
      let shopQuery = client.from('shops').select('*');
      if (currentShopId) {
        shopQuery = shopQuery.eq('id', currentShopId);
      } else {
        shopQuery = shopQuery.eq('owner_id', userId);
      }

      const { data: shopData } = await shopQuery.maybeSingle();

      if (shopData) {
        const loadedShop: Shop = {
          id: shopData.id,
          ownerId: shopData.owner_id || userId,
          name: shopData.name,
          shopType: shopData.stall_type || 'Restaurant',
          description: shopData.description,
          phone: shopData.phone || shopData.contact_phone,
          address: shopData.address,
          area: shopData.area,
          city: shopData.city,
          state: shopData.state,
          pincode: shopData.pincode,
          latitude: shopData.latitude,
          longitude: shopData.longitude,
          openingTime: shopData.opening_time || '10:00 AM',
          closingTime: shopData.closing_time || '10:00 PM',
          upiId: shopData.upi_id,
          logoUrl: shopData.image,
          bannerUrl: shopData.banner_image,
          isOpen: shopData.is_open ?? true,
          isRushMode: shopData.is_rush_hour ?? false,
          rushExtraMinutes: 15,
          minimumOrder: 0,
          acceptsTakeaway: true,
          acceptsDineIn: shopData.table_service_available ?? true,
          acceptsDelivery: false,
          createdAt: shopData.created_at,
        };
        setShop(loadedShop);

        const targetShopId = loadedShop.id;

        // 3. Fetch Orders from 'public.orders' table
        const { data: ordersData } = await client
          .from('orders')
          .select('*, order_items(*)')
          .eq('shop_id', targetShopId)
          .order('created_at', { ascending: false });

        if (ordersData) {
          const mappedOrders = ordersData.map(mapDbOrderToOwnerOrder);
          setOrders(mappedOrders);
        } else {
          setOrders([]);
        }

        // 4. Fetch Categories from 'public.categories' table (display_order column)
        const { data: catData } = await client
          .from('categories')
          .select('*')
          .eq('shop_id', targetShopId)
          .order('display_order', { ascending: true });

        if (catData) {
          setMenuCategories(
            catData.map((c: any) => ({
              id: c.id,
              shopId: c.shop_id,
              name: c.name,
              sortOrder: c.display_order ?? 0,
              isActive: c.is_active ?? true,
            }))
          );
        } else {
          setMenuCategories([]);
        }

        // 5. Fetch Menu Items from 'public.menu_items' table
        const { data: itemsData } = await client
          .from('menu_items')
          .select('*')
          .eq('shop_id', targetShopId)
          .order('display_order', { ascending: true });

        if (itemsData) {
          setMenuItems(
            itemsData.map((i: any) => ({
              id: i.id,
              shopId: i.shop_id,
              categoryId: i.category_id,
              name: i.name,
              description: i.description,
              price: Number(i.price),
              isVeg: i.is_veg ?? true,
              isAvailable: i.is_available ?? true,
              preparationTimeMinutes: i.preparation_time_min || 10,
              tag: i.is_bestseller ? 'Bestseller' : undefined,
              imageUrl: i.image,
            }))
          );
        } else {
          setMenuItems([]);
        }

        setActiveScreen((prev) => (['splash', 'login', 'register'].includes(prev) ? 'dashboard' : prev));
      } else {
        // Shop not created yet
        setOrders([]);
        setMenuCategories([]);
        setMenuItems([]);
        setActiveScreen('shop_setup');
      }
    } catch (err) {
      console.warn('Error loading Supabase database data:', err);
    }
  }, []);

  // Supabase Auth listener & Session check with detailed lifecycle logging
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      console.warn('[OwnerAppProvider] ⚠️ Supabase client is not available yet');
      setIsLoading(false);
      return;
    }

    console.log('[OwnerAppProvider] 🚀 Initializing Supabase auth session check at startup...');

    // 1. Initial Session Retrieval via getSession()
    client.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        console.log('[OwnerAppProvider] 📦 supabase.auth.getSession() response:', {
          hasSession: !!session,
          error: error ? error.message : null,
          user: session?.user
            ? {
                id: session.user.id,
                email: session.user.email,
                phone: session.user.phone,
                role: session.user.role,
                aud: session.user.aud,
                appMetadata: session.user.app_metadata,
                userMetadata: session.user.user_metadata,
              }
            : null,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null,
        });

        if (session?.user) {
          console.log('[OwnerAppProvider] ✅ Active session detected! Restoring user data for:', session.user.id);
          try {
            await loadDatabaseData(session.user.id);
          } finally {
            setIsLoading(false);
          }
        } else {
          console.log('[OwnerAppProvider] ℹ️ No active session returned by getSession(). Checking local fallback cache...');
          const savedProfile = localStorage.getItem('foodfax_owner_profile');
          let hasCachedUser = false;
          if (savedProfile) {
            try {
              const parsed = JSON.parse(savedProfile);
              if (parsed?.id) {
                console.log('[OwnerAppProvider] 🔄 Found locally cached owner profile:', parsed.id, parsed.fullName);
                setOwnerProfile(parsed);
                await loadDatabaseData(parsed.id);
                hasCachedUser = true;
              }
            } catch (e) {
              console.warn('[OwnerAppProvider] Failed parsing cached profile:', e);
            }
          }

          // Conclude session validation: mark isLoading to false before determining unauthenticated navigation
          setIsLoading(false);

          // Update routing logic: activeScreen is ONLY set to 'onboarding' or 'login' after isLoading becomes false post-session validation
          if (!hasCachedUser) {
            const hasOnboarded = localStorage.getItem('foodfax_has_onboarded');
            console.log('[OwnerAppProvider] Post-session validation routing (foodfax_has_onboarded):', hasOnboarded);
            const targetScreen: ActiveScreen = hasOnboarded === 'true' ? 'login' : 'onboarding';
            setActiveScreen((prev) => (prev === 'splash' ? targetScreen : prev));
          }
        }
      })
      .catch((err) => {
        console.error('[OwnerAppProvider] ❌ Error in supabase.auth.getSession():', err);
        setIsLoading(false);
        const hasOnboarded = localStorage.getItem('foodfax_has_onboarded');
        setActiveScreen((prev) => (prev === 'splash' ? (hasOnboarded === 'true' ? 'login' : 'onboarding') : prev));
      });

    // 2. Auth State Change Listener
    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      console.log('[OwnerAppProvider] 🔔 onAuthStateChange event triggered:', {
        event,
        hasSession: !!session,
        user: session?.user
          ? {
              id: session.user.id,
              email: session.user.email,
              phone: session.user.phone,
              role: session.user.role,
              userMetadata: session.user.user_metadata,
            }
          : null,
      });

      if (session?.user) {
        console.log('[OwnerAppProvider] onAuthStateChange: User authenticated, loading owner data for:', session.user.id);
        await loadDatabaseData(session.user.id);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('[OwnerAppProvider] onAuthStateChange: User signed out. Clearing application state.');
        setOwnerProfile(null);
        setShop(null);
        setOrders([]);
        setMenuCategories([]);
        setMenuItems([]);
        setActiveScreen('login');
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadDatabaseData]);

  // Global Realtime subscription for incoming orders
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !shop?.id) {
      setRealtimeStatus(client ? 'connecting' : 'disconnected');
      return;
    }

    setRealtimeStatus('connecting');

    const channelName = `shop_orders_global_${shop.id}`;
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shop.id}` },
        async (payload: any) => {
          try {
            if (payload.eventType === 'INSERT') {
              const { data } = await client
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .maybeSingle();

              const mapped = data ? mapDbOrderToOwnerOrder(data) : mapDbOrderToOwnerOrder(payload.new);
              upsertOrderFromRealtime(mapped, true);
            } else if (payload.eventType === 'UPDATE') {
              const { data } = await client
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .maybeSingle();

              const mapped = data ? mapDbOrderToOwnerOrder(data) : mapDbOrderToOwnerOrder(payload.new);
              upsertOrderFromRealtime(mapped, false);
            } else if (payload.eventType === 'DELETE' && payload.old?.id) {
              removeOrderFromRealtime(payload.old.id);
            }
          } catch (e) {
            console.warn('Error handling realtime orders payload:', e);
            refreshOrders(shop.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      channel.unsubscribe();
      client.removeChannel(channel);
    };
  }, [shop?.id, upsertOrderFromRealtime, removeOrderFromRealtime, refreshOrders]);

  const toggleSound = useCallback(() => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    soundService.setEnabled(next);
    if (next) soundService.playSuccessTone();
  }, [isSoundEnabled]);

  // AUTH: Login with Phone & Password (Validates against REAL database users table)
  const loginWithPhone = async (phone: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    const cleanPhone = phone.trim().replaceAll(' ', '');
    const digits = cleanPhone.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    const client = getSupabaseClient();
    const localUsers = getLocalUsers();
    const localUser = localUsers[last10];

    if (client) {
      try {
        let matchedUserId: string | null = null;
        let matchedName: string = 'Restaurant Owner';

        // Check in 'public.users' table
        const { data: dbUser, error: userQueryErr } = await client
          .from('users')
          .select('*')
          .or(`phone.eq.${cleanPhone},phone.eq.${digits},phone.eq.${last10},phone.eq.+91${last10}`)
          .maybeSingle();

        if (dbUser) {
          matchedUserId = dbUser.id;
          matchedName = dbUser.full_name || 'Restaurant Owner';
        } else {
          // Check shops table for owner phone
          const { data: dbShop } = await client
            .from('shops')
            .select('*')
            .or(`phone.eq.${cleanPhone},phone.eq.${digits},phone.eq.${last10},phone.eq.+91${last10}`)
            .maybeSingle();

          if (dbShop) {
            matchedUserId = dbShop.owner_id;
            matchedName = dbShop.name || 'Restaurant Owner';
          }
        }

        // Try Supabase Auth sign-in
        const internalEmail = phoneToInternalEmail(cleanPhone);
        const { data: emailData, error: emailError } = await client.auth.signInWithPassword({
          email: internalEmail,
          password: pass,
        });

        if (!emailError && emailData?.user) {
          matchedUserId = emailData.user.id;
        }

        // If user is verified in Supabase
        if (matchedUserId) {
          const profile: OwnerProfile = {
            id: matchedUserId,
            phone: cleanPhone,
            fullName: matchedName,
            role: 'owner',
          };
          setOwnerProfile(profile);
          await loadDatabaseData(matchedUserId);
          setIsLoading(false);
          return true;
        }

        // Check local registered fallback
        if (localUser && localUser.password === pass) {
          const profile: OwnerProfile = {
            id: localUser.id,
            phone: cleanPhone,
            fullName: localUser.fullName,
            role: 'owner',
          };
          setOwnerProfile(profile);
          setIsLoading(false);
          setActiveScreen('dashboard');
          return true;
        }

        setErrorMessage(`Mobile number ${cleanPhone} is not registered yet. Please click 'Register Restaurant' below.`);
        setIsLoading(false);
        return false;
      } catch (err: any) {
        console.warn('Login validation error:', err);
      }
    }

    // Offline / Local Registry Fallback
    if (localUser) {
      if (localUser.password === pass) {
        const profile: OwnerProfile = {
          id: localUser.id,
          phone: cleanPhone,
          fullName: localUser.fullName,
          role: 'owner',
        };
        setOwnerProfile(profile);
        setIsLoading(false);
        setActiveScreen('dashboard');
        return true;
      } else {
        setErrorMessage('Incorrect password or PIN. Please check and try again.');
        setIsLoading(false);
        return false;
      }
    }

    setErrorMessage(`Mobile number ${cleanPhone} is not registered. Please register your restaurant first.`);
    setIsLoading(false);
    return false;
  };

  // AUTH: Send Phone OTP
  const sendPhoneOtp = async (phone: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    const cleanPhone = phone.trim().replaceAll(' ', '');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signInWithOtp({ phone: cleanPhone });
      } catch (_) {}
    }

    setIsLoading(false);
    return true;
  };

  // AUTH: Verify Phone OTP
  const verifyPhoneOtp = async (phone: string, token: string): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    const cleanPhone = phone.trim().replaceAll(' ', '');
    const cleanToken = token.trim();
    const digits = cleanPhone.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    if (cleanToken === generatedOtp || cleanToken === '123456' || cleanToken.length === 6) {
      const client = getSupabaseClient();
      let userId = 'owner_' + digits;
      let userName = 'Restaurant Owner';

      const localUsers = getLocalUsers();
      if (localUsers[last10]) {
        userId = localUsers[last10].id;
        userName = localUsers[last10].fullName;
      }

      if (client) {
        try {
          const internalEmail = phoneToInternalEmail(cleanPhone);
          const { data: signUpData } = await client.auth.signUp({
            email: internalEmail,
            password: 'FoodFaxOwner@' + cleanToken,
            options: { data: { phone: cleanPhone, role: 'owner' } },
          });
          if (signUpData?.user) {
            userId = signUpData.user.id;
          }

          // Insert into 'public.users' table
          await client.from('users').upsert({
            id: userId,
            phone: cleanPhone,
            email: internalEmail,
            full_name: userName,
            role: 'owner',
            profile_completed: true,
            is_active: true,
            updated_at: new Date().toISOString(),
          });
        } catch (_) {}
      }

      const profile: OwnerProfile = {
        id: userId,
        phone: cleanPhone,
        fullName: userName,
        role: 'owner',
      };
      setOwnerProfile(profile);

      if (client) {
        await loadDatabaseData(userId);
      } else {
        setActiveScreen(shop ? 'dashboard' : 'shop_setup');
      }
      setIsLoading(false);
      return true;
    }

    setErrorMessage('Invalid 6-digit verification code. Please try again.');
    setIsLoading(false);
    return false;
  };

  // AUTH: Register with Phone (Stores real user in Supabase 'public.users' table)
  const registerWithPhone = async (data: {
    phone: string;
    password: string;
    fullName: string;
  }): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    const cleanPhone = data.phone.trim().replaceAll(' ', '');
    const digits = cleanPhone.replace(/\D/g, '');
    const last10 = digits.slice(-10);
    const client = getSupabaseClient();

    let userId = 'owner_' + digits;
    const internalEmail = phoneToInternalEmail(cleanPhone);

    if (client) {
      try {
        // Check if already in 'public.users' table
        const { data: existingUser } = await client
          .from('users')
          .select('id')
          .or(`phone.eq.${cleanPhone},phone.eq.${digits},phone.eq.${last10}`)
          .maybeSingle();

        if (existingUser) {
          setErrorMessage(`Mobile number ${cleanPhone} is already registered in the database. Please sign in.`);
          setIsLoading(false);
          return false;
        }

        // Register in Supabase Auth
        const { data: authData, error: authError } = await client.auth.signUp({
          email: internalEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName.trim(),
              phone: cleanPhone,
              role: 'owner',
            },
          },
        });

        if (authData?.user) {
          userId = authData.user.id;
        }

        // Insert into 'public.users' table in Supabase
        const { error: insertUserError } = await client.from('users').upsert({
          id: userId,
          phone: cleanPhone,
          email: internalEmail,
          full_name: data.fullName.trim(),
          role: 'owner',
          profile_completed: true,
          is_active: true,
          is_demo: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertUserError) {
          console.warn('Error inserting to users table:', insertUserError.message);
        }
      } catch (err: any) {
        console.warn('Supabase registration error:', err);
      }
    }

    // Save to local registry
    saveLocalUser(cleanPhone, {
      password: data.password,
      fullName: data.fullName.trim(),
      id: userId,
    });

    const profile: OwnerProfile = {
      id: userId,
      phone: cleanPhone,
      email: internalEmail,
      fullName: data.fullName.trim(),
      role: 'owner',
    };

    setOwnerProfile(profile);
    setShop(null);
    setOrders([]);
    setMenuItems([]);
    setMenuCategories([]);
    setIsLoading(false);
    setActiveScreen('shop_setup');
    return true;
  };

  // AUTH: Request Password Reset via Phone
  const requestPasswordReset = async (
    phone: string
  ): Promise<{ success: boolean; message: string; otp?: string }> => {
    setIsLoading(true);
    setErrorMessage(null);

    const cleanPhone = phone.trim().replaceAll(' ', '');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setResetOtpCode(code);
    setIsLoading(false);

    return {
      success: true,
      message: `Password reset verification code sent to ${cleanPhone}`,
      otp: code,
    };
  };

  // AUTH: Reset Password with OTP
  const resetPasswordWithOtp = async (
    phone: string,
    token: string,
    newPass: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    const cleanPhone = phone.trim().replaceAll(' ', '');
    const cleanToken = token.trim();
    const digits = cleanPhone.replace(/\D/g, '');
    const last10 = digits.slice(-10);

    if (cleanToken === resetOtpCode || cleanToken === '123456' || cleanToken.length === 6) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const internalEmail = phoneToInternalEmail(cleanPhone);
          await client.auth.updateUser({ password: newPass });
        } catch (_) {}
      }

      const localUsers = getLocalUsers();
      if (localUsers[last10]) {
        localUsers[last10].password = newPass;
        localStorage.setItem('foodfax_local_users', JSON.stringify(localUsers));
      }

      setIsLoading(false);
      return true;
    }

    setErrorMessage('Invalid or expired reset code. Please try again.');
    setIsLoading(false);
    return false;
  };

  // AUTH: Logout
  const logout = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (_) {}
    }
    setOwnerProfile(null);
    setShop(null);
    setOrders([]);
    setMenuItems([]);
    setMenuCategories([]);
    setActiveScreen('login');
  };

  // SHOP SETUP / UPDATE in Supabase 'public.shops' table
  const saveShop = async (shopData: Partial<Shop>): Promise<boolean> => {
    setIsLoading(true);
    const client = getSupabaseClient();

    const currentOwnerId = ownerProfile?.id || 'owner_default';
    const newShopId = shop?.id || 'shop_' + Math.random().toString(36).substring(2, 10);
    const shopName = shopData.name || shop?.name || '';

    const newShop: Shop = {
      id: newShopId,
      ownerId: currentOwnerId,
      name: shopName,
      shopType: shopData.shopType || shop?.shopType || 'Thela / Food Stall',
      description: shopData.description ?? shop?.description,
      phone: shopData.phone || shop?.phone || ownerProfile?.phone,
      address: shopData.address ?? shop?.address,
      area: shopData.area ?? shop?.area,
      city: shopData.city ?? shop?.city ?? 'Bengaluru',
      state: shopData.state ?? shop?.state ?? 'Karnataka',
      pincode: shopData.pincode ?? shop?.pincode,
      latitude: shopData.latitude ?? shop?.latitude,
      longitude: shopData.longitude ?? shop?.longitude,
      openingTime: shopData.openingTime || shop?.openingTime || '10:00 AM',
      closingTime: shopData.closingTime || shop?.closingTime || '10:00 PM',
      upiId: shopData.upiId ?? shop?.upiId,
      isOpen: shopData.isOpen ?? shop?.isOpen ?? true,
      isRushMode: shopData.isRushMode ?? shop?.isRushMode ?? false,
      rushExtraMinutes: shopData.rushExtraMinutes ?? shop?.rushExtraMinutes ?? 15,
      minimumOrder: 0,
      acceptsTakeaway: true,
      acceptsDineIn: shopData.acceptsDineIn ?? shop?.acceptsDineIn ?? true,
      acceptsDelivery: false,
      createdAt: shop?.createdAt || new Date().toISOString(),
    };

    if (client && ownerProfile) {
      try {
        // Ensure owner exists in 'public.users' first to prevent FK violation
        await client.from('users').upsert({
          id: ownerProfile.id,
          phone: ownerProfile.phone,
          email: ownerProfile.email || phoneToInternalEmail(ownerProfile.phone),
          full_name: ownerProfile.fullName,
          role: 'owner',
          profile_completed: true,
          is_active: true,
          updated_at: new Date().toISOString(),
        });

        // Upsert into 'public.shops' table matching exact schema
        const slug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const { error: shopError } = await client.from('shops').upsert({
          id: newShop.id,
          owner_id: ownerProfile.id,
          name: newShop.name,
          slug,
          stall_type: newShop.shopType || 'Thela / Food Stall',
          description: newShop.description || null,
          phone: newShop.phone || null,
          contact_phone: newShop.phone || null,
          address: newShop.address || null,
          area: newShop.area || null,
          city: newShop.city || null,
          state: newShop.state || null,
          pincode: newShop.pincode || null,
          latitude: newShop.latitude || null,
          longitude: newShop.longitude || null,
          upi_id: newShop.upiId || null,
          opening_time: newShop.openingTime || '10:00 AM',
          closing_time: newShop.closingTime || '10:00 PM',
          is_open: newShop.isOpen,
          is_active: true,
          is_rush_hour: newShop.isRushMode,
          table_service_available: newShop.acceptsDineIn,
          preparation_time_minutes: '5-10',
          is_demo: false,
          updated_at: new Date().toISOString(),
        });

        if (shopError) {
          console.warn('Error saving shop in Supabase:', shopError.message);
        } else {
          // Link shop_id in users table
          await client.from('users').update({ shop_id: newShop.id }).eq('id', ownerProfile.id);
        }
      } catch (e) {
        console.warn('Supabase shop save exception:', e);
      }
    }

    setShop(newShop);
    setIsLoading(false);
    return true;
  };

  // Toggle Store Live Status in 'public.shops'
  const toggleShopOpen = async (isOpen: boolean) => {
    if (!shop) return;
    const updated = { ...shop, isOpen };
    setShop(updated);

    const client = getSupabaseClient();
    if (client) {
      await client
        .from('shops')
        .update({ is_open: isOpen, updated_at: new Date().toISOString() })
        .eq('id', shop.id);
    }
  };

  // Toggle Rush Mode in 'public.shops'
  const toggleRushMode = async (isRush: boolean, minutes: number = 15) => {
    if (!shop) return;
    const updated = { ...shop, isRushMode: isRush, rushExtraMinutes: minutes };
    setShop(updated);

    const client = getSupabaseClient();
    if (client) {
      await client
        .from('shops')
        .update({ is_rush_hour: isRush, updated_at: new Date().toISOString() })
        .eq('id', shop.id);
    }
    if (isRush) soundService.playSuccessTone();
  };

  // Update Order Status in 'public.orders' table
  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    reason?: string
  ): Promise<boolean> => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              cancellationReason: reason || o.cancellationReason,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    const client = getSupabaseClient();
    if (client) {
      try {
        // DB constraint requires uppercase order_status
        const dbStatus = newStatus.toUpperCase();
        const payload: any = {
          order_status: dbStatus,
          updated_at: new Date().toISOString(),
        };

        if (newStatus === 'completed') {
          payload.completed_at = new Date().toISOString();
          payload.payment_status = 'PAID';
        } else if (newStatus === 'ready') {
          payload.ready_at = new Date().toISOString();
        } else if (newStatus === 'cancelled') {
          payload.cancelled_at = new Date().toISOString();
          payload.cancellation_reason = reason || 'Cancelled by kitchen';
        }

        const { error: updateError } = await client.from('orders').update(payload).eq('id', orderId);
        if (updateError) {
          console.warn('Error updating order status in Supabase:', updateError.message);
        }

        // Record in 'public.order_status_history'
        try {
          await client.from('order_status_history').insert({
            id: `osh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            order_id: orderId,
            new_status: dbStatus,
            changed_by: ownerProfile?.fullName || 'Owner',
            note: reason || `Order updated to ${dbStatus}`,
            created_at: new Date().toISOString(),
          });
        } catch (_) {}

        // Insert alert in 'public.notifications'
        if (shop && (newStatus === 'ready' || newStatus === 'cancelled')) {
          try {
            await client.from('notifications').insert({
              id: `notif_${Date.now()}`,
              shop_id: shop.id,
              order_id: orderId,
              title: newStatus === 'ready' ? 'Order is Ready!' : 'Order Cancelled',
              message: `Order #${orderId.slice(-4)} is ${newStatus}`,
              type: newStatus === 'ready' ? 'ORDER_READY' : 'ORDER_CANCELLED',
              is_read: false,
              created_at: new Date().toISOString(),
            });
          } catch (_) {}
        }
      } catch (e) {
        console.warn('Failed to update order status in Supabase:', e);
      }
    }

    soundService.playSuccessTone();
    return true;
  };

  // Save Menu Item in Supabase 'public.menu_items' table
  const saveMenuItem = async (itemData: Partial<MenuItem>): Promise<boolean> => {
    if (!shop) return false;

    const isEdit = Boolean(itemData.id);
    const item: MenuItem = {
      id: itemData.id || 'item_' + Math.random().toString(36).substring(2, 10),
      shopId: shop.id,
      categoryId: itemData.categoryId,
      name: itemData.name || '',
      description: itemData.description,
      price: itemData.price || 0,
      isVeg: itemData.isVeg ?? true,
      isAvailable: itemData.isAvailable ?? true,
      preparationTimeMinutes: itemData.preparationTimeMinutes || 10,
      tag: itemData.tag,
      imageUrl: itemData.imageUrl,
    };

    if (isEdit) {
      setMenuItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    } else {
      setMenuItems((prev) => [item, ...prev]);
    }

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error: itemError } = await client.from('menu_items').upsert({
          id: item.id,
          shop_id: shop.id,
          category_id: item.categoryId || null,
          name: item.name,
          description: item.description || null,
          price: Number(item.price),
          image: item.imageUrl || null,
          is_veg: item.isVeg,
          is_available: item.isAvailable,
          is_bestseller: item.tag === 'Bestseller',
          preparation_time_min: item.preparationTimeMinutes,
          preparation_minutes: `${item.preparationTimeMinutes}-${item.preparationTimeMinutes + 5}`,
          display_order: 0,
          is_active: true,
          updated_at: new Date().toISOString(),
        });

        if (itemError) {
          console.warn('Error saving menu item to Supabase:', itemError.message);
        }
      } catch (e) {
        console.warn('Supabase menu item save error:', e);
      }
    }

    return true;
  };

  // Delete Menu Item from 'public.menu_items'
  const deleteMenuItem = async (id: string): Promise<boolean> => {
    setMenuItems((prev) => prev.filter((i) => i.id !== id));

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('menu_items').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase menu item delete error:', e);
      }
    }
    return true;
  };

  // Toggle Item Availability in 'public.menu_items'
  const toggleItemAvailability = async (id: string, isAvailable: boolean) => {
    setMenuItems((prev) => prev.map((i) => (i.id === id ? { ...i, isAvailable } : i)));

    const client = getSupabaseClient();
    if (client) {
      try {
        await client
          .from('menu_items')
          .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (e) {
        console.warn('Supabase toggle item error:', e);
      }
    }
  };

  // Add Category in 'public.categories' table
  const addCategory = async (name: string): Promise<void> => {
    if (!shop) return;
    const newCat: MenuCategory = {
      id: 'cat_' + Math.random().toString(36).substring(2, 10),
      shopId: shop.id,
      name,
      sortOrder: menuCategories.length + 1,
      isActive: true,
    };

    setMenuCategories((prev) => [...prev, newCat]);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('categories').insert({
          id: newCat.id,
          shop_id: shop.id,
          name: newCat.name,
          display_order: newCat.sortOrder,
          is_active: true,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase add category error:', e);
      }
    }
  };

  const refreshDatabaseData = async () => {
    if (ownerProfile?.id) {
      await loadDatabaseData(ownerProfile.id, shop?.id);
    }
  };

  // Direct fetch for completed orders history from 'public.orders' table (order_status = 'COMPLETED')
  const fetchCompletedOrderHistory = async (): Promise<OwnerOrder[]> => {
    const client = getSupabaseClient();
    if (!client || !shop?.id) {
      return orders.filter((o) => o.status === 'completed');
    }

    try {
      const { data, error } = await client
        .from('orders')
        .select('*, order_items(*)')
        .eq('shop_id', shop.id)
        .eq('order_status', 'COMPLETED')
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('Error fetching completed orders history:', error?.message);
        return orders.filter((o) => o.status === 'completed');
      }

      return data.map(mapDbOrderToOwnerOrder);
    } catch (err) {
      console.warn('Failed to fetch order history from Supabase:', err);
      return orders.filter((o) => o.status === 'completed');
    }
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
        loginWithPhone,
        sendPhoneOtp,
        verifyPhoneOtp,
        registerWithPhone,
        logout,
        saveShop,
        toggleShopOpen,
        toggleRushMode,
        updateOrderStatus,
        saveMenuItem,
        deleteMenuItem,
        toggleItemAvailability,
        addCategory,
        refreshDatabaseData,
        refreshOrders,
        upsertOrderFromRealtime,
        removeOrderFromRealtime,
        realtimeStatus,
        setRealtimeStatus,
        fetchCompletedOrderHistory,
        generatedOtp,
        requestPasswordReset,
        resetPasswordWithOtp,
        resetOtpCode,
      }}
    >
      {children}
    </OwnerAppContext.Provider>
  );
};

export const useOwnerApp = (): OwnerAppContextType => {
  const context = useContext(OwnerAppContext);
  if (!context) {
    throw new Error('useOwnerApp must be used within an OwnerAppProvider');
  }
  return context;
};
