// app/api/verification/stats/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();

  try {
    // Verify admin authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .single();

    if (!profile || profile.user_type !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Get verification statistics
    const { data: stats, error } = await supabase
      .from("verification_stats")
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching verification stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch verification statistics" },
      { status: 500 }
    );
  }
}
