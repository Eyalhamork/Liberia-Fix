// lib/supabase/server.ts - FIXED VERSION
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

export type TypedSupabaseClient = SupabaseClient<Database>;

export async function createClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Handle the error in server components where cookies can't be set
          }
        },
      },
    }
  );
}

// Alias for backward compatibility
export const createServerSupabaseClient = createClient;
