import { supabase } from '../lib/supabaseClient';
import { OwnerOrder, OrderStatus } from '../types';

export interface DbOrder {
  id: string;
  shop_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  token_number?: string | null;
  order_number?: string | null;
  order_status: string; // 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  order_type: string; // 'TAKEAWAY' | 'DINE_IN'
  payment_status: string; // 'PENDING' | 'PAID' | 'COLLECT_ON_DELIVERY' | 'REFUNDED' | 'FAILED'
  payment_method: string; // 'CASH_AT_COUNTER' | 'PAY_ONLINE'
  table_number?: string | null;
  total: number;
  subtotal?: number;
  cancellation_reason?: string | null;
  estimated_preparation_minutes?: string | number | null;
  created_at?: string;
  updated_at?: string;
  order_items?: DbOrderItem[];
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string | null;
  name: string;
  price: number;
  quantity: number;
  is_veg?: boolean;
  notes?: string | null;
}

/**
 * Maps raw database record from Supabase 'public.orders' table to UI OwnerOrder format
 */
export function mapDbOrderToOwnerOrder(o: any): OwnerOrder {
  const rawStatus = (o.order_status || o.status || 'PENDING').toString().toLowerCase();
  const validStatuses: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'];
  const status: OrderStatus = validStatuses.includes(rawStatus as OrderStatus) ? (rawStatus as OrderStatus) : 'pending';

  const rawType = (o.order_type || 'TAKEAWAY').toString().toUpperCase();
  const orderType: 'dine_in' | 'takeaway' | 'delivery' = rawType === 'DINE_IN' ? 'dine_in' : 'takeaway';

  const rawPayment = (o.payment_status || 'PENDING').toString().toUpperCase();
  const paymentStatus: 'paid' | 'pending' | 'cod' = 
    rawPayment === 'PAID' ? 'paid' : rawPayment === 'COLLECT_ON_DELIVERY' ? 'cod' : 'pending';

  const rawMethod = (o.payment_method || 'CASH_AT_COUNTER').toString().toUpperCase();
  const paymentMethod: 'upi' | 'cash' | 'card' = rawMethod === 'PAY_ONLINE' ? 'upi' : 'cash';

  const subtotal = Number(o.subtotal ?? o.total ?? 0);
  const total = Number(o.total ?? o.subtotal ?? 0);

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

export const orderService = {
  /**
   * Fetch all orders for a shop with joined order_items
   */
  async getOrdersByShopId(shopId: string): Promise<OwnerOrder[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[orderService.getOrdersByShopId] Error:', error.message);
      return [];
    }
    return (data || []).map(mapDbOrderToOwnerOrder);
  },

  /**
   * Fetch single order by ID with items
   */
  async getOrderById(orderId: string): Promise<OwnerOrder | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return mapDbOrderToOwnerOrder(data);
  },

  /**
   * Fetch completed order history
   */
  async getCompletedOrdersHistory(shopId: string): Promise<OwnerOrder[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('shop_id', shopId)
      .eq('order_status', 'COMPLETED')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[orderService.getCompletedOrdersHistory] Error:', error.message);
      return [];
    }
    return (data || []).map(mapDbOrderToOwnerOrder);
  },

  /**
   * Update order status following uppercase check constraints
   */
  async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    cancellationReason?: string
  ): Promise<boolean> {
    const dbStatus = status.toUpperCase(); // 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'

    const updates: Record<string, any> = {
      order_status: dbStatus,
      updated_at: new Date().toISOString(),
    };

    if (dbStatus === 'COMPLETED') {
      updates.payment_status = 'PAID';
    }

    if (cancellationReason) {
      updates.cancellation_reason = cancellationReason;
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      console.error('[orderService.updateOrderStatus] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Create a new order with items adhering to database schema constraints
   */
  async createOrder(params: {
    shopId: string;
    customerName: string;
    customerPhone: string;
    orderType: 'TAKEAWAY' | 'DINE_IN';
    paymentMethod: 'CASH_AT_COUNTER' | 'PAY_ONLINE';
    total: number;
    subtotal: number;
    tableNumber?: string;
    estimatedPrepMinutes?: number;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      isVeg?: boolean;
      notes?: string;
      menuItemId?: string;
    }>;
  }): Promise<OwnerOrder | null> {
    const orderId = crypto.randomUUID();
    const tokenNumber = `#FF-${Math.floor(100 + Math.random() * 900)}`;

    // Insert order record
    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      shop_id: params.shopId,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      token_number: tokenNumber,
      order_number: tokenNumber,
      order_status: 'PENDING',
      order_type: params.orderType,
      payment_status: params.paymentMethod === 'PAY_ONLINE' ? 'PAID' : 'PENDING',
      payment_method: params.paymentMethod,
      table_number: params.tableNumber || null,
      total: params.total,
      subtotal: params.subtotal,
      estimated_preparation_minutes: `${params.estimatedPrepMinutes || 15}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (orderError) {
      console.error('[orderService.createOrder] Order Insert Error:', orderError.message);
      throw orderError;
    }

    // Insert order items
    if (params.items && params.items.length > 0) {
      const itemsPayload = params.items.map((item) => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        menu_item_id: item.menuItemId || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        is_veg: item.isVeg ?? true,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(itemsPayload);
      if (itemsError) {
        console.warn('[orderService.createOrder] Order Items Insert Error:', itemsError.message);
      }
    }

    // Return the newly created order
    return this.getOrderById(orderId);
  },
};
