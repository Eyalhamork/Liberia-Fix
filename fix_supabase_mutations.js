const fs = require('fs');

const files = [
  'app/provider/messages/[userId]/page.tsx',
  'app/customer/bookings/[id]/payment/page.tsx',
  'app/customer/onboarding/page.tsx',
  'app/customer/review/[providerId]/page.tsx',
  'app/customer/service-requests/page.tsx',
  'app/provider/bids/page.tsx',
  'lib/helpers/onboarding.ts',
  'lib/hooks/use-promo-check.ts',
  'lib/hooks/use-tier-limits.ts',
  'lib/push-notifications.ts',
  'components/layout/header.tsx',
  'components/layout/mobile-nav.tsx',
  'components/notifications/notification-bell.tsx',
  'components/notifications/notification-list.tsx',
  'components/notifications/notification-permission-prompt.tsx',
  'components/providers/provider-list.tsx',
  'components/ui/mobile-toast.tsx',
  'components/admin/data-table.tsx'
];

// Fix each file individually with specific patterns
const specificFixes = [
  {
    file: 'app/provider/messages/[userId]/page.tsx',
    old: '            await supabase\n              .from("messages")\n              .update({ read: true } as any)\n              .in("id", unreadIds);',
    new: '            await (supabase\n              .from("messages")\n              .update({ read: true } as any)\n              .in("id", unreadIds)) as any;'
  },
  {
    file: 'app/customer/bookings/[id]/payment/page.tsx',
    search: /.setState\(/g,
    test: true
  },
  {
    file: 'app/customer/onboarding/page.tsx',
    search: /setFormData\(/g,
    test: true
  }
];

// For now, let's just check what's on these lines
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  
  // Look for common patterns that need 'any' casting
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern: .update(...) or .insert(...) as part of Supabase chain
    if ((line.includes('.update(') || line.includes('.insert(')) && !line.includes('as any')) {
      if (line.includes('(supabase') || lines[i-1]?.includes('supabase') || lines[i-2]?.includes('supabase')) {
        // This looks like a Supabase mutation that might need casting
        console.log(file + ':' + (i+1) + ': Found Supabase mutation');
      }
    }
  }
}
