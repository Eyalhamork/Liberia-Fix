// app/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Force dynamic rendering (requires authentication check)
export const dynamic = "force-dynamic";

export default async function RootPage() {
  const supabase = await createClient();

  // Get current user session
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If no user or error, redirect to welcome (landing) page
  if (!user || error) {
    redirect("/welcome");
  }

  // Get user profile with user_type
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, onboarding_completed")
    .eq("id", user.id)
    .single();

  // If no profile exists, redirect to login to re-authenticate
  if (!profile) {
    redirect("/login");
  }

  // If onboarding not completed, redirect to onboarding
  if (!profile.onboarding_completed) {
    if (profile.user_type === "provider") {
      redirect("/provider/onboarding");
    } else if (profile.user_type === "customer") {
      redirect("/customer/onboarding");
    }
    // Fallback if user_type is not set properly
    redirect("/login");
  }

  // Role-based redirect for authenticated users with completed onboarding
  if (profile.user_type === "provider") {
    redirect("/provider/dashboard");
  } else if (profile.user_type === "admin") {
    redirect("/admin/dashboard");
  } else if (profile.user_type === "customer") {
    // Customers go to search page as their default home
    redirect("/search");
  } else {
    // Fallback for unknown user types
    redirect("/search");
  }
}
