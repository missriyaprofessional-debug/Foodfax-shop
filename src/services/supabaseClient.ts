import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('foodfax_supabase_url') || '';
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('foodfax_supabase_anon_key') || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('foodfax_supabase_url');
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('foodfax_supabase_anon_key');

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
    }
  }
  return null;
}

export function updateSupabaseConfig(url: string, anonKey: string): boolean {
  try {
    localStorage.setItem('foodfax_supabase_url', url.trim());
    localStorage.setItem('foodfax_supabase_anon_key', anonKey.trim());
    supabaseInstance = createClient(url.trim(), anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return true;
  } catch (e) {
    console.error('Failed to configure Supabase:', e);
    return false;
  }
}

export const initialSupabaseUrl = DEFAULT_URL;
export const initialSupabaseKey = DEFAULT_KEY;
