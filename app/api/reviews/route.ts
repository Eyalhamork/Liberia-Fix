// app/api/reviews/route.ts
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { notificationService } from "@/lib/services/notification-service";

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("provider_id");
  const customerId = searchParams.get("customer_id");

  let query = (supabase as any).from("reviews").select(
    `
      *,
      customer:profiles!reviews_customer_id_fkey (full_name, avatar_url),
      provider:providers!reviews_provider_id_fkey (business_name)
    `
  );

  if (providerId) {
    query = query.eq("provider_id", providerId);
  }

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reviews: data || [] });
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
  const {
    provider_id,
    booking_id,
    rating,
    comment,
    punctuality_rating,
    quality_rating,
    professionalism_rating,
    value_rating,
  } = body;

  // Validation
  if (!provider_id || !rating) {
    return NextResponse.json(
      { error: "Provider ID and rating are required" },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  // Check if user already reviewed this provider
  const { data: existingReview } = await (supabase as any)
      .from("reviews")
    .select("id")
    .eq("customer_id", user.id)
    .eq("provider_id", provider_id)
    .single();

  if (existingReview) {
    return NextResponse.json(
      { error: "You have already reviewed this provider" },
      { status: 400 }
    );
  }

  // Get customer details for notification
  const { data: customer } = await (supabase as any)
      .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Get provider details
  const { data: provider } = await (supabase as any)
      .from("providers")
    .select("user_id, business_name, total_rating, review_count")
    .eq("id", provider_id)
    .single();

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  // Create review
  const { data: review, error: reviewError } = await (supabase as any)
      .from("reviews")
    .insert({
      customer_id: user.id,
      provider_id,
      booking_id: booking_id || null,
      rating,
      comment: comment || null,
      punctuality_rating: punctuality_rating || null,
      quality_rating: quality_rating || null,
      professionalism_rating: professionalism_rating || null,
      value_rating: value_rating || null,
    })
    .select()
    .single();

  if (reviewError) {
    return NextResponse.json({ error: reviewError.message }, { status: 500 });
  }

  // Update provider's rating stats
  const newReviewCount = provider.review_count + 1;
  const newTotalRating = provider.total_rating + rating;

  await (supabase as any)
      .from("providers")
    .update({
      review_count: newReviewCount,
      total_rating: newTotalRating,
    })
    .eq("id", provider_id);

  // 🔔 BATCH 4 TRIGGER 1: New Review (notify provider)
  try {
    // Create comment preview (first 100 chars)
    const commentPreview = comment
      ? comment.length > 100
        ? comment.substring(0, 100) + "..."
        : comment
      : "No comment provided";

    await notificationService.createNotification({
      userId: provider.user_id,
      type: "new_review",
      data: {
        reviewer_name: customer?.full_name || "A customer",
        rating: rating.toString(),
        comment_preview: commentPreview,
        review_id: review.id,
      },
      actionUrl: `/provider/reviews`,
      relatedEntityType: "review",
      relatedEntityId: review.id,
    });
  } catch (error) {
    console.error("Failed to send new review notification:", error);
    // Don't block review creation if notification fails
  }

  return NextResponse.json({
    success: true,
    review,
    message: "Review submitted successfully!",
    newAverageRating: (newTotalRating / newReviewCount).toFixed(1),
  });
}
