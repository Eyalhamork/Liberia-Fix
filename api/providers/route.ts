// app/api/providers/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const location = searchParams.get("location");
  const tier = searchParams.get("tier");

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("providers")
    .select(
      `
      *,
      profiles (full_name, phone, location, avatar_url),
      provider_services (
        service_categories (name, icon)
      ),
      reviews (rating, comment)
    `
    )
    .eq("active", true);

  if (tier) {
    query = query.eq("subscription_tier", tier);
  }

  if (location) {
    query = query.eq("profiles.location", location);
  }

  // Sort by tier and rating
  query = query
    .order("subscription_tier", { ascending: false })
    .order("total_rating", { ascending: false });

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ providers: data });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("providers")
    .insert({
      user_id: user.id,
      ...body,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}
