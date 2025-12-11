const fs = require('fs');

const filePath = './lib/services/subscription.service.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix 1: First .single() call in processSubscriptionBilling
content = content.replace(
  /\.eq\("id", request\.subscriptionId\)\n\s+\.single\(\);/,
  `.eq("id", request.subscriptionId)
        .single() as Promise<{
        data: {
          id: string;
          status: string;
          auto_renew: boolean;
          provider_id: string;
          expires_at: string;
          amount: number;
          attempts: number;
          providers: {
            id: string;
            user_id: string;
            profiles: {
              phone: string;
              email: string;
              full_name: string;
            };
          };
        } | null;
        error: any;
      }>;`
);

// Fix 2: existingBilling .single() call
content = content.replace(
  /\.eq\("status", "paid"\)\n\s+\.single\(\);/,
  `.eq("status", "paid")
        .single() as Promise<{
        data: { id: string } | null;
        error: any;
      }>;`
);

// Fix 3: billingHistory insert - first occurrence
// Find the billingHistory block and add casts
let billingHistoryInsertPattern = /const \{ data: billingHistory, error: billingError \} = await this\.supabase\n\s+\.from\("subscription_billing_history"\)\n\s+\.insert\(\{[^}]+\}\)\n\s+\.select\(\)\n\s+\.single\(\);/;

let match = content.match(billingHistoryInsertPattern);
if (match) {
  let replacement = `const { data: billingHistory, error: billingError } = await ((this.supabase as any)
        .from("subscription_billing_history")
        .insert({
          subscription_id: request.subscriptionId,
          billing_cycle_start: request.billingCycleStart,
          billing_cycle_end: request.billingCycleEnd,
          amount: request.amount,
          status: "scheduled",
          billed_at: new Date().toISOString(),
        })
        .select()
        .single() as Promise<{
        data: { id: string; attempts: number } | null;
        error: any;
      }>);`;
  
  content = content.replace(billingHistoryInsertPattern, replacement);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed subscription.service.ts - Part 1');
