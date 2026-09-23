import React from 'react';
import { useOwnerApp } from '../context/OwnerAppContext';
import { 
  IndianRupee, 
  Receipt, 
  CookingPot, 
  CheckCircle2, 
  Flame, 
  AlertTriangle, 
  ArrowRight, 
  UtensilsCrossed, 
  QrCode, 
  TrendingUp, 
  Clock,
  Sparkles,
  ShoppingBag,
  CalendarDays,
  Percent
} from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const { shop, orders, toggleRushMode, updateOrderStatus, setActiveScreen, setSelectedOrderId } = useOwnerApp();

  if (!shop) return null;

  // Real database date filtering for "Today"
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const itemDate = new Date(dateString).getTime();
    return itemDate >= todayStart;
  };

  // Orders placed today
  const todayOrders = orders.filter((o) => isToday(o.createdAt));
  // Today's completed orders for revenue
  const todayCompletedOrders = todayOrders.filter((o) => o.status === 'completed');
  // Today's total revenue (calculated from completed/settled orders of today, fallback to all today non-cancelled)
  const todayRevenue = todayCompletedOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  // Average Order Value (AOV) for today
  const todayAOV = todayCompletedOrders.length > 0 ? Math.round(todayRevenue / todayCompletedOrders.length) : 0;

  // Active status groups
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const activeOrders = orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));

  return (
    <div className="space-y-4 pb-20 p-4 max-w-4xl mx-auto">
      {/* Rush Mode Banner */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
          shop.isRushMode
            ? 'bg-red-500/15 border-red-500/40 text-red-100 shadow-lg shadow-red-950/20'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                shop.isRushMode ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm sm:text-base text-white">
                  Kitchen Rush Mode {shop.isRushMode ? 'IS ON' : 'Off'}
                </h4>
                {shop.isRushMode && (
                  <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded">
                    +{shop.rushExtraMinutes}m Buffer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {shop.isRushMode
                  ? `Customers see +${shop.rushExtraMinutes} mins extra prep time to protect kitchen quality.`
                  : 'Enable during peak dining hours to add automated prep delay buffers.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleRushMode(!shop.isRushMode, 15)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 ${
              shop.isRushMode
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {shop.isRushMode ? 'Turn Off Rush' : 'Activate Rush'}
          </button>
        </div>
      </div>

      {/* TODAY'S PERFORMANCE HIGHLIGHT HERO CARD */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-950/30 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-8 w-44 h-44 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-md">
                <CalendarDays className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-black tracking-wider uppercase text-orange-100">
                Today&apos;s Performance
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-bold text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span>Live Database Sync</span>
            </div>
          </div>

          {/* Primary stats row: Total Orders Today & Total Revenue Today */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-orange-100 text-xs mb-1 font-medium">
                <span>Total Orders Today</span>
                <ShoppingBag className="w-4 h-4 text-orange-200" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {todayOrders.length}
                </span>
                <span className="text-[11px] text-orange-200 font-semibold">
                  {todayCompletedOrders.length} delivered
                </span>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between text-orange-100 text-xs mb-1 font-medium">
                <span>Today&apos;s Revenue</span>
                <IndianRupee className="w-4 h-4 text-orange-200" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  ₹{todayRevenue.toLocaleString()}
                </span>
                <span className="text-[11px] text-orange-200 font-semibold">
                  settled
                </span>
              </div>
            </div>
          </div>

          {/* Sub-bar with extra today metrics */}
          <div className="flex items-center justify-between pt-1 border-t border-white/15 text-xs text-orange-100/90 font-medium">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-200" />
              <span>Avg Order Value (AOV): <strong className="text-white">₹{todayAOV}</strong></span>
            </div>
            <button
              onClick={() => setActiveScreen('orders')}
              className="text-white hover:text-orange-200 font-bold flex items-center gap-1 text-[11px] transition"
            >
              <span>View Today&apos;s Orders</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Pending Orders Alert Banner */}
      {pendingOrders.length > 0 && (
        <div
          onClick={() => setActiveScreen('orders')}
          className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-500/20 transition animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-sm text-amber-300">
                {pendingOrders.length} NEW ORDER{pendingOrders.length > 1 ? 'S' : ''} AWAITING ACCEPTANCE!
              </h5>
              <p className="text-xs text-amber-200/80">Tap here to review and accept incoming tickets</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400" />
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Sales All-Time */}
        <div 
          onClick={() => setActiveScreen('sales')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">All-Time Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">
            ₹{completedOrders.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
            {completedOrders.length} all-time orders
          </p>
        </div>

        {/* Active Orders */}
        <div 
          onClick={() => setActiveScreen('orders')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Active Kitchen</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{activeOrders.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {pendingOrders.length} pending acceptance
          </p>
        </div>

        {/* Preparing */}
        <div 
          onClick={() => setActiveScreen('orders')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">In Cooking</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <CookingPot className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{preparingOrders.length}</p>
          <p className="text-[11px] text-blue-400 mt-1">
            {readyOrders.length} ready for pickup
          </p>
        </div>

        {/* Completed */}
        <div 
          onClick={() => setActiveScreen('orders')}
          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white">{completedOrders.length}</p>
          <p className="text-[11px] text-teal-400 mt-1 font-semibold">100% fulfilled</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Owner Quick Actions
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveScreen('orders')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center text-center transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Live Orders</span>
          </button>

          <button
            onClick={() => setActiveScreen('menu')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center text-center transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Manage Menu</span>
          </button>

          <button
            onClick={() => setActiveScreen('shop_qr')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center text-center transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Counter QR</span>
          </button>

          <button
            onClick={() => setActiveScreen('sales')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex flex-col items-center justify-center text-center transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200">Sales Reports</span>
          </button>
        </div>
      </div>

      {/* Live Recent Orders List */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Live Incoming Orders ({orders.length})
          </h3>
          <button
            onClick={() => setActiveScreen('orders')}
            className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No incoming orders yet</p>
            <p className="text-xs text-slate-500 mt-1">Live customer orders from your Supabase database will appear here in real time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => {
              const statusColors: Record<string, string> = {
                pending: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                accepted: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                preparing: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                ready: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                completed: 'bg-slate-700/50 text-slate-400 border-slate-700',
                cancelled: 'bg-red-500/20 text-red-400 border-red-500/40',
              };

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-750 transition shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-base">{order.orderNumber}</span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            statusColors[order.status] || 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{order.customerName}</span>
                        <span>•</span>
                        <span className="uppercase text-[11px] font-semibold text-slate-300">
                          {order.orderType === 'dine_in' ? `Dine-In (Table ${order.tableNumber || '-'})` : 'Takeaway'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-base font-extrabold text-white">₹{order.totalAmount}</p>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {order.paymentMethod} {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-slate-950/60 rounded-xl p-2.5 text-xs text-slate-300 space-y-1">
                    {order.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="truncate">
                          <span className={i.isVeg ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            {i.isVeg ? '🟢 ' : '🔴 '}
                          </span>
                          {i.quantity}x {i.name}
                        </span>
                        <span className="text-slate-400 shrink-0">₹{i.price * i.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      onClick={() => setSelectedOrderId(order.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4"
                    >
                      Full Ticket & Notes
                    </button>

                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelled', 'Kitchen busy')}
                            className="px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'accepted')}
                            className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-950"
                          >
                            Accept Order
                          </button>
                        </>
                      )}

                      {order.status === 'accepted' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950"
                        >
                          <CookingPot className="w-3.5 h-3.5" />
                          <span>Start Cooking</span>
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Food Ready</span>
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-950"
                        >
                          Handover & Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
