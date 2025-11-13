// app/api/wallet/balance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user with timeout
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Auth timeout")), 5000)
    );

    const {
      data: { user },
    } = (await Promise.race([userPromise, timeoutPromise])) as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // OPTIMIZED: Only fetch wallet_balance field - no joins, no extra data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Return ONLY the balance for the badge - no transactions needed
    const response = NextResponse.json({
      success: true,
      balance: profile.wallet_balance || 0,
    });

    // Add cache headers: cache for 30 seconds
    response.headers.set(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=60"
    );

    return response;
  } catch (error: any) {
    console.error("Get wallet balance error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
