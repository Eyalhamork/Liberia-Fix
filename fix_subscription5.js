const fs = require('fs');

const filePath = './lib/services/subscription.service.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix the stat counts - cast each query as Promise<{ count: number | null }>
content = content.replace(
  /this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*", \{ count: "exact", head: true \}\)\n\s+\.eq\("status", "active"\)/g,
  `(this.supabase
          .from("provider_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active") as Promise<{ count: number | null }>)`
);

content = content.replace(
  /this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*", \{ count: "exact", head: true \}\)\n\s+\.eq\("status", "cancelled"\)/g,
  `(this.supabase
          .from("provider_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "cancelled") as Promise<{ count: number | null }>)`
);

content = content.replace(
  /this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*", \{ count: "exact", head: true \}\)\n\s+\.eq\("status", "expired"\)/g,
  `(this.supabase
          .from("provider_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "expired") as Promise<{ count: number | null }>)`
);

// For the one with multiple eq and lte
content = content.replace(
  /this\.supabase\n\s+\.from\("provider_subscriptions"\)\n\s+\.select\("\*", \{ count: "exact", head: true \}\)\n\s+\.eq\("status", "active"\)\n\s+\.eq\("auto_renew", true\)\n\s+\.lte\(\n\s+"expires_at",\n\s+new Date\(Date\.now\(\) \+ 3 \* 24 \* 60 \* 60 \* 1000\)\.toISOString\(\)\n\s+\)/g,
  `(this.supabase
          .from("provider_subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active")
          .eq("auto_renew", true)
          .lte(
            "expires_at",
            new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          ) as Promise<{ count: number | null }>)`
);

// For billing history failure count
content = content.replace(
  /this\.supabase\n\s+\.from\("subscription_billing_history"\)\n\s+\.select\("\*", \{ count: "exact", head: true \}\)\n\s+\.eq\("status", "failed"\)/g,
  `(this.supabase
          .from("subscription_billing_history")
          .select("*", { count: "exact", head: true })
          .eq("status", "failed") as Promise<{ count: number | null }>)`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Fixed subscription.service.ts - Part 5 (stats)');
