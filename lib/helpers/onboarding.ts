// lib/helpers/onboarding.ts
import { createClient } from "@/lib/supabase/client";

/**
 * Mark user's onboarding as completed
 * Call this at the end of your onboarding flow (last step)
 */
export async function completeOnboarding(userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      // @ts-ignore - onboarding_completed might not be in types yet
      onboarding_completed: true,
    })
    .eq("id", userId);

  if (error) {
    console.error("Error completing onboarding:", error);
    return { success: false, error };
  }

  return { success: true };
}

/**
 * Check if user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error checking onboarding status:", error);
    return true; // Default to true to avoid blocking users
  }

  return (data as any)?.onboarding_completed ?? true;
}

/**
 * Usage in your onboarding pages:
 *
 * // At the last step of onboarding (Step 7 in provider onboarding):
 * const handleComplete = async () => {
 *   const { success } = await completeOnboarding(user.id);
 *   if (success) {
 *     router.push('/provider/dashboard');
 *   }
 * };
 */
