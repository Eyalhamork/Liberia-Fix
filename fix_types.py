import re

with open("lib/services/subscription.service.ts", "r") as f:
    content = f.read()

# Fix 1: processSubscriptionBilling - add type cast for .single() call after initial select
pattern1 = r'(\.\eq\("id", request\.subscriptionId\))\n(\s+)\.single\(\);'
replacement1 = r'''\1
\2.single() as Promise<{
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
      }>;'''
content = re.sub(pattern1, replacement1, content)

# Fix 2: existingBilling select - add type cast for .single()
pattern2 = r'(\.eq\("status", "paid"\))\n(\s+)\.single\(\);'
replacement2 = r'''\1
\2.single() as Promise<{
        data: { id: string } | null;
        error: any;
      }>;'''
content = re.sub(pattern2, replacement2, content)

# Fix 3: billingHistory insert - add (as any) cast and type cast for .single()
pattern3 = r'(const \{ data: billingHistory, error: billingError \} = await this\.supabase)\n(\s+)(\.from\("subscription_billing_history"\))'
replacement3 = r'\1\n\2((this.supabase as any)\3'
content = re.sub(pattern3, replacement3, content)

# Fix insert .single() cast
pattern3b = r'(\.insert\(\{[\s\S]*?\}\))\n(\s+)(\.select\(\))\n(\s+)(\.single\(\);)'
replacement3b = r'''\1
\2\3
\4.single() as Promise<{
        data: { id: string; attempts: number } | null;
        error: any;
      }>);'''
# Only apply to the billingHistory context
content = re.sub(pattern3b, replacement3b, content, count=1)

# Fix 4: Update calls in subscription.service - cast as any
content = re.sub(
    r'(await this\.supabase)\n(\s+)(\.from\("subscription_billing_history"\))\n(\s+)(\.update\(\{)',
    r'\1\n\2((this.supabase as any)\3\n\4\5',
    content
)

# Fix 5: processAllDueSubscriptions select cast
pattern5 = r'(\.gte\("expires_at", new Date\(\)\.toISOString\(\)\);)'
replacement5 = r'''.gte("expires_at", new Date().toISOString()) as Promise<{
        data: {
          id: string;
          provider_id: string;
          amount: number;
          expires_at: string;
        }[] | null;
        error: any;
      }>;'''
# Find and fix this specific pattern
pattern5_search = r'(\.eq\("auto_renew", true\))\n(\s+)(\.lte\("expires_at", dueDate\.toISOString\(\)\))\n(\s+)(\.gte\("expires_at", new Date\(\)\.toISOString\(\)\);)'
replacement5 = r'''\1
\2\3
\4.gte("expires_at", new Date().toISOString()) as Promise<{
        data: {
          id: string;
          provider_id: string;
          amount: number;
          expires_at: string;
        }[] | null;
        error: any;
      }>;'''
content = re.sub(pattern5_search, replacement5, content)

with open("lib/services/subscription.service.ts", "w") as f:
    f.write(content)

print("Applied type casts")
