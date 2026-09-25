// Re-export from canonical client location: src/lib/supabaseClient.ts
export {
  supabase,
  supabaseClient,
  getSupabaseClient,
  testSupabaseConnection,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_URL as DEFAULT_SUPABASE_URL,
  SUPABASE_ANON_KEY as DEFAULT_SUPABASE_KEY,
} from '../lib/supabaseClient';

export { supabase as default } from '../lib/supabaseClient';
