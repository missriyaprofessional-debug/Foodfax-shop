import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Pre-configured with the user's project publishable key
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_O-f6YGUbj6hqHYBlwEhE5g_QVrnke9m';

const getStoredUrl = () => {
  return import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('foodfax_supabase_url') || '';
};

const getStoredKey = () => {
  return (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('foodfax_supabase_anon_key') ||
    DEFAULT_SUPABASE_KEY
  );
};

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const url = getStoredUrl();
  const key = getStoredKey();

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
    const cleanUrl = url.trim().replace(/\/$/, '');
    const cleanKey = anonKey.trim();

    localStorage.setItem('foodfax_supabase_url', cleanUrl);
    localStorage.setItem('foodfax_supabase_anon_key', cleanKey);

    supabaseInstance = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return true;
  } catch (e) {
    console.error('Failed to configure Supabase:', e);
    return false;
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase project URL is not configured yet. Please enter your project URL.',
    };
  }

  try {
    // Ping supabase auth or table
    const { error } = await client.auth.getSession();
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to your Supabase project!' };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Could not connect to the specified Supabase URL.',
    };
  }
}

export function getSupabaseConfig() {
  return {
    url: getStoredUrl(),
    key: getStoredKey(),
    isConfigured: Boolean(getStoredUrl()),
  };
}
