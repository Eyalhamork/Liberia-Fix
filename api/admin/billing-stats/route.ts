// =====================================================
// MONITORING DASHBOARD API
// app/api/admin/billing-stats/route.ts
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";
import { createPaymentService } from "@/lib/services/payment.service";
import { SubscriptionService } from "@/lib/services/subscription.service";

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

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (profile?.user_type !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const mtnService = createMTNMoMoService();
    const paymentService = createPaymentService(supabase, mtnService);
    const subscriptionService = new SubscriptionService(
      supabase,
      paymentService
    );

    // Get comprehensive stats
    const [subscriptionStats, recentTransactions, failedPayments] =
      await Promise.all([
        subscriptionService.getSubscriptionStats(),
        supabase
          .from("payment_transactions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("payment_transactions")
          .select("*")
          .eq("status", "failed")
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          )
          .order("created_at", { ascending: false }),
      ]);

    return NextResponse.json(
      {
        subscriptionStats,
        recentTransactions: recentTransactions.data || [],
        failedPayments: failedPayments.data || [],
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get billing stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
