namespace NodeJS {
  export interface ProcessEnv {
    // Public environment variables (exposed to the browser)
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    
    // Server-side only environment variables
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
  }
}
