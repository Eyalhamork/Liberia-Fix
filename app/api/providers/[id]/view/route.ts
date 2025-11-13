// app/api/providers/[id]/view/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";

const MILESTONES = [10, 50, 100, 500, 1000];

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();

  const providerId = params.id;

  // Get provider details
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id, user_id, business_name, profile_views")
    .eq("id", providerId)
    .single();

  if (providerError || !provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  // Increment profile views
  const newViewCount = (provider.profile_views || 0) + 1;

  const { error: updateError } = await supabase
    .from("providers")
    .update({
      profile_views: newViewCount,
    })
    .eq("id", providerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 🔔 BATCH 4 TRIGGER 3: Profile Viewed Milestones
  // Check if new view count hits a milestone
  if (MILESTONES.includes(newViewCount)) {
    try {
      // Check if we already sent notification for this milestone
      const { data: existingNotif } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", provider.user_id)
        .eq("type", "profile_views_milestone")
        .eq("data->>view_count", newViewCount.toString())
        .single();

      if (!existingNotif) {
        // Determine next milestone
        const nextMilestone =
          MILESTONES.find((m) => m > newViewCount) || "next level";

        await notificationService.createNotification({
          userId: provider.user_id,
          type: "profile_views_milestone",
          data: {
            view_count: newViewCount.toString(),
            next_milestone: nextMilestone.toString(),
            business_name: provider.business_name,
          },
          actionUrl: `/provider/analytics`,
          relatedEntityType: "provider",
          relatedEntityId: provider.id,
          priority: "low",
        });
      }
    } catch (error) {
      console.error("Failed to send milestone notification:", error);
      // Don't block view tracking if notification fails
    }
  }

  return NextResponse.json({
    success: true,
    view_count: newViewCount,
    milestone_reached: MILESTONES.includes(newViewCount),
  });
}
