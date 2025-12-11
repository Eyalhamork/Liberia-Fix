// app/api/auth/callback/route.ts - FIXED VERSION
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  console.log("[OAuth Callback] Starting callback handler");

  if (error) {
    console.error("[OAuth Callback] OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${error}`, requestUrl.origin)
    );
  }

  if (!code) {
    console.error("[OAuth Callback] No code provided");
    return NextResponse.redirect(
      new URL("/login?error=no_code", requestUrl.origin)
    );
  }

  try {
    const supabase = await createClient();

    // Exchange code for session
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user) {
      console.error("[OAuth Callback] Exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL("/login?error=exchange_failed", requestUrl.origin)
      );
    }

    const user = data.user;
    console.log("[OAuth Callback] User authenticated:", user.id);

    // Get user type from URL, cookie, or metadata
    const urlUserType = requestUrl.searchParams.get("user_type");
    const cookieUserType = request.cookies.get("pending_user_type")?.value;
    const metadataUserType = user.user_metadata?.user_type;
    const desiredUserType =
      urlUserType || cookieUserType || metadataUserType || "customer";

    console.log("[OAuth Callback] User type resolution:", {
      urlUserType,
      cookieUserType,
      metadataUserType,
      desired: desiredUserType,
    });

    // USE SERVICE ROLE to bypass RLS completely
    const { createClient: createServiceClient } = await import(
      "@supabase/supabase-js"
    );
    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Check if profile exists using admin client
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("user_type, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    console.log(
      "[OAuth Callback] Profile check:",
      existingProfile ? "EXISTS" : "NEW USER"
    );

    // CREATE profile if doesn't exist
    if (!existingProfile) {
      const { error: insertError } = await adminClient.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0],
        avatar_url: user.user_metadata?.avatar_url || null,
        user_type: desiredUserType,
        onboarding_completed: false,
      });

      if (insertError && insertError.code !== "23505") {
        console.error("[OAuth Callback] Profile creation failed:", insertError);
        return NextResponse.redirect(
          new URL("/login?error=profile_creation_failed", requestUrl.origin)
        );
      }

      console.log(
        "[OAuth Callback] Profile created with type:",
        desiredUserType
      );

      const onboardingRoutes: Record<string, string> = {
        customer: "/customer/onboarding",
        provider: "/provider/onboarding",
        admin: "/admin/dashboard",
      };

      const response = NextResponse.redirect(
        new URL(
          onboardingRoutes[desiredUserType] || "/customer/onboarding",
          requestUrl.origin
        )
      );
      response.cookies.delete("pending_user_type");
      return response;
    }

    // EXISTING USER - check if we need to update user_type
    const onboardingCompleted = existingProfile.onboarding_completed ?? true;
    let currentUserType = existingProfile.user_type;

    // FIX: If new OAuth signup (not onboarded) and URL has different user_type, update it
    if (
      !onboardingCompleted &&
      urlUserType &&
      urlUserType !== currentUserType
    ) {
      console.log(
        `[OAuth Callback] Correcting user_type from '${currentUserType}' to '${urlUserType}'`
      );

      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ user_type: urlUserType })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "[OAuth Callback] Failed to update user_type:",
          updateError
        );
      } else {
        currentUserType = urlUserType; // Use corrected type for redirect
        console.log("[OAuth Callback] User type corrected successfully");
      }
    }

    // Determine redirect path based on onboarding status and user type
    let redirectPath: string;
    if (!onboardingCompleted && currentUserType !== "admin") {
      const onboardingRoutes: Record<string, string> = {
        customer: "/customer/onboarding",
        provider: "/provider/onboarding",
      };
      redirectPath =
        onboardingRoutes[currentUserType] || "/customer/onboarding";
    } else {
      const dashboardRoutes: Record<string, string> = {
        customer: "/customer/dashboard",
        provider: "/provider/dashboard",
        admin: "/admin/dashboard",
      };
      redirectPath = dashboardRoutes[currentUserType] || "/customer/dashboard";
    }

    console.log("[OAuth Callback] Redirecting to:", redirectPath);

    const response = NextResponse.redirect(
      new URL(redirectPath, requestUrl.origin)
    );
    response.cookies.delete("pending_user_type");
    return response;
  } catch (error) {
    console.error("[OAuth Callback] Unexpected error:", error);
    return NextResponse.redirect(
      new URL("/login?error=unexpected", requestUrl.origin)
    );
  }
}
