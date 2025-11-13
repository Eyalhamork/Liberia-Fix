// app/api/payments/webhook/mtn/route.ts - UPDATED WITH WALLET SUPPORT
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createMTNMoMoService } from "@/lib/services/mtn-momo.service";
import { notificationService } from "@/lib/services/notification-service";
import { getCreditPackageById } from "@/lib/constants/wallet";

export async function POST(request: NextRequest) {
  try {
    // Use service role client for webhook processing (no user auth)
    const supabase = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get webhook payload
    const payload = await request.json();
    const signature = request.headers.get("x-mtn-signature");
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Log webhook received
    const { data: webhookLog } = await supabase
      .from("payment_webhooks")
      .insert({
        provider: "mtn_momo",
        event_type: "payment_notification",
        reference_id: payload.externalId,
        payload,
        headers: Object.fromEntries(request.headers.entries()),
        signature,
        ip_address: ipAddress,
      })
      .select()
      .single();

    // Verify webhook signature
    const mtnService = createMTNMoMoService();
    const webhookSecret = process.env.MTN_MOMO_WEBHOOK_SECRET || "";

    if (signature) {
      const isValid = mtnService.validateWebhookSignature(
        JSON.stringify(payload),
        signature,
        webhookSecret
      );

      await supabase
        .from("payment_webhooks")
        .update({ signature_verified: isValid })
        .eq("id", webhookLog?.id);

      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Process webhook
    const { data: transaction } = await supabase
      .from("transactions")
      .select("*")
      .eq("external_transaction_id", payload.externalId)
      .single();

    if (!transaction) {
      console.error("Transaction not found for webhook:", payload.externalId);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update transaction based on webhook status
    const newStatus = payload.status === "SUCCESSFUL" ? "completed" : "failed";

    const updateData: any = {
      status: newStatus,
      provider_response: payload,
      webhook_received_at: new Date().toISOString(),
    };

    if (newStatus === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    if (payload.reason) {
      updateData.error_message = payload.reason.message;
      updateData.error_code = payload.reason.code;
    }

    const { data: updatedTransaction } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transaction.id)
      .select()
      .single();

    // Mark webhook as processed
    await supabase
      .from("payment_webhooks")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        transaction_id: transaction.id,
      })
      .eq("id", webhookLog?.id);

    // ============================================
    // HANDLE WALLET TOP-UPS (NEW)
    // ============================================
    if (transaction.type === "wallet_topup") {
      const metadata = transaction.metadata || {};
      const packageId = metadata.package_id;
      const creditPackage = getCreditPackageById(packageId);

      if (!creditPackage) {
        console.error("Invalid credit package:", packageId);
        return NextResponse.json(
          { error: "Invalid credit package" },
          { status: 400 }
        );
      }

      if (newStatus === "completed") {
        // Calculate total credits (including bonus)
        const totalCredits = creditPackage.credits + creditPackage.bonus;

        // Add credits to wallet using database function
        const { data: walletTxId, error: walletError } = await supabase.rpc(
          "add_wallet_credits",
          {
            p_user_id: transaction.user_id,
            p_amount: creditPackage.amount,
            p_credits: totalCredits,
            p_type: "topup",
            p_description: `Wallet top-up: ${creditPackage.label}`,
            p_payment_transaction_id: transaction.id,
            p_metadata: {
              package_id: creditPackage.id,
              bonus_credits: creditPackage.bonus,
            },
          }
        );

        if (walletError) {
          console.error("Failed to add wallet credits:", walletError);
          // Don't return error - transaction succeeded but credit addition failed
          // This should be rare and needs manual intervention
        } else {
          console.log(
            `✅ Added ${totalCredits} credits to user ${transaction.user_id}`
          );

          // Send success notification
          try {
            await notificationService.createNotification({
              userId: transaction.user_id,
              type: "wallet_topup_success",
              data: {
                credits: totalCredits,
                bonus: creditPackage.bonus,
                amount: creditPackage.amount.toFixed(2),
              },
              actionUrl: "/customer/wallet",
              priority: "normal",
            });
          } catch (notifError) {
            console.error("Failed to send topup notification:", notifError);
          }
        }
      } else {
        // Payment failed - send notification
        try {
          await notificationService.createNotification({
            userId: transaction.user_id,
            type: "payment_failed",
            data: {
              amount: creditPackage.amount.toFixed(2),
              reason: payload.reason?.message || "Payment processing failed",
            },
            actionUrl: "/customer/wallet",
            priority: "high",
          });
        } catch (notifError) {
          console.error("Failed to send failure notification:", notifError);
        }
      }

      return NextResponse.json(
        { success: true, message: "Wallet topup webhook processed" },
        { status: 200 }
      );
    }

    // ============================================
    // HANDLE SUBSCRIPTION PAYMENTS
    // ============================================
    if (
      transaction.type === "provider_subscription" &&
      transaction.related_subscription_id
    ) {
      const { data: subscription } = await supabase
        .from("provider_subscriptions")
        .select("*, providers:provider_id (user_id)")
        .eq("id", transaction.related_subscription_id)
        .single();

      if (subscription) {
        if (newStatus === "completed") {
          // Update subscription to active
          await supabase
            .from("provider_subscriptions")
            .update({
              status: "active",
              payment_status: "completed",
              transaction_id: transaction.id,
            })
            .eq("id", subscription.id);

          // Upgrade provider tier
          await supabase
            .from("providers")
            .update({ subscription_tier: subscription.tier })
            .eq("id", subscription.provider_id);

          // Send payment received notification
          try {
            await notificationService.createNotification({
              userId: subscription.providers.user_id,
              type: "payment_received",
              data: {
                amount: subscription.amount.toFixed(2),
                tier: subscription.tier,
                next_billing_date: new Date(
                  subscription.expires_at
                ).toLocaleDateString(),
                subscription_id: subscription.id,
              },
              actionUrl: "/provider/subscription",
              relatedEntityType: "subscription",
              relatedEntityId: subscription.id,
              priority: "low",
            });
          } catch (error) {
            console.error(
              "Failed to send payment received notification:",
              error
            );
          }
        } else {
          // Payment failed
          await supabase
            .from("provider_subscriptions")
            .update({
              status: "failed",
              payment_status: "failed",
            })
            .eq("id", subscription.id);

          // Send failure notification
          try {
            await notificationService.createNotification({
              userId: subscription.providers.user_id,
              type: "subscription_failed",
              data: {
                amount: subscription.amount.toFixed(2),
                reason: payload.reason?.message || "Payment processing failed",
                tier: subscription.tier,
              },
              actionUrl: "/provider/subscription",
              relatedEntityType: "subscription",
              relatedEntityId: subscription.id,
              priority: "critical",
            });
          } catch (error) {
            console.error("Failed to send payment failed notification:", error);
          }
        }
      }
    }

    return NextResponse.json(
      { success: true, message: "Webhook processed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Log error but return 200 to prevent retries
    return NextResponse.json(
      { success: true, message: "Webhook received" },
      { status: 200 }
    );
  }
}
