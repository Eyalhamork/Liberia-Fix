// lib/services/upgrade-prompt.service.ts

/**
 * BATCH 5: Messages & Communication
 *
 * Upgrade Prompt Service
 * Tracks free provider activity and sends upgrade prompts based on:
 * - Missed opportunities (locked custom requests)
 * - High activity (views, inquiries, but can't respond)
 */

import { createClient } from "@supabase/supabase-js";

interface ProviderActivity {
  provider_id: string;
  user_id: string;
  business_name: string;
  subscription_tier: string;
  missed_requests: number;
  profile_views_7d: number;
  messages_received_7d: number;
  last_upgrade_prompt?: string;
}

interface UpgradePromptResult {
  success: boolean;
  providersNotified: number;
  errors: string[];
}

export class UpgradePromptService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Calculate potential earnings based on missed opportunities
   */
  private calculatePotentialEarnings(missedRequests: number): number {
    // Conservative estimate: assume 20% conversion rate and $50 average job value
    const conversionRate = 0.2;
    const avgJobValue = 50;
    return Math.round(missedRequests * conversionRate * avgJobValue);
  }

  /**
   * Check if provider qualifies for upgrade prompt
   */
  private shouldSendUpgradePrompt(activity: ProviderActivity): boolean {
    // Don't send to pro providers
    if (activity.subscription_tier === "pro") {
      return false;
    }

    // Don't send if already sent in last 7 days
    if (activity.last_upgrade_prompt) {
      const lastPrompt = new Date(activity.last_upgrade_prompt);
      const daysSinceLastPrompt =
        (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < 7) {
        return false;
      }
    }

    // Trigger conditions (any one is enough):
    // 1. Missed 3+ custom requests in last 7 days
    if (activity.missed_requests >= 3) {
      return true;
    }

    // 2. High profile views (50+) but limited functionality
    if (activity.profile_views_7d >= 50) {
      return true;
    }

    // 3. Received 5+ messages but limited response capacity
    if (activity.messages_received_7d >= 5) {
      return true;
    }

    return false;
  }

  /**
   * Get provider activity for upgrade prompt analysis
   */
  async getProviderActivity(): Promise<ProviderActivity[]> {
    try {
      // Date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get all free providers with their recent activity
      const { data: providers, error } = await this.supabase
        .from("providers")
        .select(
          `
          id,
          user_id,
          business_name,
          subscription_tier,
          profile_views,
          last_upgrade_prompt,
          users!inner(id)
        `
        )
        .eq("subscription_tier", "free");

      if (error) {
        console.error("Error fetching providers:", error);
        return [];
      }

      // For each provider, get their activity
      const activities: ProviderActivity[] = [];

      for (const provider of providers || []) {
        // Count missed custom requests (requests they viewed but couldn't respond to)
        const { count: missedRequests } = await this.supabase
          .from("custom_request_views")
          .select("*", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("subscription_tier_at_view", "free")
          .gte("viewed_at", sevenDaysAgo.toISOString());

        // Get messages received in last 7 days
        const { count: messagesReceived } = await this.supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("receiver_id", provider.user_id)
          .gte("created_at", sevenDaysAgo.toISOString());

        activities.push({
          provider_id: provider.id,
          user_id: provider.user_id,
          business_name: provider.business_name,
          subscription_tier: provider.subscription_tier,
          missed_requests: missedRequests || 0,
          profile_views_7d: provider.profile_views || 0, // This should be calculated for last 7 days
          messages_received_7d: messagesReceived || 0,
          last_upgrade_prompt: provider.last_upgrade_prompt,
        });
      }

      return activities;
    } catch (error) {
      console.error("Error getting provider activity:", error);
      return [];
    }
  }

  /**
   * Send upgrade prompt notification to provider
   */
  async sendUpgradePrompt(activity: ProviderActivity): Promise<boolean> {
    try {
      const potentialEarnings = this.calculatePotentialEarnings(
        activity.missed_requests
      );

      // Create notification
      const { error: notificationError } = await this.supabase
        .from("notifications")
        .insert({
          user_id: activity.user_id,
          type: "upgrade_prompt",
          title: "Upgrade to Pro? 🚀",
          body: `You've missed ${activity.missed_requests} opportunities. Upgrade to unlock unlimited responses and earn up to $${potentialEarnings}!`,
          data: {
            missed_count: activity.missed_requests,
            potential_earnings: potentialEarnings,
            profile_views: activity.profile_views_7d,
            messages_received: activity.messages_received_7d,
          },
          action_url: "/provider/subscription/upgrade",
          related_entity_type: "subscription",
          priority: "medium",
        });

      if (notificationError) {
        console.error(
          "Error creating upgrade notification:",
          notificationError
        );
        return false;
      }

      // Update last_upgrade_prompt timestamp
      await this.supabase
        .from("providers")
        .update({ last_upgrade_prompt: new Date().toISOString() })
        .eq("id", activity.provider_id);

      console.log(
        `✅ Upgrade prompt sent to provider ${activity.business_name}`
      );
      return true;
    } catch (error) {
      console.error("Error sending upgrade prompt:", error);
      return false;
    }
  }

  /**
   * Main function to process upgrade prompts
   * Should be called by cron job daily or weekly
   */
  async processUpgradePrompts(): Promise<UpgradePromptResult> {
    console.log("🔄 Processing upgrade prompts...");

    const result: UpgradePromptResult = {
      success: true,
      providersNotified: 0,
      errors: [],
    };

    try {
      // Get provider activities
      const activities = await this.getProviderActivity();
      console.log(`Found ${activities.length} free providers to analyze`);

      // Process each provider
      for (const activity of activities) {
        try {
          // Check if should send prompt
          if (this.shouldSendUpgradePrompt(activity)) {
            console.log(
              `Sending upgrade prompt to ${activity.business_name}...`
            );

            const sent = await this.sendUpgradePrompt(activity);
            if (sent) {
              result.providersNotified++;
            } else {
              result.errors.push(
                `Failed to send prompt to ${activity.business_name}`
              );
            }
          }
        } catch (providerError) {
          console.error(
            `Error processing provider ${activity.business_name}:`,
            providerError
          );
          result.errors.push(
            `Error processing ${activity.business_name}: ${providerError}`
          );
        }
      }

      console.log(
        `✅ Upgrade prompt processing complete. ${result.providersNotified} providers notified.`
      );
    } catch (error) {
      console.error("Fatal error in upgrade prompt processing:", error);
      result.success = false;
      result.errors.push(`Fatal error: ${error}`);
    }

    return result;
  }
}

/**
 * Factory function
 */
export function createUpgradePromptService(): UpgradePromptService {
  return new UpgradePromptService();
}
