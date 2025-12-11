const fs = require('fs');

const filePath = './lib/services/subscription.service.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix all .update() calls to cast as any
// Pattern: this.supabase.from("table").update({...}).eq(...)
content = content.replace(
  /await this\.supabase\n\s+\.from\("subscription_billing_history"\)\n\s+\.update\(\{/g,
  `await ((this.supabase as any)
        .from("subscription_billing_history")
        .update({`
);

// Fix all .insert() calls for other tables
content = content.replace(
  /await this\.supabase\.from\("subscription_cancellations"\)\.insert\(/g,
  `await ((this.supabase as any).from("subscription_cancellations").insert(`
);

content = content.replace(
  /await this\.supabase\.from\("payment_retry_queue"\)\.insert\(/g,
  `await ((this.supabase as any).from("payment_retry_queue").insert(`
);

// Fix processAllDueSubscriptions select
let subscriptionsSelectPattern = /const \{ data: subscriptions, error \} = await this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*"\)\n\s+\.eq\("status", "active"\)\n\s+\.eq\("auto_renew", true\)\n\s+\.lte\("expires_at", dueDate\.toISOString\(\)\)\n\s+\.gte\("expires_at", new Date\(\)\.toISOString\(\)\);/;

let match = content.match(subscriptionsSelectPattern);
if (match) {
  let replacement = `const { data: subscriptions, error } = await (this.supabase
        .from("provider_subscriptions")
        .select("*")
        .eq("status", "active")
        .eq("auto_renew", true)
        .lte("expires_at", dueDate.toISOString())
        .gte("expires_at", new Date().toISOString()) as Promise<{
        data: {
          id: string;
          provider_id: string;
          amount: number;
          expires_at: string;
        }[] | null;
        error: any;
      }>);`;
  
  content = content.replace(subscriptionsSelectPattern, replacement);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed subscription.service.ts - Part 2');
