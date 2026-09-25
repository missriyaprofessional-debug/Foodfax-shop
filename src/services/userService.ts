import { supabase } from '../lib/supabaseClient';

export interface DbUser {
  id: string;
  phone: string;
  email?: string | null;
  full_name?: string | null;
  photo_url?: string | null;
  role?: string;
  shop_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  area?: string | null;
  city?: string | null;
  profile_completed?: boolean;
  is_active?: boolean;
  is_demo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const userService = {
  /**
   * Fetch user by Supabase Auth UID or user ID
   */
  async getUserById(id: string): Promise<DbUser | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn('[userService.getUserById] Error:', error.message);
      return null;
    }
    return data as DbUser | null;
  },

  /**
   * Query user by phone number
   */
  async getUserByPhone(phone: string): Promise<DbUser | null> {
    const cleanDigits = phone.replace(/\D/g, '');
    const last10 = cleanDigits.slice(-10);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${cleanDigits},phone.ilike.%${last10}%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[userService.getUserByPhone] Error:', error.message);
      return null;
    }
    return data as DbUser | null;
  },

  /**
   * Upsert owner profile in public.users table
   */
  async upsertUser(user: Partial<DbUser> & { id: string; phone: string }): Promise<DbUser | null> {
    const payload = {
      id: user.id,
      phone: user.phone,
      email: user.email || null,
      full_name: user.full_name || 'Restaurant Owner',
      role: user.role || 'owner',
      shop_id: user.shop_id || null,
      profile_completed: user.profile_completed ?? true,
      is_active: user.is_active ?? true,
      is_demo: user.is_demo ?? false,
      updated_at: new Date().toISOString(),
      ...(user.area && { area: user.area }),
      ...(user.city && { city: user.city }),
      ...(user.latitude !== undefined && { latitude: user.latitude }),
      ...(user.longitude !== undefined && { longitude: user.longitude }),
    };

    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[userService.upsertUser] Error:', error.message);
      throw error;
    }
    return data as DbUser | null;
  },

  /**
   * Update specific user fields
   */
  async updateUser(id: string, updates: Partial<DbUser>): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[userService.updateUser] Error:', error.message);
      return false;
    }
    return true;
  },

  /**
   * Link user to a shop
   */
  async linkShop(userId: string, shopId: string): Promise<boolean> {
    return this.updateUser(userId, { shop_id: shopId });
  },
};
