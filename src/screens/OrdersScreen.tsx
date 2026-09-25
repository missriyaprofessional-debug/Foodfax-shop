import React, { useState, useEffect, useCallback } from 'react';
import { useOwnerApp, mapDbOrderToOwnerOrder } from '../context/OwnerAppContext';
import { OrderStatus, OwnerOrder } from '../types';
import { getSupabaseClient } from '../lib/supabaseClient';
import { soundService } from '../services/soundService';
import { 
  Search, 
  CookingPot, 
  CheckCircle2, 
  Receipt, 
  X, 
  XCircle, 
  AlertCircle,
  Clock,
  Printer,
  History,
  Activity,
  Calendar,
  IndianRupee,
  RefreshCw,
  Loader2,
  Filter,
  Zap,
  BellRing,
  Sparkles
} from 'lucide-react';

export const OrdersScreen: React.FC = () => {
  const { 
    shop,
    orders, 
    updateOrderStatus, 
    setSelectedOrderId, 
    fetchCompletedOrderHistory, 
    refreshOrders,
    upsertOrderFromRealtime,
    removeOrderFromRealtime,
    realtimeStatus,
    setRealtimeStatus
  } = useOwnerApp();
  
  // Primary view toggle: 'active' vs 'history'
  const [viewMode, setViewMode] = useState<'active' | 'history'>('active');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Item out of stock');
  
  // Dedicated history state fetched from Supabase
  const [historyOrders, setHistoryOrders] = useState<OwnerOrder[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | 'week'>('all');

  // Real-time alert states
  const [newOrderAlert, setNewOrderAlert] = useState<OwnerOrder | null>(null);
  const [statusUpdateToast, setStatusUpdateToast] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingTestOrder, setIsCreatingTestOrder] = useState(false);

  // Load completed orders from Supabase when switching to history or on mount
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const completed = await fetchCompletedOrderHistory();
      setHistoryOrders(completed);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [fetchCompletedOrderHistory]);

  useEffect(() => {
    if (viewMode === 'history') {
      loadHistory();
    }
  }, [viewMode, loadHistory]);

  // SUPABASE REAL-TIME SUBSCRIPTION FOR ORDERS SCREEN
  // Automatically syncs incoming new orders and status changes to shared context & dashboard
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client || !shop?.id) return;

    setRealtimeStatus('connecting');

    const channelName = `orders_screen_realtime_${shop.id}`;
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `shop_id=eq.${shop.id}`,
        },
        async (payload: any) => {
          console.log('⚡ Supabase Realtime event in OrdersScreen:', payload.eventType, payload);

          if (payload.eventType === 'INSERT') {
            // New incoming order received!
            try {
              const { data: fullOrder } = await client
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .maybeSingle();

              const newOrder = fullOrder 
                ? mapDbOrderToOwnerOrder(fullOrder) 
                : mapDbOrderToOwnerOrder(payload.new);

              // Update context state (this immediately updates the DashboardScreen metrics!)
              upsertOrderFromRealtime(newOrder, true);
              setNewOrderAlert(newOrder);
              soundService.playNewOrderChime();
            } catch (err) {
              console.warn('Error fetching new order line items:', err);
              refreshOrders(shop.id);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Existing order status changed!
            try {
              const { data: updatedData } = await client
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', payload.new.id)
                .maybeSingle();

              const mapped = updatedData
                ? mapDbOrderToOwnerOrder(updatedData)
                : mapDbOrderToOwnerOrder(payload.new);

              // Update in-place in context state
              upsertOrderFromRealtime(mapped, false);

              // If order is completed and user is viewing history, refresh history list
              if (mapped.status === 'completed') {
                loadHistory();
              }

              setStatusUpdateToast(`Order ${mapped.orderNumber} status changed to ${mapped.status.toUpperCase()}`);
              setTimeout(() => setStatusUpdateToast(null), 4000);
            } catch (err) {
              console.warn('Error processing updated order:', err);
              refreshOrders(shop.id);
            }
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            removeOrderFromRealtime(payload.old.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        async () => {
          // If items change, refresh
          refreshOrders(shop.id);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('disconnected');
        }
      });

    return () => {
      channel.unsubscribe();
      client.removeChannel(channel);
    };
  }, [shop?.id, upsertOrderFromRealtime, removeOrderFromRealtime, refreshOrders, setRealtimeStatus, loadHistory]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (shop?.id) {
        await refreshOrders(shop.id);
      }
      if (viewMode === 'history') {
        await loadHistory();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to simulate a real-time order arriving in Supabase (convenient for instant verification)
  const handleSimulateRealtimeOrder = async () => {
    const client = getSupabaseClient();
    if (!client || !shop?.id) return;
    setIsCreatingTestOrder(true);

    try {
      const randomNum = Math.floor(100 + Math.random() * 900);
      const testId = `ord_${Date.now()}`;
      const sampleNames = ['Rohan Sharma', 'Priya Verma', 'Aarav Gupta', 'Neha Patel', 'Vikram Singh'];
      const sampleCustomer = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const isDineIn = Math.random() > 0.5;

      // Matches exact columns and CHECK constraints of public.orders
      const { error: orderError } = await client.from('orders').insert({
        id: testId,
        shop_id: shop.id,
        shop_name: shop.name || 'Food Stall',
        shop_image: shop.logoUrl || null,
        shop_location: shop.area || shop.address || 'Counter 1',
        customer_id: null,
        customer_name: sampleCustomer,
        customer_phone: '9876543210',
        token_number: `#FF-${randomNum}`,
        order_type: isDineIn ? 'DINE_IN' : 'TAKEAWAY',
        table_number: isDineIn ? `T-0${Math.floor(1 + Math.random() * 8)}` : null,
        payment_method: Math.random() > 0.5 ? 'PAY_ONLINE' : 'CASH_AT_COUNTER',
        payment_status: 'PAID',
        order_status: 'PENDING',
        subtotal: 240,
        total: 240,
        estimated_preparation_minutes: '5-10',
        is_demo: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (orderError) {
        console.error('Order simulation error:', orderError);
        throw orderError;
      }

      // Matches exact columns of public.order_items
      await client.from('order_items').insert({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        order_id: testId,
        name: 'Special Paneer Tikka Masala',
        price: 240,
        quantity: 1,
        is_veg: true,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Error simulating realtime order in Supabase:', err);
    } finally {
      setIsCreatingTestOrder(false);
    }
  };

  // Active status tabs
  const activeTabs = [
    { id: 'all', label: 'All Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'preparing', label: 'Cooking' },
    { id: 'ready', label: 'Ready' },
  ];

  // Active orders filter (non-completed, non-cancelled)
  const activeOrdersList = orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));

  // Filtered list based on view mode
  const displayedOrders = viewMode === 'active' 
    ? activeOrdersList.filter((order) => {
        if (activeTab !== 'all' && order.status !== activeTab) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerPhone.includes(q)
        );
      })
    : historyOrders.filter((order) => {
        // Date filter for history
        if (historyDateFilter === 'today') {
          const orderDate = new Date(order.createdAt).toDateString();
          const todayDate = new Date().toDateString();
          if (orderDate !== todayDate) return false;
        } else if (historyDateFilter === 'week') {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          if (new Date(order.createdAt).getTime() < sevenDaysAgo) return false;
        }

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.customerName.toLowerCase().includes(q) ||
          order.customerPhone.includes(q)
        );
      });

  const getActiveTabCount = (tabId: string) => {
    if (tabId === 'all') return activeOrdersList.length;
    return activeOrdersList.filter((o) => o.status === tabId).length;
  };

  const handleConfirmCancel = () => {
    if (cancelModalOrderId) {
      updateOrderStatus(cancelModalOrderId, 'cancelled', cancelReason);
      setCancelModalOrderId(null);
    }
  };

  // Completed history summary calculations
  const totalHistoryRevenue = historyOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  return (
    <div className="space-y-4 pb-20 p-4 max-w-4xl mx-auto">
      {/* Header with View Toggle and Real-Time Subscriptions Indicator */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-white tracking-tight">Order Management</h2>
            
            {/* Real-Time Subscription Connection Status Pill */}
            {realtimeStatus === 'connected' ? (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-bold text-emerald-400"
                title="Supabase Real-time Connected"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Live Supabase Real-time</span>
              </div>
            ) : realtimeStatus === 'connecting' ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Connecting Real-time...</span>
              </div>
            ) : (
              <button
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-full text-[11px] font-bold text-slate-300 transition cursor-pointer"
                title="Sync database orders"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync Real-time</span>
              </button>
            )}

            {/* Manual Sync / Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title="Force sync database orders"
              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'active' 
              ? 'Real-time kitchen display: incoming orders automatically appear and alert kitchen staff'
              : 'Browse past completed customer orders and fulfillment records'}
          </p>
        </div>

        {/* View Switcher: Active Orders vs Order History & Test Order Trigger */}
        <div className="flex items-center gap-2">
          {/* Quick Simulation Button for Demo / Testing */}
          <button
            onClick={handleSimulateRealtimeOrder}
            disabled={isCreatingTestOrder}
            title="Simulate incoming order to verify real-time dashboard sync"
            className="flex items-center gap-1 px-2.5 py-2 bg-orange-600/15 hover:bg-orange-600/25 border border-orange-500/30 text-orange-400 rounded-2xl text-xs font-bold transition"
          >
            {isCreatingTestOrder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-orange-400" />}
            <span className="hidden sm:inline">Simulate Order</span>
          </button>

          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl shrink-0">
            <button
              onClick={() => {
                setViewMode('active');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'active'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Active Orders</span>
              {activeOrdersList.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  viewMode === 'active' ? 'bg-white/20 text-white' : 'bg-orange-600 text-white'
                }`}>
                  {activeOrdersList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setViewMode('history');
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'history'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Order History</span>
              {historyOrders.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  viewMode === 'history' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {historyOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* NEW ORDER REAL-TIME ARRIVAL ALERT BANNER */}
      {newOrderAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white shadow-xl shadow-orange-950/40 border border-orange-400/40 animate-pulse-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shrink-0">
              <BellRing className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm tracking-wide">
                  NEW ORDER {newOrderAlert.orderNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/25 uppercase">
                  {newOrderAlert.orderType.replace('_', ' ')}
                </span>
                <span className="text-xs font-extrabold text-amber-100">
                  ₹{newOrderAlert.totalAmount}
                </span>
                {newOrderAlert.tableNumber && (
                  <span className="text-xs text-orange-200 font-bold">
                    Table {newOrderAlert.tableNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-orange-100/90 font-medium mt-0.5">
                Customer: {newOrderAlert.customerName} ({newOrderAlert.items.length} item{newOrderAlert.items.length > 1 ? 's' : ''})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                updateOrderStatus(newOrderAlert.id, 'accepted');
                setNewOrderAlert(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white text-orange-700 hover:bg-orange-50 font-black text-xs transition shadow-sm"
            >
              Accept Order
            </button>
            <button
              onClick={() => {
                setSelectedOrderId(newOrderAlert.id);
                setNewOrderAlert(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/40 text-white font-bold text-xs transition"
            >
              View Ticket
            </button>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="p-1.5 text-white/70 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search and Secondary Controls */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search #order, customer, phone number..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View-specific Filter Bars */}
        {viewMode === 'active' ? (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {activeTabs.map((tab) => {
              const count = getActiveTabCount(tab.id);
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-orange-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected
                          ? 'bg-orange-500 text-white font-bold'
                          : tab.id === 'pending'
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setHistoryDateFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  historyDateFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Past
              </button>
              <button
                onClick={() => setHistoryDateFilter('today')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  historyDateFilter === 'today' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setHistoryDateFilter('week')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  historyDateFilter === 'week' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Past 7 Days
              </button>
            </div>

            <button
              onClick={loadHistory}
              title="Refresh from Supabase"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* History Summary Banner */}
      {viewMode === 'history' && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Showing <strong className="text-white">{displayedOrders.length}</strong> completed order{displayedOrders.length !== 1 ? 's' : ''} from database
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Total Value:</span>
            <strong className="text-emerald-400 text-sm font-black">
              ₹{displayedOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString()}
            </strong>
          </div>
        </div>
      )}

      {/* Orders List Content */}
      {isLoadingHistory && viewMode === 'history' ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-medium">Fetching completed orders from Supabase...</p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
          <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-300">
            {viewMode === 'active' ? `No active ${activeTab} orders` : 'No completed order history found'}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'active'
              ? 'New orders from your customer menu will appear here live.'
              : 'Completed orders saved in your database will show here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((order) => {
            const statusBadgeMap: Record<OrderStatus, { bg: string; text: string }> = {
              pending: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-300' },
              accepted: { bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-300' },
              preparing: { bg: 'bg-orange-500/20 border-orange-500/40', text: 'text-orange-300' },
              ready: { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-300' },
              completed: { bg: 'bg-teal-500/20 border-teal-500/40', text: 'text-teal-300' },
              cancelled: { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400' },
            };

            const badge = statusBadgeMap[order.status] || { bg: 'bg-slate-800', text: 'text-slate-300' };

            // Format date for display
            const formattedDate = order.createdAt 
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-base">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {order.customerName} • {order.customerPhone || 'Counter customer'}
                      {formattedDate && <span className="text-slate-500 ml-2">({formattedDate})</span>}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-black text-white">₹{order.totalAmount}</p>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {order.orderType === 'dine_in' ? `Table ${order.tableNumber || '-'}` : 'Takeaway'} •{' '}
                      {order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-slate-950/70 rounded-xl p-3 text-xs space-y-1.5 border border-slate-850">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <span className={item.isVeg ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {item.isVeg ? '🟢 ' : '🔴 '}
                        </span>
                        <span className="font-semibold text-slate-200">
                          {item.quantity}x {item.name}
                        </span>
                        {item.notes && (
                          <p className="text-[11px] text-amber-400 italic pl-5">Note: &quot;{item.notes}&quot;</p>
                        )}
                      </div>
                      <span className="text-slate-400 font-medium">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {order.cancellationReason && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                    Cancelled: {order.cancellationReason}
                  </p>
                )}

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    >
                      View Ticket Details
                    </button>
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => setCancelModalOrderId(order.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition"
                      >
                        Reject
                      </button>
                    )}
                  </div>

                  {/* Active workflow action buttons */}
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'accepted')}
                        className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-950 transition"
                      >
                        Accept Order
                      </button>
                    )}
                    {order.status === 'accepted' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition"
                      >
                        <CookingPot className="w-3.5 h-3.5" />
                        <span>Send to Kitchen</span>
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready for Pickup</span>
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-950 transition"
                      >
                        Mark Handed Over
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <span className="text-xs font-semibold text-teal-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Delivered & Settled</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Order Dialog Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 font-extrabold text-base">
              <XCircle className="w-5 h-5" />
              <span>Reject / Cancel Order</span>
            </div>
            <p className="text-xs text-slate-300">
              Please specify the cancellation reason to notify the customer automatically:
            </p>

            <div className="space-y-2">
              {[
                'Item out of stock',
                'Kitchen overload / peak rush',
                'Store closing early',
                'Customer requested cancel',
                'Special instruction cannot be met',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-800 cursor-pointer text-xs text-slate-200"
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="accent-orange-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancelModalOrderId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Keep Order
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-md shadow-red-950"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Real-Time Order Status Change Floating Toast */}
      {statusUpdateToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
          <span>{statusUpdateToast}</span>
          <button
            onClick={() => setStatusUpdateToast(null)}
            className="ml-1 p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
