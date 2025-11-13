// =====================================================
// 4. GET USER TRANSACTIONS
// app/api/payments/transactions/route.ts
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Build query
    let query = supabase
      .from("payment_transactions")
      .select(
        `
        *,
        payment_methods:payment_method_id (
          display_name,
          provider_name
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("transaction_type", type);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        transactions,
        total: count,
        limit,
        offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
