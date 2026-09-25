import { supabase } from '../lib/supabaseClient';
import { Shop } from '../types';

export interface DbShop {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  contact_phone?: string | null;
  address?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_time?: string | null;
  closing_time?: string | null;
  upi_id?: string | null;
  image?: string | null;
  banner_image?: string | null;
  stall_type?: string | null;
  is_open?: boolean;
  is_rush_hour?: boolean;
  table_service_available?: boolean;
  preparation_time_minutes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function mapDbShopToAppShop(s: DbShop): Shop {
  return {
    id: s.id,
    ownerId: s.owner_id,
    name: s.name,
    shopType: s.stall_type || 'Restaurant',
    description: s.description || undefined,
    phone: s.phone || s.contact_phone || undefined,
    address: s.address || undefined,
    area: s.area || undefined,
    city: s.city || undefined,
    state: s.state || undefined,
    pincode: s.pincode || undefined,
    latitude: s.latitude ?? undefined,
    longitude: s.longitude ?? undefined,
    openingTime: s.opening_time || '10:00 AM',
    closingTime: s.closing_time || '10:00 PM',
    upiId: s.upi_id || undefined,
    logoUrl: s.image || undefined,
    bannerUrl: s.banner_image || undefined,
    isOpen: s.is_open ?? true,
    isRushMode: s.is_rush_hour ?? false,
    rushExtraMinutes: 15,
    minimumOrder: 0,
    acceptsTakeaway: true,
    acceptsDineIn: s.table_service_available ?? true,
    acceptsDelivery: false,
    createdAt: s.created_at || new Date().toISOString(),
  };
}

export const shopService = {
  /**
   * Fetch shop associated with owner user ID
   */
  async getShopByOwnerId(ownerId: string): Promise<Shop | null> {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      console.warn('[shopService.getShopByOwnerId] Error:', error.message);
      return null;
    }
    return data ? mapDbShopToAppShop(data as DbShop) : null;
  },

  /**
   * Fetch shop by primary key ID
   */
  async getShopById(shopId: string): Promise<Shop | null> {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .maybeSingle();

    if (error) {
      console.warn('[shopService.getShopById] Error:', error.message);
      return null;
    }
    return data ? mapDbShopToAppShop(data as DbShop) : null;
  },

  /**
   * Upsert shop details matching database column types
   */
  async upsertShop(shop: Partial<Shop> & { id: string; ownerId: string; name: string }): Promise<Shop | null> {
    const payload: Partial<DbShop> = {
      id: shop.id,
      owner_id: shop.ownerId,
      name: shop.name.trim(),
      stall_type: shop.shopType || 'Restaurant',
      description: shop.description || null,
      phone: shop.phone || null,
      contact_phone: shop.phone || null,
      address: shop.address || null,
      area: shop.area || null,
      city: shop.city || null,
      state: shop.state || null,
      pincode: shop.pincode || null,
      latitude: shop.latitude ?? null,
      longitude: shop.longitude ?? null,
      opening_time: shop.openingTime || '10:00 AM',
      closing_time: shop.closingTime || '10:00 PM',
      upi_id: shop.upiId || null,
      image: shop.logoUrl || null,
      banner_image: shop.bannerUrl || null,
      is_open: shop.isOpen ?? true,
      is_rush_hour: shop.isRushMode ?? false,
      table_service_available: shop.acceptsDineIn ?? true,
      preparation_time_minutes: '10-15',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('shops')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[shopService.upsertShop] Error:', error.message);
      throw error;
    }
    return data ? mapDbShopToAppShop(data as DbShop) : null;
  },

  /**
   * Update shop open/closed status
   */
  async updateShopStatus(shopId: string, isOpen: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('shops')
      .update({
        is_open: isOpen,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) {
      console.error('[shopService.updateShopStatus] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Update rush hour mode
   */
  async updateRushMode(shopId: string, isRushHour: boolean, extraMinutes?: number): Promise<boolean> {
    const { error } = await supabase
      .from('shops')
      .update({
        is_rush_hour: isRushHour,
        preparation_time_minutes: isRushHour ? `${(extraMinutes || 15) + 10} min` : '10-15 min',
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId);

    if (error) {
      console.error('[shopService.updateRushMode] Error:', error.message);
      return false;
    }
    return true;
  },
};
