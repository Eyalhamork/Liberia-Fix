// app/api/notifications/unread-count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count, error } = await (supabase as any)
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      console.error("Error getting unread count:", error);
      return NextResponse.json(
        { error: "Failed to get unread count" },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error("Error in GET /api/notifications/unread-count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
