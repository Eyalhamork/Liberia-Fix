const fs = require('fs');

const filePath = './lib/services/subscription.service.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix the payment_retry_queue select in processPaymentRetries
let paymentRetrySelectPattern = /const \{ data: retries, error \} = await this\.supabase\n\s+\.from\("payment_retry_queue"\)\n\s+\.select\([^)]+\)\n\s+\.eq\("status", "queued"\)\n\s+\.lte\("next_retry_at", now\.toISOString\(\)\)\n\s+\.lt\("retry_attempt", "max_retries"\);/;

let match = content.match(paymentRetrySelectPattern);
if (match) {
  let replacement = `const { data: retries, error } = await (this.supabase
        .from("payment_retry_queue")
        .select(\`
          *,
          payment_transactions!inner (*)
        \`)
        .eq("status", "queued")
        .lte("next_retry_at", now.toISOString())
        .lt("retry_attempt", "max_retries") as Promise<{
        data: {
          id: string;
          retry_attempt: number;
          max_retries: number;
          last_attempt_at?: string;
          payment_transactions: {
            user_id: string;
            amount: number;
            currency: string;
            transaction_type: string;
            payer_phone: string;
            payer_name: string;
            related_booking_id?: string;
            related_subscription_id?: string;
          };
        }[] | null;
        error: any;
      }>);`;
  
  content = content.replace(paymentRetrySelectPattern, replacement);
}

// Fix remaining .from("providers") updates - add as any
content = content.replace(
  /await this\.supabase\n\s+\.from\("providers"\)\n\s+\.update\(/g,
  `await ((this.supabase as any)
        .from("providers")
        .update(`
);

// Fix remaining .from("provider_subscriptions") updates - add as any
content = content.replace(
  /await this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.update\(/g,
  `await ((this.supabase as any)
        .from("provider_subscriptions")
        .update(`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed subscription.service.ts - Part 4');
