// lib/services/report-generation.service.ts

/**
 * BATCH 7: Reports & Summaries
 *
 * Report Generation Service
 * Generates and sends scheduled reports to users and admins
 */

import { createClient } from "@supabase/supabase-js";

interface ReportResult {
  success: boolean;
  reportsGenerated: number;
  errors: string[];
}

export class ReportGenerationService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  /**
   * Get date range for weekly reports
   */
  private getWeekDateRange(): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    return { startDate, endDate };
  }

  /**
   * Get date range for monthly reports
   */
  private getMonthDateRange(): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  }

  /**
   * Generate Weekly Summary for Free Providers
   */
  async generateWeeklySummaryFree(): Promise<ReportResult> {
    const result: ReportResult = {
      success: true,
      reportsGenerated: 0,
      errors: [],
    };

    try {
      const { startDate, endDate } = this.getWeekDateRange();

      // Get all free providers
      const { data: providers, error: providersError } = await this.supabase
        .from("providers")
        .select("id, user_id, business_name")
        .eq("subscription_tier", "free")
        .eq("active", true);

      if (providersError) {
        result.errors.push(
          `Failed to fetch providers: ${providersError.message}`
        );
        result.success = false;
        return result;
      }

      // Generate report for each free provider
      for (const provider of providers || []) {
        try {
          // Get profile views
          const profileViews = provider.profile_views || 0;

          // Get bookings received
          const { count: bookingsCount } = await this.supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("provider_id", provider.id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

          // Get missed opportunities (custom requests they couldn't respond to)
          const { count: missedCount } = await this.supabase
            .from("custom_request_views")
            .select("*", { count: "exact", head: true })
            .eq("provider_id", provider.id)
            .eq("subscription_tier_at_view", "free")
            .gte("viewed_at", startDate.toISOString())
            .lte("viewed_at", endDate.toISOString());

          // Create notification
          await this.supabase.from("notifications").insert({
            user_id: provider.user_id,
            type: "weekly_summary_free",
            title: "Weekly Summary 📊",
            body: `This week: ${profileViews} views, ${
              bookingsCount || 0
            } bookings, ${missedCount || 0} missed opportunities`,
            data: {
              views: profileViews,
              bookings: bookingsCount || 0,
              missed: missedCount || 0,
              period: "weekly",
            },
            action_url: "/provider/dashboard",
            priority: "low",
          });

          result.reportsGenerated++;
        } catch (providerError) {
          result.errors.push(
            `Error generating report for provider ${provider.business_name}: ${providerError}`
          );
        }
      }

      console.log(
        `✅ Generated ${result.reportsGenerated} weekly summaries for free providers`
      );
    } catch (error) {
      console.error("Error in generateWeeklySummaryFree:", error);
      result.success = false;
      result.errors.push(`Fatal error: ${error}`);
    }

    return result;
  }

  /**
   * Generate Weekly/Monthly Performance for Pro Providers
   */
  async generatePerformanceReportPro(
    period: "weekly" | "monthly"
  ): Promise<ReportResult> {
    const result: ReportResult = {
      success: true,
      reportsGenerated: 0,
      errors: [],
    };

    try {
      const { startDate, endDate } =
        period === "weekly"
          ? this.getWeekDateRange()
          : this.getMonthDateRange();

      // Get all pro providers
      const { data: providers, error: providersError } = await this.supabase
        .from("providers")
        .select("id, user_id, business_name")
        .eq("subscription_tier", "pro")
        .eq("active", true);

      if (providersError) {
        result.errors.push(
          `Failed to fetch providers: ${providersError.message}`
        );
        result.success = false;
        return result;
      }

      // Generate report for each pro provider
      for (const provider of providers || []) {
        try {
          // Get profile views
          const profileViews = provider.profile_views || 0;

          // Get bookings received
          const { count: bookingsCount } = await this.supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("provider_id", provider.id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

          // Get custom request responses
          const { count: responsesCount } = await this.supabase
            .from("service_request_responses")
            .select("*", { count: "exact", head: true })
            .eq("provider_id", provider.id)
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

          // Calculate earnings (completed bookings)
          const { data: completedBookings } = await this.supabase
            .from("bookings")
            .select("booking_fee")
            .eq("provider_id", provider.id)
            .eq("booking_status", "completed")
            .gte("created_at", startDate.toISOString())
            .lte("created_at", endDate.toISOString());

          const earnings = (completedBookings || []).reduce(
            (sum, booking) => sum + (booking.booking_fee || 0),
            0
          );

          // Create notification
          await this.supabase.from("notifications").insert({
            user_id: provider.user_id,
            type: "performance_report_pro",
            title: `${
              period === "weekly" ? "Weekly" : "Monthly"
            } Performance 📊`,
            body: `${profileViews} views, ${bookingsCount || 0} bookings, ${
              responsesCount || 0
            } responses, ${this.formatCurrency(earnings)} earned`,
            data: {
              views: profileViews,
              bookings: bookingsCount || 0,
              responses: responsesCount || 0,
              earnings: earnings,
              period,
            },
            action_url: "/provider/dashboard/analytics",
            priority: "low",
          });

          result.reportsGenerated++;
        } catch (providerError) {
          result.errors.push(
            `Error generating report for provider ${provider.business_name}: ${providerError}`
          );
        }
      }

      console.log(
        `✅ Generated ${result.reportsGenerated} ${period} performance reports for pro providers`
      );
    } catch (error) {
      console.error("Error in generatePerformanceReportPro:", error);
      result.success = false;
      result.errors.push(`Fatal error: ${error}`);
    }

    return result;
  }

  /**
   * Generate Daily Revenue Report for Admins
   */
  async generateDailyRevenueReport(): Promise<ReportResult> {
    const result: ReportResult = {
      success: true,
      reportsGenerated: 0,
      errors: [],
    };

    try {
      // Get yesterday's date range
      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 1);

      // Get all admins
      const { data: admins, error: adminsError } = await this.supabase
        .from("users")
        .select("id")
        .eq("user_type", "admin")
        .eq("active", true);

      if (adminsError) {
        result.errors.push(`Failed to fetch admins: ${adminsError.message}`);
        result.success = false;
        return result;
      }

      // Calculate booking fees
      const { data: bookingRevenue } = await this.supabase
        .from("bookings")
        .select("booking_fee")
        .eq("payment_status", "completed")
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString());

      const bookingTotal = (bookingRevenue || []).reduce(
        (sum, booking) => sum + (booking.booking_fee || 0),
        0
      );

      // Calculate subscription revenue
      const { data: subscriptionRevenue } = await this.supabase
        .from("payment_transactions")
        .select("amount")
        .eq("type", "subscription")
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString());

      const subscriptionTotal = (subscriptionRevenue || []).reduce(
        (sum, transaction) => sum + (transaction.amount || 0),
        0
      );

      const totalRevenue = bookingTotal + subscriptionTotal;

      // Get transaction count
      const { count: transactionCount } = await this.supabase
        .from("payment_transactions")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString());

      // Send notification to each admin
      for (const admin of admins || []) {
        try {
          await this.supabase.from("notifications").insert({
            user_id: admin.id,
            type: "daily_revenue_report",
            title: "Daily Revenue Report 💰",
            body: `Yesterday: ${this.formatCurrency(
              totalRevenue
            )} total revenue (${transactionCount} transactions)`,
            data: {
              total_revenue: totalRevenue,
              booking_revenue: bookingTotal,
              subscription_revenue: subscriptionTotal,
              transaction_count: transactionCount || 0,
              date: startDate.toISOString().split("T")[0],
            },
            action_url: "/admin/reports/revenue",
            priority: "low",
          });

          result.reportsGenerated++;
        } catch (adminError) {
          result.errors.push(`Error sending to admin: ${adminError}`);
        }
      }

      console.log(
        `✅ Generated ${result.reportsGenerated} daily revenue reports for admins`
      );
    } catch (error) {
      console.error("Error in generateDailyRevenueReport:", error);
      result.success = false;
      result.errors.push(`Fatal error: ${error}`);
    }

    return result;
  }

  /**
   * Generate Weekly User Growth Report for Admins
   */
  async generateWeeklyUserGrowthReport(): Promise<ReportResult> {
    const result: ReportResult = {
      success: true,
      reportsGenerated: 0,
      errors: [],
    };

    try {
      const { startDate, endDate } = this.getWeekDateRange();

      // Get all admins
      const { data: admins, error: adminsError } = await this.supabase
        .from("users")
        .select("id")
        .eq("user_type", "admin")
        .eq("active", true);

      if (adminsError) {
        result.errors.push(`Failed to fetch admins: ${adminsError.message}`);
        result.success = false;
        return result;
      }

      // Count new users
      const { count: newUsers } = await this.supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Count new providers
      const { count: newProviders } = await this.supabase
        .from("providers")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Count new bookings
      const { count: newBookings } = await this.supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Get total active users
      const { count: totalUsers } = await this.supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      // Send notification to each admin
      for (const admin of admins || []) {
        try {
          await this.supabase.from("notifications").insert({
            user_id: admin.id,
            type: "weekly_user_growth",
            title: "Weekly User Growth 📈",
            body: `This week: +${newUsers || 0} users, +${
              newProviders || 0
            } providers, ${newBookings || 0} bookings`,
            data: {
              new_users: newUsers || 0,
              new_providers: newProviders || 0,
              new_bookings: newBookings || 0,
              total_users: totalUsers || 0,
              period: "weekly",
            },
            action_url: "/admin/reports/growth",
            priority: "low",
          });

          result.reportsGenerated++;
        } catch (adminError) {
          result.errors.push(`Error sending to admin: ${adminError}`);
        }
      }

      console.log(
        `✅ Generated ${result.reportsGenerated} weekly user growth reports for admins`
      );
    } catch (error) {
      console.error("Error in generateWeeklyUserGrowthReport:", error);
      result.success = false;
      result.errors.push(`Fatal error: ${error}`);
    }

    return result;
  }

  /**
   * Generate Monthly Performance Report for Admins
   */
  async generateMonthlyPerformanceReport(): Promise<ReportResult> {
    const result: ReportResult = {
      success: true,
      reportsGenerated: 0,
      errors: [],
    };

    try {
      const { startDate, endDate } = this.getMonthDateRange();

      // Get all admins
      const { data: admins, error: adminsError } = await this.supabase
        .from("users")
        .select("id")
        .eq("user_type", "admin")
        .eq("active", true);

      if (adminsError) {
        result.errors.push(`Failed to fetch admins: ${adminsError.message}`);
        result.success = false;
        return result;
      }

      // Calculate total revenue
      const { data: transactions } = await this.supabase
        .from("payment_transactions")
        .select("amount")
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const totalRevenue = (transactions || []).reduce(
        (sum, t) => sum + (t.amount || 0),
        0
      );

      // Count metrics
      const { count: newUsers } = await this.supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const { count: newProviders } = await this.supabase
        .from("providers")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const { count: totalBookings } = await this.supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      const { count: activeProviders } = await this.supabase
        .from("providers")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      // Send notification to each admin
      for (const admin of admins || []) {
        try {
          await this.supabase.from("notifications").insert({
            user_id: admin.id,
            type: "monthly_performance_report",
            title: "Monthly Performance Report 📊",
            body: `${this.formatCurrency(totalRevenue)} revenue, +${
              newUsers || 0
            } users, ${totalBookings || 0} bookings`,
            data: {
              total_revenue: totalRevenue,
              new_users: newUsers || 0,
              new_providers: newProviders || 0,
              total_bookings: totalBookings || 0,
              active_providers: activeProviders || 0,
              period: "monthly",
            },
            action_url: "/admin/reports/performance",
            priority: "low",
          });

          result.reportsGenerated++;
        } catch (adminError) {
          result.errors.push(`Error sending to admin: ${adminError}`);
        }
      }

      console.log(
        `✅ Generated ${result.reportsGenerated} monthly performance reports for admins`
      );
    } catch (error) {
      console.error("Error in generateMonthlyPerformanceReport:", error);
      result.success = false;
      result.errors.push(`Fatal error: ${error}`);
    }

    return result;
  }
}

/**
 * Factory function
 */
export function createReportGenerationService(): ReportGenerationService {
  return new ReportGenerationService();
}
