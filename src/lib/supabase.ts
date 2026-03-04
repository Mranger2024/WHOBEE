import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with your project URL and public anon key
// These values are safe to expose in the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to get the Supabase service role client (server-side only)
export const getServiceRoleClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('This function is only available server-side');
  }
  
  return createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

// Helper function to get the current user's session
export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data;
};

// Helper function to create or update a user profile
export const upsertUserProfile = async (userData: {
  id: string;
  email: string;
  username?: string;
  avatar_url?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        id: userData.id,
        email: userData.email,
        username: userData.username || userData.email.split('@')[0],
        avatar_url: userData.avatar_url,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )
    .select()
    .single();
    
  if (error) {
    console.error('Error upserting user profile:', error);
    throw error;
  }
  
  return data;
};

export default supabase;
