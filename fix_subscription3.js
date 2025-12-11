const fs = require('fs');

const filePath = './lib/services/subscription.service.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix cancelSubscription select
let cancelSubPattern = /const \{ data: subscription, error: subError \} = await this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*, providers!inner\(id\)"\)\n\s+\.eq\("id", subscriptionId\)\n\s+\.single\(\);/;

match = content.match(cancelSubPattern);
if (match) {
  let replacement = `const { data: subscription, error: subError } = await (this.supabase
        .from("provider_subscriptions")
        .select("*, providers!inner(id)")
        .eq("id", subscriptionId)
        .single() as Promise<{
        data: {
          id: string;
          expires_at: string;
          provider_id: string;
          providers: { id: string };
        } | null;
        error: any;
      }>);`;
  
  content = content.replace(cancelSubPattern, replacement);
}

// Fix expiredSubscriptions select
let expiredPattern = /const \{ data: expiredSubscriptions, error \} = await this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*"\)\n\s+\.eq\("status", "active"\)\n\s+\.lt\("expires_at", gracePeriodEnd\.toISOString\(\)\);/;

match = content.match(expiredPattern);
if (match) {
  let replacement = `const { data: expiredSubscriptions, error } = await (this.supabase
        .from("provider_subscriptions")
        .select("*")
        .eq("status", "active")
        .lt("expires_at", gracePeriodEnd.toISOString()) as Promise<{
        data: { id: string; provider_id: string }[] | null;
        error: any;
      }>);`;
  
  content = content.replace(expiredPattern, replacement);
}

// Fix reactivateSubscription select
let reactivatePattern = /const \{ data: subscription, error: subError \} = await this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*"\)\n\s+\.eq\("id", subscriptionId\)\n\s+\.single\(\);/;

// This pattern appears multiple times, need to be careful - only fix the one in reactivateSubscription
// For now, use a more specific context
let reactivateContextPattern = /async reactivateSubscription[\s\S]*?const \{ data: subscription, error: subError \} = await this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*"\)\n\s+\.eq\("id", subscriptionId\)\n\s+\.single\(\);/;

match = content.match(reactivateContextPattern);
if (match) {
  let section = match[0];
  let replacement = section.replace(
    /const \{ data: subscription, error: subError \} = await this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*"\)\n\s+\.eq\("id", subscriptionId\)\n\s+\.single\(\);/,
    `const { data: subscription, error: subError } = await (this.supabase
        .from("provider_subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single() as Promise<{
        data: {
          id: string;
          status: string;
          expires_at: string;
        } | null;
        error: any;
      }>);`
  );
  
  content = content.replace(reactivateContextPattern, replacement);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed subscription.service.ts - Part 3');
