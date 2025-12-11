const fs = require('fs');

// Helper function to fix update/insert calls with cast
function fixSupabaseMutation(filePath, lineNum) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  if (lineNum < 1 || lineNum > lines.length) return false;
  
  const idx = lineNum - 1;
  let startIdx = idx;
  
  // Find the start of the statement (usually from(...).select(...) or await)
  while (startIdx > 0 && !lines[startIdx].match(/^\s*(const|let|await|return|\.)/)) {
    startIdx--;
  }
  
  // Find statement end
  let endIdx = idx;
  while (endIdx < lines.length - 1 && !lines[endIdx].includes(';')) {
    endIdx++;
  }
  
  // Check if already has cast
  const statement = lines.slice(startIdx, endIdx + 1).join('\n');
  if (statement.includes('as any') || statement.includes('as {')) {
    return false;
  }
  
  // Add ) as any at the end
  lines[endIdx] = lines[endIdx].replace(/;$/, ' as any);');
  
  if (!statement.includes('(')) {
    // Needs to wrap the whole chain
    lines[startIdx] = lines[startIdx].replace(/^(\s*)/, '$1(');
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  return true;
}

const fixes = [
  { file: 'app/provider/messages/[userId]/page.tsx', line: 197 },
  { file: 'app/customer/bookings/[id]/payment/page.tsx', line: 125 },
  { file: 'app/customer/onboarding/page.tsx', line: 238 },
  { file: 'app/customer/review/[providerId]/page.tsx', line: 150 },
  { file: 'app/customer/service-requests/page.tsx', line: 262 },
  { file: 'app/provider/bids/page.tsx', line: 113 },
  { file: 'lib/helpers/onboarding.ts', line: 13 },
  { file: 'lib/hooks/use-promo-check.ts', line: 72 },
  { file: 'lib/hooks/use-tier-limits.ts', line: 76 },
  { file: 'lib/push-notifications.ts', line: 74 },
  { file: 'components/layout/header.tsx', line: 51 },
  { file: 'components/layout/mobile-nav.tsx', line: 50 },
  { file: 'components/notifications/notification-bell.tsx', line: 25 },
  { file: 'components/notifications/notification-list.tsx', line: 132 },
  { file: 'components/notifications/notification-permission-prompt.tsx', line: 119 },
  { file: 'components/providers/provider-list.tsx', line: 42 },
  { file: 'components/ui/mobile-toast.tsx', line: 57 },
  { file: 'components/admin/data-table.tsx', line: 132 }
];

for (const fix of fixes) {
  if (!fs.existsSync(fix.file)) {
    console.log('⚠ File not found: ' + fix.file);
    continue;
  }
  if (fixSupabaseMutation(fix.file, fix.line)) {
    console.log('✓ Fixed ' + fix.file);
  } else {
    console.log('⚠ Could not fix ' + fix.file);
  }
}
