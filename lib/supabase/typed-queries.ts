// lib/supabase/typed-queries.ts
// Helper utilities for strongly-typed Supabase queries
// These helpers work around the @supabase/ssr type inference issues

import type { Database } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// Type aliases for common table types
export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;

// Helper type to extract Row type from a table
export type TableRow<T extends TableName> = Tables[T]["Row"];
export type TableInsert<T extends TableName> = Tables[T]["Insert"];
export type TableUpdate<T extends TableName> = Tables[T]["Update"];

// Common query result types
export interface QueryResult<T> {
  data: T | null;
  error: any;
}

export interface QueryArrayResult<T> {
  data: T[] | null;
  error: any;
  count?: number | null;
}

// Type-safe select result wrapper
export function asQueryResult<T>(result: unknown): QueryResult<T> {
  return result as QueryResult<T>;
}

export function asArrayResult<T>(result: unknown): QueryArrayResult<T> {
  return result as QueryArrayResult<T>;
}

// Common partial types for queries that select specific columns
export interface ProfileBasic {
  id: string;
  user_type: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  wallet_balance: number | null;
}

export interface ProviderBasic {
  id: string;
  user_id: string | null;
  business_name: string | null;
  subscription_tier: string | null;
  verified: boolean | null;
}

export interface BookingBasic {
  id: string;
  customer_id: string | null;
  provider_id: string | null;
  booking_fee: number | null;
  payment_status: string | null;
  booking_status: string | null;
}

export interface ServiceRequestBasic {
  id: string;
  customer_id: string | null;
  title: string | null;
  status: string | null;
  expires_at: string | null;
}

export interface NotificationBasic {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean | null;
  created_at: string | null;
}

// Type-safe RPC result types
export interface RPCResult<T = unknown> {
  data: T;
  error: any;
}

// Helper function to cast Supabase client for direct usage
export function typedClient(client: unknown): SupabaseClient<Database> {
  return client as SupabaseClient<Database>;
}

// Example usage patterns:
//
// Instead of:
// const { data: profile } = await (supabase as any).from("profiles").select("user_type").eq("id", user.id).single();
// // Error: Property 'user_type' does not exist on type 'never'
//
// Use:
// const { data: profile } = await (supabase as any).from("profiles").select("user_type").eq("id", user.id).single() as QueryResult<{ user_type: string | null }>;
// // Works! TypeScript now knows the shape
//
// Or import the helper:
// const result = asQueryResult<{ user_type: string | null }>(await (supabase as any).from("profiles").select("user_type").eq("id", user.id).single());
